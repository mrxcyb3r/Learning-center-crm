
import React, { useEffect, useId, useMemo, useRef, useState } from "react";
import {
  AnimatePresence,
  motion,
  MotionValue,
  useInView,
  useMotionValue,
  useMotionValueEvent,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
  useVelocity,
} from "framer-motion";
import {
  ArrowRight,
  ArrowUpRight,
  Award,
  BookOpen,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
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
   CANONICAL DATA (PRESERVED ACCURATELY)
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
      "Prezident maktablarining 1- va 2-bosqich saralash imtihonlari hamda Milliy Sertifikat A+ talablariga to'liq moslashtirilgan chuqurlashtirilgan mantiqiy dastur.",
    highlights: [
      "Mantiqiy, fazoviy va nostandart masalalar",
      "Milliy Sertifikat A+ masalalar banki",
      "Prezident maktablari test simulyatsiyalari",
      "Tezkor yechish algoritmlari va olimpiada bazasi",
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
    badge: "100% Davlat Granti",
    year: "2025",
  },
  {
    id: "res-2",
    name: "Tursunov Shahzod",
    score: "184.5",
    examType: "DTM",
    university: "Toshkent Davlat Yuridik Universiteti (TDYU) — 100% Grant",
    badge: "100% Davlat Granti",
    year: "2025",
  },
  {
    id: "res-3",
    name: "Qodirov Bekzod",
    score: "CEFR C1",
    examType: "CEFR",
    university: "Westminster Xalqaro Universiteti (WIUT)",
    badge: "Xalqaro Imtiyoz",
    year: "2025",
  },
  {
    id: "res-4",
    name: "Erkinova Nigora",
    score: "Tarix A+",
    examType: "Milliy Sertifikat",
    university: "O‘zbekiston Milliy Universiteti (O‘zMU)",
    badge: "Maksimal Ball",
    year: "2025",
  },
  {
    id: "res-5",
    name: "Yo‘ldoshev Sardor",
    score: "176.4",
    examType: "DTM",
    university: "TATU (Axborot Xavfsizligi)",
    badge: "Davlat Granti",
    year: "2025",
  },
  {
    id: "res-6",
    name: "Mamadaliyev Jasur",
    score: "Matematika A",
    examType: "Milliy Sertifikat",
    university: "Prezident Maktabi & OTM Saralash",
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
    desc: "Munisa Mamadazimova rahbarligida fazoviy, nostandart va olimpiada darajasidagi masalalar yechiladi.",
    focus: "Nostandart masalalar & Formula tahlili",
    icon: Layers3,
  },
  {
    step: "03",
    title: "Kids & General English",
    desc: "Durdona Ermamatova bilan speaking, reading va Prezident maktabi imtihoniga xos leksika o'rganiladi.",
    focus: "Akademik lug'at & Matn bilan ishlash",
    icon: BookOpen,
  },
  {
    step: "04",
    title: "Mental Arifmetika",
    desc: "Inomjon Barakayev bilan soniyalarda tezkor hisoblash, fotografik xotira va zehnni yuksaltirish.",
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
    focus: "Prezident Maktabi Talabasi",
    icon: Award,
  },
];

