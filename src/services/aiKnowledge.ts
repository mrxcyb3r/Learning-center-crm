/**
 * Renessans AI Knowledge Layer
 * ---------------------------------
 * A structured knowledge graph built ONLY from authoritative public records
 * (courses, teachers, results, faqs, center contact — read from Firestore).
 *
 * This module is PURE: no Firestore, no I/O. Callers fetch the public records
 * and pass them in, so everything here is deterministic and unit-testable.
 *
 * Responsibilities:
 *  - Normalize entities (Course, Teacher) into stable, searchable records.
 *  - Resolve free-text queries to entities with confidence thresholds.
 *  - Build the Course<->Teacher relationship graph, marking implicit
 *    (subject-derived) links separately from explicit (recorded) links.
 *  - Detect data conflicts (course without teacher, multiple teachers claiming
 *    one course, duplicate aliases, broken ids, invalid prices, ...).
 */

import {
  normalizeForMatch,
  normalizeText,
  tokenize,
  levenshtein,
} from './aiNormalize';

// ---------------------------------------------------------------------------
// Entity records
// ---------------------------------------------------------------------------

export interface KnowledgeCourse {
  id: string;
  canonicalName: string;
  aliases: string[];
  category: string;
  description: string;
  durationText: string;
  scheduleText: string;
  monthlyPrice: number | null;
  priceText: string;
  currency: string;
  ageRange: string;
  features: string[];
  explicitTeacherIds: string[];
  explicitTeacherNames: string[];
  isActive: boolean;
  isPublic: boolean;
  source: string;
  updatedAt: string;
  raw: unknown;
}

export interface KnowledgeTeacher {
  id: string;
  name: string;
  aliases: string[];
  subjectText: string;
  specialization: string;
  subjects: string[];
  experienceYears: number | null;
  experienceText: string;
  achievements: string[];
  isPublic: boolean;
  source: string;
  updatedAt: string;
  raw: unknown;
}

export type RelationshipKind = 'explicit' | 'name' | 'subject';

export interface RelationshipLink {
  courseId: string;
  teacherId: string;
  kind: RelationshipKind;
  confidence: number; // 0..1
}

export type ConflictSeverity = 'info' | 'warning' | 'critical';

export interface KnowledgeIssue {
  code: string;
  severity: ConflictSeverity;
  message: string;
  courseId?: string;
  teacherId?: string;
  affected: string[];
  requiresConfirmation?: boolean;
}

export interface KnowledgeGraph {
  courses: KnowledgeCourse[];
  teachers: KnowledgeTeacher[];
  byCourseId: Map<string, KnowledgeCourse>;
  byTeacherId: Map<string, KnowledgeTeacher>;
  courseTeacher: Map<string, RelationshipLink[]>;
  teacherCourses: Map<string, RelationshipLink[]>;
  issues: KnowledgeIssue[];
  builtAt: string;
}

export interface EntityMatch<T> {
  entity: T;
  score: number;
  via: string;
}

// ---------------------------------------------------------------------------
// Normalization helpers
// ---------------------------------------------------------------------------

const PERSON_HONORIFICS = [
  'ustoz', 'oqituvchi', 'o\'qituvchi', 'muallim', 'teacher', 'aka', 'aka', 'aka.',
  'domla', 'prepodavatel', 'ustozing', 'ustozim',
];

/** Strip honorifics and noise from a person name for matching. */
export function normalizePersonName(raw: string): string {
  const n = normalizeForMatch(raw);
  const toks = tokenize(n);
  const kept = toks.filter((t) => !PERSON_HONORIFICS.includes(t));
  return kept.join(' ');
}

/** True when the query text mentions a person-like name (2+ name tokens or honorific). */
export function looksLikePersonQuery(normalized: string): boolean {
  const n = normalizeForMatch(normalized);
  if (!n) return false;
  const toks = tokenize(n).filter((t) => !PERSON_HONORIFICS.includes(t));
  if (toks.length >= 2) return true;
  return n.includes('ustoz') || n.includes('domla') || n.includes('oqituvchi');
}

/**
 * Build the alias set used to resolve a teacher from free text.
 * Examples: "Jasur Alimov" -> [jasur alimov, jasur, alimov, ustoz jasur, jasur aka, ...]
 */
