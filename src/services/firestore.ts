import {
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  where,
  orderBy,
  writeBatch
} from 'firebase/firestore';
import { db, auth } from './firebase';
import {
  Group,
  Student,
  Payment,
  AttendanceRecord,
  Assignment,
  FeedPost,
  MockTestScore,
  LeadSubmission,
  Inquiry
} from '../types';

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
  };
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
    },
    operationType,
    path
  };
  console.warn('Firestore Operation Notice:', JSON.stringify(errInfo));
  return null;
}

// Collections
const GROUPS_COL = 'groups';
const STUDENTS_COL = 'students';
const PAYMENTS_COL = 'payments';
const ATTENDANCE_COL = 'attendance';
const ASSIGNMENTS_COL = 'assignments';
const FEED_POSTS_COL = 'feed_posts';
const MOCK_SCORES_COL = 'mock_scores';
const LEADS_COL = 'leads';
const INQUIRIES_COL = 'inquiries';

/* =========================================================================
   GROUPS SERVICE
   ========================================================================= */
export function subscribeGroups(callback: (groups: Group[]) => void) {
  try {
    return onSnapshot(
      collection(db, GROUPS_COL),
      (snapshot) => {
        const items: Group[] = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...(doc.data() as Omit<Group, 'id'>)
        }));
        callback(items);
      },
      (error) => {
        console.warn('Firestore subscribeGroups notice:', error);
        callback([]);
      }
    );
  } catch (error) {
    console.warn('Firestore subscribeGroups error:', error);
    callback([]);
    return () => {};
  }
}

export async function addGroup(data: Omit<Group, 'id'>) {
  try {
    const docRef = await addDoc(collection(db, GROUPS_COL), data);
    return docRef.id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, GROUPS_COL);
  }
}

export async function updateGroup(id: string, data: Partial<Group>) {
  try {
    await updateDoc(doc(db, GROUPS_COL, id), data);
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `${GROUPS_COL}/${id}`);
  }
}

export async function deleteGroup(id: string) {
  try {
    await deleteDoc(doc(db, GROUPS_COL, id));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `${GROUPS_COL}/${id}`);
  }
}

/* =========================================================================
   STUDENTS SERVICE
   ========================================================================= */
export function subscribeStudents(callback: (students: Student[]) => void) {
  try {
    return onSnapshot(
      collection(db, STUDENTS_COL),
      (snapshot) => {
        const items: Student[] = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...(doc.data() as Omit<Student, 'id'>)
        }));
        callback(items);
      },
      (error) => {
        console.warn('Firestore subscribeStudents notice:', error);
        callback([]);
      }
    );
  } catch (error) {
    console.warn('Firestore subscribeStudents error:', error);
    callback([]);
    return () => {};
  }
}

export async function addStudent(data: Omit<Student, 'id'>) {
  try {
    const docRef = await addDoc(collection(db, STUDENTS_COL), data);
    return docRef.id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, STUDENTS_COL);
  }
}

export async function updateStudent(id: string, data: Partial<Student>) {
  try {
    await updateDoc(doc(db, STUDENTS_COL, id), data);
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `${STUDENTS_COL}/${id}`);
    throw error;
  }
}

export async function updateStudentPaymentStatus(
  studentId: string,
  newStatus: 'paid' | 'pending' | 'overdue'
) {
  try {
    const todayStr = new Date().toISOString().split('T')[0];
    const updateData: Partial<Student> = {
      paymentStatus: newStatus
    };
    if (newStatus === 'paid') {
      updateData.lastPaymentDate = todayStr;
    }
    await updateDoc(doc(db, STUDENTS_COL, studentId), updateData);
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `${STUDENTS_COL}/${studentId}`);
    throw error;
  }
}

export async function deleteStudent(id: string) {
  try {
    await deleteDoc(doc(db, STUDENTS_COL, id));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `${STUDENTS_COL}/${id}`);
  }
}

/* =========================================================================
   PAYMENTS SERVICE
   ========================================================================= */
