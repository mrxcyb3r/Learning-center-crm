import { CourseData, StudentResult, TeacherRecord } from '../types/crm';

// ---------------------------------------------------------------------------
// Slug helpers — stable, URL-safe identifiers generated from course titles.
// ---------------------------------------------------------------------------

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/['’]/g, '')
    .replace(/&/g, 'va')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

export function getCourseSlug(course: CourseData): string {
  if (course.slug && course.slug.trim()) return course.slug.trim();
  return slugify(course.title);
}

export function getCourseById(courses: CourseData[], id?: string): CourseData | undefined {
  if (!id) return undefined;
  return courses.find((c) => c.id === id);
}

// ---------------------------------------------------------------------------
// Canonical public URL helpers (uses the actual deployed origin at runtime).
// ---------------------------------------------------------------------------

export function getSiteUrl(): string {
  if (typeof window !== 'undefined' && window.location?.origin) {
    return window.location.origin;
  }
  return '';
}

export function getCourseUrl(slug: string): string {
  return `${getSiteUrl()}/courses/${slug}`;
}

// ---------------------------------------------------------------------------
// Public filtering — only content the admin explicitly published.
// ---------------------------------------------------------------------------

export function isPublished(result: StudentResult): boolean {
  return result.published !== false;
}

export function getPublicResults(results: StudentResult[]): StudentResult[] {
  return results
    .filter(isPublished)
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0) || (a.year < b.year ? 1 : -1));
}

export function getResultsForCourse(results: StudentResult[], course: CourseData): StudentResult[] {
  const cat = course.category?.toLowerCase() ?? '';
  const title = course.title.toLowerCase();
  return getPublicResults(results).filter((r) => {
    const rCat = (r.category ?? '').toLowerCase();
    const rSubject = (r.subject ?? '').toLowerCase();
    const rCourse = (r.courseId ?? '').toLowerCase();
    return (
      r.courseId === course.id ||
      rCat === cat ||
      (rCat !== '' && cat.includes(rCat)) ||
      (rSubject !== '' && title.includes(rSubject)) ||
      rSubject === title
    );
  });
}

// ---------------------------------------------------------------------------
// Teacher helpers — single source of truth for display names (courses → teacher).
// ---------------------------------------------------------------------------

export function getHeadTeacher(teachers: TeacherRecord[], course: CourseData): TeacherRecord | undefined {
  if (course.teacherId) {
    const t = teachers.find((x) => x.id === course.teacherId);
    if (t) return t;
  }
  if (course.teacherName) {
    return teachers.find((x) => x.name.toLowerCase() === (course.teacherName || '').toLowerCase());
  }
  return undefined;
}

// Composes the display name from structured fields when present, else `name`.
export function getTeacherDisplayName(teacher: TeacherRecord): string {
  if (teacher.firstName || teacher.lastName) {
    return [teacher.firstName, teacher.middleName, teacher.lastName].filter(Boolean).join(' ').trim();
  }
  return teacher.name;
}