import { collection, getDocs, query, where, doc, getDoc } from 'firebase/firestore';
import { db } from './firebase';
import {
  CourseData,
  CampusBranch,
  TeacherRecord,
  FaqRecord,
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

const COURSE_PRICE_KEYWORDS = [
  'narx', 'qancha', 'pul', 'summ', 'fee', 'cost', 'price', 'how much',
  'toldir', 'kerak',
];
const COURSE_DESC_KEYWORDS = [
  'haqida', 'tavsif', 'detail', 'maqsad', 'what is', 'about',
  ' haqida', 'tavsif', 'malumot',
];
const BRANCH_ADDR_KEYWORDS = [
  'manzil', 'joy', 'qayer', 'address', 'ko', 'ring', 'qayerga',
  'joylashuvi',
];
const WORKING_HOURS_KEYWORDS = [
  'vaqt', 'soat', 'ish vaqti', 'time', 'work',
];
const TRIAL_KEYWORDS = [
  'sinov', 'ta', 'minlash', 'o', 'rnatish', 'trial', 'free lesson',
  'sinov darsi', 'tasdiqlash', 'jo', 'nali',
];
const FAQ_KEYWORDS = [
  'savol-jawob', 'yaylanoq', 'bilish', 'frequently',
  'savol', 'javob', 'faq',
];
const CONTACT_KEYWORDS = [
  'bog', 'lanish', 'telefon', 'telegram', 'email', 'connect', 'contact',
];

type SupportedIntent =
  | 'course_price'
  | 'course_description'
  | 'branch_address'
  | 'working_hours'
  | 'trial_lesson'
  | 'faq'
  | 'contact_info';

function detectIntent(question: string): SupportedIntent | null {
  if (!question) return null;
  const lower = question.trim().toLowerCase();
  if (!lower) return null;

  const check = (keywords: string[]) => keywords.some((kw) => lower.includes(kw));

  if (check(COURSE_PRICE_KEYWORDS)) return 'course_price';
  if (check(COURSE_DESC_KEYWORDS)) return 'course_description';
  if (check(BRANCH_ADDR_KEYWORDS)) return 'branch_address';
  if (check(WORKING_HOURS_KEYWORDS)) return 'working_hours';
  if (check(TRIAL_KEYWORDS)) return 'trial_lesson';
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

class AIReceptionist {
  async processQuestion(
    question: string
  ): Promise<{
    answer: string | null;
    shouldEscalate: boolean;
    escalationReason: string | null;
    intent: SupportedIntent | null;
    knowledgeSources: Array<{ text: string; source: string }>;
  }> {
    const intent = detectIntent(question);
    if (!intent) {
      return {
        answer: null,
        shouldEscalate: true,
        escalationReason: 'Nazorati aniq emas — boshqacha savol.',
        intent: null,
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
        knowledgeSources: [knowledge],
      };
    }

    return {
      answer: aiAnswer,
      shouldEscalate: false,
      escalationReason: null,
      intent,
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

    for (const k of knowledge) {
      const kLower = k.text.toLowerCase();
      const knownWords = kLower.split(' ').filter((w: string) => w.length > 3);
      const answerWords = lower.split(' ').filter((w: string) => w.length > 3);
      const overlap = answerWords.filter((w: string) => knownWords.includes(w));
      const overlapRatio = overlap.length / Math.max(1, answerWords.length);
      if (overlapRatio < 0.1) return false;
    }

    return true;
  }
}

export const aiReceptionist = new AIReceptionist();