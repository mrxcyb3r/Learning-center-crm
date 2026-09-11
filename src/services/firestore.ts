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
  Inquiry,
  AppNotification,
  SubmissionAttachment
} from '../types';

const NOTIFICATIONS_COL = 'notifications';

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

// Utility to recursively strip undefined keys from objects before sending to Firestore
export function cleanData<T>(obj: T): T {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }
  if (Array.isArray(obj)) {
    return obj.map(cleanData) as unknown as T;
  }
  const cleaned: any = {};
  for (const key of Object.keys(obj as any)) {
    const value = (obj as any)[key];
    if (value !== undefined) {
      cleaned[key] = typeof value === 'object' && value !== null ? cleanData(value) : value;
    }
  }
  return cleaned as T;
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
  console.warn("⚠️ Firestore Write Notice (Handled Gracefully):", JSON.stringify(errInfo));
  return null;
}

export const SUPER_ADMIN_UID = 'CI1sJzLxSrQHvvCwFQnHqeVHxrs2';

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
  recordedBy: string,
  extraDetails?: {
    cohortGroup?: string;
    subjectCategory?: string;
    paymentPeriod?: string;
    receiptRef?: string;
    notes?: string;
  }
) {
  try {
    const todayStr = new Date().toISOString().split('T')[0];

    const rawPaymentData = {
      studentId,
      studentName,
      amount,
      paymentMethod,
      date: todayStr,
      recordedBy,
      status: 'paid',
      cohortGroup: extraDetails?.cohortGroup,
      subjectCategory: extraDetails?.subjectCategory,
      paymentPeriod: extraDetails?.paymentPeriod,
      receiptRef: extraDetails?.receiptRef,
      notes: extraDetails?.notes
    };
    const paymentData = cleanData(rawPaymentData);
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
  records: { [studentId: string]: any },
  recordedBy: string
) {
  try {
    const recordId = `${groupId}_${date}`;
    const payload = cleanData({
      groupId,
      date,
      records,
      recordedBy,
      updatedBy: recordedBy,
      updatedAt: new Date().toISOString()
    });
    await setDoc(doc(db, ATTENDANCE_COL, recordId), payload, { merge: true });
    console.log("✅ Firestore Write Success: attendance", recordId, payload);
    return recordId;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `${ATTENDANCE_COL}/${groupId}_${date}`);
  }
}

export const saveGroupAttendance = saveAttendanceRecord;

