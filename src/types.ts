export type UserRole = 'superadmin' | 'admin' | 'teacher' | 'student' | 'guest';

/** Canonical narrow payment status used by teacher-portal logic. */
export type CanonicalPaymentStatus = 'paid' | 'pending' | 'overdue';

/**
 * Normalize a student payment status read from Firestore to the canonical
 * lowercase vocabulary. Admin ERP writes historically use 'Paid' | 'Due' |
 * 'Overdue'; both vocabularies persist in the shared `students` collection.
 */
export function normalizeStudentPaymentStatus(
  status: Student['paymentStatus'] | string | undefined | null
): CanonicalPaymentStatus {
  if (status === 'paid' || status === 'Paid') return 'paid';
  if (status === 'overdue' || status === 'Overdue') return 'overdue';
  return 'pending';
}

export type SubjectCategory = 'english' | 'ielts' | 'mathematics' | 'physics' | 'cybersecurity' | 'webdev';

export interface SubjectCourse {
  id: string;
  title: string;
  category: SubjectCategory;
  instructor: string;
  room?: string;
  icon?: string;
  description?: string;
  level?: string;
  price?: string;
  schedule?: string;
  branch?: string;
}

export interface UserProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
  fullName?: string | null;
  role: UserRole;
  enrolledSubjects?: SubjectCourse[];
  photoURL?: string | null;
  phoneNumber?: string | null;
  createdAt?: string;
  telegramUsername?: string | null;
  telegramChatId?: string | null;
  isBotConnected?: boolean;
  assignedPin?: string | null;
  // Canonical teacher-group assignment index (admin-maintained).
  // Owners can read it but rules forbid owner modification.
  assignedGroupIds?: string[];
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
  bioRu?: string;
  image: string;
  specialization: string[];
  resultsCount: number;
}

