import { collection, doc, getDoc, getDocs, setDoc, updateDoc, arrayUnion, limit, query } from 'firebase/firestore';
import { db } from './firebase';

/**
 * Centralized demo-data seeder — the ONLY sanctioned seed entry point.
 *
 * Guarantees:
 * - Single invocation site (admin shell mount); no component-level callers.
 * - Deterministic `demo-*` document IDs (setDoc merge → reruns never duplicate).
 * - Version marker at settings/seed_meta (admin-only doc); SEED_VERSION bump
 *   reseeds only the demo namespace.
 * - Real demo identity UIDs; no placeholder/fake UIDs anywhere.
 * - Non-destructive: only demo-* IDs are written (merge), the shared
 *   landing_cms doc is written ONLY when absent, users/* role docs are never
 *   touched (only the assignment index is unioned).
 * - Every demo record carries `isDemo: true` provenance.
 * - StrictMode-safe via module-level single-flight guard.
 */

export const SEED_VERSION = 8;

// Verified live Firebase Auth UIDs for the project demo accounts.
export const DEMO_ADMIN_UID = '8QEu4s0IW4QtYYDhxTigjCkRe4e2';
export const DEMO_TEACHER_UID = '1mHTkm1lfRdn5recPAU9GH0sLdQ2';
export const DEMO_STUDENT_UID = 'of8abp2UXVQw9BIRMIh1giWRtv63';
export const DEMO_RECEPTIONIST_UID = 'gBYrizEDKzNWESOyTrxjx43yP923';
export const DEMO_TEACHER_NAME = 'Jasur Alimov';
export const DEMO_RECEPTIONIST_NAME = 'Qabulxona';

const SEED_META_REF = () => doc(db, 'settings', 'seed_meta');

let seedInFlight: Promise<void> | null = null;

const isoDay = (daysAgo: number): string => {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return d.toISOString().split('T')[0];
};

const isoDayTime = (daysAgo: number): string => {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return d.toISOString();
};

// ---------------------------------------------------------------------------
// Demo catalog (shared by Landing, Admin, Teacher)
// ---------------------------------------------------------------------------

const DEMO_COURSES = [
  { id: 'demo-course-dtm', title: 'DTM & Milliy Sertifikat', category: 'DTM', description: 'DTM va Milliy sertifikat imtihonlariga chuqurlashtirilgan tayyorlov.', duration: '8 oy', lessonsPerWeek: '3 marta / hafta', monthlyFee: 380000, formattedFee: '380 000 UZS', features: ['Haftalik mock testlar', 'Individual tahlil', 'Bepul konsultatsiya'], displayOrder: 1 },
  { id: 'demo-course-math', title: 'Matematika & Fizika', category: 'Aniq fanlar', description: 'Maktab va olimpiada matematikasi, fizika asoslari.', duration: '9 oy', lessonsPerWeek: '3 marta / hafta', monthlyFee: 380000, formattedFee: '380 000 UZS', features: ['Olimpiada masalalari', 'DTM formati', 'Kichik guruhlar'], displayOrder: 2 },
  { id: 'demo-course-cefr', title: 'CEFR B2/C1', category: 'Ingliz tili', description: 'CEFR B2 va C1 darajalariga tizimli tayyorlov.', duration: '6 oy', lessonsPerWeek: '3 marta / hafta', monthlyFee: 350000, formattedFee: '350 000 UZS', features: ['Speaking klublar', 'Mock imtihonlar', 'Sertifikat kafolati'], displayOrder: 3 },
  { id: 'demo-course-kids', title: 'English Kids', category: 'Ingliz tili', description: '3–10 yoshli bolalar uchun qiziqarli ingliz tili.', duration: '9 oy', lessonsPerWeek: '2 marta / hafta', monthlyFee: 290000, formattedFee: '290 000 UZS', features: ['Oyin orqali ta\'lim', 'Rasm va qo\'shiqlar', 'Ota-onalar hisobotlari'], displayOrder: 4 },
  { id: 'demo-course-mental', title: 'Mental Arifmetika', category: 'Boshlang\'ich', description: 'Xotira va hisoblash tezligini rivojlantirish.', duration: '6 oy', lessonsPerWeek: '2 marta / hafta', monthlyFee: 280000, formattedFee: '280 000 UZS', features: ['Soroban bilan ishlash', 'Diqqat mashqlari', 'Musobaqalar'], displayOrder: 5 },
  { id: 'demo-course-ona-tili', title: 'Ona Tili', category: 'Milliy sertifikat', description: 'Ona tili va adabiyotdan Milliy sertifikatga tayyorlov.', duration: '6 oy', lessonsPerWeek: '2 marta / hafta', monthlyFee: 320000, formattedFee: '320 000 UZS', features: ['Grammatika chuqur', 'Test tahlili', 'Insho yozish'], displayOrder: 6 },
];

