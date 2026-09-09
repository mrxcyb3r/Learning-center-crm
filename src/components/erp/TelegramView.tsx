import React, { useState } from 'react';
import { Send, CheckCircle2, AlertCircle, Bell, MessageSquare, ShieldCheck, Users, Clock } from 'lucide-react';
import { crmService } from '../../services/crmService';
import { TelegramAlertLog } from '../../types/crm';

const MOCK_ALERT_HISTORY: TelegramAlertLog[] = [
  {
    id: 'tg-1',
    leadId: 'l-1',
    message: '⚡ Yangi so\'rov: Jasur Rahimov (+998 90 123 45 67) - IELTS Intensive',
    status: 'Sent',
    sentAt: 'Today, 14:10',
  },
  {
    id: 'tg-2',
    leadId: 'l-2',
    message: '⚡ Yangi so\'rov: Madinabonu Karimova (+998 93 555 12 34) - Python Programming',
    status: 'Sent',
    sentAt: 'Today, 11:45',
  },
  {
    id: 'tg-3',
    message: '📢 Eslatma: Ertaga IELTS Mock Exam soat 10:00 da boshlanadi.',
    status: 'Sent',
    sentAt: 'Yesterday, 18:00',
  },
  {
    id: 'tg-4',
    message: '💳 To\'lov eslatmasi: Hurmatli o\'quvchi, sentyabr oyi to\'lov muddati yaqinlashmoqda.',
    status: 'Sent',
    sentAt: 'Yesterday, 12:30',
  },
];

export const TelegramView: React.FC = () => {
  const [history, setHistory] = useState<TelegramAlertLog[]>(MOCK_ALERT_HISTORY);
  const [announcementText, setAnnouncementText] = useState('');
  const [isBroadcasting, setIsBroadcasting] = useState(false);
  const [broadcastSuccess, setBroadcastSuccess] = useState<string | null>(null);

  const handleSendBroadcast = (type: string) => {
    setIsBroadcasting(true);
    setTimeout(() => {
      setIsBroadcasting(false);
      const newEntry: TelegramAlertLog = {
        id: `tg-${Date.now()}`,
        message: announcementText || `${type} broadcast yuborildi`,
        status: 'Sent',
        sentAt: 'Hozirgina',
      };
      setHistory([newEntry, ...history]);
      setBroadcastSuccess(`Xabar muvaffaqiyatli jo'natildi!`);
      setAnnouncementText('');
      setTimeout(() => setBroadcastSuccess(null), 4000);
    }, 800);
  };

  const handleSendTestNotification = () => {
    crmService.sendTelegramLeadNotification({
      id: 'test',
      name: 'Sinov So\'rovi (Admin Test)',
      phone: '+998 90 000 00 00',
      course: 'IELTS Intensive',
      status: 'New',
      createdAt: new Date().toISOString(),
    });

    const newEntry: TelegramAlertLog = {
      id: `tg-${Date.now()}`,
      message: '🔔 Test Notification: Bot aloqasi tekshirildi va ishlamoqda.',
      status: 'Sent',
      sentAt: 'Hozirgina',
    };
    setHistory([newEntry, ...history]);
    setBroadcastSuccess('Test xabari @renessans_lc_bot orqali jo\'natildi!');
    setTimeout(() => setBroadcastSuccess(null), 3000);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            Telegram Automation & Bot Controls
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Instant lead notifications, student broadcasts, and payment reminder alerts.
          </p>
        </div>

        <button
          onClick={handleSendTestNotification}
          className="px-4 py-2 rounded-xl bg-sky-500 hover:bg-sky-400 text-white font-bold text-xs shadow-md shadow-sky-500/20 flex items-center gap-1.5 transition cursor-pointer"
        >
          <Send className="w-3.5 h-3.5" />
          <span>Send Test Alert</span>
        </button>
      </div>

      {broadcastSuccess && (
        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-bold text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" />
          <span>{broadcastSuccess}</span>
        </div>
      )}

      {/* Operational Bot Status Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Status */}
        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center shrink-0">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Bot Operational State
            </span>
            <div className="text-base font-black text-emerald-600 dark:text-emerald-400 mt-0.5 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Connected & Active</span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">Webhook responding in 48ms</p>
          </div>
        </div>

        {/* Bot Handle */}
        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-sky-500/10 text-sky-500 flex items-center justify-center shrink-0">
            <Send className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Assigned Telegram Bot
            </span>
            <div className="text-base font-black text-slate-900 dark:text-white mt-0.5 font-mono">
              @renessans_lc_bot
            </div>
            <p className="text-xs text-slate-500 mt-0.5">Director & Receptionist alerts</p>
          </div>
        </div>

        {/* Notifications Sent Today */}
        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center shrink-0">
            <Bell className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Alerts Dispatched Today
            </span>
            <div className="text-2xl font-black text-slate-900 dark:text-white mt-0.5">
              34 <span className="text-xs font-normal text-slate-400">notifications</span>
            </div>
            <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-0.5 font-semibold">
              100% delivery rate
            </p>
          </div>
        </div>
      </div>

      {/* Broadcast Tools */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left: Message Broadcast Composer */}
        <div className="lg:col-span-6 p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">
            Send Broadcast Announcement
          </h3>
          <p className="text-xs text-slate-500">
            Compose an urgent announcement or schedule update to send via bot to all active students.
          </p>

          <textarea
            rows={4}
            value={announcementText}
            onChange={(e) => setAnnouncementText(e.target.value)}
            placeholder="Hurmatli o'quvchilar, yakshanba kuni soat 10:00 da IELTS Mock Exam..."
            className="w-full px-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
          />

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button
              onClick={() => handleSendBroadcast('Announcement')}
              disabled={isBroadcasting || !announcementText.trim()}
              className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 font-bold text-xs shadow-md shadow-amber-500/20 flex items-center gap-2 cursor-pointer transition"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Broadcast to All Students (247)</span>
            </button>

            <button
              onClick={() => handleSendBroadcast('Payment Reminder')}
              disabled={isBroadcasting}
              className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs flex items-center gap-1.5 transition cursor-pointer border border-slate-200 dark:border-slate-700"
            >
              <span>Remind Unpaid Students (14)</span>
            </button>
          </div>
        </div>

        {/* Right: Real-time Alert Logs */}
        <div className="lg:col-span-6 p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">
              Recent Dispatched Telegram Alerts
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Real-time audit of messages triggered by web forms and cron jobs
            </p>

            <div className="space-y-3">
              {history.map((h) => (
                <div
                  key={h.id}
                  className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800 text-xs"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-sky-600 dark:text-sky-400 flex items-center gap-1">
                      <Send className="w-3 h-3" />
                      Bot Message
                    </span>
                    <span className="text-[10px] text-slate-400 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {h.sentAt}
                    </span>
                  </div>
                  <p className="text-slate-700 dark:text-slate-300 font-medium">
                    {h.message || h.messageText}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
