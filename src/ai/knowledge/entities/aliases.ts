/**
 * Renessans AI Knowledge Layer — Aliases / Query Normalization
 * -------------------------------------------------------------
 * A deterministic alias registry used for entity resolution and intent
 * routing. All matching runs on *normalized* text (see aiNormalize).
 *
 * Rules:
 *  - Multi-word phrases are checked before single words (longest match wins).
 *  - Entity names resolve via exact phrase / alias inclusion only — no
 *    aggressive fuzzy matching, so "jasur" can never drift to another teacher.
 *  - Common typos and Uzbek/Russian/English variants are listed explicitly.
 */

import {
  normalizeForMatch,
  tokenize,
  matchesKeyword,
} from '../../../services/aiNormalize';
import { RESULT_TYPES, type ResultType, COURSE_IDS as CIDS } from './entityTypes';

const COURSE_IDS_DTM = CIDS.DTM_MILLIY_SERTIFIKAT;
const COURSE_IDS_MATH = CIDS.MATEMATIKA_FIZIKA;
const COURSE_IDS_CEFR = CIDS.CEFR_B2_C1;
const COURSE_IDS_KIDS = CIDS.ENGLISH_KIDS;
const COURSE_IDS_MENTAL = CIDS.MENTAL_ARIFMETIKA;
const COURSE_IDS_ONATILI = CIDS.ONA_TILI_ADABIYOTI;

export interface AliasGroup {
  canonical: string;
  aliases: string[];
}

// ---------------------------------------------------------------------------
// Course aliases — retrieval helpers only. Never create course records.
// ---------------------------------------------------------------------------
export const COURSE_ALIAS_GROUPS: AliasGroup[] = [
  {
    canonical: COURSE_IDS_DTM,
    aliases: [
      'dtm', 'dtm kurs', 'dtm kursi', 'dtm tayyorlov', 'milliy sertifikat',
      'milliy sertifikat kursi', 'milliy sertificat', 'milliy sertifikatga tayyorlov',
      'kirish imtihoni', 'abituriyent', 'abiturient', 'kirish testlari',
      'universitetga tayyorlov', 'majburiy fanlar', 'blok fanlar', 'dtm darslari',
      'tarix huquq', 'tarix va huquq', 'milliy sertifikat tayyorlov', 'dtmga tayyorlov',
    ],
  },
  {
    canonical: COURSE_IDS_MATH,
    aliases: [
      'matematika', 'matematika kursi', 'fizika', 'matematika fizika', 'aniq fanlar',
      'matem', 'algebra', 'geometriya', 'matematika darslari', 'olimpiada matematika',
      'olimpiada fizika', 'matematika va fizika',
    ],
  },
  {
    canonical: COURSE_IDS_CEFR,
    aliases: [
      'cefr', 'cefr kurs', 'cefr kursi', 'cefr kurslari', 'b2', 'c1', 'b2 c1',
      'cefr b2', 'cefr c1', 'cefr b2 c1', 'ingliz tili', 'ingliz tili kursi',
      'ingliz kursi', 'english', 'english course', 'ingiliz tili', 'inglis tili',
      'ingliz tili sertifikat', 'cefrga tayyorlov', 'sefr', 'sefrga', 'tsefr',
      'get course english', 'bekind english', 'ingliz tili b2', 'ingliz tili c1',
    ],
  },
  {
    canonical: COURSE_IDS_KIDS,
    aliases: [
      'english kids', 'english kids kursi', 'kids english', 'bolalar ingliz tili',
      'bola uchun ingliz', 'boshlangich ingliz tili', 'ingliz tili bolalar',
      'english bolalar', '3 10 yosh ingliz',
    ],
  },
  {
    canonical: COURSE_IDS_MENTAL,
    aliases: [
      'mental', 'mental arif', 'mental arifmetika', 'mental arifmetikasi',
      'mental arifmetika kursi', 'arifmetika', 'soroban', 'tez hisoblash',
      'mental darslari', 'abakus', 'mental kursi',
    ],
  },
  {
    canonical: COURSE_IDS_ONATILI,
    aliases: [
      'ona tili', 'ona tili kursi', 'ona tili kurs', 'ona tili adabiyot',
      'ona tili va adabiyot', 'onatili', 'ona tili va adabiyoti', 'adabiyot',
      'grammatika', 'ona tili darslari', 'ona tili sertifikat',
    ],
  },
];

