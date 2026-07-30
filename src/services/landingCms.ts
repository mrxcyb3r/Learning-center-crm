import { doc, onSnapshot, setDoc, getDoc } from 'firebase/firestore';
import { db } from './firebase';
import { LandingPageContent } from '../types';
import { mockTeachers, mockCourses, mockResults, mockFAQs } from '../data/mockData';

export const DEFAULT_LANDING_PAGE_CONTENT: LandingPageContent = {
  lightModeBgImage: 'https://i.ibb.co/YTjMPbcZ/image.png',
  darkModeBgImage: 'https://i.ibb.co/Wv1yrFwC/image.png',

  locationBadgeUz: "Toshkent / Markaziy Filial",
  locationBadgeEn: "Tashkent / Main Branch",

  heroTitleUz: "INNOVATSION TA'LIM VA YUQORI NATIJALAR",
  heroTitleEn: "INNOVATIVE EDUCATION & HIGH RESULTS",

  heroSubtitleUz: "Sifatli ta'lim, kuchli o'qituvchilar va zamonaviy o'quv muhiti bilan kelajagingizni biz bilan quring.",
  heroSubtitleEn: "Build your future with high-quality education, expert mentors, and a modern learning environment.",

  heroDescUz: "Renessans Learning Center bilan zamonaviy ta'lim standartlari, xalqaro tajribaga ega ustozlar hamda IT va ingliz tili bo'yicha yuqori marralarni zabt eting.",
  heroDescEn: "Achieve top goals in IT and English language learning with modern educational standards and experienced international tutors at Renessans Learning Center.",

  ctaPrimaryUz: "Kurslarni ko'rish",
  ctaPrimaryEn: "Explore Courses",

  ctaSecondaryUz: "Bog'lanish",
  ctaSecondaryEn: "Get in Touch",

  activeStudentsCount: "1,500+",
  ieltsHighResults: "280+",
  admissionRate: "95%",
  yearsExperience: "4+ Yil",

  whyRenessans: [
    {
      id: 'w1',
      iconNumber: 1,
      titleUz: "Individual Yondashuv",
      titleEn: "Individual Approach",
      descUz: "Har bir o'quvchining bilim darajasi va shaxsiy maqsadlariga moslashtirilgan o'quv rejasi.",
      descEn: "Personalized study plans tailored to each student level and goals."
    },
    {
      id: 'w2',
      iconNumber: 2,
      titleUz: "Tajribali Mentorlar (IELTS 8.0+ & CEFR C1)",
      titleEn: "Experienced Mentors (IELTS 8.0+ & CEFR C1)",
      descUz: "Xalqaro sertifikat va ko'p yillik amaliy pedagogik tajribaga ega bo'lgan kuchli ustozlar jamoasi.",
      descEn: "Qualified specialists with international certificates and teaching experience."
    },
    {
      id: 'w3',
      iconNumber: 3,
      titleUz: "IT va Zamonaviy Sharoit",
      titleEn: "IT & Modern Facilities",
      descUz: "Zamonaviy kompyuter sinflari, qulay va shinam o'quv xonalari hamda yuqori tezlikdagi internet.",
      descEn: "State-of-the-art computer labs, comfortable classrooms, and high-speed internet."
    },
    {
      id: 'w4',
      iconNumber: 4,
      titleUz: "Muntazam Mock Testlar",
      titleEn: "Regular Mock Tests",
      descUz: "Haqiqiy imtihon muhitidagi doimiy sinovlar, individual feedback va natijalar tahlili.",
      descEn: "Simulated real exam conditions with detailed performance analytics."
    }
  ],

  teachers: mockTeachers,
  results: mockResults,

  testimonials: [
    {
      id: 't1',
      quoteUz: "Renessans LC dagi intensiv IELTS kursi va Jasur ustozning feedbacklari tufayli birinchi urinishdayoq 8.5 ball oldim va Westminster universitetiga 100% grant yutdim!",
      quoteEn: "Thanks to the intensive IELTS course at Renessans LC and mentor Jasur's detailed feedback, I secured an overall 8.5 score on my first try and earned a 100% scholarship at Westminster University!",
      studentName: "Diyorbek Toshpulatov",
      scoreBadge: "IELTS 8.5",
      targetCourse: "IELTS Intensive",
      university: "Westminster Int. University",
      photoUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200"
    },
    {
      id: 't2',
      quoteUz: "CEFR FastTrack kursi va Malika opaning maxsus grammatika va reading usullari menga Milliy sertifikatdan C1 darajasini olishda juda katta yordam berdi.",
      quoteEn: "The CEFR FastTrack course along with Malika's specialized grammar and reading techniques helped me achieve a C1 National Certificate effortlessly.",
      studentName: "Nigora Shavkatova",
      scoreBadge: "CEFR C1",
      targetCourse: "CEFR FastTrack",
      university: "INHA University Tashkent",
      photoUrl: "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&q=80&w=200"
    },
    {
      id: 't3',
      quoteUz: "IT & Python dasturlash kursida noldan boshlab o'rgandim. Ustozimiz Nodirbek amaliy loyihalar va algoritmlar ustida ishlashni o'rgatdilar.",
      quoteEn: "I learned Python from scratch at Renessans LC. Instructor Nodirbek helped us build real production-ready projects and algorithms.",
      studentName: "Sardorbek Umarov",
      scoreBadge: "Senior Python Dev",
      targetCourse: "IT & Python Programming",
      university: "TUIT (TATU)",
      photoUrl: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&q=80&w=200"
    }
  ],

  courses: mockCourses,
  faqs: mockFAQs,

  addressUz: "Toshkent / Markaziy Filial",
  addressEn: "Tashkent / Main Branch",
  phone: "+998 90 123 45 67",
  telegramHandle: "@renessans_lc_official",
  operatingHoursUz: "Ish vaqti: Dushanba - Shanba 08:00 - 20:00",
  operatingHoursEn: "Operating Hours: Mon-Sat 08:00 - 20:00",
  googleMapsUrl: "https://maps.google.com"
};

