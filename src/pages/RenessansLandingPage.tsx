import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import {
  Sparkles,
  ArrowRight,
  Award,
  GraduationCap,
  CheckCircle2,
  ShieldCheck,
  Users,
  Calendar,
  Send,
  Briefcase,
  Phone,
  ArrowUpRight,
  MapPin,
  Clock,
  ExternalLink,
  ChevronDown,
  MessageCircle,
  CheckCircle,
} from 'lucide-react';
import { PublicLayout, useTrialModal } from '../components/public/PublicLayout';
import { SEOHead } from '../components/SEOHead';
import { getSiteUrl, getPublicResults, slugify } from '../utils/content';
import { crmService } from '../services/crmService';
import { cmsBridge } from '../services/cmsBridge';
import { CmsData, CourseData, TeacherRecord, StudentResult, FaqItem } from '../types/crm';
import { CourseCard } from '../components/public/CourseCard';
import { TeacherAvatar } from '../components/common/TeacherAvatar';
import { ShareButton } from '../components/public/ShareDialog';
import { ResultsCarousel } from '../components/public/ResultsCarousel';
import { QuestionForm } from '../components/public/QuestionForm';

// ─── HeroSection ────────────────────────────────────────────────────────────

interface HeroSectionProps {
  onOpenTrialModal: (course?: string) => void;
  onScrollToCourses: () => void;
}

const HeroSection: React.FC<HeroSectionProps> = ({ onOpenTrialModal, onScrollToCourses }) => {
  const cms: CmsData = crmService.getCmsData();
  const [selectedCourse, setSelectedCourse] = useState(() => crmService.getCourses()[0]?.title || 'DTM & Milliy Sertifikat');

  const stats = [
    { label: "OTMga kirish ko'rsatkichi", value: cms.stats?.universityAdmissions || '', icon: GraduationCap, note: 'Joriy mavsum' },
    { label: "Talaba bo'lgan bitiruvchilar", value: cms.stats?.studentAdmittedRatio || '', icon: Users, note: 'Nufuzli davlat oliygohlariga' },
    { label: 'Eng yuqori DTM ball', value: cms.stats?.highestDtmScore || '', icon: Award, note: 'Bitiruvchilar ichida' },
    { label: 'Davlat granti sohiblari', value: cms.stats?.stateGrantsCount || '', icon: ShieldCheck, note: '100% davlat granti asosida' },
  ].filter((s) => s.value !== '');

  const liveStats = [
    { label: "Faol o'quvchilar", value: `${crmService.getStudents().filter((s) => s.status === 'Active').length}`, icon: Users, note: "Barcha yo'nalishlarda", plus: true },
    { label: 'Professional ustozlar', value: `${crmService.getTeachers().filter((t) => t.status === 'Active').length}`, icon: ShieldCheck, note: 'Tajribali mutaxassislar', plus: true },
    { label: 'Faol guruhlar', value: `${crmService.getSchedule().filter((g) => g.status === 'Active').length}`, icon: Calendar, note: 'Haftalik darslar', plus: true },
    { label: 'Ortacha davomat', value: '94%', icon: CheckCircle2, note: 'Oxirgi oyda', plus: false },
  ];

  return (
    <section id="hero" className="relative pt-28 pb-20 md:pt-36 md:pb-28 overflow-hidden">
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-amber-500/10 dark:bg-amber-500/15 rounded-full blur-[120px] pointer-events-none -z-10" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-7 text-center lg:text-left">
            <motion.div
              initial={{ opacity: 0, y: -15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-500/10 dark:bg-amber-400/10 border border-amber-500/30 text-amber-800 dark:text-amber-400 text-xs sm:text-sm font-semibold tracking-wide uppercase mb-6"
            >
              <Sparkles className="w-4 h-4 text-amber-500 animate-pulse" />
              <span>{cms.hero?.badge || "Renessans O'quv Markazi • Yangiobod"}</span>
            </motion.div>

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

          <div className="lg:col-span-5">
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.55, delay: 0.25 }}
              className="p-7 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl relative space-y-5"
            >
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

              <div className="grid grid-cols-2 gap-3">
                {[
                  { value: '94%', label: "O'rtacha davomat" },
                  { value: '48', label: "Faol o'quvchi" },
                  { value: '4', label: 'Faol guruh' },
                  { value: '1', label: 'Professional ustoz' },
                ].map((s, i) => (
                  <div key={i} className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-800">
                    <span className="text-lg font-black text-amber-600 dark:text-amber-400">{s.value}</span>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold mt-0.5">{s.label}</p>
                  </div>
                ))}
              </div>

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

// ─── CoursesSection ─────────────────────────────────────────────────────────

interface CoursesSectionProps {
  onSelectCourseForTrial: (courseTitle: string) => void;
  courses?: CourseData[];
}

const CoursesSection: React.FC<CoursesSectionProps> = ({ onSelectCourseForTrial, courses: propCourses }) => {
  const navigate = useNavigate();
  const [courses, setCourses] = useState<CourseData[]>([]);

  useEffect(() => {
    if (propCourses && propCourses.length > 0) {
      setCourses(propCourses);
    } else {
      const activeCourses = crmService.getCourses().filter((c) => c.isActive && c.isPublic !== false);
      setCourses(activeCourses);
    }
  }, [propCourses]);

  return (
    <section id="courses" className="py-20 md:py-28 bg-slate-100/60 dark:bg-slate-900/40 border-y border-slate-200/80 dark:border-slate-800/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="px-4 py-1.5 rounded-full bg-amber-500/10 text-amber-700 dark:text-amber-400 font-bold text-xs uppercase tracking-wider border border-amber-500/20">
            O'quv Yo'nalishlari
          </span>
          <h2 className="text-3xl sm:text-5xl font-black text-slate-900 dark:text-white mt-4 tracking-tight">
            Bizning Asosiy Kurslarimiz
          </h2>
          <p className="text-base sm:text-lg text-slate-600 dark:text-slate-400 mt-3">
            Har bir kurs zamonaviy metodika, bepul diagnostik testlar va tajribali ustozlar nazoratini o'z ichiga oladi.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          {courses.map((course, idx) => (
            <CourseCard key={course.id} course={course} index={idx} onSelectCourseForTrial={onSelectCourseForTrial} />
          ))}
        </div>

        <div className="text-center mt-12">
          <button
            onClick={() => navigate('/courses')}
            className="px-6 py-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white font-black text-xs uppercase tracking-wider flex items-center gap-2 hover:border-amber-500/50 hover:text-amber-500 transition cursor-pointer shadow-sm"
          >
            <Sparkles className="w-4 h-4 text-amber-500" />
            Barcha kurslarni ko'rish
          </button>
        </div>
      </div>
    </section>
  );
};

