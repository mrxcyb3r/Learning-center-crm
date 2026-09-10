import { addDoc, collection, doc, serverTimestamp, setDoc } from 'firebase/firestore';
import { db } from './firebase';
import { slugify } from '../utils/content';
import {
  AuditLogEntry,
  CenterSettings,
  CmsContent,
  CmsData,
  CourseData,
  ExpenseRecord,
  GroupScheduleItem,
  IncomePaymentRecord,
  Lead,
  LeadStatus,
  PaymentStatus,
  StudentRecord,
  StudentResult,
  TeacherRecord,
  TelegramAlertLog,
} from '../types/crm';

// Local storage keys
export const STORAGE_KEYS = {
  LEADS: 'renessans_leads_v3',
  STUDENTS: 'renessans_students_v3',
  TEACHERS: 'renessans_teachers_v3',
  COURSES: 'renessans_courses_v3',
  SCHEDULE: 'renessans_schedule_v3',
  PAYMENTS: 'renessans_payments_v3',
  EXPENSES: 'renessans_expenses_v3',
  RESULTS: 'renessans_results_v3',
  CMS: 'renessans_cms_v3',
  CMS_DRAFT: 'renessans_cms_draft_v3',
  SETTINGS: 'renessans_settings_v3',
  AUDIT_LOGS: 'renessans_audit_logs_v3',
  TELEGRAM_LOGS: 'renessans_telegram_logs_v3',
};

// Seed teachers WITHOUT any random Unsplash photos
export const INITIAL_TEACHERS: TeacherRecord[] = [
  {
    id: 't-diyorbek',
    name: 'Diyorbek Furqatovich',
    gender: 'male',
    subject: 'Tarix & Huquq',
    specialization: 'DTM va Milliy Sertifikat Tarix / Huquq',
    qualification: "Oliy toifali mutaxassis, Davlat granti sohibi ustozi",
    experience: '6 yil',
    activeGroups: 3,
    studentsCount: 38,
    salaryStatus: 'Paid',
    monthlySalary: 12000000,
    salary: 12000000,
    phone: '+998 (88) 648-49-49',
    photo: '', // Empty: Uses professional vector avatar unless custom photo is uploaded
    achievements: [
      "187.9 eng yuqori DTM balli sohibi ustozi (2025)",
      "2 nafar 100% davlat granti talabasi ustozi",
      "Yangiobod tumanida Tarix fanidan yetakchi pedagog",
    ],
    telegram: '@D_Furqatovich',
    description: "Tarix va huquqshunoslik yo'nalishida 6 yillik muvaffaqiyatli tajribaga ega. DTM va Milliy sertifikatga tayyorlash bo'yicha maxsus mualliflik dasturi asoschisi.",
    status: 'Active',
    displayOrder: 1,
    isPublic: true,
    assignedCourses: ['c-tarix', 'c-huquq'],
    notes: "Markaz asoschisi va bosh metodisti",
    createdAt: '2025-01-01T00:00:00.000Z',
  },
  {
    id: 't-jasur',
    name: 'Jasur Alimov',
    gender: 'male',
    subject: 'Matematika & SAT',
    specialization: 'Oliy Matematika, Milliy Sertifikat va SAT Math',
    qualification: "Magistr, Matematika olimpiadalari hakamlar hay'ati a'zosi",
    experience: '5 yil',
    activeGroups: 2,
    studentsCount: 28,
    salaryStatus: 'Paid',
    monthlySalary: 10500000,
    salary: 10500000,
    phone: '+998 (99) 259-32-32',
    photo: '',
    achievements: [
      'SAT Math 790 ballik o\'quvchilar ustozi',
      'Milliy Sertifikat A+ va A natijalar (18 ta)',
      'Olimpiada viloyat bosqichi g\'oliblari tayyorlovchisi',
    ],
    telegram: '@jasur_math',
    description: 'Matematikani mantiqiy fikrlash, formulalarni vizual tushunish va murakkab geometriya masalalarini oson yechish uslublari orqali o\'rgatadi.',
    status: 'Active',
    displayOrder: 2,
    isPublic: true,
    assignedCourses: ['c-matematika'],
    createdAt: '2025-01-10T00:00:00.000Z',
  },
  {
    id: 't-malika',
    name: 'Malika Karimova',
    gender: 'female',
    subject: 'Ingliz tili (CEFR & Kids)',
    specialization: 'CEFR B2/C1 va General English',
    qualification: 'CEFR C1 Sertifikati, TESOL xalqaro sertifikati',
    experience: '4 yil',
    activeGroups: 3,
    studentsCount: 32,
    salaryStatus: 'Paid',
    monthlySalary: 9500000,
    salary: 9500000,
    phone: '+998 (90) 345-67-89',
    photo: '',
    achievements: [
      '30+ o\'quvchi CEFR B2 va C1 sertifikatini olgan',
      'Interaktiv multimedia va speaking clublar koordinatori',
      'Maktab o\'quvchilarini noldan B2 ga olib chiqish bo\'yicha mutaxassis',
    ],
    telegram: '@malika_english',
    description: 'Ingliz tilida so\'zlashuv to\'sig\'ini tez yengish, mukammal grammatika va listening ko\'nikmalarini rivojlantirish bo\'yicha zamonaviy dasturlar asosida dars beradi.',
    status: 'Active',
    displayOrder: 3,
    isPublic: true,
    assignedCourses: ['c-cefr', 'c-kids'],
    createdAt: '2025-02-01T00:00:00.000Z',
  },
  {
    id: 't-farxod',
    name: 'Farxod Qodirov',
    gender: 'male',
    subject: 'Geografiya',
    specialization: 'DTM Geografiya va Topografiya',
    qualification: 'Oliy toifali geograf-pedagog',
    experience: '5 yil',
    activeGroups: 2,
    studentsCount: 22,
    salaryStatus: 'Pending',
    monthlySalary: 9000000,
    salary: 9000000,
    phone: '+998 (93) 456-78-90',
    photo: '',
    achievements: [
      'DTM Geografiya blokidan 100% to\'g\'ri javob bergan 12 ta o\'quvchi',
      'Xaritalar bilan ishlash bo\'yicha mualliflik qo\'llanmasi',
    ],
    telegram: '@farxod_geo',
    description: 'Iqtisodiy va tabiiy geografiya, jahon mamlakatlari va xaritalar bilan ishlash bo\'yicha chuqur bilim beradi.',
    status: 'Active',
    displayOrder: 4,
    isPublic: true,
    assignedCourses: ['c-tarix'],
    createdAt: '2025-02-15T00:00:00.000Z',
  },
  {
    id: 't-dilnoza',
    name: 'Dilnoza Rahimova',
    gender: 'female',
    subject: 'Mental Arifmetika & Kids',
    specialization: 'Boshlang\'ich rivojlantirish va mantiqiy tafakkur',
    qualification: 'Mental Arifmetika xalqaro assotsiatsiyasi sertifikati',
    experience: '3 yil',
    activeGroups: 2,
    studentsCount: 24,
    salaryStatus: 'Paid',
    monthlySalary: 8000000,
    salary: 8000000,
    phone: '+998 (97) 123-45-67',
    photo: '',
    achievements: [
      'Respublika Mental Arifmetika turniri sovrindorlari ustozi',
      'Abakus tezkor hisoblash texnikasi mutaxassisi',
    ],
    telegram: '@dilnoza_mental',
    description: 'Bolalarning xotirasi, diqqati va tezkor hisoblash qobiliyatini o\'yin metodlari orqali rivojlantiradi.',
    status: 'Active',
    displayOrder: 5,
    isPublic: true,
    assignedCourses: ['c-mental'],
    createdAt: '2025-03-01T00:00:00.000Z',
  },
  {
    id: 't-sarvar',
    name: 'Sarvar Norboyev',
    gender: 'male',
    subject: 'Ona tili va Adabiyot',
    specialization: 'DTM va Milliy Sertifikat Ona tili',
    qualification: 'Oliy toifali filolog, DTM eksperti',
    experience: '7 yil',
    activeGroups: 2,
    studentsCount: 26,
    salaryStatus: 'Paid',
    monthlySalary: 10000000,
    salary: 10000000,
    phone: '+998 (91) 987-65-43',
    photo: '',
    achievements: [
      'Ona tili Milliy sertifikatidan A+ va A olgan 22 nafar o\'quvchi',
      'Imlo va matn tahlili bo\'yicha maxsus ekspress kurs muallifi',
    ],
    telegram: '@sarvar_onatili',
    description: 'Ona tili grammatikasi, fonetika va adabiy tahlilni eng oson va tushunarli metodlar bilan o\'rgatadi.',
    status: 'Active',
    displayOrder: 6,
    isPublic: true,
    assignedCourses: ['c-onatili'],
    createdAt: '2025-03-10T00:00:00.000Z',
  },
];

// Seed Courses
export const INITIAL_COURSES: CourseData[] = [
  {
    id: 'c-tarix',
    title: 'DTM & Milliy Sertifikat',
    shortTitle: 'DTM & Milliy Sertifikat',
    slug: 'dtm-milliy-sertifikat',
    category: 'Tarix, Huquq, Geografiya',
    badge: 'Kafolatlangan Natija',
    description: "Yurisprudensiya, Xalqaro munosabatlar va Ijtimoiy-gumanitar oliygohlarga kiruvchilar uchun 100% natijaga yo'naltirilgan kompleks tayyorlov.",
    duration: '8 oy',
    lessonsPerWeek: 'Haftada 3 kun / 2 soatdan',
    lessonDuration: '120 daqiqa',
    monthlyFee: 380000,
    formattedFee: '380,000 UZS / oy',
    currency: 'UZS',
    teacherName: 'Diyorbek Furqatovich',
    teacherId: 't-diyorbek',
    features: [
      'Mualliflik konspektlari va xronologik jadvallar',
      'Haftalik test sinovlari (DTM standarti bo\'yicha)',
      'Milliy sertifikat topshirish strategiyasi',
      'Ota-onalarga oylik hisobot va davomat nazorati',
    ],
    imageUrl: 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?auto=format&fit=crop&w=900&q=75',
    featured: true,
    isActive: true,
    isPublic: true,
    displayOrder: 1,
  },
  {
    id: 'c-matematika',
    title: 'Matematika & Fizika',
    shortTitle: 'Matematika & Fizika',
    slug: 'matematika-fizika',
    category: 'Aniq Fanlar',
    badge: 'Sertifikat Kafolati',
    description: "Texnika, Iqtisodiyot, Axborot texnologiyalari va xorijiy oliygohlar (Westminster, INHA, WIUT) uchun mukammal poydevor.",
    duration: '9 oy',
    lessonsPerWeek: 'Haftada 3 kun / 2 soatdan',
    lessonDuration: '120 daqiqa',
    monthlyFee: 380000,
    formattedFee: '380,000 UZS / oy',
    currency: 'UZS',
    teacherName: 'Jasur Alimov',
    teacherId: 't-jasur',
    features: [
      'Elementar matematikadan oliy darajagacha',
      'DTM va Milliy sertifikat qoliplari bilan ishlash',
      'Mantiqiy masalalar va tezkor formulalar yechimi',
      'Barcha dars materiallari va testlar bepul beriladi',
    ],
    imageUrl: 'https://images.unsplash.com/photo-1635372722656-389f87a941b7?auto=format&fit=crop&w=900&q=75',
    featured: true,
    isActive: true,
    isPublic: true,
    displayOrder: 2,
  },
  {
    id: 'c-cefr',
    title: 'CEFR Ingliz Tili (B2 / C1)',
    shortTitle: 'CEFR Ingliz Tili',
    slug: 'cefr-ingliz-tili',
    category: 'Chet Tillari',
    description: "Listening, Reading, Writing va Speaking bo'yicha intensiv darslar. OTMga kirishda chet tilidan maksimal ball yo'naltirilgan.",
    duration: '6 oy',
    lessonsPerWeek: 'Haftada 3 kun / 1.5 soatdan',
    lessonDuration: '90 daqiqa',
    monthlyFee: 350000,
    formattedFee: '350,000 UZS / oy',
    currency: 'UZS',
    teacherName: 'Malika Karimova',
    teacherId: 't-malika',
    features: [
      'Har hafta rasmiy CEFR mock imtihonlari',
      'Speaking clublar va audio listening tahlili',
      'Insho yozish (Writing) shaxsiy tekshiruvi',
      'C1 sertifikatiga ega ustozlar darsi',
    ],
    imageUrl: 'https://images.unsplash.com/photo-1546410531-bb4caa6b424d?auto=format&fit=crop&w=900&q=75',
    isActive: true,
    isPublic: true,
    displayOrder: 3,
  },
  {
    id: 'c-kids',
    title: 'English Kids (3–10 yosh)',
    shortTitle: 'English Kids',
    slug: 'english-kids',
    category: 'Bolalar Dasturi',
    description: "Kichik yoshdagi bolalarga ingliz tilini qiziqarli o'yinlar, multfilmlar, qo'shiqlar va so'zlashuv mashg'ulotlari orqali o'rgatish.",
    duration: 'Davomiy',
    lessonsPerWeek: 'Haftada 3 kun / 1 soatdan',
    lessonDuration: '60 daqiqa',
    monthlyFee: 290000,
    formattedFee: '290,000 UZS / oy',
    currency: 'UZS',
    teacherName: 'Dilnoza Rahimova',
    teacherId: 't-dilnoza',
    features: [
      'Interaktiv o\'yinli metodika',
      'To\'g\'ri talaffuz va boy so\'z boyligi',
      'Vizual kartochkalar va ijodiy mashg\'ulotlar',
      'Kichik guruhlar (maksimal 10 bola)',
    ],
    imageUrl: 'https://images.unsplash.com/photo-1509062522246-3755977927d7?auto=format&fit=crop&w=900&q=75',
    isActive: true,
    isPublic: true,
    displayOrder: 4,
  },
  {
    id: 'c-mental',
    title: 'Mental Arifmetika',
    shortTitle: 'Mental Arifmetika',
    slug: 'mental-arifmetika',
    category: 'Mantiqiy Rivojlanish',
    description: "Bolalarda xotira, tasavvur va miyaning ikki yarim sharlarini rivojlantiruvchi tezkor hisoblash kursi.",
    duration: '6 oy',
    lessonsPerWeek: 'Haftada 2 kun / 1.5 soatdan',
    lessonDuration: '90 daqiqa',
    monthlyFee: 280000,
    formattedFee: '280,000 UZS / oy',
    currency: 'UZS',
    teacherName: 'Dilnoza Rahimova',
    teacherId: 't-dilnoza',
    features: [
      'Abakus bilan tezkor amallar bajarish',
      'Ongda soniyalarda hisoblash texnikasi',
      'Diqqat va e\'tiborni jamlash mashqlari',
      'Xalqaro standartdagi sertifikat beriladi',
    ],
    imageUrl: 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?auto=format&fit=crop&w=900&q=75',
    isActive: true,
    isPublic: true,
    displayOrder: 5,
  },
  {
    id: 'c-onatili',
    title: 'Ona Tili va Adabiyot',
    shortTitle: 'Ona Tili va Adabiyot',
    slug: 'ona-tili-va-adabiyot',
    category: 'DTM Majburiy & Asosiy',
    description: "Barcha yo'nalishlar uchun majburiy blok va filologiya yo'nalishlari uchun chuqurlashtirilgan ona tili va adabiyot kursi.",
    duration: '7 oy',
    lessonsPerWeek: 'Haftada 3 kun / 2 soatdan',
    lessonDuration: '120 daqiqa',
    monthlyFee: 320000,
    formattedFee: '320,000 UZS / oy',
    currency: 'UZS',
    teacherName: 'Sarvar Norboyev',
    teacherId: 't-sarvar',
    features: [
      'Morfologiya, sintaksis va orfografiya sirlari',
      'Badiiy asarlar tahlili va adabiy faktlar',
      'Muntazam testlar va DTM tahlillari',
      'Majburiy fanlar blokidan maksimal ball yo\'naltirilgan',
    ],
    imageUrl: 'https://images.unsplash.com/photo-1457369804613-52c61a468e7d?auto=format&fit=crop&w=900&q=75',
    isActive: true,
    isPublic: true,
    displayOrder: 6,
  },
];

