import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  AnimatePresence,
  motion,
  MotionValue,
  useInView,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
} from "framer-motion";
import {
  ArrowRight,
  ArrowUpRight,
  Award,
  BookOpen,
  Check,
  CheckCircle2,
  ChevronDown,
  Clock3,
  Compass,
  GraduationCap,
  Layers3,
  MapPin,
  Menu,
  Phone,
  Send,
  ShieldCheck,
  Sparkles,
  Zap,
  X,
} from "lucide-react";
import {
  coursesService,
  teachersService,
  resultsService,
  landingCmsService,
  leadsService,
} from "../services/repository";
import { notificationService } from "../services/notificationService";

/* ============================================================================
   TYPES & CONTRACTS (STRICTLY PRESERVED)
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
  badge?: string;
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
  initials?: string;
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
   CANONICAL DATA
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
      "Yurisprudensiya (TDYU), Diplomatiya (JIDU) va Davlat Huquq Akademiyasiga kiruvchilar uchun kompleks tayyorlov. 2025–2026 o'quv yilida OTM qamrovi 100% natija.",
    isFeatured: true,
    highlights: [
      "Diplomatiya va Huquqshunoslikka maqsadli tayyorlov",
      "Tarix va Geografiya Milliy Sertifikat A+ dasturi",
      "Xaritalar va yuridik normativ hujjatlar tahlili",
      "Haftalik DTM andozasidagi real nazorat testlari",
    ],
    schedule: "Haftada 3 kun • 2 soatdan",
    teacherName: "Dr. Sanjar Karimov",
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
      "Prezident maktablarining 1- va 2-bosqich saralash imtihonlari hamda Milliy Sertifikat A+ talablariga to'liq moslashtirilgan chuqurlashtirilgan mantiqiy dastur.",
    highlights: [
      "Mantiqiy, fazoviy va nostandart masalalar",
      "Milliy Sertifikat A+ masalalar banki",
      "Prezident maktablari test simulyatsiyalari",
      "Tezkor yechish algoritmlari va olimpiada bazasi",
    ],
    schedule: "Haftada 3 kun • 2 soatdan",
    teacherName: "Dr. Rustam Zokirov",
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
    teacherName: "Feruza Rahimova",
    price: "350,000 UZS / oy",
  },
  {
    id: "c-general-kids-english",
    slug: "general-kids-english",
    title: "Kids English (3–10 yosh) & General",
    category: "Bolalar & Maktab Dasturi",
    duration: "Davomiy",
    level: "Beginner → Elementary",
    description:
      "Bolaning katta orzulari biz bilan boshlanadi! Interaktiv o'yinlar, vizual qo'llanmalar va Prezident maktabiga tayyorgarlikning ilk poydevori.",
    highlights: [
      "Qiziqarli o‘yinlar, audio-vizual mashqlar",
      "Erkin inglizcha muloqot va boy so'z zaxirasi",
      "Prezident maktabi boshlang'ich talablari",
      "Bolalar psixologiyasiga mos zamonaviy muhit",
    ],
    schedule: "Haftada 3 kun • 1.5 soatdan",
    teacherName: "Javohir Rustamov",
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
    teacherName: "Nilufar Mansurova",
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
    teacherName: "Azizaxon Olimova",
    price: "320,000 UZS / oy",
  },
];

const DEFAULT_TEACHERS: TeacherRecord[] = [
  {
    id: "t-sanjar",
    slug: "dr-sanjar-karimov",
    name: "Dr. Sanjar Karimov",
    subject: "Head IELTS Examiner & Lead Curriculum Developer",
    experienceYears: "8+ yil",
    photo: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=800&q=80",
    bio: "Xalqaro toifali metodist va yetakchi kurator. OTM va xalqaro universitetlarga tayyorlash bo'yicha bosh ekspert. 2025–2026 o'quv yilida 100% OTM qamrovi natijasini qayd etgan.",
    achievements: [
      "187.9 eng yuqori DTM balli sohibi ustozi",
      "2 nafar 100% Davlat granti talabasi ustozi",
      "OTM qamrovi bo'yicha 100% natija (2025)",
      "Milliy Sertifikat A+ bitiruvchilari",
    ],
    resultsCount: 34,
    initials: "SK",
  },
  {
    id: "t-rustam",
    slug: "dr-rustam-zokirov",
    name: "Dr. Rustam Zokirov",
    subject: "Digital SAT Lead & STEM Specialist",
    experienceYears: "7+ yil",
    photo: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=800&q=80",
    bio: "Matematika, mantiq va fazoviy tafakkur bo'yicha olimpiada murabbiyi. Prezident maktablari saralash imtihonlari hamda Milliy Sertifikat A+ dasturlari yetakchisi.",
    achievements: [
      "Prezident maktabiga qabul qilingan o'quvchilar",
      "Matematika Milliy Sertifikat A+ natijalar",
      "DTM majburiy va asosiy blokda maksimal ballar",
    ],
    resultsCount: 29,
    initials: "RZ",
  },
  {
    id: "t-feruza",
    slug: "feruza-rahimova",
    name: "Feruza Rahimova",
    subject: "Senior Academic Director & Language Specialist",
    experienceYears: "6+ yil",
    photo: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=800&q=80",
    bio: "CEFR va xalqaro til sertifikatlari bo'yicha yetakchi ekspert. Speaking, debate va akademik til ko'nikmalarini tizimli shakllantiruvchi metodist.",
    achievements: [
      "CEFR C1 va B2 xalqaro sertifikat sohiblari",
      "Akademik speaking va debate klubi asoschisi",
      "Nufuzli xorijiy va mahalliy OTM talabalari",
    ],
    resultsCount: 25,
    initials: "FR",
  },
  {
    id: "t-javohir",
    slug: "javohir-rustamov",
    name: "Javohir Rustamov",
    subject: "Kids & General English (Cambridge YLE)",
    experienceYears: "5+ yil",
    photo: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=800&q=80",
    bio: "Cambridge CELTA sertifikati sohibi. 3–10 yoshli bolalarni erta yoshdan ravon inglizcha muloqotga o'rgatish va Prezident maktabiga tayyorlash metodisti.",
    achievements: [
      "Prezident maktabi boshlang'ich saralash g'oliblari",
      "Cambridge YLE xalqaro dastur sertifikatlari",
      "Erta yoshdagi bolalar uchun interaktiv o'yin metodikasi",
    ],
    resultsCount: 23,
    initials: "JR",
  },
  {
    id: "t-nilufar",
    slug: "nilufar-mansurova",
    name: "Nilufar Mansurova",
    subject: "Head of Student Admissions & Assessment",
    experienceYears: "8+ yil",
    photo: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=800&q=80",
    bio: "O'quvchilar salohiyatini diagnostika qilish, mantiqiy tafakkur, tezkor hisoblash hamda bolalar kognitiv rivojlanishi bo'yicha tajribali mutaxassis.",
    achievements: [
      "Tezkor abakus hisoblash bo'yicha turnir sovrindorlari",
      "Diqqat va xotirani 3 baravarga oshirish dasturi",
      "Prezident maktabi mantiqiy savollar tayyorlovi",
    ],
    resultsCount: 31,
    initials: "NM",
  },
  {
    id: "t-azizaxon",
    slug: "azizaxon-olimova",
    name: "Azizaxon Olimova",
    subject: "Lead Academic Advisor & Essay Grader",
    experienceYears: "6+ yil",
    photo: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=800&q=80",
    bio: "Ona tili, adabiyot va matn tahlili bo'yicha yetakchi filolog. Milliy Sertifikat A+ va DTM imtihonlariga akademik tayyorlov dasturi muallifi.",
    achievements: [
      "Ona tili Milliy Sertifikat A+ darajalar",
      "DTM majburiy va asosiy blok maksimal ballari",
      "Matn tahlili va imlo bo'yicha mualliflik dasturi",
    ],
    resultsCount: 27,
    initials: "AO",
  },
];

const DEFAULT_RESULTS: StudentResult[] = [
  {
    id: "res-1",
    name: "Madina Sultonova",
    score: "187.9",
    examType: "DTM",
    university: "O‘zDJTU — Davlat Granti (Eng yuqori ball)",
    photo: "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=600&q=80",
    badge: "100% Davlat Granti",
    year: "2025",
  },
  {
    id: "res-2",
    name: "Shahzod Tursunov",
    score: "184.5",
    examType: "DTM",
    university: "Toshkent Davlat Yuridik Universiteti (TDYU) — 100% Grant",
    photo: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=600&q=80",
    badge: "100% Davlat Granti",
    year: "2025",
  },
  {
    id: "res-3",
    name: "Bekzod Qodirov",
    score: "CEFR C1",
    examType: "CEFR",
    university: "Westminster Xalqaro Universiteti (WIUT)",
    photo: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=600&q=80",
    badge: "Xalqaro Imtiyoz",
    year: "2025",
  },
  {
    id: "res-4",
    name: "Nigora Erkinova",
    score: "Tarix A+",
    examType: "Milliy Sertifikat",
    university: "O‘zbekiston Milliy Universiteti (O‘zMU)",
    photo: "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=600&q=80",
    badge: "Maksimal Ball",
    year: "2025",
  },
  {
    id: "res-5",
    name: "Sardor Yo‘ldoshev",
    score: "176.4",
    examType: "DTM",
    university: "TATU (Axborot Xavfsizligi)",
    photo: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=600&q=80",
    badge: "Davlat Granti",
    year: "2025",
  },
  {
    id: "res-6",
    name: "Jasur Mamadaliyev",
    score: "Matematika A",
    examType: "Milliy Sertifikat",
    university: "Prezident Maktabi & OTM Saralash",
    photo: "https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?auto=format&fit=crop&w=600&q=80",
    badge: "Imtiyozli Qabul",
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
    visualType: "radar",
    percent: 20,
  },
  {
    step: "02",
    title: "Aniq maqsad va target",
    subtitle: "Maqsadni o‘lchanadigan rejaga aylantirish",
    description:
      "OTM yo‘nalishi, grant bali yoki sertifikat formati hisobga olinib, o‘quvchi bilan birgalikda aniq maqsadli target va dars rejasi tuziladi.",
    badge: "TARGET REJA",
    visualType: "target",
    percent: 40,
  },
  {
    step: "03",
    title: "Tizimli darslar",
    subtitle: "Tushunish → Amaliyot → Mustahkamlash",
    description:
      "Nazariya amaliy masalalar bilan birga olib boriladi. Murakkab mavzular bosqichma-bosqich yechiladi va o‘quvchi bilimni amalda qo‘llash ko'nikmasiga ega bo'ladi.",
    badge: "METODOLOGIYA",
    visualType: "system",
    percent: 60,
  },
  {
    step: "04",
    title: "Nazorat va monitoring",
    subtitle: "O‘sishni ko‘rish va xatolarni tahlil qilish",
    description:
      "Har haftalik yakshanba testlari o‘quvchining qayerda ekanini ko‘rsatadi. Xatolar maxsus tahlil qilinib, keyingi darslarning ustuvor vazifasiga aylanadi.",
    badge: "MONITORING",
    visualType: "analytics",
    percent: 80,
  },
  {
    step: "05",
    title: "Imtihonga tayyorgarlik",
    subtitle: "Bilimni real imtihon sharoitiga olib chiqish",
    description:
      "Yakuniy bosqichda vaqtni boshqarish, psixologik tayyorgarlik va imtihon strategiyasi mustahkamlanadi. Bilimdan Natijaga yetiladi.",
    badge: "YAKUNIY BOSQICH",
    visualType: "award",
    percent: 100,
  },
] as const;

const PRESIDENT_STAGES = [
  {
    step: "01",
    title: "Diagnostika & Salohiyat",
    desc: "O'quvchining mantiqiy va akademik bazasi sinovdan o'tkazilib, shaxsiy o'sish xaritasi tuziladi.",
    focus: "Mantiqiy tahlil & Boshlang'ich test",
    icon: Compass,
  },
  {
    step: "02",
    title: "Mantiqiy Matematika",
    desc: "Dr. Rustam Zokirov rahbarligida fazoviy, nostandart va olimpiada darajasidagi masalalar yechiladi.",
    focus: "Nostandart masalalar & Formula tahlili",
    icon: Layers3,
  },
  {
    step: "03",
    title: "Kids & General English",
    desc: "Javohir Rustamov bilan speaking, reading va Prezident maktabi imtihoniga xos leksika o'rganiladi.",
    focus: "Akademik lug'at & Matn bilan ishlash",
    icon: BookOpen,
  },
  {
    step: "04",
    title: "Mental Arifmetika",
    desc: "Nilufar Mansurova bilan soniyalarda tezkor hisoblash, fotografik xotira va zehnni yuksaltirish.",
    focus: "Abakus texnikasi & Diqqatni jamlash",
    icon: Zap,
  },
  {
    step: "05",
    title: "Mock Simulyatsiya",
    desc: "Haftalik real imtihon andozasidagi vaqt nazorati va bosqichma-bosqich psixologik tayyorgarlik.",
    focus: "Vaqt nazorati & Real test andozasi",
    icon: Clock3,
  },
  {
    step: "06",
    title: "100% Qabul & Natija",
    desc: "Prezident va ixtisoslashtirilgan nufuzli maktablarga muvaffaqiyatli qabul qilinish.",
    focus: "Prezident Maktabi O'quvchisi",
    icon: Award,
  },
];

const SUBJECT_ITEMS = [
  {
    step: "01",
    subject: "TARIX • HUQUQ • GEOGRAFIYA",
    teacher: "Dr. Sanjar Karimov",
    programs: "DTM • Diplomatiya • Yurisprudensiya • Akademiya",
    description:
      "Tarix va huquqshunoslik bo'yicha Milliy Sertifikat A+ va DTM ga chuqurlashtirilgan tayyorlov. Manbalar, xaritalar va huquqiy normalar tahlili.",
  },
  {
    step: "02",
    subject: "MATEMATIKA",
    teacher: "Dr. Rustam Zokirov",
    programs: "Milliy Sertifikat A+ • Prezident Maktabi • Olimpiada",
    description:
      "Mantiqiy fikrlash, nostandart masalalar va oliy o'quv yurtlari kirish imtihonlariga poydevor qo'yuvchi intensiv matematika.",
  },
  {
    step: "03",
    subject: "CEFR INGLIZ TILI",
    teacher: "Feruza Rahimova",
    programs: "CEFR C1 / B2 • Grammar • Speaking • Mock Test",
    description:
      "Listening, Reading, Writing va Speaking ko'nikmalarini intensiv akademik darajaga olib chiqish hamda imtihon strategiyasi.",
  },
  {
    step: "04",
    subject: "GENERAL & KIDS ENGLISH",
    teacher: "Javohir Rustamov",
    programs: "Kids English (3–10 yosh) • Prezident Maktabi Tayyorlov",
    description:
      "Qiziqarli o'yinlar, vizual qo'llanmalar va bolalar uchun erta yoshdan tabiiy va ravon inglizcha muloqot muhiti.",
  },
  {
    step: "05",
    subject: "MENTAL ARIFMETIKA",
    teacher: "Nilufar Mansurova",
    programs: "Tez hisoblash • Kuchli xotira • Fazoviy tafakkur",
    description:
      "Abakus orqali soniyalarda tezkor hisoblash va miya yarim sharlarini birdek faollashtiruvchi mantiqiy mashqlar.",
  },
  {
    step: "06",
    subject: "ONA TILI VA ADABIYOT",
    teacher: "Azizaxon Olimova",
    programs: "Milliy Sertifikat • DTM Majburiy & Asosiy Blok",
    description:
      "Imlo, matn tahlili, grammatik qoidalar va adabiyotdan asarlar tahlili bo'yicha mukammal metodik tayyorgarlik.",
  },
];

const TICKER_ITEMS = [
  "76.2% OTMGA KIRISH KO'RSATKICHI",
  "187.9 ENG YUQORI DTM BALLI",
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

const EASING_CURVE = [0.16, 1, 0.3, 1] as const;

/* ============================================================================
   WORD-BY-WORD ANIMATED HERO TITLE COMPONENT
============================================================================ */

