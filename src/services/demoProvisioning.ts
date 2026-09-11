import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  sendEmailVerification,
  signOut
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, db } from './firebase';
import { UserProfile, UserRole } from '../types';

const DEMO_ADMIN_EMAIL = 'admin@renessans.demo';
const DEMO_ADMIN_PASSWORD = 'demo123456';
const DEMO_ADMIN_NAME = 'Admin Manager';

const DEMO_TEACHER_EMAIL = 'jasur@renessans.demo';
const DEMO_TEACHER_PASSWORD = 'demo123456';
const DEMO_TEACHER_NAME = 'Jasur Alimov';

const DEMO_STUDENT_EMAIL = 'student@renessans.demo';
const DEMO_STUDENT_PASSWORD = 'demo123456';
const DEMO_STUDENT_NAME = 'Demo Student';

const DEMO_ADMIN_UID = 'demo_admin_001';
const DEMO_TEACHER_UID = 'demo_teacher_001';

interface DemoAccountResult {
  success: boolean;
  uid?: string;
  email?: string;
  error?: string;
}

/**
 * Provision demo admin account - creates real Firebase Auth user + Firestore profile
 */
export async function provisionDemoAdmin(): Promise<DemoAccountResult> {
  try {
    // Try to sign in first
    try {
      const cred = await signInWithEmailAndPassword(auth, DEMO_ADMIN_EMAIL, DEMO_ADMIN_PASSWORD);
      await ensureDemoAdminProfile(cred.user);
      return { success: true, uid: cred.user.uid, email: DEMO_ADMIN_EMAIL };
    } catch (signInErr: any) {
      // If user doesn't exist, create it
      if (signInErr.code === 'auth/user-not-found' || signInErr.code === 'auth/wrong-password') {
        const cred = await createUserWithEmailAndPassword(auth, DEMO_ADMIN_EMAIL, DEMO_ADMIN_PASSWORD);
        await updateProfile(cred.user, { displayName: DEMO_ADMIN_NAME });
        
        const profile: UserProfile = {
          uid: cred.user.uid,
          email: DEMO_ADMIN_EMAIL,
          displayName: DEMO_ADMIN_NAME,
          role: 'admin',
          phoneNumber: '+998 (90) 123-45-67',
          createdAt: new Date().toISOString()
        };
        await setDoc(doc(db, 'users', cred.user.uid), profile);
        
        // Send verification email (optional for demo)
        try {
          await sendEmailVerification(cred.user);
        } catch (e) {
          console.warn('Demo admin verification email failed:', e);
        }
        
        await signOut(auth);
        return { success: true, uid: cred.user.uid, email: DEMO_ADMIN_EMAIL };
      }
      throw signInErr;
    }
  } catch (err: any) {
    console.error('Demo admin provisioning failed:', err);
    return { success: false, error: err.message };
  }
}

/**
 * Provision demo teacher account - creates real Firebase Auth user + Firestore profile
 */
export async function provisionDemoTeacher(): Promise<DemoAccountResult> {
  try {
    // Try to sign in first
    try {
      const cred = await signInWithEmailAndPassword(auth, DEMO_TEACHER_EMAIL, DEMO_TEACHER_PASSWORD);
      await ensureDemoTeacherProfile(cred.user);
      return { success: true, uid: cred.user.uid, email: DEMO_TEACHER_EMAIL };
    } catch (signInErr: any) {
      // If user doesn't exist, create it
      if (signInErr.code === 'auth/user-not-found' || signInErr.code === 'auth/wrong-password') {
        const cred = await createUserWithEmailAndPassword(auth, DEMO_TEACHER_EMAIL, DEMO_TEACHER_PASSWORD);
        await updateProfile(cred.user, { displayName: DEMO_TEACHER_NAME });
        
        const profile: UserProfile = {
          uid: cred.user.uid,
          email: DEMO_TEACHER_EMAIL,
          displayName: DEMO_TEACHER_NAME,
          role: 'teacher',
          phoneNumber: '+998 (99) 259-32-32',
          createdAt: new Date().toISOString()
        };
        await setDoc(doc(db, 'users', cred.user.uid), profile);
        
        // Send verification email
        try {
          await sendEmailVerification(cred.user);
        } catch (e) {
          console.warn('Demo teacher verification email failed:', e);
        }
        
        await signOut(auth);
        return { success: true, uid: cred.user.uid, email: DEMO_TEACHER_EMAIL };
      }
      throw signInErr;
    }
  } catch (err: any) {
    console.error('Demo teacher provisioning failed:', err);
    return { success: false, error: err.message };
  }
}

/**
 * Ensure demo admin profile exists in Firestore
 */
async function ensureDemoAdminProfile(user: any): Promise<void> {
  const docRef = doc(db, 'users', user.uid);
  const snap = await getDoc(docRef);
  
  if (!snap.exists() || snap.data().role !== 'admin') {
    await setDoc(docRef, {
      uid: user.uid,
      email: DEMO_ADMIN_EMAIL,
      displayName: DEMO_ADMIN_NAME,
      role: 'admin',
      updatedAt: new Date().toISOString()
    }, { merge: true });
  }
}