// Seed Schedule / Groups
export const INITIAL_SCHEDULE: GroupScheduleItem[] = [
  {
    id: 'grp-01',
    groupName: 'DTM & Milliy Sertifikat — 1-guruh',
    course: 'DTM & Milliy Sertifikat',
    courseId: 'c-tarix',
    teacher: 'Diyorbek Furqatovich',
    teacherId: 't-diyorbek',
    branch: '1-Filial (Asosiy)',
    room: '101-Auditoriya',
    days: 'Dush / Chor / Juma',
    time: '08:30 - 10:30',
    startTime: '08:30',
    endTime: '10:30',
    maxCapacity: 18,
    studentsCount: 14,
    type: 'Regular',
    status: 'Active',
    displayOrder: 1,
  },
  {
    id: 'grp-02',
    groupName: 'DTM & Milliy Sertifikat — 2-guruh (Tushki)',
    course: 'DTM & Milliy Sertifikat',
    courseId: 'c-tarix',
    teacher: 'Diyorbek Furqatovich',
    teacherId: 't-diyorbek',
    branch: '1-Filial (Asosiy)',
    room: '101-Auditoriya',
    days: 'Sesh / Pay / Shan',
    time: '14:00 - 16:00',
    startTime: '14:00',
    endTime: '16:00',
    maxCapacity: 18,
    studentsCount: 13,
    type: 'Regular',
    status: 'Active',
    displayOrder: 2,
  },
  {
    id: 'grp-03',
    groupName: 'Matematika & Fizika — DTM 1-guruh',
    course: 'Matematika & Fizika',
    courseId: 'c-matematika',
    teacher: 'Jasur Alimov',
    teacherId: 't-jasur',
    branch: '1-Filial (Asosiy)',
    room: '102-Xona',
    days: 'Dush / Chor / Juma',
    time: '14:00 - 16:00',
    startTime: '14:00',
    endTime: '16:00',
    maxCapacity: 16,
    studentsCount: 15,
    type: 'Regular',
    status: 'Active',
    displayOrder: 3,
  },
  {
    id: 'grp-04',
    groupName: 'CEFR Ingliz Tili — B2 FastTrack',
    course: 'CEFR Ingliz Tili (B2 / C1)',
    courseId: 'c-cefr',
    teacher: 'Malika Karimova',
    teacherId: 't-malika',
    branch: '1-Filial (Asosiy)',
    room: '201-Laboratoriya',
    days: 'Dush / Chor / Juma',
    time: '16:00 - 17:30',
    startTime: '16:00',
    endTime: '17:30',
    maxCapacity: 14,
    studentsCount: 12,
    type: 'Regular',
    status: 'Active',
    displayOrder: 4,
  },
  {
    id: 'grp-05',
    groupName: 'English Kids — 1-guruh',
    course: 'English Kids (3–10 yosh)',
    courseId: 'c-kids',
    teacher: 'Dilnoza Rahimova',
    teacherId: 't-dilnoza',
    branch: '2-Filial (Texnikum)',
    room: '301-Xona',
    days: 'Sesh / Pay / Shan',
    time: '10:00 - 11:00',
    startTime: '10:00',
    endTime: '11:00',
    maxCapacity: 12,
    studentsCount: 12,
    type: 'Regular',
    status: 'Active',
    displayOrder: 5,
  },
  {
    id: 'grp-06',
    groupName: 'English Kids — 2-guruh',
    course: 'English Kids (3–10 yosh)',
    courseId: 'c-kids',
    teacher: 'Dilnoza Rahimova',
    teacherId: 't-dilnoza',
    branch: '2-Filial (Texnikum)',
    room: '301-Xona',
    days: 'Dush / Chor / Juma',
    time: '11:00 - 12:00',
    startTime: '11:00',
    endTime: '12:00',
    maxCapacity: 12,
    studentsCount: 12,
    type: 'Regular',
    status: 'Active',
    displayOrder: 6,
  },
  {
    id: 'grp-07',
    groupName: 'Mental Arifmetika — Junior',
    course: 'Mental Arifmetika',
    courseId: 'c-mental',
    teacher: 'Dilnoza Rahimova',
    teacherId: 't-dilnoza',
    branch: '2-Filial (Texnikum)',
    room: '301-Xona',
    days: 'Sesh / Pay / Shan',
    time: '13:00 - 14:30',
    startTime: '13:00',
    endTime: '14:30',
    maxCapacity: 14,
    studentsCount: 14,
    type: 'Regular',
    status: 'Active',
    displayOrder: 7,
  },
  {
    id: 'grp-08',
    groupName: 'Ona Tili va Adabiyot — 1-guruh',
    course: 'Ona Tili va Adabiyot',
    courseId: 'c-onatili',
    teacher: 'Sarvar Norboyev',
    teacherId: 't-sarvar',
    branch: '1-Filial (Asosiy)',
    room: '201-Laboratoriya',
    days: 'Dush / Chor / Juma',
    time: '17:30 - 19:30',
    startTime: '17:30',
    endTime: '19:30',
    maxCapacity: 16,
    studentsCount: 10,
    type: 'Regular',
    status: 'Active',
    displayOrder: 8,
  },
];

