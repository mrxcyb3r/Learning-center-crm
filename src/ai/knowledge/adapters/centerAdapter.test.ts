import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../../services/firebase', () => ({ db: {} }));
vi.mock('firebase/firestore', () => ({
  doc: (db: any, ...path: string[]) => ({ __doc: true, path: [db, ...path] }),
  getDoc: async () => {
    throw new Error('firestore not initialized in tests');
  },
}));
vi.mock('../../../services/repository', () => ({
  landingCmsService: {
    getLandingContent: async () => ({ contact: { phone: '+998 90 862-22-26' } }),
  },
}));

import { buildContactCandidates, resolveContact, fetchCenterContact } from './centerAdapter';
import { getKnowledgeIndex } from '../loader/loadKnowledge';
import { CENTER_IDS } from '../entities/entityTypes';

const INDEX = getKnowledgeIndex();

describe('buildContactCandidates / resolveContact', () => {
  it('ignores a stale landing phone and surfaces the curated markdown reference', () => {
    const candidates = buildContactCandidates({
      index: INDEX,
      settings: { hotline: '+998 90 862-22-26', secondaryPhone: '' },
      landingCms: { contact: { phone: '+998 90 862-22-26' }, phone: '+998 99 592 63 51' },
    });
    const contact = resolveContact(candidates);
    expect(contact.phone.value).toBe('+998 (88) 648-49-49');
    expect(contact.phone.verified).toBe(true);
    expect(contact.phone.conflict).toBe(false);
    expect(contact.conflictFields).toEqual([]);
  });

  it('resolves the canonical telegram from markdown when settings lack one', () => {
    const candidates = buildContactCandidates({ index: INDEX, settings: {} });
    const contact = resolveContact(candidates);
    expect(contact.telegram.value).toContain('@D_Furqatovich');
    expect(contact.telegram.verified).toBe(true);
  });

  it('prioritizes an authoritative non-stale settings phone over markdown', () => {
    const candidates = buildContactCandidates({
      index: INDEX,
      settings: { hotline: '+998 90 111 22 33', email: 'info@renessans.uz' },
      landingCms: null,
    });
    const contact = resolveContact(candidates);
    expect(contact.phone.value).toBe('+998 90 111 22 33');
    expect(contact.email?.value).toBe('info@renessans.uz');
  });

  it('flags a conflict between two non-stale same-priority candidates', () => {
    const candidates = buildContactCandidates({
      index: INDEX,
      settings: { hotline: '+998 90 111 22 33', secondaryPhone: '+998 90 444 55 66' },
      landingCms: null,
    });
    const contact = resolveContact(candidates);
    expect(contact.phone.conflict).toBe(true);
    expect(contact.conflictFields).toContain('phone');
    expect(contact.phone.verified).toBe(false);
  });

  it('falls back to markdown when the index is missing', () => {
    const candidates = buildContactCandidates({ index: null, settings: {} });
    const contact = resolveContact(candidates);
    expect(contact.phone.value).toBeNull();
  });

  it('center id points to the curated doc', () => {
    expect(INDEX.byId.has(CENTER_IDS.CENTER)).toBe(true);
  });
});

describe('fetchCenterContact', () => {
  it('degrades gracefully when Firestore is unavailable (markdown fallback)', async () => {
    const { contact } = await fetchCenterContact(INDEX);
    // settings read threw; landing carried a stale phone; markdown reference wins
    expect(contact.phone.value).toBe('+998 (88) 648-49-49');
    expect(contact.phone.verified).toBe(true);
  });
});