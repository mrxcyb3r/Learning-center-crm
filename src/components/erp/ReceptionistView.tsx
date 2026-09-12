import React, { useMemo, useState, useCallback, useEffect } from 'react';
import {
  Search,
  RefreshCw,
  X,
  LifeBuoy,
  MessageSquare,
  CheckCircle2,
  AlertTriangle,
  Mail,
  Clock,
  User as UserIcon,
  Inbox,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { murojaatlarService } from '../../services/repository';
import { Murojaat, MurojaatStatus } from '../../types/crm';
import { formatDateTime } from '../../utils/format';

type StatusFilter = 'Barchasi' | MurojaatStatus;
type SourceFilter = 'Barchasi' | 'website' | 'telegram';
type KindFilter = 'Barchasi' | 'trial' | 'question';

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

export const ReceptionistView: React.FC = () => {
  const { role } = useAuth();
  const [items, setItems] = useState<Murojaat[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('Barchasi');
  const [sourceFilter, setSourceFilter] = useState<SourceFilter>('Barchasi');
  const [kindFilter, setKindFilter] = useState<KindFilter>('Barchasi');
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
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return haystack.includes(needle);
    });
  }, [items, query, statusFilter, sourceFilter, kindFilter]);

  const openDetail = useCallback(
    (m: Murojaat) => {
      setSelected(m);
      setNotesDraft(m.adminNotes || '');
    },
    []
  );

  const applyStatus = useCallback(async (status: MurojaatStatus) => {
    if (!selected) return;
    // Receptionist can set status to in_progress or resolved
    await murojaatlarService.setStatus(selected.id, selected.kind, status);
    setItems((prev) =>
      prev.map((x) => (x.id === selected.id ? { ...x, status } : x))
    );
    setSelected((prev) => (prev ? { ...prev, status } : prev));
  }, []);

  const toggleRead = useCallback(async () => {
    if (!selected) return;
    const next = !selected.isRead;
    await murojaatlarService.markRead(selected.id, selected.kind, next);
    setItems((prev) =>
      prev.map((x) => (x.id === selected.id ? { ...x, isRead: next } : x))
    );
    setSelected((prev) => (prev ? { ...prev, isRead: next } : prev));
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            Qabulxona
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Mijoz va oquvchi murojaatlari
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

      {/* Summary chips */}
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
          {(['Barchasi', ...Object.keys(STATUS_STYLES).filter(k => typeof k === 'string')] as StatusFilter[]).map((s) => (
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
          <Search className="w-8 h-8 mx-auto mb-3" />
          <h3 className="font-black text-slate-600 dark:text-slate-300">Murojaat topilmadi</h3>
          <p className="text-sm dark:text-slate-400">Filtrlarni o'zgartirib ko'ring.</p>
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
              className="w-full text-left hover:bg-slate-50 dark:hover:bg-slate-800/60 transition cursor-border border-b border-slate-100 dark:border-slate-800/60 last:border-b-0"
            >
              {/* Mobile card */}
              <div className="md:hidden px-4 py-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
                    <span className="text-sm font-bold text-slate-900 dark:text-white truncate">{m.name}</span>
                    {m.telegramUsername && (
                      <span className="text-[10px] text-sky-600 dark:text-sky-400 font-semibold truncate">@{m.telegramUsername}</span>
                    )}
                  </div>
                  <span className="text-[10px] text-slate-400 dark:text-slate-500">{formatDateTime(m.createdAt)}</span>
                </div>
                <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400 line-clamp-2">{m.message || '-'}</p>
              </div>

              {/* Desktop row */}
              <div className="hidden md:grid md:grid-cols-[minmax(180px,1.5fr)_80px_90px_minmax(110px,1fr)_minmax(150px,2fr)_110px_100px] gap-2 items-center px-4 py-2">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
                  <div className="min-w-0">
                    <span className="text-xs font-bold text-slate-900 dark:text-white truncate">{m.name}</span>
                    {m.telegramUsername ? (
                      <span className="text-[10px] text-sky-600 dark:text-sky-400 font-semibold truncate">@{m.telegramUsername}</span>
                    ) : m.phone ? (
                      <span className="text-[10px] text-slate-400 font-medium truncate">+998 (90) 123-45-67</span>
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
    </div>
  );
};