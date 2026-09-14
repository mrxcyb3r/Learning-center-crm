import { describe, it, expect } from 'vitest';
import {
  normalizePaymentCollection,
  isCollectedPayment,
  canonicalPaymentStatus,
  parseRecordDate,
  monthKeyOf,
  isSameDay,
  lastNMonths,
  groupMeetsOnWeekday,
  groupMeetsToday,
  classStartMinutes,
  greetingKey,
} from './dashboard';
import { toSafeNumber } from './format';

describe('normalizePaymentCollection', () => {
  it('maps every collected vocabulary to collected', () => {
    for (const s of ['Completed', 'completed', 'paid', 'Paid', 'Sent', 'Delivered', 'delivered']) {
      expect(normalizePaymentCollection(s)).toBe('collected');
    }
  });

  it('maps void/refund/failed to voided', () => {
    for (const s of ['Voided', 'voided', 'void', 'refunded', 'refund', 'Failed', 'failed']) {
      expect(normalizePaymentCollection(s)).toBe('voided');
    }
  });

  it('treats anything unknown as pending instead of throwing', () => {
    expect(normalizePaymentCollection('weird_status')).toBe('pending');
    expect(normalizePaymentCollection('')).toBe('pending');
    expect(normalizePaymentCollection(null)).toBe('pending');
    expect(normalizePaymentCollection(undefined)).toBe('pending');
    expect(normalizePaymentCollection(42)).toBe('pending');
  });

  it('isCollectedPayment agrees with normalizePaymentCollection', () => {
    expect(isCollectedPayment('Completed')).toBe(true);
    expect(isCollectedPayment('Pending')).toBe(false);
    expect(isCollectedPayment(null)).toBe(false);
  });

  it('canonicalPaymentStatus returns the canonical write vocabulary', () => {
    expect(canonicalPaymentStatus('paid')).toBe('Completed');
    expect(canonicalPaymentStatus('refunded')).toBe('Voided');
    expect(canonicalPaymentStatus('anything else')).toBe('Pending');
    expect(canonicalPaymentStatus(undefined)).toBe('Pending');
  });
});

describe('parseRecordDate', () => {
  it('parses JS Date instances', () => {
    const d = new Date('2026-09-14T10:00:00Z');
    expect(parseRecordDate(d)?.getTime()).toBe(d.getTime());
  });

  it('parses Firestore Timestamp-shaped objects', () => {
    const ts = { toDate: () => new Date('2026-09-14T10:00:00Z') };
    expect(parseRecordDate(ts)?.getTime()).toBe(new Date('2026-09-14T10:00:00Z').getTime());
  });

  it('parses plain { seconds } epoch objects', () => {
    const epoch = Math.floor(new Date('2026-09-14T10:00:00Z').getTime() / 1000);
    expect(parseRecordDate({ seconds: epoch })?.getTime()).toBe(epoch * 1000);
  });

  it('parses ISO strings and YYYY-MM-DD strings', () => {
    expect(parseRecordDate('2026-09-14T10:00:00Z')).toBeInstanceOf(Date);
    expect(parseRecordDate('2026-09-14')).toBeInstanceOf(Date);
  });

  it('returns null for garbage instead of throwing', () => {
    expect(parseRecordDate(null)).toBeNull();
    expect(parseRecordDate(undefined)).toBeNull();
    expect(parseRecordDate('not-a-date')).toBeNull();
    expect(parseRecordDate('2026-99-99')).toBeNull();
    expect(parseRecordDate({})).toBeNull();
    expect(parseRecordDate(42)).toBeInstanceOf(Date);
  });
});

