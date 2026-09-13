import React, { useState, useRef, useEffect } from 'react';
import { Sparkles, Send, Loader2, User, Bot, AlertCircle } from 'lucide-react';
import { aiReceptionist } from '../../services/aiReceptionist';
import { useLanguage } from '../../context/LanguageContext';

interface ChatMsg {
  role: 'user' | 'assistant';
  text: string;
  escalated?: boolean;
}

const PROMPT_CHIPS_UZ = [
  'IELTS kursi haqida tushuntirib ber',
  'Sinov darsini mijozga qanday tushuntiraman?',
  'Bu mijozga qaysi kurs mos?',
  'Telefon orqali gaplashish uchun skript yoz',
  'Leadga javob tayyorla',
  "To'lov haqida muloyim tushuntirish yoz",
  'Telegram uchun javob yoz',
];

const PROMPT_CHIPS_EN = [
  'Explain the IELTS course',
  'How do I explain the trial lesson to a client?',
  'Which course fits this client?',
  'Write a phone call script',
  'Draft a reply to a lead',
  'Write a polite payment explanation',
  'Write a reply for Telegram',
];

const PROMPT_CHIPS_RU = [
  'Объясни курс IELTS',
  'Как объяснить клиенту пробный урок?',
  'Какой курс подойдёт этому клиенту?',
  'Напиши скрипт телефонного разговора',
  'Подготовь ответ лиду',
  'Напиши вежливое объяснение про оплату',
  'Напиши ответ для Telegram',
];

/**
 * Staff assistant for the front desk. Rule-based answers are composed from
 * verified Firestore data (courses, FAQs, contacts) via aiReceptionist —
 * no model picker, no API keys, no student-tutor modes.
 */
export const ReceptionAssistant: React.FC = () => {
  const { language } = useLanguage();
  const t = (uz: string, en: string, ru: string) => (language === 'EN' ? en : language === 'RU' ? ru : uz);
  const chips = language === 'EN' ? PROMPT_CHIPS_EN : language === 'RU' ? PROMPT_CHIPS_RU : PROMPT_CHIPS_UZ;

  const [messages, setMessages] = useState<ChatMsg[]>([
    {
      role: 'assistant',
      text: t(
        'Salom! Men Qabulxona yordamchisiman. Kurslar, sinov darslari, to‘lovlar va mijozlar bilan muloqot bo‘yicha yordam beraman. Quyidagi tayyor savollardan birini tanlang yoki o‘z savolingizni yozing.',
        'Hello! I am the front-desk assistant. I can help with courses, trial lessons, payments and client communication. Pick a suggested question or type your own.',
        'Здравствуйте! Я помощник ресепшн. Помогу с курсами, пробными уроками, оплатой и общением с клиентами. Выберите готовый вопрос или напишите свой.'
      ),
    },
  ]);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, [messages, busy]);

  const ask = async (question: string) => {
    const q = question.trim();
    if (!q || busy) return;
    setMessages((m) => [...m, { role: 'user', text: q }]);
    setInput('');
    setBusy(true);
    try {
      const result = await aiReceptionist.processQuestion(q);
      if (result.answer) {
        setMessages((m) => [...m, { role: 'assistant', text: result.answer as string }]);
      } else {
        setMessages((m) => [
          ...m,
          {
            role: 'assistant',
            text: t(
              'Bu savolga avtomatik javob topilmadi — mijoz bilan bevosita bog‘laning yoki administratorga yo‘naltiring.',
              'No automatic answer found — contact the client directly or escalate to an administrator.',
              'Автоматический ответ не найден — свяжитесь с клиентом напрямую или передайте администратору.'
            ),
            escalated: true,
          },
        ]);
      }
    } catch {
      setMessages((m) => [
        ...m,
        {
          role: 'assistant',
          text: t('Yordamchini ishga tushirishda xatolik. Keyinroq qayta urinib ko‘ring.', 'Assistant failed to respond. Please try again later.', 'Ошибка помощника. Попробуйте позже.'),
          escalated: true,
        },
      ]);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
          {t('AI Yordamchi', 'AI Assistant', 'AI-помощник')}
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
          {t('Mijozlar bilan muloqot va kurslarni tushuntirish uchun xodim yordamchisi', 'Staff helper for client communication and course explanations', 'Помощник для общения с клиентами и объяснения курсов')}
        </p>
      </div>

      <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="p-4 sm:p-5 space-y-3 max-h-[52vh] overflow-y-auto">
          {messages.map((m, i) => (
            <div key={i} className={`flex gap-2.5 ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              {m.role === 'assistant' && (
                <span className="w-7 h-7 rounded-lg bg-emerald-600 text-white flex items-center justify-center shrink-0">
                  <Bot className="w-4 h-4" />
                </span>
              )}
              <div
                className={`max-w-[85%] px-3.5 py-2.5 rounded-2xl text-sm whitespace-pre-wrap ${
                  m.role === 'user'
                    ? 'bg-emerald-600 text-white rounded-br-md'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-bl-md'
                } ${m.escalated ? 'border border-amber-500/40' : ''}`}
              >
                {m.escalated && <AlertCircle className="w-3.5 h-3.5 inline mr-1.5 text-amber-500" />}
                {m.text}
              </div>
              {m.role === 'user' && (
                <span className="w-7 h-7 rounded-lg bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 flex items-center justify-center shrink-0">
                  <User className="w-4 h-4" />
                </span>
              )}
            </div>
          ))}
          {busy && (
            <div className="flex gap-2.5 items-center text-xs text-slate-400">
              <Loader2 className="w-4 h-4 animate-spin text-emerald-500" />
              {t('Javob tayyorlanmoqda...', 'Preparing an answer...', 'Готовлю ответ...')}
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        <div className="p-4 border-t border-slate-200 dark:border-slate-800 space-y-3">
          <div className="flex gap-2 overflow-x-auto pb-1">
            {chips.map((c) => (
              <button
                key={c}
                onClick={() => void ask(c)}
                disabled={busy}
                className="shrink-0 px-3 py-1.5 rounded-full bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/25 text-emerald-700 dark:text-emerald-400 text-[11px] font-bold transition cursor-pointer disabled:opacity-50 whitespace-nowrap"
              >
                {c}
              </button>
            ))}
          </div>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              void ask(input);
            }}
            className="flex items-center gap-2"
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={t('Savolingizni yozing...', 'Type your question...', 'Напишите вопрос...')}
              className="flex-1 px-3.5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-emerald-500/50 min-w-0"
            />
            <button
              type="submit"
              disabled={busy || !input.trim()}
              aria-label={t('Yuborish', 'Send', 'Отправить')}
              className="p-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white transition cursor-pointer disabled:opacity-50 shrink-0"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ReceptionAssistant;
