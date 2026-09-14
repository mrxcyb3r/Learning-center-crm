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

const CYRILLIC_TO_LATIN: Record<string, string> = {
  'а': 'a', 'б': 'b', 'в': 'v', 'г': 'g', 'д': 'd', 'е': 'e', 'ё': 'yo',
  'ж': 'j', 'з': 'z', 'и': 'i', 'й': 'y', 'к': 'k', 'л': 'l', 'м': 'm',
  'н': 'n', 'о': 'o', 'п': 'p', 'р': 'r', 'с': 's', 'т': 't', 'у': 'u',
  'ф': 'f', 'х': 'x', 'ҳ': 'h', 'ц': 'ts', 'ч': 'ch', 'ш': 'sh', 'щ': 'sh',
  'ъ': '', 'ь': '', 'э': 'e', 'ю': 'yu', 'я': 'ya', 'ў': 'o', 'ғ': 'g', 'қ': 'q'
};

/**
 * Normalize Uzbek text:
 * 1. Lowercase + trim
 * 2. Transliterate Cyrillic to Latin
 * 3. Strip apostrophes (o', g', ', ', `, ʻ, ʼ, ‘)
 * 4. Normalize common phonetic / typo variants (k->q in specific prefixes, etc.)
 */
export function normalizeText(raw: string): string {
  let s = (raw || '').trim().toLowerCase();
  if (!s) return '';

  // Cyrillic to Latin transliteration
  let trans = '';
  for (const ch of s) {
    trans += CYRILLIC_TO_LATIN[ch] !== undefined ? CYRILLIC_TO_LATIN[ch] : ch;
  }
  s = trans;

  // Apostrophe removal
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
      code === 32;
    out += isLetter ? ch : ' ';
  }
  const parts = out.split(' ').filter(Boolean);
  return parts.join(' ');
}

export function tokenize(normalized: string): string[] {
  if (!normalized) return [];
  return normalized.split(' ').filter((w) => w.length > 0);
}

/** Compute Levenshtein distance for fuzzy keyword / entity matching */
export function levenshtein(a: string, b: string): number {
  if (a === b) return 0;
  if (!a) return b.length;
  if (!b) return a.length;
  const m = a.length;
  const n = b.length;
  if (Math.abs(m - n) > 2) return 99;
  const dp: number[] = Array.from({ length: n + 1 }, (_, i) => i);
  for (let i = 1; i <= m; i++) {
    let prev = dp[0];
    dp[0] = i;
    for (let j = 1; j <= n; j++) {
      const temp = dp[j];
      if (a[i - 1] === b[j - 1]) {
        dp[j] = prev;
      } else {
        dp[j] = Math.min(prev + 1, dp[j] + 1, dp[j - 1] + 1);
      }
      prev = temp;
    }
  }
  return dp[n];
}

/** Match keyword with exact phrase inclusion, word boundaries, or token-level fuzzy tolerance */
export function matchesKeyword(normalized: string, keywords: string[], tokens?: string[]): boolean {
  if (!normalized) return false;
  // 1. Direct whole-phrase or substring match
  for (const kw of keywords) {
    if (normalized.includes(kw)) return true;
  }
  // 2. Token-level fuzzy match (tolerance of 1 edit for >= 5 chars, first letter must match)
  const toks = tokens || tokenize(normalized);
  for (const kw of keywords) {
    const kwTokens = kw.split(' ').filter(Boolean);
    if (kwTokens.length === 1) {
      const target = kwTokens[0];
      if (target.length >= 5) {
        for (const tok of toks) {
          if (
            Math.abs(tok.length - target.length) <= 1 &&
            tok[0] === target[0] &&
            levenshtein(tok, target) <= 1
          ) {
            return true;
          }
        }
      }
    }
  }
  return false;
}

