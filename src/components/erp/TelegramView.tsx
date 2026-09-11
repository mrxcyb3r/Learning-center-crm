import React, { useState, useEffect } from 'react';
import {
  Send,
  CheckCircle2,
  AlertCircle,
  Bell,
  MessageSquare,
  ShieldCheck,
  Users,
  Clock,
  Settings,
  Key,
  Smartphone,
  CreditCard,
} from 'lucide-react';
import { telegramService, studentsService, leadsService } from '../../services/repository';
import { TelegramAlertLog, StudentRecord, LeadRecord } from '../../types/crm';

export const TelegramView: React.FC = () => {
  const [history, setHistory] = useState<TelegramAlertLog[]>([]);
  const [students, setStudents] = useState<StudentRecord[]>([]);
  const [announcementText, setAnnouncementText] = useState('');
  const [isBroadcasting, setIsBroadcasting] = useState(false);
  const [broadcastSuccess, setBroadcastSuccess] = useState<{ text: string; ok: boolean } | null>(null);

  // Bot Config in localStorage (no fake defaults)
  const [botToken, setBotToken] = useState(() => {
    const stored = localStorage.getItem('tg_bot_token') || '';
    return stored.includes('example-token') || stored.startsWith('789123456') ? '' : stored;
  });
  const [adminChatId, setAdminChatId] = useState(() => {
    const stored = localStorage.getItem('tg_admin_chat_id') || '';
    return stored === '123456789' ? '' : stored;
  });
  const [botHandle, setBotHandle] = useState(() => {
    const stored = localStorage.getItem('tg_bot_handle') || '';
    return stored === '@renessans_lc_bot' ? '' : stored;
  });
  const [isConfigSaved, setIsConfigSaved] = useState(false);

  const refresh = async () => {
    const [studentsData, historyData] = await Promise.all([
      studentsService.getAllStudents(),
      telegramService.getTelegramLogs()
    ]);
    setStudents(studentsData as unknown as StudentRecord[]);
    setHistory(historyData);
  };

  useEffect(() => {
    refresh();
  }, []);

  const saveBotConfig = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem('tg_bot_token', botToken.trim());
    localStorage.setItem('tg_admin_chat_id', adminChatId.trim());
    localStorage.setItem('tg_bot_handle', botHandle.trim());
    setIsConfigSaved(true);
    setTimeout(() => setIsConfigSaved(false), 3000);
  };

  const [debts, setDebts] = useState<LeadRecord[]>([]);
  const [unpaidStudents, setUnpaidStudents] = useState<StudentRecord[]>([]);

  useEffect(() => {
    const loadDebts = async () => {
      const debtsData = await leadsService.getAllLeads();
      setDebts(debtsData);
      const unpaid = students.filter((s) => (s.debtAmount && s.debtAmount > 0) || s.paymentStatus === 'Overdue' || s.paymentStatus === 'Due');
      setUnpaidStudents(unpaid);
    };
    loadDebts();
  }, [students]);

  const botConfigured = botToken.trim() !== '';
  const sentCount = history.filter((h) => h.status === 'Sent').length;
  const failedCount = history.filter((h) => h.status === 'Failed').length;

  const handleSendBroadcast = async (type: 'all' | 'debt') => {
    setIsBroadcasting(true);
    try {
      const msgText = type === 'debt'
        ? `💳 To'lov eslatmasi: ${unpaidStudents.length} ta o'quvchi va ota-onaga qarzdorlik bo'yicha ogohlantirish yuborildi.`
        : `📢 E'lon (${students.length} o'quvchiga): ${announcementText}`;

      const result = await telegramService.sendTelegramMessage(msgText);
      refresh();
      setBroadcastSuccess(
        result.status === 'Sent'
          ? { text: `Xabarnoma muvaffaqiyatli jo'natildi!`, ok: true }
          : { text: `Xabar jo'natilmadi: ${result.error || 'Telegram mavjud emas'}`, ok: false }
      );
      if (type === 'all') setAnnouncementText('');
    } finally {
      setIsBroadcasting(false);
      setTimeout(() => setBroadcastSuccess(null), 5000);
    }
  };

