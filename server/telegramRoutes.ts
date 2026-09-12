import { Router, Request, Response } from 'express';
import {
  getBotToken,
  getWebhookSecret,
  getPublicBaseUrl,
  getMe,
  getWebhookInfo,
  setWebhook,
  sendTelegramMessage,
  handleTelegramUpdate,
  alreadyProcessed,
  broadcastToLinkedChats,
  startTelegramHousekeeping,
  isTelegramConfigured,
  getFirestoreStatus,
} from './telegramService';
import { getAdminApp, getFirestore, getAdminAuth } from './firebaseAdmin';

interface RouterDeps {
  checkRateLimit: (key: string, limitMs?: number) => boolean;
  logSecurityEvent: (eventType: string, details: Record<string, any>) => void;
  isValidUid: (uid: string) => boolean;
  isValidPin: (pin: string) => boolean;
  securityViolationCount?: { current: number };
}

const BOT_MODE = (process.env.BOT_MODE || 'webhook').toLowerCase();

interface AdminAuthResult {
  allowed: boolean;
  reason:
    | 'x-admin-secret'
    | 'firebase_token'
    | 'missing_access_token'
    | 'firebase_auth_unavailable'
    | 'firestore_unavailable'
    | 'doc_read_error'
    | 'role_insufficient'
    | 'token_verification_failed';
  uid?: string;
}

async function isAdminRequest(req: Request): Promise<AdminAuthResult> {
  const envSecret = process.env.ADMIN_API_SECRET;
  const headerSecret = req.headers['x-admin-secret'];
  if (envSecret && headerSecret && headerSecret === envSecret) {
    return { allowed: true, reason: 'x-admin-secret' };
  }

  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : '';
  if (!token) {
    return { allowed: false, reason: 'missing_access_token' };
  }

  const auth = getAdminAuth();
  if (!auth) {
    return { allowed: false, reason: 'firebase_auth_unavailable' };
  }

  let decoded: { uid: string; role?: string };
  try {
    decoded = await auth.verifyIdToken(token);
  } catch (err: any) {
    console.warn('[TELEGRAM AUTH] Firebase ID token verification failed:', err?.code || err?.message || String(err));
    return { allowed: false, reason: 'token_verification_failed' };
  }

  const db = getFirestore();
  let userData: Record<string, any> | null = null;
  let readError: string | null = null;
  if (!db) {
    readError = 'firestore_unavailable';
  } else {
    try {
      const snap = await db.doc(`users/${decoded.uid}`).get();
      userData = snap.exists ? (snap.data() as Record<string, any>) : null;
    } catch (err: any) {
      readError = err?.code || err?.message || 'unknown';
    }
  }

  if (readError) {
    console.warn(
      `[TELEGRAM AUTH] uid ${decoded.uid}: Firestore users/{uid} read failed (${readError}); denying.`
    );
    return { allowed: false, reason: readError === 'firestore_unavailable' ? 'firestore_unavailable' : 'doc_read_error', uid: decoded.uid };
  }

  const role: string = userData?.role || decoded.role || 'guest';
  if (role === 'admin' || role === 'superadmin') {
    return { allowed: true, reason: 'firebase_token', uid: decoded.uid };
  }
  console.warn(`[TELEGRAM AUTH] uid ${decoded.uid}: role "${role}" is not admin/superadmin; denying.`);
  return { allowed: false, reason: 'role_insufficient', uid: decoded.uid };
}

function adminDenied(res: Response, auth: AdminAuthResult, logSecurityEvent: (t: string, d: Record<string, any>) => void): Response {
  logSecurityEvent('TELEGRAM_ADMIN_AUTH_FAILED', {
    route: '/api/telegram/',
    ip: res.req?.ip || 'unknown',
    reason: auth.reason,
    uid: auth.uid || undefined,
  });
  return json(res, 403, {
    error: 'Forbidden: Admin huquqi talab qilinadi.',
    reason: auth.reason,
  });
}

