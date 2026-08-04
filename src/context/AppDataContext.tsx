import React, { createContext, useContext, useState, useEffect } from 'react';
import { db } from '../services/firebase';
import { collection, onSnapshot, query, where, Unsubscribe } from 'firebase/firestore';
import { MOCK_APP_DATA } from '../data/mockAppData';

export type UserRole = 'guest' | 'student' | 'teacher' | 'admin';

interface AuthUser {
  uid: string;
  role: 'student' | 'teacher' | 'admin';
  name?: string;
}

interface AppDataContextType {
  isGuest: boolean;
  userRole: UserRole;
  demoPreviewRole: 'student' | 'teacher' | 'admin';
  setDemoPreviewRole: (role: 'student' | 'teacher' | 'admin') => void;
  appData: any;
  loading: boolean;
  loginUser: (uid: string, role: 'student' | 'teacher' | 'admin') => void;
  logoutUser: () => void;
}

const AppDataContext = createContext<AppDataContextType | undefined>(undefined);

export const AppDataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [authUser, setAuthUser] = useState<AuthUser | null>(null);
  const [demoPreviewRole, setDemoPreviewRole] = useState<'student' | 'teacher' | 'admin'>('student');
  const [liveData, setLiveData] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(false);

  const isGuest = !authUser;
  const userRole: UserRole = authUser ? authUser.role : 'guest';

  useEffect(() => {
    // If Guest, purge live data listeners and reset live state
    if (!authUser) {
      setLiveData(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    let unsubscribe: Unsubscribe;

    try {
      // Dynamic collection query based on real user role
      const q = query(collection(db, `${authUser.role}s`), where("uid", "==", authUser.uid));
      unsubscribe = onSnapshot(q, (snapshot) => {
        const fetched = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setLiveData(fetched[0] || null);
        setLoading(false);
      }, (err) => {
        console.error("Firestore subscription error:", err);
        setLoading(false);
      });
    } catch (error) {
      console.error("Error setting up Firestore listener:", error);
      setLoading(false);
    }

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [authUser]);

  const loginUser = (uid: string, role: 'student' | 'teacher' | 'admin') => {
    localStorage.setItem('cf_auth_token', `demo_token_${uid}`);
    setAuthUser({ uid, role });
  };

  const logoutUser = () => {
    localStorage.removeItem('cf_auth_token');
    setAuthUser(null);
  };

  // Determine what data object to feed to UI
  const resolvedData = isGuest 
    ? MOCK_APP_DATA[demoPreviewRole] 
    : (liveData || {});

  return (
    <AppDataContext.Provider
      value={{
        isGuest,
        userRole,
        demoPreviewRole,
        setDemoPreviewRole,
        appData: resolvedData,
        loading,
        loginUser,
        logoutUser
      }}
    >
      {children}
    </AppDataContext.Provider>
  );
};

export const useAppData = () => {
  const context = useContext(AppDataContext);
  if (!context) {
    throw new Error('useAppData must be used within an AppDataProvider');
  }
  return context;
};
