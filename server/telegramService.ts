import { getFirestore, getFirebaseAdminError, probeFirestore, getRuntimeServiceAccount } from './firebaseAdmin';
import { formatInquiryNotification } from './notificationFormatter';
import { FieldValue } from 'firebase-admin/firestore';

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

/* ---------------------------------------------------------------------------
 * Two-way Telegram messaging (Step 4)
 *
 * Conversation history lives in the `telegram_messages` collection:
 *
 *   id                 auto Firestore document id
 *   userUid?           CRM user uid (users/{uid}) — the authority for sending
 *   chatId             Telegram chat id the message belongs to
 *   direction          "inbound" | "outbound"
 *   text               message body (trimmed, max 4096)
 *   telegramMessageId? Telegram message id (inbound: user's msg; outbound: sent)
 *   telegramUserId?    Telegram numeric user id (where known)
 *   sentByUid?         CRM uid of the admin who replied
 *   sentByName?        display name of the admin who replied
 *   createdAt          ISO UTC — lexicographically sortable for paging
 *   status             "sent" | "failed" (failed only for outbound)
 *   error?             useful error string (outbound failures only)
 *
 * No bot token / webhook secret is ever stored here.
 * ------------------------------------------------------------------------- */

export interface TelegramMessageRecord {
  id?: string;
  userUid?: string;
  chatId: string;
  direction: 'inbound' | 'outbound';
  text: string;
  telegramMessageId?: string;
  telegramUserId?: string;
  sentByUid?: string;
  sentByName?: string;
  broadcastId?: string;
  createdAt: string;
  status: 'sent' | 'failed';
  error?: string;
}

const TELEGRAM_MESSAGES_COLLECTION = 'telegram_messages';

export function normalizeTelegramChatId(chatId: string | number): string {
  return String(chatId ?? '').trim();
}

export async function saveTelegramMessage(record: TelegramMessageRecord): Promise<TelegramMessageRecord | null> {
  const db = getFirestore();
  if (!db) return null;
  const text = (record.text || '').trim().slice(0, 4096);
  if (!text) return null;
  const chatId = normalizeTelegramChatId(record.chatId);
  if (!chatId) return null;
  const doc: Record<string, string> = {
    chatId,
    direction: record.direction,
    text,
    status: record.status === 'failed' ? 'failed' : 'sent',
    createdAt: record.createdAt || new Date().toISOString(),
  };
  if (record.userUid) doc.userUid = record.userUid;
  if (record.telegramMessageId) doc.telegramMessageId = String(record.telegramMessageId);
  if (record.telegramUserId) doc.telegramUserId = String(record.telegramUserId);
  if (record.sentByUid) doc.sentByUid = record.sentByUid;
  if (record.sentByName) doc.sentByName = record.sentByName;
  if (record.broadcastId) doc.broadcastId = record.broadcastId;
  if (record.error) doc.error = record.error;
  try {
    const ref = await db.collection(TELEGRAM_MESSAGES_COLLECTION).add(doc);
    return {
      id: ref.id,
      chatId,
      direction: record.direction,
      text,
      status: record.status === 'failed' ? 'failed' : 'sent',
      createdAt: record.createdAt || new Date().toISOString(),
      ...(record.userUid ? { userUid: record.userUid } : {}),
      ...(record.telegramMessageId ? { telegramMessageId: String(record.telegramMessageId) } : {}),
      ...(record.telegramUserId ? { telegramUserId: String(record.telegramUserId) } : {}),
      ...(record.sentByUid ? { sentByUid: record.sentByUid } : {}),
      ...(record.sentByName ? { sentByName: record.sentByName } : {}),
      ...(record.broadcastId ? { broadcastId: record.broadcastId } : {}),
      ...(record.error ? { error: record.error } : {}),
    } as TelegramMessageRecord;
  } catch (err: any) {
    console.error('[TELEGRAM] telegram_messages saqlanmadi:', err?.message || String(err));
    return null;
  }
}

/** Resolve the CRM user uid whose account is linked to a given Telegram chat. */
export async function findUserUidByChatId(chatId: string): Promise<string | null> {
  const db = getFirestore();
  if (!db) return null;
  try {
    const snap = await db
      .collection('users')
      .where('telegramChatId', '==', normalizeTelegramChatId(chatId))
      .limit(1)
      .get();
    return snap.empty ? null : snap.docs[0].id;
  } catch (err: any) {
    console.error('[TELEGRAM] findUserUidByChatId xatosi:', err?.message || String(err));
    return null;
  }
}

