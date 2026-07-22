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
  serverTimestamp
} from 'firebase/firestore';
import { db, auth } from './firebase';
import { Group, Student, Payment, AttendanceRecord } from '../types';

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
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(errInfo.error);
}

// Collections
const GROUPS_COL = 'groups';
const STUDENTS_COL = 'students';
const PAYMENTS_COL = 'payments';
const ATTENDANCE_COL = 'attendance';

// Default Mock Seed Data
const DEFAULT_GROUPS: Omit<Group, 'id'>[] = [
  {
    name: 'IELTS Intensive #12',
    courseType: 'IELTS 7.5+ Rocket',
    teacherId: 'teacher-1',
    teacherName: 'Mr. Javohirbek',
    scheduleTime: 'Mon/Wed/Fri 14:00 - 16:00',
    room: 'Room 3 (Camelot Main)',
    activeStudentsCount: 14
  },
  {
    name: 'General English B2',
    courseType: 'CEFR B2 FastTrack',
    teacherId: 'teacher-2',
    teacherName: 'Ms. Shahlo',
    scheduleTime: 'Tue/Thu/Sat 16:30 - 18:00',
    room: 'Room 1',
    activeStudentsCount: 12
  },
  {
    name: 'CEFR FastTrack #04',
    courseType: 'State Exam CEFR',
    teacherId: 'teacher-1',
    teacherName: 'Mr. Javohirbek',
    scheduleTime: 'Mon/Wed/Fri 18:30 - 20:00',
    room: 'Room 5',
    activeStudentsCount: 10
  }
];

const DEFAULT_STUDENTS: Omit<Student, 'id'>[] = [
  {
    fullName: 'Jasur Rahimov',
    phone: '+998 90 123 45 67',
    groupId: '',
    groupName: 'IELTS Intensive #12',
    tuitionFee: 650000,
    paymentStatus: 'paid',
    lastPaymentDate: new Date().toISOString().split('T')[0]
  },
  {
    fullName: 'Malika Sharipova',
    phone: '+998 91 234 56 78',
    groupId: '',
    groupName: 'General English B2',
    tuitionFee: 550000,
    paymentStatus: 'paid',
    lastPaymentDate: new Date().toISOString().split('T')[0]
  },
  {
    fullName: 'Sardor Bekmuratov',
    phone: '+998 93 345 67 89',
    groupId: '',
    groupName: 'IELTS Intensive #12',
    tuitionFee: 650000,
    paymentStatus: 'pending',
    lastPaymentDate: '2025-06-15'
  },
  {
    fullName: 'Aziza Umarova',
    phone: '+998 94 456 78 90',
    groupId: '',
    groupName: 'CEFR FastTrack #04',
    tuitionFee: 500000,
    paymentStatus: 'paid',
    lastPaymentDate: '2025-07-10'
  },
  {
    fullName: 'Boburmirzo Alimov',
    phone: '+998 99 567 89 01',
    groupId: '',
    groupName: 'General English B2',
    tuitionFee: 550000,
    paymentStatus: 'overdue',
    lastPaymentDate: '2025-05-20'
  }
];

const DEFAULT_PAYMENTS: Omit<Payment, 'id'>[] = [
  {
    studentId: '',
    studentName: 'Jasur Rahimov',
    amount: 650000,
    paymentMethod: 'click',
    date: new Date().toISOString().split('T')[0],
    recordedBy: 'Admin'
  },
  {
    studentId: '',
    studentName: 'Malika Sharipova',
    amount: 550000,
    paymentMethod: 'card',
    date: new Date().toISOString().split('T')[0],
    recordedBy: 'Admin'
  },
  {
    studentId: '',
    studentName: 'Aziza Umarova',
    amount: 500000,
    paymentMethod: 'cash',
    date: '2025-07-10',
    recordedBy: 'SuperAdmin'
  }
];

/* =========================================================================
   SEED FIRESTORE INITIAL DATA IF EMPTY
   ========================================================================= */
export async function seedFirestoreIfEmpty() {
  try {
    const groupSnap = await getDocs(collection(db, GROUPS_COL));
    if (groupSnap.empty) {
      console.log('Seeding initial groups to Firestore...');
      const createdGroups: Group[] = [];
      for (const g of DEFAULT_GROUPS) {
        const docRef = await addDoc(collection(db, GROUPS_COL), g);
        createdGroups.push({ id: docRef.id, ...g });
      }

      // Seed students
      const studentSnap = await getDocs(collection(db, STUDENTS_COL));
      if (studentSnap.empty && createdGroups.length > 0) {
        console.log('Seeding initial students...');
        for (let i = 0; i < DEFAULT_STUDENTS.length; i++) {
          const s = DEFAULT_STUDENTS[i];
          const groupMatch = createdGroups.find((grp) => grp.name === s.groupName) || createdGroups[0];
          await addDoc(collection(db, STUDENTS_COL), {
            ...s,
            groupId: groupMatch.id
          });
        }
      }

      // Seed payments
      const paymentSnap = await getDocs(collection(db, PAYMENTS_COL));
      if (paymentSnap.empty) {
        console.log('Seeding initial payments...');
        for (const p of DEFAULT_PAYMENTS) {
          await addDoc(collection(db, PAYMENTS_COL), p);
        }
      }
    }
  } catch (err) {
    console.warn('Firestore seeding skipped or failed offline:', err);
  }
}

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
        handleFirestoreError(error, OperationType.LIST, GROUPS_COL);
      }
    );
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, GROUPS_COL);
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
        handleFirestoreError(error, OperationType.LIST, STUDENTS_COL);
      }
    );
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, STUDENTS_COL);
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
        // Sort descending by date
        items.sort((a, b) => (a.date < b.date ? 1 : -1));
        callback(items);
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, PAYMENTS_COL);
      }
    );
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, PAYMENTS_COL);
    return () => {};
  }
}

export async function recordPaymentAndSetPaid(
  studentId: string,
  studentName: string,
  amount: number,
  paymentMethod: 'cash' | 'card' | 'click',
  recordedBy: string
) {
  try {
    const todayStr = new Date().toISOString().split('T')[0];

    // 1. Create Payment record in Firestore
    const paymentData: Omit<Payment, 'id'> = {
      studentId,
      studentName,
      amount,
      paymentMethod,
      date: todayStr,
      recordedBy
    };
    const paymentRef = await addDoc(collection(db, PAYMENTS_COL), paymentData);

    // 2. Automatically update student's status to 'paid' and lastPaymentDate
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
