import { Router, Request, Response } from 'express';
import { getFirestore, getAdminAuth } from './firebaseAdmin';
import { createSupportRequest } from './telegramService';

interface SupportDeps {
  checkRateLimit: (key: string, limitMs?: number) => boolean;
  logSecurityEvent: (eventType: string, details: Record<string, any>) => void;
}

async function resolveUserFromToken(req: Request): Promise<{ uid: string; email?: string; name?: string } | null> {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : '';
  if (!token) return null;
  const auth = getAdminAuth();
  if (!auth) return null;
  try {
    const decoded = await auth.verifyIdToken(token);
    const uid = typeof decoded.uid === 'string' && decoded.uid ? decoded.uid : null;
    if (!uid) return null;
    const db = getFirestore();
    if (!db) return { uid, email: decoded.email };
    const userSnap = await db.doc(`users/${uid}`).get();
    const data = userSnap.data() || {};
    return {
      uid,
      email: decoded.email || data.email,
      name: data.fullName || data.displayName || data.name || decoded.email,
    };
  } catch {
    return null;
  }
}

const VALID_PRIORITIES = ['oddiy', 'muhim', 'shoshilinch'] as const;

function normalizePriority(raw: unknown): 'oddiy' | 'muhim' | 'shoshilinch' {
  if (typeof raw !== 'string') return 'oddiy';
  const lower = raw.toLowerCase().trim();
  if ((VALID_PRIORITIES as readonly string[]).includes(lower)) return lower as 'oddiy' | 'muhim' | 'shoshilinch';
  if (lower === 'muhim') return 'muhim';
  if (lower === 'shoshilinch') return 'shoshilinch';
  return 'oddiy';
}

