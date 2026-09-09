import { collection, addDoc, getDocs, updateDoc, doc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { db } from './firebase';
import {
  Lead,
  LeadStatus,
  StudentRecord,
  TeacherRecord,
  CourseData,
  StudentResult,
  CmsContent,
  GroupScheduleItem,
  IncomePaymentRecord,
  ExpenseRecord,
  TelegramAlertLog,
} from '../types/crm';

// LocalStorage Keys for instant resilience
const STORAGE_KEYS = {
  LEADS: 'renessans_leads_v1',
  STUDENTS: 'renessans_students_v1',
  PAYMENTS: 'renessans_payments_v1',
  EXPENSES: 'renessans_expenses_v1',
  TELEGRAM_LOGS: 'renessans_telegram_logs_v1',
  SETTINGS: 'renessans_settings_v1',
};

// Initial realistic data reflecting Renessans Learning Center in Yangiobod
export const INITIAL_LEADS: Lead[] = [
  {
    id: 'lead-201',
    name: 'Sardorbek Qodirov',
    phone: '+998 90 234 56 78',
    course: 'Tarix, Huquq, Geografiya',
    createdAt: new Date(Date.now() - 12 * 60 * 1000).toISOString(),
    assignedTo: 'Davlatbek (Rahbar)',
    notes: 'Huquq va Akademiya imtihonlariga tayyorlanmoqchi. Ota-onasi bilan gaplashildi.',
    status: 'Yangi',
    source: 'Sayt bosh sahifasi',
  },
  {
    id: 'lead-202',
    name: 'Ziyodaxon Karimova',
    phone: '+998 93 456 78 90',
    course: 'CEFR Ingliz tili',
    createdAt: new Date(Date.now() - 35 * 60 * 1000).toISOString(),
    assignedTo: 'Qabulxona',
    notes: 'CEFR B2 daraja kerak. Ertaga soat 14:00 da darajani aniqlash testiga chaqirildi.',
    status: "Bog'lanildi",
    source: 'Telegram @D_Furqatovich',
  },
  {
    id: 'lead-203',
    name: 'Bekzod Rahmonov',
    phone: '+998 97 123 45 67',
    course: 'Matematika & SAT',
    createdAt: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
    assignedTo: 'Munisa (Ustoz)',
    notes: 'Shanba kuni soat 10:00 da bepul sinov darsiga yozildi.',
    status: 'Sinov darsi belgilandi',
    source: 'Tavsiya orqali',
  },
  {
    id: 'lead-204',
    name: 'Shahrizoda Mamatova',
    phone: '+998 91 333 44 55',
    course: 'Mental Arifmetika',
    createdAt: new Date(Date.now() - 3 * 3600 * 1000).toISOString(),
    assignedTo: 'Inomjon (Ustoz)',
    notes: 'Sinov darsida qatnashdi. Birinchi oy to\'lovini amalga oshirdi va guruhga qo\'shildi.',
    status: "O'quvchiga aylandi",
    source: 'Yangiobod 1-maktab flayeri',
  },
  {
    id: 'lead-205',
    name: 'Bobur Mirzayev',
    phone: '+998 94 888 77 66',
    course: 'Tarix, Huquq, Geografiya',
    createdAt: new Date(Date.now() - 4 * 3600 * 1000).toISOString(),
    assignedTo: 'Qabulxona',
    notes: 'DTM testlariga tayyorgarlik uchun murojaat qildi. 11-sinf o\'quvchisi.',
    status: 'Yangi',
    source: 'Sayt orqali ariza',
  },
  {
    id: 'lead-206',
    name: 'Nilufar Umarova',
    phone: '+998 90 999 11 22',
    course: 'Ona tili va Adabiyot',
    createdAt: new Date(Date.now() - 6 * 3600 * 1000).toISOString(),
    assignedTo: 'Zulfizar (Ustoz)',
    notes: 'Milliy sertifikat olish niyatida. Haftada 3 kun dars vaqti ma\'qul keldi.',
    status: "Bog'lanildi",
    source: 'Sayt bosh sahifasi',
  },
  {
    id: 'lead-207',
    name: 'Jasurbek Aliyev',
    phone: '+998 99 444 33 22',
    course: 'English Kids',
    createdAt: new Date(Date.now() - 8 * 3600 * 1000).toISOString(),
    assignedTo: 'Qabulxona',
    notes: '3-sinf o\'quvchisi. Onasi bilan bog\'lanildi, dushanba kuni sinov darsi.',
    status: 'Sinov darsi belgilandi',
    source: 'Instagram sahifa',
  },
  {
    id: 'lead-208',
    name: 'Gulsanam Toirova',
    phone: '+998 93 111 88 99',
    course: 'Tarix, Huquq, Geografiya',
    createdAt: new Date(Date.now() - 10 * 3600 * 1000).toISOString(),
    assignedTo: 'Davlatbek (Rahbar)',
    notes: 'Yurisprudensiya yo\'nalishi. Davlatbek ustoz bilan shaxsan maslahatlashdi.',
    status: "O'quvchiga aylandi",
    source: 'Yangiobod texnikumi filiali',
  },
];

export const INITIAL_STUDENTS: StudentRecord[] = [
  {
    id: 'st-101',
    fullName: 'Jahongir Olimov',
    phone: '+998 90 111 22 33',
    course: 'Tarix, Huquq, Geografiya',
    teacher: 'Davlatbek Abdurasulov',
    groupName: 'Tarix & Huquq - DTM Guruh 1',
    enrollmentDate: '2026-08-01',
    tuitionFee: 350000,
    paymentStatus: 'Paid',
    nextDueDate: '2026-10-01',
    isActive: true,
  },
  {
    id: 'st-102',
    fullName: 'Rayhona Qodirova',
    phone: '+998 93 222 33 44',
    course: 'Matematika & SAT',
    teacher: 'Munisa Mamadazimova',
    groupName: 'Matematika Milliy Sertifikat A',
    enrollmentDate: '2026-08-15',
    tuitionFee: 300000,
    paymentStatus: 'Due',
    nextDueDate: '2026-09-15',
    isActive: true,
  },
  {
    id: 'st-103',
    fullName: 'Kamronbek Yusupov',
    phone: '+998 97 333 44 55',
    course: 'CEFR Ingliz tili',
    teacher: 'Jamshid Alibekov',
    groupName: 'CEFR B2 Intensive',
    enrollmentDate: '2026-07-10',
    tuitionFee: 300000,
    paymentStatus: 'Paid',
    nextDueDate: '2026-10-10',
    isActive: true,
  },
  {
    id: 'st-104',
    fullName: 'Gulruh Ismoilova',
    phone: '+998 91 444 55 66',
    course: 'Ona tili va Adabiyot',
    teacher: 'Zulfizar Do\'smatova',
    groupName: 'Ona tili Milliy Sertifikat',
    enrollmentDate: '2026-08-05',
    tuitionFee: 280000,
    paymentStatus: 'Overdue',
    nextDueDate: '2026-09-05',
    isActive: true,
  },
  {
    id: 'st-105',
    fullName: 'Azizbek Ergashev',
    phone: '+998 99 555 66 77',
    course: 'Mental Arifmetika',
    teacher: 'Inomjon Barakayev',
    groupName: 'Mental Arifmetika Boshlang\'ich',
    enrollmentDate: '2026-09-01',
    tuitionFee: 250000,
    paymentStatus: 'Paid',
    nextDueDate: '2026-10-01',
    isActive: true,
  },
];

export const INITIAL_TEACHERS: TeacherRecord[] = [
  {
    id: 'tc-davlatbek',
    name: 'Davlatbek Abdurasulov',
    subject: 'Tarix • Huquq • Geografiya',
    specialization: 'Milliy sertifikat, Yurisprudensiya, Akademiya, DTM testlariga tayyorgarlik',
    experience: '6+ yil tajriba',
    activeGroups: 6,
    studentsCount: 148,
    salaryStatus: 'Paid',
    monthlySalary: 14500000,
    phone: '+998 (88) 648-49-49',
    telegram: '@D_Furqatovich',
    photo: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=400',
    achievements: [
      "100+ o'quvchilari DTM va Milliy sertifikatdan yuqori ball olgan",
      "Yurisprudensiya va Akademiya yo'nalishida nufuzli talabalar yetishtirgan",
      "Haftalik diagnostik sinovlar muallifi",
    ],
    description: "Tarix, huquq va geografiya fanlaridan chuqurlashtirilgan dastur asosida dars beruvchi yetakchi mutaxassis.",
  },
  {
    id: 'tc-munisa',
    name: 'Munisa Mamadazimova',
    subject: 'Matematika & SAT',
    specialization: 'Milliy sertifikat, SAT, Imtihonlarga tayyorgarlik',
    experience: '5+ yil tajriba',
    activeGroups: 4,
    studentsCount: 83,
    salaryStatus: 'Paid',
    monthlySalary: 11000000,
    phone: '+998 (99) 259-32-32',
    photo: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=400',
    achievements: [
      "Matematikadan Milliy sertifikat egalari ustozidir",
      "SAT xalqaro imtihoni bo'yicha maxsus uslubiyot",
      "Murakkab masalalarni sodda tushuntirish mahorati",
    ],
    description: "Aniq fanlar bo'yicha zamonaviy o'qitish metodikasi va nostandart masalalar yechimi ustasi.",
  },
  {
    id: 'tc-inomjon',
    name: 'Inomjon Barakayev',
    subject: 'Mental Arifmetika',
    specialization: 'Tez hisoblash, Kuchli xotira, Diqqat, Tafakkurni rivojlantirish',
    experience: '4+ yil tajriba',
    activeGroups: 4,
    studentsCount: 45,
    salaryStatus: 'Paid',
    monthlySalary: 9000000,
    phone: '+998 (88) 648-49-49',
    photo: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=400',
    achievements: [
      "Yuzlab yosh o'quvchilarda mental hisoblash tezligini 4 karra oshirgan",
      "Respublika miqyosidagi mental arifmetika olimpiadasi g'oliblari ustozi",
    ],
    description: "Bolalarda xotira, tasavvur va tez hisoblash iqtidorini shakllantiruvchi mutaxassis.",
  },
  {
    id: 'tc-zulfizar',
    name: "Zulfizar Do'smatova",
    subject: 'Ona tili va Adabiyot',
    specialization: 'Milliy sertifikat, DTM, Maktab imtihonlariga tayyorgarlik',
    experience: '5+ yil tajriba',
    activeGroups: 3,
    studentsCount: 40,
    salaryStatus: 'Paid',
    monthlySalary: 8500000,
    phone: '+998 (99) 259-32-32',
    photo: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=400',
    achievements: [
      "Ona tili Milliy sertifikatidan A+ va A daraja olgan o'quvchilar yetishtirgan",
      "DTM savollari bazasi bo'yicha mukammal tayyorgarlik dasturi",
    ],
    description: "Ona tili grammatikasi va adabiy tahlilni puxta egallashga yo'naltirilgan o'qituvchi.",
  },
  {
    id: 'tc-jamshid',
    name: 'Jamshid Alibekov',
    subject: 'CEFR Ingliz tili & Kids',
    specialization: 'CEFR, Grammar, Speaking, Reading, Listening',
    experience: '4+ yil tajriba',
    activeGroups: 3,
    studentsCount: 52,
    salaryStatus: 'Paid',
    monthlySalary: 9500000,
    phone: '+998 (88) 648-49-49',
    photo: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&q=80&w=400',
    achievements: [
      "CEFR B2 va C1 sertifikati sohiblarini tayyorlagan",
      "Bolalar uchun qiziqarli 'English Kids' interaktiv darslari muallifi",
    ],
    description: "Zamonaviy til o'rgatish standartlari asosida so'zlashuv va eshitish ko'nikmalarini rivojlantiruvchi ustoz.",
  },
];

export const INITIAL_COURSES: CourseData[] = [
  {
    id: 'c-tarix',
    title: 'Tarix • Huquq • Geografiya',
    category: 'Milliy Sertifikat & DTM',
    teacherName: 'Davlatbek Abdurasulov',
    description: 'Yurisprudensiya, Akademiya va DTM imtihonlariga chuqurlashtirilgan tayyorgarlik. Milliy sertifikat kafolati bilan.',
    duration: '6-9 Oy',
    lessonsPerWeek: 'Haftada 3 kun (2 soatdan)',
    monthlyFee: 350000,
    formattedFee: "350,000 so'm",
    badge: 'Eng ommabop',
    features: [
      'Milliy sertifikatga maxsus tayyorgarlik dasturi',
      'Yurisprudensiya va Akademiya kirish imtihonlari',
      'Haftalik diagnostik sinov testlari',
      'Xaritalar va tarixiy xronologiya bilan ishlash',
    ],
  },
  {
    id: 'c-matematika',
    title: 'Matematika & SAT',
    category: 'Aniq fanlar',
    teacherName: 'Munisa Mamadazimova',
    description: 'Maktab dasturi, DTM, Milliy sertifikat va xalqaro SAT imtihonlariga fundamental tayyorgarlik.',
    duration: '6-9 Oy',
    lessonsPerWeek: 'Haftada 3 kun (1.5 soatdan)',
    monthlyFee: 300000,
    formattedFee: "300,000 so'm",
    badge: 'Aniq fanlar',
    features: [
      'Milliy sertifikat darajasidagi murakkab masalalar',
      'Xalqaro SAT imtihoniga yo\'naltirilgan topshiriqlar',
      'Mantiqiy va nostandart masalalar tahlili',
      'Oylik test sinovlari va natijalar tahlili',
    ],
  },
  {
    id: 'c-cefr',
    title: 'CEFR Ingliz tili',
    category: 'Xorijiy tillar',
    teacherName: 'Jamshid Alibekov',
    description: 'CEFR B2 va C1 milliy sertifikatini qo\'lga kiritish va OTMga 100% maksimal ballni naqd qilish kursi.',
    duration: '3-6 Oy',
    lessonsPerWeek: 'Haftada 3 kun + Speaking club',
    monthlyFee: 300000,
    formattedFee: "300,000 so'm",
    badge: 'Til sertifikati',
    features: [
      'DTM CEFR formatidagi haqiqiy akustik testlar',
      'Grammatika va o\'qish tezligini oshirish',
      'Jonli suhbat va erkin fikr bildirish klubi',
      'B2 darajaga erishish uchun individual nazorat',
    ],
  },
  {
    id: 'c-mental',
    title: 'Mental Arifmetika',
    category: 'Bolalar rivojlanishi',
    teacherName: 'Inomjon Barakayev',
    description: 'Bolalarning miya faoliyatini, xotirasini, diqqatini va tez hisoblash salohiyatini bir necha barobar oshiruvchi kurs.',
    duration: '4-6 Oy',
    lessonsPerWeek: 'Haftada 3 kun (1 soatdan)',
    monthlyFee: 250000,
    formattedFee: "250,000 so'm",
    badge: 'Iqtidor',
    features: [
      'Abakus yordamida daqiqasiga 100+ amallarni hisoblash',
      'Xotira, tasavvur va diqqatni jamlash mashqlari',
      'Maktabdagi darslarni oson o\'zlashtirishga yordam',
      'Respublika olimpiadalarida ishtirok etish imkoniyati',
    ],
  },
  {
    id: 'c-onatili',
    title: 'Ona tili va Adabiyot',
    category: 'Milliy Sertifikat & DTM',
    teacherName: "Zulfizar Do'smatova",
    description: 'Ona tili grammatikasi va adabiy asarlar tahlili bo\'yicha Milliy sertifikat va DTM ga puxta tayyorgarlik.',
    duration: '6-9 Oy',
    lessonsPerWeek: 'Haftada 3 kun',
    monthlyFee: 280000,
    formattedFee: "280,000 so'm",
    badge: 'Majburiy fan',
    features: [
      'Morfologiya, sintaksis va fonetika chuqur tahlili',
      'Matn bilan ishlash va savodxonlikni oshirish',
      'Adabiyotdan xronologik va mavzuiy testlar',
      'Insho va fikrni ravon bayon etish mahorati',
    ],
  },
  {
    id: 'c-kids',
    title: 'English Kids',
    category: 'Bolalar uchun',
    teacherName: 'Jamshid Alibekov',
    description: 'Bolalar uchun qiziqarli, o\'yinlar va interaktiv qo\'llanmalar orqali samarali ingliz tili mashg\'ulotlari.',
    duration: 'Davomli',
    lessonsPerWeek: 'Haftada 3 kun',
    monthlyFee: 250000,
    formattedFee: "250,000 so'm",
    badge: 'Kichik yoshlilar',
    features: [
      'Qiziqarli ertaklar va multfilmlar asosida o\'rganish',
      'To\'g\'ri talaffuz va boy so\'z zaxirasi',
      'Boshlang\'ich sinf o\'quvchilari uchun moslashtirilgan',
      'Bolada xorijiy tilga qiziqish uyg\'otish',
    ],
  },
];

export const INITIAL_RESULTS: StudentResult[] = [
  {
    id: 'res-1',
    studentName: 'Hasanboyeva Sevinch Akmal qizi',
    score: '187.9 BALL',
    university: "O'zbekiston davlat jahon tillari universiteti (O'zDJTU)",
    fieldOfStudy: 'Ingliz tili yo\'nalishi',
    admissionType: 'Grant',
    year: '2025–2026',
    category: 'DTM',
    badge: 'Eng yuqori ball • Davlat granti',
  },
  {
    id: 'res-2',
    studentName: 'Davronov Bahrombek Dilshodbek o\'g\'li',
    score: '100% Natija',
    university: 'Yurisprudensiya / Akademiya',
    fieldOfStudy: 'Huquqshunoslik yo\'nalishi',
    admissionType: 'Grant',
    year: '2025–2026',
    category: 'Davlat granti',
    badge: 'Davlat granti sohibi',
  },
  {
    id: 'res-3',
    studentName: 'Sultonnazarova Zahro Zohibnazar qizi',
    score: '165.5 BALL',
    university: 'Toshkent davlat tibbiyot universiteti (TDTU)',
    fieldOfStudy: 'Farmatsevtika',
    admissionType: 'Kontrakt',
    year: '2025–2026',
    category: 'OTMga qabul',
    badge: 'Tibbiyot yo\'nalishi',
  },
  {
    id: 'res-4',
    studentName: 'Qodirov Shaxbozbek',
    score: '158.4 BALL',
    university: 'Guliston davlat universiteti (GulDU)',
    fieldOfStudy: 'Tarix fani o\'qituvchisi',
    admissionType: 'Grant',
    year: '2025–2026',
    category: 'OTMga qabul',
    badge: 'Davlat granti',
  },
  {
    id: 'res-5',
    studentName: 'Yo\'ldosheva Mohinur',
    score: '162.1 BALL',
    university: 'Jizzax davlat pedagogika universiteti (JDPU)',
    fieldOfStudy: 'Matematika va informatika',
    admissionType: 'Kontrakt',
    year: '2025–2026',
    category: 'Milliy Sertifikat',
    badge: 'Matematika',
  },
  {
    id: 'res-6',
    studentName: 'Normatov Javohir',
    score: 'CEFR B2 Sertifikat',
    university: "O'zbekiston Milliy universiteti Jizzax filiali",
    fieldOfStudy: 'Iqtisodiyot va moliya',
    admissionType: 'Grant',
    year: '2025–2026',
    category: 'CEFR',
    badge: 'Maksimal ball',
  },
];

export const INITIAL_SCHEDULE: GroupScheduleItem[] = [
  {
    id: 'sch-1',
    time: '08:30 - 10:30',
    course: 'Tarix • Huquq • Geografiya',
    groupName: 'Tarix DTM - Ertalabki A guruh',
    teacher: 'Davlatbek Abdurasulov',
    room: '1-xona (Bosh filial)',
    days: 'Dush / Chor / Juma',
    type: 'Regular',
    studentsCount: 22,
    maxCapacity: 25,
  },
  {
    id: 'sch-2',
    time: '10:30 - 12:00',
    course: 'Matematika & SAT',
    groupName: 'Matematika Milliy Sertifikat',
    teacher: 'Munisa Mamadazimova',
    room: '2-xona',
    days: 'Dush / Chor / Juma',
    type: 'Regular',
    studentsCount: 18,
    maxCapacity: 20,
  },
  {
    id: 'sch-3',
    time: '14:00 - 15:30',
    course: 'CEFR Ingliz tili',
    groupName: 'CEFR Intensive B2',
    teacher: 'Jamshid Alibekov',
    room: '3-xona',
    days: 'Sesh / Pay / Shan',
    type: 'Regular',
    studentsCount: 16,
    maxCapacity: 18,
  },
  {
    id: 'sch-4',
    time: '15:30 - 17:00',
    course: 'Mental Arifmetika',
    groupName: 'Mental Arifmetika Yoshlar guruhi',
    teacher: 'Inomjon Barakayev',
    room: 'Texnikum filiali',
    days: 'Sesh / Pay / Shan',
    type: 'Regular',
    studentsCount: 14,
    maxCapacity: 16,
  },
  {
    id: 'sch-5',
    time: '16:00 - 17:30',
    course: 'Tarix • Huquq • Geografiya',
    groupName: 'Bepul Sinov Darsi (Yangi o\'quvchilar)',
    teacher: 'Davlatbek Abdurasulov',
    room: 'Asosiy zal',
    days: 'Shanba',
    type: 'Trial Lesson',
    studentsCount: 12,
    maxCapacity: 25,
  },
];

export const INITIAL_CMS: CmsContent = {
  heroTitle: 'Farzandingizning kelajagini bugundan boshlang!',
  heroSubtitle: "Milliy sertifikat, DTM, CEFR, SAT va maktab fanlari bo'yicha tajribali ustozlar bilan sifatli tayyorgarlik.",
  slogan: 'Bilimdan natijaga!',
  phonePrimary: '+998 (88) 648-49-49',
  phoneSecondary: '+998 (99) 259-32-32',
  telegramUsername: '@D_Furqatovich',
  location1: "Yangiobod tumani 1-sonli umumiy o'rta ta'lim maktabi binosi (RENESSANS o'quv markazi)",
  location2: "Yangiobod tuman texnikumi (NODIRABEGIM EDUCATION o'quv markazi)",
  statPassRate: '76.2%',
  statAdmitted: '16 / 21',
  statTopScore: '187.9',
  statGrantCount: '2',
};

export const INITIAL_PAYMENTS: IncomePaymentRecord[] = [
  {
    id: 'pay-01',
    studentName: 'Jahongir Olimov',
    amount: 450000,
    course: 'IELTS Intensive',
    date: '2026-09-08',
    method: 'Click',
    receiptNumber: 'REC-98214',
    status: 'Completed',
  },
  {
    id: 'pay-02',
    studentName: 'Kamronbek Yusupov',
    amount: 500000,
    course: 'Python Programming',
    date: '2026-09-08',
    method: 'Payme',
    receiptNumber: 'REC-98215',
    status: 'Completed',
  },
  {
    id: 'pay-03',
    studentName: 'Shahzodbek Toirov',
    amount: 450000,
    course: 'IELTS Intensive',
    date: '2026-09-07',
    method: 'Cash',
    receiptNumber: 'REC-98216',
    status: 'Completed',
  },
  {
    id: 'pay-04',
    studentName: 'Gulruh Ismoilova',
    amount: 400000,
    course: 'CEFR FastTrack',
    date: '2026-09-06',
    method: 'Card',
    receiptNumber: 'REC-98217',
    status: 'Completed',
  },
  {
    id: 'pay-05',
    studentName: 'Ali Valiyev',
    amount: 450000,
    course: 'IELTS Intensive',
    date: '2026-09-05',
    method: 'Click',
    receiptNumber: 'REC-98218',
    status: 'Completed',
  },
];

export const INITIAL_EXPENSES: ExpenseRecord[] = [
  {
    id: 'exp-01',
    category: 'Teacher Salary',
    title: 'Jasur Rahimov - August Teaching Hours & Mock Evaluation',
    amount: 14000000,
    date: '2026-09-05',
    recipient: 'Jasur Rahimov',
    notes: 'Paid via bank transfer',
  },
  {
    id: 'exp-02',
    category: 'Rent',
    title: 'Center Premises Lease - Main & Annex Floor',
    amount: 18500000,
    date: '2026-09-01',
    recipient: 'Business Center Management',
    notes: 'September monthly rent',
  },
  {
    id: 'exp-03',
    category: 'Marketing',
    title: 'Targeted Instagram & Telegram Promotion',
    amount: 6800000,
    date: '2026-09-03',
    recipient: 'Digital Media Agency',
    notes: 'IELTS September intake campaign',
  },
  {
    id: 'exp-04',
    category: 'Utilities',
    title: 'High-speed Fiber Optic Internet & Electricity',
    amount: 2400000,
    date: '2026-09-02',
    recipient: 'Telecom & City Grid',
    notes: 'Lab connection & cooling',
  },
  {
    id: 'exp-05',
    category: 'Teacher Salary',
    title: 'Malika Azimova - Senior CEFR Instructor Monthly Salary',
    amount: 11500000,
    date: '2026-09-05',
    recipient: 'Malika Azimova',
    notes: 'Paid via bank transfer',
  },
];

export const INITIAL_TELEGRAM_LOGS: TelegramAlertLog[] = [
  {
    id: 'tg-01',
    leadName: 'Ali Valiyev',
    leadPhone: '+998 90 123 45 67',
    course: 'IELTS Intensive',
    sentAt: 'Today, 10:32 AM',
    status: 'Delivered',
    messageText: '🔥 New Lead: Ali Valiyev | Course: IELTS Intensive | Phone: +998 90 123 45 67',
  },
  {
    id: 'tg-02',
    leadName: 'Madina Karimova',
    leadPhone: '+998 93 543 21 00',
    course: 'CEFR FastTrack',
    sentAt: 'Today, 10:45 AM',
    status: 'Delivered',
    messageText: '🔥 New Lead: Madina Karimova | Course: CEFR FastTrack | Phone: +998 93 543 21 00',
  },
  {
    id: 'tg-03',
    leadName: 'Azizbek Toshmatov',
    leadPhone: '+998 97 789 12 34',
    course: 'Python Programming',
    sentAt: 'Yesterday, 14:15 PM',
    status: 'Delivered',
    messageText: '🔥 New Lead: Azizbek Toshmatov | Course: Python Programming | Phone: +998 97 789 12 34',
  },
];

// Helper to safely load data from LocalStorage
function getFromStorage<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

function saveToStorage<T>(key: string, data: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (err) {
    console.warn('LocalStorage save error:', err);
  }
}

class CrmService {
  private leads: Lead[] = getFromStorage(STORAGE_KEYS.LEADS, INITIAL_LEADS);
  private students: StudentRecord[] = getFromStorage(STORAGE_KEYS.STUDENTS, INITIAL_STUDENTS);
  private payments: IncomePaymentRecord[] = getFromStorage(STORAGE_KEYS.PAYMENTS, INITIAL_PAYMENTS);
  private expenses: ExpenseRecord[] = getFromStorage(STORAGE_KEYS.EXPENSES, INITIAL_EXPENSES);
  private telegramLogs: TelegramAlertLog[] = getFromStorage(STORAGE_KEYS.TELEGRAM_LOGS, INITIAL_TELEGRAM_LOGS);

  // --- RESULTS & CMS ---
  private results: StudentResult[] = getFromStorage('renessans_results_v1', INITIAL_RESULTS);
  private cmsContent: CmsContent = getFromStorage(STORAGE_KEYS.SETTINGS, INITIAL_CMS);

  public getResults(): StudentResult[] {
    return [...this.results];
  }

  public addResult(result: Omit<StudentResult, 'id'>): StudentResult {
    const newRes: StudentResult = {
      ...result,
      id: `res-${Date.now()}`,
    };
    this.results.unshift(newRes);
    saveToStorage('renessans_results_v1', this.results);
    return newRes;
  }

  public getCmsContent(): CmsContent {
    return { ...this.cmsContent };
  }

  public updateCmsContent(updates: Partial<CmsContent>): CmsContent {
    this.cmsContent = { ...this.cmsContent, ...updates };
    saveToStorage(STORAGE_KEYS.SETTINGS, this.cmsContent);
    return { ...this.cmsContent };
  }

  // --- LEADS MANAGEMENT ---
  public getLeads(): Lead[] {
    return [...this.leads];
  }

  public async createLead(data: { name: string; phone: string; course: string; notes?: string; source?: string }): Promise<Lead> {
    const newLead: Lead = {
      id: `lead-${Date.now()}`,
      name: data.name.trim(),
      phone: data.phone.trim(),
      course: data.course || 'Tarix, Huquq, Geografiya',
      createdAt: new Date().toISOString(),
      assignedTo: 'Qabulxona',
      notes: data.notes || 'Bepul sinov darsiga yozildi.',
      status: 'Yangi',
      source: data.source || 'Sayt orqali ariza',
    };

    this.leads.unshift(newLead);
    saveToStorage(STORAGE_KEYS.LEADS, this.leads);

    // Save to Firestore asynchronously if available
    try {
      if (db) {
        addDoc(collection(db, 'leads'), {
          ...newLead,
          createdTimestamp: serverTimestamp(),
        }).catch((err) => console.log('Firestore lead sync note (using local cache):', err.message));
      }
    } catch (err) {
      console.log('Firebase lead dispatch note:', err);
    }

    // Trigger Instant Telegram Notification
    await this.dispatchTelegramAlert(newLead);

    return newLead;
  }

  public updateLeadStatus(leadId: string, status: LeadStatus): Lead | null {
    const idx = this.leads.findIndex((l) => l.id === leadId);
    if (idx === -1) return null;

    this.leads[idx] = { ...this.leads[idx], status };
    saveToStorage(STORAGE_KEYS.LEADS, this.leads);

    // If marked enrolled, add to active students
    if (status === 'Enrolled' || status === "O'quvchiga aylandi") {
      const existing = this.students.find((s) => s.fullName.toLowerCase() === this.leads[idx].name.toLowerCase());
      if (!existing) {
        this.addStudent({
          fullName: this.leads[idx].name,
          phone: this.leads[idx].phone,
          course: this.leads[idx].course,
          groupName: `${this.leads[idx].course} - Asosiy guruh`,
          enrollmentDate: new Date().toISOString().split('T')[0],
          tuitionFee: 350000,
          paymentStatus: 'Due',
          nextDueDate: new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString().split('T')[0],
          isActive: true,
        });
      }
    }

    return this.leads[idx];
  }

  public updateLead(leadId: string, updates: Partial<Lead>): Lead | null {
    const idx = this.leads.findIndex((l) => l.id === leadId);
    if (idx === -1) return null;

    this.leads[idx] = { ...this.leads[idx], ...updates };
    saveToStorage(STORAGE_KEYS.LEADS, this.leads);
    return this.leads[idx];
  }

  public deleteLead(leadId: string): boolean {
    const initialLen = this.leads.length;
    this.leads = this.leads.filter((l) => l.id !== leadId);
    if (this.leads.length !== initialLen) {
      saveToStorage(STORAGE_KEYS.LEADS, this.leads);
      return true;
    }
    return false;
  }

  // --- TELEGRAM INSTANT NOTIFICATION ---
  public async dispatchTelegramAlert(lead: Lead): Promise<TelegramAlertLog> {
    const formattedDate = new Date(lead.createdAt).toLocaleString('uz-UZ', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });

    const telegramMessage = `
🔥 Yangi ariza!

👤 Ism: ${lead.name}
📞 Telefon: ${lead.phone}
📚 Kurs: ${lead.course}
🕐 Vaqt: ${formattedDate}
Holat: ${lead.status || 'Yangi'}
📍 Manba: ${lead.source || 'Sayt'}
`.trim();

    const log: TelegramAlertLog = {
      id: `tg-${Date.now()}`,
      leadName: lead.name,
      leadPhone: lead.phone,
      course: lead.course,
      sentAt: 'Hozirgina',
      status: 'Sent',
      messageText: telegramMessage,
      message: telegramMessage,
    };

    this.telegramLogs.unshift(log);
    saveToStorage(STORAGE_KEYS.TELEGRAM_LOGS, this.telegramLogs);

    // Also attempt server-side Telegram Bot API if configured
    try {
      fetch('/api/telegram/lead-alert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          leadName: lead.name,
          leadPhone: lead.phone,
          course: lead.course,
          date: formattedDate,
        }),
      }).catch(() => {});
    } catch {
      // Non-blocking
    }

    return log;
  }

  public getTelegramLogs(): TelegramAlertLog[] {
    return [...this.telegramLogs];
  }

  // --- STUDENTS MANAGEMENT ---
  public getStudents(): StudentRecord[] {
    return [...this.students];
  }

  public addStudent(student: Omit<StudentRecord, 'id'>): StudentRecord {
    const newStudent: StudentRecord = {
      ...student,
      id: `st-${Date.now()}`,
    };
    this.students.unshift(newStudent);
    saveToStorage(STORAGE_KEYS.STUDENTS, this.students);
    return newStudent;
  }

  // --- TEACHERS ---
  public getTeachers(): TeacherRecord[] {
    return INITIAL_TEACHERS;
  }

  // --- SCHEDULE ---
  public getSchedule(): GroupScheduleItem[] {
    return INITIAL_SCHEDULE;
  }

  // --- COURSES ---
  public getCourses(): CourseData[] {
    return INITIAL_COURSES;
  }

  public updateCourse(courseId: string, updates: Partial<CourseData>): CourseData | null {
    const course = INITIAL_COURSES.find((c) => c.id === courseId);
    if (!course) return null;
    Object.assign(course, updates);
    return course;
  }

  // --- FINANCE (INCOME & EXPENSES) ---
  public getPayments(): IncomePaymentRecord[] {
    return [...this.payments];
  }

  public addPayment(payment: Omit<IncomePaymentRecord, 'id'>): IncomePaymentRecord {
    const newPayment: IncomePaymentRecord = {
      ...payment,
      id: `pay-${Date.now()}`,
    };
    this.payments.unshift(newPayment);
    saveToStorage(STORAGE_KEYS.PAYMENTS, this.payments);
    return newPayment;
  }

  public createPayment(payment: {
    studentId?: string;
    studentName: string;
    amount: number;
    course?: string;
    method: 'Cash' | 'Card' | 'Click' | 'Payme';
    month?: string;
    status?: 'Completed' | 'Pending';
  }): IncomePaymentRecord {
    return this.addPayment({
      studentName: payment.studentName,
      amount: payment.amount,
      course: payment.course || 'English Course',
      date: new Date().toISOString().split('T')[0],
      method: payment.method,
      receiptNumber: `REC-${Math.floor(10000 + Math.random() * 90000)}`,
      status: payment.status || 'Completed',
    });
  }

  public getExpenses(): ExpenseRecord[] {
    return [...this.expenses];
  }

  public addExpense(expense: Omit<ExpenseRecord, 'id' | 'date'> & { date?: string }): ExpenseRecord {
    const newExpense: ExpenseRecord = {
      ...expense,
      date: expense.date || new Date().toISOString().split('T')[0],
      id: `exp-${Date.now()}`,
    };
    this.expenses.unshift(newExpense);
    saveToStorage(STORAGE_KEYS.EXPENSES, this.expenses);
    return newExpense;
  }

  public createExpense(expense: {
    category: string;
    title: string;
    amount: number;
    recipient: string;
    month?: string;
    notes?: string;
  }): ExpenseRecord {
    return this.addExpense({
      category: expense.category,
      title: expense.title,
      amount: expense.amount,
      recipient: expense.recipient,
      month: expense.month,
      notes: expense.notes,
    });
  }

  public async sendTelegramLeadNotification(lead: any): Promise<TelegramAlertLog> {
    return this.dispatchTelegramAlert({
      id: lead.id || `lead-${Date.now()}`,
      name: lead.name,
      phone: lead.phone,
      course: lead.course || 'IELTS Intensive',
      createdAt: lead.createdAt || new Date().toISOString(),
      status: lead.status || 'New',
    });
  }

  // --- EXPORT TOOLS ---
  public exportLeadsCSV(): string {
    const headers = ['ID', 'Name', 'Phone', 'Course', 'Status', 'Created At', 'Assigned To', 'Notes'];
    const rows = this.leads.map((l) => [
      l.id,
      `"${l.name.replace(/"/g, '""')}"`,
      `"${l.phone}"`,
      `"${l.course}"`,
      l.status,
      l.createdAt,
      `"${(l.assignedTo || '').replace(/"/g, '""')}"`,
      `"${(l.notes || '').replace(/"/g, '""')}"`,
    ]);

    return [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
  }

  public exportLeadsJSON(): string {
    return JSON.stringify(this.leads, null, 2);
  }
}

export const crmService = new CrmService();