const DEMO_TEACHERS = [
  { id: 'demo-teacher-jasur', uid: DEMO_TEACHER_UID, name: 'Jasur Alimov', subject: 'Matematika & Fizika', specialization: 'Matematika & Fizika', experience: '8 yil', qualification: 'Oliy toifali ustoz', phone: '+998 (99) 259-32-32', photo: '', achievements: ['DTM 189.5 ball sohiblari ustozi'], description: 'DTM va Milliy sertifikatga tayyorlov bo\'yicha tajribali ustoz.', status: 'Active', salaryStatus: 'Paid', monthlySalary: 9000000, activeGroups: 4, studentsCount: 12, isPublic: true, displayOrder: 1 },
  { id: 'demo-teacher-malika', name: 'Malika Yusupova', subject: 'Ingliz tili (CEFR)', specialization: 'Ingliz tili (CEFR)', experience: '6 yil', qualification: 'CEFR C1', phone: '+998 (91) 555-01-02', photo: '', achievements: ['120+ CEFR B2 natijalari'], description: 'CEFR imtihonlariga ixtisoslashgan ustoz.', status: 'Active', salaryStatus: 'Paid', monthlySalary: 7500000, activeGroups: 1, studentsCount: 3, isPublic: true, displayOrder: 2 },
  { id: 'demo-teacher-sardor', name: 'Sardor Qodirov', subject: 'Mental Arifmetika', specialization: 'Mental Arifmetika', experience: '4 yil', qualification: 'Xalqaro sertifikat', phone: '+998 (93) 555-01-03', photo: '', achievements: ['Respublika musobaqasi g\'oliblari ustozi'], description: 'Bolalar bilan ishlash bo\'yicha mutaxassis.', status: 'Active', salaryStatus: 'Pending', monthlySalary: 6000000, activeGroups: 0, studentsCount: 0, isPublic: true, displayOrder: 3 },
];

interface SeedGroup {
  id: string;
  groupName: string;
  course: string;
  courseId: string;
  days: string;
  time: string;
  room: string;
  monthlyFee: number;
}

const DEMO_GROUPS: SeedGroup[] = [
  { id: 'demo-group-cefr-b2', groupName: 'CEFR B2 — Demo', course: 'CEFR B2/C1', courseId: 'demo-course-cefr', days: 'Dush / Chor / Juma', time: '18:00 - 19:30', room: '101-Auditoriya', monthlyFee: 350000 },
  { id: 'demo-group-dtm-math', groupName: 'DTM Matematika — Demo', course: 'Matematika & Fizika', courseId: 'demo-course-math', days: 'Sesh / Pay / Shan', time: '17:00 - 18:30', room: '102-xona', monthlyFee: 380000 },
  { id: 'demo-group-dtm-main', groupName: 'DTM Asosiy — Demo', course: 'DTM & Milliy Sertifikat', courseId: 'demo-course-dtm', days: 'Dush / Chor / Juma', time: '14:00 - 16:00', room: '201-xona', monthlyFee: 380000 },
  { id: 'demo-group-kids', groupName: 'English Kids — Demo', course: 'English Kids', courseId: 'demo-course-kids', days: 'Sesh / Pay', time: '11:00 - 12:00', room: 'MindLab', monthlyFee: 290000 },
  { id: 'demo-group-yakshanba', groupName: 'Yakshanba Takrorlash — Demo', course: 'DTM & Milliy Sertifikat', courseId: 'demo-course-dtm', days: 'Yak / Shan', time: '09:00 - 11:00', room: '101-Auditoriya', monthlyFee: 380000 },
];

interface SeedStudent {
  id: string;
  fullName: string;
  phone: string;
  groupId: string;
  payment: 'Paid' | 'Due' | 'Overdue';
}