export function subscribeAttendance(callback: (records: AttendanceRecord[]) => void) {
  try {
    return onSnapshot(
      collection(db, ATTENDANCE_COL),
      (snapshot) => {
        const items: AttendanceRecord[] = snapshot.docs.map((docSnap) => ({
          id: docSnap.id,
          ...(docSnap.data() as Omit<AttendanceRecord, 'id'>)
        }));
        callback(items);
      },
      (error) => {
        console.warn('Firestore subscribeAttendance notice:', error);
        callback([]);
      }
    );
  } catch (error) {
    console.warn('Firestore subscribeAttendance error:', error);
    callback([]);
    return () => {};
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
      collection(db, "homework"),
      (snapshot) => {
        if (!snapshot.empty) {
          const items: Assignment[] = snapshot.docs.map((docSnap) => {
            const d = docSnap.data();
            return {
              id: docSnap.id,
              title: d.title || 'Assignment',
              group: d.group || d.groupName || 'Matematika & Fizika — DTM 1-guruh',
              groupName: d.groupName || d.group || 'Matematika & Fizika — DTM 1-guruh',
              groupId: d.groupId || 'Br2GDIO86SR5GcqfbmOD',
              dueDate: d.dueDate || d.deadline || '2026-08-15',
              deadline: d.deadline || d.dueDate || '2026-08-15',
              submittedCount: d.submittedCount ?? 0,
              totalStudents: d.totalStudents ?? 14,
              file: d.file || d.fileName || 'Assignment.pdf',
              fileName: d.fileName || d.file || 'Assignment.pdf',
              fileUrl: d.fileUrl || '',
              audioUrl: d.audioUrl || '',
              pdfUrl: d.pdfUrl || '',
              description: d.description || '',
              instructions: d.instructions || d.description || '',
              subjectCategory: d.subjectCategory || 'Mathematics & Geometry',
              resourceFormat: d.resourceFormat || 'Problem Set / Quiz Sheet',
              teacherName: d.teacherName || 'Jasur Alimov',
              teacherEmail: d.teacherEmail || '',
              createdAt: d.createdAt
            };
          });
          callback(items);
        } else {
          // Fallback to legacy assignments collection if homework is empty
          getDocs(collection(db, ASSIGNMENTS_COL)).then((legacySnap) => {
            const legacyItems: Assignment[] = legacySnap.docs.map((docSnap) => {
              const d = docSnap.data();
              return {
                id: docSnap.id,
                title: d.title || 'Assignment',
                group: d.group || d.groupName || 'Matematika & Fizika — DTM 1-guruh',
                groupName: d.groupName || d.group || 'Matematika & Fizika — DTM 1-guruh',
                groupId: d.groupId || 'Br2GDIO86SR5GcqfbmOD',
                dueDate: d.dueDate || d.deadline || '2026-08-15',
                deadline: d.deadline || d.dueDate || '2026-08-15',
                submittedCount: d.submittedCount ?? 0,
                totalStudents: d.totalStudents ?? 14,
                file: d.file || d.fileName || 'Assignment.pdf',
                fileName: d.fileName || d.file || 'Assignment.pdf',
                fileUrl: d.fileUrl || '',
                audioUrl: d.audioUrl || '',
                pdfUrl: d.pdfUrl || '',
                description: d.description || '',
                instructions: d.instructions || d.description || '',
                subjectCategory: d.subjectCategory || 'Mathematics & Geometry',
                resourceFormat: d.resourceFormat || 'Problem Set / Quiz Sheet',
                teacherName: d.teacherName || 'Jasur Alimov',
                teacherEmail: d.teacherEmail || '',
                createdAt: d.createdAt
              };
            });
            callback(legacyItems);
          }).catch(() => callback([]));
        }
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

export async function addAssignment(data: any) {
  try {
    const payload = cleanData({
      groupId: data.groupId || 'Br2GDIO86SR5GcqfbmOD',
      groupName: data.group || data.groupName || 'Matematika & Fizika — DTM 1-guruh',
      group: data.group || data.groupName || 'Matematika & Fizika — DTM 1-guruh',
      title: data.title || '',
      description: data.description || '',
      instructions: data.instructions || data.description || '',
      subjectCategory: data.subjectCategory || 'Mathematics & Geometry',
      resourceFormat: data.resourceFormat || 'Problem Set / Quiz Sheet',
      fileName: data.file || data.fileName || 'Assignment_Guide.pdf',
      file: data.file || data.fileName || 'Assignment_Guide.pdf',
      fileUrl: data.fileUrl || '',
      audioUrl: data.audioUrl || '',
      pdfUrl: data.pdfUrl || '',
      dueDate: data.dueDate || data.deadline || new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
      deadline: data.dueDate || data.deadline || new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
      submittedCount: data.submittedCount ?? 0,
      totalStudents: data.totalStudents ?? 14,
      createdAt: new Date().toISOString(),
      teacherId: auth.currentUser?.uid || '',
      teacherEmail: auth.currentUser?.email || '',
      teacherName: auth.currentUser?.displayName || "Jasur Alimov"
    });

    try {
      const docRef = await addDoc(collection(db, "homework"), payload);
      try {
        await setDoc(doc(db, ASSIGNMENTS_COL, docRef.id), payload, { merge: true });
      } catch (e) {
        // secondary write
      }
      // Maintain the group's homework index for ID-driven teacher reads.
      try {
        const { updateDoc: _updateDoc, arrayUnion: _arrayUnion } = await import('firebase/firestore');
        const gid = (payload as { groupId?: string }).groupId;
        if (typeof gid === 'string' && gid) {
          await _updateDoc(doc(db, GROUPS_COL, gid), { homeworkIds: _arrayUnion(docRef.id) });
        }
      } catch {
        // Index maintenance is best-effort; the homework doc itself is saved.
      }
      console.log("✅ Firestore Write Success (Homework Created):", docRef.id, payload);
      return docRef.id;
    } catch (primaryError) {
      try {
        const docRef = await addDoc(collection(db, ASSIGNMENTS_COL), payload);
        console.log("✅ Firestore Write Success (Assignments Created):", docRef.id, payload);
        return docRef.id;
      } catch (secondaryError) {
        handleFirestoreError(secondaryError, OperationType.CREATE, "homework");
        return `local_assignment_${Date.now()}`;
      }
    }
  } catch (outerErr) {
    handleFirestoreError(outerErr, OperationType.CREATE, "homework");
    return `local_assignment_${Date.now()}`;
  }
}

export async function updateAssignment(id: string, data: any) {
  try {
    const payload = cleanData({
      ...data,
      updatedAt: new Date().toISOString()
    });
    await setDoc(doc(db, "homework", id), payload, { merge: true });
    try {
      await setDoc(doc(db, ASSIGNMENTS_COL, id), payload, { merge: true });
    } catch (e) {}
    console.log("✅ Firestore Write Success (Homework Updated):", id, payload);
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `homework/${id}`);
  }
}

export const createHomework = addAssignment;

export async function deleteAssignment(id: string, groupId?: string) {
  try {
    await deleteDoc(doc(db, "homework", id));
    try {
      await deleteDoc(doc(db, ASSIGNMENTS_COL, id));
    } catch (e) {}
    // Maintain the group's homework index.
    if (groupId) {
      try {
        const { updateDoc: _updateDoc, arrayRemove: _arrayRemove } = await import('firebase/firestore');
        await _updateDoc(doc(db, GROUPS_COL, groupId), { homeworkIds: _arrayRemove(id) });
      } catch {
        // Best-effort index maintenance.
      }
    }
    console.log("✅ Firestore Delete Success (Homework Deleted):", id);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `homework/${id}`);
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
    const payload = cleanData(data);
    const docRef = await addDoc(collection(db, FEED_POSTS_COL), payload);
    console.log("✅ Firestore Write Success: feed_posts", docRef.id, payload);
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
      console.log("✅ Firestore Write Success: feed_post comment", postId);
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
    const payload = cleanData(data);
    const docRef = await addDoc(collection(db, MOCK_SCORES_COL), payload);

    // Also write to nested subcollection if studentId exists
    if (payload.studentId) {
      try {
        await setDoc(doc(db, STUDENTS_COL, payload.studentId, "mock_scores", docRef.id), payload, { merge: true });
        // Update parent student document overall band score
        await setDoc(doc(db, STUDENTS_COL, payload.studentId), {
          overallBand: payload.overall,
          targetBand: payload.overall
        }, { merge: true });
      } catch (e) {
        console.warn("Subcollection or student doc update notice:", e);
      }
    }

    console.log("✅ Firestore Write Success: mock_scores", docRef.id, payload);
    return docRef.id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, MOCK_SCORES_COL);
  }
}