export function subscribePayments(callback: (payments: Payment[]) => void) {
  try {
    return onSnapshot(
      collection(db, PAYMENTS_COL),
      (snapshot) => {
        const items: Payment[] = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...(doc.data() as Omit<Payment, 'id'>)
        }));
        items.sort((a, b) => (a.date < b.date ? 1 : -1));
        callback(items);
      },
      (error) => {
        console.warn('Firestore subscribePayments notice:', error);
        callback([]);
      }
    );
  } catch (error) {
    console.warn('Firestore subscribePayments error:', error);
    callback([]);
    return () => {};
  }
}

export async function recordPaymentAndSetPaid(
  studentId: string,
  studentName: string,
  amount: number,
  paymentMethod: 'cash' | 'card' | 'click' | 'payme' | string,
  recordedBy: string
) {
  try {
    const todayStr = new Date().toISOString().split('T')[0];

    const paymentData: Omit<Payment, 'id'> = {
      studentId,
      studentName,
      amount,
      paymentMethod,
      date: todayStr,
      recordedBy,
      status: 'paid'
    };
    const paymentRef = await addDoc(collection(db, PAYMENTS_COL), paymentData);

    if (studentId) {
      await updateDoc(doc(db, STUDENTS_COL, studentId), {
        paymentStatus: 'paid',
        lastPaymentDate: todayStr
      });
    }

    return paymentRef.id;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, PAYMENTS_COL);
  }
}

export async function updatePaymentStatus(paymentId: string, status: 'paid' | 'pending' | 'refunded') {
  try {
    await updateDoc(doc(db, PAYMENTS_COL, paymentId), { status });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `${PAYMENTS_COL}/${paymentId}`);
  }
}

/* =========================================================================
   TEACHER ATTENDANCE SERVICE
   ========================================================================= */
export async function saveAttendanceRecord(
  groupId: string,
  date: string,
  records: { [studentId: string]: 'present' | 'absent' | 'late' },
  recordedBy: string
) {
  try {
    const recordId = `${groupId}_${date}`;
    await setDoc(doc(db, ATTENDANCE_COL, recordId), {
      groupId,
      date,
      records,
      recordedBy,
      updatedAt: new Date().toISOString()
    });
    return recordId;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `${ATTENDANCE_COL}/${groupId}_${date}`);
  }
}

export async function getAttendanceRecord(groupId: string, date: string): Promise<AttendanceRecord | null> {
  try {
    const recordId = `${groupId}_${date}`;
    const snap = await getDoc(doc(db, ATTENDANCE_COL, recordId));
    if (snap.exists()) {
      return { id: snap.id, ...(snap.data() as Omit<AttendanceRecord, 'id'>) };
    }
    return null;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, `${ATTENDANCE_COL}/${groupId}_${date}`);
    return null;
  }
}

/* =========================================================================
   ASSIGNMENTS SERVICE
   ========================================================================= */
export function subscribeAssignments(callback: (assignments: Assignment[]) => void) {
  try {
    return onSnapshot(
      collection(db, ASSIGNMENTS_COL),
      (snapshot) => {
        const items: Assignment[] = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...(doc.data() as Omit<Assignment, 'id'>)
        }));
        callback(items);
      },
      (error) => {
        console.warn('Firestore subscribeAssignments notice:', error);
        callback([]);
      }
    );
  } catch (error) {
    console.warn('Firestore subscribeAssignments error:', error);
    callback([]);
    return () => {};
  }
}

export async function addAssignment(data: Omit<Assignment, 'id'>) {
  try {
    const docRef = await addDoc(collection(db, ASSIGNMENTS_COL), {
      ...data,
      createdAt: new Date().toISOString()
    });
    return docRef.id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, ASSIGNMENTS_COL);
  }
}

export async function deleteAssignment(id: string) {
  try {
    await deleteDoc(doc(db, ASSIGNMENTS_COL, id));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `${ASSIGNMENTS_COL}/${id}`);
  }
}

/* =========================================================================
   FEED POSTS SERVICE
   ========================================================================= */
