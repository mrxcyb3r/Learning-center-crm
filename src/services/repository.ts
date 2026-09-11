import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  addDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  writeBatch,
  serverTimestamp,
  arrayUnion,
  arrayRemove,
  runTransaction,
  Timestamp,
  limit
} from 'firebase/firestore';
import { db, auth } from './firebase';
import {
  UserProfile,
  UserRole,
  Group,
  Student,
  Payment,
  AttendanceRecord,
  Assignment,
  FeedPost,
  MockTestScore,
  LeadSubmission,
  Inquiry,
  AppNotification
} from '../types';
import {
  Lead,
  LeadStatus,
  StudentRecord,
  TeacherRecord,
  CourseData,
  GroupScheduleItem,
  IncomePaymentRecord,
  ExpenseRecord,
  CmsData,
  StudentResult,
  CenterSettings,
  AuditLogEntry,
  TelegramAlertLog,
  CampusBranch,
  ClassroomRoom,
  StaffMember,
  TeacherInvitation
} from '../types/crm';
import { cleanData } from './firestore';

const USERS_COL = 'users';
const GROUPS_COL = 'groups';
const STUDENTS_COL = 'students';
const PAYMENTS_COL = 'payments';
const ATTENDANCE_COL = 'attendance';
const HOMEWORK_COL = 'homework';
const FEED_POSTS_COL = 'feed_posts';
const MOCK_SCORES_COL = 'mock_scores';
const LEADS_COL = 'leads';
const INQUIRIES_COL = 'inquiries';
const QUESTIONS_COL = 'questions';
const NOTIFICATIONS_COL = 'notifications';
const SETTINGS_COL = 'settings';
const COURSES_COL = 'courses';
const TEACHERS_COL = 'teachers';
const RESULTS_COL = 'results';
const FAQS_COL = 'faqs';
const BRANCHES_COL = 'branches';
const TESTIMONIALS_COL = 'testimonials';
const EXPENSES_COL = 'expenses';
const CMS_COL = 'cms';
const TELEGRAM_LOGS_COL = 'telegram_logs';
const AUDIT_LOGS_COL = 'audit_logs';
const BRANCHES_CONFIG_COL = 'branches_config';
const ROOMS_CONFIG_COL = 'rooms_config';
const STAFF_CONFIG_COL = 'staff_config';
const INVITATIONS_COL = 'teacher_invitations';

/**
 * User Service - Canonical user management
 */
export const userService = {
  async getUserProfile(uid: string): Promise<UserProfile | null> {
    const docRef = doc(db, USERS_COL, uid);
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      const data = snap.data();
      return {
        uid: data.uid || uid,
        email: data.email || null,
        displayName: data.displayName || null,
        role: data.role || 'guest',
        photoURL: data.photoURL || null,
        phoneNumber: data.phoneNumber || null,
        createdAt: data.createdAt,
        fullName: data.fullName || data.displayName,
        telegramUsername: data.telegramUsername || null,
        telegramChatId: data.telegramChatId || null,
        isBotConnected: data.isBotConnected || false,
        assignedPin: data.assignedPin || null,
        assignedGroupIds: Array.isArray(data.assignedGroupIds) ? data.assignedGroupIds : []
      };
    }
    return null;
  },

  async createUserProfile(profile: UserProfile): Promise<void> {
    const docRef = doc(db, USERS_COL, profile.uid);
    await setDoc(docRef, cleanData(profile));
  },

  async updateUserProfile(uid: string, data: Partial<UserProfile>): Promise<void> {
    const docRef = doc(db, USERS_COL, uid);
    await updateDoc(docRef, cleanData(data));
  },

  async setUserRole(uid: string, role: UserRole): Promise<void> {
    const docRef = doc(db, USERS_COL, uid);
    await updateDoc(docRef, { role, updatedAt: new Date().toISOString() });
  },

  async getAllUsers(): Promise<UserProfile[]> {
    const snap = await getDocs(collection(db, USERS_COL));
    return snap.docs.map(d => {
      const data = d.data();
      return {
        uid: data.uid || d.id,
        email: data.email || null,
        displayName: data.displayName || null,
        role: data.role || 'guest',
        photoURL: data.photoURL || null,
        phoneNumber: data.phoneNumber || null,
        createdAt: data.createdAt,
        fullName: data.fullName || data.displayName,
        telegramUsername: data.telegramUsername || null,
        telegramChatId: data.telegramChatId || null,
        isBotConnected: data.isBotConnected || false,
        assignedPin: data.assignedPin || null,
        assignedGroupIds: Array.isArray(data.assignedGroupIds) ? data.assignedGroupIds : []
      } as UserProfile;
    });
  },

  subscribeToUser(uid: string, callback: (profile: UserProfile | null) => void) {
    const docRef = doc(db, USERS_COL, uid);
    return onSnapshot(docRef, (snap) => {
      callback(snap.exists() ? snap.data() as UserProfile : null);
    });
  }
};

/**
 * Courses Service - Shared between Landing, Admin, Teacher
 */
