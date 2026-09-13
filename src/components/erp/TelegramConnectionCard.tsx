import React, { useState, useEffect, useCallback } from 'react';
import {
  Send,
  CheckCircle2,
  RefreshCw,
  AlertCircle,
  ExternalLink,
  Bell,
  CreditCard,
  MessageSquare,
  Unlink,
  X,
  Loader2,
  QrCode,
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { useAuth } from '../../context/AuthContext';
import { checkBotStatus, createTelegramLinkSession, BOT_USERNAME, unlinkTelegram } from '../../services/telegram';

interface TelegramConnectionCardProps {
  userUid?: string;
  className?: string;
}

function formatDate(iso?: string | null): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  return `${dd}.${mm}.${d.getFullYear()}`;
}

function formatUsername(raw?: string | null): string | null {
  if (!raw) return null;
  return `@${String(raw).replace(/^@/, '')}`;
}

const BENEFITS: { icon: React.FC<{ className?: string }>; label: string }[] = [
  { icon: Bell, label: "Muhim e'lonlar va bildirishnomalar" },
  { icon: CreditCard, label: "To'lov eslatmalari" },
  { icon: MessageSquare, label: 'Markaz xabarlari' },
];

export const TelegramConnectionCard: React.FC<TelegramConnectionCardProps> = ({ userUid: propUid, className = '' }) => {
  const { currentUser } = useAuth();
  const targetUid = propUid || currentUser?.uid || '';

  const [status, setStatus] = useState<{ isConnected: boolean; telegramUsername?: string | null; chatConnectedAt?: string | null } | null>(null);
  const [loading, setLoading] = useState(true);
  const [checking, setChecking] = useState(false);
  const [busy, setBusy] = useState(false);
  const [pendingLink, setPendingLink] = useState(false);
  const [deepLink, setDeepLink] = useState<string | null>(null);
  const [rateLimited, setRateLimited] = useState(false);
  const [confirmingUnlink, setConfirmingUnlink] = useState(false);
  const [notice, setNotice] = useState<{ tone: 'ok' | 'err'; msg: string } | null>(null);

  const refreshStatus = useCallback(async () => {
    if (!targetUid) {
      setLoading(false);
      return;
    }
    setChecking(true);
    const res = await checkBotStatus(targetUid);
    if (res.isRateLimited) {
      setRateLimited(true);
    } else {
      setRateLimited(false);
      setStatus({
        isConnected: Boolean(res.isConnected),
        telegramUsername: res.telegramUsername || null,
        chatConnectedAt: res.chatConnectedAt || null,
      });
      if (res.isConnected) {
        setPendingLink(false);
        setDeepLink(null);
      }
    }
    setChecking(false);
    setLoading(false);
  }, [targetUid]);

  useEffect(() => {
    refreshStatus();
  }, [refreshStatus]);

  const handleConnect = async () => {
    if (!targetUid || busy) return;
    setBusy(true);
    setNotice(null);
    setRateLimited(false);
    try {
      const { deepLink: link } = await createTelegramLinkSession(targetUid);
      setDeepLink(link);
      window.open(link, '_blank', 'noopener');
      setPendingLink(true);
    } catch (err: any) {
      setNotice({ tone: 'err', msg: err?.message || 'Havola yaratishda xatolik.' });
    } finally {
      setBusy(false);
    }
  };

  const handleUnlink = async () => {
    if (!targetUid || busy) return;
    setBusy(true);
    setNotice(null);
    const res = await unlinkTelegram(targetUid);
    if (res.ok) {
      setStatus({ isConnected: false, telegramUsername: null, chatConnectedAt: null });
      setPendingLink(false);
      setDeepLink(null);
      setConfirmingUnlink(false);
      setNotice({ tone: 'ok', msg: 'Telegram hisobingiz uzildi.' });
    } else {
      setNotice({ tone: 'err', msg: res.error || 'Uzishda xatolik.' });
    }
    setBusy(false);
  };

  if (!targetUid) {
    return (
      <div className={`p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 ${className}`}>
        <p className="text-xs text-slate-500">Telegram ulash uchun avval tizimga kiring.</p>
      </div>
    );
  }

  const connected = Boolean(status?.isConnected);
  const username = formatUsername(status?.telegramUsername);
  const connectedDate = formatDate(status?.chatConnectedAt);

  return (
    <div className={`p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm transition-all ${className}`}>
      {/* Header */}
      <div className="flex items-center gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
        <div className="w-10 h-10 rounded-2xl bg-sky-500/10 text-sky-600 dark:text-sky-400 flex items-center justify-center shrink-0">
          <Send className="w-5 h-5 -translate-x-0.5 translate-y-0.5" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-base font-black text-slate-900 dark:text-white">Telegram</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
            {connected ? 'Akkauntingiz CenterFlow bilan ulangan' : 'CenterFlow hisobingiz bilan bog\'lang'}
          </p>
        </div>
        <button
          onClick={refreshStatus}
          disabled={checking || busy}
          title="Ulanish holatini yangilash"
          className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${checking ? 'animate-spin text-sky-500' : ''}`} />
        </button>
      </div>

      {/* Notice */}
      {notice && (
        <div
          className={`mt-4 p-3 rounded-xl border text-xs font-bold flex items-center gap-2 ${
            notice.tone === 'ok'
              ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400'
              : 'bg-rose-500/10 border-rose-500/30 text-rose-600 dark:text-rose-400'
          }`}
        >
          {notice.tone === 'ok' ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
          <span>{notice.msg}</span>
        </div>
      )}

      {/* Rate limit */}
      {rateLimited && (
        <div className="mt-4 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>Holatni tekshirish orasida biroz kuting va qayta urinib ko\'ring.</span>
        </div>
      )}

      {/* Loading */}
      {loading ? (
        <div className="mt-4 space-y-3 animate-pulse">
          <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-3/4" />
          <div className="h-3 bg-slate-200 dark:bg-slate-800 rounded w-1/2" />
          <div className="h-10 bg-slate-200 dark:bg-slate-800 rounded-xl w-full" />
        </div>
      ) : (
        <div className="mt-4 space-y-4">
          {/* Benefits */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
            {BENEFITS.map((b) => {
              const Icon = b.icon;
              return (
                <div
                  key={b.label}
                  className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 flex items-center gap-2 text-slate-700 dark:text-slate-300"
                >
                  <Icon className={`w-4 h-4 shrink-0 ${connected ? 'text-emerald-500' : 'text-sky-500'}`} />
                  <span>{b.label}</span>
                </div>
              );
            })}
          </div>

          {connected ? (
            /* Connected state — spec §16/21: Telegram ulangan ✓ */
            <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/50">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <div className="min-w-0">
                  <span className="text-sm font-bold text-emerald-900 dark:text-emerald-200 block truncate">
                    ✓ Telegram ulangan{username ? ` — ${username}` : ''}
                  </span>
                  {connectedDate && (
                    <span className="text-xs text-emerald-700 dark:text-emerald-400">Ulangan sana: {connectedDate}</span>
                  )}
                </div>
              </div>
            </div>
          ) : (
            /* Disconnected state — spec §16/21: Telegram bilan bog'lash */
            <div className="p-4 rounded-2xl bg-sky-50 dark:bg-sky-950/20 border border-sky-100 dark:border-sky-900/60 space-y-3">
              <div>
                <p className="text-sm font-black text-slate-900 dark:text-white">Telegram bilan bog‘lash</p>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed mt-1">
                  Telegram orqali:
                </p>
                <ul className="text-xs text-slate-600 dark:text-slate-300 list-disc list-inside mt-1 space-y-0.5">
                  <li>dars eslatmalarini</li>
                  <li>davomat xabarlarini</li>
                  <li>to‘lov eslatmalarini</li>
                  <li>markaz e’lonlarini</li>
                </ul>
                <p className="text-xs text-slate-600 dark:text-slate-300 mt-1">olishingiz mumkin.</p>
              </div>

              <button
                onClick={handleConnect}
                disabled={busy}
                className="w-full bg-sky-600 hover:bg-sky-500 disabled:opacity-60 text-white px-4 py-2.5 rounded-xl inline-flex items-center justify-center gap-2 text-xs font-bold shadow-sm transition cursor-pointer"
              >
                {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                <span>Telegramda ulash</span>
                <ExternalLink className="w-3.5 h-3.5 opacity-80" />
              </button>

              {deepLink && pendingLink && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-[11px] font-bold text-slate-500 dark:text-slate-400">
                    <div className="flex-1 h-px bg-slate-200 dark:bg-slate-700" />
                    <span>yoki</span>
                    <div className="flex-1 h-px bg-slate-200 dark:bg-slate-700" />
                  </div>
                  <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-sky-200 dark:border-sky-900 flex flex-col items-center gap-2">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 dark:text-slate-200">
                      <QrCode className="w-4 h-4 text-sky-600" />
                      <span>QR kodni skanerlash</span>
                    </div>
                    <div className="p-2 bg-white rounded-xl border border-slate-200">
                      <QRCodeSVG value={deepLink} size={160} level="M" />
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 text-center leading-relaxed">
                      Telefon kamerasi orqali QR kodni skanerlang — bot ochiladi.
                    </p>
                    <button
                      onClick={() => window.open(deepLink, '_blank', 'noopener')}
                      className="text-[11px] font-bold text-sky-600 dark:text-sky-400 hover:underline"
                    >
                      Havolani ochish: @{BOT_USERNAME}
                    </button>
                  </div>
                </div>
              )}

              {pendingLink && (
                <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-sky-200 dark:border-sky-900 text-xs space-y-2">
                  <p className="text-slate-700 dark:text-slate-300 font-semibold flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-sky-500 shrink-0 mt-0.5" />
                    <span>
                      Telegram ochildi. Botda <span className="font-black text-sky-600 dark:text-sky-400">Start</span>{' '}
                      tugmasini bosing va qaytib kelgach, holatni yangilang.
                    </span>
                  </p>
                  <button
                    onClick={refreshStatus}
                    disabled={checking}
                    className="px-3 py-1.5 rounded-lg bg-sky-500/10 hover:bg-sky-500/20 text-sky-700 dark:text-sky-300 font-bold flex items-center gap-1.5 transition cursor-pointer disabled:opacity-50"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${checking ? 'animate-spin' : ''}`} />
                    <span>Holatni tekshirish</span>
                  </button>
                  <p className="text-[10px] text-slate-400">
                    Bot: <span className="font-mono text-sky-600 dark:text-sky-400">@{BOT_USERNAME}</span>
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Unlink */}
          {connected && !confirmingUnlink && (
            <button
              onClick={() => setConfirmingUnlink(true)}
              disabled={busy}
              className="w-full px-4 py-2.5 rounded-xl border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs font-bold flex items-center justify-center gap-2 hover:bg-rose-500/10 transition cursor-pointer disabled:opacity-50"
            >
              <Unlink className="w-3.5 h-3.5" />
              <span>Telegram'ni uzish</span>
            </button>
          )}

          {/* Unlink confirmation */}
          {confirmingUnlink && (
            <div className="p-4 rounded-2xl bg-rose-500/5 border border-rose-500/30 space-y-3">
              <p className="text-xs font-bold text-rose-700 dark:text-rose-300 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>Telegram'ni uzish?</span>
              </p>
              <p className="text-xs text-slate-600 dark:text-slate-300">
                Telegram bildirishnomalarini olish to'xtatiladi va siz qabul qiluvchilar ro'yxatidan chiqasiz.
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setConfirmingUnlink(false)}
                  disabled={busy}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer disabled:opacity-50"
                >
                  Bekor qilish
                </button>
                <button
                  onClick={handleUnlink}
                  disabled={busy}
                  className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold flex items-center gap-1.5 transition cursor-pointer disabled:opacity-50"
                >
                  {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Unlink className="w-3.5 h-3.5" />}
                  <span>Uzish</span>
                </button>
                <button
                  onClick={() => setConfirmingUnlink(false)}
                  className="ml-auto p-1.5 text-slate-400 hover:text-slate-600 cursor-pointer"
                  aria-label="Yopish"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};