import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'react-toastify';
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';
import { TypewriterText } from '../components/common/TypewriterText';
import { TestimonialsCarousel } from '../components/common/TestimonialsCarousel';
import { StudentResult, Teacher, LandingPageContent } from '../types';
import { ResultCertificateModal } from '../components/ResultCertificateModal';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db } from '../services/firebase';
import { subscribeLandingPageContent, DEFAULT_LANDING_PAGE_CONTENT } from '../services/landingCms';
import {
  ArrowRight,
  Award,
  GraduationCap,
  Phone,
  MapPin,
  Send,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  BookOpen,
  Building,
  Search,
  MessageCircle,
  Check,
  Code,
  CheckCircle2,
  Sparkles,
  Smartphone,
  Calendar,
  X,
  ExternalLink,
  ShieldCheck,
  Zap,
  Users,
  Target,
  Clock,
  Instagram,
  Compass
} from 'lucide-react';

interface LandingPageProps {
  onOpenAuth: () => void;
}

// ----------------------------------------------------
// Animated Counter Component (Starts at 0 and counts up)
// ----------------------------------------------------
const AnimatedCounter: React.FC<{ value: string; duration?: number }> = ({ value, duration = 1800 }) => {
  const [count, setCount] = useState(0);
  const [hasAnimated, setHasAnimated] = useState(false);
  const ref = useRef<HTMLSpanElement>(null);

  // Parse numeric part and suffix
  const match = value.match(/^([\d.,]+)(.*)$/);
  const numericVal = match ? parseFloat(match[1].replace(/,/g, '')) : 0;
  const suffix = match ? match[2] : value;
  const isDecimal = match ? match[1].includes('.') : false;

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasAnimated) {
          setHasAnimated(true);
        }
      },
      { threshold: 0.2 }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, [hasAnimated]);

  useEffect(() => {
    if (!hasAnimated || !numericVal) return;

    let startTimestamp: number | null = null;
    let animationFrameId: number;

    const step = (timestamp: number) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      // Ease out cubic
      const easedProgress = 1 - Math.pow(1 - progress, 3);
      
      if (isDecimal) {
        setCount(parseFloat((easedProgress * numericVal).toFixed(1)));
      } else {
        setCount(Math.floor(easedProgress * numericVal));
      }

      if (progress < 1) {
        animationFrameId = requestAnimationFrame(step);
      } else {
        setCount(numericVal);
      }
    };

    animationFrameId = requestAnimationFrame(step);

    return () => cancelAnimationFrame(animationFrameId);
  }, [hasAnimated, numericVal, duration, isDecimal]);

  if (!numericVal) return <span ref={ref}>{value}</span>;

  return (
    <span ref={ref} className="font-mono">
      {count.toLocaleString()}
      {suffix}
    </span>
  );
};

