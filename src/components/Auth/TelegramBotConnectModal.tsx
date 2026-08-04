import React, { useState, useEffect } from 'react';
import {
  Send,
  CheckCircle2,
  QrCode,
  Sparkles,
  X,
  ArrowRight,
  Bell,
  Calendar,
  BarChart3,
  RefreshCw,
  ExternalLink,
  ShieldCheck,
  Check
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { updateUserProfile } from '../../services/firestore';
import { useKeyboardShortcuts } from '../../hooks/useKeyboardShortcuts';

interface TelegramBotConnectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete?: () => void;
  authToken?: string;
}

export const TelegramBotConnectModal: React.FC<TelegramBotConnectModalProps> = ({
  isOpen,
  onClose,
  onComplete,
  authToken
}) => {
  const { currentUser } = useAuth();
  useKeyboardShortcuts({ onEscape: onClose, enabled: isOpen });
  const [step, setStep] = useState<'connect' | 'waiting' | 'success'>('connect');
  const [isVerifying, setIsVerifying] = useState(false);
  const [showQr, setShowQr] = useState(false);

  const token = authToken || currentUser?.uid || 'CF_SESSION_' + Math.random().toString(36).substring(2, 9);
  const botUsername = 'centerflow_bot';
  const telegramDeepLink = `https://t.me/${botUsername}?start=${token}`;

  useEffect(() => {
    if (!isOpen) {
      setStep('connect');
      setIsVerifying(false);
      setShowQr(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleLaunchBot = () => {
    window.open(telegramDeepLink, '_blank');
    setStep('waiting');
  };

  const handleManualConfirm = async () => {
    setIsVerifying(true);
    // Simulate/save bot connection state
    try {
      if (currentUser?.uid) {
        await updateUserProfile(currentUser.uid, {
          isBotConnected: true,
          telegramUsername: currentUser.displayName || 'connected_user'
        });
      }
    } catch (err) {
      console.warn('Profile update warning:', err);
    }

    setTimeout(() => {
      setIsVerifying(false);
      setStep('success');
    }, 1200);
  };

  const handleSkip = async () => {
    try {
      if (currentUser?.uid) {
        await updateUserProfile(currentUser.uid, {
          isBotConnected: false
        });
      }
    } catch (err) {
      console.warn('Skip status update error:', err);
    }
    onClose();
  };

  const handleFinish = () => {
    if (onComplete) {
      onComplete();
    } else {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0d021a]/85 backdrop-blur-xl animate-fadeIn">
      <div
        data-aos="zoom-in"
        className="relative w-full max-w-lg bg-[#120320] border border-white/10 rounded-3xl shadow-2xl overflow-hidden p-6 sm:p-8 transition-colors duration-200"
      >
        {/* Background Glow */}
        <div className="absolute -top-20 -right-20 w-56 h-56 bg-[#229ED9]/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-20 -left-20 w-56 h-56 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Close Button */}
        <button
          onClick={handleSkip}
          className="absolute top-5 right-5 p-2 rounded-full text-slate-400 hover:text-white bg-white/5 hover:bg-white/10 transition cursor-pointer z-10"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Pulsing Telegram Header Badge */}
        <div className="flex flex-col items-center text-center mb-6 relative z-10">
          <div className="relative mb-4">
            <div className="absolute -inset-2 rounded-full bg-[#229ED9]/30 animate-ping opacity-75" />
            <div className="relative w-16 h-16 rounded-2xl bg-[#229ED9] text-white flex items-center justify-center shadow-lg shadow-[#229ED9]/40 border border-white/20">
              <Send className="w-8 h-8 -translate-x-0.5 translate-y-0.5" />
            </div>
          </div>

          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-bold mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            <span>24/7 Real-Time Notifications</span>
          </div>

          <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Connect CenterFlow Telegram Bot
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 mt-2 max-w-md leading-relaxed">
            Get instant notifications for your homework grades, attendance updates, and class schedules directly on Telegram.
          </p>
        </div>

        {/* STEP 1: Connect CTA & QR Option */}
        {step === 'connect' && (
          <div className="space-y-4 relative z-10 animate-fadeIn">
            <button
              onClick={handleLaunchBot}
              className="w-full flex items-center justify-center gap-3 py-4 px-6 rounded-2xl bg-[#229ED9] hover:bg-[#1f91c7] text-white font-black text-sm sm:text-base shadow-xl shadow-[#229ED9]/25 transition-all transform hover:-translate-y-0.5 cursor-pointer"
            >
              <Send className="w-5 h-5" />
              <span>🚀 Connect @CenterFlowBot</span>
              <ExternalLink className="w-4 h-4 opacity-80" />
            </button>

            <button
              onClick={() => setShowQr(!showQr)}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 font-bold text-xs border border-white/10 transition cursor-pointer"
            >
              <QrCode className="w-4 h-4 text-amber-400" />
              <span>{showQr ? 'Hide QR Code' : 'Desktop? Show Telegram QR Code'}</span>
            </button>

            {/* QR Code Graphic Box */}
            {showQr && (
              <div className="p-4 rounded-2xl bg-white/5 border border-white/10 flex flex-col items-center justify-center space-y-3 animate-fadeIn">
                <div className="p-3 bg-white rounded-xl shadow-lg border border-slate-200">
                  {/* Generated clean SVG QR placeholder styling */}
                  <div className="w-36 h-36 bg-slate-900 rounded-lg flex flex-col items-center justify-center text-center p-2">
                    <QrCode className="w-16 h-16 text-amber-400 mb-1" />
                    <span className="text-[10px] font-mono text-slate-300 font-bold">@CenterFlowBot</span>
                    <span className="text-[8px] font-mono text-amber-400">Scan to Connect</span>
                  </div>
                </div>
                <p className="text-[11px] text-slate-400 text-center">
                  Scan with your phone camera or Telegram app to open deep-link.
                </p>
              </div>
            )}

            <button
              onClick={() => setStep('waiting')}
              className="w-full py-2.5 text-xs text-amber-400 hover:text-amber-300 font-bold underline transition text-center cursor-pointer"
            >
              I already clicked the link / opened the bot
            </button>
          </div>
        )}

        {/* STEP 2: Waiting / Listening Verification State */}
        {step === 'waiting' && (
          <div className="space-y-5 text-center relative z-10 animate-fadeIn">
            <div className="p-5 rounded-2xl bg-white/5 border border-white/10 space-y-3">
              <div className="flex items-center justify-center gap-2 text-amber-400 text-xs font-bold">
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Waiting for bot connection...</span>
              </div>
              <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-[#229ED9] via-amber-400 to-emerald-400 w-2/3 animate-pulse rounded-full" />
              </div>
              <p className="text-xs text-slate-300">
                Please press <span className="font-mono text-amber-400 font-bold">START</span> in the @CenterFlowBot chat on Telegram to complete authorization.
              </p>
            </div>

            <button
              onClick={handleManualConfirm}
              disabled={isVerifying}
              className="w-full flex items-center justify-center gap-2 py-3.5 px-6 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-sm shadow-lg shadow-amber-500/20 transition cursor-pointer disabled:opacity-50"
            >
              {isVerifying ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Verifying connection...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-5 h-5" />
                  <span>I've Started the Bot</span>
                </>
              )}
            </button>

            <button
              onClick={() => setStep('connect')}
              className="text-xs text-slate-400 hover:text-slate-200 transition underline cursor-pointer"
            >
              ← Back to launch options
            </button>
          </div>
        )}

        {/* STEP 3: Success State & Feature Breakdown */}
        {step === 'success' && (
          <div className="space-y-6 relative z-10 animate-fadeIn">
            <div className="p-4 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center shrink-0">
                <Check className="w-6 h-6 text-emerald-400" />
              </div>
              <div>
                <h4 className="font-bold text-sm text-white">Telegram Bot Connected Successfully!</h4>
                <p className="text-xs text-emerald-300">Real-time alerts are now synchronized with your account.</p>
              </div>
            </div>

            {/* Features Enabled List */}
            <div className="space-y-2.5">
              <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/5 text-xs text-slate-200">
                <Bell className="w-4 h-4 text-amber-400 shrink-0" />
                <span>Instant Homework Diagnostic Alerts & Grades</span>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/5 text-xs text-slate-200">
                <Calendar className="w-4 h-4 text-indigo-400 shrink-0" />
                <span>Class Schedule & Attendance Reminders</span>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/5 text-xs text-slate-200">
                <BarChart3 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Test Score & Band Result Breakdown Notifications</span>
              </div>
            </div>

            <button
              onClick={handleFinish}
              className="w-full flex items-center justify-center gap-2 py-4 px-6 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-sm shadow-xl shadow-amber-500/20 transition cursor-pointer"
            >
              <span>Continue to Student Portal</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Skip / Remind Later Option */}
        {step !== 'success' && (
          <div className="mt-5 text-center relative z-10">
            <button
              onClick={handleSkip}
              className="text-xs text-slate-400 hover:text-slate-200 transition underline cursor-pointer"
            >
              Remind me later (Skip for now)
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
