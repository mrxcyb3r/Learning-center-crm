/**
 * Shared dashboard data helpers for the Admin ERP dashboard.
 *
 * All metrics derived through these helpers use ONE interpretation of the
 * underlying Firestore records so the dashboard always agrees with the
 * Students / Payments / Groups / Leads pages:
 *
 * - Payments: only `collected` records count toward revenue. `pending`
 *   records never count; `voided`/`refunded` records never count.
 * - Debtors: same definition as StudentsView — debtAmount > 0 OR
 *   paymentStatus === 'Overdue' (with 'Due' surfaced as "kutilmoqda",
 *   not as overdue debt).
 * - Active students: status Active / Trial / Paused.
 */

export type CollectedState = 'collected' | 'pending' | 'voided';

/**
 * Normalize the dual payment-status vocabulary stored in the shared
 * `payments` collection:
 * - CRM writes: 'Completed' | 'Pending' | 'Voided'
 * - Canonical/teacher writes: 'paid' | 'pending' | 'refunded' (+ legacy
 *   provider mirrors: 'Sent' | 'Delivered' | 'Failed')
 */
export function normalizePaymentCollection(status: unknown): CollectedState {
  const s = String(status ?? '').trim().toLowerCase();
  if (s === 'completed' || s === 'paid' || s === 'sent' || s === 'delivered') return 'collected';
  if (s === 'voided' || s === 'void' || s === 'refunded' || s === 'refund' || s === 'failed') return 'voided';
  return 'pending';
}

/** True when the payment record counts toward collected revenue. */
export function isCollectedPayment(status: unknown): boolean {
  return normalizePaymentCollection(status) === 'collected';
}

export type CanonicalPaymentRecordStatus = 'Completed' | 'Pending' | 'Voided';

/**
 * Single canonical payment-status representation for writes.
 * - collected (paid/Paid/Completed/Sent/Delivered) → 'Completed'
 * - voided (Voided/refunded/Failed) → 'Voided' (never counts as revenue)
 * - everything else → 'Pending'
 * Applied at the service boundary (recordPayment/recordPaymentWithInvoice/
 * updatePaymentStatus); reads keep accepting legacy variants so existing
 * seeded data renders unchanged.
 */
export function canonicalPaymentStatus(status: unknown): CanonicalPaymentRecordStatus {
  const c = normalizePaymentCollection(status);
  if (c === 'collected') return 'Completed';
  if (c === 'voided') return 'Voided';
  return 'Pending';
}

/**
 * Safely parse a record date. Accepts ISO strings, `YYYY-MM-DD` strings,
 * JS Dates and Firestore Timestamps. Returns null when unparseable —
 * callers must skip such records rather than guessing.
 */
export function parseRecordDate(value: unknown): Date | null {
  if (!value) return null;
  try {
    if (value instanceof Date) {
      return isNaN(value.getTime()) ? null : value;
    }
    if (typeof value === 'object') {
      const ts = value as { toDate?: () => Date; seconds?: number };
      if (typeof ts.toDate === 'function') {
        const d = ts.toDate();
        return isNaN(d.getTime()) ? null : d;
      }
      if (typeof ts.seconds === 'number') {
        const d = new Date(ts.seconds * 1000);
        return isNaN(d.getTime()) ? null : d;
      }
      return null;
    }
    if (typeof value === 'string' || typeof value === 'number') {
      const d = new Date(value);
      return isNaN(d.getTime()) ? null : d;
    }
    return null;
  } catch {
    return null;
  }
}

/** `YYYY-MM` key for month-bucket comparisons. */
export function monthKeyOf(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

export function isSameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

/** Last N month keys (oldest first), each with a short Uzbek label. */
const UZ_MONTHS_SHORT = ['Yan', 'Fev', 'Mar', 'Apr', 'May', 'Iyn', 'Iyl', 'Avg', 'Sen', 'Okt', 'Noy', 'Dek'];

export function lastNMonths(n: number, now = new Date()): { key: string; label: string }[] {
  const out: { key: string; label: string }[] = [];
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    out.push({ key: monthKeyOf(d), label: UZ_MONTHS_SHORT[d.getMonth()] });
  }
  return out;
}

// ---------------------------------------------------------------------------
// Group weekday matching ("Bugungi darslar")
//
// Group `days` are free-form Uzbek strings such as "Dush / Chor / Juma" or
// "Sesh / Pay". Matching splits the string into parts and compares the
// leading characters of each part, so "Dushanba" never collides with the
// Saturday ("Shanba") token via a raw substring test.
// ---------------------------------------------------------------------------

const DAY_TOKENS: Record<number, string[]> = {
  0: ['yak', 'sun'],
  1: ['dush', 'dushanba', 'mon'],
  2: ['sesh', 'seshanba', 'tue'],
  3: ['chor', 'chorshanba', 'wed'],
  4: ['pay', 'payshanba', 'thu'],
  5: ['jum', 'juma', 'fri'],
  6: ['shan', 'shanba', 'sat'],
};

export function groupMeetsOnWeekday(days: unknown, weekday: number): boolean {
  if (!days || typeof days !== 'string') return false;
  const tokens = DAY_TOKENS[weekday] ?? [];
  if (tokens.length === 0) return false;
  const parts = days
    .toLowerCase()
    .split(/[\/,;|]+/)
    .map((p) => p.trim())
    .filter(Boolean);
  return parts.some((part) => tokens.some((tok) => part.startsWith(tok)));
}

export function groupMeetsToday(days: unknown, now = new Date()): boolean {
  return groupMeetsOnWeekday(days, now.getDay());
}

/** Extract the leading "HH:MM" start time from strings like "18:00 - 19:30". */
export function classStartMinutes(time: unknown): number {
  if (typeof time !== 'string') return Number.MAX_SAFE_INTEGER;
  const m = time.match(/(\d{1,2}):(\d{2})/);
  if (!m) return Number.MAX_SAFE_INTEGER;
  return Number(m[1]) * 60 + Number(m[2]);
}

/** Time-of-day greeting key for the dashboard header. */
export function greetingKey(now = new Date()): 'morning' | 'day' | 'evening' {
  const h = now.getHours();
  if (h < 12) return 'morning';
  if (h < 18) return 'day';
  return 'evening';
}
