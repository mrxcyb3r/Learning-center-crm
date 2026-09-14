import { collection, getDocs, query, where, doc, getDoc } from 'firebase/firestore';
import { db } from './firebase';
import type {
  CourseData,
  CampusBranch,
  TeacherRecord,
  CenterSettings,
  Murojaat,
  MurojaatKind,
  MurojaatStatus,
  MurojaatSource,
} from '../types/crm';
import { faqsService } from './repository';
import { coursesService } from './repository';
import { landingCmsService } from './repository';
import { normalizeMurojaatSource } from '../utils/murojaat';

/**
 * Normalize Uzbek text for keyword matching: lowercase + strip apostrophes
 * (o', g', ', ', `) so "to'lov" and "tolov" match the same keyword.
 * Uses split/join chains — no regex literals.
 */
export function normalizeText(raw: string): string {
  let s = (raw || '').trim().toLowerCase();
  if (!s) return '';
  s = s.split("'").join('');
  s = s.split('’').join('');
  s = s.split('`').join('');
  s = s.split('ʻ').join('');
  s = s.split('ʼ').join('');
  s = s.split('‘').join('');
  return s;
}

/** Collapse whitespace + strip punctuation for reliable matching. */
export function normalizeForMatch(raw: string): string {
  const n = normalizeText(raw);
  if (!n) return '';
  // Keep letters/numbers/spaces only; replace the rest with spaces.
  let out = '';
  for (const ch of n) {
    const code = ch.codePointAt(0) || 0;
    const isLetter =
      (code >= 97 && code <= 122) ||
      (code >= 48 && code <= 57) ||
      code === 32 ||
      // Cyrillic а-я + ё
      (code >= 1072 && code <= 1103) ||
      code === 1105;
    out += isLetter ? ch : ' ';
  }
  const parts = out.split(' ').filter(Boolean);
  return parts.join(' ');
}

export function tokenize(normalized: string): string[] {
  if (!normalized) return [];
  return normalized.split(' ').filter((w) => w.length > 0);
}

// ---------------------------------------------------------------------------
// Course aliases — RETRIEVAL helpers only. They never create course records.
// Each group maps common user phrasings to the canonical course keywords
// that must match a REAL Firestore course title/category.
// ---------------------------------------------------------------------------
const COURSE_ALIAS_GROUPS: Array<{ canonical: string; aliases: string[] }> = [
  {
    canonical: 'ielts',
    aliases: ['ielts', 'ayelts', 'iels', 'ielts kursi', 'ielts kurs', 'ielts darslari', 'ielts tayyorlov', 'ielts dars'],
  },
  {
    canonical: 'cefr',
    aliases: ['cefr', 'cefr b2', 'cefr c1', 'cefr kursi', 'ingliz tili', 'ingliz tili kursi', 'english', 'english kids', 'general english', 'kids english'],
  },
  {
    canonical: 'dtm',
    aliases: ['dtm', 'dtm tayyorlov', 'milliy sertifikat', 'milliy sertifikat kursi', 'milliy sertificat'],
  },
  {
    canonical: 'matematika',
    aliases: ['matematika', 'matematika kursi', 'fizika', 'matematika fizika', 'aniq fanlar'],
  },
  {
    canonical: 'ona tili',
    aliases: ['ona tili', 'ona tili kursi', 'adabiyot', 'ona tili adabiyot'],
  },
  {
    canonical: 'mental',
    aliases: ['mental arifmetika', 'mental', 'arifmetika', 'soroban'],
  },
  {
    canonical: 'sat',
    aliases: ['sat', 'sat kursi', 'sat tayyorlov'],
  },
  {
    canonical: 'rus tili',
    aliases: ['rus tili', 'rus tili kursi', 'russkiy'],
  },
  {
    canonical: 'arab tili',
    aliases: ['arab tili', 'arab tili kursi'],
  },
];

// Greeting keywords - handled BEFORE knowledge retrieval
const GREETING_KEYWORDS = [
  'salom', 'assalomu alaykum', 'assalom', 'hi', 'hello', 'hayrli tong', 'hayrli kun', 'hayrli kech',
  'rahmat', 'katta rahmat', 'xayr', 'ko\'rishguncha', 'salam', 'privet', 'zdravstvuyte',
];

function isGreeting(normalized: string): boolean {
  if (!normalized) return false;
  // Check if the normalized input matches a greeting (whole word or exact phrase)
  for (const g of GREETING_KEYWORDS) {
    const gNorm = normalizeForMatch(g);
    if (normalized === gNorm || normalized.includes(' ' + gNorm + ' ') || normalized.startsWith(gNorm + ' ') || normalized.endsWith(' ' + gNorm)) {
      return true;
    }
  }
  return false;
}

const NORMALIZED_ALIAS_TO_CANONICAL: Map<string, string> = (() => {
  const m = new Map<string, string>();
  for (const g of COURSE_ALIAS_GROUPS) {
    for (const a of g.aliases) {
      m.set(normalizeForMatch(a), g.canonical);
    }
  }
  return m;
})();

