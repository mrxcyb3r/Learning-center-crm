/**
 * Shared adapter DTOs for the knowledge layer data access.
 *
 * Adapters translate live authoritative sources (Firestore collections and
 * settings docs) into the deterministic KnowledgeResult/KnowledgeFact types
 * the retrieval + grounding layers consume. They never invent values — they
 * only shape + tag what exists.
 */

import type { KnowledgeDocument } from '../schema/knowledge.schema';
import type { KnowledgeIndex } from '../loader/loadKnowledge';
import type { KnowledgeGraph } from '../../../services/aiKnowledge';
import type { CanonicalContact, CanonicalContactInput } from '../retrieval/exact';

/** A harmonious snapshot of every authoritative public source. */
export interface CatalogSnapshot {
  courses: Array<Record<string, unknown>>;
  teachers: Array<Record<string, unknown>>;
  results: Array<Record<string, unknown>>;
  faqs: Array<Record<string, unknown>>;
  builtAt: string;
}

/** The assembled, ready-to-query knowledge context. */
export interface KnowledgeContext {
  graph: KnowledgeGraph | null;
  index: KnowledgeIndex;
  results: Array<Record<string, unknown>>;
  faqs: Array<Record<string, unknown>>;
  contactCandidates: CanonicalContactInput;
  contact: CanonicalContact | null;
}

/** Center metadata fetched from settings/center (authoritative where present). */
export interface CenterSettingsShape {
  hotline?: string;
  secondaryPhone?: string;
  email?: string;
  address?: string;
  workingHours?: string;
  branches?: Array<{ name: string; address?: string }>;
  telegramSettings?: { botUsername?: string };
}

export { KnowledgeDocument, CanonicalContact, CanonicalContactInput };