const DEMO_STUDENTS: SeedStudent[] = [
  { id: 'demo-student-001', fullName: 'Azizbek Toshmatov', phone: '+998 (90) 111-00-01', groupId: 'demo-group-cefr-b2', payment: 'Paid' },
  { id: 'demo-student-002', fullName: 'Malika Sharipova', phone: '+998 (90) 111-00-02', groupId: 'demo-group-cefr-b2', payment: 'Paid' },
  { id: 'demo-student-003', fullName: 'Bekzod Umarov', phone: '+998 (90) 111-00-03', groupId: 'demo-group-cefr-b2', payment: 'Due' },
  { id: 'demo-student-004', fullName: 'Feruza Alimova', phone: '+998 (90) 111-00-04', groupId: 'demo-group-dtm-math', payment: 'Paid' },
  { id: 'demo-student-005', fullName: 'Odiljon Yuldashev', phone: '+998 (90) 111-00-05', groupId: 'demo-group-dtm-math', payment: 'Overdue' },
  { id: 'demo-student-006', fullName: 'Sevara Tursunova', phone: '+998 (90) 111-00-06', groupId: 'demo-group-dtm-math', payment: 'Paid' },
  { id: 'demo-student-007', fullName: 'Sardor Ergashev', phone: '+998 (90) 111-00-07', groupId: 'demo-group-dtm-main', payment: 'Paid' },
  { id: 'demo-student-008', fullName: 'Dilnoza Sobirova', phone: '+998 (90) 111-00-08', groupId: 'demo-group-dtm-main', payment: 'Due' },
  { id: 'demo-student-009', fullName: 'Nodirjon Qosimov', phone: '+998 (90) 111-00-09', groupId: 'demo-group-dtm-main', payment: 'Paid' },
  { id: 'demo-student-010', fullName: 'Kamola Nazarova', phone: '+998 (90) 111-00-10', groupId: 'demo-group-kids', payment: 'Paid' },
  { id: 'demo-student-011', fullName: 'Sherzod Mirkomilov', phone: '+998 (90) 111-00-11', groupId: 'demo-group-kids', payment: 'Paid' },
  { id: 'demo-student-012', fullName: 'Gulchehra Raxmonova', phone: '+998 (90) 111-00-12', groupId: 'demo-group-kids', payment: 'Overdue' },
  { id: 'demo-student-013', fullName: 'Bobur Mahmudov', phone: '+998 (90) 111-00-13', groupId: 'demo-group-yakshanba', payment: 'Paid' },
  { id: 'demo-student-014', fullName: 'Shahnoza Ismoilova', phone: '+998 (90) 111-00-14', groupId: 'demo-group-yakshanba', payment: 'Paid' },
  { id: 'demo-student-015', fullName: 'Doston Rahmatov', phone: '+998 (90) 111-00-15', groupId: 'demo-group-yakshanba', payment: 'Due' },
];

const DEMO_LEADS = [
  { id: 'demo-lead-001', name: 'Javlonbek Sodiqov', phone: '+998 (90) 222-00-01', course: 'DTM & Milliy Sertifikat', status: 'Yangi', source: 'Sayt orqali ariza', daysAgo: 0, priority: 'muhim', followUpDate: isoDay(0), followUpNote: 'Bugun qo‘ng‘iroq qilish', contactAttempts: 0 },
  { id: 'demo-lead-002', name: 'Nilufar Ergasheva', phone: '+998 (90) 222-00-02', course: 'CEFR B2/C1', status: 'Yangi', source: 'Instagram', daysAgo: 0, priority: 'oddiy', followUpDate: isoDay(0), followUpNote: 'Kurs haqida ma’lumot berish', contactAttempts: 1 },
  { id: 'demo-lead-003', name: 'Aziza Qodirova', phone: '+998 (90) 222-00-03', course: 'English Kids', status: "Bog'lanildi", source: 'Telegram bot orqali', daysAgo: 1, priority: 'oddiy', contactAttempts: 2 },
  { id: 'demo-lead-004', name: 'Farrux Mirzayev', phone: '+998 (90) 222-00-04', course: 'Matematika & Fizika', status: "Bog'lanildi", source: 'Tavsiya asosida', daysAgo: 1, priority: 'muhim', followUpDate: isoDay(-1), followUpNote: 'Muddati o‘tgan — qayta bog‘lanish', contactAttempts: 2 },
  { id: 'demo-lead-005', name: 'Dilbar Sultonova', phone: '+998 (90) 222-00-05', course: 'DTM & Milliy Sertifikat', status: 'Sinov darsi belgilandi', source: 'Sayt orqali ariza', daysAgo: 2, trialDateTime: new Date().toISOString(), trialRoom: '101-Auditoriya', trialTeacher: 'Jasur Alimov' },
  { id: 'demo-lead-006', name: 'Akmal Avezov', phone: '+998 (90) 222-00-06', course: 'Mental Arifmetika', status: 'Sinov darsi belgilandi', source: 'Markazga tashrif', daysAgo: 2 },
  { id: 'demo-lead-007', name: 'Maftuna Utaeva', phone: '+998 (90) 222-00-07', course: 'Ona Tili', status: 'Sinov darsi yakunlandi', source: 'Telefon orqali', daysAgo: 3 },
  { id: 'demo-lead-008', name: 'Otabek Rashidov', phone: '+998 (90) 222-00-08', course: 'CEFR B2/C1', status: "O'quvchiga aylandi", source: 'Sayt orqali ariza', daysAgo: 4 },
  { id: 'demo-lead-009', name: 'Munisa Abdullayeva', phone: '+998 (90) 222-00-09', course: 'English Kids', status: "Yo'qotildi", source: 'Instagram', daysAgo: 5, lostReason: 'Boshqa markazni tanladi', lostDate: isoDay(2) },
  { id: 'demo-lead-010', name: 'Islomjon Karimov', phone: '+998 (90) 222-00-10', course: 'Matematika & Fizika', status: "Bog'lanildi", source: 'Bosh sahifa (Hero forma)', daysAgo: 0, priority: 'oddiy', contactAttempts: 1 },
  { id: 'demo-lead-011', name: 'Yulduz Bekmurodova', phone: '+998 (90) 222-00-11', course: 'DTM & Milliy Sertifikat', status: 'Yangi', source: 'Telegram bot orqali', daysAgo: 1, priority: 'shoshilinch', followUpDate: isoDay(0), followUpNote: 'Bugun 15:30 da qo‘ng‘iroq', contactAttempts: 0 },
  { id: 'demo-lead-012', name: 'Sirojiddin Aliyev', phone: '+998 (90) 222-00-12', course: 'Ona Tili', status: 'Sinov darsi belgilandi', source: 'Tavsiya asosida', daysAgo: 2 },
];

