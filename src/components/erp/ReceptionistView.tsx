import React, { useMemo, useState, useCallback, useEffect } from 'react';
import {
  Search,
  RefreshCw,
  X,
  Bot,
  Sparkles,
  Inbox,
} from 'lucide-react';
import { murojaatlarService } from '../../services/repository';
import { Murojaat, MurojaatStatus } from '../../types/crm';
import { formatDateTime, formatPhone } from '../../utils/format';
import { AiKnowledgeHealth } from './AiKnowledgeHealth';

type StatusFilter = 'Barchasi' | MurojaatStatus;
type SourceFilter = 'Barchasi' | 'website' | 'telegram';
type KindFilter = 'Barchasi' | 'trial' | 'question';
type InboxTab = 'all' | 'ai';
type AiFilter = 'Barchasi' | 'answered' | 'operator' | 'teacher' | 'admin';

const STATUS_STYLES: Record<MurojaatStatus, string> = {
  'Yangi': 'bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/30',
  "Bog'lanildi": 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30',
  'Jarayonda': 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/30',
  'Yakunlandi': 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30',
  'Bekor qilindi': 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30',
};

const FILTER_BUTTON = (active: boolean) =>
  `px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer whitespace-nowrap border ${
    active
      ? 'bg-sky-500 text-slate-950 border-sky-500 shadow-sm'
      : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
  }`;

const AI_FILTER_LABELS: Record<AiFilter, string> = {
  'Barchasi': 'Barchasi',
  'answered': 'AI javob berdi',
  'operator': 'Operator kerak',
  'teacher': "O'qituvchiga yuborildi",
  'admin': "Adminga yuborildi",
};

function matchesAiFilter(m: Murojaat, f: AiFilter): boolean {
  switch (f) {
    case 'Barchasi':
      return Boolean(m.aiAnswered || m.aiEscalated);
    case 'answered':
      return Boolean(m.aiAnswered && !m.aiEscalated);
    case 'operator':
      return Boolean(m.aiEscalated && (!m.escalatedTo || m.escalatedTo === 'receptionist'));
    case 'teacher':
      return Boolean(m.aiEscalated && m.escalatedTo === 'teacher');
    case 'admin':
      return Boolean(m.aiEscalated && m.escalatedTo === 'admin');
    default:
      return true;
  }
}