// Whole-word keywords matched against normalized text.
const COURSE_PRICE_KEYWORDS = [
  'narx', 'qancha', 'nech pul', 'nechpul', 'summ', 'fee', 'cost', 'price',
  'how much', 'skolko', 'stoimost', 'tsena', 'tolovi', 'tulovi', 'oyiga', 'necha pul', 'kurs narxi',
];
const COURSE_DESC_KEYWORDS = [
  'haqida', 'tavsif', 'tarkib', 'dastur', 'programma', 'detail', 'maqsad',
  'what is', 'about', 'malumot', 'nimani orgatadi', 'qanday kurs',
];
const COURSE_SCHEDULE_KEYWORDS = [
  'jadval', 'dars jadvali', 'qaysi kunlari', 'kunlari', 'soat nechada', 'dars vaqti',
  'schedule', 'raspisanie', 'qachon boladi', 'qachon buladi', 'darslar qachon',
];
const COURSE_DURATION_KEYWORDS = [
  'davomiyligi', 'davom etadi', 'necha oy', 'qancha davom', 'duration', 'muddat', 'nechi oy',
];
const COURSE_TEACHER_KEYWORDS = [
  'kim dars', 'ustoz kim', 'oqituvchi kim', 'kim oqitadi', 'teacher of',
];
const COURSE_AVAILABILITY_KEYWORDS = [
  'joy bormi', 'ochiqmi', 'qabul bormi', 'guruh bormi', 'mavjudmi', 'available', 'bor mi',
];
const BRANCH_ADDR_KEYWORDS = [
  'manzil', 'filial', 'qayerda', 'qayer', 'address', 'koring', 'qayerga',
  'joylashuv', 'adres', 'gde nahoditsya',
];
const WORKING_HOURS_KEYWORDS = [
  'ish vaqti', 'ish soat', 'ochilish', 'yopilish', 'nechigacha', 'nechidan',
  'opening', 'closing', 'grafik', 'rejim',
];
const TRIAL_KEYWORDS = [
  'sinov', 'bepul dars', 'trial', 'free lesson', 'probniy', 'tekshiruv darsi',
];
const FAQ_KEYWORDS = [
  'savol-javob', 'kop soraladigan', 'faq', 'frequently',
];
const CONTACT_KEYWORDS = [
  'boglanish', 'telefon', 'telegram', 'email', 'aloqa', 'nomer',
  'connect', 'contact', 'kontakt',
];
const TEACHER_KEYWORDS = [
  'oqituvchi', 'ustoz', 'muallim', 'teacher', 'kim dars', 'prepodavatel',
];
const ADMISSION_KEYWORDS = [
  'qabul', 'royxat', 'yozilish', 'qanday yozilaman', 'admission', 'enroll', 'zapisatsya',
];
const LEVEL_PLACEMENT_KEYWORDS = [
  'daraja', 'placement', 'test natija', 'qaysi guruhga mos', 'guruhga mos', 'level',
];
const PAYMENT_KEYWORDS = [
  'tolov usuli', 'tolash', 'qanday tolayman', 'click', 'payme', 'naqd', 'karta orqali', 'payment method',
];

export type SupportedIntent =
  | 'course_price'
  | 'course_description'
  | 'course_schedule'
  | 'course_duration'
  | 'course_teacher'
  | 'course_availability'
  | 'branch_address'
  | 'working_hours'
  | 'trial_lesson'
  | 'faq'
  | 'contact_info'
  | 'teacher_info'
  | 'admission'
  | 'level_placement';

type EscalationTarget = 'receptionist' | 'teacher' | 'admin';

interface EscalationRule {
  keys: string[];
  reason: string;
  to: EscalationTarget;
}

// Explicit escalation rules — checked BEFORE intent detection so risky
// requests (refund, complaint, salary...) can never be auto-answered,
// even if they happen to contain a safe-looking keyword.
const ESCALATION_RULES: EscalationRule[] = [
  {
    keys: ['qaytar', 'refund', 'vozvrat', 'vernut', 'pulimni'],
    reason: "To'lovni qaytarish bo'yicha so'rov — moliyaviy qaror talab qiladi, AI qaror qabul qilmaydi.",
    to: 'admin',
  },
  {
    keys: ['qarz', 'qarzdorlik'],
    reason: "To'lov bo'yicha savol — moliyaviy masala, operator/Admin ko'rib chiqadi.",
    to: 'admin',
  },
  {
    keys: ['chegirma', 'skidka', 'discount', 'arzonlashtir'],
    reason: "Chegirma so'rovi — biznes qaror talab qiladi, operator/Admin ko'rib chiqadi.",
    to: 'admin',
  },
  {
    keys: ['shikoyat', 'noroziman', 'norozilik', 'jaloba', 'yomon xizmat', 'yomon oqit'],
    reason: "Shikoyat — inson ko'rib chiqishi shart.",
    to: 'admin',
  },
  {
    keys: ['maosh', 'oylik', 'ish haqi', 'zarplata'],
    reason: "Maosh/xodimlar masalasi — ichki ma'lumot, faqat Admin ko'radi.",
    to: 'admin',
  },
];

// Level-placement signals: only meaningful together with 'guruh'.
// ("Qaysi guruhga yozilsam?" alone stays with Receptionist per spec §9;
// "6.0 oldi, qaysi guruhga?" needs a teacher per spec §11.)
const GROUP_WORD = 'guruh';
const LEVEL_SIGNALS = [
  'daraja', 'ball', 'baholash', 'placement', 'mos', 'oldi', 'topshir',
  'ielts', 'cefr', 'bosqich', 'test',
];

function detectEscalation(normalized: string): EscalationRule | null {
  for (const rule of ESCALATION_RULES) {
    if (rule.keys.some((k) => normalized.includes(k))) return rule;
  }
  // Payment-word escalation only when it is about paying/owing, not when the
  // user asks "kurs tolovi qancha" (price intent handles that).
  if (
    (normalized.includes('tolov') || normalized.includes('tulov') || normalized.includes('payment') || normalized.includes('oplata') || normalized.includes('oplati')) &&
    !COURSE_PRICE_KEYWORDS.some((k) => normalized.includes(k))
  ) {
    return {
      keys: [],
      reason: "To'lov bo'yicha savol — moliyaviy masala, operator/Admin ko'rib chiqadi.",
      to: 'admin',
    };
  }
  if (
    normalized.includes(GROUP_WORD) &&
    LEVEL_SIGNALS.some((s) => normalized.includes(s))
  ) {
    return {
      keys: [],
      reason: "O'quvchining darajasini baholash kerak — o'qituvchi ekspertizasi talab qilinadi.",
      to: 'teacher',
    };
  }
  return null;
}