// Demo-scale monthly economics: revenue (this month) must exceed expenses so
// the dashboard computes a believable positive profit from live records.
const DEMO_EXPENSES = [
  { id: 'demo-expense-001', category: 'Teacher Salary', title: "O'qituvchilar maoshi", amount: 1800000, recipient: 'Pedagogik jamoa', daysAgo: 5 },
  { id: 'demo-expense-002', category: 'Rent', title: 'Ijara haqi', amount: 2500000, recipient: 'Bino egasi', daysAgo: 8 },
  { id: 'demo-expense-003', category: 'Utilities', title: 'Kommunal to\'lovlar', amount: 400000, recipient: 'Kommunal xizmatlar', daysAgo: 6 },
  { id: 'demo-expense-004', category: 'Marketing', title: 'Instagram reklama', amount: 600000, recipient: 'SMM agentlik', daysAgo: 3 },
  { id: 'demo-expense-005', category: 'Supplies', title: "O'quv materiallari", amount: 300000, recipient: 'Nashriyot', daysAgo: 10 },
  { id: 'demo-expense-006', category: 'Salaries', title: 'Administrator maoshi', amount: 700000, recipient: 'Qabulxona', daysAgo: 5 },
  { id: 'demo-expense-007', category: 'Maintenance', title: 'Xonalarni ta\'mirlash', amount: 300000, recipient: 'Usta', daysAgo: 4 },
  { id: 'demo-expense-008', category: 'Other', title: 'Kutilmagan xarajatlar', amount: 200000, recipient: 'Kassa', daysAgo: 2 },
];

const DEMO_HOMEWORK = [
  { id: 'demo-hw-001', groupId: 'demo-group-cefr-b2', title: 'Present Perfect mashqlari', subjectCategory: 'Languages & IELTS/CEFR', dueInDays: 3 },
  { id: 'demo-hw-002', groupId: 'demo-group-dtm-math', title: 'Kvadrat tenglamalar to\'plami', subjectCategory: 'Mathematics & Geometry', dueInDays: 2 },
  { id: 'demo-hw-003', groupId: 'demo-group-dtm-main', title: 'DTM mock test tahlili', subjectCategory: 'Test Score', dueInDays: 5 },
  { id: 'demo-hw-004', groupId: 'demo-group-kids', title: 'Ranglar va hayvonlar lug\'ati', subjectCategory: 'General / Humanities', dueInDays: 4 },
  { id: 'demo-hw-005', groupId: 'demo-group-yakshanba', title: 'Haftalik takrorlash testi', subjectCategory: 'Test Score', dueInDays: 6 },
];

