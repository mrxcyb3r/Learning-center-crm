import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  AnimatePresence,
  motion,
  useInView,
  useMotionValueEvent,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
} from "framer-motion";
import {
  ArrowRight,
  ArrowUpRight,
  Award,
  BarChart3,
  BookOpen,
  BrainCircuit,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Clock3,
  Compass,
  ExternalLink,
  FileCheck2,
  GraduationCap,
  Layers3,
  MapPin,
  Menu,
  MoveRight,
  Phone,
  Scale,
  Search,
  Send,
  ShieldCheck,
  Sparkles,
  Target,
  TrendingUp,
  Users,
  X,
} from "lucide-react";

/* ============================================================================
   TYPES & CONTRACTS
============================================================================ */

export interface StudentResult {
  id: string;
  name: string;
  score: string | number;
  examType: "DTM" | "IELTS" | "CEFR" | "SAT" | "Milliy Sertifikat" | string;
  university?: string;
  photo?: string | null;
  year?: string;
  teacherId?: string;
  certificateUrl?: string;
}

export interface TeacherRecord {
  id: string;
  name: string;
  slug?: string;
  subject: string;
  experienceYears?: number | string;
  photo?: string | null;
  bio?: string;
  achievements?: string[];
  resultsCount?: number;
}

export interface CoursePath {
  id: string;
  slug: string;
  title: string;
  category: string;
  duration: string;
  level: string;
  description: string;
  isFeatured?: boolean;
  highlights: string[];
  schedule?: string;
  teacherName?: string;
  price?: string;
}

export interface FAQItem {
  id: string;
  question: string;
  answer: string;
}

export interface RenessansLandingPageProps {
  results?: StudentResult[];
  teachers?: TeacherRecord[];
  courses?: CoursePath[];
  faqs?: FAQItem[];
  onCourseClick?: (slug: string) => void;
  onTeacherClick?: (slugOrId: string) => void;
  onConsultationSubmit?: (data: {
    name: string;
    phone: string;
    subject?: string;
  }) => Promise<void>;
}

/* ============================================================================
   CANONICAL SEED DATA (Used seamlessly when props are empty)
============================================================================ */

const DEFAULT_COURSES: CoursePath[] = [
  {
    id: "c-tarix-huquq",
    slug: "tarix-huquq-geografiya",
    title: "Tarix • Huquq • Geografiya",
    category: "Ijtimoiy-Gumanitar & DTM",
    duration: "8 oy",
    level: "DTM / Milliy Sertifikat A+",
    description:
      "Yurisprudensiya (TDYU), Diplomatiya (JIDU) va Davlat Akademiyasiga kiruvchilar uchun kompleks tayyorlov. 2025–2026 o'quv yilida OTMga kirish qamrovi 100% natija.",
    isFeatured: true,
    highlights: [
      "Diplomatiya va Huquqshunoslikka maqsadli tayyorlov",
      "Tarix va Geografiya Milliy Sertifikat A+ dasturi",
      "Xaritalar va yuridik normativ hujjatlar tahlili",
      "Haftalik DTM andozasidagi sinov testlari",
    ],
    schedule: "Haftada 3 kun • 2 soatdan",
    teacherName: "Davlatbek Abdurasulov",
    price: "380,000 UZS / oy",
  },
  {
    id: "c-matematika-pm",
    slug: "matematika-prezident-maktabi",
    title: "Matematika & Prezident Maktabi",
    category: "Aniq Fanlar & Mantiq",
    duration: "9 oy",
    level: "Prezident Maktabi / Milliy Sertifikat",
    description:
      "Prezident maktablarining 1- va 2-bosqich saralash imtihonlari hamda Milliy Sertifikat A+ talablariga to'liq moslashtirilgan chuqurlashtirilgan dastur.",
    highlights: [
      "Mantiqiy, fazoviy va nostandart masalalar",
      "Milliy Sertifikat A+ masalalar banki",
      "Prezident maktablari test simulyatsiyalari",
      "Tezkor yechish algoritmlari",
    ],
    schedule: "Haftada 3 kun • 2 soatdan",
    teacherName: "Munisa Mamadazimova",
    price: "350,000 UZS / oy",
  },
  {
    id: "c-cefr-english",
    slug: "cefr-ingliz-tili",
    title: "CEFR Ingliz Tili (B2 / C1)",
    category: "Xalqaro & Milliy Til",
    duration: "6 oy",
    level: "Intermediate → C1 Advanced",
    description:
      "Grammar, Listening, Reading va Speaking bo‘yicha intensiv akademik mashg‘ulotlar. OTMga 100% imtiyoz beruvchi xalqaro va milliy sertifikat kafolati.",
    highlights: [
      "Har haftalik Mock imtihonlari va xatolar tahlili",
      "Akademik Speaking Club va bahs-munozaralar",
      "Reading va Listening strategik kalitlari",
      "B2 / C1 sertifikatiga bosqichma-bosqich chiqish",
    ],
    schedule: "Haftada 3 kun • 1.5 soatdan",
    teacherName: "Jamshid Alibekov",
    price: "350,000 UZS / oy",
  },
  {
    id: "c-general-kids-english",
    slug: "general-kids-english",
    title: "Kids English (3–10 yosh) & General",
    category: "Bolalar & Boshlang'ich Dastur",
    duration: "Davomiy",
    level: "Beginner → Elementary",
    description:
      "Bolaning katta orzulari biz bilan boshlanadi! Interaktiv o'yinlar, vizual qo'llanmalar va Prezident maktabiga tayyorgarlikning ilk poydevori.",
    highlights: [
      "Qiziqarli o‘yinlar, audio-vizual mashqlar",
      "Erkin inglizcha muloqot va boy so'z zaxirasi",
      "Prezident maktabi boshlang'ich ingliz tili talablari",
      "Bolalar psixologiyasiga mos zamonaviy muhit",
    ],
    schedule: "Haftada 3 kun • 1.5 soatdan",
    teacherName: "Durdona Ermamatova",
    price: "300,000 UZS / oy",
  },
  {
    id: "c-mental-arifmetika",
    slug: "mental-arifmetika",
    title: "Mental Arifmetika & Tezkor Hisob",
    category: "Mantiqiy Rivojlanish",
    duration: "6 oy",
    level: "Barcha yoshlar",
    description:
      "Bolalarda o'ng va chap yarim sharlarni birdek rivojlantirish, kuchli xotira, diqqatni jamlash va bir necha soniyada murakkab hisob-kitoblarni amalga oshirish.",
    highlights: [
      "Abakus bilan tezkor hisoblash texnikasi",
      "Fotografik xotira va zehnni o'stirish",
      "Mantiqiy testlarni yechish tezligi",
      "Prezident maktabi mantiq bosqichiga poydevor",
    ],
    schedule: "Haftada 2 kun • 1.5 soatdan",
    teacherName: "Inomjon Barakayev",
    price: "280,000 UZS / oy",
  },
  {
    id: "c-ona-tili",
    slug: "ona-tili-adabiyot",
    title: "Ona Tili va Adabiyot",
    category: "Majburiy & Mutaxassislik",
    duration: "7 oy",
    level: "DTM & Milliy Sertifikat",
    description:
      "Barcha OTM yo‘nalishlari uchun majburiy blok hamda filologiya va yurisprudensiya yo‘nalishlariga kiruvchilar uchun chuqurlashtirilgan ona tili va adabiyot kursi.",
    highlights: [
      "Imlo, matn tahlili va punktuatsiya",
      "Adabiyotdan asarlar va qahramonlar tahlili",
      "Milliy Sertifikat A+ metodikasi",
      "DTM 30/30 maksimal natija strategiyasi",
    ],
    schedule: "Haftada 3 kun • 2 soatdan",
    teacherName: "Zulfizar Do'smatova",
    price: "320,000 UZS / oy",
  },
];

