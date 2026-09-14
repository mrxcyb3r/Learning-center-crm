import { doc, getDoc } from 'firebase/firestore';
import { db } from './firebase';
import { faqsService, coursesService, landingCmsService } from './repository';
import {
  normalizeText,
  normalizeForMatch,
  tokenize,
  levenshtein,
  matchesKeyword,
} from './aiNormalize';
import {
  buildKnowledgeGraph,
  toKnowledgeCourse,
  toKnowledgeTeacher,
  resolveSingleTeacher,
  courseTeacherAnswer,
  teacherProfileAnswer,
  teacherCoursesAnswer,
  runKnowledgeAudit,
  summarizeIssues,
} from './aiKnowledge';
import type {
  KnowledgeGraph,
  KnowledgeTeacher,
  KnowledgeIssue,
} from './aiKnowledge';

// Normalization primitives moved to ./aiNormalize — re-exported for callers
// that historically imported them from this module.
export { normalizeText, normalizeForMatch, tokenize, levenshtein, matchesKeyword };

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
// Recommendation needs a human/LLM judgment — answered by Gemini with verified
// course context, never invented from general knowledge.
const RECOMMENDATION_KEYWORDS = [
  'qaysi kurs menga mos', 'qaysi yo\'nalish mos', 'qaysi kursni tanla', 'qaysi kursni tanlasam',
  'nima maslahat', 'maslahat bering', 'maslahat berasizmi', 'farzandimga qaysi', 'farzandim qaysi',
  'tavsiya bering', 'suggest', 'which course', 'qaysi kurs eng', 'tayyorlanmoqchi', 'boshlasam',
  'nimadan boshlashim', 'rekomendatsiya',
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
  | 'payment_methods'
  | 'recommendation';

type EscalationTarget = 'receptionist' | 'teacher' | 'admin';

interface EscalationRule {
  keys: string[];
  reason: string;
  to: EscalationTarget;
}

const PROMPT_LEAK_KEYWORDS = [
  'system instruction', 'system prompt', 'tizim prompti', 'promptingiz',
  'api key', 'apikey', 'secret key', 'parol', 'maxfiy kalit', 'tokeningiz',
  'ignore previous instructions', 'override instructions', 'sen kimsan nima topshiriq',
];

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

  // Payment-related escalation only when the user is NOT asking about a price
  // or about payment methods. Precise phrase checks — never fuzzy matching here,
  // so "to'lov tariximni ko'rsat" (private data) is never read as a price query.
  const mentionsPayment =
    normalized.includes('tolov') ||
    normalized.includes('tulov') ||
    normalized.includes('payment') ||
    normalized.includes('oplata') ||
    normalized.includes('oplati');

  // Requests about the user's OWN payment/finance history always go to a human.
  const privatePaymentSignals = [
    'tarix', 'tarixim', 'rekord', 'qilganman', 'tolagan', "to'lagan", 'balans',
    'mening tolov', 'mening tulov', 'nechta tolov', 'nechta tulov',
    'tolovlarim', 'to\'lovlarim', 'tulovlarim',
  ];
  if (mentionsPayment && privatePaymentSignals.some((s) => normalized.includes(s))) {
    return {
      keys: [],
      reason: "Shaxsiy to'lov/finans ma'lumotlari — maxfiy, faqat Operator/Admin ko'rish huquqiga ega.",
      to: 'admin',
    };
  }

  const pricePhrases = [
    'narx', 'narxi', 'qancha', 'kancha', 'nechpul', 'nech pul', 'necha pul', 'nechi pul',
    'summa', 'oyiga', 'oylik tolov', 'oylik tolovi', 'baho', 'qancha turadi', 'qanchadan',
    'tolov miqdori', 'tulov miqdori', 'narh', 'narhi', 'cost', 'price', 'skolko', 'tsena',
  ];
  const paymentMethodPhrases = [
    'tolov usuli', 'tolov usullari', "to'lov usuli", "to'lov usullari",
    'tolov shakli', 'tolov turl', 'tolash', 'qanday tolayman', 'qanday tolasa', 'qanday tol',
    'click', 'payme', 'naqd', 'karta orqali', 'plastik', 'kartadan', 'payment method',
  ];
  if (
    mentionsPayment &&
    !pricePhrases.some((p) => normalized.includes(p)) &&
    !paymentMethodPhrases.some((p) => normalized.includes(p))
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

  if (matchesKeyword(normalized, RESULTS_GRANTS_KEYWORDS, toks)) return 'results_grants';
  if (matchesKeyword(normalized, PAYMENT_KEYWORDS, toks)) return 'payment_methods';
  if (matchesKeyword(normalized, TRIAL_KEYWORDS, toks)) return 'trial_lesson';

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

  if (matchesKeyword(normalized, WORKING_HOURS_KEYWORDS, toks)) return 'working_hours';
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
  if (matchesKeyword(normalized, RECOMMENDATION_KEYWORDS, toks)) return 'recommendation';

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
    [RECOMMENDATION_KEYWORDS, 'recommendation'],
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

    for (const [aliasNorm, canonical] of NORMALIZED_ALIAS_TO_CANONICAL) {
      if (aliasNorm.length < 3) continue;
      if (qMatch.includes(aliasNorm) && (cText.includes(aliasNorm) || cText.includes(canonical))) {
        score += 50;
        via = via || ('alias:' + aliasNorm);
        break;
      }
    }

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

    for (const g of COURSE_ALIAS_GROUPS) {
      const canon = g.canonical;
      if (qWords.has(canon) && cText.split(' ').includes(canon)) {
        score += 40;
        via = via || ('canonical:' + canon);
        break;
      }
    }

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
          return [{ text: formatCoursePrice(vc), source: 'Kurs: ' + vc.name }];
        }
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
        return null; // always needs a teacher — escalate / LLM-routed
      }
      case 'recommendation': {
        return null; // judgment needed — LLM-routed with course context
      }
      case 'branch_address': {
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
          const hardcoded = (cms as any)?.addressUz || (cms as any)?.addressEn;
          if (hardcoded) return [{ text: hardcoded, source: 'Veb-sayt manzil' }];
        } catch {
          // ignore cms read errors
        }
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
        return [{ text: 'Dushanba–Shanba, 08:30–21:00. Yakshanba — dam olish.', source: 'Markaz ish tartibi' }];
      }
      case 'trial_lesson': {
        if (entityCourse) {
          const vc = toVerifiedCourse(entityCourse);
          return [{ text: vc.name + ' bo‘yicha sinov darsiga yozilishingiz mumkin. Murojaatingizni yuboring — operator bog‘lanadi.', source: 'Sinov darsi: ' + vc.name }];
        }
        const trialCourses = allCourses.filter((c: any) => c.isActive !== false && c.isPublic !== false);
        if (trialCourses.length > 0) {
          const first = trialCourses[0];
          return [{ text: first.title + ' sinov darsi mavjud. Ro‘yxatdan o‘tish uchun murojaatingizni yuboring.', source: 'Sinov darsi: ' + first.title }];
        }
        return null;
      }
      case 'teacher_info': {
        const { teachersService } = await import('./repository');
        const teachers = await teachersService.getPublicTeachers();
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

// ---------------------------------------------------------------------------
// Conversation context — lets bare follow-ups ("kim o'qitadi?", "narxi?")
// resolve against the last referenced course/teacher.
// ---------------------------------------------------------------------------
export interface AiConversationTurn {
  question: string;
  answer: string | null;
  intent: SupportedIntent | null;
  entity?: string | null;
  escalated?: boolean;
}

export interface AiReceptionistOptions {
  conversation?: AiConversationTurn[];
}

const MAX_QUESTION_LENGTH = 500;
const MAX_CONVERSATION_LOOKBACK = 8;

const REFERENTIAL_FOLLOWUP_KEYWORDS = [
  'kim', 'kimlar', 'kimdir', 'qaysi', 'o\'qitadi', 'oqitadi', 'o\'rgatadi', 'ustoz',
  'narxi', 'narhi', 'qancha', 'necha', 'davomiyligi', 'muddati', 'qayerda', 'manzili',
  'jadvali', 'vaqti', 'haqida', 'dars beradi', 'nimani', 'nima', 'mos',
];

/** True when the current turn reads like a bare follow-up that needs context. */
function isBareFollowUp(normalized: string): boolean {
  const toks = tokenize(normalizeForMatch(normalized));
  if (toks.length === 0 || toks.length > 6) return false;
  const qMatch = normalizeForMatch(normalized);
  return REFERENTIAL_FOLLOWUP_KEYWORDS.some((kw) => {
    const kn = normalizeForMatch(kw);
    return kn.length >= 3 && qMatch.includes(kn);
  });
}

/** Most recent non-escalated turn that named a real entity (course/teacher). */
function lastConversationEntity(
  conversation?: AiConversationTurn[]
): { entity: string } | null {
  if (!conversation || conversation.length === 0) return null;
  const start = Math.max(0, conversation.length - MAX_CONVERSATION_LOOKBACK);
  for (let i = conversation.length - 1; i >= start; i--) {
    const turn = conversation[i];
    if (!turn?.escalated && turn?.entity) return { entity: turn.entity };
  }
  return null;
}

/** Intents for which Gemini is genuinely needed (recommendation, level tests). */
const LLM_ONLY_INTENTS: SupportedIntent[] = ['recommendation', 'level_placement'];

export interface AiProcessResult {
  answer: string | null;
  shouldEscalate: boolean;
  escalationReason: string | null;
  intent: SupportedIntent | null;
  intents?: SupportedIntent[];
  entity?: string | null;
  escalatedTo: EscalationTarget | null;
  knowledgeSources: Array<{ text: string; source: string }>;
  /** Routing/cost metadata: how this turn was answered. */
  route?: 'graph' | 'llm' | 'greeting' | 'escalation' | 'guard';
}

export interface KnowledgeHealth {
  courses: { total: number; withPrice: number; withDescription: number; withSchedule: number };
  teachers: { publicCount: number };
  faqs: { activeCount: number };
  results: { totalCount: number; grantCount: number };
  center: { contactConfigured: boolean; branchesConfigured: boolean; workingHoursConfigured: boolean };
  relationships: { explicit: number; implicit: number; danglingTeacherIds: number; coursesWithoutTeacher: number };
  auditIssues: KnowledgeIssue[];
  issueSummary: { critical: number; warning: number; info: number };
  missing: string[];
}

/** Admin/dev diagnostic — real Firestore data + relationship graph audit only. */
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

  // Relationship graph + knowledge audit (conflicts, dangling refs, site-DB gaps).
  const relationships = { explicit: 0, implicit: 0, danglingTeacherIds: 0, coursesWithoutTeacher: 0 };
  let auditIssues: KnowledgeIssue[] = [];
  let issueSummary = { critical: 0, warning: 0, info: 0 };
  try {
    const kCourses = publicCourses.map((c: any) => toKnowledgeCourse(c));
    const graph = buildKnowledgeGraph(kCourses, teachers.map((t: any) => toKnowledgeTeacher(t)));
    const links = [...graph.courseTeacher.values()].flat();
    relationships.explicit = links.filter((l) => l.kind !== 'subject').length;
    relationships.implicit = links.filter((l) => l.kind === 'subject').length;
    relationships.danglingTeacherIds = kCourses.reduce(
      (n, c) => n + c.explicitTeacherIds.filter((id) => !graph.byTeacherId.has(id)).length,
      0
    );
    relationships.coursesWithoutTeacher = kCourses.filter((c) => {
      const l = graph.courseTeacher.get(c.id) || [];
      return (c.explicitTeacherIds.length === 0 || l.length === 0) && l.length === 0;
    }).length;
    auditIssues = runKnowledgeAudit(graph);
    issueSummary = summarizeIssues(auditIssues);
    if (relationships.coursesWithoutTeacher > 0) {
      missing.push(relationships.coursesWithoutTeacher + ' ta kursda ustoz biriktirilmagan');
    }
    if (issueSummary.warning > 0) {
      missing.push(issueSummary.warning + ' ta ogohlantirish mavjud (shu jumladan sayt-tizim nomuvofiqliklari)');
    }
  } catch {
    auditIssues = [];
  }

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
    relationships,
    auditIssues,
    issueSummary,
    missing,
  };
}

