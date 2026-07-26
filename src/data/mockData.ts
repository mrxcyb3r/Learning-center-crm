import { Teacher, Course, StudentResult, FAQItem, Group, Student, Assignment, MockTestScore, Payment } from '../types';

export const mockTeachers: Teacher[] = [
  {
    id: 't1',
    name: 'Jasur Rahimov',
    role: 'Head IELTS Mentor',
    badge: 'IELTS 8.5',
    experience: '6+ Yillik tajriba',
    bioUz: "Renessans LC bosh instruktori. 400+ dan ortiq o'quvchilariga IELTS 7.0+ va undan yuqori natija olishga yordam bergan.",
    bioEn: 'Head IELTS Instructor at Renessans LC. Guided 400+ students to achieve IELTS 7.0+ band scores.',
    image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=400',
    specialization: ['IELTS Academic', 'Speaking Mastery', 'Writing Task 2'],
    resultsCount: 210
  },
  {
    id: 't2',
    name: 'Malika Azimova',
    role: 'Senior IELTS & CEFR Instructor',
    badge: 'IELTS 8.0',
    experience: '5+ Yillik tajriba',
    bioUz: "Grammar, Reading hamda CEFR C1 bo'yicha kuchli va samarali metodikalar muallifi.",
    bioEn: 'Grammar & Reading specialist. Author of highly effective strategic reading techniques.',
    image: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=400',
    specialization: ['CEFR C1', 'Reading Strategies', 'Grammar Precision'],
    resultsCount: 145
  },
  {
    id: 't3',
    name: 'Nodirbek Alimov',
    role: 'Lead IT & Programming Mentor',
    badge: 'Senior Developer',
    experience: '4+ Yillik tajriba',
    bioUz: "IT va Python dasturlash kursi bo'yicha zamonaviy va amaliy loyihalar ustozi.",
    bioEn: 'Lead programming instructor specializing in Python, algorithms, and practical web applications.',
    image: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=400',
    specialization: ['Python Basics', 'Web Development', 'Algorithms'],
    resultsCount: 120
  }
];

export const mockCourses: Course[] = [
  {
    id: 'c1',
    titleUz: 'General English',
    titleEn: 'General English',
    descUz: "Ingliz tilini noldan boshlab erkin muloqot va mukammal grammatikagacha o'rganing.",
    descEn: 'Master English fundamentals from beginner level up to confident everyday fluency.',
    durationUz: '3-6 Oylik kurs',
    durationEn: '3-6 Months',
    levelUz: 'A1 - C1 Daraja',
    levelEn: 'A1 - C1 Level',
    priceUz: "350,000 so'm/oy",
    priceEn: '350,000 UZS/month',
    featuresUz: [
      'Haftasiga 3 kun 2 soatdan asosiy dars',
      "Haftada 3 kun Bepul Speaking Club va support teacher",
      'Barcha darslik va tarqatma materiallar bepul',
      'Har oy oxirida daraja aniqlash testi'
    ],
    featuresEn: [
      '3 core lessons per week (2 hours each)',
      '3 free Speaking Club sessions with support teacher',
      'All study materials and worksheets provided free',
      'Monthly level progression evaluation'
    ],
    iconName: 'BookOpen',
    isPopular: false
  },
  {
    id: 'c2',
    titleUz: 'IELTS Intensive',
    titleEn: 'IELTS Intensive',
    descUz: "Xalqaro universitetlar va grantlar uchun IELTS 7.0 - 8.5 band natijalariga qisqa muddatda erishing.",
    descEn: 'Achieve target band scores of 7.0 - 8.5 for international universities and scholarships.',
    durationUz: '2-3 Oylik intensiv',
    durationEn: '2-3 Months Intensive',
    levelUz: 'B1 - C2 Daraja',
    levelEn: 'B1 - C2 Level',
    priceUz: "450,000 so'm/oy",
    priceEn: '450,000 UZS/month',
    featuresUz: [
      'Har haftalik BEPUL Real Mock IELTS Test',
      'Writing Task 1 & 2 uchun shaxsiy feedback',
      'Ekspert ustozlar bilan One-on-One Speaking Mock',
      "Co-working va kutubxonadan cheksiz foydalanish"
    ],
    featuresEn: [
      'Free real-conditions Mock IELTS every week',
      'Individual Writing Task 1 & 2 feedback',
      'One-on-one Speaking Mocks with expert instructors',
      'Unlimited access to Co-working & digital library'
    ],
    iconName: 'Award',
    isPopular: true
  },
  {
    id: 'c3',
    titleUz: 'CEFR FastTrack',
    titleEn: 'CEFR FastTrack',
    descUz: "Davlat OTMlari va o'qituvchilar ustamalari uchun Milliy Sertifikat (B2/C1) tezkor tayyorlov kursi.",
    descEn: 'National certificate (B2/C1) preparation for state universities and teacher salary bonuses.',
    durationUz: '1-2 Oylik kurs',
    durationEn: '1-2 Months',
    levelUz: 'B1 - C1 Daraja',
    levelEn: 'B1 - C1 Level',
    priceUz: "400,000 so'm/oy",
    priceEn: '400,000 UZS/month',
    featuresUz: [
      "Milliy Sertifikat formati bo'yicha maxsus darslar",
      "Tinglab tushunish va leksik mashqlar",
      'Rasmiy CEFR tahliliy imtihon namunalari',
      'Individual xatolar ustida ishlash'
    ],
    featuresEn: [
      'Targeted lessons aligned with National CEFR format',
      'Listening and Vocabulary mastery drills',
      'Official past CEFR paper walkthroughs',
      'Personalized mistake analysis'
    ],
    iconName: 'GraduationCap',
    isPopular: false
  },
  {
    id: 'c4',
    titleUz: 'IT & Python Dasturlash',
    titleEn: 'IT & Python Programming',
    descUz: 'Zamonaviy dasturlash asoslari, Python tili va amaliy loyihalar yaratish kursi.',
    descEn: 'Modern programming fundamentals, Python language, and practical project development.',
    durationUz: '4 Oylik kurs',
    durationEn: '4 Months',
    levelUz: 'Noldan boshlovchilar uchun',
    levelEn: 'Beginner Friendly',
    priceUz: "500,000 so'm/oy",
    priceEn: '500,000 UZS/month',
    featuresUz: [
      'Python sintaksisi va mantiqiy algoritmlar',
      'Amaliy loyihalar va portfolio yaratish',
      "Zamonaviy kompyuter va dasturiy ta'minot",
      'Kurs yakunida rasmiy sertifikat'
    ],
    featuresEn: [
      'Python syntax and logical algorithms',
      'Building real-world projects & portfolio',
      'Modern equipment and software setup',
      'Official completion certificate'
    ],
    iconName: 'Globe',
    isPopular: false
  }
];