const DEMO_TEACHER_TASKS = [
  { id: 'demo-task-001', title: 'CEFR B2 — Demo guruhi uchun mock test tayyorlash', description: 'Listening + Reading bo‘limlari, javob kaliti bilan.', dueInDays: 2 },
  { id: 'demo-task-002', title: 'DTM Matematika — Demo guruhi davomatini tekshirish', description: 'Haftalik davomat hisobotini ota-onalarga yuborish.', dueInDays: 1 },
  { id: 'demo-task-003', title: 'English Kids — Demo uchun ota-onalar uchrashuvi', description: 'Oylik natijalarni muhokama qilish.', dueInDays: 5 },
];

const DEMO_NOTIFICATIONS = [  { id: 'demo-notif-001', to: 'uid' as const, category: 'announcement', title: 'Yangi guruh tayinlandi', description: 'Sizga DTM Tayyorlov demo guruhlari biriktirildi.' },
  { id: 'demo-notif-002', to: 'role' as const, category: 'announcement', title: 'Davomat eslatmasi', description: 'Bugungi darslar uchun davomatni belgilashni unutmang.' },
  { id: 'demo-notif-003', to: 'all' as const, category: 'announcement', title: 'Admin e\'loni', description: 'Ertaga soat 10:00 da pedagogik kengash bo\'lib o\'tadi.' },
  { id: 'demo-notif-004', to: 'role' as const, category: 'announcement', title: 'Ertangi dars jadvali', description: 'Ertangi jadval yangilandi — guruhlaringizni tekshiring.' },
  { id: 'demo-notif-005', to: 'uid' as const, category: 'grade_published', title: 'To\'lov eslatmasi', description: '3 nafar o\'quvchida qarzdorlik mavjud.' },
  { id: 'demo-notif-006', to: 'uid' as const, uid: DEMO_RECEPTIONIST_UID, category: 'announcement', title: 'Yangi murojaatlar tayinlandi', description: '3 ta yangi ariza Qabulxonaga tayinlandi. Kuzatuv ro‘yxatini tekshiring.' },
  { id: 'demo-notif-007', to: 'uid' as const, uid: DEMO_RECEPTIONIST_UID, category: 'announcement', title: 'Bugungi sinov darslari', description: 'Bugun bitta sinov darsi rejalashtirilgan — jadvalni tekshiring.' },
];

const DEMO_RESULTS = [
  { id: 'demo-result-001', studentName: 'Demo Bitiruvchi A', score: '189.5', university: 'Toshkent Davlat Universiteti', year: '2026', category: 'DTM', badge: 'Davlat granti', order: 1 },
  { id: 'demo-result-002', studentName: 'Demo Bitiruvchi B', score: '7.5', university: 'IELTS', year: '2026', category: 'IELTS', badge: 'IELTS 7.5', order: 2 },
  { id: 'demo-result-003', studentName: 'Demo Bitiruvchi C', score: 'B2', university: 'CEFR', year: '2026', category: 'CEFR', badge: 'B2', order: 3 },
  { id: 'demo-result-004', studentName: 'Demo Bitiruvchi D', score: 'A+', university: 'Milliy sertifikat', year: '2026', category: 'Milliy Sertifikat', badge: 'A+', order: 4 },
  { id: 'demo-result-005', studentName: 'Demo Bitiruvchi E', score: '182.0', university: 'Samarqand Davlat Universiteti', year: '2025', category: 'DTM', badge: 'Grant', order: 5 },
  { id: 'demo-result-006', studentName: 'Demo Bitiruvchi F', score: '7.0', university: 'IELTS', year: '2025', category: 'IELTS', badge: 'IELTS 7.0', order: 6 },
];

const DEMO_FAQS = [
  { id: 'demo-faq-001', question: 'Sinov darsi bepulmi?', answer: 'Ha, birinchi sinov darsi mutlaqo bepul.', order: 1 },
  { id: 'demo-faq-002', question: 'Oylik to\'lov qancha?', answer: 'Kursga qarab 280 000 – 380 000 UZS.', order: 2 },
  { id: 'demo-faq-003', question: 'Guruhda nechta o\'quvchi bo\'ladi?', answer: 'Guruhlar 8–16 nafar o\'quvchidan iborat.', order: 3 },
  { id: 'demo-faq-004', question: 'Darslar qachon bo\'ladi?', answer: 'Haftada 2–3 marta, ertalabki va kechki guruhlar mavjud.', order: 4 },
  { id: 'demo-faq-005', question: 'Natija kafolatlanadimi?', answer: 'Mock testlar va individual tahlil orqali natija kuzatib boriladi.', order: 5 },
  { id: 'demo-faq-006', question: 'Qanday yozilish mumkin?', answer: 'Sayt, Telegram yoki markazga tashrif orqali.', order: 6 },
];

