import { initializeApp, applicationDefault, cert, getApps, type App } from 'firebase-admin';
import { getFirestore as firestoreGetter, type Firestore } from 'firebase-admin/firestore';
import { getAuth as authGetter, type Auth } from 'firebase-admin/auth';
import path from 'path';
import fs from 'fs';

/**
 * Lazily initialized Firebase Admin app for privileged server-side access to
 * Firestore and Auth (used by the Telegram webhook and outbound integrations).
 *
 * The Firebase project is ALWAYS pinned explicitly:
 *   1. FIREBASE_PROJECT_ID env (recommended in production / Cloud Run)
 *   2. the project_id of FIREBASE_SERVICE_ACCOUNT_PATH JSON (if provided)
 *   3. fallback: the canonical client project for this app (centerflow-1fa34)
 *
 * Without an explicit projectId the Firebase Admin SDK derives it from the
 * ambient (applicationDefault) credentials — which on Cloud Run is the RUNTIME
 * project, NOT necessarily the Firebase project (centerflow-1fa34). That makes
 * auth.verifyIdToken() fail ("Unable to detect a Project Id" / wrong aud) and
 * Firestore target the wrong project, which surfaces as opaque 403 responses.
 *
 * Credential resolution order (no secrets in source code):
 *   1. FIREBASE_SERVICE_ACCOUNT_PATH → local JSON service-account file
 *   2. applicationDefault() → GOOGLE_APPLICATION_CREDENTIALS or the Cloud Run
 *      / GCE metadata service identity.
 *
 * The application must keep working when Firebase is unavailable, so every
 * accessor returns null instead of throwing.
 */

const DEFAULT_FIREBASE_PROJECT_ID = 'centerflow-1fa34';

function detectProjectId(): string {
  if (process.env.FIREBASE_PROJECT_ID) {
    return process.env.FIREBASE_PROJECT_ID.trim();
  }
  const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH;
  if (serviceAccountPath) {
    const resolved = path.resolve(serviceAccountPath);
    if (fs.existsSync(resolved)) {
      try {
        const serviceAccount = JSON.parse(fs.readFileSync(resolved, 'utf8')) as { project_id?: string };
        if (serviceAccount.project_id) {
          return serviceAccount.project_id.trim();
        }
      } catch {
        // fall through to the default
      }
    }
  }
  return DEFAULT_FIREBASE_PROJECT_ID;
}

let appRef: App | null = null;
let tried = false;
let lastError: string | null = null;
let projectId: string = DEFAULT_FIREBASE_PROJECT_ID;
let lastProbeAt = 0;
let lastProbeOk = false;

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

    projectId = detectProjectId();
    const options: { projectId: string } = { projectId };

    const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH;
    if (serviceAccountPath) {
      const resolved = path.resolve(serviceAccountPath);
      if (fs.existsSync(resolved)) {
        const serviceAccount = JSON.parse(fs.readFileSync(resolved, 'utf8'));
        if (serviceAccount.project_id) {
          projectId = serviceAccount.project_id.trim();
          options.projectId = projectId;
        }
        appRef = initializeApp({ credential: cert(serviceAccount), projectId: options.projectId });
        return appRef;
      }
      lastError = `FIREBASE_SERVICE_ACCOUNT_PATH file not found: ${resolved}`;
    }

    appRef = initializeApp({ credential: applicationDefault(), projectId: options.projectId });
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

export function getFirebaseProjectId(): string {
  getAdminApp();
  return projectId;
}

/**
 * Real capability probe: performs an actual Firestore read so "available"
 * reflects connectivity + IAM permission, not just object construction.
 * Cached for a few seconds to avoid hammering the backend per request.
 */
export async function probeFirestore(): Promise<{ available: boolean; projectId: string; error: string | null }> {
  const now = Date.now();
  if (now - lastProbeAt < 10000) {
    return { available: lastProbeOk, projectId, error: lastProbeOk ? null : lastError };
  }

  const db = getFirestore();
  if (!db) {
    lastProbeAt = now;
    lastProbeOk = false;
    return { available: false, projectId, error: lastError || 'firestore_unavailable' };
  }
  try {
    // Reading a non-existent doc does not create it; it only exercises
    // connectivity, authentication and read permission.
    await db.doc('__firebase_server/_probe').get();
    lastProbeAt = now;
    lastProbeOk = true;
    lastError = null;
    return { available: true, projectId, error: null };
  } catch (err: any) {
    lastProbeAt = now;
    lastProbeOk = false;
    lastError = err?.message || String(err);
    return { available: false, projectId, error: lastError };
  }
}

export function getFirebaseAdminError(): string | null {
  return lastError;
}