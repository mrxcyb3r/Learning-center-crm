import { initializeApp, applicationDefault, cert, getApps, type App } from 'firebase-admin';
import { getFirestore as firestoreGetter, type Firestore } from 'firebase-admin/firestore';
import { getAuth as authGetter, type Auth } from 'firebase-admin/auth';
import path from 'path';
import fs from 'fs';

/**
 * Lazily initialized Firebase Admin app for privileged server-side access to
 * Firestore and Auth (used by the Telegram webhook, admin-role verification
 * and outbound integrations).
 *
 * The Firebase project is ALWAYS pinned explicitly:
 *   1. FIREBASE_PROJECT_ID env (recommended in production / Cloud Run)
 *   2. the project_id of the service account (FIREBASE_SERVICE_ACCOUNT_JSON /
 *      FIREBASE_SERVICE_ACCOUNT_PATH)
 *   3. fallback: the canonical client project for this app (centerflow-1fa34)
 *
 * Without an explicit projectId the SDK derives it from ambient credentials —
 * on Cloud Run that is the RUNTIME project, not necessarily the Firebase
 * project. That breaks auth.verifyIdToken() and Firestore reads.
 *
 * Credential resolution order (no secrets in source code):
 *   1. FIREBASE_SERVICE_ACCOUNT_JSON → raw service-account JSON string stored
 *      as a server-side environment/secret (AI Studio Secrets panel).
 *   2. FIREBASE_SERVICE_ACCOUNT_PATH → local JSON service-account file.
 *   3. applicationDefault() → GOOGLE_APPLICATION_CREDENTIALS or the Cloud Run /
 *      GCE metadata-service identity.
 *
 * NOTE on #3 / doc_read_error: on AI Studio the runtime identity usually
 * belongs to the AI Studio sandbox project, which has NO automatic access to
 * the Firebase project's Firestore (browser reads work because they go through
 * the client SDK + rules; the server Admin SDK does NOT). For server-side
 * reads to work, either:
 *   - grant the runtime service account `roles/datastore.user` on the Firebase
 *     project, or
 *   - set FIREBASE_SERVICE_ACCOUNT_JSON to a service account created IN the
 *     Firebase project with `roles/datastore.user`.
 *
 * The application must keep working when Firebase is unavailable, so every
 * accessor returns null instead of throwing.
 */

const DEFAULT_FIREBASE_PROJECT_ID = 'centerflow-1fa34';