export function teacherAliases(raw: any): string[] {
  const name = String(raw?.name || '');
  const t = tokenize(normalizeForMatch(name));
  if (t.length === 0) return [];
  const out: string[] = [normalizeForMatch(name)];
  const [first, ...rest] = t;
  out.push(first);
  if (rest.length > 0) out.push(rest[rest.length - 1]); // surname
  if (rest.length > 0) out.push(normalizeForMatch(t.join(''))); // firstsurname
  out.push('ustoz ' + first);
  out.push(first + ' aka');
  out.push('ustoz ' + normalizeForMatch(name));
  if (rest.length > 1) out.push(normalizeForMatch(rest.join(' ')));
  return [...new Set(out.filter(Boolean))];
}

// ---------------------------------------------------------------------------
// Entity builders (from Firestore-shaped records)
// ---------------------------------------------------------------------------

function extractPrice(raw: any): { price: number | null; priceText: string } {
  const num = Number(raw?.monthlyFee);
  const price = Number.isFinite(num) && num > 0 ? num : null;
  const text = String(raw?.formattedFee || (price ? price.toLocaleString('uz-UZ') + ' ' + (raw?.currency || 'UZS') : ''));
  return { price, priceText: text };
}

export function toKnowledgeCourse(raw: any): KnowledgeCourse {
  const { price, priceText } = extractPrice(raw);
  const title = String(raw?.title || raw?.shortTitle || '');
  const category = String(raw?.category || '');
  const short = String(raw?.shortTitle || '');
  const slug = String(raw?.slug || '');
  const aliases = [
    title, short, category, slug,
  ].filter(Boolean).map((s) => normalizeForMatch(s)).filter((s) => s.length >= 2);

  const teacherIds = [
    ...(Array.isArray(raw?.teacherId) ? raw.teacherId : raw?.teacherId ? [raw.teacherId] : []),
    ...(Array.isArray(raw?.teacherIds) ? raw.teacherIds : []),
  ].filter(Boolean).map(String);

  const teacherNames = [];
  if (raw?.teacherName) teacherNames.push(String(raw.teacherName));
  if (raw?.teacher) teacherNames.push(String(raw.teacher));
  if (Array.isArray(raw?.teacherNames)) teacherNames.push(...raw.teacherNames.map(String));

  const scheduleParts = [raw?.lessonsPerWeek, raw?.lessonDuration].filter(Boolean);
  return {
    id: String(raw?.id || ''),
    canonicalName: title,
    aliases,
    category,
    description: String(raw?.description || raw?.overview || ''),
    durationText: String(raw?.duration || ''),
    scheduleText: scheduleParts.join(' • '),
    monthlyPrice: price,
    priceText,
    currency: String(raw?.currency || 'UZS'),
    ageRange: String(raw?.ageRange || raw?.ageRangeLabel || ''),
    features: Array.isArray(raw?.features) ? raw.features.map(String) : [],
    explicitTeacherIds: [...new Set(teacherIds)],
    explicitTeacherNames: [...new Set(teacherNames)],
    isActive: (raw as any)?.isActive !== false && (raw as any)?.isPublic !== false,
    isPublic: (raw as any)?.isPublic !== false,
    source: 'courses/' + (raw?.id || ''),
    updatedAt: String(raw?.updatedAt || ''),
    raw,
  };
}

export function toKnowledgeTeacher(raw: any): KnowledgeTeacher {
  const name = String(raw?.name || '');
  const subjectText = String(raw?.subject || '');
  const spec = String(raw?.specialization || raw?.subject || '');
  const expRaw = String(raw?.experience || raw?.experienceYears || '');
  const expYears = Number(raw?.experienceYears);
  const achievements = Array.isArray(raw?.achievements) ? raw.achievements.map(String) : [];
  let parsedCitizen = 0;
  if (Number.isFinite(expYears) && expYears > 0) {
    parsedCitizen = expYears;
  } else {
    const m = expRaw.match(/(\d+)/);
    if (m) parsedCitizen = Number(m[1]);
  }
  return {
    id: String(raw?.id || ''),
    name,
    aliases: teacherAliases(raw),
    subjectText,
    specialization: spec,
    subjects: [
      ...subjectText.split(/[,&/;+]/),
      ...spec.split(/[,&/;+]/),
    ].map((s) => normalizeForMatch(s)).filter((s) => s.length >= 2),
    experienceYears: parsedCitizen > 0 ? parsedCitizen : null,
    experienceText: expRaw,
    achievements,
    isPublic: (raw as any)?.isPublic !== false,
    source: 'teachers/' + (raw?.id || ''),
    updatedAt: String(raw?.updatedAt || ''),
    raw,
  };
}

