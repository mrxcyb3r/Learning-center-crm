import React, { useEffect, useState } from 'react';
import { Activity, RefreshCw } from 'lucide-react';
import { getKnowledgeHealth, type KnowledgeHealth } from '../../services/aiReceptionist';

/**
 * Admin/dev diagnostic: is the AI knowledge base actually usable?
 * Real Firestore counts only — never fabricated.
 */
export const AiKnowledgeHealth: React.FC = () => {
  const [health, setHealth] = useState<KnowledgeHealth | null>(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      setHealth(await getKnowledgeHealth());
    } catch {
      setHealth(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  return (
    <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
      <div className="flex items-center justify-between gap-2 mb-3">
        <h3 className="text-xs font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
          <Activity className="w-3.5 h-3.5 text-emerald-500" />
          AI Knowledge Health
        </h3>
        <button
          onClick={load}
          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
          title="Yangilash"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>
      {loading || !health ? (
        <div className="text-xs text-slate-500 dark:text-slate-400">{loading ? 'Tekshirilmoqda...' : 'Ma’lumot olinmadi.'}</div>
      ) : (
        <div className="space-y-2 text-xs">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <div className="px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
              <span className="block text-[10px] font-bold text-slate-500">Public kurslar</span>
              <span className="block text-lg font-black text-slate-900 dark:text-white">{health.courses.total}</span>
              <span className="block text-[10px] text-slate-500">narx: {health.courses.withPrice} • tavsif: {health.courses.withDescription}</span>
            </div>
            <div className="px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
              <span className="block text-[10px] font-bold text-slate-500">O‘qituvchilar</span>
              <span className="block text-lg font-black text-slate-900 dark:text-white">{health.teachers.publicCount}</span>
            </div>
            <div className="px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
              <span className="block text-[10px] font-bold text-slate-500">Faol FAQ</span>
              <span className="block text-lg font-black text-slate-900 dark:text-white">{health.faqs.activeCount}</span>
            </div>
            <div className="px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
              <span className="block text-[10px] font-bold text-slate-500">Markaz</span>
              <span className="block text-[11px] font-bold text-slate-700 dark:text-slate-300">
                Kontakt: {health.center.contactConfigured ? 'HA' : 'YO‘Q'} • Filial: {health.center.branchesConfigured ? 'HA' : 'YO‘Q'} • Soat: {health.center.workingHoursConfigured ? 'HA' : 'YO‘Q'}
              </span>
            </div>
          </div>
          {health.missing.length > 0 && (
            <div className="px-3 py-2 rounded-xl bg-amber-500/10 border border-amber-500/25 text-amber-700 dark:text-amber-300 text-[11px] font-semibold">
              To‘ldirish kerak: {health.missing.join(' • ')}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
