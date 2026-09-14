/**
 * Knowledge corpus imports (single module).
 *
 * All curated markdown files are bundled at build time via Vite `?raw`.
 * Isolating the raw imports into this one module lets tests mock it in one
 * place (vitest.setup) while production keeps the bundled behavior.
 */

import centerDoc from './documents/center.md?raw';
import methodologyDoc from './documents/methodology.md?raw';
import enrollmentDoc from './documents/enrollment.md?raw';
import trialLessonDoc from './documents/trial-lesson.md?raw';
import parentGuideDoc from './documents/parent-guide.md?raw';
import presidentSchoolDoc from './documents/president-school.md?raw';
import faqEnrollment from './documents/faq/enrollment.md?raw';
import faqPayments from './documents/faq/payments.md?raw';
import faqSchedule from './documents/faq/schedule.md?raw';
import faqTrial from './documents/faq/trial.md?raw';
import faqResults from './documents/faq/results.md?raw';
import courseDtm from './documents/courses/dtm-milliy-sertifikat.md?raw';
import courseMath from './documents/courses/matematika-fizika.md?raw';
import courseCefr from './documents/courses/cefr-b2-c1.md?raw';
import courseKids from './documents/courses/english-kids.md?raw';
import courseMental from './documents/courses/mental-arifmetika.md?raw';
import courseOnatili from './documents/courses/ona-tili-adabiyoti.md?raw';
import teacherJasur from './documents/teachers/jasur-alimov.md?raw';
import teacherMalika from './documents/teachers/malika-yusupova.md?raw';
import teacherSardor from './documents/teachers/sardor-qodirov.md?raw';

export interface RawKnowledgeDocument {
  id: string;
  raw: string;
}

export const RAW_DOCUMENTS: RawKnowledgeDocument[] = [
  { id: 'center', raw: centerDoc },
  { id: 'methodology', raw: methodologyDoc },
  { id: 'enrollment', raw: enrollmentDoc },
  { id: 'trial-lesson', raw: trialLessonDoc },
  { id: 'parent-guide', raw: parentGuideDoc },
  { id: 'president-school', raw: presidentSchoolDoc },
  { id: 'faq/enrollment', raw: faqEnrollment },
  { id: 'faq/payments', raw: faqPayments },
  { id: 'faq/schedule', raw: faqSchedule },
  { id: 'faq/trial', raw: faqTrial },
  { id: 'faq/results', raw: faqResults },
  { id: 'courses/dtm-milliy-sertifikat', raw: courseDtm },
  { id: 'courses/matematika-fizika', raw: courseMath },
  { id: 'courses/cefr-b2-c1', raw: courseCefr },
  { id: 'courses/english-kids', raw: courseKids },
  { id: 'courses/mental-arifmetika', raw: courseMental },
  { id: 'courses/ona-tili-adabiyoti', raw: courseOnatili },
  { id: 'teachers/jasur-alimov', raw: teacherJasur },
  { id: 'teachers/malika-yusupova', raw: teacherMalika },
  { id: 'teachers/sardor-qodirov', raw: teacherSardor },
];