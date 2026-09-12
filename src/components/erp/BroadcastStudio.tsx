import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Search,
  RefreshCw,
  X,
  Send,
  Megaphone,
  History,
  CheckCircle2,
  AlertTriangle,
  SkipForward,
  MessageSquare,
  User as UserIcon,
} from 'lucide-react';
import {
  getBroadcastRecipients,
  sendBroadcastV2,
  getBroadcastResults,
  getBroadcastHistory,
  BroadcastRecipient,
  BroadcastResultEntry,
  BroadcastHistoryItem,
} from '../../services/telegram';
import { formatDateTime } from '../../utils/format';

type Scope = 'connected' | 'selected' | 'murojaatlar';
type Step = 'recipients' | 'compose' | 'preview' | 'confirm' | 'results';

const MAX_MESSAGE_LENGTH = 4000;

const SCOPE_LABELS: Record<Scope, string> = {
  connected: 'Barcha ulanganlar',
  selected: 'Tanlangan foydalanuvchilar',
  murojaatlar: 'Murojaatlar orqali',
};

function statusIcon(status: BroadcastResultEntry['status']) {
  if (status === 'sent') return <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />;
  if (status === 'failed') return <AlertTriangle className="w-3.5 h-3.5 text-rose-500" />;
  return <SkipForward className="w-3.5 h-3.5 text-slate-400" />;
}