const LANDING_SETTINGS_DOC = doc(db, 'settings', 'landing_page_content');
const LOCAL_STORAGE_KEY = 'centerflow_landing_cms_v1';

/**
 * Real-time listener for Landing Page content from Firestore doc(db, 'settings', 'landing_page_content')
 * Fallback smoothly to localStorage or DEFAULT_LANDING_PAGE_CONTENT
 */
export function subscribeLandingPageContent(callback: (content: LandingPageContent) => void) {
  // Initial local cached value or default
  const localSaved = localStorage.getItem(LOCAL_STORAGE_KEY);
  if (localSaved) {
    try {
      callback({ ...DEFAULT_LANDING_PAGE_CONTENT, ...JSON.parse(localSaved) });
    } catch {
      callback(DEFAULT_LANDING_PAGE_CONTENT);
    }
  } else {
    callback(DEFAULT_LANDING_PAGE_CONTENT);
  }

  try {
    return onSnapshot(
      LANDING_SETTINGS_DOC,
      (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.data() as LandingPageContent;
          const merged: LandingPageContent = {
            ...DEFAULT_LANDING_PAGE_CONTENT,
            ...data
          };
          localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(merged));
          callback(merged);
        } else {
          callback(DEFAULT_LANDING_PAGE_CONTENT);
        }
      },
      (error) => {
        console.warn('Firestore landing_page_content snapshot notice:', error);
        // Retain current state or local fallback
      }
    );
  } catch (err) {
    console.warn('Firestore subscription catch warning:', err);
    return () => {};
  }
}

/**
 * Publish changes to Firestore doc(db, 'settings', 'landing_page_content')
 * and save to localStorage
 */
export async function publishLandingPageContent(content: LandingPageContent): Promise<void> {
  const payload = {
    ...content,
    updatedAt: new Date().toISOString()
  };

  localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(payload));

  try {
    await setDoc(LANDING_SETTINGS_DOC, payload, { merge: true });
  } catch (err) {
    console.warn('Firestore setDoc failed, content saved to local storage fallback:', err);
    // Not throwing error to allow offline functionality to succeed
  }
}
