export interface BotStatusResponse {
  isConnected: boolean;
  telegramUsername?: string;
  chatId?: string;
  chatConnectedAt?: string;
  isRateLimited?: boolean;
  errorMessage?: string;
}

export interface BotHealthResponse {
  status: string;
  botUsername: string;
  mode: 'polling' | 'webhook';
  bridgeConnected: boolean;
  serverTime?: string;
}

export interface NotifyGradePayload {
  studentUid: string;
  title: string;
  score: string;
  feedback?: string;
  teacherName?: string;
}

export interface AssignPinPayload {
  userUid: string;
  pin: string;
}

export interface BroadcastResponse {
  success: boolean;
  totalConnected: number;
  sentCount: number;
  failedCount: number;
  message?: string;
  error?: string;
  isRateLimited?: boolean;
}

export interface TelegramChatMessage {
  id: string;
  userUid?: string;
  chatId: string;
  direction: 'inbound' | 'outbound';
  text: string;
  telegramMessageId?: string;
  sentByName?: string;
  createdAt: string;
  status: 'sent' | 'failed';
  error?: string;
}

export interface TelegramConversationResult {
  ok: boolean;
  messages: TelegramChatMessage[];
  userUid?: string | null;
  hasMore: boolean;
  error?: string;
}

export async function getTelegramConversation(
  chatId: string | number,
  opts?: { limit?: number; before?: string }
): Promise<TelegramConversationResult> {
  const token = await getFirebaseIdToken();
  if (!token) {
    return { ok: false, messages: [], userUid: null, hasMore: false, error: 'Firebase admin sessiyasi topilmadi.' };
  }
  try {
    const params = new URLSearchParams({ chatId: String(chatId), limit: String(opts?.limit ?? 50) });
    if (opts?.before) params.set('before', opts.before);
    const response = await fetch(`/api/telegram/messages?${params.toString()}`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store',
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      return {
        ok: false,
        messages: [],
        userUid: null,
        hasMore: false,
        error: (data as any)?.error || (data as any)?.reason || 'Xabarlarni yuklab bo\'lmadi.',
      };
    }
    return {
      ok: Boolean((data as any)?.ok),
      messages: ((data as any)?.messages as TelegramChatMessage[]) || [],
      userUid: (data as any)?.userUid ?? null,
      hasMore: Boolean((data as any)?.hasMore),
      error: undefined,
    };
  } catch (err: any) {
    return { ok: false, messages: [], userUid: null, hasMore: false, error: err?.message || 'Xabarlarni yuklashda xatolik.' };
  }
}

export async function sendTelegramReply(input: {
  userUid?: string | null;
  chatId: string | number;
  text: string;
}): Promise<{ ok: boolean; record?: TelegramChatMessage; error?: string }> {
  const token = await getFirebaseIdToken();
  if (!token) {
    return { ok: false, error: 'Firebase admin sessiyasi topilmadi — qayta tizimga kiring.' };
  }
  try {
    const response = await fetch('/api/telegram/reply', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        userUid: input.userUid || undefined,
        chatId: String(input.chatId),
        text: input.text,
      }),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      const reason = (data as any)?.reason;
      const friendly =
        reason === 'doc_read_error'
          ? 'Firestore ulanish xatosi.'
          : reason
            ? `Ruxsat rad etildi (${reason}).`
            : '';
      return { ok: false, error: (data as any)?.error || friendly || 'Xabar yuborilmadi.' };
    }
    if (!(data as any)?.ok) {
      return { ok: false, error: (data as any)?.error || 'Telegram xabarni yuborolmadi.' };
    }
    return { ok: true, record: (data as any)?.record };
  } catch (err: any) {
    return { ok: false, error: err?.message || 'Xabar yuborishda xatolik.' };
  }
}

// Client-side bot username for deep links. Set it via the Vite-exposed
// VITE_TELEGRAM_BOT_USERNAME so it can follow the server-side deployment
// (TELEGRAM_BOT_USERNAME); falls back only when a deployment never sets it.
export const BOT_USERNAME: string =
  (import.meta.env.VITE_TELEGRAM_BOT_USERNAME as string | undefined)?.replace(/^@/, '') ||
  'centerflow_bot';

export interface TelegramBotInfo {
  id: number;
  username: string;
  firstName: string;
}

export interface TelegramWebhookInfo {
  url: string;
  expectedUrl?: string;
  isUrlMatched?: boolean;
  hasCustomCertificate?: boolean;
  pendingUpdateCount: number;
  lastError?: string | null;
  lastErrorDate?: number | null;
  lastSyncErrorDate?: number | null;
  maxConnections?: number | null;
  allowedUpdates?: string[];
  ipAddress?: string;
}