export const saveStudentMockScore = saveMockScore;

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
export function subscribeInquiries(
  callback: (inquiries: Inquiry[]) => void,
  onError?: (error: any) => void
) {
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
            } else if (typeof data.createdAt?.toDate === 'function') {
              createdAtStr = data.createdAt.toDate().toISOString();
            } else if (typeof data.createdAt === 'number') {
              createdAtStr = new Date(data.createdAt).toISOString();
            }
          }
          return {
            id: docSnap.id,
            fullName: data.fullName || data.name || 'Unnamed Lead',
            phoneNumber: data.phoneNumber || data.phone || 'No phone',
            selectedCourse: data.selectedCourse || data.courseId || 'General English',
            message: data.message || '',
            status: data.status || 'new',
            createdAt: createdAtStr
          };
        });

        // Sort manually by date descending
        items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

        callback(items);
      },
      (error) => {
        console.warn('Firestore subscribeInquiries notice:', error);
        if (onError) onError(error);
        callback([]);
      }
    );
  } catch (error) {
    console.warn('Firestore subscribeInquiries error:', error);
    if (onError) onError(error);
    callback([]);
    return () => {};
  }
}

export async function fetchInquiriesOnce(): Promise<Inquiry[]> {
  const snapshot = await getDocs(collection(db, INQUIRIES_COL));
  console.log('Raw inquiries count:', snapshot.docs.length);
  const items: Inquiry[] = snapshot.docs.map((docSnap) => {
    const data = docSnap.data();
    let createdAtStr = new Date().toISOString();
    if (data.createdAt) {
      if (typeof data.createdAt === 'string') {
        createdAtStr = data.createdAt;
      } else if (typeof data.createdAt?.toDate === 'function') {
        createdAtStr = data.createdAt.toDate().toISOString();
      } else if (typeof data.createdAt === 'number') {
        createdAtStr = new Date(data.createdAt).toISOString();
      }
    }
    return {
      id: docSnap.id,
      fullName: data.fullName || data.name || 'Unnamed Lead',
      phoneNumber: data.phoneNumber || data.phone || 'No phone',
      selectedCourse: data.selectedCourse || data.courseId || 'General English',
      message: data.message || '',
      status: data.status || 'new',
      createdAt: createdAtStr
    };
  });

  items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  return items;
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
    // Use setDoc with merge: true so non-existent docs are created gracefully
    await setDoc(doc(db, INQUIRIES_COL, id), { status }, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `${INQUIRIES_COL}/${id}`);
    try {
      await setDoc(doc(db, LEADS_COL, id), { status }, { merge: true });
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

    // 3. Update inquiry status to enrolled using setDoc with merge semantics in batch
    const inquiryRef = doc(db, INQUIRIES_COL, inquiryId);
    batch.set(inquiryRef, { status: 'enrolled' }, { merge: true });

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
   SECURITY PINS SERVICE
   ========================================================================= */
export interface SecurityPinsData {
  adminPin: string;
  teacherPin: string;
  studentPin: string;
}

export function subscribeSecurityPins(callback: (pins: SecurityPinsData) => void) {
  const defaultPins: SecurityPinsData = {
    adminPin: 'secureadmin',
    teacherPin: 'secureteacher',
    studentPin: 'securestudent'
  };

  try {
    return onSnapshot(
      doc(db, 'settings', 'security_pins'),
      (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          callback({
            adminPin: data.adminPin || 'secureadmin',
            teacherPin: data.teacherPin || 'secureteacher',
            studentPin: data.studentPin || 'securestudent'
          });
        } else {
          callback(defaultPins);
        }
      },
      (error) => {
        console.warn('Firestore subscribeSecurityPins notice:', error);
        callback(defaultPins);
      }
    );
  } catch (error) {
    console.warn('Firestore subscribeSecurityPins error:', error);
    callback(defaultPins);
    return () => {};
  }
}

export async function saveSecurityPins(pins: SecurityPinsData) {
  try {
    await setDoc(doc(db, 'settings', 'security_pins'), {
      ...pins,
      updatedAt: new Date().toISOString()
    }, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, 'settings/security_pins');
    throw error;
  }
}

/* =========================================================================
   HOMEWORK SUBMISSIONS & FEED POSTS SERVICE
   ========================================================================= */
const SUBMISSIONS_COL = 'homework_submissions';

export async function submitHomework(submission: {
  assignmentId: string;
  assignmentTitle: string;
  studentId: string;
  studentName: string;
  solutionText: string;
  fileName?: string;
  fileUrl?: string;
  attachments?: SubmissionAttachment[];
  groupName?: string;
  date: string;
}) {
  try {
    const payload = cleanData({
      ...submission,
      createdAt: new Date().toISOString()
    });
    const docRef = await addDoc(collection(db, SUBMISSIONS_COL), payload);
    console.log("✅ Firestore Write Success: homework_submissions", docRef.id, payload);
    return docRef.id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, SUBMISSIONS_COL);
  }
}