const SUBJECT_ITEMS = [
  {
    step: "01",
    subject: "TARIX • HUQUQ • GEOGRAFIYA",
    teacher: "Davlatbek Abdurasulov",
    programs: "DTM • Diplomatiya • Yurisprudensiya • Akademiya",
    description:
      "Tarix va huquqshunoslik bo'yicha Milliy Sertifikat A+ va DTM ga chuqurlashtirilgan tayyorlov. Manbalar, xaritalar va huquqiy normalar tahlili.",
  },
  {
    step: "02",
    subject: "MATEMATIKA",
    teacher: "Munisa Mamadazimova",
    programs: "Milliy Sertifikat A+ • Prezident Maktabi • Olimpiada",
    description:
      "Mantiqiy fikrlash, nostandart masalalar va oliy o'quv yurtlari kirish imtihonlariga poydevor qo'yuvchi intensiv matematika.",
  },
  {
    step: "03",
    subject: "CEFR INGLIZ TILI",
    teacher: "Jamshid Alibekov",
    programs: "CEFR C1 / B2 • Grammar • Speaking • Mock Test",
    description:
      "Listening, Reading, Writing va Speaking ko'nikmalarini intensiv akademik darajaga olib chiqish hamda imtihon strategiyasi.",
  },
  {
    step: "04",
    subject: "GENERAL & KIDS ENGLISH",
    teacher: "Durdona Ermamatova",
    programs: "Kids English (3–10 yosh) • Prezident Maktabi Tayyorlov",
    description:
      "Qiziqarli o'yinlar, vizual qo'llanmalar va bolalar uchun erta yoshdan tabiiy va ravon inglizcha muloqot muhiti.",
  },
  {
    step: "05",
    subject: "MENTAL ARIFMETIKA",
    teacher: "Inomjon Barakayev",
    programs: "Tez hisoblash • Kuchli xotira • Fazoviy tafakkur",
    description:
      "Abakus orqali soniyalarda tezkor hisoblash va miya yarim sharlarini birdek faollashtiruvchi mantiqiy mashqlar.",
  },
  {
    step: "06",
    subject: "ONA TILI VA ADABIYOT",
    teacher: "Zulfizar Do'smatova",
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

/* ============================================================================
   FOCUS RANGE HELPER (DISCRETE FOCUS WINDOWS & TRANSITION ZONES)
============================================================================ */

interface FocusRange {
  enter: number;
  focusStart: number;
  focusEnd: number;
  exit: number;
}

function getFocusRanges(index: number, total: number, transitionWidth = 0.05): FocusRange {
  const segment = 1 / total;
  const center = (index + 0.5) * segment;
  const focusHalf = (segment - transitionWidth) / 2;

  const enter = Math.max(0, center - focusHalf - transitionWidth);
  const focusStart = Math.max(0, center - focusHalf);
  const focusEnd = Math.min(1, center + focusHalf);
  const exit = Math.min(1, center + focusHalf + transitionWidth);

  return { enter, focusStart, focusEnd, exit };
}

/* ============================================================================
   ACTIVE NUMBER / INDEX ANIMATION (VERTICAL ROLLING NUMBER)
============================================================================ */

const RollingNumber: React.FC<{ current: number; total: number }> = ({ current, total }) => {
  const currentFormatted = current < 10 ? `0${current}` : `${current}`;
  const totalFormatted = total < 10 ? `0${total}` : `${total}`;

  return (
    <div className="flex items-center gap-1 font-mono text-xl sm:text-2xl font-bold text-amber-400 select-none">
      <div className="relative h-8 overflow-hidden w-8 text-center">
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.span
            key={currentFormatted}
            initial={{ y: "100%", opacity: 0 }}
            animate={{ y: "0%", opacity: 1 }}
            exit={{ y: "-100%", opacity: 0 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            className="absolute inset-0 flex items-center justify-center"
          >
            {currentFormatted}
          </motion.span>
        </AnimatePresence>
      </div>
      <span className="text-stone-600 font-normal text-base sm:text-lg">/ {totalFormatted}</span>
    </div>
  );
};

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
   TELEMETRY NUMBER WITH COMPLETION GLOW
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
  const isInView = useInView(ref, { once: true, margin: "-40px" });
  const [displayValue, setDisplayValue] = useState("0");
  const [isComplete, setIsComplete] = useState(false);

  useEffect(() => {
    if (!isInView) return;
    let startTimestamp: number | null = null;
    const duration = 1800;

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
        isComplete ? "drop-shadow-[0_0_12px_rgba(245,158,11,0.35)] text-stone-50" : "",
      ].join(" ")}
    >
      {displayValue}
      {suffix}
    </span>
  );
};

/* ============================================================================
   SECTION HEADER WITH DIFFERENTIATED SPEED & SEMANTIC BLUR CHOREOGRAPHY
   (Eyebrow 0.8x, Title 1.0x, Subtitle 0.85x — Reading Zone Lock)
============================================================================ */

const ScrollFocusedHeader: React.FC<{
  eyebrow: string;
  title: string | React.ReactNode;
  subtitle?: string;
  progress: MotionValue<number>;
  align?: "center" | "left";
}> = ({ eyebrow, title, subtitle, progress, align = "center" }) => {
  const reduceMotion = useReducedMotion();

  // Eyebrow (0.8x speed)
  const eyebrowOpacity = useTransform(progress, [0, 0.22, 0.78, 1], [0.35, 1, 1, 0.35]);
  const eyebrowY = useTransform(progress, [0, 0.22, 0.78, 1], reduceMotion ? [0, 0, 0, 0] : [16, 0, 0, -16]);

  // Title (1.0x speed, semantic blur distance: 3px -> 0px -> 3px)
  const titleOpacity = useTransform(progress, [0, 0.22, 0.78, 1], [0.25, 1, 1, 0.25]);
  const titleY = useTransform(progress, [0, 0.22, 0.78, 1], reduceMotion ? [0, 0, 0, 0] : [26, 0, 0, -26]);
  const titleScale = useTransform(progress, [0, 0.22, 0.78, 1], reduceMotion ? [1, 1, 1, 1] : [0.97, 1, 1, 0.97]);
  const titleFilter = useTransform(
    progress,
    [0, 0.22, 0.78, 1],
    reduceMotion ? ["blur(0px)", "blur(0px)", "blur(0px)", "blur(0px)"] : ["blur(3px)", "blur(0px)", "blur(0px)", "blur(3px)"]
  );

  // Subtitle (0.85x speed, subtle blur cue: 2px -> 0px -> 2px)
  const subOpacity = useTransform(progress, [0, 0.22, 0.78, 1], [0.3, 1, 1, 0.3]);
  const subY = useTransform(progress, [0, 0.22, 0.78, 1], reduceMotion ? [0, 0, 0, 0] : [14, 0, 0, -14]);
  const subFilter = useTransform(
    progress,
    [0, 0.22, 0.78, 1],
    reduceMotion ? ["blur(0px)", "blur(0px)", "blur(0px)", "blur(0px)"] : ["blur(2px)", "blur(0px)", "blur(0px)", "blur(2px)"]
  );

  return (
    <div className={align === "center" ? "text-center" : "text-left"}>
      <motion.span
        style={{ opacity: eyebrowOpacity, y: eyebrowY }}
        className="inline-block font-mono text-[10px] font-bold uppercase tracking-[0.25em] text-amber-400"
      >
        {eyebrow}
      </motion.span>
      <motion.h2
        style={{ opacity: titleOpacity, y: titleY, scale: titleScale, filter: titleFilter }}
        className="mt-3 font-serif text-[clamp(2.4rem,4.5vw,4.5rem)] text-stone-100 leading-tight"
      >
        {title}
      </motion.h2>
      {subtitle && (
        <motion.p
          style={{ opacity: subOpacity, y: subY, filter: subFilter }}
          className="mt-2 text-sm font-serif italic text-stone-400"
        >
          "{subtitle}"
        </motion.p>
      )}
    </div>
  );
};

/* ============================================================================
   MAIN COMPONENT
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

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState("top");

  // Interaction State
  const [activeCourseId, setActiveCourseId] = useState<string>(courses[0]?.id ?? "c-tarix-huquq");
  const [activeRoadmapIndex, setActiveRoadmapIndex] = useState(0);
  const [activeTeacherIndex, setActiveTeacherIndex] = useState(0);
  const [activeSubjectIndex, setActiveSubjectIndex] = useState(0);
  const [activeResultIndex, setActiveResultIndex] = useState(0);
  const [hoveredResultId, setHoveredResultId] = useState<string | null>(null);
  const [selectedResultFilter, setSelectedResultFilter] = useState("BARCHASI");
  const [openFaq, setOpenFaq] = useState<string | null>(faqs[0]?.id ?? null);

  // Form State
  const [formName, setFormName] = useState("");
  const [formPhone, setFormPhone] = useState("");
  const [formSubject, setFormSubject] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState("");

  // Smooth Scroll-Linked Navbar Transformations
  const navBackground = useTransform(
    scrollY,
    [0, 80],
    ["rgba(7,9,13,0.6)", "rgba(7,9,13,0.94)"]
  );
  const navBorderColor = useTransform(
    scrollY,
    [0, 80],
    ["rgba(255,255,255,0.05)", "rgba(255,255,255,0.12)"]
  );
  const navShadow = useTransform(
    scrollY,
    [0, 80],
    ["none", "0 20px 50px rgba(0,0,0,0.8)"]
  );

  // Dynamic Navigation Section Observer (Reflects actual scroll journey)
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
        await new Promise((res) => setTimeout(res, 850));
      }
      setIsSubmitted(true);
    } catch (error) {
      console.error(error);
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
      {/* ====================================================================
          1. NAVBAR — SCROLL-LINKED FLOATING COMMAND BAR
      ==================================================================== */}
      <header className="fixed inset-x-0 top-0 z-[100] px-4 sm:px-8 py-3.5 transition-all duration-300">
        <motion.div
          style={{
            backgroundColor: navBackground,
            borderColor: navBorderColor,
            boxShadow: navShadow,
          }}
          className="mx-auto flex max-w-[1400px] items-center justify-between rounded-full border px-5 py-2.5 backdrop-blur-xl"
        >
          <button
            type="button"
            onClick={() => scrollTo("top")}
            className="group flex items-center gap-3 text-left focus:outline-none"
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-400 font-serif text-base font-bold text-black shadow-[0_0_20px_rgba(245,158,11,0.4)] transition-transform group-hover:scale-105">
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
                  className="relative px-3.5 py-1.5 transition-colors hover:text-stone-100 focus:outline-none"
                >
                  <span className="relative z-10">{label}</span>
                  {isActive && (
                    <motion.div
                      layoutId="nav-active-pill"
                      className="absolute inset-0 z-0 rounded-full bg-white/[0.08] border border-white/10"
                      transition={{ type: "spring", stiffness: 380, damping: 30 }}
                    />
                  )}
                </button>
              );
            })}
          </nav>

          <div className="flex items-center gap-4">
            <a
              href="tel:+998886484949"
              className="hidden sm:flex items-center gap-2 font-mono text-xs text-stone-300 hover:text-amber-400 transition-colors"
            >
              <Phone className="h-3.5 w-3.5 text-amber-400" />
              <span>+998 (88) 648-49-49</span>
            </a>

            <button
              type="button"
              onClick={() => scrollTo("konsultatsiya")}
              className="group relative inline-flex items-center gap-2 overflow-hidden rounded-full bg-amber-400 px-5 py-2 text-[10px] font-bold uppercase tracking-[0.14em] text-black transition-all hover:bg-amber-300 hover:shadow-[0_0_25px_rgba(245,158,11,0.35)] focus:outline-none"
            >
              <span>Sinov Darsi</span>
              <ArrowRight className="h-3 w-3 transition-transform duration-300 group-hover:translate-x-1" />
            </button>

            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 text-stone-300 xl:hidden hover:text-amber-400 transition-colors"
              aria-label="Menyuni ochish"
            >
              <Menu className="h-4 w-4" />
            </button>
          </div>
        </motion.div>
      </header>

      {/* MOBILE DRAWER */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, backdropFilter: "blur(0px)" }}
            animate={{ opacity: 1, backdropFilter: "blur(20px)" }}
            exit={{ opacity: 0, backdropFilter: "blur(0px)" }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-[200] bg-[#07090d]/96 flex flex-col justify-between p-6 sm:p-10 xl:hidden"
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
                className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 text-stone-300 hover:text-white"
                aria-label="Menyuni yopish"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="py-8 space-y-2 overflow-y-auto">
              <div className="font-mono text-[9px] uppercase tracking-widest text-amber-400/80 mb-3">
                BOB VA YO'NALISHLAR //
              </div>
              {navItems.map(([id, label], index) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => scrollTo(id)}
                  className="flex w-full items-center justify-between py-3 text-left font-serif text-2xl text-stone-200 hover:text-amber-400 transition-colors border-b border-white/[0.04]"
                >
                  <span className="flex items-center gap-4">
                    <span className="font-mono text-xs text-stone-500 font-normal">
                      0{index + 1}
                    </span>
                    {label}
                  </span>
                  <ChevronRight className="h-5 w-5 text-stone-600" />
                </button>
              ))}
            </div>

            <div className="pt-6 border-t border-white/[0.08] space-y-4">
              <a
                href="tel:+998886484949"
                className="flex items-center gap-3 font-mono text-sm text-stone-300"
              >
                <Phone className="h-4 w-4 text-amber-400" />
                +998 (88) 648-49-49
              </a>
              <button
                type="button"
                onClick={() => scrollTo("konsultatsiya")}
                className="w-full rounded-2xl bg-amber-400 py-3.5 text-xs font-bold uppercase tracking-widest text-black flex items-center justify-center gap-2"
              >
                Bepul Sinov Darsi
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ====================================================================
          2. HERO — CINEMATIC OPENING SCENE & FOCUSED RETREAT
      ==================================================================== */}
      <HeroSceneSection scrollTo={scrollTo} />

      {/* ====================================================================
          3. MARQUEE — PHYSICAL VELOCITY RESPONSE
      ==================================================================== */}
      <MarqueeWithVelocity />

      {/* ====================================================================
          4. FALSAFA — SEQUENTIAL FOCUS TYPOGRAPHY MOMENTS
      ==================================================================== */}
      <ManifestoFocusNarrative />

      {/* ====================================================================
          5. BOSQICHMA-BOSQICH TIZIM — 420VH STICKY FOCUS ENGINE
             (STRICTLY PRESERVED AS BENCHMARK)
      ==================================================================== */}
      <MethodologyStickyFocus stages={METHOD_STAGES} />

      {/* ====================================================================
          6. KURSLAR — FOCUSED PRODUCT EXPLORER ("COURSE SPOTLIGHT")
      ==================================================================== */}
      <CoursesFocusedExplorer
        courses={courses}
        activeCourseId={activeCourseId}
        setActiveCourseId={setActiveCourseId}
        onOpenCourse={handleNavigateToCourse}
        onRegisterClick={() => scrollTo("konsultatsiya")}
      />

      {/* ====================================================================
          7. PREZIDENT MAKTABIGA TAYYORLOV — EDITORIAL DOCUMENTARY REVEAL
      ==================================================================== */}
      <PresidentSchoolFocusedJourney
        stages={PRESIDENT_STAGES}
        activeRoadmapIndex={activeRoadmapIndex}
        setActiveRoadmapIndex={setActiveRoadmapIndex}
        onRegisterClick={() => scrollTo("konsultatsiya")}
      />

      {/* ====================================================================
          8. TIZIM USTOZLARI — HUMAN SPOTLIGHT SHOWCASE
      ==================================================================== */}
      <TeachersEditorialShowcase
        teachers={teachers}
        activeTeacherIndex={activeTeacherIndex}
        setActiveTeacherIndex={setActiveTeacherIndex}
        onOpenTeacher={handleNavigateToTeacher}
      />

      {/* ====================================================================
          9. FANLAR — ACADEMIC DOCKET REGISTER
      ==================================================================== */}
      <SubjectsAcademicRegister
        items={SUBJECT_ITEMS}
        activeSubjectIndex={activeSubjectIndex}
        setActiveSubjectIndex={setActiveSubjectIndex}
        onRegisterClick={() => scrollTo("konsultatsiya")}
      />

      {/* ====================================================================
          10. REAL NATIJALAR — EVIDENCE BENCHMARK ARCHIVE
      ==================================================================== */}
      <ResultsBenchmarkArchive
        results={filteredResults}
        activeResultIndex={activeResultIndex}
        setActiveResultIndex={setActiveResultIndex}
        hoveredResultId={hoveredResultId}
        setHoveredResultId={setHoveredResultId}
        selectedFilter={selectedResultFilter}
        setSelectedFilter={setSelectedResultFilter}
      />

      {/* ====================================================================
          11. FAQ — INTERACTIVE ACCORDION
      ==================================================================== */}
      <FAQSection faqs={faqs} openFaq={openFaq} setOpenFaq={setOpenFaq} />

      {/* ====================================================================
          12. MANZIL — GEOGRAPHIC DEPTH MOMENT
      ==================================================================== */}
      <CampusMapSection />

      {/* ====================================================================
          13. KONSULTATSIYA — CINEMATIC CONVERSION
      ==================================================================== */}
      <ConsultationSceneSection
        formName={formName}
        setFormName={setFormName}
        formPhone={formPhone}
        setFormPhone={setFormPhone}
        formSubject={formSubject}
        setFormSubject={setFormSubject}
        isSubmitting={isSubmitting}
        isSubmitted={isSubmitted}
        setIsSubmitted={setIsSubmitted}
        submitError={submitError}
        handleFormSubmit={handleFormSubmit}
      />

      {/* ====================================================================
          14. FOOTER — CALM CLOSURE
      ==================================================================== */}
      <footer className="border-t border-white/[0.08] bg-[#05070a] py-16">
        <div className="mx-auto max-w-[1400px] px-6 sm:px-8 lg:px-12">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8 border-b border-white/[0.08] pb-12">
            <div>
              <div className="font-serif text-2xl font-bold tracking-[0.18em] text-stone-100">
                RENESSANS O‘QUV MARKAZI
              </div>
              <p className="mt-2 text-xs font-mono text-stone-400">
                Yangiobod tumani, 1-sonli maktab binosi • Tel: +998 (88) 648-49-49
              </p>
            </div>

            <div className="flex flex-wrap gap-6 text-[11px] font-mono uppercase tracking-[0.16em] text-stone-400">
              {navItems.map(([id, label]) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => scrollTo(id)}
                  className="hover:text-amber-400 transition-colors focus:outline-none"
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
            <div className="text-amber-400/80 font-bold">MAQSAD • TIZIM • NATIJA</div>
          </div>
        </div>
      </footer>
    </main>
  );
}

/* ============================================================================
   SECTION 02: HERO SCENE (DIFFERENTIATED TYPOGRAPHY SPEEDS & ATMOSPHERIC EXIT)
============================================================================ */

