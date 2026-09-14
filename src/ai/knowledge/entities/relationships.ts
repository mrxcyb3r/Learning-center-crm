/**
 * Renessans AI Knowledge Layer — Entity Relationships
 * -----------------------------------------------------
 * Shared relationship vocabulary and deterministic helpers.
 *
 * The heavy lifting (course <-> teacher graph across authoritative records)
 * lives in the existing `src/services/aiKnowledge.ts` module. This module
 * only adds the relationship *taxonomy* and small pure helpers so callers can
 * query relationships by kind without depending on the graph internals.
 */

import type {
  EntityRelationship,
  RelationshipKind,
} from '../schema/knowledge.schema';
import type {
  KnowledgeCourse,
  KnowledgeTeacher,
  KnowledgeGraph,
  RelationshipLink,
} from '../../../services/aiKnowledge';

export const RELATIONSHIP_DEFINITIONS: Record<
  RelationshipKind,
  { from: string; to: string; label: string; explicitOnly?: boolean } | undefined
> = {
  center_to_branch: { from: 'center', to: 'branch', label: 'Markaz — filial' },
  center_to_course: { from: 'center', to: 'course', label: 'Markaz — kurs' },
  center_to_teacher: { from: 'center', to: 'teacher', label: 'Markaz — ustoz' },
  course_to_teacher: { from: 'course', to: 'teacher', label: 'Kurs — ustoz', explicitOnly: true },
  teacher_to_course: { from: 'teacher', to: 'course', label: 'Ustoz — kurs', explicitOnly: true },
  course_to_subject: { from: 'course', to: 'subject', label: 'Kurs — fan' },
  course_to_program: { from: 'course', to: 'program', label: 'Kurs — dastur' },
  program_to_teacher: { from: 'program', to: 'teacher', label: 'Dastur — ustoz' },
  teacher_to_group: { from: 'teacher', to: 'group', label: 'Ustoz — guruh' },
  result_to_course: { from: 'result', to: 'course', label: 'Natija — kurs' },
  result_to_teacher: { from: 'result', to: 'teacher', label: 'Natija — ustoz' },
  result_to_program: { from: 'result', to: 'program', label: 'Natija — dastur' },
};

export function relationshipLabel(kind: RelationshipKind): string {
  return RELATIONSHIP_DEFINITIONS[kind]?.label || kind;
}

/** True when only explicit, recorded links are acceptable for this kind. */
export function requiresExplicitLink(kind: RelationshipKind): boolean {
  return RELATIONSHIP_DEFINITIONS[kind]?.explicitOnly === true;
}

/**
 * Convert the existing course<->teacher graph links into canonical
 * EntityRelationship records. Explicit and name-based links are mapped to
 * course_to_teacher/teacher_to_course; subject links keep a lowered
 * confidence and stay flagged as implicit.
 */
export function courseTeacherToRelationships(
  graph: KnowledgeGraph
): EntityRelationship[] {
  const out: EntityRelationship[] = [];
  for (const [courseId, links] of graph.courseTeacher) {
    for (const link of links) {
      const explicit = link.kind !== 'subject';
      out.push({
        id: `course_to_teacher:${courseId}:${link.teacherId}`,
        kind: 'course_to_teacher',
        from: courseId,
        to: link.teacherId,
        confidence: link.confidence,
        explicit,
        sourceType: explicit ? 'firestore_cms' : 'markdown',
      });
    }
  }
  for (const [teacherId, links] of graph.teacherCourses) {
    for (const link of links) {
      const explicit = link.kind !== 'subject';
      out.push({
        id: `teacher_to_course:${teacherId}:${link.courseId}`,
        kind: 'teacher_to_course',
        from: teacherId,
        to: link.courseId,
        confidence: link.confidence,
        explicit,
        sourceType: explicit ? 'firestore_cms' : 'markdown',
      });
    }
  }
  return out;
}

/** Courses taught by a teacher, in confidence order, with name lookup. */
export function coursesForTeacher(
  graph: KnowledgeGraph,
  teacherId: string,
  coursesById: Map<string, KnowledgeCourse>
): Array<{ course: KnowledgeCourse; confidence: number; explicit: boolean }> {
  const links: RelationshipLink[] = graph.teacherCourses.get(teacherId) || [];
  return links
    .map((l) => ({ course: coursesById.get(l.courseId), link: l }))
    .filter((x): x is { course: KnowledgeCourse; link: RelationshipLink } => !!x.course)
    .sort((a, b) => b.link.confidence - a.link.confidence)
    .map(({ course, link }) => ({ course, confidence: link.confidence, explicit: link.kind !== 'subject' }));
}

/** Teachers supporting a course, in confidence order, with name lookup. */
export function teachersForCourse(
  graph: KnowledgeGraph,
  courseId: string,
  teachersById: Map<string, KnowledgeTeacher>
): Array<{ teacher: KnowledgeTeacher; confidence: number; explicit: boolean }> {
  const links: RelationshipLink[] = graph.courseTeacher.get(courseId) || [];
  return links
    .map((l) => ({ teacher: teachersById.get(l.teacherId), link: l }))
    .filter((x): x is { teacher: KnowledgeTeacher; link: RelationshipLink } => !!x.teacher)
    .sort((a, b) => b.link.confidence - a.link.confidence)
    .map(({ teacher, link }) => ({ teacher, confidence: link.confidence, explicit: link.kind !== 'subject' }));
}