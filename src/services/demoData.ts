/* ============================================================
   demoData.ts — Central demo data provider for CenterFlow
   Stores all demo data in localStorage with full CRUD operations.
   Replaces a real backend during demos.
   ============================================================ */

const STORAGE_KEY = 'renessans_demo_v5';

/* ============================================================
   INTERFACES
   ============================================================ */

export interface StudentRecord {
  id: string;
  fullName: string;
  phone: string;
  parentPhone?: string;
  groupId: string;
  groupName: string;
  tuitionFee: number;
  paymentStatus: 'paid' | 'pending' | 'overdue';
  lastPaymentDate: string;
  nextDueDate?: string;
  enrollmentDate: string;
  subjectCategory?: string;
  notes?: string;
  attendanceRate?: number;
  createdAt: string;
  updatedAt: string;
  status: string;
  source: string;
}

export interface TeacherRecord {
  id: string;
  name: string;
  gender: string;
  subject: string;
  specialization: string;
  qualification: string;
  experience: string;
  phone: string;
  photo: string;
  achievements: string[];
  telegram: string;
  description: string;
  status: 'Active' | 'On Leave' | 'Archived';
  isPublic: boolean;
  assignedCourses: string[];
  salary: number;
  monthlySalary: number;
  createdAt: string;
  updatedAt: string;
  source: string;
}

export interface GroupRecord {
  id: string;
  name: string;
  courseType: string;
  teacherId: string;
  teacherName: string;
  scheduleTime: string;
  room: string;
  activeStudentsCount: number;
  maxCapacity: number;
  level?: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
  status: string;
  source: string;
}

export interface CourseRecord {
  id: string;
  title: string;
  slug: string;
  category: string;
  badge?: string;
  description: string;
  duration: string;
  monthlyFee: number;
  formattedFee: string;
  teacherName: string;
  teacherId: string;
  features: string[];
  imageUrl: string;
  featured: boolean;
  isActive: boolean;
  isPublic: boolean;
  displayOrder: number;
  createdAt: string;
  updatedAt: string;
  status: string;
  source: string;
}

export interface PaymentRecord {
  id: string;
  studentId: string;
  studentName: string;
  amount: number;
  paymentMethod: 'cash' | 'card' | 'click' | 'payme';
  date: string;
  recordedBy: string;
  recordedByName: string;
  status: 'paid' | 'pending' | 'refunded';
  cohortGroup?: string;
  subjectCategory?: string;
  paymentPeriod?: string;
  receiptRef?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  source: string;
}

export interface LeadRecord {
  id: string;
  name: string;
  phone: string;
  course: string;
  courseId?: string;
  status: 'New' | 'Contacted' | 'Trial Scheduled' | 'Trial Completed' | 'Enrolled' | 'Lost';
  source: 'Website' | 'Phone' | 'Walk-in' | 'Telegram';
  assignedTo?: string;
  assignedTeacherId?: string;
  notes?: string;
  trialDateTime?: string;
  createdAt: string;
  updatedAt: string;
}

export interface QuestionRecord {
  id: string;
  fullName: string;
  phone?: string;
  email?: string;
  courseId?: string;
  courseName?: string;
  subject: string;
  message: string;
  preferredContact: 'phone' | 'email' | 'telegram';
  agreedToContact: boolean;
  status: 'New' | 'In Progress' | 'Replied' | 'Archived';
  assignedTeacherId?: string;
  assignedTeacherName?: string;
  reply?: string;
  createdAt: string;
  updatedAt: string;
  source: 'Website' | 'Contact Page' | 'Course Page';
}

export interface ResultRecord {
  id: string;
  studentName: string;
  testType: 'IELTS' | 'CEFR' | 'IT';
  score: string;
  date: string;
  overall: number;
  listening: number;
  reading: number;
  writing: number;
  speaking: number;
  teacherName: string;
  badge: string;
  published: boolean;
  featured: boolean;
}

export interface AnnouncementRecord {
  id: string;
  title: string;
  message: string;
  type: 'holiday' | 'timetable_change' | 'new_enrollment' | 'meeting' | 'general';
  targetRole: 'all' | 'teachers' | 'students';
  isRead: boolean;
  createdAt: string;
  createdBy: string;
}

export interface NotificationRecord {
  id: string;
  title: string;
  description: string;
  category: string;
  recipientId?: string;
  recipientRole?: string;
  isRead: boolean;
  createdAt: string;
  linkId?: string;
  groupId?: string;
  senderName?: string;
}

export interface ActivityRecord {
  id: string;
  type: string;
  message: string;
  timestamp: string;
  icon: string;
  color: string;
  userId?: string;
}

export interface InquiryRecord {
  id: string;
  fullName: string;
  phone: string;
  email?: string;
  category:
    | 'pricing'
    | 'schedule'
    | 'teachers'
    | 'certificates'
    | 'branches'
    | 'scholarships'
    | 'transport'
    | 'payments'
    | 'other';
  message: string;
  status: 'New' | 'In Progress' | 'Replied' | 'Archived';
  repliedBy?: string;
  reply?: string;
  createdAt: string;
  updatedAt: string;
  source: 'Contact Page' | 'Website';
}

export interface SettingsRecord {
  centerName: string;
  legalName: string;
  phones: string[];
  email: string;
  address: string;
  telegramHandle: string;
  workingHours: string;
  branches: { name: string; address: string }[];
  rooms: { name: string; capacity: number }[];
}

export interface DashboardStats {
  totalStudents: number;
  totalTeachers: number;
  totalGroups: number;
  totalCourses: number;
  totalPayments: number;
  totalLeads: number;
  totalQuestions: number;
  totalResults: number;
  totalAnnouncements: number;
  totalNotifications: number;
  unreadNotifications: number;
  monthlyRevenue: number;
  activeStudents: number;
  pendingLeads: number;
  newQuestions: number;
}

/* ============================================================
   INTERNAL STORE SHAPE
   ============================================================ */

interface Store {
  students: StudentRecord[];
  teachers: TeacherRecord[];
  groups: GroupRecord[];
  courses: CourseRecord[];
  payments: PaymentRecord[];
  leads: LeadRecord[];
  questions: QuestionRecord[];
  results: ResultRecord[];
  announcements: AnnouncementRecord[];
  notifications: NotificationRecord[];
  activity: ActivityRecord[];
  inquiries: InquiryRecord[];
  settings: SettingsRecord;
}

/* ============================================================
   HELPERS
   ============================================================ */

function uid(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 10);
}

function now(): string {
  return new Date().toISOString();
}

function daysAgo(d: number): string {
  const t = new Date();
  t.setDate(t.getDate() - d);
  return t.toISOString();
}

function formatFee(n: number): string {
  return n.toLocaleString('uz-UZ') + " so'm";
}

function load(): Store | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as Store;
  } catch {
    return null;
  }
}

function save(store: Store): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
}

function currentStore(): Store {
  const s = load();
  if (!s) {
    throw new Error('Demo data not initialised. Call demoData.init() first.');
  }
  return s;
}

/* ============================================================
   SEED DATA
   ============================================================ */