export const ReceptionistView: React.FC = () => {
  const [items, setItems] = useState<Murojaat[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [inboxTab, setInboxTab] = useState<InboxTab>('all');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('Barchasi');
  const [sourceFilter, setSourceFilter] = useState<SourceFilter>('Barchasi');
  const [kindFilter, setKindFilter] = useState<KindFilter>('Barchasi');
  const [aiFilter, setAiFilter] = useState<AiFilter>('Barchasi');
  const [selected, setSelected] = useState<Murojaat | null>(null);
  const [notesDraft, setNotesDraft] = useState('');
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await murojaatlarService.getAll();
      setItems(data);
    } catch (err) {
      console.error('Murojaatlar load error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // Keep selected in sync when underlying data changes.
  useEffect(() => {
    if (!selected) return;
    setSelected(items.find((m) => m.id === selected.id) ?? null);
  }, [items, selected]);

  const summary = useMemo(() => {
    return {
      total: items.length,
      newCount: items.filter((m) => m.status === 'Yangi').length,
      telegram: items.filter((m) => m.source === 'telegram').length,
      website: items.filter((m) => m.source === 'website').length,
    };
  }, [items]);

  // Real AI operational counts — derived from stored conversation metadata only.
  const aiSummary = useMemo(() => {
    const aiItems = items.filter((m) => m.aiAnswered || m.aiEscalated);
    return {
      total: aiItems.length,
      answered: aiItems.filter((m) => m.aiAnswered && !m.aiEscalated).length,
      operator: aiItems.filter((m) => m.aiEscalated && (!m.escalatedTo || m.escalatedTo === 'receptionist')).length,
      teacher: aiItems.filter((m) => m.aiEscalated && m.escalatedTo === 'teacher').length,
      admin: aiItems.filter((m) => m.aiEscalated && m.escalatedTo === 'admin').length,
    };
  }, [items]);

  // Keep the topbar badge in sync.
  useEffect(() => {
    const elem = document.querySelector('[data-receptionist-badge]') as HTMLElement | null;
    if (elem) {
      elem.textContent = summary.newCount.toString();
      elem.style.display = summary.newCount > 0 ? 'block' : 'none';
    }
  }, [summary.newCount]);

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return items.filter((m) => {
      if (inboxTab === 'ai' && !matchesAiFilter(m, aiFilter)) return false;
      if (statusFilter !== 'Barchasi' && m.status !== statusFilter) return false;
      if (sourceFilter !== 'Barchasi' && m.source !== sourceFilter) return false;
      if (kindFilter !== 'Barchasi' && m.kind !== kindFilter) return false;
      if (!needle) return true;
      const haystack = [
        m.name,
        m.phone,
        m.course,
        m.message,
        m.telegramUsername,
        m.origSource,
        m.notes,
        m.aiAnswer,
        m.escalationReason,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return haystack.includes(needle);
    });
  }, [items, query, inboxTab, aiFilter, statusFilter, sourceFilter, kindFilter]);

  const openDetail = useCallback((m: Murojaat) => {
    setSelected(m);
    setNotesDraft(m.adminNotes || '');
    if (!m.isRead) {
      murojaatlarService
        .markRead(m.id, m.kind, true)
        .then(() =>
          setItems((prev) => prev.map((x) => (x.id === m.id ? { ...x, isRead: true } : x)))
        )
        .catch((err) => console.error('Mark read error:', err));
    }
  }, []);

  const applyStatus = useCallback(
    async (status: MurojaatStatus) => {
      if (!selected) return;
      try {
        await murojaatlarService.setStatus(selected.id, selected.kind, status);
        setItems((prev) =>
          prev.map((x) => (x.id === selected.id ? { ...x, status } : x))
        );
        setSelected((prev) => (prev ? { ...prev, status } : prev));
      } catch (err) {
        console.error('Set status error:', err);
      }
    },
    [selected]
  );

  const toggleRead = useCallback(async () => {
    if (!selected) return;
    const next = !selected.isRead;
    try {
      await murojaatlarService.markRead(selected.id, selected.kind, next);
      setItems((prev) =>
        prev.map((x) => (x.id === selected.id ? { ...x, isRead: next } : x))
      );
      setSelected((prev) => (prev ? { ...prev, isRead: next } : prev));
    } catch (err) {
      console.error('Toggle read error:', err);
    }
  }, [selected]);

  const saveNotes = useCallback(async () => {
    if (!selected) return;
    setSaving(true);
    try {
      await murojaatlarService.setAdminNotes(selected.id, selected.kind, notesDraft.trim());
      setItems((prev) =>
        prev.map((x) => (x.id === selected.id ? { ...x, adminNotes: notesDraft.trim() } : x))
      );
      setSelected((prev) => (prev ? { ...prev, adminNotes: notesDraft.trim() } : prev));
    } catch (err) {
      console.error('Save notes error:', err);
    } finally {
      setSaving(false);
    }
  }, [selected, notesDraft]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            Qabulxona
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Mijoz va oquvchi murojaatlari — AI yordamchi bilan
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={load}
            className="self-start px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 text-xs font-bold flex items-center gap-1.5 hover:bg-slate-50 dark:hover:bg-slate-800 transition cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Yangilash
          </button>
          <span className="hidden sm:inline-block text-xs font-bold text-sky-600 dark:text-sky-400" data-receptionist-badge>
            0
          </span>
        </div>
      </div>

      {/* Inbox tabs: all conversations vs AI-handled */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => setInboxTab('all')}
          className={`px-4 py-2 rounded-xl text-xs font-black transition cursor-pointer border ${
            inboxTab === 'all'
              ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 border-slate-900 dark:border-white'
              : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800'
          }`}
        >
          Murojaatlar
        </button>
        <button
          onClick={() => setInboxTab('ai')}
          className={`px-4 py-2 rounded-xl text-xs font-black transition cursor-pointer border flex items-center gap-1.5 ${
            inboxTab === 'ai'
              ? 'bg-sky-500 text-slate-950 border-sky-500'
              : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800'
          }`}
        >
          <Bot className="w-3.5 h-3.5" />
          AI Murojaatlar
          {aiSummary.operator > 0 && (
            <span className="px-1.5 py-0.5 rounded-full bg-amber-500 text-slate-950 text-[10px] font-black">
              {aiSummary.operator}
            </span>
          )}
        </button>
      </div>

      {inboxTab === 'ai' ? (
        <>
          {/* AI operational counts — real stored metadata only, never fabricated */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            <AiChip label="AI ko'rgan" value={aiSummary.total} accent="text-slate-900 dark:text-white" />
            <AiChip label="AI javob berdi" value={aiSummary.answered} accent="text-emerald-600 dark:text-emerald-400" />
            <AiChip label="Operator kerak" value={aiSummary.operator} accent="text-amber-600 dark:text-amber-400" />
            <AiChip label="O'qituvchiga" value={aiSummary.teacher} accent="text-purple-600 dark:text-purple-400" />
            <AiChip label="Adminga" value={aiSummary.admin} accent="text-rose-600 dark:text-rose-400" />
          </div>

          <AiKnowledgeHealth />

          <div className="flex flex-wrap items-center gap-2">
            {(Object.keys(AI_FILTER_LABELS) as AiFilter[]).map((f) => (
              <button
                key={f}
                onClick={() => setAiFilter(f)}
                className={FILTER_BUTTON(aiFilter === f)}
              >
                {AI_FILTER_LABELS[f]}
              </button>
            ))}
          </div>
        </>
      ) : (
        /* Summary chips */
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="px-3 py-2 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 block">Jami</span>
            <span className="text-xl font-black text-slate-900 dark:text-white">{summary.total}</span>
          </div>
          <div className="px-3 py-2 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 block">Yangi</span>
            <span className="text-xl font-black text-emerald-600 dark:text-emerald-400">{summary.newCount}</span>
          </div>
          <div className="px-3 py-2 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 block">Telegram</span>
            <span className="text-xl font-black text-sky-600 dark:text-sky-400">{summary.telegram}</span>
          </div>
          <div className="px-3 py-2 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 block">Sayt</span>
            <span className="text-xl font-black text-emerald-600 dark:text-emerald-400">{summary.website}</span>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Ism, telefon, telegram, xabar yoki kurs bo'yicha qidirish..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-medium text-slate-800 dark:text-slate-200 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/40"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">Holat:</span>
          {(['Barchasi', 'Yangi', "Bog'lanildi", 'Jarayonda', 'Yakunlandi', 'Bekor qilindi'] as StatusFilter[]).map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={FILTER_BUTTON(statusFilter === s)}
            >
              {s}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">Manba:</span>
          {([
            ['Barchasi', null],
            ['Telegram', 'telegram'],
            ['Sayt', 'website'],
          ] as [string, SourceFilter | null][]).map(([label, value]) => (
            <button
              key={label}
              onClick={() => setSourceFilter(value ?? 'Barchasi')}
              className={FILTER_BUTTON(sourceFilter === (value ?? 'Barchasi'))}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">Turi:</span>
          {([
            ['Barchasi', null],
            ['Sinov darsi', 'trial'],
            ['Savol', 'question'],
          ] as [string, KindFilter | null][]).map(([label, value]) => (
            <button
              key={label}
              onClick={() => setKindFilter(value ?? 'Barchasi')}
              className={FILTER_BUTTON(kindFilter === (value ?? 'Barchasi'))}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* List */}
      {loading ? (
        <div className="flex items-center justify-center h-48">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sky-500" />
        </div>
      ) : items.length === 0 ? (
        <div className="p-8 text-center text-slate-500 dark:text-slate-400">
          <Inbox className="w-8 h-8 mx-auto mb-3" />
          <h3 className="font-black text-slate-600 dark:text-slate-300">Murojaatlar yo'q</h3>
          <p className="text-sm dark:text-slate-400">Sayt yoki Telegram orqali kelgan arizalar shu yerda ko'rinadi.</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="p-8 text-center text-slate-500 dark:text-slate-400">
          {inboxTab === 'ai' ? (
            <>
              <Bot className="w-8 h-8 mx-auto mb-3" />
              <h3 className="font-black text-slate-600 dark:text-slate-300">AI murojaatlari yo'q</h3>
              <p className="text-sm dark:text-slate-400">AI javob bergan yoki operatorga yo'naltirgan suhbatlar shu yerda ko'rinadi.</p>
            </>
          ) : (
            <>
              <Search className="w-8 h-8 mx-auto mb-3" />
              <h3 className="font-black text-slate-600 dark:text-slate-300">Murojaat topilmadi</h3>
              <p className="text-sm dark:text-slate-400">Filtrlarni o'zgartirib ko'ring.</p>
            </>
          )}
        </div>
      ) : (
        <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 overflow-hidden">
          {/* Desktop header */}
          <div className="hidden md:grid md:grid-cols-[minmax(180px,1.5fr)_80px_90px_minmax(110px,1fr)_minmax(150px,2fr)_110px_100px] gap-2 px-4 py-2 text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 border-b border-slate-200 dark:border-slate-800">
            <span>Mijoz</span>
            <span>Manba</span>
            <span>Turi</span>
            <span>Kurs</span>
            <span>Xabar</span>
            <span>Sana</span>
            <span>Holat</span>
          </div>

          {filtered.map((m) => (
            <button
              key={m.id}
              onClick={() => openDetail(m)}
              className="w-full text-left hover:bg-slate-50 dark:hover:bg-slate-800/60 transition cursor-pointer border-b border-slate-100 dark:border-slate-800/60 last:border-b-0"
            >
              {/* Mobile card */}
              <div className="md:hidden px-4 py-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2 min-w-0">
                    {!m.isRead && <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />}
                    <span className="text-sm font-bold text-slate-900 dark:text-white truncate">{m.name}</span>
                    {m.telegramUsername && (
                      <span className="text-[10px] text-sky-600 dark:text-sky-400 font-semibold truncate">@{m.telegramUsername}</span>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    {m.aiAnswered && !m.aiEscalated && (
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[9px] font-black border border-emerald-500/30">
                        <Bot className="w-2.5 h-2.5" /> AI
                      </span>
                    )}
                    {m.aiEscalated && (
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-amber-500/10 text-amber-600 dark:text-amber-400 text-[9px] font-black border border-amber-500/30">
                        Operator kerak
                      </span>
                    )}
                    <span className="text-[10px] text-slate-400 dark:text-slate-500">{formatDateTime(m.createdAt)}</span>
                  </div>
                </div>
                <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400 line-clamp-2">{m.message || '-'}</p>
              </div>

              {/* Desktop row */}
              <div className="hidden md:grid md:grid-cols-[minmax(180px,1.5fr)_80px_90px_minmax(110px,1fr)_minmax(150px,2fr)_110px_100px] gap-2 items-center px-4 py-2">
                <div className="flex items-center gap-2 min-w-0">
                  {!m.isRead && <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />}
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-bold text-slate-900 dark:text-white truncate">{m.name}</span>
                      {m.aiAnswered && !m.aiEscalated && (
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[9px] font-black border border-emerald-500/30 shrink-0">
                          <Bot className="w-2.5 h-2.5" /> AI
                        </span>
                      )}
                      {m.aiEscalated && (
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-amber-500/10 text-amber-600 dark:text-amber-400 text-[9px] font-black border border-amber-500/30 shrink-0">
                          Operator kerak
                        </span>
                      )}
                    </div>
                    {m.telegramUsername ? (
                      <span className="text-[10px] text-sky-600 dark:text-sky-400 font-semibold truncate block">@{m.telegramUsername}</span>
                    ) : m.phone ? (
                      <span className="text-[10px] text-slate-400 font-medium truncate block">{formatPhone(m.phone)}</span>
                    ) : null}
                  </div>
                </div>
                <span className="text-[10px] text-slate-500 dark:text-slate-400">{m.source === 'telegram' ? 'Telegram' : 'Sayt'}</span>
                <span className="text-[10px] text-slate-400 dark:text-slate-400">{m.kind === 'trial' ? 'Sinov darsi' : 'Savol'}</span>
                <span className="text-[11px] font-medium text-slate-600 dark:text-slate-400 truncate">{m.course || '-'}</span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1">{m.message || '-'}</span>
                <span className="text-[10px] text-slate-500 dark:text-slate-400">{formatDateTime(m.createdAt)}</span>
                <span className={`inline-flex px-2 py-0.5 rounded-lg text-[10px] font-bold border ${STATUS_STYLES[m.status]}`}>
                  {m.status}
                </span>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Detail drawer */}
      {selected && (
        <>
          <div
            className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm"
            onClick={() => setSelected(null)}
          />
          <aside className="fixed inset-y-0 right-0 z-50 w-full max-w-md bg-white dark:bg-slate-900 shadow-2xl border-l border-slate-200 dark:border-slate-800 flex flex-col">
            <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h3 className="text-base font-black text-slate-900 dark:text-white truncate">{selected.name}</h3>
                <div className="mt-1 flex items-center gap-2 text-[10px] text-slate-500 dark:text-slate-400 flex-wrap">
                  <span>{selected.source === 'telegram' ? 'Telegram' : 'Sayt'}</span>
                  <span>•</span>
                  <span>{selected.kind === 'trial' ? 'Sinov darsi' : 'Savol'}</span>
                  {selected.course && (
                    <>
                      <span>•</span>
                      <span className="truncate">{selected.course}</span>
                    </>
                  )}
                </div>
              </div>
              <button
                onClick={() => setSelected(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
              {/* AI transparency block — visible to receptionist only */}
              {(selected.aiAnswered || selected.aiEscalated) && (
                <div className="rounded-xl border border-sky-500/25 bg-sky-500/5 p-4 space-y-2">
                  <div className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-sky-600 dark:text-sky-400">
                    <Sparkles className="w-3.5 h-3.5" />
                    AI tomonidan javob berildi
                  </div>
                  {selected.aiAnswer && (
                    <p className="text-xs leading-relaxed text-slate-700 dark:text-slate-300 whitespace-pre-wrap">
                      {selected.aiAnswer}
                    </p>
                  )}
                  {selected.aiSources && selected.aiSources.length > 0 && (
                    <div className="text-[11px] text-slate-500 dark:text-slate-400">
                      <span className="font-bold">Manba: </span>
                      {selected.aiSources.join(', ')}
                    </div>
                  )}
                  {selected.aiEscalated && selected.escalationReason && (
                    <div className="text-[11px] text-amber-600 dark:text-amber-400 bg-amber-500/10 border border-amber-500/30 rounded-lg px-2.5 py-2">
                      <span className="font-bold">AI javob bera olmadi: </span>
                      {selected.escalationReason}
                      {selected.escalatedTo && selected.escalatedTo !== 'receptionist' && (
                        <span className="block mt-1 font-bold">
                          Yo'naltirildi: {selected.escalatedTo === 'teacher' ? "O'qituvchiga" : 'Adminga'}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Customer message */}
              <div className="rounded-xl border border-slate-200 dark:border-slate-800 p-4 bg-slate-50/50 dark:bg-slate-950/30">
                <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-1.5">
                  Mijoz xabari
                </div>
                <p className="text-xs leading-relaxed text-slate-700 dark:text-slate-300 whitespace-pre-wrap">
                  {selected.message || "Qo'shimcha ma'lumot kiritilmagan."}
                </p>
                <div className="mt-2 text-[10px] text-slate-400 dark:text-slate-500">
                  {formatDateTime(selected.createdAt)}
                  {selected.phone && ` • ${formatPhone(selected.phone)}`}
                </div>
              </div>

              {/* Status actions */}
              <div>
                <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-2">Holat</div>
                <div className="flex flex-wrap gap-1.5">
                  {(['Yangi', "Bog'lanildi", 'Jarayonda', 'Yakunlandi', 'Bekor qilindi'] as MurojaatStatus[]).map((s) => (
                    <button
                      key={s}
                      onClick={() => applyStatus(s)}
                      className={`px-2.5 py-1.5 rounded-lg text-[11px] font-bold border transition cursor-pointer ${
                        selected.status === s
                          ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 border-slate-900 dark:border-white'
                          : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:text-slate-900 dark:hover:text-white'
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              <button
                onClick={toggleRead}
                className="w-full py-2 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition cursor-pointer"
              >
                {selected.isRead ? "O'qilmagan deb belgilash" : "O'qilgan deb belgilash"}
              </button>

              {/* Internal notes */}
              <div>
                <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-2">
                  Ichki izohlar
                </div>
                <textarea
                  value={notesDraft}
                  onChange={(e) => setNotesDraft(e.target.value)}
                  rows={4}
                  placeholder="Operator uchun ichki izoh (mijozga yuborilmaydi)..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs text-slate-800 dark:text-slate-200 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/40 resize-none"
                />
                <button
                  onClick={saveNotes}
                  disabled={saving}
                  className="mt-2 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 font-bold text-xs transition cursor-pointer disabled:cursor-not-allowed"
                >
                  {saving ? 'Saqlanmoqda...' : 'Izohni saqlash'}
                </button>
              </div>
            </div>
          </aside>
        </>
      )}
    </div>
  );
};

function AiChip({ label, value, accent }: { label: string; value: number; accent: string }) {
  return (
    <div className="px-4 py-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
      <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 block">{label}</span>
      <span className={`text-2xl font-black mt-0.5 block ${accent}`}>{value}</span>
    </div>
  );
}