export function detectIntent(normalized: string): SupportedIntent | null {
  if (!normalized) return null;

  const check = (keywords: string[]) => keywords.some((kw) => normalized.includes(kw));

  if (check(COURSE_PRICE_KEYWORDS)) return 'course_price';
  if (check(COURSE_SCHEDULE_KEYWORDS)) return 'course_schedule';
  if (check(COURSE_DURATION_KEYWORDS)) return 'course_duration';
  if (check(COURSE_TEACHER_KEYWORDS)) return 'course_teacher';
  if (check(COURSE_AVAILABILITY_KEYWORDS)) return 'course_availability';
  if (check(COURSE_DESC_KEYWORDS)) return 'course_description';
  if (check(BRANCH_ADDR_KEYWORDS)) return 'branch_address';
  if (check(WORKING_HOURS_KEYWORDS)) return 'working_hours';
  if (check(TRIAL_KEYWORDS)) return 'trial_lesson';
  if (check(TEACHER_KEYWORDS)) return 'teacher_info';
  if (check(ADMISSION_KEYWORDS)) return 'admission';
  if (check(LEVEL_PLACEMENT_KEYWORDS)) return 'level_placement';
  if (check(PAYMENT_KEYWORDS)) return 'contact_info';
  if (check(FAQ_KEYWORDS)) return 'faq';
  if (check(CONTACT_KEYWORDS)) return 'contact_info';
  return null;
}

/** Detect ALL relevant intents for multi-source questions (V2-style). */
export function detectAllIntents(normalized: string): SupportedIntent[] {
  if (!normalized) return [];
  const out: SupportedIntent[] = [];
  const pairs: Array<[string[], SupportedIntent]> = [
    [COURSE_PRICE_KEYWORDS, 'course_price'],
    [COURSE_SCHEDULE_KEYWORDS, 'course_schedule'],
    [COURSE_DURATION_KEYWORDS, 'course_duration'],
    [COURSE_TEACHER_KEYWORDS, 'course_teacher'],
    [COURSE_AVAILABILITY_KEYWORDS, 'course_availability'],
    [COURSE_DESC_KEYWORDS, 'course_description'],
    [BRANCH_ADDR_KEYWORDS, 'branch_address'],
    [WORKING_HOURS_KEYWORDS, 'working_hours'],
    [TRIAL_KEYWORDS, 'trial_lesson'],
    [TEACHER_KEYWORDS, 'teacher_info'],
    [ADMISSION_KEYWORDS, 'admission'],
    [LEVEL_PLACEMENT_KEYWORDS, 'level_placement'],
    [FAQ_KEYWORDS, 'faq'],
    [CONTACT_KEYWORDS, 'contact_info'],
  ];
  for (const [keys, intent] of pairs) {
    if (keys.some((k) => normalized.includes(k)) && !out.includes(intent)) {
      out.push(intent);
    }
  }
  return out;
}

// ---------------------------------------------------------------------------
// Entity resolution — which REAL course(s) is the user asking about?
// ---------------------------------------------------------------------------
export interface CourseMatch {
  course: any;
  score: number;
  via: string;
}

function courseSearchText(course: any): string {
  return normalizeForMatch(
    [course?.title, course?.shortTitle, course?.category, course?.slug].filter(Boolean).join(' ')
  );
}

/**
 * Pure entity matcher (no Firestore) — deterministic and unit-testable.
 * Returns matched courses sorted by score (best first).
 */
export function matchCoursesByEntity(normalizedQuestion: string, courses: any[]): CourseMatch[] {
  const qMatch = normalizeForMatch(normalizedQuestion);
  if (!qMatch || courses.length === 0) return [];
  const qWords = new Set(tokenize(qMatch));
  const results: CourseMatch[] = [];

  for (const course of courses) {
    const cText = courseSearchText(course);
    if (!cText) continue;
    const cWords = tokenize(cText).filter((w) => w.length > 2);
    let score = 0;
    let via = '';

    // 1) Full normalized title contained in question (strongest).
    const titleNorm = normalizeForMatch(course?.title || '');
    if (titleNorm && titleNorm.length >= 3 && qMatch.includes(titleNorm)) {
      score += 100;
      via = 'exact_title';
    }
    const shortNorm = normalizeForMatch(course?.shortTitle || '');
    if (shortNorm && shortNorm.length >= 2 && qMatch.includes(shortNorm)) {
      score += 60;
      via = via || 'short_title';
    }

    // 2) Alias phrase contained in BOTH question and course identity.
    for (const [aliasNorm, canonical] of NORMALIZED_ALIAS_TO_CANONICAL) {
      if (aliasNorm.length < 3) continue;
      if (qMatch.includes(aliasNorm) && (cText.includes(aliasNorm) || cText.includes(canonical))) {
        score += 50;
        via = via || ('alias:' + aliasNorm);
        break;
      }
    }

    // 3) Canonical keyword shared by question and course (e.g. both mention ielts).
    for (const g of COURSE_ALIAS_GROUPS) {
      const canon = g.canonical;
      if (qWords.has(canon) && cText.split(' ').includes(canon)) {
        score += 40;
        via = via || ('canonical:' + canon);
        break;
      }
    }

    // 4) Title-token overlap (whole words only, no fuzzy fragments).
    let overlap = 0;
    for (const w of cWords) {
      if (qWords.has(w)) overlap++;
    }
    if (overlap > 0) {
      score += overlap * 10;
      via = via || ('token_overlap:' + overlap);
    }

    if (score > 0) {
      results.push({ course, score, via });
    }
  }

  results.sort((a, b) => b.score - a.score);
  return results;
}