export interface TelegramServerStatus {
  connected: boolean;
  apiReachable?: boolean;
  mode: 'webhook' | 'polling';
  configured: {
    token: boolean;
    webhookSecret: boolean;
    adminChatId: boolean;
    publicUrl: string | null;
    expectedWebhookUrl?: string;
    firestore: boolean;
    firestoreProjectId?: string;
    firestoreErrorCode?: string;
    firestoreError?: string;
    runtimeServiceAccount?: string | null;
  };
  bot: TelegramBotInfo | null;
  webhook: TelegramWebhookInfo | null;
  serverTime?: string;
}

export async function getFirebaseIdToken(): Promise<string | null> {
  try {
    const { auth } = await import('./firebase');
    // Ensure the initial auth state is resolved before reading the current
    // user (on a fresh page load currentUser stays null until the
    // onAuthStateChanged listener has fired).
    try {
      await auth.authStateReady();
    } catch {
      // Older SDKs may not expose authStateReady; currentUser is read anyway.
    }
    const user = auth.currentUser;
    if (!user) return null;
    // Force a fresh mint so a stale/expired token is never sent.
    return await user.getIdToken(true);
  } catch (err) {
    console.warn('[telegram] Could not obtain Firebase ID token:', err);
    return null;
  }
}

export async function getTelegramStatus(): Promise<TelegramServerStatus | null> {
  try {
    const response = await fetch('/api/telegram/status', { cache: 'no-store' });
    if (!response.ok) return null;
    return await response.json();
  } catch (err) {
    console.warn('Telegram server status check failed:', err);
    return null;
  }
}

export async function setupTelegramWebhook(options?: {
  force?: boolean;
  dropPendingUpdates?: boolean;
  url?: string;
}): Promise<{
  ok: boolean;
  alreadyConfigured?: boolean;
  error?: string;
  description?: string;
  url?: string;
  webhook?: TelegramWebhookInfo;
}> {
  const token = await getFirebaseIdToken();
  if (!token) {
    return { ok: false, error: 'Firebase admin sessiyasi topilmadi — qayta tizimga kiring va yangi urinib ko\'ring.' };
  }
  try {
    const response = await fetch('/api/telegram/webhook/setup', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        force: options?.force ?? false,
        dropPendingUpdates: options?.dropPendingUpdates ?? true,
        url: options?.url,
      }),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok && (data as any).reason) {
      const r = (data as any).reason as string;
      const friendly = r === 'doc_read_error'
        ? 'Firestore ulanish xatosi — server loglarini tekshiring.'
        : 'Administrator maqomiga ega ekaningizni tekshiring.';
      return { ok: false, error: `Ruxsat rad etildi (${r}). ${friendly}` };
    }
    return {
      ok: response.ok && Boolean(data.ok),
      alreadyConfigured: Boolean(data.alreadyConfigured),
      error: data.error,
      description: data.description,
      url: data.url,
      webhook: data.webhook,
    };
  } catch (err: any) {
    return { ok: false, error: err?.message || 'Webhook sozlashda xatolik.' };
  }
}

export async function sendAdminTelegramMessage(chatId: string | number, text: string): Promise<{ ok: boolean; error?: string }> {
  const token = await getFirebaseIdToken();
  if (!token) {
    return { ok: false, error: 'Firebase admin sessiyasi topilmadi — qayta tizimga kiring va yangi urinib ko\'ring.' };
  }
  try {
    const response = await fetch('/api/telegram/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ chatId: String(chatId), text }),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok && (data as any).reason) {
      const r = (data as any).reason as string;
      const friendly = r === 'doc_read_error'
        ? 'Firestore ulanish xatosi — server loglarini tekshiring.'
        : 'Administrator maqomiga ega ekaningizni tekshiring.';
      return { ok: false, error: `Ruxsat rad etildi (${r}). ${friendly}` };
    }
    return { ok: response.ok && Boolean(data.ok), error: data.error };
  } catch (err: any) {
    return { ok: false, error: err?.message || 'Xabar yuborishda xatolik.' };
  }
}

export function getBotDeepLink(payload: string): string {
  return `https://t.me/${BOT_USERNAME}?start=${encodeURIComponent(payload)}`;
}

/**
 * Creates a one-time Telegram linking session document and returns the deep
 * link that opens the bot with `/start <sessionId>`. The server only consumes
 * sessions (never raw uids), so the CRM uid must be the signed-in user — the
 * Firestore rules enforce `userUid == request.auth.uid` on create.
 */