function json(res: Response, status: number, body: Record<string, any>): Response {
  return res.status(status).json(body);
}

export function createTelegramRouter(deps: RouterDeps): Router {
  const router = Router();
  const { checkRateLimit, logSecurityEvent } = deps;

  startTelegramHousekeeping();

  /* -------------------------------------------------------------------------
   * Telegram inbound webhook (Cloud Run friendly)
   * ------------------------------------------------------------------------- */
  router.post('/telegram/webhook', async (req: Request, res: Response) => {
    const expectedSecret = getWebhookSecret();
    const header = req.headers['x-telegram-bot-api-secret-token'] as string | string[] | undefined;

    if (expectedSecret) {
      const received = Array.isArray(header) ? header[0] : header;
      if (!received || received !== expectedSecret) {
        logSecurityEvent('WEBHOOK_SPOOF_ATTEMPT', {
          route: '/api/telegram/webhook',
          ip: req.ip,
        });
        return json(res, 403, { ok: false, error: 'Forbidden: Secret token mismatch.' });
      }
    } else {
      logSecurityEvent('WEBHOOK_BYPASS_WARNING', {
        route: '/api/telegram/webhook',
        ip: req.ip,
        message: 'TELEGRAM_WEBHOOK_SECRET is not set. Set it (and in BotFather) before production.',
      });
    }

    const update = req.body;
    try {
      if (!update || typeof update !== 'object') {
        return json(res, 200, { ok: true });
      }

      if (update.update_id !== undefined && update.update_id !== null) {
        const duplicate = await alreadyProcessed(update.update_id);
        if (duplicate) {
          return json(res, 200, { ok: true, duplicate: true });
        }
      }

      await handleTelegramUpdate(update, 'webhook');
      return json(res, 200, { ok: true, timestamp: new Date().toISOString() });
    } catch (err: any) {
      console.error('[TELEGRAM WEBHOOK] processing error:', err?.message || String(err));
      // Telegram retries on 5xx. Returning 200 + logging keeps the bot alive
      // and avoids repeat storms; the idempotency guard prevents duplicates.
      return json(res, 200, { ok: false, error: 'internal_error', timestamp: new Date().toISOString() });
    }
  });

  /* -------------------------------------------------------------------------
   * Real bot + webhook status (no secrets leaked)
   * ------------------------------------------------------------------------- */
  router.get('/telegram/status', async (req: Request, res: Response) => {
    const clientKey = `status_${req.ip}`;
    if (!checkRateLimit(clientKey, 1500)) {
      return json(res, 429, { error: 'Too Many Requests' });
    }
    const configured = isTelegramConfigured();
    let bot: Record<string, any> | null = null;
    let webhook: Record<string, any> | null = null;
    if (configured) {
      const me = await getMe();
      if (me?.ok === true && me.bot) {
        bot = { id: me.bot.id, username: me.bot.username, firstName: me.bot.first_name };
      }
      const info = await getWebhookInfo();
      if (info?.ok === true && info.result) {
        webhook = {
          url: info.result.url || '',
          pendingUpdateCount: info.result.pending_update_count ?? 0,
          lastError: info.result.last_error_message || null,
          lastErrorDate: info.result.last_error_date || null,
          ipAddress: info.result.ip_address || '',
        };
      }
    }
    const fs = await getFirestoreStatus();
    return json(res, 200, {
      connected: configured && Boolean(bot),
      mode: BOT_MODE,
      configured: {
        token: configured,
        webhookSecret: Boolean(getWebhookSecret()),
        adminChatId: Boolean(process.env.TELEGRAM_ADMIN_CHAT_ID),
        publicUrl: getPublicBaseUrl() || null,
        firestore: fs.available,
        firestoreProjectId: fs.projectId,
      },
      bot,
      webhook,
      serverTime: new Date().toISOString(),
    });
  });

  /* -------------------------------------------------------------------------
   * Webhook registration (admin only)
   * ------------------------------------------------------------------------- */
  router.post('/telegram/webhook/setup', async (req: Request, res: Response) => {
    const clientKey = `setup_${req.ip}`;
    if (!checkRateLimit(clientKey, 5000)) {
      return json(res, 429, { error: 'Too Many Requests', message: 'Webhook sozlash uchun kuting.' });
    }
    const adminAuth = await isAdminRequest(req);
    if (!adminAuth.allowed) {
      return adminDenied(res, adminAuth, logSecurityEvent);
    }
    if (!getBotToken()) {
      return json(res, 503, { ok: false, error: 'TELEGRAM_BOT_TOKEN sozlanmagan.' });
    }
    if (!getWebhookSecret()) {
      return json(res, 400, {
        ok: false,
        error: 'TELEGRAM_WEBHOOK_SECRET sozlanmagan. Avval secret o\'rnating va BotFather ga kiriting.',
      });
    }
    const baseUrl = getPublicBaseUrl();
    if (!baseUrl) {
      return json(res, 400, {
        ok: false,
        error: 'PUBLIC_URL yoki APP_URL env o\'zgaruvchisi aniq emas — webhook URLi aniqlab bo\'lmadi.',
      });
    }
    const webhookUrl = `${baseUrl}/api/telegram/webhook`;
    const result = await setWebhook(webhookUrl, getWebhookSecret());
    if (result?.ok === true) {
      return json(res, 200, {
        ok: true,
        description: result.description || 'Webhook muvaffaqiyatli o\'rnatildi.',
        url: webhookUrl,
      });
    }
    return json(res, 502, { ok: false, error: result?.description || 'Webhook o\'rnatilmadi.' });
  });

  /* -------------------------------------------------------------------------
   * Admin outbound message via server token (never client token)
   * ------------------------------------------------------------------------- */
  router.post('/telegram/send', async (req: Request, res: Response) => {
    const clientKey = `send_${req.ip}`;
    if (!checkRateLimit(clientKey, 1000)) {
      logSecurityEvent('RATE_LIMIT_TRIGGER', { route: '/api/telegram/send', ip: req.ip });
      return json(res, 429, { error: 'Too Many Requests', message: 'Yuborish orasida biroz kuting.' });
    }
    const adminAuth = await isAdminRequest(req);
    if (!adminAuth.allowed) {
      return adminDenied(res, adminAuth, logSecurityEvent);
    }
    if (!getBotToken()) {
      return json(res, 503, { ok: false, error: 'Telegram bot sozlanmagan (TELEGRAM_BOT_TOKEN).' });
    }
    const { chatId, text } = req.body || {};
    if (typeof chatId !== 'string' && typeof chatId !== 'number') {
      return json(res, 400, { ok: false, error: 'chatId talab qilinadi.' });
    }
    if (typeof text !== 'string' || text.trim().length === 0 || text.length > 4096) {
      return json(res, 400, { ok: false, error: 'Xabar matni talab qilinadi (max 4096 belgi).' });
    }
    const ok = await sendTelegramMessage(chatId, text.trim());
    if (ok) {
      return json(res, 200, { ok: true, message: 'Xabar muvaffaqiyatli yuborildi.', chatId: String(chatId).slice(0, 40) });
    }
    return json(res, 502, { ok: false, error: 'Telegram xabarni yetkazmadi. Chat ID va bot holatini tekshiring.' });
  });

  /* -------------------------------------------------------------------------
   * Bot health (real getMe verification)
   * ------------------------------------------------------------------------- */
  router.get('/bot/health', async (req: Request, res: Response) => {
    const configured = isTelegramConfigured();
    let connected = false;
    let botUsername: string | null = null;
    if (configured) {
      const me = await getMe();
      connected = me?.ok === true;
      if (connected && me.bot?.username) {
        botUsername = me.bot.username;
      }
    }
    return json(res, 200, {
      status: configured && connected ? 'ok' : configured ? 'error' : 'not_configured',
      botUsername,
      mode: BOT_MODE,
      bridgeConnected: connected,
      serverTime: new Date().toISOString(),
    });
  });

  /* -------------------------------------------------------------------------
   * Per-user connection status (real Firestore lookup)
   * ------------------------------------------------------------------------- */
  router.get('/bot/status/:userUid', async (req: Request, res: Response) => {
    const { userUid } = req.params;
    if (!deps.isValidUid(userUid)) {
      return json(res, 400, { error: 'Invalid userUid format.' });
    }
    const clientKey = `status_${req.ip}_${userUid}`;
    if (!checkRateLimit(clientKey, 1500)) {
      logSecurityEvent('RATE_LIMIT_TRIGGER', { route: '/api/bot/status', userUid, ip: req.ip });
      return json(res, 429, {
        error: 'Too Many Requests',
        message: 'Rate limit exceeded for bot status checks. Please wait a moment before trying again.',
      });
    }
    const db = getFirestore();
    if (!db) {
      return json(res, 200, { isConnected: false, telegramUsername: null, chatId: null, chatConnectedAt: null });
    }
    try {
      const snap = await db.doc(`users/${userUid}`).get();
      if (!snap.exists) {
        return json(res, 200, { isConnected: false, telegramUsername: null, chatId: null, chatConnectedAt: null });
      }
      const data = snap.data() as Record<string, any>;
      const chatId: string | undefined = data.telegramChatId || undefined;
      const isConnected = Boolean(chatId) || Boolean(data.isBotConnected);
      return json(res, 200, {
        isConnected,
        telegramUsername: data.telegramUsername || null,
        chatId: chatId || null,
        chatConnectedAt: data.telegramConnectedAt || (isConnected ? data.updatedAt || null : null),
      });
    } catch (err: any) {
      console.error('[TELEGRAM] /api/bot/status error:', err?.message || String(err));
      return json(res, 200, { isConnected: false, telegramUsername: null, chatId: null, chatConnectedAt: null });
    }
  });

  /* -------------------------------------------------------------------------
   * Global broadcast to linked Telegram chats (real delivery)
   * ------------------------------------------------------------------------- */
  router.post('/bot/broadcast', async (req: Request, res: Response) => {
    const clientKey = `broadcast_${req.ip}`;
    if (!checkRateLimit(clientKey, 5000)) {
      logSecurityEvent('RATE_LIMIT_TRIGGER', { route: '/api/bot/broadcast', ip: req.ip });
      return json(res, 429, {
        error: 'Too Many Requests',
        message: 'Broadcast rate limit hit. Please wait a few seconds between global broadcasts.',
      });
    }
    const adminAuth = await isAdminRequest(req);
    if (!adminAuth.allowed) {
      return adminDenied(res, adminAuth, logSecurityEvent);
    }
    const { message } = req.body || {};
    if (typeof message !== 'string' || message.trim().length === 0 || message.length > 4000) {
      return json(res, 400, { error: 'Valid broadcast message content (max 4000 chars) is required.' });
    }
    const { totalConnected, sentCount, failedCount } = await broadcastToLinkedChats(message.trim(), 200);
    return json(res, 200, {
      success: totalConnected > 0 && sentCount > 0,
      message: sentCount > 0
        ? `Global broadcast dispatched: ${sentCount}/${totalConnected} chats.`
        : (totalConnected === 0 ? 'Hech qanday ulangan Telegram chat topilmadi.' : 'Xabar hech kimga yetkazilmadi.'),
      totalConnected,
      sentCount,
      failedCount,
      timestamp: new Date().toISOString(),
    });
  });

  /* -------------------------------------------------------------------------
   * Notify grade (real attempt; fails honestly when no chat link)
   * ------------------------------------------------------------------------- */
  router.post('/bot/notify-grade', async (req: Request, res: Response) => {
    const { studentUid, title, score } = req.body || {};
    if (!deps.isValidUid(String(studentUid || ''))) {
      return json(res, 400, { error: 'Invalid studentUid format.' });
    }
    if (typeof title !== 'string' || !title || title.length > 200) {
      return json(res, 400, { error: 'Title is required (max 200 characters).' });
    }
    if (typeof score !== 'string' || !score || score.length > 50) {
      return json(res, 400, { error: 'Score is required (max 50 characters).' });
    }
    const db = getFirestore();
    if (!db || !getBotToken()) {
      return json(res, 200, {
        success: false,
        message: 'Telegram sozlanmagan — xabar yuborilmadi.',
      });
    }
    try {
      const snap = await db.doc(`users/${studentUid}`).get();
      const chatId = snap.exists
        ? (snap.data() as Record<string, any>).telegramChatId
        : undefined;
      if (!chatId) {
        return json(res, 200, {
          success: false,
          message: 'O\'quvchi Telegram orqali ulanmagan.',
        });
      }
      const ok = await sendTelegramMessage(
        String(chatId),
        `📊 Baho e'lon qilindi!\n\n📚 ${title}\n🎯 Natija: ${score}`
      );
      return json(res, 200, {
        success: ok,
        message: ok
          ? `Grade notification sent to ${studentUid} via Telegram.`
          : 'Telegram xabar yetkazilmadi.',
      });
    } catch (err: any) {
      console.error('[TELEGRAM] /api/bot/notify-grade error:', err?.message || String(err));
      return json(res, 200, { success: false, message: 'Xabar yuborishda xatolik.' });
    }
  });

  /* -------------------------------------------------------------------------
   * Assign security PIN via Telegram (real delivery attempt)
   * ------------------------------------------------------------------------- */
  router.post('/bot/assign-pin', async (req: Request, res: Response) => {
    const { userUid, pin } = req.body || {};
    if (!deps.isValidUid(String(userUid || ''))) {
      return json(res, 400, { error: 'Invalid userUid format.' });
    }
    if (!deps.isValidPin(String(pin || ''))) {
      logSecurityEvent('INVALID_PIN_SUBMISSION', { userUid, ip: req.ip });
      return json(res, 400, { error: 'PIN strictly must be a 4-digit numerical string.' });
    }
    const clientKey = `pin_${req.ip}_${userUid}`;
    if (!checkRateLimit(clientKey, 5000)) {
      logSecurityEvent('RATE_LIMIT_TRIGGER', { route: '/api/bot/assign-pin', userUid, ip: req.ip });
      return json(res, 429, { error: 'Too Many Requests: Please slow down PIN assignment requests.' });
    }
    const db = getFirestore();
    if (!db || !getBotToken()) {
      return json(res, 200, { success: false, message: 'Telegram sozlanmagan.' });
    }
    try {
      const snap = await db.doc(`users/${userUid}`).get();
      const chatId = snap.exists ? (snap.data() as Record<string, any>).telegramChatId : undefined;
      if (!chatId) {
        return json(res, 200, { success: false, message: 'Foydalanuvchi Telegram orqali ulanmagan.' });
      }
      const ok = await sendTelegramMessage(
        String(chatId),
        `🔑 Sizning xavfsizlik PIN kodingiz: ${pin}\n\nBu PINni hech kim bilan baham ko'rmang.`
      );
      return json(res, 200, {
        success: ok,
        message: ok
          ? `Security PIN dispatched to user ${userUid} via Telegram.`
          : 'PIN yuborilmadi.',
      });
    } catch (err: any) {
      console.error('[TELEGRAM] /api/bot/assign-pin error:', err?.message || String(err));
      return json(res, 200, { success: false, message: 'PIN yuborishda xatolik.' });
    }
  });

  return router;
}

export { BOT_MODE };