// Seed Students
export const INITIAL_STUDENTS: StudentRecord[] = [
  // ── DTM & Milliy Sertifikat (c-tarix, t-diyorbek) ── 2 demo students ──
  {
    id: 'st-01', fullName: 'Hasanboyeva Sevinch', name: 'Hasanboyeva Sevinch',
    phone: '+998 90 123 45 67', course: 'DTM & Milliy Sertifikat', courseId: 'c-tarix',
    teacher: 'Diyorbek Furqatovich', teacherId: 't-diyorbek', groupId: 'grp-01',
    groupName: 'DTM & Milliy Sertifikat — 1-guruh', enrollmentDate: '2025-09-01',
    tuitionFee: 380000, monthlyFee: 380000, paymentStatus: 'Paid', debtAmount: 0,
    nextDueDate: '2026-10-01', notes: "187.9 ball bilan O'zDJTU davlat grantiga qabul qilingan",
    isActive: true, status: 'Active', totalPaid: 3040000, balance: 0, attendanceRate: 97,
  },
  {
    id: 'st-02', fullName: 'Javohir Ergashev', name: 'Javohir Ergashev',
    phone: '+998 97 456 78 90', course: 'DTM & Milliy Sertifikat', courseId: 'c-tarix',
    teacher: 'Diyorbek Furqatovich', teacherId: 't-diyorbek', groupId: 'grp-02',
    groupName: 'DTM & Milliy Sertifikat — 2-guruh (Tushki)', enrollmentDate: '2025-10-10',
    tuitionFee: 380000, monthlyFee: 380000, paymentStatus: 'Paid', debtAmount: 0,
    nextDueDate: '2026-10-10', notes: "Yakuniy imtihonga tayyor",
    isActive: true, status: 'Active', totalPaid: 2280000, balance: 0, attendanceRate: 92,
  },
  // ── Matematika & Fizika (c-matematika, t-jasur) ── 1 demo student ──
  {
    id: 'st-03', fullName: 'Azizbek Toshmatov', name: 'Azizbek Toshmatov',
    phone: '+998 91 234 56 78', course: 'Matematika & Fizika', courseId: 'c-matematika',
    teacher: 'Jasur Alimov', teacherId: 't-jasur', groupId: 'grp-03',
    groupName: 'Matematika & Fizika — DTM 1-guruh', enrollmentDate: '2025-09-15',
    tuitionFee: 380000, monthlyFee: 380000, paymentStatus: 'Paid', debtAmount: 0,
    nextDueDate: '2026-10-15', notes: "TATU grantiga da'vogar, intizomli",
    isActive: true, status: 'Active', totalPaid: 3040000, balance: 0, attendanceRate: 95,
  },
  // ── CEFR Ingliz Tili (c-cefr, t-malika) ── 1 demo student ──
  {
    id: 'st-04', fullName: 'Madina Karimova', name: 'Madina Karimova',
    phone: '+998 93 345 67 89', course: 'CEFR Ingliz Tili (B2 / C1)', courseId: 'c-cefr',
    teacher: 'Malika Karimova', teacherId: 't-malika', groupId: 'grp-04',
    groupName: 'CEFR Ingliz Tili — B2 FastTrack', enrollmentDate: '2025-10-01',
    tuitionFee: 350000, monthlyFee: 350000, paymentStatus: 'Paid', debtAmount: 0,
    nextDueDate: '2026-10-01', notes: "SpeakingClub a'zosi",
    isActive: true, status: 'Active', totalPaid: 2450000, balance: 0, attendanceRate: 94,
  },
  // ── English Kids (c-kids, t-dilnoza) ── 12 demo students ──
  {
    id: 'st-k01', fullName: 'Nodirbek Karimov', name: 'Nodirbek Karimov',
    phone: '+998 90 111 11 11', course: 'English Kids (3–10 yosh)', courseId: 'c-kids',
    teacher: 'Dilnoza Rahimova', teacherId: 't-dilnoza', groupId: 'grp-05',
    groupName: 'English Kids — 1-guruh', enrollmentDate: '2025-09-01',
    tuitionFee: 290000, monthlyFee: 290000, paymentStatus: 'Paid', debtAmount: 0,
    nextDueDate: '2026-10-01', notes: '3 yosh, eng kichik talaba',
    isActive: true, status: 'Active', totalPaid: 2030000, balance: 0, attendanceRate: 98,
  },
  {
    id: 'st-k02', fullName: 'Milana Tosheva', name: 'Milana Tosheva',
    phone: '+998 90 222 22 22', course: 'English Kids (3–10 yosh)', courseId: 'c-kids',
    teacher: 'Dilnoza Rahimova', teacherId: 't-dilnoza', groupId: 'grp-05',
    groupName: 'English Kids — 1-guruh', enrollmentDate: '2025-09-01',
    tuitionFee: 290000, monthlyFee: 290000, paymentStatus: 'Paid', debtAmount: 0,
    nextDueDate: '2026-10-01', notes: '5 yosh, juda faol',
    isActive: true, status: 'Active', totalPaid: 2030000, balance: 0, attendanceRate: 97,
  },
  {
    id: 'st-k03', fullName: 'Amirxon Raxmatov', name: 'Amirxon Raxmatov',
    phone: '+998 91 333 33 33', course: 'English Kids (3–10 yosh)', courseId: 'c-kids',
    teacher: 'Dilnoza Rahimova', teacherId: 't-dilnoza', groupId: 'grp-05',
    groupName: 'English Kids — 1-guruh', enrollmentDate: '2025-09-01',
    tuitionFee: 290000, monthlyFee: 290000, paymentStatus: 'Paid', debtAmount: 0,
    nextDueDate: '2026-10-01', notes: '4 yosh',
    isActive: true, status: 'Active', totalPaid: 2030000, balance: 0, attendanceRate: 96,
  },
  {
    id: 'st-k04', fullName: 'Sabina Mirzayeva', name: 'Sabina Mirzayeva',
    phone: '+998 91 444 44 44', course: 'English Kids (3–10 yosh)', courseId: 'c-kids',
    teacher: 'Dilnoza Rahimova', teacherId: 't-dilnoza', groupId: 'grp-05',
    groupName: 'English Kids — 1-guruh', enrollmentDate: '2025-09-01',
    tuitionFee: 290000, monthlyFee: 290000, paymentStatus: 'Paid', debtAmount: 0,
    nextDueDate: '2026-10-01', notes: '6 yosh',
    isActive: true, status: 'Active', totalPaid: 2030000, balance: 0, attendanceRate: 95,
  },
  {
    id: 'st-k05', fullName: 'Jasurbek Shoxruxov', name: 'Jasurbek Shoxruxov',
    phone: '+998 93 555 55 55', course: 'English Kids (3–10 yosh)', courseId: 'c-kids',
    teacher: 'Dilnoza Rahimova', teacherId: 't-dilnoza', groupId: 'grp-05',
    groupName: 'English Kids — 1-guruh', enrollmentDate: '2025-09-01',
    tuitionFee: 290000, monthlyFee: 290000, paymentStatus: 'Paid', debtAmount: 0,
    nextDueDate: '2026-10-01', notes: '5 yosh, onasi bilan keladi',
    isActive: true, status: 'Active', totalPaid: 2030000, balance: 0, attendanceRate: 94,
  },
  {
    id: 'st-k06', fullName: 'Sevinch Alimova', name: 'Sevinch Alimova',
    phone: '+998 93 666 66 66', course: 'English Kids (3–10 yosh)', courseId: 'c-kids',
    teacher: 'Dilnoza Rahimova', teacherId: 't-dilnoza', groupId: 'grp-05',
    groupName: 'English Kids — 1-guruh', enrollmentDate: '2025-09-01',
    tuitionFee: 290000, monthlyFee: 290000, paymentStatus: 'Paid', debtAmount: 0,
    nextDueDate: '2026-10-01', notes: '3 yosh',
    isActive: true, status: 'Active', totalPaid: 2030000, balance: 0, attendanceRate: 97,
  },
  {
    id: 'st-k07', fullName: 'Rustam Nematov', name: 'Rustam Nematov',
    phone: '+998 97 777 77 77', course: 'English Kids (3–10 yosh)', courseId: 'c-kids',
    teacher: 'Dilnoza Rahimova', teacherId: 't-dilnoza', groupId: 'grp-06',
    groupName: 'English Kids — 2-guruh', enrollmentDate: '2025-09-15',
    tuitionFee: 290000, monthlyFee: 290000, paymentStatus: 'Paid', debtAmount: 0,
    nextDueDate: '2026-10-15', notes: '7 yosh, maktab o\'quvchisi',
    isActive: true, status: 'Active', totalPaid: 1740000, balance: 0, attendanceRate: 96,
  },
  {
    id: 'st-k08', fullName: 'Malika Tosheva', name: 'Malika Tosheva',
    phone: '+998 97 888 88 88', course: 'English Kids (3–10 yosh)', courseId: 'c-kids',
    teacher: 'Dilnoza Rahimova', teacherId: 't-dilnoza', groupId: 'grp-06',
    groupName: 'English Kids — 2-guruh', enrollmentDate: '2025-09-15',
    tuitionFee: 290000, monthlyFee: 290000, paymentStatus: 'Paid', debtAmount: 0,
    nextDueDate: '2026-10-15', notes: '8 yosh, 3-sinf',
    isActive: true, status: 'Active', totalPaid: 1740000, balance: 0, attendanceRate: 95,
  },
  {
    id: 'st-k09', fullName: 'Davron Eshonov', name: 'Davron Eshonov',
    phone: '+998 94 999 99 99', course: 'English Kids (3–10 yosh)', courseId: 'c-kids',
    teacher: 'Dilnoza Rahimova', teacherId: 't-dilnoza', groupId: 'grp-06',
    groupName: 'English Kids — 2-guruh', enrollmentDate: '2025-09-15',
    tuitionFee: 290000, monthlyFee: 290000, paymentStatus: 'Paid', debtAmount: 0,
    nextDueDate: '2026-10-15', notes: '6 yosh',
    isActive: true, status: 'Active', totalPaid: 1740000, balance: 0, attendanceRate: 93,
  },
  {
    id: 'st-k10', fullName: 'Nilufar Karimova', name: 'Nilufar Karimova',
    phone: '+998 94 100 01 01', course: 'English Kids (3–10 yosh)', courseId: 'c-kids',
    teacher: 'Dilnoza Rahimova', teacherId: 't-dilnoza', groupId: 'grp-06',
    groupName: 'English Kids — 2-guruh', enrollmentDate: '2025-09-15',
    tuitionFee: 290000, monthlyFee: 290000, paymentStatus: 'Paid', debtAmount: 0,
    nextDueDate: '2026-10-15', notes: '9 yosh, 4-sinf',
    isActive: true, status: 'Active', totalPaid: 1740000, balance: 0, attendanceRate: 97,
  },
  {
    id: 'st-k11', fullName: 'Abdulloh Raxmatov', name: 'Abdulloh Raxmatov',
    phone: '+998 90 101 01 01', course: 'English Kids (3–10 yosh)', courseId: 'c-kids',
    teacher: 'Dilnoza Rahimova', teacherId: 't-dilnoza', groupId: 'grp-06',
    groupName: 'English Kids — 2-guruh', enrollmentDate: '2025-09-15',
    tuitionFee: 290000, monthlyFee: 290000, paymentStatus: 'Paid', debtAmount: 0,
    nextDueDate: '2026-10-15', notes: '4 yosh, akasi bilan',
    isActive: true, status: 'Active', totalPaid: 1740000, balance: 0, attendanceRate: 98,
  },
  {
    id: 'st-k12', fullName: 'Dildora Nematova', name: 'Dildora Nematova',
    phone: '+998 90 102 02 02', course: 'English Kids (3–10 yosh)', courseId: 'c-kids',
    teacher: 'Dilnoza Rahimova', teacherId: 't-dilnoza', groupId: 'grp-06',
    groupName: 'English Kids — 2-guruh', enrollmentDate: '2025-09-15',
    tuitionFee: 290000, monthlyFee: 290000, paymentStatus: 'Paid', debtAmount: 0,
    nextDueDate: '2026-10-15', notes: '5 yosh',
    isActive: true, status: 'Active', totalPaid: 1740000, balance: 0, attendanceRate: 96,
  },
  // ── Mental Arifmetika (c-mental, t-dilnoza) ── 14 demo students ──
  {
    id: 'st-m01', fullName: 'Sardor Ergashev', name: 'Sardor Ergashev',
    phone: '+998 91 201 01 01', course: 'Mental Arifmetika', courseId: 'c-mental',
    teacher: 'Dilnoza Rahimova', teacherId: 't-dilnoza', groupId: 'grp-07',
    groupName: 'Mental Arifmetika — Junior', enrollmentDate: '2025-09-01',
    tuitionFee: 280000, monthlyFee: 280000, paymentStatus: 'Paid', debtAmount: 0,
    nextDueDate: '2026-10-01', notes: 'A\'lo ko\'rsatkich, olimpiada ishtirokchisi',
    isActive: true, status: 'Active', totalPaid: 1960000, balance: 0, attendanceRate: 98,
  },
  {
    id: 'st-m02', fullName: 'Dilshod Karimov', name: 'Dilshod Karimov',
    phone: '+998 91 202 02 02', course: 'Mental Arifmetika', courseId: 'c-mental',
    teacher: 'Dilnoza Rahimova', teacherId: 't-dilnoza', groupId: 'grp-07',
    groupName: 'Mental Arifmetika — Junior', enrollmentDate: '2025-09-01',
    tuitionFee: 280000, monthlyFee: 280000, paymentStatus: 'Paid', debtAmount: 0,
    nextDueDate: '2026-10-01', notes: '7 yosh',
    isActive: true, status: 'Active', totalPaid: 1960000, balance: 0, attendanceRate: 96,
  },
  {
    id: 'st-m03', fullName: 'Malika Normatova', name: 'Malika Normatova',
    phone: '+998 93 203 03 03', course: 'Mental Arifmetika', courseId: 'c-mental',
    teacher: 'Dilnoza Rahimova', teacherId: 't-dilnoza', groupId: 'grp-07',
    groupName: 'Mental Arifmetika — Junior', enrollmentDate: '2025-09-01',
    tuitionFee: 280000, monthlyFee: 280000, paymentStatus: 'Paid', debtAmount: 0,
    nextDueDate: '2026-10-01', notes: '6 yosh, boshlang\'ich sinf',
    isActive: true, status: 'Active', totalPaid: 1960000, balance: 0, attendanceRate: 94,
  },
  {
    id: 'st-m04', fullName: 'Muhammadamin Toshev', name: 'Muhammadamin Toshev',
    phone: '+998 93 204 04 04', course: 'Mental Arifmetika', courseId: 'c-mental',
    teacher: 'Dilnoza Rahimova', teacherId: 't-dilnoza', groupId: 'grp-07',
    groupName: 'Mental Arifmetika — Junior', enrollmentDate: '2025-09-01',
    tuitionFee: 280000, monthlyFee: 280000, paymentStatus: 'Paid', debtAmount: 0,
    nextDueDate: '2026-10-01', notes: '8 yosh, tez hisoblaydi',
    isActive: true, status: 'Active', totalPaid: 1960000, balance: 0, attendanceRate: 97,
  },
  {
    id: 'st-m05', fullName: 'Sabohat Xolmatova', name: 'Sabohat Xolmatova',
    phone: '+998 97 205 05 05', course: 'Mental Arifmetika', courseId: 'c-mental',
    teacher: 'Dilnoza Rahimova', teacherId: 't-dilnoza', groupId: 'grp-07',
    groupName: 'Mental Arifmetika — Junior', enrollmentDate: '2025-09-01',
    tuitionFee: 280000, monthlyFee: 280000, paymentStatus: 'Paid', debtAmount: 0,
    nextDueDate: '2026-10-01', notes: '5 yosh, onasi olib keldi',
    isActive: true, status: 'Active', totalPaid: 1960000, balance: 0, attendanceRate: 95,
  },
  {
    id: 'st-m06', fullName: 'Nodirbek Raximov', name: 'Nodirbek Raximov',
    phone: '+998 97 206 06 06', course: 'Mental Arifmetika', courseId: 'c-mental',
    teacher: 'Dilnoza Rahimova', teacherId: 't-dilnoza', groupId: 'grp-07',
    groupName: 'Mental Arifmetika — Junior', enrollmentDate: '2025-09-01',
    tuitionFee: 280000, monthlyFee: 280000, paymentStatus: 'Paid', debtAmount: 0,
    nextDueDate: '2026-10-01', notes: '9 yosh',
    isActive: true, status: 'Active', totalPaid: 1960000, balance: 0, attendanceRate: 93,
  },
  {
    id: 'st-m07', fullName: 'Farrux Normatov', name: 'Farrux Normatov',
    phone: '+998 94 207 07 07', course: 'Mental Arifmetika', courseId: 'c-mental',
    teacher: 'Dilnoza Rahimova', teacherId: 't-dilnoza', groupId: 'grp-07',
    groupName: 'Mental Arifmetika — Junior', enrollmentDate: '2025-09-01',
    tuitionFee: 280000, monthlyFee: 280000, paymentStatus: 'Paid', debtAmount: 0,
    nextDueDate: '2026-10-01', notes: '7 yosh, 2-sinf',
    isActive: true, status: 'Active', totalPaid: 1960000, balance: 0, attendanceRate: 96,
  },
  {
    id: 'st-m08', fullName: 'Dilnoza Eshonova', name: 'Dilnoza Eshonova',
    phone: '+998 94 208 08 08', course: 'Mental Arifmetika', courseId: 'c-mental',
    teacher: 'Dilnoza Rahimova', teacherId: 't-dilnoza', groupId: 'grp-07',
    groupName: 'Mental Arifmetika — Junior', enrollmentDate: '2025-09-01',
    tuitionFee: 280000, monthlyFee: 280000, paymentStatus: 'Paid', debtAmount: 0,
    nextDueDate: '2026-10-01', notes: '6 yosh',
    isActive: true, status: 'Active', totalPaid: 1960000, balance: 0, attendanceRate: 98,
  },
  {
    id: 'st-m09', fullName: 'Asadbek Mirzayev', name: 'Asadbek Mirzayev',
    phone: '+998 90 209 09 09', course: 'Mental Arifmetika', courseId: 'c-mental',
    teacher: 'Dilnoza Rahimova', teacherId: 't-dilnoza', groupId: 'grp-07',
    groupName: 'Mental Arifmetika — Junior', enrollmentDate: '2025-09-01',
    tuitionFee: 280000, monthlyFee: 280000, paymentStatus: 'Paid', debtAmount: 0,
    nextDueDate: '2026-10-01', notes: '8 yosh, tez fikrlaydi',
    isActive: true, status: 'Active', totalPaid: 1960000, balance: 0, attendanceRate: 95,
  },
  {
    id: 'st-m10', fullName: 'Gulnoza Tosheva', name: 'Gulnoza Tosheva',
    phone: '+998 90 210 10 10', course: 'Mental Arifmetika', courseId: 'c-mental',
    teacher: 'Dilnoza Rahimova', teacherId: 't-dilnoza', groupId: 'grp-07',
    groupName: 'Mental Arifmetika — Junior', enrollmentDate: '2025-09-01',
    tuitionFee: 280000, monthlyFee: 280000, paymentStatus: 'Paid', debtAmount: 0,
    nextDueDate: '2026-10-01', notes: '5 yosh, DTM tayyorlanadi',
    isActive: true, status: 'Active', totalPaid: 1960000, balance: 0, attendanceRate: 97,
  },
  {
    id: 'st-m11', fullName: 'Suhrob Karimov', name: 'Suhrob Karimov',
    phone: '+998 91 211 11 11', course: 'Mental Arifmetika', courseId: 'c-mental',
    teacher: 'Dilnoza Rahimova', teacherId: 't-dilnoza', groupId: 'grp-07',
    groupName: 'Mental Arifmetika — Junior', enrollmentDate: '2025-09-01',
    tuitionFee: 280000, monthlyFee: 280000, paymentStatus: 'Paid', debtAmount: 0,
    nextDueDate: '2026-10-01', notes: '7 yosh',
    isActive: true, status: 'Active', totalPaid: 1960000, balance: 0, attendanceRate: 94,
  },
  {
    id: 'st-m12', fullName: 'Sevara Raxmatova', name: 'Sevara Raxmatova',
    phone: '+998 91 212 12 12', course: 'Mental Arifmetika', courseId: 'c-mental',
    teacher: 'Dilnoza Rahimova', teacherId: 't-dilnoza', groupId: 'grp-07',
    groupName: 'Mental Arifmetika — Junior', enrollmentDate: '2025-09-01',
    tuitionFee: 280000, monthlyFee: 280000, paymentStatus: 'Paid', debtAmount: 0,
    nextDueDate: '2026-10-01', notes: '6 yosh, opasi bilan',
    isActive: true, status: 'Active', totalPaid: 1960000, balance: 0, attendanceRate: 96,
  },
  {
    id: 'st-m13', fullName: 'Timur Xolmatov', name: 'Timur Xolmatov',
    phone: '+998 93 213 13 13', course: 'Mental Arifmetika', courseId: 'c-mental',
    teacher: 'Dilnoza Rahimova', teacherId: 't-dilnoza', groupId: 'grp-07',
    groupName: 'Mental Arifmetika — Junior', enrollmentDate: '2025-09-01',
    tuitionFee: 280000, monthlyFee: 280000, paymentStatus: 'Paid', debtAmount: 0,
    nextDueDate: '2026-10-01', notes: '9 yosh',
    isActive: true, status: 'Active', totalPaid: 1960000, balance: 0, attendanceRate: 93,
  },
  {
    id: 'st-m14', fullName: 'Shoxsanam Eshonova', name: 'Shoxsanam Eshonova',
    phone: '+998 93 214 14 14', course: 'Mental Arifmetika', courseId: 'c-mental',
    teacher: 'Dilnoza Rahimova', teacherId: 't-dilnoza', groupId: 'grp-07',
    groupName: 'Mental Arifmetika — Junior', enrollmentDate: '2025-09-01',
    tuitionFee: 280000, monthlyFee: 280000, paymentStatus: 'Paid', debtAmount: 0,
    nextDueDate: '2026-10-01', notes: '8 yosh',
    isActive: true, status: 'Active', totalPaid: 1960000, balance: 0, attendanceRate: 97,
  },
  // ── Ona Tili va Adabiyot (c-onatili, t-sarvar) ── 10 demo students ──
  {
    id: 'st-o01', fullName: 'Nilufar Xasanova', name: 'Nilufar Xasanova',
    phone: '+998 97 301 01 01', course: 'Ona Tili va Adabiyot', courseId: 'c-onatili',
    teacher: 'Sarvar Norboyev', teacherId: 't-sarvar', groupId: 'grp-08',
    groupName: 'Ona Tili va Adabiyot — 1-guruh', enrollmentDate: '2025-09-01',
    tuitionFee: 320000, monthlyFee: 320000, paymentStatus: 'Paid', debtAmount: 0,
    nextDueDate: '2026-10-01', notes: 'A\'lochi, 148 ball DTM',
    isActive: true, status: 'Active', totalPaid: 2560000, balance: 0, attendanceRate: 98,
  },
  {
    id: 'st-o02', fullName: 'Javlon Toshmatov', name: 'Javlon Toshmatov',
    phone: '+998 97 302 02 02', course: 'Ona Tili va Adabiyot', courseId: 'c-onatili',
    teacher: 'Sarvar Norboyev', teacherId: 't-sarvar', groupId: 'grp-08',
    groupName: 'Ona Tili va Adabiyot — 1-guruh', enrollmentDate: '2025-09-01',
    tuitionFee: 320000, monthlyFee: 320000, paymentStatus: 'Paid', debtAmount: 0,
    nextDueDate: '2026-10-01', notes: 'Yaxshi natija, 142 ball',
    isActive: true, status: 'Active', totalPaid: 2560000, balance: 0, attendanceRate: 95,
  },
  {
    id: 'st-o03', fullName: 'Dilnoza Karimova', name: 'Dilnoza Karimova',
    phone: '+998 94 303 03 03', course: 'Ona Tili va Adabiyot', courseId: 'c-onatili',
    teacher: 'Sarvar Norboyev', teacherId: 't-sarvar', groupId: 'grp-08',
    groupName: 'Ona Tili va Adabiyot — 1-guruh', enrollmentDate: '2025-09-01',
    tuitionFee: 320000, monthlyFee: 320000, paymentStatus: 'Paid', debtAmount: 0,
    nextDueDate: '2026-10-01', notes: '135 ball',
    isActive: true, status: 'Active', totalPaid: 2560000, balance: 0, attendanceRate: 93,
  },
  {
    id: 'st-o04', fullName: 'Azizbek Raxmatov', name: 'Azizbek Raxmatov',
    phone: '+998 94 304 04 04', course: 'Ona Tili va Adabiyot', courseId: 'c-onatili',
    teacher: 'Sarvar Norboyev', teacherId: 't-sarvar', groupId: 'grp-08',
    groupName: 'Ona Tili va Adabiyot — 1-guruh', enrollmentDate: '2025-09-01',
    tuitionFee: 320000, monthlyFee: 320000, paymentStatus: 'Paid', debtAmount: 0,
    nextDueDate: '2026-10-01', notes: '140 ball',
    isActive: true, status: 'Active', totalPaid: 2560000, balance: 0, attendanceRate: 96,
  },
  {
    id: 'st-o05', fullName: 'Gulsara Tosheva', name: 'Gulsara Tosheva',
    phone: '+998 90 305 05 05', course: 'Ona Tili va Adabiyot', courseId: 'c-onatili',
    teacher: 'Sarvar Norboyev', teacherId: 't-sarvar', groupId: 'grp-08',
    groupName: 'Ona Tili va Adabiyot — 1-guruh', enrollmentDate: '2025-09-01',
    tuitionFee: 320000, monthlyFee: 320000, paymentStatus: 'Paid', debtAmount: 0,
    nextDueDate: '2026-10-01', notes: '138 ball',
    isActive: true, status: 'Active', totalPaid: 2560000, balance: 0, attendanceRate: 97,
  },
  {
    id: 'st-o06', fullName: 'Otabek Eshonov', name: 'Otabek Eshonov',
    phone: '+998 90 306 06 06', course: 'Ona Tili va Adabiyot', courseId: 'c-onatili',
    teacher: 'Sarvar Norboyev', teacherId: 't-sarvar', groupId: 'grp-08',
    groupName: 'Ona Tili va Adabiyot — 1-guruh', enrollmentDate: '2025-09-01',
    tuitionFee: 320000, monthlyFee: 320000, paymentStatus: 'Paid', debtAmount: 0,
    nextDueDate: '2026-10-01', notes: '130 ball, yaxshilanmoqda',
    isActive: true, status: 'Active', totalPaid: 2560000, balance: 0, attendanceRate: 91,
  },
  {
    id: 'st-o07', fullName: 'Nodirjon Mirzayev', name: 'Nodirjon Mirzayev',
    phone: '+998 91 307 07 07', course: 'Ona Tili va Adabiyot', courseId: 'c-onatili',
    teacher: 'Sarvar Norboyev', teacherId: 't-sarvar', groupId: 'grp-08',
    groupName: 'Ona Tili va Adabiyot — 1-guruh', enrollmentDate: '2025-09-01',
    tuitionFee: 320000, monthlyFee: 320000, paymentStatus: 'Paid', debtAmount: 0,
    nextDueDate: '2026-10-01', notes: '145 ball',
    isActive: true, status: 'Active', totalPaid: 2560000, balance: 0, attendanceRate: 96,
  },
  {
    id: 'st-o08', fullName: 'Sevinch Normatova', name: 'Sevinch Normatova',
    phone: '+998 91 308 08 08', course: 'Ona Tili va Adabiyot', courseId: 'c-onatili',
    teacher: 'Sarvar Norboyev', teacherId: 't-sarvar', groupId: 'grp-08',
    groupName: 'Ona Tili va Adabiyot — 1-guruh', enrollmentDate: '2025-09-01',
    tuitionFee: 320000, monthlyFee: 320000, paymentStatus: 'Paid', debtAmount: 0,
    nextDueDate: '2026-10-01', notes: '136 ball',
    isActive: true, status: 'Active', totalPaid: 2560000, balance: 0, attendanceRate: 94,
  },
  {
    id: 'st-o09', fullName: 'Abdumajid Xolmatov', name: 'Abdumajid Xolmatov',
    phone: '+998 93 309 09 09', course: 'Ona Tili va Adabiyot', courseId: 'c-onatili',
    teacher: 'Sarvar Norboyev', teacherId: 't-sarvar', groupId: 'grp-08',
    groupName: 'Ona Tili va Adabiyot — 1-guruh', enrollmentDate: '2025-09-01',
    tuitionFee: 320000, monthlyFee: 320000, paymentStatus: 'Paid', debtAmount: 0,
    nextDueDate: '2026-10-01', notes: '141 ball',
    isActive: true, status: 'Active', totalPaid: 2560000, balance: 0, attendanceRate: 95,
  },
  {
    id: 'st-o10', fullName: 'Feruza Karimova', name: 'Feruza Karimova',
    phone: '+998 93 310 10 10', course: 'Ona Tili va Adabiyot', courseId: 'c-onatili',
    teacher: 'Sarvar Norboyev', teacherId: 't-sarvar', groupId: 'grp-08',
    groupName: 'Ona Tili va Adabiyot — 1-guruh', enrollmentDate: '2025-09-01',
    tuitionFee: 320000, monthlyFee: 320000, paymentStatus: 'Paid', debtAmount: 0,
    nextDueDate: '2026-10-01', notes: '139 ball',
    isActive: true, status: 'Active', totalPaid: 2560000, balance: 0, attendanceRate: 97,
  },
];

