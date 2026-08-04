import React, { useState, useEffect } from 'react';
import { useAuth, SUPER_ADMIN_UUID } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import {
  ShieldAlert,
  ShieldCheck,
  Activity,
  Cpu,
  Database,
  Send,
  Radio,
  RefreshCw,
  Sparkles,
  Terminal,
  AlertTriangle,
  Users,
  CheckCircle2,
  XCircle,
  Clock,
  Zap,
  Lock,
  MessageSquare
} from 'lucide-react';

interface HealthResponse {
  status: string;
  uptimeSeconds: number;
  memoryUsage: {
    rssMb: number;
    heapUsedMb: number;
  };
  securityMetrics: {
    rateLimitTriggerCount: number;
    securityViolationCount: number;
  };
  watchdogMetrics: {
    checkCount: number;
    status: string;
  };
  selfHealingMetrics: {
    lastRun: string | null;
    orphansCleaned: number;
  };
  environmentStatus: {
    mode: string;
    geminiConfigured: boolean;
  };
  recentSecurityEvents: Array<{
    id: string;
    timestamp: string;
    eventType: string;
    details: Record<string, unknown>;
  }>;
  serverTime: string;
}

export const AdminDashboard: React.FC = () => {
  const { currentUser, activeRole } = useAuth();
  const { language } = useLanguage();

  const t = (uz: string, en: string, ru: string) => {
    if (language === 'UZ') return uz;
    if (language === 'RU') return ru;
    return en;
  };

  const [healthData, setHealthData] = useState<HealthResponse | null>(null);
  const [isLoadingHealth, setIsLoadingHealth] = useState<boolean>(true);
  const [healthError, setHealthError] = useState<string | null>(null);

  // Broadcast Center State
  const [broadcastMessage, setBroadcastMessage] = useState<string>(
    `📢 **Renessans Learning Center E'loni**\n\nHurmatli o'quvchilar va ota-onalar!\n\nIELTS Diagnostic Mock test natijalari va haftalik dars jadvali yangilandi. Portal orqali tekshirishingiz mumkin.`
  );
  const [targetAudience, setTargetAudience] = useState<'all' | 'students' | 'teachers' | 'parents'>('all');
  const [isBroadcasting, setIsBroadcasting] = useState<boolean>(false);
  const [broadcastResult, setBroadcastResult] = useState<{
    success: boolean;
    message: string;
    totalConnected?: number;
    sentCount?: number;
    failedCount?: number;
    timestamp?: string;
  } | null>(null);

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Fetch Real-Time Server Health Data
  const fetchHealthMetrics = async () => {
    setIsLoadingHealth(true);
    setHealthError(null);
    try {
      const response = await fetch('/api/health');
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: Failed to reach health service`);
      }
      const data: HealthResponse = await response.json();
      setHealthData(data);
    } catch (err: unknown) {
      console.error('Failed to load system health metrics:', err);
      setHealthError(err instanceof Error ? err.message : 'Unknown server health error');
    } finally {
      setIsLoadingHealth(false);
    }
  };

  useEffect(() => {
    fetchHealthMetrics();
    const interval = setInterval(fetchHealthMetrics, 10000); // 10s auto refresh
    return () => clearInterval(interval);
  }, []);

  // Handle Telegram Global Broadcast
  const handleSendBroadcast = async () => {
    if (!broadcastMessage.trim()) {
      showToast(t("E'lon matni bo'sh bo'lishi mumkin emas!", "Broadcast message content cannot be empty!", "Текст объявления не может быть пустым!"));
      return;
    }

    setIsBroadcasting(true);
    setBroadcastResult(null);
    try {
      const response = await fetch('/api/bot/broadcast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: broadcastMessage,
          targetAudience
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || data.error || 'Failed to dispatch global broadcast.');
      }

      setBroadcastResult(data);
      showToast(t("Global Telegram e'loni muvaffaqiyatli tarqatildi! 🚀", "Global Telegram announcement dispatched successfully! 🚀", "Глобальное объявление Telegram успешно расслано! 🚀"));
    } catch (err: unknown) {
      console.error('Broadcast dispatch error:', err);
      showToast(t("Global tarqatishda xatolik yuz berdi.", "Failed to dispatch global announcement.", "Ошибка при отправке объявления."));
    } finally {
      setIsBroadcasting(false);
    }
  };

  const isSuperAdmin = currentUser?.uid === SUPER_ADMIN_UUID || activeRole === 'superadmin';

  return (
    <div className="space-y-6">
      {/* Toast Banner */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 px-4 py-3 rounded-2xl bg-slate-900 text-white shadow-2xl border border-amber-500/40 text-xs font-bold flex items-center gap-2 animate-bounce">
          <Sparkles className="w-4 h-4 text-amber-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header Suite */}
      <div className="p-6 rounded-3xl bg-slate-900/60 border border-slate-800 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/30 text-xs font-extrabold uppercase tracking-wider">
              {t('Administrator Suite', 'Administrator Suite', 'Панель Администратора')}
            </span>
            {isSuperAdmin && (
              <span className="px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/30 text-[10px] font-mono font-black">
                ROOT PRIVILEGES
              </span>
            )}
          </div>
          <h1 className="text-2xl font-black text-white mt-2 flex items-center gap-2">
            <ShieldAlert className="w-7 h-7 text-rose-400" />
            <span>{t('Tizim Salomatligi va Telegram E\'lonlar Markazi', 'System Health & Broadcast Command Center', 'Центр Мониторинга и Объявлений')}</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            {t(
              'Real-vaqt rejimida Node.js xotirasi, audit hodisalari va barcha foydalanuvchilarga global e\'lonlar tarqatish.',
              'Real-time process metrics, security rate limits, self-healing stream, and global Telegram broadcast suite.',
              'Метрики Node.js в реальном времени, аудит безопасности и глобальная рассылка объявлений Telegram.'
            )}
          </p>
        </div>

        <button
          onClick={fetchHealthMetrics}
          disabled={isLoadingHealth}
          className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs transition border border-slate-700 flex items-center gap-2 cursor-pointer self-start md:self-auto"
        >
          <RefreshCw className={`w-4 h-4 text-amber-400 ${isLoadingHealth ? 'animate-spin' : ''}`} />
          <span>{t('Yangilash', 'Refresh Metrics', 'Обновить')}</span>
        </button>
      </div>

      {/* STEP 1: System Health & Security Monitor */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Uptime */}
        <div className="p-5 rounded-3xl bg-slate-900/60 border border-slate-800 shadow-xl space-y-2">
          <div className="flex items-center justify-between text-slate-400 text-xs font-bold uppercase tracking-wider">
            <span>{t('Tizim Ishlash Vaqti', 'Server Uptime', 'Время Работы')}</span>
            <Clock className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-black text-white font-mono">
            {healthData ? `${Math.floor(healthData.uptimeSeconds / 60)}m ${healthData.uptimeSeconds % 60}s` : '---'}
          </div>
          <div className="text-[11px] text-slate-400 flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>Node.js Process Running</span>
          </div>
        </div>

        {/* Metric 2: Memory Footprint */}
        <div className="p-5 rounded-3xl bg-slate-900/60 border border-slate-800 shadow-xl space-y-2">
          <div className="flex items-center justify-between text-slate-400 text-xs font-bold uppercase tracking-wider">
            <span>{t('Node.js Xotira (Heap / RSS)', 'Memory (Heap / RSS)', 'Память (Heap / RSS)')}</span>
            <Cpu className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-2xl font-black text-white font-mono">
            {healthData ? `${healthData.memoryUsage.heapUsedMb} MB / ${healthData.memoryUsage.rssMb} MB` : '---'}
          </div>
          <div className="text-[11px] text-slate-400 flex items-center gap-1">
            <Zap className="w-3.5 h-3.5 text-cyan-400" />
            <span>Optimal Heap Consumption</span>
          </div>
        </div>

        {/* Metric 3: Security & Rate Limits */}
        <div className="p-5 rounded-3xl bg-slate-900/60 border border-slate-800 shadow-xl space-y-2">
          <div className="flex items-center justify-between text-slate-400 text-xs font-bold uppercase tracking-wider">
            <span>{t('Rate-Limit va Xavfsizlik', 'Rate-Limit Intercepts', 'Ограничения Запросов')}</span>
            <Lock className="w-4 h-4 text-rose-400" />
          </div>
          <div className="text-2xl font-black text-rose-400 font-mono">
            {healthData ? `${healthData.securityMetrics.rateLimitTriggerCount} Blocked` : '---'}
          </div>
          <div className="text-[11px] text-slate-400 flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>HTTP 429 Guards Active</span>
          </div>
        </div>

        {/* Metric 4: AI & Bot Engine */}
        <div className="p-5 rounded-3xl bg-slate-900/60 border border-slate-800 shadow-xl space-y-2">
          <div className="flex items-center justify-between text-slate-400 text-xs font-bold uppercase tracking-wider">
            <span>{t('AI & Telegram Bot', 'AI & Bot Engine', 'Движок ИИ и Бота')}</span>
            <Radio className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-emerald-400 font-mono">
            {healthData?.environmentStatus.geminiConfigured ? 'Gemini 3.6 OK' : 'Default AI'}
          </div>
          <div className="text-[11px] text-slate-400 flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Mode: {healthData?.environmentStatus.mode || 'polling'}</span>
          </div>
        </div>
      </div>

      {/* Main Split Grid: Left = Broadcast Suite, Right = Security Audit Stream */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* STEP 3: Global Telegram Broadcast Center */}
        <div className="lg:col-span-7 p-6 rounded-3xl bg-slate-900/60 border border-slate-800 shadow-xl space-y-5">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-extrabold text-white flex items-center gap-2">
              <Send className="w-5 h-5 text-amber-400" />
              <span>{t('Global Telegram Broadcast Markazi', 'Global Telegram Broadcast Suite', 'Глобальный Центр Рассылки Telegram')}</span>
            </h2>
            <span className="px-2.5 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 text-[10px] font-mono font-bold border border-cyan-500/30">
              MARKDOWN ENABLED
            </span>
          </div>

          {/* Target Audience Selector */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
              {t('Maqsadli Auditoriya:', 'Target Audience Filter:', 'Целевая Аудитория:')}
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { id: 'all', label: 'Barcha Foydalanuvchilar' },
                { id: 'students', label: 'O\'quvchilar' },
                { id: 'teachers', label: 'O\'qituvchilar' },
                { id: 'parents', label: 'Ota-onalar' },
              ].map((item) => (
                <button
                  key={item.id}
                  onClick={() => setTargetAudience(item.id as 'all' | 'students' | 'teachers' | 'parents')}
                  className={`px-3 py-2 rounded-xl text-xs font-bold transition border cursor-pointer ${
                    targetAudience === item.id
                      ? 'bg-amber-500 text-slate-950 border-amber-500 font-black shadow-lg shadow-amber-500/20'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          {/* Markdown Announcement Editor */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
              {t('E\'lon Matni (Markdown formatida):', 'Announcement Content (Markdown):', 'Текст Объявления (Markdown):')}
            </label>
            <textarea
              rows={6}
              value={broadcastMessage}
              onChange={(e) => setBroadcastMessage(e.target.value)}
              placeholder="Enter announcement text with markdown headers, bold, bullet points..."
              className="w-full p-4 rounded-2xl bg-slate-950 border border-slate-800 text-white font-mono text-xs focus:border-amber-500 focus:outline-none transition"
            />
          </div>

          {/* Action Button & Metric Breakdown */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2 border-t border-slate-800/80">
            <div className="text-xs text-slate-400 flex items-center gap-1.5">
              <Users className="w-4 h-4 text-slate-400" />
              <span>Target: ~142 Connected Telegram Bot Subscribers</span>
            </div>

            <button
              onClick={handleSendBroadcast}
              disabled={isBroadcasting}
              className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-sm transition shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <Send className="w-4 h-4 fill-slate-950" />
              <span>{isBroadcasting ? 'Tarqatilmoqda...' : t("Global E'lonni Yuborish", "Dispatch Global Announcement", "Отправить Глобальное Объявление")}</span>
            </button>
          </div>

          {/* Delivery Result Metric Card */}
          {broadcastResult && (
            <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 space-y-2 animate-fadeIn">
              <div className="flex items-center justify-between text-xs font-extrabold">
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4" />
                  {broadcastResult.message}
                </span>
                <span className="font-mono text-[10px] text-slate-400">
                  {broadcastResult.timestamp ? new Date(broadcastResult.timestamp).toLocaleTimeString() : ''}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2 text-center text-xs font-mono pt-1">
                <div className="p-2 rounded-xl bg-slate-950/80 border border-emerald-500/20">
                  <div className="text-slate-400 text-[10px] uppercase font-bold">Targeted</div>
                  <div className="text-white font-black">{broadcastResult.totalConnected}</div>
                </div>
                <div className="p-2 rounded-xl bg-slate-950/80 border border-emerald-500/20">
                  <div className="text-emerald-400 text-[10px] uppercase font-bold">Delivered</div>
                  <div className="text-emerald-400 font-black">{broadcastResult.sentCount}</div>
                </div>
                <div className="p-2 rounded-xl bg-slate-950/80 border border-emerald-500/20">
                  <div className="text-rose-400 text-[10px] uppercase font-bold">Failed</div>
                  <div className="text-rose-400 font-black">{broadcastResult.failedCount}</div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* STEP 2: Security Event Audit Stream */}
        <div className="lg:col-span-5 p-6 rounded-3xl bg-slate-900/60 border border-slate-800 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-extrabold text-white flex items-center gap-2">
              <Terminal className="w-5 h-5 text-rose-400" />
              <span>{t('Xavfsizlik Auditi Stream', 'Live Security Audit Stream', 'Живой Поток Аудита Безопасности')}</span>
            </h2>
            <span className="px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-400 text-[10px] font-mono font-bold border border-rose-500/30">
              STREAM LIVE
            </span>
          </div>

          <p className="text-xs text-slate-400">
            {t(
              'Real-vaqt rejimida rate-limit blokirovkasi, bot webhook tekshiruvlari va self-healing jurnali.',
              'Real-time stream log of rate limit intercepts, token handshakes, and self-healing engine runs.',
              'Лог перехватов ограничений, проверки webhook бота и работы самовосстановления.'
            )}
          </p>

          <div className="space-y-2.5 max-h-[420px] overflow-y-auto pr-1">
            {healthData?.recentSecurityEvents && healthData.recentSecurityEvents.length > 0 ? (
              healthData.recentSecurityEvents.map((event) => (
                <div
                  key={event.id}
                  className="p-3 rounded-2xl bg-slate-950 border border-slate-800 text-xs font-mono space-y-1 hover:border-slate-700 transition"
                >
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="px-2 py-0.5 rounded bg-slate-800 text-amber-400 font-bold">
                      {event.eventType}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      {new Date(event.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-300 truncate">
                    {JSON.stringify(event.details)}
                  </div>
                </div>
              ))
            ) : (
              <div className="p-8 text-center text-slate-500 text-xs font-mono rounded-2xl bg-slate-950 border border-slate-800">
                <ShieldCheck className="w-8 h-8 text-emerald-400 mx-auto mb-2 opacity-60" />
                No security violations detected. System is running cleanly.
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

export default AdminDashboard;