export function createSupportRouter(deps: SupportDeps): Router {
  const router = Router();

  // POST /api/support — submit a support request (authenticated)
  router.post('/support', async (req: Request, res: Response) => {
    try {
      if (!deps.checkRateLimit(`support_${req.ip}`, 3000)) {
        return res.status(429).json({ error: 'Juda ko\'p so\'rov. Iltimos, biroz kutib turing.' });
      }

      const user = await resolveUserFromToken(req);
      if (!user) {
        return res.status(401).json({ error: 'Iltimos, tizimga kiring.' });
      }

      const { subject, message, priority: rawPriority } = req.body || {};
      if (!subject || typeof subject !== 'string' || subject.trim().length < 3) {
        return res.status(400).json({ error: 'Mavzuni kiriting (kamida 3 ta belgi).' });
      }
      if (!message || typeof message !== 'string' || message.trim().length < 10) {
        return res.status(400).json({ error: 'Xabarni kiriting (kamida 10 ta belgi).' });
      }

const priority = normalizePriority(rawPriority);
      const docRefId = await createSupportRequest({
        subject: subject.trim().slice(0, 200),
        message: message.trim().slice(0, 2000),
        priority,
        userUid: user.uid,
        userName: user.name || '',
        userEmail: user.email || '',
        source: 'in_app',
      });

      if (!docRefId) {
        return res.status(500).json({ error: 'Xizmat vaqtincha mavjud emas. Keyinroq urinib ko\'ring.' });
      }

      deps.logSecurityEvent('SUPPORT_REQUEST_SUBMITTED', {
        id: docRefId,
        userUid: user.uid,
        priority,
        ip: req.ip,
      });

      return res.json({ ok: true, id: docRefId });
    } catch (err: any) {
      console.error('[SUPPORT] /api/support error:', err?.message || String(err));
      return res.status(500).json({ error: 'So\'rovni yuborishda xatolik yuz berdi. Keyinroq urinib ko\'ring.' });
    }
  });

  // POST /api/support/assistant — provision the dedicated technical/support
  // account (role 'support'). Clients cannot create users whose role is
  // anything but 'guest' (users create rule), so this goes through the trusted
  // Admin SDK, gated to center admins/superadmins.
  router.post('/support/assistant', async (req: Request, res: Response) => {
    try {
      if (!deps.checkRateLimit(`support_assistant_${req.ip}`, 5000)) {
        return res.status(429).json({ error: 'Juda ko\'p so\'rov. Iltimos, biroz kutib turing.' });
      }

      const db = getFirestore();
      const auth = getAdminAuth();
      if (!db || !auth) {
        return res.status(503).json({ error: 'Privileged xizmat mavjud emas.' });
      }

      const caller = await resolveUserFromToken(req);
      if (!caller) {
        return res.status(401).json({ error: 'Iltimos, tizimga kiring.' });
      }
      const callerSnap = await db.doc(`users/${caller.uid}`).get();
      const callerRole = callerSnap.data()?.role;
      if (callerRole !== 'admin' && callerRole !== 'superadmin') {
        deps.logSecurityEvent('SUPPORT_ASSISTANT_FORBIDDEN', { userUid: caller.uid, ip: req.ip });
        return res.status(403).json({ error: 'Ruxsat etilmagan.' });
      }

      const { name, email: rawEmail, password } = req.body || {};
      const email = typeof rawEmail === 'string' ? rawEmail.trim().toLowerCase() : '';
      const displayName = typeof name === 'string' ? name.trim() : '';
      if (!displayName || displayName.length < 2) {
        return res.status(400).json({ error: 'Xodim ismini kiriting.' });
      }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return res.status(400).json({ error: 'Haqiqiy email kiriting.' });
      }
      if (typeof password !== 'string' || password.length < 8) {
        return res.status(400).json({ error: 'Vaqtinchalik parol kamida 8 ta belgi bo\'lishi kerak.' });
      }

      const created = await auth.createUser({ email, password, displayName });
      const now = new Date().toISOString();
      await db.doc(`users/${created.uid}`).set(
        {
          uid: created.uid,
          email,
          fullName: displayName,
          displayName,
          role: 'support',
          createdAt: now,
        },
        { merge: true }
      );

      deps.logSecurityEvent('SUPPORT_ASSISTANT_CREATED', {
        uid: created.uid,
        email,
        createdBy: caller.uid,
        ip: req.ip,
      });

      return res.status(201).json({ ok: true, uid: created.uid, email });
    } catch (err: any) {
      console.error('[SUPPORT] POST /api/support/assistant error:', err?.message || String(err));
      if (err?.code === 'auth/email-already-exists') {
        return res.status(409).json({ error: 'Bu email tizimda allaqachon mavjud.' });
      }
      return res.status(500).json({ error: 'Akkaunt yaratishda xatolik yuz berdi. Keyinroq urinib ko\'ring.' });
    }
  });

  // GET /api/support — admin list of support requests (paginated, latest first)
  router.get('/support', async (req: Request, res: Response) => {
    try {
      if (!deps.checkRateLimit(`support_list_${req.ip}`, 2000)) {
        return res.status(429).json({ error: 'Juda ko\'p so\'rov.' });
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

      const decoded = await auth.verifyIdToken(token);
      const db = getFirestore();
      if (!db) {
        return res.status(500).json({ error: 'Ma\'lumotlar bazasi mavjud emas.' });
      }

      // Only admin/superadmin may list support requests
      const userSnap = await db.doc(`users/${decoded.uid}`).get();
      const role = userSnap.data()?.role || decoded.role;
      if (role !== 'admin' && role !== 'superadmin') {
        deps.logSecurityEvent('SUPPORT_LIST_FORBIDDEN', { userUid: decoded.uid, ip: req.ip });
        return res.status(403).json({ error: 'Ruxsat etilmagan.' });
      }

      const limit = Math.min(Math.max(parseInt(String(req.query.limit) || '50', 10) || 50, 1), 100);
      const snap = await db.collection('support_requests').orderBy('createdAt', 'desc').limit(limit).get();
      const items = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      return res.json({ items });
    } catch (err: any) {
      console.error('[SUPPORT] GET /api/support error:', err?.message || String(err));
      return res.status(500).json({ error: 'So\'rovlarni olishda xatolik yuz berdi.' });
    }
  });

  return router;
}