export interface Course {
  id: string;
  titleUz: string;
  titleEn: string;
  titleRu?: string;
  descUz: string;
  descEn: string;
  descRu?: string;
  durationUz: string;
  durationEn: string;
  durationRu?: string;
  levelUz: string;
  levelEn: string;
  levelRu?: string;
  priceUz: string;
  priceEn: string;
  priceRu?: string;
  featuresUz: string[];
  featuresEn: string[];
  featuresRu?: string[];
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

export interface Inquiry {
  id: string;
  fullName: string;
  phoneNumber: string;
  selectedCourse: string;
  message?: string;
  status: 'new' | 'contacted' | 'enrolled' | 'dismissed';
  createdAt: string;
}

export interface LeadSubmission {
  id?: string;
  name: string;
  phone: string;
  courseId: string;
  message?: string;
  createdAt: string;
  status: 'new' | 'contacted' | 'enrolled' | 'dismissed';
}

export interface FAQItem {
  id: string;
  questionUz: string;
  questionEn: string;
  questionRu?: string;
  answerUz: string;
  answerEn: string;
  answerRu?: string;
  category: 'general' | 'courses' | 'exams' | 'schedule';
}

// Canonical Firestore document types.
//
// The `groups`, `students`, and `payments` collections are shared by the Admin
// ERP (which historically uses the CRM shapes in `src/types/crm.ts`) and the
// Teacher portal (which uses the shapes below). A single Firestore document
// therefore carries a superset of fields; each reader uses its own subset.
// Optional legacy/CRM aliases below are intentional and documented — they keep
// Admin → Firestore → Teacher synchronization working from one record.
export interface Group {
  id: string;
  name: string;
  courseType: string;
  teacherId: string;
  teacherName: string;
  scheduleTime: string;
  room: string;
  activeStudentsCount: number;
  maxCapacity?: number;
  level?: string;
  description?: string;
  status?: string;
  // Admin ERP (GroupScheduleItem) aliases — same record, alternate field names.
  groupName?: string;
  course?: string;
  courseId?: string;
  teacher?: string;
  days?: string;
  time?: string;
  studentsCount?: number;
  type?: string;
  branch?: string;
  // Canonical membership index (admin-maintained): student document IDs.
  studentIds?: string[];
  // Homework document IDs for this group (maintained on creation).
  homeworkIds?: string[];
}

export interface Student {
  id: string;
  fullName: string;
  phone: string;
  groupId: string;
  groupName: string;
  tuitionFee: number;
  // Lowercase values are canonical for the teacher portal; capitalized CRM
  // values ('Paid' | 'Due' | 'Overdue') are accepted when reading legacy/admin
  // writes and normalized by writers going forward.
  paymentStatus: 'paid' | 'pending' | 'overdue' | 'Paid' | 'Due' | 'Overdue';
  lastPaymentDate: string;
  subjectCategory?: string;
  nextDueDate?: string;
  telegramHandle?: string;
  attendanceRate?: number;
  // Admin ERP (StudentRecord) aliases — same record, alternate field names.
  name?: string;
  course?: string;
  courseId?: string;
  teacher?: string;
  teacherId?: string;
  mentor?: string;
  parentName?: string;
  parentPhone?: string;
  monthlyFee?: number;
  debtAmount?: number;
  enrollmentDate?: string;
  status?: string;
  notes?: string;
}

export interface Payment {
  id: string;
  studentId: string;
  studentName: string;
  amount: number;
  paymentMethod: 'cash' | 'card' | 'click' | 'payme' | string;
  date: string;
  recordedBy: string;
  status?: 'paid' | 'pending' | 'refunded' | 'Completed' | 'Pending' | 'Voided' | 'Sent' | 'Failed' | 'Delivered';
  cohortGroup?: string;
  subjectCategory?: string;
  paymentPeriod?: string;
  receiptRef?: string;
  notes?: string;
  invoiceId?: string;
  // Admin ERP (IncomePaymentRecord) aliases — same record, alternate field names.
  course?: string;
  method?: string;
  receiptNumber?: string;
  month?: string;
}

export interface Invoice {
  id: string;
  paymentId: string;
  studentId: string;
  teacherId: string;
  amount: number;
  paymentDate: string;
  status: 'PAID' | 'PENDING' | 'VOID';
  invoiceNumber: string;
  createdAt: string;
  studentName?: string;
  teacherName?: string;
  paymentMethod?: string;
  notes?: string;
}

export interface AttendanceStudentEntry {
  status: 'present' | 'absent' | 'late' | 'excused';
  lateMinutes?: number;
  note?: string;
}

export interface AttendanceRecord {
  id: string;
  groupId: string;
  date: string;
  records: {
    [studentId: string]: 'present' | 'absent' | 'late' | 'excused' | AttendanceStudentEntry;
  };
  recordedBy: string;
  updatedAt?: string;
  updatedBy?: string;
}

export interface Assignment {
  id: string;
  title: string;
  subjectId?: string;
  subjectCategory?: SubjectCategory | string;
  group: string;
  groupName?: string;
  groupId?: string;
  dueDate: string;
  deadline?: string;
  score?: number | string;
  maxScore?: number;
  status?: 'pending' | 'submitted' | 'graded' | string;
  submittedCount: number;
  submissionsCount?: number;
  totalStudents: number;
  file?: string;
  fileName?: string;
  fileUrl?: string;
  audioUrl?: string;
  pdfUrl?: string;
  createdAt?: string;
  description?: string;
  instructions?: string;
  resourceFormat?: string;
  teacherName?: string;
  teacherId?: string;
  teacherEmail?: string;
}

export interface DiagnosticResult {
  id: string;
  subjectId?: string;
  subjectCategory?: SubjectCategory | string;
  title: string;
  bandScore?: number | string;
  score: number | string;
  maxScore?: number;
  feedback?: string;
  date: string;
  studentName?: string;
  studentId?: string;
  overall?: number | string;
  teacherName?: string;
}

export interface SubmissionAttachment {
  id: string;
  url: string;
  type: 'image' | 'audio' | 'pdf' | 'code' | 'file';
  name: string;
  subjectCategory?: 'math' | 'physics' | 'it' | 'english' | 'sat' | 'general';
  rotation?: number;
  size?: string;
  codeSnippet?: string;
}

export interface HomeworkSubmission {
  id: string;
  assignmentId: string;
  assignmentTitle: string;
  studentId: string;
  studentName: string;
  solutionText: string;
  fileName?: string;
  fileUrl?: string;
  attachments?: SubmissionAttachment[];
  groupName?: string;
  groupId?: string;
  date: string;
  submittedAt?: string;
  status?: 'submitted' | 'graded' | 'pending';
  grade?: string | number;
  score?: string | number;
  gradingSystem?: 'IELTS Band' | 'STEM & Exact Sciences' | 'IT & Programming Code' | 'CEFR Framework' | 'Points / Percentage' | string;
  breakdown?: {
    taskAchievement?: number;
    coherenceCohesion?: number;
    lexicalResource?: number;
    grammaticalAccuracy?: number;
    formulaChoice?: number;
    calculationAccuracy?: number;
    logicFormatting?: number;
    codeExecutionPass?: boolean;
    codeReadability?: number;
    algorithmEfficiency?: number;
    cefrLevel?: string;
    qualitativeTag?: string;
    points?: number;
    maxPoints?: number;
    rubricStatus?: string;
  };
  rubricStatus?: string;
  feedback?: string;
  gradedAt?: string;
  gradedBy?: string;
  correctedFileName?: string;
  correctedFileUrl?: string;
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
  subjectCategory?: string;
  resourceFormat?: string;
  likes: number;
  comments?: { id?: string; author: string; text: string; date?: string }[];
}

export interface MockTestScore {
  id: string;
  studentId: string;
  studentName: string;
  date: string;
  overall: number;
  listening?: number;
  reading?: number;
  writing?: number;
  speaking?: number;
  gradingSystem?: 'percentage' | 'letter' | 'sat_band' | 'rubric_points' | string;
  letterGrade?: string;
  percentage?: number;
  subjectCategory?: string;
  scoreDisplay?: string;
  teacherFeedback?: string;
}

export interface WhyRenessansCard {
  id: string;
  iconNumber: number;
  titleUz: string;
  titleEn: string;
  titleRu?: string;
  descUz: string;
  descEn: string;
  descRu?: string;
}

export interface LandingTestimonial {
  id: string;
  quoteUz: string;
  quoteEn: string;
  quoteRu?: string;
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
  labelRu?: string;
}

export interface LandingPageContent {
  lightModeBgImage: string;
  darkModeBgImage: string;