const DEFAULT_TEACHERS: TeacherRecord[] = [
  {
    id: "t-davlatbek",
    slug: "davlatbek-abdurasulov",
    name: "Davlatbek Abdurasulov",
    subject: "Tarix • Huquq • Geografiya",
    experienceYears: 6,
    bio: "Oliy toifali mutaxassis. Diplomatiya, Yurisprudensiya, Akademiya va DTM imtihonlariga tayyorlash bo'yicha Yangioboddagi yetakchi ustoz. 2025–2026 o'quv yilida OTM qamrovi 100% natija qayd etgan.",
    achievements: [
      "187.9 eng yuqori DTM balli sohibi ustozi",
      "2 nafar 100% Davlat granti talabasi ustozi",
      "OTM qamrovi bo'yicha 100% natija (2025)",
      "Milliy Sertifikat A+ bitiruvchilari",
    ],
    resultsCount: 28,
  },
  {
    id: "t-munisa",
    slug: "munisa-mamadazimova",
    name: "Munisa Mamadazimova",
    subject: "Matematika & Prezident Maktabi",
    experienceYears: 5,
    bio: "Matematika fanidan Milliy Sertifikat hamda Prezident maktablarining 1- va 2-bosqich imtihonlariga saralash bo'yicha ixtisoslashgan yuqori malakali pedagog.",
    achievements: [
      "Prezident maktabiga qabul qilingan o'quvchilar",
      "Matematika Milliy Sertifikat A+ natijalar",
      "DTM majburiy va asosiy blokda maksimal ballar",
    ],
    resultsCount: 22,
  },
  {
    id: "t-jamshid",
    slug: "jamshid-alibekov",
    name: "Jamshid Alibekov",
    subject: "CEFR Ingliz Tili (C1 / B2)",
    experienceYears: 4,
    bio: "Xalqaro metodist. Grammatika, Speaking, Listening va Reading ko‘nikmalarini real imtihon talablari asosida tizimli shakllantiruvchi mutaxassis.",
    achievements: [
      "CEFR C1 va B2 xalqaro sertifikat sohiblari",
      "Akademik speaking va debate klubi asoschisi",
      "Nufuzli xorijiy va mahalliy OTM talabalari",
    ],
    resultsCount: 19,
  },
  {
    id: "t-durdona",
    slug: "durdona-ermamatova",
    name: "Durdona Ermamatova",
    subject: "General & Kids English",
    experienceYears: 4,
    bio: "Kids English va Prezident maktablariga saralash bosqichlariga tayyorlash bo‘yicha interaktiv metodika ustasi. Bolalar uchun ingliz tilini qiziqarli va tabiiy o'rgatadi.",
    achievements: [
      "Prezident maktabi ingliz tili imtihoniga tayyorlov",
      "Bolalarda erta yoshdan ravon inglizcha muloqot",
      "CEFR yoshlar dasturi g'oliblari",
    ],
    resultsCount: 17,
  },
  {
    id: "t-inomjon",
    slug: "inomjon-barakayev",
    name: "Inomjon Barakayev",
    subject: "Mental Arifmetika & Mantiq",
    experienceYears: 3,
    bio: "Mental arifmetika, tezkor abakus hisoblash va bolalarda kuchli xotira hamda mantiqiy tafakkurni rivojlantirish bo'yicha yetakchi murabbiy.",
    achievements: [
      "Tezkor abakus hisoblash bo'yicha turnir sovrindorlari",
      "Diqqat va xotirani 3 baravarga oshirish dasturi",
      "Prezident maktabi mantiqiy savollar tayyorlovi",
    ],
    resultsCount: 15,
  },
  {
    id: "t-zulfizar",
    slug: "zulfizar-dosmatova",
    name: "Zulfizar Do'smatova",
    subject: "Ona Tili va Adabiyot",
    experienceYears: 5,
    bio: "Oliy toifali filolog. Ona tili va adabiyot fanidan Milliy Sertifikat hamda DTM testlariga tizimli tayyorlovchi tajribali ekspert.",
    achievements: [
      "Ona tili Milliy Sertifikat A+ darajalar",
      "DTM majburiy va asosiy blok maksimal ballari",
      "Matn tahlili va imlo bo'yicha mualliflik dasturi",
    ],
    resultsCount: 24,
  },
];

const DEFAULT_RESULTS: StudentResult[] = [
  {
    id: "res-1",
    name: "Hasanboyeva Sevinch",
    score: "187.9",
    examType: "DTM",
    university: "O‘zDJTU — Davlat Granti (Eng yuqori ball)",
    year: "2025",
  },
  {
    id: "res-2",
    name: "Tursunov Shahzod",
    score: "184.5",
    examType: "DTM",
    university: "Toshkent Davlat Yuridik Universiteti (TDYU) — 100% Grant",
    year: "2025",
  },
  {
    id: "res-3",
    name: "Qodirov Bekzod",
    score: "CEFR C1",
    examType: "CEFR",
    university: "Westminster Xalqaro Universiteti (WIUT)",
    year: "2025",
  },
  {
    id: "res-4",
    name: "Erkinova Nigora",
    score: "Tarix A+",
    examType: "Milliy Sertifikat",
    university: "O‘zbekiston Milliy Universiteti (O‘zMU)",
    year: "2025",
  },
  {
    id: "res-5",
    name: "Yo‘ldoshev Sardor",
    score: "176.4",
    examType: "DTM",
    university: "TATU (Axborot Xavfsizligi)",
    year: "2025",
  },
  {
    id: "res-6",
    name: "Mamadaliyev Jasur",
    score: "Matematika A",
    examType: "Milliy Sertifikat",
    university: "Prezident Maktabi & OTM Saralash",
    year: "2025",
  },
];

const DEFAULT_FAQS: FAQItem[] = [
  {
    id: "faq-1",
    question: "Sinov darsi qanday o'tkaziladi va to‘lov bormi?",
    answer:
      "Sinov darsi mutlaqo bepul! O'quvchi markazga kelib, diagnostik test topshiradi, o'z bilim darajasini aniqlaydi, ustoz bilan shaxsan tanishadi va o'z maqsadiga mos guruhga taklif etiladi.",
  },
  {
    id: "faq-2",
    question: "Prezident maktablariga tayyorgarlik kursi qanday yo'lga qo'yilgan?",
    answer:
      "Matematika, ingliz tili, mantiqiy fikrlash va mental arifmetika fanlari integratsiyalashgan holda olib boriladi. Darslar Prezident maktablari rasmiy imtihon andozasi asosida olib boriladi.",
  },
  {
    id: "faq-3",
    question: "Milliy sertifikat va DTM guruhlariga qabul qachon boshlanadi?",
    answer:
      "Qabul yil davomida har oy yangi guruhlar ochilishi bilan davom etadi. Har bir o'quvchi boshlang'ich bilimiga moslab intensiv yoki fundamental guruhga joylashtiriladi.",
  },
  {
    id: "faq-4",
    question: "Haftalik diagnostik testlar qachon va qanday olinadi?",
    answer:
      "Har yakshanba kuni barcha o'quvchilar uchun real imtihon muhiti yaratilib, DTM va Milliy Sertifikat standartidagi nazorat testlari olinadi. Natijalar ota-onalar bilan birgalikda tahlil qilinadi.",
  },
  {
    id: "faq-5",
    question: "Markazda nechta filial mavjud va qayerda joylashgan?",
    answer:
      "RENESSANS O'quv Markazi Yangiobod tumanidagi yagona asosiy binoda — 1-sonli umumiy o'rta ta'lim maktabi binosida faoliyat olib boradi. Barcha sharoitlar shu yerda jamlangan.",
  },
];

const METHOD_STAGES = [
  {
    step: "01",
    title: "Diagnostika va tahlil",
    subtitle: "Boshlang‘ich nuqtani aniq ko‘rish",
    description:
      "Tayyorgarlik taxmin bilan emas, o‘quvchining hozirgi bilim darajasini chuqur diagnostika qilishdan boshlanadi. Kuchli va rivojlantirilishi kerak bo‘lgan mavzular aniqlanadi.",
    badge: "DIAGNOSTIKA",
    icon: Search,
  },
  {
    step: "02",
    title: "Aniq maqsad va target",
    subtitle: "Maqsadni o‘lchanadigan rejaga aylantirish",
    description:
      "OTM yo‘nalishi, grant bali yoki sertifikat formati hisobga olinib, o‘quvchi bilan birgalikda aniq maqsadli target va dars rejasi tuziladi.",
    badge: "TARGET REJA",
    icon: Target,
  },
  {
    step: "03",
    title: "Tizimli darslar",
    subtitle: "Tushunish → Amaliyot → Mustahkamlash",
    description:
      "Nazariya amaliy masalalar bilan birga olib boriladi. Murakkab mavzular bosqichma-bosqich yechiladi va o‘quvchi bilimni amalda qo‘llash ko'nikmasiga ega bo'ladi.",
    badge: "METODOLOGIYA",
    icon: Layers3,
  },
  {
    step: "04",
    title: "Nazorat va monitoring",
    subtitle: "O‘sishni ko‘rish va xatolarni tahlil qilish",
    description:
      "Har haftalik yakshanba testlari o‘quvchining qayerda ekanini ko‘rsatadi. Xatolar maxsus tahlil qilinib, keyingi darslarning ustuvor vazifasiga aylanadi.",
    badge: "MONITORING",
    icon: BarChart3,
  },
  {
    step: "05",
    title: "Imtihonga tayyorgarlik",
    subtitle: "Bilimni real imtihon sharoitiga olib chiqish",
    description:
      "Yakuniy bosqichda vaqtni boshqarish, psixologik tayyorgarlik va imtihon strategiyasi mustahkamlanadi. Bilimdan Natijaga yetiladi.",
    badge: "YAKUNIY BOSQICH",
    icon: Award,
  },
] as const;

const TICKER_ITEMS = [
  "76.2% OTMGA KIRISH KO'RSATKICHI",
  "187.9 ENG YUQORI DTM BALL",
  "100% DAVLAT GRANTLARI",
  "PREZIDENT MAKTABIGA TAYYORLOV",
  "100% BEPUL SINOV DARSI",
  "TAJRIBALI USTOZLAR JAMOASI",
  "MILLIY SERTIFIKAT A+ NATIJALAR",
];

const HERO_TYPED_STRINGS = [
  "Tarix, Huquq & Geografiya",
  "Prezident Maktabiga Tayyorlov",
  "CEFR (B2 / C1) & Kids English",
  "Matematika & Milliy Sertifikat",
  "Mental Arifmetika & Tezkor Hisob",
];

/* ============================================================================
   TYPED SUBHEAD COMPONENT
============================================================================ */

const TypedSubhead: React.FC = () => {
  const [stringIndex, setStringIndex] = useState(0);
  const [charIndex, setCharIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const currentString = HERO_TYPED_STRINGS[stringIndex];
    const speed = isDeleting ? 30 : 65;

    if (!isDeleting && charIndex === currentString.length) {
      const timeout = setTimeout(() => setIsDeleting(true), 2200);
      return () => clearTimeout(timeout);
    } else if (isDeleting && charIndex === 0) {
      setIsDeleting(false);
      setStringIndex((prev) => (prev + 1) % HERO_TYPED_STRINGS.length);
      return;
    }

    const timer = setTimeout(() => {
      setCharIndex((prev) => prev + (isDeleting ? -1 : 1));
    }, speed);

    return () => clearTimeout(timer);
  }, [charIndex, isDeleting, stringIndex]);

  return (
    <span className="inline-flex items-center font-mono font-bold text-amber-400">
      <span>{HERO_TYPED_STRINGS[stringIndex].substring(0, charIndex)}</span>
      <span className="ml-1 inline-block h-4 sm:h-5 w-0.5 animate-pulse bg-amber-400" />
    </span>
  );
};

