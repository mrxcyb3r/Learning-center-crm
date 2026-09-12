/**
 * Support request persistence — application-native (client writes straight to
 * Firestore so the request is immediately visible to every support user, no
 * server round-trip required). The legacy POST /api/support route remains as a
 * fallback used only when the direct write is rejected, so this feature never
 * depends on the Node server being up.
 */

import {
  collection,
  addDoc,
  serverTimestamp,
  orderBy,
  query,
  limit,
  onSnapshot,
} from 'firebase/firestore';
import { db } from './firebase';
import { notificationsService } from './repository';

export type SupportPriority = 'oddiy' | 'muhim' | 'shoshilinch';

export interface SupportRequestInput {
  subject: string;
  message: string;
  priority: SupportPriority;
  userUid: string;
  userName: string;
  userEmail: string;
}

export interface SupportRequestDoc {
  id: string;
  subject?: string;
  message?: string;
  priority?: string;
  status?: string;
  userName?: string;
  userEmail?: string;
  userUid?: string;
  source?: string;
  createdAt?: unknown;
  handledAt?: unknown;
  resolvedAt?: unknown;
}

/**
 * Create a support request. Returns the document id on success, throws the
 * underlying error when both the direct write and the server fallback fail.
 */
export async function createSupportRequest(input: SupportRequestInput): Promise<string> {
  const payload = {
    subject: input.subject.slice(0, 200),
    message: input.message.slice(0, 2000),
    priority: input.priority,
    userName: input.userName,
    userEmail: input.userEmail,
    userUid: input.userUid,
    source: 'in_app',
    status: 'new',
    createdAt: serverTimestamp(),
    deliveredAt: null,
  };

  try {
    const docRef = await addDoc(collection(db, 'support_requests'), payload);
    notifySupportOfNewRequest(input, docRef.id).catch(() => undefined);
    return docRef.id;
  } catch (directErr) {
    // Fallback: trusted server route (Admin SDK) may still be reachable.
    try {
      const token = await (await import('./firebase')).auth.currentUser?.getIdToken();
      const res = await fetch('/api/support', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          subject: input.subject,
          message: input.message,
          priority: input.priority,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'So\'rov yuborishda xatolik');
      }
      const data = (await res.json()) as { id?: string };
      return data.id || '';
    } catch (fallbackErr) {
      console.warn('[supportService] direct va server yozuvi muvaffaqiyatsiz:', directErr, fallbackErr);
      throw directErr;
    }
  }
}

/** Best-effort in-app notification for the support inbox (rules-gated). */
async function notifySupportOfNewRequest(input: SupportRequestInput, requestId: string): Promise<void> {
  await notificationsService.createNotification({
    title: 'Yangi yordam so\'rovi',
    description: `${input.userName || input.userEmail || 'Foydalanuvchi'}: ${input.subject}`,
    category: 'announcement',
    recipientRole: 'support',
    isRead: false,
    createdAt: new Date().toISOString(),
    linkId: requestId,
    senderId: input.userUid,
    senderName: input.userName,
  });
}

export interface SupportSubscription {
  unsubscribe: () => void;
}

/** Live inbox — newest first, limited to the most recent 50 requests. */
export function subscribeSupportRequests(
  onItems: (items: SupportRequestDoc[]) => void,
  onError?: (message: string) => void
): SupportSubscription {
  const q = query(
    collection(db, 'support_requests'),
    orderBy('createdAt', 'desc'),
    limit(50)
  );
  const unsub = onSnapshot(
    q,
    (snap) => {
      onItems(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as SupportRequestDoc));
    },
    (err) => {
      console.warn('[supportService] tinglash xatolik:', err?.message || String(err));
      onError?.(err?.message || 'So\'rovlar yuklanmadi.');
    }
  );
  return { unsubscribe: unsub };
}