export const coursesService = {
  async getAllCourses(): Promise<any[]> {
    const snap = await getDocs(query(collection(db, COURSES_COL), orderBy('displayOrder', 'asc')));
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  },

  async getPublicCourses(): Promise<any[]> {
    const snap = await getDocs(
      query(collection(db, COURSES_COL), where('isPublic', '==', true), orderBy('displayOrder', 'asc'))
    );
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  },

  async createCourse(data: any): Promise<string> {
    const docRef = await addDoc(collection(db, COURSES_COL), cleanData(data));
    return docRef.id;
  },

  async updateCourse(id: string, data: any): Promise<void> {
    await updateDoc(doc(db, COURSES_COL, id), cleanData(data));
  },

  async deleteCourse(id: string): Promise<void> {
    await updateDoc(doc(db, COURSES_COL, id), { isActive: false });
  },

  subscribeToCourses(callback: (courses: any[]) => void) {
    return onSnapshot(
      query(collection(db, COURSES_COL), orderBy('displayOrder', 'asc')),
      (snap) => callback(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    );
  }
};

/**
 * Teachers Service - Shared between Landing, Admin, Teacher
 */
export const teachersService = {
  async getAllTeachers(): Promise<any[]> {
    const snap = await getDocs(query(collection(db, TEACHERS_COL), orderBy('displayOrder', 'asc')));
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  },

  async getPublicTeachers(): Promise<any[]> {
    const snap = await getDocs(
      query(collection(db, TEACHERS_COL), where('isPublic', '==', true), orderBy('displayOrder', 'asc'))
    );
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  },

  async createTeacher(data: any): Promise<string> {
    const docRef = await addDoc(collection(db, TEACHERS_COL), cleanData(data));
    return docRef.id;
  },

  async updateTeacher(id: string, data: any): Promise<void> {
    await updateDoc(doc(db, TEACHERS_COL, id), cleanData(data));
  },

  subscribeToTeachers(callback: (teachers: any[]) => void) {
    return onSnapshot(
      query(collection(db, TEACHERS_COL), orderBy('displayOrder', 'asc')),
      (snap) => callback(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    );
  },

  async deleteTeacher(id: string): Promise<void> {
    await deleteDoc(doc(db, TEACHERS_COL, id));
  }
};

/**
 * Shared Firestore write inputs. Collections are schemaless and serve both the
 * Admin ERP (CRM shapes) and the Teacher portal (canonical shapes), so writes
 * accept a partial superset of both. Required-field validation lives in forms.
 */
// Note: conflicting `status`/`paymentStatus` fields are rebuilt as unions below.
// A plain `A & B` intersection would narrow them to `never` because the Admin
// ERP and Teacher portal historically use different status vocabularies for the
// same collection. Writers may persist either vocabulary; readers normalize.
export type GroupWriteInput = Omit<Partial<Omit<Group, 'id'>>, 'status'> &
  Omit<Partial<Omit<GroupScheduleItem, 'id'>>, 'status'> & {
    status?: Group['status'] | GroupScheduleItem['status'];
  };
export type StudentWriteInput = Omit<Partial<Omit<Student, 'id'>>, 'paymentStatus' | 'status'> &
  Omit<Partial<Omit<StudentRecord, 'id'>>, 'paymentStatus' | 'status'> & {
    paymentStatus?: Student['paymentStatus'] | StudentRecord['paymentStatus'];
    status?: string;
  };
export type PaymentWriteInput = Omit<Partial<Omit<Payment, 'id'>>, 'status'> &
  Omit<Partial<Omit<IncomePaymentRecord, 'id'>>, 'status'> & {
    status?: Payment['status'] | IncomePaymentRecord['status'];
  };

/**
 * ID-driven reads for teacher-scoped data.
 *
 * Rationale: Firestore rejects a LIST query when it cannot prove every
 * candidate document is allowed, so `where('teacherId','==',uid)` fails on a
 * mixed collection. Per-document `getDoc()` calls succeed exactly for the
 * documents the rules authorize — the teacher's assignment index therefore
 * drives all reads, and unrelated documents are never even requested.
 */
async function getDocsByIds<T>(col: string, ids: string[]): Promise<T[]> {
  const unique = [...new Set(ids.filter(Boolean))];
  const results: (T | null)[] = await Promise.all(
    unique.map(async (id): Promise<T | null> => {
      try {
        const snap = await getDoc(doc(db, col, id));
        return snap.exists() ? ({ id: snap.id, ...snap.data() } as T) : null;
      } catch {
        // Missing or unauthorized — fail closed, skip silently.
        return null;
      }
    })
  );
  return results.filter((d): d is T => d !== null);
}

function subscribeToDocsByIds<T>(col: string, ids: string[], callback: (docs: T[]) => void) {
  const unique = [...new Set(ids.filter(Boolean))];
  if (unique.length === 0) {
    callback([]);
    return () => {};
  }
  const latest = new Map<string, T>();
  const unsubs = unique.map((id) =>
    onSnapshot(
      doc(db, col, id),
      (snap) => {
        if (snap.exists()) {
          latest.set(id, { id: snap.id, ...snap.data() } as T);
        } else {
          latest.delete(id);
        }
        callback([...latest.values()]);
      },
      () => {
        // Unauthorized or missing — treat as absent, keep other docs live.
        latest.delete(id);
        callback([...latest.values()]);
      }
    )
  );
  return () => unsubs.forEach((u) => u());
}

/**
 * Groups Service - Teacher-scoped queries
 */
export const groupsService = {
  async getGroupsByTeacher(teacherUid: string): Promise<Group[]> {
    const q = query(collection(db, GROUPS_COL), where('teacherId', '==', teacherUid));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as Group));
  },

  async getAllGroups(): Promise<Group[]> {
    const snap = await getDocs(query(collection(db, GROUPS_COL), orderBy('displayOrder', 'asc')));
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as Group));
  },

  async createGroup(data: GroupWriteInput): Promise<string> {
    const docRef = await addDoc(collection(db, GROUPS_COL), cleanData(data));
    return docRef.id;
  },

  async updateGroup(id: string, data: GroupWriteInput): Promise<void> {
    await updateDoc(doc(db, GROUPS_COL, id), cleanData(data));
  },

  subscribeToGroupsByTeacher(teacherUid: string, callback: (groups: Group[]) => void) {
    const q = query(collection(db, GROUPS_COL), where('teacherId', '==', teacherUid));
    return onSnapshot(q, (snap) => {
      callback(snap.docs.map(d => ({ id: d.id, ...d.data() } as Group)));
    });
  },

  /** Secure index-driven read: only the given IDs are requested. */
  async getGroupsByIds(ids: string[]): Promise<Group[]> {
    return getDocsByIds<Group>(GROUPS_COL, ids);
  },

  /** Realtime listeners on known authorized IDs only (never whole collection). */
  subscribeToGroupsByIds(ids: string[], callback: (groups: Group[]) => void) {
    return subscribeToDocsByIds<Group>(GROUPS_COL, ids, callback);
  },

  async deleteGroup(id: string): Promise<void> {
    await deleteDoc(doc(db, GROUPS_COL, id));
  }
};

/**
 * Assignment Service - Admin-maintained teacher/group/student relationships.
 *
 * Canonical model:
 * - groups/{groupId}.teacherId  → assigned teacher's Firebase UID
 * - users/{teacherUid}.assignedGroupIds → group IDs (admin-maintained index)
 * - groups/{groupId}.studentIds → student IDs (admin-maintained index)
 * Only Admin (or SuperAdmin) may call these; rules forbid owner modification
 * of assignedGroupIds and roles.
 */
