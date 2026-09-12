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
  notifyAdmin,
} from './telegramService';
import { getAdminApp, getFirestore, getAdminAuth, sanitizeFirebaseError } from './firebaseAdmin';
import { formatInquiryNotification } from './notificationFormatter';

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
  errorCode?: string;
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
  let readErrorMessage: string | null = null;
  if (!db) {
    readError = 'firestore_unavailable';
  } else {
    try {
      const snap = await db.doc(`users/${decoded.uid}`).get();
      userData = snap.exists ? (snap.data() as Record<string, any>) : null;
    } catch (err: any) {
      const { code, message } = sanitizeFirebaseError(err);
      readError = `${code}`;
      readErrorMessage = message;
    }
  }

  if (readError) {
    console.warn(
      `[TELEGRAM AUTH] uid ${decoded.uid}: Firestore users/{uid} read failed (${readError}${readErrorMessage ? `: ${readErrorMessage}` : ''}); denying.`
    );
    return {
      allowed: false,
      reason: readError === 'firestore_unavailable' ? 'firestore_unavailable' : 'doc_read_error',
      uid: decoded.uid,
      errorCode: readError === 'firestore_unavailable' ? 'firestore_unavailable' : readError,
    };
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
    errorCode: auth.errorCode || undefined,
    uid: auth.uid || undefined,
  });
  const body: Record<string, any> = {
    error: auth.reason === 'doc_read_error'
      ? 'Firestore Admin ulanishida xatolik — server loglarini tekshiring.'
      : 'Forbidden: Admin huquqi talab qilinadi.',
    reason: auth.reason,
  };
  if (auth.errorCode && auth.reason === 'doc_read_error') {
    body.errorCode = auth.errorCode;
  }
  return json(res, 403, body);
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
  router.get('/telegram/webhook', (req: Request, res: Response) => {
    return json(res, 200, {
      ok: true,
      status: 'active',
      endpoint: '/api/telegram/webhook',
      message: 'Telegram Webhook handler is ready to receive POST updates from Telegram Bot API.',
      serverTime: new Date().toISOString(),
    });
  });

  router.post('/telegram/webhook', async (req: Request, res: Response) => {
    const expectedSecret = getWebhookSecret();
    const rawHeader = req.headers['x-telegram-bot-api-secret-token'];
    const header = Array.isArray(rawHeader) ? rawHeader[0] : rawHeader;
    const received = (typeof header === 'string' ? header : '').trim();

    if (expectedSecret) {
      if (!received || received !== expectedSecret) {
        console.warn(
          `[TELEGRAM WEBHOOK] Secret token mismatch or missing header from IP ${req.ip} (header present: ${Boolean(header)})`
        );
        logSecurityEvent('WEBHOOK_SPOOF_ATTEMPT', {
          route: '/api/telegram/webhook',
          ip: req.ip,
          headerPresent: Boolean(header),
        });
        return json(res, 403, { ok: false, error: 'Forbidden: Secret token mismatch.' });
      }
    } else {
      logSecurityEvent('WEBHOOK_BYPASS_WARNING', {
        route: '/api/telegram/webhook',
        ip: req.ip,
        message: 'TELEGRAM_WEBHOOK_SECRET is not set in environment.',
      });
    }

    const update = req.body;
    try {
      if (!update || typeof update !== 'object') {
        return json(res, 200, { ok: true, reason: 'empty_update' });
      }

      if (update.update_id !== undefined && update.update_id !== null) {
        const duplicate = await alreadyProcessed(update.update_id);
        if (duplicate) {
          console.log(`[TELEGRAM WEBHOOK] duplicate update ignored: update_id=${update.update_id}`);
          return json(res, 200, { ok: true, duplicate: true });
        }
      }

      await handleTelegramUpdate(update, 'webhook');
      return json(res, 200, {
        ok: true,
        update_id: update?.update_id ?? null,
        timestamp: new Date().toISOString(),
      });
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
    const baseUrl = getPublicBaseUrl();
    const expectedUrl = `${baseUrl}/api/telegram/webhook`;
    let apiReachable = false;
    let bot: Record<string, any> | null = null;
    let webhook: Record<string, any> | null = null;

    if (configured) {
      const me = await getMe();
      apiReachable = me?.ok === true;
      if (me?.ok === true) {
        const b = me.result || me.bot;
        if (b) {
          bot = {
            id: b.id,
            username: b.username || '',
            firstName: (b as any).first_name || (b as any).firstName || '',
          };
        }
      }
      const info = await getWebhookInfo();
      if (info?.ok === true && info.result) {
        const registeredUrl = info.result.url || '';
        const isUrlMatched = Boolean(
          registeredUrl &&
          (registeredUrl === expectedUrl || registeredUrl.replace(/\/+$/, '') === expectedUrl)
        );
        webhook = {
          url: registeredUrl,
          expectedUrl,
          isUrlMatched,
          hasCustomCertificate: Boolean(info.result.has_custom_certificate),
          pendingUpdateCount: info.result.pending_update_count ?? 0,
          lastError: info.result.last_error_message || null,
          lastErrorDate: info.result.last_error_date || null,
          lastSyncErrorDate: info.result.last_synchronization_error_date || null,
          maxConnections: info.result.max_connections ?? 40,
          allowedUpdates: info.result.allowed_updates || [],
          ipAddress: info.result.ip_address || '',
        };
      }
    }
    const fs = await getFirestoreStatus();
    return json(res, 200, {
      connected: configured && Boolean(bot),
      apiReachable,
      mode: BOT_MODE,
      configured: {
        token: configured,
        webhookSecret: Boolean(getWebhookSecret()),
        adminChatId: Boolean(process.env.TELEGRAM_ADMIN_CHAT_ID),
        publicUrl: baseUrl || null,
        expectedWebhookUrl: expectedUrl,
        firestore: fs.available,
        firestoreProjectId: fs.projectId,
        firestoreErrorCode: fs.available ? '' : fs.errorCode,
        firestoreError: fs.available ? '' : fs.error,
        runtimeServiceAccount: fs.runtimeServiceAccount,
      },
      bot,
      webhook,
      serverTime: new Date().toISOString(),
    });
  });

  /* -------------------------------------------------------------------------
   * Webhook registration (admin only, idempotent, verified)
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
    const secret = getWebhookSecret();
    if (!secret) {
      return json(res, 400, {
        ok: false,
        error: 'TELEGRAM_WEBHOOK_SECRET sozlanmagan. Avval server muhitida secret o\'rnating.',
      });
    }
    const baseUrl = getPublicBaseUrl();
    const customUrl = typeof req.body?.url === 'string' ? req.body.url.trim() : '';
    const webhookUrl = customUrl || `${baseUrl}/api/telegram/webhook`;

    // 1. Check if already properly configured (idempotency check)
    const force = req.body?.force === true;
    if (!force) {
      const currentInfo = await getWebhookInfo();
      if (
        currentInfo?.ok === true &&
        currentInfo.result?.url === webhookUrl &&
        !currentInfo.result?.last_error_message
      ) {
        console.log(`[TELEGRAM SETUP] Webhook already configured to ${webhookUrl}; skipping re-registration.`);
        return json(res, 200, {
          ok: true,
          alreadyConfigured: true,
          description: 'Webhook allaqachon to\'g\'ri sozlangan va faol.',
          url: webhookUrl,
          webhook: currentInfo.result,
        });
      }
    }

    // 2. Register webhook with Telegram API
    // Requirement 9: For normal setup, preserve pending updates where possible.
    const dropPending = force
      ? req.body?.dropPendingUpdates !== false
      : req.body?.dropPendingUpdates === true;

    const result = await setWebhook(webhookUrl, secret, dropPending);
    if (result?.ok !== true) {
      console.error('[TELEGRAM SETUP] setWebhook call failed:', result?.description || 'Unknown error');
      return json(res, 502, {
        ok: false,
        error: result?.description || 'Telegram Bot API setWebhook xatosi.',
      });
    }

    // 3. Immediately verify via getWebhookInfo
    const verifiedInfo = await getWebhookInfo();
    const registeredUrl = verifiedInfo?.result?.url || '';
    const pendingUpdates = verifiedInfo?.result?.pending_update_count ?? 0;
    const lastError = verifiedInfo?.result?.last_error_message || null;
    const lastErrorDate = verifiedInfo?.result?.last_error_date || null;
    const isVerified = verifiedInfo?.ok === true && registeredUrl === webhookUrl;

    // Requirement 5: Log safe diagnostic (NEVER log token, secret, or credentials)
    console.log(`[TELEGRAM WEBHOOK VERIFY] registeredUrl=${registeredUrl} expectedUrl=${webhookUrl} pendingUpdates=${pendingUpdates} lastError=${lastError || 'none'} lastErrorDate=${lastErrorDate || 'none'}`);

    if (!isVerified) {
      const errorMsg = !registeredUrl
        ? "Telegram setWebhook ni muvaffaqiyatli qabul qildi, biroq getWebhookInfo da URL bo'sh ('') bo'lib qoldi. Telegram Bot API qoidalariga ko'ra, bot tokeniga ulangan boshqa faol jarayon (masalan, Cloud Run'dagi eski konteyner yoki lokal polling) webhookni bekor qilgan."
        : `Telegram ro'yxatdan o'tkazgan URL kutilgan URL bilan mos kelmadi: '${registeredUrl}' vs '${webhookUrl}'.`;

      console.error(`[TELEGRAM SETUP] Verification failed: ${errorMsg}`);
      return json(res, 502, {
        ok: false,
        error: errorMsg,
        description: errorMsg,
        expectedUrl: webhookUrl,
        registeredUrl,
        lastError,
        lastErrorDate,
        pendingUpdates,
        webhookInfo: verifiedInfo?.result || null,
      });
    }

    console.log(`[TELEGRAM SETUP] Webhook successfully verified: ${webhookUrl}`);
    return json(res, 200, {
      ok: true,
      description: result.description || 'Webhook muvaffaqiyatli o\'rnatildi va tasdiqlandi.',
      url: webhookUrl,
      webhook: verifiedInfo?.result || null,
    });
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

  /* -------------------------------------------------------------------------
   * Public "new inquiry" notify endpoint (website forms)
   *
   * The browser writes the inquiry to Firestore (public create, unchanged) and
   * then calls this endpoint as a best-effort admin notify. It formats and
   * sends server-side so the bot token / admin chat id never reach the client.
   * Failure must never break the already-saved inquiry, so a failure here only
   * logs and still returns a benign 200.
   * ------------------------------------------------------------------------- */
  router.post('/notify/inquiry', async (req: Request, res: Response) => {
    try {
      const body = (req.body && typeof req.body === 'object' ? req.body : {}) as Record<string, any>;
      const kind = body.kind === 'question' ? ('question' as const) : body.kind === 'trial' ? ('trial' as const) : null;
      if (!kind) {
        return json(res, 400, { ok: false, reason: 'invalid_kind' });
      }
      const source = body.source === 'telegram' ? ('telegram' as const) : ('website' as const);
      const text = formatInquiryNotification({
        kind,
        source,
        name: typeof body.name === 'string' ? body.name : '',
        phone: typeof body.phone === 'string' ? body.phone : '',
        username: typeof body.username === 'string' ? body.username : '',
        course: typeof body.course === 'string' ? body.course : '',
        message: kind === 'question' && typeof body.message === 'string' ? body.message : '',
        createdAt: new Date().toISOString(),
      });
      // Fire-and-forget: a Telegram outage must not fail the caller's form.
      await notifyAdmin(text);
      return json(res, 200, { ok: true });
    } catch (err: any) {
      console.error('[NOTIFY] /api/notify/inquiry error:', err?.message || String(err));
      return json(res, 200, { ok: true });
    }
  });

  return router;
}

export { BOT_MODE };