function HeroSceneSection({ scrollTo }: { scrollTo: (id: string) => void }) {
  const containerRef = useRef<HTMLElement | null>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end start"],
  });
  const smooth = useSpring(scrollYProgress, { stiffness: 90, damping: 25 });
  const reduceMotion = useReducedMotion();

  // Environment moves faster than focused content
  const bgGlowY = useTransform(smooth, [0, 1], reduceMotion ? [0, 0] : [0, -140]);
  const bgGlowScale = useTransform(smooth, [0, 1], reduceMotion ? [1, 1] : [1, 1.15]);

  // Differentiated Speeds: Eyebrow (0.8x), Headline (1.0x), Description (0.85x), CTA (earlier exit)
  const eyebrowY = useTransform(smooth, [0, 0.6, 1], reduceMotion ? [0, 0, 0] : [0, 0, -32]);

  const headlineY = useTransform(smooth, [0, 0.6, 1], reduceMotion ? [0, 0, 0] : [0, 0, -48]);
  const headlineOpacity = useTransform(smooth, [0, 0.65, 1], [1, 1, 0.15]);
  const headlineScale = useTransform(smooth, [0, 0.65, 1], reduceMotion ? [1, 1, 1] : [1, 1, 0.96]);
  const headlineFilter = useTransform(
    smooth,
    [0, 0.65, 1],
    reduceMotion ? ["blur(0px)", "blur(0px)", "blur(0px)"] : ["blur(0px)", "blur(0px)", "blur(3.5px)"]
  );

  const descY = useTransform(smooth, [0, 0.6, 1], reduceMotion ? [0, 0, 0] : [0, 0, -38]);
  const descOpacity = useTransform(smooth, [0, 0.65, 1], [1, 1, 0.2]);

  const ctaY = useTransform(smooth, [0, 0.5, 1], reduceMotion ? [0, 0, 0] : [0, 0, -22]);
  const ctaOpacity = useTransform(smooth, [0, 0.45, 0.85], [1, 0.85, 0]);

  const statsY = useTransform(smooth, [0, 1], reduceMotion ? [0, 0] : [0, -18]);

  return (
    <section
      id="top"
      ref={containerRef}
      className="relative flex min-h-[100svh] flex-col justify-between border-b border-white/[0.08] pt-32 pb-14 overflow-hidden"
    >
      <motion.div
        aria-hidden="true"
        style={{ y: bgGlowY, scale: bgGlowScale }}
        className="pointer-events-none absolute left-1/2 top-1/4 h-[580px] w-[580px] -translate-x-1/2 rounded-full bg-amber-500/[0.08] blur-[160px]"
      />

      <div className="relative mx-auto w-full max-w-[1400px] px-6 sm:px-8 lg:px-12">
        <div className="grid gap-12 lg:grid-cols-12 lg:items-end">
          <div className="lg:col-span-8">
            <motion.div
              style={{ y: eyebrowY }}
              initial={{ opacity: 0, y: 15, filter: "blur(4px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
              className="mb-8 inline-flex items-center gap-2.5 rounded-full border border-amber-400/30 bg-amber-400/[0.06] px-4 py-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-amber-400"
            >
              <Sparkles className="h-3.5 w-3.5" />
              Yangioboddagi Zamonaviy O‘quv Markazi
            </motion.div>

            <motion.h1
              style={{ y: headlineY, opacity: headlineOpacity, scale: headlineScale, filter: headlineFilter }}
              className="font-serif text-[clamp(3.4rem,7.4vw,7.8rem)] font-medium leading-[0.92] tracking-[-0.04em] text-stone-100"
            >
              <span className="block overflow-hidden">
                <motion.span
                  initial={{ y: "100%" }}
                  animate={{ y: "0%" }}
                  transition={{ duration: 0.8, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
                  className="block"
                >
                  Farzandingizning
                </motion.span>
              </span>
              <span className="block overflow-hidden">
                <motion.span
                  initial={{ y: "100%" }}
                  animate={{ y: "0%" }}
                  transition={{ duration: 0.8, delay: 0.22, ease: [0.16, 1, 0.3, 1] }}
                  className="block"
                >
                  kelajagini bugundan
                </motion.span>
              </span>
              <span className="block overflow-hidden">
                <motion.span
                  initial={{ y: "100%" }}
                  animate={{ y: "0%" }}
                  transition={{ duration: 0.8, delay: 0.34, ease: [0.16, 1, 0.3, 1] }}
                  className="block italic text-amber-400"
                >
                  boshlang!
                </motion.span>
              </span>
            </motion.h1>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.45 }}
              className="mt-8 flex flex-wrap items-center gap-3 text-sm sm:text-base text-stone-300"
            >
              <span className="font-mono text-stone-500 uppercase tracking-widest text-xs">
                Yo'nalish:
              </span>
              <TypedSubhead />
            </motion.div>
          </div>

          <div className="lg:col-span-4 lg:pb-3">
            <motion.p
              style={{ y: descY, opacity: descOpacity }}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="text-base leading-relaxed text-stone-300 sm:text-lg"
            >
              Milliy sertifikat, DTM, CEFR va Prezident maktabiga tayyorlov.
              Bilimga sarmoya — kelajakka investitsiya!
            </motion.p>

            <motion.div
              style={{ y: ctaY, opacity: ctaOpacity }}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.52 }}
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

      <motion.div
        style={{ y: statsY }}
        className="relative mt-16 border-t border-white/[0.08] pt-10"
      >
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
      </motion.div>
    </section>
  );
}

/* ============================================================================
   SECTION 03: MARQUEE (PHYSICAL SCROLL VELOCITY RESPONSE)
============================================================================ */

