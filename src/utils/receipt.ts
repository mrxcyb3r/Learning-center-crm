/**
 * Receipt helpers — shared by the on-screen document, the PDF generator and
 * the dedicated print window so every representation shows identical data.
 *
 * The receipt number is deterministic: an existing stored reference is
 * preserved, otherwise it is derived from the payment's stable document id.
 * Reopening the same payment therefore always shows the same number.
 */

import { toSafeNumber } from './format';

export interface ReceiptCenter {
  name?: string;
  address?: string;
  phone?: string;
  /** STIR/INN (taxpayer id) — shown only when the center actually configured one. */
  stir?: string;
  /** Telegram link/username — shown only when configured. */
  telegram?: string;
  workingHours?: string;
}

const UZ_MONTHS = [
  'Yanvar', 'Fevral', 'Mart', 'Aprel', 'May', 'Iyun',
  'Iyul', 'Avgust', 'Sentyabr', 'Oktyabr', 'Noyabr', 'Dekabr',
];

export function currentMonthLabel(): string {
  const now = new Date();
  return `${UZ_MONTHS[now.getMonth()]} ${now.getFullYear()}`;
}

/** Stable human-readable receipt reference. Preserves existing ids. */
export function getReceiptNumber(payment: { id?: string; receiptNumber?: string; receiptRef?: string }): string {
  const stored = payment?.receiptNumber || payment?.receiptRef;
  if (stored && typeof stored === 'string' && stored.trim()) return stored.trim();
  if (payment?.id && typeof payment.id === 'string' && payment.id.trim()) {
    return `REC-${payment.id.replace(/[^a-zA-Z0-9]/g, '').slice(-8).toUpperCase()}`;
  }
  return 'REC-00000000';
}

/** "350 000 UZS" — group thousands with ordinary spaces. */
export function formatUzsAmount(value: unknown): string {
  const n = toSafeNumber(value);
  if (!isFinite(n)) return '0 UZS';
  const grouped = String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  return `${grouped} UZS`;
}

/** "350 000" without the currency suffix (for table cells). */
export function formatUzsPlain(value: unknown): string {
  const n = toSafeNumber(value);
  if (!isFinite(n)) return '0';
  return String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
}

/** "2026-09-12" → "12.09.2026". Returns '-' for invalid input. */
export function formatReceiptDate(value: unknown): string {
  if (value == null || value === '') return '-';
  const s = String(value);
  const m = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (m) return `${m[3].padStart(2, '0')}.${m[2].padStart(2, '0')}.${m[1]}`;
  try {
    const d = new Date(s);
    if (isNaN(d.getTime())) return '-';
    const dd = String(d.getDate()).padStart(2, '0');
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    return `${dd}.${mm}.${d.getFullYear()}`;
  } catch {
    return '-';
  }
}

/** Extract "HH:MM" from an ISO/date value if present, else null. */
export function extractReceiptTime(value: unknown): string | null {
  if (value == null || value === '') return null;
  const s = String(value);
  const m = s.match(/T(\d{2}):(\d{2})/);
  if (m) return `${m[1]}:${m[2]}`;
  return null;
}

export function methodLabel(method: unknown): string {
  switch (String(method).toLowerCase()) {
    case 'cash': return 'Naqd pul';
    case 'card': return 'Bank kartasi';
    case 'click': return 'Click';
    case 'payme': return 'Payme';
    default: {
      const s = String(method ?? '').trim();
      return s || '—';
    }
  }
}

export function statusLabel(status: unknown): string {
  switch (String(status).toLowerCase()) {
    case 'paid': case 'completed': case 'sent': case 'delivered': return 'TO\'LANDI';
    case 'voided': return 'BEKOR QILINGAN';
    case 'pending': case 'refunded': case 'failed': return String(status).toUpperCase();
    default: {
      const s = String(status ?? '').trim();
      return s || 'TO\'LANDI';
    }
  }
}

const PLACEHOLDER_COURSE = new Set([
  '', '—', '-', 'N/A', 'n/a', 'Kurs to\'lovi', 'kurs', 'none', 'None',
]);

/** True when the string is an empty/placeholder value that should be skipped. */
function isMeaningful(value: unknown): boolean {
  if (value == null) return false;
  const s = String(value).trim();
  if (!s) return false;
  return !PLACEHOLDER_COURSE.has(s);
}

/**
 * Resolve the course name for a receipt, never inventing data.
 * Order: explicit payment.courseName → payment.course → the payment's own
 * group reference (cohortGroup/groupName) → neutral 'Kurs to'lovi' fallback.
 */
export function resolveCourseName(payment: {
  courseName?: unknown;
  course?: unknown;
  cohortGroup?: unknown;
  groupName?: unknown;
}): string {
  const candidates = [payment.courseName, payment.course, payment.cohortGroup, payment.groupName];
  for (const c of candidates) {
    if (isMeaningful(c)) return String(c).trim();
  }
  return 'Kurs to\'lovi';
}

/** Verified link a client QR points at (public verification page). */
export function receiptVerificationUrl(payment: { id?: unknown }): string {
  const id = typeof payment?.id === 'string' ? payment.id.trim() : '';
  if (!id) return '';
  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  return `${origin}/receipt/verify/${encodeURIComponent(id)}`;
}

