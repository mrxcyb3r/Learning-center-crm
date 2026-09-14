/**
 * Hybrid ranking: combine retrieval candidates from different strategies
 * using explicit weights, producing a single ordered result list.
 */

import type { KnowledgeResult } from '../schema/knowledge.schema';
import { SOURCE_PRIORITY, type SourcePriorityKey } from '../grounding/sourcePriority';

/** Internal scoring rules: different tiers for different signal strengths. */
const TIER = {
  EXACT_ENTITY: 1000,
  STRUCTURED_RELATION: 900,
  CURATED_MARKDOWN_FACT: 850,
  EXACT_FAQ: 800,
  CURATED_MARKDOWN_EXPLANATORY: 700,
  KEYWORD: 600,
  SEMANTIC: 500,
  LLM_GENERATED: 100,
} as const;

const VERIFIED_BONUS = 50;
const SOURCE_TIER_BONUS = 15;
const VISIBILITY_PENALTY_PRIVATE = -500;

/** Normalize a result score into an internal routing tier. */
export function toRoutingTier(r: KnowledgeResult): number {
  if (r.sourceType === 'llm') return TIER.LLM_GENERATED;
  if (r.sourceType === 'firestore_cms') {
    if (r.entityType === 'faq') return TIER.EXACT_FAQ;
    return TIER.EXACT_ENTITY;
  }
  if (r.sourceType === 'markdown') {
    return r.score >= 800 ? TIER.CURATED_MARKDOWN_FACT : TIER.CURATED_MARKDOWN_EXPLANATORY;
  }
  if (r.sourceType === 'firestore_settings') return TIER.EXACT_ENTITY;
  return TIER.KEYWORD;
}

export function internalScore(r: KnowledgeResult): number {
  let base = toRoutingTier(r);
  if (r.verified) base += VERIFIED_BONUS;
  if (r.priority > SOURCE_PRIORITY.default) base += SOURCE_TIER_BONUS;
  if (r.visibility === 'private') base += VISIBILITY_PENALTY_PRIVATE;
  base += Math.min(r.score, 100) * 0.1;
  return base;
}

/** Rank and deduplicate results, keeping the best variant per entity ID. */
export function rankCandidates(candidates: KnowledgeResult[]): KnowledgeResult[] {
  const byEntity = new Map<string, KnowledgeResult>();
  for (const c of candidates) {
    const key = `${c.entityType}:${c.id}`;
    const existing = byEntity.get(key);
    if (!existing || internalScore(c) > internalScore(existing)) {
      byEntity.set(key, c);
    }
  }
  return [...byEntity.values()].sort((a, b) => internalScore(b) - internalScore(a));
}

/** Split into high-confidence (graph/verified) and low-confidence (keyword/semantic/LLM) buckets. */
export function splitByConfidence(
  ranked: KnowledgeResult[]
): { high: KnowledgeResult[]; low: KnowledgeResult[] } {
  const cutoff = TIER.KEYWORD + VERIFIED_BONUS;
  return {
    high: ranked.filter((r) => internalScore(r) >= cutoff),
    low: ranked.filter((r) => internalScore(r) < cutoff),
  };
}

export { TIER, SOURCE_PRIORITY };