// Seed Leads
export const INITIAL_LEADS: Lead[] = [
  {
    id: 'lead-01', name: 'Ali Valiyev', phone: '+998 90 123 45 67',
    course: 'DTM & Milliy Sertifikat',
    createdAt: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
    assignedTo: 'Diyorbek Furqatovich',
    notes: "Tarix bo'yicha Milliy sertifikatga qiziqmoqda, yakshanba kungi sinov darsiga chaqirildi.",
    status: 'Sinov darsi belgilandi', source: 'Bosh sahifa (Hero forma)',
    trialDateTime: new Date(Date.now() + 7 * 3600 * 1000).toISOString(),
  },
  {
    id: 'lead-02', name: 'Ziyoda Rahimova', phone: '+998 93 543 21 00',
    course: 'CEFR Ingliz Tili (B2 / C1)',
    createdAt: new Date(Date.now() - 4 * 3600 * 1000).toISOString(),
    assignedTo: 'Malika Karimova',
    notes: "Yangi ariza keldi. Qo'ng'iroq qilib darajasini aniqlash kerak.",
    status: 'Yangi', source: 'Telegram bot orqali',
  },
  {
    id: 'lead-03', name: 'Olimjon Qosimov', phone: '+998 97 789 12 34',
    course: 'Matematika & Fizika',
    createdAt: new Date(Date.now() - 3 * 24 * 3600 * 1000).toISOString(),
    lastContactedAt: new Date(Date.now() - 2.5 * 24 * 3600 * 1000).toISOString(),
    assignedTo: 'Jasur Alimov',
    notes: "Telefon orqali maslahat berildi. Ota-onasi bilan filialga kelishini aytdi.",
    status: "Bog'lanildi", source: 'Sayt orqali ariza',
  },
  {
    id: 'lead-04', name: 'Gulnoza Saidova', phone: '+998 99 876 54 32',
    course: 'English Kids (3–10 yosh)',
    createdAt: new Date(Date.now() - 28 * 3600 * 1000).toISOString(),
    assignedTo: 'Dilnoza Rahimova',
    notes: "Sinov darsida qatnashdi va to'lov qilib o'quvchiga aylandi.",
    status: "O'quvchiga aylandi", source: 'Tavsiya asosida',
    enrollmentDate: '2026-03-08',
  },
  {
    id: 'lead-05', name: 'Sardor Norboyev', phone: '+998 90 234 56 78',
    course: 'DTM & Milliy Sertifikat',
    createdAt: new Date(Date.now() - 5 * 24 * 3600 * 1000).toISOString(),
    lastContactedAt: new Date(Date.now() - 3 * 24 * 3600 * 1000).toISOString(),
    assignedTo: 'Diyorbek Furqatovich',
    notes: "Birinchi qo'ng'iroq qilindi, juma kuni filialga kelishini aytdi.",
    status: "Bog'lanildi", source: 'Instagram orqali',
  },
  {
    id: 'lead-06', name: 'Malika Alimova', phone: '+998 91 345 67 89',
    course: 'Mental Arifmetika',
    createdAt: new Date(Date.now() - 1 * 24 * 3600 * 1000).toISOString(),
    assignedTo: 'Dilnoza Rahimova',
    notes: "5 yoshli bola uchun Mental Arifmetika qiziqmoqda.",
    status: 'Yangi', source: "Do'st tavsiyasi",
  },
  {
    id: 'lead-07', name: 'Farhod Toshev', phone: '+998 93 456 78 90',
    course: 'Ona Tili va Adabiyot',
    createdAt: new Date(Date.now() - 4 * 24 * 3600 * 1000).toISOString(),
    assignedTo: 'Sarvar Norboyev',
    notes: "DTM Ona tili fanidan tayyorgarlik ko'rmoqda. Yakshanba sinoviga taklif qilindi.",
    status: 'Sinov darsi belgilandi', source: 'Sayt orqali ariza',
    trialDateTime: new Date(Date.now() + 2 * 24 * 3600 * 1000).toISOString(),
  },
  {
    id: 'lead-08', name: 'Dilshod Karimov', phone: '+998 97 567 89 01',
    course: 'Matematika & Fizika',
    createdAt: new Date(Date.now() - 7 * 24 * 3600 * 1000).toISOString(),
    lastContactedAt: new Date(Date.now() - 6 * 24 * 3600 * 1000).toISOString(),
    assignedTo: 'Jasur Alimov',
    notes: "Telefon qilindi, javob bermadi. Qayta bog'lanish kerak.",
    status: "Bog'lanildi", source: 'Telegram bot orqali',
  },
  {
    id: 'lead-09', name: 'Nodira Karimova', phone: '+998 94 678 90 12',
    course: 'CEFR Ingliz Tili (B2 / C1)',
    createdAt: new Date(Date.now() - 10 * 24 * 3600 * 1000).toISOString(),
    assignedTo: 'Malika Karimova',
    notes: "Sinov darsida qatnashdi, B2 darajasi aniqlandi. To'lov qildi.",
    status: "O'quvchiga aylandi", source: 'Sayt orqali ariza',
    enrollmentDate: '2026-03-01',
  },
  {
    id: 'lead-10', name: 'Javlon Raxmatov', phone: '+998 90 789 01 23',
    course: 'English Kids (3–10 yosh)',
    createdAt: new Date(Date.now() - 2 * 24 * 3600 * 1000).toISOString(),
    assignedTo: 'Dilnoza Rahimova',
    notes: "3 yoshli bola uchun ingliz tili izlayapti. Hali sinovda bo'lmadi.",
    status: 'Yangi', source: 'Instagram orqali',
  },
  {
    id: 'lead-11', name: 'Akbar Shoxruxov', phone: '+998 91 890 12 34',
    course: 'DTM & Milliy Sertifikat',
    createdAt: new Date(Date.now() - 14 * 24 * 3600 * 1000).toISOString(),
    assignedTo: 'Diyorbek Furqatovich',
    notes: "Qo'ng'iroq qilindi, qiziqmadi. Yo'qotildi deb belgilash kerak.",
    status: "Yo'qotildi", source: 'Bosh sahifa (Hero forma)',
  },
  {
    id: 'lead-12', name: 'Shoxsanam Eshonova', phone: '+998 93 901 23 45',
    course: 'Mental Arifmetika',
    createdAt: new Date(Date.now() - 1 * 24 * 3600 * 1000).toISOString(),
    assignedTo: 'Dilnoza Rahimova',
    notes: "6 yoshli qiz uchun Mental Arifmetika qiziqmoqda. Ota-onasi bilan kelishini aytdi.",
    status: 'Yangi', source: 'Telegram bot orqali',
  },
];

// Seed Payments — dates are relative to "today" so demo KPIs/finance chart always look alive
const fmtIdxDate = (offsetDays: number) => {
  const d = new Date();
  d.setDate(d.getDate() - offsetDays);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};
const fmtIdxMonth = (offsetMonths: number, day = 1) => {
  const d = new Date();
  d.setDate(1);
  d.setMonth(d.getMonth() - offsetMonths);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
};