function seedData(): Store {
  const ts = daysAgo(0);

  /* ---------- SETTINGS ---------- */
  const settings: SettingsRecord = {
    centerName: 'Renessans Education Center',
    legalName: 'OOO "Renessans Ta\'lim Markazi"',
    phones: ['+998 (90) 123-45-67', '+998 (91) 234-56-78'],
    email: 'info@renessans-edu.uz',
    address: "Toshkent, Mirzo Ulug'bek tumani, Buyuk Ipak Yo'li ko'chasi 45",
    telegramHandle: '@renessans_edu',
    workingHours: 'Dush-Sesh-Chor-Pay-Jum: 08:00–21:00, Shanba: 09:00–18:00',
    branches: [
      {
        name: 'Mirzo Ulug\'bek filiali',
        address: "Buyuk Ipak Yo'li ko'chasi 45",
      },
      {
        name: 'Chilonzor filiali',
        address: 'Chilonzor-9, Bobur ko\'chasi 12',
      },
      {
        name: 'Yunusobod filiali',
        address: "Yunusobod-2, Amir Temur ko'chasi 78",
      },
    ],
    rooms: [
      { name: 'Room 101', capacity: 20 },
      { name: 'Room 102', capacity: 25 },
      { name: 'Room 103', capacity: 15 },
      { name: 'Room 201', capacity: 30 },
      { name: 'Room 202', capacity: 20 },
      { name: 'Room 301', capacity: 40 },
      { name: 'Lab 1', capacity: 18 },
    ],
  };

  /* ---------- TEACHERS ---------- */
  const teachers: TeacherRecord[] = [
    {
      id: 'tch-001',
      name: 'Sardor Raximov',
      gender: 'Male',
      subject: 'English',
      specialization: 'IELTS Preparation',
      qualification: "Bachelor's in English Philology",
      experience: '8 years',
      phone: '+998 (90) 111-22-33',
      photo: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sardor',
      achievements: ['IELTS 8.5 scorer', 'Published 3 research papers', 'Best Teacher 2023'],
      telegram: '@sardor_ielts',
      description: 'Experienced IELTS instructor with a passion for helping students achieve band 7+.',
      status: 'Active',
      isPublic: true,
      assignedCourses: ['crs-001', 'crs-003'],
      salary: 8500000,
      monthlySalary: 8500000,
      createdAt: daysAgo(365),
      updatedAt: ts,
      source: 'manual',
    },
    {
      id: 'tch-002',
      name: 'Nilufar Karimova',
      gender: 'Female',
      subject: 'English',
      specialization: 'General English & Kids',
      qualification: "Master's in TESOL",
      experience: '6 years',
      phone: '+998 (91) 222-33-44',
      photo: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Nilufar',
      achievements: ['Cambridge CELTA certified', 'Kids English Olympiad winner mentor'],
      telegram: '@nilufar_eng',
      description: 'Warm and engaging teacher specializing in children and beginner English learners.',
      status: 'Active',
      isPublic: true,
      assignedCourses: ['crs-002', 'crs-006'],
      salary: 7500000,
      monthlySalary: 7500000,
      createdAt: daysAgo(300),
      updatedAt: ts,
      source: 'manual',
    },
    {
      id: 'tch-003',
      name: 'Akbar Toshmatov',
      gender: 'Male',
      subject: 'Mathematics',
      specialization: 'SAT Math & Olympiad Prep',
      qualification: "Master's in Applied Mathematics",
      experience: '10 years',
      phone: '+998 (93) 333-44-55',
      photo: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Akbar',
      achievements: ['SAT Math 800 scorer', 'National Math Olympiad gold medalist'],
      telegram: '@akbar_math',
      description: 'Mathematics genius who simplifies complex concepts for students of all levels.',
      status: 'Active',
      isPublic: true,
      assignedCourses: ['crs-004'],
      salary: 9000000,
      monthlySalary: 9000000,
      createdAt: daysAgo(400),
      updatedAt: ts,
      source: 'manual',
    },
    {
      id: 'tch-004',
      name: 'Dilnoza Mirzayeva',
      gender: 'Female',
      subject: 'English',
      specialization: 'CEFR & Business English',
      qualification: "Bachelor's in Linguistics",
      experience: '5 years',
      phone: '+998 (94) 444-55-66',
      photo: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Dilnoza',
      achievements: ['CEFR C2 certified', 'Business English specialist'],
      telegram: '@dilnoza_biz',
      description: 'Professional and results-driven teacher focused on CEFR certification and business communication.',
      status: 'Active',
      isPublic: true,
      assignedCourses: ['crs-005'],
      salary: 7000000,
      monthlySalary: 7000000,
      createdAt: daysAgo(250),
      updatedAt: ts,
      source: 'manual',
    },
    {
      id: 'tch-005',
      name: 'Bobur Normatov',
      gender: 'Male',
      subject: 'English',
      specialization: 'DTM Preparation',
      qualification: "Bachelor's in English Language",
      experience: '4 years',
      phone: '+998 (97) 555-66-77',
      photo: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Bobur',
      achievements: ['DTM top 1% scorer 2022', 'Youngest instructor award'],
      telegram: '@bobur_dtm',
      description: 'Energetic young teacher dedicated to helping students ace the DTM exam.',
      status: 'Active',
      isPublic: true,
      assignedCourses: ['crs-003'],
      salary: 6500000,
      monthlySalary: 6500000,
      createdAt: daysAgo(200),
      updatedAt: ts,
      source: 'manual',
    },
    {
      id: 'tch-006',
      name: 'Gulnora Abdullayeva',
      gender: 'Female',
      subject: 'English',
      specialization: 'Academic Writing & IELTS',
      qualification: "PhD in English Literature",
      experience: '12 years',
      phone: '+998 (90) 666-77-88',
      photo: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Gulnora',
      achievements: ['PhD from Tashkent State University', 'Published author', 'IELTS 9.0 scorer'],
      telegram: '@gulnora_phd',
      description: 'Senior academic with exceptional expertise in IELTS writing and speaking modules.',
      status: 'Active',
      isPublic: true,
      assignedCourses: ['crs-001'],
      salary: 10000000,
      monthlySalary: 10000000,
      createdAt: daysAgo(500),
      updatedAt: ts,
      source: 'manual',
    },
  ];

  /* ---------- COURSES ---------- */
  const courses: CourseRecord[] = [
    {
      id: 'crs-001',
      title: 'IELTS Intensive',
      slug: 'ielts-intensive',
      category: 'IELTS',
      badge: 'Most Popular',
      description:
        'Comprehensive IELTS preparation covering all four modules with real exam practice and personalized feedback.',
      duration: '3 months',
      monthlyFee: 350000,
      formattedFee: formatFee(350000),
      teacherName: 'Sardor Raximov',
      teacherId: 'tch-001',
      features: [
        'Full-length mock tests every week',
        'One-on-one speaking practice',
        'Writing correction with detailed feedback',
        'Vocabulary and grammar drills',
      ],
      imageUrl: '/images/courses/ielts.jpg',
      featured: true,
      isActive: true,
      isPublic: true,
      displayOrder: 1,
      createdAt: daysAgo(365),
      updatedAt: ts,
      status: 'active',
      source: 'manual',
    },
    {
      id: 'crs-002',
      title: 'General English',
      slug: 'general-english',
      category: 'General English',
      badge: 'Beginner Friendly',
      description:
        'Build a strong foundation in English grammar, vocabulary, speaking, listening, reading and writing skills.',
      duration: '6 months',
      monthlyFee: 250000,
      formattedFee: formatFee(250000),
      teacherName: 'Nilufar Karimova',
      teacherId: 'tch-002',
      features: [
        'Interactive group discussions',
        'Real-world conversation practice',
        'Grammar fundamentals',
        'Multimedia learning materials',
      ],
      imageUrl: '/images/courses/general.jpg',
      featured: true,
      isActive: true,
      isPublic: true,
      displayOrder: 2,
      createdAt: daysAgo(365),
      updatedAt: ts,
      status: 'active',
      source: 'manual',
    },
    {
      id: 'crs-003',
      title: 'DTM Tayyorlov',
      slug: 'dtm-tayyorlov',
      category: 'DTM',
      badge: 'Top Results',
      description:
        'Intensive preparation for the DTM (Davlat Test Markazi) university entrance exam in English.',
      duration: '4 months',
      monthlyFee: 300000,
      formattedFee: formatFee(300000),
      teacherName: 'Bobur Normatov',
      teacherId: 'tch-005',
      features: [
        'Full DTM past paper coverage',
        'Speed-solving techniques',
        'Weekly mock tests',
        'Personalised study plan',
      ],
      imageUrl: '/images/courses/dtm.jpg',
      featured: true,
      isActive: true,
      isPublic: true,
      displayOrder: 3,
      createdAt: daysAgo(300),
      updatedAt: ts,
      status: 'active',
      source: 'manual',
    },
    {
      id: 'crs-004',
      title: 'SAT Math',
      slug: 'sat-math',
      category: 'SAT',
      badge: 'Advanced',
      description:
        'Master SAT Mathematics sections with advanced problem-solving strategies and timed practice.',
      duration: '3 months',
      monthlyFee: 400000,
      formattedFee: formatFee(400000),
      teacherName: 'Akbar Toshmatov',
      teacherId: 'tch-003',
      features: [
        'All math topics covered',
        'Real SAT practice tests',
        'Time management coaching',
        'College application guidance',
      ],
      imageUrl: '/images/courses/sat.jpg',
      featured: false,
      isActive: true,
      isPublic: true,
      displayOrder: 4,
      createdAt: daysAgo(250),
      updatedAt: ts,
      status: 'active',
      source: 'manual',
    },
    {
      id: 'crs-005',
      title: 'CEFR B2 Preparation',
      slug: 'cefr-b2',
      category: 'CEFR',
      badge: 'International',
      description:
        'Prepare for the Cambridge B2 First (FCE) exam with authentic materials and exam strategies.',
      duration: '3 months',
      monthlyFee: 320000,
      formattedFee: formatFee(320000),
      teacherName: 'Dilnoza Mirzayeva',
      teacherId: 'tch-004',
      features: [
        'Cambridge official coursebook',
        'Use of English drills',
        'Speaking exam simulation',
        'Certificate upon completion',
      ],
      imageUrl: '/images/courses/cefr.jpg',
      featured: false,
      isActive: true,
      isPublic: true,
      displayOrder: 5,
      createdAt: daysAgo(200),
      updatedAt: ts,
      status: 'active',
      source: 'manual',
    },
    {
      id: 'crs-006',
      title: 'English for Kids',
      slug: 'english-kids',
      category: 'Kids',
      badge: 'Ages 7–12',
      description:
        'Fun, interactive English classes for children using games, songs, stories, and creative activities.',
      duration: '6 months',
      monthlyFee: 250000,
      formattedFee: formatFee(250000),
      teacherName: 'Nilufar Karimova',
      teacherId: 'tch-002',
      features: [
        'Age-appropriate curriculum',
        'Game-based learning',
        'Monthly progress reports',
        'End-of-term showcase',
      ],
      imageUrl: '/images/courses/kids.jpg',
      featured: false,
      isActive: true,
      isPublic: true,
      displayOrder: 6,
      createdAt: daysAgo(180),
      updatedAt: ts,
      status: 'active',
      source: 'manual',
    },
  ];

  /* ---------- GROUPS ---------- */
  const groups: GroupRecord[] = [
    {
      id: 'grp-001',
      name: 'IELTS Morning A',
      courseType: 'IELTS Intensive',
      teacherId: 'tch-001',
      teacherName: 'Sardor Raximov',
      scheduleTime: 'Dush-Jum 08:00–10:00',
      room: 'Room 101',
      activeStudentsCount: 18,
      maxCapacity: 20,
      level: 'Upper-Intermediate',
      description: 'Morning IELTS group for serious candidates targeting 7+',
      createdAt: daysAgo(120),
      updatedAt: ts,
      status: 'active',
      source: 'manual',
    },
    {
      id: 'grp-002',
      name: 'IELTS Evening B',
      courseType: 'IELTS Intensive',
      teacherId: 'tch-006',
      teacherName: 'Gulnora Abdullayeva',
      scheduleTime: 'Dush-Jum 18:00–20:00',
      room: 'Room 201',
      activeStudentsCount: 22,
      maxCapacity: 30,
      level: 'Advanced',
      description: 'Evening IELTS group focused on academic writing',
      createdAt: daysAgo(100),
      updatedAt: ts,
      status: 'active',
      source: 'manual',
    },
    {
      id: 'grp-003',
      name: 'General English A1',
      courseType: 'General English',
      teacherId: 'tch-002',
      teacherName: 'Nilufar Karimova',
      scheduleTime: 'Dush-Sesh-Chor 14:00–16:00',
      room: 'Room 102',
      activeStudentsCount: 15,
      maxCapacity: 25,
      level: 'Beginner',
      description: 'Beginner group – fundamentals of English',
      createdAt: daysAgo(90),
      updatedAt: ts,
      status: 'active',
      source: 'manual',
    },
    {
      id: 'grp-004',
      name: 'DTM Tayyorlov Group',
      courseType: 'DTM Tayyorlov',
      teacherId: 'tch-005',
      teacherName: 'Bobur Normatov',
      scheduleTime: 'Dush-Jum 16:00–18:00',
      room: 'Room 202',
      activeStudentsCount: 20,
      maxCapacity: 25,
      level: 'Intermediate',
      description: 'Intensive DTM exam preparation',
      createdAt: daysAgo(80),
      updatedAt: ts,
      status: 'active',
      source: 'manual',
    },
    {
      id: 'grp-005',
      name: 'SAT Math Group',
      courseType: 'SAT Math',
      teacherId: 'tch-003',
      teacherName: 'Akbar Toshmatov',
      scheduleTime: 'Shanba 10:00–13:00',
      room: 'Room 301',
      activeStudentsCount: 12,
      maxCapacity: 15,
      level: 'Advanced',
      description: 'Weekend SAT Math intensive',
      createdAt: daysAgo(70),
      updatedAt: ts,
      status: 'active',
      source: 'manual',
    },
    {
      id: 'grp-006',
      name: 'CEFR B2 Group',
      courseType: 'CEFR B2',
      teacherId: 'tch-004',
      teacherName: 'Dilnoza Mirzayeva',
      scheduleTime: 'Sesh-Pay 17:00–19:00',
      room: 'Room 103',
      activeStudentsCount: 10,
      maxCapacity: 15,
      level: 'Upper-Intermediate',
      description: 'Cambridge B2 First exam preparation',
      createdAt: daysAgo(60),
      updatedAt: ts,
      status: 'active',
      source: 'manual',
    },
    {
      id: 'grp-007',
      name: 'Kids English 1',
      courseType: 'English for Kids',
      teacherId: 'tch-002',
      teacherName: 'Nilufar Karimova',
      scheduleTime: 'Shanba 09:00–11:00',
      room: 'Room 102',
      activeStudentsCount: 16,
      maxCapacity: 20,
      level: 'Beginner',
      description: 'Fun Saturday kids English group',
      createdAt: daysAgo(50),
      updatedAt: ts,
      status: 'active',
      source: 'manual',
    },
    {
      id: 'grp-008',
      name: 'IELTS Writing Focus',
      courseType: 'IELTS Intensive',
      teacherId: 'tch-006',
      teacherName: 'Gulnora Abdullayeva',
      scheduleTime: 'Dush-Chor-Jum 11:00–13:00',
      room: 'Room 201',
      activeStudentsCount: 8,
      maxCapacity: 15,
      level: 'Advanced',
      description: 'Specialised IELTS writing module course',
      createdAt: daysAgo(40),
      updatedAt: ts,
      status: 'active',
      source: 'manual',
    },
  ];

  /* ---------- STUDENTS ---------- */
  const studentNames = [
    'Abdullayev Jasur',
    'Karimova Malika',
    'Toshmatov Sardor',
    'Rahimova Nodira',
    'Ergashev Davron',
    'Nazarova Dilrabo',
    'Mirzayev Akbar',
    'Islomova Mohlaroyim',
    'Yuldashev Shohruh',
    'Abdurahmonova Zulfiya',
    'Xasanov Umid',
    'Nurmanova Gulsara',
    'Sultonov Jasurbek',
    'Hamidova Dildora',
    'Ortiqov Baxtiyor',
    'Mamatova Sabohat',
    'Qodirov Alisher',
    'Ruziyeva Madina',
    'Normatov Behruz',
    'Karimov Suhrob',
    'Tursunova Maxbuba',
    'Rustamov Islom',
    'Abdurasulova Nilufar',
    'Eshonqulov Abdurasul',
    'Komilov Sherzod',
    'Mirsaidova Munisa',
    'Jumayev Nodir',
    'Ergashova Gulnora',
    'Xolmatov Temur',
    'Saidova Umida',
    'Toshkenboyev Otabek',
    'Hayitboyev Dilmurod',
    'Nuriddingova Sabina',
    'Umarov Sarvar',
    'Boboyeva Aziza',
    'Xusanov Akrom',
    'Shamsiyeva Zebo',
    'Qosimov Jamshid',
    'Nosirova Mohigul',
    'Turgunboyev Sardor',
    'Yakubova Malohat',
    'Mirahmadov Ozodbek',
    'Ganiyeva Nargiza',
    'Zakirov Jasurbek',
    'Mansurova Maftuna',
    'Bozorov Akbarjon',
    'Raxmatova Barno',
    'Xamrayev Murod',
    'Sultanova Shaxnoza',
    'Nurjonov Azizbek',
  ];

  const groupsForStudents = [
    { id: 'grp-001', name: 'IELTS Morning A' },
    { id: 'grp-002', name: 'IELTS Evening B' },
    { id: 'grp-003', name: 'General English A1' },
    { id: 'grp-004', name: 'DTM Tayyorlov Group' },
    { id: 'grp-005', name: 'SAT Math Group' },
    { id: 'grp-006', name: 'CEFR B2 Group' },
    { id: 'grp-007', name: 'Kids English 1' },
    { id: 'grp-008', name: 'IELTS Writing Focus' },
  ];

  const feeMap: Record<string, number> = {
    'grp-001': 350000,
    'grp-002': 350000,
    'grp-003': 250000,
    'grp-004': 300000,
    'grp-005': 400000,
    'grp-006': 320000,
    'grp-007': 250000,
    'grp-008': 350000,
  };

  const paymentStatuses: ('paid' | 'pending' | 'overdue')[] = ['paid', 'paid', 'paid', 'paid', 'pending', 'overdue'];
  const subjectCategories = ['IELTS', 'General English', 'DTM', 'SAT', 'CEFR', 'Kids'];
  const sources = ['Website', 'Telegram', 'Referral', 'Walk-in', 'Social Media'];

  const students: StudentRecord[] = studentNames.map((name, i) => {
    const gi = i % groupsForStudents.length;
    const grp = groupsForStudents[gi];
    const fee = feeMap[grp.id];
    const ps = paymentStatuses[i % paymentStatuses.length];
    const enrollDay = 180 - Math.floor(Math.random() * 150);
    const lastPayDay = Math.floor(Math.random() * 30);
    const nextDueDay = ps === 'pending' ? Math.floor(Math.random() * 14) + 1 : undefined;
    const phoneNum = 90 + (i % 10);
    const phoneSuffix = String(1000000 + Math.floor(Math.random() * 9000000));
    const formattedPhone = `+998 (${phoneNum}) ${phoneSuffix.slice(0, 3)}-${phoneSuffix.slice(3, 5)}-${phoneSuffix.slice(5, 7)}`;

    return {
      id: `stu-${String(i + 1).padStart(3, '0')}`,
      fullName: name,
      phone: formattedPhone,
      parentPhone:
        i < 30
          ? `+998 (9${(phoneNum + 1) % 10}) ${String(2000000 + Math.floor(Math.random() * 8000000)).slice(0, 3)}-${String(300 + Math.floor(Math.random() * 700)).slice(0, 3)}-${String(10 + Math.floor(Math.random() * 90))}${String(10 + Math.floor(Math.random() * 90))}`
          : undefined,
      groupId: grp.id,
      groupName: grp.name,
      tuitionFee: fee,
      paymentStatus: ps,
      lastPaymentDate: daysAgo(lastPayDay),
      nextDueDate: nextDueDay ? daysAgo(-nextDueDay) : undefined,
      enrollmentDate: daysAgo(enrollDay),
      subjectCategory: subjectCategories[i % subjectCategories.length],
      notes: i % 5 === 0 ? 'Needs extra attention on writing' : undefined,
      attendanceRate: 75 + Math.floor(Math.random() * 25),
      createdAt: daysAgo(enrollDay),
      updatedAt: daysAgo(lastPayDay),
      status: 'active',
      source: sources[i % sources.length],
    };
  });

  /* ---------- PAYMENTS ---------- */
  const paymentMethods: ('cash' | 'card' | 'click' | 'payme')[] = ['cash', 'card', 'click', 'payme'];
  const paymentStatusesPay: ('paid' | 'pending' | 'refunded')[] = ['paid', 'paid', 'paid', 'pending', 'refunded'];
  const recordedByNames = ['Admin', 'Sardor Raximov', 'Office Manager'];
  const periodLabels = ['January 2026', 'February 2026', 'March 2026', 'April 2026', 'May 2026', 'June 2026', 'July 2026', 'August 2026'];

  const payments: PaymentRecord[] = Array.from({ length: 30 }, (_, i) => {
    const stu = students[i % students.length];
    const method = paymentMethods[i % paymentMethods.length];
    const ps = paymentStatusesPay[i % paymentStatusesPay.length];
    const day = 120 - Math.floor(Math.random() * 110);
    const amount = stu.tuitionFee + (i % 3 === 0 ? 50000 : 0);

    return {
      id: `pay-${String(i + 1).padStart(3, '0')}`,
      studentId: stu.id,
      studentName: stu.fullName,
      amount,
      paymentMethod: method,
      date: daysAgo(day),
      recordedBy: recordedByNames[i % recordedByNames.length],
      recordedByName: recordedByNames[i % recordedByNames.length],
      status: ps,
      cohortGroup: stu.groupName,
      subjectCategory: stu.subjectCategory,
      paymentPeriod: periodLabels[i % periodLabels.length],
      receiptRef: ps === 'paid' ? `REC-${2026}${String(i + 100).padStart(4, '0')}` : undefined,
      notes: i % 7 === 0 ? 'Late payment accepted with penalty' : undefined,
      createdAt: daysAgo(day),
      updatedAt: daysAgo(Math.max(day - 5, 0)),
      source: 'crm',
    };
  });

  /* ---------- LEADS ---------- */
  const leadCourses = [
    'IELTS Intensive',
    'General English',
    'DTM Tayyorlov',
    'SAT Math',
    'CEFR B2',
    'English for Kids',
  ];
  const leadStatuses: LeadRecord['status'][] = [
    'New',
    'Contacted',
    'Trial Scheduled',
    'Trial Completed',
    'Enrolled',
    'Lost',
  ];
  const leadSources: LeadRecord['source'][] = ['Website', 'Phone', 'Walk-in', 'Telegram'];
  const leadNames = [
    'Jasurbek Alimov',
    'Malika Saidova',
    'Sardor Mirzo',
    'Nodira Karimova',
    'Davron Ergashov',
    'Zulfiya Nazarova',
    'Akbar Toshmatov',
    'Mohlaroyim Islomova',
    'Shohruh Yuldashev',
    'Dildora Hamidova',
    'Baxtiyor Ortiqov',
    'Sabohat Mamatova',
    'Alisher Qodirov',
    'Madina Ruziyeva',
    'Behruz Normatov',
    'Suhrob Karimov',
    'Maxbuba Tursunova',
  ];

  const leads: LeadRecord[] = leadNames.map((name, i) => {
    const day = 60 - Math.floor(Math.random() * 55);
    const status = leadStatuses[i % leadStatuses.length];
    const phoneNum = 90 + (i % 10);
    const phoneSuffix = String(1000000 + Math.floor(Math.random() * 9000000));
    return {
      id: `lead-${String(i + 1).padStart(3, '0')}`,
      name,
      phone: `+998 (${phoneNum}) ${phoneSuffix.slice(0, 3)}-${phoneSuffix.slice(3, 5)}-${phoneSuffix.slice(5, 7)}`,
      course: leadCourses[i % leadCourses.length],
      status,
      source: leadSources[i % leadSources.length],
      assignedTo: i % 2 === 0 ? 'Sardor Raximov' : undefined,
      assignedTeacherId: i % 2 === 0 ? 'tch-001' : undefined,
      notes: i % 3 === 0 ? 'Interested in group discount' : undefined,
      trialDateTime: status === 'Trial Scheduled' ? daysAgo(-2) : undefined,
      createdAt: daysAgo(day),
      updatedAt: daysAgo(Math.max(day - 3, 0)),
    };
  });

  /* ---------- QUESTIONS ---------- */
  const questionSubjects = [
    'Pricing inquiry',
    'Schedule information',
    'Teacher qualifications',
    'Certificate validity',
    'Branch locations',
    'Scholarship availability',
    'Payment methods',
    'Course duration',
    'Trial class booking',
    'Group availability',
  ];

  const questionMessages = [
    'Assalomu alaykum, IELTS kursi necha pul?',
    'General English guruhlari qaysi kunlarda?',
    "O'qituvchilar qaysi universitetni tamomlagan?",
    'Sertifikat xalqaro miyonda tan olinadimi?',
    'Filiallar qayerda joylashgan?',
    "Boshqa davlatlar stipendiyasi bormi?",
    "To'lovni qanday usulda amalga oshirish mumkin?",
    'Kurs davomiyligi qancha?',
    'Sinov darsiga yozilsam bo\'ladimi?',
    'Hozirgi guruhlarda bo\'sh joy bormi?',
  ];

  const questionStatuses: QuestionRecord['status'][] = ['New', 'In Progress', 'Replied', 'Archived'];

  const questions: QuestionRecord[] = Array.from({ length: 12 }, (_, i) => {
    const day = 45 - Math.floor(Math.random() * 40);
    return {
      id: `qst-${String(i + 1).padStart(3, '0')}`,
      fullName: leadNames[i % leadNames.length],
      phone: `+998 (9${i % 10}) 555-${String(10 + i).padStart(2, '0')}-${String(100 + i * 3).padStart(4, '0')}`,
      email: i % 3 === 0 ? `user${i + 1}@gmail.com` : undefined,
      courseName: leadCourses[i % leadCourses.length],
      subject: questionSubjects[i % questionSubjects.length],
      message: questionMessages[i % questionMessages.length],
      preferredContact: (['phone', 'email', 'telegram'] as const)[i % 3],
      agreedToContact: true,
      status: questionStatuses[i % questionStatuses.length],
      assignedTeacherId: i % 2 === 0 ? 'tch-001' : undefined,
      assignedTeacherName: i % 2 === 0 ? 'Sardor Raximov' : undefined,
      reply: questionStatuses[i % questionStatuses.length] === 'Replied' ? 'Rahmat, biz sizga qo\'ng\'iroq qilamiz.' : undefined,
      createdAt: daysAgo(day),
      updatedAt: daysAgo(Math.max(day - 2, 0)),
      source: (['Website', 'Contact Page', 'Course Page'] as const)[i % 3],
    };
  });

  /* ---------- RESULTS ---------- */
  const resultNames = [
    'Abdullayev Jasur',
    'Karimova Malika',
    'Toshmatov Sardor',
    'Rahimova Nodira',
    'Ergashev Davron',
    'Nazarova Dilrabo',
    'Mirzayev Akbar',
    'Islomova Mohlaroyim',
    'Yuldashev Shohruh',
    'Abdurahmonova Zulfiya',
  ];

  const results: ResultRecord[] = [
    {
      id: 'res-001',
      studentName: resultNames[0],
      testType: 'IELTS',
      score: '7.5',
      date: daysAgo(30),
      overall: 7.5,
      listening: 8.0,
      reading: 7.5,
      writing: 7.0,
      speaking: 7.5,
      teacherName: 'Sardor Raximov',
      badge: 'IELTS 7.5',
      published: true,
      featured: true,
    },
    {
      id: 'res-002',
      studentName: resultNames[1],
      testType: 'IELTS',
      score: '7.0',
      date: daysAgo(25),
      overall: 7.0,
      listening: 7.5,
      reading: 7.0,
      writing: 6.5,
      speaking: 7.0,
      teacherName: 'Gulnora Abdullayeva',
      badge: 'IELTS 7.0',
      published: true,
      featured: true,
    },
    {
      id: 'res-003',
      studentName: resultNames[2],
      testType: 'CEFR',
      score: 'B2',
      date: daysAgo(20),
      overall: 72,
      listening: 75,
      reading: 70,
      writing: 68,
      speaking: 75,
      teacherName: 'Dilnoza Mirzayeva',
      badge: 'CEFR B2',
      published: true,
      featured: false,
    },
    {
      id: 'res-004',
      studentName: resultNames[3],
      testType: 'IELTS',
      score: '6.5',
      date: daysAgo(28),
      overall: 6.5,
      listening: 7.0,
      reading: 6.5,
      writing: 6.0,
      speaking: 6.5,
      teacherName: 'Sardor Raximov',
      badge: 'IELTS 6.5',
      published: true,
      featured: false,
    },
    {
      id: 'res-005',
      studentName: resultNames[4],
      testType: 'IELTS',
      score: '8.0',
      date: daysAgo(15),
      overall: 8.0,
      listening: 8.5,
      reading: 8.0,
      writing: 7.5,
      speaking: 8.0,
      teacherName: 'Gulnora Abdullayeva',
      badge: 'IELTS 8.0',
      published: true,
      featured: true,
    },
    {
      id: 'res-006',
      studentName: resultNames[5],
      testType: 'IT',
      score: 'A2',
      date: daysAgo(18),
      overall: 65,
      listening: 60,
      reading: 70,
      writing: 62,
      speaking: 68,
      teacherName: 'Dilnoza Mirzayeva',
      badge: 'CEFR A2',
      published: true,
      featured: false,
    },
    {
      id: 'res-007',
      studentName: resultNames[6],
      testType: 'IELTS',
      score: '7.0',
      date: daysAgo(10),
      overall: 7.0,
      listening: 7.0,
      reading: 7.5,
      writing: 6.5,
      speaking: 7.0,
      teacherName: 'Sardor Raximov',
      badge: 'IELTS 7.0',
      published: true,
      featured: false,
    },
    {
      id: 'res-008',
      studentName: resultNames[7],
      testType: 'CEFR',
      score: 'B1',
      date: daysAgo(12),
      overall: 58,
      listening: 55,
      reading: 60,
      writing: 55,
      speaking: 62,
      teacherName: 'Dilnoza Mirzayeva',
      badge: 'CEFR B1',
      published: true,
      featured: false,
    },
    {
      id: 'res-009',
      studentName: resultNames[8],
      testType: 'IELTS',
      score: '7.5',
      date: daysAgo(8),
      overall: 7.5,
      listening: 8.0,
      reading: 7.0,
      writing: 7.5,
      speaking: 7.5,
      teacherName: 'Gulnora Abdullayeva',
      badge: 'IELTS 7.5',
      published: true,
      featured: true,
    },
    {
      id: 'res-010',
      studentName: resultNames[9],
      testType: 'IT',
      score: 'B2',
      date: daysAgo(5),
      overall: 70,
      listening: 68,
      reading: 72,
      writing: 66,
      speaking: 74,
      teacherName: 'Dilnoza Mirzayeva',
      badge: 'CEFR B2',
      published: false,
      featured: false,
    },
  ];

  /* ---------- ANNOUNCEMENTS ---------- */
  const announcements: AnnouncementRecord[] = [
    {
      id: 'ann-001',
      title: "Yangi yil ta'tili",
      message: "2026-yil 1-3 yanvar kunlari markaz yopiq bo'ladi. Barchaga yangi yil tabrigi!",
      type: 'holiday',
      targetRole: 'all',
      isRead: true,
      createdAt: daysAgo(80),
      createdBy: 'Admin',
    },
    {
      id: 'ann-002',
      title: 'Dars jadvali o\'zgarishi',
      message: '15-fevraldan boshlab IELTS Evening B guruhi 18:00 o\'rniga 18:30 da boshlanadi.',
      type: 'timetable_change',
      targetRole: 'students',
      isRead: false,
      createdAt: daysAgo(35),
      createdBy: 'Admin',
    },
    {
      id: 'ann-003',
      title: 'Yangi guruh ochildi',
      message: 'IELTS Writing Focus guruhi tashkil etildi. Qatnashishni xohlaganlar ro\'yxatdan o\'tishingiz mumkin.',
      type: 'new_enrollment',
      targetRole: 'all',
      isRead: false,
      createdAt: daysAgo(28),
      createdBy: 'Gulnora Abdullayeva',
    },
    {
      id: 'ann-004',
      title: 'O\'qituvchilar yig\'ilishi',
      message: '1-mart kuni soat 17:00 da barcha o\'qituvchilar yig\'ilishi bo\'lib o\'tadi. Majburiy.',
      type: 'meeting',
      targetRole: 'teachers',
      isRead: true,
      createdAt: daysAgo(20),
      createdBy: 'Admin',
    },
    {
      id: 'ann-005',
      title: 'Ramadan tabrigi',
      message: 'Barcha musulmonlarni Ramazan oyini muborakbod etamiz! Ro\'za saqlaganlarga Alloh qabul qilsin.',
      type: 'general',
      targetRole: 'all',
      isRead: false,
      createdAt: daysAgo(10),
      createdBy: 'Admin',
    },
    {
      id: 'ann-006',
      title: 'Sertifikat topshirish marosimi',
      message: '25-mart kuni barcha kurslarni tugatgan talabalar uchun sertifikat topshirish marosimi bo\'ladi.',
      type: 'general',
      targetRole: 'students',
      isRead: false,
      createdAt: daysAgo(7),
      createdBy: 'Admin',
    },
  ];

  /* ---------- NOTIFICATIONS ---------- */
  const notifTemplates = [
    { title: 'Yangi talaba qo\'shildi', desc: 'Abdullayev Jasur IELTS Morning A guruhiga qo\'shildi.', cat: 'student', icon: 'user-plus' },
    { title: 'To\'lov qabul qilindi', desc: 'Karimova Malika 350,000 so\'m to\'lov amalga oshirdi.', cat: 'payment', icon: 'credit-card' },
    { title: 'Yangi lead', desc: 'Toshmatov Sardor IELTS Intensive kursiga qiziqish bildirdi.', cat: 'lead', icon: 'target' },
    { title: 'Dars boshlanishiga 1 soat', desc: 'IELTS Morning A guruhi darsi 08:00 da boshlanadi.', cat: 'schedule', icon: 'clock' },
    { title: 'Savol kelib tushdi', desc: 'Rahimova Nodira narxlar haqida savol yubordi.', cat: 'question', icon: 'message-circle' },
    { title: 'To\'lov kechiktirildi', desc: 'Ergashev Davronning to\'lov muddati o\'tdi.', cat: 'payment', icon: 'alert-triangle' },
    { title: 'Natija e\'lon qilindi', desc: 'Abdullayev Jasur IELTS dan 7.5 ball oldi.', cat: 'result', icon: 'award' },
    { title: 'Yangi guruh ochildi', desc: 'IELTS Writing Focus guruhi tashkil etildi.', cat: 'group', icon: 'users' },
    { title: 'Sertifikat tayyor', desc: '10 nafar talaba sertifikatlarini olishlari mumkin.', cat: 'general', icon: 'check-circle' },
    { title: 'O\'qituvchi ta\'tilda', desc: 'Nilufar Karimova 3 kunlik ta\'tilga chiqdi.', cat: 'teacher', icon: 'calendar' },
    { title: 'Xona band', desc: 'Room 101 hozirgi band. Alternativa: Room 102.', cat: 'schedule', icon: 'map-pin' },
    { title: 'Yangi savol', desc: ' Islomova Mohlaroyim sertifikat haqida so\'radi.', cat: 'question', icon: 'message-circle' },
    { title: 'To\'lov muvaffaqiyatli', desc: 'Sultonov Jasurbek 300,000 so\'m click orqali to\'ladi.', cat: 'payment', icon: 'check-circle' },
    { title: 'Lead yangilandi', desc: 'Hamidova Dildora "Contacted" dan "Trial Scheduled" ga o\'zgartirildi.', cat: 'lead', icon: 'refresh-cw' },
    { title: 'Yangi talaba', desc: 'Ortiqov Baxtiyor SAT Math guruhiga yozildi.', cat: 'student', icon: 'user-plus' },
    { title: 'Dars rejalashtirildi', desc: 'SAT Math Group uchun qo\'shimcha dars 10:00 da.', cat: 'schedule', icon: 'calendar' },
    { title: 'To\'lov eslatmasi', desc: 'Mamatova Sabohatning keyingi to\'lov muddati 5 kunda.', cat: 'payment', icon: 'bell' },
    { title: 'Yangi xabar', desc: 'Qodirov Alisher kontakt sahifasi orqali xabar yubordi.', cat: 'question', icon: 'mail' },
    { title: 'Natija tayyor', desc: 'Ruziyeva Madina CEFR B2 imtihoni natijasi tayyor.', cat: 'result', icon: 'award' },
    { title: 'Guruh to\'ldi', desc: 'IELTS Evening B guruhi 22/30 o\'rin bilan to\'ldi.', cat: 'group', icon: 'users' },
    { title: 'Yangi lead', desc: 'Normatov Behruz Telegram orqali qiziqish bildirdi.', cat: 'lead', icon: 'target' },
    { title: 'O\'qituvchi qo\'shildi', desc: 'Gulnora Abdullayeva tizimga qo\'shildi.', cat: 'teacher', icon: 'user-plus' },
    { title: 'To\'lov qaytarildi', desc: 'Karimov Suhrobga 250,000 so\'m qaytarildi.', cat: 'payment', icon: 'rotate-ccw' },
    { title: 'Eslatma', desc: 'Ertaga o\'qituvchilar yig\'ilishi bor.', cat: 'general', icon: 'bell' },
  ];

  const notifications: NotificationRecord[] = notifTemplates.map((tpl, i) => ({
    id: `ntf-${String(i + 1).padStart(3, '0')}`,
    title: tpl.title,
    description: tpl.desc,
    category: tpl.cat,
    recipientRole: i % 2 === 0 ? 'admin' : undefined,
    isRead: i < 12,
    createdAt: daysAgo(40 - Math.floor(i * 1.6)),
    senderName: i % 3 === 0 ? 'System' : 'Admin',
  }));

  /* ---------- ACTIVITY ---------- */
  const activityTemplates = [
    { type: 'student_added', message: 'Abdullayev Jasur guruhga qo\'shildi', icon: 'user-plus', color: '#10b981' },
    { type: 'payment_received', message: 'Karimova Malika 350,000 so\'m to\'lov qildi', icon: 'credit-card', color: '#3b82f6' },
    { type: 'lead_created', message: 'Toshmatov Sardor yangi lead sifatida qo\'shildi', icon: 'target', color: '#f59e0b' },
    { type: 'group_updated', message: 'IELTS Morning A guruhi jadvali yangilandi', icon: 'edit', color: '#8b5cf6' },
    { type: 'result_published', message: 'Abdullayev Jasur IELTS 7.5 natijasi e\'lon qilindi', icon: 'award', color: '#10b981' },
    { type: 'question_answered', message: 'Rahimova Nodira savoliga javob berildi', icon: 'message-circle', color: '#06b6d4' },
    { type: 'teacher_login', message: 'Sardor Raximov tizimga kirdi', icon: 'log-in', color: '#6366f1' },
    { type: 'student_enrolled', message: 'Ergashev Davron IELTS ga yozildi', icon: 'user-check', color: '#10b981' },
    { type: 'payment_overdue', message: 'Nazarova Dilrabo to\'lov muddatini o\'tkazib yubordi', icon: 'alert-triangle', color: '#ef4444' },
    { type: 'course_created', message: 'English for Kids kursi yaratildi', icon: 'book-open', color: '#3b82f6' },
    { type: 'announcement', message: 'Yangi yil ta\'lopi e\'lon qilindi', icon: 'megaphone', color: '#f59e0b' },
    { type: 'lead_contacted', message: 'Mirzayev Akbar bilan bog\'lanildi', icon: 'phone', color: '#06b6d4' },
    { type: 'student_graduated', message: 'Islomova Mohlaroyim kursni tugatdi', icon: 'graduation-cap', color: '#8b5cf6' },
    { type: 'payment_refunded', message: 'Karimov Suhrobga qaytarish amalga oshirildi', icon: 'rotate-ccw', color: '#ef4444' },
    { type: 'group_full', message: 'IELTS Evening B guruhi to\'ldi (22/30)', icon: 'users', color: '#f59e0b' },
    { type: 'teacher_updated', message: 'Gulnora Abdullayeva profil yangiladi', icon: 'edit', color: '#6366f1' },
    { type: 'lead_trial', message: 'Yuldashev Shohruh sinov darsiga yozildi', icon: 'calendar', color: '#10b981' },
    { type: 'payment_method', message: 'Abdurahmonova Zulfiya Click orqali to\'ladi', icon: 'smartphone', color: '#3b82f6' },
    { type: 'student_inactive', message: 'Xasanov Umid 2 hafta kelmadi', icon: 'user-x', color: '#ef4444' },
    { type: 'activity_login', message: 'Admin tizimga kirdi', icon: 'log-in', color: '#6366f1' },
    { type: 'question_new', message: 'Nurmanova Gulsara savol yubordi', icon: 'message-circle', color: '#06b6d4' },
    { type: 'result_cefr', message: 'Toshmatov Sardor CEFR B2 oldi', icon: 'award', color: '#10b981' },
    { type: 'lead_enrolled', message: 'Sultonov Jasurbek DTM guruhiga yozildi', icon: 'user-check', color: '#10b981' },
    { type: 'payment_pending', message: 'Hamidova Dildora to\'lov kutilmoqda', icon: 'clock', color: '#f59e0b' },
    { type: 'group_schedule', message: 'SAT Math Group uchun qo\'shimcha dars', icon: 'calendar', color: '#8b5cf6' },
    { type: 'student_transfer', message: 'Ortiqov Baxtiyor IELTS dan DTM ga o\'tkazildi', icon: 'repeat', color: '#06b6d4' },
    { type: 'payment_cash', message: 'Mamatova Sabohat naqd pulda to\'ladi', icon: 'banknote', color: '#3b82f6' },
    { type: 'lead_lost', message: 'Qodirov Alisher "Lost" ga o\'zgartirildi', icon: 'x-circle', color: '#ef4444' },
    { type: 'activity_logout', message: 'Sardor Raximov tizimdan chiqdi', icon: 'log-out', color: '#6b7280' },
    { type: 'student_updated', message: 'Ruziyeva Madina profil yangilandi', icon: 'edit', color: '#6366f1' },
    { type: 'announcement_read', message: 'Normatov Behruz e\'lonni o\'qidi', icon: 'check', color: '#10b981' },
    { type: 'payment_batch', message: '10 ta to\'lov avtomatik qayta ishlandi', icon: 'layers', color: '#3b82f6' },
    { type: 'lead_source', message: 'Karimov Suhrob Telegram dan keldi', icon: 'send', color: '#06b6d4' },
    { type: 'group_capacity', message: 'CEFR B2 guruhiga 5 ta yangi a\'zo', icon: 'users', color: '#10b981' },
  ];

  const activity: ActivityRecord[] = activityTemplates.map((tpl, i) => ({
    id: `act-${String(i + 1).padStart(3, '0')}`,
    type: tpl.type,
    message: tpl.message,
    timestamp: daysAgo(45 - Math.floor(i * 1.3)),
    icon: tpl.icon,
    color: tpl.color,
    userId: i % 2 === 0 ? 'admin-001' : undefined,
  }));

  /* ---------- INQUIRIES ---------- */
  const inquiryCategories: InquiryRecord['category'][] = [
    'pricing',
    'schedule',
    'teachers',
    'certificates',
    'branches',
    'scholarships',
    'transport',
    'payments',
    'other',
  ];
  const inquiryStatuses: InquiryRecord['status'][] = ['New', 'In Progress', 'Replied', 'Archived'];
  const inquiryMessages = [
    'IELTS kursi narxi qancha? O\'zgarish bormi?',
    'Dars jadvalini bilmoqchiman, kechki guruhlar bormi?',
    'O\'qituvchilar tajribasi qancha?',
    'Sertifikatlar qayerda qabul qilinadi?',
    'Filiallar manzillarini ayting',
    'Stipendiya imkoniyatlari bormi?',
    'Transport xizmati bormi?',
    'To\'lov usullari qanday?',
    'Boshqa savolim bor',
    'DTM kursi necha oy davom etadi?',
    'Kids guruhiga necha yoshdan qabul qilinadi?',
    'Sat Math kursi haqida batafsil',
  ];

  const inquiries: InquiryRecord[] = Array.from({ length: 12 }, (_, i) => {
    const day = 50 - Math.floor(Math.random() * 45);
    return {
      id: `inq-${String(i + 1).padStart(3, '0')}`,
      fullName: leadNames[i % leadNames.length],
      phone: `+998 (9${i % 10}) 777-${String(20 + i).padStart(2, '0')}-${String(200 + i * 7).padStart(4, '0')}`,
      email: i % 4 === 0 ? `inq${i + 1}@mail.uz` : undefined,
      category: inquiryCategories[i % inquiryCategories.length],
      message: inquiryMessages[i % inquiryMessages.length],
      status: inquiryStatuses[i % inquiryStatuses.length],
      repliedBy: inquiryStatuses[i % inquiryStatuses.length] === 'Replied' ? 'Admin' : undefined,
      reply: inquiryStatuses[i % inquiryStatuses.length] === 'Replied' ? 'Rahmat, sizga qo\'ng\'iroq qilamiz.' : undefined,
      createdAt: daysAgo(day),
      updatedAt: daysAgo(Math.max(day - 3, 0)),
      source: i % 2 === 0 ? 'Contact Page' : 'Website',
    };
  });

  return {
    students,
    teachers,
    groups,
    courses,
    payments,
    leads,
    questions,
    results,
    announcements,
    notifications,
    activity,
    inquiries,
    settings,
  };
}