export const assignmentService = {
  async setGroupTeacher(
    groupId: string,
    prevTeacherUid: string | null,
    nextTeacherUid: string | null,
    teacherName?: string
  ): Promise<void> {
    const updates: Record<string, unknown> = {};
    if (nextTeacherUid !== null) {
      updates.teacherId = nextTeacherUid;
      if (teacherName !== undefined) {
        updates.teacher = teacherName;
        updates.teacherName = teacherName;
      }
    }
    if (Object.keys(updates).length > 0) {
      await updateDoc(doc(db, GROUPS_COL, groupId), cleanData(updates));
    }
    if (prevTeacherUid) {
      await updateDoc(doc(db, USERS_COL, prevTeacherUid), {
        assignedGroupIds: arrayRemove(groupId)
      });
    }
    if (nextTeacherUid) {
      await updateDoc(doc(db, USERS_COL, nextTeacherUid), {
        assignedGroupIds: arrayUnion(groupId)
      });
    }
  },

  async setStudentGroup(
    studentId: string,
    prevGroupId: string | null,
    nextGroupId: string | null
  ): Promise<void> {
    if (prevGroupId) {
      await updateDoc(doc(db, GROUPS_COL, prevGroupId), {
        studentIds: arrayRemove(studentId)
      });
    }
    if (nextGroupId) {
      await updateDoc(doc(db, GROUPS_COL, nextGroupId), {
        studentIds: arrayUnion(studentId)
      });
    }
  }
};

/**
 * Students Service - Teacher-scoped queries
 */
export const studentsService = {
  async getStudentsByTeacher(teacherUid: string): Promise<Student[]> {
    // Get groups for this teacher first
    const groups = await groupsService.getGroupsByTeacher(teacherUid);
    const groupIds = groups.map(g => g.id);

    if (groupIds.length === 0) return [];

    // Get students in these groups (Firestore 'in' query max 10)
    const students: Student[] = [];
    for (let i = 0; i < groupIds.length; i += 10) {
      const chunk = groupIds.slice(i, i + 10);
      const q = query(collection(db, STUDENTS_COL), where('groupId', 'in', chunk));
      const snap = await getDocs(q);
      students.push(...snap.docs.map(d => ({ id: d.id, ...d.data() } as Student)));
    }
    return students;
  },

  async getAllStudents(): Promise<Student[]> {
    const snap = await getDocs(collection(db, STUDENTS_COL));
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as Student));
  },

  /** Secure index-driven read: only the given IDs are requested. */
  async getStudentsByIds(ids: string[]): Promise<Student[]> {
    return getDocsByIds<Student>(STUDENTS_COL, ids);
  },

  /** Realtime listeners on known authorized IDs only (never whole collection). */
  subscribeToStudentsByIds(ids: string[], callback: (students: Student[]) => void) {
    return subscribeToDocsByIds<Student>(STUDENTS_COL, ids, callback);
  },

  async createStudent(data: StudentWriteInput): Promise<string> {
    const docRef = await addDoc(collection(db, STUDENTS_COL), cleanData(data));
    return docRef.id;
  },

  async updateStudent(id: string, data: StudentWriteInput): Promise<void> {
    await updateDoc(doc(db, STUDENTS_COL, id), cleanData(data));
  },

  subscribeToStudentsByGroupIds(groupIds: string[], callback: (students: Student[]) => void) {
    if (groupIds.length === 0) {
      callback([]);
      return () => {};
    }

    const unsubscribers: (() => void)[] = [];
    const allStudents: Student[] = [];

    for (let i = 0; i < groupIds.length; i += 10) {
      const chunk = groupIds.slice(i, i + 10);
      const q = query(collection(db, STUDENTS_COL), where('groupId', 'in', chunk));
      const unsub = onSnapshot(q, (snap) => {
        const chunkStudents = snap.docs.map(d => ({ id: d.id, ...d.data() } as Student));
        // Replace this chunk's students in the combined array
        allStudents.splice(i, chunk.length, ...chunkStudents);
        callback([...allStudents]);
      });
      unsubscribers.push(unsub);
    }

    return () => unsubscribers.forEach(u => u());
  },

  async deleteStudent(id: string): Promise<void> {
    await deleteDoc(doc(db, STUDENTS_COL, id));
  }
};

/**
 * Payments Service
 */
export const paymentsService = {
  async getPaymentsByTeacher(teacherUid: string): Promise<Payment[]> {
    const groups = await groupsService.getGroupsByTeacher(teacherUid);
    const studentIds = (await studentsService.getStudentsByTeacher(teacherUid)).map(s => s.id);

    if (studentIds.length === 0) return [];

    const payments: Payment[] = [];
    for (let i = 0; i < studentIds.length; i += 10) {
      const chunk = studentIds.slice(i, i + 10);
      const q = query(collection(db, PAYMENTS_COL), where('studentId', 'in', chunk), orderBy('date', 'desc'));
      const snap = await getDocs(q);
      payments.push(...snap.docs.map(d => ({ id: d.id, ...d.data() } as Payment)));
    }
    return payments;
  },

  async getAllPayments(): Promise<Payment[]> {
    const snap = await getDocs(query(collection(db, PAYMENTS_COL), orderBy('date', 'desc')));
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as Payment));
  },

  async recordPayment(data: PaymentWriteInput): Promise<string> {
    const docRef = await addDoc(collection(db, PAYMENTS_COL), cleanData(data));
    return docRef.id;
  },

  async voidPayment(id: string, reason: string): Promise<void> {
    await updateDoc(doc(db, PAYMENTS_COL, id), { status: 'Voided', voidReason: reason, voidedAt: new Date().toISOString() });
  }
};

/**
 * Attendance Service
 */
