import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBCWRzvzjN6QUeHvFDe-U6AUx-QM6d_RhI",
  authDomain: "centerflow-1fa34.firebaseapp.com",
  projectId: "centerflow-1fa34",
  storageBucket: "centerflow-1fa34.firebasestorage.app",
  messagingSenderId: "234862001625",
  appId: "1:234862001625:web:9d058d9e2000ab2f5aedc8",
  measurementId: "G-J4FNGZDX32"
};

// Initialize Firebase app safely
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: 'select_account'
});

export default app;