export const INITIAL_PAYMENTS: IncomePaymentRecord[] = [
  {
    id: 'pay-01', studentId: 'st-01', studentName: 'Hasanboyeva Sevinch',
    course: 'DTM & Milliy Sertifikat', amount: 380000, date: fmtIdxDate(2),
    method: 'Click', receiptNumber: 'REC-24891', status: 'Completed',
    recordedBy: 'Administrator', notes: "Joriy oy uchun to'liq to'lov",
    month: fmtIdxMonth(0).slice(0, 7),
  },
  {
    id: 'pay-02', studentId: 'st-02', studentName: 'Javohir Ergashev',
    course: 'DTM & Milliy Sertifikat', amount: 380000, date: fmtIdxDate(5),
    method: 'Payme', receiptNumber: 'REC-24892', status: 'Completed',
    recordedBy: 'Administrator', notes: "Joriy oy to'lovi",
    month: fmtIdxMonth(0).slice(0, 7),
  },
  {
    id: 'pay-03', studentId: 'st-03', studentName: 'Azizbek Toshmatov',
    course: 'Matematika & Fizika', amount: 380000, date: fmtIdxDate(3),
    method: 'Cash', receiptNumber: 'REC-24893', status: 'Completed',
    recordedBy: 'Qabulxona', notes: "Naqd qabul qilindi, chek berildi",
    month: fmtIdxMonth(0).slice(0, 7),
  },
  {
    id: 'pay-04', studentId: 'st-04', studentName: 'Madina Karimova',
    course: 'CEFR Ingliz Tili (B2 / C1)', amount: 350000, date: fmtIdxDate(4),
    method: 'Card', receiptNumber: 'REC-24894', status: 'Completed',
    recordedBy: 'Qabulxona', notes: "Plastik karta orqali to'landi",
    month: fmtIdxMonth(0).slice(0, 7),
  },
  {
    id: 'pay-05', studentId: 'st-k01', studentName: 'Nodirbek Karimov',
    course: 'English Kids (3–10 yosh)', amount: 290000, date: fmtIdxDate(1),
    method: 'Cash', receiptNumber: 'REC-24895', status: 'Completed',
    recordedBy: 'Dilnoza Rahimova', notes: "Onasi to'lovni amalga oshirdi",
    month: fmtIdxMonth(0).slice(0, 7),
  },
  {
    id: 'pay-06', studentId: 'st-k02', studentName: 'Milana Tosheva',
    course: 'English Kids (3–10 yosh)', amount: 290000, date: fmtIdxDate(1),
    method: 'Click', receiptNumber: 'REC-24896', status: 'Completed',
    recordedBy: 'Dilnoza Rahimova', notes: "Click orqali to'lov",
    month: fmtIdxMonth(0).slice(0, 7),
  },
  {
    id: 'pay-07', studentId: 'st-k03', studentName: 'Amirxon Raxmatov',
    course: 'English Kids (3–10 yosh)', amount: 290000, date: fmtIdxDate(2),
    method: 'Cash', receiptNumber: 'REC-24897', status: 'Completed',
    recordedBy: 'Dilnoza Rahimova', notes: "",
    month: fmtIdxMonth(0).slice(0, 7),
  },
  {
    id: 'pay-08', studentId: 'st-k04', studentName: 'Sabina Mirzayeva',
    course: 'English Kids (3–10 yosh)', amount: 290000, date: fmtIdxDate(3),
    method: 'Payme', receiptNumber: 'REC-24898', status: 'Completed',
    recordedBy: 'Dilnoza Rahimova', notes: "",
    month: fmtIdxMonth(0).slice(0, 7),
  },
  {
    id: 'pay-09', studentId: 'st-k05', studentName: 'Jasurbek Shoxruxov',
    course: 'English Kids (3–10 yosh)', amount: 290000, date: fmtIdxDate(4),
    method: 'Cash', receiptNumber: 'REC-24899', status: 'Completed',
    recordedBy: 'Dilnoza Rahimova', notes: "",
    month: fmtIdxMonth(0).slice(0, 7),
  },
  {
    id: 'pay-10', studentId: 'st-k06', studentName: 'Sevinch Alimova',
    course: 'English Kids (3–10 yosh)', amount: 290000, date: fmtIdxDate(5),
    method: 'Cash', receiptNumber: 'REC-24900', status: 'Completed',
    recordedBy: 'Dilnoza Rahimova', notes: "",
    month: fmtIdxMonth(0).slice(0, 7),
  },
  {
    id: 'pay-11', studentId: 'st-k07', studentName: 'Rustam Nematov',
    course: 'English Kids (3–10 yosh)', amount: 290000, date: fmtIdxDate(6),
    method: 'Click', receiptNumber: 'REC-24901', status: 'Completed',
    recordedBy: 'Dilnoza Rahimova', notes: "",
    month: fmtIdxMonth(0).slice(0, 7),
  },
  {
    id: 'pay-12', studentId: 'st-k08', studentName: 'Malika Tosheva',
    course: 'English Kids (3–10 yosh)', amount: 290000, date: fmtIdxDate(7),
    method: 'Cash', receiptNumber: 'REC-24902', status: 'Completed',
    recordedBy: 'Dilnoza Rahimova', notes: "",
    month: fmtIdxMonth(0).slice(0, 7),
  },
  {
    id: 'pay-13', studentId: 'st-m01', studentName: 'Sardor Ergashev',
    course: 'Mental Arifmetika', amount: 280000, date: fmtIdxDate(2),
    method: 'Payme', receiptNumber: 'REC-24903', status: 'Completed',
    recordedBy: 'Dilnoza Rahimova', notes: "Joriy oy to'lovi",
    month: fmtIdxMonth(0).slice(0, 7),
  },
  {
    id: 'pay-14', studentId: 'st-m02', studentName: 'Dilshod Karimov',
    course: 'Mental Arifmetika', amount: 280000, date: fmtIdxDate(3),
    method: 'Cash', receiptNumber: 'REC-24904', status: 'Completed',
    recordedBy: 'Dilnoza Rahimova', notes: "",
    month: fmtIdxMonth(0).slice(0, 7),
  },
  {
    id: 'pay-15', studentId: 'st-m03', studentName: 'Malika Normatova',
    course: 'Mental Arifmetika', amount: 280000, date: fmtIdxDate(4),
    method: 'Cash', receiptNumber: 'REC-24905', status: 'Completed',
    recordedBy: 'Dilnoza Rahimova', notes: "",
    month: fmtIdxMonth(0).slice(0, 7),
  },
  {
    id: 'pay-16', studentId: 'st-o01', studentName: 'Nilufar Xasanova',
    course: 'Ona Tili va Adabiyot', amount: 320000, date: fmtIdxDate(3),
    method: 'Click', receiptNumber: 'REC-24906', status: 'Completed',
    recordedBy: 'Sarvar Norboyev', notes: "Joriy oy to'lovi",
    month: fmtIdxMonth(0).slice(0, 7),
  },
  {
    id: 'pay-17', studentId: 'st-o02', studentName: 'Javlon Toshmatov',
    course: 'Ona Tili va Adabiyot', amount: 320000, date: fmtIdxDate(4),
    method: 'Cash', receiptNumber: 'REC-24907', status: 'Completed',
    recordedBy: 'Sarvar Norboyev', notes: "",
    month: fmtIdxMonth(0).slice(0, 7),
  },
  {
    id: 'pay-18', studentId: 'st-o03', studentName: 'Dilnoza Karimova',
    course: 'Ona Tili va Adabiyot', amount: 320000, date: fmtIdxDate(5),
    method: 'Payme', receiptNumber: 'REC-24908', status: 'Completed',
    recordedBy: 'Sarvar Norboyev', notes: "",
    month: fmtIdxMonth(0).slice(0, 7),
  },
  {
    id: 'pay-19', studentId: 'st-05', studentName: 'Dilnoza Sobirova',
    course: 'Mental Arifmetika', amount: 280000, date: fmtIdxMonth(1, 5),
    method: 'Cash', receiptNumber: 'REC-24909', status: 'Completed',
    recordedBy: 'Qabulxona', notes: "O'tgan oy uchun to'liq to'lov",
    month: fmtIdxMonth(1).slice(0, 7),
  },
  {
    id: 'pay-20', studentId: 'st-m04', studentName: 'Muhammadamin Toshev',
    course: 'Mental Arifmetika', amount: 280000, date: fmtIdxDate(6),
    method: 'Card', receiptNumber: 'REC-24910', status: 'Completed',
    recordedBy: 'Dilnoza Rahimova', notes: "Plastik karta orqali to'lov",
    month: fmtIdxMonth(0).slice(0, 7),
  },
];

// Seed Expenses
export const INITIAL_EXPENSES: ExpenseRecord[] = [
  {
    id: 'exp-01', category: 'Teacher Salary', title: "O'qituvchi oyligi - Diyorbek Furqatovich",
    amount: 4500000, date: fmtIdxDate(3), recipient: 'Diyorbek Furqatovich',
    teacherId: 't-diyorbek', month: fmtIdxMonth(1).slice(0, 7),
    notes: "O'tgan oy uchun to'liq oylik maosh to'landi",
    paymentMethod: 'Bank Transfer', status: 'Paid',
  },
  {
    id: 'exp-02', category: 'Teacher Salary', title: "O'qituvchi oyligi - Jasur Alimov",
    amount: 3500000, date: fmtIdxDate(3), recipient: 'Jasur Alimov',
    teacherId: 't-jasur', month: fmtIdxMonth(1).slice(0, 7),
    paymentMethod: 'Bank Transfer', status: 'Paid',
  },
  {
    id: 'exp-03', category: 'Teacher Salary', title: "O'qituvchi oyligi - Malika Karimova",
    amount: 3200000, date: fmtIdxDate(3), recipient: 'Malika Karimova',
    teacherId: 't-malika', month: fmtIdxMonth(1).slice(0, 7),
    paymentMethod: 'Bank Transfer', status: 'Paid',
  },
  {
    id: 'exp-04', category: 'Teacher Salary', title: "O'qituvchi oyligi - Dilnoza Rahimova",
    amount: 2800000, date: fmtIdxDate(3), recipient: 'Dilnoza Rahimova',
    teacherId: 't-dilnoza', month: fmtIdxMonth(1).slice(0, 7),
    paymentMethod: 'Bank Transfer', status: 'Paid',
  },
  {
    id: 'exp-05', category: 'Teacher Salary', title: "O'qituvchi oyligi - Sarvar Norboyev",
    amount: 3400000, date: fmtIdxDate(3), recipient: 'Sarvar Norboyev',
    teacherId: 't-sarvar', month: fmtIdxMonth(1).slice(0, 7),
    paymentMethod: 'Bank Transfer', status: 'Paid',
  },
  {
    id: 'exp-06', category: 'Rent', title: "1-Filial Bino Ijarasi (Joriy oy)",
    amount: 5500000, date: fmtIdxDate(1), recipient: "Yangiobod 1-maktab ma'muriyati",
    month: fmtIdxMonth(0).slice(0, 7),
    paymentMethod: 'Bank Transfer', status: 'Paid',
  },
  {
    id: 'exp-07', category: 'Rent', title: "2-Filial Bino Ijarasi (Joriy oy)",
    amount: 3200000, date: fmtIdxDate(1), recipient: "Yangiobod Texnikum ma'muriyati",
    month: fmtIdxMonth(0).slice(0, 7),
    paymentMethod: 'Bank Transfer', status: 'Paid',
  },
  {
    id: 'exp-08', category: 'Marketing', title: 'Telegram & Banner Reklamalari',
    amount: 1800000, date: fmtIdxDate(4), recipient: 'Reklama agentligi',
    month: fmtIdxMonth(0).slice(0, 7),
    notes: "Yangiobod kanallarida e'lonlar va flyerlar chop etish",
    paymentMethod: 'Click', status: 'Paid',
  },
  {
    id: 'exp-09', category: 'Utilities', title: 'Internet va elektr energiyasi',
    amount: 650000, date: fmtIdxDate(6), recipient: 'Uztelecom & Hududiy elektr',
    month: fmtIdxMonth(0).slice(0, 7),
    paymentMethod: 'Payme', status: 'Paid',
  },
  {
    id: 'exp-10', category: 'Equipment', title: 'Oquv materiallari va daftarlar',
    amount: 420000, date: fmtIdxDate(8), recipient: 'Kontinental-M',
    month: fmtIdxMonth(0).slice(0, 7),
    notes: "Yangi o'quv yili uchun daftarlar va materiallar",
    paymentMethod: 'Cash', status: 'Paid',
  },
];

// Seed Results (intentionally empty — real results only come from Reports / admin input)
export const INITIAL_RESULTS: StudentResult[] = [
  { id: 'res-01', studentName: 'Hasanboyeva Sevinch', score: '187.9', university: "O'zDJTU", year: '2025', category: 'DTM' },
  { id: 'res-02', studentName: 'Azizbek Toshmatov', score: '72', university: 'TATU', year: '2025', category: 'DTM' },
  { id: 'res-03', studentName: 'Madina Karimova', score: '78', university: 'CEFR B2', year: '2025', category: 'CEFR' },
  { id: 'res-04', studentName: 'Hasanboyeva Sevinch', score: '44.5', university: "Milliy Sertifikat", year: '2025', category: 'Milliy Sertifikat' },
  { id: 'res-05', studentName: 'Azizbek Toshmatov', score: '68', university: 'TATU', year: '2025', category: 'DTM' },
  { id: 'res-06', studentName: 'Javohir Ergashev', score: '145.2', university: 'DTM', year: '2025', category: 'DTM' },
  { id: 'res-07', studentName: 'Nilufar Xasanova', score: '48.2', university: "Milliy Sertifikat", year: '2025', category: 'Milliy Sertifikat' },
  { id: 'res-08', studentName: 'Javlon Toshmatov', score: '142.1', university: 'DTM', year: '2025', category: 'DTM' },
  { id: 'res-09', studentName: 'Sardor Ergashev', score: '95', university: 'Respublika Turniri', year: '2025', category: 'Olimpiada' },
  { id: 'res-10', studentName: 'Madina Karimova', score: '78', university: 'CEFR B2', year: '2025', category: 'CEFR' },
];

// Seed CMS
export const INITIAL_CMS: CmsContent = {
  heroEyebrow: "Renessans O'quv Markazi • Yangiobod",
  heroTitle: "Farzandingizning kelajagini",
  heroHighlight: "bugundan boshlang!",
  heroSubtitle: "Milliy sertifikat, DTM, CEFR va maktab fanlari bo'yicha Yangioboddagi zamonaviy o'quv markazi. 100% natijaga yo'naltirilgan ta'lim tizimi.",
  heroPrimaryCtaText: "Bepul Sinov Darsiga Yozilish",
  heroSecondaryCtaText: "Kurslarimiz Bilan Tanishish",
  heroBadgeText: "",

  brandName: "RENESSANS LC",
  slogan: "Bilimdan Natijaga",

  phonePrimary: "+998 (88) 648-49-49",
  phoneSecondary: "+998 (99) 259-32-32",
  telegramUsername: "@D_Furqatovich",
  instagramUsername: "renessans_yangiobod",
  email: "renessans.yangiobod@gmail.com",
  workingHours: "Har kuni: 08:00 - 20:00 (Dam olish kunisiz)",

  location1Title: "1-Filial (Asosiy Filial)",
  location1: "Yangiobod tumani, 1-maktab binosi, 2-qavat",
  location2Title: "2-Filial (Texnikum Filiali)",
  location2: "Yangiobod Texnikum binosi, Renessans filiali",
  googleMapsUrl: "https://maps.google.com/?q=Yangiobod",

  statPassRate: "94%",
  statAdmitted: "2 ta",
  statTopScore: "187.9 ball",
  statGrantCount: "2 nafar",

  footerText: "Yangioboddagi zamonaviy o'quv markazi. Milliy sertifikat, DTM, CEFR va maktab fanlari bo'yicha 100% natijaga yo'naltirilgan ta'lim.",
  copyrightText: "© 2026 Renessans O'quv Markazi. Barcha huquqlar himoyalangan.",
  seoTitle: "Renessans O'quv Markazi | Yangiobod - Bilimdan Natijaga",
  seoDescription: "Yangioboddagi eng nufuzli o'quv markazi. DTM & Milliy Sertifikat, Matematika, CEFR Ingliz tili va DTM tayyorlov kurslari.",

  isDraft: false,
  lastPublishedAt: "Bugun, 09:00",
  lastEditedBy: "Direktor (Diyorbek Furqatovich)",
};

// Seed Center Settings
export const INITIAL_SETTINGS: CenterSettings = {
  centerName: "Renessans O'quv Markazi",
  legalName: "MChJ 'RENESSANS EDUCATION YANGIOBOD'",
  hotline: "+998 (88) 648-49-49",
  secondaryPhone: "+998 (99) 259-32-32",
  email: "renessans.yangiobod@gmail.com",
  currency: "UZS",
  timezone: "Asia/Tashkent (UTC+5)",
  workingHours: "08:00 - 20:00",
  branches: [
    {
      id: 'br-01',
      name: "1-Filial (Asosiy)",
      address: "Yangiobod tumani, 1-maktab binosi, 2-qavat",
      phone: "+998 (88) 648-49-49",
      workingHours: "08:00 - 20:00",
      isActive: true,
    },
    {
      id: 'br-02',
      name: "2-Filial (Texnikum)",
      address: "Yangiobod Texnikum binosi, Renessans filiali",
      phone: "+998 (99) 259-32-32",
      workingHours: "08:00 - 18:00",
      isActive: true,
    },
  ],
  rooms: [
    { id: 'rm-101', name: '101-Auditoriya', branchId: 'br-01', branchName: '1-Filial (Asosiy)', capacity: 18, isActive: true },
    { id: 'rm-102', name: '102-Xona', branchId: 'br-01', branchName: '1-Filial (Asosiy)', capacity: 16, isActive: true },
    { id: 'rm-201', name: '201-Laboratoriya', branchId: 'br-01', branchName: '1-Filial (Asosiy)', capacity: 15, isActive: true },
    { id: 'rm-202', name: '202-Katta Zal', branchId: 'br-01', branchName: '1-Filial (Asosiy)', capacity: 35, isActive: true },
    { id: 'rm-301', name: '301-Xona', branchId: 'br-02', branchName: '2-Filial (Texnikum)', capacity: 14, isActive: true },
  ],
  staff: [
    { id: 'stf-01', name: 'Diyorbek Furqatovich', role: 'Director', phone: '+998 (88) 648-49-49', email: 'diyorbek@renessans.uz', isActive: true, permissions: ['all'] },
    { id: 'stf-02', name: 'Dilshoda Karimova', role: 'Administrator', phone: '+998 (90) 111-22-33', email: 'admin@renessans.uz', isActive: true, permissions: ['leads', 'students', 'payments', 'schedule'] },
    { id: 'stf-03', name: 'Jasur Alimov', role: 'Teacher', phone: '+998 (99) 259-32-32', isActive: true, permissions: ['schedule', 'students_view'] },
  ],
  paymentMethods: ['Cash', 'Card', 'Click', 'Payme', 'Bank Transfer'],
  expenseCategories: [
    'Teacher Salary',
    'Rent',
    'Utilities',
    'Marketing',
    'Equipment',
    'Supplies',
    'Maintenance',
    'Other',
  ],
  telegramSettings: {
    botUsername: '@Renessans_LeadBot',
    botConnected: true,
    managementGroup: '-100234857291',
    notifyLeads: true,
    notifyPayments: true,
    notifyTrials: true,
    notifyOverdue: true,
  },
};

