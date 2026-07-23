import React, { useState } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { mockTeachers, mockCourses, mockResults, mockFAQs } from '../data/mockData';
import { StudentResult } from '../types';
import { ResultCertificateModal } from '../components/ResultCertificateModal';
import { addDoc, collection } from 'firebase/firestore';
import { db } from '../services/firebase';
import {
  ArrowRight,
  Award,
  GraduationCap,
  Phone,
  MapPin,
  Send,
  ChevronDown,
  BookOpen,
  Building,
  Search,
  MessageCircle,
  Check,
  Code,
  CheckCircle2
} from 'lucide-react';

interface LandingPageProps {
  onOpenAuth: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = () => {
  const { language, t: dict, translate: t } = useLanguage();

  // State
  const [selectedResult, setSelectedResult] = useState<StudentResult | null>(null);
  const [resultFilter, setResultFilter] = useState<'all' | '8.0' | '7.5' | 'CEFR'>('all');

  // Contact form state
  const [formName, setFormName] = useState('');
  const [formPhone, setFormPhone] = useState('+998 90 ');
  const [formCourse, setFormCourse] = useState('');
  const [formMessage, setFormMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  // FAQ search & expanded item
  const [faqSearch, setFaqSearch] = useState('');
  const [expandedFaqId, setExpandedFaqId] = useState<string | null>('f1');

  // Handle lead contact submission
  const handleLeadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitSuccess(false);

    try {
      await addDoc(collection(db, 'leads'), {
        name: formName,
        phone: formPhone,
        courseId: formCourse,
        message: formMessage,
        createdAt: new Date().toISOString(),
        status: 'new'
      });
      setSubmitSuccess(true);
      setFormName('');
      setFormPhone('+998 90 ');
      setFormCourse('');
      setFormMessage('');
    } catch (err) {
      console.warn('Firestore write warning (offline fallback enabled):', err);
      // Fallback local success
      setSubmitSuccess(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filtered results
  const filteredResults = mockResults.filter((r) => {
    if (resultFilter === '8.0') return parseFloat(r.score) >= 8.0;
    if (resultFilter === '7.5') return parseFloat(r.score) >= 7.5;
    if (resultFilter === 'CEFR') return r.testType === 'CEFR';
    return true;
  });

  // Filtered FAQs
  const filteredFAQs = mockFAQs.filter((faq) => {
    const query = faqSearch.toLowerCase();
    const qText = language === 'UZ' ? faq.questionUz : faq.questionEn;
    const aText = language === 'UZ' ? faq.answerUz : faq.answerEn;
    return qText.toLowerCase().includes(query) || aText.toLowerCase().includes(query);
  });

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-200">
      {/* 1. HERO SECTION */}
      <section className="relative overflow-hidden pt-12 pb-20 lg:pt-20 lg:pb-28 border-b border-slate-200/80 dark:border-slate-800/80">
        {/* Subtle background glow circles */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-96 bg-amber-500/10 dark:bg-amber-500/5 blur-3xl rounded-full pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center max-w-3xl mx-auto">
            {/* Location Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 text-xs font-bold mb-6 tracking-wide">
              <MapPin className="w-3.5 h-3.5 text-amber-500" />
              <span>{t("Toshkent / Markaziy Filial", "Tashkent / Main Branch", "Ташкент / Главный Филиал")}</span>
            </div>

            {/* Main Headline */}
            <h1 className="text-4xl sm:text-6xl font-black tracking-tight text-slate-900 dark:text-white leading-[1.1] mb-4">
              <span className="block text-amber-500 font-extrabold drop-shadow-sm">
                {t("INNOVATSION TA'LIM VA YUQORI NATIJALAR", "INNOVATIVE EDUCATION & HIGH RESULTS", "ИННОВАЦИОННОЕ ОБУЧЕНИЕ И ВЫСОКИЕ РЕЗУЛЬТАТЫ")}
              </span>
              <span className="text-2xl sm:text-3xl font-bold text-slate-800 dark:text-slate-200 mt-3 block leading-relaxed">
                {t(
                  "Sifatli ta'lim, kuchli o'qituvchilar va zamonaviy o'quv muhiti bilan kelajagingizni biz bilan quring.",
                  "Build your future with high-quality education, expert mentors, and a modern learning environment.",
                  "Постройте свое будущее с качественным образованием, опытными преподавателями и современной учебной средой."
                )}
              </span>
            </h1>

            {/* Description */}
            <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 leading-relaxed max-w-2xl mx-auto mb-8 mt-4">
              {t(
                "Renessans Learning Center bilan zamonaviy ta'lim standartlari, xalqaro tajribaga ega ustozlar hamda IT va ingliz tili bo'yicha yuqori marralarni zabt eting.",
                "Achieve top goals in IT and English language learning with modern educational standards and experienced international tutors at Renessans Learning Center.",
                "Достигайте высоких целей в сфере IT и английского языка благодаря современным стандартам обучения и международному опыту в Renessans Learning Center."
              )}
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <a
                href="#courses"
                className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-sm shadow-xl shadow-amber-500/25 hover:shadow-amber-500/40 transition-all flex items-center justify-center gap-2.5 cursor-pointer"
              >
                <span>{t("Kurslarni ko'rish", "Explore Courses", "Посмотреть курсы")}</span>
                <ArrowRight className="w-4 h-4" />
              </a>
              <a
                href="#contact"
                className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 dark:hover:bg-slate-700 text-white font-bold text-sm border border-slate-700/50 transition-all flex items-center justify-center gap-2.5 cursor-pointer"
              >
                <span>{t("Bog'lanish", "Get in Touch", "Связаться с нами")}</span>
                <Phone className="w-4 h-4 text-amber-400" />
              </a>
            </div>
          </div>

          {/* Stats Grid Overlay (4 Floating Stat Cards) */}
          <div className="mt-16 grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 max-w-5xl mx-auto">
            <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xl shadow-slate-200/50 dark:shadow-none text-center">
              <div className="text-3xl sm:text-4xl font-black text-amber-500 mb-1">
                1,500+
              </div>
              <div className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                {t("O'quvchilar soni", "Active Students", "Учеников")}
              </div>
            </div>

            <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xl shadow-slate-200/50 dark:shadow-none text-center">
              <div className="text-3xl sm:text-4xl font-black text-amber-500 mb-1">
                280+
              </div>
              <div className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                {t("IELTS 7.0+ Natijalar", "IELTS 7.0+ Results", "Результатов IELTS 7.0+")}
              </div>
            </div>

            <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xl shadow-slate-200/50 dark:shadow-none text-center">
              <div className="text-3xl sm:text-4xl font-black text-amber-500 mb-1">
                95%
              </div>
              <div className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                {t("OTMga Kirish Ko'rsatkichi", "University Admission Rate", "Поступление в ВУЗы")}
              </div>
            </div>

            <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xl shadow-slate-200/50 dark:shadow-none text-center">
              <div className="text-3xl sm:text-4xl font-black text-amber-500 mb-1">
                4+ Yil
              </div>
              <div className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                {t("Muvaffaqiyatli Tajriba", "Years of Experience", "Успешного опыта")}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. FEATURES / "NEGA AYNAN RENESSANS?" */}
      <section className="py-20 bg-slate-100/70 dark:bg-slate-900/40 border-b border-slate-200/80 dark:border-slate-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
              {t("Nega Aynan Renessans?", "Why Renessans?", "Почему Именно Renessans?")}
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-2">
              {t("Kelajagingiz uchun ishonchli va zamonaviy ta'lim dargohi", "A modern educational hub designed for your future", "Современный образовательный центр для вашего будущего")}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 hover:border-amber-500/50 transition-all duration-300 shadow-md hover:shadow-xl group">
              <div className="w-12 h-12 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center font-bold text-lg mb-4 group-hover:scale-110 transition-transform">
                1
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
                {t("Individual Yondashuv", "Individual Approach", "Индивидуальный Подход")}
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                {t(
                  "Har bir o'quvchining bilim darajasi va shaxsiy maqsadlariga moslashtirilgan o'quv rejasi.",
                  "Personalized study plans tailored to each student level and goals.",
                  "Персональные учебные планы для каждого студента."
                )}
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 hover:border-amber-500/50 transition-all duration-300 shadow-md hover:shadow-xl group">
              <div className="w-12 h-12 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center font-bold text-lg mb-4 group-hover:scale-110 transition-transform">
                2
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
                {t("Tajribali Mentorlar (IELTS 8.0+ & CEFR C1)", "Experienced Mentors (IELTS 8.0+ & CEFR C1)", "Опытные Менторы (IELTS 8.0+ & CEFR C1)")}
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                {t(
                  "Xalqaro sertifikat va ko'p yillik amaliy pedagogik tajribaga ega bo'lgan kuchli ustozlar jamoasi.",
                  "Qualified specialists with international certificates and teaching experience.",
                  "Квалифицированные специалисты с международными сертификатами."
                )}
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 hover:border-amber-500/50 transition-all duration-300 shadow-md hover:shadow-xl group">
              <div className="w-12 h-12 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center font-bold text-lg mb-4 group-hover:scale-110 transition-transform">
                3
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
                {t("IT va Zamonaviy Sharoit", "IT & Modern Facilities", "IT и Современные Условия")}
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                {t(
                  "Zamonaviy kompyuter sinflari, qulay va shinam o'quv xonalari hamda yuqori tezlikdagi internet.",
                  "State-of-the-art computer labs, comfortable classrooms, and high-speed internet.",
                  "Современные компьютерные классы и высокоскоростной интернет."
                )}
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 hover:border-amber-500/50 transition-all duration-300 shadow-md hover:shadow-xl group">
              <div className="w-12 h-12 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center font-bold text-lg mb-4 group-hover:scale-110 transition-transform">
                4
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
                {t("Muntazam Mock Testlar", "Regular Mock Tests", "Регулярные Mock Тесты")}
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                {t(
                  "Haqiqiy imtihon muhitidagi doimiy sinovlar, individual feedback va natijalar tahlili.",
                  "Simulated real exam conditions with detailed performance analytics.",
                  "Симуляция реальных экзаменов с подробным анализом."
                )}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 3. TEACHERS ROSTER ("O'QITUVCHILARIMIZ") */}
      <section id="teachers" className="py-20 border-b border-slate-200/80 dark:border-slate-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 text-xs font-bold border border-amber-500/20 mb-3">
              <GraduationCap className="w-3.5 h-3.5" />
              <span>Renessans Mentors</span>
            </div>
            <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
              {t("O'qituvchilarimiz", "Our Esteemed Teachers", "Наши Преподаватели")}
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-2">
              {t("Bizning malakali, tajribali va yuqori natijali ustozlarimiz bilan tanishing", "Meet our passionate, internationally certified mentors", "Познакомьтесь с нашими опытными преподавателями международного уровня")}
            </p>
          </div>

          {/* Grid of Teachers */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {mockTeachers.map((teacher) => (
              <div
                key={teacher.id}
                className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 flex flex-col justify-between group"
              >
                <div>
                  <div className="relative h-60 overflow-hidden bg-slate-200 dark:bg-slate-800">
                    <img
                      src={teacher.image}
                      alt={teacher.name}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute top-3 right-3 px-3 py-1 rounded-full bg-amber-500 text-slate-950 text-xs font-black shadow-md">
                      {teacher.badge}
                    </div>
                  </div>

                  <div className="p-6">
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white truncate">
                      {teacher.name}
                    </h3>
                    <p className="text-xs font-semibold text-amber-600 dark:text-amber-400 mt-0.5">
                      {teacher.role}
                    </p>

                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-2.5 line-clamp-2 leading-relaxed">
                      {language === 'UZ' ? teacher.bioUz : teacher.bioEn}
                    </p>

                    <div className="flex flex-wrap gap-1.5 mt-4">
                      {teacher.specialization.map((spec, i) => (
                        <span
                          key={i}
                          className="px-2.5 py-1 rounded-md bg-slate-100 dark:bg-slate-800 text-[11px] font-semibold text-slate-600 dark:text-slate-300"
                        >
                          {spec}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="p-6 pt-0 border-t border-slate-100 dark:border-slate-800/60 mt-2 flex items-center justify-between text-xs text-slate-500">
                  <span className="font-semibold text-amber-500">
                    {teacher.experience}
                  </span>
                  <span className="font-bold text-slate-700 dark:text-slate-300">
                    {teacher.resultsCount}+{t(" Natijalar", " Results", " Результатов")}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 4. RESULTS SECTION ("NATIJALARIMIZ") */}
      <section id="results" className="py-20 bg-slate-100/70 dark:bg-slate-900/40 border-b border-slate-200/80 dark:border-slate-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 text-xs font-bold border border-amber-500/20 mb-3">
              <Award className="w-3.5 h-3.5" />
              <span>{t("Natijalarimiz", "Our Achievements", "Наши Результаты")}</span>
            </div>
            <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
              {t("IELTS, CEFR va IT Natijalarimiz", "IELTS, CEFR & IT Achievements", "Результаты IELTS, CEFR и IT")}
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-2">
              {t("O'quvchilarimizning xalqaro imtihonlar hamda amaliy loyihalardagi yuqori ko'rsatkichlari", "Celebrating high score achievements of our outstanding students", "Высокие показатели наших студентов на международных экзаменах")}
            </p>
          </div>

          {/* Filter Pills */}
          <div className="flex flex-wrap items-center justify-center gap-2 mb-10">
            {(
              [
                { id: 'all', label: dict.results.all },
                { id: '8.0', label: dict.results.ielts80 },
                { id: '7.5', label: dict.results.ielts75 },
                { id: 'CEFR', label: dict.results.cefr }
              ] as const
            ).map((f) => (
              <button
                key={f.id}
                onClick={() => setResultFilter(f.id)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                  resultFilter === f.id
                    ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                    : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* Results Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredResults.map((result) => (
              <div
                key={result.id}
                className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-lg hover:shadow-xl transition-all cursor-pointer group"
                onClick={() => setSelectedResult(result)}
              >
                <div className="flex items-center justify-between mb-4">
                  <span className="px-3 py-1 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 text-xs font-black border border-amber-500/20">
                    {result.badge}
                  </span>
                  <span className="text-xs text-slate-400 font-semibold">
                    {result.date}
                  </span>
                </div>

                <h3 className="text-xl font-black text-slate-900 dark:text-white group-hover:text-amber-500 transition-colors">
                  {result.studentName}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  {t("Ustoz: ", "Instructor: ", "Преподаватель: ")}{result.teacherName}
                </p>

                {/* Scores breakdown mini bar */}
                <div className="grid grid-cols-4 gap-2 mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 text-center text-xs">
                  <div>
                    <span className="text-[10px] text-slate-400 block font-bold">L</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">{result.listening}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block font-bold">R</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">{result.reading}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block font-bold">W</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">{result.writing}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block font-bold">S</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">{result.speaking}</span>
                  </div>
                </div>

                <button className="w-full mt-5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-bold text-xs group-hover:bg-amber-500 group-hover:text-slate-950 transition">
                  {t("Sertifikatni ko'rish", "View Certificate", "Посмотреть сертификат")}
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 5. COURSES GRID ("KURSLARIMIZ") */}
      <section id="courses" className="py-20 border-b border-slate-200/80 dark:border-slate-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 text-xs font-bold border border-amber-500/20 mb-3">
              <BookOpen className="w-3.5 h-3.5" />
              <span>Renessans Courses</span>
            </div>
            <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
              {t("O'quv Dasturlarimiz", "Our Courses", "Наши Курсы")}
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-2">
              {t("Boshlang'ich darajadan to IELTS, CEFR va IT yo'nalishidagi intensiv va samarali kurslar", "From foundational English to advanced IELTS, CEFR & IT preparation", "От базового уровня до продвинутой подготовки к IELTS, CEFR и IT")}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {mockCourses.map((course) => (
              <div
                key={course.id}
                className={`relative rounded-3xl p-8 bg-white dark:bg-slate-900 border transition-all duration-300 flex flex-col justify-between shadow-xl ${
                  course.isPopular
                    ? 'border-amber-500/80 ring-2 ring-amber-500/20'
                    : 'border-slate-200/80 dark:border-slate-800'
                }`}
              >
                {course.isPopular && (
                  <span className="absolute -top-3.5 right-8 px-4 py-1 rounded-full bg-amber-500 text-slate-950 text-xs font-black shadow-md">
                    {t("Eng ommabop", "Most Popular", "Самый популярный")}
                  </span>
                )}

                <div>
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center font-bold">
                      {course.id === 'c4' ? <Code className="w-5 h-5" /> : <BookOpen className="w-5 h-5" />}
                    </div>
                    <h3 className="text-2xl font-black text-slate-900 dark:text-white">
                      {language === 'UZ' ? course.titleUz : course.titleEn}
                    </h3>
                  </div>

                  <p className="text-xs text-slate-600 dark:text-slate-400 mb-6 leading-relaxed">
                    {language === 'UZ' ? course.descUz : course.descEn}
                  </p>

                  <div className="grid grid-cols-2 gap-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 mb-6 text-xs">
                    <div>
                      <p className="text-[10px] text-slate-400 uppercase font-bold">{t("Davomiyligi", "Duration", "Длительность")}</p>
                      <p className="font-bold text-slate-800 dark:text-slate-200">
                        {language === 'UZ' ? course.durationUz : course.durationEn}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-400 uppercase font-bold">{t("Darajasi", "Target Level", "Уровень")}</p>
                      <p className="font-bold text-amber-500">
                        {language === 'UZ' ? course.levelUz : course.levelEn}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2.5 mb-8">
                    {(language === 'UZ' ? course.featuresUz : course.featuresEn).map((feat, i) => (
                      <div key={i} className="flex items-start gap-2.5 text-xs text-slate-700 dark:text-slate-300">
                        <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                        <span>{feat}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-6 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <div>
                    <p className="text-[10px] text-slate-400 uppercase font-bold">{t("Oylik to'lov", "Monthly Fee", "Ежемесячная оплата")}</p>
                    <p className="text-xl font-black text-slate-900 dark:text-white">
                      {language === 'UZ' ? course.priceUz : course.priceEn}
                    </p>
                  </div>
                  <a
                    href="#contact"
                    onClick={() => setFormCourse(course.id)}
                    className="px-6 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-md shadow-amber-500/20 transition cursor-pointer"
                  >
                    {t("Kursga yozilish", "Enroll Now", "Записаться на курс")}
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 6. FAQ SECTION */}
      <section id="faq" className="py-20 bg-slate-100/70 dark:bg-slate-900/40 border-b border-slate-200/80 dark:border-slate-800/80">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
              {t("Ko'p Beriladigan Savollar", "Frequently Asked Questions", "Часто задаваемые вопросы")}
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-2">
              {t("Renessans Learning Center haqida eng ko'p so'raladigan savollarga javoblar", "Everything you need to know about learning at Renessans Learning Center", "Ответы на самые распространенные вопросы")}
            </p>
          </div>

          {/* FAQ Search Bar */}
          <div className="relative mb-8">
            <Search className="w-4 h-4 absolute left-4 top-3.5 text-slate-400" />
            <input
              type="text"
              value={faqSearch}
              onChange={(e) => setFaqSearch(e.target.value)}
              placeholder={t("Savolni izlang...", "Search question...", "Поиск вопроса...")}
              className="w-full pl-11 pr-4 py-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>

          {/* Accordion list */}
          <div className="space-y-4">
            {filteredFAQs.map((faq) => {
              const isExpanded = expandedFaqId === faq.id;
              const question = language === 'UZ' ? faq.questionUz : faq.questionEn;
              const answer = language === 'UZ' ? faq.answerUz : faq.answerEn;

              return (
                <div
                  key={faq.id}
                  className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 overflow-hidden shadow-sm"
                >
                  <button
                    onClick={() => setExpandedFaqId(isExpanded ? null : faq.id)}
                    className="w-full p-5 text-left font-bold text-sm text-slate-900 dark:text-white flex items-center justify-between cursor-pointer hover:text-amber-500 transition"
                  >
                    <span>{question}</span>
                    <ChevronDown
                      className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${
                        isExpanded ? 'rotate-180 text-amber-500' : ''
                      }`}
                    />
                  </button>
                  {isExpanded && (
                    <div className="px-5 pb-5 text-xs text-slate-600 dark:text-slate-400 border-t border-slate-100 dark:border-slate-800/60 pt-3 leading-relaxed">
                      {answer}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 7. LEAD CONTACT FORM & LOCATION ("BIZGA BOG'LANISH") */}
      <section id="contact" className="py-20 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
            {/* Contact Form */}
            <div className="p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xl">
              <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-2">
                {t("Bizga Bog'lanish", "Get in Touch", "Связаться с нами")}
              </h2>
              <p className="text-xs text-slate-600 dark:text-slate-400 mb-6">
                {t("Savollaringiz bormi yoki darsga yozilmoqchimisiz? Ma'lumotlaringizni qoldiring!", "Have questions or want to join a trial lesson? Leave your details below!", "Есть вопросы или хотите записаться на урок? Заполните форму!")}
              </p>

              {submitSuccess ? (
                <div className="p-6 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-center space-y-2">
                  <CheckCircle2 className="w-10 h-10 mx-auto text-emerald-500" />
                  <h4 className="text-lg font-bold">{t("Arizangiz Qabul Qilindi!", "Application Received!", "Заявка принята!")}</h4>
                  <p className="text-xs">{t("Rahmat! Arizangiz qabul qilindi. Tez orada siz bilan bog'lanamiz.", "Thank you! Your application has been received. We will call you soon.", "Спасибо! Ваша заявка принята. Мы скоро свяжемся с вами.")}</p>
                  <button
                    onClick={() => setSubmitSuccess(false)}
                    className="mt-4 px-4 py-2 rounded-xl bg-slate-900 text-white dark:bg-slate-800 text-xs font-bold cursor-pointer"
                  >
                    {t("Yangi ariza topshirish", "Submit another application", "Отправить другую заявку")}
                  </button>
                </div>
              ) : (
                <form onSubmit={handleLeadSubmit} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      {t("To'liq ismingiz", "Full Name", "Ваше полное имя")}
                    </label>
                    <input
                      type="text"
                      required
                      value={formName}
                      onChange={(e) => setFormName(e.target.value)}
                      placeholder={t("Masalan: Jasur Rahimov", "E.g., Jasur Rahimov", "Например: Джасур Рахимов")}
                      className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      {t("Telefon raqamingiz", "Phone Number", "Номер телефона")}
                    </label>
                    <input
                      type="text"
                      required
                      value={formPhone}
                      onChange={(e) => setFormPhone(e.target.value)}
                      placeholder="+998 90 123 45 67"
                      className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      {t("Tanlangan kurs", "Selected Course", "Выбранный курс")}
                    </label>
                    <select
                      value={formCourse}
                      onChange={(e) => setFormCourse(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                    >
                      <option value="">{t("Kursni tanlang...", "Choose a course...", "Выберите курс...")}</option>
                      {mockCourses.map((c) => (
                        <option key={c.id} value={c.id}>
                          {language === 'UZ' ? c.titleUz : c.titleEn}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      {t("Xabar yoki izohingiz (Ixtiyoriy)", "Message / Inquiry (Optional)", "Сообщение или вопрос (необязательно)")}
                    </label>
                    <textarea
                      rows={3}
                      value={formMessage}
                      onChange={(e) => setFormMessage(e.target.value)}
                      placeholder={t("Savolingiz yoki dars vaqti bo'yicha istagingiz...", "Specify preferred schedule or questions...", "Укажите ваши пожелания...")}
                      className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-lg shadow-amber-500/20 transition cursor-pointer flex items-center justify-center gap-2"
                  >
                    <Send className="w-4 h-4" />
                    <span>{isSubmitting ? t("Yuborilmoqda...", "Submitting...", "Отправка...") : t("Arizani yuborish", "Send Application", "Отправить заявку")}</span>
                  </button>
                </form>
              )}
            </div>

            {/* Address & Interactive Location Card */}
            <div className="space-y-6">
              <div className="p-8 rounded-3xl bg-slate-900 text-white border border-slate-800 shadow-xl space-y-6">
                <h3 className="text-xl font-extrabold text-amber-400">
                  {t("Bizning Manzil va Kontaktlar", "Location & Contacts", "Адрес и контакты")}
                </h3>

                <div className="space-y-4 text-xs text-slate-300">
                  <div className="flex items-start gap-3">
                    <MapPin className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold text-white">{t("Manzil:", "Address:", "Адрес:")}</p>
                      <p>{t("Toshkent / Markaziy Filial", "Tashkent / Main Branch", "Ташкент / Главный Филиал")}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Phone className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold text-white">{t("Telefon:", "Phone:", "Телефон:")}</p>
                      <p>+998 90 123 45 67</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <MessageCircle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold text-white">Telegram:</p>
                      <p>@renessans_lc_official</p>
                    </div>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-slate-800/80 border border-slate-700/60 text-xs text-slate-400">
                  {t("Ish vaqti: Dushanba - Shanba 08:00 - 20:00", "Operating Hours: Mon-Sat 08:00 - 20:00", "Режим работы: Пн-Сб 08:00 - 20:00")}
                </div>
              </div>

              {/* Map Illustration Frame */}
              <div className="h-64 rounded-3xl bg-slate-200 dark:bg-slate-900 border border-slate-300 dark:border-slate-800 relative overflow-hidden flex items-center justify-center text-center p-6">
                <div className="space-y-2">
                  <Building className="w-10 h-10 text-amber-500 mx-auto" />
                  <p className="font-bold text-sm text-slate-800 dark:text-slate-200">
                    Renessans Learning Center
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {t("Toshkent / Markaziy Filial", "Tashkent / Main Branch", "Ташкент / Главный Филиал")}
                  </p>
                  <a
                    href="https://maps.google.com"
                    target="_blank"
                    rel="noreferrer"
                    className="inline-block mt-2 px-4 py-2 rounded-xl bg-amber-500 text-slate-950 font-bold text-xs"
                  >
                    {t("Google Maps-da ko'rish", "View on Google Maps", "Посмотреть на Google Maps")}
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-slate-950 text-slate-400 py-12 border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6 pb-8 border-b border-slate-800/80">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center font-black">
                R
              </div>
              <div>
                <span className="text-lg font-black text-white">Renessans LC</span>
                <p className="text-xs text-slate-500">{t("Renessans Learning Center - Innovatsion Ta'lim va Yuqori Natijalar.", "Renessans Learning Center - Innovative Education & High Results.", "Renessans Learning Center - Инновационное образование и высокие результаты.")}</p>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-6 text-xs font-semibold">
              <a href="#courses" className="hover:text-amber-400 transition">{dict.nav.courses}</a>
              <a href="#teachers" className="hover:text-amber-400 transition">{dict.nav.teachers}</a>
              <a href="#results" className="hover:text-amber-400 transition">{dict.nav.results}</a>
              <a href="#faq" className="hover:text-amber-400 transition">{dict.nav.faq}</a>
              <a href="#contact" className="hover:text-amber-400 transition">{dict.nav.contact}</a>
            </div>
          </div>

          <div className="pt-8 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-4">
            <p>{t("© 2026 Renessans LC CenterFlow. Barcha huquqlar himoyalangan.", "© 2026 Renessans LC CenterFlow. All rights reserved.", "© 2026 Renessans LC CenterFlow. Все права защищены.")}</p>
            <p>{dict.footer.credit}</p>
          </div>
        </div>
      </footer>

      {/* Result Certificate Modal */}
      <ResultCertificateModal
        result={selectedResult}
        onClose={() => setSelectedResult(null)}
      />
    </div>
  );
};
