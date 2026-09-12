import React, { useMemo, useState, useCallback, useEffect } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import {
  Search,
  RefreshCw,
  X,
  Globe,
  Send,
  GraduationCap,
  MessageSquare,
  StickyNote,
  Check,
  Mail,
  Calendar,
  User as UserIcon,
  Inbox,
} from 'lucide-react';
import { murojaatlarService } from '../../services/repository';
import { Murojaat, MurojaatStatus } from '../../types/crm';
import { MUROJAAT_STATUSES } from '../../utils/murojaat';
import { formatDateTime, formatPhone } from '../../utils/format';

type StatusFilter = 'Barchasi' | MurojaatStatus;
type SourceFilter = 'Barchasi' | 'website' | 'telegram';
type KindFilter = 'Barchasi' | 'trial' | 'question';

const STATUS_STYLES: Record<MurojaatStatus, string> = {
  'Yangi': 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30',
  "Bog'lanildi": 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30',
  'Jarayonda': 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/30',
  'Yakunlandi': 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30',
  'Bekor qilindi': 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30',
};

const FILTER_BUTTON = (active: boolean) =>
  `px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer whitespace-nowrap border ${
    active
      ? 'bg-amber-500 text-slate-950 border-amber-500 shadow-sm'
      : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
  }`;