export async function createTelegramLinkSession(userUid: string): Promise<{ sessionId: string; deepLink: string }> {
  const sessionId = generateTelegramLinkSessionId();
  try {
    const { db } = await import('./firebase');
    const { doc, setDoc, serverTimestamp } = await import('firebase/firestore');
    await setDoc(doc(db, 'telegram_sessions', sessionId), {
      userUid,
      createdAt: serverTimestamp(),
      status: 'pending',
    });
  } catch (err) {
    console.warn('[telegram] Could not persist link session; deep link may not validate.', err);
  }
  return { sessionId, deepLink: getBotDeepLink(sessionId) };
}

function generateTelegramLinkSessionId(): string {
  const uuid =
    typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
      ? crypto.randomUUID().replace(/-/g, '').toUpperCase()
      : Math.random().toString(36).substring(2, 10) + Math.random().toString(36).substring(2, 10);
  return `CF_SESSION_${uuid.slice(0, 16)}`;
}

export async function checkBotHealth(): Promise<BotHealthResponse> {
  try {
    const response = await fetch('/api/bot/health');
    if (!response.ok) {
      return {
        status: 'error',
        botUsername: BOT_USERNAME,
        mode: 'polling',
        bridgeConnected: false
      };
    }
    const data = await response.json();
    return {
      status: data.status || 'ok',
      botUsername: data.botUsername || BOT_USERNAME,
      mode: data.mode || 'polling',
      bridgeConnected: Boolean(data.bridgeConnected),
      serverTime: data.serverTime
    };
  } catch (err) {
    console.warn('Bot health check failed:', err);
    return {
      status: 'offline',
      botUsername: BOT_USERNAME,
      mode: 'polling',
      bridgeConnected: false
    };
  }
}

export async function checkBotStatus(userUid: string): Promise<BotStatusResponse> {
  try {
    const response = await fetch(`/api/bot/status/${encodeURIComponent(userUid)}`);
    if (response.status === 429) {
      const errData = await response.json().catch(() => ({}));
      return {
        isConnected: false,
        isRateLimited: true,
        errorMessage: errData.message || 'Rate limit hit. Please wait a moment.'
      };
    }
    if (!response.ok) {
      return { isConnected: false };
    }
    const data = await response.json();
    return {
      isConnected: Boolean(data.isConnected),
      telegramUsername: data.telegramUsername,
      chatId: data.chatId,
      chatConnectedAt: data.chatConnectedAt
    };
  } catch (error) {
    console.warn('Error checking Telegram bot status:', error);
    return { isConnected: false };
  }
}

export async function assignUserPin(userUid: string, pin: string): Promise<{ success: boolean; message?: string; isRateLimited?: boolean }> {
  try {
    const response = await fetch('/api/bot/assign-pin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userUid, pin })
    });
    if (response.status === 429) {
      return { success: false, isRateLimited: true, message: 'Too many PIN assignment attempts. Slow down!' };
    }
    const data = await response.json();
    return { success: response.ok, message: data.message };
  } catch (error) {
    console.error('Error assigning PIN via Telegram service:', error);
    return { success: false, message: 'Network or server error.' };
  }
}

export async function sendGradeNotification(payload: NotifyGradePayload): Promise<boolean> {
  try {
    const response = await fetch('/api/bot/notify-grade', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    return response.ok;
  } catch (error) {
    console.error('Error sending grade notification via Telegram service:', error);
    return false;
  }
}

export async function sendGlobalBroadcast(message: string): Promise<BroadcastResponse> {
  const token = await getFirebaseIdToken();
  try {
    const response = await fetch('/api/bot/broadcast', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ message }),
    });
    if (response.status === 429) {
      const errData = await response.json().catch(() => ({}));
      return {
        success: false,
        totalConnected: 0,
        sentCount: 0,
        failedCount: 0,
        isRateLimited: true,
        error: errData.message || 'Rate limit hit for global broadcasts. Please wait 3 seconds.'
      };
    }
    const data = await response.json();
    if (!response.ok) {
      return {
        success: false,
        totalConnected: 0,
        sentCount: 0,
        failedCount: 0,
        error: data.error || `Broadcast failed${data.reason ? ` (${data.reason})` : ''}`
      };
    }
    return {
      success: true,
      totalConnected: data.totalConnected || 0,
      sentCount: data.sentCount || 0,
      failedCount: data.failedCount || 0,
      message: data.message
    };
  } catch (error: any) {
    console.error('Error executing broadcast:', error);
    return {
      success: false,
      totalConnected: 0,
      sentCount: 0,
      failedCount: 0,
      error: error?.message || 'Network error executing broadcast'
    };
  }
}

