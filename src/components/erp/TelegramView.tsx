import React, { useState, useEffect, useCallback } from 'react';
import {
  CheckCircle2,
  AlertCircle,
  MessageSquare,
  ShieldCheck,
  Users,
  Settings,
  Key,
  RefreshCw,
  Globe,
  Inbox,
} from 'lucide-react';
import { telegramStatsService, TelegramStats } from '../../services/repository';
import {
  getTelegramStatus,
  setupTelegramWebhook,
  TelegramServerStatus,
} from '../../services/telegram';
import { BroadcastStudio, BroadcastHistory } from './BroadcastStudio';

interface StatusMessage {
  text: string;
  ok: boolean;
}

export const TelegramView: React.FC = () => {
  const [status, setStatus] = useState<TelegramServerStatus | null>(null);
  const [stats, setStats] = useState<TelegramStats | null>(null);
  const [isSettingWebhook, setIsSettingWebhook] = useState(false);
  const [statusMsg, setStatusMsg] = useState<StatusMessage | null>(null);

  const refresh = useCallback(async () => {
    const [statusData, statsData] = await Promise.all([
      getTelegramStatus(),
      telegramStatsService.getStats().catch(() => null),
    ]);
    setStatus(statusData);
    setStats(statsData);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const flash = (text: string, ok: boolean) => {
    setStatusMsg({ text, ok });
    setTimeout(() => setStatusMsg(null), 5000);
  };

const handleSetupWebhook = async (force = false) => {
    setIsSettingWebhook(true);
    try {
      const result = await setupTelegramWebhook({ force, dropPendingUpdates: true });
      if (result.ok) {
        if (result.alreadyConfigured) {
          flash(`Webhook allaqachon to'g'ri sozlangan: ${result.url || ''}`, true);
        } else {
          flash(`Webhook muvaffaqiyatli o'rnatildi va tasdiqlandi: ${result.url || ''}`, true);
        }
      } else {
        flash(`Webhook o'rnatilmadi: ${result.error || result.description || 'Noma\'lum xatolik.'}`, false);
      }
      refresh();
    } finally {
      setIsSettingWebhook(false);
    }
  };

  const botConnected = Boolean(status?.connected && status?.bot);
  const webhookRegistered = Boolean(status?.webhook?.url);
  const isUrlMatched = Boolean(status?.webhook?.isUrlMatched);
  const hasDeliveryError = Boolean(status?.webhook?.lastError);
  const webhookReady = webhookRegistered && isUrlMatched && !hasDeliveryError;

  return (
    <div className="space-y-6">
      {/* Top Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            Telegram Bot & Avtomatlashtirish
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Telegram orqali kelgan murojaatlar to'g'ridan-to'g'ri CRM da qayd qilinadi: yangi lead'lar va savollar.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => handleSetupWebhook(false)}
            disabled={isSettingWebhook}
            className="px-4 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-400 disabled:opacity-50 text-white font-bold text-xs shadow-md shadow-sky-500/20 flex items-center gap-1.5 transition cursor-pointer"
          >
            <Globe className="w-3.5 h-3.5" />
            <span>{isSettingWebhook ? 'O\'rnatilmoqda...' : 'Webhookni O\'rnatish'}</span>
          </button>
          <button
            onClick={() => handleSetupWebhook(true)}
            disabled={isSettingWebhook}
            title="Navbatni tozalab yangidan ro'yxatdan o'tkazish"
            className="px-3 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 disabled:opacity-50 text-slate-700 dark:text-slate-200 font-bold text-xs flex items-center gap-1 transition cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Qayta sozlash (Force)</span>
          </button>
        </div>
      </div>

      {statusMsg && (
        <div className={`p-4 rounded-2xl border text-xs font-bold flex items-center gap-2 ${
          statusMsg.ok
            ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400'
            : 'bg-rose-500/10 border-rose-500/20 text-rose-600 dark:text-rose-400'
        }`}>
          {statusMsg.ok ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
          <span>{statusMsg.text}</span>
        </div>
      )}

      {/* Delivery Error Alert Box if any */}
      {hasDeliveryError && (
        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-700 dark:text-rose-300 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-start gap-2.5">
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-sm">Telegram yetkazish xatosi (getWebhookInfo)</p>
              <p className="font-mono text-xs mt-0.5 break-all">{status?.webhook?.lastError}</p>
              {status?.webhook?.lastErrorDate && (
                <p className="text-[11px] text-rose-600/80 dark:text-rose-400/80 mt-1">
                  Vaqti: {new Date(status.webhook.lastErrorDate * 1000).toLocaleString('uz-UZ')}
                </p>
              )}
            </div>
          </div>
          <button
            onClick={() => handleSetupWebhook(true)}
            disabled={isSettingWebhook}
            className="px-3.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shrink-0 self-start sm:self-center transition cursor-pointer"
          >
            Xatoni tozalab qayta ulash
          </button>
        </div>
      )}

      {/* Bot Status Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-4">
          <div className={`w-12 h-12 rounded-2xl ${botConnected ? 'bg-emerald-500/10 text-emerald-500' : 'bg-slate-500/10 text-slate-400'} flex items-center justify-center shrink-0`}>
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div className="min-w-0">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Bot Holati
            </span>
            <div className={`text-base font-black mt-0.5 flex items-center gap-1.5 ${botConnected ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-500 dark:text-slate-400'}`}>
              <span className={`w-2 h-2 rounded-full ${botConnected ? 'bg-emerald-500' : 'bg-slate-400'}`} />
              <span>
                {status === null
                  ? 'Tekshirilmoqda...'
                  : botConnected
                    ? 'Ulangan'
                    : status.configured.token
                      ? 'Aloqa yo\'q'
                      : 'Sozlanmagan'}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5 truncate">
              {status?.bot?.username
                ? `@${status.bot.username} (${status.bot.firstName})`
                : status?.configured?.token
                  ? 'Telegram API javob bermadi'
                  : 'Bot token kiritilmagan'}
            </p>
          </div>
        </div>

        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-4">
          <div className={`w-12 h-12 rounded-2xl ${
            webhookReady
              ? 'bg-sky-500/10 text-sky-500'
              : hasDeliveryError
                ? 'bg-rose-500/10 text-rose-500'
                : 'bg-amber-500/10 text-amber-500'
          } flex items-center justify-center shrink-0`}>
            <Globe className="w-6 h-6" />
          </div>
          <div className="min-w-0">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Webhook Holati
            </span>
            <div className={`text-base font-black mt-0.5 flex items-center gap-1.5 ${
              webhookReady
                ? 'text-sky-600 dark:text-sky-400'
                : hasDeliveryError
                  ? 'text-rose-600 dark:text-rose-400'
                  : 'text-amber-600 dark:text-amber-400'
            }`}>
              <span className={`w-2 h-2 rounded-full ${
                webhookReady
                  ? 'bg-sky-500'
                  : hasDeliveryError
                    ? 'bg-rose-500'
                    : 'bg-amber-500'
              }`} />
              <span>
                {webhookReady
                  ? 'Faol & Tasdiqlangan'
                  : hasDeliveryError
                    ? 'Yetkazishda xato'
                    : webhookRegistered
                      ? 'URL mos emas'
                      : 'O\'rnatilmagan'}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5 truncate">
              {status?.webhook?.pendingUpdateCount !== undefined && status.webhook.pendingUpdateCount > 0
                ? `${status.webhook.pendingUpdateCount} ta kutilayotgan xabar`
                : webhookRegistered
                  ? '0 ta kutilayotgan yangilanish'
                  : 'Rejim: ' + (status?.mode || 'webhook')}
            </p>
          </div>
        </div>

        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center shrink-0">
            <Users className="w-6 h-6" />
          </div>
          <div className="min-w-0">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Telegram CRM Ma'lumotlari
            </span>
            <div className="text-2xl font-black text-slate-900 dark:text-white mt-0.5">
              {stats ? stats.totalLeads + stats.totalQuestions : '—'}{' '}
              <span className="text-xs font-normal text-slate-400">ta murojaat</span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5 font-semibold">
              {stats ? `${stats.todayLeads + stats.todayQuestions} bugun` : 'Ma\'lumot mavjud emas'}
            </p>
          </div>
        </div>
      </div>

      {/* Broadcast Tools & Server Config */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Professional Broadcast Studio */}
        <div className="lg:col-span-7">
          <BroadcastStudio />
        </div>

        {/* Right: Server Config (read-only, secrets stay server-side) */}
        <div className="lg:col-span-5 p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
              <Settings className="w-4 h-4 text-sky-500" />
              <span>Server Sozlamalari</span>
            </h3>
            <button
              onClick={refresh}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
              title="Yangilash"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-2.5 text-xs">
            <div className="flex items-center justify-between gap-2 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800">
              <span className="text-slate-500 font-semibold flex items-center gap-2">
                <Key className="w-3.5 h-3.5" /> Bot token & API aloqasi
              </span>
              <span className={`font-mono font-bold ${status?.apiReachable ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-500'}`}>
                {status?.apiReachable
                  ? status?.bot?.username
                    ? `@${status.bot.username} (ID: ${status.bot.id})`
                    : 'API ulangan'
                  : status?.configured?.token
                    ? 'Telegram API javob bermadi'
                    : 'Token sozlanmagan'}
              </span>
            </div>

            <div className="flex items-center justify-between gap-2 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800">
              <span className="text-slate-500 font-semibold flex items-center gap-2">
                <ShieldCheck className="w-3.5 h-3.5" /> Webhook secret
              </span>
              <span className={`font-mono font-bold ${status?.configured?.webhookSecret ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-500'}`}>
                {status?.configured?.webhookSecret ? 'O\'rnatilgan (xavfsiz)' : 'Tavsiya etiladi'}
              </span>
            </div>

            <div className="flex items-center justify-between gap-2 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800">
              <span className="text-slate-500 font-semibold flex items-center gap-2">
                <Globe className="w-3.5 h-3.5" /> Telegramda saqlangan URL
              </span>
              <div className="text-right max-w-[60%]">
                <span className={`font-mono font-bold break-all block ${
                  status?.webhook?.url
                    ? status.webhook.isUrlMatched
                      ? 'text-emerald-600 dark:text-emerald-400'
                      : 'text-amber-600 dark:text-amber-400'
                    : 'text-rose-500'
                }`}>
                  {status?.webhook?.url || "Bo'sh (ro'yxatdan o'tmagan)"}
                </span>
                {status?.webhook?.url && (
                  <span className={`text-[10px] font-bold uppercase tracking-wider ${
                    status.webhook.isUrlMatched ? 'text-emerald-500' : 'text-amber-500'
                  }`}>
                    {status.webhook.isUrlMatched ? "✓ Kutilgan URL bilan mos" : "⚠ Kutilgan URL bilan mos emas"}
                  </span>
                )}
              </div>
            </div>

            <div className="flex items-center justify-between gap-2 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800">
              <span className="text-slate-500 font-semibold block">Kutilayotgan Webhook URL</span>
              <span className="font-mono text-slate-700 dark:text-slate-300 break-all text-right">
                {status?.configured?.expectedWebhookUrl || `${status?.configured?.publicUrl || ''}/api/telegram/webhook`}
              </span>
            </div>

            <div className="flex items-center justify-between gap-2 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800">
              <span className="text-slate-500 font-semibold block">Navbatdagi yangilanishlar (pending)</span>
              <span className={`font-mono font-bold ${
                (status?.webhook?.pendingUpdateCount ?? 0) > 0 ? 'text-amber-500' : 'text-slate-700 dark:text-slate-300'
              }`}>
                {status?.webhook?.pendingUpdateCount ?? 0} ta
              </span>
            </div>

            {status?.webhook?.lastError && (
              <div className="p-3 rounded-2xl bg-rose-500/10 border border-rose-500/30">
                <span className="text-rose-600 dark:text-rose-400 font-bold block mb-1">
                  Telegram yetkazish xatosi:
                </span>
                <span className="font-mono text-rose-700 dark:text-rose-300 text-[11px] block break-all">
                  {status.webhook.lastError}
                </span>
                {status.webhook.lastErrorDate && (
                  <span className="text-slate-500 text-[10px] block mt-1">
                    Vaqti: {new Date(status.webhook.lastErrorDate * 1000).toLocaleString('uz-UZ')}
                  </span>
                )}
              </div>
            )}

            <div className="flex items-center justify-between gap-2 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800">
              <span className="text-slate-500 font-semibold flex items-center gap-2">
                <Inbox className="w-3.5 h-3.5" /> Firestore (Admin)
              </span>
              <span className={`font-mono font-bold ${status?.configured?.firestore ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-500'}`}>
                {status ? (status.configured.firestore ? 'Ishlayapti' : 'Ishlamayapti') : 'Tekshirilmoqda...'}
              </span>
            </div>

            {!status?.configured?.firestore && status?.configured?.firestoreErrorCode && (
              <div className="p-3 rounded-2xl bg-rose-500/5 border border-rose-500/20">
                <span className="text-rose-500 font-mono text-[11px] block break-all">
                  {status.configured.firestoreErrorCode}
                </span>
                <span className="text-slate-500 text-[11px] block mt-1 break-words">
                  {status.configured.firestoreError}
                </span>
                <div className="text-[11px] mt-2 text-slate-500 leading-relaxed">
                  Yechim: server ishlab turgan service account'ga{' '}
                  <code className="text-slate-700 dark:text-slate-300 font-mono">roles/datastore.user</code>{' '}
                  huquqini bering yoki{' '}
                  <code className="text-slate-700 dark:text-slate-300 font-mono">FIREBASE_SERVICE_ACCOUNT_JSON</code>{' '}
                  maxfiy kalitini server muhitiga sozlang.
                </div>
              </div>
            )}

            <div className="flex items-center justify-between gap-2 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800">
              <span className="text-slate-500 font-semibold flex items-center gap-2">
                <Globe className="w-3.5 h-3.5" /> Firestore loyihasi (Admin)
              </span>
              <span className="font-mono font-bold text-slate-700 dark:text-slate-300">
                {status?.configured?.firestoreProjectId || '—'}
              </span>
            </div>

            {status?.configured?.runtimeServiceAccount && (
              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800">
                <span className="text-slate-500 font-semibold block mb-1">Cloud Run service account</span>
                <span className="font-mono text-slate-700 dark:text-slate-300 break-all">
                  {status.configured.runtimeServiceAccount}
                </span>
              </div>
            )}
          </div>

          <p className="text-[11px] text-slate-400 leading-relaxed">
            Token va xavfsizlik kalitlari faqat server muhitida saqlanadi — brauzerga hech qachon ular ko'rinmaydi.
            BotFather va Cloud Run muhit sozlamalarini administrator boshqaradi.
          </p>
        </div>
      </div>

      {/* Broadcast History */}
      <BroadcastHistory />

      {/* Recent Telegram CRM Activity */}
      <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
        <h3 className="text-base font-black text-slate-900 dark:text-white mb-4">
          Telegram Orqali Kelgan Murojaatlar
        </h3>

        <div className="space-y-2.5">
          {stats && stats.recent.length === 0 && (
            <div className="py-8 text-center text-xs text-slate-400">
              Hozircha telegram orqali murojaat qayd etilmagan. Botga yozgan foydalanuvchilar CRM'ga avtomatik qo'shiladi.
            </div>
          )}
          {stats?.recent.map((item) => (
            <div
              key={item.id}
              className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3 text-xs"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className={`w-8 h-8 rounded-xl shrink-0 flex items-center justify-center ${
                  item.kind === 'lead' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-sky-500/10 text-sky-500'
                }`}>
                  {item.kind === 'lead' ? <Users className="w-4 h-4" /> : <MessageSquare className="w-4 h-4" />}
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-slate-900 dark:text-white break-words">
                    {item.name}
                    <span className="font-normal text-slate-400"> — {item.course}</span>
                  </p>
                  <span className="text-[11px] text-slate-400 font-mono block">
                    {item.phone}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <span className="text-[11px] text-slate-400 font-mono">
                  {item.createdAt ? new Date(item.createdAt).toLocaleString('uz-UZ', { dateStyle: 'short', timeStyle: 'short' }) : ''}
                </span>
                <span className={`px-2.5 py-1 rounded-full font-bold text-[10px] uppercase ${
                  item.kind === 'lead'
                    ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                    : 'bg-sky-500/10 text-sky-600 dark:text-sky-400'
                }`}>
                  {item.kind === 'lead' ? 'Ariza' : 'Savol'}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};