/* ============================================================
   CRUD METHODS
   ============================================================ */

function getAll<T>(key: keyof Store): T[] {
  return (currentStore()[key] as unknown as T[]) || [];
}

function getById<T extends { id: string }>(key: keyof Store, id: string): T | undefined {
  return getAll<T>(key).find((r) => r.id === id);
}

function add<T extends { id: string }>(key: keyof Store, record: T): T {
  const store = currentStore();
  (store[key] as unknown as T[]).push(record);
  save(store);
  return record;
}

function update<T extends { id: string }>(key: keyof Store, id: string, updates: Partial<T>): void {
  const store = currentStore();
  const arr = store[key] as unknown as T[];
  const idx = arr.findIndex((r) => r.id === id);
  if (idx === -1) throw new Error(`Record ${id} not found in ${key}`);
  arr[idx] = { ...arr[idx], ...updates, updatedAt: now() } as T;
  save(store);
}

function remove(key: keyof Store, id: string): void {
  const store = currentStore();
  const arr = store[key] as { id: string }[];
  const idx = arr.findIndex((r) => r.id === id);
  if (idx === -1) throw new Error(`Record ${id} not found in ${key}`);
  arr.splice(idx, 1);
  save(store);
}

function getSettings(): SettingsRecord {
  return currentStore().settings;
}

