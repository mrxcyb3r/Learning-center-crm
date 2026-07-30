export type UserRole = 'superadmin' | 'admin' | 'teacher' | 'student' | 'guest';

export interface UserProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
  fullName?: string | null;
  role: UserRole;
  photoURL?: string | null;
  phoneNumber?: string | null;
  createdAt?: string;
}

export type Language = 'UZ' | 'EN' | 'RU';

export interface Teacher {
  id: string;
  name: string;
  role: string;
  badge: string; // e.g. "IELTS 8.5"
  experience: string;
  bioUz: string;
  bioEn: string;
  image: string;
  specialization: string[];
  resultsCount: number;
}

export interface Course {
  id: string;
  titleUz: string;
  titleEn: string;
  descUz: string;
  descEn: string;
  durationUz: string;
  durationEn: string;
  levelUz: string;
  levelEn: string;
  priceUz: string;
  priceEn: string;
  featuresUz: string[];
  featuresEn: string[];
  iconName: string;
  isPopular?: boolean;
}

export interface StudentResult {
  id: string;
  studentName: string;
  testType: 'IELTS' | 'CEFR' | 'IT';
  score: string;
  date: string;
  overall: number | string;
  listening: number | string;
  reading: number | string;
  writing: number | string;
  speaking: number | string;
  teacherName: string;
  certificateUrl?: string;
  badge: string;
}

export interface LeadSubmission {
  id?: string;
  name: string;
  phone: string;
  courseId: string;
  message?: string;
  createdAt: string;
  status: 'new' | 'contacted' | 'enrolled';
}

export interface FAQItem {
  id: string;
  questionUz: string;
  questionEn: string;
  answerUz: string;
  answerEn: string;
  category: 'general' | 'courses' | 'exams' | 'schedule';
}

export interface Group {
  id: string;
  name: string;
  courseType: string;
  teacherId: string;
  teacherName: string;
  scheduleTime: string;
  room: string;
  activeStudentsCount: number;
}

export interface Student {
  id: string;
  fullName: string;
  phone: string;
  groupId: string;
  groupName: string;
  tuitionFee: number;
  paymentStatus: 'paid' | 'pending' | 'overdue';
  lastPaymentDate: string;
}

export interface Payment {
  id: string;
  studentId: string;
  studentName: string;
  amount: number;
  paymentMethod: 'cash' | 'card' | 'click' | 'payme' | string;
  date: string;
  recordedBy: string;
  status?: 'paid' | 'pending' | 'refunded';
}

export interface AttendanceRecord {
  id: string;
  groupId: string;
  date: string;
  records: { [studentId: string]: 'present' | 'absent' | 'late' };
  recordedBy: string;
}

export interface Assignment {
  id: string;
  title: string;
  group: string;
  groupName?: string;
  dueDate: string;
  submittedCount: number;
  submissionsCount?: number;
  totalStudents: number;
  file?: string;
  audioUrl?: string;
  pdfUrl?: string;
  createdAt?: string;
  description?: string;
  instructions?: string;
}

export interface FeedPost {
  id: string;
  author: string;
  role: string;
  avatar: string;
  date: string;
  title: string;
  content: string;
  attachment?: string;
  attachmentSize?: string;
  likes: number;
  comments?: { id?: string; author: string; text: string; date?: string }[];
}

export interface MockTestScore {
  id: string;
  studentId: string;
  studentName: string;
  date: string;
  overall: number;
  listening: number;
  reading: number;
  writing: number;
  speaking: number;
  teacherFeedback?: string;
}

export interface WhyRenessansCard {
  id: string;
  iconNumber: number;
  titleUz: string;
  titleEn: string;
  descUz: string;
  descEn: string;
}

export interface LandingTestimonial {
  id: string;
  quoteUz: string;
  quoteEn: string;
  studentName: string;
  scoreBadge: string;
  targetCourse: string;
  university: string;
  photoUrl?: string;
}

export interface MetricCardConfig {
  value: string;
  labelUz: string;
  labelEn: string;
}

export interface LandingPageContent {
  lightModeBgImage: string;
  darkModeBgImage: string;

  // Hero section
  locationBadgeUz: string;
  locationBadgeEn: string;
  
  heroTitleUz: string;
  heroTitleEn: string;

  heroSubtitleUz: string;
  heroSubtitleEn: string;

  heroDescUz: string;
  heroDescEn: string;

  ctaPrimaryUz: string;
  ctaPrimaryEn: string;

  ctaSecondaryUz: string;
  ctaSecondaryEn: string;

  // Metric Stats
  activeStudentsCount: string;
  ieltsHighResults: string;
  admissionRate: string;
  yearsExperience: string;

  // Why Renessans cards
  whyRenessans: WhyRenessansCard[];

  // Mentors roster
  teachers: Teacher[];

  // Student achievements
  results: StudentResult[];

  // Testimonials / Reviews
  testimonials: LandingTestimonial[];

  // Courses & Pricing
  courses: Course[];

  // FAQs
  faqs: FAQItem[];

  // Contact & Footer
  addressUz: string;
  addressEn: string;
  phone: string;
  telegramHandle: string;
  operatingHoursUz: string;
  operatingHoursEn: string;
  googleMapsUrl: string;

  updatedAt?: string;
}

