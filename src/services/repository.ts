import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  writeBatch,
  serverTimestamp
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
const NOTIFICATIONS_COL = 'notifications';
const SETTINGS_COL = 'settings';
const COURSES_COL = 'courses';
const TEACHERS_COL = 'teachers';
const RESULTS_COL = 'results';
const FAQS_COL = 'faqs';
const BRANCHES_COL = 'branches';
const TESTIMONIALS_COL = 'testimonials';

/**
 * User Service - Canonical user management
 */
export const userService = {
  async getUserProfile(uid: string): Promise<UserProfile | null> {
    const docRef = doc(db, USERS_COL, uid);
    const snap = await getDoc(docRef);
    return snap.exists() ? (snap.data() as UserProfile) : null;
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
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as UserProfile));
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
    const docRef = await setDoc(doc(collection(db, COURSES_COL)), cleanData(data));
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
    const docRef = await setDoc(doc(collection(db, TEACHERS_COL)), cleanData(data));
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
  }
};

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

  async createGroup(data: Omit<Group, 'id'>): Promise<string> {
    const docRef = await setDoc(doc(collection(db, GROUPS_COL)), cleanData(data));
    return docRef.id;
  },

  async updateGroup(id: string, data: Partial<Group>): Promise<void> {
    await updateDoc(doc(db, GROUPS_COL, id), cleanData(data));
  },

  subscribeToGroupsByTeacher(teacherUid: string, callback: (groups: Group[]) => void) {
    const q = query(collection(db, GROUPS_COL), where('teacherId', '==', teacherUid));
    return onSnapshot(q, (snap) => {
      callback(snap.docs.map(d => ({ id: d.id, ...d.data() } as Group)));
    });
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

  async createStudent(data: Omit<Student, 'id'>): Promise<string> {
    const docRef = await setDoc(doc(collection(db, STUDENTS_COL)), cleanData(data));
    return docRef.id;
  },

  async updateStudent(id: string, data: Partial<Student>): Promise<void> {
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

  async recordPayment(data: Omit<Payment, 'id'>): Promise<string> {
    const docRef = await setDoc(doc(collection(db, PAYMENTS_COL)), cleanData(data));
    return docRef.id;
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
  async getHomeworkByTeacher(teacherEmail: string): Promise<Assignment[]> {
    const q = query(collection(db, HOMEWORK_COL), where('teacherEmail', '==', teacherEmail));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as Assignment));
  },

  async createHomework(data: any): Promise<string> {
    const docRef = await setDoc(doc(collection(db, HOMEWORK_COL)), cleanData(data));
    return docRef.id;
  },

  async updateHomework(id: string, data: any): Promise<void> {
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
    const docRef = await setDoc(doc(collection(db, NOTIFICATIONS_COL)), cleanData(data));
    return docRef.id;
  },

  async markAsRead(id: string): Promise<void> {
    await updateDoc(doc(db, NOTIFICATIONS_COL, id), { isRead: true });
  }
};