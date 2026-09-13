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
function normalizeText(raw: string): string {
  let s = (raw || '').trim().toLowerCase();
  if (!s) return '';
  s = s.split("'").join('');
  s = s.split('’').join('');
  s = s.split('`').join('');
  s = s.split('ʻ').join('');
  return s;
}

// Whole-word keywords matched against normalized text. Deliberately no
// fragments ('ko', 'ring', 'ta', ...) — those caused false positives
// (e.g. "qaytaring" matching a branch keyword).
const COURSE_PRICE_KEYWORDS = [
  'narx', 'qancha', 'nech pul', 'nechpul', 'summ', 'fee', 'cost', 'price',
  'how much', 'skolko', 'stoimost', 'tsena',
];
const COURSE_DESC_KEYWORDS = [
  'haqida', 'tavsif', 'tarkib', 'dastur', 'programma', 'detail', 'maqsad',
  'what is', 'about', 'malumot', 'nimani orgatadi', 'qanday kurs',
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

type SupportedIntent =
  | 'course_price'
  | 'course_description'
  | 'branch_address'
  | 'working_hours'
  | 'trial_lesson'
  | 'faq'
  | 'contact_info'
  | 'teacher_info';

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
    keys: ['tolov', 'tulov', 'payment', 'oplata', 'oplati', 'qarzdorlik', 'qarz'],
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
  {
    keys: ['daraja', 'ball', 'baholash', 'placement', 'test natija', 'qaysi guruhga mos', 'guruhga mos'],
    reason: "O'quvchining darajasini baholash kerak — o'qituvchi ekspertizasi talab qilinadi.",
    to: 'teacher',
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

function detectIntent(normalized: string): SupportedIntent | null {
  if (!normalized) return null;

  const check = (keywords: string[]) => keywords.some((kw) => normalized.includes(kw));

  if (check(COURSE_PRICE_KEYWORDS)) return 'course_price';
  if (check(COURSE_DESC_KEYWORDS)) return 'course_description';
  if (check(BRANCH_ADDR_KEYWORDS)) return 'branch_address';
  if (check(WORKING_HOURS_KEYWORDS)) return 'working_hours';
  if (check(TRIAL_KEYWORDS)) return 'trial_lesson';
  if (check(TEACHER_KEYWORDS)) return 'teacher_info';
  if (check(FAQ_KEYWORDS)) return 'faq';
  if (check(CONTACT_KEYWORDS)) return 'contact_info';
  return null;
}

async function getKnowledgeForIntent(
  intent: SupportedIntent
): Promise<{ text: string; source: string } | null> {
  try {
    switch (intent) {
      case 'course_price': {
        const courses = await coursesService.getAllCourses();
        const active = courses.filter((c: any) => c.isActive && c.isPublic);
        if (active.length > 0) {
          const first = active[0];
          return {
            text: first.title + ': ' + first.formattedFee + ' ' + (first.currency || 'so\'m'),
            source: 'Kurs: ' + first.title,
          };
        }
        return null;
      }
      case 'course_description': {
        const courses = await coursesService.getAllCourses();
        const active = courses.filter((c: any) => c.isActive && c.isPublic);
        if (active.length > 0) {
          const first = active[0];
          return {
            text: first.description || 'Kurs haqida batafsil ma\'lumot mavjud emas.',
            source: 'Kurs: ' + first.title,
          };
        }
        return null;
      }
      case 'branch_address': {
        const settingsSnap = await getDoc(doc(db, 'settings', 'center'));
        if (settingsSnap.exists()) {
          const branches = settingsSnap.data().branches || [];
          if (branches.length > 0) {
            const first = branches[0];
            return {
              text: first.name + ': ' + first.address,
              source: 'Filial: ' + first.name,
            };
          }
        }
        const cms = await landingCmsService.getLandingContent();
        if (cms && cms.contact?.branches?.[0]) {
          return {
            text: cms.contact.branches[0],
            source: 'Veb-sayt bog\'lanma ma\'lumotlari',
          };
        }
        return null;
      }
      case 'working_hours': {
        const settingsSnap = await getDoc(doc(db, 'settings', 'center'));
        if (settingsSnap.exists()) {
          const wh = settingsSnap.data().workingHours || '';
          if (wh) {
            return { text: wh, source: 'Markaz soatlari' };
          }
        }
        const cms = await landingCmsService.getLandingContent();
        if (cms && cms.hero?.heroHighlight) {
          return { text: cms.hero.heroHighlight, source: 'Veb-sayt sarlavha' };
        }
        return null;
      }
      case 'trial_lesson': {
        const courses = await coursesService.getAllCourses();
        const trialCourses = courses.filter((c: any) => c.isActive && c.isPublic);
        if (trialCourses.length > 0) {
          const first = trialCourses[0];
          return {
            text: first.title + ' sinov darsi bo\'lardi. Ro\'yxat berish uchun murojaatingizni yuboring.',
            source: 'Sinov darsi: ' + first.title,
          };
        }
        return null;
      }
      case 'teacher_info': {
        const { teachersService } = await import('./repository');
        const teachers = await teachersService.getPublicTeachers();
        if (teachers.length > 0) {
          const names = teachers
            .slice(0, 5)
            .map((t: any) => t.name + (t.subject || t.specialization ? ' (' + (t.subject || t.specialization) + ')' : ''))
            .join(', ');
          return {
            text: "Markaz o'qituvchilari: " + names + '.',
            source: "O'qituvchilar ro'yxati",
          };
        }
        return null;
      }
      case 'faq': {
        const faqs = await faqsService.getAllFaqs();
        if (faqs.length > 0) {
          const first = faqs[0];
          return { text: first.answer, source: 'Savol: ' + first.question };
        }
        return null;
      }
      case 'contact_info': {
        const settingsSnap = await getDoc(doc(db, 'settings', 'center'));
        if (settingsSnap.exists()) {
          const s = settingsSnap.data();
          const parts: string[] = [];
          if (s.hotline) parts.push('Tel: ' + s.hotline);
          if (s.secondaryPhone) parts.push('Qo\'nq. tel: ' + s.secondaryPhone);
          if (s.email) parts.push('Email: ' + s.email);
          if (s.telegramSettings?.botUsername)
            parts.push('Telegram: @' + s.telegramSettings.botUsername);
          if (parts.length > 0) {
            return { text: parts.join(' | '), source: 'Bog\'lanish ma\'lumotlari' };
          }
        }
        const cms = await landingCmsService.getLandingContent();
        if (cms && cms.contact) {
          const parts: string[] = [];
          if (cms.contact.phone) parts.push('Tel: ' + cms.contact.phone);
          if (cms.contact.telegram) parts.push('Telegram: ' + cms.contact.telegram);
          if (parts.length > 0) {
            return { text: parts.join(' | '), source: 'Veb-sayt kontaktlar' };
          }
        }
        return null;
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
  escalatedTo: EscalationTarget | null;
  knowledgeSources: Array<{ text: string; source: string }>;
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

    const intent = detectIntent(normalized);
    if (!intent) {
      return {
        answer: null,
        shouldEscalate: true,
        escalationReason: 'Bu savol bo\'yicha aniq ma\'lumotim yo\'q. Murojaatingizni operatorimizga yuboraman.',
        intent: null,
        escalatedTo: 'receptionist',
        knowledgeSources: [],
      };
    }

    const knowledge = await getKnowledgeForIntent(intent);
    if (!knowledge) {
      return {
        answer: null,
        shouldEscalate: true,
        escalationReason:
          'Bu savol bo\'yicha markazdagi aniq ma\'lumotlar mavjud emas. Murojaatingizni operatorimizga yuboraman.',
        intent,
        escalatedTo: 'receptionist',
        knowledgeSources: [],
      };
    }

    const context = buildContext([knowledge]);
    const aiAnswer = await this.generateAIResponse(question, context, intent);

    if (!aiAnswer) {
      return {
        answer: null,
        shouldEscalate: true,
        escalationReason:
          'AI javobi shakllantirib bo\'lmadi. Murojaatingiz operatorga yo\'natilmoqda.',
        intent,
        escalatedTo: 'receptionist',
        knowledgeSources: [knowledge],
      };
    }

    const isSafe = this.validateAIAnswer(aiAnswer, knowledge);
    if (!isSafe) {
      return {
        answer:
          'Bu savol bo\'yicha aniq ma\'lumotim yo\'q. Murojaatingizni operatorimizga yuboraman.',
        shouldEscalate: true,
        escalationReason: 'AI javobi tasdiqlanmadi — axborot haqqida xato.',
        intent,
        escalatedTo: 'receptionist',
        knowledgeSources: [knowledge],
      };
    }

    return {
      answer: aiAnswer,
      shouldEscalate: false,
      escalationReason: null,
      intent,
      escalatedTo: null,
      knowledgeSources: [knowledge],
    };
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

  private validateAIAnswer(answer: string, knowledge: { text: string; source: string }): boolean {
    if (!answer || answer.trim().length === 0) return false;
    const lower = answer.toLowerCase();

    const kLower = knowledge.text.toLowerCase();
    const knownWords = kLower.split(' ').filter((w: string) => w.length > 3);
    const answerWords = lower.split(' ').filter((w: string) => w.length > 3);
    const overlap = answerWords.filter((w: string) => knownWords.includes(w));
    const overlapRatio = overlap.length / Math.max(1, answerWords.length);
    if (overlapRatio < 0.1) return false;

    return true;
  }
}

export const aiReceptionist = new AIReceptionist();