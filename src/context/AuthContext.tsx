import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import {
  User,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  signOut,
  onAuthStateChanged,
  updateProfile,
  sendEmailVerification,
  reload
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db, googleProvider } from '../services/firebase';
import { cleanData } from '../services/firestore';
import { UserRole, UserProfile } from '../types';

export const SUPER_ADMIN_UID = 'CI1sJzLxSrQHvvCwFQnHqeVHxrs2';
export const SUPER_ADMIN_UUID = SUPER_ADMIN_UID;

interface AuthContextType {
  currentUser: User | null;
  userProfile: UserProfile | null;
  role: UserRole;
  isLoading: boolean;
  isEmailVerified: boolean;
  unverifiedUserEmail: string | null;
  // The optional `requestedRole` parameter is accepted for backward compatibility
  // with call sites that pass a UI-selected role. It is intentionally NOT used
  // for authorization: the authoritative role always comes from Firestore
  // `users/{uid}` via handleUserRole. Frontend role arguments must never grant
  // privileges on their own.
  loginWithEmail: (email: string, pass: string, requestedRole?: UserRole | string) => Promise<void>;
  registerWithEmail: (email: string, pass: string, name: string, requestedRole?: UserRole | string) => Promise<void>;
  resendVerificationEmail: () => Promise<void>;
  checkEmailVerification: () => Promise<boolean>;
  loginWithGoogle: (requestedRole?: UserRole | string) => Promise<void>;
  logout: () => Promise<void>;
  // Demo login functions for demo environment (all backed by real Firebase Auth)
  loginAsDemoAdmin: () => Promise<void>;
  loginAsDemoTeacher: () => Promise<void>;
  loginAsDemoStudent: () => Promise<void>;
  loginAsDemoUser: (role: UserRole) => Promise<void>;
  setRole: (role: UserRole) => void;
  /** Re-resolve role/profile from Firestore for the current user. */
  refreshUserRole: () => Promise<void>;
  // Backward compatibility for components using old AppDataContext
  activeRole: UserRole;
  setMockRole: (role: UserRole) => void;
  resetMockRole: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [role, setRole] = useState<UserRole>('guest');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isEmailVerified, setIsEmailVerified] = useState<boolean>(true);
  const [unverifiedUserEmail, setUnverifiedUserEmail] = useState<string | null>(null);

  // Helper to determine role from Firestore users/{uid}
  const handleUserRole = useCallback(async (user: User): Promise<UserRole> => {
    // Check email verification status (Google OAuth users, SuperAdmin bypass verification)
    const isGoogleUser = user.providerData?.some((p) => p.providerId === 'google.com');
    const isVerified = Boolean(user.emailVerified || isGoogleUser || user.uid === SUPER_ADMIN_UUID);
    setIsEmailVerified(isVerified);
    if (!isVerified) {
      setUnverifiedUserEmail(user.email);
    } else {
      setUnverifiedUserEmail(null);
    }

    // Exact SuperAdmin check
    if (user.uid === SUPER_ADMIN_UUID) {
      const superAdminProfile: UserProfile = {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName || 'Super Admin',
        role: 'superadmin',
        photoURL: user.photoURL,
        phoneNumber: user.phoneNumber,
        createdAt: new Date().toISOString()
      };
      setUserProfile(superAdminProfile);
      setRole('superadmin');

      try {
        await setDoc(doc(db, 'users', user.uid), superAdminProfile, { merge: true });
      } catch (err) {
        console.warn('Firestore user profile sync warning:', err);
      }
      return 'superadmin';
    }

    // Fetch existing profile from Firestore
    try {
      const docRef = doc(db, 'users', user.uid);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const data = docSnap.data() as UserProfile;
        const userRole = data.role || 'guest';
        const updatedProfile = { ...data, role: userRole };
        setUserProfile(updatedProfile);
        setRole(userRole);
        return userRole;
      } else {
        // No user document exists - default to guest (no auto-role assignment).
        // Created transactionally (create-if-absent): a blind setDoc here
        // could clobber a profile written concurrently (e.g. an invitation
        // redemption committing role='teacher' between our read and write).
        // The transaction re-reads first, so a concurrently created profile
        // (with its authoritative role) is adopted instead of overwritten.
        const newProfile: UserProfile = {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName || user.email?.split('@')[0] || 'User',
          role: 'guest',
          photoURL: user.photoURL,
          createdAt: new Date().toISOString()
        };
        const { runTransaction: runUserTx } = await import('firebase/firestore');
        const resolvedRole = await runUserTx(db, async (tx) => {
          const fresh = await tx.get(docRef);
          if (fresh.exists()) {
            return (fresh.data() as UserProfile).role || 'guest';
          }
          console.debug('[auth] tx creating guest doc');
          tx.set(docRef, cleanData(newProfile));
          return 'guest' as UserRole;
        });
        if (resolvedRole === 'guest') {
          setUserProfile(newProfile);
          setRole('guest');
          return 'guest';
        }
        const adopted = { ...newProfile, role: resolvedRole };
        setUserProfile(adopted);
        setRole(resolvedRole);
        return resolvedRole;
      }
    } catch (err) {
      console.warn('Error fetching Firestore user role, defaulting to guest:', err);
      const fallback: UserProfile = {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName || 'User',
        role: 'guest',
        photoURL: user.photoURL
      };
      setUserProfile(fallback);
      setRole('guest');
      return 'guest';
    }
  }, []);

  useEffect(() => {
    // Check if user is returning from a redirect flow
    getRedirectResult(auth)
      .then(async (res) => {
        if (res && res.user) {
          await handleUserRole(res.user);
        }
      })
      .catch((err) => {
        console.warn('Redirect auth result error:', err);
      });

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setIsLoading(true);
      if (user) {
        setCurrentUser(user);
        await handleUserRole(user);
      } else {
        setCurrentUser(null);
        setUserProfile(null);
        setRole('guest');
        setIsEmailVerified(true);
        setUnverifiedUserEmail(null);
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [handleUserRole]);

  const loginWithEmail = async (_email: string, _pass: string, _requestedRole?: UserRole | string) => {
    const email = _email;
    const pass = _pass;
    void _requestedRole;
    setIsLoading(true);
    try {
      const cred = await signInWithEmailAndPassword(auth, email, pass);
      await reload(cred.user);
      await handleUserRole(cred.user);
    } finally {
      setIsLoading(false);
    }
  };

  const registerWithEmail = async (
    email: string,
    pass: string,
    name: string,
    _requestedRole?: UserRole | string
  ) => {
    void _requestedRole;
    setIsLoading(true);
    try {
      const cred = await createUserWithEmailAndPassword(auth, email, pass);
      await updateProfile(cred.user, { displayName: name });

      // Trigger real email verification link immediately
      try {
        await sendEmailVerification(cred.user);
      } catch (e) {
        console.warn('Failed to send email verification link:', e);
      }

      const isSuperAdmin = cred.user.uid === SUPER_ADMIN_UUID;
      const assignedRole = isSuperAdmin ? 'superadmin' : 'guest';

      const profile: UserProfile = {
        uid: cred.user.uid,
        email: cred.user.email,
        fullName: name,
        displayName: name,
        role: assignedRole,
        photoURL: cred.user.photoURL,
        createdAt: new Date().toISOString()
      };

      await setDoc(doc(db, 'users', cred.user.uid), profile);
      setUserProfile(profile);
      setRole(assignedRole);

      // Mark email verification state
      const isVerified = cred.user.emailVerified || isSuperAdmin;
      setIsEmailVerified(isVerified);
      if (!isVerified) {
        setUnverifiedUserEmail(cred.user.email);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const resendVerificationEmail = async () => {
    if (auth.currentUser) {
      await sendEmailVerification(auth.currentUser);
    }
  };

  const checkEmailVerification = async (): Promise<boolean> => {
    if (auth.currentUser) {
      await reload(auth.currentUser);
      const isGoogleUser = auth.currentUser.providerData?.some((p) => p.providerId === 'google.com');
      const isVerified = Boolean(auth.currentUser.emailVerified || isGoogleUser || auth.currentUser.uid === SUPER_ADMIN_UUID);
      setIsEmailVerified(isVerified);
      if (isVerified) {
        setUnverifiedUserEmail(null);
      }
      return isVerified;
    }
    return false;
  };

  const loginWithGoogle = async (_requestedRole?: UserRole | string) => {
    void _requestedRole;
    setIsLoading(true);
    try {
      let cred;
      try {
        cred = await signInWithPopup(auth, googleProvider);
      } catch (popupErr: any) {
        if (popupErr.code === 'auth/unauthorized-domain' || popupErr.message?.includes('unauthorized-domain')) {
          throw new Error('This preview domain is not listed under Authorized Domains in your Firebase Console. Please log in using Email & Password.');
        }
        if (popupErr.code === 'auth/popup-closed-by-user') {
          throw new Error('Sign-in popup was closed before completing authentication. Please try again.');
        }
        if (popupErr.code === 'auth/cancelled-popup-request') {
          throw new Error('Sign-in request was cancelled. Please try again.');
        }

        console.warn('signInWithPopup failed or blocked, attempting redirect fallback:', popupErr);
        if (
          popupErr.code === 'auth/popup-blocked' ||
          popupErr.message?.includes('popup')
        ) {
          try {
            await signInWithRedirect(auth, googleProvider);
            return;
          } catch (redirectErr: any) {
            if (redirectErr.code === 'auth/unauthorized-domain' || redirectErr.message?.includes('unauthorized-domain')) {
              throw new Error('This domain is not listed under Authorized Domains in Firebase Console. Please use Email & Password sign in.');
            }
            throw redirectErr;
          }
        }
        throw popupErr;
      }

      if (cred && cred.user) {
        await handleUserRole(cred.user);
      }
    } catch (err: any) {
      console.error('Google Sign-In Error:', err);
      if (err.code === 'auth/unauthorized-domain' || err.message?.includes('unauthorized-domain') || err.message?.includes('Authorized Domains')) {
        throw new Error('This preview domain is not listed under Authorized Domains in your Firebase Console. Please log in using Email & Password.');
      }
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
    } catch (e) {
      console.warn('SignOut warning:', e);
    }
    setCurrentUser(null);
    setUserProfile(null);
    setRole('guest');
  };

  // Demo login functions for demo environment (real Firebase Auth only).
  // On failure these THROW (preserving the Firebase error code) so callers can
  // show a diagnostic and must not navigate. No role is set, no redirect
  // happens, and no protected listeners start until real authentication
  // succeeds. The flow starts from a signed-out state so a failed attempt
  // never leaves a stale/partial session behind.
  const runDemoSignIn = async (
    roleLabel: string,
    signIn: () => Promise<{ success: boolean; uid?: string; code?: string; error?: string }>
  ): Promise<void> => {
    setIsLoading(true);
    try {
      try {
        await signOut(auth);
      } catch {
        // Ignore — guarantees a clean auth state before the attempt.
      }
      setCurrentUser(null);
      setUserProfile(null);
      setRole('guest');

      const result = await signIn();
      if (!result.success || !result.uid) {
        const err = new Error(result.error || 'Demo sign-in failed.') as Error & { code?: string };
        if (result.code) err.code = result.code;
        throw err;
      }
      // Role resolution happens via onAuthStateChanged, but resolve it here
      // too so callers observe the Firestore-authorized role immediately.
      const user = auth.currentUser;
      if (user) {
        setCurrentUser(user);
        await handleUserRole(user);
      } else {
        throw new Error('Demo sign-in did not establish a Firebase session.');
      }
    } catch (err) {
      if (import.meta.env.DEV) {
        // eslint-disable-next-line no-console
        console.warn(`[demo-login] ${roleLabel} login failed:`, err);
      }
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const loginAsDemoAdmin = async () => {
    const { signInAsDemoAdmin } = await import('../services/demoProvisioning');
    await runDemoSignIn('admin', signInAsDemoAdmin);
  };

  const loginAsDemoTeacher = async () => {
    const { signInAsDemoTeacher } = await import('../services/demoProvisioning');
    await runDemoSignIn('teacher', signInAsDemoTeacher);
  };

  const loginAsDemoStudent = async () => {
    const { signInAsDemoStudent } = await import('../services/demoProvisioning');
    await runDemoSignIn('student', signInAsDemoStudent);
  };

  // All demo roles resolve through real Firebase Auth + Firestore
  // users/{uid}. No frontend-only role assignment happens here.
  const loginAsDemoUser = async (role: UserRole) => {
    if (role === 'admin' || role === 'superadmin') {
      await loginAsDemoAdmin();
    } else if (role === 'teacher') {
      await loginAsDemoTeacher();
    } else if (role === 'student') {
      await loginAsDemoStudent();
    } else {
      throw new Error(
        `No demo account exists for role "${role}". Please sign in with a real account.`
      );
    }
  };

  const setMockRole = (newRole: UserRole) => {
    setRole(newRole);
  };

  const resetMockRole = () => {
    // Reset to the actual role from Firestore
    if (currentUser) {
      handleUserRole(currentUser);
    }
  };

  const refreshUserRole = async () => {
    const user = auth.currentUser;
    if (user) {
      setCurrentUser(user);
      await handleUserRole(user);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        userProfile,
        role,
        isLoading,
        isEmailVerified,
        unverifiedUserEmail,
        loginWithEmail,
        registerWithEmail,
        resendVerificationEmail,
        checkEmailVerification,
        loginWithGoogle,
        logout,
        loginAsDemoAdmin,
        loginAsDemoTeacher,
        loginAsDemoStudent,
        loginAsDemoUser,
        setRole,
        activeRole: role,
        setMockRole,
        resetMockRole,
        refreshUserRole
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
