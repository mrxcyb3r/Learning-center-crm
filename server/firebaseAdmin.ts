import { initializeApp, applicationDefault, cert, getApps, type App } from 'firebase-admin';
import { getFirestore as firestoreGetter, type Firestore } from 'firebase-admin/firestore';
import { getAuth as authGetter, type Auth } from 'firebase-admin/auth';
import path from 'path';
import fs from 'fs';

/**
 * Lazily initialized Firebase Admin app for privileged server-side access to
 * Firestore and Auth (used by the Telegram webhook and outbound integrations).
 *
 * Credential resolution order (no secrets in source code):
 *   1. FIREBASE_SERVICE_ACCOUNT_PATH → local JSON service-account file
 *   2. applicationDefault() → GOOGLE_APPLICATION_CREDENTIALS or the Cloud Run
 *      / GCE metadata service identity.
 *
 * The application must keep working when Firebase is unavailable, so every
 * accessor returns null instead of throwing.
 */

let appRef: App | null = null;
let tried = false;
let lastError: string | null = null;

export function getAdminApp(): App | null {
  if (appRef) return appRef;
  if (tried) return appRef;
  tried = true;

  try {
    const existing = getApps()[0];
    if (existing) {
      appRef = existing;
      return appRef;
    }

    const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH;
    if (serviceAccountPath) {
      const resolved = path.resolve(serviceAccountPath);
      if (fs.existsSync(resolved)) {
        const serviceAccount = JSON.parse(fs.readFileSync(resolved, 'utf8'));
        appRef = initializeApp({ credential: cert(serviceAccount) });
        return appRef;
      }
      lastError = `FIREBASE_SERVICE_ACCOUNT_PATH file not found: ${resolved}`;
    }

    appRef = initializeApp({ credential: applicationDefault() });
    return appRef;
  } catch (err: any) {
    lastError = err?.message || String(err);
    appRef = null;
    return null;
  }
}

export function getFirestore(): Firestore | null {
  getAdminApp();
  if (!appRef) return null;
  try {
    return firestoreGetter();
  } catch (err: any) {
    lastError = err?.message || String(err);
    return null;
  }
}

export function getAdminAuth(): Auth | null {
  getAdminApp();
  if (!appRef) return null;
  try {
    return authGetter();
  } catch (err: any) {
    lastError = err?.message || String(err);
    return null;
  }
}

export function getFirebaseAdminError(): string | null {
  return lastError;
}