/** Map normalized alias -> canonical course id. Longest alias checked first. */
export const COURSE_ALIAS_TO_ID: ReadonlyMap<string, string> = (() => {
  const m = new Map<string, string>();
  for (const g of COURSE_ALIAS_GROUPS) {
    for (const a of g.aliases) m.set(normalizeForMatch(a), g.canonical);
  }
  return m;
})();

// ---------------------------------------------------------------------------
// Contact aliases — canonical contact fields
// ---------------------------------------------------------------------------
export type ContactField = 'phone' | 'telegram' | 'address' | 'workingHours' | 'email';

export const CONTACT_ALIASES: Record<ContactField, string[]> = {
  phone: [
    'telefon', 'telefon raqam', 'telefon raqami', 'telefon raqamingiz', 'raqam',
    'nomer', 'aloqa raqami', 'operator raqami', 'qonqiroq', 'qo\'ng\'iroq',
    'phone', 'number', 'telephone', 'tel raqami', 'tel',
    'телефон', 'номер', 'сколко номер',
  ],
  telegram: [
    'tg', 'telegram', 'telegram username', 'telegram user', 'telegram kanal',
    'tg username', 'telegram manzili', 'telegram nomi',
    'телеграм', 'телеграмм',
  ],
  address: [
    'manzil', 'adres', 'qayerdasizlar', 'qayerdasiz', 'markaz qayerda',
    'markaz qayerda joylashgan', 'lokatsiya', 'joylashuv', 'manzilingiz',
    'qayerda turibsizlar', 'adresingiz', 'qaysi tumanda', 'filial manzili',
    'address', 'location', 'где вы', 'адрес', 'gde nahodites', 'roditel adres',
  ],
  workingHours: [
    'ish vaqti', 'ish vaqtlari', 'ish vaqtingiz', 'ish soat', 'ish soatlari',
    'qachon ochilasiz', 'ochilish vaqti', 'yopilish vaqti', 'grafik',
    'working hours', 'open hours', 'режим работы', 'график работы',
    'qaysi kunlari ochiq', 'dam olish kuni', 'yakshanba ochiq',
  ],
  email: [
    'email', 'elektron pochta', 'pochta manzili', 'email manzil',
    'e mail', 'почта', 'электронная почта',
  ],
};

export const CONTACT_ALIAS_TO_FIELD: ReadonlyMap<string, ContactField> = (() => {
  const m = new Map<string, ContactField>();
  for (const field of Object.keys(CONTACT_ALIASES) as ContactField[]) {
    for (const a of CONTACT_ALIASES[field]) {
      m.set(normalizeForMatch(a), field);
    }
  }
  return m;
})();

// ---------------------------------------------------------------------------
// Result / grant aliases
// ---------------------------------------------------------------------------
export const RESULT_ALIASES: Record<ResultType, string[]> = {
  grant: [
    'grant', 'grantga', 'grantga kirgan', 'grant natijalar', 'davlat granti',
    'grantda', 'grant yutgan', 'grant olgan', 'grant bilan', 'grant olganlar',
    'untu grant', 'byudjet', 'scholarship',
  ],
  dtm: ['dtm natijalar', 'dtm natijasi', 'dtm ball', 'dtm bal', 'dtm 2025', 'dtm 2026', 'olin oliy ball'],
  'milliy-sertifikat': ['milliy sertifikat natija', 'sertifikat natija', 'a natija', 'a plus', 'a+ natija'],
  cefr: ['cefr natija', 'cefr natijalar', 'b2 natija', 'c1 natija', 'sertifikat b2', 'sertifikat c1', 'cefr c1 natija'],
  ielts: ['ielts natija', 'ielts natijalar', 'ielts ball', 'ielts 7', 'ielts 7 5', 'ielts 8'],
  olimpiada: ['olimpiada natija', 'respublika turniri', 'olimpiada', 'turnir natija'],
};