export function HeroTitleAnimated() {
  const reduceMotion = useReducedMotion();

  const lines = [
    { text: "Farzandingizning", className: "block text-stone-100" },
    { text: "kelajagini bugundan", className: "block text-stone-100" },
    { text: "boshlang!", className: "block italic text-amber-400 drop-shadow-[0_0_35px_rgba(245,158,11,0.25)]" },
  ];

  if (reduceMotion) {
    return (
      <h1 className="font-serif text-[clamp(3.3rem,7.2vw,7.6rem)] font-medium leading-[0.93] tracking-[-0.03em]">
        <span className="block text-stone-100">Farzandingizning</span>
        <span className="block text-stone-100">kelajagini bugundan</span>
        <span className="block italic text-amber-400">boshlang!</span>
      </h1>
    );
  }

  const containerVariants = {
    hidden: {},
    visible: {
      transition: {
        staggerChildren: 0.12,
        delayChildren: 0.1,
      },
    },
  };

  const wordVariants = {
    hidden: {
      opacity: 0,
      y: 28,
      filter: "blur(12px)",
      scale: 0.96,
    },
    visible: {
      opacity: 1,
      y: 0,
      filter: "blur(0px)",
      scale: 1,
      transition: {
        duration: 0.75,
        ease: EASING_CURVE,
      },
    },
  };

  return (
    <motion.h1
      className="font-serif text-[clamp(3.3rem,7.2vw,7.6rem)] font-medium leading-[0.93] tracking-[-0.03em]"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {lines.map((line, lIdx) => (
        <span key={lIdx} className={`${line.className} block overflow-hidden py-1`}>
          {line.text.split(" ").map((word, wIdx) => (
            <motion.span
              key={`${word}-${wIdx}`}
              variants={wordVariants}
              className="inline-block mr-[0.24em] last:mr-0 transform-gpu"
            >
              {word}
            </motion.span>
          ))}
        </span>
      ))}
    </motion.h1>
  );
}

/* ============================================================================
   WORD BY WORD FADE ANIMATION COMPONENT FOR PARAGRAPHS
============================================================================ */

export function WordFadeText({
  text,
  className = "",
  delay = 0.2,
  stagger = 0.035,
}: {
  text: string;
  className?: string;
  delay?: number;
  stagger?: number;
}) {
  const reduceMotion = useReducedMotion();
  const words = useMemo(() => text.split(" "), [text]);

  if (reduceMotion) {
    return <span className={className}>{text}</span>;
  }

  const containerVariants = {
    hidden: {},
    visible: {
      transition: {
        staggerChildren: stagger,
        delayChildren: delay,
      },
    },
  };

  const wordVariants = {
    hidden: {
      opacity: 0,
      y: 8,
      filter: "blur(4px)",
    },
    visible: {
      opacity: 1,
      y: 0,
      filter: "blur(0px)",
      transition: {
        duration: 0.45,
        ease: EASING_CURVE,
      },
    },
  };

  return (
    <motion.span
      className={`inline-block ${className}`}
      variants={containerVariants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-40px" }}
    >
      {words.map((word, idx) => (
        <motion.span
          key={`${word}-${idx}`}
          variants={wordVariants}
          className="inline-block mr-[0.28em] last:mr-0"
        >
          {word}
        </motion.span>
      ))}
    </motion.span>
  );
}

/* ============================================================================
   HOISTED REUSABLE UI PRIMITIVES
============================================================================ */

export function BackgroundGridMesh() {
  return (
    <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden select-none">
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]" />
      <div className="absolute left-1/2 top-0 h-[480px] w-[800px] -translate-x-1/2 bg-amber-500/[0.08] blur-[140px] rounded-full" />
      <div className="absolute right-0 top-1/3 h-[400px] w-[400px] bg-emerald-500/[0.04] blur-[130px] rounded-full" />
    </div>
  );
}

export function TeacherAvatar({
  src,
  alt,
  initials,
  className = "w-full h-[320px]",
}: {
  src?: string | null;
  alt: string;
  initials: string;
  className?: string;
}) {
  const [hasError, setHasError] = useState(false);

  if (hasError || !src) {
    return (
      <div
        className={`w-full bg-gradient-to-br from-[#121824] via-[#0d121a] to-[#07090d] flex flex-col items-center justify-center p-6 text-center relative overflow-hidden group ${className}`}
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(245,158,11,0.08)_0%,transparent_70%)]" />
        <div className="w-20 h-20 rounded-full bg-amber-400/10 border border-amber-400/30 flex items-center justify-center text-2xl font-serif font-bold text-amber-400 mb-3 shadow-[0_0_20px_rgba(245,158,11,0.15)] group-hover:scale-110 transition-transform duration-300">
          {initials}
        </div>
        <span className="text-sm font-serif font-bold text-stone-200">{alt}</span>
        <span className="text-[11px] font-mono text-amber-400/80 mt-1">
          O'qituvchi / Mutaxassis
        </span>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      onError={() => setHasError(true)}
      className={`${className} object-cover object-center group-hover:scale-105 transition-transform duration-500`}
      loading="lazy"
    />
  );
}

export function HeroLogoBadge({ logoSrc }: { logoSrc?: string }) {
  return (
    <div className="mb-6 inline-flex items-center gap-4 p-2.5 pr-5 rounded-2xl bg-[#0c1017]/80 border border-amber-400/25 backdrop-blur-md shadow-[0_0_25px_rgba(245,158,11,0.08)] hover:border-amber-400/40 transition-all duration-300">
      <div className="relative flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 p-[1px]">
        <div className="w-full h-full bg-[#090d14] rounded-[11px] flex items-center justify-center relative overflow-hidden">
          {logoSrc ? (
            <img src={logoSrc} alt="Renessans Logo" className="w-8 h-8 object-contain" />
          ) : (
            <>
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(245,158,11,0.25)_0%,transparent_70%)]" />
              <span className="font-serif text-xl font-black text-amber-400 tracking-tighter">
                R
              </span>
            </>
          )}
        </div>
      </div>
      <div>
        <div className="flex items-center gap-2">
          <span className="font-serif text-sm font-bold tracking-wider text-stone-100">
            RENESSANS
          </span>
          <span className="flex h-2 w-2 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
        </div>
        <p className="font-mono text-[10px] text-stone-400 tracking-tight uppercase mt-0.5">
          O'quv Markazi • Yangiobod
        </p>
      </div>
    </div>
  );
}