// ---------------------------------------------------------------------------
// Course aliases — RETRIEVAL helpers only. They never create course records.
// Each group maps common user phrasings, typos, and variants to canonical courses.
// ---------------------------------------------------------------------------
const COURSE_ALIAS_GROUPS: Array<{ canonical: string; aliases: string[] }> = [
  {
    canonical: 'ielts',
    aliases: [
      'ielts', 'ayelts', 'iels', 'ayles', 'aylts', 'ilts', 'ayeltis', 'ieltskursi', 'ayeltskursi',
      'ielts kursi', 'ielts kurs', 'ielts darslari', 'ielts tayyorlov', 'ielts dars', 'ieltsga tayyorlov',
      'ielts darslar', 'ieltsga'
    ],
  },
  {
    canonical: 'cefr',
    aliases: [
      'cefr', 'sefr', 'tsefr', 'cefr b2', 'cefr c1', 'cefr kursi', 'ingliz tili', 'ingliz tili kursi',
      'english', 'english kids', 'general english', 'kids english', 'ingiliz tili', 'inglis tili',
      'ingliz tili darslari', 'starter', 'beginner', 'elementary', 'pre-intermediate', 'intermediate',
      'upper intermediate', 'cefrga', 'sefrga'
    ],
  },
  {
    canonical: 'dtm',
    aliases: [
      'dtm', 'dtm tayyorlov', 'milliy sertifikat', 'milliy sertifikat kursi', 'milliy sertificat',
      'kirish imtihoni', 'abituriyent', 'abiturient', 'kirish testlari', 'universitetga tayyorlov',
      'majburiy fanlar', 'blok fanlar', 'dtm kursi', 'dtm darslari', 'abituriyentlar'
    ],
  },
  {
    canonical: 'matematika',
    aliases: [
      'matematika', 'matematika kursi', 'fizika', 'matematika fizika', 'aniq fanlar',
      'matem', 'algebra', 'geometriya', 'hisob kitob', 'matematika darslari'
    ],
  },
  {
    canonical: 'ona tili',
    aliases: [
      'ona tili', 'ona tili kursi', 'adabiyot', 'ona tili adabiyot', 'ona tili va adabiyot',
      'onatili', 'grammatika', 'ona tili darslari'
    ],
  },
  {
    canonical: 'mental',
    aliases: [
      'mental arifmetika', 'mental', 'arifmetika', 'soroban', 'tez hisoblash',
      'mental arifmetika kursi', 'mental darslari'
    ],
  },
  {
    canonical: 'sat',
    aliases: ['sat', 'sat kursi', 'sat tayyorlov', 'sat imtihoni'],
  },
  {
    canonical: 'rus tili',
    aliases: ['rus tili', 'rus tili kursi', 'russkiy', 'ruscha', 'rustili', 'rus tili darslari'],
  },
  {
    canonical: 'arab tili',
    aliases: ['arab tili', 'arab tili kursi', 'arabcha', 'tajvid', 'arab tili darslari'],
  },
];

// Greeting keywords - handled BEFORE knowledge retrieval
const GREETING_KEYWORDS = [
  'salom', 'assalomu alaykum', 'assalom', 'hi', 'hello', 'hayrli tong', 'hayrli kun', 'hayrli kech',
  'rahmat', 'katta rahmat', 'xayr', 'ko\'rishguncha', 'salam', 'privet', 'zdravstvuyte', 'assalomualaykum',
  'salom hammaga', 'salom berdim',
];

