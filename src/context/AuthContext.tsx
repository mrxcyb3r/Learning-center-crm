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
  updateProfile
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
  loginWithEmail: (email: string, pass: string) => Promise<void>;
  registerWithEmail: (email: string, pass: string, name: string, requestedRole?: UserRole) => Promise<void>;
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

  // Helper to determine role and save profile
  const handleUserRole = async (user: User): Promise<UserRole> => {
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
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const loginWithEmail = async (email: string, pass: string) => {
    setIsLoading(true);
    try {
      const cred = await signInWithEmailAndPassword(auth, email, pass);
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
      const cred = await createUserWithEmailAndPassword(auth, email, pass);
      await updateProfile(cred.user, { displayName: name });

      const isSuperAdmin = cred.user.uid === SUPER_ADMIN_UUID;
      const assignedRole = isSuperAdmin ? 'superadmin' : requestedRole;

      const profile: UserProfile = {
        uid: cred.user.uid,
        email: cred.user.email,
        displayName: name,
        role: assignedRole,
        photoURL: cred.user.photoURL,
        createdAt: new Date().toISOString()
      };

      await setDoc(doc(db, 'users', cred.user.uid), profile);
      setUserProfile(profile);
      setRole(assignedRole);
      setActiveRole(assignedRole);
    } finally {
      setIsLoading(false);
    }
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
      if (err.code === 'auth/unauthorized-domain' || err.message?.includes('unauthorized-domain')) {
        throw new Error('This preview domain is not added to Firebase Authorized Domains in Firebase Console. Please log in with Email & Password.');
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
        loginWithEmail,
        registerWithEmail,
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