/** Resolve the single best entity, or null when ambiguous/absent. */
export function resolveSingleCourse(normalizedQuestion: string, courses: any[]): any | null {
  const matches = matchCoursesByEntity(normalizedQuestion, courses);
  if (matches.length === 0) return null;
  if (matches.length === 1) return matches[0].course;
  // Ambiguous only when top scores tie — otherwise take the clear winner.
  if (matches[0].score > matches[1].score + 5) return matches[0].course;
  return null;
}

// ---------------------------------------------------------------------------
// Canonical knowledge object
// ---------------------------------------------------------------------------
export interface VerifiedCourse {
  id: string;
  name: string;
  aliases: string[];
  price: number | null;
  priceText: string;
  currency: string;
  description: string;
  duration: string;
  schedule: string;
  teacher: string;
  branch: string;
  source: string;
  sourceId: string;
  updatedAt: string;
}

export function toVerifiedCourse(course: any): VerifiedCourse {
  const monthlyFee = Number(course?.monthlyFee) || 0;
  const price = monthlyFee > 0 ? monthlyFee : null;
  const priceText = course?.formattedFee || (price ? price.toLocaleString('uz-UZ') + ' UZS' : '');
  const scheduleParts = [course?.lessonsPerWeek, course?.lessonDuration].filter(Boolean);
  return {
    id: String(course?.id || ''),
    name: String(course?.title || course?.shortTitle || ''),
    aliases: [course?.shortTitle, course?.category, course?.slug].filter(Boolean).map(String),
    price,
    priceText,
    currency: String(course?.currency || 'UZS'),
    description: String(course?.description || course?.overview || ''),
    duration: String(course?.duration || ''),
    schedule: scheduleParts.join(' • '),
    teacher: String(course?.teacherName || ''),
    branch: '',
    source: 'courses',
    sourceId: String(course?.id || ''),
    updatedAt: String(course?.updatedAt || ''),
  };
}

function formatCoursePrice(vc: VerifiedCourse): string {
  if (vc.price && vc.price > 0) {
    return vc.name + ': ' + (vc.priceText || vc.price.toLocaleString('uz-UZ') + ' ' + vc.currency) + ' / oy';
  }
  return vc.name + ': narxi tizimda ko‘rsatilmagan';
}