// ---------------------------------------------------------------------------
// Teacher entity resolution
// ---------------------------------------------------------------------------

export function resolveTeachers(
  normalizedQuery: string,
  teachers: KnowledgeTeacher[]
): EntityMatch<KnowledgeTeacher>[] {
  const q = normalizeForMatch(normalizedQuery);
  if (!q || teachers.length === 0) return [];
  const qWords = new Set(tokenize(q).filter((w) => w.length > 2));
  const results: EntityMatch<KnowledgeTeacher>[] = [];

  for (const t of teachers) {
    let score = 0;
    let via = '';
    const fullNameNorm = normalizeForMatch(t.name);
    const person = normalizePersonName(q);

    // 1) Exact full name (~score 1000 unique).
    if (fullNameNorm && q.includes(fullNameNorm)) {
      score += 1000;
      via = 'exact_name';
    }

    // 2) Both first AND last names present (order-insensitive) via person tokens.
    if (score < 900) {
      const qPersonTokens = tokenize(person).filter((w) => w.length > 2);
      const nameTokens = tokenize(fullNameNorm).filter((w) => w.length > 2);
      const hit = qPersonTokens.filter((w) => nameTokens.includes(w));
      if (hit.length === 2 && nameTokens.length >= 2) {
        score += 800;
        via = via || 'full_name_tokens';
      } else if (hit.length >= Math.max(1, Math.floor(nameTokens.length * 0.6)) && hit.length > 0) {
        score += 400;
        via = via || 'name_tokens';
      }
    }

    // 3) Alias match (first name, surname, "ustoz Jasur", "Jasur aka").
    if (score < 700) {
      for (const a of t.aliases) {
        const aNorm = a;
        if (aNorm.length >= 2 && (q.includes(' ' + aNorm) || q.startsWith(aNorm) || q.endsWith(aNorm) || q === aNorm)) {
          score += 500;
          via = via || ('alias:' + aNorm);
          break;
        }
      }
    }

    // 4) Fuzzy first-name match (typo tolerance).
    if (score < 300) {
      const firstNameNorm = normalizeForMatch(tokenize(fullNameNorm)[0] || '');
      if (firstNameNorm.length >= 4) {
        for (const qw of qWords) {
          if (qw[0] === firstNameNorm[0] && Math.abs(qw.length - firstNameNorm.length) <= 2 && levenshtein(qw, firstNameNorm) <= 2) {
            score += 250;
            via = via || 'fuzzy_first_name';
            break;
          }
        }
      }
    }

    // 5) Surname-only match.
    if (score < 200) {
      const tokens = tokenize(fullNameNorm);
      const surname = tokens[tokens.length - 1] || '';
      if (surname.length >= 4 && q.includes(surname)) {
        score += 180;
        via = via || 'surname';
      }
    }

    if (score > 0) results.push({ entity: t, score, via });
  }

  results.sort((a, b) => b.score - a.score);
  return results;
}

export function resolveSingleTeacher(
  normalizedQuery: string,
  teachers: KnowledgeTeacher[]
): KnowledgeTeacher | null {
  const matches = resolveTeachers(normalizedQuery, teachers);
  if (matches.length === 0) return null;
  if (matches.length === 1) return matches[0].entity;
  if (matches[0].score > matches[1].score + 80) return matches[0].entity;
  return null;
}

// ---------------------------------------------------------------------------
// Course entity resolution (thin wrapper — canonical matcher in aiReceptionist)
// ---------------------------------------------------------------------------

export function courseSearchText(course: KnowledgeCourse): string {
  return normalizeForMatch(
    [course.canonicalName, ...course.aliases, course.category, course.id].filter(Boolean).join(' ')
  );
}