export const BroadcastStudio: React.FC = () => {
  const [step, setStep] = useState<Step>('recipients');
  const [scope, setScope] = useState<Scope>('connected');

  // Recipient resolution state
  const [recipients, setRecipients] = useState<BroadcastRecipient[]>([]);
  const [totalFound, setTotalFound] = useState(0);
  const [loadingRecipients, setLoadingRecipients] = useState(false);
  const [recepientsError, setRecipientsError] = useState('');
  const [search, setSearch] = useState('');
  const [userSearch, setUserSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'trial' | 'question'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'new' | 'in_progress'>('all');
  const [selected, setSelected] = useState<Set<string>>(new Set());

  // Composer state
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState('');

  // Results state
  const [result, setResult] = useState<{ broadcastId: string | null; total: number; sent: number; failed: number; skipped: number; results: BroadcastResultEntry[] } | null>(null);

  const finalMessage = useMemo(() => {
    const body = message.trim();
    const t = title.trim();
    if (!body) return '';
    return t ? `${t}\n\n${body}` : body;
  }, [title, message]);

  const fetchRecipients = useCallback(
    async (opts: { scope: Scope; search: string; type: 'all' | 'trial' | 'question'; status: 'all' | 'new' | 'in_progress' }) => {
      setLoadingRecipients(true);
      setRecipientsError('');
      try {
        const r = await getBroadcastRecipients({
          scope: opts.scope === 'selected' ? 'connected' : opts.scope,
          type: opts.scope === 'murojaatlar' ? opts.type : 'all',
          status: opts.scope === 'murojaatlar' ? opts.status : 'all',
          q: opts.search,
          limit: 500,
        });
        if (!r.ok) {
          setRecipientsError(r.error || 'Qabul qiluvchilarni yuklab bo\'lmadi.');
          setRecipients([]);
          setTotalFound(0);
          return;
        }
        setRecipients(r.recipients);
        setTotalFound(r.total);
        if (opts.scope === 'connected' || opts.scope === 'murojaatlar') {
          setSelected(new Set(r.recipients.map((x) => x.userUid)));
        }
      } catch (err: any) {
        setRecipientsError(err?.message || 'Yuklashda xatolik.');
      } finally {
        setLoadingRecipients(false);
      }
    },
    []
  );

  // Load current scope's recipients (search debounced).
  useEffect(() => {
    const scopeKey = scope;
    const timer = setTimeout(() => {
      fetchRecipients({ scope: scopeKey, search: scope === 'selected' ? userSearch : search, type: typeFilter, status: statusFilter });
    }, scope === 'selected' ? 400 : 300);
    return () => clearTimeout(timer);
  }, [scope, search, userSearch, typeFilter, statusFilter, fetchRecipients]);

  const toggleSelected = useCallback((uid: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(uid)) next.delete(uid);
      else next.add(uid);
      return next;
    });
  }, []);

  const selectAllVisible = useCallback(() => {
    setSelected(new Set(recipients.map((x) => x.userUid)));
  }, [recipients]);

  const clearSelection = useCallback(() => {
    setSelected(new Set());
  }, []);

  const goCompose = useCallback(() => {
    if (selected.size === 0) return;
    setStep('compose');
  }, [selected.size]);

  const goPreview = useCallback(() => {
    if (!finalMessage) return;
    setStep('preview');
  }, [finalMessage]);

  const goConfirm = useCallback(() => setStep('confirm'), []);

  const doSend = useCallback(async () => {
    if (selected.size === 0 || sending || !finalMessage) return;
    setSending(true);
    setSendError('');
    const r = await sendBroadcastV2(Array.from(selected), finalMessage);
    setSending(false);
    if (r.ok) {
      setResult({
        broadcastId: r.broadcastId ?? null,
        total: r.total ?? 0,
        sent: r.sent ?? 0,
        failed: r.failed ?? 0,
        skipped: r.skipped ?? 0,
        results: r.results ?? [],
      });
      setStep('results');
    } else {
      setSendError(r.error || 'Xabar yuborilmadi.');
      setStep('confirm');
    }
  }, [selected, sending, finalMessage]);

  const reset = useCallback(() => {
    setStep('recipients');
    setTitle('');
    setMessage('');
    setSendError('');
    setResult(null);
    setSelected(new Set());
  }, []);

  return (
    <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-5">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
          <Megaphone className="w-4 h-4 text-amber-500" />
          <span>Professional Broadcast</span>
        </h3>
        <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
          Qadam: {step === 'recipients' ? 'Qabul qiluvchilar' : step === 'compose' ? 'Xabar' : step === 'preview' ? 'Tekshirish' : step === 'confirm' ? 'Tasdiqlash' : 'Natijalar'}
        </span>
      </div>

      {/* STEP: RECIPIENTS */}
      {step === 'recipients' && (
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {(Object.keys(SCOPE_LABELS) as Scope[]).map((s) => (
              <button
                key={s}
                onClick={() => {
                  setScope(s);
                  setSelected(new Set());
                }}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold border transition cursor-pointer ${
                  scope === s
                    ? 'bg-amber-500 text-slate-950 border-amber-500 shadow-sm'
                    : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                {SCOPE_LABELS[s]}
              </button>
            ))}
          </div>

          {scope === 'murojaatlar' && (
            <div className="flex flex-wrap items-center gap-2">
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value as 'all' | 'trial' | 'question')}
                className="px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500/40"
              >
                <option value="all">Barcha turlar</option>
                <option value="trial">Sinov darsi</option>
                <option value="question">Savollar</option>
              </select>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as 'all' | 'new' | 'in_progress')}
                className="px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500/40"
              >
                <option value="all">Barcha holatlar</option>
                <option value="new">Yangi</option>
                <option value="in_progress">Jarayonda / Bog'lanildi</option>
              </select>
              <span className="text-[10px] text-slate-400">Faqat Telegram CRM hisobiga ulangan foydalanuvchilar qabul qilinadi.</span>
            </div>
          )}

          {scope !== 'connected' && (
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
              <input
                value={scope === 'selected' ? userSearch : search}
                onChange={(e) => (scope === 'selected' ? setUserSearch(e.target.value) : setSearch(e.target.value))}
                placeholder="Ism, telefon yoki @username bo'yicha qidirish..."
                className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-800 dark:text-slate-200 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/40"
              />
            </div>
          )}

          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-2">
              {recepientsError ? (
                <span className="text-[11px] font-semibold text-rose-500">{recepientsError}</span>
              ) : loadingRecipients ? (
                <span className="text-[11px] text-slate-400 flex items-center gap-1.5">
                  <RefreshCw className="w-3 h-3 animate-spin" /> Yuklanmoqda...
                </span>
              ) : (
                <span className="text-[11px] font-semibold text-slate-500">
                  {scope === 'connected' ? 'Barcha ulangan foydalanuvchilar' : `${totalFound} ta ulangan foydalanuvchi topildi`}
                </span>
              )}
            </div>
            {scope === 'selected' && recipients.length > 0 && (
              <div className="flex items-center gap-2">
                <button onClick={selectAllVisible} className="text-[10px] font-bold text-amber-600 dark:text-amber-400 hover:underline cursor-pointer">Hammasini belgilash</button>
                <button onClick={clearSelection} className="text-[10px] font-bold text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:underline cursor-pointer">Tozalash</button>
              </div>
            )}
          </div>

          <div className="max-h-64 overflow-y-auto rounded-2xl border border-slate-200 dark:border-slate-800 divide-y divide-slate-100 dark:divide-slate-800/60">
            {!loadingRecipients && recipients.length === 0 && !recepientsError && (
              <div className="py-8 text-center text-xs text-slate-400">
                {scope === 'selected'
                  ? 'Qidiruv bo\'yicha hech narsa topilmadi.'
                  : 'Hozircha Telegram hisobiga ulangan foydalanuvchilar yo\'q.'}
              </div>
            )}
            {recipients.map((r) => {
              const isSelected = selected.has(r.userUid);
              return (
                <label key={r.userUid} className={`flex items-center gap-3 px-4 py-2.5 cursor-pointer transition ${isSelected ? 'bg-amber-500/5' : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'}`}>
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => toggleSelected(r.userUid)}
                    className="w-4 h-4 rounded accent-amber-500 shrink-0"
                  />
                  <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 shrink-0">
                    <UserIcon className="w-4 h-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-bold text-slate-900 dark:text-white truncate">{r.name || 'Telegram foydalanuvchisi'}</span>
                      {r.telegramUsername && <span className="text-[10px] text-sky-600 dark:text-sky-400 font-semibold">@{r.telegramUsername}</span>}
                    </div>
                    <div className="flex items-center gap-2 text-[10px] text-slate-400 flex-wrap">
                      {r.phone && <span>{r.phone}</span>}
                      {r.murojaatKind && (
                        <span className="inline-flex items-center gap-0.5">
                          <MessageSquare className="w-2.5 h-2.5" />
                          {r.murojaatKind === 'trial' ? 'Sinov darsi' : 'Savol'}
                        </span>
                      )}
                      {r.murojaatStatus && <span>{r.murojaatStatus}</span>}
                    </div>
                  </div>
                  {r.chatId && (
                    <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 uppercase shrink-0">
                      Ulangan
                    </span>
                  )}
                </label>
              );
            })}
          </div>

          <div className="flex items-center justify-between gap-3 flex-wrap">
            <span className={`px-3 py-2 rounded-2xl text-sm font-black ${selected.size > 0 ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400' : 'bg-slate-500/10 text-slate-400'}`}>
              {selected.size} ta qabul qiluvchi
            </span>
            <button
              onClick={goCompose}
              disabled={selected.size === 0}
              className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-40 disabled:cursor-not-allowed text-slate-950 font-bold text-xs flex items-center gap-1.5 transition cursor-pointer"
            >
              Keyingisi <Send className="w-3 h-3" />
            </button>
          </div>
        </div>
      )}

      {/* STEP: COMPOSE */}
      {step === 'compose' && (
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Sarlavha (ixtiyoriy)</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Masalan: DTM sinovi — eslatma"
              maxLength={120}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-800 dark:text-slate-200 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/40"
            />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Xabar</label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={7}
              maxLength={MAX_MESSAGE_LENGTH}
              placeholder="Hurmatli o'quvchilar va ota-onalar, ertaga soat 09:00 da navbatdagi DTM diagnostik imtihoni..."
              className="w-full px-3.5 py-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs sm:text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/40 resize-none"
            />
            <div className="flex justify-end">
              <span className={`text-[10px] font-semibold ${message.length > MAX_MESSAGE_LENGTH - 100 ? 'text-amber-500' : 'text-slate-400'}`}>
                {message.length}/{MAX_MESSAGE_LENGTH}
              </span>
            </div>
          </div>
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <button
              onClick={() => setStep('recipients')}
              className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs transition cursor-pointer"
            >
              ← Orqaga
            </button>
            <button
              onClick={goPreview}
              disabled={!finalMessage}
              className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-40 disabled:cursor-not-allowed text-slate-950 font-bold text-xs flex items-center gap-1.5 transition cursor-pointer"
            >
              Tekshirish {selected.size} ta <Send className="w-3 h-3" />
            </button>
          </div>
        </div>
      )}

      {/* STEP: PREVIEW */}
      {step === 'preview' && (
        <div className="space-y-4">
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
            <div className="px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-1.5">
              <Send className="w-3 h-3 text-sky-500" /> Telegram xabari
            </div>
            <div className="px-4 py-4 bg-white dark:bg-slate-950">
              {title.trim() && <div className="text-sm font-black text-slate-900 dark:text-white mb-1">{title.trim()}</div>}
              <div className="text-sm text-slate-700 dark:text-slate-200 whitespace-pre-wrap leading-relaxed">{message.trim()}</div>
            </div>
          </div>
          <div className="rounded-xl px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300">
            Qabul qiluvchilar: {selected.size}
          </div>
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <button
              onClick={() => setStep('compose')}
              className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs transition cursor-pointer"
            >
              Bekor qilish
            </button>
            <button
              onClick={goConfirm}
              className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition cursor-pointer"
            >
              Tasdiqlash va yuborish <Send className="w-3 h-3" />
            </button>
          </div>
        </div>
      )}

      {/* STEP: CONFIRM */}
      {step === 'confirm' && (
        <div className="space-y-4">
          <div className="rounded-2xl border border-amber-500/30 bg-amber-500/5 px-4 py-3.5 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
            <p className="text-sm font-bold text-slate-800 dark:text-slate-200">
              {selected.size} ta foydalanuvchiga Telegram xabari yuboriladi.
            </p>
          </div>
          {sendError && (
            <div className="rounded-xl px-3.5 py-2.5 bg-rose-500/10 border border-rose-500/30 text-xs font-semibold text-rose-600 dark:text-rose-400">
              {sendError}
            </div>
          )}
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <button
              onClick={() => setStep('preview')}
              disabled={sending}
              className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 disabled:opacity-40 text-slate-700 dark:text-slate-200 font-bold text-xs transition cursor-pointer"
            >
              Bekor qilish
            </button>
            <button
              onClick={doSend}
              disabled={sending}
              className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-60 disabled:cursor-not-allowed text-slate-950 font-bold text-xs flex items-center gap-1.5 transition cursor-pointer"
            >
              {sending ? (
                <>
                  <RefreshCw className="w-3 h-3 animate-spin" /> Yuborilmoqda...
                </>
              ) : (
                <>
                  <Send className="w-3 h-3" /> Yuborish
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* STEP: RESULTS */}
      {step === 'results' && result && (
        <div className="space-y-4">
          <div className="text-center py-4">
            <div className="text-lg font-black text-slate-900 dark:text-white">Broadcast yakunlandi</div>
            <div className="text-xs text-slate-500 mt-1 font-semibold">{result.total} ta qabul qiluvchi</div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-center">
              <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400 block">✓ {result.sent}</span>
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600/80 dark:text-emerald-400/80">Yuborildi</span>
            </div>
            <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-center">
              <span className="text-2xl font-black text-rose-600 dark:text-rose-400 block">! {result.failed}</span>
              <span className="text-[10px] font-bold uppercase tracking-wider text-rose-600/80 dark:text-rose-400/80">Xatolik</span>
            </div>
            <div className="p-4 rounded-2xl bg-slate-500/10 border border-slate-500/30 text-center">
              <span className="text-2xl font-black text-slate-500 dark:text-slate-300 block">– {result.skipped}</span>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500/80 dark:text-slate-400/80">O'tkazib yuborildi</span>
            </div>
          </div>
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <button onClick={reset} className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs transition cursor-pointer">
              Yangi broadcast
            </button>
            {result.broadcastId && <BroadcastResultsButton broadcastId={result.broadcastId} />}
          </div>
        </div>
      )}
    </div>
  );
};

function BroadcastResultsButton({ broadcastId }: { broadcastId: string }) {
  const [open, setOpen] = useState(false);
  const [data, setData] = useState<BroadcastHistoryItem | null>(null);
  const [results, setResults] = useState<BroadcastResultEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const openResults = useCallback(async () => {
    setOpen(true);
    setLoading(true);
    setError('');
    const r = await getBroadcastResults(broadcastId);
    setLoading(false);
    if (r.ok && r.broadcast) {
      setData(r.broadcast);
      setResults(r.results);
    } else {
      setError(r.error || 'Natijalarni ochib bo\'lmadi.');
    }
  }, [broadcastId]);

  return (
    <>
      <button
        onClick={openResults}
        className="px-4 py-2.5 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold text-xs transition cursor-pointer"
      >
        Natijalarni ko'rish
      </button>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm" onClick={() => setOpen(false)} />
          <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h4 className="text-sm font-black text-slate-900 dark:text-white">Broadcast natijalari</h4>
                {data && <p className="text-[10px] text-slate-400 mt-0.5">{formatDateTime(data.createdAt)}</p>}
              </div>
              <button onClick={() => setOpen(false)} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>
            {error && <div className="px-5 py-3 text-xs font-semibold text-rose-500">{error}</div>}
            <div className="max-h-[60vh] overflow-y-auto px-5 py-3 divide-y divide-slate-100 dark:divide-slate-800/60">
              {loading && !error && <div className="py-6 text-center text-xs text-slate-400">Yuklanmoqda...</div>}
              {!loading && results.length === 0 && !error && <div className="py-6 text-center text-xs text-slate-400">Natijalar mavjud emas.</div>}
              {results.map((r, i) => (
                <div key={r.userUid + i} className="flex items-center gap-3 py-2.5">
                  {statusIcon(r.status)}
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-bold text-slate-900 dark:text-white truncate">{r.name || 'Telegram foydalanuvchisi'}</div>
                    {r.telegramUsername && <div className="text-[10px] text-sky-600 dark:text-sky-400">@{r.telegramUsername}</div>}
                  </div>
                  <span className={`text-[10px] font-black uppercase shrink-0 ${
                    r.status === 'sent' ? 'text-emerald-500' : r.status === 'failed' ? 'text-rose-500' : 'text-slate-400'
                  }`}>
                    {r.status === 'sent' ? 'Yuborildi' : r.status === 'failed' ? 'Xatolik' : "O'tkazib yuborildi"}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export const BroadcastHistory: React.FC = () => {
  const [history, setHistory] = useState<BroadcastHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [detail, setDetail] = useState<BroadcastResultEntry[] | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    const r = await getBroadcastHistory(20);
    setLoading(false);
    if (r.ok) {
      setHistory(r.history);
    } else {
      setError(r.error || 'Tarixni yuklab bo\'lmadi.');
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const toggleDetail = useCallback(
    async (id: string) => {
      if (expandedId === id) {
        setExpandedId(null);
        setDetail(null);
        return;
      }
      setExpandedId(id);
      setDetailLoading(true);
      setDetail(null);
      const r = await getBroadcastResults(id);
      setDetailLoading(false);
      setDetail(r.ok ? r.results : []);
    },
    [expandedId]
  );

  return (
    <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
          <History className="w-4 h-4 text-sky-500" />
          <span>Broadcastlar tarixi</span>
        </h3>
        <button onClick={load} className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer" title="Yangilash">
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {error && <div className="text-xs font-semibold text-rose-500">{error}</div>}
      {!loading && history.length === 0 && !error && (
        <div className="py-8 text-center text-xs text-slate-400">Hozircha hech qanday broadcast amalga oshirilmagan.</div>
      )}

      <div className="space-y-2">
        {history.map((h) => (
          <div key={h.id} className="rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
            <button
              onClick={() => toggleDetail(h.id)}
              className="w-full text-left px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition cursor-pointer"
            >
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <div className="min-w-0">
                  <div className="text-xs font-bold text-slate-900 dark:text-white line-clamp-1 break-words">{h.message}</div>
                  <div className="text-[10px] text-slate-400 mt-0.5">{formatDateTime(h.createdAt)}</div>
                </div>
                <div className="flex items-center gap-3 shrink-0 text-[10px] font-black">
                  <span className="text-slate-400">{h.recipientCount} qabul</span>
                  <span className="text-emerald-500">{h.sentCount} ✓</span>
                  <span className="text-rose-500">{h.failedCount} !</span>
                  <span className="text-slate-400">- {h.skippedCount}</span>
                </div>
              </div>
            </button>
            {expandedId === h.id && (
              <div className="border-t border-slate-100 dark:border-slate-800/60">
                {detailLoading && <div className="px-4 py-4 text-center text-[11px] text-slate-400">Yuklanmoqda...</div>}
                {detail && detail.length === 0 && !detailLoading && (
                  <div className="px-4 py-4 text-center text-[11px] text-slate-400">Natijalar mavjud emas.</div>
                )}
                {detail && detail.length > 0 && (
                  <div className="max-h-56 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/60">
                    {detail.map((r, i) => (
                      <div key={r.userUid + i} className="flex items-center gap-3 px-4 py-2">
                        {statusIcon(r.status)}
                        <div className="min-w-0 flex-1">
                          <span className="text-[11px] font-bold text-slate-900 dark:text-white truncate block">{r.name || 'Telegram foydalanuvchisi'}</span>
                          {r.telegramUsername && <span className="text-[10px] text-sky-600 dark:text-sky-400">@{r.telegramUsername}</span>}
                        </div>
                        <span className={`text-[10px] font-black uppercase shrink-0 ${
                          r.status === 'sent' ? 'text-emerald-500' : r.status === 'failed' ? 'text-rose-500' : 'text-slate-400'
                        }`}>
                          {r.status === 'sent' ? 'Yuborildi' : r.status === 'failed' ? 'Xatolik' : "O'tkazib yuborildi"}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};