export const attendanceService = {
  async getAttendanceByTeacher(teacherUid: string): Promise<AttendanceRecord[]> {
    const groups = await groupsService.getGroupsByTeacher(teacherUid);
    const groupIds = groups.map(g => g.id);

    if (groupIds.length === 0) return [];

    const attendance: AttendanceRecord[] = [];
    for (let i = 0; i < groupIds.length; i += 10) {
      const chunk = groupIds.slice(i, i + 10);
      const q = query(collection(db, ATTENDANCE_COL), where('groupId', 'in', chunk));
      const snap = await getDocs(q);
      attendance.push(...snap.docs.map(d => ({ id: d.id, ...d.data() } as AttendanceRecord)));
    }
    return attendance;
  },

  async saveAttendance(record: Omit<AttendanceRecord, 'id'>): Promise<string> {
    const recordId = `${record.groupId}_${record.date}`;
    await setDoc(doc(db, ATTENDANCE_COL, recordId), cleanData(record), { merge: true });
    return recordId;
  },

  /**
   * Secure index-driven read for deterministic `{groupId}_{date}` IDs.
   * Only the given record IDs are requested — no collection list query.
   */
  async getAttendanceByIds(recordIds: string[]): Promise<AttendanceRecord[]> {
    return getDocsByIds<AttendanceRecord>(ATTENDANCE_COL, recordIds);
  },

  /** Record IDs for a group's recent window (deterministic ID scheme). */
  attendanceWindowIds(groupId: string, daysBack: number, refDate: Date = new Date()): string[] {
    const ids: string[] = [];
    for (let i = 0; i < daysBack; i++) {
      const d = new Date(refDate);
      d.setDate(d.getDate() - i);
      ids.push(`${groupId}_${d.toISOString().split('T')[0]}`);
    }
    return ids;
  },

  subscribeToAttendanceByGroupIds(groupIds: string[], callback: (records: AttendanceRecord[]) => void) {
    if (groupIds.length === 0) {
      callback([]);
      return () => {};
    }

    const unsubscribers: (() => void)[] = [];
    const allRecords: AttendanceRecord[] = [];

    for (let i = 0; i < groupIds.length; i += 10) {
      const chunk = groupIds.slice(i, i + 10);
      const q = query(collection(db, ATTENDANCE_COL), where('groupId', 'in', chunk));
      const unsub = onSnapshot(q, (snap) => {
        const chunkRecords = snap.docs.map(d => ({ id: d.id, ...d.data() } as AttendanceRecord));
        allRecords.splice(i, chunk.length, ...chunkRecords);
        callback([...allRecords]);
      });
      unsubscribers.push(unsub);
    }

    return () => unsubscribers.forEach(u => u());
  }
};

/**
 * Homework/Assignments Service
 */
export const homeworkService = {
  // Scoped by stable Firebase UID. Legacy docs that only carry `teacherEmail`
  // are matched in a second query so old records remain visible.
  async getHomeworkByTeacher(teacherUid: string, teacherEmail?: string): Promise<Assignment[]> {
    const byId = await getDocs(query(collection(db, HOMEWORK_COL), where('teacherId', '==', teacherUid)));
    const items = byId.docs.map(d => ({ id: d.id, ...d.data() } as Assignment));
    if (teacherEmail) {
      const byEmail = await getDocs(query(collection(db, HOMEWORK_COL), where('teacherEmail', '==', teacherEmail)));
      const seen = new Set(items.map(i => i.id));
      for (const d of byEmail.docs) {
        if (!seen.has(d.id)) items.push({ id: d.id, ...d.data() } as Assignment);
      }
    }
    return items;
  },

  async createHomework(data: Omit<Assignment, 'id'> & Record<string, unknown>): Promise<string> {
    const ref = doc(collection(db, HOMEWORK_COL));
    await setDoc(ref, cleanData(data));
    // Maintain the group's homework index so teachers can load it by ID.
    const groupId = (data as { groupId?: string }).groupId;
    if (typeof groupId === 'string' && groupId) {
      try {
        await updateDoc(doc(db, GROUPS_COL, groupId), { homeworkIds: arrayUnion(ref.id) });
      } catch {
        // Index maintenance is best-effort; the homework doc itself is saved.
      }
    }
    return ref.id;
  },

  /** Secure index-driven read: only the given IDs are requested. */
  async getHomeworkByIds(ids: string[]): Promise<Assignment[]> {
    return getDocsByIds<Assignment>(HOMEWORK_COL, ids);
  },

  async updateHomework(id: string, data: Partial<Assignment> & Record<string, unknown>): Promise<void> {
    await updateDoc(doc(db, HOMEWORK_COL, id), cleanData(data));
  }
};

/**
 * Landing CMS Service - Shared public content
 */
export const landingCmsService = {
  async getLandingContent(): Promise<any> {
    const docRef = doc(db, SETTINGS_COL, 'landing_cms');
    const snap = await getDoc(docRef);
    return snap.exists() ? snap.data() : null;
  },

  async updateLandingContent(data: any): Promise<void> {
    await setDoc(doc(db, SETTINGS_COL, 'landing_cms'), cleanData(data), { merge: true });
  },

  async getFaqs(): Promise<any[]> {
    const snap = await getDocs(query(collection(db, FAQS_COL), orderBy('order', 'asc')));
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  },

  async getBranches(): Promise<any[]> {
    const snap = await getDocs(query(collection(db, BRANCHES_COL), orderBy('displayOrder', 'asc')));
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  },

  async getResults(): Promise<any[]> {
    const snap = await getDocs(query(collection(db, RESULTS_COL), where('published', '==', true), orderBy('date', 'desc')));
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  },

  async getTestimonials(): Promise<any[]> {
    const snap = await getDocs(query(collection(db, TESTIMONIALS_COL), where('published', '==', true), orderBy('order', 'asc')));
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  }
};

/**
 * Notifications Service
 */
export const notificationsService = {
  async getNotificationsForUser(userId: string, userRole: UserRole): Promise<AppNotification[]> {
    const q = query(
      collection(db, NOTIFICATIONS_COL),
      where('recipientRole', 'in', ['all', userRole]),
      orderBy('createdAt', 'desc')
    );
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as AppNotification));
  },

  async createNotification(data: Omit<AppNotification, 'id'>): Promise<string> {
    const docRef = await addDoc(collection(db, NOTIFICATIONS_COL), cleanData(data));
    return docRef.id;
  },

  async markAsRead(id: string): Promise<void> {
    await updateDoc(doc(db, NOTIFICATIONS_COL, id), { isRead: true });
  }
};

/**
 * Leads/Inquiries Service - CRM Lead Management
 */