/** True when the query clearly names a course (not just a teacher). */
export function queryMentionsCourse(normalizedQuery: string, courseAliasById: Map<string, string>): boolean {
  const q = normalizeForMatch(normalizedQuery);
  if (!q) return false;
  for (const alias of courseAliasById.values()) {
    if (alias.length >= 3 && q.includes(alias)) return true;
  }
  return false;
}

// ---------------------------------------------------------------------------
// Relationship graph
// ---------------------------------------------------------------------------

export const RELATIONSHIP_CONFIDENCE = {
  explicit: 1.0,
  name: 0.8,
  subject: 0.5,
} as const;

export function buildKnowledgeGraph(courses: KnowledgeCourse[], teachers: KnowledgeTeacher[]): KnowledgeGraph {
  const byCourseId = new Map<string, KnowledgeCourse>();
  const byTeacherId = new Map<string, KnowledgeTeacher>();
  const courseTeacher = new Map<string, RelationshipLink[]>();
  const teacherCourses = new Map<string, RelationshipLink[]>();

  for (const c of courses) byCourseId.set(c.id, c);
  for (const t of teachers) byTeacherId.set(t.id, t);

  const addLink = (courseId: string, teacherId: string, kind: RelationshipKind, confidence: number) => {
    if (!courseTeacher.has(courseId)) courseTeacher.set(courseId, []);
    if (!teacherCourses.has(teacherId)) teacherCourses.set(teacherId, []);
    const existing = courseTeacher.get(courseId)!.find((l) => l.teacherId === teacherId);
    if (existing) {
      if (confidence > existing.confidence) existing.confidence = confidence;
      return;
    }
    const link: RelationshipLink = { courseId, teacherId, kind, confidence };
    courseTeacher.get(courseId)!.push(link);
    teacherCourses.get(teacherId)!.push(link);
  };

  for (const c of courses) {
    // 1) Explicit: recorded teacher ids on the course.
    for (const tid of c.explicitTeacherIds) {
      if (byTeacherId.has(tid)) {
        addLink(c.id, tid, 'explicit', RELATIONSHIP_CONFIDENCE.explicit);
      }
    }
    // 2) Name link: recorded teacher name on the course -> teacher by name.
    for (const tName of c.explicitTeacherNames) {
      for (const t of teachers) {
        if (normalizeForMatch(t.name) === normalizeForMatch(tName)) {
          addLink(c.id, t.id, 'name', RELATIONSHIP_CONFIDENCE.name);
          break;
        }
      }
    }
    // 3) Implicit subject link: teacher declares the course subject/category.
    //    Kept conservative — a full subject phrase must appear in the course
    //    text (title/category/aliases), or the teacher's subject must equal the
    //    course category. A single loose word ("ingliz") never links, so a
    //    teacher cannot fan out to every course sharing a category word.
    if (c.explicitTeacherIds.length === 0 && c.explicitTeacherNames.length === 0) {
      const cText = normalizeForMatch(
        [c.canonicalName, c.category, ...c.aliases].filter(Boolean).join(' ')
      );
      const subjectNorm = normalizeForMatch(c.category);
      if (cText) {
        for (const t of teachers) {
          const exactPhrase = t.subjects.some((s) => s.length >= 4 && cText.includes(s));
          const subjectEqualsCategory = !!subjectNorm && normalizeForMatch(t.subjectText) === subjectNorm;
          if (exactPhrase || subjectEqualsCategory) {
            addLink(c.id, t.id, 'subject', RELATIONSHIP_CONFIDENCE.subject);
          }
        }
      }
    }
  }

  const issues: KnowledgeIssue[] = [];
  for (const c of courses) issues.push(...analyzeCourseIssues(c, courseTeacher.get(c.id)));
  for (const t of teachers) issues.push(...analyzeTeacherIssues(t, teacherCourses.get(t.id)));

  return {
    courses,
    teachers,
    byCourseId,
    byTeacherId,
    courseTeacher,
    teacherCourses,
    issues,
    builtAt: new Date().toISOString(),
  };
}

