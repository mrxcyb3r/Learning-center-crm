export type LeadStatus =
  | 'New'
  | 'Contacted'
  | 'Trial Scheduled'
  | 'Trial Completed'
  | 'Enrolled'
  | 'Lost'
  | 'Follow-up'
  | 'Yangi'
  | "Bog'lanildi"
  | 'Sinov darsi belgilandi'
  | 'Sinov darsi yakunlandi'
  | "O'quvchiga aylandi"
  | "Yo'qotildi"
  | 'Jarayonda'
  | 'Yakunlandi'
  | 'Bekor qilindi';

export interface Lead {
  id: string;
  name: string;
  phone: string;
  course: string;
  courseId?: string;
  createdAt: string;
  assignedTo?: string;
  notes?: string;
  status: LeadStatus;
  archived?: boolean;
  source?: string;
  isRead?: boolean;
  updatedAt?: string;
  trialDateTime?: string;
  trialRoom?: string;
  trialTeacher?: string;
  trialResult?: string;
  followUpDate?: string;
  lastContactedAt?: string;
  lostReason?: string;
  nextAction?: string;
  enrollmentDate?: string;
}

export type StudentStatus = 'Lead' | 'Trial' | 'Active' | 'Paused' | 'Dropped' | 'Graduated' | 'Archived';
export type PaymentStatus = 'Paid' | 'Due' | 'Overdue';

export interface StudentRecord {
  id: string;
  fullName: string;
  name?: string;
  phone: string;
  parentName?: string;
  parentPhone?: string;
  mentor?: string;
  course: string;
  courseId?: string;
  teacher?: string;
  teacherId?: string;
  groupId?: string;
  groupName: string;
  enrollmentDate: string;
  tuitionFee?: number;
  monthlyFee?: number;
  paymentStatus: PaymentStatus;
  debtAmount?: number;
  attendanceRate?: number;
  nextDueDate?: string;
  notes?: string;
  isActive?: boolean;
  status?: StudentStatus;
  balance?: number;
  totalPaid?: number;
}

export type TeacherGender = 'male' | 'female';
export type TeacherStatus = 'Active' | 'On Leave' | 'Archived';

export interface TeacherRecord {
  id: string;
  uid?: string;
  name: string;
  firstName?: string;
  lastName?: string;
  middleName?: string;
  gender: TeacherGender;
  subject?: string;
  specialization: string;
  experience: string;
  qualification?: string;
  activeGroups: number;
  studentsCount: number;
  salaryStatus: 'Paid' | 'Pending';
  monthlySalary: number;
  salary?: number;
  phone: string;
  photo?: string; // empty string or Base64/URL
  achievements?: string[];
  telegram?: string;
  description?: string;
  status: TeacherStatus;
  displayOrder?: number;
  isPublic?: boolean;
  assignedCourses?: string[];
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CourseData {
  id: string;
  title: string;
  shortTitle?: string;
  slug?: string;
  category: string;
  badge?: string;
  description: string;
  duration: string;
  lessonsPerWeek: string;
  lessonDuration?: string;
  monthlyFee: number;
  formattedFee: string;
  currency?: string;
  icon?: string;
  teacherName?: string;
  teacherId?: string;
  features: string[];
  overview?: string;
  outcomes?: string[];
  imageUrl?: string;
  socialImage?: string;
  gallery?: string[];
  featured?: boolean;
  isActive: boolean;
  isPublic: boolean;
  displayOrder?: number;
}

export type LeadRecord = Lead;

export interface FaqItem {
  id: string;
  question: string;
  answer: string;
}

export interface CmsData {
  hero: {
    centerName: string;
    tagline: string;
    subtitle: string;
    badge: string;
  };
  stats: {
    universityAdmissions: string;
    studentAdmittedRatio: string;
    highestDtmScore: string;
    stateGrantsCount: string;
  };
  contact: {
    phone: string;
    telegram: string;
    branches: string[];
  };
  faqs: FaqItem[];
  results: StudentResult[];
}

export interface StudentResult {
  id: string;
  studentName: string;
  score: string;
  previousScore?: string;
  improvement?: string;
  university: string;
  subject?: string;
  fieldOfStudy?: string;
  mentor?: string;
  admissionType?: 'Grant' | 'Kontrakt';
  year: string;
  category?: 'DTM' | 'Milliy Sertifikat' | 'CEFR' | 'OTMga qabul' | 'Olimpiada' | 'Davlat granti';
  courseId?: string;
  photo?: string;
  certificateImage?: string;
  published?: boolean;
  featured?: boolean;
  order?: number;
  badge?: string;
}

export interface CmsContent {
  // Hero
  heroEyebrow: string;
  heroTitle: string;
  heroHighlight: string;
  heroSubtitle: string;
  heroPrimaryCtaText: string;
  heroSecondaryCtaText: string;
  heroBadgeText: string;

  // Slogan & Brand
  brandName: string;
  slogan: string;

  // Contact
  phonePrimary: string;
  phoneSecondary: string;
  telegramUsername: string;
  instagramUsername?: string;
  email?: string;
  workingHours: string;

  // Campuses / Locations
  location1Title: string;
  location1: string;
  location2Title: string;
  location2: string;
  googleMapsUrl?: string;

  // Statistics
  statPassRate: string;
  statAdmitted: string;
  statTopScore: string;
  statGrantCount: string;

