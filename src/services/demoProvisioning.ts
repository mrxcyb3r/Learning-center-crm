import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from './firebase';

/**
 * Demo login credentials — SIGN-IN ONLY.
 *
 * The demo Firebase Auth users MUST be provisioned explicitly in the Firebase
 * Console (Authentication → Users) together with their canonical Firestore
 * `users/{uid}` role documents (role=admin / teacher / student) through a
 * trusted/admin path. The browser client never creates users and never writes
 * roles: it only calls `signInWithEmailAndPassword` with the documented
 * credentials below. Values can be overridden via environment variables; the
 * literals are the project demo defaults.
 *
 * DEMO-ONLY: passwords live in client config because these are public demo
 * accounts. Never reuse these for real privileged users.
 */
export const DEMO_ADMIN_EMAIL =
  import.meta.env.VITE_DEMO_ADMIN_EMAIL || 'admin@renessans.demo';
export const DEMO_ADMIN_PASSWORD =
  import.meta.env.VITE_DEMO_ADMIN_PASSWORD || 'demo123456';

export const DEMO_TEACHER_EMAIL =
  import.meta.env.VITE_DEMO_TEACHER_EMAIL || 'jasur@renessans.demo';
export const DEMO_TEACHER_PASSWORD =
  import.meta.env.VITE_DEMO_TEACHER_PASSWORD || 'demo123456';

export const DEMO_STUDENT_EMAIL =
  import.meta.env.VITE_DEMO_STUDENT_EMAIL || 'student@renessans.demo';
export const DEMO_STUDENT_PASSWORD =
  import.meta.env.VITE_DEMO_STUDENT_PASSWORD || 'demo123456';

export interface DemoAccountResult {
  success: boolean;
  uid?: string;
  email?: string;
  /** Firebase Auth error code (e.g. auth/invalid-credential). Never a password. */
  code?: string;
  error?: string;
}

/**
 * Development-only diagnostic log for demo sign-in failures.
 * Logs error code, message, the demo email used, and the Firebase projectId.
 * NEVER logs passwords.
 */
function logDemoAuthFailure(role: string, email: string, err: any): void {
  if (!import.meta.env.DEV) return;
  try {
    // eslint-disable-next-line no-console
    console.warn('[demo-login] sign-in failed', {
      role,
      email,
      code: err?.code,
      message: err?.message,
      projectId: (auth.app.options as { projectId?: string } | undefined)?.projectId,
      authDomain: (auth.app.options as { authDomain?: string } | undefined)?.authDomain,
    });
  } catch {
    // Logging must never break authentication.
  }
}

/**
 * Map a Firebase Auth error code to an actionable diagnostic message.
 * The raw code is preserved on the result for programmatic handling.
 */
export function describeDemoAuthError(code: string | undefined): string {
  switch (code) {
    case 'auth/invalid-credential':
    case 'auth/user-not-found':
    case 'auth/wrong-password':
      return 'Demo account not found or password mismatch in this Firebase project. Verify the demo user exists under Authentication → Users.';
    case 'auth/operation-not-allowed':
      return 'Email/Password sign-in is disabled in this Firebase project. Enable it under Authentication → Sign-in method.';
    case 'auth/invalid-email':
      return 'The configured demo email address is malformed. Check the demo credential configuration.';
    case 'auth/invalid-api-key':
    case 'auth/project-not-found':
      return 'The app is pointing at the wrong Firebase project. Verify projectId/authDomain in the Firebase config.';
    case 'auth/too-many-requests':
      return 'Too many failed attempts. Please wait and try again.';
    case 'auth/network-request-failed':
      return 'Network error while contacting Firebase Auth. Check connectivity.';
    default:
      return 'Demo sign-in failed. Please try again or contact support.';
  }
}

async function signInDemoAccount(
  role: 'admin' | 'teacher' | 'student',
  email: string,
  password: string
): Promise<DemoAccountResult> {
  try {
    const cred = await signInWithEmailAndPassword(auth, email, password);
    return { success: true, uid: cred.user.uid, email };
  } catch (err: any) {
    logDemoAuthFailure(role, email, err);
    return {
      success: false,
      email,
      code: err?.code,
      error: err?.message || describeDemoAuthError(err?.code),
    };
  }
}

/** Sign in as demo admin (real Firebase Auth only — no provisioning). */
export async function signInAsDemoAdmin(): Promise<DemoAccountResult> {
  return signInDemoAccount('admin', DEMO_ADMIN_EMAIL, DEMO_ADMIN_PASSWORD);
}

/** Sign in as demo teacher (real Firebase Auth only — no provisioning). */
export async function signInAsDemoTeacher(): Promise<DemoAccountResult> {
  return signInDemoAccount('teacher', DEMO_TEACHER_EMAIL, DEMO_TEACHER_PASSWORD);
}

/** Sign in as demo student (real Firebase Auth only — no provisioning). */
export async function signInAsDemoStudent(): Promise<DemoAccountResult> {
  return signInDemoAccount('student', DEMO_STUDENT_EMAIL, DEMO_STUDENT_PASSWORD);
}
