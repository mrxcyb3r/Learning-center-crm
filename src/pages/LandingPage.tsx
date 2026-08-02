import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'react-toastify';
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';
import { TypewriterText } from '../components/common/TypewriterText';
import { TestimonialsCarousel } from '../components/common/TestimonialsCarousel';
import { StudentResult, Teacher, LandingPageContent } from '../types';
import { ResultCertificateModal } from '../components/ResultCertificateModal';
import { TeacherCertificateModal } from '../components/TeacherCertificateModal';
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
  Compass,
  FileCheck,
  Globe
} from 'lucide-react';

interface LandingPageProps {
  onOpenAuth: () => void;
}

// ----------------------------------------------------
// Section List for Scroll Spy
// ----------------------------------------------------
const SECTIONS = [
  { id: 'hero', labelUz: 'Bosh sahifa', labelEn: 'Home', labelRu: 'Главная', path: '/' },
  { id: 'why-us', labelUz: 'Afzalliklar', labelEn: 'Why Us', labelRu: 'Преимущества', path: '#why-us' },
  { id: 'teachers', labelUz: "O'qituvchilar", labelEn: 'Teachers', labelRu: 'Преподаватели', path: '#teachers' },
  { id: 'results', labelUz: 'Natijalar', labelEn: 'Results', labelRu: 'Результаты', path: '#results' },
  { id: 'courses', labelUz: 'Kurslar', labelEn: 'Courses', labelRu: 'Курсы', path: '#courses' },
  { id: 'student-app', labelUz: 'Student App', labelEn: 'Student App', labelRu: 'Приложение', path: '#student-app' },
  { id: 'branches', labelUz: 'Filiallar', labelEn: 'Branches', labelRu: 'Филиалы', path: '#branches' },
  { id: 'faq', labelUz: 'FAQs', labelEn: 'FAQs', labelRu: 'Вопросы', path: '#faq' }
];

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
  const { language, setLanguage, t: dict, translate: t } = useLanguage();
  const { theme } = useTheme();

  // Language switcher dropdown state
  const [isLangDropdownOpen, setIsLangDropdownOpen] = useState(false);

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

  // FAQ search & expanded item
  const [faqSearch, setFaqSearch] = useState('');
  const [expandedFaqId, setExpandedFaqId] = useState<string | null>('f1');

  // Carousel Scroll Refs
  const teacherCarouselRef = useRef<HTMLDivElement>(null);
  const resultsCarouselRef = useRef<HTMLDivElement>(null);

  // ----------------------------------------------------
  // Dynamic Scroll Spy Hook & Hash Updater
  // ----------------------------------------------------
  const [activeSection, setActiveSection] = useState<string>('hero');

  useEffect(() => {
    const observerOptions = {
      root: null,
      rootMargin: '-20% 0px -60% 0px',
      threshold: 0
    };

    const handleIntersect: IntersectionObserverCallback = (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const sectionId = entry.target.id;
          setActiveSection(sectionId);

          // Update URL bar silently without reloading or page jump
          if (sectionId === 'hero') {
            window.history.replaceState(null, '', window.location.pathname);
          } else {
            window.history.replaceState(null, '', `#${sectionId}`);
          }
        }
      });
    };

    const observer = new IntersectionObserver(handleIntersect, observerOptions);

    SECTIONS.forEach((sec) => {
      const el = document.getElementById(sec.id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, []);

  // Smooth scroll handler
  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
      setActiveSection(id);
      if (id === 'hero') {
        window.history.replaceState(null, '', window.location.pathname);
      } else {
        window.history.replaceState(null, '', `#${id}`);
      }
    }
  };

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
      setIsEnrollModalOpen(false);
    } catch (err) {
      console.warn('Firestore write notice (fallback enabled):', err);
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
      setIsEnrollModalOpen(false);
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
      hours: '08:00 - 20:00 (Du - Sha)'
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
      hours: '08:00 - 20:00 (Du - Sha)'
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
      hours: '08:00 - 20:00 (Du - Sha)'
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
        {/* SINGLE UNIFIED FIXED HEADER BAR WITH DYNAMIC ACTIVE STATE */}
        <header className="fixed top-0 left-0 right-0 z-50 backdrop-blur-xl bg-[#0d021a]/90 border-b border-white/10 px-4 py-3 sm:px-8 transition-all shadow-2xl">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            {/* Brand Logo */}
            <button
              onClick={() => scrollToSection('hero')}
              className="flex items-center gap-2.5 text-white font-black text-xl tracking-tight cursor-pointer hover:opacity-90 transition"
            >
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-500 to-yellow-300 text-slate-950 flex items-center justify-center font-black text-lg shadow-lg shadow-amber-500/20">
                CF
              </div>
              <span>Center<span className="text-amber-400">Flow</span></span>
            </button>

            {/* Desktop Navigation Links with Active Scroll-Spy Pill */}
            <nav className="hidden lg:flex items-center gap-2 bg-white/5 border border-white/10 p-1.5 rounded-2xl">
              {SECTIONS.filter(s => s.id !== 'hero').map((sec) => {
                const isActive = activeSection === sec.id;
                const label = getLangText(sec.labelUz, sec.labelEn, sec.labelRu);

                return (
                  <button
                    key={sec.id}
                    onClick={() => scrollToSection(sec.id)}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                      isActive
                        ? 'bg-amber-500 text-slate-950 font-black shadow-md shadow-amber-500/20'
                        : 'text-slate-300 hover:text-white hover:bg-white/10'
                    }`}
                  >
                    {label}
                  </button>
                );
              })}
            </nav>

            {/* Quick Action Buttons */}
            <div className="flex items-center gap-3">
              {/* Language Switcher Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setIsLangDropdownOpen(!isLangDropdownOpen)}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-white bg-white/10 hover:bg-white/20 border border-white/15 transition cursor-pointer"
                  title="Switch Language / Tilni o'zgartirish"
                >
                  <Globe className="w-4 h-4 text-amber-400" />
                  <span>{language === 'UZ' ? 'UZ 🇺🇿' : language === 'RU' ? 'RU 🇷🇺' : 'EN 🇬🇧'}</span>
                  <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${isLangDropdownOpen ? 'rotate-180' : ''}`} />
                </button>

                {isLangDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-36 bg-[#18052b] border border-amber-500/30 rounded-2xl shadow-2xl py-1.5 z-50">
                    <button
                      onClick={() => {
                        setLanguage('UZ');
                        setIsLangDropdownOpen(false);
                      }}
                      className={`w-full flex items-center gap-2 px-3.5 py-2 text-xs font-bold transition cursor-pointer ${
                        language === 'UZ'
                          ? 'bg-amber-500/20 text-amber-400 font-black'
                          : 'text-slate-300 hover:bg-white/10 hover:text-white'
                      }`}
                    >
                      <span>🇺🇿</span> O'zbek (UZ)
                    </button>
                    <button
                      onClick={() => {
                        setLanguage('EN');
                        setIsLangDropdownOpen(false);
                      }}
                      className={`w-full flex items-center gap-2 px-3.5 py-2 text-xs font-bold transition cursor-pointer ${
                        language === 'EN'
                          ? 'bg-amber-500/20 text-amber-400 font-black'
                          : 'text-slate-300 hover:bg-white/10 hover:text-white'
                      }`}
                    >
                      <span>🇬🇧</span> English (EN)
                    </button>
                    <button
                      onClick={() => {
                        setLanguage('RU');
                        setIsLangDropdownOpen(false);
                      }}
                      className={`w-full flex items-center gap-2 px-3.5 py-2 text-xs font-bold transition cursor-pointer ${
                        language === 'RU'
                          ? 'bg-amber-500/20 text-amber-400 font-black'
                          : 'text-slate-300 hover:bg-white/10 hover:text-white'
                      }`}
                    >
                      <span>🇷🇺</span> Русский (RU)
                    </button>
                  </div>
                )}
              </div>

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

        {/* 1. HERO SECTION (PURE FADE-IN MOTION) */}
        <section id="hero" className="relative min-h-[88vh] flex items-center justify-center pt-28 sm:pt-36 pb-16 px-4 sm:px-6 lg:px-8 border-b border-white/10">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, ease: 'easeOut' }}
            className="max-w-7xl mx-auto w-full text-center relative z-10"
          >
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
              <button
                onClick={() => scrollToSection('courses')}
                className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-white/10 hover:bg-white/15 text-white font-bold text-sm border border-white/15 transition flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>{t("Kurslar ro'yxatini ko'rish", "Explore Courses", "Посмотреть курсы")}</span>
                <ChevronDown className="w-4 h-4 text-amber-400" />
              </button>
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
          </motion.div>
        </section>

        {/* 2. BENTO-GRID FEATURE HIGHLIGHTS ("WHY CHOOSE US" - FADE-UP MOTION FOR ALL DIVS) */}
        <section id="why-us" className="py-20 px-4 sm:px-6 lg:px-8 border-b border-white/10 relative">
          <div className="max-w-7xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 35 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.6 }}
              className="text-center max-w-2xl mx-auto mb-14"
            >
              <span className="px-3 py-1 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/30 text-xs font-bold uppercase tracking-wider">
                System & Ecosystem
              </span>
              <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight mt-2">
                {t("Nega Aynan CenterFlow?", "Why Choose CenterFlow?", "Почему выбирают CenterFlow?")}
              </h2>
              <p className="text-xs sm:text-sm text-slate-400 mt-2">
                {t("An'anaviy darslardan farqli o'laroq, natijaga 100% yo'naltirilgan zamonaviy ta'lim ekotizimi", "An ecosystem designed for maximum learning retention and high scores", "Экосистема, нацеленная на 100% результаты учеников")}
              </p>
            </motion.div>

            {/* Bento Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {/* Bento Card 1: Main Feature (Wide 2-col) */}
              <motion.div
                initial={{ opacity: 0, y: 45 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="md:col-span-2 p-8 rounded-3xl bg-gradient-to-br from-purple-900/40 via-white/5 to-white/5 border border-white/10 backdrop-blur-md flex flex-col justify-between hover:border-amber-500/50 transition group"
              >
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
              </motion.div>

              {/* Bento Card 2: Team of 9.0 Teachers */}
              <motion.div
                initial={{ opacity: 0, y: 45 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="p-8 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-md flex flex-col justify-between hover:border-amber-500/50 transition"
              >
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
              </motion.div>

              {/* Bento Card 3: Weekly Mock Tests */}
              <motion.div
                initial={{ opacity: 0, y: 45 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{ duration: 0.5, delay: 0.3 }}
                className="p-8 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-md flex flex-col justify-between hover:border-amber-500/50 transition"
              >
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
              </motion.div>

              {/* Bento Card 4: Free Support Teachers */}
              <motion.div
                initial={{ opacity: 0, y: 45 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{ duration: 0.5, delay: 0.4 }}
                className="p-8 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-md flex flex-col justify-between hover:border-amber-500/50 transition"
              >
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
              </motion.div>

              {/* Bento Card 5: Speaking Clubs */}
              <motion.div
                initial={{ opacity: 0, y: 45 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{ duration: 0.5, delay: 0.5 }}
                className="p-8 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-md flex flex-col justify-between hover:border-amber-500/50 transition"
              >
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
              </motion.div>

              {/* Bento Card 6: Student Mobile & Web App (Wide 2-col) */}
              <motion.div
                initial={{ opacity: 0, y: 45 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{ duration: 0.5, delay: 0.6 }}
                className="md:col-span-2 p-8 rounded-3xl bg-gradient-to-r from-amber-500/10 via-purple-900/30 to-white/5 border border-white/10 backdrop-blur-md flex flex-col justify-between hover:border-amber-500/50 transition"
              >
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
                  <button onClick={() => scrollToSection('student-app')} className="text-xs font-black text-amber-400 hover:underline flex items-center gap-1 cursor-pointer">
                    <span>{t("Ilova haqida ko'proq", "Learn more about app", "Подробнее о приложении")}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* 3. TEACHERS SLIDE CAROUSEL WITH CERTIFICATE MODAL (FADE FROM LEFT & RIGHT MOTION) */}
        <section id="teachers" className="py-20 px-4 sm:px-6 lg:px-8 border-b border-white/10 relative">
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 overflow-hidden">
              <motion.div
                initial={{ opacity: 0, x: -60 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{ duration: 0.6, ease: 'easeOut' }}
              >
                <span className="px-3 py-1 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/30 text-xs font-bold uppercase tracking-wider">
                  Mentors & Experts
                </span>
                <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight mt-2">
                  {t("Bizning O'qituvchilar", "Our Certified Teachers", "Наши Преподаватели")}
                </h2>
                <p className="text-xs sm:text-sm text-slate-400 mt-2">
                  {t("Xalqaro sertifikatli ustozlarimiz bilan tanishing va ularning CELTA va IELTS sertifikatlarini ko'ring", "Click on any teacher to view their official TRF score report and CELTA credentials", "Нажмите на любого преподавателя, чтобы посмотреть его официальный сертификат")}
                </p>
              </motion.div>

              {/* Swiper Arrow Buttons (Fade from Right) */}
              <motion.div
                initial={{ opacity: 0, x: 60 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{ duration: 0.6, ease: 'easeOut' }}
                className="flex items-center gap-3 mt-6 md:mt-0"
              >
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
              </motion.div>
            </div>

            {/* Horizontal Scroll Deck */}
            <div
              ref={teacherCarouselRef}
              className="flex gap-6 overflow-x-auto snap-x snap-mandatory scrollbar-none pb-6 cursor-grab"
              style={{ scrollbarWidth: 'none' }}
            >
              {(cmsContent.teachers || []).map((teacher, index) => (
                <motion.div
                  key={teacher.id}
                  initial={{ opacity: 0, x: index % 2 === 0 ? -70 : 70 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true, amount: 0.2 }}
                  transition={{ duration: 0.6, delay: index * 0.08 }}
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
                    <span className="font-bold text-slate-200 flex items-center gap-1 hover:text-amber-400 transition">
                      <FileCheck className="w-3.5 h-3.5 text-amber-400" />
                      <span>CELTA / TRF Cert</span>
                      <ExternalLink className="w-3 h-3" />
                    </span>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* 4. STUDENT RESULTS CAROUSEL WITH TRF SCORE MODAL (SLIDER CAROUSEL & ZOOM-IN MOTION) */}
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

              {/* Filter Pills & Swiper Arrow Controls */}
              <div className="flex flex-wrap items-center gap-3 mt-6 md:mt-0">
                <div className="flex flex-wrap items-center gap-2">
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

                <div className="flex items-center gap-2 pl-2 border-l border-white/10">
                  <button
                    onClick={() => scrollCarousel(resultsCarouselRef, 'left')}
                    className="p-2.5 rounded-xl bg-white/5 hover:bg-white/15 border border-white/10 text-white transition cursor-pointer"
                    title="Previous Results"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => scrollCarousel(resultsCarouselRef, 'right')}
                    className="p-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold transition cursor-pointer"
                    title="Next Results"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Results Horizontal Swiper / Slider Deck */}
            <div
              ref={resultsCarouselRef}
              className="flex gap-6 overflow-x-auto snap-x snap-mandatory scrollbar-none pb-6 cursor-grab"
              style={{ scrollbarWidth: 'none' }}
            >
              {filteredResults.map((result, idx) => (
                <motion.div
                  key={result.id}
                  initial={{ opacity: 0, scale: 0.88 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true, amount: 0.2 }}
                  transition={{ duration: 0.5, delay: idx * 0.06 }}
                  onClick={() => setSelectedResult(result)}
                  className="min-w-[280px] sm:min-w-[340px] snap-start p-6 rounded-3xl bg-white/5 border border-white/10 hover:border-amber-500/50 backdrop-blur-md transition-all cursor-pointer group hover:-translate-y-1 shadow-xl flex flex-col justify-between"
                >
                  <div>
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
                  </div>

                  <button className="w-full mt-5 py-2.5 rounded-xl bg-white/10 hover:bg-amber-500 hover:text-slate-950 text-white font-bold text-xs transition flex items-center justify-center gap-1.5">
                    <FileCheck className="w-4 h-4" />
                    <span>{t("Sertifikat va TRF ni ko'rish", "View Official Certificate", "Посмотреть сертификат")}</span>
                  </button>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* 5. COURSE PRICING GRID (AOS-STYLE ZOOM FROM BEHIND TO FRONT MOTION) */}
        <section id="courses" className="py-20 px-4 sm:px-6 lg:px-8 border-b border-white/10 relative">
          <div className="max-w-7xl mx-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.6 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
              className="text-center max-w-2xl mx-auto mb-14"
            >
              <span className="px-3 py-1 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/30 text-xs font-bold uppercase tracking-wider">
                Flexible Pricing & Plans
              </span>
              <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight mt-2">
                {t("Bizning Kurslar va Narxlar", "Courses & Pricing Plans", "Наши Курсы и Тарифы")}
              </h2>
              <p className="text-xs sm:text-sm text-slate-400 mt-2">
                {t("Ehtiyojingizga mos keluvchi intensiv va natijali ta'lim dasturini tanlang", "Select the optimal learning path for your goals", "Выберите подходящий курс для достижения ваших целей")}
              </p>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
              {(cmsContent.courses || []).map((course, i) => (
                <motion.div
                  key={course.id}
                  initial={{ opacity: 0, scale: 0.65, y: 30 }}
                  whileInView={{ opacity: 1, scale: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.2 }}
                  transition={{ duration: 0.7, delay: i * 0.12, ease: [0.16, 1, 0.3, 1] }}
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
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* 6. STUDENT APP SPOTLIGHT (FADE-RIGHT ON TEXT, FADE-LEFT ON APP CARDS) */}
        <section id="student-app" className="py-20 px-4 sm:px-6 lg:px-8 border-b border-white/10 relative bg-white/5 overflow-hidden">
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
              {/* Text Side (Fade Right) */}
              <motion.div
                initial={{ opacity: 0, x: -60 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{ duration: 0.7, ease: 'easeOut' }}
                className="lg:col-span-6 space-y-6"
              >
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
                      <h4 className="text-sm font-bold text-white">{t("24/7 AI Tahlil va Yechim Tushuntirishi", "24/7 AI Diagnostics & Explanations", "24/7 ИИ-Аналитика и объяснение решений")}</h4>
                      <p className="text-xs text-slate-400">{t("Xatolar ustida ishlash uchun AI mentoridan qadamba-qadam tushuntirish olasiz.", "AI steps in to analyze incorrect homework options and suggest improvements.", "ИИ помогает разобрать ошибки и дает рекомендации.")}</p>
                    </div>
                  </div>
                </div>

                <div className="pt-4 flex items-center gap-4">
                  <button
                    onClick={onOpenAuth}
                    className="px-6 py-3.5 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs shadow-xl shadow-amber-500/20 transition cursor-pointer flex items-center gap-2"
                  >
                    <span>{t("Student Portalga kirish", "Open Student Portal", "Войти в Портал")}</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>

              {/* Mockup Display Side (Fade Left) */}
              <motion.div
                initial={{ opacity: 0, x: 60 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{ duration: 0.7, ease: 'easeOut', delay: 0.15 }}
                className="lg:col-span-6 relative"
              >
                <div className="relative mx-auto max-w-sm rounded-3xl bg-slate-900 border-4 border-slate-800 p-4 shadow-2xl overflow-hidden">
                  <div className="p-4 bg-[#120320] rounded-2xl border border-white/10 text-xs space-y-4">
                    <div className="flex items-center justify-between pb-3 border-b border-white/10">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold">
                          CF
                        </div>
                        <div>
                          <p className="font-bold text-white text-xs">Jasurbek Aliyev</p>
                          <p className="text-[10px] text-amber-400">IELTS Rocket 8.5 Group</p>
                        </div>
                      </div>
                      <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-bold text-[10px]">
                        Active
                      </span>
                    </div>

                    <div className="p-3 rounded-xl bg-white/5 border border-white/5 space-y-2">
                      <div className="flex justify-between items-center text-[10px] text-slate-400 font-bold">
                        <span>Haftalik Progress</span>
                        <span className="text-amber-400">92% High Performance</span>
                      </div>
                      <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                        <div className="bg-amber-400 h-full w-[92%]" />
                      </div>
                    </div>

                    <div className="p-3 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-[11px] text-indigo-200 flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-indigo-400 shrink-0" />
                      <span>AI Feedback: Writing Task 2 Cohesion Band score improved to 8.0!</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* 7. BRANCHES SECTION (FADE-UP MOTION) */}
        <section id="branches" className="py-20 px-4 sm:px-6 lg:px-8 border-b border-white/10 relative">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.7 }}
            className="max-w-7xl mx-auto"
          >
            <div className="text-center max-w-2xl mx-auto mb-14">
              <span className="px-3 py-1 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/30 text-xs font-bold uppercase tracking-wider">
                Locations & Access
              </span>
              <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight mt-2">
                {t("Bizning Filiallar", "Our Learning Branches", "Наши Филиалы")}
              </h2>
              <p className="text-xs sm:text-sm text-slate-400 mt-2">
                {t("Toshkent shahrining eng qulay hududlaridagi zamonaviy o'quv markazlarimiz", "Modern campuses located right near metro stations", "Удобные филиалы возле станций метро")}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {branchesList.map((branch) => (
                <div
                  key={branch.id}
                  className="p-6 rounded-3xl bg-white/5 border border-white/10 hover:border-amber-500/50 backdrop-blur-md transition-all shadow-xl flex flex-col justify-between"
                >
                  <div>
                    <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold mb-4">
                      <Building className="w-5 h-5" />
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2">
                      {getLangText(branch.nameUz, branch.nameEn, branch.nameRu)}
                    </h3>
                    <p className="text-xs text-slate-300 mb-4 flex items-start gap-2 leading-relaxed">
                      <MapPin className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                      <span>{getLangText(branch.addressUz, branch.addressEn, branch.addressRu)}</span>
                    </p>
                    <p className="text-xs text-slate-400 flex items-center gap-2 mb-2">
                      <Phone className="w-4 h-4 text-indigo-400 shrink-0" />
                      <span>{branch.phone}</span>
                    </p>
                    <p className="text-xs text-slate-400 flex items-center gap-2">
                      <Clock className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>{branch.hours}</span>
                    </p>
                  </div>

                  <button
                    onClick={() => setIsEnrollModalOpen(true)}
                    className="w-full mt-6 py-2.5 rounded-xl bg-white/10 hover:bg-amber-500 hover:text-slate-950 text-white font-bold text-xs transition cursor-pointer"
                  >
                    {t("Ushbu filialga yozilish", "Enroll at this Branch", "Записаться в этот филиал")}
                  </button>
                </div>
              ))}
            </div>
          </motion.div>
        </section>

        {/* 8. TESTIMONIALS SECTION */}
        <section className="py-20 px-4 sm:px-6 lg:px-8 border-b border-white/10 relative bg-white/5">
          <div className="max-w-7xl mx-auto">
            <TestimonialsCarousel testimonials={cmsContent.testimonials || []} />
          </div>
        </section>

        {/* 9. FAQ ACCORDION SECTION (FADE-UP MOTION) */}
        <section id="faq" className="py-20 px-4 sm:px-6 lg:px-8 border-b border-white/10 relative">
          <motion.div
            initial={{ opacity: 0, y: 35 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.7 }}
            className="max-w-4xl mx-auto"
          >
            <div className="text-center mb-10">
              <span className="px-3 py-1 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/30 text-xs font-bold uppercase tracking-wider">
                Support & Info
              </span>
              <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight mt-2">
                {t("Tez-tez beriladigan savollar", "Frequently Asked Questions", "Часто задаваемые вопросы")}
              </h2>
            </div>

            {/* FAQ Search Bar */}
            <div className="relative mb-8">
              <Search className="absolute left-4 top-3.5 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={faqSearch}
                onChange={(e) => setFaqSearch(e.target.value)}
                placeholder={t("Savol bo'yicha qidirish...", "Search questions...", "Поиск по вопросам...")}
                className="w-full pl-11 pr-4 py-3 rounded-2xl bg-white/5 border border-white/10 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-amber-500 transition"
              />
            </div>

            {/* Accordion List */}
            <div className="space-y-4">
              {filteredFAQs.map((faq) => {
                const isExpanded = expandedFaqId === faq.id;
                const question = getLangText(faq.questionUz, faq.questionEn, faq.questionRu);
                const answer = getLangText(faq.answerUz, faq.answerEn, faq.answerRu);

                return (
                  <div
                    key={faq.id}
                    className="rounded-2xl bg-white/5 border border-white/10 overflow-hidden transition"
                  >
                    <button
                      onClick={() => setExpandedFaqId(isExpanded ? null : faq.id)}
                      className="w-full p-5 text-left font-bold text-sm text-white flex items-center justify-between gap-4 cursor-pointer hover:text-amber-400 transition"
                    >
                      <span>{question}</span>
                      <ChevronDown
                        className={`w-4 h-4 text-amber-400 transition-transform duration-300 ${
                          isExpanded ? 'rotate-180' : ''
                        }`}
                      />
                    </button>
                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.3 }}
                          className="px-5 pb-5 text-xs text-slate-300 leading-relaxed border-t border-white/5 pt-3"
                        >
                          {answer}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
            </div>
          </motion.div>
        </section>

        {/* 10. LEAD REGISTRATION CTA FOOTER */}
        <section className="py-20 px-4 sm:px-6 lg:px-8 relative bg-gradient-to-b from-[#0d021a] to-slate-950 text-center">
          <div className="max-w-3xl mx-auto space-y-6">
            <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
              {t("Kelajakdagi orzularingizga ilk qadamni tashlang!", "Take the first step toward your dream score!", "Сделайте первый шаг к вашей мечте!")}
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              {t("IELTS 8.5+ va grant sohibi bo'lish uchun bugunoq bepul diagnostika darsiga a'zo bo'ling.", "Book a free diagnostic level-check and trial lesson with our senior CELTA mentors.", "Запишитесь на бесплатный пробный урок и диагностику уровня.")}
            </p>
            <button
              onClick={() => setIsEnrollModalOpen(true)}
              className="px-8 py-4 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-sm shadow-xl shadow-amber-500/30 transition hover:scale-105 cursor-pointer"
            >
              {t("Sinov darsiga a'zo bo'lish", "Book Free Trial Lesson", "Записаться на бесплатный урок")}
            </button>
          </div>
        </section>

        {/* FOOTER BAR */}
        <footer className="border-t border-white/10 py-8 px-4 text-center text-xs text-slate-500 bg-slate-950">
          <p>© 2026 CenterFlow Education System. All rights reserved.</p>
        </footer>
      </div>

      {/* LEAD CONTACT FORM MODAL */}
      <AnimatePresence>
        {isEnrollModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative w-full max-w-md bg-[#120320] border border-amber-500/30 rounded-3xl p-6 sm:p-8 text-white shadow-2xl"
            >
              <button
                onClick={() => setIsEnrollModalOpen(false)}
                className="absolute top-5 right-5 p-2 text-slate-400 hover:text-white transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="mb-6">
                <span className="px-3 py-1 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/30 text-[10px] font-bold uppercase tracking-wider">
                  CenterFlow Admissions
                </span>
                <h3 className="text-2xl font-black text-white mt-2">
                  {t("Sinov Darsiga Yozilish", "Enroll for Trial Lesson", "Записаться на Пробный Урок")}
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  {t("Ismingiz va telefon raqamingizni qoldiring, mutaxassisimiz bog'lanadi", "Leave your details and our team will contact you shortly", "Оставьте контакты и мы свяжемся с вами")}
                </p>
              </div>

              <form onSubmit={handleLeadSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    {t("Ism va Familiyangiz", "Full Name", "Имя и Фамилия")}
                  </label>
                  <input
                    type="text"
                    required
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="Jasur Aliyev"
                    className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 transition"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    {t("Telefon Raqamingiz", "Phone Number", "Номер телефона")}
                  </label>
                  <input
                    type="text"
                    required
                    value={formPhone}
                    onChange={(e) => setFormPhone(e.target.value)}
                    placeholder="+998 90 123 45 67"
                    className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 transition"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    {t("Qiziqtirgan Kurs", "Interested Course", "Интересующий курс")}
                  </label>
                  <select
                    value={formCourse}
                    onChange={(e) => setFormCourse(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-[#1a082c] border border-white/10 text-xs text-white focus:outline-none focus:border-amber-500 transition"
                  >
                    <option value="IELTS Rocket 8.5">IELTS Rocket 8.5+</option>
                    <option value="General English Standard">General English (CEFR)</option>
                    <option value="Kids & Teens Foundation">Kids & Foundation</option>
                    <option value="IT & Programming">IT & Web Development</option>
                  </select>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs transition shadow-lg shadow-amber-500/20 cursor-pointer flex items-center justify-center gap-2 mt-2"
                >
                  {isSubmitting ? (
                    <span>Yuborilmoqda...</span>
                  ) : (
                    <>
                      <span>{t("Arizani Yuborish", "Submit Registration", "Отправить Заявку")}</span>
                      <Send className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* TEACHER CERTIFICATE MODAL */}
      <TeacherCertificateModal
        teacher={selectedTeacher}
        onClose={() => setSelectedTeacher(null)}
      />

      {/* RESULT TRF SCORE CARD MODAL */}
      <ResultCertificateModal
        result={selectedResult}
        onClose={() => setSelectedResult(null)}
      />
    </div>
  );
};