export const submitHomeworkSolution = submitHomework;

export function subscribeHomeworkSubmissions(callback: (submissions: any[]) => void) {
  try {
    return onSnapshot(
      collection(db, SUBMISSIONS_COL),
      (snapshot) => {
        const items = snapshot.docs.map((docSnap) => ({
          id: docSnap.id,
          ...docSnap.data()
        }));
        callback(items);
      },
      (error) => {
        console.warn('Firestore subscribeHomeworkSubmissions notice:', error);
        callback([]);
      }
    );
  } catch (error) {
    console.warn('Firestore subscribeHomeworkSubmissions error:', error);
    callback([]);
    return () => {};
  }
}

export async function gradeHomeworkSubmission(
  submissionId: string,
  gradeData: {
    status?: 'graded' | 'submitted';
    score: string | number;
    grade?: string | number;
    gradingSystem: string;
    breakdown?: Record<string, any>;
    rubricStatus?: string;
    feedback: string;
    teacherName?: string;
    studentId?: string;
    studentName?: string;
    assignmentTitle?: string;
    correctedFileName?: string;
    correctedFileUrl?: string;
  }
) {
  try {
    const payload = cleanData({
      ...gradeData,
      status: 'graded',
      score: gradeData.score,
      grade: gradeData.score,
      gradedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });

    if (submissionId && !submissionId.startsWith('local_')) {
      await setDoc(doc(db, SUBMISSIONS_COL, submissionId), payload, { merge: true });
      console.log('✅ Homework submission graded in Firestore:', submissionId, payload);
    }

    const teacherName = gradeData.teacherName || auth.currentUser?.displayName || 'Jasur Alimov';
    const assignmentTitle = gradeData.assignmentTitle || 'Homework Assignment';
    const overallScore = gradeData.score;

    // 🔔 Dispatch grade_published notification directly to notifications collection
    try {
      const notifPayload = {
        title: `Grade Published: ${assignmentTitle}`,
        message: `Your work was evaluated by ${teacherName}. Final Score: ${overallScore}`,
        type: 'grade_published',
        category: 'grade_published',
        recipientId: gradeData.studentId || 'all',
        recipientRole: 'student' as const,
        linkId: submissionId,
        senderName: teacherName,
        isRead: false,
        createdAt: new Date().toISOString()
      };
      await addDoc(collection(db, 'notifications'), notifPayload);
      console.log('✅ Notification created in Firestore:', notifPayload);
    } catch (notifErr) {
      console.warn('Notification dispatch notice:', notifErr);
    }

    // Save to student mock scores if studentId is provided
    if (gradeData.studentId) {
      try {
        await saveMockScore({
          studentId: gradeData.studentId,
          studentName: gradeData.studentName || 'Student',
          date: new Date().toISOString().split('T')[0],
          subjectCategory: gradeData.gradingSystem === 'IELTS Band' ? 'IELTS' : 'General English',
          gradingSystem: gradeData.gradingSystem === 'IELTS Band' ? 'Test Score' : 'Percentage',
          overall: typeof gradeData.score === 'number' ? gradeData.score : parseFloat(String(gradeData.score)) || 8.0,
          teacherFeedback: gradeData.feedback
        });
      } catch (scoreErr) {
        console.warn('Mock score sync notice:', scoreErr);
      }
    }

    return true;
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `${SUBMISSIONS_COL}/${submissionId}`);
    return false;
  }
}

