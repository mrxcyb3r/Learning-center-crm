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