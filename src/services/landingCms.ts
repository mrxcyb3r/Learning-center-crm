import { doc, onSnapshot, setDoc, getDoc } from 'firebase/firestore';
import { db } from './firebase';
import { LandingPageContent } from '../types';
import { mockTeachers, mockCourses, mockResults, mockFAQs } from '../data/mockData';

export const DEFAULT_LANDING_PAGE_CONTENT: LandingPageContent = {
  lightModeBgImage: 'https://i.ibb.co/YTjMPbcZ/image.png',
  darkModeBgImage: 'https://i.ibb.co/Wv1yrFwC/image.png',

  locationBadgeUz: "CenterFlow / O'quv Markazlari Operatsion Tizimi",
  locationBadgeEn: "CenterFlow / Learning Center Operating System",
  locationBadgeRu: "CenterFlow / Операционная Система Учебных Центров",

  aiBadgeUz: "⚡ Barcha Fanlar: Matematika, IT, Fizika, IELTS va SAT Bilan Ishlaydi",
  aiBadgeEn: "⚡ Multi-Subject OS: Math, Coding, Physics, SAT & Languages",
  aiBadgeRu: "⚡ Мультипредметная ОС: Математика, IT, Физика, SAT и Языки",

  heroTitleUz: "CenterFlow: Zamonaviy O'quv Markazlari Boshqaruv Platformasi",
  heroTitleEn: "CenterFlow: The Operating System for Modern Learning Centers",
  heroTitleRu: "CenterFlow: Операционная Система для Современных Учебных Центров",

  heroSubtitleUz: "Matematika, IT/Dasturlash, Fizika, SAT va Tillar markazlari uchun davomat, to'lovlar, ko'p fanli baholash va jonli guruh guruh lentasini bir joyda boshqaring.",
  heroSubtitleEn: "Streamline rosters, 1-tap attendance, multi-subject gradebooks, homework feeds, and automated tuition billing for Math, IT, Physics, SAT, and Language academies.",
  heroSubtitleRu: "Управляйте группами, посещаемостью в 1 клик, оценками по любым предметам, лентой заданий и оплатой обучения для центров математики, IT, физики и языков.",

  heroDescUz: "CenterFlow o'quv markazlari faoliyatini to'liq avtomatlashtiradi: o'quvchilar kontingenti, o'qituvchilar dars jadvali, oylik to'lovlar monitoringi hamda interaktiv uy vazifalari va kod/formula tekshiruvchisi.",
  heroDescEn: "CenterFlow completely automates learning center operations: student rosters, instructor schedules, monthly tuition tracking, interactive problem sets, and code/formula submissions.",
  heroDescRu: "CenterFlow полностью автоматизирует работу учебного центра: списки учащихся, расписание, учет оплаты, интерактивные задания и проверку кода и формул.",

  ctaPrimaryUz: "Demo Tizimni Sinash",
  ctaPrimaryEn: "Try Live Platform Demo",
  ctaPrimaryRu: "Попробовать Демо",

  ctaSecondaryUz: "Markazni Ro'yxatdan O'tkazish",
  ctaSecondaryEn: "Register Your Center",
  ctaSecondaryRu: "Зарегистрировать Центр",

  activeStudentsCount: "12,500+",
  ieltsHighResults: "99.4%",
  admissionRate: "100%",
  yearsExperience: "24/7 Live",

  whyRenessans: [
    {
      id: 'w1',
      iconNumber: 1,
      titleUz: "IT va Kodlash Tizimi (Code IDE)",
      titleEn: "IT & Computer Science Ready",
      titleRu: "IT и Программирование (Code IDE)",
      descUz: "Python, JavaScript, C++ uchun sintaksisli kod muhiti va GitHub omborlariga havola yuborish imkoniyati.",
      descEn: "Built-in code editor for Python, JS, C++ with GitHub repo link tracking and ZIP submissions.",
      descRu: "Встроенный редактор кода Python, JS, C++ с привязкой GitHub репозиториев и загрузкой ZIP."
    },
    {
      id: 'w2',
      iconNumber: 2,
      titleUz: "Matematika va Fizika Yechimlari",
      titleEn: "Math & Physics Problem Sets",
      titleRu: "Математика и Физика (Формулы)",
      descUz: "Interaktiv formula tugmalari (√, x², π, ∫) va qo'lda yozilgan masalalar suratini yuklash imkoniyati.",
      descEn: "Formula helper toolbar with step-by-step problem solver and photo uploads for handwritten scratchwork.",
      descRu: "Панель математических символов с пошаговым решением и загрузкой фото решений от руки."
    },
    {
      id: 'w3',
      iconNumber: 3,
      titleUz: "Til va Imtihonlar (IELTS & SAT)",
      titleEn: "Languages, IELTS & SAT Hub",
      titleRu: "Языки и Экзамены (IELTS & SAT)",
      descUz: "Ovozli darslar (speaking drills), insho so'zlar hisoblagichi va xalqaro band ballar monitoringi.",
      descEn: "Audio voice practice recorder, essay word counters, and comprehensive band score gradebooks.",
      descRu: "Аудиозапись устной речи, счетчик слов для эссе и учет баллов IELTS/CEFR."
    },
    {
      id: 'w4',
      iconNumber: 4,
      titleUz: "Avtomatlashtirilgan To'lov va Davomat",
      titleEn: "1-Tap Attendance & Invoicing",
      titleRu: "Посещаемость в 1 Клик и Оплата",
      descUz: "Guruhlar davomati, qarzdorliklar monitoringi, SMS/Telegram bildirishnomalari va cheklar.",
      descEn: "Instant attendance check-ins, tuition tracking, automated payment balance receipts, and SMS updates.",
      descRu: "Мгновенный учет посещаемости, отслеживание оплаты, балансов и автоматические SMS."
    }
  ],

  teachers: mockTeachers,
  results: mockResults,

  reviewSectionTitleUz: "100% Tasdiqlangan Natijalar va O'quvchilar Muvaffaqiyati",
  reviewSectionTitleEn: "100% Verified Results & Student Success Stories",
  reviewSectionTitleRu: "100% Проверенные Результаты и Истории Успеха",

  reviewSectionSubtitleUz: "Renessans Learning Center bitiruvchilarining real fikrlari va rasmiy natijalari.",
  reviewSectionSubtitleEn: "Real reviews and official band scores from Renessans Learning Center graduates.",
  reviewSectionSubtitleRu: "Реальные отзывы и официальные результаты выпускников Renessans Learning Center.",

  testimonials: [
    {
      id: 't1',
      quoteUz: "Renessans LC dagi intensiv IELTS kursi va Jasur ustozning feedbacklari tufayli birinchi urinishdayoq 8.5 ball oldim va Westminster universitetiga 100% grant yutdim!",
      quoteEn: "Thanks to the intensive IELTS course at Renessans LC and mentor Jasur's detailed feedback, I secured an overall 8.5 band score on my first try and earned a 100% scholarship at Westminster University!",
      quoteRu: "Благодаря интенсивному курсу IELTS в Renessans LC и фидбеку преподавателя Жасура я с первой попытки получила балл 8.5 и 100% грант в Вестминстерский университет!",
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
      quoteRu: "Курс CEFR FastTrack и авторская методика Малики очень помогли мне без труда получить сертификат C1.",
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
      quoteRu: "Я изучил программирование на Python с нуля. Наш ментор Нодирбек научил нас создавать реальные проекты и алгоритмы.",
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
  addressRu: "Ташкент / Главный Филиал",
  phone: "+998 90 123 45 67",
  telegramHandle: "@renessans_lc_official",
  operatingHoursUz: "Ish vaqti: Dushanba - Shanba 08:00 - 20:00",
  operatingHoursEn: "Operating Hours: Mon-Sat 08:00 - 20:00",
  operatingHoursRu: "Режим работы: Пн-Сб 08:00 - 20:00",
  googleMapsUrl: "https://maps.google.com"
};

const LANDING_CMS_DOC = doc(db, 'settings', 'landing_cms');
const LANDING_SETTINGS_DOC = doc(db, 'settings', 'landing_page_content');
const LOCAL_STORAGE_KEY = 'centerflow_landing_cms_v1';

/**
 * Real-time listener for Landing Page content from Firestore doc(db, 'settings', 'landing_cms')
 * Fallback smoothly to settings/landing_page_content, localStorage or DEFAULT_LANDING_PAGE_CONTENT
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
      LANDING_CMS_DOC,
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
          // Fallback check on landing_page_content
          getDoc(LANDING_SETTINGS_DOC).then((oldSnap) => {
            if (oldSnap.exists()) {
              const oldData = oldSnap.data() as LandingPageContent;
              const merged: LandingPageContent = {
                ...DEFAULT_LANDING_PAGE_CONTENT,
                ...oldData
              };
              localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(merged));
              callback(merged);
            } else {
              callback(DEFAULT_LANDING_PAGE_CONTENT);
            }
          }).catch(() => {
            callback(DEFAULT_LANDING_PAGE_CONTENT);
          });
        }
      },
      (error) => {
        console.warn('Firestore landing_cms snapshot notice:', error);
      }
    );
  } catch (err) {
    console.warn('Firestore subscription catch warning:', err);
    return () => {};
  }
}

/**
 * Publish changes to Firestore doc(db, 'settings', 'landing_cms')
 * and doc(db, 'settings', 'landing_page_content') and save to localStorage
 */
export async function publishLandingPageContent(content: LandingPageContent): Promise<void> {
  const payload = {
    ...content,
    updatedAt: new Date().toISOString()
  };

  localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(payload));

  try {
    await Promise.all([
      setDoc(LANDING_CMS_DOC, payload, { merge: true }),
      setDoc(LANDING_SETTINGS_DOC, payload, { merge: true })
    ]);
  } catch (err) {
    console.warn('Firestore setDoc failed, content saved to local storage fallback:', err);
  }
}