export interface LeadConversionOptions {
  course?: string;
  groupId?: string;
  groupName?: string;
  teacher?: string;
  teacherId?: string;
  monthlyFee?: number;
  discount?: number;
  paymentStatus?: StudentRecord['paymentStatus'];
  parentName?: string;
  parentPhone?: string;
  startDate?: string;
}

export interface LeadConversionResult {
  leadId: string;
  created: boolean;
  message: string;
  student?: StudentRecord;
}

export const leadsService = {
  async getAllLeads(): Promise<Lead[]> {
    const snap = await getDocs(query(collection(db, LEADS_COL), orderBy('createdAt', 'desc')));
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as Lead));
  },

  async getLeadById(id: string): Promise<Lead | null> {
    const docRef = doc(db, LEADS_COL, id);
    const snap = await getDoc(docRef);
    return snap.exists() ? ({ id: snap.id, ...snap.data() } as Lead) : null;
  },

  // Accepts lead input without server-generated fields; fills CRM defaults
  // (status based on trial presence, timestamps, fallbacks) mirroring legacy crmService.
  async createLead(
    data: Omit<Lead, 'id' | 'createdAt' | 'status'> & Partial<Pick<Lead, 'createdAt' | 'status'>>
  ): Promise<string> {
    const hasTrial = Boolean(data.trialDateTime);
    const docRef = await addDoc(collection(db, LEADS_COL), cleanData({
      course: 'DTM & Milliy Sertifikat',
      assignedTo: 'Qabulxona',
      notes: 'Bepul sinov darsiga yozildi.',
      source: 'Sayt orqali ariza',
      ...data,
      status: data.status ?? (hasTrial ? 'Sinov darsi belgilandi' : 'Yangi'),
      createdAt: data.createdAt ?? new Date().toISOString()
    }));
    return docRef.id;
  },

  async updateLead(id: string, data: Partial<Lead>): Promise<void> {
    await updateDoc(doc(db, LEADS_COL, id), cleanData(data));
  },

  async deleteLead(id: string): Promise<void> {
    await deleteDoc(doc(db, LEADS_COL, id));
  },

  async convertLeadToStudent(
    leadId: string,
    opts: LeadConversionOptions = {}
  ): Promise<LeadConversionResult> {
    const leadSnap = await getDoc(doc(db, LEADS_COL, leadId));
    if (!leadSnap.exists()) {
      return { leadId, created: false, message: 'Ariza topilmadi.' };
    }
    const lead = { id: leadSnap.id, ...leadSnap.data() } as Lead;

    const fee = Number(opts.monthlyFee) || 0;
    const discount = Math.min(Math.max(Number(opts.discount) || 0, 0), fee);
    const courseTitle = opts.course || lead.course || '';
    const enrollmentDate = opts.startDate || new Date().toISOString().split('T')[0];
    const teacherName = opts.teacher || lead.assignedTo || '';

    // Resolve the target group document so the membership index stays in sync.
    let targetGroupId = opts.groupId || '';
    let targetGroupTeacherId = opts.teacherId || '';
    if ((!targetGroupId || !targetGroupTeacherId) && opts.groupName) {
      try {
        const gsnap = await getDocs(
          query(collection(db, GROUPS_COL), where('groupName', '==', opts.groupName), limit(1))
        );
        if (!gsnap.empty) {
          if (!targetGroupId) targetGroupId = gsnap.docs[0].id;
          const gdata = gsnap.docs[0].data();
          if (!targetGroupTeacherId && typeof gdata.teacherId === 'string') {
            targetGroupTeacherId = gdata.teacherId;
          }
        }
      } catch {
        // Index sync is best-effort; conversion proceeds regardless.
      }
    }

    const studentPayload: Omit<StudentRecord, 'id'> = {
      fullName: lead.name,
      name: lead.name,
      phone: lead.phone,
      parentName: opts.parentName || '',
      parentPhone: opts.parentPhone || '',
      mentor: teacherName,
      teacher: teacherName,
      teacherId: targetGroupTeacherId,
      course: courseTitle,
      groupId: targetGroupId,
      groupName: opts.groupName || '',
      enrollmentDate,
      tuitionFee: fee,
      monthlyFee: fee,
      paymentStatus: opts.paymentStatus || 'Due',
      debtAmount: Math.max(fee - discount, 0),
      isActive: true,
      status: 'Active',
      attendanceRate: 0,
      notes: discount > 0
        ? `CRM arizasidan o'quvchiga aylantirildi (chegirma: ${discount})`
        : `CRM arizasidan o'quvchiga aylantirildi`,
    };

    const batch = writeBatch(db);
    const studentRef = doc(collection(db, STUDENTS_COL));
    batch.set(studentRef, cleanData({ ...studentPayload, createdAt: new Date().toISOString() }));
    const leadRef = doc(db, LEADS_COL, leadId);
    batch.update(leadRef, {
      status: "O'quvchiga aylandi" as LeadStatus,
      enrollmentDate
    });
    await batch.commit();
    // Maintain the group's membership index (admin-only path).
    if (targetGroupId) {
      try {
        await updateDoc(doc(db, GROUPS_COL, targetGroupId), {
          studentIds: arrayUnion(studentRef.id)
        });
      } catch {
        // Index maintenance is best-effort; the student record itself is saved.
      }
    }
    return {
      leadId,
      created: true,
      message: "O'quvchi muvaffaqiyatli yaratildi.",
      student: { ...studentPayload, id: studentRef.id }
    };
  },

  subscribeToLeads(callback: (leads: Lead[]) => void) {
    return onSnapshot(
      query(collection(db, LEADS_COL), orderBy('createdAt', 'desc')),
      (snap) => callback(snap.docs.map(d => ({ id: d.id, ...d.data() } as Lead)))
    );
  }
};

/**
 * Public questions Service - website "Ask a question" form.
 * Public create is allowed by Firestore rules; reads are admin-only.
 */
export interface PublicQuestionInput {
  fullName: string;
  phone: string;
  email?: string;
  course?: string;
  subject: string;
  message: string;
  preferredContact?: 'phone' | 'email' | 'telegram';
  source?: string;
}

export const questionsService = {
  async createQuestion(data: PublicQuestionInput): Promise<string> {
    const docRef = await addDoc(collection(db, QUESTIONS_COL), cleanData({
      ...data,
      status: 'New',
      createdAt: new Date().toISOString()
    }));
    return docRef.id;
  }
};

