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
  // Demo login functions for demo environment
  loginAsDemoAdmin: () => Promise<void>;
  loginAsDemoTeacher: () => Promise<void>;
  loginAsDemoUser: (role: UserRole) => Promise<void>;
  setRole: (role: UserRole) => void;
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
        // No user document exists - default to guest (no auto-role assignment)
        const newProfile: UserProfile = {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName || user.email?.split('@')[0] || 'User',
          role: 'guest',
          photoURL: user.photoURL,
          createdAt: new Date().toISOString()
        };
        await setDoc(docRef, newProfile);
        setUserProfile(newProfile);
        setRole('guest');
        return 'guest';
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

  // Demo login functions for demo environment
  const loginAsDemoAdmin = async () => {
    setIsLoading(true);
    try {
      const { signInAsDemoAdmin } = await import('../services/demoProvisioning');
      const result = await signInAsDemoAdmin();
      if (result.success && result.uid) {
        // The handleUserRole will be called automatically via onAuthStateChanged
        // but we can also trigger it manually
        const user = auth.currentUser;
        if (user) {
          await handleUserRole(user);
        }
      }
    } catch (err) {
      console.error('Demo admin login failed:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const loginAsDemoTeacher = async () => {
    setIsLoading(true);
    try {
      const { signInAsDemoTeacher } = await import('../services/demoProvisioning');
      const result = await signInAsDemoTeacher();
      if (result.success && result.uid) {
        const user = auth.currentUser;
        if (user) {
          await handleUserRole(user);
        }
      }
    } catch (err) {
      console.error('Demo teacher login failed:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const loginAsDemoUser = async (role: UserRole) => {
    if (role === 'admin') {
      await loginAsDemoAdmin();
    } else if (role === 'teacher') {
      await loginAsDemoTeacher();
    } else {
      // For student/demo roles, just set the role locally (for backward compat)
      setRole(role);
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
        loginAsDemoUser,
        setRole,
        activeRole: role,
        setMockRole,
        resetMockRole
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