function SpotlightCard({
  children,
  className = "",
  glowColor = "rgba(245,158,11,0.15)",
  borderGradient = "from-amber-400/35 via-white/10 to-transparent",
}: {
  children: React.ReactNode;
  className?: string;
  glowColor?: string;
  borderGradient?: string;
}) {
  const divRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [opacity, setOpacity] = useState(0);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!divRef.current) return;
    const rect = divRef.current.getBoundingClientRect();
    setPosition({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  };

  return (
    <div
      ref={divRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setOpacity(1)}
      onMouseLeave={() => setOpacity(0)}
      className={`relative rounded-3xl p-[1px] bg-gradient-to-b ${borderGradient} transition-shadow duration-500 hover:shadow-[0_20px_50px_rgba(245,158,11,0.1)] ${className}`}
    >
      <div
        className="pointer-events-none absolute -inset-px rounded-3xl opacity-0 transition-opacity duration-300"
        style={{
          opacity,
          background: `radial-gradient(600px circle at ${position.x}px ${position.y}px, ${glowColor}, transparent 40%)`,
        }}
      />
      <div className="relative h-full w-full rounded-[calc(1.5rem-1px)] bg-[#0c1017]/90 backdrop-blur-3xl overflow-hidden">
        {children}
      </div>
    </div>
  );
}

function TypedSubhead() {
  const [stringIndex, setStringIndex] = useState(0);
  const [charIndex, setCharIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const currentString = HERO_TYPED_STRINGS[stringIndex];
    const speed = isDeleting ? 28 : 60;

    if (!isDeleting && charIndex === currentString.length) {
      const timeout = setTimeout(() => setIsDeleting(true), 2400);
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
}

function CounterNumber({
  value,
  suffix = "",
  decimals = 0,
}: {
  value: number;
  suffix?: string;
  decimals?: number;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-40px" });
  const [displayValue, setDisplayValue] = useState("0");
  const [isComplete, setIsComplete] = useState(false);

  useEffect(() => {
    if (!isInView) return;
    let startTimestamp: number | null = null;
    const duration = 1600;

    const step = (timestamp: number) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      const easeProgress = 1 - Math.pow(1 - progress, 4);
      const current = easeProgress * value;

      setDisplayValue(current.toFixed(decimals));

      if (progress < 1) {
        window.requestAnimationFrame(step);
      } else {
        setDisplayValue(value.toFixed(decimals));
        setIsComplete(true);
      }
    };

    window.requestAnimationFrame(step);
  }, [isInView, value, decimals]);

  return (
    <span
      ref={ref}
      className={[
        "font-serif font-bold transition-all duration-700 inline-block",
        isComplete ? "drop-shadow-[0_0_15px_rgba(245,158,11,0.4)] text-stone-50" : "",
      ].join(" ")}
    >
      {displayValue}
      {suffix}
    </span>
  );
}

function SectionHeader({
  eyebrow,
  title,
  subtitle,
  align = "center",
}: {
  eyebrow: string;
  title: string | React.ReactNode;
  subtitle?: string;
  align?: "center" | "left";
}) {
  const reduceMotion = useReducedMotion();

  return (
    <motion.div
      initial={reduceMotion ? { opacity: 1 } : { opacity: 0, y: 35, filter: "blur(6px)" }}
      whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.75, ease: EASING_CURVE }}
      className={`relative ${align === "center" ? "text-center mx-auto" : "text-left"}`}
    >
      <div className="inline-flex items-center gap-2 rounded-full border border-amber-400/25 bg-amber-400/[0.05] px-4 py-1 text-[10px] font-mono font-bold uppercase tracking-[0.25em] text-amber-400 backdrop-blur-md">
        <Sparkles className="h-3 w-3 text-amber-400" />
        {eyebrow}
      </div>
      <h2 className="mt-4 font-serif text-[clamp(2.4rem,4.5vw,4.5rem)] text-stone-100 leading-tight tracking-tight">
        {title}
      </h2>
      {subtitle && (
        <p className="mt-3 text-sm sm:text-base font-serif italic text-stone-400 max-w-2xl mx-auto leading-relaxed">
          <WordFadeText text={`"${subtitle}"`} delay={0.2} stagger={0.03} />
        </p>
      )}
    </motion.div>
  );
}