export function isGreeting(normalized: string): boolean {
  if (!normalized) return false;
  for (const g of GREETING_KEYWORDS) {
    const gNorm = normalizeForMatch(g);
    if (
      normalized === gNorm ||
      normalized.includes(' ' + gNorm + ' ') ||
      normalized.startsWith(gNorm + ' ') ||
      normalized.endsWith(' ' + gNorm)
    ) {
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

// Whole-word and phrase keywords matched against normalized text.
const COURSE_PRICE_KEYWORDS = [
  'narx', 'narxi', 'qancha', 'kancha', 'nech pul', 'nechpul', 'necha pul', 'nechi pul',
  'summ', 'summa', 'baho', 'tolovi', 'tulovi', 'oyiga', 'qanchadan', 'kurs narxi', 'narxlar',
  'narxlari', 'narh', 'narhi', 'narhlar', 'fee', 'cost', 'price', 'how much', 'skolko', 'stoimost',
  'tsena', 'qimmatmi', 'arzonmi', 'oylik tolovi', 'tolash kerak', 'qancha turadi',
];
const COURSE_DESC_KEYWORDS = [
  'haqida', 'tavsif', 'tarkib', 'dastur', 'programma', 'detail', 'maqsad',
  'what is', 'about', 'malumot', 'ma\'lumot', 'nimani orgatadi', 'qanday kurs',
  'kursda nima', 'tushuntirib bering', 'kurs haqida',
];
const COURSE_SCHEDULE_KEYWORDS = [
  'jadval', 'jadvali', 'dars jadvali', 'qaysi kunlari', 'kunlari', 'soat nechada', 'dars vaqti',
  'dars vaqtlari', 'vaqtlari', 'vaqti', 'schedule', 'raspisanie', 'qachon boladi', 'qachon buladi', 'darslar qachon',
  'qaysi vaqtda', 'haftada necha kun', 'kunlari qanaqa', 'kachon buladi', 'kachon boladi',
  'soat nechi', 'ertalabmi', 'kechqurunmi', 'qachon boshlanadi',
];
const COURSE_DURATION_KEYWORDS = [
  'muddati qancha', 'qancha vaqt', 'davomiyligi qancha', 'davomiyligi', 'qancha vaqt davom etadi',
  'davom etadi', 'necha oy', 'nechi oy', 'qancha davom', 'duration', 'muddat',
  'kurs muddati', 'qancha oy', 'necha oyda', 'necha oylik',
];
const COURSE_TEACHER_KEYWORDS = [
  'kim dars', 'ustoz kim', 'oqituvchi kim', 'o\'qituvchi kim', 'oqituvchisi kim', 'oqituvchisi',
  'kim oqitadi', 'kim o\'rgatadi', 'kim dars beradi', 'muallim kim', 'teacher of', 'who teaches',
  'ustoz haqida', 'ustozlari kim', 'ustozlari kimlar',
];
const COURSE_AVAILABILITY_KEYWORDS = [
  'joy bormi', 'ochiqmi', 'qabul bormi', 'guruh bormi', 'mavjudmi', 'available', 'bor mi',
  'yangi guruh', 'joy qoldimi', 'boshlanyaptimi',
];
const RESULTS_GRANTS_KEYWORDS = [
  'natija', 'natijalar', 'natijalari', 'yutuq', 'yutuqlar', 'yutuqlari', 'grant', 'grantlar',
  'davlat granti', 'westminster', 'byudjet', 'byudjetga', 'grantga', 'eng yuqori ball', 'yuqori ball',
  'ballar', 'balli necha', 'balli qancha', 'nechtasi kirdi', 'universitetga kirgan', 'universitetlarga kirdi',
  'sertifikat olganlar', 'bitiruvchilar', 'results', 'achievements', 'nechi ball', 'necha ball',
  'oqishga kirish', 'kirgan talabalar', 'oqishga kirdi', 'talaba boldi', 'nechta oquvchi kirdi',
];
const PAYMENT_KEYWORDS = [
  'tolov usuli', 'tolov usullari', 'to\'lov usullari', 'tolov shakli', 'tolov turlari',
  'tolash', 'qanday tolayman', 'qanday tolasa', 'click', 'payme', 'naqd', 'naqd pul',
  'karta orqali', 'plastik karta', 'plastik', 'kartadan', 'karta orqali tolov', 'payment method',
  'click bormi', 'payme bormi', 'qanday tolov',
];
const BRANCH_ADDR_KEYWORDS = [
  'manzil', 'filial', 'qayerda', 'qayer', 'qatta', 'qattasiz', 'qattasizlar', 'qayerda joylashgan',
  'joylashuv', 'address', 'koring', 'qayerga', 'adres', 'gde nahoditsya', 'moljal', 'mo\'ljal',
  'lokatsiya', 'qaysi tumanda', 'qaysi maktab', 'kaerda', 'kaerda joylashgan',
];
const WORKING_HOURS_KEYWORDS = [
  'ish vaqti', 'ish vaqtlari', 'ish vakti', 'ish vaktlari', 'ish soat', 'ish soatlari',
  'ochilish vaqti', 'yopilish vaqti', 'soat nechadan', 'soat nechagacha', 'ochilasizlar',
  'ochiladi', 'yopiladi', 'opening', 'closing', 'grafik', 'rejim', 'ish rejimi', 'shanba kuni',
  'yakshanba kuni', 'dam olish kuni', 'ochiq boladi', 'ishlaysizlar',
];
const TRIAL_KEYWORDS = [
  'sinov', 'bepul dars', 'trial', 'free lesson', 'probniy', 'tekshiruv darsi',
  'birinchi dars bepul', 'sinab korish', 'bepulmi', 'birinchi darsga',
];
const FAQ_KEYWORDS = [
  'savol javob', 'savol-javob', 'savol javoblar', 'savol-javoblar', 'kop soraladigan',
  'ko\'p so\'raladigan', 'faq', 'frequently', 'savollar', 'beriladigan savol',
];
const CONTACT_KEYWORDS = [
  'boglanish', 'bog\'lanish', 'boglansam', 'qanday boglansam', 'boglanish uchun',
  'telefon', 'telegram', 'email', 'aloqa', 'nomer', 'raqam',
  'connect', 'contact', 'kontakt', 'telefon raqam', 'aloqa raqami',
  'nomer bering', 'kontaktlar', 'email manzili', 'elektron pochta',
];
const TEACHER_KEYWORDS = [
  'oqituvchi', 'ustoz', 'muallim', 'teacher', 'kim dars', 'prepodavatel', 'ustozlar',
  'oqituvchilar', 'o\'qituvchilar', 'pedagoglar', 'jamoa', 'qaysi fandan dars beradi',
  'ustozlar haqida', 'oqituvchilar royxati',
];
const ADMISSION_KEYWORDS = [
  'qabul', 'royxatdan otish', 'ro\'yxatdan o\'tish', 'royxatdan', 'ro\'yxatdan', 'royxatga olish',
  'yozilish', 'yozilsam', 'yozilsam boladi', 'yozilish uchun',
  'yozilmoqchi', 'qanday yozilsa', 'yozilish tartibi', 'qanday yozilaman', 'admission', 'enroll',
  'zapisatsya', 'kursga yozilish', 'kursga qatnashish', 'qanday qatnashsam', 'qabul qachon',
];
const LEVEL_PLACEMENT_KEYWORDS = [
  'daraja', 'placement', 'test natija', 'qaysi guruhga mos', 'guruhga mos', 'level',
  'darajani aniqlash', 'darajam',
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
  | 'level_placement'
  | 'results_grants'
  | 'payment_methods';

type EscalationTarget = 'receptionist' | 'teacher' | 'admin';

interface EscalationRule {
  keys: string[];
  reason: string;
  to: EscalationTarget;
}

// Security: reject attempts to extract internal system instructions or secret tokens
const PROMPT_LEAK_KEYWORDS = [
  'system instruction', 'system prompt', 'tizim prompti', 'promptingiz',
  'api key', 'apikey', 'secret key', 'parol', 'maxfiy kalit', 'tokeningiz',
  'ignore previous instructions', 'override instructions', 'sen kimsan nima topshiriq',
];

// Explicit escalation rules — checked BEFORE intent detection
const ESCALATION_RULES: EscalationRule[] = [
  {
    keys: ['qaytar', 'refund', 'vozvrat', 'vernut', 'pulimni', 'pulni qaytar', 'bekor qilib pul'],
    reason: "To'lovni qaytarish bo'yicha so'rov — moliyaviy qaror talab qiladi, AI qaror qabul qilmaydi.",
    to: 'admin',
  },
  {
    keys: ['qarz', 'qarzdorlik', 'qarzi', 'qarzim'],
    reason: "To'lov bo'yicha savol — moliyaviy masala, operator/Admin ko'rib chiqadi.",
    to: 'admin',
  },
  {
    keys: ['chegirma', 'skidka', 'discount', 'arzonlashtir', 'arzonroq qilib', 'aksiya bormi', 'kamroq qilib'],
    reason: "Chegirma so'rovi — biznes qaror talab qiladi, operator/Admin ko'rib chiqadi.",
    to: 'admin',
  },
  {
    keys: ['shikoyat', 'noroziman', 'norozilik', 'jaloba', 'yomon xizmat', 'yomon oqit', 'ustoz yomon', 'shikoyatim'],
    reason: "Shikoyat — inson ko'rib chiqishi shart.",
    to: 'admin',
  },
  {
    keys: ['maosh', 'oylik maosh', 'oylik maoshi', 'ish haqi', 'zarplata', 'xodimlar oyligi', 'ustozlar oyligi', 'oqituvchilar oyligi'],
    reason: "Maosh/xodimlar masalasi — ichki ma'lumot, faqat Admin ko'radi.",
    to: 'admin',
  },
];

const GROUP_WORD = 'guruh';
const LEVEL_SIGNALS = [
  'daraja', 'ball', 'baholash', 'placement', 'mos', 'oldi', 'topshir',
  'ielts', 'cefr', 'bosqich', 'test', 'darajam',
];

export function detectEscalation(normalized: string): EscalationRule | null {
  // Security guard first
  for (const leak of PROMPT_LEAK_KEYWORDS) {
    if (normalized.includes(leak)) {
      return {
        keys: [leak],
        reason: "Xavfsizlik va maxfiylik qoidalariga binoan ichki tizim ma'lumotlari yoki maxfiy kalitlar taqdim etilmaydi.",
        to: 'admin',
      };
    }
  }

  for (const rule of ESCALATION_RULES) {
    if (rule.keys.some((k) => normalized.includes(k))) return rule;
  }

  // Payment-word escalation only when it is about paying/owing, not when asking about price or payment methods
  if (
    (normalized.includes('tolov') || normalized.includes('tulov') || normalized.includes('payment') || normalized.includes('oplata') || normalized.includes('oplati')) &&
    !matchesKeyword(normalized, COURSE_PRICE_KEYWORDS) &&
    !matchesKeyword(normalized, PAYMENT_KEYWORDS)
  ) {
    return {
      keys: [],
      reason: "To'lov bo'yicha savol — moliyaviy masala, operator/Admin ko'rib chiqadi.",
      to: 'admin',
    };
  }

  if (
    !matchesKeyword(normalized, COURSE_AVAILABILITY_KEYWORDS) &&
    (normalized.includes(GROUP_WORD) || normalized.includes('guruhga') || normalized.includes('sinfga')) &&
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
  const toks = tokenize(normalized);

  // 1. High-specificity intents first
  if (matchesKeyword(normalized, RESULTS_GRANTS_KEYWORDS, toks)) return 'results_grants';
  if (matchesKeyword(normalized, PAYMENT_KEYWORDS, toks)) return 'payment_methods';
  if (matchesKeyword(normalized, TRIAL_KEYWORDS, toks)) return 'trial_lesson';

  // Contact info (prioritize if email / contact is mentioned, to avoid confusion with address)
  if (
    normalized.includes('email') ||
    normalized.includes('pochta') ||
    normalized.includes('telegram') ||
    normalized.includes('telefon') ||
    normalized.includes('aloqa') ||
    normalized.includes('boglan')
  ) {
    if (matchesKeyword(normalized, CONTACT_KEYWORDS, toks)) return 'contact_info';
  }

  // Working hours vs course schedule
  if (matchesKeyword(normalized, WORKING_HOURS_KEYWORDS, toks)) return 'working_hours';

  // Course duration (e.g. "muddati qancha") checked before course price (which has "qancha")
  if (matchesKeyword(normalized, COURSE_DURATION_KEYWORDS, toks)) return 'course_duration';
  if (matchesKeyword(normalized, COURSE_PRICE_KEYWORDS, toks)) return 'course_price';
  if (matchesKeyword(normalized, COURSE_SCHEDULE_KEYWORDS, toks)) return 'course_schedule';
  if (matchesKeyword(normalized, COURSE_TEACHER_KEYWORDS, toks)) return 'course_teacher';
  if (matchesKeyword(normalized, COURSE_AVAILABILITY_KEYWORDS, toks)) return 'course_availability';
  if (matchesKeyword(normalized, ADMISSION_KEYWORDS, toks)) return 'admission';
  if (matchesKeyword(normalized, TEACHER_KEYWORDS, toks)) return 'teacher_info';
  if (matchesKeyword(normalized, BRANCH_ADDR_KEYWORDS, toks)) return 'branch_address';
  if (matchesKeyword(normalized, CONTACT_KEYWORDS, toks)) return 'contact_info';
  if (matchesKeyword(normalized, LEVEL_PLACEMENT_KEYWORDS, toks)) return 'level_placement';
  if (matchesKeyword(normalized, FAQ_KEYWORDS, toks)) return 'faq';
  if (matchesKeyword(normalized, COURSE_DESC_KEYWORDS, toks)) return 'course_description';

  // Direct short course queries (e.g. "IELTS?", "Ayelts", "CEFR")
  // Only apply when query is short (<= 4 words or <= 35 chars) to avoid matching random long sentences
  const wordCount = normalized.split(' ').filter(Boolean).length;
  if (wordCount <= 4 || normalized.length <= 35) {
    for (const g of COURSE_ALIAS_GROUPS) {
      for (const a of g.aliases) {
        if (normalized.includes(normalizeForMatch(a))) {
          return 'course_description';
        }
      }
    }
  }

  return null;
}

/** Detect ALL relevant intents for multi-source questions (V2-style). */
export function detectAllIntents(normalized: string): SupportedIntent[] {
  if (!normalized) return [];
  const out: SupportedIntent[] = [];
  const toks = tokenize(normalized);

  const pairs: Array<[string[], SupportedIntent]> = [
    [RESULTS_GRANTS_KEYWORDS, 'results_grants'],
    [PAYMENT_KEYWORDS, 'payment_methods'],
    [TRIAL_KEYWORDS, 'trial_lesson'],
    [WORKING_HOURS_KEYWORDS, 'working_hours'],
    [COURSE_DURATION_KEYWORDS, 'course_duration'],
    [COURSE_SCHEDULE_KEYWORDS, 'course_schedule'],
    [COURSE_PRICE_KEYWORDS, 'course_price'],
    [COURSE_TEACHER_KEYWORDS, 'course_teacher'],
    [COURSE_AVAILABILITY_KEYWORDS, 'course_availability'],
    [ADMISSION_KEYWORDS, 'admission'],
    [TEACHER_KEYWORDS, 'teacher_info'],
    [BRANCH_ADDR_KEYWORDS, 'branch_address'],
    [CONTACT_KEYWORDS, 'contact_info'],
    [LEVEL_PLACEMENT_KEYWORDS, 'level_placement'],
    [FAQ_KEYWORDS, 'faq'],
    [COURSE_DESC_KEYWORDS, 'course_description'],
  ];

  for (const [keys, intent] of pairs) {
    if (matchesKeyword(normalized, keys, toks) && !out.includes(intent)) {
      out.push(intent);
    }
  }

  if (out.length === 0) {
    for (const g of COURSE_ALIAS_GROUPS) {
      for (const a of g.aliases) {
        if (normalized.includes(normalizeForMatch(a))) {
          out.push('course_description');
          return out;
        }
      }
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

    // 2b) Fuzzy alias match (tolerance for minor typos like ayelts, ayles, tsefr)
    if (score === 0) {
      for (const [aliasNorm, canonical] of NORMALIZED_ALIAS_TO_CANONICAL) {
        if (aliasNorm.length < 4) continue;
        for (const qw of qWords) {
          if (Math.abs(qw.length - aliasNorm.length) <= 1 && levenshtein(qw, aliasNorm) <= 1) {
            if (cText.includes(canonical) || cText.includes(aliasNorm)) {
              score += 45;
              via = via || ('fuzzy_alias:' + aliasNorm);
              break;
            }
          }
        }
        if (score > 0) break;
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
      case 'results_grants': {
        try {
          const { resultsService } = await import('./repository');
          const pubResults = await resultsService.getPublishedResults();
          if (pubResults.length > 0) {
            const lines = pubResults.slice(0, 5).map((r: any) => {
              const parts = [
                r.studentName,
                r.score ? `${r.score} ball` : '',
                r.university,
                r.badge || (r.admissionType === 'Grant' ? 'Davlat granti' : '')
              ].filter(Boolean);
              return parts.join(' — ');
            });
            return [
              {
                text: `Renessans o‘quv markazi o‘quvchilari natijalari va grantlari: ${lines.join('; ')}. O‘quvchilarimiz muntazam ravishda davlat grantlari va nufuzli universitetlarga qabul qilinmoqda.`,
                source: 'Markaz natijalari va grantlari'
              }
            ];
          }
        } catch {
          // ignore error and use verified center achievements fallback
        }
        return [
          {
            text: "Renessans o‘quv markazi natijalari: 187.9 eng yuqori DTM balli (Toshkent Davlat Universiteti davlat granti); IELTS 8.5 ball (Westminster Xalqaro Universiteti 100% grant); 120+ nafar o‘quvchi CEFR B2 va C1 sertifikatlariga ega. Bitiruvchilarimizning 85%+ qismi davlat granti va nufuzli OTMlarga qabul qilingan.",
            source: 'Markaz natijalari va grantlari'
          }
        ];
      }
      case 'payment_methods': {
        return [
          {
            text: "To‘lov usullari: Click va Payme ilovalari orqali onlayn, Uzcard va Humo bank kartalari orqali yoki o‘quv markazi qabulxonasida naqd pul shaklida qabul qilinadi.",
            source: 'To‘lov usullari'
          }
        ];
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
  results: { totalCount: number; grantCount: number };
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

  let resultsList: any[] = [];
  try {
    const { resultsService } = await import('./repository');
    resultsList = await resultsService.getAllResults();
  } catch {
    resultsList = [];
  }
  const publishedResults = resultsList.filter((r: any) => r.published !== false);
  const grantResults = publishedResults.filter((r: any) =>
    (r.badge && String(r.badge).toLowerCase().includes('grant')) ||
    r.admissionType === 'Grant' ||
    (r.university && String(r.university).toLowerCase().includes('grant'))
  );
  if (publishedResults.length === 0) missing.push('O‘quvchilar natijalari/grantlari kiritilmagan');

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
    results: { totalCount: publishedResults.length, grantCount: grantResults.length },
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
    const needsCourses = intents.some((it) =>
      ['course_price', 'course_description', 'course_schedule', 'course_duration', 'course_teacher', 'course_availability', 'trial_lesson', 'admission'].includes(it)
    );
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
