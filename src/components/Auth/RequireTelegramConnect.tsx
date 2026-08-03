import React, { useState, useEffect } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { useAuth } from '../../context/AuthContext';
import { ConnectTelegramOnboarding } from './ConnectTelegramOnboarding';

interface RequireTelegramConnectProps {
  children: React.ReactNode;
}

export const RequireTelegramConnect: React.FC<RequireTelegramConnectProps> = ({ children }) => {
  const { currentUser, userProfile } = useAuth();
  const [isBotConnected, setIsBotConnected] = useState<boolean | null>(null);

  const uid = currentUser?.uid || userProfile?.uid;

  useEffect(() => {
    if (!uid) {
      setIsBotConnected(false);
      return;
    }

    const userRef = doc(db, 'users', uid);
    const unsubscribe = onSnapshot(
      userRef,
      (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.data();
          setIsBotConnected(Boolean(data.isBotConnected || userProfile?.isBotConnected));
        } else {
          setIsBotConnected(Boolean(userProfile?.isBotConnected));
        }
      },
      () => {
        // Fallback to userProfile
        setIsBotConnected(Boolean(userProfile?.isBotConnected));
      }
    );

    return () => unsubscribe();
  }, [uid, userProfile]);

  // If status is checking, pass through or display children if already connected in profile
  if (isBotConnected === null) {
    if (userProfile?.isBotConnected) {
      return <>{children}</>;
    }
  }

  // If not connected, render the onboarding page gate
  if (isBotConnected === false && !userProfile?.isBotConnected) {
    return <ConnectTelegramOnboarding onComplete={() => setIsBotConnected(true)} />;
  }

  return <>{children}</>;
};
