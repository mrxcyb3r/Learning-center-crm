import React, { useState } from 'react';
import { toast } from 'react-toastify';
import { Send, User, Phone, Mail, MessageSquare } from 'lucide-react';
import { demoData } from '../../services/demoData';
import { notificationService } from '../../services/notificationService';

interface InquiryFormProps {
  onSuccess?: () => void;
}

const CATEGORIES = [
  { value: 'pricing', label: 'Narxlar (Pricing)' },
  { value: 'schedule', label: "Dars jadvali (Schedule)" },
  { value: 'teachers', label: "O'qituvchilar (Teachers)" },
  { value: 'certificates', label: 'Sertifikatlar (Certificates)' },
  { value: 'branches', label: 'Filiallar (Branches)' },
  { value: 'scholarships', label: 'Stipendiyalar (Scholarships)' },
  { value: 'transport', label: 'Transport' },
  { value: 'payments', label: "To'lov usullari (Payment Methods)" },
  { value: 'other', label: 'Boshqa (Other)' },
];

export const InquiryForm: React.FC<InquiryFormProps> = ({ onSuccess }) => {
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('+998 ');
  const [email, setEmail] = useState('');
  const [category, setCategory] = useState('');
  const [message, setMessage] = useState('');
  const [agreedToContact, setAgreedToContact] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = (): boolean => {
    const errs: Record<string, string> = {};
    if (!fullName.trim() || fullName.trim().length < 3) errs.fullName = "Iltimos, to'liq ismni kiriting.";
    if (!phone || phone.replace(/\D/g, '').length < 9) errs.phone = "Telefon raqamini to'g'ri kiriting.";
    if (!category) errs.category = "Kategoriyani tanlang.";
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

      demoData.addInquiry({
        fullName: fullName.trim(),
        phone: phone.trim(),
        email: email.trim() || undefined,
        category: category as import('../../services/demoData').InquiryRecord['category'],
        message: message.trim(),
        status: 'New',
        source: 'Contact Page',
      });

      notificationService.onInquirySubmitted(fullName.trim(), CATEGORIES.find((c) => c.value === category)?.label || category);

      toast.success("Xabaringiz muvaffaqiyatli yuborildi! Tez orada bog'lanamiz.");

      setFullName('');
      setPhone('+998 ');
      setEmail('');
      setCategory('');
      setMessage('');
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
          <MessageSquare className="w-5 h-5" />
        </div>
        <div>
          <h3 className="text-lg font-black text-slate-900 dark:text-white tracking-tight">
            Bizga xabar yozing
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Savolingizni yuboring, adminlarimiz siz bilan bog'lanishadi.
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
              Kategoriya *
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 transition appearance-none cursor-pointer"
            >
              <option value="">Kategoriyani tanlang</option>
              {CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>
            {errors.category && <p className="text-[11px] text-rose-500 mt-1">{errors.category}</p>}
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
            Xabar *
          </label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Xabaringizni batafsil yozing..."
            rows={4}
            className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 transition resize-none"
          />
          {errors.message && <p className="text-[11px] text-rose-500 mt-1">{errors.message}</p>}
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
          {isSubmitting ? 'Yuborilmoqda...' : 'Xabar yuborish'}
        </button>
      </form>
    </div>
  );
};
