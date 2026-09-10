export type BusinessModel = 'learning_center' | 'teacher_collected' | 'hybrid';

export type TeacherTab =
  | 'dashboard'
  | 'groups'
  | 'students'
  | 'timetable'
  | 'attendance'
  | 'payments'
  | 'income'
  | 'announcements'
  | 'tasks'
  | 'documents'
  | 'profile'
  | 'analytics'
  | 'settings';

export type PaymentMethod = 'cash' | 'card' | 'bank_transfer' | 'other';
export type PaymentStatus = 'paid' | 'pending' | 'overdue' | 'partial';
export type AttendanceStatus = 'present' | 'late' | 'absent' | 'excused';

export interface TeacherDashboardStats {
  todayClasses: number;
  upcomingClasses: number;
  activeStudentCount: number;
  activeGroupCount: number;
  monthlyIncome: number;
  expectedIncome: number;
  outstandingBalance: number;
  paidStudentsCount: number;
  unpaidStudentsCount: number;
  attendanceRate: number;
}

export interface TeacherPayment {
  id: string;
  studentId: string;
  studentName: string;
  groupId: string;
  groupName: string;
  amount: number;
  paymentMethod: PaymentMethod;
  date: string;
  recordedBy: string;
  recordedByName?: string;
  notes?: string;
  receiptNumber?: string;
  receiptGenerated?: boolean;
}

export interface TeacherAnnouncement {
  id: string;
  title: string;
  message: string;
  type: 'holiday' | 'timetable_change' | 'new_enrollment' | 'meeting' | 'general';
  isRead: boolean;
  createdAt: string;
  fromAdmin: string;
  groupId?: string;
}

export interface TeacherTask {
  id: string;
  title: string;
  description?: string;
  dueDate?: string;
  status: 'pending' | 'completed';
  createdAt: string;
  groupId?: string;
  teacherId: string;
}

export interface TeacherDocument {
  id: string;
  name: string;
  type: 'certificate' | 'diploma' | 'teaching_material' | 'other';
  fileUrl: string;
  uploadedAt: string;
  visibleToAdmin: boolean;
  teacherId: string;
}

export interface TeacherProfile {
  uid: string;
  displayName: string;
  email: string;
  phoneNumber?: string;
  photoURL?: string;
  bio?: string;
  socialLinks?: SocialLink[];
  isPublicProfile: boolean;
  publicSlug?: string;
  experience?: string;
  certificates?: string[];
  achievements?: string[];
}

export interface SocialLink {
  platform: string;
  url: string;
}

export interface ReceiptData {
  centerName: string;
  teacherName: string;
  studentName: string;
  course: string;
  amount: number;
  date: string;
  paymentMethod: string;
  receiptNumber: string;
}

export interface TimetableLesson {
  id: string;
  groupId: string;
  groupName: string;
  subject: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  room: string;
  studentCount: number;
}

export interface TeacherIncomeRecord {
  month: string;
  totalCollected: number;
  expected: number;
  paidCount: number;
  unpaidCount: number;
  collectionRate: number;
}

export interface GroupWithDetails {
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
}

export interface StudentWithDetails {
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
  enrollmentDate?: string;
  attendanceRate?: number;
  notes?: string;
  achievements?: string[];
}