function analyzeCourseIssues(c: KnowledgeCourse, links: RelationshipLink[] | undefined): KnowledgeIssue[] {
  const out: KnowledgeIssue[] = [];
  const distinctTeachers = new Set((links || []).map((l) => l.teacherId));

  if (!c.monthlyPrice || c.monthlyPrice <= 0) {
    out.push({
      code: 'course_missing_price',
      severity: 'warning',
      message: 'Kurs narxi kiritilmagan.',
      courseId: c.id,
      affected: [c.canonicalName],
    });
  }
  if (c.monthlyPrice !== null && !Number.isFinite(c.monthlyPrice)) {
    out.push({
      code: 'course_invalid_price',
      severity: 'critical',
      message: 'Kurs narxi noto‘g‘ri (son emas).',
      courseId: c.id,
      affected: [c.canonicalName],
    });
  }
  if (!c.durationText) {
    out.push({
      code: 'course_missing_duration',
      severity: 'warning',
      message: 'Kurs davomiyligi kiritilmagan.',
      courseId: c.id,
      affected: [c.canonicalName],
    });
  }
  if (!c.isPublic) {
    out.push({
      code: 'course_inactive_hidden',
      severity: 'info',
      message: 'Kurs faol emas / public emas — AI bilim tarkibidan chiqarib tashlanadi.',
      courseId: c.id,
      affected: [c.canonicalName],
    });
  }

  if (distinctTeachers.size === 0) {
    out.push({
      code: 'course_without_teacher',
      severity: 'warning',
      message: 'Kursga ustoz biriktirilmagan (kurs yozuvida teacher ko‘rsatilmagan, subyekt bo‘yicha moslik ham topilmadi).',
      courseId: c.id,
      affected: [c.canonicalName],
      requiresConfirmation: true,
    });
  } else if (distinctTeachers.size > 1) {
    const strongest = [...(links || [])].filter((l) => distinctTeachers.has(l.teacherId));
    const nameMap = new Map(strongest.map((l) => [l.teacherId, (c.raw as any)?.teacherName]));
    out.push({
      code: 'course_conflicting_teachers',
      severity: 'warning',
      message: 'Kurs uchun bir nechta ustoz ma’lumoti topildi — konflikt, operator tasdiqlashi kerak.',
      courseId: c.id,
      affected: [...distinctTeachers].map((id) => nameMap.get(id) || id),
      requiresConfirmation: true,
    });
  }

  return out;
}

function analyzeTeacherIssues(t: KnowledgeTeacher, links: RelationshipLink[] | undefined): KnowledgeIssue[] {
  const out: KnowledgeIssue[] = [];
  const distinctCourses = new Set((links || []).map((l) => l.courseId));
  if (distinctCourses.size === 0) {
    out.push({
      code: 'teacher_without_course',
      severity: 'warning',
      message: 'Ustoz hech qanday kursga bog‘lanmagan.',
      teacherId: t.id,
      affected: [t.name],
      requiresConfirmation: true,
    });
  }
  if (!t.experienceYears && !t.experienceText) {
    out.push({
      code: 'teacher_missing_experience',
      severity: 'info',
      message: 'Ustoz tajribasi ko‘rsatilmagan.',
      teacherId: t.id,
      affected: [t.name],
    });
  }
  return out;
}

// ---------------------------------------------------------------------------
// Full knowledge audit (Part 12 health check)
// ---------------------------------------------------------------------------

