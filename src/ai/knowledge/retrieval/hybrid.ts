/**
 * Hybrid retrieval orchestrator.
 *
 * Composes the exact, keyword, and (future) semantic strategies into a
 * single `retrieve()` entry point. Deterministic knowledge always wins
 * over generated knowledge.
 */

import type { KnowledgeDocument, KnowledgeFact, KnowledgeResult, KnowledgeEntityType } from '../schema/knowledge.schema';
import type { KnowledgeGraph } from '../../../services/aiKnowledge';
import type { KnowledgeIndex } from '../loader/loadKnowledge';
import { keywordSearch } from './keyword';
import { rankCandidates, splitByConfidence } from './ranking';
import { extractFactsFromDocument } from './exact';
import { semanticSearch, type SemanticHit } from './semantic';
import { normalizeForMatch } from '../../../services/aiNormalize';

export type RetrievalStrategy = 'exact' | 'structured' | 'keyword' | 'semantic';

export interface RetrievalCandidate {
  result: KnowledgeResult;
  strategy: RetrievalStrategy;
  metadata?: Record<string, unknown>;
}

export interface HybridRetrieveOptions {
  normalizedQuery: string;
  normalizedEntityId?: string; // resolved course id from alias module
  entityType?: KnowledgeEntityType;
  index?: KnowledgeIndex;
  faqs?: Array<{ id: string; question?: string; answer?: string }>;
  graph?: KnowledgeGraph;
  courseAliases?: ReadonlyMap<string, string>;
  resultFacts?: KnowledgeFact[];
  limit?: number;
}

/** Directly surface an exact entity doc by canonical alias id. */
function exactDoc(
  index: KnowledgeIndex,
  normalizedEntityId: string
): RetrievalCandidate | null {
  const doc = index.byId.get(normalizedEntityId);
  if (!doc) return null;
  return {
    result: {
      id: doc.id,
      entityType: doc.type,
      title: doc.title,
      content: doc.content,
      sourceType: 'markdown',
      sourceId: doc.sourceId,
      score: 1000,
      verified: doc.verified,
      visibility: doc.visibility,
      priority: 100,
      language: doc.language,
      updatedAt: doc.updatedAt,
    },
    strategy: 'exact',
    metadata: { via: 'exact_entity_id' },
  };
}

/** Search markdown index + FAQ docs via keywords. */
function keywordCandidates(
  index: KnowledgeIndex,
  normalizedQuery: string,
  faqs: Array<{ id: string; question?: string; answer?: string }> = [],
  limit = 15
): RetrievalCandidate[] {
  const allDocs = [...index.documents, ...faqs.map((f) => ({
    id: f.id,
    type: 'faq' as KnowledgeEntityType,
    title: String(f.question || f.id),
    aliases: [],
    language: 'uz' as const,
    status: 'published' as const,
    visibility: 'public' as const,
    source: 'faq',
    sourceId: f.id,
    verified: true,
    frontmatter: {},
    content: String(f.answer || ''),
  }))];
  return keywordSearch(allDocs, normalizedQuery, limit).map((r) => ({
    result: r,
    strategy: 'keyword' as const,
  }));
}

async function semanticCandidates(normalizedQuery: string, limit = 5): Promise<RetrievalCandidate[]> {
  const hits: SemanticHit[] = await semanticSearch(normalizedQuery, limit);
  return hits.map((h) => ({
    result: {
      id: h.id,
      entityType: 'course',
      title: h.id,
      content: '',
      sourceType: 'markdown',
      sourceId: h.id,
      score: Math.round(h.score * 100) / 100,
      verified: false,
      visibility: 'public',
      priority: 50,
      language: 'uz',
    },
    strategy: 'semantic' as const,
  }));
}

/** Attach facts from markdown course docs where present. */

/**
 * Main retrieve orchestrator. Returns candidates ranked by hybrid score.
 * Candidates are ranked, deduplicated by entity, then split into
 * high-confidence vs. low-confidence.
 */
export async function hybridRetrieve(options: HybridRetrieveOptions): Promise<{
  ranked: RetrievalCandidate[];
  high: RetrievalCandidate[];
  low: RetrievalCandidate[];
  strategiesUsed: RetrievalStrategy[];
}> {
  const candidates: RetrievalCandidate[] = [];
  const strategiesUsed = new Set<RetrievalStrategy>();
  const { normalizedQuery, index, normalizedEntityId, faqs } = options;

  // 1) Exact entity ID (highest confidence)
  if (normalizedEntityId && index) {
    const ex = exactDoc(index, normalizedEntityId);
    if (ex) {
      candidates.push(ex);
      strategiesUsed.add('exact');
    }
  }

  // 2) Keyword search
  if (index) {
    const kw = keywordCandidates(index, normalizedQuery, faqs || []);
    candidates.push(...kw);
    if (kw.length > 0) strategiesUsed.add('keyword');
  }

  // 3) Semantic (async, best-effort)
  let semResults: RetrievalCandidate[] = [];
  try {
    semResults = await semanticCandidates(normalizedQuery);
  } catch {
    semResults = [];
  }
  if (semResults.length > 0) {
    candidates.push(...semResults);
    strategiesUsed.add('semantic');
  }

  // 4) Enrich exact hits with facts
  const enriched = enrichWithFactorsCandidates(candidates, index);

  // 5) Rank
  const ranked = rankCandidates(enriched.map((c) => c.result));
  const rankedMap = new Map(ranked.map((r) => [r.id, r]));
  const rankedCandidates = enriched.filter((c) => rankedMap.has(c.result.id));
  const { high, low } = splitByConfidence(rankedCandidates.map((c) => c.result));

  return {
    ranked: rankedCandidates,
    high: rankedCandidates.filter((c) => high.some((h) => h.id === c.result.id)),
    low: rankedCandidates.filter((c) => low.some((l) => l.id === c.result.id)),
    strategiesUsed: [...strategiesUsed],
  };
}

function enrichWithFactorsCandidates(candidates: RetrievalCandidate[], index?: KnowledgeIndex): RetrievalCandidate[] {
  if (!index) return candidates;
  return candidates.map((c) => {
    if (c.strategy !== 'exact') return c;
    const doc = index.byId.get(c.result.id);
    if (doc && doc.type === 'course') {
      const facts = extractFactsFromDocument(doc);
      if (facts.length > 0) {
        return { ...c, result: { ...c.result, facts } };
      }
    }
    return c;
  });
}

export { keywordSearch, extractFactsFromDocument, rankCandidates, splitByConfidence };