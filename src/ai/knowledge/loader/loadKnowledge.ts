/**
 * Knowledge loader — imports the curated Markdown corpus, parses frontmatter,
 * validates, and builds an in-memory index of public knowledge documents.
 *
 * The Markdown corpus is bundled at build time (see ./documents.ts for the
 * `?raw` imports). The loader is robust to a missing/unparseable document:
 * it logs the issue and continues.
 */

import { RAW_DOCUMENTS } from './documents';
import { parseMarkdownDocument } from './parseMarkdown';
import { validateKnowledgeDocument } from './validateKnowledge';
import { normalizeForMatch } from '../../../services/aiNormalize';
import type { KnowledgeDocument } from '../schema/knowledge.schema';
import type { KnowledgeIssue } from '../../../services/aiKnowledge';

export interface KnowledgeIndex {
  documents: KnowledgeDocument[];
  byId: Map<string, KnowledgeDocument>;
  byType: Map<string, KnowledgeDocument[]>;
  byAlias: Map<string, KnowledgeDocument>;
  issues: KnowledgeIssue[];
  builtAt: string;
}

/** Parse + validate every bundled document (published + public only indexed). */
export function loadKnowledgeDocuments(): { documents: KnowledgeDocument[]; issues: KnowledgeIssue[] } {
  const documents: KnowledgeDocument[] = [];
  const issues: KnowledgeIssue[] = [];
  for (const { id, raw } of RAW_DOCUMENTS) {
    try {
      const doc = parseMarkdownDocument(raw);
      if (!doc) {
        issues.push({ code: 'doc_unparseable', severity: 'critical', message: `Dokument ${id} frontmatter/body pars qilinmadi.`, affected: [id] });
        continue;
      }
      documents.push(doc);
      issues.push(...validateKnowledgeDocument(doc));
    } catch (err) {
      issues.push({ code: 'doc_load_error', severity: 'critical', message: `Dokument ${id} yuklashda xato: ${String(err)}`, affected: [id] });
    }
  }
  return { documents, issues };
}

/** Build the lookup index. Keeps only published, public documents. */
export function buildKnowledgeIndex(
  documents: KnowledgeDocument[],
  issues: KnowledgeIssue[] = []
): KnowledgeIndex {
  const byId = new Map<string, KnowledgeDocument>();
  const byType = new Map<string, KnowledgeDocument[]>();
  const byAlias = new Map<string, KnowledgeDocument>();

  for (const doc of documents) {
    if (doc.status === 'archived' || doc.visibility !== 'public' || doc.status === 'draft') continue;
    byId.set(doc.id, doc);
    const arr = byType.get(doc.type) || [];
    arr.push(doc);
    byType.set(doc.type, arr);
    byAlias.set(normalizeForMatch(doc.title), doc);
    for (const a of doc.aliases || []) {
      const norm = normalizeForMatch(a);
      if (norm && !byAlias.has(norm)) byAlias.set(norm, doc);
    }
  }

  return { documents, byId, byType, byAlias, issues, builtAt: new Date().toISOString() };
}

let cached: KnowledgeIndex | null = null;

/** Singleton loader with graceful failure + deterministic startup. */
export function getKnowledgeIndex(): KnowledgeIndex {
  if (cached) return cached;
  const { documents, issues } = loadKnowledgeDocuments();
  cached = buildKnowledgeIndex(documents, issues);
  return cached;
}

export function getDocumentById(id: string): KnowledgeDocument | undefined {
  return getKnowledgeIndex().byId.get(id);
}

export function resetKnowledgeIndexCache(): void {
  cached = null;
}

export { normalizeForMatch as _normalizeForMatch };
export type { KnowledgeDocument };