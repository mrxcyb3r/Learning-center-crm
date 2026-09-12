import React, { useState, useEffect, useCallback } from 'react';
import { Send, CheckCircle2, RefreshCw, ExternalLink, Bell, ShieldCheck, Sparkles } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { checkBotStatus, createTelegramLinkSession, BOT_USERNAME, BotStatusResponse } from '../../services/telegram';

export const TelegramConnectCard: React.FC = () => {
  const { currentUser, userProfile } = useAuth();
  const [status, setStatus] = useState<BotStatusResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [checking, setChecking] = useState(false);

  const uid = currentUser?.uid || userProfile?.uid || 'demo_student';

  const verifyConnection = useCallback(async () => {
    setChecking(true);
    const res = await checkBotStatus(uid);
    // If userProfile has telegramUsername or isBotConnected set, honor it as fallback
    if (!res.isConnected && (userProfile?.isBotConnected || userProfile?.telegramUsername)) {
      setStatus({
        isConnected: true,
        telegramUsername: userProfile.telegramUsername || '@student'
      });
    } else {
      setStatus(res);
    }
    setChecking(false);
    setLoading(false);
  }, [uid, userProfile]);

  useEffect(() => {
    verifyConnection();
    // Auto check status periodically
    const interval = setInterval(verifyConnection, 10000);
    return () => clearInterval(interval);
  }, [verifyConnection]);

  const handleLaunch = async () => {
    const { deepLink } = await createTelegramLinkSession(uid);
    window.open(deepLink, '_blank');
  };

  if (loading) {
    return (
      <div className="p-6 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-md flex items-center justify-center">
        <RefreshCw className="w-5 h-5 animate-spin text-amber-400" />
      </div>
    );
  }

  const isConnected = Boolean(status?.isConnected);

  return (
    <div className="p-6 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-md relative overflow-hidden text-white shadow-xl">
      {/* Background Glow */}
      <div className="absolute -top-12 -right-12 w-40 h-40 bg-[#229ED9]/15 rounded-full blur-2xl pointer-events-none" />

      <div className="flex items-start justify-between mb-4 relative z-10">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-[#229ED9] text-white flex items-center justify-center shadow-lg shadow-[#229ED9]/30">
            <Send className="w-6 h-6 -translate-x-0.5 translate-y-0.5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-extrabold text-base tracking-tight">Telegram Bot (@{BOT_USERNAME})</h3>
              {isConnected && (
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-black uppercase">
                  Connected
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400">
              {isConnected
                ? `Active for ${status?.telegramUsername || userProfile?.telegramUsername || '@student'}`
                : 'Not linked yet. Connect to get instant diagnostic grade & schedule alerts.'}
            </p>
          </div>
        </div>

        <button
          onClick={verifyConnection}
          disabled={checking}
          className="p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 transition cursor-pointer"
          title="Refresh connection status"
        >
          <RefreshCw className={`w-4 h-4 ${checking ? 'animate-spin text-amber-400' : ''}`} />
        </button>
      </div>

      {/* Connection Status Details or Connect CTA */}
      {isConnected ? (
        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 space-y-2 text-xs relative z-10">
          <div className="flex items-center gap-2 text-emerald-300 font-semibold">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Real-Time Notifications Active</span>
          </div>
          <div className="grid grid-cols-2 gap-2 pt-2 text-[11px] text-slate-300 border-t border-emerald-500/20">
            <div className="flex items-center gap-1.5">
              <Bell className="w-3.5 h-3.5 text-amber-400" />
              <span>Diagnostic Grades</span>
            </div>
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-[#229ED9]" />
              <span>PIN & Security</span>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-3 relative z-10">
          <button
            onClick={handleLaunch}
            className="w-full flex items-center justify-center gap-2.5 py-3 px-5 rounded-2xl bg-[#229ED9] hover:bg-[#1f91c7] text-white font-black text-xs sm:text-sm shadow-lg shadow-[#229ED9]/25 transition cursor-pointer transform hover:-translate-y-0.5"
          >
            <Send className="w-4 h-4" />
            <span>Connect @{BOT_USERNAME} Now</span>
            <ExternalLink className="w-3.5 h-3.5 opacity-80" />
          </button>
          <div className="flex items-center justify-between text-[11px] text-slate-400 px-1">
            <span className="flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-amber-400" /> Instant Alerts
            </span>
            <span>Click Start in Telegram to bind UID</span>
          </div>
        </div>
      )}
    </div>
  );
};