function MarqueeWithVelocity() {
  const { scrollY } = useScroll();
  const scrollVelocity = useVelocity(scrollY);
  const smoothVelocity = useSpring(scrollVelocity, { damping: 50, stiffness: 350 });

  const scrollShift = useTransform(scrollY, [0, 4000], [0, -700]);
  const skewX = useTransform(smoothVelocity, [-1500, 0, 1500], [-3, 0, 3]);

  return (
    <section className="relative overflow-hidden border-b border-white/[0.08] bg-[#0a0d13] py-4 select-none">
      <div className="flex whitespace-nowrap overflow-hidden">
        <motion.div
          style={{ x: scrollShift, skewX }}
          className="flex gap-10 items-center cursor-default"
        >
          {[...TICKER_ITEMS, ...TICKER_ITEMS, ...TICKER_ITEMS].map((item, idx) => (
            <div
              key={idx}
              className="flex items-center gap-10 text-xs font-mono font-bold tracking-[0.22em] text-stone-300 hover:text-amber-400 transition-colors"
            >
              <span>{item}</span>
              <span className="text-amber-400/60 animate-pulse">✦</span>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

/* ============================================================================
   SECTION 04: FALSAFA (SEQUENTIAL FOCUS TYPOGRAPHY CHAPTERS)
   (Active word becomes sharp, scale 1.04; inactive words blur & dim)
============================================================================ */

function ManifestoFocusNarrative() {
  const containerRef = useRef<HTMLElement | null>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"],
  });

  const [activeWordIdx, setActiveWordIdx] = useState(0);

  useMotionValueEvent(scrollYProgress, "change", (latest) => {
    const idx = Math.min(3, Math.max(0, Math.floor(latest * 4)));
    setActiveWordIdx(idx);
  });

  const manifestoStages = [
    {
      num: "01",
      word: "TASODIF",
      state: "STRIKE",
      tagline: "Tasodifga o'rin yo'q",
      description:
        "Farzandingizning kelajagi omad yoki tasodifga tashlab qo‘yilmaydi. Tayyorgarlik sinovdan o'tgan qat'iy standartlar bilan boshlanadi.",
    },
    {
      num: "02",
      word: "MAQSAD",
      state: "ACTIVE",
      tagline: "Aniq va o'lchanadigan target",
      description:
        "Har bir o‘quvchining boshlang‘ich nuqtasi chuqur diagnostika qilinib, kirish bali va orzu qilingan grant maqsadi belgilanadi.",
    },
    {
      num: "03",
      word: "TIZIM",
      state: "CORE",
      tagline: "Uzluksiz nazorat va metodika",
      description:
        "Haftalik real imtihon simulyatsiyasi, individual xatolar tahlili va o'quvchi bilan ustoz o'rtasidagi yagona zanjir.",
    },
    {
      num: "04",
      word: "NATIJA",
      state: "GOAL",
      tagline: "100% OTM Qamrovi & Davlat Granti",
      description:
        "Bilimdan Natijaga: bitiruvchilarimizning 187.9 ballik eng yuqori natijasi va nufuzli universitetlarga imtiyozli qabuli.",
    },
  ];

  return (
    <section
      id="falsafa"
      ref={containerRef}
      className="relative h-[300vh] bg-[#080b10] border-b border-white/[0.08]"
    >
      <div className="sticky top-0 flex h-[100svh] items-center overflow-hidden">
        <div className="relative mx-auto w-full max-w-[1300px] px-6 sm:px-8 lg:px-12">
          <div className="grid gap-12 lg:grid-cols-12 items-center">
            {/* Left Column: Vertical Focus List with Blur-to-Sharp Choreography */}
            <div className="lg:col-span-4 space-y-4">
              <span className="font-mono text-[10px] font-bold uppercase tracking-[0.25em] text-amber-400">
                01 / FALSAFA & MANIFEST
              </span>

              <div className="space-y-3 pt-6">
                {manifestoStages.map((st, idx) => {
                  const isFocused = activeWordIdx === idx;
                  return (
                    <div
                      key={st.word}
                      className={[
                        "flex items-center gap-4 transition-all duration-500",
                        isFocused
                          ? "opacity-100 scale-100 translate-x-2 blur-none"
                          : "opacity-25 scale-95 translate-x-0 blur-[2px]",
                      ].join(" ")}
                    >
                      <span
                        className={[
                          "font-mono text-xs font-bold",
                          isFocused ? "text-amber-400" : "text-stone-600",
                        ].join(" ")}
                      >
                        {st.num} //
                      </span>
                      <span
                        className={[
                          "font-serif text-2xl sm:text-3xl font-bold tracking-wider",
                          idx === 0
                            ? "line-through text-stone-500"
                            : isFocused
                            ? idx === 3
                              ? "text-emerald-400"
                              : "text-amber-400"
                            : "text-stone-500",
                        ].join(" ")}
                      >
                        {st.word}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Right Column: Active Focused Staged Reveal */}
            <div className="lg:col-span-8">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeWordIdx}
                  initial={{ opacity: 0, y: 35, scale: 0.96, filter: "blur(4px)" }}
                  animate={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
                  exit={{ opacity: 0, y: -35, scale: 0.96, filter: "blur(4px)" }}
                  transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
                  className="rounded-3xl border border-amber-400/30 bg-[#0c1017] p-8 sm:p-14 shadow-2xl relative overflow-hidden"
                >
                  <div className="flex items-center justify-between border-b border-white/[0.08] pb-4">
                    <span className="font-mono text-xs font-bold uppercase tracking-widest text-amber-400">
                      BOSQICH: {manifestoStages[activeWordIdx].num} // {manifestoStages[activeWordIdx].word}
                    </span>
                    <span className="font-mono text-xs text-stone-500">
                      SCROLL PROGRESS
                    </span>
                  </div>

                  <h3 className="mt-6 font-serif text-[clamp(2.2rem,4vw,3.8rem)] leading-tight text-stone-100">
                    {manifestoStages[activeWordIdx].tagline}
                  </h3>

                  <p className="mt-6 text-base sm:text-lg leading-relaxed text-stone-300 max-w-2xl">
                    {manifestoStages[activeWordIdx].description}
                  </p>

                  <div className="mt-8 flex items-center gap-3 text-xs font-mono uppercase tracking-widest text-stone-400 pt-6 border-t border-white/[0.08]">
                    <span className="text-amber-400 font-bold">BILIMDAN NATIJAGA</span>
                    <span>•</span>
                    <span>YANGIOBOD 1-MAKTAB</span>
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ============================================================================
   SECTION 05: BOSQICHMA-BOSQICH TIZIM (420VH STICKY FOCUS ENGINE)
   (STRICTLY PRESERVED AS BENCHMARK)
============================================================================ */

function MethodologyStickyFocus({ stages }: { stages: typeof METHOD_STAGES }) {
  const containerRef = useRef<HTMLElement | null>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"],
  });

  const smoothProgress = useSpring(scrollYProgress, { stiffness: 100, damping: 30, mass: 0.25 });
  const progressWidth = useTransform(smoothProgress, [0, 1], ["0%", "100%"]);
  const [activeStage, setActiveStage] = useState(0);

  useMotionValueEvent(scrollYProgress, "change", (latest) => {
    const idx = Math.min(stages.length - 1, Math.max(0, Math.floor(latest * stages.length)));
    setActiveStage(idx);
  });

  return (
    <section id="metodika" ref={containerRef} className="relative h-[420vh] bg-[#07090d]">
      <div className="sticky top-0 flex h-[100svh] items-center overflow-hidden border-b border-white/[0.08]">
        <div className="pointer-events-none absolute left-0 right-0 top-0 h-1 bg-white/[0.08]">
          <motion.div
            className="h-full bg-amber-400 shadow-[0_0_15px_#f59e0b]"
            style={{ width: progressWidth }}
          />
        </div>

        <div className="relative mx-auto w-full max-w-[1400px] px-6 sm:px-8 lg:px-12">
          <div className="mb-8 flex items-end justify-between gap-6 border-b border-white/[0.08] pb-6">
            <div>
              <span className="font-mono text-[10px] font-bold uppercase tracking-[0.25em] text-amber-400">
                02 / METODIKA & BOSQICHLAR
              </span>
              <h2 className="mt-2 font-serif text-[clamp(2.2rem,4.5vw,4.5rem)] text-stone-100">
                Bosqichma-Bosqich Tizim
              </h2>
            </div>
            <RollingNumber current={activeStage + 1} total={stages.length} />
          </div>

          <div className="grid lg:grid-cols-12 gap-8 items-center relative">
            {/* Left Column: Stacked Cards with Discrete Focus Windows */}
            <div className="lg:col-span-6 relative h-[380px] sm:h-[340px]">
              {stages.map((stage, idx) => (
                <MethodologyFocusCard
                  key={stage.step}
                  stage={stage}
                  index={idx}
                  total={stages.length}
                  scrollYProgress={scrollYProgress}
                />
              ))}
            </div>

            {/* Right Column: Stacked Physical SVGs with Discrete Focus Windows */}
            <div className="lg:col-span-6 rounded-3xl border border-white/[0.08] bg-[#080b10] flex items-center justify-center p-6 shadow-inner relative h-[380px] sm:h-[340px] overflow-hidden">
              {stages.map((stage, idx) => (
                <MethodologyFocusVisual
                  key={stage.step}
                  type={stage.visualType}
                  step={stage.step}
                  index={idx}
                  total={stages.length}
                  scrollYProgress={scrollYProgress}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function MethodologyFocusCard({
  stage,
  index,
  total,
  scrollYProgress,
}: {
  stage: (typeof METHOD_STAGES)[number];
  index: number;
  total: number;
  scrollYProgress: MotionValue<number>;
}) {
  const ranges = getFocusRanges(index, total, 0.05);
  const isFirst = index === 0;
  const isLast = index === total - 1;

  const opacity = useTransform(
    scrollYProgress,
    isFirst
      ? [0, ranges.focusEnd, ranges.exit]
      : isLast
      ? [ranges.enter, ranges.focusStart, 1]
      : [ranges.enter, ranges.focusStart, ranges.focusEnd, ranges.exit],
    isFirst ? [1, 1, 0] : isLast ? [0, 1, 1] : [0, 1, 1, 0]
  );

  const y = useTransform(
    scrollYProgress,
    isFirst
      ? [0, ranges.focusEnd, ranges.exit]
      : isLast
      ? [ranges.enter, ranges.focusStart, 1]
      : [ranges.enter, ranges.focusStart, ranges.focusEnd, ranges.exit],
    isFirst ? [0, 0, -40] : isLast ? [40, 0, 0] : [40, 0, 0, -40]
  );

  const scale = useTransform(
    scrollYProgress,
    isFirst
      ? [0, ranges.focusEnd, ranges.exit]
      : isLast
      ? [ranges.enter, ranges.focusStart, 1]
      : [ranges.enter, ranges.focusStart, ranges.focusEnd, ranges.exit],
    isFirst ? [1, 1, 0.95] : isLast ? [0.95, 1, 1] : [0.95, 1, 1, 0.95]
  );

  return (
    <motion.div
      style={{ opacity, y, scale }}
      className="absolute inset-0 rounded-3xl border border-white/[0.1] bg-[#0b0e14] p-8 sm:p-10 shadow-2xl flex flex-col justify-between"
    >
      <div>
        <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-amber-400">
          {stage.badge}
        </span>
        <h3 className="mt-2 font-serif text-[clamp(1.8rem,3vw,2.8rem)] leading-tight text-stone-100">
          {stage.title}
        </h3>
        <p className="mt-1 text-xs font-mono uppercase text-stone-400">
          {stage.subtitle}
        </p>
        <p className="mt-4 text-sm sm:text-base text-stone-300 leading-relaxed">
          {stage.description}
        </p>
      </div>

      <div className="pt-4 border-t border-white/[0.08] flex items-center justify-between text-xs font-mono text-stone-400">
        <span>Bosqich Progressi:</span>
        <span className="text-amber-400 font-bold">{stage.percent}%</span>
      </div>
    </motion.div>
  );
}

function MethodologyFocusVisual({
  type,
  step,
  index,
  total,
  scrollYProgress,
}: {
  type: string;
  step: string;
  index: number;
  total: number;
  scrollYProgress: MotionValue<number>;
}) {
  const patternId = useId();
  const ranges = getFocusRanges(index, total, 0.05);
  const isFirst = index === 0;
  const isLast = index === total - 1;

  const opacity = useTransform(
    scrollYProgress,
    isFirst
      ? [0, ranges.focusEnd, ranges.exit]
      : isLast
      ? [ranges.enter, ranges.focusStart, 1]
      : [ranges.enter, ranges.focusStart, ranges.focusEnd, ranges.exit],
    isFirst ? [1, 1, 0] : isLast ? [0, 1, 1] : [0, 1, 1, 0]
  );

  const scale = useTransform(
    scrollYProgress,
    isFirst
      ? [0, ranges.focusEnd, ranges.exit]
      : isLast
      ? [ranges.enter, ranges.focusStart, 1]
      : [ranges.enter, ranges.focusStart, ranges.focusEnd, ranges.exit],
    isFirst ? [1, 1, 0.92] : isLast ? [0.92, 1, 1] : [0.92, 1, 1, 0.92]
  );

  // Focus-linked micro-animations
  const radarSweep = useTransform(scrollYProgress, [ranges.enter, ranges.exit], [0, 360]);
  const conduitProgress = useTransform(scrollYProgress, [ranges.focusStart, ranges.focusEnd], [0, 1]);
  const graphProgress = useTransform(scrollYProgress, [ranges.focusStart, ranges.focusEnd], [0, 1]);
  const starAssemble = useTransform(scrollYProgress, [ranges.focusStart, ranges.focusEnd], [60, 0]);

  return (
    <motion.div
      style={{ opacity, scale }}
      className="absolute inset-0 flex items-center justify-center p-6 select-none"
    >
      <svg
        className="absolute inset-0 h-full w-full opacity-20 pointer-events-none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <pattern id={patternId} width="30" height="30" patternUnits="userSpaceOnUse">
            <path d="M 30 0 L 0 0 0 30" fill="none" stroke="rgba(245, 158, 11, 0.4)" strokeWidth="0.5" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill={`url(#${patternId})`} />
      </svg>

      {type === "radar" && (
        <svg viewBox="0 0 200 200" className="w-48 h-48 sm:w-60 sm:h-60 text-amber-400">
          <circle cx="100" cy="100" r="80" fill="none" stroke="currentColor" strokeWidth="1" strokeDasharray="4 4" className="opacity-30" />
          <circle cx="100" cy="100" r="55" fill="none" stroke="currentColor" strokeWidth="1" className="opacity-50" />
          <circle cx="100" cy="100" r="30" fill="none" stroke="currentColor" strokeWidth="1.5" className="opacity-80" />
          <circle cx="100" cy="100" r="6" fill="currentColor" className="opacity-90" />
          <line x1="15" y1="100" x2="185" y2="100" stroke="currentColor" strokeWidth="0.8" strokeDasharray="3 3" className="opacity-40" />
          <line x1="100" y1="15" x2="100" y2="185" stroke="currentColor" strokeWidth="0.8" strokeDasharray="3 3" className="opacity-40" />

          <motion.g style={{ rotate: radarSweep, originX: "100px", originY: "100px" }}>
            <path d="M 100 100 L 180 100 A 80 80 0 0 0 100 20 Z" fill="rgba(245, 158, 11, 0.35)" />
            <line x1="100" y1="100" x2="180" y2="100" stroke="#f59e0b" strokeWidth="1.8" />
          </motion.g>
        </svg>
      )}

      {type === "target" && (
        <svg viewBox="0 0 200 200" className="w-48 h-48 sm:w-60 sm:h-60 text-amber-400">
          <circle cx="100" cy="100" r="76" fill="none" stroke="currentColor" strokeWidth="1.2" strokeDasharray="6 4" className="opacity-40" />
          <circle cx="100" cy="100" r="48" fill="none" stroke="currentColor" strokeWidth="1.8" className="opacity-75" />
          <circle cx="100" cy="100" r="22" fill="currentColor" fillOpacity="0.15" stroke="currentColor" strokeWidth="1.5" />
          <circle cx="100" cy="100" r="4" fill="#f59e0b" />
          <path d="M 60 40 L 40 40 L 40 60" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
          <path d="M 140 40 L 160 40 L 160 60" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
          <path d="M 40 140 L 40 160 L 60 160" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
          <path d="M 160 140 L 160 160 L 140 160" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
          <text x="100" y="104" textAnchor="middle" fill="#f59e0b" fontSize="10" fontFamily="monospace" fontWeight="bold">
            LOCK A+
          </text>
        </svg>
      )}

      {type === "system" && (
        <svg viewBox="0 0 200 200" className="w-48 h-48 sm:w-60 sm:h-60 text-emerald-400">
          <path d="M 60 52 L 140 52 L 140 102 M 140 102 L 60 102 L 60 152 M 60 152 L 140 152" fill="none" stroke="rgba(245,158,11,0.2)" strokeWidth="2.5" />
          <motion.path
            d="M 60 52 L 140 52 L 140 102 M 140 102 L 60 102 L 60 152 M 60 152 L 140 152"
            fill="none"
            stroke="#f59e0b"
            strokeWidth="2.5"
            style={{ pathLength: conduitProgress }}
          />
          <rect x="25" y="32" width="70" height="36" rx="8" fill="#090d14" stroke="#10b981" strokeWidth="1.5" />
          <text x="60" y="55" textAnchor="middle" fill="#10b981" fontSize="9" fontFamily="monospace" fontWeight="bold">01 NAZARIYA</text>
          <rect x="105" y="82" width="72" height="36" rx="8" fill="#090d14" stroke="#f59e0b" strokeWidth="1.5" />
          <text x="141" y="105" textAnchor="middle" fill="#f59e0b" fontSize="9" fontFamily="monospace" fontWeight="bold">02 AMALIYOT</text>
          <rect x="25" y="132" width="80" height="36" rx="8" fill="#090d14" stroke="#10b981" strokeWidth="1.5" />
          <text x="65" y="155" textAnchor="middle" fill="#10b981" fontSize="9" fontFamily="monospace" fontWeight="bold">03 MUSTAHKAM</text>
        </svg>
      )}

      {type === "analytics" && (
        <svg viewBox="0 0 200 200" className="w-48 h-48 sm:w-60 sm:h-60 text-amber-400">
          <line x1="25" y1="165" x2="180" y2="165" stroke="rgba(255,255,255,0.15)" strokeWidth="1" />
          <rect x="35" y="115" width="20" height="50" rx="4" fill="rgba(245,158,11,0.25)" />
          <rect x="68" y="90" width="20" height="75" rx="4" fill="rgba(245,158,11,0.45)" />
          <rect x="101" y="65" width="20" height="100" rx="4" fill="rgba(245,158,11,0.7)" />
          <rect x="134" y="35" width="20" height="130" rx="4" fill="#f59e0b" />
          <motion.path
            d="M 45 110 Q 90 75, 144 32"
            fill="none"
            stroke="#10b981"
            strokeWidth="2.5"
            strokeLinecap="round"
            style={{ pathLength: graphProgress }}
          />
          <circle cx="144" cy="32" r="5" fill="#10b981" />
          <text x="144" y="20" textAnchor="middle" fill="#10b981" fontSize="8" fontFamily="monospace" fontWeight="bold">
            +42.5%
          </text>
        </svg>
      )}

      {type === "award" && (
        <svg viewBox="0 0 200 200" className="w-48 h-48 sm:w-60 sm:h-60 text-emerald-400">
          <circle cx="100" cy="100" r="70" fill="none" stroke="rgba(16,185,129,0.3)" strokeWidth="1.5" strokeDasharray="4 4" />
          <motion.polygon
            points="100,20 122,68 174,74 135,110 148,162 100,136 52,162 65,110 26,74 78,68"
            fill="rgba(16,185,129,0.15)"
            stroke="#10b981"
            strokeWidth="2"
            style={{ rotate: starAssemble, originX: "100px", originY: "100px" }}
          />
          <circle cx="100" cy="98" r="32" fill="#080b10" stroke="#f59e0b" strokeWidth="2.5" />
          <text x="100" y="103" textAnchor="middle" fill="#f59e0b" fontSize="13" fontFamily="monospace" fontWeight="bold">
            100%
          </text>
          <text x="100" y="116" textAnchor="middle" fill="#10b981" fontSize="7" fontFamily="monospace" letterSpacing="1">
            GRANT
          </text>
        </svg>
      )}

      <div className="absolute bottom-2 right-2 font-mono text-[9px] text-amber-400/60 uppercase tracking-widest">
        METODIKA // 0{step}
      </div>
    </motion.div>
  );
}

/* ============================================================================
   SECTION 06: KURSLAR (FOCUSED PRODUCT EXPLORER — "COURSE SPOTLIGHT")
============================================================================ */

function CoursesFocusedExplorer({
  courses,
  activeCourseId,
  setActiveCourseId,
  onOpenCourse,
  onRegisterClick,
}: {
  courses: CoursePath[];
  activeCourseId: string;
  setActiveCourseId: (id: string) => void;
  onOpenCourse: (slug: string) => void;
  onRegisterClick: () => void;
}) {
  const containerRef = useRef<HTMLElement | null>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"],
  });
  const smooth = useSpring(scrollYProgress, { stiffness: 90, damping: 25 });

  const activeCourse = courses.find((c) => c.id === activeCourseId) || courses[0];
  const activeIndex = courses.findIndex((c) => c.id === activeCourseId);

  return (
    <section
      id="kurslar"
      ref={containerRef}
      className="scroll-mt-20 border-b border-white/[0.08] bg-[#080b10] py-28 sm:py-36 overflow-hidden"
    >
      <div className="mx-auto max-w-[1400px] px-6 sm:px-8 lg:px-12">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 border-b border-white/[0.08] pb-10">
          <ScrollFocusedHeader
            eyebrow="03 / AKADEMIK DASTURLAR"
            title="Kurslar Katalogi"
            subtitle="Har bir yo‘nalish uchun chuqurlashtirilgan o‘quv dasturi."
            progress={smooth}
            align="left"
          />
          <RollingNumber current={activeIndex + 1} total={courses.length} />
        </div>

        {/* Course Selector Tabs with Visible Hierarchy */}
        <div className="mt-10 flex gap-2 overflow-x-auto pb-4 no-scrollbar">
          {courses.map((c, i) => {
            const isCurrent = c.id === activeCourse.id;
            return (
              <button
                key={c.id}
                type="button"
                onClick={() => setActiveCourseId(c.id)}
                className={[
                  "relative shrink-0 px-5 py-3 rounded-2xl text-xs font-mono transition-all duration-300 focus:outline-none",
                  isCurrent
                    ? "text-black font-bold scale-105 shadow-[0_0_20px_rgba(245,158,11,0.3)]"
                    : "border border-white/10 bg-[#0c1017] text-stone-500 opacity-40 hover:opacity-100 hover:text-stone-200",
                ].join(" ")}
              >
                {isCurrent && (
                  <motion.div
                    layoutId="course-active-tab"
                    className="absolute inset-0 rounded-2xl bg-amber-400"
                    transition={{ type: "spring", stiffness: 380, damping: 30 }}
                  />
                )}
                <span className="relative z-10 flex items-center gap-2">
                  <span>0{i + 1}</span>
                  <span className="max-w-[130px] truncate">{c.title.split(" ")[0]}</span>
                </span>
              </button>
            );
          })}
        </div>

        {/* Focused Course Stage Area */}
        <div className="mt-8 rounded-3xl border border-amber-400/30 bg-[#0c1017] p-8 sm:p-14 relative overflow-hidden shadow-2xl">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeCourse.id}
              initial={{ opacity: 0, y: 30, scale: 0.98, filter: "blur(4px)" }}
              animate={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
              exit={{ opacity: 0, y: -30, scale: 0.98, filter: "blur(4px)" }}
              transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
              className="grid lg:grid-cols-12 gap-10 items-center"
            >
              {/* Left Details: Staged Reveal */}
              <div className="lg:col-span-8">
                <span className="font-mono text-[10px] uppercase tracking-widest text-amber-400/90 font-bold">
                  {activeCourse.category} // 0{activeIndex + 1}
                </span>

                <h3 className="mt-3 font-serif text-[clamp(2.2rem,4vw,3.8rem)] leading-tight text-stone-100">
                  {activeCourse.title}
                </h3>

                <p className="mt-6 text-base text-stone-300 leading-relaxed max-w-2xl">
                  {activeCourse.description}
                </p>

                <div className="grid sm:grid-cols-2 gap-3 mt-8 max-w-2xl">
                  {activeCourse.highlights.map((h, i) => (
                    <div key={i} className="flex items-start gap-2.5 text-xs sm:text-sm text-stone-200">
                      <Check className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
                      <span>{h}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Right Details: Pricing Console */}
              <div className="lg:col-span-4 rounded-2xl border border-white/[0.08] bg-[#07090d] p-8 flex flex-col justify-between space-y-6 shadow-xl">
                <div>
                  <span className="text-[10px] font-mono uppercase text-stone-500">
                    Oylik Kurs To'lovi
                  </span>
                  <div className="mt-1 font-serif text-3xl font-bold text-amber-400">
                    {activeCourse.price}
                  </div>
                  <div className="mt-1 text-xs font-mono text-stone-400 uppercase">
                    Davomiyligi: {activeCourse.duration}
                  </div>
                </div>

                <div className="space-y-3 pt-4 border-t border-white/[0.08]">
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="text-stone-500">Dars jadvali:</span>
                    <span className="text-stone-200">{activeCourse.schedule}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="text-stone-500">Mas'ul ustoz:</span>
                    <span className="text-amber-400 font-semibold">{activeCourse.teacherName}</span>
                  </div>
                </div>

                <div className="flex flex-col gap-2.5 pt-2">
                  <button
                    type="button"
                    onClick={onRegisterClick}
                    className="w-full rounded-xl bg-amber-400 py-3 text-center text-xs font-bold uppercase tracking-widest text-black hover:bg-amber-300 transition-colors shadow-lg"
                  >
                    Guruhga Yozilish
                  </button>
                  <button
                    type="button"
                    onClick={() => onOpenCourse(activeCourse.slug)}
                    className="w-full rounded-xl border border-white/20 py-3 text-center text-xs font-mono uppercase text-stone-300 hover:text-white transition-colors"
                  >
                    Batafsil O'rganish
                  </button>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
}

/* ============================================================================
   SECTION 07: PREZIDENT MAKTABI (EDITORIAL DOCUMENTARY REVEAL)
============================================================================ */

function PresidentSchoolFocusedJourney({
  stages,
  activeRoadmapIndex,
  setActiveRoadmapIndex,
  onRegisterClick,
}: {
  stages: typeof PRESIDENT_STAGES;
  activeRoadmapIndex: number;
  setActiveRoadmapIndex: (i: number) => void;
  onRegisterClick: () => void;
}) {
  const containerRef = useRef<HTMLElement | null>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"],
  });
  const smooth = useSpring(scrollYProgress, { stiffness: 90, damping: 25 });

  const activeStage = stages[activeRoadmapIndex] || stages[0];
  const progressPercent = (activeRoadmapIndex / (stages.length - 1)) * 100;

  return (
    <section
      id="prezident-maktabi"
      ref={containerRef}
      className="scroll-mt-20 border-b border-white/[0.08] bg-[#090d14] py-28 sm:py-36 overflow-hidden"
    >
      <div className="mx-auto max-w-[1400px] px-6 sm:px-8 lg:px-12">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 border-b border-white/[0.08] pb-10">
          <ScrollFocusedHeader
            eyebrow="04 / MAXSUS TAYYORLOV YO'LI"
            title="Prezident Maktabiga Tayyorlov"
            subtitle="1- va 2-bosqich saralash imtihonlariga kompleks intellektual tayyorgarlik."
            progress={smooth}
            align="left"
          />
          <RollingNumber current={activeRoadmapIndex + 1} total={stages.length} />
        </div>

        {/* Progressive Physical Rail */}
        <div className="mt-12 relative">
          <div className="hidden md:block absolute top-1/2 left-4 right-4 h-1 bg-white/[0.08] -translate-y-1/2 z-0">
            <motion.div
              animate={{ width: `${progressPercent}%` }}
              transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
              className="h-full bg-amber-400 shadow-[0_0_15px_#f59e0b]"
            />
          </div>

          <div className="grid grid-cols-2 md:grid-cols-6 gap-3 relative z-10">
            {stages.map((st, idx) => {
              const isActive = activeRoadmapIndex === idx;
              const isPassed = idx < activeRoadmapIndex;
              const Icon = st.icon;

              return (
                <button
                  key={st.step}
                  type="button"
                  onClick={() => setActiveRoadmapIndex(idx)}
                  className={[
                    "p-4 rounded-2xl border text-left transition-all duration-300 relative group focus:outline-none",
                    isActive
                      ? "border-amber-400 bg-amber-400/[0.12] shadow-[0_0_25px_rgba(245,158,11,0.25)] scale-105 opacity-100"
                      : isPassed
                      ? "border-white/10 bg-[#0c1017] opacity-60 hover:opacity-100"
                      : "border-white/[0.06] bg-[#0c1017] opacity-25 hover:opacity-100",
                  ].join(" ")}
                >
                  <div className="flex items-center justify-between mb-3">
                    <span
                      className={[
                        "font-mono text-xs font-bold",
                        isActive ? "text-amber-400" : "text-stone-500",
                      ].join(" ")}
                    >
                      {st.step}
                    </span>
                    <Icon
                      className={[
                        "h-4 w-4 transition-transform duration-300",
                        isActive ? "text-amber-400 scale-110" : "text-stone-600",
                      ].join(" ")}
                    />
                  </div>
                  <div className="font-serif text-sm font-semibold text-stone-200 line-clamp-2">
                    {st.title}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Focused Checkpoint Detail Stage */}
        <div className="mt-10 rounded-3xl border border-amber-400/40 bg-[#0c1017] p-8 sm:p-14 relative overflow-hidden shadow-2xl">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeStage.step}
              initial={{ opacity: 0, x: 30, filter: "blur(4px)" }}
              animate={{ opacity: 1, x: 0, filter: "blur(0px)" }}
              exit={{ opacity: 0, x: -30, filter: "blur(4px)" }}
              transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
              className="grid lg:grid-cols-12 gap-8 items-center"
            >
              <div className="lg:col-span-8">
                <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-amber-400">
                  FAOL CHECKPOINT // {activeStage.step}
                </span>
                <h3 className="mt-3 font-serif text-[clamp(2.2rem,3.8vw,3.8rem)] text-stone-100">
                  {activeStage.title}
                </h3>
                <p className="mt-6 text-base text-stone-300 leading-relaxed max-w-2xl">
                  {activeStage.desc}
                </p>

                <div className="mt-8 p-4 rounded-2xl border border-white/[0.08] bg-white/[0.02] max-w-xl">
                  <div className="text-[10px] font-mono uppercase text-stone-500 mb-1">
                    Asosiy Yo'naltirilgan Ko'nikma:
                  </div>
                  <div className="font-serif text-lg font-bold text-amber-400">
                    {activeStage.focus}
                  </div>
                </div>
              </div>

              <div className="lg:col-span-4 flex flex-col justify-center items-start lg:items-end border-t lg:border-t-0 lg:border-l border-white/[0.08] pt-6 lg:pt-0 lg:pl-8">
                <div className="font-mono text-xs text-stone-400 mb-4">
                  Prezident Maktabi Standarti
                </div>
                <button
                  type="button"
                  onClick={onRegisterClick}
                  className="inline-flex items-center gap-2 rounded-full bg-amber-400 px-7 py-3 text-[11px] font-bold uppercase tracking-[0.14em] text-black hover:bg-amber-300 transition-all shadow-lg"
                >
                  Guruhga yozilish
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
}

/* ============================================================================
   SECTION 08: TIZIM USTOZLARI (HUMAN SPOTLIGHT SHOWCASE)
============================================================================ */

function TeachersEditorialShowcase({
  teachers,
  activeTeacherIndex,
  setActiveTeacherIndex,
  onOpenTeacher,
}: {
  teachers: TeacherRecord[];
  activeTeacherIndex: number;
  setActiveTeacherIndex: (i: number) => void;
  onOpenTeacher: (slug: string) => void;
}) {
  const containerRef = useRef<HTMLElement | null>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"],
  });
  const smooth = useSpring(scrollYProgress, { stiffness: 90, damping: 25 });

  const activeTeacher = teachers[activeTeacherIndex] || teachers[0];

  return (
    <section
      id="ustozlar"
      ref={containerRef}
      className="scroll-mt-20 border-b border-white/[0.08] bg-[#07090d] py-28 sm:py-36 overflow-hidden"
    >
      <div className="mx-auto max-w-[1400px] px-6 sm:px-8 lg:px-12">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 border-b border-white/[0.08] pb-10">
          <ScrollFocusedHeader
            eyebrow="05 / PEDAGOGIK JAMOASI"
            title="Tizim Ustozlari"
            subtitle="Yuqori malakali, o'z fani bo'yicha yillik tajribaga ega yetakchi mutaxassislar."
            progress={smooth}
            align="left"
          />

          <div className="flex items-center gap-3">
            <RollingNumber current={activeTeacherIndex + 1} total={teachers.length} />
            <button
              type="button"
              onClick={() =>
                setActiveTeacherIndex(
                  (activeTeacherIndex - 1 + teachers.length) % teachers.length
                )
              }
              className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 text-stone-300 hover:border-amber-400 hover:text-amber-400 transition-colors"
              aria-label="Oldingi ustoz"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              type="button"
              onClick={() =>
                setActiveTeacherIndex((activeTeacherIndex + 1) % teachers.length)
              }
              className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 text-stone-300 hover:border-amber-400 hover:text-amber-400 transition-colors"
              aria-label="Keyingi ustoz"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Teacher Focus Selector Bar */}
        <div className="mt-8 flex gap-3 overflow-x-auto pb-4 no-scrollbar">
          {teachers.map((t, idx) => {
            const isActive = activeTeacherIndex === idx;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setActiveTeacherIndex(idx)}
                className={[
                  "relative shrink-0 px-5 py-2.5 rounded-full text-xs font-mono transition-all duration-300 focus:outline-none",
                  isActive
                    ? "text-black font-bold scale-105"
                    : "border border-white/10 bg-[#0c1017] text-stone-500 opacity-40 hover:opacity-100 hover:text-stone-200",
                ].join(" ")}
              >
                {isActive && (
                  <motion.div
                    layoutId="teacher-active-pill"
                    className="absolute inset-0 rounded-full bg-amber-400"
                    transition={{ type: "spring", stiffness: 380, damping: 30 }}
                  />
                )}
                <span className="relative z-10">0{idx + 1} // {t.name.split(" ")[0]}</span>
              </button>
            );
          })}
        </div>

        {/* Focused Teacher Showcase Stage */}
        <div className="mt-8 rounded-3xl border border-amber-400/30 bg-[#0c1017] p-8 sm:p-14 relative overflow-hidden shadow-2xl">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTeacher.id}
              initial={{ opacity: 0, y: 30, filter: "blur(4px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              exit={{ opacity: 0, y: -30, filter: "blur(4px)" }}
              transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
              className="grid lg:grid-cols-12 gap-10 items-center"
            >
              <div className="lg:col-span-7">
                <span className="font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-amber-400">
                  {activeTeacher.subject}
                </span>
                <h3 className="mt-2 font-serif text-[clamp(2.4rem,4.2vw,4.2rem)] leading-tight text-stone-100">
                  {activeTeacher.name}
                </h3>

                <p className="mt-6 text-base leading-relaxed text-stone-300">
                  {activeTeacher.bio}
                </p>

                {activeTeacher.achievements && (
                  <div className="mt-8 space-y-3">
                    <div className="text-[10px] font-mono uppercase tracking-widest text-stone-500">
                      Asosiy Natijalar & Yutuqlar:
                    </div>
                    {activeTeacher.achievements.map((ach, idx) => (
                      <div key={idx} className="flex items-start gap-3 text-xs sm:text-sm text-stone-200">
                        <Check className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
                        <span>{ach}</span>
                      </div>
                    ))}
                  </div>
                )}

                <div className="mt-10 pt-6 border-t border-white/[0.08] flex items-center justify-between">
                  <span className="font-mono text-xs text-stone-400">
                    {activeTeacher.resultsCount
                      ? `${activeTeacher.resultsCount}+ o'quvchi natijasi`
                      : "Yetakchi mutaxassis"}
                  </span>
                  <button
                    type="button"
                    onClick={() => onOpenTeacher(activeTeacher.slug || activeTeacher.id)}
                    className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-amber-400 hover:text-amber-300"
                  >
                    Profilni ko‘rish
                    <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>

              <div className="lg:col-span-5 rounded-2xl border border-white/[0.08] bg-[#07090d] p-8 text-center flex flex-col items-center justify-center relative shadow-inner overflow-hidden">
                <div className="h-32 w-32 rounded-full border border-amber-400/30 bg-amber-400/[0.05] flex items-center justify-center font-serif text-5xl font-bold text-amber-400 shadow-[0_0_40px_rgba(245,158,11,0.15)]">
                  {activeTeacher.name.charAt(0)}
                </div>

                <div className="mt-6 font-serif text-3xl font-bold text-stone-100">
                  {activeTeacher.experienceYears} Yil
                </div>
                <div className="font-mono text-[10px] uppercase tracking-widest text-stone-500">
                  Pedagogik Tajriba
                </div>

                <div className="mt-6 w-full pt-6 border-t border-white/[0.08] grid grid-cols-2 gap-4 text-center">
                  <div className="border-r border-white/[0.08] pr-2">
                    <div className="font-serif text-xl font-bold text-amber-400">100%</div>
                    <div className="text-[9px] font-mono text-stone-400 uppercase">OTM Qamrovi</div>
                  </div>
                  <div className="pl-2">
                    <div className="font-serif text-xl font-bold text-emerald-400">Grant</div>
                    <div className="text-[9px] font-mono text-stone-400 uppercase">Talabalari</div>
                  </div>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
}

/* ============================================================================
   SECTION 09: FANLAR (ACADEMIC DOCKET REGISTER)
============================================================================ */

function SubjectsAcademicRegister({
  items,
  activeSubjectIndex,
  setActiveSubjectIndex,
  onRegisterClick,
}: {
  items: typeof SUBJECT_ITEMS;
  activeSubjectIndex: number;
  setActiveSubjectIndex: (i: number) => void;
  onRegisterClick: () => void;
}) {
  const containerRef = useRef<HTMLElement | null>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"],
  });
  const smooth = useSpring(scrollYProgress, { stiffness: 90, damping: 25 });

  const current = items[activeSubjectIndex] || items[0];

  return (
    <section
      id="fanlar"
      ref={containerRef}
      className="scroll-mt-20 border-b border-white/[0.08] bg-[#080b10] py-28 sm:py-36 overflow-hidden relative"
    >
      <div className="mx-auto max-w-[1400px] px-6 sm:px-8 lg:px-12 relative z-10">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 border-b border-white/[0.08] pb-10">
          <ScrollFocusedHeader
            eyebrow="06 / AKADEMIK RO'YXAT"
            title="Fanlar & Yo‘nalishlar"
            subtitle="Fan → Dastur → Mas'ul Pedagog bog'liqligi."
            progress={smooth}
            align="left"
          />
          <RollingNumber current={activeSubjectIndex + 1} total={items.length} />
        </div>

        <div className="mt-12 grid lg:grid-cols-12 gap-10 items-start">
          {/* Left Docket List */}
          <div className="lg:col-span-5 space-y-2.5">
            {items.map((it, idx) => {
              const isActive = activeSubjectIndex === idx;

              return (
                <button
                  key={it.step}
                  type="button"
                  onClick={() => setActiveSubjectIndex(idx)}
                  className={[
                    "w-full text-left p-4 sm:p-5 rounded-2xl border transition-all duration-300 flex items-center justify-between focus:outline-none",
                    isActive
                      ? "border-amber-400 bg-amber-400/[0.08] shadow-[0_4px_25px_rgba(245,158,11,0.15)] opacity-100 scale-100"
                      : "border-white/[0.06] bg-[#0c1017] opacity-35 hover:opacity-80 scale-98",
                  ].join(" ")}
                >
                  <div className="flex items-center gap-4">
                    <span
                      className={[
                        "font-mono text-xs font-bold",
                        isActive ? "text-amber-400" : "text-stone-500",
                      ].join(" ")}
                    >
                      {it.step}
                    </span>
                    <span className="font-serif text-base sm:text-lg text-stone-100">
                      {it.subject}
                    </span>
                  </div>
                  <ChevronRight
                    className={[
                      "h-4 w-4 transition-transform",
                      isActive ? "text-amber-400 translate-x-1" : "text-stone-600",
                    ].join(" ")}
                  />
                </button>
              );
            })}
          </div>

          {/* Right Focused Dossier Card */}
          <div className="lg:col-span-7 relative">
            <AnimatePresence mode="wait">
              <motion.div
                key={current.step}
                initial={{ opacity: 0, x: 25, filter: "blur(4px)" }}
                animate={{ opacity: 1, x: 0, filter: "blur(0px)" }}
                exit={{ opacity: 0, x: -25, filter: "blur(4px)" }}
                transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                className="rounded-3xl border border-amber-400/30 bg-[#0c1017] p-8 sm:p-12 relative shadow-2xl"
              >
                <div className="font-mono text-[10px] uppercase tracking-widest text-amber-400 font-bold mb-2">
                  AKADEMIK DOSSIYE // {current.step}
                </div>
                <h3 className="font-serif text-[clamp(2rem,3.2vw,3.2rem)] leading-tight text-stone-100">
                  {current.subject}
                </h3>

                <p className="mt-6 text-sm sm:text-base leading-relaxed text-stone-300">
                  {current.description}
                </p>

                <div className="mt-8 p-5 rounded-2xl border border-white/[0.08] bg-white/[0.02]">
                  <div className="text-[10px] font-mono uppercase tracking-widest text-stone-500 mb-2">
                    Qamrab Olingan Imtihonlar & Targetlar:
                  </div>
                  <div className="font-mono text-sm text-amber-400 font-semibold">
                    {current.programs}
                  </div>
                </div>

                <div className="mt-8 pt-6 border-t border-white/[0.08] flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-mono uppercase text-stone-500">
                      Mas'ul Pedagog:
                    </span>
                    <div className="font-serif text-lg font-bold text-stone-100 mt-0.5">
                      {current.teacher}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={onRegisterClick}
                    className="inline-flex items-center gap-2 rounded-full bg-amber-400 px-6 py-2.5 text-[10px] font-bold uppercase tracking-[0.14em] text-black hover:bg-amber-300 transition-all shadow-md"
                  >
                    Darsga yozilish
                    <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ============================================================================
   SECTION 10: REAL NATIJALAR (EVIDENCE ARCHIVE)
============================================================================ */

function ResultsBenchmarkArchive({
  results,
  activeResultIndex,
  setActiveResultIndex,
  hoveredResultId,
  setHoveredResultId,
  selectedFilter,
  setSelectedFilter,
}: {
  results: StudentResult[];
  activeResultIndex: number;
  setActiveResultIndex: (i: number) => void;
  hoveredResultId: string | null;
  setHoveredResultId: (id: string | null) => void;
  selectedFilter: string;
  setSelectedFilter: (f: string) => void;
}) {
  const containerRef = useRef<HTMLElement | null>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"],
  });
  const smooth = useSpring(scrollYProgress, { stiffness: 90, damping: 25 });

  const activeStudent =
    (hoveredResultId ? results.find((r) => r.id === hoveredResultId) : null) ||
    results[activeResultIndex] ||
    results[0];

  return (
    <section
      id="natijalar"
      ref={containerRef}
      className="scroll-mt-20 border-b border-white/[0.08] bg-[#07090d] py-28 sm:py-36 overflow-hidden"
    >
      <div className="mx-auto max-w-[1400px] px-6 sm:px-8 lg:px-12">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 border-b border-white/[0.08] pb-10">
          <ScrollFocusedHeader
            eyebrow="07 / REAL NATIJALAR"
            title="Bitiruvchilar Natijalari"
            subtitle="Natija — tizimli tayyorgarlikning eng aniq dalili."
            progress={smooth}
            align="left"
          />

          <div className="flex flex-wrap gap-2">
            {["BARCHASI", "DTM", "CEFR", "MILLIY SERTIFIKAT"].map((filter) => {
              const isActive = selectedFilter === filter;
              return (
                <button
                  key={filter}
                  type="button"
                  onClick={() => setSelectedFilter(filter)}
                  className={[
                    "relative rounded-full px-5 py-2 text-[10px] font-mono font-bold uppercase tracking-widest transition-colors focus:outline-none",
                    isActive ? "text-black" : "border border-white/10 bg-[#0d1118] text-stone-400 hover:text-stone-200",
                  ].join(" ")}
                >
                  {isActive && (
                    <motion.div
                      layoutId="result-filter-pill"
                      className="absolute inset-0 rounded-full bg-amber-400 shadow-[0_0_20px_rgba(245,158,11,0.3)]"
                      transition={{ type: "spring", stiffness: 380, damping: 30 }}
                    />
                  )}
                  <span className="relative z-10">{filter}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="mt-12 grid lg:grid-cols-12 gap-10 items-start">
          <motion.div layout className="lg:col-span-8 divide-y divide-white/[0.06]">
            <AnimatePresence mode="popLayout">
              {results.map((res, index) => {
                const isTargeted =
                  hoveredResultId !== null
                    ? hoveredResultId === res.id
                    : activeResultIndex === index;

                return (
                  <motion.div
                    layout
                    key={res.id}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.3 }}
                    onClick={() => setActiveResultIndex(index)}
                    onMouseEnter={() => {
                      setHoveredResultId(res.id);
                      setActiveResultIndex(index);
                    }}
                    onMouseLeave={() => setHoveredResultId(null)}
                    className={[
                      "py-6 sm:py-8 px-4 sm:px-8 flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all duration-300 relative group cursor-pointer rounded-2xl",
                      isTargeted
                        ? "border border-amber-400 bg-white/[0.05] shadow-[0_0_30px_rgba(245,158,11,0.12)] opacity-100 scale-[1.01]"
                        : "border border-transparent opacity-40 hover:opacity-85 hover:border-white/10",
                    ].join(" ")}
                  >
                    <div className="flex items-center gap-6">
                      <span
                        className={[
                          "font-mono text-xs font-bold transition-colors",
                          isTargeted ? "text-amber-400" : "text-stone-500",
                        ].join(" ")}
                      >
                        0{index + 1}
                      </span>
                      <div>
                        <div className="flex items-center gap-3">
                          <h4 className="font-serif text-2xl sm:text-3xl text-stone-100 group-hover:text-amber-300 transition-colors">
                            {res.name}
                          </h4>
                          {res.badge && (
                            <span className="hidden sm:inline-block rounded-full bg-emerald-400/10 border border-emerald-400/20 px-2.5 py-0.5 text-[9px] font-mono font-bold text-emerald-400 uppercase">
                              {res.badge}
                            </span>
                          )}
                        </div>
                        {res.university && (
                          <p className="text-xs text-stone-400 mt-1.5 flex items-center gap-2 font-mono">
                            <GraduationCap className="h-3.5 w-3.5 text-amber-400 shrink-0" />
                            {res.university}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="text-left md:text-right pl-10 md:pl-0 flex md:flex-col items-center md:items-end justify-between md:justify-center gap-2">
                      <div className="font-serif text-3xl sm:text-4xl font-bold text-amber-400 leading-none">
                        {res.score}
                      </div>
                      <span className="block text-[9px] font-mono uppercase tracking-widest text-stone-500">
                        {res.examType} // {res.year || "2025"}
                      </span>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </motion.div>

          <div className="lg:col-span-4 sticky top-28 hidden lg:block">
            {activeStudent && (
              <div className="rounded-3xl border border-amber-400/40 bg-[#0c1017] p-8 relative shadow-2xl">
                <div className="flex items-center justify-between border-b border-white/[0.08] pb-4">
                  <span className="font-mono text-[10px] font-bold text-amber-400 uppercase tracking-widest">
                    SCROLL // 0{activeResultIndex + 1} OF 0{results.length}
                  </span>
                  <span className="font-mono text-[10px] text-stone-500 uppercase tracking-widest">
                    NATIJA // {activeStudent.examType}
                  </span>
                </div>

                <div className="mt-8 text-center">
                  <div className="font-mono text-xs uppercase tracking-widest text-stone-400">
                    Qayd etilgan natija
                  </div>
                  <div className="mt-2 font-serif text-5xl font-bold text-amber-400 leading-none">
                    {activeStudent.score}
                  </div>
                  <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-400/10 border border-emerald-400/20 text-emerald-400 text-[10px] font-mono font-bold uppercase">
                    <ShieldCheck className="h-3.5 w-3.5" />
                    {activeStudent.badge || "Tasdiqlangan Natija"}
                  </div>
                </div>

                <div className="mt-8 space-y-4 pt-6 border-t border-white/[0.08]">
                  <div>
                    <span className="text-[10px] font-mono uppercase text-stone-500">
                      O'quvchi:
                    </span>
                    <div className="font-serif text-xl font-bold text-stone-100 mt-0.5">
                      {activeStudent.name}
                    </div>
                  </div>

                  <div>
                    <span className="text-[10px] font-mono uppercase text-stone-500">
                      Tavsiya etilgan OTM:
                    </span>
                    <div className="text-xs font-mono text-stone-300 mt-1 leading-relaxed">
                      {activeStudent.university}
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2 text-[10px] font-mono text-stone-500">
                    <span>Mavsum: {activeStudent.year || "2025"}</span>
                    <span className="text-amber-400 font-bold">RENESSANS TIZIMI</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ============================================================================
   SECTION 11: FAQ (INTERACTIVE ACCORDION WITH SCROLL FOCUS)
============================================================================ */

function FAQSection({
  faqs,
  openFaq,
  setOpenFaq,
}: {
  faqs: FAQItem[];
  openFaq: string | null;
  setOpenFaq: (id: string | null) => void;
}) {
  const containerRef = useRef<HTMLElement | null>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"],
  });
  const smooth = useSpring(scrollYProgress, { stiffness: 90, damping: 25 });

  return (
    <section
      id="faq"
      ref={containerRef}
      className="scroll-mt-20 border-b border-white/[0.08] bg-[#07090d] py-28 sm:py-36"
    >
      <div className="mx-auto max-w-[1000px] px-6 sm:px-8">
        <ScrollFocusedHeader
          eyebrow="08 / SAVOLLAR"
          title="Ko‘p So‘raladigan Savollar"
          subtitle="Aniq savollarga — ochiq va professional javoblar."
          progress={smooth}
        />

        <div className="mt-14 divide-y divide-white/[0.08] border-y border-white/[0.08]">
          {faqs.map((faq, index) => {
            const isOpen = openFaq === faq.id;
            return (
              <div
                key={faq.id}
                className={[
                  "py-6 sm:py-8 transition-colors duration-300 relative pl-4 sm:pl-6",
                  isOpen ? "bg-white/[0.015]" : "",
                ].join(" ")}
              >
                {isOpen && (
                  <motion.div
                    layoutId="faq-accent-line"
                    className="absolute left-0 top-6 bottom-6 w-1 rounded-full bg-amber-400 shadow-[0_0_10px_#f59e0b]"
                    transition={{ type: "spring", stiffness: 380, damping: 30 }}
                  />
                )}

                <button
                  type="button"
                  onClick={() => setOpenFaq(isOpen ? null : faq.id)}
                  className="w-full text-left flex items-center justify-between gap-6 group focus:outline-none"
                >
                  <div className="flex items-center gap-5 sm:gap-6">
                    <span
                      className={[
                        "font-mono text-xs sm:text-sm font-bold transition-colors",
                        isOpen ? "text-amber-400" : "text-stone-500",
                      ].join(" ")}
                    >
                      0{index + 1}
                    </span>
                    <span
                      className={[
                        "font-serif text-lg sm:text-2xl transition-colors",
                        isOpen ? "text-amber-400" : "text-stone-200 group-hover:text-amber-300",
                      ].join(" ")}
                    >
                      {faq.question}
                    </span>
                  </div>
                  <div
                    className={[
                      "flex h-9 w-9 shrink-0 items-center justify-center rounded-full border transition-all duration-300",
                      isOpen
                        ? "border-amber-400 bg-amber-400 text-black rotate-180"
                        : "border-white/10 text-stone-400 group-hover:border-amber-400/50 group-hover:text-stone-200",
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
                      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                      className="overflow-hidden"
                    >
                      <p className="mt-5 pl-8 sm:pl-10 text-sm sm:text-base leading-relaxed text-stone-300 max-w-3xl">
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
  );
}

/* ============================================================================
   SECTION 12: MANZIL (GEOGRAPHIC DEPTH)
============================================================================ */

function CampusMapSection() {
  const containerRef = useRef<HTMLElement | null>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"],
  });
  const smooth = useSpring(scrollYProgress, { stiffness: 90, damping: 25 });
  const reduceMotion = useReducedMotion();

  const mapScale = useTransform(smooth, [0, 1], reduceMotion ? [1, 1] : [1, 1.08]);
  const mapGridX = useTransform(smooth, [0, 1], reduceMotion ? [0, 0] : [-20, 20]);
  const beaconY = useTransform(smooth, [0, 1], reduceMotion ? [0, 0] : [20, -10]);

  return (
    <section
      id="manzil"
      ref={containerRef}
      className="scroll-mt-20 border-b border-white/[0.08] bg-[#0a0d13] py-28 sm:py-36 overflow-hidden"
    >
      <div className="mx-auto max-w-[1400px] px-6 sm:px-8 lg:px-12">
        <div className="grid lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-6">
            <ScrollFocusedHeader
              eyebrow="09 / YAGONA RASMIY BINOMIZ"
              title={
                <>
                  YANGIOBOD <br />
                  <span className="italic text-amber-400">1-MAKTAB</span>
                </>
              }
              progress={smooth}
              align="left"
            />

            <p className="mt-6 text-base text-stone-300 leading-relaxed max-w-lg">
              RENESSANS O'quv Markazi Yangiobod tumani markazidagi yagona asosiy
              binoda — 1-sonli umumiy o'rta ta'lim maktabi binosida faoliyat ko'rsatadi.
            </p>

            <div className="mt-10 space-y-6">
              <div className="flex items-start gap-4">
                <motion.div
                  style={{ y: beaconY }}
                  className="flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-400/10 text-amber-400 border border-amber-400/20 shrink-0 shadow-[0_0_20px_rgba(245,158,11,0.2)]"
                >
                  <MapPin className="h-5 w-5" />
                </motion.div>
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
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-400/10 text-amber-400 border border-amber-400/20 shrink-0">
                  <Clock3 className="h-5 w-5" />
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
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-400/10 text-amber-400 border border-amber-400/20 shrink-0">
                  <Send className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-[10px] font-mono uppercase tracking-widest text-amber-400 font-bold">
                    RASMIY TELEGRAM:
                  </div>
                  <a
                    href="https://t.me/D_Furqatovich"
                    target="_blank"
                    rel="noreferrer"
                    className="text-sm font-medium text-stone-200 hover:text-amber-400 transition-colors mt-1 inline-flex items-center gap-1.5"
                  >
                    @D_Furqatovich
                    <ArrowUpRight className="h-3.5 w-3.5" />
                  </a>
                </div>
              </div>
            </div>
          </div>

          <motion.div
            style={{ scale: mapScale }}
            className="lg:col-span-6 rounded-3xl border border-white/[0.1] bg-[#0c1017] p-8 sm:p-12 relative overflow-hidden shadow-2xl"
          >
            <motion.div
              style={{ x: mapGridX }}
              className="absolute top-0 right-0 p-6 opacity-20 pointer-events-none"
            >
              <svg width="200" height="200" viewBox="0 0 100 100" fill="none">
                <circle cx="50" cy="50" r="45" stroke="#f59e0b" strokeWidth="0.8" strokeDasharray="3 3" />
                <rect x="25" y="25" width="50" height="50" stroke="#f59e0b" strokeWidth="1" />
                <line x1="0" y1="50" x2="100" y2="50" stroke="#f59e0b" strokeWidth="0.5" />
                <line x1="50" y1="0" x2="50" y2="100" stroke="#f59e0b" strokeWidth="0.5" />
              </svg>
            </motion.div>

            <div className="font-mono text-[10px] uppercase tracking-widest text-stone-500">
              KOORDINATA & BOG'LANISH //
            </div>
            <h3 className="font-serif text-3xl text-stone-100 mt-2">
              Qo'ng'iroq Qiling
            </h3>
            <p className="text-sm text-stone-400 mt-2">
              O'quv bo'limi sizga dars jadvali va bepul sinov darsi vaqtini belgilab beradi:
            </p>

            <div className="mt-8 space-y-4 relative z-10">
              <a
                href="tel:+998886484949"
                className="flex items-center justify-between p-5 rounded-2xl border border-white/[0.08] bg-white/[0.02] hover:border-amber-400/40 hover:bg-amber-400/[0.04] transition-all group"
              >
                <div className="flex items-center gap-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-400/10 text-amber-400">
                    <Phone className="h-5 w-5" />
                  </div>
                  <div>
                    <span className="block font-mono text-lg font-bold text-stone-100 group-hover:text-amber-400 transition-colors">
                      +998 (88) 648-49-49
                    </span>
                    <span className="text-[10px] font-mono uppercase tracking-wider text-stone-500">
                      Asosiy aloqa liniyasi
                    </span>
                  </div>
                </div>
                <ArrowRight className="h-4 w-4 text-stone-500 group-hover:text-amber-400 group-hover:translate-x-1 transition-all" />
              </a>

              <a
                href="tel:+998992593232"
                className="flex items-center justify-between p-5 rounded-2xl border border-white/[0.08] bg-white/[0.02] hover:border-amber-400/40 hover:bg-amber-400/[0.04] transition-all group"
              >
                <div className="flex items-center gap-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-400/10 text-amber-400">
                    <Phone className="h-5 w-5" />
                  </div>
                  <div>
                    <span className="block font-mono text-lg font-bold text-stone-100 group-hover:text-amber-400 transition-colors">
                      +998 (99) 259-32-32
                    </span>
                    <span className="text-[10px] font-mono uppercase tracking-wider text-stone-500">
                      Ma'muriyat & Maslahat
                    </span>
                  </div>
                </div>
                <ArrowRight className="h-4 w-4 text-stone-500 group-hover:text-amber-400 group-hover:translate-x-1 transition-all" />
              </a>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

/* ============================================================================
   SECTION 13: KONSULTATSIYA (CINEMATIC CONVERSION SCENE)
============================================================================ */

function ConsultationSceneSection({
  formName,
  setFormName,
  formPhone,
  setFormPhone,
  formSubject,
  setFormSubject,
  isSubmitting,
  isSubmitted,
  setIsSubmitted,
  submitError,
  handleFormSubmit,
}: {
  formName: string;
  setFormName: (v: string) => void;
  formPhone: string;
  setFormPhone: (v: string) => void;
  formSubject: string;
  setFormSubject: (v: string) => void;
  isSubmitting: boolean;
  isSubmitted: boolean;
  setIsSubmitted: (v: boolean) => void;
  submitError: string;
  handleFormSubmit: (e: React.FormEvent<HTMLFormElement>) => Promise<void>;
}) {
  const containerRef = useRef<HTMLElement | null>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"],
  });
  const smooth = useSpring(scrollYProgress, { stiffness: 90, damping: 25 });
  const reduceMotion = useReducedMotion();

  // Scroll focus on headline: approaches with blur -> sharp focus hold -> recedes
  const titleOpacity = useTransform(smooth, [0, 0.2, 0.7, 1], [0.35, 1, 1, 0.35]);
  const titleY = useTransform(smooth, [0, 0.2, 0.7, 1], reduceMotion ? [0, 0, 0, 0] : [35, 0, 0, -25]);
  const titleScale = useTransform(smooth, [0, 0.2, 0.7, 1], reduceMotion ? [1, 1, 1, 1] : [0.96, 1, 1, 0.96]);
  const titleFilter = useTransform(
    smooth,
    [0, 0.2, 0.7, 1],
    reduceMotion ? ["blur(0px)", "blur(0px)", "blur(0px)", "blur(0px)"] : ["blur(3px)", "blur(0px)", "blur(0px)", "blur(3px)"]
  );

  return (
    <section
      id="konsultatsiya"
      ref={containerRef}
      className="scroll-mt-20 bg-[#07090d] py-28 sm:py-36 relative overflow-hidden"
    >
      <div className="mx-auto max-w-[1400px] px-6 sm:px-8 lg:px-12 relative z-10">
        <div className="rounded-[36px] border border-amber-400/30 bg-[#0b0f17] p-8 sm:p-14 relative overflow-hidden shadow-2xl">
          <div className="grid lg:grid-cols-12 gap-12 items-center relative">
            <motion.div
              style={{ opacity: titleOpacity, y: titleY, scale: titleScale, filter: titleFilter }}
              className="lg:col-span-6"
            >
              <span className="font-mono text-[10px] font-bold uppercase tracking-[0.25em] text-amber-400">
                10 / RO‘YXATDAN O‘TISH
              </span>

              <div className="mt-4 flex items-center gap-3 font-mono text-xs text-stone-500 uppercase tracking-widest">
                <span>MAQSAD</span>
                <ArrowRight className="h-3 w-3 text-amber-400" />
                <span>TIZIM</span>
                <ArrowRight className="h-3 w-3 text-amber-400" />
                <span className="text-emerald-400 font-bold">NATIJA</span>
              </div>

              <h2 className="mt-4 font-serif text-[clamp(2.4rem,4.5vw,4.4rem)] leading-[0.95] text-stone-100">
                Bepul Sinov Darsiga
                <br />
                <span className="italic text-amber-400">Hoziroq Yoziling</span>
              </h2>

              <p className="mt-6 text-sm sm:text-base text-stone-300 leading-relaxed max-w-lg">
                Ismingiz va telefon raqamingizni qoldiring. Administratorimiz siz bilan
                bog‘lanib, diagnostik test va sinov darsi vaqtini belgilaydi.
              </p>
            </motion.div>

            <div className="lg:col-span-6 rounded-3xl border border-white/[0.1] bg-[#07090d] p-6 sm:p-10 shadow-xl">
              <AnimatePresence mode="wait">
                {isSubmitted ? (
                  <motion.div
                    key="success"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ duration: 0.4 }}
                    className="text-center py-10"
                  >
                    <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-400/10 text-emerald-400 border border-emerald-400/30">
                      <CheckCircle2 className="h-8 w-8" />
                    </div>
                    <h3 className="mt-5 font-serif text-2xl sm:text-3xl text-stone-100">
                      Arizangiz Muvaffaqiyatli Qabul Qilindi!
                    </h3>
                    <p className="mt-3 text-xs font-mono text-stone-400">
                      Tez orada administratorimiz siz bilan bog'lanadi.
                    </p>
                    <button
                      type="button"
                      onClick={() => setIsSubmitted(false)}
                      className="mt-6 rounded-full border border-white/20 px-6 py-2 text-xs font-mono uppercase text-stone-300 hover:text-white"
                    >
                      Boshqa ariza qoldirish
                    </button>
                  </motion.div>
                ) : (
                  <motion.form
                    key="form"
                    onSubmit={handleFormSubmit}
                    className="space-y-4"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
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
                        className="w-full min-h-12 rounded-xl border border-white/[0.1] bg-white/[0.03] px-4 text-sm text-stone-100 outline-none focus:border-amber-400/70 focus:bg-amber-400/[0.02] transition-all"
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
                        className="w-full min-h-12 rounded-xl border border-white/[0.1] bg-white/[0.03] px-4 text-sm text-stone-100 outline-none focus:border-amber-400/70 focus:bg-amber-400/[0.02] transition-all"
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
                        className="w-full min-h-12 rounded-xl border border-white/[0.1] bg-[#0c1017] px-4 text-sm text-stone-100 outline-none focus:border-amber-400/70 transition-colors"
                      >
                        <option value="">Yo‘nalishni tanlang</option>
                        <option value="Tarix • Huquq • Geografiya">
                          Tarix • Huquq • Geografiya (DTM)
                        </option>
                        <option value="Matematika & Prezident Maktabi">
                          Matematika & Prezident Maktabi
                        </option>
                        <option value="CEFR Ingliz Tili (B2 / C1)">
                          CEFR Ingliz Tili (B2 / C1)
                        </option>
                        <option value="General & Kids English">
                          General & Kids English (3–10 yosh)
                        </option>
                        <option value="Mental Arifmetika">
                          Mental Arifmetika & Tez Hisob
                        </option>
                        <option value="Ona Tili va Adabiyot">
                          Ona Tili va Adabiyot (Milliy Sertifikat)
                        </option>
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
                      className="w-full min-h-12 rounded-xl bg-amber-400 px-6 text-[11px] font-bold uppercase tracking-[0.14em] text-black transition-all hover:bg-amber-300 disabled:opacity-50 flex items-center justify-center gap-2 mt-2 shadow-[0_4px_20px_rgba(245,158,11,0.25)]"
                    >
                      {isSubmitting ? "Yuborilmoqda..." : "Bepul Sinov Darsiga Yozilish"}
                      <ArrowRight className="h-4 w-4" />
                    </button>
                  </motion.form>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default RenessansLandingPage;