const handleSendTestNotification = async () => {
    const result = await telegramService.sendLeadNotification(
      'test-' + Date.now(),
      'Sinov Murojaatchisi (Test)',
      '+998 90 862 22 26',
      'DTM & Milliy Sertifikat'
    );
    refresh();
    setBroadcastSuccess(
      result.status === 'Sent'
        ? { text: `Test xabari muvaffaqiyatli jo'natildi!`, ok: true }
        : { text: `Test xabari jo'natilmadi: ${result.error || 'Telegram mavjud emas'}`, ok: false }
    );
    setTimeout(() => setBroadcastSuccess(null), 5000);
  };

  return (
    <div className="space-y-6">
      {/* Top Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            Telegram Bot & Avtomatlashtirish
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Saytdan yangi arizalar kelganda zudlik bilan xabar berish, qarzdorlik eslatmalari va ota-onalar kanali.
          </p>
        </div>

        <button
          onClick={handleSendTestNotification}
          className="px-4 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-white font-bold text-xs shadow-md shadow-sky-500/20 flex items-center gap-1.5 transition cursor-pointer"
        >
          <Send className="w-3.5 h-3.5" />
          <span>Sinov Xabarini Yuborish</span>
        </button>
      </div>

      {broadcastSuccess && (
        <div className={`p-4 rounded-2xl border text-xs font-bold flex items-center gap-2 ${
          broadcastSuccess.ok
            ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400'
            : 'bg-rose-500/10 border-rose-500/20 text-rose-600 dark:text-rose-400'
        }`}>
          {broadcastSuccess.ok ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
          <span>{broadcastSuccess.text}</span>
        </div>
      )}

      {/* Bot Status Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-4">
          <div className={`w-12 h-12 rounded-2xl ${botConfigured ? 'bg-emerald-500/10 text-emerald-500' : 'bg-slate-500/10 text-slate-400'} flex items-center justify-center shrink-0`}>
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Bot Holati
            </span>
            <div className={`text-base font-black mt-0.5 flex items-center gap-1.5 ${botConfigured ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-500 dark:text-slate-400'}`}>
              <span className={`w-2 h-2 rounded-full ${botConfigured ? 'bg-emerald-500' : 'bg-slate-400'}`} />
              <span>{botConfigured ? 'Sozlangan' : 'Sozlanmagan'}</span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              {botConfigured ? 'Token saqlangan — yuborish natijasi haqiqiy tekshiriladi' : 'Bot token kiritilgach ishga tushadi'}
            </p>
          </div>
        </div>

        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-sky-500/10 text-sky-500 flex items-center justify-center shrink-0">
            <Send className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Biriktirilgan Bot
            </span>
            <div className="text-base font-black text-slate-900 dark:text-white mt-0.5 font-mono">
              {botHandle.trim() || 'Sozlanmagan'}
            </div>
            <p className="text-xs text-slate-500 mt-0.5">Direktor & Administrator ogohlantiruvchisi</p>
          </div>
        </div>

        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center shrink-0">
            <Bell className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Yuborilgan Xabarnomalar
            </span>
            <div className="text-2xl font-black text-slate-900 dark:text-white mt-0.5">
              {history.length} <span className="text-xs font-normal text-slate-400">ta ulanish</span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5 font-semibold">
              {sentCount} yuborildi
              {failedCount > 0 && <span className="text-rose-500"> • {failedCount} muvaffaqiyatsiz</span>}
            </p>
          </div>
        </div>
      </div>

      {/* Broadcast Tools & Settings */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Broadcast Form */}
        <div className="lg:col-span-6 p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-amber-500" />
            <span>Ommaviy Xabarnoma Tarqatish</span>
          </h3>
          <p className="text-xs text-slate-500">
            Barcha faol o'quvchilar va ota-onalarga dars jadvali o'zgarishi, DTM sinovlari yoki bayram tabriknomasini yuboring.
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
              <span>Barcha O'quvchilarga ({students.length} ta) Yuborish</span>
            </button>

            <button
              onClick={() => handleSendBroadcast('debt')}
              disabled={isBroadcasting || unpaidStudents.length === 0}
              className="px-4 py-2.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 font-bold text-xs flex items-center gap-1.5 transition cursor-pointer border border-rose-500/20"
            >
              <CreditCard className="w-3.5 h-3.5" />
              <span>Qarzdorlarga Eslatma ({unpaidStudents.length} ta)</span>
            </button>
          </div>
        </div>

        {/* Right: Bot Settings */}
        <div className="lg:col-span-6 p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
              <Settings className="w-4 h-4 text-sky-500" />
              <span>Telegram Bot Sozlamalari</span>
            </h3>
            {isConfigSaved && (
              <span className="text-xs text-emerald-500 font-bold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> Saqlandi!
              </span>
            )}
          </div>

          <form onSubmit={saveBotConfig} className="space-y-3 text-xs">
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                Bot Username (Handle)
              </label>
              <input
                type="text"
                value={botHandle}
                onChange={(e) => setBotHandle(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                Bot API Token (BotFather'dan)
              </label>
              <input
                type="password"
                value={botToken}
                onChange={(e) => setBotToken(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                Direktor Chat ID / Guruh ID
              </label>
              <input
                type="text"
                value={adminChatId}
                onChange={(e) => setAdminChatId(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono text-slate-900 dark:text-white"
              />
            </div>

            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-950 font-bold transition cursor-pointer"
            >
              Sozlamalarni Saqlash
            </button>
          </form>
        </div>
      </div>

      {/* Dispatched Logs Table */}
      <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
        <h3 className="text-base font-black text-slate-900 dark:text-white mb-4">
          Yuborilgan Telegram Xabarlari Tarixi
        </h3>

        <div className="space-y-2.5">
          {history.length === 0 && (
            <div className="py-8 text-center text-xs text-slate-400">
              Hozircha telegram xabarlari qayd etilmagan. Xabar yuborish orqali tarix shakllanadi.
            </div>
          )}
          {history.map((h) => (
            <div
              key={h.id}
              className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3 text-xs"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className={`w-8 h-8 rounded-xl shrink-0 flex items-center justify-center ${
                  h.status === 'Sent' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'
                }`}>
                  <Send className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-slate-900 dark:text-white break-words">
                    {h.message || h.messageText}
                  </p>
                  <span className="text-[11px] text-slate-400 font-mono block">
                    ID: #{h.id}
                    {h.error && <span className="text-rose-500"> • {h.error}</span>}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <span className="text-[11px] text-slate-400 font-mono">
                  {h.sentAt}
                </span>
                <span className={`px-2.5 py-1 rounded-full font-bold text-[10px] uppercase ${
                  h.status === 'Sent'
                    ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                    : 'bg-rose-500/10 text-rose-600 dark:text-rose-400'
                }`}>
                  {h.status === 'Sent' ? 'Yuborildi' : 'Muvaffaqiyatsiz'}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