export function subscribeFeedPosts(callback: (posts: FeedPost[]) => void) {
  try {
    return onSnapshot(
      collection(db, FEED_POSTS_COL),
      (snapshot) => {
        const items: FeedPost[] = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...(doc.data() as Omit<FeedPost, 'id'>)
        }));
        callback(items);
      },
      (error) => {
        console.warn('Firestore subscribeFeedPosts notice:', error);
        callback([]);
      }
    );
  } catch (error) {
    console.warn('Firestore subscribeFeedPosts error:', error);
    callback([]);
    return () => {};
  }
}

export async function addFeedPost(data: Omit<FeedPost, 'id'>) {
  try {
    const docRef = await addDoc(collection(db, FEED_POSTS_COL), data);
    return docRef.id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, FEED_POSTS_COL);
  }
}

export async function addPostComment(postId: string, commentText: string, authorName: string) {
  try {
    const postRef = doc(db, FEED_POSTS_COL, postId);
    const snap = await getDoc(postRef);
    if (snap.exists()) {
      const currentComments = snap.data().comments || [];
      const newComment = {
        id: Date.now().toString(),
        author: authorName,
        text: commentText,
        date: new Date().toISOString()
      };
      await updateDoc(postRef, {
        comments: [...currentComments, newComment]
      });
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `${FEED_POSTS_COL}/${postId}`);
  }
}

/* =========================================================================
   MOCK EXAM SCORES & GRADEBOOK SERVICE
   ========================================================================= */
export function subscribeMockScores(callback: (scores: MockTestScore[]) => void) {
  try {
    return onSnapshot(
      collection(db, MOCK_SCORES_COL),
      (snapshot) => {
        const items: MockTestScore[] = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...(doc.data() as Omit<MockTestScore, 'id'>)
        }));
        callback(items);
      },
      (error) => {
        console.warn('Firestore subscribeMockScores notice:', error);
        callback([]);
      }
    );
  } catch (error) {
    console.warn('Firestore subscribeMockScores error:', error);
    callback([]);
    return () => {};
  }
}

export async function saveMockScore(data: Omit<MockTestScore, 'id'>) {
  try {
    const docRef = await addDoc(collection(db, MOCK_SCORES_COL), data);
    return docRef.id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, MOCK_SCORES_COL);
  }
}

/* =========================================================================
   LEADS SERVICE
   ========================================================================= */
export async function addLeadSubmission(lead: Omit<LeadSubmission, 'id'>) {
  try {
    const docRef = await addDoc(collection(db, LEADS_COL), lead);
    return docRef.id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, LEADS_COL);
  }
}

export function subscribeLeads(callback: (leads: LeadSubmission[]) => void) {
  try {
    return onSnapshot(
      collection(db, LEADS_COL),
      (snapshot) => {
        const items: LeadSubmission[] = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...(doc.data() as Omit<LeadSubmission, 'id'>)
        }));
        callback(items);
      },
      (error) => {
        console.warn('Firestore subscribeLeads notice:', error);
        callback([]);
      }
    );
  } catch (error) {
    console.warn('Firestore subscribeLeads error:', error);
    callback([]);
    return () => {};
  }
}

/* =========================================================================
   INQUIRIES SERVICE
   ========================================================================= */
export function subscribeInquiries(callback: (inquiries: Inquiry[]) => void) {
  try {
    return onSnapshot(
      collection(db, INQUIRIES_COL),
      (snapshot) => {
        const items: Inquiry[] = snapshot.docs.map((docSnap) => {
          const data = docSnap.data();
          let createdAtStr = new Date().toISOString();
          if (data.createdAt) {
            if (typeof data.createdAt === 'string') {
              createdAtStr = data.createdAt;
            } else if (data.createdAt?.toDate) {
              createdAtStr = data.createdAt.toDate().toISOString();
            }
          }
          return {
            id: docSnap.id,
            fullName: data.fullName || data.name || 'Anonymous',
            phoneNumber: data.phoneNumber || data.phone || '',
            selectedCourse: data.selectedCourse || data.courseId || 'General English',
            message: data.message || '',
            status: data.status || 'new',
            createdAt: createdAtStr
          };
        });
        callback(items);
      },
      (error) => {
        console.warn('Firestore subscribeInquiries notice:', error);
        callback([]);
      }
    );
  } catch (error) {
    console.warn('Firestore subscribeInquiries error:', error);
    callback([]);
    return () => {};
  }
}

