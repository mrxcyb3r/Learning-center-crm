import { Language } from '../types';

export interface CounterNoun {
  uz: string;
  en: { singular: string; plural: string };
  ru: { singular: string; few: string; many: string };
}

/**
 * Standard pre-defined noun dictionaries for recurring entities in the ERP.
 */
export const COUNT_NOUNS: Record<string, CounterNoun> = {
  student: {
    uz: "o'quvchi",
    en: { singular: 'student', plural: 'students' },
    ru: { singular: 'ученик', few: 'ученика', many: 'учеников' },
  },
  activeStudent: {
    uz: "faol o'quvchi",
    en: { singular: 'active student', plural: 'active students' },
    ru: { singular: 'активный ученик', few: 'активных ученика', many: 'активных учеников' },
  },
  group: {
    uz: 'guruh',
    en: { singular: 'group', plural: 'groups' },
    ru: { singular: 'группа', few: 'группы', many: 'групп' },
  },
  activeGroup: {
    uz: 'faol guruh',
    en: { singular: 'active group', plural: 'active groups' },
    ru: { singular: 'активная группа', few: 'активные группы', many: 'активных групп' },
  },
  payment: {
    uz: "to'lov",
    en: { singular: 'payment', plural: 'payments' },
    ru: { singular: 'платеж', few: 'платежа', many: 'платежей' },
  },
  receipt: {
    uz: 'kvitansiya',
    en: { singular: 'receipt', plural: 'receipts' },
    ru: { singular: 'квитанция', few: 'квитанции', many: 'квитанций' },
  },
  activeReceipt: {
    uz: 'faol kvitansiya',
    en: { singular: 'active receipt', plural: 'active receipts' },
    ru: { singular: 'активная квитанция', few: 'активные квитанции', many: 'активных квитанций' },
  },
  debtor: {
    uz: 'qarzdor',
    en: { singular: 'debtor', plural: 'debtors' },
    ru: { singular: 'должник', few: 'должника', many: 'должников' },
  },
  lead: {
    uz: 'lid',
    en: { singular: 'lead', plural: 'leads' },
    ru: { singular: 'лид', few: 'лида', many: 'лидов' },
  },
  newLead: {
    uz: 'yangi lid',
    en: { singular: 'new lead', plural: 'new leads' },
    ru: { singular: 'новый лид', few: 'новых лида', many: 'новых лидов' },
  },
  trial: {
    uz: 'sinov darsi',
    en: { singular: 'trial lesson', plural: 'trial lessons' },
    ru: { singular: 'пробный урок', few: 'пробных урока', many: 'пробных уроков' },
  },
  lesson: {
    uz: 'dars',
    en: { singular: 'lesson', plural: 'lessons' },
    ru: { singular: 'урок', few: 'урока', many: 'уроков' },
  },
  record: {
    uz: 'yozuv',
    en: { singular: 'record', plural: 'records' },
    ru: { singular: 'запись', few: 'записи', many: 'записей' },
  },
  seat: {
    uz: 'joy',
    en: { singular: 'seat', plural: 'seats' },
    ru: { singular: 'место', few: 'места', many: 'мест' },
  },
  operation: {
    uz: 'operatsiya',
    en: { singular: 'operation', plural: 'operations' },
    ru: { singular: 'операция', few: 'операции', many: 'операций' },
  },
  character: {
    uz: 'belgi',
    en: { singular: 'character', plural: 'characters' },
    ru: { singular: 'символ', few: 'символа', many: 'символов' },
  },
  recipient: {
    uz: 'qabul qiluvchi',
    en: { singular: 'recipient', plural: 'recipients' },
    ru: { singular: 'получатель', few: 'получателя', many: 'получателей' },
  },
  message: {
    uz: 'xabar',
    en: { singular: 'message', plural: 'messages' },
    ru: { singular: 'сообщение', few: 'сообщения', many: 'сообщений' },
  },
  request: {
    uz: "so'rov",
    en: { singular: 'request', plural: 'requests' },
    ru: { singular: 'запрос', few: 'запроса', many: 'запросов' },
  },
  pendingPayment: {
    uz: "kutilayotgan to'lov",
    en: { singular: 'pending payment', plural: 'pending payments' },
    ru: { singular: 'ожидающий платеж', few: 'ожидающих платежа', many: 'ожидающих платежей' },
  },
  teacher: {
    uz: "o'qituvchi",
    en: { singular: 'teacher', plural: 'teachers' },
    ru: { singular: 'преподаватель', few: 'преподавателя', many: 'преподавателей' },
  },
  course: {
    uz: 'kurs',
    en: { singular: 'course', plural: 'courses' },
    ru: { singular: 'курс', few: 'курса', many: 'курсов' },
  },
  expense: {
    uz: 'xarajat',
    en: { singular: 'expense', plural: 'expenses' },
    ru: { singular: 'расход', few: 'расхода', many: 'расходов' },
  },
};

/**
 * Formats a count with proper noun pluralization and numeral classifier across languages.
 * - UZ: `${count} ta ${noun}`
 * - EN: 1 student vs 2 students
 * - RU: 1 ученик, 2-4 ученика, 5+ учеников
 */
export function formatCount(
  count: number,
  noun: CounterNoun | keyof typeof COUNT_NOUNS | string,
  lang: Language = 'UZ'
): string {
  const resolved: CounterNoun | null =
    typeof noun === 'string'
      ? COUNT_NOUNS[noun] || null
      : noun;

  if (!resolved) {
    // Shorthand string without dictionary entry
    const str = typeof noun === 'string' ? noun : '';
    if (lang === 'EN') return `${count} ${str}`;
    if (lang === 'RU') return `${count} ${str}`;
    return `${count} ta ${str}`;
  }

  if (lang === 'EN') {
    const label = count === 1 ? resolved.en.singular : resolved.en.plural;
    return `${count} ${label}`;
  }

  if (lang === 'RU') {
    const abs = Math.abs(Math.floor(count));
    const mod10 = abs % 10;
    const mod100 = abs % 100;
    let label = resolved.ru.many;
    if (mod100 < 11 || mod100 > 19) {
      if (mod10 === 1) {
        label = resolved.ru.singular;
      } else if (mod10 >= 2 && mod10 <= 4) {
        label = resolved.ru.few;
      }
    }
    return `${count} ${label}`;
  }

  // Default UZ:
  return `${count} ta ${resolved.uz}`;
}