export const RESULT_ALIAS_TO_TYPE: ReadonlyMap<string, ResultType> = (() => {
  const m = new Map<string, ResultType>();
  for (const type of Object.keys(RESULT_ALIASES) as ResultType[]) {
    for (const a of RESULT_ALIASES[type]) m.set(normalizeForMatch(a), type);
  }
  return m;
})();

// ---------------------------------------------------------------------------
// Intent / topic keyword sets (deterministic routing)
// ---------------------------------------------------------------------------
export const GREETING_PHRASES = [
  'salom', 'assalomu alaykum', 'assalom', 'hi', 'hello', 'hayrli tong',
  'hayrli kun', 'hayrli kech', 'salam', 'privet', 'zdravstvuyte',
  'assalomualaykum', 'salom hammaga',
];

export const CORRECTION_PHRASES = [
  'bu emas', 'bu boshqa', 'boshqasi', 'boshqa narsa', 'yoq bu emas',
  'yo\'q bu emas', 'noto\'g\'ri', 'to\'g\'ri emas', 'xato',
  'men boshqa narsani so\'radim', 'men boshqa narsani soradim',
  'bu notogri', 'u emas', 'yana bir',
];

export const FOLLOWUP_PHRASES = [
  'u-chi', 'uchi', 'kim', 'narxi', 'narhi', 'qancha', 'qayerda', 'qachon',
  'shu kursda', 'shu kurs', 'ana osha', 'o\'sha', 'u kursda',
];

export const TRIAL_PHRASES = [
  'sinov darsi', 'sinov', 'bepul dars', 'trial', 'free lesson', 'probniy',
  'birinchi dars', 'sinab korish', 'bepulmi', 'sinov darsiga yozilish',
  'test dars', 'try lesson',
];

export const ENROLLMENT_PHRASES = [
  'qanday yozilsam', 'qanday yozilaman', 'qanday yozilish', 'yozilish uchun',
  'yozilsam boladi', 'yozilish tartibi', 'royxatdan otish',
  'ro\'yxatdan o\'tish', 'qabul', 'qabulga', 'qanday yozilsa',
  'how to enroll', 'how do i enroll', 'admission', 'enroll', 'zapisatsya',
];

export const METHODOLOGY_PHRASES = [
  'metodika', 'metodika qanday', 'dars berish usuli', 'uslub', 'metod',
  'qanday dars beriladi', 'learning method', 'methodology', 'mantiqiy yondashuv',
];

export const PRESIDENT_SCHOOL_PHRASES = [
  'prezident maktab', 'prezident maktabiga', 'prezident maktabiga tayyorlov',
  'prezident school', 'mantiqiy matematika', 'salohiyat', 'diagnostika salohiyat',
  'mock simulyatsiya', 'president school',
];

export const PRIVACY_SIGNALS = [
  'student', 'oquvchi', 'o\'quvchi', 'oquvchilarning raqami', 'student telefon',
  'student phone', 'barcha studentlar', 'all students', 'maosh', 'salary',
  'oylaha', 'ish haqi', 'zarplata', 'crm', 'leads', 'leadlar', 'admin panel',
  'parol', 'password', 'maxfiy', 'secret', 'api key', 'token',
  'royxat leeds', 'private data', 'barcha telefon raqamlar',
];

// ---------------------------------------------------------------------------
// Known stale contact values that must NEVER be returned by the public AI.
// These are documented only so conflict detection can recognise and ignore
// stale sources. See regression tests in tests/staleRegression.test.ts.
// ---------------------------------------------------------------------------
export const STALE_CONTACT_VALUES = {
  phones: [
    '+998 99 592 63 51',
    '998995926351',
    '+998 90 862-22-26',
    '99890862226',
    '+998 (90) 862-22-26',
    '+998 90 123 45 67',
    '998901234567',
  ],
  telegrams: [
    '@renessans_lc_official',
    'renessans_lc_official',
    '@centerflow_bot',
    'centerflow_bot',
    '@Renessans_LeadBot',
  ],
} as const;

