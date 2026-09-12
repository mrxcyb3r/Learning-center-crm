import React, { useEffect, useState, useCallback } from 'react';
import { CheckCircle2, AlertCircle, RefreshCw, Rocket, Loader2 } from 'lucide-react';
import { collection, query, limit, getDocs } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { settingsService } from '../../services/repository';

interface ReadinessItem {
  id: string;
  title: string;
  desc: string;
  ready: boolean;
}

/**
 * Launch-readiness checklist derived from REAL data in the database. Each item
 * is green only when the actual underlying data exists — no placeholder
 * checkmarks. After demo data is cleared this shows exactly what remains
 * "To'ldirilishi kerak".
 */
export const LaunchReadinessCard: React.FC = () => {
  const [items, setItems] = useState<ReadinessItem[]>([]);
  const [loading, setLoading] = useState(true);

  const exists = useCallback(async (col: string): Promise<boolean> => {
    try {
      const snap = await getDocs(query(collection(db, col), limit(1)));
      return !snap.empty;
    } catch (err) {
      console.warn(`[readiness] "${col}" tekshirishda xatolik:`, err?.message || String(err));
      return false;
    }
  }, []);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const [settings, hasCourses, hasTeachers, hasGroups, hasStudents, hasPayments, hasCms, hasRoles] =
        await Promise.all([
          settingsService.getSettings().catch(() => null),
          exists('courses'),
          exists('teachers'),
          exists('groups'),
          exists('students'),
          exists('payments'),
          exists('cms'),
          getDocs(query(collection(db, 'users'), limit(1))).then((s) => !s.empty).catch(() => false),
        ]);

      const centerOk = Boolean(
        settings?.centerName &&
        (settings?.hotline || settings?.branches?.[0]?.address || settings?.email)
      );
      const branchOk = Boolean(settings?.branches && settings.branches.length > 0);
      const telegramOk = Boolean(
        settings?.telegramSettings?.botConnected ||
        settings?.telegramSettings?.botUsername
      );

      setItems([
        {
          id: 'center',
          title: "Markaz ma'lumotlari",
          desc: 'Nomi, manzil, telefon, ish vaqti',
          ready: centerOk,
        },
        { id: 'branches', title: 'Filiallar', desc: 'Filial va asosiy manzil', ready: branchOk },
        { id: 'courses', title: 'Kurslar va narxlar', desc: "Kurslar, narxlar, to'lov shartlari", ready: hasCourses },
        { id: 'teachers', title: "O'qituvchilar", desc: "O'qituvchilar ro'yxati va rollar", ready: hasTeachers },
        { id: 'groups', title: 'Guruhlar va jadval', desc: 'Guruhlar, dars vaqtlari, xonalar', ready: hasGroups },
        { id: 'students', title: "O'quvchilar", desc: "O'quvchilar ro'yxati va guruhlarga taqsimlash", ready: hasStudents },
        { id: 'payments', title: "To'lovlar", desc: "To'lov tizimi va kvitansiyalar tekshiruvi", ready: hasPayments },
        { id: 'telegram', title: 'Telegram', desc: "O'quvchi va xodim ulanishlari", ready: telegramOk },
        { id: 'cms', title: 'Veb-sayt (CMS)', desc: "Barcha kurs, o'qituvchi, natija va FAQ matnlari", ready: hasCms },
        { id: 'roles', title: 'Xodimlar va huquqlar', desc: 'Kirish rollari tasdiqi', ready: hasRoles },
      ]);
    } finally {
      setLoading(false);
    }
  }, [exists]);

  useEffect(() => {
    refresh();
    const onChanged = () => refresh();
    window.addEventListener('centerflow-demo-cleared', onChanged);
    window.addEventListener('centerflow-demo-restored', onChanged);
    return () => {
      window.removeEventListener('centerflow-demo-cleared', onChanged);
      window.removeEventListener('centerflow-demo-restored', onChanged);
    };
  }, [refresh]);

  const ready = items.filter((i) => i.ready).length;
  const gaps = items.filter((i) => !i.ready);
  const allReady = items.length > 0 && gaps.length === 0;

  return (
    <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
      <div className="flex items-center justify-between gap-3 mb-4">
        <div>
          <h4 className="text-sm font-black text-slate-900 dark:text-white">
            Ishga tushirish ro'yxati
          </h4>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Holat ma'lumotlar bazasidagi haqiqiy ma'lumotlar asosida aniqlanadi.
          </p>
        </div>
        <button
          type="button"
          onClick={refresh}
          disabled={loading}
          className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 text-[11px] font-bold flex items-center gap-1.5 transition cursor-pointer disabled:opacity-50"
        >
          <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
          Yangilash
        </button>
      </div>

      {allReady ? (
        <div className="flex flex-col items-center gap-2 p-5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-center">
          <Rocket className="w-6 h-6 text-emerald-500" />
          <div className="text-sm font-black text-emerald-600 dark:text-emerald-400">
            Barcha ro'yxat bandlari to'ldirilgan — markaz ishga tayyor!
          </div>
        </div>
      ) : loading && items.length === 0 ? (
        <div className="flex items-center justify-center gap-2 py-8 text-xs font-bold text-slate-400">
          <Loader2 className="w-4 h-4 animate-spin" />
          Tekshirilmoqda...
        </div>
      ) : (
        <div>
          <div className="mb-3 flex items-center gap-2 text-xs font-bold text-slate-500">
            {ready}/{items.length} to'ldirilgan
            {gaps.length > 0 && (
              <span className="px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 text-[10px] font-black">
                {gaps.length} ta band kutilmoqda
              </span>
            )}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
            {items.map((item) => (
              <div
                key={item.id}
                className={`flex items-start gap-3 p-3.5 rounded-2xl border ${
                  item.ready
                    ? 'bg-slate-50 dark:bg-slate-800/60 border-slate-100 dark:border-slate-800'
                    : 'bg-amber-500/5 dark:bg-amber-500/5 border-amber-500/20'
                }`}
              >
                {item.ready ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                )}
                <div className="min-w-0">
                  <div className="text-xs font-black text-slate-900 dark:text-white">{item.title}</div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">{item.desc}</div>
                  {!item.ready && (
                    <div className="mt-1 text-[10px] font-black text-amber-600 dark:text-amber-400 uppercase tracking-wider">
                      To'ldirilishi kerak
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};