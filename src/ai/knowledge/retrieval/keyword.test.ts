import { describe, it, expect } from 'vitest';
import { keywordSearch } from './keyword';
import { getKnowledgeIndex } from '../loader/loadKnowledge';
import { normalizeForMatch } from '../../../services/aiNormalize';

describe('keywordSearch', () => {
  const index = getKnowledgeIndex();
  const docs = index.documents;

  it('finds the DTM course doc for a dtm query', () => {
    const hits = keywordSearch(docs, normalizeForMatch('dtm kurs narxi qancha'), 5);
    expect(hits.length).toBeGreaterThan(0);
    expect(hits.some((h) => h.entityType === 'course')).toBe(true);
    expect(hits.some((h) => h.id === 'course.dtm-milliy-sertifikat')).toBe(true);
  });

  it('finds the trial FAK doc for a sinov-darsi query', () => {
    const hits = keywordSearch(docs, normalizeForMatch('sinov darsi bepulmi'), 5);
    expect(hits.some((h) => h.id === 'faq.trial')).toBe(true);
  });

  it('returns a deterministic, stable order (same query → same ranking)', () => {
    const q = normalizeForMatch('ona tili kursi');
    const a = keywordSearch(docs, q, 5).map((h) => h.id);
    const b = keywordSearch(docs, q, 5).map((h) => h.id);
    expect(a).toEqual(b);
  });

  it('returns empty for empty/null query', () => {
    expect(keywordSearch(docs, '')).toEqual([]);
  });

  it('tags results as public markdown sources', () => {
    const hits = keywordSearch(docs, normalizeForMatch('matematika'), 3);
    expect(hits[0].sourceType).toBe('markdown');
    expect(hits[0].visibility).toBe('public');
  });
});