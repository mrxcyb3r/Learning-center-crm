import { describe, it, expect, beforeEach } from 'vitest';
import { getKnowledgeIndex, loadKnowledgeDocuments, resetKnowledgeIndexCache, getDocumentById } from './loadKnowledge';
import { extractFactsFromDocument } from '../retrieval/exact';
import { normalizeForMatch } from '../../../services/aiNormalize';
import { resolveCourseAlias } from '../entities/aliases';
import { CENTER_IDS } from '../entities/entityTypes';

describe('knowledge loader', () => {
  beforeEach(() => {
    resetKnowledgeIndexCache();
  });

  it('loads the full curated corpus with zero critical validation issues', () => {
    const { documents, issues } = loadKnowledgeDocuments();
    expect(documents.length).toBeGreaterThanOrEqual(20);
    const criticals = issues.filter((i) => i.severity === 'critical');
    expect(criticals.length).toBe(0);
  });

  it('builds an index containing every expected knowledge category', () => {
    const index = getKnowledgeIndex();
    expect(index.byType.get('course')!.length).toBeGreaterThanOrEqual(6);
    expect(index.byType.get('teacher')!.length).toBeGreaterThanOrEqual(3);
    expect(index.byType.get('faq')!.length).toBeGreaterThanOrEqual(5);
    expect(index.byId.has(CENTER_IDS.CENTER)).toBe(true);
    expect(index.byId.has('methodology.renessans')).toBe(true);
    expect(index.byId.has('policy.enrollment')).toBe(true);
  });

  it('resolves a course alias to the canonical knowledge document', () => {
    const alias = resolveCourseAlias('dtm tayyorlov narxi qancha');
    expect(alias).toBe('course.dtm-milliy-sertifikat');
    const doc = getDocumentById(alias!);
    expect(doc?.title).toBe('DTM & Milliy Sertifikat');
  });

  it('marks the center document verified and curates the reference phone', () => {
    const index = getKnowledgeIndex();
    const center = index.byId.get(CENTER_IDS.CENTER)!;
    expect(center.verified).toBe(true);
    expect(center.content).toContain('+998 (88) 648-49-49');
    expect(center.content).toContain('@D_Furqatovich');
  });

  it('extracts the known course price fact deterministically', () => {
    const dtm = getDocumentById('course.dtm-milliy-sertifikat')!;
    const facts = extractFactsFromDocument(dtm);
    const price = facts.find((f) => f.key === 'price');
    expect(price?.value).toBe('380000');
    expect(price?.currency).toBe('UZS');
    const dur = facts.find((f) => f.key === 'duration');
    expect(String(dur?.value)).toContain('8');
  });

  it('normalizes entity aliases for indexing', () => {
    const index = getKnowledgeIndex();
    const malika = index.byAlias.get(normalizeForMatch('malika opa'));
    expect(malika?.id).toBe('teacher.malika-yusupova');
  });
});