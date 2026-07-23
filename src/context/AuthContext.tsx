import React, { createContext, useContext, useEffect, useState } from 'react';
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

export const SUPER_ADMIN_UUID = 'ISLveDBeEndRC0U6jQ0lEmEn68l2';

interface AuthContextType {
  currentUser: User | null;
  userProfile: UserProfile | null;
  role: UserRole;
  activeRole: UserRole; // Active mock role for testing views
  isLoading: boolean;
  isDevMode: boolean;
  isEmailVerified: boolean;
  unverifiedUserEmail: string | null;
  loginWithEmail: (email: string, pass: string) => Promise<void>;
  registerWithEmail: (email: string, pass: string, name: string, requestedRole?: UserRole) => Promise<void>;
  resendVerificationEmail: () => Promise<void>;
  checkEmailVerification: () => Promise<boolean>;
  loginWithGoogle: (requestedRole?: UserRole) => Promise<void>;
  loginAsDemoUser: (requestedRole?: UserRole) => Promise<void>;
  logout: () => Promise<void>;
  setMockRole: (role: UserRole) => void;
  resetMockRole: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [role, setRole] = useState<UserRole>('guest');
  const [activeRole, setActiveRole] = useState<UserRole>('guest');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isDevMode] = useState<boolean>(true); // Dev switcher active
  const [isEmailVerified, setIsEmailVerified] = useState<boolean>(true);
  const [unverifiedUserEmail, setUnverifiedUserEmail] = useState<string | null>(null);

  // Helper to determine role and save profile
  const handleUserRole = async (user: User): Promise<UserRole> => {
    // Check email verification status (Google OAuth users, SuperAdmin, or demo accounts bypass verification)
    const isGoogleUser = user.providerData?.some((p) => p.providerId === 'google.com');
    const isVerified = Boolean(user.emailVerified || isGoogleUser || user.uid === SUPER_ADMIN_UUID || user.uid.startsWith('demo_'));
    setIsEmailVerified(isVerified);
    if (!isVerified) {
      setUnverifiedUserEmail(user.email);
    } else {
      setUnverifiedUserEmail(null);
    }

    // Exact SuperAdmin check mandated by instructions
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
      setActiveRole('superadmin');

      try {
        await setDoc(doc(db, 'users', user.uid), superAdminProfile, { merge: true });
      } catch (err) {
        console.warn('Firestore user profile sync warning:', err);
      }
      return 'superadmin';
    }

    // Try fetching existing profile from Firestore
    try {
      const docRef = doc(db, 'users', user.uid);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const data = docSnap.data() as UserProfile;
        setUserProfile(data);
        setRole(data.role || 'student');
        setActiveRole(data.role || 'student');
        return data.role || 'student';
      } else {
        // Create initial default profile
        const newProfile: UserProfile = {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName || user.email?.split('@')[0] || 'User',
          role: 'student',
          photoURL: user.photoURL,
          createdAt: new Date().toISOString()
        };
        await setDoc(docRef, newProfile);
        setUserProfile(newProfile);
        setRole('student');
        setActiveRole('student');
        return 'student';
      }
    } catch (err) {
      console.warn('Error fetching Firestore user role, defaulting to student:', err);
      const fallback: UserProfile = {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName || 'User',
        role: 'student',
        photoURL: user.photoURL
      };
      setUserProfile(fallback);
      setRole('student');
      setActiveRole('student');
      return 'student';
    }
  };

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
        setActiveRole('guest');
        setIsEmailVerified(true);
        setUnverifiedUserEmail(null);
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const normalizePassOrPin = (input: string): string => {
    const trimmed = input.trim();
    if (trimmed.length < 6) {
      return `renessans_pin_${trimmed}`;
    }
    return trimmed;
  };

  const loginWithEmail = async (email: string, pass: string) => {
    setIsLoading(true);
    try {
      const safePass = normalizePassOrPin(pass);
      const cred = await signInWithEmailAndPassword(auth, email, safePass);
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
    requestedRole: UserRole = 'student'
  ) => {
    setIsLoading(true);
    try {
      const safePass = normalizePassOrPin(pass);
      const cred = await createUserWithEmailAndPassword(auth, email, safePass);
      await updateProfile(cred.user, { displayName: name });

      // Trigger real email verification link immediately
      try {
        await sendEmailVerification(cred.user);
      } catch (e) {
        console.warn('Failed to send email verification link:', e);
      }

      const isSuperAdmin = cred.user.uid === SUPER_ADMIN_UUID;
      const assignedRole = isSuperAdmin ? 'superadmin' : requestedRole;

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
      setActiveRole(assignedRole);

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
      const isVerified = Boolean(auth.currentUser.emailVerified || isGoogleUser || auth.currentUser.uid === SUPER_ADMIN_UUID || auth.currentUser.uid.startsWith('demo_'));
      setIsEmailVerified(isVerified);
      if (isVerified) {
        setUnverifiedUserEmail(null);
      }
      return isVerified;
    }
    return false;
  };

  const loginWithGoogle = async (requestedRole: UserRole = 'student') => {
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
        if (cred.user.uid === SUPER_ADMIN_UUID) {
          await handleUserRole(cred.user);
        } else {
          const docRef = doc(db, 'users', cred.user.uid);
          const docSnap = await getDoc(docRef);
          if (!docSnap.exists()) {
            const assignedRole = cred.user.uid === SUPER_ADMIN_UUID ? 'superadmin' : requestedRole;
            const profile: UserProfile = {
              uid: cred.user.uid,
              email: cred.user.email,
              displayName: cred.user.displayName || cred.user.email?.split('@')[0] || 'User',
              role: assignedRole,
              photoURL: cred.user.photoURL,
              createdAt: new Date().toISOString()
            };
            await setDoc(docRef, profile);
            setUserProfile(profile);
            setRole(assignedRole);
            setActiveRole(assignedRole);
          } else {
            await handleUserRole(cred.user);
          }
        }
      }
    } catch (err: any) {
      console.error('Google Sign-In Error:', err);
      if (err.code === 'auth/unauthorized-domain' || err.message?.includes('unauthorized-domain') || err.message?.includes('Authorized Domains')) {
        throw new Error('This preview domain is not listed under Authorized Domains in your Firebase Console. Please log in using Email & Password or 1-Click Fast Demo Login.');
      }
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const loginAsDemoUser = async (requestedRole: UserRole = 'student') => {
    setIsLoading(true);
    try {
      const isSuperAdmin = requestedRole === 'superadmin';
      const uid = isSuperAdmin ? SUPER_ADMIN_UUID : `demo_${requestedRole}_${Date.now().toString(36)}`;
      
      const roleProfiles: Record<UserRole, { name: string; email: string }> = {
        superadmin: { name: 'Isomiddin SuperAdmin', email: 'isomiddin@camelot.lc' },
        admin: { name: 'Center Admin Manager', email: 'admin@camelot.lc' },
        teacher: { name: 'Mr. Javohir (IELTS 8.5)', email: 'teacher@camelot.lc' },
        student: { name: 'Jasur Rahimov', email: 'jasur@camelot.lc' },
        guest: { name: 'Guest User', email: 'guest@camelot.lc' }
      };

      const info = roleProfiles[requestedRole] || roleProfiles.student;

      const mockUser = {
        uid,
        email: info.email,
        displayName: info.name,
        photoURL: null,
        emailVerified: true
      } as User;

      const profile: UserProfile = {
        uid,
        email: info.email,
        displayName: info.name,
        role: requestedRole,
        createdAt: new Date().toISOString()
      };

      setCurrentUser(mockUser);
      setUserProfile(profile);
      setRole(requestedRole);
      setActiveRole(requestedRole);
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
    setActiveRole('guest');
  };

  const setMockRole = (newRole: UserRole) => {
    setActiveRole(newRole);
  };

  const resetMockRole = () => {
    setActiveRole(role);
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        userProfile,
        role,
        activeRole,
        isLoading,
        isDevMode,
        isEmailVerified,
        unverifiedUserEmail,
        loginWithEmail,
        registerWithEmail,
        resendVerificationEmail,
        checkEmailVerification,
        loginWithGoogle,
        loginAsDemoUser,
        logout,
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
