import {
  BookOpen,
  Calculator,
  Languages,
  FlaskConical,
  Code2,
  School,
  Trophy,
  Landmark,
  Atom,
  Baby,
  BookMarked,
  Users,
  GraduationCap,
  Award,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { CourseData } from '../types/crm';
import { getCourseSlug } from '../utils/content';

// ---------------------------------------------------------------------------
// Subject visual system — single source of truth for educational imagery.
//
// Images are hand-curated, license-safe (Unsplash License: free to use, no
// attribution required), stable direct CDN URLs. Every entry also carries a
// gradient + icon so cards degrade gracefully if the image ever fails/404s.
// No official IELTS/College Board logos are used anywhere.
// ---------------------------------------------------------------------------

const u = (id: string, w = 900) =>
  `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=${w}&q=75`;

export interface SubjectVisual {
  key: string;
  label: string;
  alt: string;
  image: string;
  imageLarge: string;
  icon: LucideIcon;
  gradient: string;
  searchTerms: string[];
}

// Curated registry. Keys are matched against course title / slug / category.
export const SUBJECT_VISUALS: Record<string, SubjectVisual> = {
  dtm: {
    key: 'dtm',
    label: "DTM va Milliy Sertifikat",
    alt: 'Talabalar tarix va ijtimoiy-gumanitar fanlardan darsda',
    image: u('1481627834876-b7833e8f5570'),
    imageLarge: u('1481627834876-b7833e8f5570', 1600),
    icon: Landmark,
    gradient: 'from-blue-600 via-blue-500 to-sky-400',
    searchTerms: ['history classroom students', 'social sciences education', 'students studying books', 'law education'],
  },
  math: {
    key: 'math',
    label: 'Matematika va Fizika',
    alt: 'Matematika darsligi va formulalar',
    image: u('1635372722656-389f87a941b7'),
    imageLarge: u('1635372722656-389f87a941b7', 1600),
    icon: Calculator,
    gradient: 'from-emerald-600 via-emerald-500 to-teal-400',
    searchTerms: ['mathematics classroom', 'math equations chalkboard', 'physics classroom', 'students solving math'],
  },
  cefr: {
    key: 'cefr',
    label: 'CEFR Ingliz Tili',
    alt: "Ingliz tili darsida so'zlashuv mashg'uloti",
    image: u('1546410531-bb4caa6b424d'),
    imageLarge: u('1546410531-bb4caa6b424d', 1600),
    icon: Languages,
    gradient: 'from-indigo-600 via-indigo-500 to-purple-400',
    searchTerms: ['english language classroom', 'speaking practice', 'english exam preparation', 'language learning'],
  },
  kids: {
    key: 'kids',
    label: 'English Kids',
    alt: 'Bolalar ingliz tilini o\'yin orqali o\'rganmoqda',
    image: u('1509062522246-3755977927d7'),
    imageLarge: u('1509062522246-3755977927d7', 1600),
    icon: Baby,
    gradient: 'from-pink-600 via-rose-500 to-orange-400',
    searchTerms: ['children learning english', 'kids english classroom', 'children educational games', 'primary classroom'],
  },
  mental: {
    key: 'mental',
    label: 'Mental Arifmetika',
    alt: 'Bolalar mantiqiy hisoblash mashg\'ulotida',
    image: u('1503676260728-1c00da094a0b'),
    imageLarge: u('1503676260728-1c00da094a0b', 1600),
    icon: Calculator,
    gradient: 'from-violet-600 via-purple-500 to-fuchsia-400',
    searchTerms: ['abacus mental arithmetic', 'kids math classroom', 'children solving math', 'abacus education'],
  },
  motherTongue: {
    key: 'motherTongue',
    label: 'Ona Tili va Adabiyot',
    alt: 'Ona tili va adabiyot darsida kitob mutolaa',
    image: u('1457369804613-52c61a468e7d'),
    imageLarge: u('1457369804613-52c61a468e7d', 1600),
    icon: BookMarked,
    gradient: 'from-amber-600 via-orange-500 to-red-400',
    searchTerms: ['literature books', 'language teacher classroom', 'students reading books', 'library education'],
  },
  exam: {
    key: 'exam',
    label: 'Imtihonga Tayyorlov',
    alt: 'Talaba imtihonga tayyorlanmoqda',
    image: u('1523240795612-9a054b0db644'),
    imageLarge: u('1523240795612-9a054b0db644', 1600),
    icon: School,
    gradient: 'from-slate-700 via-slate-600 to-slate-500',
    searchTerms: ['student preparing exam', 'university entrance preparation', 'studying desk', 'test preparation'],
  },
  certificate: {
    key: 'certificate',
    label: 'Sertifikat',
    alt: 'Akademik sertifikat va yutuqlar',
    image: u('1523580846011-d3a5bc25702b'),
    imageLarge: u('1523580846011-d3a5bc25702b', 1600),
    icon: Award,
    gradient: 'from-yellow-600 via-amber-500 to-orange-400',
    searchTerms: ['graduation certificate', 'diploma ceremony', 'academic award', 'graduation caps'],
  },
  science: {
    key: 'science',
    label: 'Tabiiy Fanlar',
    alt: 'Ilmiy laboratoriyada tajriba',
    image: u('1532094349884-543bc11b234d'),
    imageLarge: u('1532094349884-543bc11b234d', 1600),
    icon: FlaskConical,
    gradient: 'from-cyan-600 via-teal-500 to-emerald-400',
    searchTerms: ['science laboratory', 'chemistry experiment', 'physics lab', 'students doing experiment'],
  },
  teacher: {
    key: 'teacher',
    label: 'Ustozlar',
    alt: 'Malakali ustoz dars o\'tmoqda',
    image: u('1580894732444-8ecded7900cd'),
    imageLarge: u('1580894732444-8ecded7900cd', 1600),
    icon: GraduationCap,
    gradient: 'from-sky-600 via-blue-500 to-indigo-400',
    searchTerms: ['teacher explaining lesson', 'professional educator', 'classroom teaching', 'mentor teaching students'],
  },
  classroom: {
    key: 'classroom',
    label: "O'quv Markazi",
    alt: "Zamonaviy o'quv sinf xonasi",
    image: u('1509062522246-3755977927d7'),
    imageLarge: u('1509062522246-3755977927d7', 1600),
    icon: Users,
    gradient: 'from-slate-700 via-slate-600 to-slate-500',
    searchTerms: ['modern classroom', 'students in class', 'school classroom', 'education center'],
  },
  default: {
    key: 'default',
    label: 'Ta\'lim',
    alt: 'Ta\'lim va bilim olish',
    image: u('1503676260728-1c00da094a0b'),
    imageLarge: u('1503676260728-1c00da094a0b', 1600),
    icon: BookOpen,
    gradient: 'from-slate-700 via-slate-600 to-slate-500',
    searchTerms: ['education', 'learning', 'classroom', 'students'],
  },
};

// Keyword → key resolution for semantic matching.
const CATEGORY_ALIASES: Record<string, string> = {
  tarix: 'dtm',
  huquq: 'dtm',
  geografiya: 'dtm',
  'milliy sertifikat': 'dtm',
  'ijtimoiy-gumanitar': 'dtm',
  matematika: 'math',
  fizika: 'math',
  'aniq fanlar': 'math',
  'sat': 'math',
  'cefr': 'cefr',
  'ingliz': 'cefr',
  'chet tillar': 'cefr',
  'english': 'cefr',
  'kids': 'kids',
  'bolalar': 'kids',
  'arifmetika': 'mental',
  'abakus': 'mental',
  'mantiqiy': 'mental',
  "ona tili": 'motherTongue',
  'adabiyot': 'motherTongue',
  'filologiya': 'motherTongue',
};

export function resolveSubjectKey(course: CourseData): string {
  const haystacks = [
    course.slug ?? '',
    course.title,
    course.shortTitle ?? '',
    course.category,
  ].join(' ').toLowerCase();

  for (const [kw, key] of Object.entries(CATEGORY_ALIASES)) {
    if (haystacks.includes(kw)) return key;
  }
  return 'default';
}

export function getSubjectVisual(course: CourseData): SubjectVisual {
  const key = resolveSubjectKey(course);
  return SUBJECT_VISUALS[key] || SUBJECT_VISUALS.default;
}

// ---------------------------------------------------------------------------
// Admin image picker pool — curated, license-safe images grouped by category.
// ---------------------------------------------------------------------------

export const COURSE_IMAGE_POOL: { category: string; options: { key: string; label: string; url: string }[] }[] = [
  {
    category: 'DTM va Milliy Sertifikat',
    options: [
      { key: 'dtm1', label: "Kutubxona / kitoblar", url: u('1481627834876-b7833e8f5570') },
      { key: 'dtm2', label: 'Talabalar darsda', url: u('1523240795612-9a054b0db644') },
      { key: 'dtm3', label: 'Tarix kitoblari', url: u('1457369804613-52c61a468e7d') },
    ],
  },
  {
    category: 'Aniq Fanlar',
    options: [
      { key: 'math1', label: 'Matematika doska', url: u('1635372722656-389f87a941b7') },
      { key: 'math2', label: 'Ilmiy laboratoriya', url: u('1532094349884-543bc11b234d') },
      { key: 'math3', label: 'O\'quvchilar darsda', url: u('1503676260728-1c00da094a0b') },
    ],
  },
  {
    category: 'Chet Tillari',
    options: [
      { key: 'lang1', label: "Ingliz tili darsi", url: u('1546410531-bb4caa6b424d') },
      { key: 'lang2', label: 'Kitobxona', url: u('1481627834876-b7833e8f5570') },
      { key: 'lang3', label: 'Aloqa / so\'zlashuv', url: u('1523240795612-9a054b0db644') },
    ],
  },
  {
    category: 'Bolalar Dasturi',
    options: [
      { key: 'kids1', label: 'Bolalar sinfi', url: u('1509062522246-3755977927d7') },
      { key: 'kids2', label: 'Boshlang\'ich ta\'lim', url: u('1503676260728-1c00da094a0b') },
    ],
  },
  {
    category: 'Mantiqiy Rivojlanish',
    options: [
      { key: 'mental1', label: 'Mantiqiy mashg\'ulot', url: u('1503676260728-1c00da094a0b') },
      { key: 'mental2', label: 'Bolalar ta\'limi', url: u('1509062522246-3755977927d7') },
    ],
  },
  {
    category: 'DTM Majburiy & Asosiy',
    options: [
      { key: 'lit1', label: 'Kutubxona', url: u('1457369804613-52c61a468e7d') },
      { key: 'lit2', label: 'Kitob mutolaa', url: u('1481627834876-b7833e8f5570') },
    ],
  },
];

export function getImagePoolForCategory(category: string) {
  const entry = COURSE_IMAGE_POOL.find(
    (p) => p.category.toLowerCase() === (category || '').toLowerCase()
  );
  return entry?.options ?? [];
}

// Extra visuals for achievement / certificate cards.
export const ACHIEVEMENT_VISUAL = {
  ...SUBJECT_VISUALS.certificate,
};