export function auditKnowledgeGraph(graph: KnowledgeGraph): KnowledgeIssue[] {
  const issues: KnowledgeIssue[] = [...graph.issues];

  // Duplicate canonical course names.
  const courseByName = new Map<string, string[]>();
  for (const c of graph.courses) {
    const key = normalizeForMatch(c.canonicalName);
    if (!key) continue;
    const arr = courseByName.get(key) || [];
    arr.push(c.id);
    courseByName.set(key, arr);
  }
  for (const [name, ids] of courseByName) {
    if (ids.length > 1) {
      issues.push({
        code: 'duplicate_course_entities',
        severity: 'warning',
        message: 'Bir xil nomli kurs yozuvlari takrorlangan.',
        affected: ids,
        requiresConfirmation: true,
      });
    }
  }

  // Duplicate teacher names.
  const teacherByName = new Map<string, string[]>();
  for (const t of graph.teachers) {
    const key = normalizeForMatch(t.name);
    if (!key) continue;
    const arr = teacherByName.get(key) || [];
    arr.push(t.id);
    teacherByName.set(key, arr);
  }
  for (const [name, ids] of teacherByName) {
    if (ids.length > 1) {
      issues.push({
        code: 'duplicate_teacher_entities',
        severity: 'warning',
        message: 'Bir xil ismli ustoz yozuvlari takrorlangan.',
        affected: ids,
        requiresConfirmation: true,
      });
    }
  }

  // Duplicate aliases across different courses (ambiguous routing).
  const aliasOwners = new Map<string, string[]>();
  for (const c of graph.courses) {
    for (const a of new Set(c.aliases)) {
      const owners = aliasOwners.get(a) || [];
      if (!owners.includes(c.id)) owners.push(c.id);
      aliasOwners.set(a, owners);
    }
  }
  for (const [alias, owners] of aliasOwners) {
    if (alias.length >= 3 && owners.length > 1) {
      issues.push({
        code: 'duplicate_course_aliases',
        severity: 'warning',
        message: `"${alias}" aliasi bir nechta kursga mos keladi — ruting noaniq.`,
        affected: owners,
        requiresConfirmation: true,
      });
    }
  }

  // Explicit teacherIds on courses pointing at missing teacher records.
  for (const c of graph.courses) {
    for (const tid of c.explicitTeacherIds) {
      if (!graph.byTeacherId.has(tid)) {
        issues.push({
          code: 'broken_course_teacher_ref',
          severity: 'critical',
          message: `Kurs ${c.canonicalName} teacherId=${tid} ga havola qiladi, lekin bunday ustoz yozuvi yo‘q.`,
          courseId: c.id,
          affected: [c.canonicalName, tid],
        });
      }
    }
  }

  // Explicit teacher names on courses not resolving to any teacher record.
  for (const c of graph.courses) {
    for (const rawName of c.explicitTeacherNames) {
      const matched = graph.teachers.some((t) => normalizeForMatch(t.name) === normalizeForMatch(rawName));
      if (!matched) {
        issues.push({
          code: 'course_teacher_name_unmatched',
          severity: 'warning',
          message: `Kurs ${c.canonicalName} ustoz nomi "${rawName}" ni ko‘rsatadi, lekin ushbu nomda ustoz yozuvi yo‘q.`,
          courseId: c.id,
          affected: [c.canonicalName, rawName],
          requiresConfirmation: true,
        });
      }
    }
  }

  return issues;
}

// ---------------------------------------------------------------------------
// Answers composed straight from the graph (deterministic — no LLM)
// ---------------------------------------------------------------------------

export function formatUzbekPrice(price: number, currency = 'UZS'): string {
  return price.toLocaleString('uz-UZ').replace(/,/g, ' ') + ' ' + currency;
}

export function courseTeacherAnswer(course: KnowledgeCourse, links: RelationshipLink[], teachersById: Map<string, KnowledgeTeacher>): string | null {
  if (links.length === 0) return null;
  const names = links.map((l) => teachersById.get(l.teacherId)?.name || l.teacherId).filter(Boolean);
  if (names.length === 0) return null;
  const isImplicit = links.every((l) => l.kind !== 'explicit' && l.kind !== 'name');
  let answer = course.canonicalName + ' o‘qituvchisi: ' + [...new Set(names)].join(', ');
  if (isImplicit) {
    answer += ' (kurs yozuvida ustoz rasman biriktirilmagan — ko‘rsatilgan ustoz fan yo‘nalishi bo‘yicha moslashtirildi).';
  }
  return answer;
}

export function teacherProfileAnswer(t: KnowledgeTeacher): string {
  const parts: string[] = [];
  parts.push(t.name + ' — ' + (t.specialization || t.subjectText || (t.subjects.length ? t.subjects.join(', ') : 'dars beruvchi ustoz')));
  if (t.experienceYears) {
    parts.push(t.experienceYears + ' yillik tajriba');
  } else if (t.experienceText) {
    parts.push(t.experienceText + ' tajriba');
  }
  if (t.achievements.length > 0) parts.push(t.achievements.join('; '));
  return parts.join('. ') + '.';
}

export function teacherCoursesAnswer(t: KnowledgeTeacher, links: RelationshipLink[], coursesById: Map<string, KnowledgeCourse>): string | null {
  if (!links || links.length === 0) return null;
  const names = links.map((l) => coursesById.get(l.courseId)?.canonicalName || l.courseId).filter(Boolean);
  if (names.length === 0) return null;
  return t.name + ' quyidagi kurslarda dars beradi: ' + [...new Set(names)].join(', ') + '.';
}

