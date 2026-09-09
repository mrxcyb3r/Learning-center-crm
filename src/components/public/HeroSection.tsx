import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Sparkles, ArrowRight, Award, GraduationCap, CheckCircle2, ShieldCheck, Users, Calendar, Phone, User, BookOpen, Send, Check } from 'lucide-react';
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
  const [cms, setCms] = useState<CmsData>(crmService.getCmsData());
  const [courses, setCourses] = useState<string[]>([]);
  const [leadName, setLeadName] = useState('');
  const [leadPhone, setLeadPhone] = useState('+998 ');
  const [selectedCourse, setSelectedCourse] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  useEffect(() => {
    const loadedCms = crmService.getCmsData();
    setCms(loadedCms);
    const activeCourses = crmService.getCourses().filter((c) => c.isActive && c.isPublic !== false);
    const courseTitles = activeCourses.map((c) => c.title);
    setCourses(courseTitles);
    if (courseTitles.length > 0) {
      setSelectedCourse(courseTitles[0]);
    }
  }, []);

  const stats = [
    { label: "OTMga kirish ko'rsatkichi", value: cms.stats?.universityAdmissions || '76.2%', icon: GraduationCap, note: '2025–2026 mavsumi' },
    { label: "Talaba bo'lgan bitiruvchilar", value: cms.stats?.studentAdmittedRatio || '16 / 21', icon: Users, note: 'Nufuzli davlat oliygohlariga' },
    { label: 'Eng yuqori DTM ball', value: cms.stats?.highestDtmScore || '187.9', icon: Award, note: 'Hasanboyeva Sevinch (O\'zDJTU)' },
    { label: 'Davlat granti sohiblari', value: cms.stats?.stateGrantsCount || '2 ta', icon: ShieldCheck, note: '100% davlat granti asosida' },
  ];

  const handleQuickLead = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!leadName.trim() || leadPhone.replace(/\D/g, '').length < 9) return;

    try {
      setIsSubmitting(true);
      await crmService.createLead({
        name: leadName.trim(),
        phone: leadPhone.trim(),
        course: selectedCourse || 'Tarix, Huquq, Geografiya',
        source: 'Bosh sahifa (Hero forma)',
        notes: 'Bosh sahifadan bepul sinov darsiga yozildi.',
      });
      setIsSubmitted(true);
      setLeadName('');
      setLeadPhone('+998 ');
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

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
                onClick={() => onOpenTrialModal(selectedCourse || 'Tarix, Huquq, Geografiya')}
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

          {/* Right Column: Fast Registration Lead Card */}
          <div className="lg:col-span-5">
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.55, delay: 0.25 }}
              className="p-7 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border-2 border-amber-500/50 shadow-2xl shadow-amber-500/10 backdrop-blur-xl relative"
            >
              <div className="mb-6">
                <span className="px-3 py-1 rounded-full bg-amber-500/10 text-amber-700 dark:text-amber-400 font-bold text-xs uppercase tracking-wider">
                  Tezkor Ro'yxatdan O'tish
                </span>
                <h3 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white mt-2">
                  Bepul Sinov Darsiga Yoziling
                </h3>
                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
                  15 daqiqa ichida administratorimiz siz bilan bog'lanib qulay vaqtni belgilaydi.
                </p>
              </div>

              {isSubmitted ? (
                <div className="p-6 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-center space-y-3">
                  <div className="w-12 h-12 rounded-full bg-emerald-500 text-white flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/30">
                    <Check className="w-6 h-6 stroke-[3]" />
                  </div>
                  <h4 className="text-lg font-black text-slate-900 dark:text-white">
                    Arizangiz qabul qilindi!
                  </h4>
                  <p className="text-xs text-slate-600 dark:text-slate-300">
                    Tez orada sizga qo'ng'iroq qilamiz. Renessans O'quv Markazini tanlaganingiz uchun rahmat!
                  </p>
                  <button
                    onClick={() => setIsSubmitted(false)}
                    className="text-xs text-amber-600 dark:text-amber-400 font-bold underline cursor-pointer"
                  >
                    Yana ariza yuborish
                  </button>
                </div>
              ) : (
                <form onSubmit={handleQuickLead} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                      F.I.SH (Ismingiz) *
                    </label>
                    <div className="relative">
                      <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        required
                        placeholder="Masalan: Sardor Alimov"
                        value={leadName}
                        onChange={(e) => setLeadName(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 transition"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                      Telefon raqamingiz *
                    </label>
                    <div className="relative">
                      <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="tel"
                        required
                        placeholder="+998 (90) 123-45-67"
                        value={leadPhone}
                        onChange={(e) => setLeadPhone(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-sm font-mono focus:outline-none focus:ring-2 focus:ring-amber-500 transition"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                      Qaysi yo'nalish qiziqtiradi?
                    </label>
                    <div className="relative">
                      <BookOpen className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <select
                        value={selectedCourse}
                        onChange={(e) => setSelectedCourse(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 transition appearance-none cursor-pointer"
                      >
                        {courses.map((c) => (
                          <option key={c} value={c}>
                            {c}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full mt-2 py-3.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-sm shadow-lg shadow-amber-500/20 hover:shadow-amber-500/35 transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
                  >
                    <Send className="w-4 h-4" />
                    <span>{isSubmitting ? 'Yuborilmoqda...' : 'Bepul sinov darsiga yozilish'}</span>
                  </button>

                  <p className="text-[11px] text-center text-slate-400 mt-2">
                    🔒 Ma'lumotlaringiz xavfsiz saqlanadi va Telegramga yuboriladi.
                  </p>
                </form>
              )}
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
      </div>
    </section>
  );
};
