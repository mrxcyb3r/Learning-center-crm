import React, { useState, useEffect } from 'react';
import { AlertTriangle, Loader2, CheckCircle2, Eraser, RotateCcw, ShieldCheck } from 'lucide-react';
import { getDemoStats, clearDemoData, DemoStat } from '../../services/demoClear';
import { reseedDemoData } from '../../services/seed';
import { auditService } from '../../services/repository';
import { useAuth } from '../../context/AuthContext';

type PanelState =
  | { status: 'idle' }
  | { status: 'confirm-clear' }
  | { status: 'confirm-restore' }
  | { status: 'working' }
  | { status: 'done'; cleared: number }
  | { status: 'error'; message: string };

/**
 * Demo → Real launch helper: shows exactly which records are demo, and lets an
 * admin clear ONLY the demo namespace (never real data) with explicit typed
 * confirmation and an audit trail. Demo data can be restored for presentations.
 */
export const DemoDataPanel: React.FC = () => {
  const { currentUser } = useAuth();
  const [stats, setStats] = useState<DemoStat[] | null>(null);
  const [typed, setTyped] = useState('');
  const [state, setState] = useState<PanelState>({ status: 'idle' });

  const refresh = async () => {
    setStats(await getDemoStats());
  };

  useEffect(() => {
    refresh();
  }, []);

  const total = (stats || []).reduce((sum, s) => sum + s.count, 0);

  const logAudit = (action: string, details: string) => {
    try {
      const name = currentUser?.email || currentUser?.uid || 'Admin';
      void auditService.logAuditAction(name, action, 'Demo ma\'lumotlar', undefined, details);
    } catch {
      // Audit logging is best-effort.
    }
  };

  const handleClear = async () => {
    if (typed.trim().toUpperCase() !== 'DEMO') return;
    setState({ status: 'working' });
    try {
      const { cleared } = await clearDemoData();
      logAudit('Delete', `Demo ma'lumotlar tozalandi (${cleared} ta yozuv)`);
      window.dispatchEvent(new CustomEvent('centerflow-demo-cleared'));
      setState({ status: 'done', cleared });
      setTyped('');
      await refresh();
    } catch (err: any) {
      setState({ status: 'error', message: err?.message || 'Tozalashda xatolik yuz berdi.' });
    }
  };

  const handleRestore = async () => {
    setState({ status: 'working' });
    try {
      await reseedDemoData();
      logAudit('Create', 'Demo ma\'lumotlar qayta tiklandi');
      window.dispatchEvent(new CustomEvent('centerflow-demo-restored'));
      setState({ status: 'done', cleared: 0 });
      await refresh();
    } catch (err: any) {
      setState({ status: 'error', message: err?.message || 'Tiklashda xatolik yuz berdi.' });
    }
  };

  const busy = state.status === 'working';

  return (
    <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-5">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-2xl bg-rose-500/10 flex items-center justify-center shrink-0">
          <Eraser className="w-5 h-5 text-rose-500" />
        </div>
        <div>
          <h4 className="text-base font-black text-slate-900 dark:text-white">
            Namoyish (demo) ma'lumotlarni boshqarish
          </h4>
          <p className="text-xs text-slate-500 mt-0.5">
            Faqat "demo" deb belgilangan yozuvlar o'chiriladi. Haqiqiy ma'lumotlar, sayt matnlari
            va foydalanuvchi hisoblari hech qachon ta'sirlanmaydi.
          </p>
        </div>
      </div>

      {state.status === 'error' && (
        <div className="flex items-start gap-2.5 p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-xs font-bold text-rose-600 dark:text-rose-400">
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
          {state.message}
        </div>
      )}

      {state.status === 'done' && (
        <div className="flex items-center gap-2.5 p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-xs font-bold text-emerald-600 dark:text-emerald-400">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          {state.cleared > 0
            ? `${state.cleared} ta demo yozuv muvaffaqiyatli tozalandi. Endi haqiqiy ma'lumotlarni kirita olasiz.`
            : 'Demo ma\'lumotlar qayta tiklandi (yoki tozalash uchun yozuv topilmadi).'}
        </div>
      )}

      {/* Demo record summary */}
      {stats && stats.length > 0 ? (
        <div className="rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-2.5 border-b border-slate-200 dark:border-slate-700">
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
              Demo yozuvlar (jami {total} ta)
            </span>
            <button
              type="button"
              onClick={refresh}
              className="text-[11px] font-bold text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition cursor-pointer"
            >
              Yangilash
            </button>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-px bg-slate-200 dark:bg-slate-700">
            {stats.map((s) => (
              <div key={s.collection} className="px-3 py-2 bg-white dark:bg-slate-900">
                <div className="text-xs font-bold text-slate-900 dark:text-white">{s.count}</div>
                <div className="text-[10px] text-slate-400">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-2.5 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs text-slate-500">
          <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
          Demo yozuvlar topilmadi — tizim toza. Haqiqiy ma'lumotlar bilan ishlashga tayyormiz.
        </div>
      )}

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-3">
        {state.status !== 'confirm-clear' && state.status !== 'confirm-restore' && (
          <>
            <button
              type="button"
              disabled={busy || total === 0}
              onClick={() => {
                setState({ status: 'confirm-clear' });
                setTyped('');
              }}
              className="px-4 py-2.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/15 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs font-black flex items-center justify-center gap-2 transition cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Eraser className="w-3.5 h-3.5" />
              Demo ma'lumotlarni tozalash
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={() => {
                setState({ status: 'confirm-restore' });
                setTyped('');
              }}
              className="px-4 py-2.5 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold flex items-center justify-center gap-2 transition cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Demo ma'lumotlarni qaytarish
            </button>
          </>
        )}

        {state.status === 'confirm-clear' && (
          <div className="flex flex-col gap-3 w-full">
            <div className="flex items-start gap-2.5 p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-xs text-rose-700 dark:text-rose-300">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <p>
                Siz <b>{total} ta demo yozuv</b>ni butunlay o'chirmoqchisiz. Bu amalni ortga qaytarib
                bo'lmaydi (faqat demo ma'lumotlarni qayta yuklash orqali tiklash mumkin). Davom etish
                uchun quyiga <b>DEMO</b> so'zini yozing.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                value={typed}
                onChange={(e) => setTyped(e.target.value)}
                placeholder="DEMO"
                autoComplete="off"
                className="flex-1 px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-white font-mono tracking-widest"
              />
              <button
                type="button"
                disabled={typed.trim().toUpperCase() !== 'DEMO' || busy}
                onClick={handleClear}
                className="px-5 py-2.5 rounded-xl bg-rose-500 hover:bg-rose-400 text-white text-xs font-black flex items-center justify-center gap-2 transition cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Eraser className="w-3.5 h-3.5" />}
                {busy ? 'Tozalanmoqda...' : 'Tasdiqlash va o\'chirish'}
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={() => setState({ status: 'idle' })}
                className="px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 text-xs font-bold transition cursor-pointer disabled:opacity-40"
              >
                Bekor qilish
              </button>
            </div>
          </div>
        )}

        {state.status === 'confirm-restore' && (
          <div className="flex flex-col gap-3 w-full">
            <div className="flex items-start gap-2.5 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-700 dark:text-amber-300">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <p>
                Demo ma'lumotlar qayta yuklanadi (taqdimotlar uchun). Ushbu amal yangi demo
                yozuvlarni qo'shadi — haqiqiy ma'lumotlarga ta'sir qilmaydi.
              </p>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                disabled={busy}
                onClick={handleRestore}
                className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black flex items-center justify-center gap-2 transition cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RotateCcw className="w-3.5 h-3.5" />}
                {busy ? 'Tiklanmoqda...' : 'Tiklashni tasdiqlash'}
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={() => setState({ status: 'idle' })}
                className="px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 text-xs font-bold transition cursor-pointer disabled:opacity-40"
              >
                Bekor qilish
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};