import React, { useState, useEffect, useCallback } from 'react';
import {
  Send,
  CheckCircle2,
  AlertCircle,
  Bell,
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
  sendGlobalBroadcast,
  TelegramServerStatus,
  BroadcastResponse,
} from '../../services/telegram';

interface StatusMessage {
  text: string;
  ok: boolean;
}

export const TelegramView: React.FC = () => {
  const [status, setStatus] = useState<TelegramServerStatus | null>(null);
  const [stats, setStats] = useState<TelegramStats | null>(null);
  const [announcementText, setAnnouncementText] = useState('');
  const [isBroadcasting, setIsBroadcasting] = useState(false);
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

  const handleSetupWebhook = async () => {
    setIsSettingWebhook(true);
    try {
      const result = await setupTelegramWebhook();
      if (result.ok) {
        flash(`Webhook o'rnatildi: ${result.url || ''}`, true);
      } else {
        flash(`Webhook o'rnatilmadi: ${result.error || result.description || 'Noma\'lum xatolik.'}`, false);
      }
      refresh();
    } finally {
      setIsSettingWebhook(false);
    }
  };

  const handleSendBroadcast = async (type: 'all' | 'debt') => {
    if (type === 'all' && !announcementText.trim()) return;
    setIsBroadcasting(true);
    try {
      const message = type === 'debt'
        ? '💳 Hurmatli ota-onalar! Iltimos, markazdagi o\'quv to\'lovi qarzini muddatida so\'ndiring. Batafsil ma\'lumot uchun mas\'ul xodimlarimiz bilan bog\'laning. — RENESANS'
        : `📢 ${announcementText.trim()}`;
      const result: BroadcastResponse = await sendGlobalBroadcast(message);
      if (result.success) {
        flash(`Xabar ${result.sentCount}/${result.totalConnected} ta ulangan chatga yetkazildi.`, true);
      } else {
        flash(
          result.isRateLimited
            ? 'Juda tez-tez yuborish — biroz kuting (rate limit).'
            : `Xabar yetkazilmadi: ${result.error || 'Telegram orqali ulangan foydalanuvchilar topilmadi.'}`,
          false
        );
      }
      if (type === 'all') setAnnouncementText('');
    } finally {
      setIsBroadcasting(false);
    }
  };

  const botConnected = Boolean(status?.connected);
  const webhookReady =
    Boolean(status?.bot) && Boolean(status?.webhook?.url) && !status?.webhook?.lastError;

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

        <button
          onClick={handleSetupWebhook}
          disabled={isSettingWebhook}
          className="px-4 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-400 disabled:opacity-50 text-white font-bold text-xs shadow-md shadow-sky-500/20 flex items-center gap-1.5 transition cursor-pointer"
        >
          <Globe className="w-3.5 h-3.5" />
          <span>{isSettingWebhook ? 'O\'rnatilmoqda...' : 'Webhookni O\'rnatish'}</span>
        </button>
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
              <span>{status === null ? 'Tekshirilmoqda...' : botConnected ? 'Ulangan' : 'Sozlanmagan'}</span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5 truncate">
              {status?.bot?.username ? `@${status.bot.username}` : 'Bot token serverda sozlanmagan'}
            </p>
          </div>
        </div>

        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-4">
          <div className={`w-12 h-12 rounded-2xl ${webhookReady ? 'bg-sky-500/10 text-sky-500' : 'bg-amber-500/10 text-amber-500'} flex items-center justify-center shrink-0`}>
            <Globe className="w-6 h-6" />
          </div>
          <div className="min-w-0">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Webhook Holati
            </span>
            <div className={`text-base font-black mt-0.5 flex items-center gap-1.5 ${webhookReady ? 'text-sky-600 dark:text-sky-400' : 'text-amber-600 dark:text-amber-400'}`}>
              <span className={`w-2 h-2 rounded-full ${webhookReady ? 'bg-sky-500' : 'bg-amber-500'}`} />
              <span>{webhookReady ? 'Faol' : 'O\'rnatilmagan'}</span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5 truncate">
              {status?.webhook?.url
                ? status.webhook.url.replace(/^https:\/\//, '')
                : status?.configured?.token && !status?.configured?.webhookSecret
                  ? 'Webhook secret sozlanmagan'
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
        {/* Left: Broadcast Form */}
        <div className="lg:col-span-6 p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-amber-500" />
            <span>Ommaviy Xabarnoma Tarqatish</span>
          </h3>
          <p className="text-xs text-slate-500">
            Telegram orqali markaz botiga ulangan barcha foydalanuvchilarga dars jadvali o'zgarishi, DTM sinovlari yoki bayram tabriknomasini yuboring.
          </p>

          <textarea
            rows={4}
            value={announcementText}
            onChange={(e) => setAnnouncementText(e.target.value)}
            placeholder="Hurmatli o'quvchilar va ota-onalar, ertaga soat 09:00 da navbatdagi DTM diagnostik imtihoni..."
            className="w-full px-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
          />

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button
              onClick={() => handleSendBroadcast('all')}
              disabled={isBroadcasting || !announcementText.trim()}
              className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 font-bold text-xs shadow-md shadow-amber-500/20 flex items-center gap-2 cursor-pointer transition"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Ulangan Barchaga Yuborish</span>
            </button>

            <button
              onClick={() => handleSendBroadcast('debt')}
              disabled={isBroadcasting}
              className="px-4 py-2.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 font-bold text-xs flex items-center gap-1.5 transition cursor-pointer border border-rose-500/20"
            >
              <Bell className="w-3.5 h-3.5" />
              <span>Qarzdorlik Eslatmasi Yuborish</span>
            </button>
          </div>
        </div>

        {/* Right: Server Config (read-only, secrets stay server-side) */}
        <div className="lg:col-span-6 p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
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
                <Key className="w-3.5 h-3.5" /> Bot token
              </span>
              <span className={`font-mono font-bold ${status?.configured?.token ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-500'}`}>
                {status?.configured?.token ? 'Serverda o\'rnatilgan' : 'Sozlanmagan'}
              </span>
            </div>

            <div className="flex items-center justify-between gap-2 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800">
              <span className="text-slate-500 font-semibold flex items-center gap-2">
                <ShieldCheck className="w-3.5 h-3.5" /> Webhook secret
              </span>
              <span className={`font-mono font-bold ${status?.configured?.webhookSecret ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-500'}`}>
                {status?.configured?.webhookSecret ? 'O\'rnatilgan' : 'Tavsiya etiladi'}
              </span>
            </div>

            <div className="flex items-center justify-between gap-2 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800">
              <span className="text-slate-500 font-semibold flex items-center gap-2">
                <Inbox className="w-3.5 h-3.5" /> Firestore (Admin)
              </span>
              <span className={`font-mono font-bold ${status?.configured?.firestore ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-500'}`}>
                {status?.configured?.firestore ? 'Mavjud' : 'Mavjud emas'}
              </span>
            </div>

            <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800">
              <span className="text-slate-500 font-semibold block mb-1">Webhook URL</span>
              <span className="font-mono text-slate-700 dark:text-slate-300 break-all">
                {status?.webhook?.url || status?.configured?.publicUrl
                  ? `${status.configured.publicUrl}/api/telegram/webhook`
                  : 'PUBLIC_URL sozlanmagan'}
              </span>
              {status?.webhook?.lastError && (
                <span className="text-rose-500 font-semibold block mt-1">
                  So'nggi xato: {status.webhook.lastError}
                </span>
              )}
            </div>
          </div>

          <p className="text-[11px] text-slate-400 leading-relaxed">
            Token va xavfsizlik kalitlari faqat server muhitida saqlanadi — brauzerga hech qachon ular ko'rinmaydi.
            BotFather va Cloud Run muhit sozlamalarini administrator boshqaradi.
          </p>
        </div>
      </div>

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