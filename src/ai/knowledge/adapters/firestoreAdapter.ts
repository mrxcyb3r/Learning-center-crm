/**
 * Firestore → KnowledgeResult adapter (pure).
 *
 * Converts authoritative Firestore-shaped records (courses, teachers, results,
 * faqs) into KnowledgeResult/KnowledgeFact values. Everything is deterministic:
 * a record either exists with fields or it doesn't — there is no generation.
 */

import {
  SOURCE_PRIORITY,
} from '../grounding/sourcePriority';
import type {
  KnowledgeResult,
  KnowledgeFact,
  KnowledgeEntityType,
} from '../schema/knowledge.schema';
import {
  formatUzbekSum,
} from '../retrieval/exact';

function cleanText(...vals: Array<unknown>): string {
  return vals.map((v) => String(v ?? '')).filter((s) => s.trim()).join(' ');
}

export function courseToKnowledgeResult(raw: Record<string, unknown>): KnowledgeResult | null {
  const id = String(raw.id || '');
  if (!id) return null;
  const price = Number(raw.monthlyFee ?? 0);

  const facts: KnowledgeFact[] = [];
  if (Number.isFinite(price) && price > 0) {
    facts.push({
      key: 'price',
      value: price,
      entityType: 'course',
      entityId: id,
      currency: String(raw.currency || 'UZS'),
      sourceType: 'firestore_cms',
      sourceId: 'courses/' + id,
      priority: SOURCE_PRIORITY.firestore_cms,
      verified: true,
      visibility: (raw as any).isPublic === false ? 'private' : 'public',
      updatedAt: String(raw.updatedAt || ''),
    });
  }
  if (raw.duration) {
    facts.push({
      key: 'duration',
      value: String(raw.duration),
      entityType: 'course',
      entityId: id,
      sourceType: 'firestore_cms',
      sourceId: 'courses/' + id,
      priority: SOURCE_PRIORITY.firestore_cms,
      verified: true,
      visibility: (raw as any).isPublic === false ? 'private' : 'public',
      updatedAt: String(raw.updatedAt || ''),
    });
  }
  if (raw.ageRange || raw.ageRangeLabel) {
    facts.push({
      key: 'ageRange',
      value: String(raw.ageRange || raw.ageRangeLabel),
      entityType: 'course',
      entityId: id,
      sourceType: 'firestore_cms',
      sourceId: 'courses/' + id,
      priority: SOURCE_PRIORITY.firestore_cms,
      verified: true,
      visibility: (raw as any).isPublic === false ? 'private' : 'public',
      updatedAt: String(raw.updatedAt || ''),
    });
  }

  return {
    id,
    entityType: 'course',
    title: String(raw.title || raw.shortTitle || ''),
    content: cleanText(raw.title, raw.shortTitle, raw.description, raw.overview, raw.duration),
    sourceType: 'firestore_cms',
    sourceId: 'courses/' + id,
    score: 100,
    verified: true,
    visibility: (raw as any).isPublic === false ? 'private' : 'public',
    priority: SOURCE_PRIORITY.firestore_cms,
    facts,
    relationships: [
      ...(Array.isArray(raw.teacherId) ? raw.teacherId.map(String) : raw.teacherId ? [String(raw.teacherId)] : []),
      ...(Array.isArray(raw.teacherIds) ? raw.teacherIds.map(String) : []),
    ],
    language: 'uz',
    updatedAt: String(raw.updatedAt || ''),
  };
}

export function teacherToKnowledgeResult(raw: Record<string, unknown>): KnowledgeResult | null {
  const id = String(raw.id || '');
  if (!id) return null;
  const facts: KnowledgeFact[] = [];
  const exp = Number(raw.experienceYears);
  if (Number.isFinite(exp) && exp > 0) {
    facts.push({
      key: 'experience',
      value: exp,
      entityType: 'teacher',
      entityId: id,
      unit: 'yil',
      sourceType: 'firestore_cms',
      sourceId: 'teachers/' + id,
      priority: SOURCE_PRIORITY.firestore_cms,
      verified: true,
      visibility: (raw as any).isPublic === false ? 'private' : 'public',
      updatedAt: String(raw.updatedAt || ''),
    });
  }

  const subjects = String(raw.subject || '');
  const spec = String(raw.specialization || '');
  return {
    id,
    entityType: 'teacher',
    title: String(raw.name || ''),
    content: cleanText(raw.name, spec || subjects, raw.experience, raw.achievements),
    sourceType: 'firestore_cms',
    sourceId: 'teachers/' + id,
    score: 100,
    verified: true,
    visibility: (raw as any).isPublic === false ? 'private' : 'public',
    priority: SOURCE_PRIORITY.firestore_cms,
    facts,
    relationships: Array.isArray(raw.courseIds) ? raw.courseIds.map(String) : [],
    language: 'uz',
    updatedAt: String(raw.updatedAt || ''),
  };
}

export function resultToKnowledgeResult(raw: Record<string, unknown>): KnowledgeResult | null {
  const id = String(raw.id || '');
  if (!id) return null;
  const visibility: 'public' | 'private' = (raw as any).published === false ? 'private' : 'public';
  const scoreNum = Number(raw.score);
  const facts: KnowledgeFact[] = [];
  if (Number.isFinite(scoreNum) && scoreNum > 0) {
    facts.push({
      key: 'result',
      value: scoreNum,
      entityType: 'result',
      entityId: id,
      unit: 'ball',
      sourceType: 'firestore_cms',
      sourceId: 'results/' + id,
      priority: SOURCE_PRIORITY.firestore_cms,
      verified: visibility === 'public',
      visibility,
      updatedAt: String(raw.updatedAt || ''),
    });
  }

  return {
    id,
    entityType: 'result',
    title: String(raw.studentName || ''),
    content: cleanText(raw.studentName, raw.score ? `${raw.score} ball` : '', raw.university, raw.badge),
    sourceType: 'firestore_cms',
    sourceId: 'results/' + id,
    score: 100,
    verified: visibility === 'public',
    visibility,
    priority: SOURCE_PRIORITY.firestore_cms,
    facts,
    language: 'uz',
    updatedAt: String(raw.updatedAt || ''),
  };
}

export function faqToKnowledgeResult(raw: Record<string, unknown>): KnowledgeResult | null {
  const id = String(raw.id || '');
  if (!id) return null;
  return {
    id,
    entityType: 'faq',
    title: String(raw.question || ''),
    content: String(raw.answer || ''),
    sourceType: 'firestore_cms',
    sourceId: 'faqs/' + id,
    score: 100,
    verified: true,
    visibility: (raw as any).published === false ? 'private' : 'public',
    priority: SOURCE_PRIORITY.firestore_cms,
    language: 'uz',
    updatedAt: String(raw.updatedAt || ''),
  };
}

export function coursePriceFact(course: Record<string, unknown>): KnowledgeFact | null {
  const id = String(course.id || '');
  const monthlyFee = Number(course.monthlyFee);
  if (!id || !Number.isFinite(monthlyFee) || monthlyFee <= 0) return null;
  return {
    key: 'price',
    value: monthlyFee,
    entityType: 'course',
    entityId: id,
    currency: String(course.currency || 'UZS'),
    sourceType: 'firestore_cms',
    sourceId: 'courses/' + id,
    priority: SOURCE_PRIORITY.firestore_cms,
    verified: true,
    visibility: 'public',
    updatedAt: String(course.updatedAt || ''),
  };
}

export function formatPrice(monthlyFee: number): string {
  return formatUzbekSum(monthlyFee);
}

export { KnowledgeEntityType };