/* =========================================================================
   NOTIFICATION CENTER SERVICE
   ========================================================================= */
export function subscribeNotifications(
  recipientId?: string,
  recipientRole?: string,
  callback?: (notifications: AppNotification[]) => void
) {
  if (!callback) return () => {};
  try {
    return onSnapshot(
      collection(db, NOTIFICATIONS_COL),
      (snapshot) => {
        const rawDocs = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
        console.log('🔔 Notifications received in listener:', rawDocs);

        const items: AppNotification[] = snapshot.docs.map((docSnap) => {
          const data = docSnap.data();
          return {
            id: docSnap.id,
            title: data.title || data.subject || 'Notification',
            description: data.description || data.message || '',
            category: data.category || data.type || 'announcement',
            isRead: data.isRead ?? false,
            createdAt: data.createdAt || new Date().toISOString(),
            recipientId: data.recipientId,
            recipientRole: data.recipientRole || 'all',
            linkId: data.linkId,
            groupId: data.groupId,
            senderName: data.senderName
          };
        });

        // Filter for user or role
        const filtered = items.filter((n) => {
          if (n.recipientId && recipientId && n.recipientId === recipientId) return true;
          if (n.recipientRole) {
            if (n.recipientRole === 'all') return true;
            if (!recipientRole) return true; // Show student broadcasts if role is pending
            if (recipientRole === 'student' && n.recipientRole === 'student') return true;
            if (recipientRole === 'teacher' && n.recipientRole === 'teacher') return true;
            if (recipientRole === 'admin' || recipientRole === 'superadmin') return true;
          }
          if (!n.recipientId && (!n.recipientRole || n.recipientRole === 'all')) return true;
          return false;
        });

        // Sort by createdAt desc
        filtered.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());

        callback(filtered);
      },
      (error) => {
        console.warn('Firestore subscribeNotifications notice:', error);
        callback([]);
      }
    );
  } catch (error) {
    console.warn('Firestore subscribeNotifications error:', error);
    callback([]);
    return () => {};
  }
}