describe('month/time helpers', () => {
  it('monthKeyOf formats YYYY-MM', () => {
    expect(monthKeyOf(new Date(2026, 8, 14))).toBe('2026-09');
  });

  it('isSameDay compares calendar day only', () => {
    expect(isSameDay(new Date(2026, 8, 14, 0, 1), new Date(2026, 8, 14, 23, 59))).toBe(true);
    expect(isSameDay(new Date(2026, 8, 14), new Date(2026, 8, 15))).toBe(false);
  });

  it('lastNMonths returns n ordered keys plus short labels', () => {
    const now = new Date(2026, 8, 14);
    const months = lastNMonths(6, now);
    expect(months).toHaveLength(6);
    expect(months[0].key).toBe('2026-04');
    expect(months[5].key).toBe('2026-09');
    expect(months[0].label).toBe('Apr');
  });
});

describe('group weekday matching', () => {
  it('matches Uzbek day tokens without prefix collisions', () => {
    expect(groupMeetsOnWeekday('Dush / Chor / Juma', 1)).toBe(true);
    expect(groupMeetsOnWeekday('Dush / Chor / Juma', 5)).toBe(true);
    expect(groupMeetsOnWeekday('Sesh / Pay', 4)).toBe(true);
    expect(groupMeetsOnWeekday('Dushanba', 1)).toBe(true);
    expect(groupMeetsOnWeekday('Shanba', 6)).toBe(true);
    expect(groupMeetsOnWeekday('Shanba', 0)).toBe(false);
  });

  it('treats missing/garbage days as inactive', () => {
    expect(groupMeetsOnWeekday(null, 1)).toBe(false);
    expect(groupMeetsOnWeekday(undefined, 1)).toBe(false);
    expect(groupMeetsOnWeekday('', 1)).toBe(false);
    expect(groupMeetsOnWeekday(123, 1)).toBe(false);
    expect(groupMeetsToday(null)).toBe(false);
  });
});

describe('classStartMinutes', () => {
  it('parses HH:MM prefixes', () => {
    expect(classStartMinutes('18:00 - 19:30')).toBe(1080);
    expect(classStartMinutes('09:15')).toBe(555);
  });

  it('returns MAX for garbage times', () => {
    expect(classStartMinutes('')).toBe(Number.MAX_SAFE_INTEGER);
    expect(classStartMinutes(null)).toBe(Number.MAX_SAFE_INTEGER);
    expect(classStartMinutes('no time')).toBe(Number.MAX_SAFE_INTEGER);
  });
});

describe('greetingKey', () => {
  it('returns morning/day/evening buckets', () => {
    expect(greetingKey(new Date(2026, 8, 14, 9, 0))).toBe('morning');
    expect(greetingKey(new Date(2026, 8, 14, 15, 0))).toBe('day');
    expect(greetingKey(new Date(2026, 8, 14, 20, 0))).toBe('evening');
  });
});

describe('safe numeric coercion across the dashboard', () => {
  it('toSafeNumber never throws on malformed payment amounts', () => {
    expect(toSafeNumber(null)).toBe(0);
    expect(toSafeNumber(undefined)).toBe(0);
    expect(toSafeNumber(NaN)).toBe(0);
    expect(toSafeNumber('bad-string')).toBe(0);
    expect(toSafeNumber('1,234')).toBe(1234);
    expect(toSafeNumber('500000')).toBe(500000);
    expect(toSafeNumber(0)).toBe(0);
  });

  it('revenue aggregation over malformed records does not throw', () => {
    const payments = [
      { amount: '200000', date: null, status: 'Completed' },
      { amount: undefined, date: 'garbage', status: 'Pending' },
      { amount: 'bad', date: new Date(), status: 'Voided' },
      { amount: 100000, date: new Date(), status: null },
      null,
    ];
    let collected = 0;
    let pending = 0;
    for (const p of payments) {
      if (!p) continue;
      const state = normalizePaymentCollection(p.status);
      const d = parseRecordDate(p.date);
      const sum = toSafeNumber(p.amount);
      if (state === 'collected') collected += sum;
      if (state === 'pending') pending += sum;
      void d;
    }
    expect(collected).toBe(200000);
    expect(pending).toBe(100000);
  });
});