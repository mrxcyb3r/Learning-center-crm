import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Award, CheckCircle2, GraduationCap, School, ShieldCheck, Sparkles, Filter } from 'lucide-react';
import { StudentResult } from '../../types/crm';
import { INITIAL_RESULTS } from '../../services/crmService';

interface ResultsSectionProps {
  results?: StudentResult[];
}

export const ResultsSection: React.FC<ResultsSectionProps> = ({
  results = INITIAL_RESULTS,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('Barchasi');

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
            Bitiruvchilarimiz Natijalari (2025–2026)
          </h2>
          <p className="text-base sm:text-lg text-slate-600 dark:text-slate-400 mt-3">
            76.2% o'quvchilarimiz davlat granti va to'lov-shartnoma asosida nufuzli OTMlarga qabul qilindi.
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
            {filteredResults.map((res, idx) => {
              const isGrant = res.admissionType === 'Grant' || res.score.includes('187.9');
              return (
                <motion.div
                  key={res.id}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.35, delay: idx * 0.05 }}
                  className={`rounded-3xl p-7 flex flex-col justify-between transition-all duration-300 ${
                    isGrant
                      ? 'bg-white dark:bg-slate-900 border-2 border-amber-500 shadow-xl shadow-amber-500/10'
                      : 'bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 shadow-md hover:border-slate-300 dark:hover:border-slate-700'
                  }`}
                >
                  <div>
                    {/* Top Badges */}
                    <div className="flex items-center justify-between gap-2 mb-4">
                      <span className={`px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-wider ${
                        isGrant
                          ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                          : 'bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/30'
                      }`}>
                        {res.admissionType ? `${res.admissionType} Asosida` : 'OTMga Qabul'}
                      </span>
                      <span className="text-xs text-slate-400 font-mono">
                        {res.year || '2025–2026'}
                      </span>
                    </div>

                    {/* Student Name */}
                    <h3 className="text-lg font-black text-slate-900 dark:text-white leading-tight">
                      {res.studentName}
                    </h3>

                    {/* High Score Banner */}
                    <div className="my-4 p-4 rounded-2xl bg-amber-500/10 dark:bg-amber-400/10 border border-amber-500/20 flex items-center justify-between">
                      <div>
                        <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                          Natija / Ball
                        </span>
                        <span className="text-2xl font-black text-amber-600 dark:text-amber-400 tracking-tight">
                          {res.score}
                        </span>
                      </div>
                      <Award className="w-8 h-8 text-amber-500" />
                    </div>

                    {/* University & Direction */}
                    <div className="space-y-2 mt-4 text-xs text-slate-600 dark:text-slate-300">
                      <div className="flex items-start gap-2">
                        <School className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                        <span className="font-bold text-slate-900 dark:text-white">
                          {res.university}
                        </span>
                      </div>
                      <div className="flex items-start gap-2 text-slate-500 dark:text-slate-400 pl-6">
                        <span>Yo'nalish: <strong className="text-slate-700 dark:text-slate-300">{res.fieldOfStudy}</strong></span>
                      </div>
                    </div>
                  </div>

                  {/* Footer Tag */}
                  {res.badge && (
                    <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center gap-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>{res.badge}</span>
                    </div>
                  )}
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>

        {/* Universities List Banner */}
        <div className="mt-16 p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm text-center">
          <h4 className="text-xs font-bold uppercase tracking-widest text-amber-600 dark:text-amber-400 mb-4">
            Bitiruvchilarimiz Talaba Bo'lgan Yetakchi Oliy Ta'lim Muassasalari
          </h4>
          <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-6 text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-300">
            <span className="px-3.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
              🎓 O'zDJTU (Jahon tillari)
            </span>
            <span className="px-3.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
              ⚖️ Akademiya & Yurisprudensiya
            </span>
            <span className="px-3.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
              🏥 TDTU (Tibbiyot)
            </span>
            <span className="px-3.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
              📚 GulDU (Guliston)
            </span>
            <span className="px-3.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
              📐 JDPU (Pedagogika)
            </span>
            <span className="px-3.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
              🌐 O'zMU Jizzax filiali
            </span>
          </div>
        </div>
      </div>
    </section>
  );
};