function SeamlessMarqueeTicker() {
  const reduceMotion = useReducedMotion();

  return (
    <section className="w-full overflow-hidden select-none relative bg-[#0a0d13]/80 backdrop-blur-2xl border-y border-white/[0.08] py-4">
      <div className="flex w-max overflow-x-hidden">
        <motion.div
          className="flex shrink-0 items-center justify-around gap-10 whitespace-nowrap will-change-transform transform-gpu"
          animate={reduceMotion ? {} : { x: ["0%", "-100%"] }}
          transition={{ ease: "linear", duration: 28, repeat: Infinity }}
        >
          {TICKER_ITEMS.map((item, idx) => (
            <div
              key={`t1-${idx}`}
              className="flex items-center gap-10 text-xs font-mono font-bold tracking-[0.22em] text-stone-300 hover:text-amber-400 transition-colors"
            >
              <span>{item}</span>
              <span className="text-amber-400 text-sm shadow-[0_0_8px_#f59e0b]">✦</span>
            </div>
          ))}
        </motion.div>
        <motion.div
          className="flex shrink-0 items-center justify-around gap-10 whitespace-nowrap will-change-transform transform-gpu"
          animate={reduceMotion ? {} : { x: ["0%", "-100%"] }}
          transition={{ ease: "linear", duration: 28, repeat: Infinity }}
        >
          {TICKER_ITEMS.map((item, idx) => (
            <div
              key={`t2-${idx}`}
              className="flex items-center gap-10 text-xs font-mono font-bold tracking-[0.22em] text-stone-300 hover:text-amber-400 transition-colors"
            >
              <span>{item}</span>
              <span className="text-amber-400 text-sm shadow-[0_0_8px_#f59e0b]">✦</span>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

/* ============================================================================
   STICKY SEQUENTIAL SCROLL-FOCUS METODIKA ENGINE
============================================================================ */

function StickyMetodikaSection({ stages }: { stages: typeof METHOD_STAGES }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"],
  });

  return (
    <section ref={containerRef} id="metodika" className="relative h-[400vh] bg-[#070a0f]">
      <div className="sticky top-0 h-screen flex flex-col justify-center overflow-hidden px-6 sm:px-8 lg:px-12">
        <div className="mx-auto max-w-[1400px] w-full">
          <div className="mb-8 flex items-end justify-between border-b border-white/[0.08] pb-6">
            <SectionHeader
              eyebrow="02 / METODIKA & BOSQICHLAR"
              title="Bosqichma-Bosqich Tizim"
              subtitle="Har bir o'quvchi diagnostikadan boshlab yakuniy 100% natijagacha yagona zanjirda harakat qiladi."
              align="left"
            />
            <div className="hidden sm:flex items-center gap-2 font-mono text-xs text-amber-400 font-bold uppercase tracking-widest">
              <span>SKROLL BILAN BOSQICHMA-BOSQICH</span>
              <span className="text-stone-600">•</span>
              <span className="text-stone-400">01 — 05</span>
            </div>
          </div>

          <div className="grid lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-6 relative h-[360px] sm:h-[340px] w-full">
              {stages.map((stage, index) => {
                const stepStart = index / stages.length;
                const stepEnd = (index + 1) / stages.length;

                const opacity = useTransform(
                  scrollYProgress,
                  index === 0
                    ? [0, stepEnd - 0.06, stepEnd]
                    : index === stages.length - 1
                    ? [stepStart - 0.06, stepStart, 1]
                    : [stepStart - 0.06, stepStart, stepEnd - 0.06, stepEnd],
                  index === 0 ? [1, 1, 0] : index === stages.length - 1 ? [0, 1, 1] : [0, 1, 1, 0]
                );

                const y = useTransform(
                  scrollYProgress,
                  index === 0
                    ? [0, stepEnd - 0.06, stepEnd]
                    : index === stages.length - 1
                    ? [stepStart - 0.06, stepStart, 1]
                    : [stepStart - 0.06, stepStart, stepEnd - 0.06, stepEnd],
                  index === 0 ? [0, 0, -35] : index === stages.length - 1 ? [35, 0, 0] : [35, 0, 0, -35]
                );

                const scale = useTransform(
                  scrollYProgress,
                  index === 0
                    ? [0, stepEnd - 0.06, stepEnd]
                    : index === stages.length - 1
                    ? [stepStart - 0.06, stepStart, 1]
                    : [stepStart - 0.06, stepStart, stepEnd - 0.06, stepEnd],
                  index === 0 ? [1, 1, 0.95] : index === stages.length - 1 ? [0.95, 1, 1] : [0.95, 1, 1, 0.95]
                );

                const filter = useTransform(
                  scrollYProgress,
                  index === 0
                    ? [0, stepEnd - 0.06, stepEnd]
                    : index === stages.length - 1
                    ? [stepStart - 0.06, stepStart, 1]
                    : [stepStart - 0.06, stepStart, stepEnd - 0.06, stepEnd],
                  index === 0
                    ? ["blur(0px)", "blur(0px)", "blur(4px)"]
                    : index === stages.length - 1
                    ? ["blur(4px)", "blur(0px)", "blur(0px)"]
                    : ["blur(4px)", "blur(0px)", "blur(0px)", "blur(4px)"]
                );

                return (
                  <motion.div
                    key={stage.step}
                    style={{ opacity, y, scale, filter }}
                    className="absolute inset-0 p-8 rounded-3xl border border-amber-400/35 bg-[#0c1017]/95 backdrop-blur-3xl shadow-2xl flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-mono font-bold text-amber-400 tracking-wider">
                          BOSQICH 0{index + 1} // {stage.badge}
                        </span>
                        <span className="text-xs font-mono text-stone-500 font-semibold">
                          {stage.percent}% TAYYORGARLIK
                        </span>
                      </div>
                      <h3 className="text-2xl sm:text-3xl font-serif font-bold text-white mt-3">
                        {stage.title}
                      </h3>
                      <p className="text-amber-400/90 font-mono text-xs uppercase mt-1">
                        {stage.subtitle}
                      </p>
                      <p className="text-stone-300 text-sm sm:text-base mt-3 leading-relaxed">
                        {stage.description}
                      </p>
                    </div>

                    <div className="pt-4 border-t border-white/[0.08] flex items-center justify-between text-xs font-mono text-stone-400">
                      <span>Metodika zanjiri:</span>
                      <span className="text-amber-400 font-bold">RENESSANS STANDARTI</span>
                    </div>
                  </motion.div>
                );
              })}
            </div>

            <div className="lg:col-span-6 flex justify-center">
              <div className="w-full h-[360px] sm:h-[340px] rounded-3xl border border-amber-400/30 bg-[#0c1017]/95 backdrop-blur-3xl p-8 flex items-center justify-center relative shadow-2xl overflow-hidden">
                {stages.map((stage, index) => {
                  const stepStart = index / stages.length;
                  const stepEnd = (index + 1) / stages.length;

                  const visOpacity = useTransform(
                    scrollYProgress,
                    index === 0
                      ? [0, stepEnd - 0.06, stepEnd]
                      : index === stages.length - 1
                      ? [stepStart - 0.06, stepStart, 1]
                      : [stepStart - 0.06, stepStart, stepEnd - 0.06, stepEnd],
                    index === 0 ? [1, 1, 0] : index === stages.length - 1 ? [0, 1, 1] : [0, 1, 1, 0]
                  );

                  return (
                    <motion.div
                      key={stage.step}
                      style={{ opacity: visOpacity }}
                      className="absolute inset-0 flex items-center justify-center p-8 pointer-events-none"
                    >
                      {stage.visualType === "radar" && (
                        <svg viewBox="0 0 200 200" className="w-56 h-56 text-amber-400">
                          <circle cx="100" cy="100" r="80" fill="none" stroke="currentColor" strokeWidth="1" strokeDasharray="4 4" className="opacity-30 animate-spin" style={{ animationDuration: "35s" }} />
                          <circle cx="100" cy="100" r="55" fill="none" stroke="currentColor" strokeWidth="1" className="opacity-50" />
                          <circle cx="100" cy="100" r="30" fill="none" stroke="currentColor" strokeWidth="1.5" className="opacity-80" />
                          <circle cx="100" cy="100" r="6" fill="currentColor" className="opacity-90" />
                          <line x1="15" y1="100" x2="185" y2="100" stroke="currentColor" strokeWidth="0.8" strokeDasharray="3 3" className="opacity-40" />
                          <line x1="100" y1="15" x2="100" y2="185" stroke="currentColor" strokeWidth="0.8" strokeDasharray="3 3" className="opacity-40" />
                          <path d="M 100 100 L 180 100 A 80 80 0 0 0 100 20 Z" fill="rgba(245, 158, 11, 0.35)" />
                        </svg>
                      )}
                      {stage.visualType === "target" && (
                        <svg viewBox="0 0 200 200" className="w-56 h-56 text-amber-400">
                          <circle cx="100" cy="100" r="76" fill="none" stroke="currentColor" strokeWidth="1.2" strokeDasharray="6 4" className="opacity-40" />
                          <circle cx="100" cy="100" r="48" fill="none" stroke="currentColor" strokeWidth="1.8" className="opacity-75" />
                          <circle cx="100" cy="100" r="22" fill="currentColor" fillOpacity="0.15" stroke="currentColor" strokeWidth="1.5" />
                          <circle cx="100" cy="100" r="4" fill="#f59e0b" />
                          <path d="M 60 40 L 40 40 L 40 60" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
                          <path d="M 140 40 L 160 40 L 160 60" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
                          <path d="M 40 140 L 40 160 L 60 160" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
                          <path d="M 160 140 L 160 160 L 140 160" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
                          <text x="100" y="104" textAnchor="middle" fill="#f59e0b" fontSize="10" fontFamily="monospace" fontWeight="bold">LOCK A+</text>
                        </svg>
                      )}
                      {stage.visualType === "system" && (
                        <svg viewBox="0 0 200 200" className="w-56 h-56 text-emerald-400">
                          <path d="M 60 52 L 140 52 L 140 102 M 140 102 L 60 102 L 60 152 M 60 152 L 140 152" fill="none" stroke="#f59e0b" strokeWidth="2.5" />
                          <rect x="25" y="32" width="70" height="36" rx="8" fill="#090d14" stroke="#10b981" strokeWidth="1.5" />
                          <text x="60" y="55" textAnchor="middle" fill="#10b981" fontSize="9" fontFamily="monospace" fontWeight="bold">01 NAZARIYA</text>
                          <rect x="105" y="82" width="72" height="36" rx="8" fill="#090d14" stroke="#f59e0b" strokeWidth="1.5" />
                          <text x="141" y="105" textAnchor="middle" fill="#f59e0b" fontSize="9" fontFamily="monospace" fontWeight="bold">02 AMALIYOT</text>
                          <rect x="25" y="132" width="80" height="36" rx="8" fill="#090d14" stroke="#10b981" strokeWidth="1.5" />
                          <text x="65" y="155" textAnchor="middle" fill="#10b981" fontSize="9" fontFamily="monospace" fontWeight="bold">03 MUSTAHKAM</text>
                        </svg>
                      )}
                      {stage.visualType === "analytics" && (
                        <svg viewBox="0 0 200 200" className="w-56 h-56 text-amber-400">
                          <line x1="25" y1="165" x2="180" y2="165" stroke="rgba(255,255,255,0.15)" strokeWidth="1" />
                          <rect x="35" y="115" width="20" height="50" rx="4" fill="rgba(245,158,11,0.25)" />
                          <rect x="68" y="90" width="20" height="75" rx="4" fill="rgba(245,158,11,0.45)" />
                          <rect x="101" y="65" width="20" height="100" rx="4" fill="rgba(245,158,11,0.7)" />
                          <rect x="134" y="35" width="20" height="130" rx="4" fill="#f59e0b" />
                          <path d="M 45 110 Q 90 75, 144 32" fill="none" stroke="#10b981" strokeWidth="2.5" />
                          <circle cx="144" cy="32" r="5" fill="#10b981" />
                          <text x="144" y="20" textAnchor="middle" fill="#10b981" fontSize="8" fontFamily="monospace" fontWeight="bold">+42.5%</text>
                        </svg>
                      )}
                      {stage.visualType === "award" && (
                        <svg viewBox="0 0 200 200" className="w-56 h-56 text-emerald-400">
                          <circle cx="100" cy="100" r="70" fill="none" stroke="rgba(16,185,129,0.3)" strokeWidth="1.5" strokeDasharray="4 4" />
                          <polygon points="100,20 122,68 174,74 135,110 148,162 100,136 52,162 65,110 26,74 78,68" fill="rgba(16,185,129,0.15)" stroke="#10b981" strokeWidth="2" />
                          <circle cx="100" cy="98" r="32" fill="#080b10" stroke="#f59e0b" strokeWidth="2.5" />
                          <text x="100" y="103" textAnchor="middle" fill="#f59e0b" fontSize="13" fontFamily="monospace" fontWeight="bold">100%</text>
                          <text x="100" y="116" textAnchor="middle" fill="#10b981" fontSize="7" fontFamily="monospace" letterSpacing="1">GRANT</text>
                        </svg>
                      )}
                    </motion.div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ============================================================================
   MAIN COMPONENT RENDERER
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

  const [liveCourses, setLiveCourses] = useState<CoursePath[] | null>(null);
  const [liveTeachers, setLiveTeachers] = useState<TeacherRecord[] | null>(null);
  const [liveResults, setLiveResults] = useState<StudentResult[] | null>(null);
  const [liveFaqs, setLiveFaqs] = useState<FAQItem[] | null>(null);

  useEffect(() => {
    if (propsCourses && propsCourses.length > 0) return;
    let cancelled = false;
    coursesService.getPublicCourses()
      .then((docs) => {
        if (cancelled || !docs || docs.length === 0) return;
        const mapped: CoursePath[] = docs.map((c: any) => ({
          id: c.id,
          slug: c.slug || c.id,
          title: c.title,
          category: c.category || 'Umumiy',
          duration: c.duration || '',
          level: c.lessonsPerWeek || '',
          description: c.description || '',
          isFeatured: c.featured,
          highlights: c.features || [],
          teacherName: c.teacherName,
          price: c.formattedFee || (c.monthlyFee != null ? String(c.monthlyFee) : undefined),
        }));
        if (!cancelled) setLiveCourses(mapped);
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [propsCourses]);

  useEffect(() => {
    if (propsTeachers && propsTeachers.length > 0) return;
    let cancelled = false;
    teachersService.getPublicTeachers()
      .then((docs) => {
        if (cancelled || !docs || docs.length === 0) return;
        const mapped: TeacherRecord[] = docs.map((t: any) => ({
          id: t.id,
          name: t.name,
          subject: t.subject || t.specialization || '',
          experienceYears: t.experience,
          photo: t.photo,
          bio: t.description,
          achievements: t.achievements,
          resultsCount: t.studentsCount,
        }));
        if (!cancelled) setLiveTeachers(mapped);
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [propsTeachers]);

  useEffect(() => {
    if (propsResults && propsResults.length > 0) return;
    let cancelled = false;
    resultsService.getPublishedResults()
      .then((docs) => {
        if (cancelled || !docs || docs.length === 0) return;
        const mapped: StudentResult[] = docs.map((r: any) => ({
          id: r.id,
          name: r.studentName || r.name || '',
          score: r.score,
          examType: r.category || 'DTM',
          university: r.university,
          year: r.year,
          certificateUrl: r.certificateImage,
          badge: r.badge,
        }));
        if (!cancelled) setLiveResults(mapped);
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [propsResults]);

  useEffect(() => {
    if (propsFaqs && propsFaqs.length > 0) return;
    let cancelled = false;
    landingCmsService.getFaqs()
      .then((docs) => {
        if (cancelled || !docs || docs.length === 0) return;
        const mapped: FAQItem[] = docs.map((f: any) => ({
          id: f.id,
          question: f.question,
          answer: f.answer,
        }));
        if (!cancelled) setLiveFaqs(mapped);
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [propsFaqs]);

  const results = useMemo(
    () => (propsResults && propsResults.length > 0 ? propsResults : liveResults && liveResults.length > 0 ? liveResults : DEFAULT_RESULTS),
    [propsResults, liveResults]
  );
  const teachers = useMemo(
    () => (propsTeachers && propsTeachers.length > 0 ? propsTeachers : liveTeachers && liveTeachers.length > 0 ? liveTeachers : DEFAULT_TEACHERS),
    [propsTeachers, liveTeachers]
  );
  const courses = useMemo(
    () => (propsCourses && propsCourses.length > 0 ? propsCourses : liveCourses && liveCourses.length > 0 ? liveCourses : DEFAULT_COURSES),
    [propsCourses, liveCourses]
  );
  const faqs = useMemo(
    () => (propsFaqs && propsFaqs.length > 0 ? propsFaqs : liveFaqs && liveFaqs.length > 0 ? liveFaqs : DEFAULT_FAQS),
    [propsFaqs, liveFaqs]
  );

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState("top");

  const [activeResultIndex, setActiveResultIndex] = useState(0);
  const [selectedResultFilter, setSelectedResultFilter] = useState("BARCHASI");
  const [openFaq, setOpenFaq] = useState<string | null>(faqs[0]?.id ?? null);
  const [courseCategoryFilter, setCourseCategoryFilter] = useState("BARCHASI");

  const [formName, setFormName] = useState("");
  const [formPhone, setFormPhone] = useState("");
  const [formSubject, setFormSubject] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState("");

  const navBackground = useTransform(
    scrollY,
    [0, 80],
    ["rgba(7,9,13,0.65)", "rgba(7,9,13,0.92)"]
  );

  useEffect(() => {
    if (typeof window === "undefined") return;
    const sectionIds = [
      "top",
      "falsafa",
      "metodika",
      "kurslar",
      "prezident-maktabi",
      "ustozlar",
      "fanlar",
      "natijalar",
      "manzil",
      "faq",
      "konsultatsiya",
    ];

    const elements = sectionIds
      .map((id) => document.getElementById(id))
      .filter(Boolean) as HTMLElement[];

    if (!elements.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id);
          }
        });
      },
      { rootMargin: "-30% 0px -50% 0px", threshold: 0 }
    );

    elements.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  const scrollTo = (id: string) => {
    setMobileMenuOpen(false);
    if (typeof document === "undefined") return;
    const target = document.getElementById(id);
    target?.scrollIntoView({
      behavior: reduceMotion ? "auto" : "smooth",
      block: "start",
    });
    setActiveSection(id);
  };

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

  const handleFormSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isSubmitting) return;

    const name = formName.trim();
    const phone = formPhone.trim();
    const subject = formSubject.trim();

    if (!name || !phone) {
      setSubmitError("Iltimos, ismingiz va telefon raqamingizni to'liq kiriting.");
      return;
    }

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
        await leadsService.createLead({
          name,
          phone,
          course: subject || 'Bepul konsultatsiya',
          source: 'Bosh sahifa (Hero forma)',
        });
        // Server-side admin Telegram notify (best-effort, never blocks the form)
        notificationService.onTrialLessonSubmitted(name, subject || 'Bepul konsultatsiya', phone).catch(() => {});
      }
      setIsSubmitted(true);
    } catch {
      setSubmitError("Arizani yuborishda xatolik yuz berdi. Iltimos, qayta urinib ko‘ring.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredResults = useMemo(() => {
    if (selectedResultFilter === "BARCHASI") return results;
    return results.filter(
      (r) => (r.examType || "").toUpperCase() === selectedResultFilter.toUpperCase()
    );
  }, [results, selectedResultFilter]);

  const filteredCourses = useMemo(() => {
    if (courseCategoryFilter === "BARCHASI") return courses;
    return courses.filter((c) =>
      c.category.toLowerCase().includes(courseCategoryFilter.toLowerCase())
    );
  }, [courses, courseCategoryFilter]);

  const navItems = [
    ["falsafa", "Falsafa"],
    ["metodika", "Metodika"],
    ["kurslar", "Kurslar"],
    ["prezident-maktabi", "Prezident Maktabi"],
    ["ustozlar", "Ustozlar"],
    ["fanlar", "Fanlar"],
    ["natijalar", "Natijalar"],
    ["manzil", "Manzil"],
    ["faq", "Savollar"],
  ] as const;

  return (
    <main className="min-h-screen overflow-x-clip bg-[#07090d] text-stone-100 antialiased selection:bg-amber-400 selection:text-black font-sans relative">
      <BackgroundGridMesh />

      {/* ====================================================================
          1. NAVBAR
      ==================================================================== */}
      <header className="fixed inset-x-0 top-0 z-[100] px-4 sm:px-8 py-3.5 transition-all duration-300">
        <motion.div
          style={{ backgroundColor: navBackground }}
          className="mx-auto flex max-w-[1400px] items-center justify-between rounded-full border border-white/[0.08] px-5 py-2.5 backdrop-blur-2xl shadow-[0_20px_50px_rgba(0,0,0,0.85)]"
        >
          <button
            type="button"
            onClick={() => scrollTo("top")}
            className="group flex items-center gap-3 text-left focus:outline-none"
            aria-label="Renessans Asosiy Sahifa"
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-amber-400 to-amber-500 font-serif text-base font-bold text-black shadow-[0_0_20px_rgba(245,158,11,0.45)] transition-transform group-hover:scale-105">
              R
            </span>
            <div className="flex flex-col">
              <span className="font-serif text-sm font-bold tracking-[0.2em] text-stone-100 group-hover:text-amber-400 transition-colors">
                RENESSANS
              </span>
              <span className="font-mono text-[8px] uppercase tracking-widest text-stone-400">
                O‘quv Markazi • Yangiobod
              </span>
            </div>
          </button>

          <nav
            aria-label="Asosiy menyu"
            className="hidden xl:flex items-center gap-1 font-mono text-[10px] uppercase tracking-[0.15em] text-stone-400"
          >
            {navItems.map(([id, label]) => {
              const isActive = activeSection === id;
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => scrollTo(id)}
                  className="relative px-3.5 py-2 transition-colors hover:text-stone-100 min-h-[44px] flex items-center rounded-full"
                >
                  <span className="relative z-10">{label}</span>
                  {isActive && (
                    <motion.div
                      layoutId="nav-active-pill"
                      className="absolute inset-0 z-0 rounded-full bg-amber-400/[0.12] border border-amber-400/40 shadow-[0_0_15px_rgba(245,158,11,0.15)]"
                      transition={{ type: "spring", stiffness: 220, damping: 26 }}
                    />
                  )}
                </button>
              );
            })}
          </nav>

          <div className="flex items-center gap-4">
            <a
              href="tel:+998886484949"
              className="hidden sm:flex items-center gap-2 font-mono text-xs text-stone-300 hover:text-amber-400 transition-colors min-h-[44px] px-2"
            >
              <Phone className="h-3.5 w-3.5 text-amber-400" />
              <span>+998 (88) 648-49-49</span>
            </a>

            <button
              type="button"
              onClick={() => scrollTo("konsultatsiya")}
              className="group relative inline-flex items-center gap-2 overflow-hidden rounded-full bg-gradient-to-r from-amber-400 to-amber-300 px-6 py-2.5 min-h-[44px] text-[11px] font-bold uppercase tracking-[0.14em] text-black transition-all hover:shadow-[0_0_30px_rgba(245,158,11,0.45)]"
            >
              <span>Sinov Darsi</span>
              <ArrowRight className="h-3 w-3 transition-transform duration-300 group-hover:translate-x-1" />
            </button>

            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              className="flex h-11 w-11 items-center justify-center rounded-full border border-white/10 text-stone-300 xl:hidden hover:text-amber-400 transition-colors"
              aria-label="Menyu"
            >
              <Menu className="h-5 w-5" />
            </button>
          </div>
        </motion.div>
      </header>

      {/* MOBILE DRAWER */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] bg-[#07090d]/96 backdrop-blur-2xl flex flex-col justify-between p-6 sm:p-10 xl:hidden"
          >
            <div className="flex items-center justify-between border-b border-white/[0.08] pb-6">
              <div className="flex items-center gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-400 font-serif text-lg font-bold text-black">
                  R
                </span>
                <span className="font-serif text-base font-bold tracking-[0.2em] text-stone-100">
                  RENESSANS
                </span>
              </div>
              <button
                type="button"
                onClick={() => setMobileMenuOpen(false)}
                className="flex h-11 w-11 items-center justify-center rounded-full border border-white/10 text-stone-300 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="py-8 space-y-2 overflow-y-auto">
              {navItems.map(([id, label], index) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => scrollTo(id)}
                  className="flex w-full items-center justify-between py-3.5 min-h-[44px] text-left font-serif text-2xl text-stone-200 hover:text-amber-400 transition-colors border-b border-white/[0.04]"
                >
                  <span className="flex items-center gap-4">
                    <span className="font-mono text-xs text-stone-500 font-normal">
                      0{index + 1}
                    </span>
                    {label}
                  </span>
                  <ArrowRight className="h-5 w-5 text-stone-600" />
                </button>
              ))}
            </div>

            <div className="pt-6 border-t border-white/[0.08] space-y-4">
              <a
                href="tel:+998886484949"
                className="flex items-center gap-3 font-mono text-sm text-stone-300 min-h-[44px]"
              >
                <Phone className="h-4 w-4 text-amber-400" />
                +998 (88) 648-49-49
              </a>
              <button
                type="button"
                onClick={() => scrollTo("konsultatsiya")}
                className="w-full rounded-2xl bg-amber-400 py-3.5 min-h-[44px] text-xs font-bold uppercase tracking-widest text-black flex items-center justify-center gap-2"
              >
                Bepul Sinov Darsi
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ====================================================================
          2. HERO SECTION — WITH STAGGERED WORD-BY-WORD HERO TITLE ANIMATION
      ==================================================================== */}
      <section
        id="top"
        className="relative min-h-[95svh] flex flex-col justify-between border-b border-white/[0.08] pt-36 pb-16 overflow-hidden"
      >
        <div className="relative mx-auto w-full max-w-[1400px] px-6 sm:px-8 lg:px-12">
          <div className="grid gap-12 lg:grid-cols-12 lg:items-end">
            <div className="lg:col-span-7">
              <div className="mb-8 inline-flex items-center gap-2.5 rounded-full border border-amber-400/30 bg-amber-400/[0.07] px-4 py-2 text-[10px] font-bold uppercase tracking-[0.2em] text-amber-400 backdrop-blur-md">
                <Sparkles className="h-3.5 w-3.5 animate-pulse" />
                Yangioboddagi Yetakchi Ta'lim Kampusi
              </div>

              {/* ANIMATED HERO HEADING */}
              <HeroTitleAnimated />

              <div className="mt-8 flex flex-wrap items-center gap-3 text-sm sm:text-base text-stone-300">
                <span className="font-mono text-stone-500 uppercase tracking-widest text-xs">
                  Ixtisoslashuv:
                </span>
                <TypedSubhead />
              </div>
            </div>

            <div className="lg:col-span-5 lg:pb-3 flex flex-col justify-center">
              {/* BRAND EMBLEM / LOGO BADGE */}
              <HeroLogoBadge />

              {/* WORD-BY-WORD ANIMATED PARAGRAPH */}
              <div className="text-base leading-relaxed text-stone-300 sm:text-lg">
                <WordFadeText
                  text="Milliy sertifikat, DTM, CEFR va Prezident maktabiga tayyorlov. Yangiobod tumanidagi yagona 100% OTM qamrovi natijasiga ega tizimli ta'lim maskani."
                  delay={0.25}
                  stagger={0.035}
                />
              </div>

              <div className="mt-8 flex flex-col gap-3.5 sm:flex-row">
                <button
                  type="button"
                  onClick={() => scrollTo("konsultatsiya")}
                  className="group inline-flex min-h-[48px] items-center justify-center gap-3 rounded-full bg-gradient-to-r from-amber-400 to-amber-300 px-8 text-[11px] font-bold uppercase tracking-[0.14em] text-black transition-all hover:shadow-[0_16px_50px_rgba(245,158,11,0.4)]"
                >
                  Bepul Sinov Darsi
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </button>

                <button
                  type="button"
                  onClick={() => scrollTo("kurslar")}
                  className="inline-flex min-h-[48px] items-center justify-center gap-2 rounded-full border border-white/20 bg-white/[0.04] px-7 text-[11px] font-bold uppercase tracking-[0.14em] text-stone-200 transition-all hover:border-amber-400/50 hover:bg-white/[0.08]"
                >
                  Kurslarni Ko‘rish
                  <ChevronDown className="h-4 w-4 text-amber-400" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Hero Bottom Telemetry Grid */}
        <div className="relative mt-16 border-t border-white/[0.08] pt-10">
          <div className="mx-auto max-w-[1400px] px-6 sm:px-8 lg:px-12">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
              <div className="border-l border-amber-400/40 pl-5">
                <div className="text-[clamp(2.5rem,4vw,3.6rem)] font-bold text-stone-100 leading-none">
                  <CounterNumber value={76.2} decimals={1} suffix="%" />
                </div>
                <div className="mt-2 text-[10px] font-mono uppercase tracking-[0.2em] text-stone-400">
                  OTMga Kirish Ko'rsatkichi
                </div>
              </div>

              <div className="border-l border-amber-400/40 pl-5">
                <div className="text-[clamp(2.5rem,4vw,3.6rem)] font-bold text-amber-400 leading-none">
                  <CounterNumber value={187.9} decimals={1} />
                </div>
                <div className="mt-2 text-[10px] font-mono uppercase tracking-[0.2em] text-stone-400">
                  Eng Yuqori DTM Balli
                </div>
              </div>

              <div className="border-l border-amber-400/40 pl-5">
                <div className="text-[clamp(2.5rem,4vw,3.6rem)] font-serif font-bold text-stone-100 leading-none">
                  16 / 21
                </div>
                <div className="mt-2 text-[10px] font-mono uppercase tracking-[0.2em] text-stone-400">
                  Talaba Bo'lganlar
                </div>
              </div>

              <div className="border-l border-amber-400/40 pl-5">
                <div className="text-[clamp(2.5rem,4vw,3.6rem)] font-bold text-emerald-400 leading-none">
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
          3. SEAMLESS DUAL-TRACK MARQUEE TICKER
      ==================================================================== */}
      <SeamlessMarqueeTicker />

      {/* ====================================================================
          4. FALSAFA & MANIFESTO
      ==================================================================== */}
      <section
        id="falsafa"
        className="scroll-mt-20 border-b border-white/[0.08] bg-[#080b10] py-28 sm:py-36 relative"
      >
        <div className="mx-auto max-w-[1400px] px-6 sm:px-8 lg:px-12">
          <SectionHeader
            eyebrow="01 / FALSAFA & MAQSAD"
            title="Tasodif emas, Aniq Tizim"
            subtitle="Har bir o‘quvchining boshlang‘ich nuqtasi boshqa — shuning uchun tayyorgarlik shaxsiy maqsaddan boshlanadi."
            align="center"
          />

          <div className="mt-14 grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                step: "01",
                word: "TASODIFGA O'RIN YO'Q",
                desc: "Kelajak omadga tashlab qo‘yilmaydi. Natija har haftalik monitoring va individual tahlil qilingan xatolar zanjiri orqali kafolatlanadi.",
                accent: "text-stone-400",
                badge: "PRINSIP",
              },
              {
                step: "02",
                word: "ANIQ MAQSAD & TARGET",
                desc: "Har bir o'quvchining OTM yo‘nalishi, grant bali va ixtisosligi aniqlanib, shaxsiy maqsadli grafik ishlab chiqiladi.",
                accent: "text-amber-400",
                badge: "BOSHQARUV",
              },
              {
                step: "03",
                word: "TIZIMLI METODIKA",
                desc: "Nazariya amaliyot bilan bog'lanadi. Murakkab olimpiada va DTM masalalari yechish algoritmlari bosqichma-bosqich o'rgatiladi.",
                accent: "text-amber-400",
                badge: "STANDART",
              },
              {
                step: "04",
                word: "100% OTM QAMROVI",
                desc: "187.9 ballik rekord natija va eng nufuzli universitetlarga (TDYU, JIDU, WIUT) 100% grantga kirish kafolatlangan ko'rsatkichi.",
                accent: "text-emerald-400",
                badge: "NATIJA",
              },
            ].map((card, idx) => (
              <motion.div
                key={idx}
                initial={reduceMotion ? {} : { opacity: 0, y: 35, scale: 0.98 }}
                whileInView={{ opacity: 1, y: 0, scale: 1 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 0.6, delay: idx * 0.08, ease: EASING_CURVE }}
              >
                <SpotlightCard className="h-full">
                  <div className="p-8 flex flex-col justify-between h-full">
                    <div>
                      <div className="flex items-center justify-between font-mono text-xs">
                        <span className="text-stone-500">{card.step}</span>
                        <span className="text-amber-400 font-bold tracking-wider">{card.badge}</span>
                      </div>
                      <h3 className={`mt-4 font-serif text-2xl font-bold ${card.accent}`}>
                        {card.word}
                      </h3>
                      <p className="mt-3 text-sm text-stone-300 leading-relaxed">
                        {card.desc}
                      </p>
                    </div>
                    <div className="mt-8 pt-4 border-t border-white/[0.06] text-[10px] font-mono text-stone-500 uppercase tracking-widest">
                      RENESSANS AKADEMIYASI
                    </div>
                  </div>
                </SpotlightCard>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ====================================================================
          5. METODIKA — STICKY SCROLL ENGINE
      ==================================================================== */}
      <StickyMetodikaSection stages={METHOD_STAGES} />

      {/* ====================================================================
          6. KURSLAR
      ==================================================================== */}
      <section
        id="kurslar"
        className="scroll-mt-20 border-b border-white/[0.08] bg-[#080b10] py-28 sm:py-36 relative"
      >
        <div className="mx-auto max-w-[1400px] px-6 sm:px-8 lg:px-12">
          <SectionHeader
            eyebrow="03 / AKADEMIK DASTURLAR"
            title="Kurslar Katalogi"
            subtitle="Har bir yo‘nalish uchun chuqurlashtirilgan o‘quv dasturi va ixtisoslashgan pedagoglar."
            align="left"
          />

          <div className="mt-10 flex flex-wrap gap-2">
            {[
              ["BARCHASI", "Barchasi"],
              ["Ijtimoiy", "Ijtimoiy-Gumanitar"],
              ["Aniq", "Aniq Fanlar"],
              ["Til", "Xalqaro Tillar"],
              ["Bolalar", "Kids Dasturi"],
            ].map(([val, label]) => {
              const isSelected = courseCategoryFilter === val;
              return (
                <button
                  key={val}
                  type="button"
                  onClick={() => setCourseCategoryFilter(val)}
                  className={[
                    "px-5 py-2.5 rounded-full text-xs font-mono transition-all min-h-[44px] flex items-center border focus:outline-none",
                    isSelected
                      ? "bg-amber-400 text-black border-amber-400 font-bold shadow-[0_0_20px_rgba(245,158,11,0.35)]"
                      : "bg-[#0c1017] text-stone-400 border-white/[0.08] hover:border-white/20 hover:text-white",
                  ].join(" ")}
                  aria-pressed={isSelected}
                >
                  {label}
                </button>
              );
            })}
          </div>

          <div className="mt-10 grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCourses.map((course, idx) => (
              <motion.div
                key={course.id}
                initial={reduceMotion ? {} : { opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 0.5, delay: idx * 0.08, ease: EASING_CURVE }}
              >
                <SpotlightCard className="h-full">
                  <div className="p-8 flex flex-col justify-between h-full">
                    <div>
                      <div className="flex items-center justify-between text-xs font-mono mb-3">
                        <span className="text-amber-400 font-bold uppercase tracking-wider text-[11px]">
                          {course.category}
                        </span>
                        <span className="text-stone-400 font-mono">{course.duration}</span>
                      </div>

                      <h3 className="font-serif text-2xl text-stone-100 font-bold group-hover:text-amber-300 transition-colors">
                        {course.title}
                      </h3>

                      <p className="mt-3 text-sm text-stone-300 leading-relaxed line-clamp-3">
                        {course.description}
                      </p>

                      <div className="mt-6 space-y-2">
                        {course.highlights.map((h, i) => (
                          <div key={i} className="flex items-start gap-2.5 text-xs text-stone-300">
                            <Check className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
                            <span>{h}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="mt-8 pt-6 border-t border-white/[0.08]">
                      <div className="flex items-baseline justify-between mb-5">
                        <div>
                          <div className="text-[10px] font-mono text-stone-400 uppercase">
                            Oylik to'lov
                          </div>
                          <div className="font-serif text-2xl font-bold text-amber-400">
                            {course.price}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-[10px] font-mono text-stone-400 uppercase">
                            Ustoz
                          </div>
                          <div className="text-xs font-mono text-stone-200 font-semibold">
                            {course.teacherName}
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => handleNavigateToCourse(course.slug)}
                          className="rounded-xl border border-white/15 py-2.5 min-h-[44px] text-xs font-mono text-stone-300 hover:text-white hover:border-white/30 transition-all text-center flex items-center justify-center"
                        >
                          Batafsil
                        </button>
                        <button
                          type="button"
                          onClick={() => scrollTo("konsultatsiya")}
                          className="rounded-xl bg-gradient-to-r from-amber-400 to-amber-300 py-2.5 min-h-[44px] text-xs font-bold uppercase tracking-wider text-black hover:shadow-[0_0_25px_rgba(245,158,11,0.4)] transition-all text-center flex items-center justify-center gap-1.5"
                        >
                          Yozilish
                          <ArrowRight className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                </SpotlightCard>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ====================================================================
          7. PREZIDENT MAKTABIGA TAYYORLOV
      ==================================================================== */}
      <section
        id="prezident-maktabi"
        className="scroll-mt-20 border-b border-white/[0.08] bg-[#090d14] py-28 sm:py-36 relative"
      >
        <div className="mx-auto max-w-[1400px] px-6 sm:px-8 lg:px-12">
          <SectionHeader
            eyebrow="04 / MAXSUS TAYYORLOV YO'LI"
            title="Prezident Maktabiga Tayyorlov"
            subtitle="1- va 2-bosqich saralash imtihonlariga intellektual va psixologik tayyorgarlik zanjiri."
            align="center"
          />

          <div className="mt-14 grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {PRESIDENT_STAGES.map((stage, idx) => {
              const Icon = stage.icon;
              return (
                <motion.div
                  key={stage.step}
                  initial={reduceMotion ? {} : { opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-60px" }}
                  transition={{ duration: 0.5, delay: idx * 0.08, ease: EASING_CURVE }}
                >
                  <SpotlightCard className="h-full">
                    <div className="p-8 flex flex-col justify-between h-full">
                      <div>
                        <div className="flex items-center justify-between mb-4">
                          <span className="font-mono text-xs font-bold text-amber-400">
                            {stage.step} // CHECKPOINT
                          </span>
                          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-400/10 text-amber-400 border border-amber-400/25 shadow-[0_0_15px_rgba(245,158,11,0.2)]">
                            <Icon className="h-5 w-5" />
                          </div>
                        </div>
                        <h3 className="font-serif text-2xl text-stone-100 font-bold">
                          {stage.title}
                        </h3>
                        <p className="mt-3 text-sm text-stone-300 leading-relaxed">
                          {stage.desc}
                        </p>
                      </div>

                      <div className="mt-6 pt-4 border-t border-white/[0.08]">
                        <div className="text-[10px] font-mono uppercase text-stone-500 mb-1">
                          Asosiy ko'nikma:
                        </div>
                        <div className="text-sm font-serif font-bold text-amber-400">
                          {stage.focus}
                        </div>
                      </div>
                    </div>
                  </SpotlightCard>
                </motion.div>
              );
            })}
          </div>

          <div className="mt-12 text-center">
            <button
              type="button"
              onClick={() => scrollTo("konsultatsiya")}
              className="inline-flex min-h-[48px] items-center gap-2 rounded-full bg-gradient-to-r from-amber-400 to-amber-300 px-8 text-xs font-bold uppercase tracking-widest text-black hover:shadow-[0_0_30px_rgba(245,158,11,0.4)] transition-all"
            >
              Prezident Maktabi Guruhiga Yozilish
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </section>

      {/* ====================================================================
          8. TIZIM USTOZLARI
      ==================================================================== */}
      <section
        id="ustozlar"
        className="scroll-mt-20 border-b border-white/[0.08] bg-[#07090d] py-28 sm:py-36 relative"
      >
        <div className="mx-auto max-w-[1400px] px-6 sm:px-8 lg:px-12">
          <SectionHeader
            eyebrow="05 / PEDAGOGIK JAMOASI"
            title="Tizim Ustozlari"
            subtitle="O'z yo'nalishi bo'yicha yillik tajribaga va 100% OTM natijalariga ega yuqori malakali pedagoglar."
            align="left"
          />

          <div className="mt-12 grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {teachers.map((t, idx) => (
              <motion.div
                key={t.id}
                initial={reduceMotion ? {} : { opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 0.5, delay: idx * 0.08, ease: EASING_CURVE }}
              >
                <SpotlightCard className="h-full">
                  <div className="p-8 flex flex-col justify-between h-full">
                    <div>
                      <div className="relative mb-6 overflow-hidden rounded-2xl border border-white/10 ring-2 ring-amber-400/20 aspect-[4/3] bg-stone-900 group">
                        <TeacherAvatar
                          src={t.photo}
                          alt={t.name}
                          initials={t.initials || t.name.split(" ").map((n) => n[0]).join("")}
                          className="w-full h-full"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent pointer-events-none" />
                        
                        <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between pointer-events-none">
                          <span className="rounded-full bg-black/60 px-3 py-1 font-mono text-[10px] font-bold text-amber-400 backdrop-blur-md border border-amber-400/30">
                            {t.experienceYears} Tajriba
                          </span>
                          <span className="rounded-full bg-emerald-500/20 px-2.5 py-1 font-mono text-[9px] font-bold text-emerald-300 backdrop-blur-md border border-emerald-500/30">
                            Verified
                          </span>
                        </div>
                      </div>

                      <span className="text-[10px] font-mono text-amber-400 uppercase font-bold tracking-wider">
                        {t.subject}
                      </span>
                      <h3 className="mt-1 font-serif text-2xl font-bold text-stone-100 group-hover:text-amber-300 transition-colors">
                        {t.name}
                      </h3>

                      <p className="mt-3 text-sm text-stone-300 leading-relaxed line-clamp-3">
                        {t.bio}
                      </p>

                      {t.achievements && (
                        <div className="mt-5 space-y-2">
                          {t.achievements.slice(0, 3).map((ach, i) => (
                            <div key={i} className="flex items-start gap-2.5 text-xs text-stone-300">
                              <Check className="h-3.5 w-3.5 text-amber-400 shrink-0 mt-0.5" />
                              <span className="line-clamp-1">{ach}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="mt-8 pt-4 border-t border-white/[0.08] flex items-center justify-between">
                      <span className="font-mono text-xs text-stone-400">
                        {t.resultsCount ? `${t.resultsCount}+ o'quvchi natijasi` : "Yetakchi mutaxassis"}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleNavigateToTeacher(t.slug || t.id)}
                        className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-amber-400 hover:text-amber-300 min-h-[44px]"
                      >
                        Profilni ko'rish
                        <ArrowRight className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                </SpotlightCard>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ====================================================================
          9. FANLAR
      ==================================================================== */}
      <section
        id="fanlar"
        className="scroll-mt-20 border-b border-white/[0.08] bg-[#080b10] py-28 sm:py-36 relative"
      >
        <div className="mx-auto max-w-[1400px] px-6 sm:px-8 lg:px-12">
          <SectionHeader
            eyebrow="06 / AKADEMIK RO'YXAT"
            title="Fanlar & Yo‘nalishlar"
            subtitle="Har bir fanning imtihon qamrovi, metodikasi va mas'ul o'qituvchisi."
            align="left"
          />

          <div className="mt-12 grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {SUBJECT_ITEMS.map((item, idx) => (
              <motion.div
                key={item.step}
                initial={reduceMotion ? {} : { opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 0.5, delay: idx * 0.08, ease: EASING_CURVE }}
              >
                <SpotlightCard className="h-full">
                  <div className="p-8 flex flex-col justify-between h-full">
                    <div>
                      <div className="text-[10px] font-mono text-amber-400 font-bold uppercase tracking-widest mb-2">
                        DOSSIER // REF-{item.step}
                      </div>
                      <h3 className="font-serif text-2xl text-stone-100 font-bold">
                        {item.subject}
                      </h3>
                      <p className="mt-3 text-sm text-stone-300 leading-relaxed">
                        {item.description}
                      </p>

                      <div className="mt-6 p-4 rounded-2xl border border-white/[0.08] bg-white/[0.02]">
                        <div className="text-[10px] font-mono uppercase tracking-widest text-stone-500 mb-1">
                          Imtihon targetlari:
                        </div>
                        <div className="font-mono text-xs text-amber-400 font-semibold">
                          {item.programs}
                        </div>
                      </div>
                    </div>

                    <div className="mt-8 pt-4 border-t border-white/[0.08] flex items-center justify-between">
                      <div>
                        <div className="text-[10px] font-mono text-stone-400 uppercase">
                          Mas'ul pedagog
                        </div>
                        <div className="text-xs font-serif font-bold text-stone-200">
                          {item.teacher}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => scrollTo("konsultatsiya")}
                        className="inline-flex items-center gap-1.5 rounded-full bg-amber-400 px-4 py-2 text-[10px] font-bold uppercase tracking-wider text-black hover:bg-amber-300 min-h-[44px]"
                      >
                        Yozilish
                        <ArrowRight className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                </SpotlightCard>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ====================================================================
          10. REAL NATIJALAR
      ==================================================================== */}
      <section
        id="natijalar"
        className="scroll-mt-20 border-b border-white/[0.08] bg-[#07090d] py-28 sm:py-36 relative"
      >
        <div className="mx-auto max-w-[1400px] px-6 sm:px-8 lg:px-12">
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 border-b border-white/[0.08] pb-10">
            <SectionHeader
              eyebrow="07 / REAL NATIJALAR"
              title="Bitiruvchilar Natijalari"
              subtitle="Natija — tizimli tayyorgarlikning eng aniq dalili."
              align="left"
            />

            <div className="flex flex-wrap gap-2">
              {["BARCHASI", "DTM", "CEFR", "MILLIY SERTIFIKAT"].map((filter) => {
                const isActive = selectedResultFilter === filter;
                return (
                  <button
                    key={filter}
                    type="button"
                    onClick={() => setSelectedResultFilter(filter)}
                    className={[
                      "px-5 py-2.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-widest transition-all min-h-[44px] flex items-center border focus:outline-none",
                      isActive
                        ? "bg-amber-400 text-black border-amber-400 shadow-[0_0_20px_rgba(245,158,11,0.35)]"
                        : "bg-[#0d1118] text-stone-400 border-white/10 hover:text-stone-200",
                    ].join(" ")}
                    aria-pressed={isActive}
                  >
                    {filter}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="mt-12 grid lg:grid-cols-12 gap-8 items-start">
            <div className="lg:col-span-8 divide-y divide-white/[0.06] rounded-3xl border border-white/[0.08] bg-[#0c1017]/90 backdrop-blur-2xl p-4 sm:p-6 shadow-2xl">
              {filteredResults.map((res, index) => {
                const isSelected = activeResultIndex === index;
                return (
                  <div
                    key={res.id}
                    onClick={() => setActiveResultIndex(index)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        setActiveResultIndex(index);
                      }
                    }}
                    role="button"
                    tabIndex={0}
                    className={[
                      "py-5 px-4 sm:px-6 flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all rounded-2xl cursor-pointer focus:outline-none",
                      isSelected
                        ? "bg-white/[0.06] border border-amber-400/40 shadow-[0_0_25px_rgba(245,158,11,0.15)]"
                        : "hover:bg-white/[0.02] border border-transparent",
                    ].join(" ")}
                  >
                    <div className="flex items-center gap-5">
                      {res.photo ? (
                        <img
                          src={res.photo}
                          alt={res.name}
                          className="h-12 w-12 rounded-full object-cover ring-2 ring-amber-400/30 shrink-0"
                        />
                      ) : (
                        <span className="font-mono text-xs font-bold text-amber-400">
                          0{index + 1}
                        </span>
                      )}
                      <div>
                        <div className="flex items-center gap-3">
                          <h4 className="font-serif text-xl sm:text-2xl text-stone-100 font-semibold">
                            {res.name}
                          </h4>
                          {res.badge && (
                            <span className="rounded-full bg-emerald-400/10 border border-emerald-400/20 px-2.5 py-0.5 text-[9px] font-mono font-bold text-emerald-400 uppercase">
                              {res.badge}
                            </span>
                          )}
                        </div>
                        {res.university && (
                          <p className="text-xs text-stone-400 mt-1 flex items-center gap-2 font-mono">
                            <GraduationCap className="h-3.5 w-3.5 text-amber-400 shrink-0" />
                            {res.university}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="text-left md:text-right pl-10 md:pl-0">
                      <div className="font-serif text-3xl font-bold text-amber-400 leading-none">
                        {res.score}
                      </div>
                      <span className="block text-[9px] font-mono uppercase tracking-widest text-stone-500 mt-1">
                        {res.examType} // {res.year || "2025"}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="lg:col-span-4 sticky top-28">
              {filteredResults[activeResultIndex] && (
                <SpotlightCard borderGradient="from-amber-400/60 via-white/15 to-transparent">
                  <div className="p-8 relative">
                    <div className="flex items-center justify-between border-b border-white/[0.08] pb-4">
                      <span className="font-mono text-[10px] font-bold text-amber-400 uppercase tracking-widest">
                        TASDIQLANGAN NATIJA
                      </span>
                      <span className="font-mono text-[10px] text-stone-400 uppercase tracking-widest">
                        {filteredResults[activeResultIndex].examType}
                      </span>
                    </div>

                    <div className="mt-8 text-center">
                      {filteredResults[activeResultIndex].photo && (
                        <div className="mx-auto mb-4 h-20 w-20 overflow-hidden rounded-full ring-2 ring-amber-400/40 shadow-[0_0_20px_rgba(245,158,11,0.25)]">
                          <img
                            src={filteredResults[activeResultIndex].photo!}
                            alt=""
                            className="h-full w-full object-cover"
                          />
                        </div>
                      )}
                      <div className="font-mono text-xs uppercase tracking-widest text-stone-400">
                        Qayd etilgan ball
                      </div>
                      <div className="mt-2 font-serif text-5xl font-bold text-amber-400 leading-none">
                        {filteredResults[activeResultIndex].score}
                      </div>
                      <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-400/10 border border-emerald-400/20 text-emerald-400 text-[10px] font-mono font-bold uppercase">
                        <ShieldCheck className="h-3.5 w-3.5" />
                        {filteredResults[activeResultIndex].badge || "100% Rasmiy"}
                      </div>
                    </div>

                    <div className="mt-8 space-y-4 pt-6 border-t border-white/[0.08]">
                      <div>
                        <span className="text-[10px] font-mono uppercase text-stone-500">
                          O'quvchi:
                        </span>
                        <div className="font-serif text-xl font-bold text-stone-100 mt-0.5">
                          {filteredResults[activeResultIndex].name}
                        </div>
                      </div>

                      <div>
                        <span className="text-[10px] font-mono uppercase text-stone-500">
                          Tavsiya etilgan OTM:
                        </span>
                        <div className="text-xs font-mono text-stone-300 mt-1 leading-relaxed">
                          {filteredResults[activeResultIndex].university}
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-2 text-[10px] font-mono text-stone-500">
                        <span>Mavsum: {filteredResults[activeResultIndex].year || "2025"}</span>
                        <span className="text-amber-400 font-bold">RENESSANS TIZIMI</span>
                      </div>
                    </div>
                  </div>
                </SpotlightCard>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ====================================================================
          11. FAQ SECTION
      ==================================================================== */}
      <section
        id="faq"
        className="scroll-mt-20 border-b border-white/[0.08] bg-[#07090d] py-28 sm:py-36 relative"
      >
        <div className="mx-auto max-w-[1000px] px-6 sm:px-8">
          <SectionHeader
            eyebrow="08 / SAVOLLAR"
            title="Ko‘p So‘raladigan Savollar"
            subtitle="Aniq savollarga — ochiq va professional javoblar."
            align="center"
          />

          <div className="mt-14 divide-y divide-white/[0.08] border-y border-white/[0.08]">
            {faqs.map((faq, index) => {
              const isOpen = openFaq === faq.id;

              return (
                <div key={faq.id} className="py-6 transition-colors duration-200">
                  <button
                    type="button"
                    onClick={() => setOpenFaq(isOpen ? null : faq.id)}
                    className="w-full text-left flex items-center justify-between gap-6 group min-h-[44px] focus:outline-none rounded-xl px-2"
                  >
                    <div className="flex items-center gap-5 sm:gap-6">
                      <span className="font-mono text-xs sm:text-sm font-bold text-amber-400">
                        0{index + 1}
                      </span>
                      <span className="font-serif text-lg sm:text-2xl text-stone-200 group-hover:text-amber-300 transition-colors">
                        {faq.question}
                      </span>
                    </div>
                    <div
                      className={[
                        "flex h-9 w-9 shrink-0 items-center justify-center rounded-full border transition-transform duration-300",
                        isOpen
                          ? "border-amber-400 bg-amber-400 text-black rotate-180"
                          : "border-white/10 text-stone-400 group-hover:border-amber-400/50",
                      ].join(" ")}
                    >
                      <ChevronDown className="h-4 w-4" />
                    </div>
                  </button>

                  <AnimatePresence initial={false}>
                    {isOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3, ease: EASING_CURVE }}
                        className="overflow-hidden"
                      >
                        <p className="mt-4 pl-10 sm:pl-12 text-sm sm:text-base leading-relaxed text-stone-300 max-w-3xl">
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
          12. MANZIL & BEPUL KONSULTATSIYA
      ==================================================================== */}
      <section
        id="manzil"
        className="scroll-mt-20 border-b border-white/[0.08] bg-[#0a0d13] py-28 sm:py-36 relative"
      >
        <div className="mx-auto max-w-[1400px] px-6 sm:px-8 lg:px-12">
          <div className="grid lg:grid-cols-12 gap-12 items-center">
            <div className="lg:col-span-6">
              <SectionHeader
                eyebrow="09 / YAGONA RASMIY BINOMIZ"
                title={
                  <>
                    YANGIOBOD <br />
                    <span className="italic text-amber-400">1-MAKTAB</span>
                  </>
                }
                align="left"
              />

              <p className="mt-6 text-base text-stone-300 leading-relaxed max-w-lg">
                RENESSANS O'quv Markazi Yangiobod tumani markazidagi yagona rasmiy
                binoda — 1-sonli umumiy o'rta ta'lim maktabi binosida faoliyat ko'rsatadi.
              </p>

              <div className="mt-10 space-y-6">
                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-400/10 text-amber-400 border border-amber-400/20 shrink-0">
                    <MapPin className="h-6 w-6" />
                  </div>
                  <div>
                    <div className="text-[10px] font-mono uppercase tracking-widest text-amber-400 font-bold">
                      ASOSIY MANZIL:
                    </div>
                    <p className="text-base font-medium text-stone-200 mt-1">
                      Yangiobod tumani, 1-sonli umumiy o'rta ta'lim maktabi binosi
                    </p>
                    <span className="text-xs font-mono text-stone-500">
                      Yagona rasmiy o'quv kampusi
                    </span>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-400/10 text-amber-400 border border-amber-400/20 shrink-0">
                    <Clock3 className="h-6 w-6" />
                  </div>
                  <div>
                    <div className="text-[10px] font-mono uppercase tracking-widest text-amber-400 font-bold">
                      ISH VAQTI:
                    </div>
                    <p className="text-sm font-medium text-stone-200 mt-1">
                      Dushanba – Shanba: 08:00 – 19:00
                    </p>
                    <p className="text-xs font-mono text-emerald-400 mt-0.5">
                      Yakshanba: Haftalik Diagnostik & Mock Testlar
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-400/10 text-amber-400 border border-amber-400/20 shrink-0">
                    <Send className="h-6 w-6" />
                  </div>
                  <div>
                    <div className="text-[10px] font-mono uppercase tracking-widest text-amber-400 font-bold">
                      RASMIY TELEGRAM:
                    </div>
                    <a
                      href="https://t.me/D_Furqatovich"
                      target="_blank"
                      rel="noreferrer"
                      className="text-sm font-medium text-stone-200 hover:text-amber-400 transition-colors mt-1 inline-flex items-center gap-1.5 min-h-[44px]"
                    >
                      @D_Furqatovich
                      <ArrowUpRight className="h-3.5 w-3.5" />
                    </a>
                  </div>
                </div>
              </div>
            </div>

            <div id="konsultatsiya" className="lg:col-span-6 scroll-mt-28">
              <SpotlightCard glowColor="rgba(245,158,11,0.25)">
                <div className="p-8 sm:p-12">
                  <div className="font-mono text-[10px] uppercase tracking-widest text-stone-400">
                    BEVOSITA BOG'LANISH //
                  </div>
                  <h3 className="font-serif text-3xl text-stone-100 mt-2 font-bold">
                    Bepul Sinov Darsiga Yozilish
                  </h3>
                  <p className="text-sm text-stone-400 mt-2">
                    O'quv bo'limi sizga dars jadvali va diagnostik sinov darsi vaqtini belgilab beradi.
                  </p>

                  {isSubmitted ? (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="mt-8 rounded-2xl border border-emerald-400/30 bg-emerald-400/10 p-6 text-center"
                    >
                      <CheckCircle2 className="mx-auto h-12 w-12 text-emerald-400" />
                      <h4 className="mt-3 font-serif text-xl font-bold text-stone-100">
                        Arizangiz Qabul Qilindi!
                      </h4>
                      <p className="mt-2 text-xs text-stone-300 font-mono">
                        Tez orada menejerlarimiz siz bilan bog'lanishadi.
                      </p>
                    </motion.div>
                  ) : (
                    <form onSubmit={handleFormSubmit} className="mt-8 space-y-4">
                      {submitError && (
                        <div className="rounded-xl bg-red-500/10 border border-red-500/30 p-3 text-xs text-red-300 font-mono">
                          {submitError}
                        </div>
                      )}

                      <div>
                        <label className="block text-[10px] font-mono uppercase tracking-widest text-stone-400 mb-1">
                          Ismingiz
                        </label>
                        <input
                          type="text"
                          required
                          value={formName}
                          onChange={(e) => setFormName(e.target.value)}
                          placeholder="F.I.SH."
                          className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-stone-100 placeholder-stone-600 focus:border-amber-400 focus:outline-none transition-colors"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-mono uppercase tracking-widest text-stone-400 mb-1">
                          Telefon raqamingiz
                        </label>
                        <input
                          type="tel"
                          required
                          value={formPhone}
                          onChange={(e) => setFormPhone(e.target.value)}
                          placeholder="+998 (90) 123-45-67"
                          className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-stone-100 placeholder-stone-600 focus:border-amber-400 focus:outline-none transition-colors"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-mono uppercase tracking-widest text-stone-400 mb-1">
                          Qiziqqan fangingiz (ixtiyoriy)
                        </label>
                        <select
                          value={formSubject}
                          onChange={(e) => setFormSubject(e.target.value)}
                          className="w-full rounded-xl border border-white/10 bg-[#090d14] px-4 py-3 text-sm text-stone-100 focus:border-amber-400 focus:outline-none transition-colors"
                        >
                          <option value="">Fan / Kursni tanlang</option>
                          <option value="Tarix • Huquq • Geografiya">Tarix • Huquq • Geografiya</option>
                          <option value="Matematika & Prezident Maktabi">Matematika & Prezident Maktabi</option>
                          <option value="CEFR Ingliz Tili">CEFR Ingliz Tili (B2/C1)</option>
                          <option value="Kids & General English">Kids & General English</option>
                          <option value="Mental Arifmetika">Mental Arifmetika</option>
                          <option value="Ona Tili va Adabiyot">Ona Tili va Adabiyot</option>
                        </select>
                      </div>

                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full rounded-xl bg-gradient-to-r from-amber-400 to-amber-300 py-3.5 min-h-[48px] text-xs font-bold uppercase tracking-widest text-black shadow-[0_0_25px_rgba(245,158,11,0.3)] hover:shadow-[0_0_35px_rgba(245,158,11,0.5)] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                      >
                        {isSubmitting ? (
                          <span>Yuborilmoqda...</span>
                        ) : (
                          <>
                            <span>Sinov Darsiga Yozilish</span>
                            <ArrowRight className="h-4 w-4" />
                          </>
                        )}
                      </button>
                    </form>
                  )}
                </div>
              </SpotlightCard>
            </div>
          </div>
        </div>
      </section>

      {/* ====================================================================
          13. FOOTER
      ==================================================================== */}
      <footer className="bg-[#05070a] border-t border-white/[0.08] py-12 text-stone-400 font-mono text-xs">
        <div className="mx-auto max-w-[1400px] px-6 sm:px-8 lg:px-12 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-400 font-serif font-bold text-black text-sm">
              R
            </span>
            <span className="font-serif font-bold text-stone-200 tracking-wider">
              RENESSANS O'QUV MARKAZI
            </span>
          </div>

          <div>
            © {new Date().getFullYear()} RENESSANS. Yangiobod tumanidagi yagona OTM qamrovi yetakchisi.
          </div>

          <div className="flex items-center gap-6 text-stone-500">
            <a href="tel:+998886484949" className="hover:text-amber-400 transition-colors">
              +998 (88) 648-49-49
            </a>
            <span>•</span>
            <a href="https://t.me/D_Furqatovich" target="_blank" rel="noreferrer" className="hover:text-amber-400 transition-colors">
              Telegram
            </a>
          </div>
        </div>
      </footer>
    </main>
  );
}