export const INITIAL_AUDIT_LOGS: AuditLogEntry[] = [
  {
    id: 'aud-01',
    user: 'Diyorbek Furqatovich (Direktor)',
    action: 'CMS Yangilandi',
    entity: 'Website CMS',
    details: "Asosiy sahifa e'lonlari va yangi natijalar nashr qilindi",
    timestamp: '2026-03-08 09:30:00',
  },
  {
    id: 'aud-02',
    user: 'Dilshoda Karimova (Admin)',
    action: 'To\'lov qabul qilindi',
    entity: 'To\'lovlar',
    details: "Hasanboyeva Sevinch: 380,000 UZS (Click orqali, Chek: REC-24891)",
    timestamp: '2026-03-08 11:15:00',
  },
  {
    id: 'aud-03',
    user: 'Dilshoda Karimova (Admin)',
    action: 'Yangi sinov darsi belgilandi',
    entity: 'Arizalar (Leads)',
    details: "Ali Valiyev: Tarix fanidan yakshanba kungi ochiq darsga yozildi",
    timestamp: '2026-03-08 14:20:00',
  },
];

// Helper functions for storage
function getFromStorage<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw);
    return parsed ?? fallback;
  } catch {
    return fallback;
  }
}

function saveToStorage<T>(key: string, data: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (err) {
    console.warn('LocalStorage save warning:', err);
  }
}

class CrmService {
  private leads: Lead[] = getFromStorage(STORAGE_KEYS.LEADS, INITIAL_LEADS);
  private students: StudentRecord[] = getFromStorage(STORAGE_KEYS.STUDENTS, INITIAL_STUDENTS);
  private teachers: TeacherRecord[] = getFromStorage(STORAGE_KEYS.TEACHERS, INITIAL_TEACHERS);
  private courses: CourseData[] = getFromStorage(STORAGE_KEYS.COURSES, INITIAL_COURSES);
  private schedule: GroupScheduleItem[] = getFromStorage(STORAGE_KEYS.SCHEDULE, INITIAL_SCHEDULE);
  private payments: IncomePaymentRecord[] = getFromStorage(STORAGE_KEYS.PAYMENTS, INITIAL_PAYMENTS);
  private expenses: ExpenseRecord[] = getFromStorage(STORAGE_KEYS.EXPENSES, INITIAL_EXPENSES);
  private results: StudentResult[] = getFromStorage(STORAGE_KEYS.RESULTS, INITIAL_RESULTS);
  private cmsContent: CmsContent = getFromStorage(STORAGE_KEYS.CMS, INITIAL_CMS);
  private settings: CenterSettings = getFromStorage(STORAGE_KEYS.SETTINGS, INITIAL_SETTINGS);
  private auditLogs: AuditLogEntry[] = getFromStorage(STORAGE_KEYS.AUDIT_LOGS, INITIAL_AUDIT_LOGS);
  private telegramLogs: TelegramAlertLog[] = getFromStorage(STORAGE_KEYS.TELEGRAM_LOGS, []);

  constructor() {
    // Clean any old Unsplash links from legacy data
    let modified = false;
    this.teachers = this.teachers.map((t) => {
      if (t.photo && t.photo.includes('unsplash.com')) {
        modified = true;
        return { ...t, photo: '' };
      }
      return t;
    });

    // Normalize legacy student records so every numeric field has a safe value.
    // This prevents crashes like "Cannot read properties of undefined (reading 'toLocaleString')"
    // when old data is loaded from localStorage without monthlyFee/debtAmount fields.
    const beforeStudents = this.students.length;
    this.students = this.students.map((s) => {
      const fee = Number(s.monthlyFee ?? s.tuitionFee ?? 0);
      const debt = Number(s.debtAmount ?? 0);
      const hasChanged =
        s.monthlyFee === undefined || s.debtAmount === undefined ||
        s.paymentStatus === undefined || s.status === undefined;
      return {
        ...s,
        fullName: s.fullName || s.name || "Noma'lum",
        name: s.name || s.fullName || "Noma'lum",
        monthlyFee: fee,
        tuitionFee: Number(s.tuitionFee ?? fee),
        debtAmount: debt,
        paymentStatus: s.paymentStatus || 'Due',
        status: s.status || (s.isActive === false ? 'Archived' : 'Active'),
        balance: s.balance ?? (s.paymentStatus === 'Paid' ? 0 : s.debtAmount !== undefined ? -debt : 0),
        totalPaid: Number(s.totalPaid ?? 0),
        attendanceRate: Number(s.attendanceRate ?? 0),
        groupName: s.groupName || `${s.course || 'Kurs'} - 1-guruh`,
      } as StudentRecord;
    });
    if (this.students.length !== beforeStudents && modified) {
      modified = true;
    }

    // Normalize courses to always have numeric monthlyFee + stable slug
    this.courses = this.courses.map((c) => ({
      ...c,
      slug: c.slug || slugify(c.title),
      monthlyFee: Number(c.monthlyFee ?? 0),
      formattedFee: c.formattedFee || `${(Number(c.monthlyFee) || 0).toLocaleString()} UZS / oy`,
      isActive: c.isActive ?? true,
      isPublic: c.isPublic ?? false,
    }));

    // Normalize expenses to always have numeric amounts
    this.expenses = this.expenses.map((e) => ({
      ...e,
      amount: Number(e.amount ?? 0),
      category: e.category || 'Other',
    }));

    if (modified) {
      saveToStorage(STORAGE_KEYS.TEACHERS, this.teachers);
      saveToStorage(STORAGE_KEYS.STUDENTS, this.students);
      saveToStorage(STORAGE_KEYS.COURSES, this.courses);
      saveToStorage(STORAGE_KEYS.EXPENSES, this.expenses);
    }
  }

  // --- AUDIT LOGS ---
  public getAuditLogs(): AuditLogEntry[] {
    return [...this.auditLogs];
  }

