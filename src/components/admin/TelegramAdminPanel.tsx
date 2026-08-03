import React, { useState, useEffect } from 'react';
import {
  Send,
  Activity,
  CheckCircle2,
  XCircle,
  Search,
  ShieldCheck,
  AlertTriangle,
  Radio,
  RefreshCw,
  Users,
  Check,
  AlertCircle,
  Key,
  Info
} from 'lucide-react';
import {
  checkBotHealth,
  checkBotStatus,
  sendGlobalBroadcast,
  assignUserPin,
  BotHealthResponse,
  BotStatusResponse,
  BroadcastResponse,
  BOT_USERNAME
} from '../../services/telegram';

export const TelegramAdminPanel: React.FC = () => {
  // Section A: Health State
  const [health, setHealth] = useState<BotHealthResponse | null>(null);
  const [healthLoading, setHealthLoading] = useState<boolean>(true);

  // Section B: User Lookup State
  const [searchUid, setSearchUid] = useState<string>('demo_student');
  const [lookupResult, setLookupResult] = useState<BotStatusResponse | null>(null);
  const [lookupLoading, setLookupLoading] = useState<boolean>(false);
  const [lookupError, setLookupError] = useState<string | null>(null);
  const [pinInput, setPinInput] = useState<string>('9842');
  const [pinStatus, setPinStatus] = useState<{ success?: boolean; message?: string } | null>(null);
  const [pinLoading, setPinLoading] = useState<boolean>(false);

  // Section C: Global Broadcast State
  const [broadcastMessage, setBroadcastMessage] = useState<string>(
    '📢 *CenterFlow Academic Announcement*\n\nReminder: IELTS Mock Examinations take place this Saturday at 09:00 AM. Please verify your seat number on the student portal.'
  );
  const [showConfirmModal, setShowConfirmModal] = useState<boolean>(false);
  const [broadcastLoading, setBroadcastLoading] = useState<boolean>(false);
  const [broadcastFeedback, setBroadcastFeedback] = useState<BroadcastResponse | null>(null);
  const [broadcastError, setBroadcastError] = useState<string | null>(null);

  // Global Rate Limit Alert Banner State
  const [rateLimitMessage, setRateLimitMessage] = useState<string | null>(null);

  const loadHealth = async () => {
    setHealthLoading(true);
    const data = await checkBotHealth();
    setHealth(data);
    setHealthLoading(false);
  };

  useEffect(() => {
    loadHealth();
  }, []);

  const handleUserLookup = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!searchUid.trim()) return;

    setLookupLoading(true);
    setLookupError(null);
    setLookupResult(null);
    setRateLimitMessage(null);

    const res = await checkBotStatus(searchUid.trim());

    if (res.isRateLimited) {
      setRateLimitMessage(res.errorMessage || 'Rate limit exceeded for user status lookup.');
      setLookupError('Rate limit exceeded (HTTP 429). Please wait a moment.');
    } else {
      setLookupResult(res);
    }
    setLookupLoading(false);
  };

  const handleAssignPin = async () => {
    if (!searchUid.trim() || !pinInput.trim()) return;
    setPinLoading(true);
    setPinStatus(null);
    setRateLimitMessage(null);

    const res = await assignUserPin(searchUid.trim(), pinInput.trim());
    if (res.isRateLimited) {
      setRateLimitMessage(res.message || 'Rate limit hit assigning PIN.');
    } else {
      setPinStatus({
        success: res.success,
        message: res.message || (res.success ? `PIN ${pinInput} assigned to ${searchUid}!` : 'Failed to assign PIN.')
      });
    }
    setPinLoading(false);
  };

  const handleConfirmBroadcast = async () => {
    setShowConfirmModal(false);
    setBroadcastLoading(true);
    setBroadcastFeedback(null);
    setBroadcastError(null);
    setRateLimitMessage(null);

    const res = await sendGlobalBroadcast(broadcastMessage);

    if (res.isRateLimited) {
      setRateLimitMessage(res.error || 'Rate limit hit for global broadcasts. Please wait 3 seconds.');
      setBroadcastError(res.error || 'Broadcast rate limit hit (HTTP 429).');
    } else if (!res.success) {
      setBroadcastError(res.error || 'Failed to dispatch broadcast.');
    } else {
      setBroadcastFeedback(res);
    }
    setBroadcastLoading(false);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Header */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 text-white shadow-xl border border-white/10 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-blue-500 text-white flex items-center justify-center shadow-lg shadow-blue-500/30 shrink-0">
              <Send className="w-6 h-6 -translate-x-0.5 translate-y-0.5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-extrabold text-white tracking-tight">Telegram Bot Admin Suite</h2>
                <span className="px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/30 text-xs font-bold font-mono">
                  @{BOT_USERNAME}
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-1">
                Monitor API bridge status, query student/staff connections, and dispatch global system announcements.
              </p>
            </div>
          </div>

          <button
            onClick={loadHealth}
            disabled={healthLoading}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition cursor-pointer self-start sm:self-auto disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${healthLoading ? 'animate-spin' : ''}`} />
            <span>Refresh Health</span>
          </button>
        </div>
      </div>

      {/* Rate Limit / Security Alert Banner */}
      {rateLimitMessage && (
        <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-600 dark:text-amber-400 text-xs flex items-center gap-3 animate-fadeIn">
          <AlertTriangle className="w-5 h-5 shrink-0" />
          <div className="flex-1">
            <strong className="font-bold">Rate Limit Advisory (HTTP 429):</strong> {rateLimitMessage}
          </div>
          <button
            onClick={() => setRateLimitMessage(null)}
            className="text-amber-500 hover:text-amber-700 font-bold px-2 py-1"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Grid of Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* SECTION A: System Health & Status Overview */}
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2 text-slate-900 dark:text-white font-bold text-sm">
              <Activity className="w-4 h-4 text-blue-500" />
              <span>Section A: System Health</span>
            </div>
            {health?.bridgeConnected ? (
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 text-[10px] font-black uppercase flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                Live Operational
              </span>
            ) : (
              <span className="px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 text-[10px] font-black uppercase">
                Offline
              </span>
            )}
          </div>

          <div className="space-y-3 text-xs">
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50">
              <span className="text-slate-500 dark:text-slate-400">Operational Mode:</span>
              <span className="font-mono font-bold text-slate-800 dark:text-slate-200 uppercase flex items-center gap-1.5">
                <Radio className="w-3.5 h-3.5 text-blue-500" />
                {health?.mode || 'polling'}
              </span>
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50">
              <span className="text-slate-500 dark:text-slate-400">API Bridge Status:</span>
              <span className="font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                <CheckCircle2 className="w-4 h-4" /> Connected
              </span>
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50">
              <span className="text-slate-500 dark:text-slate-400">Target Bot Handle:</span>
              <span className="font-mono font-bold text-blue-600 dark:text-blue-400">@{health?.botUsername || BOT_USERNAME}</span>
            </div>

            {health?.serverTime && (
              <div className="text-[10px] text-slate-400 text-right">
                Last verified: {new Date(health.serverTime).toLocaleTimeString()}
              </div>
            )}
          </div>
        </div>

        {/* SECTION B: User Connection Lookup & PIN Assignment */}
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4 lg:col-span-2">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2 text-slate-900 dark:text-white font-bold text-sm">
              <Search className="w-4 h-4 text-amber-500" />
              <span>Section B: User Connection Lookup & PIN Delivery</span>
            </div>
            <span className="text-[11px] text-slate-400 font-mono">GET /api/bot/status/:userUid</span>
          </div>

          <form onSubmit={handleUserLookup} className="flex gap-2">
            <div className="relative flex-1">
              <input
                type="text"
                value={searchUid}
                onChange={(e) => setSearchUid(e.target.value)}
                placeholder="Enter Student or Teacher User UID (e.g. demo_student)"
                className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 font-mono"
              />
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            </div>
            <button
              type="submit"
              disabled={lookupLoading}
              className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs transition cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
            >
              {lookupLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
              <span>Check Status</span>
            </button>
          </form>

          {lookupError && (
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900 text-rose-600 dark:text-rose-400 text-xs flex items-center gap-2">
              <XCircle className="w-4 h-4 shrink-0" />
              <span>{lookupError}</span>
            </div>
          )}

          {lookupResult && (
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-3 animate-fadeIn">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Target UID: <span className="font-mono text-blue-600 dark:text-blue-400">{searchUid}</span>
                </span>
                {lookupResult.isConnected ? (
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 text-xs font-bold flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Connected
                  </span>
                ) : (
                  <span className="px-2.5 py-0.5 rounded-full bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/30 text-xs font-bold flex items-center gap-1">
                    <XCircle className="w-3.5 h-3.5" /> Not Linked
                  </span>
                )}
              </div>

              {lookupResult.isConnected && (
                <div className="grid grid-cols-2 gap-3 text-xs pt-1 border-t border-slate-200 dark:border-slate-700">
                  <div>
                    <span className="text-slate-400 block text-[10px]">Linked Telegram Handle</span>
                    <span className="font-mono font-bold text-slate-900 dark:text-white">{lookupResult.telegramUsername || '@student'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Chat ID Reference</span>
                    <span className="font-mono text-slate-600 dark:text-slate-300">{lookupResult.chatId || 'chat_987654321'}</span>
                  </div>
                </div>
              )}

              {/* PIN Assignment Block */}
              <div className="pt-3 border-t border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row items-center gap-2">
                <div className="flex items-center gap-2 w-full sm:w-auto flex-1">
                  <Key className="w-4 h-4 text-amber-500 shrink-0" />
                  <input
                    type="text"
                    value={pinInput}
                    onChange={(e) => setPinInput(e.target.value)}
                    placeholder="Enter Security PIN"
                    className="px-3 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs font-mono w-full sm:w-32 text-slate-900 dark:text-white"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleAssignPin}
                  disabled={pinLoading}
                  className="w-full sm:w-auto px-3.5 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs transition cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-50"
                >
                  {pinLoading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <ShieldCheck className="w-3.5 h-3.5" />}
                  <span>Dispatch Security PIN</span>
                </button>
              </div>

              {pinStatus && (
                <div className={`p-2.5 rounded-lg text-xs font-semibold flex items-center gap-2 ${
                  pinStatus.success
                    ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300 border border-emerald-200'
                    : 'bg-rose-50 dark:bg-rose-950/30 text-rose-700 dark:text-rose-300 border border-rose-200'
                }`}>
                  <Check className="w-4 h-4 shrink-0" />
                  <span>{pinStatus.message}</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* SECTION C: Global System Broadcast Tool */}
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4 lg:col-span-3">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2 text-slate-900 dark:text-white font-bold text-sm">
              <Users className="w-4 h-4 text-indigo-500" />
              <span>Section C: Global System Broadcast Tool</span>
            </div>
            <span className="text-[11px] text-slate-400 font-mono">POST /api/bot/broadcast</span>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
              <label className="font-semibold text-slate-700 dark:text-slate-300">
                Draft Markdown-Supported Broadcast Message
              </label>
              <span className="font-mono text-[11px]">
                {broadcastMessage.length} characters
              </span>
            </div>

            <textarea
              rows={4}
              value={broadcastMessage}
              onChange={(e) => setBroadcastMessage(e.target.value)}
              placeholder="Type announcement text here... Markdown formatting like *bold* or _italic_ supported."
              className="w-full p-4 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs font-sans leading-relaxed focus:outline-none focus:border-indigo-500 resize-y min-h-[120px]"
            />

            <div className="flex items-center justify-between pt-2">
              <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
                <Info className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                <span>Sends message to all active linked Telegram users concurrently.</span>
              </div>

              <button
                type="button"
                onClick={() => setShowConfirmModal(true)}
                disabled={broadcastLoading || !broadcastMessage.trim()}
                className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md shadow-indigo-500/20 transition cursor-pointer flex items-center gap-2 disabled:opacity-50"
              >
                <Send className="w-4 h-4" />
                <span>Send Global Broadcast</span>
              </button>
            </div>
          </div>

          {/* Broadcast Error Alert */}
          {broadcastError && (
            <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900 text-rose-600 dark:text-rose-400 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{broadcastError}</span>
            </div>
          )}

          {/* Broadcast Results Feedback Block */}
          {broadcastFeedback && (
            <div className="p-5 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 space-y-3 animate-fadeIn">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-emerald-900 dark:text-emerald-200 text-sm flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                  <span>Broadcast Dispatched Successfully</span>
                </h4>
                <span className="text-[11px] font-mono text-emerald-700 dark:text-emerald-400">
                  {broadcastFeedback.message}
                </span>
              </div>

              <div className="grid grid-cols-3 gap-3 pt-2 text-center text-xs">
                <div className="p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-emerald-200 dark:border-emerald-800">
                  <span className="text-slate-400 block text-[10px]">Total Target Users</span>
                  <span className="font-extrabold text-slate-900 dark:text-white text-base">
                    {broadcastFeedback.totalConnected}
                  </span>
                </div>
                <div className="p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-emerald-200 dark:border-emerald-800">
                  <span className="text-emerald-600 dark:text-emerald-400 block text-[10px]">Successfully Delivered</span>
                  <span className="font-extrabold text-emerald-600 dark:text-emerald-400 text-base">
                    {broadcastFeedback.sentCount}
                  </span>
                </div>
                <div className="p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-emerald-200 dark:border-emerald-800">
                  <span className="text-rose-500 block text-[10px]">Failed / Blocked</span>
                  <span className="font-extrabold text-rose-500 text-base">
                    {broadcastFeedback.failedCount}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* CONFIRMATION MODAL BEFORE MASS BROADCAST */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
          <div className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-5">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
                  Confirm Mass Broadcast
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Are you sure you want to dispatch this message to all connected users?
                </p>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 text-xs text-slate-700 dark:text-slate-300 font-mono italic max-h-32 overflow-y-auto">
              "{broadcastMessage}"
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                className="flex-1 py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmBroadcast}
                className="flex-1 py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md transition cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Confirm & Send Now</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