/* -------------------------------------------------------------------------
 * Professional broadcast helpers (Step 5)
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
}

export async function getBroadcastRecipients(
  opts: {
    scope?: 'connected' | 'murojaatlar';
    type?: 'all' | 'trial' | 'question';
    status?: 'all' | 'new' | 'in_progress';
    q?: string;
    limit?: number;
  } = {}
): Promise<{ ok: boolean; recipients: BroadcastRecipient[]; total: number; error?: string }> {
  const token = await getFirebaseIdToken();
  if (!token) {
    return { ok: false, recipients: [], total: 0, error: 'Firebase admin sessiyasi topilmadi.' };
  }
  try {
    const params = new URLSearchParams();
    params.set('scope', opts.scope || 'connected');
    if (opts.type) params.set('type', opts.type);
    if (opts.status) params.set('status', opts.status);
    if (opts.q) params.set('q', opts.q);
    if (opts.limit) params.set('limit', String(opts.limit));
    const response = await fetch(`/api/telegram/broadcast/recipients?${params.toString()}`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store',
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      return { ok: false, recipients: [], total: 0, error: (data as any)?.error || 'Qabul qiluvchilarni yuklab bo\'lmadi.' };
    }
    return { ok: Boolean((data as any)?.ok), recipients: ((data as any)?.recipients || []) as BroadcastRecipient[], total: Number((data as any)?.total) || 0 };
  } catch (err: any) {
    return { ok: false, recipients: [], total: 0, error: err?.message || 'Qabul qiluvchilarni yuklashda xatolik.' };
  }
}

export async function sendBroadcastV2(
  userUids: string[],
  message: string
): Promise<{
  ok: boolean;
  broadcastId?: string | null;
  total?: number;
  sent?: number;
  failed?: number;
  skipped?: number;
  results?: BroadcastResultEntry[];
  error?: string;
}> {
  const token = await getFirebaseIdToken();
  if (!token) {
    return { ok: false, error: 'Firebase admin sessiyasi topilmadi — qayta tizimga kiring.' };
  }
  try {
    const response = await fetch('/api/telegram/broadcast', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ userUids, message }),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok || !(data as any)?.ok) {
      return { ok: false, error: (data as any)?.error || 'Broadcast yuborilmadi.' };
    }
    return {
      ok: true,
      broadcastId: (data as any)?.broadcastId ?? null,
      total: (data as any)?.total ?? 0,
      sent: (data as any)?.sent ?? 0,
      failed: (data as any)?.failed ?? 0,
      skipped: (data as any)?.skipped ?? 0,
      results: ((data as any)?.results || []) as BroadcastResultEntry[],
    };
  } catch (err: any) {
    return { ok: false, error: err?.message || 'Broadcast yuborishda xatolik.' };
  }
}

export async function getBroadcastHistory(limit = 20): Promise<{ ok: boolean; history: BroadcastHistoryItem[]; error?: string }> {
  const token = await getFirebaseIdToken();
  if (!token) return { ok: false, history: [], error: 'Firebase admin sessiyasi topilmadi.' };
  try {
    const params = new URLSearchParams({ limit: String(limit) });
    const response = await fetch(`/api/telegram/broadcast/history?${params.toString()}`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store',
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) return { ok: false, history: [], error: (data as any)?.error || 'Tarixni yuklab bo\'lmadi.' };
    return { ok: Boolean((data as any)?.ok), history: ((data as any)?.history || []) as BroadcastHistoryItem[] };
  } catch (err: any) {
    return { ok: false, history: [], error: err?.message || 'Tarixni yuklashda xatolik.' };
  }
}

export async function getBroadcastResults(
  broadcastId: string
): Promise<{ ok: boolean; broadcast?: BroadcastHistoryItem; results: BroadcastResultEntry[]; error?: string }> {
  const token = await getFirebaseIdToken();
  if (!token) return { ok: false, results: [], error: 'Firebase admin sessiyasi topilmadi.' };
  try {
    const response = await fetch(`/api/telegram/broadcast/results/${encodeURIComponent(broadcastId)}`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store',
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) return { ok: false, results: [], error: (data as any)?.error || 'Natijalarni yuklab bo\'lmadi.' };
    return {
      ok: Boolean((data as any)?.ok),
      broadcast: (data as any)?.broadcast as BroadcastHistoryItem,
      results: ((data as any)?.results || []) as BroadcastResultEntry[],
    };
  } catch (err: any) {
    return { ok: false, results: [], error: err?.message || 'Natijalarni yuklashda xatolik.' };
  }
}