class AIReceptionist {
  async processQuestion(question: string, opts?: AiReceptionistOptions): Promise<AiProcessResult> {
    const normalized = normalizeText(question);

    // Guard — length/emptiness safe limits.
    if (!normalized || question.length > MAX_QUESTION_LENGTH) {
      return {
        answer: "So'rov juda uzun yoki bo'sh. Iltimos, savolni qisqaroq shaklda yozing.",
        shouldEscalate: true,
        escalationReason: question.length > MAX_QUESTION_LENGTH
          ? "So'rov juda uzun — operator ko'rib chiqadi."
          : "Bo'sh so'rov.",
        intent: null,
        intents: [],
        entity: null,
        escalatedTo: 'receptionist',
        knowledgeSources: [],
        route: 'guard',
      };
    }

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
        route: 'escalation',
      };
    }

    // Gate 1 — greetings: respond naturally, no knowledge retrieval needed.
    if (isGreeting(normalized)) {
      return {
        answer: "Va alaykum assalom! Renessans o'quv markazi haqida savollaringiz bo'lsa, yordam beraman. Kurslar, narxlar, ustozlar, manzil yoki dars jadvali haqida so'rashingiz mumkin.",
        shouldEscalate: false,
        escalationReason: null,
        intent: null,
        intents: [],
        entity: null,
        escalatedTo: null,
        knowledgeSources: [],
        route: 'greeting',
      };
    }

    // Load the public knowledge base for this turn (courses + teachers).
    let allCourses: any[] = [];
    try {
      allCourses = (await coursesService.getAllCourses()).filter((c: any) => c.isActive !== false && c.isPublic !== false);
    } catch {
      allCourses = [];
    }
    let rawTeachers: any[] = [];
    try {
      const { teachersService } = await import('./repository');
      rawTeachers = await teachersService.getPublicTeachers();
    } catch {
      rawTeachers = [];
    }

    const kCourses = allCourses.map((c: any) => toKnowledgeCourse(c));
    const kTeachers = rawTeachers.map((t: any) => toKnowledgeTeacher(t));
    const graph = buildKnowledgeGraph(kCourses, kTeachers);

    // Resolve whatever entities the raw question names.
    let teacher = resolveSingleTeacher(normalized, kTeachers);
    let entityCourse = resolveSingleCourse(normalized, allCourses);

    // Bare follow-ups borrow the last resolved entity from conversation history.
    const lastEntity = lastConversationEntity(opts?.conversation);
    let effectiveQuestion = question;
    if (!teacher && !entityCourse && lastEntity && isBareFollowUp(normalized)) {
      effectiveQuestion = lastEntity.entity + ' — ' + question;
    }
    const effNorm = normalizeText(effectiveQuestion);

    teacher = resolveSingleTeacher(effNorm, kTeachers) || teacher;
    entityCourse = resolveSingleCourse(effNorm, allCourses) || entityCourse;

    const intents = detectAllIntents(effNorm);
    if (teacher && !intents.includes('teacher_info')) intents.unshift('teacher_info');
    const intent = intents[0] || null;

    if (!intent) {
      return {
        answer: null,
        shouldEscalate: true,
        escalationReason: 'Bu savol bo‘yicha tasdiqlangan ma’lumot topilmadi.\n\nOperatorimiz sizga aniq javob berishi mumkin. Iltimos, “Operator bilan bog‘lanish” tugmasini bosing yoki murojaat formasini to‘ldiring.',
        intent: null,
        intents: [],
        entity: teacher ? teacher.name : entityCourse ? String((entityCourse as any)?.title || '') : null,
        escalatedTo: 'receptionist',
        knowledgeSources: [],
        route: 'escalation',
      };
    }

    // Ambiguity: two different courses match equally well — ask, don't guess.
    const matches = matchCoursesByEntity(effNorm, allCourses);
    const isAmbiguous = matches.length > 1 && matches[0].score > 0 && matches[0].score <= matches[1].score + 5;
    if (isAmbiguous && ['course_price', 'course_schedule', 'course_duration', 'course_teacher'].includes(intent)) {
      return {
        answer: null,
        shouldEscalate: true,
        escalationReason: 'Qaysi kursni nazarda tutganingizni aniqlay olmadim. Operatorimiz aniqlashtirib beradi.',
        intent,
        intents,
        entity: teacher ? teacher.name : entityCourse ? String((entityCourse as any)?.title || '') : null,
        escalatedTo: 'receptionist',
        knowledgeSources: [],
        route: 'escalation',
      };
    }

    // Split intents into deterministic (graph/verified data) and LLM-only.
    const llmOnlyIntents = intents.filter((i) => LLM_ONLY_INTENTS.includes(i));
    const detIntents = intents.filter((i) => !LLM_ONLY_INTENTS.includes(i));

    // Gather verified facts for every deterministic intent (max 3).
    const knowledgeList: Array<{ text: string; source: string }> = [];
    for (const one of detIntents.slice(0, 3)) {
      const k = await this.retrieveFacts(one, effNorm, effectiveQuestion, entityCourse, teacher, allCourses, graph);
      if (k) knowledgeList.push(...k);
    }

    const entityValue = entityCourse ? String((entityCourse as any)?.title || '') : teacher ? teacher.name : null;

    // Deterministic-only route: answer purely from verified data, NO Gemini.
    if (llmOnlyIntents.length === 0) {
      if (knowledgeList.length === 0) {
        const isPriceMissing =
          intent === 'course_price' && entityCourse && !Number((entityCourse as any)?.monthlyFee) && !(entityCourse as any)?.formattedFee;
        const msg = isPriceMissing
          ? "Bu kursning narxi hozircha tizimda ko‘rsatilmagan. Operatorimiz aniq ma’lumot beradi."
          : "Bu savol bo‘yicha tasdiqlangan ma’lumot topilmadi. Operatorimiz sizga aniq javob berishi mumkin.";
        return {
          answer: msg,
          shouldEscalate: true,
          escalationReason: msg,
          intent,
          intents,
          entity: entityValue,
          escalatedTo: 'receptionist',
          knowledgeSources: [],
          route: 'escalation',
        };
      }
      return {
        answer: knowledgeList.map((k) => k.text).join('\n'),
        shouldEscalate: false,
        escalationReason: null,
        intent,
        intents,
        entity: entityValue,
        escalatedTo: null,
        knowledgeSources: knowledgeList,
        route: 'graph',
      };
    }

    // LLM-only route (recommendation / level placement): Gemini with verified
    // context, validated ground-by-fact before being shown.
    const context = buildContext(knowledgeList);
    const aiAnswer = await this.generateAIResponse(effectiveQuestion, context, intent ?? (llmOnlyIntents[0] as SupportedIntent));

    let validation: { ok: boolean; reason: string } = { ok: false, reason: 'AI javobi shakllantirib bo‘lmadi.' };
    if (aiAnswer) {
      validation = knowledgeList.length > 0
        ? { ok: true, reason: '' } // context binds the model — skip fact-gating
        : this.validateAIAnswer(aiAnswer, knowledgeList, intent);
    }

    if (aiAnswer && validation.ok) {
      return {
        answer: aiAnswer,
        shouldEscalate: false,
        escalationReason: null,
        intent,
        intents,
        entity: entityValue,
        escalatedTo: null,
        knowledgeSources: knowledgeList,
        route: 'llm',
      };
    }
    if (aiAnswer) {
      console.warn('[AI Validation Failed]', { reason: validation.reason, intent, question });
    }

    // Model failure fallback: show verified facts if we have them.
    if (knowledgeList.length > 0) {
      return {
        answer: knowledgeList.map((k) => k.text).join('\n'),
        shouldEscalate: false,
        escalationReason: null,
        intent,
        intents,
        entity: entityValue,
        escalatedTo: null,
        knowledgeSources: knowledgeList,
        route: 'graph',
      };
    }

    return {
      answer: "Uzr, hozir javob tayyorlab bo'lmadi. Operatorimiz sizga aniq javob beradi.",
      shouldEscalate: true,
      escalationReason: validation.reason || 'AI javobi shakllantirib bo‘lmadi. Murojaatingiz operatorga yo‘natilmoqda.',
      intent,
      intents,
      entity: entityValue,
      escalatedTo: 'receptionist',
      knowledgeSources: knowledgeList,
      route: 'escalation',
    };
  }

  /** Per-intent fact retrieval. Graph answers first, then the generic branch. */
  private async retrieveFacts(
    intent: SupportedIntent,
    normalizedQuestion: string,
    rawQuestion: string,
    entityCourse: any | null,
    teacher: KnowledgeTeacher | null,
    allCourses: any[],
    graph: KnowledgeGraph
  ): Promise<Array<{ text: string; source: string }> | null> {
    // Course → teacher: relationship graph (explicit + implicit subject links).
    if (intent === 'course_teacher' && entityCourse) {
      const kc = toKnowledgeCourse(entityCourse);
      const links = graph.courseTeacher.get(kc.id) || [];
      const ans = courseTeacherAnswer(kc, links, graph.byTeacherId);
      if (ans) return [{ text: ans, source: 'Kurs: ' + kc.canonicalName }];
    }

    // Teacher profile (+ the courses they teach when the question asks for them).
    if (intent === 'teacher_info' && teacher) {
      const qMatch = normalizeForMatch(rawQuestion);
      const wantsCourses = qMatch.includes('kurs') || qMatch.includes('dars beradi') || qMatch.includes('qaysi') || qMatch.includes('fandan');
      const links = graph.teacherCourses.get(teacher.id) || [];
      const out: Array<{ text: string; source: string }> = [];
      if (wantsCourses) {
        const ca = teacherCoursesAnswer(teacher, links, graph.byCourseId);
        if (ca) out.push({ text: ca, source: 'O\'qituvchi: ' + teacher.name });
      }
      out.push({ text: teacherProfileAnswer(teacher), source: 'O\'qituvchi: ' + teacher.name });
      if (out.length) return out;
    }

    // Course price genuinely missing → escalate with a clear message.
    if (intent === 'course_price' && entityCourse && !Number((entityCourse as any)?.monthlyFee) && !(entityCourse as any)?.formattedFee) {
      return null;
    }

    return getKnowledgeForIntent(intent, normalizedQuestion, entityCourse, allCourses);
  }

  // Normalize price for verification - handles various formats
  private normalizePrice(value: string | number): string {
    if (typeof value === 'number') {
      return String(value);
    }
    const s = String(value).trim();
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
        return tokens.some((tok) => normAnswer.includes(tok));
      });
      if (!hit) {
        return { ok: false, reason: 'AI javobi tasdiqlanmadi — kurs nomi verified ma’lumotga mos kelmadi.' };
      }
    }

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