/** Read the Telegram chat id linked to a CRM user (server-side authority). */
export async function getUserTelegramChatId(userUid: string): Promise<string | null> {
  const db = getFirestore();
  if (!db) return null;
  try {
    const snap = await db.doc(`users/${userUid}`).get();
    if (!snap.exists) return null;
    const chatId = (snap.data() as Record<string, any>)?.telegramChatId;
    return chatId ? normalizeTelegramChatId(chatId) : null;
  } catch (err: any) {
    console.error('[TELEGRAM] getUserTelegramChatId xatosi:', err?.message || String(err));
    return null;
  }
}

/**
 * A chat id is only ever used as the send target when it is a KNOWN CRM
 * contact: either a linked user, an existing inquiry (lead/question) from that
 * chat, or a chat that already exchanged messages. Arbitrary chat ids are
 * rejected.
 */
export async function isKnownTelegramContact(chatId: string): Promise<boolean> {
  const db = getFirestore();
  if (!db) return false;
  const id = normalizeTelegramChatId(chatId);
  if (await findUserUidByChatId(id)) return true;
  const scan = async (collection: string, field: string): Promise<boolean> => {
    try {
      const snap = await db.collection(collection).where(field, '==', id).limit(1).get();
      return !snap.empty;
    } catch {
      return false;
    }
  };
  if (await scan('telegram_messages', 'chatId')) return true;
  if (await scan('leads', 'telegramChatId')) return true;
  if (await scan('questions', 'telegramChatId')) return true;
  return false;
}

/**
 * Fetch message history (newest page), newest-last. `before` is an ISO createdAt
 * cursor used for "load more". Requires the composite indexes declared in
 * firestore.indexes.json (chatId+createdAt, userUid+createdAt).
 */
export async function fetchTelegramMessages(opts: {
  chatId?: string;
  userUid?: string;
  limit?: number;
  before?: string;
}): Promise<{ messages: TelegramMessageRecord[]; hasMore: boolean }> {
  const db = getFirestore();
  if (!db) return { messages: [], hasMore: false };
  const limit = Math.min(Math.max(Number(opts.limit) || 50, 1), 100);
  let query: any = db.collection(TELEGRAM_MESSAGES_COLLECTION);
  if (opts.userUid) query = query.where('userUid', '==', opts.userUid);
  else if (opts.chatId) query = query.where('chatId', '==', normalizeTelegramChatId(opts.chatId));
  if (opts.before) query = query.where('createdAt', '<', opts.before);
  try {
    const snap = await query.orderBy('createdAt', 'desc').limit(limit + 1).get();
    const docs = snap.docs;
    const hasMore = docs.length > limit;
    const page = (hasMore ? docs.slice(0, limit) : docs)
      .map((d) => ({ id: d.id, ...(d.data() as object) }) as TelegramMessageRecord)
      .reverse();
    return { messages: page, hasMore };
  } catch (err: any) {
    console.error('[TELEGRAM] telegram_messages o\'qish xatosi:', err?.message || String(err));
    return { messages: [], hasMore: false };
  }
}

