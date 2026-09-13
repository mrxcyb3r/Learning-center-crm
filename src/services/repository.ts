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
  Invoice,
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
  Murojaat,
  MurojaatKind,
  MurojaatStatus,
  MurojaatSummary,
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
import { isTelegramSource, normalizeMurojaatStatus, sortMurojaatNewestFirst, summarizeMurojaat, toMurojaat } from '../utils/murojaat';

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
const PUBLIC_RECEIPTS_COL = 'public_receipts';

/**
 * Sanitized per-payment verification mirror. Public read (receipt QR target),
 * contains NO bank/electron trx data, notes or operator identity.
 */
async function writePublicReceiptSummary(paymentId: string, data: PaymentWriteInput): Promise<void> {
  const { resolveCourseName } = await import('../utils/receipt');
  const { canonicalPaymentStatus } = await import('../utils/dashboard');
  const summary = {
    paymentId,
    receiptNumber: data.receiptNumber || data.receiptRef || `REC-${String(paymentId).replace(/[^a-zA-Z0-9]/g, '').slice(-8).toUpperCase()}`,
    amount: Number(data.amount) || 0,
    course: resolveCourseName(data),
    date: data.date || '',
    method: String(data.paymentMethod || data.method || ''),
    status: canonicalPaymentStatus(data.status ?? 'Completed'),
    studentName: String(data.studentName || ''),
    // Carries the owning student so security rules can scope mirror writes
    // (teacher/receptionist of that student) without opening broad access.
    studentId: String((data as { studentId?: unknown }).studentId || ''),
    createdAt: new Date().toISOString(),
  };
  await setDoc(doc(db, PUBLIC_RECEIPTS_COL, paymentId), cleanData(summary));
}
const INVITATIONS_COL = 'teacher_invitations';
const INVOICES_COL = 'invoices';

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
        phoneNumber: data.phoneNumber || data.phone || null,
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
        phoneNumber: data.phoneNumber || data.phone || null,
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
    // NOTE: no server-side orderBy here. Firestore excludes documents that
    // lack the ordered field, so ordering by a sparse field (displayOrder)
    // would silently drop groups. Sort client-side instead.
    const snap = await getDocs(collection(db, GROUPS_COL));
    const groups = snap.docs.map(d => ({ id: d.id, ...d.data() } as Group));
    groups.sort((a, b) => ((a as { displayOrder?: number }).displayOrder ?? 0) - ((b as { displayOrder?: number }).displayOrder ?? 0));
    return groups;
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
 * Invoice number generator.
 *
 * Primary path: the trusted server route POST /api/invoices/number, which is
 * role-checked (admin/superadmin/teacher) and allocates the number inside a
 * server-side transaction — required because Firestore rules deny client-side
 * writes to the `counters` collection for teachers.
 *
 * Fallback: local read-path local transaction (admin-only via rules), so the
 * admin ERP still works even if the API layer is unreachable (e.g. static
 * demo hosting).
 *
 * Format: INV-YYYY-NNNN (e.g., INV-2026-0001)
 */
async function generateInvoiceNumber(): Promise<string> {
  try {
    const token = await auth.currentUser?.getIdToken(true);
    const res = await fetch('/api/invoices/number', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });
    if (res.ok) {
      const data = await res.json();
      if (typeof data.invoiceNumber === 'string' && data.invoiceNumber) {
        return data.invoiceNumber;
      }
    }
  } catch {
    // API layer unreachable — fall through to the local admin path.
  }
  return generateInvoiceNumberLocal();
}