function detectProjectId(): string {
  if (process.env.FIREBASE_PROJECT_ID) {
    return process.env.FIREBASE_PROJECT_ID.trim();
  }
  const rawJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (rawJson) {
    try {
      const serviceAccount = JSON.parse(rawJson) as { project_id?: string };
      if (serviceAccount.project_id) return serviceAccount.project_id.trim();
    } catch {
      // fall through
    }
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

const GRPC_CODE_NAMES: Record<number, string> = {
  1: 'CANCELLED',
  3: 'INVALID_ARGUMENT',
  4: 'DEADLINE_EXCEEDED',
  5: 'NOT_FOUND',
  6: 'ALREADY_EXISTS',
  7: 'PERMISSION_DENIED',
  8: 'RESOURCE_EXHAUSTED',
  9: 'FAILED_PRECONDITION',
  10: 'ABORTED',
  11: 'OUT_OF_RANGE',
  12: 'UNIMPLEMENTED',
  13: 'INTERNAL',
  14: 'UNAVAILABLE',
  15: 'DATA_LOSS',
  16: 'UNAUTHENTICATED',
};

/** Mask anything that looks like an account/email; truncate for log safety. */
export function sanitizeFirebaseError(err: unknown): { code: string; message: string } {
  const raw = err as { code?: unknown; message?: unknown; status?: unknown; statusCode?: unknown; name?: unknown } | null;
  const numericCode = typeof raw?.code === 'number' ? raw.code : typeof raw?.statusCode === 'number' ? raw.statusCode : null;
  let code = numericCode !== null && GRPC_CODE_NAMES[numericCode]
    ? GRPC_CODE_NAMES[numericCode]
    : String(raw?.code ?? raw?.statusCode ?? raw?.status ?? raw?.name ?? 'unknown');
  let message = String(raw?.message ?? 'Unknown Firebase/Firestore error');
  if (/could not load the default credentials/i.test(message)) {
    code = 'default_credentials_unavailable';
  } else if (/missing or insufficient permissions/i.test(message)) {
    code = 'PERMISSION_DENIED';
  }
  // Never allow emails / service-account identities or private-key fragments to leak.
  message = message.replace(/[\w.+-]+@[\w.-]+\.[A-Za-z]{2,}/g, '***@***');
  message = message.replace(/-----BEGIN[^-]+-----[\s\S]*?-----END[^-]+-----/g, '[REDACTED KEY]');
  message = message.replace(/\b(secret(?:_token)?|private[_-]?key|password)\b["']?\s*[:=]\s*["']?[^\s"']+/gi, '$1=[REDACTED]');
  message = message.replace(/\s+/g, ' ').trim().slice(0, 300);
  return { code, message };
}

let appRef: App | null = null;
let tried = false;
let lastError: string | null = null;
let projectId: string = DEFAULT_FIREBASE_PROJECT_ID;
let lastProbeAt = 0;
let lastProbeOk = false;
let runtimeServiceAccount: string | null = null;

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

    // 1) Raw service-account JSON secret (AI Studio / Cloud Run friendly).
    const rawServiceAccount = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
    if (rawServiceAccount) {
      const serviceAccount = JSON.parse(rawServiceAccount);
      if (serviceAccount.project_id) {
        projectId = serviceAccount.project_id.trim();
        options.projectId = projectId;
      }
      appRef = initializeApp({ credential: cert(serviceAccount), projectId: options.projectId });
      return appRef;
    }

    // 2) Service-account JSON file.
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

    // 3) Ambient default credentials (Cloud Run runtime identity).
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
 * Best-effort: the Cloud Run / GCE runtime service-account identity.
 * Only attempted on GCP (K_SERVICE is always set on Cloud Run). Returns null
 * on local/dev. The email is an identifier, not a secret — it is needed to
 * know WHICH service account must be granted Firestore access.
 */
export async function getRuntimeServiceAccount(): Promise<string | null> {
  const onGcp = Boolean(process.env.K_SERVICE || process.env.GCLOUD_PROJECT || process.env.GOOGLE_CLOUD_PROJECT);
  if (!onGcp) return null;
  if (runtimeServiceAccount !== null) return runtimeServiceAccount;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 1500);
  try {
    const res = await fetch(
      'http://metadata.google.internal/computeMetadata/v1/instance/service-accounts/default/email',
      { headers: { 'Metadata-Flavor': 'Google' }, signal: controller.signal }
    );
    if (res.ok) {
      runtimeServiceAccount = (await res.text()).trim() || null;
    }
  } catch {
    runtimeServiceAccount = null;
  } finally {
    clearTimeout(timer);
  }
  return runtimeServiceAccount;
}

/**
 * Real capability probe: performs an ACTUAL Firestore read so "available"
 * reflects connectivity + IAM permission, not just object construction.
 * Cached for a few seconds to avoid hammering the backend per request.
 */
export async function probeFirestore(): Promise<{
  available: boolean;
  projectId: string;
  errorCode: string;
  error: string;
}> {
  const now = Date.now();
  if (now - lastProbeAt < 10000 && lastError) {
    return { available: lastProbeOk, projectId, errorCode: lastErrorCode, error: lastError };
  }
  if (now - lastProbeAt < 5000 && lastProbeOk) {
    return { available: true, projectId, errorCode: '', error: '' };
  }

  const db = getFirestore();
  if (!db) {
    lastProbeAt = now;
    lastProbeOk = false;
    lastErrorCode = 'firestore_unavailable';
    lastError = lastError || 'Firestore Admin SDK is not initialized.';
    return { available: false, projectId, errorCode: lastErrorCode, error: lastError };
  }
  try {
    // Reading a non-existent doc does not create it; it only exercises
    // connectivity, authentication and read permission.
    await db.doc('__firebase_server/_probe').get();
    lastProbeAt = now;
    lastProbeOk = true;
    lastErrorCode = '';
    lastError = '';
    return { available: true, projectId, errorCode: '', error: '' };
  } catch (err: unknown) {
    lastProbeAt = now;
    lastProbeOk = false;
    const { code, message } = sanitizeFirebaseError(err);
    lastErrorCode = code;
    lastError = message;
    return { available: false, projectId, errorCode: code, error: message };
  }
}

let lastErrorCode = '';

export function getFirebaseAdminError(): string | null {
  return lastError;
}