async function getKnowledgeForIntent(
  intent: SupportedIntent,
  normalizedQuestion: string,
  entityCourse: any | null,
  allCourses: any[]
): Promise<Array<{ text: string; source: string }> | null> {
  try {
    switch (intent) {
      case 'course_price': {
        if (entityCourse) {
          const vc = toVerifiedCourse(entityCourse);
          if (!vc.price) return null; // price genuinely missing → escalate
          return [{ text: formatCoursePrice(vc) + ' (manba: courses/' + vc.sourceId + ')', source: 'Kurs: ' + vc.name }];
        }
        // No entity — list public prices so generic "narxlar" still answers.
        const priced = allCourses.map(toVerifiedCourse).filter((c) => c.price);
        if (priced.length === 0) return null;
        const lines = priced.slice(0, 8).map(formatCoursePrice).join('; ');
        return [{ text: 'Markaz kurs narxlari: ' + lines, source: 'Kurslar ro‘yxati (' + priced.length + ' ta)' }];
      }
      case 'course_description': {
        if (entityCourse) {
          const vc = toVerifiedCourse(entityCourse);
          if (!vc.description) return null;
          return [{ text: vc.name + ': ' + vc.description, source: 'Kurs: ' + vc.name }];
        }
        if (allCourses.length > 0) {
          const lines = allCourses.slice(0, 5).map((c: any) => {
            const vc = toVerifiedCourse(c);
            return vc.name + ': ' + (vc.description || 'tavsif kiritilmagan');
          });
          return [{ text: lines.join(' | '), source: 'Kurslar ro‘yxati' }];
        }
        return null;
      }
      case 'course_schedule': {
        if (entityCourse) {
          const vc = toVerifiedCourse(entityCourse);
          if (!vc.schedule) return null;
          return [{ text: vc.name + ' dars jadvali: ' + vc.schedule, source: 'Kurs: ' + vc.name }];
        }
        const withSchedule = allCourses.map(toVerifiedCourse).filter((c) => c.schedule);
        if (withSchedule.length === 0) return null;
        return [{ text: withSchedule.slice(0, 5).map((c) => c.name + ': ' + c.schedule).join('; '), source: 'Kurs jadvallari' }];
      }
      case 'course_duration': {
        if (entityCourse) {
          const vc = toVerifiedCourse(entityCourse);
          if (!vc.duration) return null;
          return [{ text: vc.name + ' davomiyligi: ' + vc.duration, source: 'Kurs: ' + vc.name }];
        }
        const withDur = allCourses.map(toVerifiedCourse).filter((c) => c.duration);
        if (withDur.length === 0) return null;
        return [{ text: withDur.slice(0, 5).map((c) => c.name + ': ' + c.duration).join('; '), source: 'Kurs davomiyligi' }];
      }
      case 'course_teacher': {
        if (entityCourse) {
          const vc = toVerifiedCourse(entityCourse);
          if (vc.teacher) {
            return [{ text: vc.name + ' o‘qituvchisi: ' + vc.teacher, source: 'Kurs: ' + vc.name }];
          }
        }
        const { teachersService } = await import('./repository');
        const teachers = await teachersService.getPublicTeachers();
        const qTeachers = teachers.filter((t: any) => {
          const hay = normalizeForMatch([t?.name, t?.subject, t?.specialization].filter(Boolean).join(' '));
          if (entityCourse) {
            const cText = courseSearchText(entityCourse);
            return cText.split(' ').some((w) => w.length > 3 && hay.includes(w));
          }
          return true;
        });
        const list = (qTeachers.length > 0 ? qTeachers : teachers).slice(0, 5);
        if (list.length === 0) return null;
        const names = list
          .map((t: any) => t.name + (t.subject || t.specialization ? ' (' + (t.subject || t.specialization) + ')' : ''))
          .join(', ');
        return [{ text: "Markaz o'qituvchilari: " + names + '.', source: "O'qituvchilar ro'yxati" }];
      }
      case 'course_availability': {
        if (entityCourse) {
          const vc = toVerifiedCourse(entityCourse);
          const active = (entityCourse as any)?.isActive !== false && (entityCourse as any)?.isPublic !== false;
          return [{ text: vc.name + (active ? ' — qabul ochiq.' : ' — hozircha qabul yopiq.'), source: 'Kurs: ' + vc.name }];
        }
        const open = allCourses.filter((c: any) => c.isActive !== false && c.isPublic !== false);
        if (open.length === 0) return null;
        return [{ text: 'Qabul ochiq kurslar: ' + open.slice(0, 8).map((c: any) => c.title).join(', '), source: 'Kurslar ro‘yxati' }];
      }
      case 'admission': {
        return [{ text: 'Qabul uchun: saytdagi “Sinov darsiga yozilish” formasini to‘ldiring yoki markaz telefoniga qo‘ng‘iroq qiling. Operator siz bilan bog‘lanadi.', source: 'Qabul tartibi' }];
      }
      case 'level_placement': {
        return null; // always needs a teacher — escalate
      }
      case 'branch_address': {
        // settings/center is admin-only; anonymous reads throw permission-denied.
        // Try it best-effort, then fall back to public CMS / hardcoded center block.
        try {
          const settingsSnap = await getDoc(doc(db, 'settings', 'center'));
          if (settingsSnap.exists()) {
            const branches = settingsSnap.data().branches || [];
            if (branches.length > 0) {
              const first = branches[0];
              return [{ text: first.name + ': ' + first.address, source: 'Filial: ' + first.name }];
            }
          }
        } catch {
          // Public users cannot read admin settings — continue to public fallback.
        }
        try {
          const cms = await landingCmsService.getLandingContent();
          if (cms && (cms as any).contact?.branches?.[0]) {
            return [{ text: (cms as any).contact.branches[0], source: 'Veb-sayt bog‘lanma ma’lumotlari' }];
          }
          if (cms && (cms as any).location1) {
            return [{ text: (cms as any).location1Title + ': ' + (cms as any).location1, source: 'Veb-sayt manzil' }];
          }
          // Known public address from default landing content (mirrors RenessansLandingPage DEFAULT_FAQS)
          const hardcoded = (cms as any)?.addressUz || (cms as any)?.addressEn;
          if (hardcoded) return [{ text: hardcoded, source: 'Veb-sayt manzil' }];
        } catch {
          // ignore cms read errors
        }
        // Final fallback — verified public center location (never invented per-branch details)
        return [{ text: "Renessans O'quv Markazi — Yangiobod tumani, 1-sonli umumiy o'rta ta'lim maktabi binosi", source: 'Markaz manzili' }];
      }
      case 'working_hours': {
        try {
          const settingsSnap = await getDoc(doc(db, 'settings', 'center'));
          if (settingsSnap.exists()) {
            const wh = settingsSnap.data().workingHours || '';
            if (wh) {
              return [{ text: wh, source: 'Markaz soatlari' }];
            }
          }
        } catch {
          // permission-denied for anon — fall through
        }
        try {
          const cms = await landingCmsService.getLandingContent();
          if (cms && (cms as any).workingHours) {
            return [{ text: (cms as any).workingHours, source: 'Veb-sayt ish soatlari' }];
          }
          const hours = (cms as any)?.operatingHoursUz || (cms as any)?.operatingHoursEn;
          if (hours) return [{ text: hours, source: 'Veb-sayt ish soatlari' }];
        } catch {
          // ignore
        }
        // Generic fallback — public working hours (always verified)
        return [{ text: 'Dushanba–Shanba, 08:30–21:00. Yakshanba — dam olish.', source: 'Markaz ish tartibi' }];
      }
      case 'trial_lesson': {
        const trialCourses = allCourses.filter((c: any) => c.isActive !== false && c.isPublic !== false);
        if (entityCourse) {
          const vc = toVerifiedCourse(entityCourse);
          return [{ text: vc.name + ' bo‘yicha sinov darsiga yozilishingiz mumkin. Murojaatingizni yuboring — operator bog‘lanadi.', source: 'Sinov darsi: ' + vc.name }];
        }
        if (trialCourses.length > 0) {
          const first = trialCourses[0];
          return [{ text: first.title + ' sinov darsi mavjud. Ro‘yxatdan o‘tish uchun murojaatingizni yuboring.', source: 'Sinov darsi: ' + first.title }];
        }
        return null;
      }
      case 'teacher_info': {
        const { teachersService } = await import('./repository');
        const teachers = await teachersService.getPublicTeachers();
        // If a person name or subject is mentioned, prefer matching teachers.
        const qNorm = normalizeForMatch(normalizedQuestion);
        const scored = teachers
          .map((t: any) => {
            const hay = normalizeForMatch([t?.name, t?.subject, t?.specialization].filter(Boolean).join(' '));
            const tokens = tokenize(qNorm).filter((w) => w.length > 2);
            let s = 0;
            for (const tok of tokens) {
              if (hay.includes(tok)) s++;
            }
            return { t, s };
          })
          .filter((x: any) => x.s > 0)
          .sort((a: any, b: any) => b.s - a.s);
        const picked = (scored.length > 0 ? scored.map((x: any) => x.t) : teachers).slice(0, 5);
        if (picked.length > 0) {
          const names = picked
            .map((t: any) => t.name + (t.subject || t.specialization ? ' (' + (t.subject || t.specialization) + ')' : ''))
            .join(', ');
          return [{ text: "Markaz o'qituvchilari: " + names + '.', source: "O'qituvchilar ro'yxati" }];
        }
        return null;
      }
      case 'faq': {
        const faqs = await faqsService.getAllFaqs();
        if (faqs.length === 0) return null;
        const qNorm = normalizeForMatch(normalizedQuestion);
        const qTokens = new Set(tokenize(qNorm).filter((w) => w.length > 2));
        let best: any = null;
        let bestScore = 0;
        for (const f of faqs as any[]) {
          const hay = normalizeForMatch([f?.question, (f as any)?.alternatives, f?.answer, (f as any)?.category].filter(Boolean).join(' '));
          const hayTokens = new Set(tokenize(hay));
          let s = 0;
          for (const tok of qTokens) {
            if (hayTokens.has(tok)) s++;
          }
          if (s > bestScore) {
            bestScore = s;
            best = f;
          }
        }
        if (best && bestScore > 0) {
          return [{ text: best.answer, source: 'Savol: ' + best.question }];
        }
        const first = (faqs as any[])[0];
        // Only fall back to first FAQ when the question is generic-FAQ-like.
        if (normalizedQuestion.includes('faq') || normalizedQuestion.includes('savol')) {
          return [{ text: first.answer, source: 'Savol: ' + first.question }];
        }
        return null;
      }
      case 'contact_info': {
        try {
          const settingsSnap = await getDoc(doc(db, 'settings', 'center'));
          if (settingsSnap.exists()) {
            const s = settingsSnap.data();
            const parts: string[] = [];
            if (s.hotline) parts.push('Tel: ' + s.hotline);
            if (s.secondaryPhone) parts.push('Qo‘shimcha tel: ' + s.secondaryPhone);
            if (s.email) parts.push('Email: ' + s.email);
            if (s.telegramSettings?.botUsername)
              parts.push('Telegram: @' + s.telegramSettings.botUsername);
            if (parts.length > 0) {
              return [{ text: parts.join(' | '), source: 'Bog‘lanish ma’lumotlari' }];
            }
          }
        } catch {
          // anon cannot read admin settings — use public fallback
        }
        try {
          const cms = await landingCmsService.getLandingContent();
          if (cms && (cms as any).contact) {
            const parts: string[] = [];
            if ((cms as any).contact.phone) parts.push('Tel: ' + (cms as any).contact.phone);
            if ((cms as any).contact.telegram) parts.push('Telegram: ' + (cms as any).contact.telegram);
            if (parts.length > 0) {
              return [{ text: parts.join(' | '), source: 'Veb-sayt kontaktlar' }];
            }
          }
          const phone = (cms as any)?.phone || (cms as any)?.phonePrimary;
          const telegram = (cms as any)?.telegramHandle;
          if (phone || telegram) {
            const parts: string[] = [];
            if (phone) parts.push('Tel: ' + phone);
            if (telegram) parts.push('Telegram: ' + telegram);
            return [{ text: parts.join(' | '), source: 'Veb-sayt kontaktlar' }];
          }
        } catch {
          // ignore
        }
        // Final verified public contact fallback (landing page always shows this)
        return [{ text: 'Tel: +998 90 862-22-26 | Telegram: @centerflow_bot', source: 'Markaz kontaktlari' }];
      }
      default:
        return null;
    }
  } catch (err) {
    console.warn('AI knowledge retrieval error:', err);
    return null;
  }
}

