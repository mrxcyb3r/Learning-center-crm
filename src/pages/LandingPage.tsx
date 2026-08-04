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
import { RoleShowcaseSection } from '../components/RoleShowcaseSection';
import { Navbar } from '../components/Navbar';
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
  FileCheck,
  Globe,
  Bot,
  Terminal,
  Activity,
  Cpu,
  Layers,
  Lock,
  Server,
  Radio,
  FileText,
  LayoutDashboard,
  Shield,
  Calculator,
  Atom,
  ChevronUp
} from 'lucide-react';

interface LandingPageProps {
  onOpenAuth: () => void;
}

// ----------------------------------------------------
// Section List for Scroll Spy & Header Links
// ----------------------------------------------------
const SECTIONS = [
  { id: 'hero', labelUz: 'Bosh sahifa', labelEn: 'Home', labelRu: 'Главная' },
  { id: 'why-us', labelUz: 'Afzalliklar', labelEn: 'Features', labelRu: 'Преимущества' },
  { id: 'multi-subject', labelUz: 'Fanlar Xabi', labelEn: 'Multi-Subject Hub', labelRu: 'Хаб Предметов' },
  { id: 'role-demos', labelUz: 'Rol Vizualizatsiyasi', labelEn: 'Role Demos', labelRu: 'Демо Ролей' },
  { id: 'telegram-sec', labelUz: 'Telegram & Xavfsizlik', labelEn: 'Security & Telegram', labelRu: 'Безопасность' },
  { id: 'teachers', labelUz: "O'qituvchilar", labelEn: 'Teachers', labelRu: 'Преподаватели' },
  { id: 'results', labelUz: 'Natijalar', labelEn: 'Results', labelRu: 'Результаты' },
  { id: 'courses', labelUz: 'Kurslar', labelEn: 'Courses', labelRu: 'Курсы' },
  { id: 'faq', labelUz: 'FAQs', labelEn: 'FAQs', labelRu: 'Вопросы' }
];