function updateSettings(updates: Partial<SettingsRecord>): void {
  const store = currentStore();
  store.settings = { ...store.settings, ...updates };
  save(store);
}

/* ============================================================
   PUBLIC API
   ============================================================ */

export const demoData = {
  /* ---- Init ---- */
  init(): void {
    const existing = load();
    if (existing) return;
    save(seedData());
  },

  /* ---- Students ---- */
  getStudents(): StudentRecord[] {
    return getAll<StudentRecord>('students');
  },
  getStudentById(id: string): StudentRecord | undefined {
    return getById<StudentRecord>('students', id);
  },
  addStudent(data: Omit<StudentRecord, 'id' | 'createdAt' | 'updatedAt'>): StudentRecord {
    const ts = now();
    return add<StudentRecord>('students', {
      ...data,
      id: `stu-${uid()}`,
      createdAt: ts,
      updatedAt: ts,
    });
  },
  updateStudent(id: string, updates: Partial<StudentRecord>): void {
    update<StudentRecord>('students', id, updates);
  },
  deleteStudent(id: string): void {
    remove('students', id);
  },
  searchStudents(query: string): StudentRecord[] {
    const q = query.toLowerCase();
    return getAll<StudentRecord>('students').filter(
      (s) =>
        s.fullName.toLowerCase().includes(q) ||
        s.phone.includes(q) ||
        s.groupName.toLowerCase().includes(q) ||
        (s.subjectCategory && s.subjectCategory.toLowerCase().includes(q))
    );
  },

  /* ---- Teachers ---- */
  getTeachers(): TeacherRecord[] {
    return getAll<TeacherRecord>('teachers');
  },
  getTeacherById(id: string): TeacherRecord | undefined {
    return getById<TeacherRecord>('teachers', id);
  },
  addTeacher(data: Omit<TeacherRecord, 'id'>): TeacherRecord {
    return add<TeacherRecord>('teachers', { ...data, id: `tch-${uid()}` });
  },
  updateTeacher(id: string, updates: Partial<TeacherRecord>): void {
    update<TeacherRecord>('teachers', id, updates);
  },
  deleteTeacher(id: string): void {
    remove('teachers', id);
  },

  /* ---- Groups ---- */
  getGroups(): GroupRecord[] {
    return getAll<GroupRecord>('groups');
  },
  getGroupById(id: string): GroupRecord | undefined {
    return getById<GroupRecord>('groups', id);
  },
  addGroup(data: Omit<GroupRecord, 'id'>): GroupRecord {
    return add<GroupRecord>('groups', { ...data, id: `grp-${uid()}` });
  },
  updateGroup(id: string, updates: Partial<GroupRecord>): void {
    update<GroupRecord>('groups', id, updates);
  },
  deleteGroup(id: string): void {
    remove('groups', id);
  },
  getGroupsByTeacher(teacherId: string): GroupRecord[] {
    return getAll<GroupRecord>('groups').filter((g) => g.teacherId === teacherId);
  },

  /* ---- Courses ---- */
  getCourses(): CourseRecord[] {
    return getAll<CourseRecord>('courses');
  },
  getCourseBySlug(slug: string): CourseRecord | undefined {
    return getAll<CourseRecord>('courses').find((c) => c.slug === slug);
  },
  addCourse(data: Omit<CourseRecord, 'id'>): CourseRecord {
    return add<CourseRecord>('courses', { ...data, id: `crs-${uid()}` });
  },
  updateCourse(id: string, updates: Partial<CourseRecord>): void {
    update<CourseRecord>('courses', id, updates);
  },
  deleteCourse(id: string): void {
    remove('courses', id);
  },

  /* ---- Payments ---- */
  getPayments(): PaymentRecord[] {
    return getAll<PaymentRecord>('payments');
  },
  addPayment(data: Omit<PaymentRecord, 'id'>): PaymentRecord {
    return add<PaymentRecord>('payments', { ...data, id: `pay-${uid()}` });
  },
  updatePayment(id: string, updates: Partial<PaymentRecord>): void {
    update<PaymentRecord>('payments', id, updates);
  },
  deletePayment(id: string): void {
    remove('payments', id);
  },
  getPaymentsByStudent(studentId: string): PaymentRecord[] {
    return getAll<PaymentRecord>('payments').filter((p) => p.studentId === studentId);
  },
  getPaymentsByTeacher(teacherId: string): PaymentRecord[] {
    const groupIds = getAll<GroupRecord>('groups')
      .filter((g) => g.teacherId === teacherId)
      .map((g) => g.id);
    const studentIds = getAll<StudentRecord>('students')
      .filter((s) => groupIds.includes(s.groupId))
      .map((s) => s.id);
    return getAll<PaymentRecord>('payments').filter((p) => studentIds.includes(p.studentId));
  },
  getMonthlyRevenue(month?: string): number {
    const payments = getAll<PaymentRecord>('payments');
    if (!month) {
      const now = new Date();
      month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    }
    return payments
      .filter((p) => p.status === 'paid' && p.date.startsWith(month!))
      .reduce((sum, p) => sum + p.amount, 0);
  },

  /* ---- Leads ---- */
  getLeads(): LeadRecord[] {
    return getAll<LeadRecord>('leads');
  },
  addLead(data: Omit<LeadRecord, 'id' | 'createdAt' | 'updatedAt'>): LeadRecord {
    const ts = now();
    return add<LeadRecord>('leads', {
      ...data,
      id: `lead-${uid()}`,
      createdAt: ts,
      updatedAt: ts,
    });
  },
  updateLead(id: string, updates: Partial<LeadRecord>): void {
    update<LeadRecord>('leads', id, updates);
  },
  deleteLead(id: string): void {
    remove('leads', id);
  },
  getLeadsByStatus(status: string): LeadRecord[] {
    return getAll<LeadRecord>('leads').filter((l) => l.status === status);
  },

  /* ---- Questions ---- */
  getQuestions(): QuestionRecord[] {
    return getAll<QuestionRecord>('questions');
  },
  addQuestion(data: Omit<QuestionRecord, 'id' | 'createdAt' | 'updatedAt'>): QuestionRecord {
    const ts = now();
    return add<QuestionRecord>('questions', {
      ...data,
      id: `qst-${uid()}`,
      createdAt: ts,
      updatedAt: ts,
    });
  },
  updateQuestion(id: string, updates: Partial<QuestionRecord>): void {
    update<QuestionRecord>('questions', id, updates);
  },
  deleteQuestion(id: string): void {
    remove('questions', id);
  },

  /* ---- Results ---- */
  getResults(): ResultRecord[] {
    return getAll<ResultRecord>('results');
  },
  addResult(data: Omit<ResultRecord, 'id'>): ResultRecord {
    return add<ResultRecord>('results', { ...data, id: `res-${uid()}` });
  },
  updateResult(id: string, updates: Partial<ResultRecord>): void {
    update<ResultRecord>('results', id, updates);
  },
  deleteResult(id: string): void {
    remove('results', id);
  },

  /* ---- Announcements ---- */
  getAnnouncements(): AnnouncementRecord[] {
    return getAll<AnnouncementRecord>('announcements');
  },
  addAnnouncement(data: Omit<AnnouncementRecord, 'id' | 'createdAt'>): AnnouncementRecord {
    return add<AnnouncementRecord>('announcements', {
      ...data,
      id: `ann-${uid()}`,
      createdAt: now(),
    });
  },
  updateAnnouncement(id: string, updates: Partial<AnnouncementRecord>): void {
    update<AnnouncementRecord>('announcements', id, updates);
  },
  deleteAnnouncement(id: string): void {
    remove('announcements', id);
  },

  /* ---- Notifications ---- */
  getNotifications(recipientRole?: string): NotificationRecord[] {
    let notifs = getAll<NotificationRecord>('notifications');
    if (recipientRole) {
      notifs = notifs.filter((n) => !n.recipientRole || n.recipientRole === recipientRole);
    }
    return notifs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  },
  addNotification(data: Omit<NotificationRecord, 'id' | 'createdAt'>): NotificationRecord {
    return add<NotificationRecord>('notifications', {
      ...data,
      id: `ntf-${uid()}`,
      createdAt: now(),
    });
  },
  markNotificationRead(id: string): void {
    const store = currentStore();
    const n = store.notifications.find((x) => x.id === id);
    if (n) {
      n.isRead = true;
      save(store);
    }
  },
  markAllNotificationsRead(recipientRole?: string): void {
    const store = currentStore();
    store.notifications.forEach((n) => {
      if (!recipientRole || !n.recipientRole || n.recipientRole === recipientRole) {
        n.isRead = true;
      }
    });
    save(store);
  },
  getUnreadCount(recipientRole?: string): number {
    return demoData.getNotifications(recipientRole).filter((n) => !n.isRead).length;
  },

  /* ---- Activity ---- */
  getActivity(limit?: number): ActivityRecord[] {
    let act = getAll<ActivityRecord>('activity');
    act.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    if (limit) act = act.slice(0, limit);
    return act;
  },
  addActivity(data: Omit<ActivityRecord, 'id' | 'timestamp'>): void {
    add<ActivityRecord>('activity', {
      ...data,
      id: `act-${uid()}`,
      timestamp: now(),
    });
  },

  /* ---- Inquiries ---- */
  getInquiries(): InquiryRecord[] {
    return getAll<InquiryRecord>('inquiries');
  },
  addInquiry(data: Omit<InquiryRecord, 'id' | 'createdAt' | 'updatedAt'>): InquiryRecord {
    const ts = now();
    return add<InquiryRecord>('inquiries', {
      ...data,
      id: `inq-${uid()}`,
      createdAt: ts,
      updatedAt: ts,
    });
  },
  updateInquiry(id: string, updates: Partial<InquiryRecord>): void {
    update<InquiryRecord>('inquiries', id, updates);
  },
  deleteInquiry(id: string): void {
    remove('inquiries', id);
  },

  /* ---- Settings ---- */
  getSettings(): SettingsRecord {
    return getSettings();
  },
  updateSettings(updates: Partial<SettingsRecord>): void {
    updateSettings(updates);
  },

  /* ---- Utility ---- */
  exportAll(): string {
    return JSON.stringify(currentStore(), null, 2);
  },
  importAll(json: string): void {
    const data = JSON.parse(json) as Store;
    save(data);
  },
  resetAll(): void {
    localStorage.removeItem(STORAGE_KEY);
  },
  getStats(): DashboardStats {
    const store = currentStore();
    const now = new Date();
    const monthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const activeStudents = store.students.filter((s) => s.status === 'active').length;
    const pendingLeads = store.leads.filter(
      (l) => l.status !== 'Enrolled' && l.status !== 'Lost'
    ).length;
    const newQuestions = store.questions.filter((q) => q.status === 'New').length;
    const monthlyRevenue = store.payments
      .filter((p) => p.status === 'paid' && p.date.startsWith(monthKey))
      .reduce((sum, p) => sum + p.amount, 0);
    const unreadNotifications = store.notifications.filter((n) => !n.isRead).length;

    return {
      totalStudents: store.students.length,
      totalTeachers: store.teachers.length,
      totalGroups: store.groups.length,
      totalCourses: store.courses.length,
      totalPayments: store.payments.length,
      totalLeads: store.leads.length,
      totalQuestions: store.questions.length,
      totalResults: store.results.length,
      totalAnnouncements: store.announcements.length,
      totalNotifications: store.notifications.length,
      unreadNotifications,
      monthlyRevenue,
      activeStudents,
      pendingLeads,
      newQuestions,
    };
  },
};
