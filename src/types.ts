export type UserRole = 'superadmin' | 'admin' | 'teacher' | 'student' | 'guest';

export interface UserProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
  role: UserRole;
  photoURL?: string | null;
  phoneNumber?: string | null;
  createdAt?: string;
}

export type Language = 'UZ' | 'EN';

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
  testType: 'IELTS' | 'CEFR';
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
