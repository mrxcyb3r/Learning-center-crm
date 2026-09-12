import React, { useState, useEffect, useCallback } from 'react';
import {
  Inbox,
  CheckCircle2,
  LifeBuoy,
  AlertTriangle,
  Mail,
  Clock,
} from 'lucide-react';
import {
  collection,
  query,
  orderBy,
  limit,
  onSnapshot,
  updateDoc,
  doc,
  Timestamp,
} from 'firebase/firestore';
import { db } from '../../services/firebase';

interface SupportRequest {
  id: string;
  subject?: string;
  message?: string;
  priority?: string;
  status?: string;
  userEmail?: string;
  userUid?: string;
  createdAt?: unknown;
  handledBy?: string;
  resolvedAt?: unknown;
}

const STATUS_META: Record<string, { label: string; className: string }> = {
  new: { label: 'Yangi', className: 'bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/30' },
  in_progress: {
    label: 'Jarayonda',
    className: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30',
  },
  resolved: {
    label: 'Yechildi',
    className: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30',
  },
};

function formatDate(value: unknown): string {
  if (value instanceof Timestamp) {
    return value.toDate().toLocaleString('uz-UZ', {
      day: '2-digit',
      month: '2-digit',
      year: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  }
  const date = new Date(String(value));
  return Number.isNaN(date.getTime()) ? '—' : date.toLocaleString('uz-UZ');
}

function formatPriority(value?: string): { label: string; className: string } {
  switch (value) {
    case 'muhim':
      return { label: 'Muhim', className: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30' };
    case 'shoshilinch':
      return { label: 'Shoshilinch', className: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30' };
    default:
      return { label: 'Oddiy', className: 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/30' };
  }
}

export const SupportAdminList: React.FC = () => {
  const [items, setItems] = useState<SupportRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  useEffect(() => {
    const q = query(
      collection(db, 'support_requests'),
      orderBy('createdAt', 'desc'),
      limit(50)
    );
    const unsub = onSnapshot(
      q,
      (snap) => {
        setItems(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as SupportRequest));
        setLoading(false);
        setError(null);
      },
      (err) => {
        console.warn('[SupportAdminList] tinglash xatolik:', err?.message || String(err));
        setError(err?.message || 'So\'rovlar yuklanmadi.');
        setLoading(false);
      }
    );
    return unsub;
  }, []);

  const markStatus = useCallback(async (id: string, status: string) => {
    setUpdatingId(id);
    try {
      const patch: Record<string, unknown> = { status };
      if (status === 'resolved') patch.resolvedAt = new Date().toISOString();
      if (status === 'in_progress') patch.handledAt = new Date().toISOString();
      await updateDoc(doc(db, 'support_requests', id), patch);
    } catch (err: any) {
      console.warn('[SupportAdminList] holat yangilanmadi:', err?.message || String(err));
    } finally {
      setUpdatingId(null);
    }
  }, []);

  const active = items.filter((i) => i.status !== 'resolved').length;
  const fresh = items.filter((i) => i.status === 'new').length;

  return (
    <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-sky-500/10 flex items-center justify-center">
            <Inbox className="w-4 h-4 text-sky-600 dark:text-sky-400" />
          </div>
          <div>
            <h3 className="text-sm font-black text-slate-900 dark:text-white">
              Foydalanuvchi so'rovlari
            </h3>
            <p className="text-[11px] text-slate-400">
              {active > 0
                ? `${active} ta ochiq so'rov (shu jumladan ${items.length} ta oxirgi)`
                : 'Ochiq so\'rovlar yo\'q'}
            </p>
          </div>
        </div>
        {fresh > 0 && (
          <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-[11px] font-black shrink-0">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500" />
            </span>
            Yangi: {fresh}
          </span>
        )}
      </div>

      {error && (
        <div className="flex items-start gap-2.5 p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-xs font-bold text-rose-600 dark:text-rose-400">
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
          {error}
        </div>
      )}

      {loading && !items.length ? (
        <div className="flex items-center justify-center gap-2 py-10 text-xs font-bold text-slate-400">
          <Clock className="w-4 h-4 animate-pulse" />
          So'rovlar yuklanmoqda...
        </div>
      ) : items.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-10 text-slate-400">
          <LifeBuoy className="w-6 h-6" />
          <span className="text-xs font-bold">Hozircha so'rovlar yo'q</span>
        </div>
      ) : (
        <ul className="space-y-3">
          {items.map((req) => {
            const statusMeta = STATUS_META[req.status || 'new'] || STATUS_META.new;
            const priorityMeta = formatPriority(req.priority);
            return (
              <li
                key={req.id}
                className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50/60 dark:bg-slate-800/40 p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-[11px] font-black text-slate-900 dark:text-white truncate">
                        {req.subject || 'Mavzusiz'}
                      </span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-black border ${priorityMeta.className}`}>
                        {priorityMeta.label}
                      </span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-black border ${statusMeta.className}`}>
                        {statusMeta.label}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-300 mt-1.5 line-clamp-3 whitespace-pre-wrap">
                      {req.message}
                    </p>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2 text-[10px] text-slate-400">
                      {req.userEmail && (
                        <span className="flex items-center gap-1">
                          <Mail className="w-3 h-3" />
                          {req.userEmail}
                        </span>
                      )}
                      <span>{formatDate(req.createdAt)}</span>
                    </div>
                  </div>

                  <div className="flex flex-col gap-1.5 shrink-0">
                    {req.status === 'new' && (
                      <button
                        type="button"
                        disabled={updatingId === req.id}
                        onClick={() => markStatus(req.id, 'in_progress')}
                        className="px-3 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-600 dark:text-amber-400 text-[10px] font-black transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Boshlandi
                      </button>
                    )}
                    {req.status !== 'resolved' && (
                      <button
                        type="button"
                        disabled={updatingId === req.id}
                        onClick={() => markStatus(req.id, 'resolved')}
                        className="px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-[10px] font-black flex items-center justify-center gap-1 transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <CheckCircle2 className="w-3 h-3" />
                        Yechildi
                      </button>
                    )}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
};