const DEMO_BRANCHES = [
  { id: 'demo-branch-1', name: 'Asosiy filial', address: 'Yangiobod shahri, Markaziy ko\'cha 1', phone: '+998 (88) 648-49-49', workingHours: '08:00 - 20:00', isActive: true, displayOrder: 1 },
  { id: 'demo-branch-2', name: '2-filial', address: 'Yangiobod shahri, Navoiy ko\'cha 12', phone: '+998 (88) 648-49-50', workingHours: '09:00 - 19:00', isActive: true, displayOrder: 2 },
];

const PAY_METHODS = ['cash', 'card', 'click', 'payme'] as const;

// ---------------------------------------------------------------------------
// Writer
// ---------------------------------------------------------------------------

async function writeDemoDataset(): Promise<void> {
  const nowIso = new Date().toISOString();
  const today = nowIso.split('T')[0];

  // Courses / teachers / results / faqs / branches (public landing content).
  for (const c of DEMO_COURSES) {
    await setDoc(doc(db, 'courses', c.id), { ...c, isActive: true, isPublic: true, isDemo: true }, { merge: true });
  }
  for (const t of DEMO_TEACHERS) {
    // Compensation stays out of the publicly readable teacher document —
    // it lives in the admin-only private subcollection (see teachersService).
    const { monthlySalary, salaryStatus, ...publicTeacher } = t as Record<string, unknown>;
    await setDoc(doc(db, 'teachers', t.id), { ...publicTeacher, gender: 'male', isDemo: true }, { merge: true });
    await setDoc(doc(db, 'teachers', t.id, 'private', 'comp'), { monthlySalary, salaryStatus, isDemo: true }, { merge: true });
    // One-time cleanup of legacy compensation fields on older public docs.
    const { deleteField } = await import('firebase/firestore');
    await updateDoc(doc(db, 'teachers', t.id), {
      monthlySalary: deleteField(),
      salary: deleteField(),
      salaryStatus: deleteField(),
    }).catch(() => undefined);
  }
  for (const r of DEMO_RESULTS) {
    await setDoc(doc(db, 'results', r.id), { ...r, published: true, date: today, isDemo: true }, { merge: true });
  }
  for (const f of DEMO_FAQS) {
    await setDoc(doc(db, 'faqs', f.id), { ...f, isDemo: true }, { merge: true });
  }
  for (const b of DEMO_BRANCHES) {
    await setDoc(doc(db, 'branches', b.id), { ...b, isDemo: true }, { merge: true });
  }

  // Shared landing CMS doc — write ONLY when absent (never clobber admin edits).
  const cmsRef = doc(db, 'settings', 'landing_cms');
  if (!(await getDoc(cmsRef)).exists()) {
    await setDoc(cmsRef, {
      contact: { phone: '+998 (88) 648-49-49', telegram: '@D_Furqatovich', branches: ['Yangiobod tumani, 1-sonli umumiy o\'rta ta\'lim maktabi binosi', 'Yangiobod tuman texnikumi (NODIRABEGIM EDUCATION)'] },
      hero: { centerName: 'Renessans LC', tagline: 'Bilimdan Natijaga!', subtitle: 'DTM, CEFR va maktab fanlari', badge: 'Yangiobod' },
      stats: { universityAdmissions: '1200+', studentAdmittedRatio: '94%', highestDtmScore: '189.5', stateGrantsCount: '210' },
      isDemo: true,
    });
  }

  // Groups (owned by the real demo teacher) + membership indexes.
  for (const g of DEMO_GROUPS) {
    const memberIds = DEMO_STUDENTS.filter((s) => s.groupId === g.id).map((s) => s.id);
    const hwIds = DEMO_HOMEWORK.filter((h) => h.groupId === g.id).map((h) => h.id);
    await setDoc(doc(db, 'groups', g.id), {
      ...g,
      name: g.groupName,
      teacherId: DEMO_TEACHER_UID,
      teacherName: DEMO_TEACHER_NAME,
      teacher: DEMO_TEACHER_NAME,
      scheduleTime: `${g.days} ${g.time}`,
      activeStudentsCount: memberIds.length,
      studentsCount: memberIds.length,
      studentIds: memberIds,
      homeworkIds: hwIds,
      type: 'Regular',
      status: 'Active',
      isDemo: true,
    }, { merge: true });
  }

  // Students.
  for (const s of DEMO_STUDENTS) {
    const g = DEMO_GROUPS.find((x) => x.id === s.groupId)!;
    await setDoc(doc(db, 'students', s.id), {
      fullName: s.fullName,
      name: s.fullName,
      phone: s.phone,
      course: g.course,
      courseId: g.courseId,
      groupId: g.id,
      groupName: g.groupName,
      teacherId: DEMO_TEACHER_UID,
      teacher: DEMO_TEACHER_NAME,
      mentor: DEMO_TEACHER_NAME,
      monthlyFee: g.monthlyFee,
      tuitionFee: g.monthlyFee,
      paymentStatus: s.payment,
      debtAmount: s.payment === 'Paid' ? 0 : g.monthlyFee,
      enrollmentDate: isoDay(20 + (s.id.charCodeAt(s.id.length - 1) % 20)),
      attendanceRate: 85 + (s.id.charCodeAt(s.id.length - 1) % 14),
      status: 'Active',
      isActive: true,
      notes: 'Demo yozuv',
      isDemo: true,
    }, { merge: true });
  }

  // Teacher assignment index (merge — never fails when the users doc is
  // absent, e.g. the demo teacher has not signed in yet; preserves any
  // existing assignments).
  await setDoc(doc(db, 'users', DEMO_TEACHER_UID), {
    assignedGroupIds: arrayUnion(...DEMO_GROUPS.map((g) => g.id)),
  }, { merge: true });

  // Attendance: last 14 days per group, deterministic statuses.
  for (const g of DEMO_GROUPS) {
    const members = DEMO_STUDENTS.filter((s) => s.groupId === g.id);
    for (let d = 0; d < 14; d++) {
      const date = isoDay(d);
      const records: Record<string, string> = {};
      members.forEach((m, i) => {
        const v = (d + i) % 10;
        records[m.id] = v === 0 ? 'absent' : v === 1 ? 'late' : 'present';
      });
      await setDoc(doc(db, 'attendance', `${g.id}_${date}`), {
        groupId: g.id,
        date,
        records,
        recordedBy: DEMO_TEACHER_NAME,
        isDemo: true,
      }, { merge: true });
    }
  }

  // Payments: 4 installments per student, concentrated in the current month
  // so the dashboard's monthly revenue reflects the demo cohort size.
  // Each payment also gets a sanitized public_receipts mirror (same shape
  // as writePublicReceiptSummary) so QR verification works on demo data.
  let payIdx = 0;
  for (const s of DEMO_STUDENTS) {
    const g = DEMO_GROUPS.find((x) => x.id === s.groupId)!;
    for (let m = 0; m < 4; m++) {
      const id = `demo-payment-${String(++payIdx).padStart(3, '0')}`;
      const method = PAY_METHODS[(payIdx + m) % PAY_METHODS.length];
      const payStatus = s.payment === 'Paid' || m < 3 ? 'Completed' : 'Pending';
      const payDate = isoDay(m * 6 + (payIdx % 4));
      await setDoc(doc(db, 'payments', id), {
        studentId: s.id,
        studentName: s.fullName,
        amount: g.monthlyFee,
        course: g.course,
        subjectCategory: g.course,
        paymentMethod: method,
        method: method.charAt(0).toUpperCase() + method.slice(1),
        date: payDate,
        recordedBy: 'Admin',
        status: payStatus,
        cohortGroup: g.groupName,
        paymentPeriod: isoDay(m * 28).slice(0, 7),
        receiptNumber: `CHK-${id.toUpperCase()}`,
        receiptRef: `CHK-${id.toUpperCase()}`,
        isDemo: true,
      }, { merge: true });
      await setDoc(doc(db, 'public_receipts', id), {
        paymentId: id,
        receiptNumber: `CHK-${id.toUpperCase()}`,
        amount: g.monthlyFee,
        course: g.course,
        date: payDate,
        method: method.charAt(0).toUpperCase() + method.slice(1),
        status: payStatus,
        studentName: s.fullName,
        studentId: s.id,
        createdAt: nowIso,
        isDemo: true,
      }, { merge: true });
    }
  }

  // Expenses.
  for (const e of DEMO_EXPENSES) {
    await setDoc(doc(db, 'expenses', e.id), {
      ...e,
      title: e.title,
      date: isoDay(e.daysAgo),
      month: isoDay(e.daysAgo).slice(0, 7),
      status: 'Paid',
      notes: 'Demo yozuv',
      isDemo: true,
    }, { merge: true });
  }

  // Leads.
  for (const l of DEMO_LEADS) {
    await setDoc(doc(db, 'leads', l.id), {
      ...l,
      assignedTo: 'Qabulxona',
      notes: 'Demo yozuv',
      createdAt: isoDayTime(l.daysAgo),
      isDemo: true,
    }, { merge: true });
  }

  // Homework (owned by the real demo teacher).
  for (const h of DEMO_HOMEWORK) {
    const g = DEMO_GROUPS.find((x) => x.id === h.groupId)!;
    await setDoc(doc(db, 'homework', h.id), {
      title: h.title,
      groupId: h.groupId,
      groupName: g.groupName,
      group: g.groupName,
      teacherId: DEMO_TEACHER_UID,
      teacherName: DEMO_TEACHER_NAME,
      subjectCategory: h.subjectCategory,
      description: 'Demo topshiriq',
      dueDate: isoDay(-h.dueInDays),
      deadline: isoDay(-h.dueInDays),
      submittedCount: 0,
      totalStudents: 3,
      createdAt: nowIso,
      isDemo: true,
    }, { merge: true });
  }

  // Teacher tasks (owned by the real demo teacher — teacher portal reads).
  for (const t of DEMO_TEACHER_TASKS) {
    await setDoc(doc(db, 'teacher_tasks', t.id), {
      title: t.title,
      description: t.description,
      teacherId: DEMO_TEACHER_UID,
      teacherName: DEMO_TEACHER_NAME,
      status: 'pending',
      dueDate: isoDay(-t.dueInDays),
      createdAt: nowIso,
      isDemo: true,
    }, { merge: true });
  }

  // Retire demo IDs removed from the v4 set (idempotent; missing docs are no-ops).
  for (const retired of ['demo-expense-009', 'demo-expense-010']) {
    try {
      const { deleteDoc: _deleteDoc } = await import('firebase/firestore');
      await _deleteDoc(doc(db, 'expenses', retired));
    } catch {
      // Already absent — nothing to do.
    }
  }

  // Notifications for the demo teacher.
  for (const n of DEMO_NOTIFICATIONS) {    await setDoc(doc(db, 'notifications', n.id), {
      category: n.category,
      title: n.title,
      description: n.description,
      isRead: false,
      createdAt: nowIso,
      senderName: 'Admin',
      ...(n.to === 'uid' ? { recipientId: (n as { uid?: string }).uid || DEMO_TEACHER_UID } : {}),
      ...(n.to === 'role' ? { recipientRole: 'teacher' } : {}),
      ...(n.to === 'all' ? { recipientRole: 'all' } : {}),
      isDemo: true,
    }, { merge: true });
  }
}