/** Low-level send that reports the delivered Telegram message id / error. */
export async function sendTelegramMessageDetailed(
  chatId: string | number,
  text: string
): Promise<{ ok: boolean; telegramMessageId?: string; error?: string }> {
  const trimmed = (text || '').trim().slice(0, 4096);
  if (!trimmed) return { ok: false, error: 'Xabar matni bo\'sh.' };
  const result = await tgRequest('sendMessage', {
    chat_id: chatId,
    text: trimmed,
    disable_web_page_preview: true,
  });
  if (result?.ok === true) {
    const mid = (result as any)?.result?.message_id;
    return { ok: true, telegramMessageId: mid != null ? String(mid) : undefined };
  }
  const description: string = (result as any)?.description || (result as any)?.error || '';
  const blocked = (result as any)?.error_code === 403 || /forbidden|blocked by the user/i.test(description);
  return {
    ok: false,
    error: blocked
      ? 'Foydalanuvchi botni bloklagan yoki chatga yozish taqiqlangan.'
      : description || 'Telegram API xatosi: xabar yuborilmadi.',
  };
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
 * Support requests (single destination, persisted for the owner)
 * ------------------------------------------------------------------------- */

export interface SupportRequestInput {
  subject: string;
  message: string;
  priority?: 'oddiy' | 'muhim' | 'shoshilinch';
  userName?: string;
  userEmail?: string;
  userUid?: string;
  telegramChatId?: string | number;
  telegramUsername?: string;
  source?: 'in_app' | 'telegram';
}

export async function createSupportRequest(input: SupportRequestInput): Promise<string | null> {
  const db = getFirestore();
  if (!db) return null;
  try {
    const priority = input.priority || 'oddiy';
    const docRef = await db.collection('support_requests').add({
      subject: String(input.subject || '').slice(0, 200),
      message: String(input.message || '').slice(0, 2000),
      priority,
      userName: input.userName || '',
      userEmail: input.userEmail || '',
      userUid: input.userUid || '',
      telegramChatId: input.telegramChatId != null ? String(input.telegramChatId) : '',
      telegramUsername: input.telegramUsername || '',
      source: input.source || 'telegram',
      status: 'new',
      createdAt: FieldValue.serverTimestamp(),
      deliveredAt: null,
    });

    // Best-effort delivery to support Telegram (server-only env, optional).
    const supportChatId = process.env.SUPPORT_TELEGRAM_CHAT_ID;
    if (supportChatId) {
      const priorityLabel =
        priority === 'shoshilinch' ? 'SHOSHILINCH' : priority === 'muhim' ? 'MUHIM' : 'Oddiy';
      const text = [
        '📩 *CenterFlow — Yordam so\'rovi*',
        '',
        `Mavzu: ${input.subject}`,
        `Prioritet: ${priorityLabel}`,
        `Manba: ${input.source || 'telegram'}`,
        `Foydalanuvchi: ${input.userName || (input.telegramUsername ? '@' + input.telegramUsername : 'Noma\'lum')}`,
        '',
        String(input.message),
        '',
        `ID: ${docRef.id}`,
      ].join('\n');
      sendTelegramMessage(supportChatId, text).catch(() => undefined);
    }
    return docRef.id;
  } catch (err: any) {
    console.warn('[SUPPORT] createSupportRequest xatolik:', err?.message || String(err));
    return null;
  }
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
/support — Qo'llab-quvvatlashga xabar yuborish
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

async function startSupport(chatId: string | number): Promise<void> {
  await sendTelegramMessage(
    chatId,
    '🛟 Yordam va qo\'llab-quvvatlash\n\nMuammoingiz yoki savolingizni yozing. U boshqaruv jamoasiga yetkaziladi.'
  );
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

/**
 * Two-way messaging inbound path: a plain free-text message sent by a CRM
 * LINKED user from the idle bot state is stored in telegram_messages under the
 * user's uid. Commands, menu buttons, contact shares and in-flight bot flows
 * never reach this function, so the existing bot state machine is untouched.
 * Returns true when the message was persisted.
 */
async function recordInboundMessage(
  chatId: string | number,
  text: string,
  fromUserId: string | number,
  username: string | undefined,
  srcMessageId?: number
): Promise<boolean> {
  const normalizedChat = normalizeTelegramChatId(chatId);
  const userUid = await findUserUidByChatId(normalizedChat);
  if (!userUid) return false;
  const saved = await saveTelegramMessage({
    userUid,
    chatId: normalizedChat,
    direction: 'inbound',
    text,
    telegramMessageId: srcMessageId != null ? String(srcMessageId) : undefined,
    telegramUserId: String(fromUserId ?? ''),
    createdAt: new Date().toISOString(),
    status: 'sent',
  });
  if (saved) {
    console.log(`[TELEGRAM MESSAGES] inbound saved for user ${userUid} (${username ? '@' + username : normalizedChat})`);
  }
  return Boolean(saved);
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
  if (text === '/support') {
    await clearSession(chatId);
    await writeSession(chatId, String(userId), username, 'support_message', {});
    await startSupport(chatId);
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

    case 'support_message': {
      if (!text) {
        await sendTelegramMessage(chatId, 'Iltimos, xabaringizni matn shaklida yozing.');
        return;
      }
      const created = await createSupportRequest({
        subject: 'Telegram orqali yuborilgan',
        message: text,
        priority: 'oddiy',
        userName: username ? `@${username}` : 'Telegram foydalanuvchisi',
        telegramChatId: chatId,
        telegramUsername: username,
        source: 'telegram',
      });
      await clearSession(chatId);
      await sendKeyboard(chatId, '✅ Xabaringiz qabul qilindi. Boshqaruv jamoasi tez orada javob beradi.', MAIN_MENU);
      if (created) {
        await notifyAdmin(
          `🛟 Telegram orqali yordam so'rovi:\n\n💬 ${text}\n${username ? `\n👤 @${username}` : ''}`
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
      // Two-way messaging: plain free-text from a CRM-linked chat is stored as
      // an inbound conversation message before the menu is shown. Commands and
      // active flows are handled above, so this is never a system message and
      // never spawns a second CRM record.
      if (text) {
        await recordInboundMessage(chatId, text, userId, username, update.message?.message_id);
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
 * Professional broadcasts (Step 5)
 *
 * Recipients are CRM user uids — the server alone resolves users/{uid}.
 * telegramChatId, so the client can never dictate a chat id. Sending is
 * sequential/bounded (no uncontrolled parallel requests), each recipient is
 * handled independently, and history is persisted only for real broadcasts.
 * ------------------------------------------------------------------------- */

export interface BroadcastRecipient {
  userUid: string;
  name: string;
  telegramUsername?: string;
  phone?: string;
  chatId: string;
  murojaatKind?: 'trial' | 'question';
  murojaatStatus?: string;
  murojaatId?: string;
}

export interface BroadcastResultEntry {
  userUid: string;
  name: string;
  telegramUsername?: string;
  status: 'sent' | 'failed' | 'skipped';
  error?: string;
}

export interface BroadcastRunOutput {
  broadcastId: string | null;
  total: number;
  sent: number;
  failed: number;
  skipped: number;
  results: BroadcastResultEntry[];
}

export interface BroadcastHistoryItem {
  id: string;
  message: string;
  createdAt: string;
  createdBy?: string | null;
  createdByName?: string;
  recipientCount: number;
  sentCount: number;
  failedCount: number;
  skippedCount: number;
  status: 'completed';
}

const BROADCAST_COLLECTION = 'telegram_broadcasts';
const BROADCAST_MAX_RECIPIENTS = 500;
const BROADCAST_CONCURRENCY = 4;

function broadcastChatId(data: AnyRecord): string | null {
  const raw = data.telegramChatId || data.telegramChatID;
  if (typeof raw !== 'string' || !raw || !/^-?\d+$/.test(raw)) return null;
  return raw;
}

async function scanLinkedUsers(scanLimit: number): Promise<Map<string, BroadcastRecipient>> {
  const db = getFirestore();
  const byChat = new Map<string, BroadcastRecipient>();
  if (!db) return byChat;
  const pageSize = 200;
  const softMax = Math.min(Math.max(scanLimit, 1), 2000);
  let lastDoc: any = null;
  let seen = 0;
  try {
    while (seen < softMax) {
      let q: any = db.collection('users').orderBy('__name__').limit(pageSize);
      if (lastDoc) q = q.startAfter(lastDoc);
      const snap = await q.get();
      if (snap.empty) break;
      for (const d of snap.docs) {
        seen++;
        const data = d.data() as AnyRecord;
        const chatId = broadcastChatId(data);
        // A recipient must have a valid chat id AND not be explicitly
        // disconnected. Legacy records without isBotConnected still count.
        if (!chatId || data.isBotConnected === false) continue;
        byChat.set(chatId, {
          userUid: d.id,
          name: data.fullName || data.displayName || data.name || '',
          telegramUsername: typeof data.telegramUsername === 'string' ? data.telegramUsername : undefined,
          phone: typeof data.phone === 'string' ? data.phone : undefined,
          chatId,
        });
      }
      lastDoc = snap.docs[snap.docs.length - 1];
    }
  } catch (err: any) {
    console.error('[TELEGRAM BROADCAST] scanLinkedUsers xatosi:', err?.message || String(err));
  }
  return byChat;
}

function statusMatches(status: unknown, filter: string): boolean {
  const s = String(status || '').trim().toLowerCase();
  if (filter === 'all') return true;
  if (filter === 'new') return s === 'yangi' || s === 'new';
  if (filter === 'in_progress') return s === 'jarayonda' || s === "bog'lanildi" || s === 'boglanildi';
  return true;
}

function searchMatches(search: string, values: (string | undefined)[]): boolean {
  const needle = search.trim().toLowerCase();
  if (!needle) return true;
  return values.some((v) => v && v.toLowerCase().includes(needle));
}

/** All CRM users with a valid linked Telegram chat (optionally filtered). */
export async function resolveConnectedBroadcastRecipients(
  opts: { q?: string; limit?: number; scanLimit?: number }
): Promise<{ recipients: BroadcastRecipient[]; total: number }> {
  const linked = await scanLinkedUsers(opts?.scanLimit || 1000);
  const search = (opts?.q || '').trim();
  const limit = Math.min(Math.max(opts?.limit || 100, 1), 500);
  const matches = [...linked.entries()]
    .map(([, r]) => r)
    .filter((r) => searchMatches(search, [r.name, r.telegramUsername, r.phone]))
    .sort((a, b) => a.name.localeCompare(b.name, 'uz'));
  return { recipients: matches.slice(0, limit), total: matches.length };
}

/** Recipients derived from Telegram-origin Murojaatlar, joined to linked users. */
export async function resolveMurojaatlarBroadcastRecipients(
  opts: {
    type?: 'all' | 'trial' | 'question';
    status?: 'all' | 'new' | 'in_progress';
    q?: string;
    limit?: number;
    scanLimit?: number;
  }
): Promise<{ recipients: BroadcastRecipient[]; total: number }> {
  const db = getFirestore();
  const byChat = await scanLinkedUsers(opts?.scanLimit || 1000);
  const empty = { recipients: [], total: 0 };
  if (!db || byChat.size === 0) return empty;
  const scanLimit = Math.min(Math.max(opts?.scanLimit || 1000, 1), 2000);
  const limit = Math.min(Math.max(opts?.limit || 100, 1), 500);
  const search = (opts?.q || '').trim();
  const seen = new Set<string>();
  const recipients: BroadcastRecipient[] = [];

  const collect = (data: AnyRecord, docId: string, kind: 'trial' | 'question') => {
    const chatId = broadcastChatId(data);
    if (!chatId) return;
    const linked = byChat.get(chatId);
    if (!linked) return;
    const rawStatus = data.status || (kind === 'trial' ? 'Yangi' : 'New');
    if (!statusMatches(rawStatus, opts?.status || 'all')) return;
    const name = linked.name || data.fullName || data.name || data.phone || '';
    if (!searchMatches(search, [name, linked.telegramUsername, linked.phone, data.fullName, data.name])) return;
    if (!seen.has(linked.userUid)) {
      seen.add(linked.userUid);
      recipients.push({
        ...linked,
        name,
        murojaatKind: kind,
        murojaatStatus: String(rawStatus),
        murojaatId: docId,
      });
    }
  };

  try {
    if (opts?.type !== 'question') {
      const snap = await db.collection('leads').where('source', '==', 'telegram').limit(scanLimit).get();
      snap.forEach((d) => collect(d.data() as AnyRecord, d.id, 'trial'));
    }
    if (opts?.type !== 'trial') {
      const snap = await db.collection('questions').where('source', '==', 'telegram').limit(scanLimit).get();
      snap.forEach((d) => collect(d.data() as AnyRecord, d.id, 'question'));
    }
  } catch (err: any) {
    console.error('[TELEGRAM BROADCAST] resolveMurojaatlarBroadcastRecipients xatosi:', err?.message || String(err));
  }

  recipients.sort((a, b) => a.name.localeCompare(b.name, 'uz'));
  return { recipients: recipients.slice(0, limit), total: recipients.length };
}

async function mapWithConcurrency<T, R>(items: T[], concurrency: number, fn: (item: T, index: number) => Promise<R>): Promise<R[]> {
  const out: R[] = new Array(items.length);
  let next = 0;
  const workers = Array.from({ length: Math.min(concurrency, Math.max(items.length, 1)) }, async () => {
    while (next < items.length) {
      const i = next++;
      out[i] = await fn(items[i], i);
    }
  });
  await Promise.all(workers);
  return out;
}

/**
 * Send one message to the given CRM user uids. Chat ids are always resolved
 * server-side; users without a valid linked chat are marked skipped. History is
 * persisted only when at least one user was actually attempted.
 */
export async function runBroadcastToUsers(input: {
  userUids: string[];
  message: string;
  createdBy?: string;
  createdByName?: string;
}): Promise<BroadcastRunOutput> {
  const db = getFirestore();
  const text = (input.message || '').trim().slice(0, 4096);
  const empty: BroadcastRunOutput = { broadcastId: null, total: 0, sent: 0, failed: 0, skipped: 0, results: [] };
  if (!db || !text) return empty;

  const uids = [...new Set(input.userUids.map(String))].slice(0, BROADCAST_MAX_RECIPIENTS);
  const createdByName = input.createdByName || 'Administrator';

  // Resolve chat ids for each requested user (batch of 10 per 'in' query).
  const nameByUid = new Map<string, string>();
  const usernameByUid = new Map<string, string>();
  const targets: { userUid: string; chatId: string; name: string; username?: string }[] = [];
  const skippedResults: BroadcastResultEntry[] = [];
  for (let i = 0; i < uids.length; i += 10) {
    const chunk = uids.slice(i, i + 10);
    try {
      const snap = await db.collection('users').where('__name__', 'in', chunk).get();
      const found = new Set<string>();
      snap.forEach((d) => {
        found.add(d.id);
        const data = d.data() as AnyRecord;
        const name = data.fullName || data.displayName || data.name || '';
        const username = typeof data.telegramUsername === 'string' ? data.telegramUsername : undefined;
        const chatId = broadcastChatId(data);
        if (chatId) {
          targets.push({ userUid: d.id, chatId, name, username });
        } else {
          skippedResults.push({ userUid: d.id, name, telegramUsername: username, status: 'skipped' as const });
        }
      });
      for (const uid of chunk) {
        if (!found.has(uid)) {
          skippedResults.push({ userUid: uid, name: '', status: 'skipped' as const });
        }
      }
    } catch (err: any) {
      console.error('[TELEGRAM BROADCAST] uid resolver xatosi:', err?.message || String(err));
      for (const uid of chunk) skippedResults.push({ userUid: uid, name: '', status: 'skipped' as const });
    }
  }

  if (targets.length === 0) {
    return { broadcastId: null, total: skippedResults.length, sent: 0, failed: 0, skipped: skippedResults.length, results: skippedResults };
  }

  // Persist the broadcast record first so outbound messages can reference it.
  const now = new Date().toISOString();
  let broadcastId: string | null = null;
  try {
    const ref = await db.collection(BROADCAST_COLLECTION).add({
      message: text,
      createdAt: now,
      createdBy: input.createdBy || null,
      createdByName,
      recipientCount: targets.length + skippedResults.length,
      sentCount: 0,
      failedCount: 0,
      skippedCount: skippedResults.length,
      status: 'in_progress',
    });
    broadcastId = ref.id;
  } catch (err: any) {
    console.error('[TELEGRAM BROADCAST] history yaratish xatosi:', err?.message || String(err));
  }

  let sent = 0;
  let failed = 0;
  const sentResults: BroadcastResultEntry[] = [];
  const failedResults: BroadcastResultEntry[] = [];

  const attempt = async (target: { userUid: string; chatId: string; name: string; username?: string }) => {
    const result = await sendTelegramMessageDetailed(target.chatId, text);
    if (result.ok) {
      sent++;
      sentResults.push({
        userUid: target.userUid,
        name: target.name,
        telegramUsername: target.username,
        status: 'sent',
      });
      if (broadcastId) {
        try {
          await saveTelegramMessage({
            userUid: target.userUid,
            chatId: target.chatId,
            direction: 'outbound',
            text,
            telegramMessageId: result.telegramMessageId,
            sentByUid: input.createdBy,
            sentByName: createdByName,
            broadcastId,
            status: 'sent',
            createdAt: new Date().toISOString(),
          });
        } catch (e: any) {
          console.error('[TELEGRAM BROADCAST] outbound tarix saqlanmadi:', e?.message || String(e));
        }
      }
    } else {
      failed++;
      failedResults.push({
        userUid: target.userUid,
        name: target.name,
        telegramUsername: target.username,
        status: 'failed',
        error: result.error,
      });
    }
  };

  try {
    await mapWithConcurrency(targets, BROADCAST_CONCURRENCY, attempt);
  } catch (err: any) {
    console.error('[TELEGRAM BROADCAST] yuborish qatlliligi:', err?.message || String(err));
  }

  const results = [...sentResults, ...failedResults, ...skippedResults];

  if (broadcastId) {
    try {
      await db.collection(BROADCAST_COLLECTION).doc(broadcastId).update({
        sentCount: sent,
        failedCount: failed,
        skippedCount: skippedResults.length,
        status: 'completed',
      });
      const resultCol = db.collection(`${BROADCAST_COLLECTION}/${broadcastId}/results`);
      await Promise.all(
        skippedResults.map((r) => resultCol.add({ ...r, createdAt: now }))
      );
      await mapWithConcurrency(sentResults, 8, (r) => resultCol.add({ ...r, createdAt: now }).then(() => undefined));
      await mapWithConcurrency(failedResults, 8, (r) => resultCol.add({ ...r, createdAt: now }).then(() => undefined));
    } catch (err: any) {
      console.error('[TELEGRAM BROADCAST] natijalar saqlanmadi:', err?.message || String(err));
    }
  }

  return {
    broadcastId,
    total: results.length,
    sent,
    failed,
    skipped: skippedResults.length,
    results,
  };
}

/** Broadcast history (newest first). */
export async function fetchBroadcastHistory(limit = 20): Promise<BroadcastHistoryItem[]> {
  const db = getFirestore();
  if (!db) return [];
  try {
    const snap = await db
      .collection(BROADCAST_COLLECTION)
      .orderBy('createdAt', 'desc')
      .limit(Math.min(Math.max(limit, 1), 50))
      .get();
    return snap.docs.map((d) => {
      const data = d.data() as AnyRecord;
      return {
        id: d.id,
        message: data.message || '',
        createdAt: data.createdAt || '',
        createdBy: typeof data.createdBy === 'string' ? data.createdBy : null,
        createdByName: data.createdByName || 'Administrator',
        recipientCount: Number(data.recipientCount) || 0,
        sentCount: Number(data.sentCount) || 0,
        failedCount: Number(data.failedCount) || 0,
        skippedCount: Number(data.skippedCount) || 0,
        status: (data.status === 'completed' ? 'completed' : 'completed') as 'completed',
      };
    });
  } catch (err: any) {
    console.error('[TELEGRAM BROADCAST] tarix o\'qilmadi:', err?.message || String(err));
    return [];
  }
}

/** Per-recipient results for one broadcast (newest first). */
export async function fetchBroadcastResults(broadcastId: string): Promise<{ broadcast: BroadcastHistoryItem | null; results: BroadcastResultEntry[] }> {
  const db = getFirestore();
  if (!db) return { broadcast: null, results: [] };
  try {
    const docSnap = await db.collection(BROADCAST_COLLECTION).doc(broadcastId).get();
    if (!docSnap.exists) return { broadcast: null, results: [] };
    const data = docSnap.data() as AnyRecord;
    const broadcast: BroadcastHistoryItem = {
      id: broadcastId,
      message: data.message || '',
      createdAt: data.createdAt || '',
      createdBy: typeof data.createdBy === 'string' ? data.createdBy : null,
      createdByName: data.createdByName || 'Administrator',
      recipientCount: Number(data.recipientCount) || 0,
      sentCount: Number(data.sentCount) || 0,
      failedCount: Number(data.failedCount) || 0,
      skippedCount: Number(data.skippedCount) || 0,
      status: 'completed',
    };
    const snap = await db
      .collection(`${BROADCAST_COLLECTION}/${broadcastId}/results`)
      .orderBy('createdAt', 'desc')
      .limit(500)
      .get();
    const results = snap.docs.map((d) => d.data() as BroadcastResultEntry);
    return { broadcast, results };
  } catch (err: any) {
    console.error('[TELEGRAM BROADCAST] natijalar o\'qilmadi:', err?.message || String(err));
    return { broadcast: null, results: [] };
  }
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