export function isStalePhone(raw: string): boolean {
  const digits = raw.replace(/\D/g, '');
  return STALE_CONTACT_VALUES.phones.some((p) => p.replace(/\D/g, '') === digits);
}

export function isStaleTelegram(raw: string): boolean {
  const norm = String(raw || '').trim().toLowerCase().replace(/^@/, '');
  return STALE_CONTACT_VALUES.telegrams.some((t) => t.toLowerCase().replace(/^@/, '') === norm);
}

// ---------------------------------------------------------------------------
// Resolvers
// ---------------------------------------------------------------------------

/** Longest-match course alias resolution against normalized text. */
export function resolveCourseAlias(normalized: string): string | null {
  if (!normalized) return null;
  const norm = normalizeForMatch(normalized);
  if (!norm) return null;
  const phrases = [...COURSE_ALIAS_TO_ID.keys()].sort((a, b) => b.length - a.length);
  for (const alias of phrases) {
    if (alias.length >= 2 && norm.includes(alias)) return COURSE_ALIAS_TO_ID.get(alias) || null;
  }
  return null;
}

/** Resolve which contact field a query is asking about, or null. */
export function resolveContactField(normalized: string): ContactField | null {
  if (!normalized) return null;
  const norm = normalizeForMatch(normalized);
  if (!norm) return null;
  const phrases = [...CONTACT_ALIAS_TO_FIELD.keys()].sort((a, b) => b.length - a.length);
  for (const phrase of phrases) {
    if (phrase.length >= 2 && norm.includes(phrase)) return CONTACT_ALIAS_TO_FIELD.get(phrase) || null;
  }
  return null;
}

/** Resolve which result type the query targets (grant/dtm/cefr/...). */
export function resolveResultType(normalized: string): ResultType | null {
  if (!normalized) return null;
  const norm = normalizeForMatch(normalized);
  if (!norm) return null;
  // Explicit "grant" wins over any other, per the spec mapping.
  const phrases = [...RESULT_ALIAS_TO_TYPE.keys()].sort((a, b) => b.length - a.length);
  for (const phrase of phrases) {
    if (phrase.length >= 3 && norm.includes(phrase)) return RESULT_ALIAS_TO_TYPE.get(phrase) || null;
  }
  return null;
}

/** True when the message is a contextual correction ("bu emas"). */
export function isCorrectionText(normalized: string): boolean {
  if (!normalized) return false;
  const norm = normalizeForMatch(normalized);
  if (!norm) return false;
  const toks = tokenize(norm);
  if (toks.length > 10) return false;
  return matchesKeyword(norm, CORRECTION_PHRASES.map((p) => normalizeForMatch(p)));
}

/** True when the message reads like a bare follow-up needing last-entity. */
export function isFollowUpText(normalized: string): boolean {
  if (!normalized) return false;
  const norm = normalizeForMatch(normalized);
  if (!norm) return false;
  const toks = tokenize(norm);
  if (toks.length === 0 || toks.length > 6) return false;
  return matchesKeyword(norm, FOLLOWUP_PHRASES.map((p) => normalizeForMatch(p)));
}

export function mentionsTrial(normalized: string): boolean {
  return matchesKeyword(normalizeForMatch(normalized), TRIAL_PHRASES.map((p) => normalizeForMatch(p)));
}

export function mentionsEnrollment(normalized: string): boolean {
  return matchesKeyword(normalizeForMatch(normalized), ENROLLMENT_PHRASES.map((p) => normalizeForMatch(p)));
}

export function mentionsMethodology(normalized: string): boolean {
  return matchesKeyword(normalizeForMatch(normalized), METHODOLOGY_PHRASES.map((p) => normalizeForMatch(p)));
}

export function mentionsPresidentSchool(normalized: string): boolean {
  return matchesKeyword(normalizeForMatch(normalized), PRESIDENT_SCHOOL_PHRASES.map((p) => normalizeForMatch(p)));
}

/** True when the query clearly requests information marked private. */
export function mentionsPrivateData(normalized: string): boolean {
  return matchesKeyword(normalizeForMatch(normalized), PRIVACY_SIGNALS.map((p) => normalizeForMatch(p)));
}

export { RESULT_TYPES };
export type { ResultType };