// ─── TeachersSection ────────────────────────────────────────────────────────

interface TeachersSectionProps {
  teachers?: TeacherRecord[];
}

const TeachersSection: React.FC<TeachersSectionProps> = ({ teachers: propTeachers }) => {
  const [teachers, setTeachers] = useState<TeacherRecord[]>([]);

  useEffect(() => {
    if (propTeachers && propTeachers.length > 0) {
      setTeachers(propTeachers);
    } else {
      const publicTeachers = crmService.getTeachers().filter((t) => t.isPublic !== false && t.status === 'Active');
      setTeachers(publicTeachers);
    }
  }, [propTeachers]);

  return (
    <section id="teachers" className="py-20 md:py-28">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="px-4 py-1.5 rounded-full bg-amber-500/10 text-amber-700 dark:text-amber-400 font-bold text-xs uppercase tracking-wider border border-amber-500/20">
            Tajribali Mutaxassislar
          </span>
          <h2 className="text-3xl sm:text-5xl font-black text-slate-900 dark:text-white mt-4 tracking-tight">
            Bizning Ustozlarimiz
          </h2>
          <p className="text-base sm:text-lg text-slate-600 dark:text-slate-400 mt-3">
            Milliy sertifikat va DTM imtihonlarida yuzlab o'quvchilarni talabalikka yetaklagan professional pedagoglar.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          {teachers.map((teacher, idx) => (
            <motion.div
              key={teacher.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: idx * 0.08 }}
              className="group rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 flex flex-col justify-between"
            >
              <div>
                <div className="relative h-64 overflow-hidden bg-slate-100 dark:bg-slate-800">
                  <TeacherAvatar
                    photo={teacher.photo}
                    name={teacher.name}
                    gender={teacher.gender}
                    className="w-full h-full"
                    imgClassName="w-full h-full object-cover object-center group-hover:scale-105 transition duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/20 to-transparent pointer-events-none" />

                  <div className="absolute bottom-3 left-4 right-4 flex items-center justify-between text-white text-xs font-semibold">
                    <span className="px-2.5 py-1 rounded-full bg-slate-900/80 backdrop-blur-md border border-white/10 flex items-center gap-1.5">
                      <Briefcase className="w-3.5 h-3.5 text-amber-400" />
                      {teacher.experience}
                    </span>
                    {teacher.studentsCount > 0 && (
                      <span className="px-2.5 py-1 rounded-full bg-amber-500 text-slate-950 font-bold">
                        {teacher.studentsCount} O'quvchi
                      </span>
                    )}
                  </div>
                </div>

                <div className="p-6">
                  <div className="flex items-start justify-between">
                    <div>
                      <Link to={`/teachers/${slugify(teacher.name)}`}>
                        <h3 className="text-xl font-black text-slate-900 dark:text-white group-hover:text-amber-500 transition">
                          {teacher.name}
                        </h3>
                      </Link>
                      <p className="text-xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider mt-1">
                        {teacher.subject || teacher.specialization}
                      </p>
                    </div>
                    <Link
                      to={`/teachers/${slugify(teacher.name)}`}
                      aria-label={`${teacher.name} — profil sahifasi`}
                      className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-300 hover:text-amber-500 hover:border-amber-500/40 border border-transparent transition"
                    >
                      <ArrowUpRight className="w-4 h-4" />
                    </Link>
                  </div>

                  {teacher.qualification && (
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 line-clamp-2">
                      {teacher.qualification}
                    </p>
                  )}

                  {teacher.description && (
                    <p className="text-xs text-slate-600 dark:text-slate-300 mt-2">
                      {teacher.description}
                    </p>
                  )}

                  {teacher.achievements && teacher.achievements.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 space-y-1.5">
                      {teacher.achievements.slice(0, 2).map((ach, aIdx) => (
                        <div key={aIdx} className="flex items-start gap-2 text-xs text-slate-600 dark:text-slate-300">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                          <span>{ach}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="p-6 pt-0">
                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                  <span className="font-mono text-slate-500 dark:text-slate-400 flex items-center gap-1">
                    <Phone className="w-3.5 h-3.5 text-amber-500" />
                    {teacher.phone}
                  </span>
                  {teacher.telegram && (
                    <a
                      href={`https://t.me/${teacher.telegram.replace('@', '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold hover:text-amber-500 flex items-center gap-1 transition"
                    >
                      <Send className="w-3 h-3 text-sky-500" />
                      <span>{teacher.telegram}</span>
                    </a>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

// ─── ResultsSection ─────────────────────────────────────────────────────────

interface ResultsSectionProps {
  results?: StudentResult[];
}

const ResultsSection: React.FC<ResultsSectionProps> = ({ results: propResults }) => {
  const [results, setResults] = useState<StudentResult[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('Barchasi');

  useEffect(() => {
    if (propResults && propResults.length > 0) {
      setResults(getPublicResults(propResults));
    } else {
      const cms = crmService.getCmsData();
      let r = getPublicResults(cms.results || []);
      if (r.length === 0) {
        r = getPublicResults(crmService.getResults());
      }
      setResults(r);
    }
  }, [propResults]);

  const categories = ['Barchasi', 'Davlat granti', 'DTM', 'Milliy Sertifikat', 'CEFR'];

  const filteredResults = selectedCategory === 'Barchasi'
    ? results
    : results.filter((r) => r.category === selectedCategory || r.badge?.includes(selectedCategory));

  return (
    <section id="results" className="py-20 md:py-28 bg-slate-100/50 dark:bg-slate-900/40 border-y border-slate-200/80 dark:border-slate-800/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <span className="px-4 py-1.5 rounded-full bg-amber-500/10 text-amber-700 dark:text-amber-400 font-bold text-xs uppercase tracking-wider border border-amber-500/20">
            Demo Natijalar
          </span>
          <h2 className="text-3xl sm:text-5xl font-black text-slate-900 dark:text-white mt-4 tracking-tight">
            Namuna Bitiruvchi Natijalari
          </h2>
          <p className="text-base sm:text-lg text-slate-600 dark:text-slate-400 mt-3">
            Quyidagi natijalar demo ma'lumotdir va haqiqiy talabalar natijalari bilan aloqasi yo'q.
          </p>
        </div>

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

        <ResultsCarousel
          items={filteredResults}
          cardClassName="w-full sm:w-[calc(50%-0.5rem)] lg:w-[calc(33.333%-0.667rem)] xl:w-[calc(25%-0.75rem)]"
          emptyFallback={
            <div className="py-16 text-center text-sm text-slate-400">
              <Award className="w-10 h-10 mx-auto mb-3 text-slate-300 dark:text-slate-600" />
              Hozircha namuna natijalar mavjud emas.
            </div>
          }
          renderCard={(res, idx) => {
            const isGrant = res.admissionType === 'Grant' || res.badge?.includes('Grant');
            return (
              <div
                key={res.id || idx}
                className={`relative h-full p-6 rounded-3xl flex flex-col justify-between transition-all duration-300 ${
                  isGrant
                    ? 'bg-white dark:bg-slate-900 border-2 border-amber-500/80 shadow-xl shadow-amber-500/10'
                    : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-md'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-[11px] font-black text-amber-600 dark:text-amber-400 uppercase tracking-wider">
                      {res.subject}
                    </span>
                    <span
                      className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                        isGrant
                          ? 'bg-amber-500 text-slate-950'
                          : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                      }`}
                    >
                      {res.badge || (isGrant ? '100% Davlat Granti' : 'Talaba')}
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    <div>
                      <div className="flex items-baseline gap-1.5">
                        <span className="text-3xl font-black text-slate-900 dark:text-white font-mono">
                          {res.score}
                        </span>
                        <span className="text-[10px] text-slate-400 font-semibold">natija</span>
                      </div>
                      {res.previousScore && res.improvement && (
                        <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold">
                          +{res.improvement} ({res.previousScore} → {res.score})
                        </span>
                      )}
                    </div>
                    <GraduationCap className="w-8 h-8 text-amber-500/30 shrink-0" />
                  </div>

                  <h3 className="text-lg font-black text-slate-900 dark:text-white mt-3">
                    {res.studentName}
                  </h3>

                  <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 space-y-1.5 text-xs">
                    <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                      <GraduationCap className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                      <span className="font-semibold line-clamp-1">{res.university}</span>
                    </div>
                    {res.mentor && (
                      <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                        <span>Ustoz: {res.mentor}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-4 text-[11px] text-slate-400">
                    <span>Mavsum: {res.year || '2025–2026'}</span>
                    <span className="font-bold text-amber-600 dark:text-amber-400 hidden sm:inline">Renessans LC</span>
                  </div>
                  <ShareButton
                    title={`${res.studentName} — ${res.score} (Renessans)`}
                    url={`${getSiteUrl()}/#results`}
                    label=""
                    className="px-2 py-1.5"
                  />
                </div>
              </div>
            );
          }}
        />
      </div>
    </section>
  );
};

// ─── FaqSection ─────────────────────────────────────────────────────────────

const FaqSection: React.FC = () => {
  const [faqs, setFaqs] = useState<FaqItem[]>([]);
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  useEffect(() => {
    const cms = crmService.getCmsData();
    if (cms.faqs && cms.faqs.length > 0) {
      setFaqs(cms.faqs);
    }
  }, []);

  const toggle = (idx: number) => {
    setOpenIndex(openIndex === idx ? null : idx);
  };

  return (
    <section id="faq" className="py-20 md:py-28 bg-slate-100/60 dark:bg-slate-900/40">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <span className="px-4 py-1.5 rounded-full bg-amber-500/10 text-amber-700 dark:text-amber-400 font-bold text-xs uppercase tracking-wider border border-amber-500/20">
            Ko'p Beriladigan Savollar
          </span>
          <h2 className="text-3xl sm:text-5xl font-black text-slate-900 dark:text-white mt-4 tracking-tight">
            Savol-Javoblar
          </h2>
          <p className="text-base text-slate-600 dark:text-slate-400 mt-2">
            Markazimiz, dars jarayoni va qabul bo'yicha eng muhim ma'lumotlar.
          </p>
        </div>

        <div className="space-y-4">
          {faqs.map((faq, idx) => {
            const isOpen = openIndex === idx;
            return (
              <div
                key={faq.id || idx}
                className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm transition"
              >
                <button
                  onClick={() => toggle(idx)}
                  className="w-full p-6 text-left flex items-center justify-between gap-4 cursor-pointer"
                >
                  <span className="font-bold text-base sm:text-lg text-slate-900 dark:text-white">
                    {faq.question}
                  </span>
                  <div
                    className={`w-9 h-9 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 transition-transform duration-300 shrink-0 ${
                      isOpen ? 'rotate-180 bg-amber-500/10 text-amber-500' : ''
                    }`}
                  >
                    <ChevronDown className="w-5 h-5" />
                  </div>
                </button>

                <AnimatePresence>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25 }}
                      className="overflow-hidden"
                    >
                      <div className="px-6 pb-6 pt-2 text-sm text-slate-600 dark:text-slate-300 leading-relaxed border-t border-slate-100 dark:border-slate-800/60">
                        {faq.answer}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

// ─── QuestionSection ────────────────────────────────────────────────────────

const QuestionSection: React.FC = () => {
  const [submitted, setSubmitted] = useState(false);

  return (
    <section id="questions" className="py-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-purple-500/10 border border-purple-500/20 mb-6">
            <MessageCircle className="w-4 h-4 text-purple-500" />
            <span className="text-xs font-bold text-purple-600 dark:text-purple-400 uppercase tracking-wider">Savol-javob</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white mb-4">
            Savolingiz bormi?
          </h2>
          <p className="text-lg text-slate-600 dark:text-slate-400 max-w-xl mx-auto">
            Administratorimizga savolingizni yuboring. Biz siz bilan tez orada bog'lanamiz.
          </p>
        </div>

        {submitted ? (
          <div className="text-center py-16 rounded-3xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20">
            <CheckCircle className="w-16 h-16 text-emerald-500 mx-auto mb-4" />
            <h3 className="text-2xl font-black text-emerald-600 mb-2">Savolingiz yuborildi!</h3>
            <p className="text-slate-600 dark:text-slate-400">Tez orada siz bilan bog'lanamiz.</p>
            <button onClick={() => setSubmitted(false)} className="mt-6 px-6 py-2 rounded-xl bg-emerald-500 text-white font-bold text-sm cursor-pointer">
              Yangi savol yuborish
            </button>
          </div>
        ) : (
          <QuestionForm onSuccess={() => setSubmitted(true)} />
        )}
      </div>
    </section>
  );
};

// ─── ContactSection ─────────────────────────────────────────────────────────

interface ContactSectionProps {
  onOpenTrialModal: () => void;
}

const ContactSection: React.FC<ContactSectionProps> = ({ onOpenTrialModal }) => {
  const [contact, setContact] = useState(cmsBridge.getContact());

  useEffect(() => {
    setContact(cmsBridge.getContact());
  }, []);

  return (
    <section id="contact" className="py-20 md:py-28">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="px-4 py-1.5 rounded-full bg-amber-500/10 text-amber-700 dark:text-amber-400 font-bold text-xs uppercase tracking-wider border border-amber-500/20">
            Bog'lanish & Manzillarimiz
          </span>
          <h2 className="text-3xl sm:text-5xl font-black text-slate-900 dark:text-white mt-4 tracking-tight">
            Renessans O'quv Markaziga Tashrif Buyuring
          </h2>
          <p className="text-base sm:text-lg text-slate-600 dark:text-slate-400 mt-3">
            O'quv markazimiz filiallariga keling yoki telefon orqali bepul maslahat oling.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <div className="lg:col-span-5 space-y-4">
            <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                <Phone className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Telefon va Ma'lumot
                </h4>
                <div className="space-y-1 mt-1">
                  <a
                    href={`tel:${contact.phone.replace(/[^+\d]/g, '')}`}
                    className="text-lg font-bold text-slate-900 dark:text-white hover:text-amber-500 transition block font-mono"
                  >
                    {contact.phone}
                  </a>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
                  Har kuni 08:00 dan 20:00 gacha qo'ng'iroqlarga javob beramiz.
                </p>
              </div>
            </div>

            <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-sky-500/10 text-sky-500 flex items-center justify-center shrink-0">
                <Send className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Telegram Murojaat
                </h4>
                <a
                  href={`https://t.me/${contact.telegram.replace('@', '')}`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-lg font-bold text-slate-900 dark:text-white hover:text-sky-500 transition flex items-center gap-1.5 mt-0.5"
                >
                  <span>{contact.telegram}</span>
                  <ExternalLink className="w-4 h-4 text-slate-400" />
                </a>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Savollaringizni yozing, tezkor javob beramiz.
                </p>
              </div>
            </div>

            <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center shrink-0">
                <Clock className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Ish Tartibi
                </h4>
                <p className="text-sm font-bold text-slate-900 dark:text-white mt-1">
                  Dushanba – Shanba: 08:00 – 19:00
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Yakshanba: Haftalik diagnostik sinov testlari kuni
                </p>
              </div>
            </div>
          </div>

          <div className="lg:col-span-7 space-y-6">
            <div className="p-7 rounded-3xl bg-white dark:bg-slate-900 border-2 border-amber-500/30 shadow-md">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-2xl bg-amber-500 text-slate-950 flex items-center justify-center shrink-0 font-black text-lg">
                  1
                </div>
                <div>
                  <span className="px-3 py-1 rounded-full bg-amber-500/10 text-amber-700 dark:text-amber-400 font-black text-[11px] uppercase tracking-wider">
                    Asosiy Bino
                  </span>
                  <h3 className="text-xl font-black text-slate-900 dark:text-white mt-2">
                    RENESSANS O'quv Markazi
                  </h3>
                  <p className="text-sm text-slate-600 dark:text-slate-300 mt-1 flex items-start gap-2">
                    <MapPin className="w-4 h-4 text-amber-500 shrink-0 mt-1" />
                    <span>{contact.branches[0] || "Yangiobod tumani 1-sonli umumiy o'rta ta'lim maktabi binosi"}</span>
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
                    Tarix, huquq, matematika, ona tili va CEFR darslari o'tkaziladigan asosiy filial.
                  </p>
                </div>
              </div>
            </div>

            <div className="p-7 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-md">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-2xl bg-slate-900 dark:bg-slate-800 text-amber-400 flex items-center justify-center shrink-0 font-black text-lg border border-amber-500/20">
                  2
                </div>
                <div>
                  <span className="px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-[11px] uppercase tracking-wider border border-slate-200 dark:border-slate-700">
                    2-Filial
                  </span>
                  <h3 className="text-xl font-black text-slate-900 dark:text-white mt-2">
                    NODIRABEGIM EDUCATION
                  </h3>
                  <p className="text-sm text-slate-600 dark:text-slate-300 mt-1 flex items-start gap-2">
                    <MapPin className="w-4 h-4 text-amber-500 shrink-0 mt-1" />
                    <span>{contact.branches[1] || "Yangiobod tuman texnikumi binosi"}</span>
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
                    Mental arifmetika, ingliz tili va qo'shimcha akademik to'garaklar filiali.
                  </p>
                </div>
              </div>
            </div>

            <div className="p-7 rounded-3xl bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 flex flex-col sm:flex-row items-center justify-between gap-6 shadow-xl shadow-amber-500/20">
              <div>
                <h4 className="text-xl font-black tracking-tight">
                  Savollaringiz bormi?
                </h4>
                <p className="text-xs sm:text-sm font-semibold opacity-90 mt-1">
                  Administratorimizga yoziling yoki 1-bepul sinov darsiga joy band qiling.
                </p>
              </div>
              <button
                onClick={onOpenTrialModal}
                className="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-slate-950 text-amber-400 hover:bg-slate-900 font-black text-xs uppercase tracking-wider transition cursor-pointer shrink-0 shadow-lg"
              >
                Sinov darsiga yozilish
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

// ─── Main Landing Page ──────────────────────────────────────────────────────

export const RenessansLandingPage: React.FC = () => {
  const { openTrial } = useTrialModal();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const trial = searchParams.get('trial');
    if (trial && trial.trim()) {
      openTrial(trial);
    }
  }, [searchParams]);

  const handleScrollToCourses = () => {
    const el = document.getElementById('courses');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <PublicLayout activePage="landing">
      <SEOHead
        title="Renessans O'quv Markazi — DTM, Milliy Sertifikat va CEFR tayyorlovi"
        description="Yangioboddagi nufuzli o'quv markazi. DTM & Milliy sertifikat, Aniq fanlar, CEFR ingliz tili, English Kids, mental arifmetika va ona tili kurslari. Bepul sinov darsi!"
        canonicalUrl={getSiteUrl()}
      />

      <HeroSection onOpenTrialModal={openTrial} onScrollToCourses={handleScrollToCourses} />
      <CoursesSection onSelectCourseForTrial={openTrial} />
      <TeachersSection />
      <ResultsSection />
      <FaqSection />
      <QuestionSection />
      <ContactSection onOpenTrialModal={() => openTrial()} />
    </PublicLayout>
  );
};