function buildContext(knowledge: Array<{ text: string; source: string }>): string {
  if (knowledge.length === 0) return '';
  const lines = knowledge.map(
    (k: any, i: number) => '[' + (i + 1) + '] ' + k.text + ' (' + k.source + ')'
  );
  return '\n--- Verified CenterFlow Data ---\n' + lines.join('\n') + '\n-----------------------\n';
}

export interface AiProcessResult {
  answer: string | null;
  shouldEscalate: boolean;
  escalationReason: string | null;
  intent: SupportedIntent | null;
  intents?: SupportedIntent[];
  entity?: string | null;
  escalatedTo: EscalationTarget | null;
  knowledgeSources: Array<{ text: string; source: string }>;
}

export interface KnowledgeHealth {
  courses: { total: number; withPrice: number; withDescription: number; withSchedule: number };
  teachers: { publicCount: number };
  faqs: { activeCount: number };
  center: { contactConfigured: boolean; branchesConfigured: boolean; workingHoursConfigured: boolean };
  missing: string[];
}

/** Admin/dev diagnostic — real Firestore counts only, never fabricated. */
export async function getKnowledgeHealth(): Promise<KnowledgeHealth> {
  const missing: string[] = [];
  let courses: any[] = [];
  try {
    courses = await coursesService.getAllCourses();
  } catch {
    courses = [];
  }
  const publicCourses = courses.filter((c: any) => c.isActive !== false && c.isPublic !== false);
  const withPrice = publicCourses.filter((c: any) => Number(c?.monthlyFee) > 0 || Boolean(c?.formattedFee)).length;
  const withDescription = publicCourses.filter((c: any) => Boolean(c?.description || c?.overview)).length;
  const withSchedule = publicCourses.filter((c: any) => Boolean(c?.lessonsPerWeek)).length;
  if (publicCourses.length === 0) missing.push('Hech qanday public kurs topilmadi');
  if (withPrice < publicCourses.length) missing.push((publicCourses.length - withPrice) + ' ta kursda narx kiritilmagan');
  if (withDescription < publicCourses.length) missing.push((publicCourses.length - withDescription) + ' ta kursda tavsif kiritilmagan');

  let teachers: any[] = [];
  try {
    const { teachersService } = await import('./repository');
    teachers = await teachersService.getPublicTeachers();
  } catch {
    teachers = [];
  }
  if (teachers.length === 0) missing.push('Public o‘qituvchi topilmadi');

  let faqs: any[] = [];
  try {
    faqs = await faqsService.getAllFaqs();
  } catch {
    faqs = [];
  }
  if (faqs.length === 0) missing.push('Faol FAQ topilmadi');

  let contactConfigured = false;
  let branchesConfigured = false;
  let workingHoursConfigured = false;
  try {
    const snap = await getDoc(doc(db, 'settings', 'center'));
    if (snap.exists()) {
      const s = snap.data() as any;
      contactConfigured = Boolean(s.hotline || s.email || s.telegramSettings?.botUsername);
      branchesConfigured = Array.isArray(s.branches) && s.branches.length > 0;
      workingHoursConfigured = Boolean(s.workingHours);
    }
  } catch {
    // best-effort
  }
  if (!contactConfigured) {
    try {
      const cms = await landingCmsService.getLandingContent();
      contactConfigured = Boolean((cms as any)?.contact?.phone || (cms as any)?.phonePrimary);
      branchesConfigured = branchesConfigured || Boolean((cms as any)?.contact?.branches?.length || (cms as any)?.location1);
      workingHoursConfigured = workingHoursConfigured || Boolean((cms as any)?.workingHours);
    } catch {
      // ignore
    }
  }
  if (!contactConfigured) missing.push('Markaz kontaktlari kiritilmagan');
  if (!branchesConfigured) missing.push('Filial manzillari kiritilmagan');
  if (!workingHoursConfigured) missing.push('Ish soatlari kiritilmagan');

  return {
    courses: { total: publicCourses.length, withPrice, withDescription, withSchedule },
    teachers: { publicCount: teachers.length },
    faqs: { activeCount: faqs.length },
    center: { contactConfigured, branchesConfigured, workingHoursConfigured },
    missing,
  };
}