  // Footer & SEO
  footerText: string;
  copyrightText: string;
  seoTitle: string;
  seoDescription: string;

  // Draft / Publish state
  isDraft?: boolean;
  lastPublishedAt?: string;
  lastEditedBy?: string;
}

export type GroupType = 'Regular' | 'Trial' | 'Trial Lesson' | 'Exam';
export type GroupStatus = 'Active' | 'Completed' | 'Archived';

export interface GroupScheduleItem {
  id: string;
  groupName: string;
  course: string;
  courseId?: string;
  teacher: string;
  teacherId?: string;
  branch?: string;
  // Canonical membership index (admin-maintained): student document IDs.
  studentIds?: string[];
  // Homework document IDs for this group (maintained on creation).
  homeworkIds?: string[];
  room: string;
  days: string;
  time: string;
  startTime?: string;
  endTime?: string;
  maxCapacity: number;
  studentsCount: number;
  type: GroupType;
  status?: GroupStatus;
  displayOrder?: number;
}

export type PaymentMethod = 'Cash' | 'Card' | 'Click' | 'Payme' | 'Bank Transfer' | string;
export type PaymentRecordStatus = 'Completed' | 'Pending' | 'Voided';

export interface IncomePaymentRecord {
  id: string;
  studentId?: string;
  studentName: string;
  amount: number;
  course: string;
  date: string;
  method: PaymentMethod;
  receiptNumber: string;
  status: PaymentRecordStatus;
  recordedBy?: string;
  notes?: string;
  month?: string;
}

export type ExpenseCategory =
  | 'Teacher Salary'
  | 'Salaries'
  | 'Rent'
  | 'Utilities'
  | 'Marketing'
  | 'Equipment'
  | 'Supplies'
  | 'Maintenance'
  | 'Other';

export interface ExpenseRecord {
  id: string;
  category: ExpenseCategory | string;
  title: string;
  amount: number;
  date: string;
  recipient: string;
  teacherId?: string;
  month?: string;
  notes?: string;
  paymentMethod?: string;
  status?: 'Paid' | 'Pending' | 'Voided';
}

export type TeacherInvitationStatus = 'pending' | 'used' | 'expired' | 'revoked';

export interface Invoice {
  id: string;
  paymentId: string;
  studentId: string;
  teacherId: string;
  amount: number;
  invoiceNumber: string;
  paymentDate: string;
  status: 'PAID' | 'PENDING' | 'VOID';
  createdAt: string;
}

export interface TeacherInvitation {
  id: string;
  teacherName: string;
  teacherEmail: string;
  // Plaintext capability secret (unguessable). Lives only in this doc + URL.
  secret: string;
  role: 'teacher';
  status: TeacherInvitationStatus;
  createdBy: string;
  createdAt: string;
  expiresAt: string;
  usedAt?: string | null;
  usedByUid?: string | null;
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
  error?: string;
}

export interface CampusBranch {
  id: string;
  name: string;
  address: string;
  phone: string;
  workingHours: string;
  isActive: boolean;
}

export interface ClassroomRoom {
  id: string;
  name: string;
  branchId: string;
  branchName?: string;
  capacity: number;
  isActive: boolean;
}

export type StaffRole = 'Director' | 'Administrator' | 'Teacher' | 'Operator';

export interface StaffMember {
  id: string;
  name: string;
  role: StaffRole;
  phone: string;
  email?: string;
  isActive: boolean;
  permissions?: string[];
}

export interface CenterSettings {
  centerName: string;
  legalName: string;
  hotline: string;
  secondaryPhone: string;
  email: string;
  currency: string;
  timezone: string;
  workingHours: string;
  branches: CampusBranch[];
  rooms: ClassroomRoom[];
  staff: StaffMember[];
  paymentMethods: string[];
  expenseCategories: string[];
  telegramSettings: {
    botUsername: string;
    botConnected: boolean;
    managementGroup: string;
    notifyLeads: boolean;
    notifyPayments: boolean;
    notifyTrials: boolean;
    notifyOverdue: boolean;
  };
}

// =========================================================================
// Unified "Murojaatlar" inbox model
// =========================================================================

export type MurojaatKind = 'trial' | 'question';
export type MurojaatSource = 'website' | 'telegram';

export type MurojaatStatus =
  | 'Yangi'
  | "Bog'lanildi"
  | 'Jarayonda'
  | 'Yakunlandi'
  | 'Bekor qilindi';

/**
 * A single normalized row for the unified admin inbox. This is a read-side
 * projection over the existing `leads` and `questions` documents — it is never
 * written back as its own collection. `origSource` preserves the raw stored
 * source value.
 */
export interface Murojaat {
  id: string;
  kind: MurojaatKind;
  source: MurojaatSource;
  origSource: string;
  name: string;
  phone: string;
  course: string;
  message: string;
  status: MurojaatStatus;
  isRead: boolean;
  telegramChatId?: string;
  telegramUsername?: string;
  telegramUserId?: string;
  notes?: string;
  createdAt: string;
  updatedAt?: string;
  assignedTo?: string;
  preferredContact?: string;
  trialDateTime?: string;
  email?: string;
}

export interface MurojaatSummary {
  total: number;
  newCount: number;
  unread: number;
  telegram: number;
  website: number;
}

export interface AuditLogEntry {
  id: string;
  user: string;
  action: string;
  entity: string;
  entityId?: string;
  details?: string;
  previousValue?: string;
  newValue?: string;
  timestamp: string;
}
