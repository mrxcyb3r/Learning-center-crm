/**
 * One-time ops runner: executes the app's own ensureSeeded() code path
 * authenticated as the admin demo account.
 *
 * Usage (never commit real passwords; prefer env):
 *   DEMO_ADMIN_EMAIL=... DEMO_ADMIN_PASSWORD=... npx tsx scripts/run-seed.ts
 */
import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword, signOut } from 'firebase/auth';

const email = process.env.DEMO_ADMIN_EMAIL || 'admin@renessans.demo';
const password = process.env.DEMO_ADMIN_PASSWORD || 'demo123456';

async function main(): Promise<void> {
  // Same config as src/services/firebase.ts, initialized first so that
  // module's getApp() reuses this instance (shared Auth session).
  const app = initializeApp({
    apiKey: 'AIzaSyBCWRzvzjN6QUeHvFDe-U6AUx-QM6d_RhI',
    authDomain: 'centerflow-1fa34.firebaseapp.com',
    projectId: 'centerflow-1fa34',
  });
  const auth = getAuth(app);
  await signInWithEmailAndPassword(auth, email, password);
  console.log('signed in as admin demo');
  const { ensureSeeded } = await import('../src/services/seed');
  await ensureSeeded();
  console.log('ensureSeeded complete');
  await signOut(auth);
  process.exit(0);
}

main().catch((err) => {
  console.error('seed runner failed:', err?.code || err?.message);
  process.exit(1);
});
