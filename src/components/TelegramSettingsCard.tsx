import React, { useState, useEffect, useCallback } from 'react';
import { Send, CheckCircle2, RefreshCw, AlertCircle, ExternalLink, ShieldCheck, Bell, MessageSquare } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { checkBotStatus, createTelegramLinkSession, BOT_USERNAME, BotStatusResponse } from '../services/telegram';

export interface TelegramSettingsCardProps {
  userUid?: string;
  className?: string;
}

export const TelegramSettingsCard: React.FC<TelegramSettingsCardProps> = ({ userUid: propUid, className = '' }) => {
  const { currentUser, userProfile } = useAuth();
  const targetUid = propUid || currentUser?.uid || userProfile?.uid || 'demo_student';

  const [status, setStatus] = useState<BotStatusResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [checking, setChecking] = useState<boolean>(false);
  const [rateLimitBanner, setRateLimitBanner] = useState<string | null>(null);

  const fetchStatus = useCallback(async () => {
    setChecking(true);
    setRateLimitBanner(null);
    const res = await checkBotStatus(targetUid);

    if (res.isRateLimited) {
      setRateLimitBanner(res.errorMessage || 'Rate limit hit. Please wait a moment before checking again.');
    } else {
      // If userProfile explicitly has telegram username or status
      if (!res.isConnected && (userProfile?.isBotConnected || userProfile?.telegramUsername)) {
        setStatus({
          isConnected: true,
          telegramUsername: userProfile.telegramUsername || '@student'
        });
      } else {
        setStatus(res);
      }
    }
    setChecking(false);
    setLoading(false);
  }, [targetUid, userProfile]);

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  const handleConnect = async () => {
    const { deepLink } = await createTelegramLinkSession(targetUid);
    window.open(deepLink, '_blank');
  };

  return (
    <div className={`p-6 bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-gray-100 dark:border-slate-800 transition-all ${className}`}>
      {/* Header section */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800 mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
            <Send className="w-5 h-5 -translate-x-0.5 translate-y-0.5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              Telegram Notifications
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Bot username: <span className="font-mono font-semibold text-blue-600 dark:text-blue-400">@{BOT_USERNAME}</span>
            </p>
          </div>
        </div>

        <button
          onClick={fetchStatus}
          disabled={checking}
          className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition cursor-pointer disabled:opacity-50"
          title="Refresh connection status"
        >
          <RefreshCw className={`w-4 h-4 ${checking ? 'animate-spin text-blue-600' : ''}`} />
        </button>
      </div>

      {/* Rate Limit Alert Banner */}
      {rateLimitBanner && (
        <div className="mb-4 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 text-xs flex items-center gap-2 animate-fadeIn">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{rateLimitBanner}</span>
        </div>
      )}

      {/* Loading Skeleton */}
      {loading ? (
        <div className="space-y-3 animate-pulse">
          <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-3/4"></div>
          <div className="h-3 bg-slate-200 dark:bg-slate-800 rounded w-1/2"></div>
          <div className="h-10 bg-slate-200 dark:bg-slate-800 rounded-lg w-full mt-4"></div>
        </div>
      ) : status?.isConnected ? (
        /* Connected State */
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/50 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <div>
                <span className="text-sm font-bold text-emerald-900 dark:text-emerald-200 block">
                  Connected as <span className="font-mono text-emerald-700 dark:text-emerald-300">{status.telegramUsername || '@user'}</span>
                </span>
                <span className="text-xs text-emerald-700 dark:text-emerald-400">
                  Real-time security PINs, grade results, & schedule alerts active
                </span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
            <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 flex items-center gap-2 text-slate-700 dark:text-slate-300">
              <ShieldCheck className="w-4 h-4 text-blue-500 shrink-0" />
              <span>Security PINs</span>
            </div>
            <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 flex items-center gap-2 text-slate-700 dark:text-slate-300">
              <Bell className="w-4 h-4 text-amber-500 shrink-0" />
              <span>Diagnostic Grades</span>
            </div>
            <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 flex items-center gap-2 text-slate-700 dark:text-slate-300">
              <MessageSquare className="w-4 h-4 text-emerald-500 shrink-0" />
              <span>Class Notices</span>
            </div>
          </div>

          <p className="text-[11px] text-slate-500 dark:text-slate-400 italic">
            Need to unlink or switch Telegram accounts? Open <span className="font-mono text-blue-600 dark:text-blue-400">@{BOT_USERNAME}</span> in Telegram and send <span className="font-mono font-semibold">/unlink</span>.
          </p>
        </div>
      ) : (
        /* Disconnected State */
        <div className="space-y-4">
          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
            Connect your Telegram account to instantly receive login security PINs, real-time grade results, and schedule updates.
          </p>

          <button
            onClick={handleConnect}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-lg inline-flex items-center gap-2 text-xs font-semibold shadow-sm transition cursor-pointer"
          >
            <Send className="w-4 h-4" />
            <span>Connect @{BOT_USERNAME}</span>
            <ExternalLink className="w-3.5 h-3.5 opacity-80" />
          </button>
        </div>
      )}
    </div>
  );
};