/**
 * Ensure seed state. Must only be called from an admin-authenticated context
 * (settings/* and collection writes are admin-gated by Firestore rules).
 * Safe to call repeatedly and under React StrictMode.
 *
 * When an operator clears demo data, `settings/seed_meta` is marked with
 * `cleared: true` and the demo namespace is NOT re-created automatically
 * (see src/services/demoClear.ts). Demo data can be restored on demand via
 * reseedDemoData().
 */
export async function ensureSeeded(): Promise<void> {
  if (seedInFlight) return seedInFlight;
  seedInFlight = (async () => {
    try {
      const meta = await getDoc(SEED_META_REF());
      if (meta.exists()) {
        const data = meta.data();
        const version = data.version ?? 0;
        // Operator deliberately cleared demo data — honor it, never auto-reseed.
        if (data.cleared === true) return;
        // Already seeded at the current version.
        if (version >= SEED_VERSION) return;
      }
      await writeDemoDataset();
      await setDoc(
        SEED_META_REF(),
        { version: SEED_VERSION, cleared: false, seededAt: new Date().toISOString() },
        { merge: true }
      );
    } catch (err) {
      // Seeding is best-effort (e.g. non-admin caller) — never break the app.
      console.warn('ensureSeeded notice:', err);
    }
  })();
  try {
    await seedInFlight;
  } finally {
    seedInFlight = null;
  }
}

/**
 * Explicitly restore the demo dataset after it was cleared (presentations).
 * Clears the `cleared` marker so normal seeding semantics resume.
 */
export async function reseedDemoData(): Promise<void> {
  await writeDemoDataset();
  await setDoc(
    SEED_META_REF(),
    { version: SEED_VERSION, cleared: false, seededAt: new Date().toISOString() },
    { merge: true }
  );
}
