import { getFirestore, getFirebaseAdminError, probeFirestore, getRuntimeServiceAccount } from './firebaseAdmin';
import { formatInquiryNotification } from './notificationFormatter';

/**
 * Server-side Telegram integration for CenterFlow.
 *
 * Responsibilities:
 *  - Secure outbound calls to the Telegram Bot API (token stays server-side).
 *  - Inbound webhook processing with secret-token verification + idempotency.
 *  - Short-lived conversation state persisted in Firestore (telegram_sessions).
 *  - Creation of real CRM records (leads / questions) with source='telegram'.
 *  - Real bot health / webhook / broadcast operations for the Admin panel.
 *
 * The module must never crash the host application when Telegram is not
 * configured or when Firestore is unavailable — callers degrade gracefully.
 */

type AnyRecord = Record<string, any>;

/* ---------------------------------------------------------------------------
 * Configuration (env only — never from clients)
 * ------------------------------------------------------------------------- */

export function getBotToken(): string {
  return process.env.TELEGRAM_BOT_TOKEN || '';
}

export function getWebhookSecret(): string {
  return (process.env.TELEGRAM_WEBHOOK_SECRET || '').trim().replace(/^["']|["']$/g, '');
}

export function getAdminChatId(): string {
  return (process.env.TELEGRAM_ADMIN_CHAT_ID || '').trim();
}

export function isTelegramConfigured(): boolean {
  return Boolean(getBotToken());
}

export function getPublicBaseUrl(): string {
  const envUrl = (
    process.env.PUBLIC_URL ||
    process.env.APP_URL ||
    process.env.WEB_PORTAL_URL ||
    ''
  ).trim().replace(/\/+$/, '');
  return envUrl || 'https://centerflow.ai.studio';
}

/* ---------------------------------------------------------------------------
 * Telegram Bot API client (plain fetch, no SDK dependency)
 * ------------------------------------------------------------------------- */

const TG_API = 'https://api.telegram.org';

async function tgRequest(method: string, params: AnyRecord = {}, isForm = false): Promise<any> {
  const token = getBotToken();
  if (!token) {
    return { ok: false, description: 'TELEGRAM_BOT_TOKEN sozlanmagan' };
  }
  const url = `${TG_API}/bot${token}/${method}`;
  let response: globalThis.Response;
  try {
    if (isForm) {
      const form = new URLSearchParams();
      for (const [k, v] of Object.entries(params)) {
        if (v === undefined || v === null) continue;
        form.set(k, typeof v === 'object' ? JSON.stringify(v) : String(v));
      }
      response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: form,
      });
    } else {
      response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
      });
    }
    const data = await response.json().catch(() => ({}));
    return { ...data, httpStatus: response.status };
  } catch (err: any) {
    return { ok: false, description: err?.message || `Telegram API bilan aloqa yo'q (${method})` };
  }
}

export async function sendTelegramMessage(
  chatId: string | number,
  text: string,
  opts: AnyRecord = {}
): Promise<boolean> {
  if (!text || !text.trim()) return false;
  const result = await tgRequest('sendMessage', {
    chat_id: chatId,
    text,
    disable_web_page_preview: true,
    ...opts,
  });
  return result?.ok === true;
}

async function sendKeyboard(chatId: string | number, text: string, buttons: string[][], oneTime = false): Promise<boolean> {
  return sendTelegramMessage(chatId, text, {
    reply_markup: {
      resize_keyboard: true,
      one_time_keyboard: oneTime,
      keyboard: buttons.map((row) => row.map((label) => ({ text: label }))),
    },
  });
}

async function sendContactRequest(chatId: string | number, text: string): Promise<boolean> {
  return sendTelegramMessage(chatId, text, {
    reply_markup: {
      resize_keyboard: true,
      one_time_keyboard: true,
      keyboard: [[{ text: '📱 Telefon raqamimni yuborish', request_contact: true }]],
    },
  });
}

export async function hideKeyboard(chatId: string | number): Promise<boolean> {
  return sendTelegramMessage(chatId, '✅', { reply_markup: { remove_keyboard: true } }).then(() => true).catch(() => true);
}

export interface TelegramBotMeResult {
  id: number;
  is_bot?: boolean;
  first_name: string;
  username?: string;
  can_join_groups?: boolean;
  can_read_all_group_messages?: boolean;
  supports_inline_queries?: boolean;
}

