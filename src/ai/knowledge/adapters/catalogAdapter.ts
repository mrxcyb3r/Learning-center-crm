/**
 * Catalog adapter.
 *
 * Fetches the authoritative live catalog (courses, teachers, results, faqs)
 * via the existing repository services, then assembles them with the curated
 * markdown index + contact candidates into a ready-to-query KnowledgeContext.
 *
 * All reads are best-effort: a missing collection must never throw the whole
 * knowledge layer down — it simply yields an empty (but valid) snapshot.
 */

import { coursesService, teachersService, faqsService, resultsService } from '../../../services/repository';
import {
  buildKnowledgeGraph,
  toKnowledgeCourse,
  toKnowledgeTeacher,
  type KnowledgeGraph,
} from '../../../services/aiKnowledge';
import { getKnowledgeIndex, type KnowledgeIndex } from '../loader/loadKnowledge';
import { markdownContactCandidate } from '../retrieval/exact';
import { MARKDOWN_PRIORITY } from '../grounding/sourcePriority';
import {
  buildContactCandidates,
  resolveContact,
} from './centerAdapter';
import type {
  CatalogSnapshot,
  KnowledgeContext,
} from './types';
import type {
  CanonicalContact,
  CanonicalContactInput,
} from '../retrieval/exact';
import { CENTER_IDS } from '../entities/entityTypes';

export async function fetchCatalog(): Promise<CatalogSnapshot> {
  const [courses, teachers, results, faqs] = await Promise.allSettled([
    coursesService.getAllCourses(),
    teachersService.getAllTeachers().catch(() => []),
    resultsService.getPublishedResults(),
    faqsService.getAllFaqs(),
  ]);
  return {
    courses: (courses.status === 'fulfilled' ? courses.value : []) as unknown as Record<string, unknown>[],
    teachers: (teachers.status === 'fulfilled' ? teachers.value : []) as unknown as Record<string, unknown>[],
    results: (results.status === 'fulfilled' ? results.value : []) as unknown as Record<string, unknown>[],
    faqs: (faqs.status === 'fulfilled' ? faqs.value : []) as unknown as Record<string, unknown>[],
    builtAt: new Date().toISOString(),
  };
}

export function buildGraphFromSnapshot(snapshot: CatalogSnapshot): KnowledgeGraph {
  return buildKnowledgeGraph(
    snapshot.courses.map((c) => toKnowledgeCourse(c as any)),
    snapshot.teachers.map((t) => toKnowledgeTeacher(t as any))
  );
}

export function assembleContext(
  snapshot: CatalogSnapshot,
  index: KnowledgeIndex = getKnowledgeIndex(),
  contactCandidates?: CanonicalContactInput
): KnowledgeContext {
  let graph: KnowledgeGraph | null = null;
  try {
    graph = buildGraphFromSnapshot(snapshot);
  } catch {
    graph = null;
  }

  const contactInput = contactCandidates || buildContactCandidates({
    index,
    settings: null,
    landingCms: null,
  });
  // Merge markdown candidates into the contact input (center doc).
  const centerDoc = index.byId.get(CENTER_IDS.CENTER);
  if (centerDoc) {
    const md = markdownContactCandidate(centerDoc, 'markdown', MARKDOWN_PRIORITY);
    for (const field of ['phone', 'telegram', 'email', 'address', 'workingHours'] as const) {
      contactInput[field] = [...(contactInput[field] || []), ...md.filter((c) => c.field === field)];
    }
  }
  const contact: CanonicalContact | null = resolveContact(contactInput);

  return {
    graph,
    index,
    results: snapshot.results,
    faqs: snapshot.faqs,
    contactCandidates: contactInput,
    contact,
  };
}

/** Live one-stop: fetch + assemble. */
export async function buildKnowledgeContext(): Promise<KnowledgeContext> {
  const snapshot = await fetchCatalog();
  return assembleContext(snapshot);
}