// ----------------------------------------------------
// Animated Counter Component (Starts at 0 and counts up)
// ----------------------------------------------------
const AnimatedCounter: React.FC<{ value: string; duration?: number }> = ({ value, duration = 1800 }) => {
  const [count, setCount] = useState(0);
  const [hasAnimated, setHasAnimated] = useState(false);
  const ref = useRef<HTMLSpanElement>(null);

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
  const { language, setLanguage, translate: t } = useLanguage();

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

  // Role Tab Explorer State (Student / Teacher / Admin)
  const [activeRoleTab, setActiveRoleTab] = useState<'student' | 'teacher' | 'admin'>('student');

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

  // Dynamic Scroll Spy Hook
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
        selectedCourse: formCourse || 'IELTS 7.5+ Intensive',
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
    } catch {
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

  // Filtered results
  const filteredResults = (cmsContent.results || []).filter((r) => {
    if (resultFilter === '8.0') return parseFloat(r.score) >= 8.0;
    if (resultFilter === '7.5') return parseFloat(r.score) >= 7.5;
    if (resultFilter === 'CEFR') return r.testType === 'CEFR';
    return true;
  });

  // Filtered FAQs
  const filteredFAQs = (cmsContent.faqs || []).filter((faq) => {
    const query = faqSearch.toLowerCase();
    const qText = getLangText(faq.questionUz, faq.questionEn, faq.questionRu);
    const aText = getLangText(faq.answerUz, faq.answerEn, faq.answerRu);
    return qText.toLowerCase().includes(query) || aText.toLowerCase().includes(query);
  });

  // Branches Data
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
    <div className="relative min-h-screen bg-slate-950 text-slate-100 transition-colors duration-200 overflow-x-hidden selection:bg-amber-500 selection:text-slate-950 font-sans">
      {/* Background Deep Glow Aesthetics */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-purple-900/20 blur-[130px] rounded-full" />
        <div className="absolute top-1/3 -right-40 w-[500px] h-[500px] bg-amber-500/10 blur-[150px] rounded-full" />
        <div className="absolute bottom-10 left-1/4 w-[600px] h-[600px] bg-indigo-900/15 blur-[180px] rounded-full" />
      </div>

      <div className="relative z-10">
        {/* 1. HEADER NAVIGATION COMPONENT */}
        <Navbar onOpenAuth={onOpenAuth} />

        {/* 2. HERO SECTION */}
        <section id="hero" className="relative min-h-[90vh] flex items-center justify-center pt-28 sm:pt-36 pb-16 px-4 sm:px-6 lg:px-8 border-b border-gray-800">
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
                <span>99.8% System Uptime</span>
              </div>
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-500/10 text-indigo-300 border border-indigo-500/30 text-xs font-bold tracking-wide backdrop-blur-md">
                <Layers className="w-3.5 h-3.5 text-indigo-400" />
                <span>Multi-Subject Support</span>
              </div>
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 text-xs font-bold tracking-wide backdrop-blur-md">
                <Bot className="w-3.5 h-3.5 text-emerald-400" />
                <span>Instant Telegram Alerts</span>
              </div>
            </div>

            {/* Main Headline */}
            <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight text-white leading-[1.1] mb-6">
              <span>The Operating System for </span>
              <span className="text-amber-400 block mt-1">
                <TypewriterText
                  texts={[
                    "Modern Learning Centers",
                    "Multi-Subject Courses",
                    "IELTS, IT & Physics Academies",
                    "Automated Telegram Operations"
                  ]}
                  speed={45}
                  deleteSpeed={20}
                  pauseDuration={2000}
                  cursorColorClass="text-amber-400 font-extrabold"
                />
              </span>
            </h1>

            <p className="text-sm sm:text-base text-slate-300 max-w-3xl mx-auto mb-10 leading-relaxed font-medium">
              Easily manage multi-subject courses, get instant test scores on Telegram, and practice with AI assistance across IELTS, Programming, Math, and Physics.
            </p>

            {/* Primary CTAs */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <button
                onClick={onOpenAuth}
                className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-sm shadow-xl shadow-amber-500/30 hover:scale-105 transition flex items-center justify-center gap-2.5 cursor-pointer"
              >
                <Zap className="w-4 h-4 fill-slate-950" />
                <span>Launch Portal (1-Click Demo)</span>
              </button>
              <a
                href="https://t.me/centerflow_bot"
                target="_blank"
                rel="noreferrer"
                className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-gray-900 hover:bg-gray-800 text-slate-200 font-bold text-sm border border-gray-800 transition flex items-center justify-center gap-2.5 cursor-pointer"
              >
                <Bot className="w-4 h-4 text-emerald-400" />
                <span>Connect @CenterFlowBot</span>
                <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
              </a>
            </div>

            {/* Dynamic Animated KPI Numbers Grid */}
            <div className="mt-16 grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 max-w-5xl mx-auto">
              <motion.div
                whileHover={{ scale: 1.03, y: -2 }}
                className="p-6 rounded-3xl bg-gray-900/60 border border-gray-800 backdrop-blur-xl shadow-2xl text-center group hover:border-amber-500/50 transition-all"
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
                className="p-6 rounded-3xl bg-gray-900/60 border border-gray-800 backdrop-blur-xl shadow-2xl text-center group hover:border-amber-500/50 transition-all"
              >
                <div className="text-3xl sm:text-4xl font-black text-amber-400 mb-1">
                  <AnimatedCounter value={cmsContent.ieltsHighResults || "280+"} />
                </div>
                <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  {t("IELTS 7.0+ Natijalar", "IELTS 7.0+ Band Scores", "Результатов IELTS 7.0+")}
                </div>
              </motion.div>

              <motion.div
                whileHover={{ scale: 1.03, y: -2 }}
                className="p-6 rounded-3xl bg-gray-900/60 border border-gray-800 backdrop-blur-xl shadow-2xl text-center group hover:border-amber-500/50 transition-all"
              >
                <div className="text-3xl sm:text-4xl font-black text-amber-400 mb-1">
                  <AnimatedCounter value={cmsContent.admissionRate || "95%"} />
                </div>
                <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  {t("OTM va Grant Olish Ko'rsatkichi", "University Admission Rate", "Поступление в ВУЗы")}
                </div>
              </motion.div>

              <motion.div
                whileHover={{ scale: 1.03, y: -2 }}
                className="p-6 rounded-3xl bg-gray-900/60 border border-gray-800 backdrop-blur-xl shadow-2xl text-center group hover:border-amber-500/50 transition-all"
              >
                <div className="text-3xl sm:text-4xl font-black text-amber-400 mb-1">
                  <AnimatedCounter value={cmsContent.yearsExperience || "4+"} />
                </div>
                <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  {t("Yillik Ishonchli Tajriba", "Years of Teaching Experience", "Лет опыта")}
                </div>
              </motion.div>
            </div>
          </motion.div>
        </section>

        {/* 3. INTERACTIVE MULTI-SUBJECT SHOWCASE CAROUSEL / GRID */}
        <section id="multi-subject" className="py-20 px-4 sm:px-6 lg:px-8 border-b border-gray-800 relative bg-gray-900/40">
          <div className="max-w-7xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.6 }}
              className="text-center max-w-2xl mx-auto mb-14"
            >
              <span className="px-3 py-1 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/30 text-xs font-bold uppercase tracking-wider">
                All Subjects in One Place
              </span>
              <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight mt-2">
                Multi-Subject Learning Hub
              </h2>
              <p className="text-xs sm:text-sm text-slate-400 mt-2">
                One platform handles languages, programming, and exact sciences with ease.
              </p>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Subject 1: IELTS & Languages */}
              <motion.div
                whileHover={{ y: -4 }}
                className="p-8 rounded-3xl bg-gray-900 border border-gray-800 hover:border-amber-500/50 transition-all flex flex-col justify-between shadow-xl"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold text-xl">
                      🇬🇧
                    </div>
                    <span className="px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[10px] font-bold">
                      LANGUAGES
                    </span>
                  </div>
                  <h3 className="text-2xl font-black text-white mb-2">IELTS & Languages</h3>
                  <p className="text-xs text-slate-400 mb-6 leading-relaxed">
                    Track band scores from 6.0 to 9.0 with writing feedback cards and listening practice logs.
                  </p>
                  <ul className="space-y-3 text-xs text-slate-300">
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>Band score tracking (6.0 - 9.0)</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>Writing diagnostic feedback cards</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>Listening practice logs</span>
                    </li>
                  </ul>
                </div>
                <div className="mt-8 pt-4 border-t border-gray-800/80 flex items-center justify-between text-xs text-slate-400 font-bold">
                  <span>Enrolled: 840+ Students</span>
                  <Award className="w-4 h-4 text-amber-400" />
                </div>
              </motion.div>

              {/* Subject 2: Web Dev & Cybersecurity */}
              <motion.div
                whileHover={{ y: -4 }}
                className="p-8 rounded-3xl bg-gray-900 border border-gray-800 hover:border-amber-500/50 transition-all flex flex-col justify-between shadow-xl"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold text-xl">
                      💻
                    </div>
                    <span className="px-2.5 py-1 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 text-[10px] font-bold">
                      ENGINEERING
                    </span>
                  </div>
                  <h3 className="text-2xl font-black text-white mb-2">Web Dev & Cybersecurity</h3>
                  <p className="text-xs text-slate-400 mb-6 leading-relaxed">
                    Practice homework feeds, Telegram login PINs, and real project milestone tracking.
                  </p>
                  <ul className="space-y-3 text-xs text-slate-300">
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>Practice homework feeds</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>Telegram login PINs</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>Real project milestones</span>
                    </li>
                  </ul>
                </div>
                <div className="mt-8 pt-4 border-t border-gray-800/80 flex items-center justify-between text-xs text-slate-400 font-bold">
                  <span>Enrolled: 420+ Students</span>
                  <Code className="w-4 h-4 text-indigo-400" />
                </div>
              </motion.div>

              {/* Subject 3: Mathematics & Physics */}
              <motion.div
                whileHover={{ y: -4 }}
                className="p-8 rounded-3xl bg-gray-900 border border-gray-800 hover:border-amber-500/50 transition-all flex flex-col justify-between shadow-xl"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-xl">
                      📐
                    </div>
                    <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-bold">
                      EXACT SCIENCES
                    </span>
                  </div>
                  <h3 className="text-2xl font-black text-white mb-2">Mathematics & Physics</h3>
                  <p className="text-xs text-slate-400 mb-6 leading-relaxed">
                    Exam practice leaderboards, formula checks, and automatic parent progress reports.
                  </p>
                  <ul className="space-y-3 text-xs text-slate-300">
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>Exam practice leaderboards</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>Formula checks</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>Automatic parent progress reports</span>
                    </li>
                  </ul>
                </div>
                <div className="mt-8 pt-4 border-t border-gray-800/80 flex items-center justify-between text-xs text-slate-400 font-bold">
                  <span>Enrolled: 310+ Students</span>
                  <Atom className="w-4 h-4 text-emerald-400" />
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* INTERACTIVE ROLE SHOWCASE WITH DIRECT MOCKUP IMAGES */}
        <RoleShowcaseSection onOpenAuth={onOpenAuth} />

        {/* 4. ROLE-ADAPTIVE FEATURE EXPLORER (INTERACTIVE 3-TAB SECTION) */}
        <section id="role-demos" className="py-20 px-4 sm:px-6 lg:px-8 border-b border-gray-800 relative">
          <div className="max-w-7xl mx-auto">
            <div className="text-center max-w-2xl mx-auto mb-10">
              <span className="px-3 py-1 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/30 text-xs font-bold uppercase tracking-wider">
                Built for Everyone
              </span>
              <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight mt-2">
                Tailored Views for Students, Teachers & Admins
              </h2>
              <p className="text-xs sm:text-sm text-slate-400 mt-2">
                Switch between views to see how CenterFlow simplifies daily learning and center management.
              </p>
            </div>

            {/* Role Tabs Controls */}
            <div className="flex justify-center mb-10">
              <div className="inline-flex p-1.5 rounded-2xl bg-gray-900 border border-gray-800 gap-2">
                <button
                  onClick={() => setActiveRoleTab('student')}
                  className={`px-5 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-2 ${
                    activeRoleTab === 'student'
                      ? 'bg-amber-500 text-slate-950 font-black shadow-lg shadow-amber-500/20'
                      : 'text-slate-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <GraduationCap className="w-4 h-4" />
                  <span>🎓 Student View</span>
                </button>
                <button
                  onClick={() => setActiveRoleTab('teacher')}
                  className={`px-5 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-2 ${
                    activeRoleTab === 'teacher'
                      ? 'bg-amber-500 text-slate-950 font-black shadow-lg shadow-amber-500/20'
                      : 'text-slate-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <BookOpen className="w-4 h-4" />
                  <span>👨‍🏫 Teacher View</span>
                </button>
                <button
                  onClick={() => setActiveRoleTab('admin')}
                  className={`px-5 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-2 ${
                    activeRoleTab === 'admin'
                      ? 'bg-amber-500 text-slate-950 font-black shadow-lg shadow-amber-500/20'
                      : 'text-slate-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>🛡️ Administrator View</span>
                </button>
              </div>
            </div>

            {/* Role Tab Content Cards */}
            <div className="max-w-4xl mx-auto">
              <AnimatePresence mode="wait">
                {activeRoleTab === 'student' && (
                  <motion.div
                    key="student-tab"
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -15 }}
                    transition={{ duration: 0.3 }}
                    className="p-8 rounded-3xl bg-gray-900 border border-gray-800 shadow-2xl space-y-6"
                  >
                    <div className="flex items-center justify-between border-b border-gray-800 pb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold">
                          🎓
                        </div>
                        <div>
                          <h3 className="text-xl font-black text-white">Student Dashboard & AI Tutor</h3>
                          <p className="text-xs text-slate-400">Enrolled in IELTS 7.5+ & Python Cybersecurity</p>
                        </div>
                      </div>
                      <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-bold border border-emerald-500/30">
                        Bot Connected
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="p-4 rounded-2xl bg-slate-950 border border-gray-800">
                        <h4 className="text-xs font-bold text-amber-400 mb-2 flex items-center gap-1.5">
                          <FileText className="w-4 h-4" />
                          <span>Multi-Subject Assignments</span>
                        </h4>
                        <p className="text-xs text-slate-300">
                          View assignments across IELTS and Cyber Security in one centralized timeline. Submit audio or code attachments easily.
                        </p>
                      </div>

                      <div className="p-4 rounded-2xl bg-slate-950 border border-gray-800">
                        <h4 className="text-xs font-bold text-amber-400 mb-2 flex items-center gap-1.5">
                          <Sparkles className="w-4 h-4 text-amber-400" />
                          <span>24/7 AI Tutor Assistant</span>
                        </h4>
                        <p className="text-xs text-slate-300">
                          Ask questions about essay structures or Python code syntax anytime with automated step-by-step diagnostics.
                        </p>
                      </div>

                      <div className="p-4 rounded-2xl bg-slate-950 border border-gray-800">
                        <h4 className="text-xs font-bold text-amber-400 mb-2 flex items-center gap-1.5">
                          <Bot className="w-4 h-4 text-emerald-400" />
                          <span>Telegram Grade Notices</span>
                        </h4>
                        <p className="text-xs text-slate-300">
                          Instant mobile alerts via <code className="text-amber-400">@centerflow_bot</code> as soon as mock scores or homework marks are recorded.
                        </p>
                      </div>

                      <div className="p-4 rounded-2xl bg-slate-950 border border-gray-800">
                        <h4 className="text-xs font-bold text-amber-400 mb-2 flex items-center gap-1.5">
                          <Activity className="w-4 h-4 text-indigo-400" />
                          <span>Diagnostic Score Trends</span>
                        </h4>
                        <p className="text-xs text-slate-300">
                          Visual subscore breakdowns for Listening, Reading, Writing, and Speaking to spot exact weak areas.
                        </p>
                      </div>
                    </div>
                  </motion.div>
                )}

                {activeRoleTab === 'teacher' && (
                  <motion.div
                    key="teacher-tab"
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -15 }}
                    transition={{ duration: 0.3 }}
                    className="p-8 rounded-3xl bg-gray-900 border border-gray-800 shadow-2xl space-y-6"
                  >
                    <div className="flex items-center justify-between border-b border-gray-800 pb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold">
                          👨‍🏫
                        </div>
                        <div>
                          <h3 className="text-xl font-black text-white">Teacher Command Center</h3>
                          <p className="text-xs text-slate-400">Managing Web Development & Advanced Physics Groups</p>
                        </div>
                      </div>
                      <span className="px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-bold border border-indigo-500/30">
                        Instructor Tier
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="p-4 rounded-2xl bg-slate-950 border border-gray-800">
                        <h4 className="text-xs font-bold text-indigo-400 mb-2 flex items-center gap-1.5">
                          <Users className="w-4 h-4" />
                          <span>1-Click Group Attendance Markers</span>
                        </h4>
                        <p className="text-xs text-slate-300">
                          Mark Present/Absent with a single tap. Absent alerts dispatch automatically to parent Telegram numbers.
                        </p>
                      </div>

                      <div className="p-4 rounded-2xl bg-slate-950 border border-gray-800">
                        <h4 className="text-xs font-bold text-indigo-400 mb-2 flex items-center gap-1.5">
                          <Send className="w-4 h-4" />
                          <span>Telegram Grade Dispatcher</span>
                        </h4>
                        <p className="text-xs text-slate-300">
                          Submit mock test scores or assignment marks directly into students' personal Telegram notifications in real time.
                        </p>
                      </div>

                      <div className="p-4 rounded-2xl bg-slate-950 border border-gray-800">
                        <h4 className="text-xs font-bold text-indigo-400 mb-2 flex items-center gap-1.5">
                          <Layers className="w-4 h-4" />
                          <span>Multi-Subject Syllabus Builder</span>
                        </h4>
                        <p className="text-xs text-slate-300">
                          Organize course modules, lesson materials, homework deadlines, and classroom audio files across groups.
                        </p>
                      </div>

                      <div className="p-4 rounded-2xl bg-slate-950 border border-gray-800">
                        <h4 className="text-xs font-bold text-indigo-400 mb-2 flex items-center gap-1.5">
                          <Award className="w-4 h-4" />
                          <span>Diagnostic Test Publisher</span>
                        </h4>
                        <p className="text-xs text-slate-300">
                          Create mock diagnostic exams and publish band score results with customized teacher feedback notes.
                        </p>
                      </div>
                    </div>
                  </motion.div>
                )}

                {activeRoleTab === 'admin' && (
                  <motion.div
                    key="admin-tab"
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -15 }}
                    transition={{ duration: 0.3 }}
                    className="p-8 rounded-3xl bg-gray-900 border border-gray-800 shadow-2xl space-y-6"
                  >
                    <div className="flex items-center justify-between border-b border-gray-800 pb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
                          🛡️
                        </div>
                        <div>
                          <h3 className="text-xl font-black text-white">Administrator Control Panel</h3>
                          <p className="text-xs text-slate-400">Global Center Management & Security Auditor</p>
                        </div>
                      </div>
                      <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-bold border border-emerald-500/30">
                        SuperAdmin Level
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="p-4 rounded-2xl bg-slate-950 border border-gray-800">
                        <h4 className="text-xs font-bold text-emerald-400 mb-2 flex items-center gap-1.5">
                          <Activity className="w-4 h-4" />
                          <span>Live Health Monitor</span>
                        </h4>
                        <p className="text-xs text-slate-300">
                          Real-time Node.js uptime, memory allocation stats, active WebSocket connections, and latency metrics.
                        </p>
                      </div>

                      <div className="p-4 rounded-2xl bg-slate-950 border border-gray-800">
                        <h4 className="text-xs font-bold text-emerald-400 mb-2 flex items-center gap-1.5">
                          <Radio className="w-4 h-4 text-emerald-400" />
                          <span>Mass Telegram Broadcast Tools</span>
                        </h4>
                        <p className="text-xs text-slate-300">
                          Send center-wide announcements or subject-specific exam schedules directly to student Telegram bots instantly.
                        </p>
                      </div>

                      <div className="p-4 rounded-2xl bg-slate-950 border border-gray-800">
                        <h4 className="text-xs font-bold text-emerald-400 mb-2 flex items-center gap-1.5">
                          <ShieldCheck className="w-4 h-4" />
                          <span>Security Audit Event Logging</span>
                        </h4>
                        <p className="text-xs text-slate-300">
                          Track 4-digit security PIN verify events, role switches, login IPs, and access timestamps across all accounts.
                        </p>
                      </div>

                      <div className="p-4 rounded-2xl bg-slate-950 border border-gray-800">
                        <h4 className="text-xs font-bold text-emerald-400 mb-2 flex items-center gap-1.5">
                          <Building className="w-4 h-4 text-emerald-400" />
                          <span>Multi-Branch Analytics</span>
                        </h4>
                        <p className="text-xs text-slate-300">
                          Compare enrollment numbers, tuition payment completion rates, and instructor performance across all branches.
                        </p>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </section>

        {/* 5. TELEGRAM INTEGRATION HIGHLIGHT BANNER */}
        <section id="telegram-sec" className="py-20 px-4 sm:px-6 lg:px-8 border-b border-gray-800 relative bg-gray-900/50">
          <div className="max-w-5xl mx-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.6 }}
              className="p-8 sm:p-12 rounded-3xl bg-gradient-to-br from-gray-900 via-slate-950 to-gray-900 border border-gray-800 shadow-2xl relative overflow-hidden backdrop-blur-xl"
            >
              <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/10 blur-[100px] rounded-full pointer-events-none" />

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center relative z-10">
                <div className="lg:col-span-7 space-y-4">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-xs font-bold">
                    <Bot className="w-4 h-4" />
                    <span>Official Telegram Integration (@centerflow_bot)</span>
                  </div>

                  <h3 className="text-3xl font-black text-white tracking-tight">
                    Connect Your Phone to Your Learning Center
                  </h3>

                  <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                    Our custom Telegram bot sends login codes, test score notifications, and schedule updates right to your mobile chat.
                  </p>

                  <div className="space-y-3 pt-2">
                    <div className="flex items-start gap-3">
                      <div className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-400 mt-0.5">
                        <Lock className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-white">Automatic 4-Digit Login Security Codes</h4>
                        <p className="text-[11px] text-slate-400">Receive quick 4-digit PINs in Telegram for easy 1-click sign in.</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <div className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-400 mt-0.5">
                        <Zap className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-white">Instant Score & Feedback Notifications</h4>
                        <p className="text-[11px] text-slate-400">Get notified the second your teacher grades your test or homework.</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <div className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-400 mt-0.5">
                        <Radio className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-white">Live Class Schedule & Room Updates</h4>
                        <p className="text-[11px] text-slate-400">Receive instant alerts if a room changes or extra mock test is added.</p>
                      </div>
                    </div>
                  </div>

                  <div className="pt-4">
                    <a
                      href="https://t.me/centerflow_bot"
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs transition shadow-lg shadow-emerald-500/20 cursor-pointer"
                    >
                      <Bot className="w-4 h-4" />
                      <span>Start @CenterFlowBot on Telegram</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                </div>

                <div className="lg:col-span-5 flex justify-center">
                  <div className="w-full max-w-xs p-4 rounded-3xl bg-slate-950 border border-gray-800 font-mono text-xs space-y-3 shadow-2xl">
                    <div className="flex items-center justify-between border-b border-gray-800 pb-2">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-[10px]">
                          CF
                        </div>
                        <span className="text-white font-bold text-[11px]">CenterFlow Bot</span>
                      </div>
                      <span className="text-[10px] text-emerald-400">bot • active</span>
                    </div>

                    <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-[11px] text-emerald-300 space-y-1">
                      <p className="font-bold">🔑 Security Verification Code</p>
                      <p className="text-xs text-white">Your 4-digit PIN is: <span className="font-mono text-amber-400 font-bold">4321</span></p>
                      <p className="text-[9px] text-slate-400">Valid for 10 minutes. Do not share.</p>
                    </div>

                    <div className="p-2.5 rounded-xl bg-gray-900 border border-gray-800 text-[11px] text-slate-300 space-y-1">
                      <p className="font-bold text-amber-400">📊 New Diagnostic Result Released!</p>
                      <p className="text-[10px]">IELTS Mock Test #4 Result: <span className="font-bold text-white">7.5 Overall</span></p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* 6. TEACHERS SLIDE CAROUSEL WITH CERTIFICATE MODAL */}
        <section id="teachers" className="py-20 px-4 sm:px-6 lg:px-8 border-b border-gray-800 relative">
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

              {/* Swiper Arrow Buttons */}
              <motion.div
                initial={{ opacity: 0, x: 60 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{ duration: 0.6, ease: 'easeOut' }}
                className="flex items-center gap-3 mt-6 md:mt-0"
              >
                <button
                  onClick={() => scrollCarousel(teacherCarouselRef, 'left')}
                  className="p-3 rounded-2xl bg-gray-900 hover:bg-gray-800 border border-gray-800 text-white transition cursor-pointer"
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
                  className="min-w-[280px] sm:min-w-[340px] snap-start rounded-3xl bg-gray-900 border border-gray-800 overflow-hidden hover:border-amber-500/50 transition-all duration-300 flex flex-col justify-between group cursor-pointer shadow-xl hover:-translate-y-1"
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
                            className="px-2.5 py-1 rounded-lg bg-slate-800 text-[10px] font-bold text-slate-300"
                          >
                            {spec}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="p-6 pt-0 border-t border-gray-800 mt-2 flex items-center justify-between text-xs text-slate-400">
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

        {/* 7. STUDENT RESULTS CAROUSEL WITH TRF SCORE MODAL */}
        <section id="results" className="py-20 px-4 sm:px-6 lg:px-8 border-b border-gray-800 relative bg-gray-900/30">
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
                          : 'bg-gray-900 text-slate-300 hover:bg-gray-800 border border-gray-800'
                      }`}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-2 pl-2 border-l border-gray-800">
                  <button
                    onClick={() => scrollCarousel(resultsCarouselRef, 'left')}
                    className="p-2.5 rounded-xl bg-gray-900 hover:bg-gray-800 border border-gray-800 text-white transition cursor-pointer"
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

            {/* Results Deck */}
            <div
              ref={resultsCarouselRef}
              className="flex gap-6 overflow-x-auto snap-x snap-mandatory scrollbar-none pb-6 cursor-grab"
              style={{ scrollbarWidth: 'none' }}
            >
              {filteredResults.map((result, idx) => (
                <motion.div
                  key={result.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true, amount: 0.2 }}
                  transition={{ duration: 0.5, delay: idx * 0.06 }}
                  onClick={() => setSelectedResult(result)}
                  className="min-w-[280px] sm:min-w-[340px] snap-start p-6 rounded-3xl bg-gray-900 border border-gray-800 hover:border-amber-500/50 backdrop-blur-md transition-all cursor-pointer group hover:-translate-y-1 shadow-xl flex flex-col justify-between"
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
                    <div className="grid grid-cols-4 gap-2 mt-4 pt-4 border-t border-gray-800 text-center text-xs">
                      <div className="p-2 rounded-xl bg-slate-950 border border-gray-800">
                        <span className="text-[10px] text-slate-400 block font-bold">L</span>
                        <span className="font-mono font-bold text-white">{result.listening}</span>
                      </div>
                      <div className="p-2 rounded-xl bg-slate-950 border border-gray-800">
                        <span className="text-[10px] text-slate-400 block font-bold">R</span>
                        <span className="font-mono font-bold text-white">{result.reading}</span>
                      </div>
                      <div className="p-2 rounded-xl bg-slate-950 border border-gray-800">
                        <span className="text-[10px] text-slate-400 block font-bold">W</span>
                        <span className="font-mono font-bold text-white">{result.writing}</span>
                      </div>
                      <div className="p-2 rounded-xl bg-slate-950 border border-gray-800">
                        <span className="text-[10px] text-slate-400 block font-bold">S</span>
                        <span className="font-mono font-bold text-white">{result.speaking}</span>
                      </div>
                    </div>
                  </div>

                  <button className="w-full mt-5 py-2.5 rounded-xl bg-gray-800 hover:bg-amber-500 hover:text-slate-950 text-white font-bold text-xs transition flex items-center justify-center gap-1.5">
                    <FileCheck className="w-4 h-4" />
                    <span>{t("Sertifikat va TRF ni ko'rish", "View Official Certificate", "Посмотреть сертификат")}</span>
                  </button>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* 8. COURSE PRICING GRID */}
        <section id="courses" className="py-20 px-4 sm:px-6 lg:px-8 border-b border-gray-800 relative">
          <div className="max-w-7xl mx-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.6 }}
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
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.2 }}
                  transition={{ duration: 0.5, delay: i * 0.1 }}
                  className={`relative rounded-3xl p-8 bg-gray-900 border backdrop-blur-md flex flex-col justify-between hover:border-amber-500/50 transition-all duration-300 shadow-2xl ${
                    course.isPopular ? 'border-amber-500/80 ring-2 ring-amber-500/30 bg-purple-950/20' : 'border-gray-800'
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

                    <div className="grid grid-cols-2 gap-4 p-4 rounded-2xl bg-slate-950 mb-6 text-xs border border-gray-800">
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

                  <div className="pt-6 border-t border-gray-800 flex items-center justify-between">
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

        {/* 9. TESTIMONIALS */}
        <section className="py-20 px-4 sm:px-6 lg:px-8 border-b border-gray-800 relative bg-gray-900/30">
          <div className="max-w-7xl mx-auto">
            <TestimonialsCarousel testimonials={cmsContent.testimonials || []} />
          </div>
        </section>

        {/* 10. FAQ ACCORDION SECTION */}
        <section id="faq" className="py-20 px-4 sm:px-6 lg:px-8 border-b border-gray-800 relative">
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
                className="w-full pl-11 pr-4 py-3 rounded-2xl bg-gray-900 border border-gray-800 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-amber-500 transition"
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
                    className="rounded-2xl bg-gray-900 border border-gray-800 overflow-hidden transition"
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
                          className="px-5 pb-5 text-xs text-slate-300 leading-relaxed border-t border-gray-800 pt-3"
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

        {/* 11. LEAD REGISTRATION CTA FOOTER */}
        <section className="py-20 px-4 sm:px-6 lg:px-8 relative bg-gradient-to-b from-slate-950 to-gray-900 text-center">
          <div className="max-w-3xl mx-auto space-y-6">
            <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
              {t("Kelajakdagi orzularingizga ilk qadamni tashlang!", "Take the first step toward your dream score!", "Сделайте первый шаг к вашей мечте!")}
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              {t("IELTS 8.5+ va grant sohibi bo'lish uchun bugunoq bepul diagnostika darsiga a'zo bo'ling.", "Book a free diagnostic level-check and trial lesson with our senior CELTA mentors.", "Запишитесь на бесплатный пробный урок и диагностику уровня.")}
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <button
                onClick={() => setIsEnrollModalOpen(true)}
                className="px-8 py-4 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-sm shadow-xl shadow-amber-500/30 transition hover:scale-105 cursor-pointer"
              >
                {t("Sinov darsiga a'zo bo'lish", "Book Free Trial Lesson", "Записаться на бесплатный урок")}
              </button>
              <button
                onClick={onOpenAuth}
                className="px-8 py-4 rounded-2xl bg-gray-900 hover:bg-gray-800 text-white font-bold text-sm border border-gray-800 transition cursor-pointer flex items-center gap-2"
              >
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span>Sign In to Portal</span>
              </button>
            </div>
          </div>
        </section>

        {/* FOOTER BAR */}
        <footer className="border-t border-gray-800 py-8 px-4 text-center text-xs text-slate-500 bg-slate-950">
          <p>© 2026 CenterFlow Education Platform (RENESANS LC). All rights reserved.</p>
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
              className="relative w-full max-w-md bg-gray-900 border border-amber-500/30 rounded-3xl p-6 sm:p-8 text-white shadow-2xl"
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
                    className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-gray-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 transition"
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
                    className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-gray-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 transition"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    {t("Qiziqtirgan Kurs", "Interested Course", "Интересующий курс")}
                  </label>
                  <select
                    value={formCourse}
                    onChange={(e) => setFormCourse(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-gray-800 text-xs text-white focus:outline-none focus:border-amber-500 transition"
                  >
                    <option value="IELTS 7.5+ Intensive">IELTS 7.5+ Intensive Mastery</option>
                    <option value="Python & Cyber Security">Python & Cyber Security Essentials</option>
                    <option value="Full-Stack Web Development">Full-Stack Web Development</option>
                    <option value="Advanced Physics">Advanced Physics & Mechanics</option>
                    <option value="SAT & Higher Mathematics">SAT & Higher Mathematics</option>
                    <option value="General English">General English Fluency</option>
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