export type ReceiptStatusVariant = 'paid' | 'voided' | 'other';

export interface ReceiptStatusSettings {
  label: string;
  variant: ReceiptStatusVariant;
  /** Tailwind classes for the pill badge (paid uses the required palette). */
  badge: string;
  /** UG-CSS text color used by the PDF renderer (RGB). */
  textRgb: [number, number, number];
  bgRgb: [number, number, number];
}

/** Status → badge styling shared by the on-screen document and the PDF. */
export function receiptStatusSettings(status: unknown): ReceiptStatusSettings {
  const s = String(status ?? '').toLowerCase();
  if (s === 'voided' || s === 'failed' || s === 'refunded' || s === 'pending') {
    return {
      label: statusLabel(status),
      variant: 'voided',
      badge: 'bg-[#FDE8E8] text-[#9B1C1C] border border-rose-200',
      textRgb: [155, 28, 28],
      bgRgb: [253, 232, 232],
    };
  }
  return {
    label: statusLabel(status),
    variant: 'paid',
    badge: 'bg-[#DEF7EC] text-[#03543F] border border-emerald-200',
    textRgb: [3, 84, 63],
    bgRgb: [222, 247, 236],
  };
}

/** True when the payment is active (not voided / not failed). */
export function isPaidStatus(status: unknown): boolean {
  const s = String(status ?? '').toLowerCase();
  return !(s === 'voided' || s === 'failed' || s === 'pending' || s === 'refunded');
}

/** Sanitize text for the PDF (Latin‑1 safe, keeps Uzbek apostrophes as ASCII). */
export function toPdfPlain(value: unknown): string {
  return String(value ?? '')
    .replace(/[\u02BB\u02BC\u2019\u0060]/g, "'")
    .replace(/\u00A0/g, ' ')
    .replace(/[^\x20-\xFF]/g, '?');
}

/** Escape text for HTML (print window). */
export function htmlEscape(value: unknown): string {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/**
 * Single source of truth for the receipt's displayed values. Every renderer
 * (React document, PDF, print window) consumes this so the three can never
 * drift apart. Returns only data-conditional values — no invented defaults.
 */
export interface ReceiptLayoutData {
  receiptNum: string;
  dateStr: string;
  time: string | null;
  datetime: string;
  student: string;
  course: string;
  period: string;
  method: string;
  trxId: string;
  hasTrx: boolean;
  status: ReceiptStatusSettings;
  amountPlain: string;
  amountTotal: string;
  verificationUrl: string;
  center: ReceiptCenter;
  /** Credential lines from center config; empty when not configured (never faked). */
  credentialLines: string[];
}

export function buildReceiptLayoutData(
  payment: {
    id?: unknown;
    studentName?: unknown;
    course?: unknown;
    courseName?: unknown;
    cohortGroup?: unknown;
    groupName?: unknown;
    month?: unknown;
    paymentPeriod?: unknown;
    method?: unknown;
    paymentMethod?: unknown;
    trxId?: unknown;
    amount?: unknown;
    status?: unknown;
    paymentStatus?: unknown;
    date?: unknown;
    createdAt?: unknown;
  },
  center: ReceiptCenter
): ReceiptLayoutData {
  const receiptNum = getReceiptNumber(payment as any);
  const dateStr = formatReceiptDate(payment.date);
  const time = extractReceiptTime(payment.createdAt);
  const datetime = time ? `${dateStr} ${time}` : dateStr;
  const student = String(payment.studentName ?? '').trim() || '—';
  const course = resolveCourseName(payment);
  const period = String(payment.month || payment.paymentPeriod || '').trim() || '—';
  const method = methodLabel(payment.method || payment.paymentMethod);
  const trxId = String(payment.trxId ?? '').trim();
  const status = receiptStatusSettings(payment.status || payment.paymentStatus);
  const amountPlain = formatUzsPlain(payment.amount);
  const amountTotal = formatUzsAmount(payment.amount);
  const verificationUrl = receiptVerificationUrl(payment);

  const credentialLines: string[] = [];
  if (center.name && String(center.name).trim()) credentialLines.push(String(center.name).trim());
  if (center.stir && String(center.stir).trim()) credentialLines.push(`STIR: ${String(center.stir).trim()}`);
  if (center.address && String(center.address).trim()) credentialLines.push(String(center.address).trim());
  if (center.phone && String(center.phone).trim()) credentialLines.push(`Tel: ${String(center.phone).trim()}`);
  if (center.telegram && String(center.telegram).trim()) credentialLines.push(`Telegram: ${String(center.telegram).trim()}`);
  if (center.workingHours && String(center.workingHours).trim()) credentialLines.push(`Ish vaqti: ${String(center.workingHours).trim()}`);

  return {
    receiptNum,
    dateStr,
    time,
    datetime,
    student,
    course,
    period,
    method,
    trxId,
    hasTrx: Boolean(trxId),
    status,
    amountPlain,
    amountTotal,
    verificationUrl,
    center,
    credentialLines,
  };
}