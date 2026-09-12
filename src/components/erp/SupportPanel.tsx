import React, { useState } from 'react';
import {
  LifeBuoy,
  Send,
  Mail,
  MessageCircle,
  CheckCircle2,
  AlertTriangle,
  ExternalLink,
} from 'lucide-react';
import { SUPPORT } from '../../config/support';
import { useAuth } from '../../context/AuthContext';

type Priority = 'oddiy' | 'muhim' | 'shoshilinch';

const PRIORITY_OPTIONS: { value: Priority; label: string; color: string }[] = [
  { value: 'oddiy', label: 'Oddiy', color: 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20' },
  { value: 'muhim', label: 'Muhim', color: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20' },
  { value: 'shoshilinch', label: 'Shoshilinch', color: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20' },
];

export const SupportPanel: React.FC = () => {
  const { currentUser } = useAuth();
  const [showForm, setShowForm] = useState(false);
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [priority, setPriority] = useState<Priority>('oddiy');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notice, setNotice] = useState<{ type: 'ok' | 'error'; text: string } | null>(null);

  const resetForm = () => {
    setSubject('');
    setMessage('');
    setPriority('oddiy');
    setShowForm(false);
    setNotice(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    const trimmedSubject = subject.trim();
    const trimmedMessage = message.trim();
    if (trimmedSubject.length < 3) {
      setNotice({ type: 'error', text: 'Mavzuni kiriting (kamida 3 ta belgi).' });
      return;
    }
    if (trimmedMessage.length < 10) {
      setNotice({ type: 'error', text: 'Xabarni kiriting (kamida 10 ta belgi).' });
      return;
    }

    setIsSubmitting(true);
    setNotice(null);

    try {
      const token = await currentUser?.getIdToken();
      const res = await fetch('/api/support', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ subject: trimmedSubject, message: trimmedMessage, priority }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'So\'rov yuborishda xatolik');
      }

      setNotice({ type: 'ok', text: 'So\'rovingiz muvaffaqiyatli yuborildi. Tez orada javob beramiz!' });
      setTimeout(resetForm, 3000);
    } catch (err: any) {
      setNotice({ type: 'error', text: err?.message || 'So\'rovni yuborishda xatolik yuz berdi.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
          <LifeBuoy className="w-6 h-6 text-amber-500" />
          Yordam va qo'llab-quvvatlash
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
          CenterFlow bilan bog'liq savol yoki muammoga duch keldingizmi? Biz bilan bog'laning.
        </p>
      </div>

      {/* Notice */}
      {notice && (
        <div
          className={`flex items-center gap-2 px-4 py-3 rounded-2xl border text-sm font-bold ${
            notice.type === 'ok'
              ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
              : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20'
          }`}
        >
          {notice.type === 'ok' ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertTriangle className="w-4 h-4 shrink-0" />}
          {notice.text}
        </div>
      )}

      {/* Quick Contact Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Telegram */}
        <a
          href={SUPPORT.telegramUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-4 p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md hover:border-sky-500/30 transition-all cursor-pointer group"
        >
          <div className="w-12 h-12 rounded-2xl bg-sky-500/10 flex items-center justify-center shrink-0 group-hover:bg-sky-500/20 transition-colors">
            <Send className="w-5 h-5 text-sky-600 dark:text-sky-400" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-black text-slate-900 dark:text-white">Telegram orqali yozish</div>
            <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 truncate">
              @{SUPPORT.telegramUsername}
            </div>
          </div>
          <ExternalLink className="w-4 h-4 text-slate-400 shrink-0 group-hover:text-sky-500 transition-colors" />
        </a>

        {/* Email */}
        <a
          href={SUPPORT.mailtoUrl}
          className="flex items-center gap-4 p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md hover:border-amber-500/30 transition-all cursor-pointer group"
        >
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 flex items-center justify-center shrink-0 group-hover:bg-amber-500/20 transition-colors">
            <Mail className="w-5 h-5 text-amber-600 dark:text-amber-400" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-black text-slate-900 dark:text-white">Email yuborish</div>
            <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 truncate">
              {SUPPORT.email}
            </div>
          </div>
          <ExternalLink className="w-4 h-4 text-slate-400 shrink-0 group-hover:text-amber-500 transition-colors" />
        </a>
      </div>

      {/* In-app message toggle */}
      {!showForm && (
        <button
          onClick={() => { setShowForm(true); setNotice(null); }}
          className="w-full flex items-center justify-center gap-2 px-5 py-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-dashed border-slate-300 dark:border-slate-700 hover:border-amber-500/40 hover:bg-amber-500/5 text-slate-600 dark:text-slate-400 text-sm font-bold transition cursor-pointer"
        >
          <MessageCircle className="w-4 h-4" />
          Xabar yuborish
        </button>
      )}

      {/* In-app message form */}
      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4"
        >
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
              <MessageCircle className="w-4 h-4 text-amber-500" />
              Xabar yuborish
            </h3>
            <button
              type="button"
              onClick={resetForm}
              className="text-xs font-bold text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition cursor-pointer"
            >
              Bekor qilish
            </button>
          </div>

          {/* Priority */}
          <div>
            <label className="block text-[11px] font-black uppercase tracking-widest text-slate-400 mb-2">
              Muhimlik darajasi
            </label>
            <div className="flex gap-2">
              {PRIORITY_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setPriority(opt.value)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold border transition cursor-pointer ${
                    priority === opt.value
                      ? `${opt.color} ring-2 ring-offset-1 ring-current/20`
                      : 'bg-slate-50 dark:bg-slate-800 text-slate-500 border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Subject */}
          <div>
            <label className="block text-[11px] font-black uppercase tracking-widest text-slate-400 mb-1.5">
              Mavzu
            </label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Qisqacha mavzu..."
              className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-white font-bold"
            />
          </div>

          {/* Message */}
          <div>
            <label className="block text-[11px] font-black uppercase tracking-widest text-slate-400 mb-1.5">
              Xabar
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={4}
              placeholder="Muammoni batafsil yozing..."
              className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-white resize-none"
            />
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2.5 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs flex items-center gap-2 transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-amber-500/20"
            >
              <Send className="w-3.5 h-3.5" />
              {isSubmitting ? 'Yuborilmoqda...' : 'Xabar yuborish'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
};