export async function addInquiry(inquiry: Omit<Inquiry, 'id'>) {
  try {
    const docRef = await addDoc(collection(db, INQUIRIES_COL), inquiry);
    return docRef.id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, INQUIRIES_COL);
  }
}

export async function updateInquiryStatus(
  id: string,
  status: 'new' | 'contacted' | 'enrolled' | 'dismissed'
) {
  try {
    await updateDoc(doc(db, INQUIRIES_COL, id), { status });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `${INQUIRIES_COL}/${id}`);
    try {
      await updateDoc(doc(db, LEADS_COL, id), { status });
    } catch (e) {
      // ignore
    }
  }
}

export async function convertInquiryToStudentBatch(
  inquiryId: string,
  studentData: Omit<Student, 'id'>,
  defaultPassword?: string
) {
  try {
    const batch = writeBatch(db);

    // 1. Create new student document
    const studentRef = doc(collection(db, STUDENTS_COL));
    batch.set(studentRef, {
      ...studentData,
      createdAt: new Date().toISOString()
    });

    // 2. Create user record for student login portal
    const userRef = doc(collection(db, 'users'));
    batch.set(userRef, {
      fullName: studentData.fullName,
      phone: studentData.phone,
      role: 'student',
      groupId: studentData.groupId,
      groupName: studentData.groupName,
      createdAt: new Date().toISOString()
    });

    // 3. Update inquiry status to enrolled
    const inquiryRef = doc(db, INQUIRIES_COL, inquiryId);
    batch.update(inquiryRef, { status: 'enrolled' });

    await batch.commit();
    return studentRef.id;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `${INQUIRIES_COL}/${inquiryId}`);
    // Fallback if batch write hits offline or error
    const studentId = await addStudent(studentData);
    await updateInquiryStatus(inquiryId, 'enrolled');
    return studentId;
  }
}

/* =========================================================================
   INITIAL DB SEEDER (IF EMPTY)
   ========================================================================= */
export async function seedFirestoreIfEmpty() {
  try {
    const groupSnap = await getDocs(collection(db, GROUPS_COL));
    if (groupSnap.empty) {
      const g1Id = await addGroup({
        name: 'IELTS Intensive #12',
        courseType: 'IELTS 7.5+ Rocket',
        teacherId: 'teacher-1',
        teacherName: 'Mr. Javohirbek',
        scheduleTime: 'Mon/Wed/Fri 14:00 - 16:00',
        room: 'Room 3 (Renessans Main)',
        activeStudentsCount: 14
      });

      const g2Id = await addGroup({
        name: 'General English B2',
        courseType: 'CEFR B2 FastTrack',
        teacherId: 'teacher-2',
        teacherName: 'Ms. Shahlo',
        scheduleTime: 'Tue/Thu/Sat 16:30 - 18:00',
        room: 'Room 1',
        activeStudentsCount: 12
      });

      if (g1Id) {
        await addStudent({
          fullName: 'Jasur Rahimov',
          phone: '+998 90 123 45 67',
          groupId: g1Id,
          groupName: 'IELTS Intensive #12',
          tuitionFee: 650000,
          paymentStatus: 'paid',
          lastPaymentDate: new Date().toISOString().split('T')[0]
        });

        await addStudent({
          fullName: 'Malika Sharipova',
          phone: '+998 91 234 56 78',
          groupId: g1Id,
          groupName: 'IELTS Intensive #12',
          tuitionFee: 650000,
          paymentStatus: 'pending',
          lastPaymentDate: '2026-06-15'
        });
      }
    }
  } catch (err) {
    console.warn('seedFirestoreIfEmpty notice:', err);
  }
}