export async function generateInvoiceNumberLocal(): Promise<string> {
  // Pure client-side fallback — MUST NOT touch Firestore. The `counters`
  // collection is admin-only, so a transactional counter here made every
  // teacher/receptionist payment creation fail with permission-denied.
  // Timestamp + randomness keeps numbers unique without a shared counter.
  const year = new Date().getFullYear();
  const rand = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `INV-${year}-${Date.now().toString(36).toUpperCase()}-${rand}`;
}

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
    const { canonicalPaymentStatus } = await import('../utils/dashboard');
    const normalized = { ...data, status: canonicalPaymentStatus(data.status ?? 'Completed') };
    const docRef = await addDoc(collection(db, PAYMENTS_COL), cleanData(normalized));
    writePublicReceiptSummary(docRef.id, normalized).catch(() => undefined);
    return docRef.id;
  },

  async recordPaymentWithInvoice(data: PaymentWriteInput & { teacherId: string; teacherName: string; studentName: string }): Promise<{ paymentId: string; invoiceId: string; invoiceNumber: string }> {
    const invoiceNumber = await generateInvoiceNumber();
    const paymentId = `pay_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const invoiceId = `inv_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const now = new Date().toISOString();
    const paymentDate = data.date || now.split('T')[0];

    const { canonicalPaymentStatus } = await import('../utils/dashboard');
    const paymentData = cleanData({
      ...data,
      id: paymentId,
      invoiceId,
      status: canonicalPaymentStatus((data as { status?: unknown }).status ?? 'Completed'),
      createdAt: now,
    });

    const invoiceData = cleanData({
      id: invoiceId,
      paymentId,
      studentId: data.studentId,
      teacherId: data.teacherId,
      amount: data.amount,
      paymentDate,
      status: 'PAID',
      invoiceNumber,
      createdAt: now,
      studentName: data.studentName,
      teacherName: data.teacherName,
      paymentMethod: data.paymentMethod,
      notes: data.notes,
    });

    const batch = writeBatch(db);
    batch.set(doc(db, PAYMENTS_COL, paymentId), paymentData);
    batch.set(doc(db, INVOICES_COL, invoiceId), invoiceData);
    await batch.commit();

    writePublicReceiptSummary(paymentId, paymentData as PaymentWriteInput).catch(() => undefined);

    return { paymentId, invoiceId, invoiceNumber };
  },

  async voidPayment(id: string, reason: string): Promise<void> {
    await updateDoc(doc(db, PAYMENTS_COL, id), { status: 'Voided', voidReason: reason, voidedAt: new Date().toISOString() });
  }
};

/**
 * Invoices Service
 */
