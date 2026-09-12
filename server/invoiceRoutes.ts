import { Router, Request, Response } from 'express';
import { getFirestore, getAdminAuth } from './firebaseAdmin';
import { FieldValue } from 'firebase-admin/firestore';

interface InvoiceDeps {
  checkRateLimit: (key: string, limitMs?: number) => boolean;
  logSecurityEvent: (eventType: string, details: Record<string, any>) => void;
}

/**
 * Server-side invoice number provider.
 *
 * The counter lives in the `counters` collection (e.g. counters/invoices_2026).
 * Clients are NEVER allowed to touch it directly (Firestore rules gate it to
 * admin/superadmin only). Numeric allocation happens here, in a server-side
 * transaction, so invoice numbers stay strictly sequential and unique even
 * under concurrent teacher/admin writes.
 */
export function createInvoiceRouter(deps: InvoiceDeps): Router {
  const router = Router();

  router.post('/invoices/number', async (req: Request, res: Response) => {
    try {
      if (!deps.checkRateLimit(`invoice_number_${req.ip}`, 1200)) {
        return res.status(429).json({ error: 'Juda ko\'p so\'rov. Bir oz kuting.' });
      }

      const authHeader = req.headers.authorization || '';
      const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : '';
      if (!token) {
        return res.status(401).json({ error: 'Iltimos, tizimga kiring.' });
      }

      const auth = getAdminAuth();
      if (!auth) {
        return res.status(503).json({ error: 'Autentifikatsiya xizmati mavjud emas.' });
      }

      let decoded: { uid: string };
      try {
        decoded = await auth.verifyIdToken(token);
      } catch {
        return res.status(401).json({ error: 'Token amal qilmadi. Qaytadan kiring.' });
      }

      const db = getFirestore();
      if (!db) {
        return res.status(501).json({ error: 'Server Firestore\'ga ulanmagan.' });
      }

      // Admin, superadmin and teacher are the only roles allowed to allocate
      // invoice numbers. The counter document itself stays unreachable for them
      // directly; only this trusted route may advance it.
      const userSnap = await db.doc(`users/${decoded.uid}`).get();
      const role: string = userSnap.exists ? (userSnap.data()?.role || 'guest') : 'guest';
      if (role !== 'admin' && role !== 'superadmin' && role !== 'teacher') {
        deps.logSecurityEvent('INVOICE_NUMBER_FORBIDDEN', { userUid: decoded.uid, role, ip: req.ip });
        return res.status(403).json({ error: 'Ruxsat etilmagan.' });
      }

      const year = new Date().getFullYear();
      const counterRef = db.doc(`counters/invoices_${year}`);

      const invoiceNumber = await db.runTransaction(async (txn) => {
        const counterDoc = await txn.get(counterRef);
        const current = counterDoc.exists ? Number(counterDoc.data()?.count || 0) : 0;
        const next = Number.isFinite(current) ? current + 1 : 1;
        txn.set(
          counterRef,
          { count: next, year, updatedAt: FieldValue.serverTimestamp() },
          { merge: true }
        );
        return `INV-${year}-${String(next).padStart(4, '0')}`;
      });

      deps.logSecurityEvent('INVOICE_NUMBER_GENERATED', {
        userUid: decoded.uid,
        role,
        invoiceNumber,
        ip: req.ip,
      });

      return res.json({ ok: true, invoiceNumber });
    } catch (err: any) {
      console.error('[INVOICE] /api/invoices/number error:', err?.message || String(err));
      return res.status(500).json({ error: 'Raqam olishda xatolik yuz berdi. Keyinroq urinib ko\'ring.' });
    }
  });

  return router;
}