/**
 * Expenses Service
 */
export const expensesService = {
  async getAllExpenses(): Promise<ExpenseRecord[]> {
    const snap = await getDocs(query(collection(db, EXPENSES_COL), orderBy('date', 'desc')));
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as ExpenseRecord));
  },

  async getExpensesByMonth(month: string): Promise<ExpenseRecord[]> {
    const snap = await getDocs(query(collection(db, EXPENSES_COL), where('month', '==', month), orderBy('date', 'desc')));
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as ExpenseRecord));
  },

  async createExpense(data: Omit<ExpenseRecord, 'id'>): Promise<string> {
    const docRef = await addDoc(collection(db, EXPENSES_COL), cleanData({
      ...data,
      createdAt: new Date().toISOString()
    }));
    return docRef.id;
  },

  async updateExpense(id: string, data: Partial<ExpenseRecord>): Promise<void> {
    await updateDoc(doc(db, EXPENSES_COL, id), cleanData(data));
  },

  async deleteExpense(id: string): Promise<void> {
    await deleteDoc(doc(db, EXPENSES_COL, id));
  },

  subscribeToExpenses(callback: (expenses: ExpenseRecord[]) => void) {
    return onSnapshot(
      query(collection(db, EXPENSES_COL), orderBy('date', 'desc')),
      (snap) => callback(snap.docs.map(d => ({ id: d.id, ...d.data() } as ExpenseRecord)))
    );
  }
};

/**
 * Teacher Invitations Service - one-time onboarding capabilities.
 * Admin-only for list/create/revoke. Single-doc reads are public (unguessable
 * IDs) so the registration page can validate its own link. Redemption itself
 * is enforced by Firestore rules inside a transaction (see registerTeacher).
 */
export const invitationsService = {
  async createInvitation(input: {
    teacherName: string;
    teacherEmail: string;
    createdBy: string;
    expiresAtIso: string;
  }): Promise<{ id: string; secret: string }> {
    const secretBytes = new Uint8Array(32);
    crypto.getRandomValues(secretBytes);
    const secret = [...secretBytes].map((b) => b.toString(16).padStart(2, '0')).join('');
    // Unguessable document ID doubles as part of the capability URL.
    const idBytes = new Uint8Array(16);
    crypto.getRandomValues(idBytes);
    const id = [...idBytes].map((b) => b.toString(16).padStart(2, '0')).join('');
    // expiresAt is a Firestore Timestamp so rules can compare it with
    // request.time. createdAt is compared only for equality — ISO is fine.
    await setDoc(doc(db, INVITATIONS_COL, id), {
      teacherName: input.teacherName,
      teacherEmail: input.teacherEmail.toLowerCase().trim(),
      secret,
      role: 'teacher',
      status: 'pending',
      createdBy: input.createdBy,
      createdAt: new Date().toISOString(),
      expiresAt: Timestamp.fromDate(new Date(input.expiresAtIso)),
      usedAt: null,
      usedByUid: null,
    });
    return { id, secret };
  },

  async getInvitation(id: string): Promise<TeacherInvitation | null> {
    const snap = await getDoc(doc(db, INVITATIONS_COL, id));
    return snap.exists() ? ({ id: snap.id, ...snap.data() } as TeacherInvitation) : null;
  },

  async getAllInvitations(): Promise<TeacherInvitation[]> {
    const snap = await getDocs(query(collection(db, INVITATIONS_COL), orderBy('createdAt', 'desc')));
    return snap.docs.map((d) => ({ id: d.id, ...d.data() } as TeacherInvitation));
  },

  async revokeInvitation(id: string): Promise<void> {
    await updateDoc(doc(db, INVITATIONS_COL, id), { status: 'revoked' });
  },

  subscribeToInvitations(callback: (items: TeacherInvitation[]) => void) {
    return onSnapshot(
      query(collection(db, INVITATIONS_COL), orderBy('createdAt', 'desc')),
      (snap) => callback(snap.docs.map((d) => normalizeInvitation(d.id, d.data())))
    );
  }
};

function normalizeInvitation(id: string, data: Record<string, unknown>): TeacherInvitation {
  const raw: unknown = data.expiresAt;
  const expiresAt =
    typeof raw === 'string'
      ? raw
      : raw instanceof Timestamp
        ? raw.toDate().toISOString()
        : '';
  const { expiresAt: _ignored, ...rest } = data;
  void _ignored;
  return { ...rest, id, expiresAt } as TeacherInvitation;
}

/** Error codes thrown by registerTeacherWithInvitation (invitation/* namespace). */
export type InvitationErrorCode =
  | 'invitation/not-found'
  | 'invitation/secret-mismatch'
  | 'invitation/used'
  | 'invitation/revoked'
  | 'invitation/expired'
  | 'invitation/email-mismatch';

function invitationError(code: InvitationErrorCode, message: string): Error & { code: InvitationErrorCode } {
  return Object.assign(new Error(message), { code });
}

/**
 * Register a new teacher through a one-time invitation.
 *
 * Security model (enforced by Firestore rules, never UI-only):
 * 1. The invitation (unguessable ID + secret from the URL) is validated.
 * 2. A Firebase Auth account is created for the invitation's email only.
 * 3. A transaction atomically creates users/{uid} with role='teacher' and
 *    marks the invitation used. Rules verify invitation pending/unexpired/
 *    secret-matching at commit time, so double-use is rejected even
 *    concurrently. No password is ever stored in Firestore.
 */