export const invoicesService = {
  async getInvoiceById(invoiceId: string): Promise<Invoice | null> {
    const snap = await getDoc(doc(db, INVOICES_COL, invoiceId));
    return snap.exists() ? ({ id: snap.id, ...snap.data() } as Invoice) : null;
  },

  async getInvoicesByTeacher(teacherUid: string): Promise<Invoice[]> {
    const q = query(collection(db, INVOICES_COL), where('teacherId', '==', teacherUid), orderBy('createdAt', 'desc'));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as Invoice));
  },

  async getInvoicesByPaymentId(paymentId: string): Promise<Invoice | null> {
    const q = query(collection(db, INVOICES_COL), where('paymentId', '==', paymentId), limit(1));
    const snap = await getDocs(q);
    return snap.empty ? null : ({ id: snap.docs[0].id, ...snap.docs[0].data() } as Invoice);
  },

  async getAllInvoices(): Promise<Invoice[]> {
    const snap = await getDocs(query(collection(db, INVOICES_COL), orderBy('createdAt', 'desc')));
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as Invoice));
  },
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

  async getLeadsBySource(source: string): Promise<Lead[]> {
    try {
      // Query without composite index requirement, sort in memory
      const snap = await getDocs(
        query(collection(db, LEADS_COL), where('source', '==', source))
      );
      return snap.docs
        .map(d => ({ id: d.id, ...d.data() } as Lead))
        .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
    } catch {
      // Fallback: fetch all leads and filter in memory if composite index is required
      const all = await leadsService.getAllLeads().catch(() => []);
      return all.filter(l => (l.source || '').toLowerCase() === source.toLowerCase());
    }
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
      enrollmentDate,
      convertedStudentId: studentRef.id,
      conversionDate: new Date().toISOString(),
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

const LEAD_TIMELINE_COL = 'lead_timeline';

export type LeadTimelineEventType =
  | 'created'
  | 'called'
  | 'telegram_contacted'
  | 'note_added'
  | 'status_changed'
  | 'trial_scheduled'
  | 'trial_attended'
  | 'converted'
  | 'lost'
  | 'follow_up';

export interface LeadTimelineEvent {
  id: string;
  leadId: string;
  type: LeadTimelineEventType;
  message: string;
  actor?: string;
  actorUid?: string;
  createdAt: string;
}

/**
 * Append-only per-lead activity timeline (front-desk CRM audit trail).
 * Writes are best-effort: a timeline failure must never break the lead
 * operation itself.
 */
export const leadTimelineService = {
  async log(
    leadId: string,
    type: LeadTimelineEventType,
    message: string,
    actor?: string,
    actorUid?: string
  ): Promise<void> {
    try {
      await addDoc(collection(db, LEAD_TIMELINE_COL), cleanData({
        leadId,
        type,
        message: message.slice(0, 1000),
        actor: actor || '',
        actorUid: actorUid || '',
        createdAt: new Date().toISOString(),
        isDemo: true,
      }));
    } catch (err) {
      console.warn('[leadTimeline] append failed (best-effort):', err);
    }
  },

  async getForLead(leadId: string): Promise<LeadTimelineEvent[]> {
    try {
      const snap = await getDocs(
        query(collection(db, LEAD_TIMELINE_COL), where('leadId', '==', leadId))
      );
      return snap.docs
        .map(d => ({ id: d.id, ...d.data() } as LeadTimelineEvent))
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    } catch {
      return [];
    }
  },

  subscribeToLead(leadId: string, callback: (events: LeadTimelineEvent[]) => void) {
    try {
      return onSnapshot(
        query(collection(db, LEAD_TIMELINE_COL), where('leadId', '==', leadId)),
        (snap) => callback(
          snap.docs
            .map(d => ({ id: d.id, ...d.data() } as LeadTimelineEvent))
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        ),
        () => callback([])
      );
    } catch {
      callback([]);
      return () => {};
    }
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
  },

  async getAllQuestions(): Promise<Record<string, any>[]> {
    try {
      const snap = await getDocs(query(collection(db, QUESTIONS_COL), orderBy('createdAt', 'desc')));
      return snap.docs.map(d => ({ id: d.id, ...d.data() }));
    } catch {
      const snap = await getDocs(collection(db, QUESTIONS_COL)).catch(() => ({ docs: [] } as any));
      return snap.docs.map((d: any) => ({ id: d.id, ...d.data() }));
    }
  },

  async getQuestionsBySource(source: string): Promise<any[]> {
    try {
      const snap = await getDocs(
        query(collection(db, QUESTIONS_COL), where('source', '==', source))
      );
      return snap.docs
        .map(d => ({ id: d.id, ...d.data() } as Record<string, any>))
        .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
    } catch {
      // Fallback: fetch without where/orderBy filter if composite index is missing
      const snap = await getDocs(collection(db, QUESTIONS_COL)).catch(() => ({ docs: [] } as any));
      return snap.docs
        .map((d: any) => ({ id: d.id, ...d.data() }))
        .filter((q: any) => (q.source || '').toLowerCase() === source.toLowerCase())
        .sort((a: any, b: any) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
    }
  },

  async updateQuestion(id: string, data: Partial<Record<string, any>>): Promise<void> {
    await updateDoc(doc(db, QUESTIONS_COL, id), cleanData(data));
  },
};

/**
 * Unified "Murojaatlar" inbox service.
 *
 * Read-side projection over the existing `leads` (trial applications) and
 * `questions` collections — nothing is duplicated or migrated. Admin mutations
 * write back to the origin document additively (isRead / status / notes /
 * updatedAt) and are protected by the existing admin-only rules.
 */
export const murojaatlarService = {
  async getAll(): Promise<Murojaat[]> {
    const [leadDocs, questionDocs] = await Promise.all([
      leadsService.getAllLeads().catch(() => []),
      questionsService.getAllQuestions().catch(() => []),
    ]);
    const list: Murojaat[] = [
      ...leadDocs.map((l) => toMurojaat(l as unknown as Record<string, any>, 'trial')),
      ...questionDocs.map((q) => toMurojaat(q, 'question')),
    ];
    return sortMurojaatNewestFirst(list);
  },

  async getSummary(): Promise<MurojaatSummary> {
    return summarizeMurojaat(await murojaatlarService.getAll());
  },

  async markRead(id: string, kind: MurojaatKind, isRead: boolean): Promise<void> {
    const patch = { isRead, updatedAt: new Date().toISOString() };
    if (kind === 'trial') await leadsService.updateLead(id, patch);
    else await questionsService.updateQuestion(id, patch);
  },

  async setStatus(id: string, kind: MurojaatKind, status: MurojaatStatus): Promise<void> {
    const patch = { status, updatedAt: new Date().toISOString() };
    if (kind === 'trial') await leadsService.updateLead(id, patch);
    else await questionsService.updateQuestion(id, patch);
  },

  // Internal admin notes only. The customer/booking `notes` field on the
  // origin document is deliberately left untouched (data-safety: no overwrite).
  async setAdminNotes(id: string, kind: MurojaatKind, notes: string): Promise<void> {
    const patch = { adminNotes: notes, updatedAt: new Date().toISOString() };
    if (kind === 'trial') await leadsService.updateLead(id, patch);
    else await questionsService.updateQuestion(id, patch);
  },

  // AI Receptionist result persistence. Additive only — writes the AI answer
  // and routing metadata back to the origin document without touching
  // customer/booking fields. Escalated conversations stay unread so the
  // receptionist inbox surfaces them as needing a human response.
  async saveAiResult(
    id: string,
    kind: MurojaatKind,
    result: {
      answer: string | null;
      intent: string | null;
      sources: string[];
      escalated: boolean;
      escalationReason: string | null;
      escalatedTo: 'receptionist' | 'teacher' | 'admin' | null;
    }
  ): Promise<void> {
    const patch: Record<string, unknown> = {
      aiAnswered: result.answer !== null && !result.escalated,
      aiEscalated: result.escalated,
      updatedAt: new Date().toISOString(),
    };
    if (result.answer !== null) patch.aiAnswer = result.answer;
    if (result.intent) patch.aiIntent = result.intent;
    if (result.sources.length > 0) patch.aiSources = result.sources;
    if (result.escalationReason) patch.escalationReason = result.escalationReason;
    if (result.escalatedTo) {
      patch.escalatedTo = result.escalatedTo;
      patch.isRead = false;
    }
    if (kind === 'trial') await leadsService.updateLead(id, patch);
    else await questionsService.updateQuestion(id, patch);
  },

  // Convenience accessor so callers can compute the unread badge in one call.
  getNormalizedStatus: normalizeMurojaatStatus,
  isTelegramSource,
};

export interface TelegramStats {
  totalLeads: number;
  totalQuestions: number;
  todayLeads: number;
  todayQuestions: number;
  recent: Array<{
    id: string;
    kind: 'lead' | 'question';
    name: string;
    course: string;
    phone: string;
    createdAt: string;
  }>;
}

export const telegramStatsService = {
  async getStats(): Promise<TelegramStats> {
    const [leads, questions] = await Promise.all([
      leadsService.getLeadsBySource('telegram'),
      questionsService.getQuestionsBySource('telegram'),
    ]);
    const today = new Date().toISOString().split('T')[0];
    const recent = [
      ...leads.slice(0, 12).map(l => ({
        id: l.id,
        kind: 'lead' as const,
        name: l.name || 'Noma\'lum',
        course: l.course || 'Kurs ko\'rsatilmagan',
        phone: l.phone || '—',
        createdAt: l.createdAt || '',
      })),
      ...questions.slice(0, 12).map(q => ({
        id: q.id,
        kind: 'question' as const,
        name: q.fullName || 'Noma\'lum',
        course: q.subject || 'Savol',
        phone: q.phone || '—',
        createdAt: q.createdAt || '',
      })),
    ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 12);
    return {
      totalLeads: leads.length,
      totalQuestions: questions.length,
      todayLeads: leads.filter(l => (l.createdAt || '').startsWith(today)).length,
      todayQuestions: questions.filter(q => (q.createdAt || '').startsWith(today)).length,
      recent,
    };
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
 * FAQs Service - shared by Admin CMS and the public landing page.
 * The landing reads this same collection (see landingCmsService.getFaqs),
 * so Admin edits here appear on the public site after reload.
 */
export interface FaqRecord {
  id: string;
  question: string;
  answer: string;
  order?: number;
}

export const faqsService = {
  async getAllFaqs(): Promise<FaqRecord[]> {
    const snap = await getDocs(query(collection(db, FAQS_COL), orderBy('order', 'asc')));
    return snap.docs.map((d) => ({ id: d.id, ...d.data() } as FaqRecord));
  },

  async createFaq(data: Omit<FaqRecord, 'id'>): Promise<string> {
    const docRef = await addDoc(collection(db, FAQS_COL), cleanData(data));
    return docRef.id;
  },

  async updateFaq(id: string, data: Partial<FaqRecord>): Promise<void> {
    await updateDoc(doc(db, FAQS_COL, id), cleanData(data));
  },

  async deleteFaq(id: string): Promise<void> {
    await deleteDoc(doc(db, FAQS_COL, id));
  },

  subscribeToFaqs(callback: (faqs: FaqRecord[]) => void) {
    return onSnapshot(
      query(collection(db, FAQS_COL), orderBy('order', 'asc')),
      (snap) => callback(snap.docs.map((d) => ({ id: d.id, ...d.data() } as FaqRecord)))
    );
  }
};

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
    // `date` is required: date-ordered reads exclude documents lacking it.
    const today = new Date().toISOString().split('T')[0];
    const docRef = await addDoc(collection(db, RESULTS_COL), cleanData({
      date: today,
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