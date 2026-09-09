import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Award, CheckCircle2, GraduationCap, School, ShieldCheck, Sparkles, Filter } from 'lucide-react';
import { StudentResult } from '../../types/crm';
import { crmService } from '../../services/crmService';

interface ResultsSectionProps {
  results?: StudentResult[];
}

export const ResultsSection: React.FC<ResultsSectionProps> = ({ results: propResults }) => {
  const [results, setResults] = useState<StudentResult[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('Barchasi');

  useEffect(() => {
    if (propResults && propResults.length > 0) {
      setResults(propResults);
    } else {
      const cms = crmService.getCmsData();
      setResults(cms.results || []);
    }
  }, [propResults]);

  const categories = ['Barchasi', 'Davlat granti', 'DTM', 'Milliy Sertifikat', 'CEFR'];

  const filteredResults = selectedCategory === 'Barchasi'
    ? results
    : results.filter((r) => r.category === selectedCategory || r.badge?.includes(selectedCategory));

  return (
    <section id="results" className="py-20 md:py-28 bg-slate-100/50 dark:bg-slate-900/40 border-y border-slate-200/80 dark:border-slate-800/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-12">
          <span className="px-4 py-1.5 rounded-full bg-amber-500/10 text-amber-700 dark:text-amber-400 font-bold text-xs uppercase tracking-wider border border-amber-500/20">
            Haqiqiy Ko'rsatkichlar
          </span>
          <h2 className="text-3xl sm:text-5xl font-black text-slate-900 dark:text-white mt-4 tracking-tight">
            Bitiruvchilarimiz Natijalari
          </h2>
          <p className="text-base sm:text-lg text-slate-600 dark:text-slate-400 mt-3">
            O'quvchilarimizning haqiqiy qabul natijalari. Ma'lumotlar CMS panelidan to'ldiriladi.
          </p>
        </div>

        {/* Filter Badges */}
        <div className="flex flex-wrap items-center justify-center gap-2 mb-12">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-2 rounded-full text-xs font-bold transition cursor-pointer ${
                selectedCategory === cat
                  ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                  : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Results Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          <AnimatePresence>
            {filteredResults.length === 0 && (
              <div className="col-span-full py-16 text-center text-sm text-slate-400">
                Hozircha ma'lumot yo'q. Natijalar CMS paneli («Veb-sayt Kontenti») orqali qo'shiladi.
              </div>
            )}
            {filteredResults.map((res, idx) => {
              const isGrant = res.admissionType === 'Grant' || res.badge?.includes('Grant');
              return (
                <motion.div
                  key={res.id || idx}
                  layout
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.35, delay: idx * 0.05 }}
                  className={`relative p-7 rounded-3xl flex flex-col justify-between transition-all duration-300 ${
                    isGrant
                      ? 'bg-white dark:bg-slate-900 border-2 border-amber-500/80 shadow-xl shadow-amber-500/10'
                      : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-md hover:border-slate-300 dark:hover:border-slate-700'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-xs font-black text-amber-600 dark:text-amber-400 uppercase tracking-wider">
                        {res.subject}
                      </span>
                      <span
                        className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                          isGrant
                            ? 'bg-amber-500 text-slate-950 shadow-sm'
                            : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                        }`}
                      >
                        {res.badge || (isGrant ? '100% Davlat Granti' : 'Talaba')}
                      </span>
                    </div>

                    <div className="flex items-baseline gap-2 mt-1">
                      <span className="text-3xl font-black text-slate-900 dark:text-white font-mono">
                        {res.score}
                      </span>
                      <span className="text-xs text-slate-400 font-semibold">natija</span>
                    </div>

                    <h3 className="text-xl font-black text-slate-900 dark:text-white mt-3">
                      {res.studentName}
                    </h3>

                    <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 space-y-2 text-xs">
                      <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                        <GraduationCap className="w-4 h-4 text-amber-500 shrink-0" />
                        <span className="font-semibold">{res.university}</span>
                      </div>
                      {res.mentor && (
                        <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                          <span>Ustoz: {res.mentor}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-400">
                    <span>Mavsum: {res.year || '2025–2026'}</span>
                    <span className="font-bold text-amber-600 dark:text-amber-400">Renessans LC</span>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
};