  // Hero section
  locationBadgeUz: string;
  locationBadgeEn: string;
  locationBadgeRu?: string;

  aiBadgeUz?: string;
  aiBadgeEn?: string;
  aiBadgeRu?: string;
  
  heroTitleUz: string;
  heroTitleEn: string;
  heroTitleRu?: string;

  heroSubtitleUz: string;
  heroSubtitleEn: string;
  heroSubtitleRu?: string;

  heroDescUz: string;
  heroDescEn: string;
  heroDescRu?: string;

  ctaPrimaryUz: string;
  ctaPrimaryEn: string;
  ctaPrimaryRu?: string;

  ctaSecondaryUz: string;
  ctaSecondaryEn: string;
  ctaSecondaryRu?: string;

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
  reviewSectionTitleUz?: string;
  reviewSectionTitleEn?: string;
  reviewSectionTitleRu?: string;
  reviewSectionSubtitleUz?: string;
  reviewSectionSubtitleEn?: string;
  reviewSectionSubtitleRu?: string;
  testimonials: LandingTestimonial[];

  // Courses & Pricing
  courses: Course[];

  // FAQs
  faqs: FAQItem[];

  // Contact & Footer
  addressUz: string;
  addressEn: string;
  addressRu?: string;
  phone: string;
  telegramHandle: string;
  operatingHoursUz: string;
  operatingHoursEn: string;
  operatingHoursRu?: string;
  googleMapsUrl: string;

  // Announcement Ticker Banner
  announcementBannerUz?: string;
  announcementBannerEn?: string;
  announcementBannerRu?: string;
  announcementBannerActive?: boolean;
  announcementBannerLink?: string;
  announcementBannerTheme?: 'amber' | 'emerald' | 'indigo' | 'rose' | string;

  updatedAt?: string;
}

export interface AppNotification {
  id: string;
  recipientId?: string;
  recipientRole?: 'all' | 'student' | 'teacher' | 'admin' | 'superadmin' | string;
  category: 'assignment_created' | 'submission_received' | 'grade_published' | 'announcement';
  title: string;
  description: string;
  isRead: boolean;
  createdAt: string;
  linkId?: string;
  groupId?: string;
  senderName?: string;
}

