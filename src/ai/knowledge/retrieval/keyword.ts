/**
 * Keyword / BM25-like retrieval over Markdown knowledge documents + FAQ items.
 *
 * This module is PURE — no I/O. Callers pass documents and a normalized query,
 * and it returns scored candidate results ordered by keyword relevance.
 *
 * IDF (inverse document frequency) is computed per-build from the corpus,
 * giving rare-but-salient terms higher weight. A term appearing in few docs
 * (e.g. "olimpiada") boosts more than a common term like "kurs".
 */

import { normalizeForMatch, tokenize } from '../../../services/aiNormalize';
import type { KnowledgeDocument, KnowledgeResult } from '../schema/knowledge.schema';
import { SOURCE_PRIORITY } from '../grounding/sourcePriority';

interface DocIndex {
  id: string;
  tokens: string[];
  content: string; // normalized full text
  entity: KnowledgeDocument;
}

function indexDoc(doc: KnowledgeDocument): DocIndex {
  const content = normalizeForMatch(doc.title + ' ' + (doc.content || '') + ' ' + doc.aliases.join(' '));
  return { id: doc.id, tokens: tokenize(content), content, entity: doc };
}

function buildInverseFrequency(indexes: DocIndex[]): Map<string, number> {
  const docCount = indexes.length || 1;
  const df = new Map<string, number>();
  for (const di of indexes) {
    const unique = new Set(di.tokens);
    for (const t of unique) df.set(t, (df.get(t) || 0) + 1);
  }
  const idf = new Map<string, number>();
  for (const [t, count] of df) {
    idf.set(t, Math.log((docCount - count + 0.5) / (count + 0.5) + 1));
  }
  return idf;
}

function tfScore(queryTokens: string[], docTokens: string[]): number {
  const tf = new Map<string, number>();
  for (const t of docTokens) tf.set(t, (tf.get(t) || 0) + 1);
  let score = 0;
  for (const q of queryTokens) {
    const freq = tf.get(q) || 0;
    if (freq > 0) score += (1 + Math.log(freq)) * (1 + (q.length > 5 ? 1 : 0));
  }
  return score;
}

export function keywordSearch(
  documents: KnowledgeDocument[],
  normalizedQuery: string,
  limit = 15
): KnowledgeResult[] {
  if (!normalizedQuery || documents.length === 0) return [];
  const indexes = documents.map(indexDoc);
  const idf = buildInverseFrequency(indexes);
  const queryTokens = tokenize(normalizeForMatch(normalizedQuery)).filter((t) => t.length >= 2);
  if (queryTokens.length === 0) return [];

  const scored: Array<{ result: KnowledgeResult; score: number }> = [];
  for (const di of indexes) {
    const tf = tfScore(queryTokens, di.tokens);
    let idfSum = 0;
    for (const q of queryTokens) {
      idfSum += idf.get(q) || 0;
    }
    const total = tf * (1 + idfSum * 0.1);
    if (total > 0) {
      scored.push({
        score: total,
        result: {
          id: di.entity.id,
          entityType: di.entity.type,
          title: di.entity.title,
          content: di.entity.content,
          sourceType: 'markdown',
          sourceId: di.entity.sourceId,
          score: Math.round(total * 100) / 100,
          verified: di.entity.verified,
          visibility: di.entity.visibility,
          priority: SOURCE_PRIORITY.markdown,
          relationships: di.entity.relationships ? Object.values(di.entity.relationships).flat() : undefined,
          language: di.entity.language,
          updatedAt: di.entity.updatedAt,
        },
      });
    }
  }

  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, limit).map((s) => s.result);
}