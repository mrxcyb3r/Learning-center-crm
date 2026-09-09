export type LeadStatus =
  | 'New'
  | 'Contacted'
  | 'Trial Scheduled'
  | 'Enrolled'
  | 'Lost'
  | 'Yangi'
  | "Bog'lanildi"
  | 'Sinov darsi belgilandi'
  | "O'quvchiga aylandi"
  | "Yo'qotildi";

export interface Lead {
  id: string;
  name: string;
  phone: string;
  course: string;
  createdAt: string;
  assignedTo?: string;
  notes?: string;
  status: LeadStatus;
  archived?: boolean;
  source?: string;
  trialDateTime?: string;
  enrollmentDate?: string;
}

export interface StudentRecord {
  id: string;
  fullName: string;
  name?: string;
  phone: string;
  course: string;
  teacher?: string;
  groupName: string;
  enrollmentDate: string;
  tuitionFee: number;
  monthlyFee?: number;
  paymentStatus: 'Paid' | 'Due' | 'Overdue';
  nextDueDate: string;
  notes?: string;
  isActive?: boolean;
}

export interface TeacherRecord {
  id: string;
  name: string;
  subject?: string;
  specialization: string;
  experience: string;
  activeGroups: number;
  studentsCount: number;
  salaryStatus: 'Paid' | 'Pending';
  monthlySalary: number;
  salary?: number;
  phone: string;
  photo: string;
  achievements?: string[];
  telegram?: string;
  description?: string;
}

export interface CourseData {
  id: string;
  title: string;
  description: string;
  teacherName?: string;
  duration: string;
  lessonsPerWeek: string;
  monthlyFee: number;
  formattedFee: string;
  badge?: string;
  category: string;
  features: string[];
}

export interface StudentResult {
  id: string;
  studentName: string;
  score: string;
  university: string;
  fieldOfStudy: string;
  admissionType: 'Grant' | 'Kontrakt';
  year: string;
  category: 'DTM' | 'Milliy Sertifikat' | 'CEFR' | 'OTMga qabul' | 'Olimpiada' | 'Davlat granti';
  photo?: string;
  badge?: string;
}

export interface CmsContent {
  heroTitle: string;
  heroSubtitle: string;
  slogan: string;
  phonePrimary: string;
  phoneSecondary: string;
  telegramUsername: string;
  location1: string;
  location2: string;
  statPassRate: string;
  statAdmitted: string;
  statTopScore: string;
  statGrantCount: string;
}

export interface GroupScheduleItem {
  id: string;
  time: string;
  course: string;
  groupName: string;
  teacher: string;
  room: string;
  days?: string;
  maxCapacity?: number;
  type: 'Regular' | 'Trial Lesson' | 'Exam';
  studentsCount: number;
}

export interface IncomePaymentRecord {
  id: string;
  studentName: string;
  amount: number;
  course: string;
  date: string;
  method: 'Cash' | 'Card' | 'Click' | 'Payme';
  receiptNumber: string;
  status: 'Completed' | 'Pending';
}

export type ExpenseCategory = 'Teacher Salary' | 'Rent' | 'Utilities' | 'Marketing' | 'Maintenance' | 'Other';

export interface ExpenseRecord {
  id: string;
  category: ExpenseCategory | string;
  title: string;
  amount: number;
  date: string;
  recipient: string;
  month?: string;
  notes?: string;
}

export interface TelegramAlertLog {
  id: string;
  leadId?: string;
  leadName?: string;
  leadPhone?: string;
  course?: string;
  sentAt: string;
  status: 'Delivered' | 'Pending' | 'Failed' | 'Sent';
  messageText?: string;
  message?: string;
}
