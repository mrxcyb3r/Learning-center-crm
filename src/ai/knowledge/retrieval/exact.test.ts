import { describe, it, expect } from 'vitest';
import {
  phoneDigits,
  telephoneHandle,
  resolveCanonicalContact,
  markdownContactCandidate,
  formatUzbekSum,
  isKnownStale,
  comparableValue,
} from './exact';
import type { KnowledgeDocument } from '../schema/knowledge.schema';
import { CENTER_IDS } from '../entities/entityTypes';
import { getKnowledgeIndex } from '../loader/loadKnowledge';

describe('phoneDigits', () => {
  it('normalizes national and international formats', () => {
    expect(phoneDigits('+998 (88) 648-49-49')).toBe('998886484949');
    expect(phoneDigits('(88) 648-49-49')).toBe('998886484949');
    expect(phoneDigits('8 (88) 648-49-49')).toBe('998886484949');
    expect(phoneDigits('+998 90 123 45 67')).toBe('998901234567');
  });
});

describe('telephoneHandle', () => {
  it('strips @ and normalizes case', () => {
    expect(telephoneHandle('@D_Furqatovich')).toBe('d_furqatovich');
    expect(telephoneHandle('UzBot')).toBe('uzbot');
  });
});

describe('isKnownStale', () => {
  it('detects documented stale phones and telegrams', () => {
    expect(isKnownStale('phone', '+998 90 862-22-26')).toBe(true);
    expect(isKnownStale('phone', '+998 (88) 648-49-49')).toBe(false);
    expect(isKnownStale('telegram', '@centerflow_bot')).toBe(true);
    expect(isKnownStale('telegram', '@D_Furqatovich')).toBe(false);
  });
});

describe('resolveCanonicalContact', () => {
  const settings = { field: 'phone' as const, value: '+998 90 862-22-26', sourceType: 'firestore_settings' as const, sourceId: 'settings/center', priority: 90 };
  const markdown = { field: 'phone' as const, value: '+998 (88) 648-49-49', sourceType: 'markdown' as const, sourceId: 'public-reference/center/2026', priority: 70 };

  it('prefers the authoritative priority and ignores stale values', () => {
    const contact = resolveCanonicalContact({ phone: [settings, markdown] });
    // stale settings dropped → markdown reference survives
    expect(contact.phone.value).toBe('+998 (88) 648-49-49');
    expect(contact.phone.verified).toBe(true);
    expect(contact.conflictFields).toEqual([]);
  });

  it('flags a genuine conflict between two non-stale top sources', () => {
    const a = { ...markdown, value: '+998 90 000 00 01' };
    const b = { ...markdown, value: '+998 90 000 00 02' };
    const contact = resolveCanonicalContact({ phone: [a, b] });
    expect(contact.phone.conflict).toBe(true);
    expect(contact.phone.verified).toBe(false);
    expect(contact.conflictFields).toContain('phone');
  });

  it('returns empty fields when no candidates exist', () => {
    const contact = resolveCanonicalContact({});
    expect(contact.phone.value).toBeNull();
    expect(contact.phone.verified).toBe(false);
  });

  it('marks verified when only the markdown reference exists', () => {
    const contact = resolveCanonicalContact({ phone: [markdown] });
    expect(contact.phone.verified).toBe(true);
  });
});

describe('markdownContactCandidate', () => {
  const index = getKnowledgeIndex();
  const center = index.byId.get(CENTER_IDS.CENTER) as KnowledgeDocument;

  it('extracts phone, telegram, address and working hours from center.md', () => {
    const cands = markdownContactCandidate(center);
    const byField = (f: string) => cands.filter((c) => c.field === f);
    expect(byField('phone')[0]?.value).toContain('+998 (88) 648-49-49');
    expect(byField('telegram')[0]?.value).toContain('@D_Furqatovich');
    expect(byField('address').length).toBeGreaterThan(0);
    expect(byField('workingHours').length).toBeGreaterThan(0);
  });
});

describe('compare / format helpers', () => {
  it('comparableValue normalizes per field', () => {
    expect(comparableValue('phone', '+998 (88) 648-49-49')).toBe('998886484949');
    expect(comparableValue('telegram', '@D_Furqatovich')).toBe('d_furqatovich');
  });

  it('formats Uzbek sums with spaces', () => {
    expect(formatUzbekSum(380000)).toBe("380 000 so'm");
    expect(formatUzbekSum(0)).toBe('');
  });
});