export const mockResults: StudentResult[] = [
  {
    id: 'r1',
    studentName: 'Shahrzod Rahimov',
    testType: 'IELTS',
    score: '8.5',
    date: 'Yanvar 2026',
    overall: '8.5',
    listening: '9.0',
    reading: '9.0',
    writing: '7.5',
    speaking: '8.0',
    teacherName: 'Jasur Rahimov',
    badge: 'IELTS 8.5'
  },
  {
    id: 'r2',
    studentName: 'Madina Umarova',
    testType: 'IELTS',
    score: '8.0',
    date: 'Fevral 2026',
    overall: '8.0',
    listening: '8.5',
    reading: '8.5',
    writing: '7.0',
    speaking: '8.0',
    teacherName: 'Malika Azimova',
    badge: 'IELTS 8.0'
  },
  {
    id: 'r3',
    studentName: 'Jahongir Qodirov',
    testType: 'IELTS',
    score: '8.0',
    date: 'Mart 2026',
    overall: '8.0',
    listening: '9.0',
    reading: '8.0',
    writing: '7.5',
    speaking: '7.5',
    teacherName: 'Jasur Rahimov',
    badge: 'IELTS 8.0'
  },
  {
    id: 'r4',
    studentName: 'Aziza Jalolova',
    testType: 'CEFR',
    score: 'C1',
    date: 'Aprel 2026',
    overall: 'C1 (68 pt)',
    listening: '70',
    reading: '68',
    writing: '65',
    speaking: '69',
    teacherName: 'Malika Azimova',
    badge: 'CEFR C1'
  },
  {
    id: 'r5',
    studentName: 'Sardor Ergashev',
    testType: 'IELTS',
    score: '7.5',
    date: 'May 2026',
    overall: '7.5',
    listening: '8.5',
    reading: '8.0',
    writing: '6.5',
    speaking: '7.5',
    teacherName: 'Jasur Rahimov',
    badge: 'IELTS 7.5'
  },
  {
    id: 'r6',
    studentName: 'Bekzod Nabiyev',
    testType: 'IT',
    score: 'Portfolio',
    date: 'Iyun 2026',
    overall: 'Certified',
    listening: '100',
    reading: '100',
    writing: '95',
    speaking: '95',
    teacherName: 'Nodirbek Alimov',
    badge: 'Python Dev'
  }
];