export async function getMe(): Promise<{
  ok: boolean;
  result?: TelegramBotMeResult;
  bot?: { id: number; username: string; first_name: string };
  description?: string;
  errorCode?: number;
}> {
  const data = await tgRequest('getMe');
  if (data?.ok && data?.result) {
    return {
      ok: true,
      result: data.result,
      bot: {
        id: data.result.id,
        username: data.result.username || '',
        first_name: data.result.first_name || '',
      },
    };
  }
  return {
    ok: false,
    description: data?.description || 'Telegram Bot API bilan aloqa yo\'q',
    errorCode: data?.error_code || data?.httpStatus,
  };
}

export async function setWebhook(
  url: string,
  secretToken: string,
  dropPendingUpdates = true
): Promise<any> {
  const cleanSecret = (secretToken || '').trim().replace(/^["']|["']$/g, '');
  const payload: AnyRecord = {
    url: (url || '').trim(),
    drop_pending_updates: dropPendingUpdates,
    max_connections: 40,
    allowed_updates: ['message', 'callback_query', 'my_chat_member'],
  };
  if (cleanSecret) {
    payload.secret_token = cleanSecret;
  }
  return tgRequest('setWebhook', payload);
}

export interface WebhookInfoResult {
  url: string;
  has_custom_certificate: boolean;
  pending_update_count: number;
  ip_address?: string;
  last_error_date?: number;
  last_error_message?: string;
  last_synchronization_error_date?: number;
  max_connections?: number;
  allowed_updates?: string[];
}

export async function getWebhookInfo(): Promise<{
  ok: boolean;
  result?: WebhookInfoResult;
  description?: string;
  errorCode?: number;
}> {
  return tgRequest('getWebhookInfo');
}

/* ---------------------------------------------------------------------------
 * Helpers
 * ------------------------------------------------------------------------- */

export const CENTER_PHONE = '+998 90 862-22-26';

export function normalizeUzPhone(raw: string): string | null {
  if (!raw || typeof raw !== 'string') return null;
  let digits = raw.replace(/[^\d]/g, '');
  if (digits.startsWith('998')) {
    digits = digits.slice(3);
  } else if (digits.startsWith('8') && digits.length === 10) {
    digits = digits.slice(1);
  } else if (digits.startsWith('9') && digits.length === 9) {
    // operator raqam (90 123 45 67)
  } else if (digits.length === 9 && /^[3579]/.test(digits)) {
    // operator raqam boshqacha shaklda
  } else {
    return null;
  }
  digits = digits.slice(0, 9);
  if (!/^[0-9]{9}$/.test(digits)) return null;
  const operator = digits.slice(0, 2);
  const validOperators = ['33', '50', '55', '66', '77', '88', '90', '91', '93', '94', '95', '97', '98', '99'];
  if (!validOperators.includes(operator)) return null;
  const normalized = `+998${digits}`;
  return `${normalized.slice(0, 4)} ${normalized.slice(4, 6)} ${normalized.slice(6, 9)} ${normalized.slice(9, 11)} ${normalized.slice(11)}`;
}

export function compactPhone(normalized: string): string {
  return normalized ? normalized.replace(/\s+/g, '') : '';
}

/* ---------------------------------------------------------------------------
 * Conversation state (Firestore-backed, short-lived, expiring)
 * ------------------------------------------------------------------------- */

const SESSION_TTL_MS = 24 * 60 * 60 * 1000;

export interface BotSession {
  chatId: string;
  userId: string;
  username?: string;
  state: string;
  data: AnyRecord;
  updatedAt: string;
}

async function readSession(chatId: string | number): Promise<BotSession | null> {
  const db = getFirestore();
  if (!db) return null;
  try {
    const snap = await db.collection('telegram_sessions').doc(String(chatId)).get();
    if (!snap.exists) return null;
    const data = snap.data() as AnyRecord;
    const addedAt = typeof data.updatedAt === 'string' ? new Date(data.updatedAt).getTime() : 0;
    if (Date.now() - addedAt > SESSION_TTL_MS) {
      await db.collection('telegram_sessions').doc(String(chatId)).delete().catch(() => undefined);
      return null;
    }
    return {
      chatId: String(chatId),
      userId: data.userId || '',
      username: data.username || undefined,
      state: data.state || 'idle',
      data: data.data || {},
      updatedAt: data.updatedAt || new Date().toISOString(),
    };
  } catch {
    return null;
  }
}

async function writeSession(chatId: string | number, userId: string, username: string | undefined, state: string, data: AnyRecord): Promise<void> {
  const db = getFirestore();
  if (!db) return;
  try {
    await db.collection('telegram_sessions').doc(String(chatId)).set({
      chatId: String(chatId),
      userId,
      username: username || '',
      state,
      data,
      updatedAt: new Date().toISOString(),
    });
  } catch {
    // State persistence is best-effort — bot still answers without it.
  }
}

async function clearSession(chatId: string | number): Promise<void> {
  const db = getFirestore();
  if (!db) return;
  try {
    await db.collection('telegram_sessions').doc(String(chatId)).delete();
  } catch {
    // ignore
  }
}

function scheduleSessionCleanup(): NodeJS.Timeout | null {
  const db = getFirestore();
  if (!db) return null;
  const interval = setInterval(() => {
    const cutoff = new Date(Date.now() - SESSION_TTL_MS).toISOString();
    db.collection('telegram_sessions')
      .where('updatedAt', '<', cutoff)
      .get()
      .then((snap) => Promise.all(snap.docs.map((d) => d.ref.delete().catch(() => undefined))))
      .catch(() => undefined);
  }, 60 * 60 * 1000);
  if (interval.unref) interval.unref();
  return interval;
}

/* ---------------------------------------------------------------------------
 * CRM account linking via Telegram deep links (/start <session>)
 *
 * Flow:
 *   client creates telegram_sessions/{CF_SESSION_*} (status 'pending',
 *   userUid = the signed-in CRM user, createdAt = serverTimestamp)
 *   → user taps the deep link → Telegram sends /start <session>
 *   → webhook consumes the session atomically (one-time use)
 *   → users/{userUid}.telegramChatId & friends are written via the Admin SDK.
 *
 * The CRM uid is NEVER read from the Telegram payload directly — it is only
 * resolved through the stored session document, so an arbitrary Telegram user
 * cannot claim another account.
 * ------------------------------------------------------------------------- */

const DEEP_LINK_SESSION_TTL_MS = 15 * 60 * 1000; // 15 minutes
const UID_PATTERN = /^[a-zA-Z0-9_\-]{1,128}$/;

export interface TelegramLinkResult {
  ok: boolean;
  reason?: 'missing' | 'invalid' | 'expired' | 'used' | 'user_missing' | 'firestore_unavailable';
}

export async function consumeDeepLinkSession(
  sessionId: string,
  telegramUserId: string | number,
  telegramChatId: string | number,
  telegramUsername?: string
): Promise<TelegramLinkResult> {
  const db = getFirestore();
  if (!db) return { ok: false, reason: 'firestore_unavailable' };
  if (typeof sessionId !== 'string' || !sessionId.trim()) return { ok: false, reason: 'missing' };

  const cleanId = sessionId.trim().slice(0, 128);
  if (!/^[a-zA-Z0-9_\-]+$/.test(cleanId)) return { ok: false, reason: 'invalid' };

  try {
    // Atomic, one-time consumption (prevents reuse / double-claim races).
    const sessionRef = db.collection('telegram_sessions').doc(cleanId);
    let userUid: string | null = null;

    await db.runTransaction(async (tx) => {
      const snap = await tx.get(sessionRef);
      if (!snap.exists) return;
      const data = snap.data() ?? {};
      const status = typeof data.status === 'string' ? data.status : '';
      if (status !== 'pending') return; // already used / closed

      const rawUid = typeof data.userUid === 'string' ? data.userUid : '';
      if (!UID_PATTERN.test(rawUid)) return;

      // Optional freshness check when the client supplied a timestamp.
      if (data.createdAt) {
        let created = 0;
        if (typeof (data.createdAt as any)?.toDate === 'function') {
          created = (data.createdAt as any).toDate().getTime();
        } else if (typeof data.createdAt === 'number') {
          created = data.createdAt;
        } else {
          created = new Date(String(data.createdAt)).getTime() || 0;
        }
        if (created && Date.now() - created > DEEP_LINK_SESSION_TTL_MS) return; // expired
      }

      tx.update(sessionRef, {
        status: 'used',
        usedAt: new Date().toISOString(),
        usedByChatId: String(telegramChatId),
        usedByUserId: String(telegramUserId),
      });
      userUid = rawUid;
    });

    if (!userUid) return { ok: false, reason: 'invalid' };

    // Resolve the CRM user purely from the session — never from Telegram input.
    const userRef = db.collection('users').doc(userUid);
    const userSnap = await userRef.get();
    if (!userSnap.exists) return { ok: false, reason: 'user_missing' };

    await userRef.update({
      telegramChatId: String(telegramChatId),
      telegramUsername: telegramUsername || userSnap.data()?.telegramUsername || '',
      telegramUserId: String(telegramUserId),
      isBotConnected: true,
      telegramConnectedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    return { ok: true };
  } catch (err: any) {
    console.error('[TELEGRAM] Deep-link linking error:', err?.message || String(err));
    return { ok: false, reason: 'invalid' };
  }
}

const START_COMMAND_RE = /^\/start(\s.*)?$/;

/* ---------------------------------------------------------------------------
 * Webhook idempotency
 * ------------------------------------------------------------------------- */

export async function alreadyProcessed(updateId: string | number): Promise<boolean> {
  const db = getFirestore();
  if (!db) return false;
  try {
    const ref = db.collection('telegram_updates').doc(String(updateId));
    return await db.runTransaction(async (tx) => {
      const snap = await tx.get(ref);
      if (snap.exists) return true;
      tx.set(ref, {
        updateId: String(updateId),
        processedAt: Date.now(),
      });
      return false;
    });
  } catch {
    return false;
  }
}

let updateCleanupInterval: NodeJS.Timeout | null = null;
function scheduleUpdateCleanup(): NodeJS.Timeout | null {
  const db = getFirestore();
  if (!db) return null;
  const interval = setInterval(() => {
    const cutoff = Date.now() - 72 * 60 * 60 * 1000;
    db.collection('telegram_updates')
      .where('processedAt', '<', cutoff)
      .get()
      .then((snap) => Promise.all(snap.docs.map((d) => d.ref.delete().catch(() => undefined))))
      .catch(() => undefined);
  }, 12 * 60 * 60 * 1000);
  if (interval.unref) interval.unref();
  return interval;
}

/* ---------------------------------------------------------------------------
 * CRM records (reuse existing collections/schema)
 * ------------------------------------------------------------------------- */

export async function createTelegramLead(input: {
  name: string;
  phone: string;
  courseId?: string;
  course: string;
  telegramUserId: string | number;
  telegramChatId: string | number;
  telegramUsername?: string;
}): Promise<boolean> {
  const db = getFirestore();
  if (!db) {
    console.warn('[TELEGRAM] Firestore mavjud emas — lead saqlanmadi:', input.name);
    return false;
  }
  try {
    await db.collection('leads').add({
      name: input.name,
      phone: compactPhone(input.phone),
      course: input.course,
      courseId: input.courseId || '',
      status: 'Yangi',
      source: 'telegram',
      assignedTo: 'Qabulxona',
      notes: 'Telegram bot orqali sinov darsiga yozildi.',
      telegramUserId: String(input.telegramUserId),
      telegramChatId: String(input.telegramChatId),
      telegramUsername: input.telegramUsername || '',
      createdAt: new Date().toISOString(),
    });
    return true;
  } catch (err: any) {
    console.error('[TELEGRAM] Lead yaratishda xatolik:', err?.message || String(err));
    return false;
  }
}

export async function createTelegramQuestion(input: {
  name: string;
  phone: string;
  course?: string;
  message: string;
  telegramUserId: string | number;
  telegramChatId: string | number;
  telegramUsername?: string;
}): Promise<boolean> {
  const db = getFirestore();
  if (!db) {
    console.warn('[TELEGRAM] Firestore mavjud emas — savol saqlanmadi:', input.name);
    return false;
  }
  try {
    await db.collection('questions').add({
      fullName: input.name,
      phone: compactPhone(input.phone),
      course: input.course || '',
      subject: 'Telegram savol',
      message: input.message,
      preferredContact: 'telegram',
      source: 'telegram',
      status: 'New',
      telegramUserId: String(input.telegramUserId),
      telegramChatId: String(input.telegramChatId),
      telegramUsername: input.telegramUsername || '',
      createdAt: new Date().toISOString(),
    });
    return true;
  } catch (err: any) {
    console.error('[TELEGRAM] Savol yaratishda xatolik:', err?.message || String(err));
    return false;
  }
}

export async function notifyAdmin(text: string): Promise<boolean> {
  const chatId = getAdminChatId();
  if (!chatId) return false;
  return sendTelegramMessage(chatId, text);
}

/* ---------------------------------------------------------------------------
 * Courses (single source of truth: Firestore `courses`)
 * ------------------------------------------------------------------------- */

export interface BotCourse {
  id: string;
  title: string;
  shortTitle?: string;
}

export async function loadActiveCourses(): Promise<BotCourse[]> {
  const db = getFirestore();
  if (!db) return [];
  try {
    const snap = await db.collection('courses').get();
    const courses: BotCourse[] = [];
    snap.forEach((doc) => {
      const data = doc.data() as AnyRecord;
      if (data.isActive === false) return;
      const title = data.title || data.shortTitle || data.name || '';
      if (!title) return;
      courses.push({ id: doc.id, title, shortTitle: data.shortTitle || '' });
    });
    courses.sort((a, b) => (a.title || '').localeCompare(b.title || ''));
    return courses;
  } catch (err: any) {
    console.warn('[TELEGRAM] Kurslarni yuklashda xatolik:', err?.message || String(err));
    return [];
  }
}

function findCourseByTitle(courses: BotCourse[], input: string): BotCourse | null {
  if (!input) return null;
  const needle = input.trim().toLowerCase();
  return (
    courses.find((c) => c.title.toLowerCase() === needle) ||
    courses.find((c) => (c.shortTitle || '').toLowerCase() === needle) ||
    courses.find((c) => c.title.toLowerCase().includes(needle)) ||
    null
  );
}

/* ---------------------------------------------------------------------------
 * Bot UX (Uzbek-first)
 * ------------------------------------------------------------------------- */

const MAIN_MENU: string[][] = [
  ['📝 Sinov darsiga yozilish'],
  ['❓ Savol yuborish', "📞 Bog'lanish"],
  ['ℹ️ Yordam'],
];

const WELCOME_TEXT = `Assalomu alaykum! 👋

Siz Renessans O'quv Markazining rasmiy Telegram botidasiz.

Bu yer orqali:
🎓 Sinov darsiga yozilish
❓ Savol yuborish
📞 Markaz bilan bog'lanish

mumkin. Quyidagi tugmalardan birini tanlang.`;

const HELP_TEXT = `ℹ️ Yordam

Mavjud buyruqlar:
/start — Botni boshlash
/help — Yordam ko'rsatish
/trial — Sinov darsiga yozilish
/question — Savol yuborish
/contact — Markaz bilan bog'lanish
/cancel — Boshlangan jarayonni bekor qilish

Yuborgan ma'lumotlaringiz Renessans o'quv markazi administratorlariga uzatiladi.`;

const CONTACT_TEXT = `📞 Biz bilan bog'lanish

Renessans O'quv Markazi
📍 Yangiobod tumani, 1-maktab binosi
📱 ${CENTER_PHONE}
🧭 Dushanba — Shanba: 08:30 — 21:00

Savol: /question
Sinov darsi: /trial`;

async function showMainMenu(chatId: string | number): Promise<void> {
  await sendKeyboard(chatId, WELCOME_TEXT, MAIN_MENU);
}

async function showHelp(chatId: string | number): Promise<void> {
  await sendKeyboard(chatId, HELP_TEXT, MAIN_MENU);
}

async function showContact(chatId: string | number): Promise<void> {
  await sendKeyboard(chatId, CONTACT_TEXT, MAIN_MENU);
}

async function startTrial(chatId: string | number): Promise<void> {
  await sendTelegramMessage(chatId, '📝 Sinov darsiga yozilish\n\nIsmingizni yozing:');
}

async function startQuestion(chatId: string | number): Promise<void> {
  await sendTelegramMessage(chatId, '❓ Savolingizni yozing. Operatorlarimiz tez orada javob beradi.');
}

async function promptPhone(chatId: string | number): Promise<void> {
  await sendContactRequest(chatId, '📞 Telefon raqamingizni yuboring yoki quyidagi tugmani bosing:');
}

async function promptCourse(chatId: string | number): Promise<void> {
  const courses = await loadActiveCourses();
  if (courses.length === 0) {
    await sendTelegramMessage(
      chatId,
      `Hozircha ochiq kurslar ro'yxati mavjud emas.\nIltimos, markazga qo'ng'iroq qiling: 📞 ${CENTER_PHONE}\n\nYoki javobingizni bekor qilish uchun /cancel ni bosing.`
    );
    return;
  }
  const rows: string[][] = [];
  for (let i = 0; i < courses.length; i += 2) {
    rows.push(courses.slice(i, i + 2).map((c) => c.title));
  }
  await sendKeyboard(chatId, '📚 Kursni tanlang:', rows, true);
}

function menuLabelPressed(text: string): boolean {
  return ['📝 Sinov darsiga yozilish', '❓ Savol yuborish', "📞 Bog'lanish", 'ℹ️ Yordam'].includes(text.trim());
}

/* ---------------------------------------------------------------------------
 * Webhook processing
 * ------------------------------------------------------------------------- */

export async function handleTelegramUpdate(update: AnyRecord, source: 'webhook' | 'polling' = 'webhook'): Promise<void> {
  if (!update) return;

  const updateType = update.message
    ? 'message'
    : update.callback_query
      ? 'callback_query'
      : update.my_chat_member
        ? 'my_chat_member'
        : Object.keys(update).find((k) => k !== 'update_id') || 'other';

  const message = update?.message || update?.callback_query?.message;
  const chatId: string | number | undefined = message?.chat?.id;
  const userId: string | number | undefined = update?.message?.from?.id || update?.callback_query?.from?.id;

  console.log(
    `[TELEGRAM WEBHOOK] update received: id=${update?.update_id ?? 'unknown'}, type=${updateType}, chat=${chatId ?? 'none'}, user=${userId ?? 'none'}, source=${source}`
  );

  // Reject/ignore non-message updates calmly. Log bot "kicked" events only.
  if (update.my_chat_member && update.my_chat_member.new_chat_member?.status === 'kicked') {
    console.warn('[TELEGRAM] Bot foydalanuvchi/guruh tomonidan bloklandi:', update.my_chat_member.from?.id);
  }

  if (!update.message) return;

  const username: string | undefined = update.message?.from?.username;
  if (chatId === undefined || chatId === null) return;

  const text: string | undefined = typeof update.message.text === 'string' ? update.message.text.trim() : undefined;
  const phoneFromContact: string | undefined = update.message.contact?.phone_number;

  let session = await readSession(chatId);
  const state = session?.state || 'idle';

  // Commands always handled regardless of state.
  if (text === '/cancel' || text === '/menu') {
    await clearSession(chatId);
    await showMainMenu(chatId);
    return;
  }
  if (text === '/start' || (text && START_COMMAND_RE.test(text))) {
    await clearSession(chatId);
    const payload = (text || '').replace(/^\/start/, '').trim();
    if (!payload) {
      await showMainMenu(chatId);
      return;
    }
    const linkResult = await consumeDeepLinkSession(payload, userId, chatId, username);
    if (linkResult.ok) {
      await sendTelegramMessage(
        chatId,
        "✅ Telegram hisobingiz CenterFlow CRM bilan muvaffaqiyatli bog'landi!\n\nEndi siz baholar, xavfsizlik PIN-kodlari va markaz bildirishnomalarini Telegram orqali olasiz."
      );
    } else {
      await sendTelegramMessage(
        chatId,
        "⚠️ Ushbu havola yaroqsiz, muddati o'tgan yoki allaqachon ishlatilgan.\n\nYangi havolani CenterFlow hisobingizdagi \"Telegram ulash\" tugmasi orqali oling."
      );
    }
    await showMainMenu(chatId);
    return;
  }
  if (text === '/help') {
    await showHelp(chatId);
    return;
  }
  if (text === '/contact' || text === "📞 Bog'lanish") {
    await clearSession(chatId);
    await showContact(chatId);
    return;
  }
  if (text === '/trial' || text === '📝 Sinov darsiga yozilish') {
    await clearSession(chatId);
    await writeSession(chatId, String(userId), username, 'trial_name', {});
    await startTrial(chatId);
    return;
  }
  if (text === '/question' || text === '❓ Savol yuborish') {
    await clearSession(chatId);
    await writeSession(chatId, String(userId), username, 'question_message', { name: '', phone: '' });
    await startQuestion(chatId);
    return;
  }
  if (text === 'ℹ️ Yordam') {
    await showHelp(chatId);
    return;
  }

  // State machine
  switch (state) {
    case 'trial_name': {
      if (!text) {
        await sendTelegramMessage(chatId, 'Iltimos, ismingizni matn shaklida yozing.');
        return;
      }
      session = { ...(session || {} as BotSession), data: { name: text } };
      await writeSession(chatId, String(userId), username, 'trial_phone', { name: text });
      await promptPhone(chatId);
      return;
    }

    case 'trial_phone': {
      const rawPhone = phoneFromContact || text;
      const normalized = normalizeUzPhone(rawPhone || '');
      if (!normalized) {
        await sendTelegramMessage(
          chatId,
          `❌ Telefon raqami noto'g'ri.\n\nQayta yozing yoki tugmani bosing.\nMisol: ${CENTER_PHONE}`
        );
        return;
      }
      const data: AnyRecord = { ...(session?.data || {}), phone: normalized };
      await writeSession(chatId, String(userId), username, 'trial_course', data);
      await promptCourse(chatId);
      return;
    }

    case 'trial_course': {
      if (!text) {
        await sendTelegramMessage(chatId, 'Iltimos, quyidagi kurslardan birini tanlang.');
        return;
      }
      const courses = await loadActiveCourses();
      const course = findCourseByTitle(courses, text);
      if (!course) {
        await sendKeyboard(
          chatId,
          '❌ Bizda bunday kurs topilmadi. Quyidagi kurslardan birini tanlang:',
          courses.map((c) => [c.title])
        );
        return;
      }
      const data: AnyRecord = session?.data || {};
      const name = typeof data.name === 'string' ? data.name : 'Ism kiritilmagan';
      const phone = typeof data.phone === 'string' ? data.phone : '';
      const created = await createTelegramLead({
        name,
        phone,
        courseId: course.id,
        course: course.title,
        telegramUserId: userId,
        telegramChatId: chatId,
        telegramUsername: username,
      });
      await clearSession(chatId);
      const confirmation = `🎉 Rahmat, ${name.split(' ')[0]}!

Sizning arizangiz qabul qilindi. Tez orada operatorimiz siz bilan bog'lanadi.

📚 Kurs: ${course.title}
📞 Telefon: ${phone}`
        .concat(created ? '' : '\n\n⚠️ (Ariza vaqtincha qayd etilmadi, iltimos /contact orqali markazga murojaat qiling.)');
      await sendKeyboard(chatId, confirmation, MAIN_MENU);
      if (created) {
        await notifyAdmin(
          formatInquiryNotification({
            kind: 'trial',
            source: 'telegram',
            name,
            phone,
            username,
            course: course.title,
            createdAt: new Date().toISOString(),
          })
        );
      }
      return;
    }

    case 'question_message': {
      if (!text) {
        await sendTelegramMessage(chatId, 'Iltimos, savolingizni matn shaklida yozing.');
        return;
      }
      const data: AnyRecord = session?.data || {};
      const name = typeof data.name === 'string' && data.name ? data.name : (username ? `@${username}` : 'Telegram foydalanuvchisi');
      const phone = typeof data.phone === 'string' ? data.phone : '';
      const created = await createTelegramQuestion({
        name,
        phone,
        message: text,
        telegramUserId: userId,
        telegramChatId: chatId,
        telegramUsername: username,
      });
      await clearSession(chatId);
      await sendKeyboard(chatId, '✅ Savolingiz qabul qilindi. Tez orada administratorlarimiz javob beradi.', MAIN_MENU);
      if (created) {
        await notifyAdmin(
          formatInquiryNotification({
            kind: 'question',
            source: 'telegram',
            name,
            username,
            message: text,
            createdAt: new Date().toISOString(),
          })
        );
      }
      return;
    }

    default: {
      if (menuLabelPressed(text || '') || phoneFromContact) {
        await clearSession(chatId);
        await writeSession(chatId, String(userId), username, 'trial_name', {});
        await startTrial(chatId);
        return;
      }
      await showMainMenu(chatId);
      return;
    }
  }
}

/* ---------------------------------------------------------------------------
 * Broadcasts (real delivery to linked Telegram chats)
 * ------------------------------------------------------------------------- */

export async function broadcastToLinkedChats(message: string, limit = 200): Promise<{ totalConnected: number; sentCount: number; failedCount: number }> {
  if (!message || !message.trim()) {
    return { totalConnected: 0, sentCount: 0, failedCount: 0 };
  }
  const db = getFirestore();
  if (!db) {
    return { totalConnected: 0, sentCount: 0, failedCount: 0 };
  }
  const chatIds: string[] = [];
  try {
    const snap = await db.collection('users').limit(limit).get();
    snap.forEach((doc) => {
      const data = doc.data() as AnyRecord;
      const chatId = data.telegramChatId || data.telegramChatID;
      if (typeof chatId === 'string' && chatId && /^-?\d+$/.test(chatId)) {
        chatIds.push(chatId);
      }
    });
  } catch {
    return { totalConnected: 0, sentCount: 0, failedCount: 0 };
  }

  const unique = [...new Set(chatIds)];
  let sentCount = 0;
  let failedCount = 0;
  for (const chatId of unique) {
    const ok = await sendTelegramMessage(chatId, message);
    if (ok) sentCount++;
    else failedCount++;
  }
  return { totalConnected: unique.length, sentCount, failedCount };
}

/* ---------------------------------------------------------------------------
 * Lifetime
 * ------------------------------------------------------------------------- */

export function startTelegramHousekeeping(): void {
  updateCleanupInterval = updateCleanupInterval || scheduleUpdateCleanup();
  scheduleSessionCleanup();
}

export async function getFirestoreStatus(): Promise<{
  available: boolean;
  projectId: string;
  errorCode: string;
  error: string;
  runtimeServiceAccount: string | null;
}> {
  const probe = await probeFirestore();
  const runtime = await getRuntimeServiceAccount();
  return { ...probe, runtimeServiceAccount: runtime };
}

/**
 * Server startup webhook verification (runs once on boot):
 * → verify Telegram bot token
 * → getWebhookInfo
 * → if URL is correct, do nothing
 * → if URL is empty/wrong, setWebhook
 * → immediately call getWebhookInfo again
 * → verify Telegram still reports the correct URL
 * → log SAFE diagnostic
 */
export async function verifyWebhookOnStartup(): Promise<void> {
  const token = getBotToken();
  if (!token) {
    console.log('[TELEGRAM STARTUP] Bot token not configured, skipping startup webhook verification.');
    return;
  }
  const secret = getWebhookSecret();
  if (!secret) {
    console.warn('[TELEGRAM STARTUP] TELEGRAM_WEBHOOK_SECRET not configured, skipping startup webhook verification.');
    return;
  }
  const baseUrl = getPublicBaseUrl();
  const expectedUrl = `${baseUrl}/api/telegram/webhook`;

  try {
    const currentInfo = await getWebhookInfo();
    const currentRegisteredUrl = currentInfo?.result?.url || '';

    if (currentInfo?.ok && currentRegisteredUrl === expectedUrl) {
      console.log(`[TELEGRAM WEBHOOK VERIFY] registeredUrl=${currentRegisteredUrl} expectedUrl=${expectedUrl} pendingUpdates=${currentInfo.result?.pending_update_count ?? 0} lastError=${currentInfo.result?.last_error_message || 'none'} lastErrorDate=${currentInfo.result?.last_error_date ? new Date(currentInfo.result.last_error_date * 1000).toISOString() : 'none'}`);
      return;
    }

    console.log(`[TELEGRAM STARTUP] Webhook needs registration (current='${currentRegisteredUrl}', expected='${expectedUrl}'). Setting webhook...`);
    const setResult = await setWebhook(expectedUrl, secret, false);
    if (!setResult?.ok) {
      console.error('[TELEGRAM STARTUP] setWebhook call failed:', setResult?.description || 'Unknown error');
      return;
    }

    const verifiedInfo = await getWebhookInfo();
    const verifiedUrl = verifiedInfo?.result?.url || '';
    const pendingUpdates = verifiedInfo?.result?.pending_update_count ?? 0;
    const lastError = verifiedInfo?.result?.last_error_message || 'none';
    const lastErrorDate = verifiedInfo?.result?.last_error_date ? new Date(verifiedInfo.result.last_error_date * 1000).toISOString() : 'none';

    console.log(`[TELEGRAM WEBHOOK VERIFY] registeredUrl=${verifiedUrl} expectedUrl=${expectedUrl} pendingUpdates=${pendingUpdates} lastError=${lastError} lastErrorDate=${lastErrorDate}`);

    if (verifiedUrl !== expectedUrl) {
      console.warn(`[TELEGRAM STARTUP WARNING] Webhook set reported success, but Telegram getWebhookInfo returned url='${verifiedUrl}'.`);
    } else {
      console.log(`[TELEGRAM STARTUP] Webhook successfully verified at ${verifiedUrl}`);
    }
  } catch (err: any) {
    console.error('[TELEGRAM STARTUP ERROR] Webhook verification failed on startup:', err?.message || err);
  }
}

export { WELCOME_TEXT, HELP_TEXT, CONTACT_TEXT };