import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Sparkles, ArrowRight, Award, GraduationCap, CheckCircle2, ShieldCheck, Users, Calendar, Send } from 'lucide-react';
import { crmService } from '../../services/crmService';
import { CmsData } from '../../types/crm';

interface HeroSectionProps {
  onOpenTrialModal: (course?: string) => void;
  onScrollToCourses: () => void;
}

export const HeroSection: React.FC<HeroSectionProps> = ({
  onOpenTrialModal,
  onScrollToCourses,
}) => {
  const cms: CmsData = crmService.getCmsData();
  const [selectedCourse, setSelectedCourse] = useState(() => crmService.getCourses()[0]?.title || 'DTM & Milliy Sertifikat');

  const stats = [
    { label: "OTMga kirish ko'rsatkichi", value: cms.stats?.universityAdmissions || '', icon: GraduationCap, note: 'Joriy mavsum' },
    { label: "Talaba bo'lgan bitiruvchilar", value: cms.stats?.studentAdmittedRatio || '', icon: Users, note: 'Nufuzli davlat oliygohlariga' },
    { label: 'Eng yuqori DTM ball', value: cms.stats?.highestDtmScore || '', icon: Award, note: 'Bitiruvchilar ichida' },
    { label: 'Davlat granti sohiblari', value: cms.stats?.stateGrantsCount || '', icon: ShieldCheck, note: '100% davlat granti asosida' },
  ].filter((s) => s.value !== '');

  const liveStats = [
    { label: "Faol o'quvchilar", value: `${crmService.getStudents().filter((s) => s.status === 'Active').length}`, icon: Users, note: 'Barcha yo\'nalishlarda', plus: true },
    { label: 'Professional ustozlar', value: `${crmService.getTeachers().filter((t) => t.status === 'Active').length}`, icon: ShieldCheck, note: 'Tajribali mutaxassislar', plus: true },
    { label: 'Faol guruhlar', value: `${crmService.getSchedule().filter((g) => g.status === 'Active').length}`, icon: Calendar, note: 'Haftalik darslar', plus: true },
    { label: 'Ortacha davomat', value: '94%', icon: CheckCircle2, note: 'Oxirgi oyda', plus: false },
  ];

  return (
    <section id="hero" className="relative pt-28 pb-20 md:pt-36 md:pb-28 overflow-hidden">
      {/* Subtle background glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-amber-500/10 dark:bg-amber-500/15 rounded-full blur-[120px] pointer-events-none -z-10" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Left Column: Brand & Value Proposition */}
          <div className="lg:col-span-7 text-center lg:text-left">
            {/* Badge */}
            <motion.div
              initial={{ opacity: 0, y: -15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-500/10 dark:bg-amber-400/10 border border-amber-500/30 text-amber-800 dark:text-amber-400 text-xs sm:text-sm font-semibold tracking-wide uppercase mb-6"
            >
              <Sparkles className="w-4 h-4 text-amber-500 animate-pulse" />
              <span>{cms.hero?.badge || "Renessans O'quv Markazi • Yangiobod"}</span>
            </motion.div>

            {/* Headline */}
            <motion.h1
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, delay: 0.1 }}
              className="text-4xl sm:text-5xl lg:text-6xl font-black text-slate-900 dark:text-white tracking-tight leading-[1.12]"
            >
              Farzandingizning kelajagini{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-600 via-amber-500 to-amber-600 dark:from-amber-400 dark:via-amber-300 dark:to-amber-500">
                bugundan boshlang!
              </span>
            </motion.h1>

            {/* Subheadline */}
            <motion.p
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, delay: 0.2 }}
              className="mt-6 text-lg sm:text-xl text-slate-600 dark:text-slate-300 leading-relaxed max-w-2xl mx-auto lg:mx-0"
            >
              {cms.hero?.subtitle || "Milliy sertifikat, DTM, CEFR va maktab fanlari bo'yicha Yangioboddagi zamonaviy o'quv markazi."}{' '}
              <strong className="text-slate-900 dark:text-white font-bold">
                {cms.hero?.tagline || 'Bilimdan natijaga!'}
              </strong>
            </motion.p>

            {/* CTAs */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, delay: 0.3 }}
              className="mt-8 flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4"
            >
              <button
                onClick={() => onOpenTrialModal(selectedCourse || 'DTM & Milliy Sertifikat')}
                className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-base shadow-xl shadow-amber-500/25 hover:shadow-amber-500/40 transition transform active:scale-95 flex items-center justify-center gap-3 cursor-pointer"
              >
                <span>Bepul sinov darsiga yozilish</span>
                <ArrowRight className="w-5 h-5" />
              </button>

              <button
                onClick={onScrollToCourses}
                className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-800 font-bold text-base transition shadow-sm flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Kurslarni ko'rish</span>
              </button>
            </motion.div>

            {/* Trust Badges */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="mt-10 pt-8 border-t border-slate-200/80 dark:border-slate-800/80 flex flex-wrap items-center justify-center lg:justify-start gap-6 text-xs text-slate-500 dark:text-slate-400 font-medium"
            >
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                <span>100% bepul sinov darsi</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                <span>Tajribali mutaxassis ustozlar</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                <span>Haftalik DTM test sinovlari</span>
              </div>
            </motion.div>
          </div>

          {/* Right Column: Trust + CTA panel */}
          <div className="lg:col-span-5">
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.55, delay: 0.25 }}
              className="p-7 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl relative space-y-5"
            >
              {/* Mini testimonial */}
              <div className="p-4 rounded-2xl bg-amber-500/5 border border-amber-500/20">
                <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider">
                  Demo namuna
                </span>
                <p className="text-sm text-slate-800 dark:text-slate-200 font-semibold mt-1 leading-relaxed italic">
                  "Jasur ustoz tufayli Matematika fanidan 87 ball to'pladim va Davlat grantiga qabul qilindim!"
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 font-medium">
                  — Kamola Nazarova, DTM 1-guruh
                </p>
              </div>

              {/* Quick stats grid */}
              <div className="grid grid-cols-2 gap-3">
                {[
                  { value: '94%', label: 'O\'rtacha davomat' },
                  { value: '48', label: 'Faol o\'quvchi' },
                  { value: '4', label: 'Faol guruh' },
                  { value: '1', label: 'Professional ustoz' },
                ].map((s, i) => (
                  <div key={i} className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-800">
                    <span className="text-lg font-black text-amber-600 dark:text-amber-400">{s.value}</span>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold mt-0.5">{s.label}</p>
                  </div>
                ))}
              </div>

              {/* CTA */}
              <button
                onClick={() => onOpenTrialModal(selectedCourse || 'DTM & Milliy Sertifikat')}
                className="w-full py-3.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-sm shadow-lg shadow-amber-500/20 hover:shadow-amber-500/35 transition flex items-center justify-center gap-2 cursor-pointer"
              >
                <Send className="w-4 h-4" />
                Bepul sinov darsiga yozilish
              </button>

              <p className="text-[11px] text-center text-slate-400">
                15 daqiqa ichida administratorimiz siz bilan bog'lanadi.
              </p>
            </motion.div>
          </div>
        </div>

        {/* Real Statistics Bar */}
        <motion.div
          initial={{ opacity: 0, y: 25 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.45 }}
          className="mt-16 sm:mt-20 grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6"
        >
          {stats.map((stat, idx) => {
            const Icon = stat.icon;
            return (
              <div
                key={idx}
                className="relative p-6 rounded-3xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border border-slate-200/80 dark:border-slate-800/80 shadow-lg shadow-slate-200/30 dark:shadow-none hover:border-amber-500/40 transition group"
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight">
                    {stat.value}
                  </span>
                  <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center group-hover:scale-110 transition">
                    <Icon className="w-5 h-5" />
                  </div>
                </div>
                <h4 className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200">
                  {stat.label}
                </h4>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                  {stat.note}
                </p>
              </div>
            );
          })}
        </motion.div>

        {/* Live center statistics */}
        <motion.div
          initial={{ opacity: 0, y: 25 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="mt-6 grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6"
        >
          {liveStats.map((stat, idx) => {
            const Icon = stat.icon;
            return (
              <div
                key={idx}
                className="relative p-6 rounded-3xl bg-slate-900/5 dark:bg-slate-800/40 backdrop-blur-md border border-slate-200/80 dark:border-slate-800/80 hover:border-amber-500/40 transition group"
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="text-3xl sm:text-4xl font-black text-amber-600 dark:text-amber-400 tracking-tight">
                    {stat.value}
                    {stat.plus && <span className="text-xl font-bold ml-0.5 text-amber-500/60">+</span>}
                  </span>
                  <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center group-hover:scale-110 transition">
                    <Icon className="w-5 h-5" />
                  </div>
                </div>
                <h4 className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200">
                  {stat.label}
                </h4>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                  {stat.note}
                </p>
              </div>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
};
