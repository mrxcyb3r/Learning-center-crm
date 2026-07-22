import { Teacher, Course, StudentResult, FAQItem } from '../types';

export const mockTeachers: Teacher[] = [
  {
    id: 't1',
    name: 'Berdimurotov Shahboz',
    role: 'Head IELTS Mentor',
    badge: 'IELTS 8.5',
    experience: '6+ Yillik tajriba',
    bioUz: "Camelot LC bosh instruktori. 500+ dan ortiq o'quvchilariga IELTS 7.5 va undan yuqori natija olishga yordam bergan.",
    bioEn: 'Head IELTS Instructor at Camelot LC. Guided 500+ students to achieve IELTS 7.5+ band scores.',
    image: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=400',
    specialization: ['IELTS Academic', 'Speaking Mastery', 'Writing Task 2'],
    resultsCount: 210
  },
  {
    id: 't2',
    name: 'Nigina Abdunabiyeva',
    role: 'Senior IELTS Instructor',
    badge: 'IELTS 8.0',
    experience: '5+ Yillik tajriba',
    bioUz: "Grammar & Reading mutaxassisi. C1 CEFR va IELTS bo'yicha eng samarali texnikalar muallifi.",
    bioEn: 'Grammar & Reading specialist. Author of highly effective strategic reading techniques.',
    image: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=400',
    specialization: ['Reading Strategies', 'General English', 'Vocabulary Boost'],
    resultsCount: 145
  },
  {
    id: 't3',
    name: 'Doston Jumaboyev',
    role: 'Lead IELTS & SAT Coach',
    badge: 'IELTS 8.5',
    experience: '5+ Yillik tajriba',
    bioUz: "Intensiv IELTS va SAT kurslari yetakchisi. Mantiqiy fikrlash va Listening metodikalari ustozi.",
    bioEn: 'Lead coach for intensive IELTS and SAT preparation. Expert in logic building and Listening mastery.',
    image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=400',
    specialization: ['SAT English', 'Listening 9.0', 'Advanced Grammar'],
    resultsCount: 180
  },
  {
    id: 't4',
    name: 'Ozodbek Qilichev',
    role: 'General & CEFR Instructor',
    badge: 'IELTS 7.5',
    experience: '4+ Yillik tajriba',
    bioUz: "Boshlang'ich va intermediate darajadagi o'quvchilarni tezkor so'zlashuvga olib chiquvchi motivatsiyador ustoz.",
    bioEn: 'Motivational teacher guiding elementary and intermediate students to rapid speaking fluency.',
    image: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=400',
    specialization: ['Elementary to B2', 'Speaking Club', 'Phonetics'],
    resultsCount: 95
  },
  {
    id: 't5',
    name: 'Ahadbek Odilbekov',
    role: 'IELTS & Essay Specialist',
    badge: 'IELTS 8.0',
    experience: '4+ Yillik tajriba',
    bioUz: "Writing va Argumentation mahorati bo'yicha yuqori tajribali mutaxassis.",
    bioEn: 'Highly experienced specialist in Writing Task 1 & 2 argumentation and structure.',
    image: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?auto=format&fit=crop&q=80&w=400',
    specialization: ['Academic Writing', 'Grammar Precision', 'CEFR Prep'],
    resultsCount: 110
  },
  {
    id: 't6',
    name: 'Mansurov Zuhur',
    role: 'IELTS Speaking Mentor',
    badge: 'IELTS 8.0',
    experience: '5+ Yillik tajriba',
    bioUz: "Talaffuz va ravon so'zlashuv (Fluency & Coherence) treninglari boshlovchisi.",
    bioEn: 'Leader of native-like fluency, pronunciation, and confidence training sessions.',
    image: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&q=80&w=400',
    specialization: ['Fluency Coaching', 'Public Speaking', 'Mock Speaking'],
    resultsCount: 130
  },
  {
    id: 't7',
    name: 'Azizbek Toshmatov',
    role: 'IELTS & Exam Trainer',
    badge: 'IELTS 8.0',
    experience: '4+ Yillik tajriba',
    bioUz: "Speed Reading va Time Management usullari bo'yicha imtihon treniri.",
    bioEn: 'Exam strategist focused on time management and high-pressure test execution.',
    image: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&q=80&w=400',
    specialization: ['Exam Strategy', 'Listening & Reading', 'Vocabulary'],
    resultsCount: 105
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
      "Haftada 3 kun Bepul Speaking Club va ikkinchi o'qituvchi",
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
    titleUz: 'IELTS Tayyorlov',
    titleEn: 'IELTS Preparation',
    descUz: 'Xalqaro universitetlar va grantlar uchun IELTS 7.0 - 8.5 band natijalariga erishing.',
    descEn: 'Achieve target band scores of 7.0 - 8.5 for international universities and scholarships.',
    durationUz: '2-4 Oylik intensiv',
    durationEn: '2-4 Months Intensive',
    levelUz: 'B1 - C2 Daraja',
    levelEn: 'B1 - C2 Level',
    priceUz: "450,000 so'm/oy",
    priceEn: '450,000 UZS/month',
    featuresUz: [
      'Har shanba kungi BEPUL Real Mock IELTS Test',
      'Har bir insho uchun shaxsiy feedback (Writing Correction)',
      'Ekspert ustozlar tomonidan Speaking Mock imtihoni',
      "Co-working va kutubxonadan cheksiz foydalanish"
    ],
    featuresEn: [
      'Free real-conditions Mock IELTS every Saturday',
      'Individual Writing Task 1 & 2 feedback',
      'One-on-one Speaking Mocks with 8.0+ instructors',
      'Unlimited access to Co-working & Cambridge library'
    ],
    iconName: 'Award',
    isPopular: true
  },
  {
    id: 'c3',
    titleUz: 'CEFR Sertifikat',
    titleEn: 'CEFR Certification',
    descUz: 'Davlat OTMlari va ustamalar uchun Milliy Sertifikat (B2/C1) tayyorlov kursi.',
    descEn: 'National certificate (B2/C1) preparation for state universities and teacher salary bonuses.',
    durationUz: '1-3 Oylik kurs',
    durationEn: '1-3 Months',
    levelUz: 'A1 - C2 Daraja',
    levelEn: 'A1 - C2 Level',
    priceUz: "400,000 so'm/oy",
    priceEn: '400,000 UZS/month',
    featuresUz: [
      "Milliy Sertifikat formati bo'yicha maxsus darslar",
      "Tinglab tushunish va Leksik qoidalar bo'yicha mashqlar",
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
    titleUz: 'SAT Tayyorlov',
    titleEn: 'SAT Coaching',
    descUz: 'AQSh va nufuzli top universitetlarga 1400+ ball bilan 100% grant yutish kursi.',
    descEn: 'Secure 100% full-ride scholarships at top global universities with 1400+ SAT scores.',
    durationUz: '3-6 Oylik kurs',
    durationEn: '3-6 Months',
    levelUz: 'B2 - C2 (All Levels)',
    levelEn: 'B2 - C2 (All Levels)',
    priceUz: "550,000 so'm/oy",
    priceEn: '550,000 UZS/month',
    featuresUz: [
      'Digital SAT Reading & Writing hamda Math strategiyalari',
      'Bluebook rasmiy imtihon simulyatorlari',
      "College Essay va Application bo'yicha maslahatlar",
      'AQSh granti sohiblaridan mentorlik'
    ],
    featuresEn: [
      'Digital SAT Reading, Writing & Math strategies',
      'Official Bluebook exam simulators',
      'College Essay and Application guidance',
      'Mentorship from US full-scholarship recipients'
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
    date: 'Yanvar 2025',
    overall: '8.5',
    listening: '9.0',
    reading: '9.0',
    writing: '7.5',
    speaking: '8.0',
    teacherName: 'Berdimurotov Shahboz',
    badge: 'IELTS 8.5'
  },
  {
    id: 'r2',
    studentName: 'Madina Umarova',
    testType: 'IELTS',
    score: '8.0',
    date: 'Fevral 2025',
    overall: '8.0',
    listening: '8.5',
    reading: '8.5',
    writing: '7.0',
    speaking: '8.0',
    teacherName: 'Nigina Abdunabiyeva',
    badge: 'IELTS 8.0'
  },
  {
    id: 'r3',
    studentName: 'Jahongir Qodirov',
    testType: 'IELTS',
    score: '8.0',
    date: 'Mart 2025',
    overall: '8.0',
    listening: '9.0',
    reading: '8.0',
    writing: '7.5',
    speaking: '7.5',
    teacherName: 'Doston Jumaboyev',
    badge: 'IELTS 8.0'
  },
  {
    id: 'r4',
    studentName: 'Aziza Jalolova',
    testType: 'CEFR',
    score: 'C1',
    date: 'Aprel 2025',
    overall: 'C1 (68 pt)',
    listening: '70',
    reading: '68',
    writing: '65',
    speaking: '69',
    teacherName: 'Ahadbek Odilbekov',
    badge: 'CEFR C1'
  },
  {
    id: 'r5',
    studentName: 'Sardor Ergashev',
    testType: 'IELTS',
    score: '7.5',
    date: 'May 2025',
    overall: '7.5',
    listening: '8.5',
    reading: '8.0',
    writing: '6.5',
    speaking: '7.5',
    teacherName: 'Ozodbek Qilichev',
    badge: 'IELTS 7.5'
  },
  {
    id: 'r6',
    studentName: 'Bekzod Nabiyev',
    testType: 'IELTS',
    score: '8.0',
    date: 'Iyun 2025',
    overall: '8.0',
    listening: '8.5',
    reading: '8.5',
    writing: '7.0',
    speaking: '8.0',
    teacherName: 'Mansurov Zuhur',
    badge: 'IELTS 8.0'
  }
];

export const mockFAQs: FAQItem[] = [
  {
    id: 'f1',
    category: 'general',
    questionUz: "Camelot LC manzilini qayerdan topsam bo'ladi?",
    questionEn: 'Where is Camelot LC located?',
    answerUz: "Biz Guliston shahar, Beeline ko'chasi oxirida joylashganmiz. Orientir: Markaziy telekom binosidan o'tganda. Qulay transport qatnovi mavjud.",
    answerEn: 'We are located at the end of Beeline Street in Guliston City. Convenient transport connections available.'
  },
  {
    id: 'f2',
    category: 'courses',
    questionUz: "Darslarga qanday yozilish mumkin va birinchi dars bepulmi?",
    questionEn: 'How can I enroll and is the first lesson free?',
    answerUz: "Ha! Har bir yangi o'quvchi uchun darajani aniqlash va birinchi sinov darsi Mutlaqo Bepul. Saytdagi 'Bog'lanish' formasini to'ldiring yoki +998 33 600 95 95 ga qo'ng'iroq qiling.",
    answerEn: 'Yes! Placement test and the first trial class are 100% Free for every prospective student. Simply submit the contact form or call +998 33 600 95 95.'
  },
  {
    id: 'f3',
    category: 'exams',
    questionUz: 'Mock IELTS imtihonlari har haftami?',
    questionEn: 'Are Mock IELTS tests held every week?',
    answerUz: "Ha, har shanba va yakshanba kunlari real imtihon muhitida bepul Mock IELTS va CEFR imtihonlari o'tkaziladi. Natijalar 24 soat ichida shaxsiy tahlil bilan beriladi.",
    answerEn: 'Yes, free Mock IELTS and CEFR tests are conducted every weekend under real exam conditions with results released in 24 hours.'
  },
  {
    id: 'f4',
    category: 'schedule',
    questionUz: "Support Teacher (Ikkinchi o'qituvchi) xizmati qanday ishlaydi?",
    questionEn: 'How does the Support Teacher service work?',
    answerUz: "Har bir guruh uchun asosiy ustozdan tashqari ikkinchi yordamchi ustoz biriktiriladi. U darsdan keyin uy vazifalarini tekshirish, savollarga javob berish va Individual Speaking mashg'ulotlarini o'tkazadi.",
    answerEn: 'In addition to the main instructor, a dedicated support mentor is assigned to each class to assist with homework review, Q&A, and 1-on-1 speaking practice.'
  }
];