export const mockFAQs: FAQItem[] = [
  {
    id: 'f1',
    category: 'general',
    questionUz: "Renessans Learning Center manzilini qayerdan topsam bo'ladi?",
    questionEn: 'Where is Renessans Learning Center located?',
    answerUz: "Biz Toshkent shahri / Markaziy Filialda joylashganmiz. Transport qatnovi qulay va qulay joylashuvga egamiz.",
    answerEn: 'We are located at Tashkent / Main Branch with convenient transport access.'
  },
  {
    id: 'f2',
    category: 'courses',
    questionUz: "Darslarga qanday yozilish mumkin va birinchi dars bepulmi?",
    questionEn: 'How can I enroll and is the first lesson free?',
    answerUz: "Ha! Har bir yangi o'quvchi uchun darajani aniqlash va birinchi sinov darsi Mutlaqo Bepul. Saytdagi 'Bog'lanish' formasini to'ldiring yoki +998 90 123 45 67 ga qo'ng'iroq qiling.",
    answerEn: 'Yes! Placement test and the first trial class are 100% Free for every prospective student. Simply submit the contact form or call +998 90 123 45 67.'
  },
  {
    id: 'f3',
    category: 'exams',
    questionUz: 'Mock imtihonlari muntazam o\'tkaziladimi?',
    questionEn: 'Are Mock tests held regularly?',
    answerUz: "Ha, har haftada real imtihon muhitida bepul Mock IELTS va CEFR imtihonlari o'tkaziladi. Natijalar shaxsiy tahlil bilan beriladi.",
    answerEn: 'Yes, free Mock IELTS and CEFR tests are conducted weekly under real exam conditions with analytical feedback.'
  },
  {
    id: 'f4',
    category: 'schedule',
    questionUz: "Dars jadvali qanday belgilanadi?",
    questionEn: 'How is the class schedule determined?',
    answerUz: "O'quvchilarning qulayligiga qarab ertalabki, tushdan keyingi va kechki guruhlar mavjud.",
    answerEn: 'Flexible morning, afternoon, and evening slots are available based on student convenience.'
  }
];

export const DEFAULT_MOCK_GROUPS: Group[] = [
  {
    id: 'g-1',
    name: 'IELTS Intensive #12',
    courseType: 'IELTS 7.5+ Rocket',
    teacherId: 'teacher-1',
    teacherName: 'Mr. Javohirbek',
    scheduleTime: 'Mon/Wed/Fri 14:00 - 16:00',
    room: 'Room 3 (Renessans Main)',
    activeStudentsCount: 14
  },
  {
    id: 'g-2',
    name: 'General English B2',
    courseType: 'CEFR B2 FastTrack',
    teacherId: 'teacher-2',
    teacherName: 'Ms. Shahlo',
    scheduleTime: 'Tue/Thu/Sat 16:30 - 18:00',
    room: 'Room 1',
    activeStudentsCount: 12
  },
  {
    id: 'g-3',
    name: 'IELTS Foundation #5',
    courseType: 'IELTS 6.5 Target',
    teacherId: 'teacher-1',
    teacherName: 'Mr. Javohirbek',
    scheduleTime: 'Mon/Wed/Fri 09:00 - 11:00',
    room: 'Room 2',
    activeStudentsCount: 10
  }
];

export const DEFAULT_MOCK_STUDENTS: Student[] = [
  {
    id: 'st-1',
    fullName: 'Jasur Rahimov',
    phone: '+998 90 123 45 67',
    groupId: 'g-1',
    groupName: 'IELTS Intensive #12',
    tuitionFee: 650000,
    paymentStatus: 'paid',
    lastPaymentDate: '2026-07-01'
  },
  {
    id: 'st-2',
    fullName: 'Malika Sharipova',
    phone: '+998 91 234 56 78',
    groupId: 'g-1',
    groupName: 'IELTS Intensive #12',
    tuitionFee: 650000,
    paymentStatus: 'pending',
    lastPaymentDate: '2026-06-15'
  },
  {
    id: 'st-3',
    fullName: 'Sardor Ergashev',
    phone: '+998 93 345 67 89',
    groupId: 'g-1',
    groupName: 'IELTS Intensive #12',
    tuitionFee: 650000,
    paymentStatus: 'paid',
    lastPaymentDate: '2026-07-05'
  },
  {
    id: 'st-4',
    fullName: 'Madina Umarova',
    phone: '+998 94 456 78 90',
    groupId: 'g-2',
    groupName: 'General English B2',
    tuitionFee: 550000,
    paymentStatus: 'paid',
    lastPaymentDate: '2026-07-02'
  },
  {
    id: 'st-5',
    fullName: 'Shahrzod Nabiyev',
    phone: '+998 97 567 89 01',
    groupId: 'g-2',
    groupName: 'General English B2',
    tuitionFee: 550000,
    paymentStatus: 'pending',
    lastPaymentDate: '2026-06-20'
  }
];