export async function registerTeacherWithInvitation(input: {
  invitationId: string;
  secret: string;
  fullName: string;
  email: string;
  password: string;
  phone?: string;
}): Promise<string> {
  const invitationRef = doc(db, INVITATIONS_COL, input.invitationId);
  const preSnap = await getDoc(invitationRef);
  if (!preSnap.exists()) {
    throw invitationError('invitation/not-found', 'Taklifnoma topilmadi.');
  }
  const pre = preSnap.data();
  if (pre.secret !== input.secret) {
    throw invitationError('invitation/secret-mismatch', 'Taklifnoma havolasi yaroqsiz.');
  }
  if (pre.status === 'used') {
    throw invitationError('invitation/used', 'Bu taklifnoma allaqachon ishlatilgan.');
  }
  if (pre.status === 'revoked') {
    throw invitationError('invitation/revoked', 'Bu taklifnoma bekor qilingan.');
  }
  const expiresAt: Timestamp | null =
    pre.expiresAt instanceof Timestamp ? pre.expiresAt : null;
  if (pre.status !== 'pending' || !expiresAt || expiresAt.toDate().getTime() < Date.now()) {
    throw invitationError('invitation/expired', 'Taklifnoma muddati tugagan.');
  }
  if (typeof pre.teacherEmail !== 'string' || pre.teacherEmail.toLowerCase() !== input.email.toLowerCase().trim()) {
    throw invitationError('invitation/email-mismatch', 'Bu taklifnoma boshqa email uchun berilgan.');
  }

  const { createUserWithEmailAndPassword, updateProfile } = await import('firebase/auth');
  const cred = await createUserWithEmailAndPassword(auth, input.email.trim(), input.password);
  try {
    await updateProfile(cred.user, { displayName: input.fullName.trim() });
  } catch {
    // Non-fatal; the Auth account itself is what matters.
  }
  const uid = cred.user.uid;

  await runTransaction(db, async (tx) => {
    const snap = await tx.get(invitationRef);
    if (!snap.exists()) throw invitationError('invitation/not-found', 'Taklifnoma topilmadi.');
    const cur = snap.data();
    if (cur.secret !== input.secret) throw invitationError('invitation/secret-mismatch', 'Taklifnoma havolasi yaroqsiz.');
    if (cur.status !== 'pending') throw invitationError('invitation/used', 'Bu taklifnoma allaqachon ishlatilgan yoki bekor qilingan.');
    const exp: Timestamp | null = cur.expiresAt instanceof Timestamp ? cur.expiresAt : null;
    if (!exp || exp.toDate().getTime() < Date.now()) throw invitationError('invitation/expired', 'Taklifnoma muddati tugagan.');
    tx.set(doc(db, USERS_COL, uid), cleanData({
      uid,
      email: cred.user.email,
      fullName: input.fullName.trim(),
      displayName: input.fullName.trim(),
      phoneNumber: input.phone?.trim() || null,
      role: 'teacher',
      invitationId: input.invitationId,
      invitationSecret: input.secret,
      createdAt: new Date().toISOString(),
    }));
    tx.update(invitationRef, {
      status: 'used',
      usedByUid: uid,
      usedAt: serverTimestamp(),
    });
  });

  return uid;
}

/**
 * CMS Service - Website Content Management
 */
export const cmsService = {
  async getCmsData(): Promise<CmsData | null> {
    const docRef = doc(db, CMS_COL, 'main');
    const snap = await getDoc(docRef);
    return snap.exists() ? snap.data() as CmsData : null;
  },

  async updateCmsData(data: Partial<CmsData>): Promise<void> {
    const docRef = doc(db, CMS_COL, 'main');
    await setDoc(docRef, cleanData({
      ...data,
      updatedAt: new Date().toISOString()
    }), { merge: true });
  },

  subscribeToCms(callback: (cms: CmsData | null) => void) {
    return onSnapshot(
      doc(db, CMS_COL, 'main'),
      (snap) => callback(snap.exists() ? snap.data() as CmsData : null)
    );
  }
};

/**
 * Settings Service - Center Configuration
 */
export const settingsService = {
  async getSettings(): Promise<CenterSettings | null> {
    const docRef = doc(db, SETTINGS_COL, 'center');
    const snap = await getDoc(docRef);
    return snap.exists() ? snap.data() as CenterSettings : null;
  },

  async updateSettings(data: Partial<CenterSettings>): Promise<void> {
    const docRef = doc(db, SETTINGS_COL, 'center');
    await setDoc(docRef, cleanData({
      ...data,
      updatedAt: new Date().toISOString()
    }), { merge: true });
  },

  async getBranches(): Promise<CampusBranch[]> {
    const snap = await getDocs(query(collection(db, BRANCHES_CONFIG_COL), orderBy('displayOrder', 'asc')));
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as CampusBranch));
  },

  async addBranch(data: Omit<CampusBranch, 'id'>): Promise<string> {
    const docRef = await addDoc(collection(db, BRANCHES_CONFIG_COL), cleanData(data));
    return docRef.id;
  },

  async updateBranch(id: string, data: Partial<CampusBranch>): Promise<void> {
    await updateDoc(doc(db, BRANCHES_CONFIG_COL, id), cleanData(data));
  },

  async deleteBranch(id: string): Promise<void> {
    await deleteDoc(doc(db, BRANCHES_CONFIG_COL, id));
  },

  async getRooms(): Promise<ClassroomRoom[]> {
    const snap = await getDocs(query(collection(db, ROOMS_CONFIG_COL), orderBy('branchId', 'asc')));
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as ClassroomRoom));
  },

  async addRoom(data: Omit<ClassroomRoom, 'id'>): Promise<string> {
    const docRef = await addDoc(collection(db, ROOMS_CONFIG_COL), cleanData(data));
    return docRef.id;
  },

  async updateRoom(id: string, data: Partial<ClassroomRoom>): Promise<void> {
    await updateDoc(doc(db, ROOMS_CONFIG_COL, id), cleanData(data));
  },

  async deleteRoom(id: string): Promise<void> {
    await deleteDoc(doc(db, ROOMS_CONFIG_COL, id));
  },

  async getStaff(): Promise<StaffMember[]> {
    const snap = await getDocs(query(collection(db, STAFF_CONFIG_COL), orderBy('role', 'asc')));
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as StaffMember));
  },

  async addStaff(data: Omit<StaffMember, 'id'>): Promise<string> {
    const docRef = await addDoc(collection(db, STAFF_CONFIG_COL), cleanData(data));
    return docRef.id;
  },

  async updateStaff(id: string, data: Partial<StaffMember>): Promise<void> {
    await updateDoc(doc(db, STAFF_CONFIG_COL, id), cleanData(data));
  },

  async deleteStaff(id: string): Promise<void> {
    await deleteDoc(doc(db, STAFF_CONFIG_COL, id));
  },

  subscribeToSettings(callback: (settings: CenterSettings | null) => void) {
    return onSnapshot(
      doc(db, SETTINGS_COL, 'center'),
      (snap) => callback(snap.exists() ? snap.data() as CenterSettings : null)
    );
  }
};

