import { Murojaat, MurojaatKind, MurojaatSource, MurojaatStatus, MurojaatSummary } from '../types/crm';

export const MUROJAAT_STATUSES: MurojaatStatus[] = ['Yangi', "Bog'lanildi", 'Jarayonda', 'Yakunlandi', 'Bekor qilindi'];

/** Raw Firestore `source` values that normalize to the website. */
const SITE_SOURCE_VALUES = [
  'Sayt orqali ariza',
  'Bosh sahifa (Hero forma)',
  'Veb-sayt Sinov Darsi Modali',
  'Website',
  'Course Page',
];

/** Raw status values (both the English workflow and legacy Uzbek vocabulary). */
const STATUS_MAP: Record<string, MurojaatStatus> = {
  // Canonical Uzbek inbox vocabulary
  'Yangi': 'Yangi',
  "Bog'lanildi": "Bog'lanildi",
  'Jarayonda': 'Jarayonda',
  'Yakunlandi': 'Yakunlandi',
  'Bekor qilindi': 'Bekor qilindi',
  // Legacy lead values (English CRM workflow)
  New: 'Yangi',
  Contacted: "Bog'lanildi",
  'Follow-up': 'Jarayonda',
  'Trial Scheduled': 'Jarayonda',
  'Trial Completed': 'Yakunlandi',
  Enrolled: 'Yakunlandi',
  Lost: 'Bekor qilindi',
  // Legacy lead values (Uzbek workflow)
  'Sinov darsi belgilandi': 'Jarayonda',
  'Sinov darsi yakunlandi': 'Yakunlandi',
  "O'quvchiga aylandi": 'Yakunlandi',
  "Yo'qotildi": 'Bekor qilindi',
};

export function normalizeMurojaatSource(origSource?: string | null): MurojaatSource {
  const raw = (origSource || '').trim().toLowerCase();
  if (!raw) return 'website';
  if (raw === 'telegram' || raw.includes('telegram') || raw.includes('@')) return 'telegram';
  return 'website';
}

export function isTelegramSource(origSource?: string | null): boolean {
  return normalizeMurojaatSource(origSource) === 'telegram';
}

export function normalizeMurojaatStatus(rawStatus?: string | null): MurojaatStatus {
  const raw = (rawStatus || '').trim();
  if (!raw) return 'Yangi';
  return STATUS_MAP[raw] ?? 'Yangi';
}

/** Build a normalized inbox row from a raw `leads` or `questions` document. */
export function toMurojaat(raw: Record<string, any>, kind: MurojaatKind): Murojaat {
  const isLead = kind === 'trial';
  const name = String(raw.name || raw.fullName || raw.full_name || '').trim();
  // Leads carry their booking context in `notes`; questions carry `message`.
  const message = String(raw.message || raw.notes || '').trim();
  const origSource = String(raw.source || '').trim();
  const course = String(
    raw.course || (isLead ? '' : raw.subject || '')
  ).trim();

  return {
    id: String(raw.id || ''),
    kind,
    source: normalizeMurojaatSource(origSource),
    origSource,
    name: name || 'Noma\'lum',
    phone: String(raw.phone || '').trim(),
    course,
    message,
    status: normalizeMurojaatStatus(raw.status),
    isRead: raw.isRead === true,
    telegramChatId: raw.telegramChatId ? String(raw.telegramChatId) : undefined,
    telegramUsername: raw.telegramUsername ? String(raw.telegramUsername).replace(/^@/, '') : undefined,
    telegramUserId: raw.telegramUserId ? String(raw.telegramUserId) : undefined,
    notes: raw.notes ? String(raw.notes) : undefined,
    createdAt: raw.createdAt ? String(raw.createdAt) : '',
    updatedAt: raw.updatedAt ? String(raw.updatedAt) : undefined,
    assignedTo: raw.assignedTo ? String(raw.assignedTo) : undefined,
    preferredContact: raw.preferredContact ? String(raw.preferredContact) : undefined,
    trialDateTime: raw.trialDateTime ? String(raw.trialDateTime) : undefined,
    email: raw.email ? String(raw.email) : undefined,
  };
}

export function summarizeMurojaat(list: Murojaat[]): MurojaatSummary {
  return {
    total: list.length,
    newCount: list.filter((m) => m.status === 'Yangi').length,
    unread: list.filter((m) => !m.isRead).length,
    telegram: list.filter((m) => m.source === 'telegram').length,
    website: list.filter((m) => m.source === 'website').length,
  };
}

export function sortMurojaatNewestFirst(list: Murojaat[]): Murojaat[] {
  return [...list].sort(
    (a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
  );
}