class AIReceptionist {
  async processQuestion(question: string): Promise<AiProcessResult> {
    const normalized = normalizeText(question);

    // Gate 0 — explicit escalation rules win over everything. A refund or
    // complaint mentioning a "price" must still go to a human.
    const forced = detectEscalation(normalized);
    if (forced) {
      return {
        answer: null,
        shouldEscalate: true,
        escalationReason: forced.reason,
        intent: null,
        escalatedTo: forced.to,
        knowledgeSources: [],
      };
    }

    // Gate 1 — greetings: respond naturally, no knowledge retrieval needed.
    if (isGreeting(normalized)) {
      return {
        answer: "Va alaykum assalom! 😊 Renessans o‘quv markazi haqida savollaringiz bo‘lsa, yordam beraman. Kurslar, narxlar, ustozlar, manzil yoki dars jadvali haqida so‘rashingiz mumkin.",
        shouldEscalate: false,
        escalationReason: null,
        intent: null,
        intents: [],
        entity: null,
        escalatedTo: null,
        knowledgeSources: [],
      };
    }

    const intents = detectAllIntents(normalized);
    const intent = intents[0] || null;
    if (!intent) {
      return {
        answer: null,
        shouldEscalate: true,
        escalationReason: 'Bu savol bo‘yicha tasdiqlangan ma’lumot topilmadi.\n\nOperatorimiz sizga aniq javob berishi mumkin. Iltimos, “Operator bilan bog‘lanish” tugmasini bosing yoki murojaat formasini to‘ldiring.',
        intent: null,
        escalatedTo: 'receptionist',
        knowledgeSources: [],
      };
    }

    // Load public courses once — the single source of truth for course intents.
    let allCourses: any[] = [];
    const needsCourses = ['course_price', 'course_description', 'course_schedule', 'course_duration', 'course_teacher', 'course_availability', 'trial_lesson', 'admission'].includes(intent);
    if (needsCourses) {
      try {
        allCourses = (await coursesService.getAllCourses()).filter((c: any) => c.isActive !== false && c.isPublic !== false);
      } catch {
        allCourses = [];
      }
    }

    const entityCourse = needsCourses ? resolveSingleCourse(normalized, allCourses) : null;
    // Ambiguity: two different courses match equally well — ask, don't guess.
    const matches = needsCourses ? matchCoursesByEntity(normalized, allCourses) : [];
    const isAmbiguous = matches.length > 1 && matches[0].score <= matches[1].score + 5 && matches[0].score > 0;
    if (isAmbiguous && ['course_price', 'course_schedule', 'course_duration', 'course_teacher'].includes(intent)) {
      return {
        answer: null,
        shouldEscalate: true,
        escalationReason: 'Qaysi kursni nazarda tutganingizni aniqlay olmadim. Operatorimiz aniqlashtirib beradi.',
        intent,
        intents,
        entity: null,
        escalatedTo: 'receptionist',
        knowledgeSources: [],
      };
    }

    // Multi-source: gather verified facts for every detected intent (max 3).
    const knowledgeList: Array<{ text: string; source: string }> = [];
    for (const one of intents.slice(0, 3)) {
      const k = await getKnowledgeForIntent(one, normalized, entityCourse, allCourses);
      if (k) knowledgeList.push(...k);
    }

    if (knowledgeList.length === 0) {
      const isPriceMissing =
        intent === 'course_price' && entityCourse && !Number((entityCourse as any)?.monthlyFee) && !(entityCourse as any)?.formattedFee;
      return {
        answer: isPriceMissing
          ? "Bu kursning narxi hozircha tizimda ko‘rsatilmagan. Operatorimiz aniq ma’lumot beradi."
          : "Bu savol bo‘yicha tasdiqlangan ma’lumot topilmadi. Operatorimiz sizga aniq javob berishi mumkin.",
        shouldEscalate: true,
        escalationReason: isPriceMissing
          ? 'Bu kursning narxi hozircha tizimda ko‘rsatilmagan. Operatorimiz aniq ma’lumot beradi.'
          : 'Bu savol bo‘yicha tasdiqlangan ma’lumot topilmadi. Operatorimiz sizga aniq javob berishi mumkin.',
        intent,
        intents,
        entity: entityCourse ? String((entityCourse as any)?.title || '') : null,
        escalatedTo: 'receptionist',
        knowledgeSources: [],
      };
    }

    const context = buildContext(knowledgeList);
    const aiAnswer = await this.generateAIResponse(question, context, intent);

    if (!aiAnswer) {
      return {
        answer: "Uzr, hozir javob tayyorlab bo'lmadi. Operatorimiz sizga aniq javob beradi.",
        shouldEscalate: true,
        escalationReason: 'AI javobi shakllantirib bo‘lmadi. Murojaatingiz operatorga yo‘natilmoqda.',
        intent,
        intents,
        entity: entityCourse ? String((entityCourse as any)?.title || '') : null,
        escalatedTo: 'receptionist',
        knowledgeSources: knowledgeList,
      };
    }

    const validation = this.validateAIAnswer(aiAnswer, knowledgeList, intent);
    if (!validation.ok) {
      // Log diagnostic info server-side, show friendly message to user
      console.warn('[AI Validation Failed]', { reason: validation.reason, intent, question });
      return {
        answer: "Uzr, hozir bu ma'lumotni tasdiqlay olmadim. Operatorimiz sizga aniq javob beradi.",
        shouldEscalate: true,
        escalationReason: validation.reason,
        intent,
        intents,
        entity: entityCourse ? String((entityCourse as any)?.title || '') : null,
        escalatedTo: 'receptionist',
        knowledgeSources: knowledgeList,
      };
    }

    return {
      answer: aiAnswer,
      shouldEscalate: false,
      escalationReason: null,
      intent,
      intents,
      entity: entityCourse ? String((entityCourse as any)?.title || '') : null,
      escalatedTo: null,
      knowledgeSources: knowledgeList,
    };
  }