export async function createNotification(data: Omit<AppNotification, 'id'>) {
  try {
    const payload = cleanData({
      ...data,
      isRead: false,
      createdAt: data.createdAt || new Date().toISOString()
    });
    console.log('🚀 Creating Notification Payload:', payload);
    const docRef = await addDoc(collection(db, NOTIFICATIONS_COL), payload);
    console.log("✅ Firestore Write Success: notification created with ID", docRef.id);
    return docRef.id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, NOTIFICATIONS_COL);
    return `local_notif_${Date.now()}`;
  }
}

export async function markNotificationAsRead(id: string) {
  try {
    await updateDoc(doc(db, NOTIFICATIONS_COL, id), { isRead: true });
  } catch (error) {
    console.warn('Error marking notification read:', error);
  }
}

export async function markAllNotificationsAsRead(notifications: AppNotification[]) {
  try {
    const unread = notifications.filter((n) => !n.isRead);
    const batch = writeBatch(db);
    unread.forEach((n) => {
      batch.update(doc(db, NOTIFICATIONS_COL, n.id), { isRead: true });
    });
    await batch.commit();
  } catch (error) {
    console.warn('Error marking all notifications as read:', error);
  }
}

// Helper Triggers for Workflow Events
export async function notifyStudentsNewAssignment(
  title: string,
  groupName: string,
  groupId?: string,
  teacherName?: string,
  assignmentId?: string,
  dueDate?: string
) {
  const payload = {
    category: 'assignment_created' as const,
    recipientRole: 'student' as const,
    groupId: groupId || '',
    linkId: assignmentId,
    // senderId is required by Firestore rules for teacher-created notifications.
    senderId: auth.currentUser?.uid || '',
    senderName: teacherName || 'Jasur Alimov',
    title: `New Assignment: ${title}`,
    description: `New homework posted for ${groupName || 'your group'}.${dueDate ? ` Due date: ${dueDate}.` : ' Please submit your solution on time.'}`,
    isRead: false,
    createdAt: new Date().toISOString()
  };

  console.log('🚀 Dispatching homework notification to students:', payload);
  return createNotification(payload);
}

export async function notifyTeacherNewSubmission(assignmentTitle: string, studentName: string, studentId?: string, groupId?: string) {
  return createNotification({
    category: 'submission_received',
    recipientRole: 'teacher',
    groupId,
    linkId: studentId,
    senderName: studentName,
    title: `Yangi Vazifa Topshirildi 📩`,
    description: `${studentName} "${assignmentTitle}" mavzusidagi vazifasiga yechim topshirdi.`,
    isRead: false,
    createdAt: new Date().toISOString()
  });
}

export async function notifyStudentGradePublished(studentId: string, studentName: string, subjectName: string, gradeDisplay: string, feedback?: string) {
  return createNotification({
    category: 'grade_published',
    recipientId: studentId,
    senderName: 'Academic Teacher',
    title: `Baho va Feedback e'lon qilindi 🎯`,
    description: `${subjectName} bo'yicha bahoyingiz: ${gradeDisplay}.${feedback ? ` Ustoz mulohazasi: "${feedback}"` : ''}`,
    isRead: false,
    createdAt: new Date().toISOString()
  });
}

/* =========================================================================
   LEGACY SEEDER REMOVED — use src/services/seed.ts ensureSeeded()
   (single admin-shell invocation, deterministic IDs, versioned).
   ========================================================================= */
export async function updateUserProfile(uid: string, data: Record<string, any>) {
  try {
    const userRef = doc(db, 'users', uid);
    await setDoc(userRef, cleanData(data), { merge: true });
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, `users/${uid}`);
  }
}

