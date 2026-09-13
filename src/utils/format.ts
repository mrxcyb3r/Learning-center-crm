/**
 * Centralized formatting helpers for the entire application.
 * Every numeric/date/phone display should go through these functions.
 * This prevents "Cannot read properties of undefined" crashes.
 */

/** Safely format a number as UZS currency. Handles undefined, null, NaN, strings. */
export function formatCurrency(value: unknown): string {
  const num = toSafeNumber(value);
  return `${num.toLocaleString('uz-UZ')} UZS`;
}

/** Format currency without the UZS suffix (for inline use). */
export function formatCurrencyShort(value: unknown): string {
  const num = toSafeNumber(value);
  return num.toLocaleString('uz-UZ');
}

/** Format a compact currency like "1.2M" for dashboard cards. */
export function formatCompactCurrency(value: unknown): string {
  const num = toSafeNumber(value);
  if (num >= 1_000_000_000) return `${(num / 1_000_000_000).toFixed(1)}B`;
  if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M`;
  if (num >= 1_000) return `${(num / 1_000).toFixed(0)}K`;
  return num.toLocaleString('uz-UZ');
}

/** Format a date string safely. Returns '-' for invalid dates. Handles ISO strings, Date, Firestore Timestamp. */
export function formatDate(value: unknown): string {
  if (!value) return '-';
  try {
    let d: Date | null = null;
    if (value instanceof Date) d = value;
    else if (typeof value === 'object' && value !== null) {
      const ts = value as { toDate?: () => Date; seconds?: number };
      if (typeof ts.toDate === 'function') d = ts.toDate();
      else if (typeof ts.seconds === 'number') d = new Date(ts.seconds * 1000);
      else d = null;
    } else if (typeof value === 'string' || typeof value === 'number') {
      d = new Date(value as string);
    }
    if (!d || isNaN(d.getTime())) return '-';
    return d.toLocaleDateString('uz-UZ', { year: 'numeric', month: '2-digit', day: '2-digit' });
  } catch {
    return '-';
  }
}

/** Format a datetime string safely. Handles ISO strings, Date, Firestore Timestamp. */
export function formatDateTime(value: unknown): string {
  if (!value) return '-';
  try {
    let d: Date | null = null;
    if (value instanceof Date) d = value;
    else if (typeof value === 'object' && value !== null) {
      const ts = value as { toDate?: () => Date; seconds?: number };
      if (typeof ts.toDate === 'function') d = ts.toDate();
      else if (typeof ts.seconds === 'number') d = new Date(ts.seconds * 1000);
      else d = null;
    } else if (typeof value === 'string' || typeof value === 'number') {
      d = new Date(value as string);
    }
    if (!d || isNaN(d.getTime())) return '-';
    return d.toLocaleString('uz-UZ', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });
  } catch {
    return '-';
  }
}

/** Format a phone number for display. */
export function formatPhone(value: unknown): string {
  if (!value || typeof value !== 'string') return '-';
  return value;
}

/** Safe percentage formatter. Returns '0%' for invalid values. */
export function formatPercent(value: unknown): string {
  const num = toSafeNumber(value);
  if (!isFinite(num)) return '0%';
  return `${Math.round(num)}%`;
}

/** Safely convert any value to a number. Returns 0 for undefined/null/NaN. */
export function toSafeNumber(value: unknown): number {
  if (value === null || value === undefined) return 0;
  if (typeof value === 'number') return isNaN(value) || !isFinite(value) ? 0 : value;
  if (typeof value === 'string') {
    const parsed = parseFloat(value.replace(/[^0-9.\-]/g, ''));
    return isNaN(parsed) ? 0 : parsed;
  }
  return 0;
}

/** Safe string getter - returns fallback for undefined/null. */
export function safeStr(value: unknown, fallback = ''): string {
  if (value === null || value === undefined) return fallback;
  return String(value);
}

/** Get the display name of a student (handles both fullName and name fields). */
export function getStudentName(student: { fullName?: string; name?: string }): string {
  return student.fullName || student.name || "Noma'lum";
}