  public logAction(action: string, entity: string, details: string, user = 'Direktor'): void {
    const entry: AuditLogEntry = {
      id: `aud-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      user,
      action,
      entity,
      details,
      timestamp: new Date().toLocaleString('uz-UZ', { hour12: false }),
    };
    this.auditLogs.unshift(entry);
    if (this.auditLogs.length > 200) this.auditLogs.pop();
    saveToStorage(STORAGE_KEYS.AUDIT_LOGS, this.auditLogs);
  }

  // --- TEACHERS MANAGEMENT ---
  public getTeachers(): TeacherRecord[] {
    // Dynamically calculate activeGroups and studentsCount based on real schedule and students
    return this.teachers.map((teacher) => {
      const activeGroupsCount = this.schedule.filter(
        (grp) => grp.teacherId === teacher.id || grp.teacher?.toLowerCase() === teacher.name.toLowerCase()
      ).length;

      const studentsCount = this.students.filter(
        (st) =>
          st.teacherId === teacher.id ||
          st.teacher?.toLowerCase() === teacher.name.toLowerCase() ||
          this.schedule.some(
            (g) =>
              (g.teacherId === teacher.id || g.teacher?.toLowerCase() === teacher.name.toLowerCase()) &&
              (g.id === st.groupId || g.groupName?.toLowerCase() === st.groupName?.toLowerCase())
          )
      ).length;

      return {
        ...teacher,
        activeGroups: activeGroupsCount || 0,
        studentsCount: studentsCount || 0,
      };
    });
  }

  public addTeacher(teacher: Omit<TeacherRecord, 'id'>): TeacherRecord {
    const newTeacher: TeacherRecord = {
      ...teacher,
      id: `t-${Date.now()}`,
      activeGroups: 0,
      studentsCount: 0,
      createdAt: new Date().toISOString(),
      status: teacher.status || 'Active',
      isPublic: teacher.isPublic ?? true,
      displayOrder: teacher.displayOrder || this.teachers.length + 1,
    };
    this.teachers.push(newTeacher);
    saveToStorage(STORAGE_KEYS.TEACHERS, this.teachers);
    this.logAction("O'qituvchi qo'shildi", "O'qituvchilar", `${newTeacher.name} (${newTeacher.subject || newTeacher.specialization})`);
    return newTeacher;
  }

  public updateTeacher(id: string, updates: Partial<TeacherRecord>): TeacherRecord | null {
    const idx = this.teachers.findIndex((t) => t.id === id);
    if (idx === -1) return null;
    this.teachers[idx] = {
      ...this.teachers[idx],
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    saveToStorage(STORAGE_KEYS.TEACHERS, this.teachers);
    this.logAction("O'qituvchi tahrirlandi", "O'qituvchilar", `${this.teachers[idx].name} ma'lumotlari yangilandi`);
    return this.teachers[idx];
  }

  public deleteTeacher(id: string): boolean {
    const target = this.teachers.find((t) => t.id === id);
    if (!target) return false;
    this.teachers = this.teachers.filter((t) => t.id !== id);
    saveToStorage(STORAGE_KEYS.TEACHERS, this.teachers);
    this.logAction("O'qituvchi o'chirildi", "O'qituvchilar", `${target.name} o'chirildi`);
    return true;
  }

  // --- COURSES MANAGEMENT ---
  public getCourses(): CourseData[] {
    return [...this.courses];
  }

  public getCourseBySlug(slug: string): CourseData | undefined {
    return this.courses.find((c) => (c.slug || slugify(c.title)) === slug);
  }

  public addCourse(course: Omit<CourseData, 'id'>): CourseData {
    const newCourse: CourseData = {
      ...course,
      id: `c-${Date.now()}`,
      slug: course.slug || slugify(course.title),
      isActive: course.isActive ?? true,
      isPublic: course.isPublic ?? true,
      displayOrder: course.displayOrder || this.courses.length + 1,
      formattedFee: course.formattedFee || `${(course.monthlyFee || 0).toLocaleString()} UZS / oy`,
    };
    this.courses.push(newCourse);
    saveToStorage(STORAGE_KEYS.COURSES, this.courses);
    this.logAction("Yangi kurs yaratildi", "Kurslar", `${newCourse.title} - ${newCourse.formattedFee}`);
    return newCourse;
  }

  public updateCourse(id: string, updates: Partial<CourseData>): CourseData | null {
    const idx = this.courses.findIndex((c) => c.id === id);
    if (idx === -1) return null;
    if (updates.monthlyFee !== undefined && !updates.formattedFee) {
      updates.formattedFee = `${updates.monthlyFee.toLocaleString()} UZS / oy`;
    }
    this.courses[idx] = { ...this.courses[idx], ...updates };
    saveToStorage(STORAGE_KEYS.COURSES, this.courses);
    this.logAction("Kurs tahrirlandi", "Kurslar", `${this.courses[idx].title} yangilandi`);
    return this.courses[idx];
  }

  public deleteCourse(id: string): boolean {
    const target = this.courses.find((c) => c.id === id);
    if (!target) return false;
    this.courses = this.courses.filter((c) => c.id !== id);
    saveToStorage(STORAGE_KEYS.COURSES, this.courses);
    this.logAction("Kurs o'chirildi", "Kurslar", `${target.title} o'chirildi`);
    return true;
  }

  // --- GROUPS / SCHEDULE MANAGEMENT ---
  public getSchedule(): GroupScheduleItem[] {
    // Dynamically calculate students count for each group
    return this.schedule.map((grp) => {
      const realCount = this.students.filter(
        (st) => st.groupId === grp.id || st.groupName?.toLowerCase() === grp.groupName?.toLowerCase()
      ).length;
      return {
        ...grp,
        studentsCount: realCount || 0,
      };
    });
  }

  public addGroup(group: Omit<GroupScheduleItem, 'id'>): GroupScheduleItem {
    const newGroup: GroupScheduleItem = {
      ...group,
      id: `grp-${Date.now()}`,
      studentsCount: 0,
      status: group.status || 'Active',
      displayOrder: this.schedule.length + 1,
    };
    this.schedule.push(newGroup);
    saveToStorage(STORAGE_KEYS.SCHEDULE, this.schedule);
    this.logAction("Yangi guruh ochildi", "Dars Jadvali", `${newGroup.groupName} (${newGroup.days} • ${newGroup.time})`);
    return newGroup;
  }

  public updateGroup(id: string, updates: Partial<GroupScheduleItem>): GroupScheduleItem | null {
    const idx = this.schedule.findIndex((g) => g.id === id);
    if (idx === -1) return null;
    this.schedule[idx] = { ...this.schedule[idx], ...updates };
    saveToStorage(STORAGE_KEYS.SCHEDULE, this.schedule);
    this.logAction("Guruh tahrirlandi", "Dars Jadvali", `${this.schedule[idx].groupName} yangilandi`);
    return this.schedule[idx];
  }

  public deleteGroup(id: string): boolean {
    const target = this.schedule.find((g) => g.id === id);
    if (!target) return false;
    this.schedule = this.schedule.filter((g) => g.id !== id);
    saveToStorage(STORAGE_KEYS.SCHEDULE, this.schedule);
    this.logAction("Guruh o'chirildi", "Dars Jadvali", `${target.groupName} o'chirildi`);
    return true;
  }

  // Check schedule conflicts
  public checkScheduleConflict(
    groupId: string | undefined,
    days: string,
    time: string,
    room: string,
    teacher: string
  ): { hasConflict: boolean; reason?: string } {
    const normalizedDays = days.toLowerCase().trim();
    const normalizedTime = time.toLowerCase().trim();
    const otherGroups = this.schedule.filter((g) => g.id !== groupId && g.status !== 'Archived');

    for (const g of otherGroups) {
      if (g.days.toLowerCase().trim() === normalizedDays && g.time.toLowerCase().trim() === normalizedTime) {
        if (g.room.toLowerCase().trim() === room.toLowerCase().trim()) {
          return {
            hasConflict: true,
            reason: `Xona band: "${g.room}" xonasi ayni shu vaqtda "${g.groupName}" guruhi tomonidan band qilingan!`,
          };
        }
        if (g.teacher.toLowerCase().trim() === teacher.toLowerCase().trim()) {
          return {
            hasConflict: true,
            reason: `Ustoz band: ${g.teacher} ayni shu vaqtda "${g.groupName}" guruhida dars o'tadi!`,
          };
        }
      }
    }
    return { hasConflict: false };
  }

  // --- STUDENTS MANAGEMENT ---
  public getStudents(): StudentRecord[] {
    return this.students.map((s) => ({
      ...s,
      fullName: s.fullName || s.name || "Noma'lum",
      name: s.name || s.fullName || "Noma'lum",
      monthlyFee: Number(s.monthlyFee ?? s.tuitionFee ?? 0),
      tuitionFee: Number(s.tuitionFee ?? s.monthlyFee ?? 0),
      debtAmount: Number(s.debtAmount ?? (s.paymentStatus === 'Overdue' || s.paymentStatus === 'Due' ? s.monthlyFee ?? s.tuitionFee ?? 0 : 0)),
      paymentStatus: s.paymentStatus || 'Due',
      status: s.status || (s.isActive === false ? 'Archived' : 'Active'),
      groupName: s.groupName || `${s.course || 'Kurs'} - 1-guruh`,
    }));
  }

  public addStudent(student: Omit<StudentRecord, 'id'>): StudentRecord {
    const fee = Number(student.monthlyFee ?? student.tuitionFee ?? 0);
    const newStudent: StudentRecord = {
      ...student,
      id: `st-${Date.now()}`,
      fullName: student.fullName || student.name || "Noma'lum",
      name: student.name || student.fullName || "Noma'lum",
      monthlyFee: fee,
      tuitionFee: Number(student.tuitionFee ?? fee),
      debtAmount: Number(student.debtAmount ?? 0),
      paymentStatus: student.paymentStatus || 'Due',
      isActive: student.isActive ?? true,
      status: student.status || 'Active',
      balance: student.balance ?? 0,
      totalPaid: student.totalPaid ?? 0,
      attendanceRate: Number(student.attendanceRate ?? 0),
    };
    this.students.unshift(newStudent);
    saveToStorage(STORAGE_KEYS.STUDENTS, this.students);
    this.logAction("Yangi o'quvchi qo'shildi", "O'quvchilar", `${newStudent.fullName} - Guruh: ${newStudent.groupName}`);
    return newStudent;
  }

  public updateStudent(id: string, updates: Partial<StudentRecord>): StudentRecord | null {
    const idx = this.students.findIndex((s) => s.id === id);
    if (idx === -1) return null;
    const merged = {
      ...this.students[idx],
      ...updates,
      fullName: (updates.fullName || this.students[idx].fullName || this.students[idx].name || "Noma'lum"),
    };
    if (updates.monthlyFee !== undefined) {
      merged.monthlyFee = Number(updates.monthlyFee);
      merged.tuitionFee = Number(updates.tuitionFee ?? updates.monthlyFee);
    }
    this.students[idx] = merged;
    saveToStorage(STORAGE_KEYS.STUDENTS, this.students);
    this.logAction("O'quvchi ma'lumotlari tahrirlandi", "O'quvchilar", `${this.students[idx].fullName}`);
    return this.students[idx];
  }

  public deleteStudent(id: string): boolean {
    const target = this.students.find((s) => s.id === id);
    if (!target) return false;
    this.students = this.students.filter((s) => s.id !== id);
    saveToStorage(STORAGE_KEYS.STUDENTS, this.students);
    this.logAction("O'quvchi o'chirildi", "O'quvchilar", `${target.fullName}`);
    return true;
  }

  // --- LEADS MANAGEMENT ---
  public getLeads(): Lead[] {
    return [...this.leads];
  }

  public async createLead(data: {
    name: string;
    phone: string;
    course: string;
    notes?: string;
    source?: string;
    assignedTo?: string;
    trialDateTime?: string;
  }): Promise<Lead> {
    const hasTrial = Boolean(data.trialDateTime);
    const newLead: Lead = {
      id: `lead-${Date.now()}`,
      name: data.name.trim(),
      phone: data.phone.trim(),
      course: data.course || 'DTM & Milliy Sertifikat',
      createdAt: new Date().toISOString(),
      assignedTo: data.assignedTo || 'Qabulxona',
      notes: data.notes || 'Bepul sinov darsiga yozildi.',
      status: hasTrial ? 'Sinov darsi belgilandi' : 'Yangi',
      source: data.source || 'Sayt orqali ariza',
      ...(data.trialDateTime ? { trialDateTime: data.trialDateTime } : {}),
    };

    this.leads.unshift(newLead);
    saveToStorage(STORAGE_KEYS.LEADS, this.leads);

    // Sync to Firestore
    try {
      if (db) {
        addDoc(collection(db, 'leads'), {
          ...newLead,
          createdTimestamp: serverTimestamp(),
        }).catch((err) => console.log('Firestore lead sync note:', err.message));
      }
    } catch (err) {
      console.log('Firebase lead sync note:', err);
    }

    this.logAction("Yangi ariza keldi", "Arizalar (Leads)", `${newLead.name} (${newLead.course})`);
    await this.dispatchTelegramAlert(newLead);
    return newLead;
  }

  public updateLeadStatus(leadId: string, status: LeadStatus): Lead | null {
    const idx = this.leads.findIndex((l) => l.id === leadId);
    if (idx === -1) return null;

    this.leads[idx] = { ...this.leads[idx], status };
    saveToStorage(STORAGE_KEYS.LEADS, this.leads);

    // If marked enrolled, ensure a linked student record exists
    if (status === 'Enrolled' || status === "O'quvchiga aylandi") {
      this.convertLeadToStudent(leadId, {});
    }

    this.logAction("Ariza holati o'zgardi", "Arizalar (Leads)", `${this.leads[idx].name} -> ${status}`);
    return this.leads[idx];
  }

  public convertLeadToStudent(
    leadId: string,
    opts: {
      course?: string;
      groupId?: string;
      groupName?: string;
      teacher?: string;
      teacherId?: string;
      monthlyFee?: number;
      discount?: number;
      paymentStatus?: PaymentStatus;
      startDate?: string;
      parentName?: string;
      parentPhone?: string;
    } = {}
  ): { student?: StudentRecord; leadId: string; created: boolean; message: string } {
    const idx = this.leads.findIndex((l) => l.id === leadId);
    if (idx === -1) return { leadId, created: false, message: "Ariza topilmadi." };
    const lead = this.leads[idx];

    const existing = this.students.find(
      (s) =>
        (s.phone && lead.phone && s.phone.replace(/\D/g, '') === lead.phone.replace(/\D/g, '')) ||
        (s.fullName || '').toLowerCase() === lead.name.toLowerCase()
    );

    if (existing) {
      this.leads[idx] = {
        ...this.leads[idx],
        status: "O'quvchiga aylandi",
        enrollmentDate: this.leads[idx].enrollmentDate || new Date().toISOString().split('T')[0],
      };
      saveToStorage(STORAGE_KEYS.LEADS, this.leads);
      return { student: existing, leadId, created: false, message: "Bu ariza oldin o'quvchiga aylantirilgan." };
    }

    const courseTitle = opts.course || lead.course || '';
    const courseDef = this.courses.find((c) => c.title === courseTitle);
    const courseFee = Number(courseDef?.monthlyFee) || 0;
    const monthlyFee = Number(opts.monthlyFee) || courseFee || Number(lead.trialResult === 'Converted' ? courseFee : 0);
    const discount = Math.min(Math.max(Number(opts.discount) || 0, 0), monthlyFee);

    const teacherId = opts.teacherId;
    const teacherName =
      opts.teacher ||
      this.teachers.find((t) => t.id === teacherId)?.name ||
      (courseDef?.teacherName ? courseDef.teacherName : undefined) ||
      lead.assignedTo ||
      '';

    const groupId = opts.groupId;
    const groupCount = this.schedule.filter((g) => g.course === courseTitle).length;
    const defaultGroupName = courseDef ? `${courseDef.title} - ${groupCount + 1}-guruh` : `${courseTitle} - 1-guruh`;

    const newStudent = this.addStudent({
      fullName: lead.name,
      name: lead.name,
      phone: lead.phone,
      parentName: opts.parentName,
      parentPhone: opts.parentPhone,
      mentor: teacherName,
      teacher: teacherName,
      teacherId,
      course: courseTitle,
      courseId: courseDef?.id,
      groupId,
      groupName: opts.groupName || (groupId ? (this.schedule.find((g) => g.id === groupId)?.groupName || defaultGroupName) : defaultGroupName),
      enrollmentDate: opts.startDate || new Date().toISOString().split('T')[0],
      tuitionFee: monthlyFee,
      monthlyFee,
      paymentStatus: opts.paymentStatus || 'Due',
      debtAmount: monthlyFee > 0 ? monthlyFee : 0,
      isActive: true,
      status: 'Active',
      nextDueDate: new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString().split('T')[0],
      totalPaid: 0,
      balance: 0,
      attendanceRate: 0,
      notes: 'CRM arizasidan o\'quvchiga aylantirildi',
    });

    this.leads[idx] = {
      ...this.leads[idx],
      status: "O'quvchiga aylandi",
      enrollmentDate: newStudent.enrollmentDate,
    };
    saveToStorage(STORAGE_KEYS.LEADS, this.leads);

    if (newStudent.groupId) {
      const grp = this.schedule.find((g) => g.id === newStudent.groupId);
      if (grp) {
        grp.studentsCount = (grp.studentsCount || 0) + 1;
        saveToStorage(STORAGE_KEYS.SCHEDULE, this.schedule);
      }
    }

    this.logAction("Ariza o'quvchiga aylantirildi", "Arizalar / O'quvchilar", `${newStudent.fullName} -> ${courseTitle}`);
    return { student: newStudent, leadId, created: true, message: "O'quvchi muvaffaqiyatli yaratildi." };
  }

  public updateLead(leadId: string, updates: Partial<Lead>): Lead | null {
    const idx = this.leads.findIndex((l) => l.id === leadId);
    if (idx === -1) return null;
    this.leads[idx] = { ...this.leads[idx], ...updates };
    saveToStorage(STORAGE_KEYS.LEADS, this.leads);
    return this.leads[idx];
  }

  public deleteLead(leadId: string): boolean {
    const target = this.leads.find((l) => l.id === leadId);
    if (!target) return false;
    this.leads = this.leads.filter((l) => l.id !== leadId);
    saveToStorage(STORAGE_KEYS.LEADS, this.leads);
    this.logAction("Ariza o'chirildi", "Arizalar (Leads)", `${target.name}`);
    return true;
  }

  // --- PAYMENTS MANAGEMENT ---
  public getPayments(): IncomePaymentRecord[] {
    return [...this.payments];
  }

  public addPayment(payment: Omit<IncomePaymentRecord, 'id' | 'receiptNumber'> & { receiptNumber?: string }): IncomePaymentRecord {
    const receiptNum = payment.receiptNumber || `REC-${Math.floor(10000 + Math.random() * 90000)}`;
    const newPayment: IncomePaymentRecord = {
      ...payment,
      id: `pay-${Date.now()}`,
      receiptNumber: receiptNum,
      date: payment.date || new Date().toISOString().split('T')[0],
      status: payment.status || 'Completed',
    };

    this.payments.unshift(newPayment);
    saveToStorage(STORAGE_KEYS.PAYMENTS, this.payments);

    // Update student balance/status if matching student found
    if (payment.studentId || payment.studentName) {
      const studentIdx = this.students.findIndex(
        (s) => (payment.studentId && s.id === payment.studentId) || s.fullName.toLowerCase() === payment.studentName.toLowerCase()
      );
      if (studentIdx !== -1) {
        this.students[studentIdx].paymentStatus = 'Paid';
        this.students[studentIdx].totalPaid = (this.students[studentIdx].totalPaid || 0) + payment.amount;
        this.students[studentIdx].balance = 0;
        this.students[studentIdx].nextDueDate = new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString().split('T')[0];
        saveToStorage(STORAGE_KEYS.STUDENTS, this.students);
      }
    }

    this.logAction("To'lov qabul qilindi", "To'lovlar", `${newPayment.studentName}: ${newPayment.amount.toLocaleString()} UZS (${newPayment.method}, Chek: ${receiptNum})`);
    return newPayment;
  }

  public updatePayment(id: string, updates: Partial<IncomePaymentRecord>): IncomePaymentRecord | null {
    const idx = this.payments.findIndex((p) => p.id === id);
    if (idx === -1) return null;
    this.payments[idx] = { ...this.payments[idx], ...updates };
    saveToStorage(STORAGE_KEYS.PAYMENTS, this.payments);
    this.logAction("To'lov tahrirlandi", "To'lovlar", `Chek: ${this.payments[idx].receiptNumber}`);
    return this.payments[idx];
  }

  public voidPayment(id: string, reason?: string): boolean {
    const idx = this.payments.findIndex((p) => p.id === id);
    if (idx === -1) return false;
    this.payments[idx].status = 'Voided';
    if (reason) this.payments[idx].notes = `Bekor qilindi: ${reason}`;
    saveToStorage(STORAGE_KEYS.PAYMENTS, this.payments);
    this.logAction("To'lov bekor qilindi", "To'lovlar", `Chek: ${this.payments[idx].receiptNumber} (${reason || 'Sababsiz'})`);
    return true;
  }

  public createPayment(payment: any): IncomePaymentRecord {
    return this.addPayment({
      ...payment,
      date: payment.date || new Date().toISOString().split('T')[0],
      status: payment.status || 'Completed',
    });
  }

  public sendTelegramLeadNotification(lead: any): Promise<TelegramAlertLog> {
    return this.dispatchTelegramAlert(lead);
  }

  public deletePayment(id: string): boolean {
    const target = this.payments.find((p) => p.id === id);
    if (!target) return false;
    this.payments = this.payments.filter((p) => p.id !== id);
    saveToStorage(STORAGE_KEYS.PAYMENTS, this.payments);
    this.logAction("To'lov o'chirildi", "To'lovlar", `Chek: ${target.receiptNumber}`);
    return true;
  }

  public getTotalRevenue(): number {
    return this.payments
      .filter((p) => p.status !== 'Voided')
      .reduce((acc, p) => acc + (p.amount || 0), 0);
  }

  public logAuditAction(entity: string, action: string, details: string, user = 'Direktor'): void {
    this.logAction(action, entity, details, user);
  }

  public getTuitionDebts(): { studentId: string; studentName: string; phone: string; course: string; amount: number; dueDate: string; status: 'Unpaid' | 'Partial' | 'Paid' }[] {
    return this.students.map((s) => {
      const courseDef = this.courses.find((c) => c.title === s.course);
      const courseFee = Number(courseDef?.monthlyFee) || 0;
      const fee =
        Number(s.monthlyFee) ||
        Number(s.tuitionFee) ||
        courseFee ||
        0;
      const isPaid = s.paymentStatus === 'Paid';
      const dueInDays = 7;
      const dueDate = s.nextDueDate || new Date(Date.now() + dueInDays * 24 * 3600 * 1000).toISOString().split('T')[0];
      return {
        studentId: s.id,
        studentName: s.fullName || s.name || "Noma'lum",
        phone: s.phone,
        course: s.course,
        amount: isPaid ? 0 : this.getStudentDebt(s, fee),
        dueDate,
        status: isPaid ? 'Paid' : 'Unpaid',
      };
    });
  }

  private getStudentDebt(s: StudentRecord, defaultFee: number): number {
    const debt = Number(s.debtAmount);
    if (!Number.isFinite(debt)) return 0;
    if (debt > 0) return debt;
    if (Number.isFinite(defaultFee) && defaultFee > 0 && s.paymentStatus !== 'Paid') return defaultFee;
    return 0;
  }

  public getCmsData(): CmsData {
    const stored = localStorage.getItem('crm_cms_data');
    if (stored) {
      try {
        const parsed = JSON.parse(stored) as CmsData;
        if (parsed && parsed.hero && parsed.contact && Array.isArray(parsed.faqs) && Array.isArray(parsed.results)) {
          return parsed;
        }
      } catch {
        console.error('crm_cms_data localStorage tarkibi noto\'g\'ri — default CMS ishlatilmoqda.');
      }
    }
    return {
      hero: {
        centerName: "Renessans O'quv Markazi",
        tagline: 'Bilimdan Natijaga',
        subtitle: "Milliy sertifikat, DTM, CEFR va maktab fanlari bo'yicha Yangioboddagi zamonaviy o'quv markazi.",
        badge: "Renessans O'quv Markazi • Yangiobod",
      },
      stats: {
        universityAdmissions: '94%',
        studentAdmittedRatio: '2 ta',
        highestDtmScore: '187.9 ball',
        stateGrantsCount: '2 nafar',
      },
      contact: {
        phone: '+998 (90) 862-22-26',
        telegram: '@renessans_lc',
        branches: [
          'Jizzax viloyati, Yangiobod tumani, 1-maktab binosi',
          'Yangiobod tuman texnikumi (NODIRABEGIM EDUCATION) binosi',
        ],
      },
      faqs: [
        {
          id: 'faq-1',
          question: "Sinov darsi qanday o'tkaziladi va to'lov bormi?",
          answer: "Sinov darsi mutlaqo bepul! O'quvchi markazga kelib, diagnostik test topshiradi va o'z bilimi darajasiga mos guruh darsiga qatnashib, ustoz bilan tanishadi.",
        },
        {
          id: 'faq-2',
          question: "Renessans o'quv markazi Yangiobodning qaysi joylarida joylashgan?",
          answer: "Bizda 2 ta filial mavjud: 1-filial — Yangiobod tumani 1-maktab binosida; 2-filial — Yangiobod tuman texnikumi (NODIRABEGIM EDUCATION) binosida joylashgan.",
        },
        {
          id: 'faq-3',
          question: "Milliy sertifikat va DTM guruhlariga qabul qachon boshlanadi?",
          answer: "Qabul yil davomida davom etadi. Darslar ertalabki, tushki va kechki smenalarda tashkil etilgan. Yangi guruhlar shakllanishi bilan bepul sinov darslariga chaqiriladi.",
        },
        {
          id: 'faq-4',
          question: "Haftalik diagnostik testlar qachon o'tkaziladi?",
          answer: "Har yakshanba kuni markazimizda DTM va Milliy sertifikat formatidagi qat'iy nazorat ostida diagnostik testlar o'tkaziladi va natijalar ota-onalarga yetkaziladi.",
        },
      ],
      results: [],
    };
  }

  public updateCmsData(data: CmsData): CmsData {
    localStorage.setItem('crm_cms_data', JSON.stringify(data));
    this.logAction("CMS Yangilandi", "Website CMS", "Bosh sahifa matnlari va sozlamalari yangilandi.");
    return data;
  }

  public createExpense(expense: Parameters<CrmService['addExpense']>[0]): ExpenseRecord {
    return this.addExpense(expense);
  }

  // --- EXPENSES MANAGEMENT ---
  public getExpenses(): ExpenseRecord[] {
    return [...this.expenses];
  }

  public addExpense(expense: Omit<ExpenseRecord, 'id' | 'date'> & { date?: string }): ExpenseRecord {
    const newExpense: ExpenseRecord = {
      ...expense,
      id: `exp-${Date.now()}`,
      date: expense.date || new Date().toISOString().split('T')[0],
      status: expense.status || 'Paid',
    };
    this.expenses.unshift(newExpense);
    saveToStorage(STORAGE_KEYS.EXPENSES, this.expenses);
    this.logAction("Xarajat kiritildi", "Xarajatlar", `${newExpense.category}: ${newExpense.amount.toLocaleString()} UZS (${newExpense.title})`);
    return newExpense;
  }

  public updateExpense(id: string, updates: Partial<ExpenseRecord>): ExpenseRecord | null {
    const idx = this.expenses.findIndex((e) => e.id === id);
    if (idx === -1) return null;
    this.expenses[idx] = { ...this.expenses[idx], ...updates };
    saveToStorage(STORAGE_KEYS.EXPENSES, this.expenses);
    this.logAction("Xarajat tahrirlandi", "Xarajatlar", `${this.expenses[idx].title}`);
    return this.expenses[idx];
  }

  public deleteExpense(id: string): boolean {
    const target = this.expenses.find((e) => e.id === id);
    if (!target) return false;
    this.expenses = this.expenses.filter((e) => e.id !== id);
    saveToStorage(STORAGE_KEYS.EXPENSES, this.expenses);
    this.logAction("Xarajat o'chirildi", "Xarajatlar", `${target.title}`);
    return true;
  }

  // --- RESULTS MANAGEMENT ---
  public getResults(): StudentResult[] {
    return [...this.results];
  }

  public addResult(result: Omit<StudentResult, 'id'>): StudentResult {
    const newRes: StudentResult = {
      ...result,
      id: `res-${Date.now()}`,
    };
    this.results.unshift(newRes);
    saveToStorage(STORAGE_KEYS.RESULTS, this.results);
    this.logAction("Yangi natija qo'shildi", "Natijalar", `${newRes.studentName} - ${newRes.score} (${newRes.university})`);
    return newRes;
  }

  public updateResult(id: string, updates: Partial<StudentResult>): StudentResult | null {
    const idx = this.results.findIndex((r) => r.id === id);
    if (idx === -1) return null;
    this.results[idx] = { ...this.results[idx], ...updates };
    saveToStorage(STORAGE_KEYS.RESULTS, this.results);
    this.logAction("Natija tahrirlandi", "Natijalar", `${this.results[idx].studentName}`);
    return this.results[idx];
  }

  public deleteResult(id: string): boolean {
    const target = this.results.find((r) => r.id === id);
    if (!target) return false;
    this.results = this.results.filter((r) => r.id !== id);
    saveToStorage(STORAGE_KEYS.RESULTS, this.results);
    this.logAction("Natija o'chirildi", "Natijalar", `${target.studentName}`);
    return true;
  }

  // --- WEBSITE CMS ---
  public getCmsContent(): CmsContent {
    return { ...this.cmsContent };
  }

  public updateCmsContent(updates: Partial<CmsContent>): CmsContent {
    this.cmsContent = {
      ...this.cmsContent,
      ...updates,
      lastPublishedAt: new Date().toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' }),
    };
    saveToStorage(STORAGE_KEYS.CMS, this.cmsContent);

    // Sync to Firestore
    try {
      if (db) {
        setDoc(doc(db, 'settings', 'landing_cms'), this.cmsContent, { merge: true }).catch(() => {});
      }
    } catch {}

    this.logAction("Website CMS yangilandi", "CMS", "Bosh sahifa matnlari va sozlamalari nashr qilindi");
    return { ...this.cmsContent };
  }

  // --- CENTER SETTINGS ---
  public getSettings(): CenterSettings {
    return { ...this.settings };
  }

  public updateSettings(updates: Partial<CenterSettings>): CenterSettings {
    this.settings = { ...this.settings, ...updates };
    saveToStorage(STORAGE_KEYS.SETTINGS, this.settings);
    this.logAction("Markaz sozlamalari yangilandi", "Sozlamalar", "Filiallar, xonalar yoki xodimlar ma'lumotlari yangilandi");
    return { ...this.settings };
  }

  // --- TELEGRAM ALERTS ---
  public getTelegramLogs(): TelegramAlertLog[] {
    return [...this.telegramLogs];
  }

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

    // Call server endpoint and record the REAL result
    let delivered = false;
    const token = (localStorage.getItem('tg_bot_token') || '').trim();
    const chatId = (localStorage.getItem('tg_admin_chat_id') || '').trim();
    if (!token || !chatId) {
      delivered = false;
      return this.finishTelegramDispatch(log, false, 'Bot token yoki chat ID sozlanmagan');
    }
    try {
      const resp = await fetch('/api/telegram/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, chatId, text: telegramMessage }),
      });
      const body = await resp.json().catch(() => ({}));
      delivered = body?.ok === true;
      if (!delivered) {
        console.warn('Telegram send endpoint returned:', resp.status, body?.error || '');
      }
    } catch (err) {
      console.warn('Telegram send endpoint unreachable:', err);
    }

