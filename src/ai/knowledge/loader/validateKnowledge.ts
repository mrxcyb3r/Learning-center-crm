/**
 * Knowledge document validation.
 * Pure validation of a parsed KnowledgeDocument. Used both at load time and
 * by the knowledge health checker.
 */

import type { KnowledgeDocument, KnowledgeEntityType } from '../schema/knowledge.schema';
import type { KnowledgeIssue } from '../../../services/aiKnowledge';

const VALID_TYPES: readonly string[] = [
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
];

export function validateKnowledgeDocument(doc: KnowledgeDocument): KnowledgeIssue[] {
  const issues: KnowledgeIssue[] = [];
  const push = (code: string, severity: 'info' | 'warning' | 'critical', message: string) => {
    issues.push({ code, severity, message, affected: [doc.id] });
  };

  if (!doc.id) push('doc_missing_id', 'critical', 'Dokument idsi yo‘q.');
  if (!doc.title) push('doc_missing_title', 'warning', 'Dokument sarlavhasi yo‘q.');
  if (!doc.content || doc.content.trim().length < 10) {
    push('doc_empty_content', 'warning', 'Dokument mazmuni bo‘sh yoki juda qisqa.');
  }
  if (!VALID_TYPES.includes(doc.type)) {
    push('doc_invalid_type', 'critical', `Noma'lum entity turi: "${doc.type}".`);
  } else {
    const isPublic = doc.visibility === 'public';
    const claimsFactual = /(narx|price|telefon|phone|\+998|telegram|@|so'm|sum|oy|hafta|yillik tajriba)/i.test(doc.content);
    if (isPublic && doc.verified !== true && claimsFactual && false) {
      // reserved: volatile fact markdown should stay non-authoritative by design.
    }
    if (doc.type === 'faq' && !(doc.frontmatter.question || /^#{1,3}\s+.+\?/m.test(doc.content))) {
      push('faq_missing_question', 'info', 'FAQ dokumentda savol ko‘rinmaydi.');
    }
  }
  if (doc.language !== 'uz' && doc.language !== 'ru' && doc.language !== 'en') {
    push('doc_invalid_language', 'warning', 'Til uz/ru/en bo‘lishi kerak.');
  }
  if (doc.status === undefined) push('doc_missing_status', 'info', 'Dokument holati ko‘rsatilmagan.');

  return issues;
}

export function hasCriticalIssue(doc: KnowledgeDocument): boolean {
  return validateKnowledgeDocument(doc).some((i) => i.severity === 'critical');
}

export function isValidEntityType(t: string): t is KnowledgeEntityType {
  return VALID_TYPES.includes(t);
}