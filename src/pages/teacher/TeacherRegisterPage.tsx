import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'motion/react';
import { Mail, Lock, User, Phone, Eye, EyeOff, AlertCircle, Loader2, CheckCircle2, ShieldCheck } from 'lucide-react';
import { invitationsService, registerTeacherWithInvitation, InvitationErrorCode } from '../../services/repository';
import { TeacherInvitation } from '../../types/crm';
import { PublicLayout } from '../../components/public/PublicLayout';

function invitationErrorMessage(code: string | undefined, fallback: string): string {
  switch (code as InvitationErrorCode | string) {
    case 'invitation/not-found':
      return "Taklifnoma topilmadi. Havola noto'g'ri bo'lishi mumkin.";
    case 'invitation/secret-mismatch':
      return "Taklifnoma havolasi yaroqsiz.";
    case 'invitation/used':
      return 'Bu taklifnoma allaqachon ishlatilgan. Yangi taklifnoma uchun administratorga murojaat qiling.';
    case 'invitation/revoked':
      return 'Bu taklifnoma bekor qilingan. Administratorga murojaat qiling.';
    case 'invitation/expired':
      return "Taklifnoma muddati tugagan. Yangi taklifnoma so'rang.";
    case 'invitation/email-mismatch':
      return 'Bu taklifnoma boshqa email uchun berilgan.';
    case 'auth/email-already-in-use':
      return 'Bu email bilan hisob allaqachon mavjud. Kirish sahifasiga o\'ting.';
    case 'auth/invalid-email':
      return "Email manzili noto'g'ri formatda.";
    case 'auth/weak-password':
      return "Parol juda qisqa (kamida 6 ta belgi).";
    default:
      return fallback;
  }
}

export const TeacherRegisterPage: React.FC = () => {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const invitationId = params.get('invitation') || '';
  const secret = params.get('s') || '';

  const [invitation, setInvitation] = useState<TeacherInvitation | null>(null);
  const [inviteError, setInviteError] = useState('');
  const [checking, setChecking] = useState(true);

  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('+998 ');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [done, setDone] = useState(false);

  // Validate the invitation link (public single-doc read; rules enforce the rest).
  useEffect(() => {
    let cancelled = false;
    (async () => {
      setChecking(true);
      setInviteError('');
      try {
        if (!invitationId || !secret) {
          setInviteError("Taklifnoma havolasi to'liq emas.");
          return;
        }
        const inv = await invitationsService.getInvitation(invitationId);
        if (!inv) {
          setInviteError('Taklifnoma topilmadi.');
          return;
        }
        if (inv.secret !== secret) {
          setInviteError('Taklifnoma havolasi yaroqsiz.');
          return;
        }
        if (inv.status === 'used') {
          setInviteError('Bu taklifnoma allaqachon ishlatilgan.');
          return;
        }
        if (inv.status === 'revoked') {
          setInviteError('Bu taklifnoma bekor qilingan.');
          return;
        }
        if (inv.status !== 'pending' || new Date(inv.expiresAt).getTime() < Date.now()) {
          setInviteError("Taklifnoma muddati tugagan.");
          return;
        }
        if (!cancelled) {
          setInvitation(inv);
          setFullName(inv.teacherName || '');
        }
      } catch {
        if (!cancelled) setInviteError('Taklifnoma tekshirishda xatolik.');
      } finally {
        if (!cancelled) setChecking(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [invitationId, secret]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!invitation) return;
    setError('');
    if (fullName.trim().length < 3) {
      setError("To'liq ismni kiriting.");
      return;
    }
    if (password.length < 6) {
      setError("Parol kamida 6 ta belgidan iborat bo'lishi kerak.");
      return;
    }
    if (password !== confirm) {
      setError('Parollar mos kelmadi.');
      return;
    }
    setIsLoading(true);
    try {
      // Email is locked to the invitation — the invitee cannot claim another address.
      await registerTeacherWithInvitation({
        invitationId,
        secret,
        fullName: fullName.trim(),
        email: invitation.teacherEmail,
        password,
        phone: phone.trim(),
      });
      setDone(true);
    } catch (err: unknown) {
      const code = (err as { code?: string } | null)?.code;
      const message = (err as Error | null)?.message;
      setError(invitationErrorMessage(code, message || "Ro'yxatdan o'tishda xatolik."));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <PublicLayout>
      <div className="min-h-screen flex items-center justify-center px-4 pt-28 pb-16">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl p-6 sm:p-8"
        >
          <div className="flex items-center gap-2 mb-1">
            <ShieldCheck className="w-5 h-5 text-amber-500" />
            <span className="text-[11px] font-black uppercase tracking-wider text-slate-400">
              O'qituvchi taklifnomasi
            </span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            Ro'yxatdan o'tish
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 mb-6">
            Renessans O'quv Markazi — bir martalik taklifnoma orqali.
          </p>

          {checking ? (
            <div className="py-10 flex flex-col items-center gap-3 text-slate-400">
              <Loader2 className="w-7 h-7 animate-spin text-amber-500" />
              <span className="text-xs font-bold">Taklifnoma tekshirilmoqda...</span>
            </div>
          ) : inviteError || !invitation ? (
            <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs font-bold flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{inviteError || 'Taklifnoma yaroqsiz.'}</span>
            </div>
          ) : done ? (
            <div className="text-center py-6 space-y-4">
              <CheckCircle2 className="w-12 h-12 mx-auto text-emerald-500" />
              <h2 className="text-lg font-black text-slate-900 dark:text-white">
                Tabriklaymiz, {fullName.trim()}!
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Hisobingiz yaratildi va taklifnoma yaroqsiz qilindi. Endi o'qituvchi paneliga kiring.
              </p>
              <button
                type="button"
                onClick={() => navigate('/login/teacher')}
                className="w-full py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-sm transition cursor-pointer"
              >
                Kirish sahifasiga o'tish
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  To'liq ism
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Ism Familiya"
                    className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Email (taklifnomadagi manzil)
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    value={invitation.teacherEmail}
                    readOnly
                    className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-300 text-sm focus:outline-none cursor-not-allowed"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Telefon
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+998 "
                    className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Parol
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Kamida 6 belgi"
                    autoComplete="new-password"
                    className="w-full pl-10 pr-11 py-3 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 transition"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                    aria-label="Parolni ko'rsatish"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Parolni tasdiqlang
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    placeholder="Parolni qayta kiriting"
                    autoComplete="new-password"
                    className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 transition"
                  />
                </div>
              </div>

              {error && (
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs font-bold flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-sm transition cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                <span>{isLoading ? 'Yaratilmoqda...' : "Hisob yaratish"}</span>
              </button>

              <p className="text-center text-xs text-slate-400">
                Hisobingiz bormi?{' '}
                <Link to="/login/teacher" className="font-bold text-amber-600 dark:text-amber-400 hover:underline">
                  Kirish
                </Link>
              </p>
            </form>
          )}
        </motion.div>
      </div>
    </PublicLayout>
  );
};