export const DEFAULT_MOCK_ASSIGNMENTS: Assignment[] = [
  {
    id: 'hw-1',
    title: 'IELTS Academic Writing Task 2 - Education & AI Technology',
    group: 'IELTS Intensive #12',
    groupName: 'IELTS Intensive #12',
    dueDate: '2026-07-28',
    instructions: 'Write a 250-word essay evaluating whether artificial intelligence will replace traditional classroom teachers. Include specific examples.',
    audioUrl: 'https://cdn.pixabay.com/download/audio/2022/05/27/audio_1808fbf07a.mp3?filename=english-listening-practice.mp3',
    pdfUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
    submittedCount: 12,
    submissionsCount: 12,
    totalStudents: 14
  },
  {
    id: 'hw-2',
    title: 'IELTS Listening Part 3 Drill (Multiple Choice & Matching)',
    group: 'IELTS Foundation #5',
    groupName: 'IELTS Foundation #5',
    dueDate: '2026-07-26',
    instructions: 'Listen to the audio recording attached below and answer questions 21-30 in your IELTS Workbook Page 45.',
    audioUrl: 'https://cdn.pixabay.com/download/audio/2022/05/27/audio_1808fbf07a.mp3?filename=english-listening-practice.mp3',
    pdfUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
    submittedCount: 8,
    submissionsCount: 8,
    totalStudents: 10
  },
  {
    id: 'hw-3',
    title: 'CEFR B2 Reading Passage - Renewable Energy Innovations',
    group: 'General English B2',
    groupName: 'General English B2',
    dueDate: '2026-07-30',
    instructions: 'Read the PDF passage and complete the true/false/not given exercises.',
    pdfUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
    submittedCount: 10,
    submissionsCount: 10,
    totalStudents: 12
  }
];

export const DEFAULT_MOCK_SCORES: MockTestScore[] = [
  {
    id: 'sc-1',
    studentId: 'st-1',
    studentName: 'Jasur Rahimov',
    date: '2026-07-20',
    overall: 7.5,
    listening: 8.0,
    reading: 7.5,
    writing: 7.0,
    speaking: 7.5,
    teacherFeedback: 'Excellent coherence in Writing Task 2! Work on Section 4 listening distractors.'
  },
  {
    id: 'sc-2',
    studentId: 'st-2',
    studentName: 'Malika Sharipova',
    date: '2026-07-18',
    overall: 8.0,
    listening: 8.5,
    reading: 8.5,
    writing: 7.0,
    speaking: 8.0,
    teacherFeedback: 'Outstanding Reading performance. Expand lexical resource in Speaking Part 3.'
  },
  {
    id: 'sc-3',
    studentId: 'st-3',
    studentName: 'Sardor Ergashev',
    date: '2026-07-15',
    overall: 7.0,
    listening: 7.5,
    reading: 7.0,
    writing: 6.5,
    speaking: 7.0,
    teacherFeedback: 'Solid progress in Listening. Focus on paragraph topic sentences in essay writing.'
  }
];

export const DEFAULT_MOCK_PAYMENTS: Payment[] = [
  {
    id: 'pay-1',
    studentId: 'st-1',
    studentName: 'Jasur Rahimov',
    amount: 650000,
    paymentMethod: 'click',
    date: '2026-07-22',
    recordedBy: 'Admin',
    status: 'paid'
  },
  {
    id: 'pay-2',
    studentId: 'st-2',
    studentName: 'Malika Sharipova',
    amount: 650000,
    paymentMethod: 'payme',
    date: '2026-07-20',
    recordedBy: 'Admin',
    status: 'paid'
  },
  {
    id: 'pay-3',
    studentId: 'st-3',
    studentName: 'Sardor Ergashev',
    amount: 550000,
    paymentMethod: 'card',
    date: '2026-07-18',
    recordedBy: 'Admin',
    status: 'paid'
  },
  {
    id: 'pay-4',
    studentId: 'st-4',
    studentName: 'Nigora Abdullayeva',
    amount: 650000,
    paymentMethod: 'cash',
    date: '2026-07-15',
    recordedBy: 'Admin',
    status: 'pending'
  }
];
