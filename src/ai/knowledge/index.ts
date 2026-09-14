/**
 * Renessans AI Knowledge Layer — public API.
 *
 * Sums up the deterministic, source-priority architecture:
 *   schema  → shared contracts
 *   loader  → curated markdown corpus (center, courses, teachers, FAQ…)
 *   retrieval → exact + keyword + semantic + hybrid ranking
 *   grounding → validate AI claims against authoritative facts
 *   adapters  → live Firestore / settings → KnowledgeResults
 *   service   → integration facade for aiReceptionist
 *   health    → admin diagnostics
 */

// Schema
export * from './schema/knowledge.schema';

// Loader
export {
  getKnowledgeIndex,
  getDocumentById,
  loadKnowledgeDocuments,
  buildKnowledgeIndex,
  resetKnowledgeIndexCache,
} from './loader/loadKnowledge';
export { parseMarkdownDocument } from './loader/parseMarkdown';
export { validateKnowledgeDocument, hasCriticalIssue } from './loader/validateKnowledge';

// Entities
export * from './entities/entityTypes';
export {
  COURSE_ALIAS_GROUPS,
  COURSE_ALIAS_TO_ID,
  CONTACT_ALIASES,
  RESULT_ALIASES,
  GREETING_PHRASES,
  CORRECTION_PHRASES,
  FOLLOWUP_PHRASES,
  TRIAL_PHRASES,
  ENROLLMENT_PHRASES,
  METHODOLOGY_PHRASES,
  PRESIDENT_SCHOOL_PHRASES,
  PRIVACY_SIGNALS,
  STALE_CONTACT_VALUES,
  resolveCourseAlias,
  resolveContactField,
  resolveResultType,
  isStalePhone,
  isStaleTelegram,
  isCorrectionText,
} from './entities/aliases';
export {
  RELATIONSHIP_DEFINITIONS,
  courseTeacherToRelationships,
  coursesForTeacher,
  teachersForCourse,
} from './entities/relationships';

// Retrieval
export {
  resolveCanonicalContact,
  phoneDigits,
  telephoneHandle,
  markdownContactCandidate,
  extractFactsFromDocument,
  formatUzbekSum,
  isKnownStale,
  CanonicalContactSelectors,
} from './retrieval/exact';
export { keywordSearch } from './retrieval/keyword';
export { rankCandidates, splitByConfidence, toRoutingTier, internalScore } from './retrieval/ranking';
export { getSemanticProvider, setSemanticProvider, semanticSearch } from './retrieval/semantic';
export { hybridRetrieve } from './retrieval/hybrid';
export type { RetrievalStrategy, RetrievalCandidate, HybridRetrieveOptions } from './retrieval/hybrid';

// Grounding
export {
  extractFactsFromText,
  extractNumericClaims,
  extractContactClaims,
} from './grounding/factualClaims';
export {
  validateAnswer,
  evaluateClaim,
  statusOfResults,
} from './grounding/validateAnswer';
export {
  groundingLabel,
  UNVERIFIED_LABEL,
  VERIFIED_LABEL,
  GROUNDING_CONSTRAINTS,
} from './grounding/groundingTypes';
export type {
  GroundingDecision,
  GroundingOptions,
  GroundingConstraint,
  GroundingLabelDecision,
} from './grounding/groundingTypes';
export { SOURCE_PRIORITY, CMS_PRIORITY, SETTINGS_PRIORITY, MARKDOWN_PRIORITY } from './grounding/sourcePriority';

// Adapters
export { courseToKnowledgeResult, teacherToKnowledgeResult, resultToKnowledgeResult, faqToKnowledgeResult } from './adapters/firestoreAdapter';
export { buildContactCandidates, resolveContact, fetchCenterContact } from './adapters/centerAdapter';
export { fetchCatalog, buildGraphFromSnapshot, assembleContext, buildKnowledgeContext } from './adapters/catalogAdapter';
export type { CatalogSnapshot, KnowledgeContext, CenterSettingsShape } from './adapters/types';

// Service facade
export {
  answerContactInfo,
  answerBranchAddress,
  answerWorkingHours,
  answerResultsGrants,
  getCenterContactView,
  getCatalogCached,
  resetKnowledgeServiceCache,
  missingDataText,
} from './service/knowledgeService';
export type { DeterministicAnswer, CenterContactView } from './service/knowledgeService';

// Health
export { getMarkdownKnowledgeHealth, markdownHealthSummary } from './health';
export type { MarkdownKnowledgeHealth, MarkdownDocHealth } from './health';