/* ============================================================================
   ANIMATED NUMBER COUNTER COMPONENT
============================================================================ */

interface CounterNumberProps {
  value: number;
  suffix?: string;
  decimals?: number;
}

const CounterNumber: React.FC<CounterNumberProps> = ({
  value,
  suffix = "",
  decimals = 0,
}) => {
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-50px" });
  const [displayValue, setDisplayValue] = useState("0");

  useEffect(() => {
    if (!isInView) return;
    let startTimestamp: number | null = null;
    const duration = 1800; // ms

    const step = (timestamp: number) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      // Ease out quartic
      const easeProgress = 1 - Math.pow(1 - progress, 4);
      const current = easeProgress * value;

      setDisplayValue(current.toFixed(decimals));

      if (progress < 1) {
        window.requestAnimationFrame(step);
      } else {
        setDisplayValue(value.toFixed(decimals));
      }
    };

    window.requestAnimationFrame(step);
  }, [isInView, value, decimals]);

  return (
    <span ref={ref} className="font-serif">
      {displayValue}
      {suffix}
    </span>
  );
};

/* ============================================================================
   MAIN LANDING PAGE EXPORT
============================================================================ */

export function RenessansLandingPage({
  results: propsResults,
  teachers: propsTeachers,
  courses: propsCourses,
  faqs: propsFaqs,
  onCourseClick,
  onTeacherClick,
  onConsultationSubmit,
}: RenessansLandingPageProps) {
  const reduceMotion = useReducedMotion();
  const { scrollY } = useScroll();

  // Combine Props with Default Rich Content (Seed fallback guarantees content-complete UI)
  const results = useMemo(
    () => (propsResults && propsResults.length > 0 ? propsResults : DEFAULT_RESULTS),
    [propsResults]
  );
  const teachers = useMemo(
    () => (propsTeachers && propsTeachers.length > 0 ? propsTeachers : DEFAULT_TEACHERS),
    [propsTeachers]
  );
  const courses = useMemo(
    () => (propsCourses && propsCourses.length > 0 ? propsCourses : DEFAULT_COURSES),
    [propsCourses]
  );
  const faqs = useMemo(
    () => (propsFaqs && propsFaqs.length > 0 ? propsFaqs : DEFAULT_FAQS),
    [propsFaqs]
  );

  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [selectedResultFilter, setSelectedResultFilter] = useState("Barchasi");
  const [activeTeacherIndex, setActiveTeacherIndex] = useState(0);
  const [openFaq, setOpenFaq] = useState<string | null>(faqs[0]?.id ?? null);

  // Form states
  const [formName, setFormName] = useState("");
  const [formPhone, setFormPhone] = useState("");
  const [formSubject, setFormSubject] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState("");

  useMotionValueEvent(scrollY, "change", (latest) => {
    setIsScrolled(latest > 32);
  });

  useEffect(() => {
    if (!mobileMenuOpen) return;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [mobileMenuOpen]);

  const availableFilters = useMemo(() => {
    const types = Array.from(
      new Set(results.map((result) => (result.examType || "").trim()).filter(Boolean))
    );
    return ["Barchasi", ...types];
  }, [results]);

  const filteredResults = useMemo(() => {
    if (selectedResultFilter === "Barchasi") {
      return results;
    }
    return results.filter((result) => result.examType === selectedResultFilter);
  }, [results, selectedResultFilter]);

  const handleNavigateToCourse = (slug: string) => {
    if (!slug) return;
    if (onCourseClick) {
      onCourseClick(slug);
      return;
    }
    if (typeof window !== "undefined") {
      window.location.assign(`/courses/${encodeURIComponent(slug)}`);
    }
  };

  const handleNavigateToTeacher = (slugOrId: string) => {
    if (!slugOrId) return;
    if (onTeacherClick) {
      onTeacherClick(slugOrId);
      return;
    }
    if (typeof window !== "undefined") {
      window.location.assign(`/teachers/${encodeURIComponent(slugOrId)}`);
    }
  };

  const scrollTo = (id: string) => {
    setMobileMenuOpen(false);
    if (typeof document === "undefined") return;
    const target = document.getElementById(id);
    target?.scrollIntoView({
      behavior: reduceMotion ? "auto" : "smooth",
      block: "start",
    });
  };

  const handleFormSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isSubmitting) return;

    const name = formName.trim();
    const phone = formPhone.trim();
    const subject = formSubject.trim();

    if (!name || !phone) return;

    setSubmitError("");
    setIsSubmitting(true);

    try {
      if (onConsultationSubmit) {
        await onConsultationSubmit({
          name,
          phone,
          ...(subject ? { subject } : {}),
        });
      } else {
        await new Promise((res) => setTimeout(res, 800));
      }
      setIsSubmitted(true);
    } catch (error) {
      console.error(error);
      setSubmitError(
        "Arizani yuborishda xatolik yuz berdi. Iltimos, qayta urinib ko‘ring yoki to'g'ridan-to'g'ri qo'ng'iroq qiling."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const navItems = [
    ["metodika", "Metodika"],
    ["kurslar", "Kurslar"],
    ["prezident-maktabi", "Prezident Maktabi"],
    ["ustozlar", "Ustozlar"],
    ["fanlar", "Fanlar & Aloqa"],
    ["natijalar", "Natijalar"],
    ["manzil", "Manzil"],
    ["faq", "Savollar"],
  ] as const;

  return (
    <main className="min-h-screen overflow-x-clip bg-[#07090d] text-stone-100 antialiased selection:bg-amber-400 selection:text-black">
      {/* ====================================================================
          1. HEADER / EDITORIAL NAVIGATION
      ==================================================================== */}
      <header
        className={[
          "fixed inset-x-0 top-0 z-[100] transition-all duration-500",
          isScrolled
            ? "border-b border-white/[0.08] bg-[#07090d]/90 py-3.5 backdrop-blur-2xl"
            : "bg-transparent py-6",
        ].join(" ")}
      >
        <div className="mx-auto flex max-w-[1440px] items-center justify-between px-6 sm:px-8 lg:px-12">
          {/* Logo Mark */}
          <button
            type="button"
            onClick={() => scrollTo("top")}
            className="group flex items-center gap-3.5 text-left"
            aria-label="RENESSANS Bosh sahifa"
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-amber-400/40 bg-amber-400 font-serif text-xl font-bold text-black shadow-[0_8px_30px_rgba(245,158,11,0.22)] transition-transform duration-300 group-hover:scale-105">
              R
            </span>

            <span className="block">
              <span className="block font-serif text-[16px] font-bold tracking-[0.2em] leading-none text-stone-100">
                RENESSANS
              </span>
              <span className="mt-1 block font-mono text-[8px] font-semibold uppercase tracking-[0.3em] text-amber-400/90">
                O‘QUV MARKAZI • YANGIOBOD
              </span>
            </span>
          </button>

          {/* Desktop Nav */}
          <nav
            aria-label="Asosiy navigatsiya"
            className="hidden items-center gap-8 text-[11px] font-semibold uppercase tracking-[0.16em] text-stone-400 lg:flex"
          >
            {navItems.map(([id, label]) => (
              <button
                key={id}
                type="button"
                onClick={() => scrollTo(id)}
                className="relative py-2 transition-colors hover:text-amber-400"
              >
                {label}
              </button>
            ))}
          </nav>

          {/* Contact Actions */}
          <div className="hidden items-center gap-5 md:flex">
            <a
              href="tel:+998886484949"
              className="flex items-center gap-2 text-xs font-mono font-semibold text-stone-300 hover:text-amber-400 transition-colors"
            >
              <Phone className="h-3.5 w-3.5 text-amber-400" />
              +998 (88) 648-49-49
            </a>

            <button
              type="button"
              onClick={() => scrollTo("konsultatsiya")}
              className="inline-flex items-center gap-2.5 rounded-full bg-amber-400 px-6 py-2.5 text-[10px] font-bold uppercase tracking-[0.14em] text-black transition-all duration-300 hover:bg-amber-300 hover:shadow-[0_12px_40px_rgba(245,158,11,0.25)]"
            >
              Sinov Darsi
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>

          {/* Mobile Menu Trigger */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen((value) => !value)}
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/15 text-stone-300 md:hidden"
            aria-label={mobileMenuOpen ? "Menyuni yopish" : "Menyuni ochish"}
            aria-expanded={mobileMenuOpen}
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

        {/* Mobile Flyout */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={reduceMotion ? false : { opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={reduceMotion ? undefined : { opacity: 0, y: -10 }}
              className="absolute inset-x-0 top-full border-b border-white/[0.1] bg-[#080a0f]/98 p-6 shadow-2xl backdrop-blur-2xl md:hidden"
            >
              <div className="space-y-1">
                {navItems.map(([id, label]) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => scrollTo(id)}
                    className="flex w-full items-center justify-between rounded-xl px-4 py-3.5 text-left text-sm font-medium text-stone-300 hover:bg-white/[0.05] hover:text-amber-400"
                  >
                    {label}
                    <ChevronRight className="h-4 w-4 text-stone-600" />
                  </button>
                ))}
              </div>

              <div className="mt-6 border-t border-white/[0.08] pt-4">
                <a
                  href="tel:+998886484949"
                  className="flex items-center justify-center gap-2 rounded-xl border border-white/[0.1] py-3 text-xs font-mono text-stone-300"
                >
                  <Phone className="h-4 w-4 text-amber-400" />
                  +998 (88) 648-49-49
                </a>

                <button
                  type="button"
                  onClick={() => scrollTo("konsultatsiya")}
                  className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-amber-400 px-5 py-3.5 text-xs font-bold uppercase tracking-[0.12em] text-black"
                >
                  Bepul Sinov Darsiga Yozilish
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* ====================================================================
          2. EDITORIAL CINEMATIC HERO
      ==================================================================== */}
      <section
        id="top"
        className="relative flex min-h-[100svh] flex-col justify-between border-b border-white/[0.08] pt-32 pb-16"
      >
        {/* Ambient Glows */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute left-1/2 top-1/4 h-[600px] w-[600px] -translate-x-1/2 rounded-full bg-amber-500/[0.06] blur-[160px]"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute right-0 top-1/3 h-[500px] w-[500px] rounded-full bg-emerald-500/[0.04] blur-[150px]"
        />

        {/* Hero Central Narrative */}
        <div className="relative mx-auto w-full max-w-[1440px] px-6 sm:px-8 lg:px-12">
          <div className="grid gap-12 lg:grid-cols-12 lg:items-end">
            <div className="lg:col-span-8">
              {/* Eyebrow */}
              <motion.div
                initial={reduceMotion ? false : { opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="mb-8 inline-flex items-center gap-2.5 rounded-full border border-amber-400/30 bg-amber-400/[0.06] px-4 py-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-amber-400"
              >
                <Sparkles className="h-3.5 w-3.5" />
                Yangioboddagi Zamonaviy O‘quv Markazi
              </motion.div>

              {/* Huge Editorial Headline */}
              <motion.h1
                initial={reduceMotion ? false : { opacity: 0, y: 28 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.1 }}
                className="font-serif text-[clamp(3.4rem,7.5vw,7.8rem)] font-medium leading-[0.9] tracking-[-0.045em] text-stone-100"
              >
                Farzandingizning
                <br />
                kelajagini bugundan <br />
                <span className="italic text-amber-400">boshlang!</span>
              </motion.h1>

              {/* Dynamic Typewriter Category Subhead */}
              <motion.div
                initial={reduceMotion ? false : { opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.8, delay: 0.25 }}
                className="mt-8 flex flex-wrap items-center gap-3 text-sm sm:text-base text-stone-300"
              >
                <span className="font-mono text-stone-400 uppercase tracking-widest text-xs">
                  Asosiy Yo'nalish:
                </span>
                <TypedSubhead />
              </motion.div>
            </div>

            {/* Right Column: Statement & CTAs */}
            <div className="lg:col-span-4 lg:pb-3">
              <motion.p
                initial={reduceMotion ? false : { opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.3 }}
                className="text-base leading-relaxed text-stone-300 sm:text-lg"
              >
                Tarix, Huquq, Geografiya, Matematika, CEFR Ingliz tili va Prezident
                maktablariga tayyorlov. Bilimga sarmoya — kelajakka investitsiya!
              </motion.p>

              <motion.div
                initial={reduceMotion ? false : { opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.4 }}
                className="mt-8 flex flex-col gap-3.5 sm:flex-row lg:flex-col xl:flex-row"
              >
                <button
                  type="button"
                  onClick={() => scrollTo("konsultatsiya")}
                  className="group inline-flex min-h-12 items-center justify-center gap-3 rounded-full bg-amber-400 px-8 text-[11px] font-bold uppercase tracking-[0.14em] text-black transition-all hover:bg-amber-300 hover:shadow-[0_16px_50px_rgba(245,158,11,0.28)]"
                >
                  Bepul Sinov Darsi
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </button>

                <button
                  type="button"
                  onClick={() => scrollTo("metodika")}
                  className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full border border-white/20 bg-white/[0.04] px-7 text-[11px] font-bold uppercase tracking-[0.14em] text-stone-200 transition-all hover:border-amber-400/40 hover:bg-white/[0.08]"
                >
                  Tizimni Ko‘rish
                  <ChevronDown className="h-4 w-4 text-amber-400" />
                </button>
              </motion.div>
            </div>
          </div>
        </div>

        {/* Editorial Metric Strip (Replaces card grids with large typography counters) */}
        <div className="relative mt-16 border-t border-white/[0.08] pt-10">
          <div className="mx-auto max-w-[1440px] px-6 sm:px-8 lg:px-12">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
              <div className="border-l border-amber-400/30 pl-5">
                <div className="text-[clamp(2.5rem,4vw,3.8rem)] font-bold text-stone-100 leading-none">
                  <CounterNumber value={76.2} decimals={1} suffix="%" />
                </div>
                <div className="mt-2 text-[10px] font-mono uppercase tracking-[0.2em] text-stone-400">
                  OTMga Kirish Ko'rsatkichi
                </div>
              </div>

              <div className="border-l border-amber-400/30 pl-5">
                <div className="text-[clamp(2.5rem,4vw,3.8rem)] font-bold text-amber-400 leading-none">
                  <CounterNumber value={187.9} decimals={1} />
                </div>
                <div className="mt-2 text-[10px] font-mono uppercase tracking-[0.2em] text-stone-400">
                  Eng Yuqori DTM Balli
                </div>
              </div>

              <div className="border-l border-amber-400/30 pl-5">
                <div className="text-[clamp(2.5rem,4vw,3.8rem)] font-bold text-stone-100 leading-none">
                  16 / 21
                </div>
                <div className="mt-2 text-[10px] font-mono uppercase tracking-[0.2em] text-stone-400">
                  Talaba Bo'lganlar
                </div>
              </div>

              <div className="border-l border-amber-400/30 pl-5">
                <div className="text-[clamp(2.5rem,4vw,3.8rem)] font-bold text-emerald-400 leading-none">
                  <CounterNumber value={100} decimals={0} suffix="%" />
                </div>
                <div className="mt-2 text-[10px] font-mono uppercase tracking-[0.2em] text-stone-400">
                  Davlat Granti & Qamrov
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ====================================================================
          3. DUAL MOVING EDITORIAL BRAND STRIP
      ==================================================================== */}
      <section className="relative overflow-hidden border-b border-white/[0.08] bg-[#0a0d13] py-4 select-none">
        <div className="flex whitespace-nowrap overflow-hidden">
          <motion.div
            className="flex gap-10 items-center"
            animate={{ x: reduceMotion ? 0 : [0, -1200] }}
            transition={{ repeat: Infinity, duration: 24, ease: "linear" }}
          >
            {[...TICKER_ITEMS, ...TICKER_ITEMS, ...TICKER_ITEMS].map((item, idx) => (
              <div
                key={idx}
                className="flex items-center gap-10 text-xs font-mono font-bold tracking-[0.22em] text-stone-300"
              >
                <span>{item}</span>
                <span className="text-amber-400/60">✦</span>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ====================================================================
          4. EDITORIAL PHILOSOPHY (Scroll-driven statement)
      ==================================================================== */}
      <section className="relative border-b border-white/[0.08] bg-[#080b10] py-28 sm:py-36">
        <div className="mx-auto max-w-[1300px] px-6 sm:px-8 lg:px-12">
          <div className="grid gap-12 lg:grid-cols-12">
            <div className="lg:col-span-3">
              <span className="font-mono text-[10px] font-bold uppercase tracking-[0.25em] text-amber-400">
                01 / FALSAFA & POZITSIYA
              </span>
              <p className="mt-4 text-xs font-mono text-stone-400 leading-relaxed">
                YANGIOBOD TUMANI • 1-MAKTAB
                <br />
                BILIMDAN NATIJAGA
              </p>
            </div>

            <div className="lg:col-span-9">
              <h2 className="font-serif text-[clamp(2.2rem,4.6vw,4.5rem)] leading-[1.08] tracking-[-0.03em] text-stone-100">
                Farzandingizning kelajagi tasodifga emas,{" "}
                <span className="text-amber-400 italic">aniq tizimga</span> bog‘liq.
                <span className="text-stone-400">
                  {" "}
                  Har bir o‘quvchining boshlang‘ich nuqtasi boshqa — shuning uchun
                  tayyorgarlik ham shaxsiy maqsaddan boshlanadi.
                </span>
              </h2>

              <div className="mt-12 flex flex-wrap items-center gap-8 border-t border-white/[0.1] pt-8 font-mono text-xs uppercase tracking-[0.16em] text-stone-400">
                <span className="text-amber-400 font-semibold">BILIMGA SARMOYA — KELAJAKKA INVESTITSIYA</span>
                <span className="text-stone-700">|</span>
                <span>MAQSAD • TIZIM • NATIJA</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ====================================================================
          5. STICKY SCROLL STORYTELLING: BOSQICHMA-BOSQICH TIZIM (01—05)
      ==================================================================== */}
      <MethodologyScrollNarrative stages={METHOD_STAGES} />

      {/* ====================================================================
          6. EDITORIAL COURSES SECTION (No repetitive card grid)
      ==================================================================== */}
      <section
        id="kurslar"
        className="scroll-mt-20 border-b border-white/[0.08] bg-[#07090d] py-28 sm:py-36"
      >
        <div className="mx-auto max-w-[1440px] px-6 sm:px-8 lg:px-12">
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 border-b border-white/[0.08] pb-10">
            <div>
              <span className="font-mono text-[10px] font-bold uppercase tracking-[0.25em] text-amber-400">
                02 / ASOSIY YO‘NALISHLAR
              </span>
              <h2 className="mt-4 font-serif text-[clamp(2.5rem,5vw,5rem)] leading-none tracking-tight text-stone-100">
                Akademik Kurslar
              </h2>
            </div>
            <p className="max-w-md text-sm text-stone-400 leading-relaxed">
              DTM, Milliy Sertifikat, CEFR va Prezident maktabiga saralash bo'yicha
              Yangioboddagi eng yuqori natijador tayyorlov yo'nalishlari.
            </p>
          </div>

          {/* Interactive Editorial Rows (Alternating Asymmetry) */}
          <div className="divide-y divide-white/[0.08]">
            {courses.map((course, index) => {
              const isEven = index % 2 === 0;
              return (
                <motion.article
                  key={course.id}
                  initial={reduceMotion ? false : { opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-50px" }}
                  className="group py-12 transition-colors hover:bg-white/[0.015]"
                >
                  <div className="grid lg:grid-cols-12 gap-8 items-start">
                    {/* Index & Category */}
                    <div className="lg:col-span-3">
                      <span className="font-mono text-3xl font-bold text-stone-600 group-hover:text-amber-400 transition-colors">
                        0{index + 1}
                      </span>
                      <div className="mt-2 inline-block rounded-full border border-amber-400/20 bg-amber-400/[0.06] px-3 py-1 text-[9px] font-mono font-bold uppercase tracking-[0.16em] text-amber-400">
                        {course.category}
                      </div>
                      <div className="mt-3 text-xs font-mono text-stone-400">
                        Davomiyligi: {course.duration}
                      </div>
                    </div>

                    {/* Title & Description */}
                    <div className="lg:col-span-6">
                      <h3 className="font-serif text-[clamp(1.8rem,3vw,3rem)] leading-tight text-stone-100 group-hover:text-amber-300 transition-colors">
                        {course.title}
                      </h3>
                      <p className="mt-4 text-sm sm:text-base leading-relaxed text-stone-300">
                        {course.description}
                      </p>

                      {/* Highlights */}
                      <div className="mt-6 grid sm:grid-cols-2 gap-2.5">
                        {course.highlights.map((item, idx) => (
                          <div key={idx} className="flex items-start gap-2 text-xs text-stone-400">
                            <Check className="h-3.5 w-3.5 text-amber-400 shrink-0 mt-0.5" />
                            <span>{item}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Teacher & Action */}
                    <div className="lg:col-span-3 flex flex-col lg:items-end justify-between h-full gap-6">
                      <div className="lg:text-right">
                        <span className="text-[10px] font-mono uppercase tracking-widest text-stone-400">
                          Mas'ul Ustoz:
                        </span>
                        <div className="mt-1 font-serif text-lg font-semibold text-stone-200">
                          {course.teacherName}
                        </div>
                        {course.price && (
                          <div className="mt-1 text-xs font-mono text-amber-400 font-semibold">
                            {course.price}
                          </div>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={() => handleNavigateToCourse(course.slug)}
                        className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/[0.04] px-5 py-2.5 text-[10px] font-bold uppercase tracking-[0.14em] text-stone-200 transition-all group-hover:border-amber-400 group-hover:bg-amber-400 group-hover:text-black"
                      >
                        Batafsil ma'lumot
                        <ArrowUpRight className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                </motion.article>
              );
            })}
          </div>
        </div>
      </section>

      {/* ====================================================================
          7. SPECIAL EDITORIAL: PREZIDENT MAKTABIGA TAYYORLOV
      ==================================================================== */}
      <section
        id="prezident-maktabi"
        className="scroll-mt-20 border-b border-white/[0.08] bg-[#090d14] py-28 sm:py-36 relative overflow-hidden"
      >
        <div
          aria-hidden="true"
          className="pointer-events-none absolute right-[-100px] top-0 h-[500px] w-[500px] rounded-full bg-amber-400/[0.05] blur-[150px]"
        />

        <div className="mx-auto max-w-[1440px] px-6 sm:px-8 lg:px-12 relative">
          <div className="grid lg:grid-cols-12 gap-12 items-start">
            {/* Left Header */}
            <div className="lg:col-span-5">
              <span className="font-mono text-[10px] font-bold uppercase tracking-[0.25em] text-amber-400">
                03 / MAXSUS INTENSIV
              </span>

              <h2 className="mt-4 font-serif text-[clamp(2.4rem,4.8vw,4.8rem)] leading-[0.95] tracking-tight text-stone-100">
                Prezident Maktabiga
                <br />
                <span className="italic text-amber-400">Tayyorlov Dasturi</span>
              </h2>

              <p className="mt-6 text-sm sm:text-base leading-relaxed text-stone-300">
                Bolanig katta orzulari biz bilan boshlanadi! Matematika, ingliz tili,
                mental arifmetika va mantiqiy fikrlash integratsiyalashgan holda 1- va
                2-bosqich imtihonlariga tayyorlanadi.
              </p>

              <div className="mt-8 space-y-4">
                <div className="flex items-center gap-3.5 text-xs text-stone-300">
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-400/10 text-amber-400 border border-amber-400/20">
                    <BrainCircuit className="h-4 w-4" />
                  </div>
                  <span>Mantiqiy va fazoviy tafakkur masalalari</span>
                </div>
                <div className="flex items-center gap-3.5 text-xs text-stone-300">
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-400/10 text-amber-400 border border-amber-400/20">
                    <BookOpen className="h-4 w-4" />
                  </div>
                  <span>Prezident maktabi standarti bo'yicha ingliz tili</span>
                </div>
                <div className="flex items-center gap-3.5 text-xs text-stone-300">
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-400/10 text-amber-400 border border-amber-400/20">
                    <Compass className="h-4 w-4" />
                  </div>
                  <span>Haftalik simulyatsiya testlari va vaqt nazorati</span>
                </div>
              </div>

              <div className="mt-10">
                <button
                  type="button"
                  onClick={() => scrollTo("konsultatsiya")}
                  className="inline-flex items-center gap-2 rounded-full bg-amber-400 px-7 py-3 text-[10px] font-bold uppercase tracking-[0.14em] text-black transition-all hover:bg-amber-300"
                >
                  Prezident Maktabi Guruhiga Yozilish
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Right Roadmap / Pathway */}
            <div className="lg:col-span-7 border-l border-white/[0.1] pl-6 sm:pl-10 space-y-8">
              {[
                {
                  step: "01",
                  title: "Boshlang'ich Diagnostika",
                  desc: "O'quvchining mantiqiy va akademik bazasi sinovdan o'tkaziladi.",
                },
                {
                  step: "02",
                  title: "Mantiqiy Matematika & Fazoviy Fikrlash",
                  desc: "Munisa Mamadazimova rahbarligida nostandart masalalar tahlili.",
                },
                {
                  step: "03",
                  title: "Akademik & Kids English",
                  desc: "Durdona Ermamatova bilan speaking, reading va grammatika bazasi.",
                },
                {
                  step: "04",
                  title: "Mental Arifmetika & Tezkor Hisob",
                  desc: "Inomjon Barakayev bilan soniyalarda tez hisoblash va fotografik xotira.",
                },
                {
                  step: "05",
                  title: "Rasmiy Imtihon Simulyatsiyasi",
                  desc: "Haftalik real imtihon andozasidagi bosqichma-bosqich sinovlar.",
                },
              ].map((item, idx) => (
                <div key={idx} className="relative group">
                  <div className="flex items-start gap-4">
                    <span className="font-mono text-xs font-bold text-amber-400 border border-amber-400/30 bg-amber-400/10 rounded px-2 py-1">
                      {item.step}
                    </span>
                    <div>
                      <h4 className="font-serif text-xl text-stone-100 group-hover:text-amber-300 transition-colors">
                        {item.title}
                      </h4>
                      <p className="mt-1.5 text-xs text-stone-400 leading-relaxed">
                        {item.desc}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ====================================================================
          8. TEACHERS: "PEOPLE OF THE SYSTEM" SHOWCASE (No 6 identical cards)
      ==================================================================== */}
      <section
        id="ustozlar"
        className="scroll-mt-20 border-b border-white/[0.08] bg-[#07090d] py-28 sm:py-36"
      >
        <div className="mx-auto max-w-[1440px] px-6 sm:px-8 lg:px-12">
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 border-b border-white/[0.08] pb-10">
            <div>
              <span className="font-mono text-[10px] font-bold uppercase tracking-[0.25em] text-amber-400">
                04 / PEDAGOGIK JAMOASI
              </span>
              <h2 className="mt-4 font-serif text-[clamp(2.5rem,5vw,5rem)] leading-none tracking-tight text-stone-100">
                Tizim Yetakchilari
              </h2>
            </div>
            <p className="max-w-md text-sm text-stone-400 leading-relaxed">
              O'z fanida 100% natija qayd etgan, ko'p yillik tajribaga ega bo'lgan
              oliy toifali ustozlar.
            </p>
          </div>

          <div className="mt-14 grid lg:grid-cols-12 gap-10 items-start">
            {/* Left: Interactive Teacher Selector */}
            <div className="lg:col-span-5 space-y-2">
              {teachers.map((teacher, index) => {
                const isActive = activeTeacherIndex === index;
                return (
                  <button
                    key={teacher.id}
                    type="button"
                    onClick={() => setActiveTeacherIndex(index)}
                    className={[
                      "w-full text-left p-5 rounded-2xl border transition-all duration-300 flex items-center justify-between",
                      isActive
                        ? "border-amber-400/40 bg-white/[0.04] shadow-[0_4px_25px_rgba(245,158,11,0.1)]"
                        : "border-transparent hover:border-white/[0.08] hover:bg-white/[0.02]",
                    ].join(" ")}
                  >
                    <div className="flex items-center gap-4">
                      <span
                        className={[
                          "font-mono text-xs font-bold",
                          isActive ? "text-amber-400" : "text-stone-600",
                        ].join(" ")}
                      >
                        0{index + 1}
                      </span>
                      <div>
                        <div
                          className={[
                            "font-serif text-lg font-medium",
                            isActive ? "text-stone-100" : "text-stone-400",
                          ].join(" ")}
                        >
                          {teacher.name}
                        </div>
                        <div className="text-[10px] font-mono text-stone-500">
                          {teacher.subject}
                        </div>
                      </div>
                    </div>

                    <ChevronRight
                      className={[
                        "h-4 w-4 transition-transform",
                        isActive ? "text-amber-400 rotate-90" : "text-stone-700",
                      ].join(" ")}
                    />
                  </button>
                );
              })}
            </div>

            {/* Right: Large Featured Teacher Profile Showcase */}
            <div className="lg:col-span-7">
              <AnimatePresence mode="wait">
                {(() => {
                  const current = teachers[activeTeacherIndex] || teachers[0];
                  return (
                    <motion.div
                      key={current.id}
                      initial={reduceMotion ? false : { opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={reduceMotion ? undefined : { opacity: 0, x: -20 }}
                      transition={{ duration: 0.35 }}
                      className="rounded-3xl border border-white/[0.1] bg-[#0c1017] p-8 sm:p-12 relative overflow-hidden"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/[0.08] pb-6">
                        <div>
                          <span className="text-[10px] font-mono font-bold uppercase tracking-[0.2em] text-amber-400">
                            {current.subject}
                          </span>
                          <h3 className="mt-2 font-serif text-[clamp(2rem,3.5vw,3.5rem)] leading-none text-stone-100">
                            {current.name}
                          </h3>
                        </div>

                        <div className="text-right">
                          <span className="block font-serif text-2xl font-bold text-amber-400">
                            {current.experienceYears} yil
                          </span>
                          <span className="text-[9px] font-mono uppercase tracking-widest text-stone-500">
                            Tajriba
                          </span>
                        </div>
                      </div>

                      <p className="mt-8 text-sm sm:text-base leading-relaxed text-stone-300">
                        {current.bio}
                      </p>

                      {current.achievements && (
                        <div className="mt-8 space-y-3">
                          <span className="text-[10px] font-mono uppercase tracking-widest text-stone-400">
                            Asosiy Yutuqlar:
                          </span>
                          {current.achievements.map((ach, idx) => (
                            <div key={idx} className="flex items-start gap-3 text-xs text-stone-300">
                              <Check className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
                              <span>{ach}</span>
                            </div>
                          ))}
                        </div>
                      )}

                      <div className="mt-10 pt-6 border-t border-white/[0.08] flex items-center justify-between">
                        <span className="text-xs font-mono text-stone-400">
                          {current.resultsCount ? `${current.resultsCount}+ o'quvchi natijasi` : "Yetakchi mutaxassis"}
                        </span>

                        <button
                          type="button"
                          onClick={() => handleNavigateToTeacher(current.slug || current.id)}
                          className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.14em] text-amber-400 hover:text-amber-300"
                        >
                          Ustoz profili
                          <ArrowRight className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </motion.div>
                  );
                })()}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </section>

      {/* ====================================================================
          9. ACADEMIC COVERAGE & SUBJECT → TEACHER MAPPING
      ==================================================================== */}
      <section
        id="fanlar"
        className="border-b border-white/[0.08] bg-[#080b10] py-28 sm:py-36"
      >
        <div className="mx-auto max-w-[1440px] px-6 sm:px-8 lg:px-12">
          <div className="max-w-2xl">
            <span className="font-mono text-[10px] font-bold uppercase tracking-[0.25em] text-amber-400">
              05 / AKADEMIK QAMROV
            </span>
            <h2 className="mt-4 font-serif text-[clamp(2.3rem,4.5vw,4.5rem)] leading-tight text-stone-100">
              Fanlar va Mas'ul Ustozlar
            </h2>
          </div>

          <div className="mt-14 grid md:grid-cols-2 lg:grid-cols-3 gap-px bg-white/[0.08] border border-white/[0.08] rounded-3xl overflow-hidden">
            {[
              {
                subject: "TARIX • HUQUQ • GEOGRAFIYA",
                teacher: "Davlatbek Abdurasulov",
                tags: "DTM • Diplomatiya • Yurisprudensiya • Akademiya",
              },
              {
                subject: "MATEMATIKA",
                teacher: "Munisa Mamadazimova",
                tags: "Milliy Sertifikat A+ • Prezident Maktabi",
              },
              {
                subject: "CEFR INGLIZ TILI",
                teacher: "Jamshid Alibekov",
                tags: "CEFR C1 / B2 • Grammar • Speaking • Mock Test",
              },
              {
                subject: "GENERAL & KIDS ENGLISH",
                teacher: "Durdona Ermamatova",
                tags: "Kids English • Prezident Maktabi Tayyorlov",
              },
              {
                subject: "MENTAL ARIFMETIKA",
                teacher: "Inomjon Barakayev",
                tags: "Tez hisoblash • Kuchli xotira • Tafakkur",
              },
              {
                subject: "ONA TILI VA ADABIYOT",
                teacher: "Zulfizar Do'smatova",
                tags: "Milliy Sertifikat • DTM Majburiy & Asosiy",
              },
            ].map((item, idx) => (
              <div
                key={idx}
                className="bg-[#0a0d13] p-8 sm:p-10 hover:bg-[#0e121a] transition-colors flex flex-col justify-between"
              >
                <div>
                  <div className="text-[10px] font-mono uppercase tracking-[0.2em] text-amber-400">
                    FAN YO'NALISHI
                  </div>
                  <h3 className="mt-3 font-serif text-2xl text-stone-100">
                    {item.subject}
                  </h3>
                  <p className="mt-4 text-xs font-mono text-stone-400 leading-relaxed">
                    {item.tags}
                  </p>
                </div>

                <div className="mt-8 pt-5 border-t border-white/[0.08]">
                  <span className="text-[10px] font-mono text-stone-500 uppercase">
                    Mas'ul Pedagog:
                  </span>
                  <div className="mt-1 font-serif text-base font-semibold text-stone-200">
                    {item.teacher}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ====================================================================
          10. RESULTS ARCHIVE (Filtered Editorial Stream)
      ==================================================================== */}
      <section
        id="natijalar"
        className="scroll-mt-20 border-b border-white/[0.08] bg-[#07090d] py-28 sm:py-36"
      >
        <div className="mx-auto max-w-[1440px] px-6 sm:px-8 lg:px-12">
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 border-b border-white/[0.08] pb-10">
            <div>
              <span className="font-mono text-[10px] font-bold uppercase tracking-[0.25em] text-amber-400">
                06 / BITIRUVCHILAR NATIJALARI
              </span>
              <h2 className="mt-4 font-serif text-[clamp(2.5rem,5vw,5rem)] leading-none tracking-tight text-stone-100">
                Real Natijalar
              </h2>
            </div>

            {/* Filter Tabs */}
            <div className="flex flex-wrap gap-2">
              {availableFilters.map((filter) => (
                <button
                  key={filter}
                  type="button"
                  onClick={() => setSelectedResultFilter(filter)}
                  className={[
                    "rounded-full px-5 py-2.5 text-[10px] font-mono font-bold uppercase tracking-[0.14em] transition-all",
                    selectedResultFilter === filter
                      ? "bg-amber-400 text-black shadow-[0_4px_20px_rgba(245,158,11,0.25)]"
                      : "border border-white/[0.1] bg-white/[0.025] text-stone-400 hover:text-stone-200",
                  ].join(" ")}
                >
                  {filter}
                </button>
              ))}
            </div>
          </div>

          {/* Results Stream */}
          <motion.div layout className="mt-12 divide-y divide-white/[0.08]">
            <AnimatePresence mode="popLayout">
              {filteredResults.map((res, index) => (
                <motion.div
                  key={res.id}
                  layout
                  initial={reduceMotion ? false : { opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={reduceMotion ? undefined : { opacity: 0, scale: 0.95 }}
                  transition={{ delay: index * 0.04 }}
                  className="py-6 sm:py-8 flex flex-col md:flex-row md:items-center justify-between gap-4 group"
                >
                  <div className="flex items-center gap-6">
                    <span className="font-mono text-sm text-stone-600">
                      0{index + 1}
                    </span>
                    <div>
                      <h4 className="font-serif text-2xl text-stone-100 group-hover:text-amber-300 transition-colors">
                        {res.name}
                      </h4>
                      {res.university && (
                        <p className="text-xs text-stone-400 mt-1 flex items-center gap-2">
                          <GraduationCap className="h-3.5 w-3.5 text-amber-400 shrink-0" />
                          {res.university}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-6 md:text-right pl-10 md:pl-0">
                    <div>
                      <span className="font-serif text-3xl font-bold text-amber-400">
                        {res.score}
                      </span>
                      <span className="block text-[9px] font-mono uppercase tracking-widest text-stone-500">
                        {res.examType} • {res.year || "2025"}
                      </span>
                    </div>

                    {res.certificateUrl && (
                      <a
                        href={res.certificateUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="flex h-9 w-9 items-center justify-center rounded-full border border-white/20 hover:border-amber-400 hover:text-amber-400 transition-colors"
                        title="Sertifikatni ko'rish"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    )}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        </div>
      </section>

      {/* ====================================================================
          11. FAQ: EDITORIAL ACCORDION
      ==================================================================== */}
      <section
        id="faq"
        className="scroll-mt-20 border-b border-white/[0.08] bg-[#07090d] py-28 sm:py-36"
      >
        <div className="mx-auto max-w-[1000px] px-6 sm:px-8">
          <div className="text-center">
            <span className="font-mono text-[10px] font-bold uppercase tracking-[0.25em] text-amber-400">
              07 / SAVOLLAR & JAVOBLAR
            </span>
            <h2 className="mt-4 font-serif text-[clamp(2.4rem,4.5vw,4.5rem)] leading-none tracking-tight text-stone-100">
              Ko‘p So‘raladigan Savollar
            </h2>
          </div>

          <div className="mt-14 divide-y divide-white/[0.08] border-y border-white/[0.08]">
            {faqs.map((faq, index) => {
              const isOpen = openFaq === faq.id;
              return (
                <div key={faq.id} className="py-6">
                  <button
                    type="button"
                    onClick={() => setOpenFaq(isOpen ? null : faq.id)}
                    className="w-full text-left flex items-center justify-between gap-6 group"
                    aria-expanded={isOpen}
                  >
                    <div className="flex items-center gap-5">
                      <span className="font-mono text-xs text-amber-400 font-bold">
                        0{index + 1}
                      </span>
                      <span className="font-serif text-lg sm:text-xl text-stone-200 group-hover:text-amber-400 transition-colors">
                        {faq.question}
                      </span>
                    </div>

                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-white/10 group-hover:border-amber-400">
                      <ChevronDown
                        className={[
                          "h-4 w-4 text-stone-400 transition-transform duration-300",
                          isOpen ? "rotate-180 text-amber-400" : "",
                        ].join(" ")}
                      />
                    </div>
                  </button>

                  <AnimatePresence initial={false}>
                    {isOpen && (
                      <motion.div
                        initial={reduceMotion ? false : { height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={reduceMotion ? undefined : { height: 0, opacity: 0 }}
                        transition={{ duration: 0.25 }}
                      >
                        <p className="mt-4 pl-8 text-sm sm:text-base leading-relaxed text-stone-400 max-w-2xl">
                          {faq.answer}
                        </p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ====================================================================
          12. SINGLE LOCATION ARCHITECTURE (Strictly 1 branch)
      ==================================================================== */}
      <section
        id="manzil"
        className="scroll-mt-20 border-b border-white/[0.08] bg-[#0a0d13] py-28 sm:py-36"
      >
        <div className="mx-auto max-w-[1440px] px-6 sm:px-8 lg:px-12">
          <div className="grid lg:grid-cols-12 gap-12 items-start">
            <div className="lg:col-span-6">
              <span className="font-mono text-[10px] font-bold uppercase tracking-[0.25em] text-amber-400">
                08 / YAGONA ASOSIY BINOMIZ
              </span>
              <h2 className="mt-4 font-serif text-[clamp(2.5rem,5vw,5rem)] leading-tight text-stone-100">
                Bizning Manzil
              </h2>

              <p className="mt-6 text-base text-stone-300 leading-relaxed max-w-lg">
                RENESSANS O'quv Markazi Yangiobod tumani markazidagi yagona asosiy
                binoda faoliyat ko'rsatadi. Barcha mutaxassislar va o'quv xonalari shu yerda.
              </p>

              <div className="mt-10 space-y-6">
                <div className="flex items-start gap-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-400/10 text-amber-400 border border-amber-400/20 shrink-0">
                    <MapPin className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="text-[10px] font-mono uppercase tracking-widest text-amber-400 font-bold">
                      MANZIL:
                    </div>
                    <p className="text-sm font-medium text-stone-200 mt-0.5">
                      Yangiobod tumani, 1-sonli umumiy o'rta ta'lim maktabi binosi
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-400/10 text-amber-400 border border-amber-400/20 shrink-0">
                    <Clock3 className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="text-[10px] font-mono uppercase tracking-widest text-amber-400 font-bold">
                      ISH VAQTI:
                    </div>
                    <p className="text-sm font-medium text-stone-200 mt-0.5">
                      Dushanba – Shanba: 08:00 – 19:00
                      <br />
                      Yakshanba: Diagnostik va DTM andozasidagi testlar kuni
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-400/10 text-amber-400 border border-amber-400/20 shrink-0">
                    <Send className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="text-[10px] font-mono uppercase tracking-widest text-amber-400 font-bold">
                      TELEGRAM:
                    </div>
                    <a
                      href="https://t.me/D_Furqatovich"
                      target="_blank"
                      rel="noreferrer"
                      className="text-sm font-medium text-stone-200 hover:text-amber-400 transition-colors mt-0.5 inline-block"
                    >
                      @D_Furqatovich
                    </a>
                  </div>
                </div>
              </div>
            </div>

            <div className="lg:col-span-6 rounded-3xl border border-white/[0.1] bg-[#0c1017] p-8 sm:p-12">
              <span className="font-mono text-xs uppercase tracking-widest text-stone-400">
                To'g'ridan-to'g'ri aloqa
              </span>
              <h3 className="font-serif text-3xl text-stone-100 mt-2">
                Telefon Raqamlarimiz
              </h3>
              <p className="text-xs text-stone-400 mt-2 leading-relaxed">
                Savollaringiz bo'lsa yoki bepul sinov darsiga yozilmoqchi bo'lsangiz,
                quyidagi raqamlarga qo'ng'iroq qiling:
              </p>

              <div className="mt-8 space-y-4">
                <a
                  href="tel:+998886484949"
                  className="flex items-center justify-between p-5 rounded-2xl border border-white/[0.08] bg-white/[0.02] hover:border-amber-400/40 hover:bg-white/[0.04] transition-all group"
                >
                  <div className="flex items-center gap-3.5">
                    <Phone className="h-4 w-4 text-amber-400" />
                    <span className="font-mono text-base sm:text-lg font-bold text-stone-100">
                      +998 (88) 648-49-49
                    </span>
                  </div>
                  <ArrowRight className="h-4 w-4 text-stone-500 group-hover:text-amber-400 transition-colors" />
                </a>

                <a
                  href="tel:+998992593232"
                  className="flex items-center justify-between p-5 rounded-2xl border border-white/[0.08] bg-white/[0.02] hover:border-amber-400/40 hover:bg-white/[0.04] transition-all group"
                >
                  <div className="flex items-center gap-3.5">
                    <Phone className="h-4 w-4 text-amber-400" />
                    <span className="font-mono text-base sm:text-lg font-bold text-stone-100">
                      +998 (99) 259-32-32
                    </span>
                  </div>
                  <ArrowRight className="h-4 w-4 text-stone-500 group-hover:text-amber-400 transition-colors" />
                </a>
              </div>

              <div className="mt-8 pt-6 border-t border-white/[0.08] text-xs font-mono text-stone-400 flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                Qabul davom etmoqda — Bepul sinov darsi mavjud
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ====================================================================
          13. PRIMARY TRIAL LESSON & CONVERSION FORM
      ==================================================================== */}
      <section
        id="konsultatsiya"
        className="scroll-mt-20 bg-[#07090d] py-28 sm:py-36 relative"
      >
        <div className="mx-auto max-w-[1440px] px-6 sm:px-8 lg:px-12">
          <div className="rounded-[36px] border border-amber-400/30 bg-[#0b0f17] p-8 sm:p-14 lg:p-20 relative overflow-hidden">
            <div
              aria-hidden="true"
              className="pointer-events-none absolute right-0 top-0 h-[500px] w-[500px] rounded-full bg-amber-400/[0.07] blur-[160px]"
            />

            <div className="grid lg:grid-cols-12 gap-12 items-center relative">
              <div className="lg:col-span-6">
                <span className="font-mono text-[10px] font-bold uppercase tracking-[0.25em] text-amber-400">
                  09 / RO‘YXATDAN O‘TISH
                </span>

                <h2 className="mt-4 font-serif text-[clamp(2.4rem,4.5vw,4.4rem)] leading-[0.95] tracking-tight text-stone-100">
                  Bepul Sinov Darsiga
                  <br />
                  <span className="italic text-amber-400">Hoziroq Yoziling</span>
                </h2>

                <p className="mt-6 text-sm sm:text-base text-stone-300 leading-relaxed max-w-lg">
                  Ismingiz va telefon raqamingizni qoldiring. Administratorimiz siz bilan
                  bog‘lanib, diagnostik test va sinov darsi vaqtini belgilaydi.
                </p>

                <div className="mt-10 space-y-4">
                  {[
                    "Boshlang'ich bilim darajasini bepul diagnostika qilish",
                    "Mos yo'nalish va ustozlar guruhi bilan tanishish",
                    "Individual o'quv rejasini tasdiqlash",
                  ].map((item, idx) => (
                    <div key={idx} className="flex items-center gap-3 text-xs sm:text-sm text-stone-300">
                      <div className="flex h-6 w-6 items-center justify-center rounded-full bg-amber-400/10 text-amber-400 border border-amber-400/30 shrink-0">
                        <Check className="h-3.5 w-3.5" />
                      </div>
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Form Container */}
              <div className="lg:col-span-6 rounded-3xl border border-white/[0.1] bg-[#07090d] p-6 sm:p-10">
                {isSubmitted ? (
                  <div className="text-center py-12">
                    <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-400/10 text-emerald-400 border border-emerald-400/30">
                      <CheckCircle2 className="h-8 w-8" />
                    </div>
                    <h3 className="mt-6 font-serif text-3xl text-stone-100">
                      Arizangiz Qabul Qilindi!
                    </h3>
                    <p className="mt-3 text-xs font-mono text-stone-400 max-w-sm mx-auto">
                      Mutaxassislarimiz tez orada siz bilan bog'lanib, bepul sinov darsi
                      vaqtini tasdiqlashadi.
                    </p>
                  </div>
                ) : (
                  <form onSubmit={handleFormSubmit} className="space-y-5">
                    <div>
                      <label
                        htmlFor="ren-name"
                        className="block text-[10px] font-mono font-bold uppercase tracking-widest text-stone-400 mb-2"
                      >
                        F.I.SH (Ismingiz)
                      </label>
                      <input
                        id="ren-name"
                        type="text"
                        required
                        value={formName}
                        onChange={(e) => setFormName(e.target.value)}
                        placeholder="Ismingiz va familiyangiz"
                        className="w-full min-h-12 rounded-xl border border-white/[0.1] bg-white/[0.03] px-4 text-sm text-stone-100 placeholder:text-stone-600 outline-none focus:border-amber-400/60 transition-colors"
                      />
                    </div>

                    <div>
                      <label
                        htmlFor="ren-phone"
                        className="block text-[10px] font-mono font-bold uppercase tracking-widest text-stone-400 mb-2"
                      >
                        Telefon Raqamingiz
                      </label>
                      <input
                        id="ren-phone"
                        type="tel"
                        required
                        value={formPhone}
                        onChange={(e) => setFormPhone(e.target.value)}
                        placeholder="+998 (88) 648-49-49"
                        className="w-full min-h-12 rounded-xl border border-white/[0.1] bg-white/[0.03] px-4 text-sm text-stone-100 placeholder:text-stone-600 outline-none focus:border-amber-400/60 transition-colors"
                      />
                    </div>

                    <div>
                      <label
                        htmlFor="ren-subject"
                        className="block text-[10px] font-mono font-bold uppercase tracking-widest text-stone-400 mb-2"
                      >
                        Qiziqtirgan Yo'nalish
                      </label>
                      <select
                        id="ren-subject"
                        value={formSubject}
                        onChange={(e) => setFormSubject(e.target.value)}
                        className="w-full min-h-12 rounded-xl border border-white/[0.1] bg-[#0c1017] px-4 text-sm text-stone-100 outline-none focus:border-amber-400/60 transition-colors"
                      >
                        <option value="">Yo‘nalishni tanlang</option>
                        <option value="Tarix • Huquq • Geografiya">Tarix • Huquq • Geografiya (DTM)</option>
                        <option value="Matematika & Prezident Maktabi">Matematika & Prezident Maktabi</option>
                        <option value="CEFR Ingliz Tili (B2 / C1)">CEFR Ingliz Tili (B2 / C1)</option>
                        <option value="General & Kids English">General & Kids English (3–10 yosh)</option>
                        <option value="Mental Arifmetika">Mental Arifmetika & Tez Hisob</option>
                        <option value="Ona Tili va Adabiyot">Ona Tili va Adabiyot (Milliy Sertifikat)</option>
                      </select>
                    </div>

                    {submitError && (
                      <div className="rounded-xl border border-red-500/20 bg-red-500/[0.05] p-3 text-xs text-red-300">
                        {submitError}
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full min-h-12 rounded-xl bg-amber-400 px-6 text-[11px] font-bold uppercase tracking-[0.14em] text-black transition-all hover:bg-amber-300 disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {isSubmitting ? "Yuborilmoqda..." : "Bepul Sinov Darsiga Yozilish"}
                      <ArrowRight className="h-4 w-4" />
                    </button>

                    <p className="text-center font-mono text-[9px] text-stone-500">
                      Ma'lumotlaringiz maxfiy saqlanadi. Uchinchi shaxslarga berilmaydi.
                    </p>
                  </form>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ====================================================================
          14. EDITORIAL FOOTER
      ==================================================================== */}
      <footer className="border-t border-white/[0.08] bg-[#05070a] py-16">
        <div className="mx-auto max-w-[1440px] px-6 sm:px-8 lg:px-12">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8 border-b border-white/[0.08] pb-12">
            <div>
              <div className="font-serif text-2xl font-bold tracking-[0.18em] text-stone-100">
                RENESSANS O‘QUV MARKAZI
              </div>
              <p className="mt-2 text-xs font-mono text-stone-400">
                Yangiobod tumani, 1-sonli maktab binosi • Tel: +998 (88) 648-49-49
              </p>
            </div>

            <div className="flex flex-wrap gap-8 text-[11px] font-mono uppercase tracking-[0.16em] text-stone-400">
              {navItems.map(([id, label]) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => scrollTo(id)}
                  className="hover:text-amber-400 transition-colors"
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-10 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-mono text-stone-500">
            <div>
              © {new Date().getFullYear()} RENESSANS O‘quv Markazi. Barcha huquqlar himoyalangan.
            </div>
            <div>MAQSAD • TIZIM • NATIJA</div>
          </div>
        </div>
      </footer>
    </main>
  );
}

/* ============================================================================
   STICKY SCROLL NARRATIVE SUBCOMPONENT (BOSQICHMA-BOSQICH TIZIM 01—05)
============================================================================ */

interface MethodologyProps {
  stages: typeof METHOD_STAGES;
}

const MethodologyScrollNarrative: React.FC<MethodologyProps> = ({ stages }) => {
  const reduceMotion = useReducedMotion();
  const containerRef = useRef<HTMLElement | null>(null);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"],
  });

  const smoothProgress = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    mass: 0.25,
  });

  const progressWidth = useTransform(smoothProgress, [0, 1], ["0%", "100%"]);
  const [activeStage, setActiveStage] = useState(0);

  useMotionValueEvent(scrollYProgress, "change", (latest) => {
    const normalized = Math.min(0.999999, Math.max(0, latest));
    const nextIndex = Math.min(
      stages.length - 1,
      Math.floor(normalized * stages.length)
    );
    setActiveStage((prev) => (prev === nextIndex ? prev : nextIndex));
  });

  const current = stages[activeStage] ?? stages[0];

  return (
    <section
      id="metodika"
      ref={containerRef}
      className="relative h-[450vh] bg-[#07090d]"
    >
      <div className="sticky top-0 flex h-[100svh] items-center overflow-hidden border-b border-white/[0.08]">
        {/* Subtle Ambient light */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 opacity-20"
          style={{
            background: "radial-gradient(circle at 70% 45%, rgba(245,158,11,.15), transparent 40%)",
          }}
        />

        {/* Scroll Progress Line */}
        <div className="pointer-events-none absolute left-0 right-0 top-0 h-px bg-white/[0.08]">
          <motion.div className="h-full bg-amber-400" style={{ width: progressWidth }} />
        </div>

        <div className="relative mx-auto w-full max-w-[1440px] px-6 sm:px-8 lg:px-12">
          {/* Section Header */}
          <div className="mb-8 sm:mb-12 flex items-end justify-between gap-6">
            <div>
              <span className="font-mono text-[10px] font-bold uppercase tracking-[0.25em] text-amber-400">
                METODIKA & TIZIM
              </span>
              <h2 className="mt-3 font-serif text-[clamp(2.2rem,4.5vw,4.5rem)] leading-none text-stone-100">
                Bosqichma-Bosqich Tizim
              </h2>
            </div>

            <div className="hidden text-right sm:block">
              <span className="font-mono text-[10px] uppercase tracking-widest text-stone-500">
                FAOL BOSQICH
              </span>
              <div className="mt-1 font-serif text-3xl font-bold text-amber-400">
                {current.step} <span className="text-stone-600 text-xl font-normal">/ 05</span>
              </div>
            </div>
          </div>

          <div className="grid lg:grid-cols-12 gap-8 items-stretch">
            {/* Left Column: Interactive Stages Timeline Indicator */}
            <div className="hidden lg:col-span-4 lg:flex flex-col justify-between border-r border-white/[0.08] pr-8">
              <div className="space-y-3">
                {stages.map((st, idx) => {
                  const isActive = activeStage === idx;
                  return (
                    <div
                      key={st.step}
                      className={[
                        "p-4 rounded-2xl border transition-all duration-500 flex items-center gap-4",
                        isActive
                          ? "border-amber-400/30 bg-white/[0.04]"
                          : "border-transparent text-stone-500",
                      ].join(" ")}
                    >
                      <span
                        className={[
                          "font-mono text-xs font-bold",
                          isActive ? "text-amber-400" : "text-stone-600",
                        ].join(" ")}
                      >
                        {st.step}
                      </span>
                      <span
                        className={[
                          "text-sm font-medium",
                          isActive ? "text-stone-100" : "text-stone-500",
                        ].join(" ")}
                      >
                        {st.title}
                      </span>
                    </div>
                  );
                })}
              </div>

              <div className="pt-6 font-mono text-[10px] text-stone-500 leading-relaxed">
                Tizim bo‘ylab pastga harakatlaning. Bosqichlar tabiiy scroll orqali
                faollashadi.
              </div>
            </div>

            {/* Right Column: Active Stage Content Details */}
            <div className="lg:col-span-8">
              <div className="relative min-h-[420px] rounded-3xl border border-white/[0.1] bg-[#0b0e14] p-8 sm:p-14 flex flex-col justify-between">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={current.step}
                    initial={reduceMotion ? false : { opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={reduceMotion ? undefined : { opacity: 0, y: -15 }}
                    transition={{ duration: 0.3 }}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-amber-400">
                        {current.badge}
                      </span>
                      <span className="font-serif text-5xl font-bold text-stone-700">
                        {current.step}
                      </span>
                    </div>

                    <div className="mt-6">
                      <span className="text-xs font-mono uppercase tracking-widest text-stone-400">
                        {current.subtitle}
                      </span>
                      <h3 className="mt-2 font-serif text-[clamp(2rem,3.8vw,3.8rem)] leading-none text-stone-100">
                        {current.title}
                      </h3>
                      <p className="mt-6 text-sm sm:text-base leading-relaxed text-stone-300 max-w-2xl">
                        {current.description}
                      </p>
                    </div>

                    <div className="mt-10 pt-6 border-t border-white/[0.08] flex items-center justify-between text-xs font-mono text-stone-400">
                      <span>Metodika Progress:</span>
                      <span className="text-amber-400 font-bold">
                        {Math.round(((activeStage + 1) / stages.length) * 100)}%
                      </span>
                    </div>
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};