/**
 * Reference dossier layer (validation-only, NEVER authoritative).
 * Mirrors what the public site claims so the health check can flag
 * inconsistencies between the live DB and the published site. Removing a
 * teacher from this list changes nothing; adding them to the live `teachers`
 * collection makes them authoritative.
 */
export const REFERENCE_DOSSIERS: Array<{ name: string; subject: string; role: string }> = [
  { name: 'Sardor Qodirov', subject: 'Mental Arifmetika', role: 'public teacher team' },
  { name: 'Nilufar Mansurova', subject: 'Mental Arifmetika', role: 'academic dossier / President school prep' },
  { name: 'Jasur Alimov', subject: 'Matematika & Fizika', role: 'public teacher team' },
  { name: 'Malika Yusupova', subject: 'Ingliz tili', role: 'public teacher team' },
  { name: 'Dr. Sanjar Karimov', subject: 'Tarix • Huquq • Geografiya', role: 'academic dossier' },
  { name: 'Dr. Rustam Zokirov', subject: 'Matematika', role: 'academic dossier' },
  { name: 'Feruza Rahimova', subject: 'CEFR Ingliz Tili', role: 'academic dossier' },
  { name: 'Javohir Rustamov', subject: 'General & Kids English', role: 'academic dossier' },
  { name: 'Azizaxon Olimova', subject: 'Ona Tili va Adabiyot', role: 'academic dossier' },
];

/**
 * Compare the live teacher set against the published site's claimed teachers.
 * Every mismatch is a `requiresConfirmation` item — the database is always
 * authoritative, but the site and the DB should agree.
 */
export function auditPublicSiteConsistency(graph: KnowledgeGraph): KnowledgeIssue[] {
  const issues: KnowledgeIssue[] = [];
  const liveNames = new Set(graph.teachers.map((t) => normalizeForMatch(t.name)));
  const claimedConflictSubjects = new Map<string, string[]>();

  for (const d of REFERENCE_DOSSIERS) {
    const norm = normalizeForMatch(d.name.replace(/^Dr\.\s*/i, '').trim());
    if (liveNames.has(norm)) continue;
    issues.push({
      code: 'site_claims_missing_teacher',
      severity: 'warning',
      message: `Sayt "${d.name}" (${d.role}) ustozini ko'rsatadi, lekin tizimda bunday ustoz yozuvi yo'q.`,
      affected: [d.name],
      requiresConfirmation: true,
    });
  }

  // Teacher claimed for the same subject by multiple sources.
  for (const d of REFERENCE_DOSSIERS) {
    const key = normalizeForMatch(d.subject);
    const arr = claimedConflictSubjects.get(key) || [];
    if (!arr.includes(d.name)) arr.push(d.name);
    claimedConflictSubjects.set(key, arr);
  }
  for (const [subject, names] of claimedConflictSubjects) {
    if (names.length > 1) {
      issues.push({
        code: 'site_subject_teacher_conflict',
        severity: 'warning',
        message: `Sayt ma'lumotlarida "${subject}" bo'yicha bir nechta ustoz ko'rsatilgan: ${names.join(', ')}. Aniqlik kiritish kerak.`,
        affected: names,
        requiresConfirmation: true,
      });
    }
  }
  return issues;
}

/**
 * One-stop knowledge audit. Returns every issue across the graph AND the
 * public-site consistency layer. In production this must be consumed by
 * admin/dev diagnostics only — never exposed to public users.
 */
export function runKnowledgeAudit(graph: KnowledgeGraph): KnowledgeIssue[] {
  return [...auditKnowledgeGraph(graph), ...auditPublicSiteConsistency(graph)];
}

export function summarizeIssues(issues: KnowledgeIssue[]): { critical: number; warning: number; info: number } {
  return {
    critical: issues.filter((i) => i.severity === 'critical').length,
    warning: issues.filter((i) => i.severity === 'warning').length,
    info: issues.filter((i) => i.severity === 'info').length,
  };
}

export function normalizeCourseId(raw: any): string {
  return String(raw?.id || '');
}

// Re-export normalization for callers that previously used aiReceptionist.
export { normalizeForMatch, normalizeText, tokenize, levenshtein };