/**
 * Results Service - Student Achievements
 */
export const resultsService = {
  async getAllResults(): Promise<StudentResult[]> {
    const snap = await getDocs(query(collection(db, RESULTS_COL), orderBy('date', 'desc')));
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as StudentResult));
  },

  async getPublishedResults(): Promise<StudentResult[]> {
    const snap = await getDocs(query(collection(db, RESULTS_COL), where('published', '==', true), orderBy('date', 'desc')));
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as StudentResult));
  },

  async createResult(data: Omit<StudentResult, 'id'>): Promise<string> {
    const docRef = await addDoc(collection(db, RESULTS_COL), cleanData({
      ...data,
      createdAt: new Date().toISOString()
    }));
    return docRef.id;
  },

  async updateResult(id: string, data: Partial<StudentResult>): Promise<void> {
    await updateDoc(doc(db, RESULTS_COL, id), cleanData(data));
  },

  async deleteResult(id: string): Promise<void> {
    await deleteDoc(doc(db, RESULTS_COL, id));
  },

  subscribeToResults(callback: (results: StudentResult[]) => void) {
    return onSnapshot(
      query(collection(db, RESULTS_COL), orderBy('date', 'desc')),
      (snap) => callback(snap.docs.map(d => ({ id: d.id, ...d.data() } as StudentResult)))
    );
  }
};

/**
 * Telegram Service - Bot Integration Logs
 */
export const telegramService = {
  async getTelegramLogs(): Promise<TelegramAlertLog[]> {
    const snap = await getDocs(query(collection(db, TELEGRAM_LOGS_COL), orderBy('sentAt', 'desc'), limit(100)));
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as TelegramAlertLog));
  },

  // Legacy-compatible API: accepts a plain message string, persists a log
  // document, and resolves with the full log record (as crmService did).
  async sendTelegramMessage(text: string): Promise<TelegramAlertLog> {
    const log: Omit<TelegramAlertLog, 'id'> = {
      sentAt: new Date().toISOString(),
      status: 'Sent',
      messageText: text,
      message: text
    };
    const docRef = await addDoc(collection(db, TELEGRAM_LOGS_COL), cleanData(log));
    return { ...log, id: docRef.id };
  },

  async sendLeadNotification(leadId: string, leadName: string, leadPhone: string, course: string): Promise<TelegramAlertLog> {
    const messageText = `🆕 Yangi murojaat!\n👤 ${leadName}\n📞 ${leadPhone}\n📚 ${course}\n🆔 ${leadId}`;
    const log: Omit<TelegramAlertLog, 'id'> = {
      leadId,
      leadName,
      leadPhone,
      course,
      sentAt: new Date().toISOString(),
      status: 'Sent',
      messageText,
      message: messageText
    };
    const docRef = await addDoc(collection(db, TELEGRAM_LOGS_COL), cleanData(log));
    return { ...log, id: docRef.id };
  },

  subscribeToTelegramLogs(callback: (logs: TelegramAlertLog[]) => void) {
    return onSnapshot(
      query(collection(db, TELEGRAM_LOGS_COL), orderBy('sentAt', 'desc'), limit(50)),
      (snap) => callback(snap.docs.map(d => ({ id: d.id, ...d.data() } as TelegramAlertLog)))
    );
  }
};

/**
 * Audit Logs Service
 */
export const auditService = {
  async getAuditLogs(limitCount = 100): Promise<AuditLogEntry[]> {
    const snap = await getDocs(query(collection(db, AUDIT_LOGS_COL), orderBy('timestamp', 'desc'), limit(limitCount)));
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as AuditLogEntry));
  },

  async logAuditAction(user: string, action: string, entity: string, entityId?: string, details?: string, previousValue?: string, newValue?: string): Promise<void> {
    await addDoc(collection(db, AUDIT_LOGS_COL), cleanData({
      user,
      action,
      entity,
      entityId,
      details,
      previousValue,
      newValue,
      timestamp: new Date().toISOString()
    }));
  },

  subscribeToAuditLogs(callback: (logs: AuditLogEntry[]) => void) {
    return onSnapshot(
      query(collection(db, AUDIT_LOGS_COL), orderBy('timestamp', 'desc'), limit(50)),
      (snap) => callback(snap.docs.map(d => ({ id: d.id, ...d.data() } as AuditLogEntry)))
    );
  }
};

/**
 * Backup/Export Service
 */
export const backupService = {
  async exportFullBackup(): Promise<any> {
    const [
      leads,
      students,
      teachers,
      courses,
      groups,
      payments,
      expenses,
      results,
      settings,
      auditLogs,
      telegramLogs
    ] = await Promise.all([
      getDocs(collection(db, LEADS_COL)),
      getDocs(collection(db, STUDENTS_COL)),
      getDocs(collection(db, TEACHERS_COL)),
      getDocs(collection(db, COURSES_COL)),
      getDocs(collection(db, GROUPS_COL)),
      getDocs(collection(db, PAYMENTS_COL)),
      getDocs(collection(db, EXPENSES_COL)),
      getDocs(collection(db, RESULTS_COL)),
      getDoc(doc(db, SETTINGS_COL, 'center')),
      getDocs(query(collection(db, AUDIT_LOGS_COL), limit(1000))),
      getDocs(query(collection(db, TELEGRAM_LOGS_COL), limit(1000)))
    ]);

    return {
      leads: leads.docs.map(d => ({ id: d.id, ...d.data() })),
      students: students.docs.map(d => ({ id: d.id, ...d.data() })),
      teachers: teachers.docs.map(d => ({ id: d.id, ...d.data() })),
      courses: courses.docs.map(d => ({ id: d.id, ...d.data() })),
      groups: groups.docs.map(d => ({ id: d.id, ...d.data() })),
      payments: payments.docs.map(d => ({ id: d.id, ...d.data() })),
      expenses: expenses.docs.map(d => ({ id: d.id, ...d.data() })),
      results: results.docs.map(d => ({ id: d.id, ...d.data() })),
      settings: settings.exists() ? settings.data() : null,
      auditLogs: auditLogs.docs.map(d => ({ id: d.id, ...d.data() })),
      telegramLogs: telegramLogs.docs.map(d => ({ id: d.id, ...d.data() })),
      exportedAt: new Date().toISOString()
    };
  }
};