import React, { useState, useEffect } from 'react';
import { Send, CheckCircle2, RefreshCw, ExternalLink, ShieldAlert, Copy, Check, Sparkles, LogOut } from 'lucide-react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { checkBotStatus, createTelegramLinkSession } from '../../services/telegram';

export interface TelegramIntegrationCardProps {
  onDisconnect?: () => void;
  compact?: boolean;
}

export const TelegramIntegrationCard: React.FC<TelegramIntegrationCardProps> = ({ compact = false }) => {
  const { currentUser, userProfile, logout } = useAuth();
  const { language } = useLanguage();
  const t = (uz: string, en: string, ru: string) => (language === 'EN' ? en : language === 'RU' ? ru : uz);
  const [isBotConnected, setIsBotConnected] = useState<boolean>(Boolean(userProfile?.isBotConnected));
  const [telegramUsername, setTelegramUsername] = useState<string>(userProfile?.telegramUsername || '');
  const [loading, setLoading] = useState<boolean>(false);
  const [checking, setChecking] = useState<boolean>(false);
  const [copiedCommand, setCopiedCommand] = useState<boolean>(false);
  const [showManualCode, setShowManualCode] = useState<boolean>(false);

  const userUid = currentUser?.uid || userProfile?.uid || 'demo_user';

  // Real-Time Listener on users/{userUid}
  useEffect(() => {
    if (!userUid || userUid === 'demo_user') return;

    const userRef = doc(db, 'users', userUid);
    const unsubscribe = onSnapshot(
      userRef,
      (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.data();
          if (data.isBotConnected !== undefined) {
            setIsBotConnected(Boolean(data.isBotConnected));
          }
          if (data.telegramUsername) {
            setTelegramUsername(data.telegramUsername);
          }
        }
      },
      (err) => {
        console.warn('Firestore user snapshot error:', err);
      }
    );

    return () => unsubscribe();
  }, [userUid]);

  // Initiate deep link connection via one-time session token
  const handleConnectTelegram = async () => {
    setLoading(true);
    try {
      const { deepLink } = await createTelegramLinkSession(userUid);
      window.open(deepLink, '_blank');
    } catch (error) {
      console.error('Error opening Telegram deep link:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleManualCheck = async () => {
    setChecking(true);
    const res = await checkBotStatus(userUid);
    if (res.isConnected) {
      setIsBotConnected(true);
      setTelegramUsername(res.telegramUsername || '@user');
    } else if (userProfile?.isBotConnected || userProfile?.telegramUsername) {
      setIsBotConnected(true);
      setTelegramUsername(userProfile.telegramUsername || '@user');
    }
    setChecking(false);
  };

  const handleCopyCommand = async () => {
    const { sessionId } = await createTelegramLinkSession(userUid);
    const cmd = `/start ${sessionId}`;
    navigator.clipboard.writeText(cmd);
    setCopiedCommand(true);
    setTimeout(() => setCopiedCommand(false), 2500);
  };

  if (!currentUser && !userProfile) {
    return (
      <div className="p-6 rounded-3xl bg-white/5 border border-white/10 text-white text-center">
        <p className="text-xs text-slate-400">Please log in to connect your Telegram account.</p>
      </div>
    );
  }

  return (
    <div className={`relative overflow-hidden rounded-3xl bg-[#120320] border border-white/10 text-white shadow-2xl transition-all ${compact ? 'p-5' : 'p-6 sm:p-8'}`}>
      {/* Background Glow */}
      <div className="absolute -top-16 -right-16 w-48 h-48 bg-[#229ED9]/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-16 -left-16 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header section */}
      <div className="flex items-start justify-between mb-5 relative z-10">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-[#229ED9] text-white flex items-center justify-center shadow-lg shadow-[#229ED9]/30 shrink-0">
            <Send className="w-6 h-6 -translate-x-0.5 translate-y-0.5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-extrabold text-lg tracking-tight">CenterFlow Bot Integration</h3>
              {isBotConnected && (
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-black uppercase tracking-wider">
                  Connected
                </span>
              )}
            </div>
            <p className="text-xs text-slate-300 mt-0.5">
              {isBotConnected
                ? `Active linked account: ${telegramUsername || '@connected_user'}`
                : 'Connect @centerflow_bot for diagnostic grades, PINs & schedule alerts.'}
            </p>
          </div>
        </div>

        <button
          onClick={handleManualCheck}
          disabled={checking}
          className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 transition cursor-pointer"
          title="Sync Connection Status"
        >
          <RefreshCw className={`w-4 h-4 ${checking ? 'animate-spin text-amber-400' : ''}`} />
        </button>
      </div>

      {/* Connected State */}
      {isBotConnected ? (
        <div className="space-y-4 relative z-10 animate-fadeIn">
          <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
              <div>
                <span className="text-xs font-bold text-white block">Real-Time Telegram Sync Active</span>
                <span className="text-[11px] text-emerald-300">
                  Tag: <span className="font-mono font-bold">{telegramUsername || '@student'}</span>
                </span>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Not Connected State */
        <div className="space-y-4 relative z-10">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
            <div className="p-3 rounded-2xl bg-white/5 border border-white/5 flex flex-col items-center text-center">
              <Sparkles className="w-4 h-4 text-amber-400 mb-1" />
              <span className="font-bold text-white text-[11px]">Exam Grades</span>
              <span className="text-[9px] text-slate-400">Instant score updates</span>
            </div>
            <div className="p-3 rounded-2xl bg-white/5 border border-white/5 flex flex-col items-center text-center">
              <ShieldAlert className="w-4 h-4 text-[#229ED9] mb-1" />
              <span className="font-bold text-white text-[11px]">Security PINs</span>
              <span className="text-[9px] text-slate-400">Admin auth passcodes</span>
            </div>
            <div className="p-3 rounded-2xl bg-white/5 border border-white/5 flex flex-col items-center text-center">
              <Send className="w-4 h-4 text-emerald-400 mb-1" />
              <span className="font-bold text-white text-[11px]">Schedule Reminders</span>
              <span className="text-[9px] text-slate-400">Lesson notifications</span>
            </div>
          </div>

          <button
            onClick={handleConnectTelegram}
            disabled={loading}
            className="w-full flex items-center justify-center gap-2.5 py-3.5 px-6 rounded-2xl bg-[#229ED9] hover:bg-[#1f91c7] text-white font-black text-sm shadow-xl shadow-[#229ED9]/25 transition cursor-pointer transform hover:-translate-y-0.5 disabled:opacity-50"
          >
            {loading ? (
              <RefreshCw className="w-4 h-4 animate-spin text-white" />
            ) : (
              <>
                <Send className="w-4 h-4" />
                <span>Connect Telegram Account</span>
                <ExternalLink className="w-3.5 h-3.5 opacity-80" />
              </>
            )}
          </button>

          {/* Toggle Manual Command Fallback */}
          <div className="pt-2 border-t border-white/5">
            <button
              onClick={() => setShowManualCode(!showManualCode)}
              className="text-xs text-slate-400 hover:text-white underline transition cursor-pointer"
            >
              {showManualCode ? 'Hide manual command' : 'Having trouble opening link? Use manual command'}
            </button>

            {showManualCode && (
              <div className="mt-3 p-3 rounded-xl bg-slate-950/80 border border-white/10 flex items-center justify-between text-xs">
                <span className="font-mono text-amber-400 font-bold">/start {userUid}</span>
                <button
                  onClick={handleCopyCommand}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white font-bold transition cursor-pointer"
                >
                  {copiedCommand ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 text-amber-400" />
                      <span>Copy</span>
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {logout && (
        <div className="mt-6 pt-4 border-t border-white/5 flex justify-end">
          <button
            onClick={logout}
            className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200 transition cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>{t('Chiqish', 'Sign Out', 'Выйти')}</span>
          </button>
        </div>
      )}
    </div>
  );
};
