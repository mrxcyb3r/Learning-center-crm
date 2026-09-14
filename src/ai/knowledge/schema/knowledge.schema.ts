/**
 * Renessans AI Knowledge Layer — Schema
 * -------------------------------------
 * The shared contracts for the public AI knowledge pipeline.
 *
 * Source-of-truth doctrine:
 *   1. Firestore/CMS is authoritative for changing business facts
 *      (prices, contacts, teachers, results, FAQs, center config).
 *   2. Curated Markdown is explanatory knowledge (methodology, enrollment
 *      flow, trial lessons, program explanations).
 *   3. The LLM is never the source of truth — it only rewords trusted data.
 */

export type KnowledgeEntityType =
  | 'center'
  | 'branch'
  | 'course'
  | 'teacher'
  | 'program'
  | 'subject'
  | 'group'
  | 'result'
  | 'faq'
  | 'contact'
  | 'schedule'
  | 'policy';

export type Visibility = 'public' | 'private';

export type SourceType =
  | 'firestore_cms' // courses, teachers, results, faqs, cms/main
  | 'firestore_settings' // settings/center, settings/landing_cms
  | 'markdown' // curated knowledge documents
  | 'llm' // generated wording — lowest priority
  | 'default';

export type Language = 'uz' | 'ru' | 'en';

/**
 * Grounding status of an answer or factual claim.
 *  - verified:             backed by a current authoritative source
 *  - partially_verified:   partly backed, some parts unsupported
 *  - conflict:             two authoritative sources disagree
 *  - unsupported:          no source backs the claim
 *  - stale:                only a known-outdated source backs it
 *  - unavailable:          sources could not be reached
 */
export type GroundingStatus =
  | 'verified'
  | 'partially_verified'
  | 'conflict'
  | 'unsupported'
  | 'stale'
  | 'unavailable';

/**
 * The verifiable field of a claim. Used to map a claim to the right
 * deterministic source (e.g. a phone claim must match a phone fact by its
 * numeric digits, never by a keyword ranking).
 */
export type ClaimCategory =
  | 'contact_phone'
  | 'contact_telegram'
  | 'contact_address'
  | 'contact_hours'
  | 'price'
  | 'duration'
  | 'age'
  | 'result_stat'
  | 'result_school'
  | 'teacher_assignment'
  | 'mission'
  | 'other';

/** Nature of a claim: factual data, marketing wording, or a guarantee. */
export type ClaimKind = 'FACT' | 'MARKETING_CLAIM' | 'GUARANTEE';

/** A single verifiable factual statement extracted from an answer. */
export interface FactualClaim {
  id: string;
  text: string;
  /** Normalized claim value used for exact comparison (digits/handle, etc.). */
  claim: string;
  category: ClaimCategory;
  kind: ClaimKind;
  groundable: boolean;
  /** Numeric payload (price, duration, percentage). */
  value?: string | number;
  unit?: string;
  currency?: string;
  /** Recommended display formatting. */
  render?: (value: string | number) => string;
}

/** A single trusted fact (usually from Firestore or curated markdown). */
export interface KnowledgeFact {
  key: string;
  value: string | number | null;
  entityType?: KnowledgeEntityType;
  entityId?: string;
  currency?: string;
  unit?: string;
  sourceType: SourceType;
  sourceId: string;
  priority: number;
  verified: boolean;
  visibility: Visibility;
  updatedAt?: string;
  claimMatch?: string; // normalized value used for verification
}

/** A ranked candidate retrieved for the current query. */
export interface KnowledgeResult {
  id: string;
  entityType: KnowledgeEntityType;
  title: string;
  content: string;
  sourceType: SourceType;
  sourceId: string;
  score: number;
  verified: boolean;
  visibility: Visibility;
  priority: number;
  facts?: KnowledgeFact[];
  relationships?: string[];
  language: Language;
  updatedAt?: string;
  claimCategory?: ClaimCategory;
  /** Category of claims supported by this candidate (contact/course/result/…). */
  redirect?: boolean;
  redirectToEntityId?: string;
}

/** Machine-readable frontmatter + body of a curated markdown document. */
export interface KnowledgeDocument {
  id: string;
  type: KnowledgeEntityType;
  title: string;
  aliases: string[];
  language: Language;
  status: 'published' | 'draft' | 'archived';
  visibility: Visibility;
  source: string;
  sourceId: string;
  verified: boolean;
  version?: string;
  updatedAt?: string;
  relationships?: Record<string, string[]>;
  frontmatter: Record<string, unknown>;
  content: string;
}

/** Relationship kinds understood by the knowledge layer. */
export type RelationshipKind =
  | 'center_to_branch'
  | 'center_to_course'
  | 'center_to_teacher'
  | 'course_to_teacher'
  | 'teacher_to_course'
  | 'course_to_subject'
  | 'course_to_program'
  | 'program_to_teacher'
  | 'teacher_to_group'
  | 'result_to_course'
  | 'result_to_teacher'
  | 'result_to_program';

export interface EntityRelationship {
  id: string;
  kind: RelationshipKind;
  from: string; // source entity id
  to: string; // target entity id
  confidence: number; // 0..1
  explicit: boolean;
  sourceType?: SourceType;
}

/** Diagnostics recorded per turn for admin observability. */
export interface RetrievalDiagnostics {
  normalizedQuery: string;
  intents: string[];
  resolvedEntities: string[];
  retrievalSources: string[];
  selectedSourceIds: string[];
  groundingStatus: GroundingStatus;
  conflicts: string[];
  fallbackReason?: string | null;
  rejectedEntities?: string[];
}