import React, { useState } from 'react';
import { ThemeProvider } from './context/ThemeContext';
import { LanguageProvider, useLanguage } from './context/LanguageContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { LandingPage } from './pages/LandingPage';
import { AuthModal } from './components/Auth/AuthModal';
import { AppLayout } from './components/Layout/AppLayout';
import { Dashboard } from './components/Dashboard/Dashboard';
import { ShieldCheck, Loader2, MailWarning, RefreshCw, Send, LogOut, CheckCircle2, AlertCircle } from 'lucide-react';

function MainApp() {
  const {
    currentUser,
    isLoading,
    isEmailVerified,
    unverifiedUserEmail,
    resendVerificationEmail,
    checkEmailVerification,
    logout
  } = useAuth();
  const { t } = useLanguage();

  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [verifyMsg, setVerifyMsg] = useState<{ type: 'error' | 'success'; text: string } | null>(null);

  // 1. Loading State
  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-4 transition-colors">
        <div className="flex flex-col items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-amber-500 flex items-center justify-center text-slate-950 font-black shadow-xl shadow-amber-500/20 animate-bounce">
            <ShieldCheck className="w-8 h-8" />
          </div>
          <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300 font-bold text-xs tracking-wide">
            <Loader2 className="w-4 h-4 animate-spin text-amber-500" />
            <span>CenterFlow Yuklanmoqda...</span>
          </div>
        </div>
      </div>
    );
  }

  // 2. Unauthenticated View (Public Landing Page)
  if (!currentUser) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 font-sans selection:bg-amber-500 selection:text-slate-950">
        {/* Public Navigation Bar */}
        <Navbar onOpenAuth={() => setIsAuthModalOpen(true)} />

        {/* Public Landing Page */}
        <LandingPage onOpenAuth={() => setIsAuthModalOpen(true)} />

        {/* Auth Modal (Login & Register) */}
        <AuthModal
          isOpen={isAuthModalOpen}
          onClose={() => setIsAuthModalOpen(false)}
        />
      </div>
    );
  }

  // 3. Email Verification Gate (If logged in but email not verified)
  if (!isEmailVerified) {
    const handleResend = async () => {
      setResendLoading(true);
      setVerifyMsg(null);
      try {
        await resendVerificationEmail();
        setVerifyMsg({
          type: 'success',
          text: t.auth.verificationSentSuccess || 'Tasdiqlash xati qayta yuborildi! Pochtangizni tekshiring.'
        });
      } catch (err: any) {
        setVerifyMsg({
          type: 'error',
          text: err?.message || 'Failed to resend verification email.'
        });
      } finally {
        setResendLoading(false);
      }
    };

    const handleCheck = async () => {
      setResendLoading(true);
      setVerifyMsg(null);
      try {
        const verified = await checkEmailVerification();
        if (verified) {
          setVerifyMsg({
            type: 'success',
            text: t.auth.emailVerifiedSuccess || 'Pochta muvaffaqiyatli tasdiqlandi!'
          });
        } else {
          setVerifyMsg({
            type: 'error',
            text: 'Elektron pochta hali tasdiqlanmagan. Iltimos, pochtangizdagi havolani bosing.'
          });
        }
      } catch (err: any) {
        setVerifyMsg({
          type: 'error',
          text: err?.message || 'Pochta holatini tekshirishda xatolik.'
        });
      } finally {
        setResendLoading(false);
      }
    };

    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4 font-sans selection:bg-amber-500 selection:text-slate-950">
        <div className="w-full max-w-md bg-slate-950 border border-slate-800 rounded-3xl shadow-2xl p-8 text-center animate-fadeIn">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-amber-500/10 text-amber-500 mb-4 border border-amber-500/20 shadow-lg shadow-amber-500/10">
            <MailWarning className="w-8 h-8" />
          </div>

          <h2 className="text-2xl font-extrabold text-white tracking-tight mb-2">
            {t.auth.unverifiedTitle || 'Elektron pochta tasdiqlanmagan'}
          </h2>

          <p className="text-xs text-slate-400 leading-relaxed max-w-sm mx-auto mb-5">
            {t.auth.unverifiedNotice || 'Aql-idrok xavfsizligi uchun tizimga kirishdan oldin pochtangizni tasdiqlashingiz shart.'}
          </p>

          <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl font-mono text-xs text-amber-400 font-bold mb-6 break-all">
            {unverifiedUserEmail || currentUser.email}
          </div>

          {verifyMsg && (
            <div
              className={`mb-5 p-3 rounded-xl border text-xs flex items-center gap-2 text-left ${
                verifyMsg.type === 'success'
                  ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                  : 'bg-red-500/10 border-red-500/20 text-red-400'
              }`}
            >
              {verifyMsg.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 shrink-0" />
              )}
              <span>{verifyMsg.text}</span>
            </div>
          )}

          <div className="space-y-3">
            <button
              onClick={handleCheck}
              disabled={resendLoading}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-md shadow-amber-500/20 transition cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${resendLoading ? 'animate-spin' : ''}`} />
              <span>{t.auth.checkVerificationBtn || 'Tasdiqlanganini tekshirish'}</span>
            </button>

            <button
              onClick={handleResend}
              disabled={resendLoading}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 font-bold text-xs border border-slate-800 transition cursor-pointer disabled:opacity-50"
            >
              <Send className="w-4 h-4" />
              <span>{t.auth.resendVerificationBtn || 'Tasdiqlash xabarini qayta yuborish'}</span>
            </button>

            <button
              onClick={logout}
              className="w-full flex items-center justify-center gap-2 py-2.5 text-xs text-slate-500 hover:text-slate-300 font-medium transition cursor-pointer pt-2"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Tizimdan chiqish (Sign Out)</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 4. Authenticated & Verified View (Internal Dashboard)
  return (
    <AppLayout>
      <Dashboard />
    </AppLayout>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <LanguageProvider>
        <AuthProvider>
          <MainApp />
        </AuthProvider>
      </LanguageProvider>
    </ThemeProvider>
  );
}