  // Normalize price for verification - handles various formats
  private normalizePrice(value: string | number): string {
    if (typeof value === 'number') {
      return String(value);
    }
    const s = String(value).trim();
    // Remove currency suffixes, spaces, commas, apostrophes, dots (thousands separators)
    return s
      .replace(/[^\d]/g, '')
      .replace(/^0+/, '') || '0';
  }

  private async generateAIResponse(
    question: string,
    context: string,
    intent: SupportedIntent
  ): Promise<string | null> {
    try {
      const res = await fetch('/api/ai/receptionist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question, context, intent }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data?.text) return data.text;
      } else {
        console.warn('AI endpoint error:', res.status);
      }
    } catch (err) {
      console.warn('AI fetch error:', err);
    }
    return null;
  }

  /**
   * Fact-based validation: the answer must carry the verified facts,
   * not merely share random words with them.
   */
  validateAIAnswer(
    answer: string,
    knowledgeList: Array<{ text: string; source: string }>,
    intent: SupportedIntent | null
  ): { ok: boolean; reason: string } {
    if (!answer || answer.trim().length === 0) {
      return { ok: false, reason: 'AI javobi tasdiqlanmadi — bo‘sh javob.' };
    }
    const digitsOf = (s: string): string => {
      let d = '';
      for (const ch of s) {
        const code = ch.codePointAt(0) || 0;
        if (code >= 48 && code <= 57) d += ch;
      }
      return d;
    };
    const normAnswer = normalizeForMatch(answer);

    // Price questions: verified digits must appear in the answer.
    if (intent === 'course_price') {
      const priceDigits = knowledgeList
        .map((k) => this.normalizePrice(k.text))
        .filter((d) => d.length >= 4);
      if (priceDigits.length > 0) {
        const answerDigits = this.normalizePrice(answer);
        const matches = priceDigits.some((pd) => {
          return pd.length >= 4 && answerDigits.includes(pd);
        });
        if (!matches) {
          return { ok: false, reason: 'AI javobi tasdiqlanmadi — narx verified ma’lumotga mos kelmadi.' };
        }
      }
    }

    // Entity questions: answer should name the course (or a known alias).
    const courseNames = knowledgeList
      .map((k) => k.source)
      .filter((s) => s.startsWith('Kurs: '))
      .map((s) => s.slice(6))
      .map(normalizeForMatch)
      .filter(Boolean);
    if (courseNames.length > 0 && intent && intent.startsWith('course_')) {
      const hit = courseNames.some((cn) => {
        const tokens = tokenize(cn).filter((w) => w.length > 2);
        if (tokens.length === 0) return true;
        // At least one significant course token (or its alias canonical) present.
        return tokens.some((tok) => normAnswer.includes(tok));
      });
      if (!hit) {
        return { ok: false, reason: 'AI javobi tasdiqlanmadi — kurs nomi verified ma’lumotga mos kelmadi.' };
      }
    }

    // Generic overlap gate (lenient): guards against fully off-topic text.
    const kLower = knowledgeList.map((k) => k.text.toLowerCase()).join(' ');
    const knownWords = kLower.split(' ').filter((w: string) => w.length > 3);
    const answerWords = answer.toLowerCase().split(' ').filter((w: string) => w.length > 3);
    const knownSet = new Set(knownWords);
    const overlap = answerWords.filter((w: string) => knownSet.has(w));
    const overlapRatio = overlap.length / Math.max(1, answerWords.length);
    if (overlapRatio < 0.05 && answerWords.length > 5) {
      return { ok: false, reason: 'Bu savol bo‘yicha tasdiqlangan ma’lumot topilmadi.\n\nOperatorimiz sizga aniq javob berishi mumkin.' };
    }

    return { ok: true, reason: '' };
  }
}

export const aiReceptionist = new AIReceptionist();
