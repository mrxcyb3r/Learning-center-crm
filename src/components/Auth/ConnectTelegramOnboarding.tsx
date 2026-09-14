import React, { useState, useEffect } from 'react';
import { Send, CheckCircle2, ShieldCheck, Sparkles, Copy, Check, ExternalLink, RefreshCw, LogOut } from 'lucide-react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { BOT_USERNAME, checkBotStatus, createTelegramLinkSession } from '../../services/telegram';

interface ConnectTelegramOnboardingProps {
  onComplete?: () => void;
}

export const ConnectTelegramOnboarding: React.FC<ConnectTelegramOnboardingProps> = ({ onComplete }) => {
  const { currentUser, userProfile, logout } = useAuth();
  const { language } = useLanguage();
  const t = (uz: string, en: string, ru: string) => (language === 'EN' ? en : language === 'RU' ? ru : uz);
  const [isBotConnected, setIsBotConnected] = useState<boolean>(Boolean(userProfile?.isBotConnected));
  const [telegramUsername, setTelegramUsername] = useState<string>(userProfile?.telegramUsername || '');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);

  const userUid = currentUser?.uid || userProfile?.uid || 'demo_user';

  useEffect(() => {
    if (!userUid || userUid === 'demo_user') return;

    const userRef = doc(db, 'users', userUid);
    const unsubscribe = onSnapshot(userRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        if (data.isBotConnected) {
          setIsBotConnected(true);
          setTelegramUsername(data.telegramUsername || '@student');
          setShowCelebration(true);
          setTimeout(() => {
            if (onComplete) onComplete();
          }, 2000);
        }
      }
    });

    return () => unsubscribe();
  }, [userUid, onComplete]);

  const handleLaunch = async () => {
    setLoading(true);
    try {
      const { deepLink } = await createTelegramLinkSession(userUid);
      window.open(deepLink, '_blank');
    } catch (err) {
      console.error('Error opening Telegram:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleManualCheck = async () => {
    setLoading(true);
    const res = await checkBotStatus(userUid);
    if (res.isConnected) {
      setIsBotConnected(true);
      setTelegramUsername(res.telegramUsername || '@student');
      setShowCelebration(true);
      setTimeout(() => {
        if (onComplete) onComplete();
      }, 2000);
    }
    setLoading(false);
  };

  const handleCopy = async () => {
    const { sessionId } = await createTelegramLinkSession(userUid);
    navigator.clipboard.writeText(`/start ${sessionId}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-[#0d021a] flex items-center justify-center p-4 relative overflow-hidden font-sans text-white">
      {/* Ambient background blur */}
      <div className="absolute top-1/4 -left-32 w-96 h-96 bg-[#229ED9]/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-amber-500/15 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 w-full max-w-lg bg-[#120320] border border-white/10 rounded-3xl shadow-2xl overflow-hidden p-6 sm:p-8 text-center">
        {showCelebration ? (
          <div className="space-y-6 py-6 animate-fadeIn">
            <div className="w-20 h-20 rounded-full bg-emerald-500/20 border-2 border-emerald-500 text-emerald-400 flex items-center justify-center mx-auto shadow-xl shadow-emerald-500/30 animate-bounce">
              <CheckCircle2 className="w-10 h-10" />
            </div>

            <div>
              <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                Account Connected!
              </h2>
              <p className="text-sm text-emerald-300 mt-2 font-medium">
                Telegram handle: <span className="font-mono font-bold text-white">{telegramUsername}</span>
              </p>
            </div>

            <p className="text-xs text-slate-400">Redirecting to your CenterFlow Dashboard...</p>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="relative inline-block mx-auto mb-2">
              <div className="w-16 h-16 rounded-2xl bg-[#229ED9] text-white flex items-center justify-center mx-auto shadow-xl shadow-[#229ED9]/30 border border-white/20">
                <Send className="w-8 h-8 -translate-x-0.5 translate-y-0.5" />
              </div>
            </div>

            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-bold">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Post-Login Security & Alert Onboarding</span>
            </div>

            <div>
              <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                Connect Telegram to Continue
              </h2>
              <p className="text-xs sm:text-sm text-slate-300 mt-2 max-w-md mx-auto leading-relaxed">
                CenterFlow requires a linked Telegram account for automated diagnostic score reports, class attendance updates, and PIN authentication.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-left">
              <div className="p-3 rounded-2xl bg-white/5 border border-white/5 flex flex-col items-center text-center">
                <Sparkles className="w-4 h-4 text-amber-400 mb-1" />
                <span className="font-bold text-white text-xs">Diagnostic Scores</span>
                <span className="text-[10px] text-slate-400">Direct report alerts</span>
              </div>
              <div className="p-3 rounded-2xl bg-white/5 border border-white/5 flex flex-col items-center text-center">
                <ShieldCheck className="w-4 h-4 text-[#229ED9] mb-1" />
                <span className="font-bold text-white text-xs">PIN Notices</span>
                <span className="text-[10px] text-slate-400">Security passcodes</span>
              </div>
              <div className="p-3 rounded-2xl bg-white/5 border border-white/5 flex flex-col items-center text-center">
                <Send className="w-4 h-4 text-emerald-400 mb-1" />
                <span className="font-bold text-white text-xs">Class Schedule</span>
                <span className="text-[10px] text-slate-400">Lesson reminders</span>
              </div>
            </div>

            <div className="space-y-3 pt-2">
              <button
                onClick={handleLaunch}
                disabled={loading}
                className="w-full flex items-center justify-center gap-3 py-4 px-6 rounded-2xl bg-[#229ED9] hover:bg-[#1f91c7] text-white font-black text-sm sm:text-base shadow-xl shadow-[#229ED9]/25 transition cursor-pointer transform hover:-translate-y-0.5 disabled:opacity-50"
              >
                {loading ? (
                  <RefreshCw className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <Send className="w-5 h-5" />
                    <span>🚀 Connect @{BOT_USERNAME}</span>
                    <ExternalLink className="w-4 h-4 opacity-80" />
                  </>
                )}
              </button>

              <div className="p-3 rounded-xl bg-slate-950/80 border border-white/10 flex items-center justify-between text-xs">
                <span className="font-mono text-amber-400 font-bold">/start {userUid}</span>
                <button
                  onClick={handleCopy}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white font-bold transition cursor-pointer"
                >
                  {copied ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 text-amber-400" />
                      <span>Copy Command</span>
                    </>
                  )}
                </button>
              </div>

              <button
                onClick={handleManualCheck}
                className="w-full py-2.5 px-4 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-bold border border-white/10 transition cursor-pointer"
              >
                I've Already Clicked Start
              </button>
            </div>

            <div className="pt-4 border-t border-white/5 flex items-center justify-between text-xs text-slate-400">
              <span>CenterFlow Platform</span>
              <button
                onClick={logout}
                className="flex items-center gap-1.5 text-slate-400 hover:text-white transition cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>{t('Chiqish', 'Sign Out', 'Выйти')}</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