export const MurojaatlarView: React.FC<{ onSummaryChange?: (s: { total: number; newCount: number; unread: number }) => void }> = ({ onSummaryChange }) => {
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

  // Keep the open drawer in sync when the underlying data changes.
  useEffect(() => {
    if (!selected) return;
    setSelected(items.find((m) => m.id === selected.id) ?? null);
  }, [items, selected]);

  const summary = useMemo(() => {
    return {
      total: items.length,
      newCount: items.filter((m) => m.status === 'Yangi').length,
      unread: items.filter((m) => !m.isRead).length,
      telegram: items.filter((m) => m.source === 'telegram').length,
      website: items.filter((m) => m.source === 'website').length,
    };
  }, [items]);

  // Keep the shell's sidebar/topbar unread badge in sync with real data.
  useEffect(() => {
    if (onSummaryChange) onSummaryChange(summary);
  }, [summary, onSummaryChange]);

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
      // Mark a new/unread inquiry as read once the admin views it.
      if (!m.isRead) {
        murojaatlarService
          .markRead(m.id, m.kind, true)
          .then(() =>
            setItems((prev) => prev.map((x) => (x.id === m.id ? { ...x, isRead: true } : x)))
          )
          .catch((err) => console.error('Mark read error:', err));
      }
    },
    []
  );

  const applyStatus = useCallback(
    async (status: MurojaatStatus) => {
      if (!selected) return;
      await murojaatlarService.setStatus(selected.id, selected.kind, status);
      setItems((prev) =>
        prev.map((x) => (x.id === selected.id ? { ...x, status } : x))
      );
      setSelected((prev) => (prev ? { ...prev, status } : prev));
    },
    [selected]
  );

  const toggleRead = useCallback(async () => {
    if (!selected) return;
    const next = !selected.isRead;
    await murojaatlarService.markRead(selected.id, selected.kind, next);
    setItems((prev) => prev.map((x) => (x.id === selected.id ? { ...x, isRead: next } : x)));
    setSelected((prev) => (prev ? { ...prev, isRead: next } : prev));
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
            Murojaatlar
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Barcha murojaatlar bir joyda
          </p>
        </div>
        <button
          onClick={load}
          className="self-start px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 text-xs font-bold flex items-center gap-1.5 hover:bg-slate-50 dark:hover:bg-slate-800 transition cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          Yangilash
        </button>
      </div>

      {/* Summary chips */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        <SummaryChip label="Jami" value={summary.total} accent="text-slate-900 dark:text-white" />
        <SummaryChip label="Yangi" value={summary.newCount} accent="text-blue-600 dark:text-blue-400" />
        <SummaryChip label="O'qilmagan" value={summary.unread} accent="text-amber-600 dark:text-amber-400" />
        <SummaryChip label="Telegram" value={summary.telegram} accent="text-sky-600 dark:text-sky-400" />
        <SummaryChip label="Sayt" value={summary.website} accent="text-emerald-600 dark:text-emerald-400" />
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
          <FilterLabel>Holat:</FilterLabel>
          {(['Barchasi', ...MUROJAAT_STATUSES] as StatusFilter[]).map((s) => (
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
          <FilterLabel>Manba:</FilterLabel>
          {([
            ['Barchasi', null],
            ['Sayt', 'website'],
            ['Telegram', 'telegram'],
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
          <FilterLabel>Turi:</FilterLabel>
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
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500" />
        </div>
      ) : items.length === 0 ? (
        <EmptyState
          icon={<Inbox className="w-6 h-6" />}
          title="Murojaatlar hozircha yo'q"
          subtitle="Sayt yoki Telegram orqali kelgan arizalar shu yerda ko'rinadi."
        />
      ) : filtered.length === 0 ? (
        <EmptyState icon={<Search className="w-6 h-6" />} title="Murojaat topilmadi" subtitle="Filtrlarni o'zgartirib ko'ring." />
      ) : (
        <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 overflow-hidden">
          {/* Desktop header */}
          <div className="hidden md:grid md:grid-cols-[minmax(190px,1.5fr)_90px_110px_minmax(120px,1fr)_minmax(180px,2fr)_130px_110px] gap-3 px-5 py-2.5 text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 border-b border-slate-200 dark:border-slate-800">
            <span>Murojaatchi</span>
            <span>Manba</span>
            <span>Turi</span>
            <span>Kurs</span>
            <span>Xabar</span>
            <span>Sana</span>
            <span>Holat</span>
          </div>

          {filtered.map((m) => (
            <RowItem key={m.id} m={m} onOpen={openDetail} />
          ))}
        </div>
      )}

      {/* Detail drawer */}
      <AnimatePresence>
        {selected && (
          <DetailDrawer
            m={selected}
            notesDraft={notesDraft}
            setNotesDraft={setNotesDraft}
            saving={saving}
            onClose={() => setSelected(null)}
            onStatus={applyStatus}
            onToggleRead={toggleRead}
            onSaveNotes={saveNotes}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

/* ---------------------------------------------------------------------- */

function SummaryChip({ label, value, accent }: { label: string; value: number; accent: string }) {
  return (
    <div className="px-4 py-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
      <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 block">{label}</span>
      <span className={`text-2xl font-black mt-0.5 block ${accent}`}>{value}</span>
    </div>
  );
}

function FilterLabel({ children }: { children: React.ReactNode }) {
  return (
    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 w-12">
      {children}
    </span>
  );
}

function SourceBadge({ m }: { m: Murojaat }) {
  if (m.source === 'telegram') {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-bold bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/30">
        <Send className="w-3 h-3" /> Telegram
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
      <Globe className="w-3 h-3" /> Sayt
    </span>
  );
}

function KindBadge({ m }: { m: Murojaat }) {
  if (m.kind === 'trial') {
    return (
      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-600 dark:text-amber-400">
        <GraduationCap className="w-3.5 h-3.5" /> Sinov darsi
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-violet-600 dark:text-violet-400">
      <MessageSquare className="w-3.5 h-3.5" /> Savol
    </span>
  );
}

function StatusBadge({ status }: { status: MurojaatStatus }) {
  return (
    <span className={`inline-flex px-2 py-0.5 rounded-lg text-[10px] font-bold border ${STATUS_STYLES[status]}`}>
      {status}
    </span>
  );
}

function RowItem({ m, onOpen }: { m: Murojaat; onOpen: (m: Murojaat) => void }) {
  return (
    <button
      onClick={() => onOpen(m)}
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
          <StatusBadge status={m.status} />
        </div>
        <div className="mt-1.5 flex items-center gap-2 flex-wrap">
          <SourceBadge m={m} />
          <KindBadge m={m} />
          {m.course && <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 truncate">{m.course}</span>}
        </div>
        {m.message && (
          <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400 line-clamp-1">{m.message}</p>
        )}
        <p className="mt-1.5 text-[10px] text-slate-400 dark:text-slate-500">{formatDateTime(m.createdAt)}</p>
      </div>

      {/* Desktop row */}
      <div className="hidden md:grid md:grid-cols-[minmax(190px,1.5fr)_90px_110px_minmax(120px,1fr)_minmax(180px,2fr)_130px_110px] gap-3 items-center px-5 py-2.5">
        <div className="flex items-center gap-2 min-w-0">
          {!m.isRead && <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />}
          <div className="min-w-0">
            <div className="text-xs font-bold text-slate-900 dark:text-white truncate">{m.name}</div>
            {m.telegramUsername ? (
              <div className="text-[10px] text-sky-600 dark:text-sky-400 font-semibold truncate">@{m.telegramUsername}</div>
            ) : m.phone ? (
              <div className="text-[10px] text-slate-400 font-medium truncate">{formatPhone(m.phone)}</div>
            ) : null}
          </div>
        </div>
        <SourceBadge m={m} />
        <KindBadge m={m} />
        <span className="text-[11px] font-medium text-slate-600 dark:text-slate-400 truncate">{m.course || '-'}</span>
        <span className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1">{m.message || '-'}</span>
        <span className="text-[11px] text-slate-500 dark:text-slate-400">{formatDateTime(m.createdAt)}</span>
        <StatusBadge status={m.status} />
      </div>
    </button>
  );
}

function DetailField({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-0.5">{label}</div>
      <div className="text-xs font-semibold text-slate-800 dark:text-slate-200">{value || '-'}</div>
    </div>
  );
}

function DetailDrawer({
  m,
  notesDraft,
  setNotesDraft,
  saving,
  onClose,
  onStatus,
  onToggleRead,
  onSaveNotes,
}: {
  m: Murojaat;
  notesDraft: string;
  setNotesDraft: (v: string) => void;
  saving: boolean;
  onClose: () => void;
  onStatus: (s: MurojaatStatus) => void;
  onToggleRead: () => void;
  onSaveNotes: () => void;
}) {
  const telegramUrl =
    m.telegramUsername || m.telegramChatId
      ? `https://t.me/${m.telegramUsername || ''}`
      : null;

  return (
    <>
      <motion.div
        className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      />
      <motion.aside
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'tween', duration: 0.22 }}
        className="fixed inset-y-0 right-0 z-50 w-full max-w-md bg-white dark:bg-slate-900 shadow-2xl border-l border-slate-200 dark:border-slate-800 flex flex-col"
      >
        {/* Drawer header */}
        <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-base font-black text-slate-900 dark:text-white truncate">{m.name}</h3>
              <SourceBadge m={m} />
            </div>
            <div className="mt-1 flex items-center gap-2 text-[10px] text-slate-500 dark:text-slate-400">
              <KindBadge m={m} />
              {m.telegramUsername && <span>@{m.telegramUsername}</span>}
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
          {/* Telegram connection state */}
          {m.source === 'telegram' && (
            <div
              className={`px-3.5 py-2.5 rounded-xl border text-xs font-bold flex items-center gap-2 ${
                m.telegramChatId
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400'
                  : 'bg-slate-500/10 border-slate-500/30 text-slate-500 dark:text-slate-400'
              }`}
            >
              <Check className="w-4 h-4" />
              {m.telegramChatId ? 'Telegram ulangan' : 'Telegram ulanmagan'}
            </div>
          )}

          {/* Details */}
          <div className="grid grid-cols-2 gap-x-4 gap-y-3 rounded-xl border border-slate-200 dark:border-slate-800 p-4 bg-slate-50/50 dark:bg-slate-950/30">
            <DetailField label="F.I.Sh." value={m.name} />
            <DetailField label="Telefon" value={<a className="hover:text-amber-500" href={`tel:${m.phone}`}>{formatPhone(m.phone)}</a>} />
            <DetailField label="Kurs" value={m.course} />
            <DetailField label="Manba" value={m.source === 'telegram' ? 'Telegram' : 'Sayt'} />
            <DetailField label="Turi" value={m.kind === 'trial' ? 'Sinov darsi' : 'Savol'} />
            <DetailField label="Sana" value={formatDateTime(m.createdAt)} />
            {m.assignedTo && <DetailField label="Mas'ul" value={m.assignedTo} />}
            {m.preferredContact && <DetailField label="Aloqa usuli" value={m.preferredContact} />}
            {m.email && <DetailField label="Email" value={m.email} />}
          </div>

          {/* Telegram identity (questions & leads carry ids) */}
          {m.source === 'telegram' && (m.telegramUserId || m.telegramChatId) && (
            <div className="space-y-1.5 rounded-xl border border-slate-200 dark:border-slate-800 p-4">
              <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-1">
                Telegram ma'lumotlari
              </div>
              {m.telegramUsername && (
                <div className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300">
                  <Send className="w-3.5 h-3.5 text-sky-500" />
                  @{m.telegramUsername}
                  {telegramUrl && (
                    <a href={telegramUrl} target="_blank" rel="noopener noreferrer" className="text-sky-500 hover:underline ml-auto text-[10px] font-bold">
                      Profil
                    </a>
                  )}
                </div>
              )}
              {m.telegramUserId && (
                <div className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300">
                  <UserIcon className="w-3.5 h-3.5 text-slate-400" />
                  Telegram ID: {m.telegramUserId}
                </div>
              )}
              {m.telegramChatId && (
                <div className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300">
                  <Mail className="w-3.5 h-3.5 text-slate-400" />
                  Chat ID: {m.telegramChatId}
                </div>
              )}
            </div>
          )}

          {/* Message / submitted info */}
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 p-4 bg-slate-50/50 dark:bg-slate-950/30">
            <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-1.5">
              {m.kind === 'question' ? 'To\'liq matn' : 'Ariza ma\'lumotlari'}
            </div>
            <p className="text-xs leading-relaxed text-slate-700 dark:text-slate-300 whitespace-pre-wrap">
              {m.message || 'Qo\'shimcha ma\'lumot kiritilmagan.'}
            </p>
            <div className="mt-3 grid grid-cols-1 gap-1.5 text-[11px] text-slate-500 dark:text-slate-400">
              {m.kind === 'trial' && m.trialDateTime && (
                <span className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" /> Sinov vaqti: {formatDateTime(m.trialDateTime)}</span>
              )}
              {m.kind === 'question' && m.preferredContact === 'telegram' && (
                <span className="flex items-center gap-1.5"><Send className="w-3.5 h-3.5" /> Telegram orqali bog'lanishni so'radi</span>
              )}
            </div>
          </div>

          {/* Status actions */}
          <div>
            <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-2">Holat</div>
            <div className="flex flex-wrap gap-1.5">
              {MUROJAAT_STATUSES.map((s) => (
                <button
                  key={s}
                  onClick={() => onStatus(s)}
                  className={`px-2.5 py-1.5 rounded-lg text-[11px] font-bold border transition cursor-pointer ${
                    m.status === s
                      ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 border-slate-900 dark:border-white'
                      : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* Read toggle */}
          <button
            onClick={onToggleRead}
            className="w-full py-2 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition cursor-pointer"
          >
            {m.isRead ? "O'qilmagan deb belgilash" : "O'qilgan deb belgilash"}
          </button>

          {/* Internal notes */}
          <div>
            <div className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-2">
              <StickyNote className="w-3.5 h-3.5" /> Ichki izohlar
            </div>
            <textarea
              value={notesDraft}
              onChange={(e) => setNotesDraft(e.target.value)}
              rows={4}
              placeholder="Admin uchun ichki izoh (mijozga yuborilmaydi)..."
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs text-slate-800 dark:text-slate-200 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/40 resize-none"
            />
            <button
              onClick={onSaveNotes}
              disabled={saving}
              className="mt-2 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 font-bold text-xs transition cursor-pointer disabled:cursor-not-allowed"
            >
              {saving ? 'Saqlanmoqda...' : 'Izohni saqlash'}
            </button>
          </div>
        </div>
      </motion.aside>
    </>
  );
}

function EmptyState({ icon, title, subtitle }: { icon: React.ReactNode; title: string; subtitle: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 py-16 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center px-6">
      <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400">
        {icon}
      </div>
      <div className="text-sm font-black text-slate-800 dark:text-slate-200">{title}</div>
      <div className="text-xs text-slate-500 dark:text-slate-400 max-w-sm">{subtitle}</div>
    </div>
  );
}