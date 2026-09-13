import React, { useState, useEffect } from 'react';
import {
  Send,
  CheckCircle2,
  Loader2,
  QrCode,
  ShieldCheck,
  Copy,
  ExternalLink,
  Sparkles,
  X,
  Bell,
  Calendar,
  BarChart3,
  Check
} from 'lucide-react';

export interface TelegramBotConnectorProps {
  userUid: string;
  currentTelegramHandle?: string;
  onConnectionSuccess?: (data: { telegramUsername: string; chatId: string }) => void;
  onClose?: () => void;
}

export const TelegramBotConnector: React.FC<TelegramBotConnectorProps> = ({
  userUid,
  currentTelegramHandle,
  onConnectionSuccess,
  onClose
}) => {
  const [activeTab, setActiveTab] = useState<'link' | 'qr'>('link');
  const [isPolling, setIsPolling] = useState(false);
  const [isConnected, setIsConnected] = useState(Boolean(currentTelegramHandle));
  const [connectedHandle, setConnectedHandle] = useState(currentTelegramHandle || '');
  const [copied, setCopied] = useState(false);

  const botUsername = 'centerflow_bot';
  // SECURITY: bot tokens must never live in client bundles. All Telegram API
  // calls go through the authenticated server routes; the client only needs
  // the public bot username for the deep link.
  const telegramDeepLink = `https://t.me/${botUsername}?start=${userUid}`;

  useEffect(() => {
    let interval: any;
    if (isPolling && !isConnected) {
      interval = setInterval(async () => {
        try {
          const res = await fetch(`/api/bot/status/${userUid}`);
          if (res.ok) {
            const data = await res.json();
            if (data.isConnected) {
              setIsConnected(true);
              setConnectedHandle(data.telegramUsername || '@student');
              setIsPolling(false);
              if (onConnectionSuccess) {
                onConnectionSuccess({
                  telegramUsername: data.telegramUsername || '@student',
                  chatId: data.chatId || userUid
                });
              }
            }
          }
        } catch {
          // Fallback simulation or silent retry
        }
      }, 3000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isPolling, isConnected, userUid, onConnectionSuccess]);

  const handleLaunchBot = () => {
    window.open(telegramDeepLink, '_blank');
    setIsPolling(true);
  };

  // Manual check re-triggers the real server-side status poll — connection
  // is only marked when /api/bot/status confirms it. Never self-attest.
  const handleManualCheck = () => {
    setIsPolling(true);
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(telegramDeepLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative w-full max-w-lg bg-[#120320] border border-white/10 rounded-3xl shadow-2xl overflow-hidden p-6 sm:p-8 text-white">
      {/* Background Ambient Glows */}
      <div className="absolute -top-20 -right-20 w-56 h-56 bg-[#229ED9]/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-20 -left-20 w-56 h-56 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Optional Close Button */}
      {onClose && (
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full text-slate-400 hover:text-white bg-white/5 hover:bg-white/10 transition cursor-pointer z-10"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>
      )}

      {/* Header Info */}
      <div className="flex flex-col items-center text-center mb-6 relative z-10">
        <div className="relative mb-4">
          <div className="absolute -inset-2 rounded-full bg-[#229ED9]/30 animate-ping opacity-75" />
          <div className="relative w-16 h-16 rounded-2xl bg-[#229ED9] text-white flex items-center justify-center shadow-lg shadow-[#229ED9]/40 border border-white/20">
            <Send className="w-8 h-8 -translate-x-0.5 translate-y-0.5" />
          </div>
        </div>

        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-bold mb-2">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Real-Time Notifications & Admin Alerts</span>
        </div>

        <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
          Connect @{botUsername}
        </h2>
        <p className="text-xs sm:text-sm text-slate-300 mt-2 max-w-md leading-relaxed">
          Get real-time updates for homework diagnostic grades, class schedules, and security alerts.
        </p>
      </div>

      {/* Feature Bullet Cards */}
      {!isConnected && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 mb-6 relative z-10">
          <div className="p-3 rounded-2xl bg-white/5 border border-white/10 flex flex-col items-center text-center">
            <Bell className="w-5 h-5 text-amber-400 mb-1" />
            <span className="text-[11px] font-bold text-white">Grade Alerts</span>
            <span className="text-[9px] text-slate-400">Instant score updates</span>
          </div>
          <div className="p-3 rounded-2xl bg-white/5 border border-white/10 flex flex-col items-center text-center">
            <ShieldCheck className="w-5 h-5 text-[#229ED9] mb-1" />
            <span className="text-[11px] font-bold text-white">PIN Delivery</span>
            <span className="text-[9px] text-slate-400">Security passcode</span>
          </div>
          <div className="p-3 rounded-2xl bg-white/5 border border-white/10 flex flex-col items-center text-center">
            <Calendar className="w-5 h-5 text-emerald-400 mb-1" />
            <span className="text-[11px] font-bold text-white">Class Schedules</span>
            <span className="text-[9px] text-slate-400">Attendance reminders</span>
          </div>
        </div>
      )}

      {/* Connected State */}
      {isConnected ? (
        <div className="space-y-6 relative z-10 animate-fadeIn">
          <div className="p-4 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center shrink-0">
              <Check className="w-6 h-6 text-emerald-400" />
            </div>
            <div>
              <h4 className="font-bold text-sm text-white">Telegram Bot Connected!</h4>
              <p className="text-xs text-emerald-300">
                Connected handle: <span className="font-mono font-bold">{connectedHandle || '@centerflow_user'}</span>
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/5 text-xs text-slate-200">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Homework Diagnostic Notifications: Active</span>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/5 text-xs text-slate-200">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Class Schedule Reminders: Active</span>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/5 text-xs text-slate-200">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Admin Security Passcode Delivery: Enabled</span>
            </div>
          </div>

          {onClose && (
            <button
              onClick={onClose}
              className="w-full py-3.5 px-6 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-sm shadow-xl shadow-amber-500/20 transition cursor-pointer"
            >
              Continue to Student Dashboard
            </button>
          )}
        </div>
      ) : (
        /* Not Connected State */
        <div className="space-y-4 relative z-10">
          {/* Tab buttons */}
          <div className="flex items-center gap-2 p-1 rounded-2xl bg-white/5 border border-white/10">
            <button
              onClick={() => setActiveTab('link')}
              className={`flex-1 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                activeTab === 'link'
                  ? 'bg-[#229ED9] text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Direct Link
            </button>
            <button
              onClick={() => setActiveTab('qr')}
              className={`flex-1 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                activeTab === 'qr'
                  ? 'bg-[#229ED9] text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Scan QR Code
            </button>
          </div>

          {activeTab === 'link' ? (
            <div className="space-y-3">
              <button
                onClick={handleLaunchBot}
                className="w-full flex items-center justify-center gap-3 py-4 px-6 rounded-2xl bg-[#229ED9] hover:bg-[#1f91c7] text-white font-black text-sm sm:text-base shadow-xl shadow-[#229ED9]/25 transition cursor-pointer transform hover:-translate-y-0.5"
              >
                <Send className="w-5 h-5" />
                <span>🚀 Connect @{botUsername}</span>
                <ExternalLink className="w-4 h-4 opacity-80" />
              </button>

              <button
                onClick={handleCopyLink}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 font-bold text-xs border border-white/10 transition cursor-pointer"
              >
                <Copy className="w-3.5 h-3.5 text-amber-400" />
                <span>{copied ? 'Link Copied to Clipboard!' : 'Copy Deep Link'}</span>
              </button>
            </div>
          ) : (
            <div className="p-4 rounded-2xl bg-white/5 border border-white/10 flex flex-col items-center justify-center space-y-3">
              <div className="p-3 bg-white rounded-xl shadow-lg border border-slate-200">
                <div className="w-36 h-36 bg-slate-900 rounded-lg flex flex-col items-center justify-center text-center p-2">
                  <QrCode className="w-16 h-16 text-amber-400 mb-1" />
                  <span className="text-[10px] font-mono text-slate-300 font-bold">@{botUsername}</span>
                  <span className="text-[8px] font-mono text-amber-400">Scan to Start Bot</span>
                </div>
              </div>
              <p className="text-[11px] text-slate-400 text-center">
                Scan with your phone camera or Telegram app to launch bot with your user ID.
              </p>
            </div>
          )}

          {/* Polling / Manual Status Checker */}
          <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-3 text-center">
            {isPolling ? (
              <div className="flex items-center justify-center gap-2 text-amber-400 text-xs font-bold py-1">
                <Loader2 className="w-4 h-4 animate-spin text-[#229ED9]" />
                <span>Waiting for you to click Start in @{botUsername}...</span>
              </div>
            ) : (
              <p className="text-xs text-slate-300">
                Opened Telegram? Press <span className="font-mono text-amber-400 font-bold">START</span> in the bot chat.
              </p>
            )}

            <button
              onClick={handleManualCheck}
              disabled={isPolling}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs shadow-md shadow-amber-500/20 transition cursor-pointer disabled:opacity-50"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>I've Already Clicked Start</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
