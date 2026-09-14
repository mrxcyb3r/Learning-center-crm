import React, { useEffect, useState } from 'react';
import { Activity, RefreshCw } from 'lucide-react';
import { getKnowledgeHealth, type KnowledgeHealth } from '../../services/aiReceptionist';
import { useLanguage } from '../../context/LanguageContext';

/**
 * Admin/dev diagnostic: is the AI knowledge base actually usable?
 * Real Firestore counts only — never fabricated.
 */
export const AiKnowledgeHealth: React.FC = () => {
  const { language } = useLanguage();
  const t = (uz: string, en: string, ru: string) => (language === 'EN' ? en : language === 'RU' ? ru : uz);
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
          {t('AI Bilim Holati', 'AI Knowledge Health', 'Состояние знаний ИИ')}
        </h3>
        <button
          onClick={load}
          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
          title={t('Yangilash', 'Refresh', 'Обновить')}
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>
      {loading || !health ? (
        <div className="text-xs text-slate-500 dark:text-slate-400">{loading ? t('Tekshirilmoqda...', 'Checking...', 'Проверка...') : t('Ma’lumot olinmadi.', 'No data.', 'Данные не получены.')}</div>
      ) : (
        <div className="space-y-2 text-xs">
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
            <div className="px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
              <span className="block text-[10px] font-bold text-slate-500">{t('Public kurslar', 'Public courses', 'Публичные курсы')}</span>
              <span className="block text-lg font-black text-slate-900 dark:text-white">{health.courses.total}</span>
              <span className="block text-[10px] text-slate-500">{t('narx: ', 'price: ', 'цена: ')}{health.courses.withPrice} {t('• tavsif: ', '• desc: ', '• описание: ')}{health.courses.withDescription}</span>
            </div>
            <div className="px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
              <span className="block text-[10px] font-bold text-slate-500">{t('O‘qituvchilar', 'Teachers', 'Учителя')}</span>
              <span className="block text-lg font-black text-slate-900 dark:text-white">{health.teachers.publicCount}</span>
            </div>
            <div className="px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
              <span className="block text-[10px] font-bold text-slate-500">{t('Faol FAQ', 'Active FAQ', 'Активные FAQ')}</span>
              <span className="block text-lg font-black text-slate-900 dark:text-white">{health.faqs.activeCount}</span>
            </div>
            <div className="px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
              <span className="block text-[10px] font-bold text-slate-500">{t('Natijalar / Grantlar', 'Results / Grants', 'Результаты / Гранты')}</span>
              <span className="block text-lg font-black text-slate-900 dark:text-white">{health.results?.totalCount ?? 0}</span>
              <span className="block text-[10px] text-slate-500">{t('grantlar: ', 'grants: ', 'гранты: ')}{health.results?.grantCount ?? 0}</span>
            </div>
            <div className="px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
              <span className="block text-[10px] font-bold text-slate-500">{t('Markaz', 'Center', 'Центр')}</span>
              <span className="block text-[11px] font-bold text-slate-700 dark:text-slate-300">
                {t('Kontakt: ', 'Contact: ', 'Контакт: ')}{health.center.contactConfigured ? t('HA', 'YES', 'ДА') : t('YO‘Q', 'NO', 'НЕТ')} {t('• Filial: ', '• Branch: ', '• Филиал: ')}{health.center.branchesConfigured ? t('HA', 'YES', 'ДА') : t('YO‘Q', 'NO', 'НЕТ')} {t('• Soat: ', '• Hours: ', '• Часы: ')}{health.center.workingHoursConfigured ? t('HA', 'YES', 'ДА') : t('YO‘Q', 'NO', 'НЕТ')}
              </span>
            </div>
          </div>
          {health.missing.length > 0 && (
            <div className="px-3 py-2 rounded-xl bg-amber-500/10 border border-amber-500/25 text-amber-700 dark:text-amber-300 text-[11px] font-semibold">
              {t('To‘ldirish kerak: ', 'To fill: ', 'Заполнить: ')}{health.missing.join(' • ')}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
