import { describe, it, expect } from 'vitest';
import { hybridRetrieve } from './hybrid';
import { getKnowledgeIndex } from '../loader/loadKnowledge';
import { normalizeForMatch } from '../../../services/aiNormalize';
import { resolveCourseAlias } from '../entities/aliases';
import { CENTER_IDS } from '../entities/entityTypes';

describe('hybridRetrieve', () => {
  const index = getKnowledgeIndex();

  it('surfaces the exact course doc first for a dtm query', async () => {
    const norm = normalizeForMatch('dtm tayyorlov oylik narxi');
    const entityId = resolveCourseAlias(norm);
    const { ranked, high, strategiesUsed } = await hybridRetrieve({
      normalizedQuery: norm,
      normalizedEntityId: entityId || undefined,
      index,
      faqs: [],
    });
    expect(entityId).toBe('course.dtm-milliy-sertifikat');
    expect(high.length).toBeGreaterThan(0);
    expect(high[0].result.id).toBe('course.dtm-milliy-sertifikat');
    expect(strategiesUsed).toContain('exact');
  });

  it('attaches deterministic facts to the exact course', async () => {
    const norm = normalizeForMatch('cefr kursi narxi');
    const entityId = resolveCourseAlias(norm)!;
    const { high } = await hybridRetrieve({ normalizedQuery: norm, normalizedEntityId: entityId, index });
    const dtWon = high.find((c) => c.result.id === 'course.cefr-b2-c1');
    const facts = dtWon?.result.facts || [];
    expect(facts.some((f) => f.key === 'price')).toBe(true);
  });

  it('treats a center query via exact id as high-confidence', async () => {
    const { high } = await hybridRetrieve({
      normalizedQuery: normalizeForMatch('qayerda joylashgansiz'),
      normalizedEntityId: CENTER_IDS.CENTER,
      index,
    });
    expect(high.some((c) => c.result.id === CENTER_IDS.CENTER)).toBe(true);
  });

  it('returns empty ranking for a nonsense query without exact match', async () => {
    const { ranked } = await hybridRetrieve({ normalizedQuery: 'zzzzqqqq', index });
    expect(ranked.length).toBe(0);
  });

  it('is idempotent — two calls produce the same first high result', async () => {
    const norm = normalizeForMatch('mental arifmetika narxi');
    const entityId = resolveCourseAlias(norm)!;
    const run = () => hybridRetrieve({ normalizedQuery: norm, normalizedEntityId: entityId, index });
    const a = (await run()).high[0]?.result.id;
    const b = (await run()).high[0]?.result.id;
    expect(a).toBe(b);
  });
});