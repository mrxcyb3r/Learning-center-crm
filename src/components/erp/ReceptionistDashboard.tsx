import React, { useEffect, useState } from 'react';
import {
  PhoneCall,
  CalendarClock,
  UserPlus,
  AlertCircle,
  TrendingUp,
  ChevronRight,
} from 'lucide-react';
import { leadsService, studentsService } from '../../services/repository';
import { Lead, StudentRecord } from '../../types/crm';
import { normalizeLeadStatus } from '../../utils/leads';
import { formatDateTime } from '../../utils/format';

interface Props {
  onNavigateTab: (tabId: string) => void;
}

/**
 * Receptionist operational dashboard — front-desk metrics only.
 * No organization finance (revenue/expenses/profit) is shown here by design.
 */
export const ReceptionistDashboard: React.FC<Props> = ({ onNavigateTab }) => {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [students, setStudents] = useState<StudentRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    Promise.all([
      leadsService.getAllLeads().catch(() => []),
      studentsService.getAllStudents().catch(() => []),
    ]).then(([l, s]) => {
      if (!mounted) return;
      setLeads(l);
      setStudents(s as unknown as StudentRecord[]);
      setLoading(false);
    });
    return () => {
      mounted = false;
    };
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500" />
      </div>
    );
  }

  const today = new Date();
  const todayKey = today.toISOString().split('T')[0];
  const newLeads = leads.filter((l) => normalizeLeadStatus(l.status) === 'New');
  const todayLeads = leads.filter((l) => (l.createdAt || '').startsWith(todayKey));
  const todayTrials = leads.filter(
    (l) => l.trialDateTime && new Date(l.trialDateTime).toDateString() === today.toDateString()
  );
  const followUps = leads.filter((l) => {
    const st = normalizeLeadStatus(l.status);
    return st === 'New' || st === 'Contacted' || st === 'Trial Scheduled';
  });
  const convertedToday = leads.filter(
    (l) =>
      normalizeLeadStatus(l.status) === 'Enrolled' &&
      ((l.conversionDate || '').startsWith(todayKey) || (l.updatedAt || '').startsWith(todayKey))
  );
  const pendingDues = (students as StudentRecord[]).filter(
    (s) => s.paymentStatus === 'Due' || s.paymentStatus === 'Overdue'
  );

  const cards = [
    { label: 'Yangi murojaatlar', value: newLeads.length, hint: `Bugun: ${todayLeads.length} ta`, icon: <PhoneCall className="w-5 h-5" />, tone: 'text-blue-600 dark:text-blue-400' },
    { label: 'Bugungi sinov darslari', value: todayTrials.length, hint: 'Jadval bo‘yicha', icon: <CalendarClock className="w-5 h-5" />, tone: 'text-purple-600 dark:text-purple-400' },
    { label: 'Kuzatuv talab qilinadi', value: followUps.length, hint: 'Aloqa kutilmoqda', icon: <AlertCircle className="w-5 h-5" />, tone: 'text-amber-600 dark:text-amber-400' },
    { label: 'Bugun o‘quvchiga aylandi', value: convertedToday.length, hint: 'Konversiya', icon: <UserPlus className="w-5 h-5" />, tone: 'text-emerald-600 dark:text-emerald-400' },
    { label: 'Kutilayotgan to‘lovlar', value: pendingDues.length, hint: 'Eslatma uchun', icon: <TrendingUp className="w-5 h-5" />, tone: 'text-rose-600 dark:text-rose-400' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
          Qabulxona
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
          {today.toLocaleDateString('uz-UZ', { weekday: 'long', day: 'numeric', month: 'long' })} • Kunlik front-desk holati
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
        {cards.map((c) => (
          <div key={c.label} className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
            <span className={`inline-flex ${c.tone}`}>{c.icon}</span>
            <div className="text-xl sm:text-3xl font-black text-slate-900 dark:text-white mt-2">{c.value}</div>
            <div className="text-[11px] sm:text-xs font-bold text-slate-600 dark:text-slate-300 mt-0.5">{c.label}</div>
            <div className="text-[10px] text-slate-400 mt-0.5">{c.hint}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">Bugun kimlar bilan bog‘lanish kerak</h3>
            <button onClick={() => onNavigateTab('leads')} className="text-xs font-bold text-amber-600 dark:text-amber-400 hover:underline cursor-pointer flex items-center gap-1">
              CRM <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="space-y-2.5">
            {followUps.slice(0, 5).map((l) => (
              <div key={l.id} className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-sm font-bold text-slate-900 dark:text-white truncate">{l.name}</div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                    {l.course} • {l.phone} • {l.status}
                  </div>
                </div>
                <a href={`tel:${l.phone}`} className="shrink-0 px-3 py-1.5 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[11px] font-bold border border-emerald-500/20">
                  Qo‘ng‘iroq
                </a>
              </div>
            ))}
            {followUps.length === 0 && (
              <div className="py-6 text-center text-xs text-slate-400">Kuzatuv kutilayotgan murojaat yo‘q.</div>
            )}
          </div>
        </div>

        <div className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">Bugungi sinov darslari</h3>
            <button onClick={() => onNavigateTab('schedule')} className="text-xs font-bold text-amber-600 dark:text-amber-400 hover:underline cursor-pointer flex items-center gap-1">
              Jadval <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="space-y-2.5">
            {todayTrials.slice(0, 5).map((l) => (
              <div key={l.id} className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800">
                <div className="text-sm font-bold text-slate-900 dark:text-white truncate">{l.name}</div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400">
                  {l.course} • {l.trialDateTime ? formatDateTime(l.trialDateTime) : ''}{l.trialRoom ? ` • ${l.trialRoom}` : ''}
                </div>
              </div>
            ))}
            {todayTrials.length === 0 && (
              <div className="py-6 text-center text-xs text-slate-400">Bugunga belgilangan sinov darsi yo‘q.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
