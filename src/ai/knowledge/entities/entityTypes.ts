/**
 * Entity types, supported intents, and relationship taxonomy for the AI
 * knowledge layer. The operational intent union used by the receptionist is
 * maintained in aiReceptionist.ts; this module defines the canonical
 * vocabulary so tests and the knowledge layer share one source of truth.
 */

import type {
  KnowledgeEntityType,
  RelationshipKind,
} from '../schema/knowledge.schema';

export const ENTITY_TYPES: readonly KnowledgeEntityType[] = [
  'center',
  'branch',
  'course',
  'teacher',
  'program',
  'subject',
  'group',
  'result',
  'faq',
  'contact',
  'schedule',
  'policy',
] as const;

/** Canonical public course ids used across the knowledge layer. */
export const COURSE_IDS = {
  DTM_MILLIY_SERTIFIKAT: 'course.dtm-milliy-sertifikat',
  MATEMATIKA_FIZIKA: 'course.matematika-fizika',
  CEFR_B2_C1: 'course.cefr-b2-c1',
  ENGLISH_KIDS: 'course.english-kids',
  MENTAL_ARIFMETIKA: 'course.mental-arifmetika',
  ONA_TILI_ADABIYOTI: 'course.ona-tili-adabiyoti',
} as const;

/** Canonical public teacher ids (curated reference profiles). */
export const TEACHER_IDS = {
  JASUR_ALIMOV: 'teacher.jasur-alimov',
  MALIKA_YUSUPOVA: 'teacher.malika-yusupova',
  SARDOR_QODIROV: 'teacher.sardor-qodirov',
} as const;

/** Canonical contact / center ids. */
export const CENTER_IDS = {
  CENTER: 'center.renessans-yangiobod',
  BRANCH_MAIN: 'branch.renessans-yangiobod-main',
  CONTACT: 'contact.center',
} as const;

/** Core intents the knowledge layer can route. */
export type KnowledgeIntent =
  | 'greeting'
  | 'center_info'
  | 'address'
  | 'phone'
  | 'telegram'
  | 'working_hours'
  | 'course_list'
  | 'course_price'
  | 'course_duration'
  | 'course_teacher'
  | 'teacher_info'
  | 'teacher_courses'
  | 'course_features'
  | 'trial_lesson'
  | 'enrollment'
  | 'schedule'
  | 'results'
  | 'grants'
  | 'certificate_results'
  | 'president_school'
  | 'methodology'
  | 'faq'
  | 'follow_up'
  | 'correction'
  | 'unknown';

export const KNOWLEDGE_INTENTS: readonly KnowledgeIntent[] = [
  'greeting',
  'center_info',
  'address',
  'phone',
  'telegram',
  'working_hours',
  'course_list',
  'course_price',
  'course_duration',
  'course_teacher',
  'teacher_info',
  'teacher_courses',
  'course_features',
  'trial_lesson',
  'enrollment',
  'schedule',
  'results',
  'grants',
  'certificate_results',
  'president_school',
  'methodology',
  'faq',
  'follow_up',
  'correction',
  'unknown',
] as const;

/** Canonical relationship kinds (from schema) re-exported for convenience. */
export const RELATIONSHIP_KINDS: readonly RelationshipKind[] = [
  'center_to_branch',
  'center_to_course',
  'center_to_teacher',
  'course_to_teacher',
  'teacher_to_course',
  'course_to_subject',
  'course_to_program',
  'program_to_teacher',
  'teacher_to_group',
  'result_to_course',
  'result_to_teacher',
  'result_to_program',
] as const;

/** Entity ids referenced from curated markdown documents. */
export const KNOWLEDGE_DOC_IDS = {
  CENTER: CENTER_IDS.CENTER,
  METHODOLOGY: 'methodology.renessans',
  ENROLLMENT: 'policy.enrollment',
  TRIAL_LESSON: 'policy.trial-lesson',
  PARENT_GUIDE: 'policy.parent-guide',
  PRESIDENT_SCHOOL: 'program.president-school',
} as const;

export const RESULT_TYPES = {
  GRANT: 'grant',
  DTM: 'dtm',
  MILLIY_SERTIFIKAT: 'milliy-sertifikat',
  CEFR: 'cefr',
  IELTS: 'ielts',
  OLYMPIAD: 'olimpiada',
} as const;

export type ResultType = (typeof RESULT_TYPES)[keyof typeof RESULT_TYPES];

/** Query facets that can be resolved without a full LLM pass. */
export interface IntentFacet {
  intent: KnowledgeIntent;
  contactField?: 'phone' | 'telegram' | 'address' | 'workingHours' | 'email';
  resultType?: ResultType;
}

export { type KnowledgeEntityType };