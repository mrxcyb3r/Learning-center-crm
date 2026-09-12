import React, { useState } from 'react';
import { toast } from 'react-toastify';
import { Send, User, Phone, Mail, BookOpen, MessageCircle, HelpCircle } from 'lucide-react';
import { questionsService } from '../../services/repository';
import { notificationService } from '../../services/notificationService';

interface QuestionFormProps {
  coursePreselected?: string;
  courseName?: string;
  onSuccess?: () => void;
}

const COURSE_OPTIONS = [
  'DTM & Milliy Sertifikat',
  'Matematika & Fizika',
  'CEFR Ingliz Tili (B2 / C1)',
  'English Kids (3–10 yosh)',
  'Mental Arifmetika',
  'Ona Tili va Adabiyot',
  'Boshqa',
];

const CONTACT_METHODS = [
  { value: 'phone', label: 'Telefon' },
  { value: 'email', label: 'Email' },
  { value: 'telegram', label: 'Telegram' },
] as const;

export const QuestionForm: React.FC<QuestionFormProps> = ({
  coursePreselected,
  courseName,
  onSuccess,
}) => {
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('+998 ');
  const [email, setEmail] = useState('');
  const [course, setCourse] = useState(coursePreselected || '');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [preferredContact, setPreferredContact] = useState<'phone' | 'email' | 'telegram'>('phone');
  const [agreedToContact, setAgreedToContact] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  React.useEffect(() => {
    if (coursePreselected) setCourse(coursePreselected);
  }, [coursePreselected]);

  const validate = (): boolean => {
    const errs: Record<string, string> = {};
    if (!fullName.trim() || fullName.trim().length < 3) errs.fullName = "Iltimos, to'liq ismni kiriting.";
    if (!phone || phone.replace(/\D/g, '').length < 9) errs.phone = "Telefon raqamini to'g'ri kiriting.";
    if (!subject.trim()) errs.subject = "Savol mavzusini kiriting.";
    if (!message.trim()) errs.message = "Xabaringizni yozing.";
    if (!agreedToContact) errs.agreed = "Bog'lanishga ruxsat berishingiz kerak.";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    try {
      setIsSubmitting(true);

      const source = coursePreselected ? 'Course Page' : 'Website';

      // Production path: persist to Firestore `questions` (public create allowed).
      await questionsService.createQuestion({
        fullName: fullName.trim(),
        phone: phone.trim(),
        ...(email.trim() ? { email: email.trim() } : {}),
        ...((course || courseName) ? { course: course || courseName } : {}),
        subject: subject.trim(),
        message: message.trim(),
        preferredContact,
        source,
      });

      notificationService.onQuestionSubmitted(fullName.trim(), message.trim(), phone.trim(), course || courseName);

      toast.success('Savolingiz muvaffaqiyatli yuborildi! Tez orada javob beramiz.');

      setFullName('');
      setPhone('+998 ');
      setEmail('');
      setCourse(coursePreselected || '');
      setSubject('');
      setMessage('');
      setPreferredContact('phone');
      setAgreedToContact(false);
      setErrors({});

      onSuccess?.();
    } catch {
      toast.error("Xatolik yuz berdi. Iltimos, qaytadan urinib ko'ring.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-lg p-6 sm:p-8">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center">
          <HelpCircle className="w-5 h-5" />
        </div>
        <div>
          <h3 className="text-lg font-black text-slate-900 dark:text-white tracking-tight">
            Savolingiz bormi?
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Savolingizni yozing, mutaxassislarimiz tez orada javob berishadi.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              To'liq ismingiz *
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Sardorbek Qodirov"
                className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 transition"
              />
            </div>
            {errors.fullName && <p className="text-[11px] text-rose-500 mt-1">{errors.fullName}</p>}
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              Telefon raqami *
            </label>
            <div className="relative">
              <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+998 90 123 45 67"
                className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-sm font-mono focus:outline-none focus:ring-2 focus:ring-amber-500 transition"
              />
            </div>
            {errors.phone && <p className="text-[11px] text-rose-500 mt-1">{errors.phone}</p>}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              Email (ixtiyoriy)
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="email@example.com"
                className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 transition"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              Qiziqtiruvchi kurs (ixtiyoriy)
            </label>
            <div className="relative">
              <BookOpen className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <select
                value={course}
                onChange={(e) => setCourse(e.target.value)}
                className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 transition appearance-none cursor-pointer"
              >
                <option value="">Kurs tanlang</option>
                {COURSE_OPTIONS.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
            Savol mavzusi *
          </label>
          <input
            type="text"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="Masalan: Kurs narxi, dars jadvali haqida"
            className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 transition"
          />
          {errors.subject && <p className="text-[11px] text-rose-500 mt-1">{errors.subject}</p>}
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
            Xabar *
          </label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Savolingizni batafsil yozing..."
            rows={4}
            className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 transition resize-none"
          />
          {errors.message && <p className="text-[11px] text-rose-500 mt-1">{errors.message}</p>}
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
            Qanday usulda bog'lanishni xohlaysiz? *
          </label>
          <div className="flex flex-wrap gap-3">
            {CONTACT_METHODS.map((m) => (
              <label
                key={m.value}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-semibold cursor-pointer transition ${
                  preferredContact === m.value
                    ? 'bg-amber-500/10 border-amber-500 text-amber-700 dark:text-amber-400'
                    : 'bg-slate-50 dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-600'
                }`}
              >
                <input
                  type="radio"
                  name="contact"
                  value={m.value}
                  checked={preferredContact === m.value}
                  onChange={() => setPreferredContact(m.value)}
                  className="sr-only"
                />
                {m.label}
              </label>
            ))}
          </div>
        </div>

        <label className="flex items-start gap-3 cursor-pointer group">
          <div className="relative mt-0.5">
            <input
              type="checkbox"
              checked={agreedToContact}
              onChange={(e) => setAgreedToContact(e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-5 h-5 rounded-lg border-2 border-slate-300 dark:border-slate-600 peer-checked:bg-amber-500 peer-checked:border-amber-500 transition flex items-center justify-center">
              {agreedToContact && (
                <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              )}
            </div>
          </div>
          <span className="text-sm text-slate-600 dark:text-slate-400 group-hover:text-slate-900 dark:group-hover:text-white transition">
            Men bilan bog'lanishga ruxsat beraman *
          </span>
        </label>
        {errors.agreed && <p className="text-[11px] text-rose-500">{errors.agreed}</p>}

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full py-3.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-sm shadow-lg shadow-amber-500/25 transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
        >
          <Send className="w-4 h-4" />
          {isSubmitting ? 'Yuborilmoqda...' : 'Savol yuborish'}
        </button>
      </form>
    </div>
  );
};