/**
 * Ensure demo teacher profile exists in Firestore
 */
async function ensureDemoTeacherProfile(user: any): Promise<void> {
  const docRef = doc(db, 'users', user.uid);
  const snap = await getDoc(docRef);
  
  if (!snap.exists() || snap.data().role !== 'teacher') {
    await setDoc(docRef, {
      uid: user.uid,
      email: DEMO_TEACHER_EMAIL,
      displayName: DEMO_TEACHER_NAME,
      role: 'teacher',
      phone: '+998 (99) 259-32-32',
      bio: 'Matematika va fizika fanlari bo\'yicha tajribali o\'qituvchi. DTM va Milliy sertifikatga tayyorlov yo\'nalishi.',
      updatedAt: new Date().toISOString()
    }, { merge: true });
  }
}

/**
 * Ensure demo student profile exists in Firestore
 */
async function ensureDemoStudentProfile(user: any): Promise<void> {
  const docRef = doc(db, 'users', user.uid);
  const snap = await getDoc(docRef);

  if (!snap.exists() || snap.data().role !== 'student') {
    await setDoc(docRef, {
      uid: user.uid,
      email: DEMO_STUDENT_EMAIL,
      displayName: DEMO_STUDENT_NAME,
      role: 'student',
      updatedAt: new Date().toISOString()
    }, { merge: true });
  }
}

/**
 * Provision demo student account - creates real Firebase Auth user + Firestore profile
 */
export async function provisionDemoStudent(): Promise<DemoAccountResult> {
  try {
    // Try to sign in first
    try {
      const cred = await signInWithEmailAndPassword(auth, DEMO_STUDENT_EMAIL, DEMO_STUDENT_PASSWORD);
      await ensureDemoStudentProfile(cred.user);
      return { success: true, uid: cred.user.uid, email: DEMO_STUDENT_EMAIL };
    } catch (signInErr: any) {
      // If user doesn't exist, create it
      if (signInErr.code === 'auth/user-not-found' || signInErr.code === 'auth/wrong-password') {
        const cred = await createUserWithEmailAndPassword(auth, DEMO_STUDENT_EMAIL, DEMO_STUDENT_PASSWORD);
        await updateProfile(cred.user, { displayName: DEMO_STUDENT_NAME });

        const profile: UserProfile = {
          uid: cred.user.uid,
          email: DEMO_STUDENT_EMAIL,
          displayName: DEMO_STUDENT_NAME,
          role: 'student',
          createdAt: new Date().toISOString()
        };
        await setDoc(doc(db, 'users', cred.user.uid), profile);

        await signOut(auth);
        return { success: true, uid: cred.user.uid, email: DEMO_STUDENT_EMAIL };
      }
      throw signInErr;
    }
  } catch (err: any) {
    console.error('Demo student provisioning failed:', err);
    return { success: false, error: err.message };
  }
}

/**
 * Provision all demo accounts
 */
export async function provisionAllDemoAccounts(): Promise<void> {
  console.log('Provisioning demo accounts...');

  const adminResult = await provisionDemoAdmin();
  console.log('Demo admin:', adminResult);

  const teacherResult = await provisionDemoTeacher();
  console.log('Demo teacher:', teacherResult);

  const studentResult = await provisionDemoStudent();
  console.log('Demo student:', studentResult);
}

/**
 * Sign in as demo admin (real Firebase Auth)
 */
export async function signInAsDemoAdmin(): Promise<DemoAccountResult> {
  try {
    const cred = await signInWithEmailAndPassword(auth, DEMO_ADMIN_EMAIL, DEMO_ADMIN_PASSWORD);
    await ensureDemoAdminProfile(cred.user);
    return { success: true, uid: cred.user.uid, email: DEMO_ADMIN_EMAIL };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

/**
 * Sign in as demo teacher (real Firebase Auth)
 */
export async function signInAsDemoTeacher(): Promise<DemoAccountResult> {
  try {
    const cred = await signInWithEmailAndPassword(auth, DEMO_TEACHER_EMAIL, DEMO_TEACHER_PASSWORD);
    await ensureDemoTeacherProfile(cred.user);
    return { success: true, uid: cred.user.uid, email: DEMO_TEACHER_EMAIL };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

/**
 * Sign in as demo student (real Firebase Auth)
 */
export async function signInAsDemoStudent(): Promise<DemoAccountResult> {
  try {
    const cred = await signInWithEmailAndPassword(auth, DEMO_STUDENT_EMAIL, DEMO_STUDENT_PASSWORD);
    await ensureDemoStudentProfile(cred.user);
    return { success: true, uid: cred.user.uid, email: DEMO_STUDENT_EMAIL };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}