    const idx = this.telegramLogs.indexOf(log);
    if (idx !== -1) {
      this.telegramLogs[idx] = {
        ...this.telegramLogs[idx],
        status: delivered ? 'Sent' : 'Failed',
        sentAt: delivered ? new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Yuborilmadi',
        error: delivered ? undefined : 'Telegram server ulanishi mavjud emas',
      };
      saveToStorage(STORAGE_KEYS.TELEGRAM_LOGS, this.telegramLogs);
    }

    return this.telegramLogs.find((t) => t.id === log.id) || log;
  }

  private finishTelegramDispatch(log: TelegramAlertLog, delivered: boolean, errorMsg: string): TelegramAlertLog {
    this.telegramLogs[0] = {
      ...log,
      status: delivered ? 'Sent' : 'Failed',
      sentAt: delivered ? new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Yuborilmadi',
      error: delivered ? undefined : errorMsg,
    };
    saveToStorage(STORAGE_KEYS.TELEGRAM_LOGS, this.telegramLogs);
    return { ...this.telegramLogs[0] };
  }

  public async sendTelegramMessage(text: string): Promise<TelegramAlertLog> {
    const token = (localStorage.getItem('tg_bot_token') || '').trim();
    const chatId = (localStorage.getItem('tg_admin_chat_id') || '').trim();

    const log: TelegramAlertLog = {
      id: `tg-${Date.now()}`,
      message: text,
      messageText: text,
      status: 'Pending',
      sentAt: 'Hozirgina',
    };
    this.telegramLogs.unshift(log);
    saveToStorage(STORAGE_KEYS.TELEGRAM_LOGS, this.telegramLogs);

    if (!token) return this.finishTelegramDispatch(log, false, 'Telegram bot token sozlanmagan (TelegramView sozlamalarida).');
    if (!chatId) return this.finishTelegramDispatch(log, false, 'Direktor chat ID sozlanmagan.');

    let delivered = false;
    try {
      const resp = await fetch('/api/telegram/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, chatId, text }),
      });
      const body = await resp.json().catch(() => ({}));
      delivered = body?.ok === true;
      if (!delivered) console.warn('Telegram send endpoint returned:', resp.status, body?.error || '');
    } catch (err) {
      console.warn('Telegram send endpoint unreachable:', err);
    }

    return this.finishTelegramDispatch(log, delivered, delivered ? undefined : 'Telegram server ulanishi mavjud emas');
  }

  // --- BACKUP EXPORT & IMPORT ---
  public exportFullBackupJSON(): string {
    const backupData = {
      version: '3.0',
      exportedAt: new Date().toISOString(),
      center: this.settings.centerName,
      data: {
        teachers: this.teachers,
        courses: this.courses,
        schedule: this.schedule,
        students: this.students,
        leads: this.leads,
        payments: this.payments,
        expenses: this.expenses,
        results: this.results,
        cms: this.cmsContent,
        settings: this.settings,
        auditLogs: this.auditLogs,
      },
    };
    return JSON.stringify(backupData, null, 2);
  }

  public importFullBackupJSON(jsonString: string): { success: boolean; message: string } {
    try {
      const parsed = JSON.parse(jsonString);
      const d = (parsed && parsed.data && typeof parsed.data === 'object') ? parsed.data : parsed;
      if (!d || typeof d !== 'object') {
        return { success: false, message: "Noto'g'ri fayl formati: zaxira ma'lumotlari topilmadi." };
      }

      const requiredCollections = ['teachers', 'courses', 'students'];
      if (!requiredCollections.some((key) => Array.isArray(d[key]))) {
        return { success: false, message: "Noto'g'ri zaxira fayl: 'data' bo'limida ma'lumotlar yo'q." };
      }

      if (Array.isArray(d.teachers)) {
        this.teachers = d.teachers;
        saveToStorage(STORAGE_KEYS.TEACHERS, this.teachers);
      }
      if (Array.isArray(d.courses)) {
        this.courses = d.courses;
        saveToStorage(STORAGE_KEYS.COURSES, this.courses);
      }
      if (Array.isArray(d.schedule)) {
        this.schedule = d.schedule;
        saveToStorage(STORAGE_KEYS.SCHEDULE, this.schedule);
      }
      if (Array.isArray(d.students)) {
        this.students = d.students;
        saveToStorage(STORAGE_KEYS.STUDENTS, this.students);
      }
      if (Array.isArray(d.leads)) {
        this.leads = d.leads;
        saveToStorage(STORAGE_KEYS.LEADS, this.leads);
      }
      if (Array.isArray(d.payments)) {
        this.payments = d.payments;
        saveToStorage(STORAGE_KEYS.PAYMENTS, this.payments);
      }
      if (Array.isArray(d.expenses)) {
        this.expenses = d.expenses;
        saveToStorage(STORAGE_KEYS.EXPENSES, this.expenses);
      }
      if (Array.isArray(d.results)) {
        this.results = d.results;
        saveToStorage(STORAGE_KEYS.RESULTS, this.results);
      }
      if (Array.isArray(d.auditLogs)) {
        this.auditLogs = d.auditLogs;
        saveToStorage(STORAGE_KEYS.AUDIT_LOGS, this.auditLogs);
      }
      // Accept both the versioned CMS shape (cmsContent) and the live CMS shape (cms/cmsData)
      const cmsData = d.cmsContent || d.cms || d.cmsData;
      if (cmsData && typeof cmsData === 'object') {
        this.cmsContent = cmsData;
        saveToStorage(STORAGE_KEYS.CMS, this.cmsContent);
        try {
          localStorage.setItem('crm_cms_data', JSON.stringify(cmsData));
        } catch {}
      }
      if (d.settings && typeof d.settings === 'object') {
        this.settings = d.settings;
        saveToStorage(STORAGE_KEYS.SETTINGS, this.settings);
      }

      this.logAction("To'liq ma'lumotlar bazasi qayta yuklandi (Backup import)", "Tizim", "Zaxira nusxadan tiklandi");
      return { success: true, message: "Barcha ma'lumotlar bazasi muvaffaqiyatli tiklandi!" };
    } catch (err: any) {
      return { success: false, message: `Import xatosi: ${err?.message || 'Fayl o\'qilmadi'}` };
    }
  }

  // Quick export leads CSV
  public exportLeadsCSV(): string {
    const headers = ['ID', 'Ism', 'Telefon', 'Kurs', 'Holat', 'Sana', 'Mas\'ul', 'Izoh'];
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
}

export const crmService = new CrmService();
