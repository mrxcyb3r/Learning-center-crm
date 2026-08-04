import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { APP_ASSETS } from '../constants/assets';
import { SafeImage } from './common/SafeImage';
import { useLanguage } from '../context/LanguageContext';
import { GraduationCap, School, CheckCircle2, Sparkles, ArrowRight } from 'lucide-react';

interface RoleShowcaseSectionProps {
  onOpenAuth?: () => void;
}

export const RoleShowcaseSection: React.FC<RoleShowcaseSectionProps> = ({ onOpenAuth }) => {
  const [activeRole, setActiveRole] = useState<'student' | 'teacher'>('student');
  const { translate } = useLanguage();

  const studentFeatures = [
    translate("IELTS Band 8.5+ maqsadli radar diagrammalari va ko'nikmalar tahlili", "Target Band 8.0+ radar charts & skill breakdowns", "Целевые радары Band 8.0+ и детализация навыков"),
    translate("24/7 AI Tutor va insholarni avtomatik baholash tizimi", "Instant 24/7 AI Tutor homework assistance & essay grading", "Круглосуточный AI Репетитор и автоматическая проверка эссе"),
    translate("Davomat ketma-ketligi (streak) va o'quvchilar yetakchilik jadvali (leaderboard)", "Live attendance streak tracking and group leaderboards", "Отслеживание посещаемости и рейтинговая таблица студентов")
  ];

  const teacherFeatures = [
    translate("Bir bosing bilan o'quvchilar diagnostikasi va natijalar tahlili", "One-click student performance diagnostic reviews", "Диагностические обзоры успеваемости студентов в один клик"),
    translate("Telegram bot orqali tezkor bildirishnomalar integratsiyasi", "Seamless Telegram notifications & instant feedback queue", "Интеграция с Telegram-ботом и мгновенные уведомления"),
    translate("Writing va Speaking modullari uchun avtomatlashtirilgan baholash", "Automated band scoring for Writing & Speaking modules", "Автоматическая оценка модулей Writing и Speaking")
  ];

  return (
    <section className="py-16 px-4 max-w-7xl mx-auto" id="role-showcase">
      {/* HEADER */}
      <div className="text-center mb-10">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-bold uppercase tracking-wider mb-4">
          <Sparkles className="w-3.5 h-3.5" />
          <span>{translate("Interaktiv UI Tajribasi", "Interactive UI Showcase", "Интерактивный UI Обзор")}</span>
        </div>

        <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight mb-3">
          {translate(
            "Yuqori Natijadorlar va O'qituvchilar Uchun Mo'ljallangan",
            "Designed for High Performers & Educators",
            "Разработано для Студентов и Преподавателей"
          )}
        </h2>
        <p className="text-sm sm:text-base text-slate-400 max-w-2xl mx-auto">
          {translate(
            "IELTS 8.5+ va CEFR darajasiga intiluvchi o'quvchilar hamda real-vaqtda ta'lim beruvchi o'qituvchilar uchun moslashtirilgan interfeyslarni tajriba qiling.",
            "Experience tailored environments for students aiming for IELTS Band 8.5+ and teachers managing live feedback queues.",
            "Испытайте индивидуальную среду для студентов, стремящихся к IELTS 8.5+, и преподавателей, управляющих обучением."
          )}
        </p>

        {/* ROLE TOGGLE PILLS */}
        <div className="inline-flex p-1.5 bg-slate-900/90 border border-slate-800 rounded-2xl mt-6 shadow-xl backdrop-blur-md">
          <button
            onClick={() => setActiveRole('student')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
              activeRole === 'student'
                ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/25'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
            }`}
          >
            <GraduationCap className="w-4 h-4" />
            <span>{translate("Talaba Interfeysi", "Student Experience", "Студенческий Интерфейс")}</span>
          </button>

          <button
            onClick={() => setActiveRole('teacher')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
              activeRole === 'teacher'
                ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/25'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
            }`}
          >
            <School className="w-4 h-4" />
            <span>{translate("O'qituvchilar Panel", "Teacher Workspace", "Кабинет Преподавателя")}</span>
          </button>
        </div>
      </div>

      {/* SHOWCASE DISPLAY CARD */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center bg-slate-900/80 border border-slate-800 rounded-3xl p-6 lg:p-8 backdrop-blur-md shadow-2xl relative overflow-hidden">
        {/* Background glow overlay */}
        <div className="absolute -top-24 -right-24 w-72 h-72 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* LEFT COLUMN: FEATURES LIST */}
        <div className="lg:col-span-5 space-y-6 z-10">
          <div className="inline-block px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-bold uppercase tracking-wider">
            {activeRole === 'student'
              ? translate("Talaba Portali", "Student Portal", "Студенческий Портал")
              : translate("O'qituvchi Tizimi", "Educator Suite", "Кабинет Преподавателя")}
          </div>

          <h3 className="text-2xl sm:text-3xl font-black text-white leading-tight">
            {activeRole === 'student'
              ? translate(
                  "Real-Vaqtda IELTS Band Kuzatuvi va AI Vazifa Yordamchisi",
                  "Real-Time IELTS Band Tracking & AI Homework",
                  "Отслеживание IELTS Band в реальном времени и AI Помощник"
                )
              : translate(
                  "Avtomatlashtirilgan Insho Tekshiruvi va Sinf Boshqaruvi",
                  "Automated Essay Grading & Class Management",
                  "Автоматическая Проверка Эссе и Управление Классом"
                )}
          </h3>

          <ul className="space-y-3.5">
            {(activeRole === 'student' ? studentFeatures : teacherFeatures).map((feature, i) => (
              <li key={i} className="flex items-start gap-3 text-xs sm:text-sm text-slate-300 font-medium">
                <CheckCircle2 className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                <span>{feature}</span>
              </li>
            ))}
          </ul>

          {onOpenAuth && (
            <div className="pt-2">
              <button
                onClick={onOpenAuth}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs sm:text-sm transition-all shadow-lg shadow-amber-500/20 flex items-center gap-2 cursor-pointer"
              >
                <span>{translate("Tizimga Kirish va Sinab Ko'rish", "Try Interactive Demo", "Попробовать Демо")}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: SCREENSHOT DISPLAY */}
        <div className="lg:col-span-7 z-10">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeRole}
              initial={{ opacity: 0, scale: 0.98, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.98, y: -10 }}
              transition={{ duration: 0.3 }}
              className="relative rounded-2xl overflow-hidden border-2 border-slate-700/80 shadow-2xl group bg-slate-950"
            >
              <div className="bg-slate-900 px-4 py-2 border-b border-slate-800 flex items-center justify-between text-xs text-slate-400">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-500/80" />
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80" />
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80" />
                  <span className="font-mono text-[11px] text-slate-400 ml-2">
                    centerflow.edu.uz/{activeRole}-workspace
                  </span>
                </div>
                <span className="text-[10px] bg-amber-500/10 text-amber-400 border border-amber-500/30 px-2 py-0.5 rounded-md font-bold">
                  Live UI Mockup
                </span>
              </div>

              <SafeImage
                src={activeRole === 'student' ? APP_ASSETS.studentMockup : APP_ASSETS.teacherMockup}
                alt={activeRole === 'student' ? 'Student Workspace UI Preview' : 'Teacher Workspace UI Preview'}
                className="w-full h-auto object-cover group-hover:scale-[1.015] transition-transform duration-500"
                fallbackClassName="w-full h-64 bg-slate-900 flex flex-col items-center justify-center p-6 text-center"
              />
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
};