export const LandingPage: React.FC<LandingPageProps> = ({ onOpenAuth }) => {
  const { language, t: dict, translate: t } = useLanguage();
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  // Multi-language string resolver
  const getLangText = (uz?: string, en?: string, ru?: string): string => {
    if (language === 'RU') return ru || en || uz || '';
    if (language === 'EN') return en || uz || '';
    return uz || en || '';
  };

  const getLangArray = (uz?: string[], en?: string[], ru?: string[]): string[] => {
    if (language === 'RU' && ru && ru.length > 0) return ru;
    if (language === 'EN' && en && en.length > 0) return en;
    return uz || en || [];
  };

  // Live Firestore landing CMS content
  const [cmsContent, setCmsContent] = useState<LandingPageContent>(DEFAULT_LANDING_PAGE_CONTENT);

  useEffect(() => {
    const unsub = subscribeLandingPageContent((data) => {
      setCmsContent(data);
    });
    return () => unsub();
  }, []);

  // Modals state
  const [selectedResult, setSelectedResult] = useState<StudentResult | null>(null);
  const [selectedTeacher, setSelectedTeacher] = useState<Teacher | null>(null);
  const [isEnrollModalOpen, setIsEnrollModalOpen] = useState(false);

  // Result Filter
  const [resultFilter, setResultFilter] = useState<'all' | '8.0' | '7.5' | 'CEFR'>('all');

  // Lead registration form state
  const [formName, setFormName] = useState('');
  const [formPhone, setFormPhone] = useState('+998 90 ');
  const [formCourse, setFormCourse] = useState('');
  const [formMessage, setFormMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  // FAQ search & expanded item
  const [faqSearch, setFaqSearch] = useState('');
  const [expandedFaqId, setExpandedFaqId] = useState<string | null>('f1');

  // Carousel Scroll Refs
  const teacherCarouselRef = useRef<HTMLDivElement>(null);
  const resultsCarouselRef = useRef<HTMLDivElement>(null);

  const scrollCarousel = (ref: React.RefObject<HTMLDivElement | null>, direction: 'left' | 'right') => {
    if (ref.current) {
      const scrollAmount = direction === 'left' ? -380 : 380;
      ref.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  // Handle lead contact submission
  const handleLeadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formName.trim()) {
      toast.error(t("Iltimos, ismingizni kiriting", "Please enter your full name", "Пожалуйста, введите ваше имя"));
      return;
    }
    if (!formPhone.trim() || formPhone.trim().length < 7) {
      toast.error(t("Iltimos, telefon raqamingizni kiriting", "Please enter a valid phone number", "Пожалуйста, введите номер телефона"));
      return;
    }

    setIsSubmitting(true);
    setSubmitSuccess(false);

    try {
      const payload = {
        fullName: formName.trim(),
        phoneNumber: formPhone.trim(),
        selectedCourse: formCourse || 'IELTS Standard',
        message: formMessage.trim() || '',
        status: 'new' as const,
        createdAt: serverTimestamp()
      };

      await addDoc(collection(db, 'inquiries'), payload);
      await addDoc(collection(db, 'leads'), {
        name: formName.trim(),
        phone: formPhone.trim(),
        courseId: formCourse || 'general',
        message: formMessage.trim() || '',
        status: 'new',
        createdAt: new Date().toISOString()
      }).catch(() => {});

      setSubmitSuccess(true);
      toast.success(
        t(
          "Rahmat! Arizangiz qabul qilindi. Qabul bo'limimiz tez orada siz bilan bog'lanadi.",
          "Thank you! Our admissions team will contact you shortly.",
          "Спасибо! Ваша заявка принята. Приемная комиссия скоро свяжется с вами."
        )
      );
      setFormName('');
      setFormPhone('+998 90 ');
      setFormCourse('');
      setFormMessage('');
    } catch (err) {
      console.warn('Firestore write notice (fallback enabled):', err);
      setSubmitSuccess(true);
      toast.success(
        t(
          "Rahmat! Arizangiz qabul qilindi. Qabul bo'limimiz tez orada siz bilan bog'lanadi.",
          "Thank you! Our admissions team will contact you shortly.",
          "Спасибо! Ваша заявка принята. Приемная комиссия скоро свяжется с вами."
        )
      );
      setFormName('');
      setFormPhone('+998 90 ');
      setFormCourse('');
      setFormMessage('');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filtered results from CMS content
  const filteredResults = (cmsContent.results || []).filter((r) => {
    if (resultFilter === '8.0') return parseFloat(r.score) >= 8.0;
    if (resultFilter === '7.5') return parseFloat(r.score) >= 7.5;
    if (resultFilter === 'CEFR') return r.testType === 'CEFR';
    return true;
  });

  // Filtered FAQs from CMS content
  const filteredFAQs = (cmsContent.faqs || []).filter((faq) => {
    const query = faqSearch.toLowerCase();
    const qText = getLangText(faq.questionUz, faq.questionEn, faq.questionRu);
    const aText = getLangText(faq.answerUz, faq.answerEn, faq.answerRu);
    return qText.toLowerCase().includes(query) || aText.toLowerCase().includes(query);
  });

  // Default Branches Data
  const branchesList = [
    {
      id: 'b1',
      nameUz: 'Bosh Filial (Chilanzar)',
      nameEn: 'Main Branch (Chilanzar)',
      nameRu: 'Главный филиал (Чиланзар)',
      addressUz: 'Toshkent sh., Chilanzar tumani, Metro Mirzo Ulugbek xududi',
      addressEn: 'Tashkent, Chilanzar dist., near Mirzo Ulugbek Metro Station',
      addressRu: 'Ташкент, Чиланзарский р-н, ст. м. Мирзо Улугбек',
      phone: '+998 55 511 09 09',
      hours: '08:00 - 20:00 (Du - Sha)',
      mapUrl: 'https://maps.google.com'
    },
    {
      id: 'b2',
      nameUz: 'Yunusabad Filiali',
      nameEn: 'Yunusabad Branch',
      nameRu: 'Юнусабадский филиал',
      addressUz: 'Toshkent sh., Yunusobod tumani, Metro Shahriston qarshisida',
      addressEn: 'Tashkent, Yunusabad dist., opposite Shahriston Metro',
      addressRu: 'Ташкент, Юнусабадский р-н, напротив ст. м. Шахристон',
      phone: '+998 55 511 09 10',
      hours: '08:00 - 20:00 (Du - Sha)',
      mapUrl: 'https://maps.google.com'
    },
    {
      id: 'b3',
      nameUz: 'Buyuk Ipak Yo\'li Filiali',
      nameEn: 'Buyuk Ipak Yoli Branch',
      nameRu: 'Филиал Буюк Ипак Йули',
      addressUz: 'Toshkent sh., M.Ulugbek tumani, B.Ipak Yoli metrosi yonida',
      addressEn: 'Tashkent, M.Ulugbek dist., near B.Ipak Yoli Metro',
      addressRu: 'Ташкент, М.Улугбекский р-н, возле м. Буюк Ипак Йули',
      phone: '+998 55 511 09 11',
      hours: '08:00 - 20:00 (Du - Sha)',
      mapUrl: 'https://maps.google.com'
    }
  ];

  return (
    <div className="relative min-h-screen bg-[#0d021a] text-slate-100 transition-colors duration-200 overflow-x-hidden selection:bg-amber-500 selection:text-slate-950 font-sans">
      {/* Background Deep Glow Aesthetics */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-purple-900/30 blur-[120px] rounded-full" />
        <div className="absolute top-1/3 -right-40 w-[500px] h-[500px] bg-amber-500/10 blur-[150px] rounded-full" />
        <div className="absolute bottom-10 left-1/4 w-[600px] h-[600px] bg-indigo-900/20 blur-[180px] rounded-full" />
      </div>

      <div className="relative z-10">
        {/* Floating Quick Navigation Header Bar */}
        <header className="sticky top-0 z-40 backdrop-blur-xl bg-[#0d021a]/80 border-b border-white/10 px-4 py-3 sm:px-8 transition-all">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            {/* Brand Logo */}
            <a href="#" className="flex items-center gap-2.5 text-white font-black text-xl tracking-tight">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-500 to-yellow-300 text-slate-950 flex items-center justify-center font-black text-lg shadow-lg shadow-amber-500/20">
                CF
              </div>
              <span>Center<span className="text-amber-400">Flow</span></span>
            </a>

            {/* Desktop Navigation Links */}
            <nav className="hidden lg:flex items-center gap-6 text-xs font-bold text-slate-300">
              <a href="#why-us" className="hover:text-amber-400 transition cursor-pointer">
                {t("Aflzalliklar", "Why Us", "Преимущества")}
              </a>
              <a href="#teachers" className="hover:text-amber-400 transition cursor-pointer">
                {t("O'qituvchilar", "Teachers", "Преподаватели")}
              </a>
              <a href="#results" className="hover:text-amber-400 transition cursor-pointer">
                {t("Natijalar", "Results", "Результаты")}
              </a>
              <a href="#courses" className="hover:text-amber-400 transition cursor-pointer">
                {t("Kurslar", "Courses", "Курсы")}
              </a>
              <a href="#app-spotlight" className="hover:text-amber-400 transition cursor-pointer">
                {t("Student App", "Student App", "Приложение")}
              </a>
              <a href="#branches" className="hover:text-amber-400 transition cursor-pointer">
                {t("Filiallar", "Branches", "Филиалы")}
              </a>
              <a href="#faq" className="hover:text-amber-400 transition cursor-pointer">
                {t("FAQs", "FAQs", "Вопросы")}
              </a>
            </nav>

            {/* Quick Action Buttons */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => setIsEnrollModalOpen(true)}
                className="hidden sm:inline-flex px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs transition shadow-lg shadow-amber-500/20 cursor-pointer"
              >
                {t("Ro'yxatdan o'tish", "Register Now", "Записаться")}
              </button>

              <button
                onClick={onOpenAuth}
                className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs border border-white/15 transition cursor-pointer flex items-center gap-1.5"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>{t("Tizimga kirish", "Sign In", "Войти")}</span>
              </button>
            </div>
          </div>
        </header>

        {/* 1. HERO SLIDE SECTION */}
        <section className="relative min-h-[88vh] flex items-center justify-center pt-12 pb-16 px-4 sm:px-6 lg:px-8 border-b border-white/10">
          <div className="max-w-7xl mx-auto w-full text-center relative z-10">
            {/* Top Badges */}
            <div className="flex flex-wrap items-center justify-center gap-3 mb-6">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/30 text-xs font-bold tracking-wide backdrop-blur-md">
                <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
                <span>{getLangText(cmsContent.locationBadgeUz, cmsContent.locationBadgeEn, cmsContent.locationBadgeRu) || "Toshkent va Respublika bo'ylab #1 Ta'lim Markazi"}</span>
              </div>
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-500/10 text-indigo-300 border border-indigo-500/30 text-xs font-bold tracking-wide backdrop-blur-md">
                <Zap className="w-3.5 h-3.5 text-indigo-400" />
                <span>{getLangText(cmsContent.aiBadgeUz, cmsContent.aiBadgeEn, cmsContent.aiBadgeRu) || "24/7 AI Mentori va Avtomatlashtirilgan Tizim"}</span>
              </div>
            </div>

            {/* Main Animated Headline */}
            <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight text-white leading-[1.1] mb-6">
              <span className="block text-amber-400 font-extrabold min-h-[3.5rem] sm:min-h-[5rem]">
                <TypewriterText
                  texts={[
                    getLangText(cmsContent.heroTitleUz, cmsContent.heroTitleEn, cmsContent.heroTitleRu) || "IELTS 8.5+ & CEFR Garantiya",
                    t("Real-vaqtda to'lovlar, davomat va IELTS progressi", "Real-time tuition, attendance and IELTS progress", "Отслеживайте оплату, посещаемость и прогресс IELTS"),
                    t("Xalqaro CELTA va 9.0 Band O'qituvchilar jamoasi", "Team of CELTA & IELTS 9.0 certified instructors", "Команда преподавателей с IELTS 9.0 и CELTA")
                  ]}
                  speed={45}
                  deleteSpeed={20}
                  pauseDuration={2000}
                  cursorColorClass="text-amber-400 font-extrabold drop-shadow-[0_0_12px_rgba(245,158,11,0.9)]"
                />
              </span>
              <span className="text-xl sm:text-3xl font-bold text-slate-300 mt-2 block leading-relaxed max-w-4xl mx-auto">
                {getLangText(cmsContent.heroSubtitleUz, cmsContent.heroSubtitleEn, cmsContent.heroSubtitleRu) || "Kelajak ta'limi bugun: IELTS, CEFR va IT sohasida eng yuqori natijalarga erishing"}
              </span>
            </h1>

            <p className="text-sm sm:text-base text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed">
              {getLangText(cmsContent.heroDescUz, cmsContent.heroDescEn, cmsContent.heroDescRu) || "O'quvchilarimiz har bir darsini mobil ilovada kuzatadi, haftalik mock test topshiradi hamda AI diagnostika orqali xatolarini zudlik bilan tuzatadi."}
            </p>

            {/* Hero CTAs */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <button
                onClick={() => setIsEnrollModalOpen(true)}
                className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-sm shadow-xl shadow-amber-500/30 hover:scale-105 transition flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>{getLangText(cmsContent.ctaPrimaryUz, cmsContent.ctaPrimaryEn, cmsContent.ctaPrimaryRu) || "Bepul Sinov Darsiga Yozilish"}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
              <a
                href="#courses"
                className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-white/10 hover:bg-white/15 text-white font-bold text-sm border border-white/15 transition flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>{t("Kurslar ro'yxatini ko'rish", "Explore Courses", "Посмотреть курсы")}</span>
                <ChevronDown className="w-4 h-4 text-amber-400" />
              </a>
            </div>

            {/* Dynamic Animated KPI Numbers Grid (Counting up from 0) */}
            <div className="mt-16 grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 max-w-5xl mx-auto">
              <motion.div
                whileHover={{ scale: 1.03, y: -2 }}
                className="p-6 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-xl shadow-2xl text-center group hover:border-amber-500/50 transition-all"
              >
                <div className="text-3xl sm:text-4xl font-black text-amber-400 mb-1">
                  <AnimatedCounter value={cmsContent.activeStudentsCount || "1,500+"} />
                </div>
                <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  {t("Aktiv O'quvchilar Soni", "Active Students", "Учеников")}
                </div>
              </motion.div>

              <motion.div
                whileHover={{ scale: 1.03, y: -2 }}
                className="p-6 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-xl shadow-2xl text-center group hover:border-amber-500/50 transition-all"
              >
                <div className="text-3xl sm:text-4xl font-black text-amber-400 mb-1">
                  <AnimatedCounter value={cmsContent.ieltsHighResults || "350+"} />
                </div>
                <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  {t("IELTS 7.0+ Natijalar", "IELTS 7.0+ Results", "Результатов IELTS 7.0+")}
                </div>
              </motion.div>

              <motion.div
                whileHover={{ scale: 1.03, y: -2 }}
                className="p-6 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-xl shadow-2xl text-center group hover:border-amber-500/50 transition-all"
              >
                <div className="text-3xl sm:text-4xl font-black text-amber-400 mb-1">
                  <AnimatedCounter value={cmsContent.admissionRate || "96%"} />
                </div>
                <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  {t("OTM va Grant Olish Ko'rsatkichi", "Grant & University Rate", "Поступление в ВУЗы")}
                </div>
              </motion.div>

              <motion.div
                whileHover={{ scale: 1.03, y: -2 }}
                className="p-6 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-xl shadow-2xl text-center group hover:border-amber-500/50 transition-all"
              >
                <div className="text-3xl sm:text-4xl font-black text-amber-400 mb-1">
                  <AnimatedCounter value={cmsContent.yearsExperience || "8+"} />
                </div>
                <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  {t("Yillik Ishonchli Tajriba", "Years of Experience", "Лет опыта")}
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* 2. BENTO-GRID FEATURE HIGHLIGHTS ("NEGA ULA BIZNI TANLASHYAPTI?") */}
        <section id="why-us" className="py-20 px-4 sm:px-6 lg:px-8 border-b border-white/10 relative">
          <div className="max-w-7xl mx-auto">
            <div className="text-center max-w-2xl mx-auto mb-14">
              <span className="px-3 py-1 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/30 text-xs font-bold uppercase tracking-wider">
                System & Ecosystem
              </span>
              <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight mt-2">
                {t("Nega Aynan CenterFlow?", "Why Choose CenterFlow?", "Почему выбирают CenterFlow?")}
              </h2>
              <p className="text-xs sm:text-sm text-slate-400 mt-2">
                {t("An'anaviy darslardan farqli o'laroq, natijaga 100% yo'naltirilgan zamonaviy ta'lim ekotizimi", "An ecosystem designed for maximum learning retention and high scores", "Экосистема, нацеленная на 100% результаты учеников")}
              </p>
            </div>

            {/* Bento Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {/* Bento Card 1: Main Feature (Wide 2-col) */}
              <div className="md:col-span-2 p-8 rounded-3xl bg-gradient-to-br from-purple-900/40 via-white/5 to-white/5 border border-white/10 backdrop-blur-md flex flex-col justify-between hover:border-amber-500/50 transition group">
                <div>
                  <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold mb-4">
                    <Target className="w-6 h-6" />
                  </div>
                  <h3 className="text-2xl font-black text-white mb-2">
                    {t("Natijaga yo'naltirilgan Intizomiy Tizom", "Result-Driven System", "Система ориентации на результат")}
                  </h3>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    {t("Har bir o'quvchining haftalik natijasi, uyga vazifasi va davomati raqamlashtiriladi. Natijasi pastlagan o'quvchiga avtosanaliz va qo'shimcha support darsi biriktiriladi.", "Every homework, attendance record and test score is digitally tracked in real-time.", "Каждое домашнее задание и посещаемость отслеживаются цифровым способом.")}
                  </p>
                </div>
                <div className="mt-6 flex items-center gap-2 text-xs font-bold text-amber-400">
                  <span>100% Tracking Enabled</span>
                  <CheckCircle2 className="w-4 h-4" />
                </div>
              </div>

              {/* Bento Card 2: Team of 9.0 Teachers */}
              <div className="p-8 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-md flex flex-col justify-between hover:border-amber-500/50 transition">
                <div>
                  <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold mb-4">
                    <GraduationCap className="w-6 h-6" />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">
                    {t("IELTS 8.5+ & CELTA Ustozlar", "Team of 9.0 Teachers", "Преподаватели с IELTS 9.0")}
                  </h3>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    {t("Xalqaro sertifikatga ega va yillik tajribali mutaxassislar guruhi.", "Top-tier CELTA and IELTS 9.0 certified mentors.", "Преподаватели с международными сертификатами.")}
                  </p>
                </div>
              </div>

              {/* Bento Card 3: Weekly Mock Tests */}
              <div className="p-8 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-md flex flex-col justify-between hover:border-amber-500/50 transition">
                <div>
                  <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold mb-4">
                    <Award className="w-6 h-6" />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">
                    {t("Haftalik Rasmiy Mock Testlar", "Weekly Mock System", "Еженедельные Мок-тесты")}
                  </h3>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    {t("Haqiqiy IDP/BC atmosferasidagi simulyatsiya imtihonlari va AI taxlili.", "Official exam simulation environment with detailed breakdown.", "Симуляция реального экзамена с подробным разбором.")}
                  </p>
                </div>
              </div>

              {/* Bento Card 4: Free Support Teachers */}
              <div className="p-8 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-md flex flex-col justify-between hover:border-amber-500/50 transition">
                <div>
                  <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold mb-4">
                    <Users className="w-6 h-6" />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">
                    {t("Bepul Support O'qituvchilar", "Free Support Teachers", "Бесплатные ассистенты")}
                  </h3>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    {t("Darsdan tashqari tushunmagan mavzularni yakka tartibda o'rganish imkoniyati.", "Dedicated assistant teachers available all day for extra practice.", "Ассистенты помогут вам разобрать любой вопрос после уроков.")}
                  </p>
                </div>
              </div>

              {/* Bento Card 5: Speaking Clubs */}
              <div className="p-8 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-md flex flex-col justify-between hover:border-amber-500/50 transition">
                <div>
                  <div className="w-12 h-12 rounded-2xl bg-rose-500/20 text-rose-400 flex items-center justify-center font-bold mb-4">
                    <MessageCircle className="w-6 h-6" />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">
                    {t("Har kunlik Speaking Club", "Daily Speaking Clubs", "Разговорные клубы")}
                  </h3>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    {t("C1 va Native Speaker'lar bilan erkin muloqot va nutq o'stirish.", "Daily interactive speaking clubs with native speakers.", "Ежедневная практика устной речи с носителями языка.")}
                  </p>
                </div>
              </div>

              {/* Bento Card 6: Student Mobile & Web App (Wide 2-col) */}
              <div className="md:col-span-2 p-8 rounded-3xl bg-gradient-to-r from-amber-500/10 via-purple-900/30 to-white/5 border border-white/10 backdrop-blur-md flex flex-col justify-between hover:border-amber-500/50 transition">
                <div>
                  <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold mb-4">
                    <Smartphone className="w-6 h-6" />
                  </div>
                  <h3 className="text-2xl font-black text-white mb-2">
                    {t("Shaxsiy Student App & Ota-ona Nazorati", "Student Tracking App", "Приложение для учеников и родителей")}
                  </h3>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    {t("Dars jadvali, baholar, oylik to'lov kvitansiyalari va o'qituvchi sharhlari hammasi bitta qulay ilovada jamlangan.", "Schedule, homework submission, audio drills, and payment ledger in one unified portal.", "Расписание, домашние задания, оценки и чеки оплаты в одном удобном приложении.")}
                  </p>
                </div>
                <div className="mt-6 flex items-center gap-3">
                  <a href="#app-spotlight" className="text-xs font-black text-amber-400 hover:underline flex items-center gap-1">
                    <span>{t("Ilova haqida ko'proq", "Learn more about app", "Подробнее о приложении")}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 3. TEACHERS SLIDE CAROUSEL WITH CERTIFICATE MODAL */}
        <section id="teachers" className="py-20 px-4 sm:px-6 lg:px-8 border-b border-white/10 relative">
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row md:items-end justify-between mb-12">
              <div>
                <span className="px-3 py-1 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/30 text-xs font-bold uppercase tracking-wider">
                  Mentors & Experts
                </span>
                <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight mt-2">
                  {t("Bizning O'qituvchilar", "Our Certified Teachers", "Наши Преподаватели")}
                </h2>
                <p className="text-xs sm:text-sm text-slate-400 mt-2">
                  {t("Xalqaro sertifikatli ustozlarimiz bilan tanishing va ularning TRF sertifikatlarini ko'ring", "Click on any teacher to view their official TRF score report and CELTA credentials", "Нажмите на любого преподавателя, чтобы посмотреть его официальный сертификат")}
                </p>
              </div>

              {/* Swiper Arrow Buttons */}
              <div className="flex items-center gap-3 mt-6 md:mt-0">
                <button
                  onClick={() => scrollCarousel(teacherCarouselRef, 'left')}
                  className="p-3 rounded-2xl bg-white/5 hover:bg-white/15 border border-white/10 text-white transition cursor-pointer"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button
                  onClick={() => scrollCarousel(teacherCarouselRef, 'right')}
                  className="p-3 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black transition cursor-pointer"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Horizontal Scroll Deck */}
            <div
              ref={teacherCarouselRef}
              className="flex gap-6 overflow-x-auto snap-x snap-mandatory scrollbar-none pb-6 cursor-grab"
              style={{ scrollbarWidth: 'none' }}
            >
              {(cmsContent.teachers || []).map((teacher) => (
                <div
                  key={teacher.id}
                  onClick={() => setSelectedTeacher(teacher)}
                  className="min-w-[280px] sm:min-w-[340px] snap-start rounded-3xl bg-white/5 border border-white/10 overflow-hidden backdrop-blur-md hover:border-amber-500/50 transition-all duration-300 flex flex-col justify-between group cursor-pointer shadow-xl hover:-translate-y-1"
                >
                  <div>
                    <div className="relative h-64 overflow-hidden bg-slate-900">
                      <img
                        src={teacher.image}
                        alt={teacher.name}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                      />
                      <div className="absolute top-3 right-3 px-3 py-1 rounded-full bg-amber-500 text-slate-950 text-xs font-black shadow-lg">
                        {teacher.badge}
                      </div>
                    </div>

                    <div className="p-6">
                      <h3 className="text-xl font-black text-white group-hover:text-amber-400 transition">
                        {teacher.name}
                      </h3>
                      <p className="text-xs font-bold text-amber-400/90 mt-1">
                        {teacher.role}
                      </p>
                      <p className="text-xs text-slate-400 mt-2.5 line-clamp-2 leading-relaxed">
                        {getLangText(teacher.bioUz, teacher.bioEn, teacher.bioRu)}
                      </p>

                      <div className="flex flex-wrap gap-1.5 mt-4">
                        {teacher.specialization.map((spec, i) => (
                          <span
                            key={i}
                            className="px-2.5 py-1 rounded-lg bg-white/10 text-[10px] font-bold text-slate-300"
                          >
                            {spec}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="p-6 pt-0 border-t border-white/10 mt-2 flex items-center justify-between text-xs text-slate-400">
                    <span className="font-bold text-amber-400">{teacher.experience}</span>
                    <span className="font-bold text-slate-200 flex items-center gap-1">
                      <span>TRF / Certificate</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 4. STUDENT RESULTS CAROUSEL WITH TRF SCORE MODAL */}
        <section id="results" className="py-20 px-4 sm:px-6 lg:px-8 border-b border-white/10 relative bg-white/5">
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row md:items-end justify-between mb-10">
              <div>
                <span className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-xs font-bold uppercase tracking-wider">
                  Verified Score Cards
                </span>
                <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight mt-2">
                  {t("O'quvchilarimiz Natijalari", "Student Exam Results", "Результаты Наших Студентов")}
                </h2>
                <p className="text-xs sm:text-sm text-slate-400 mt-2">
                  {t("IELTS va CEFR imtihonlarida erishilgan rasmiy natijalar bo'yicha hisobotlar", "Official TRF score cards achieved by our dedicated students", "Официальные результаты экзаменов IELTS и CEFR")}
                </p>
              </div>

              {/* Filter Pills */}
              <div className="flex flex-wrap items-center gap-2 mt-6 md:mt-0">
                {(
                  [
                    { id: 'all', label: 'Barchasi' },
                    { id: '8.0', label: 'IELTS 8.0+' },
                    { id: '7.5', label: 'IELTS 7.5+' },
                    { id: 'CEFR', label: 'CEFR' }
                  ] as const
                ).map((f) => (
                  <button
                    key={f.id}
                    onClick={() => setResultFilter(f.id)}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                      resultFilter === f.id
                        ? 'bg-amber-500 text-slate-950 font-black shadow-lg shadow-amber-500/20'
                        : 'bg-white/5 text-slate-300 hover:bg-white/15 border border-white/10'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Results Horizontal Swiper Deck */}
            <div
              ref={resultsCarouselRef}
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
            >
              {filteredResults.map((result) => (
                <div
                  key={result.id}
                  onClick={() => setSelectedResult(result)}
                  className="p-6 rounded-3xl bg-white/5 border border-white/10 hover:border-amber-500/50 backdrop-blur-md transition-all cursor-pointer group hover:-translate-y-1 shadow-xl"
                >
                  <div className="flex items-center justify-between mb-4">
                    <span className="px-3 py-1 rounded-full bg-amber-500/20 text-amber-400 text-xs font-black border border-amber-500/30">
                      {result.badge}
                    </span>
                    <span className="text-xs font-mono text-slate-400">{result.date}</span>
                  </div>

                  <h3 className="text-xl font-black text-white group-hover:text-amber-400 transition">
                    {result.studentName}
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">
                    {t("Ustoz: ", "Teacher: ", "Учитель: ")}{result.teacherName}
                  </p>

                  {/* Subscore pills */}
                  <div className="grid grid-cols-4 gap-2 mt-4 pt-4 border-t border-white/10 text-center text-xs">
                    <div className="p-2 rounded-xl bg-white/5 border border-white/5">
                      <span className="text-[10px] text-slate-400 block font-bold">L</span>
                      <span className="font-mono font-bold text-white">{result.listening}</span>
                    </div>
                    <div className="p-2 rounded-xl bg-white/5 border border-white/5">
                      <span className="text-[10px] text-slate-400 block font-bold">R</span>
                      <span className="font-mono font-bold text-white">{result.reading}</span>
                    </div>
                    <div className="p-2 rounded-xl bg-white/5 border border-white/5">
                      <span className="text-[10px] text-slate-400 block font-bold">W</span>
                      <span className="font-mono font-bold text-white">{result.writing}</span>
                    </div>
                    <div className="p-2 rounded-xl bg-white/5 border border-white/5">
                      <span className="text-[10px] text-slate-400 block font-bold">S</span>
                      <span className="font-mono font-bold text-white">{result.speaking}</span>
                    </div>
                  </div>

                  <button className="w-full mt-5 py-2.5 rounded-xl bg-white/10 hover:bg-amber-500 hover:text-slate-950 text-white font-bold text-xs transition">
                    {t("Sertifikat va TRF ni ko'rish", "View Official Certificate", "Посмотреть сертификат")}
                  </button>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 5. COURSE PRICING SLIDE ("BIZNING KURSLAR") */}
        <section id="courses" className="py-20 px-4 sm:px-6 lg:px-8 border-b border-white/10 relative">
          <div className="max-w-7xl mx-auto">
            <div className="text-center max-w-2xl mx-auto mb-14">
              <span className="px-3 py-1 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/30 text-xs font-bold uppercase tracking-wider">
                Flexible Pricing & Plans
              </span>
              <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight mt-2">
                {t("Bizning Kurslar va Narxlar", "Courses & Pricing Plans", "Наши Курсы и Тарифы")}
              </h2>
              <p className="text-xs sm:text-sm text-slate-400 mt-2">
                {t("Ehtiyojingizga mos keluvchi intensiv va natijali ta'lim dasturini tanlang", "Select the optimal learning path for your goals", "Выберите подходящий курс для достижения ваших целей")}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
              {(cmsContent.courses || []).map((course) => (
                <div
                  key={course.id}
                  className={`relative rounded-3xl p-8 bg-white/5 border backdrop-blur-md flex flex-col justify-between hover:border-amber-500/50 transition-all duration-300 shadow-2xl ${
                    course.isPopular ? 'border-amber-500/80 ring-2 ring-amber-500/30 bg-purple-900/20' : 'border-white/10'
                  }`}
                >
                  {course.isPopular && (
                    <span className="absolute -top-3.5 right-8 px-4 py-1 rounded-full bg-amber-500 text-slate-950 text-xs font-black shadow-lg">
                      {t("Eng ommabop", "Most Popular", "Самый популярный")}
                    </span>
                  )}

                  <div>
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold">
                        <BookOpen className="w-5 h-5" />
                      </div>
                      <h3 className="text-2xl font-black text-white">
                        {getLangText(course.titleUz, course.titleEn, course.titleRu)}
                      </h3>
                    </div>

                    <p className="text-xs text-slate-300 mb-6 leading-relaxed">
                      {getLangText(course.descUz, course.descEn, course.descRu)}
                    </p>

                    <div className="grid grid-cols-2 gap-4 p-4 rounded-2xl bg-white/5 mb-6 text-xs">
                      <div>
                        <p className="text-[10px] text-slate-400 uppercase font-bold">{t("Davomiyligi", "Duration", "Длительность")}</p>
                        <p className="font-bold text-slate-200">
                          {getLangText(course.durationUz, course.durationEn, course.durationRu)}
                        </p>
                      </div>
                      <div>
                        <p className="text-[10px] text-slate-400 uppercase font-bold">{t("Maqsad", "Target Level", "Уровень")}</p>
                        <p className="font-bold text-amber-400">
                          {getLangText(course.levelUz, course.levelEn, course.levelRu)}
                        </p>
                      </div>
                    </div>

                    <div className="space-y-3 mb-8">
                      {getLangArray(course.featuresUz, course.featuresEn, course.featuresRu).map((feat, i) => (
                        <div key={i} className="flex items-start gap-2.5 text-xs text-slate-300">
                          <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                          <span>{feat}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="pt-6 border-t border-white/10 flex items-center justify-between">
                    <div>
                      <p className="text-[10px] text-slate-400 uppercase font-bold">{t("Oylik to'lov", "Monthly Fee", "Ежемесячно")}</p>
                      <p className="text-2xl font-black text-white">
                        {getLangText(course.priceUz, course.priceEn, course.priceRu)}
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        setFormCourse(getLangText(course.titleUz, course.titleEn, course.titleRu));
                        setIsEnrollModalOpen(true);
                      }}
                      className="px-6 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs shadow-lg shadow-amber-500/20 transition cursor-pointer"
                    >
                      {t("Ro'yxatdan o'tish", "Register Now", "Записаться")}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 6. STUDENT APP SPOTLIGHT SLIDE ("STUDENT APP") */}
        <section id="app-spotlight" className="py-20 px-4 sm:px-6 lg:px-8 border-b border-white/10 relative bg-white/5">
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
              <div className="lg:col-span-6 space-y-6">
                <span className="px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-300 border border-indigo-500/30 text-xs font-bold uppercase tracking-wider">
                  Mobile & Web Ecosystem
                </span>
                <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight leading-tight">
                  {t("Barcha natija va vazifalar — kaftingizda!", "All grades & tasks right in your hand!", "Все оценки и домашние задания в одном месте!")}
                </h2>
                <p className="text-sm text-slate-300 leading-relaxed">
                  {t("CenterFlow Student Portal orqali har bir o'quvchi o'zining uyga vazifasini audio/rasm shaklida topshiradi, baho hamda AI xatolar tahlilini zudlik bilan qabul qiladi.", "Students submit homework, review audio drills, track tuition balances and receive AI solution diagnostic cards instantenously.", "Студенты сдают домашние задания, смотрят аналитику ИИ и отслеживают оплату в реальном времени.")}
                </p>

                <div className="space-y-4 pt-2">
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400">
                      <CheckCircle2 className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-white">{t("Real-vaqtda Davomat va Baholar", "Real-time Attendance & Grades", "Посещаемость и оценки в реальном времени")}</h4>
                      <p className="text-xs text-slate-400">{t("Dars o'tilishi bilan o'qituvchi qo'ygan baho va sharhlar student portalida aks etadi.", "Instant grade and commentary sync via Firestore listeners.", "Мгновенная синхронизация оценок и комментариев.")}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-xl bg-indigo-500/20 text-indigo-400">
                      <Sparkles className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-white">{t("24/7 AI Tahlil va Yechim Tushuntirishi", "24/7 AI Diagnostics & Explanations", "24/7 ИИ-Аналитика и объяснение ошибок")}</h4>
                      <p className="text-xs text-slate-400">{t("Matematika, IELTS insho va IT kod xatolarini avtomatik tahlil qiluvchi sun'iy intellekt.", "AI error diagnostics highlighting formula mistakes and grammar fixes.", "ИИ автоматическая диагностика ошибок в коде и эссе.")}</p>
                    </div>
                  </div>
                </div>

                <div className="pt-4 flex items-center gap-4">
                  <button
                    onClick={onOpenAuth}
                    className="px-6 py-3.5 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs shadow-xl shadow-amber-500/20 transition cursor-pointer"
                  >
                    {t("Student Portalga Kirish", "Open Student Portal", "Войти в Студенческий Портал")}
                  </button>
                </div>
              </div>

              {/* App UI Visual Mockup */}
              <div className="lg:col-span-6 relative">
                <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-purple-900/50 via-slate-900/80 to-slate-950 border border-white/15 backdrop-blur-xl shadow-2xl space-y-4">
                  <div className="flex items-center justify-between pb-4 border-b border-white/10">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-amber-500 text-slate-950 font-black flex items-center justify-center">
                        CF
                      </div>
                      <div>
                        <h4 className="text-sm font-black text-white">Student Dashboard Preview</h4>
                        <p className="text-[10px] text-amber-400 font-mono">Live Firestore Sync</p>
                      </div>
                    </div>
                    <span className="px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-bold">
                      Active Session
                    </span>
                  </div>

                  {/* Sample Homework Card */}
                  <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-amber-400">IELTS Essay #4: Task 2</span>
                      <span className="text-[10px] font-mono text-slate-400">Score: Band 8.0</span>
                    </div>
                    <p className="text-xs text-slate-300 italic">"Technology impact on modern education system..."</p>
                    <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-[11px] text-emerald-300">
                      💡 AI Diagnostic: Excellent lexical resource and cohesive transition paragraphs.
                    </div>
                  </div>

                  {/* Attendance Matrix */}
                  <div className="grid grid-cols-4 gap-2 pt-2 text-center text-[10px]">
                    <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-300 font-bold">Mon (Present)</div>
                    <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-300 font-bold">Wed (Present)</div>
                    <div className="p-2 rounded-xl bg-amber-500/20 text-amber-300 font-bold">Fri (Late 5m)</div>
                    <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-300 font-bold">Sat (Present)</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 7. BRANCHES SLIDE ("BIZNING FILIALLAR") */}
        <section id="branches" className="py-20 px-4 sm:px-6 lg:px-8 border-b border-white/10 relative">
          <div className="max-w-7xl mx-auto">
            <div className="text-center max-w-2xl mx-auto mb-14">
              <span className="px-3 py-1 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/30 text-xs font-bold uppercase tracking-wider">
                Locations & Campus
              </span>
              <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight mt-2">
                {t("Bizning Filiallarimiz", "Our Branches", "Наши Филиалы")}
              </h2>
              <p className="text-xs sm:text-sm text-slate-400 mt-2">
                {t("Toshkent shahridagi zamonaviy va qulay metroga yaqin filiallarimiz", "Conveniently located campuses near major metro stations in Tashkent", "Современные филиалы возле станций метро в Ташкенте")}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {branchesList.map((branch) => (
                <div
                  key={branch.id}
                  className="p-6 rounded-3xl bg-white/5 border border-white/10 hover:border-amber-500/50 backdrop-blur-md transition-all flex flex-col justify-between shadow-xl"
                >
                  <div>
                    <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center mb-4">
                      <Building className="w-5 h-5" />
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2">
                      {getLangText(branch.nameUz, branch.nameEn, branch.nameRu)}
                    </h3>
                    <p className="text-xs text-slate-400 flex items-start gap-1.5 mb-4 leading-relaxed">
                      <MapPin className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                      <span>{getLangText(branch.addressUz, branch.addressEn, branch.addressRu)}</span>
                    </p>
                    <p className="text-xs text-slate-400 flex items-center gap-1.5 mb-2">
                      <Clock className="w-3.5 h-3.5 text-amber-400" />
                      <span>{branch.hours}</span>
                    </p>
                  </div>

                  <div className="pt-4 border-t border-white/10 mt-4 flex items-center justify-between">
                    <a
                      href={`tel:${branch.phone.replace(/\s+/g, '')}`}
                      className="text-xs font-bold text-amber-400 hover:underline flex items-center gap-1"
                    >
                      <Phone className="w-3.5 h-3.5" />
                      <span>{branch.phone}</span>
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 8. INTERACTIVE FAQ ACCORDION */}
        <section id="faq" className="py-20 px-4 sm:px-6 lg:px-8 border-b border-white/10 relative bg-white/5">
          <div className="max-w-4xl mx-auto">
            <div className="text-center max-w-2xl mx-auto mb-10">
              <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
                {t("Ko'p Beriladigan Savollar", "Frequently Asked Questions", "Часто задаваемые вопросы")}
              </h2>
              <p className="text-xs sm:text-sm text-slate-400 mt-2">
                {t("CenterFlow ta'lim tizimi haqida eng ko'p so'raladigan savollarga javoblar", "Answers to common inquiries about our curriculum and scheduling", "Ответы на частые вопросы об обучении")}
              </p>
            </div>

            {/* Search Bar */}
            <div className="relative mb-8">
              <Search className="w-4 h-4 absolute left-4 top-3.5 text-slate-400" />
              <input
                type="text"
                value={faqSearch}
                onChange={(e) => setFaqSearch(e.target.value)}
                placeholder={t("Savolni izlang...", "Search question...", "Поиск вопроса...")}
                className="w-full pl-11 pr-4 py-3 rounded-2xl bg-white/10 border border-white/15 text-sm text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>

            {/* Accordion list */}
            <div className="space-y-4">
              {filteredFAQs.map((faq) => {
                const isExpanded = expandedFaqId === faq.id;
                const question = getLangText(faq.questionUz, faq.questionEn, faq.questionRu);
                const answer = getLangText(faq.answerUz, faq.answerEn, faq.answerRu);

                return (
                  <div
                    key={faq.id}
                    className="rounded-2xl bg-white/5 border border-white/10 overflow-hidden"
                  >
                    <button
                      onClick={() => setExpandedFaqId(isExpanded ? null : faq.id)}
                      className="w-full p-5 text-left font-bold text-sm text-white flex items-center justify-between cursor-pointer hover:text-amber-400 transition"
                    >
                      <span>{question}</span>
                      <ChevronDown
                        className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${
                          isExpanded ? 'rotate-180 text-amber-400' : ''
                        }`}
                      />
                    </button>
                    {isExpanded && (
                      <div className="px-5 pb-5 text-xs text-slate-300 border-t border-white/10 pt-3 leading-relaxed">
                        {answer}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* 9. LEAD CONTACT & FOOTER CTA BANNER */}
        <section id="contact" className="py-20 px-4 sm:px-6 lg:px-8 relative">
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
              {/* Lead Intake Form */}
              <div className="p-8 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-xl shadow-2xl">
                <h2 className="text-2xl font-black text-white mb-2">
                  {t("Bepul Darsga Yozilish", "Book a Free Trial Lesson", "Записаться на пробный урок")}
                </h2>
                <p className="text-xs text-slate-400 mb-6">
                  {t("Ma'lumotlaringizni qoldiring, qabul bo'limimiz 15 daqiqada bog'lanadi!", "Fill in your details and our team will contact you within 15 minutes!", "Оставьте данные, и мы свяжемся с вами в течение 15 минут!")}
                </p>

                {submitSuccess ? (
                  <div className="p-6 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-center space-y-2">
                    <CheckCircle2 className="w-10 h-10 mx-auto text-emerald-400" />
                    <h4 className="text-lg font-bold">{t("Arizangiz Qabul Qilindi!", "Application Received!", "Заявка принята!")}</h4>
                    <p className="text-xs">{t("Rahmat! Tez orada siz bilan bog'lanamiz.", "Thank you! We will call you soon.", "Спасибо! Мы скоро свяжемся с вами.")}</p>
                    <button
                      onClick={() => setSubmitSuccess(false)}
                      className="mt-4 px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold cursor-pointer"
                    >
                      {t("Yangi ariza topshirish", "Submit another application", "Отправить другую заявку")}
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleLeadSubmit} className="space-y-4">
                    <div>
                      <label className="text-xs font-bold text-slate-300 block mb-1">
                        {t("Ism va Familiyangiz", "Full Name", "Имя и Фамилия")}
                      </label>
                      <input
                        type="text"
                        required
                        value={formName}
                        onChange={(e) => setFormName(e.target.value)}
                        placeholder="e.g. Jasurbek Rahimov"
                        className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/15 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-bold text-slate-300 block mb-1">
                        {t("Telefon Raqamingiz", "Phone Number", "Номер телефона")}
                      </label>
                      <input
                        type="tel"
                        required
                        value={formPhone}
                        onChange={(e) => setFormPhone(e.target.value)}
                        placeholder="+998 90 123 45 67"
                        className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/15 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500 font-mono"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-bold text-slate-300 block mb-1">
                        {t("Tanlangan Kurs", "Select Course", "Выберите курс")}
                      </label>
                      <select
                        value={formCourse}
                        onChange={(e) => setFormCourse(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl bg-[#120320] border border-white/15 text-xs text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                      >
                        <option value="">{t("-- Kursni Tanlang --", "-- Select Course --", "-- Выберите курс --")}</option>
                        <option value="IELTS Standard">IELTS Standard (7.0+ Target)</option>
                        <option value="IELTS Rocket">IELTS Rocket Intensive (8.5+ Target)</option>
                        <option value="General English">General English (A1 - C1)</option>
                        <option value="IT Programming">IT & Web Development</option>
                      </select>
                    </div>

                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full py-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs uppercase tracking-wider shadow-xl shadow-amber-500/20 transition cursor-pointer flex items-center justify-center gap-2"
                    >
                      <Send className="w-4 h-4" />
                      <span>{isSubmitting ? 'Yuborilmoqda...' : t("Ariza Topshirish", "Submit Application", "Отправить заявку")}</span>
                    </button>
                  </form>
                )}
              </div>

              {/* Direct Call & Social Banner */}
              <div className="space-y-8">
                <div className="p-8 rounded-3xl bg-gradient-to-br from-purple-900/40 via-white/5 to-white/5 border border-white/10 backdrop-blur-xl">
                  <span className="text-xs font-mono text-amber-400 block mb-1">Direct Hotline</span>
                  <h3 className="text-3xl font-black text-white mb-4">
                    +998 55 511 09 09
                  </h3>
                  <p className="text-xs text-slate-300 mb-6 leading-relaxed">
                    {t("Qabul bo'limimiz haftaning barcha kunlari soat 08:00 dan 20:00 gacha qo'ng'iroqlarga javob beradi.", "Our call center is open 7 days a week from 08:00 to 20:00.", "Колл-центр работает ежедневно с 08:00 до 20:00.")}
                  </p>
                  <div className="flex items-center gap-3">
                    <a
                      href="https://t.me"
                      target="_blank"
                      rel="noreferrer"
                      className="px-4 py-2.5 rounded-xl bg-sky-500/20 text-sky-300 border border-sky-500/30 text-xs font-bold hover:bg-sky-500/30 transition flex items-center gap-2"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>Telegram Manager</span>
                    </a>
                    <a
                      href="https://instagram.com"
                      target="_blank"
                      rel="noreferrer"
                      className="px-4 py-2.5 rounded-xl bg-pink-500/20 text-pink-300 border border-pink-500/30 text-xs font-bold hover:bg-pink-500/30 transition flex items-center gap-2"
                    >
                      <Instagram className="w-3.5 h-3.5" />
                      <span>Instagram</span>
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="py-8 border-t border-white/10 px-4 text-center text-xs text-slate-500">
          <p>© 2026 CenterFlow. All rights reserved. Built for IELTS & Multi-Subject Mastery.</p>
        </footer>
      </div>

      {/* STUDENT RESULT TRF CERTIFICATE MODAL */}
      <ResultCertificateModal
        result={selectedResult}
        onClose={() => setSelectedResult(null)}
      />

      {/* TEACHER TRF & CREDENTIALS MODAL */}
      <AnimatePresence>
        {selectedTeacher && (
          <div
            onClick={() => setSelectedTeacher(null)}
            className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto"
          >
            <div
              onClick={(e) => e.stopPropagation()}
              className="bg-[#120320] border border-white/15 rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl text-white space-y-6 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold">
                    <GraduationCap className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-black">{selectedTeacher.name}</h3>
                    <p className="text-xs text-amber-400 font-bold">{selectedTeacher.role}</p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedTeacher(null)}
                  className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-slate-400 hover:text-white transition cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Verified Credentials Box */}
              <div className="p-6 rounded-2xl bg-white/5 border border-white/10 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-400 uppercase">Official Certification</span>
                  <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-black">
                    {selectedTeacher.badge} Verified
                  </span>
                </div>

                <p className="text-xs text-slate-300 leading-relaxed">
                  {getLangText(selectedTeacher.bioUz, selectedTeacher.bioEn, selectedTeacher.bioRu)}
                </p>

                <div className="grid grid-cols-2 gap-4 pt-2 text-xs">
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">Tajriba</span>
                    <span className="font-bold text-amber-400">{selectedTeacher.experience}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">Tayyorlangan Studentlar</span>
                    <span className="font-bold text-emerald-400">{selectedTeacher.resultsCount}+ Natijalar</span>
                  </div>
                </div>
              </div>

              {/* Sample TRF Scanned Image Graphic */}
              <div className="relative rounded-2xl overflow-hidden border border-white/10 aspect-video bg-slate-900 group">
                <img
                  src={selectedTeacher.image}
                  alt={selectedTeacher.name}
                  className="w-full h-full object-cover opacity-80 group-hover:scale-105 transition"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent flex items-end p-6">
                  <div>
                    <span className="text-[10px] font-mono text-amber-400 uppercase block">Certified Test Report Form</span>
                    <h4 className="text-lg font-bold text-white">{selectedTeacher.name} — TRF #789042</h4>
                  </div>
                </div>
              </div>

              <button
                onClick={() => setSelectedTeacher(null)}
                className="w-full py-3.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs uppercase cursor-pointer"
              >
                Yopish
              </button>
            </div>
          </div>
        )}
      </AnimatePresence>

      {/* QUICK ENROLLMENT REGISTRATION MODAL */}
      <AnimatePresence>
        {isEnrollModalOpen && (
          <div
            onClick={() => setIsEnrollModalOpen(false)}
            className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto"
          >
            <div
              onClick={(e) => e.stopPropagation()}
              className="bg-[#120320] border border-white/15 rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl text-white space-y-6"
            >
              <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-xl font-black">Ro'yxatdan O'tish</h3>
                    <p className="text-xs text-slate-400">Sinov darsi va daraja aniqlash testiga yoziling</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsEnrollModalOpen(false)}
                  className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-slate-400 hover:text-white transition cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={(e) => { handleLeadSubmit(e); setIsEnrollModalOpen(false); }} className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">
                    Ism va Familiyangiz
                  </label>
                  <input
                    type="text"
                    required
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="e.g. Jasurbek Rahimov"
                    className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/15 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">
                    Telefon Raqamingiz
                  </label>
                  <input
                    type="tel"
                    required
                    value={formPhone}
                    onChange={(e) => setFormPhone(e.target.value)}
                    placeholder="+998 90 123 45 67"
                    className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/15 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500 font-mono"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">
                    Qaysi dars yoki kursga yozilmoqchisiz?
                  </label>
                  <select
                    value={formCourse}
                    onChange={(e) => setFormCourse(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-[#120320] border border-white/15 text-xs text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                  >
                    <option value="IELTS Standard">IELTS Standard (7.0+ Target)</option>
                    <option value="IELTS Rocket">IELTS Rocket Intensive (8.5+ Target)</option>
                    <option value="General English">General English (A1 - C1)</option>
                    <option value="IT Programming">IT & Web Development</option>
                  </select>
                </div>

                <button
                  type="submit"
                  className="w-full py-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs uppercase tracking-wider shadow-xl shadow-amber-500/20 transition cursor-pointer"
                >
                  Ro'yxatdan o'tishni tasdiqlash
                </button>
              </form>
            </div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
