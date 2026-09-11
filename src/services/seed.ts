import { collection, doc, getDoc, getDocs, setDoc, updateDoc, arrayUnion, limit, query } from 'firebase/firestore';
import { db } from './firebase';

/**
 * Centralized demo-data seeder — the ONLY sanctioned seed entry point.
 *
 * Guarantees:
 * - Single invocation site (admin shell mount); no component-level callers.
 * - Deterministic document IDs (setDoc overwrite → reruns never duplicate).
 * - Version marker at settings/seed_meta (admin-only doc).
 * - Real demo-teacher UID; no placeholder/fake UIDs anywhere.
 * - Non-destructive: never touches users/* role docs, never injects demo
 *   groups into a database that already holds real data.
 * - StrictMode-safe via module-level single-flight guard.
 */

export const SEED_VERSION = 2;

// Demo teacher (Jasur Alimov) — real Firebase Auth UID, verified live.
export const DEMO_TEACHER_UID = '1mHTkm1lfRdn5recPAU9GH0sLdQ2';
export const DEMO_TEACHER_NAME = 'Jasur Alimov';

const SEED_META_REF = () => doc(db, 'settings', 'seed_meta');

let seedInFlight: Promise<void> | null = null;

interface SeedStudent {
  id: string;
  fullName: string;
  phone: string;
  groupId: string;
  groupName: string;
}

const SEED_GROUPS = [
  {
    id: 'seed-group-dtm-1',
    groupName: 'DTM Tayyorlov — Seed 1-guruh',
    name: 'DTM Tayyorlov — Seed 1-guruh',
    course: 'DTM & Milliy Sertifikat',
    courseType: 'DTM & Milliy Sertifikat',
    teacherId: DEMO_TEACHER_UID,
    teacherName: DEMO_TEACHER_NAME,
    teacher: DEMO_TEACHER_NAME,
    scheduleTime: 'Dush / Chor / Juma 14:00 - 16:00',
    days: 'Dush / Chor / Juma',
    time: '14:00 - 16:00',
    room: '101-Auditoriya',
    maxCapacity: 20,
    activeStudentsCount: 3,
    studentsCount: 3,
    type: 'Regular',
    status: 'Active',
  },
  {
    id: 'seed-group-dtm-2',
    groupName: 'DTM Tayyorlov — Seed 2-guruh',
    name: 'DTM Tayyorlov — Seed 2-guruh',
    course: 'DTM & Milliy Sertifikat',
    courseType: 'DTM & Milliy Sertifikat',
    teacherId: DEMO_TEACHER_UID,
    teacherName: DEMO_TEACHER_NAME,
    teacher: DEMO_TEACHER_NAME,
    scheduleTime: 'Sesh / Pay / Shan 16:00 - 18:00',
    days: 'Sesh / Pay / Shan',
    time: '16:00 - 18:00',
    room: '102-xona',
    maxCapacity: 20,
    activeStudentsCount: 3,
    studentsCount: 3,
    type: 'Regular',
    status: 'Active',
  },
];

const SEED_STUDENTS: SeedStudent[] = [
  { id: 'seed-student-001', fullName: 'Seed Oquvchi Bir', phone: '+998 (90) 100-00-01', groupId: 'seed-group-dtm-1', groupName: 'DTM Tayyorlov — Seed 1-guruh' },
  { id: 'seed-student-002', fullName: 'Seed Oquvchi Ikki', phone: '+998 (90) 100-00-02', groupId: 'seed-group-dtm-1', groupName: 'DTM Tayyorlov — Seed 1-guruh' },
  { id: 'seed-student-003', fullName: 'Seed Oquvchi Uch', phone: '+998 (90) 100-00-03', groupId: 'seed-group-dtm-1', groupName: 'DTM Tayyorlov — Seed 1-guruh' },
  { id: 'seed-student-004', fullName: 'Seed Oquvchi Tort', phone: '+998 (90) 100-00-04', groupId: 'seed-group-dtm-2', groupName: 'DTM Tayyorlov — Seed 2-guruh' },
  { id: 'seed-student-005', fullName: 'Seed Oquvchi Besh', phone: '+998 (90) 100-00-05', groupId: 'seed-group-dtm-2', groupName: 'DTM Tayyorlov — Seed 2-guruh' },
  { id: 'seed-student-006', fullName: 'Seed Oquvchi Olti', phone: '+998 (90) 100-00-06', groupId: 'seed-group-dtm-2', groupName: 'DTM Tayyorlov — Seed 2-guruh' },
];

async function collectionIsEmpty(col: string): Promise<boolean> {
  const snap = await getDocs(query(collection(db, col), limit(1)));
  return snap.empty;
}

/**
 * Ensure seed state. Must only be called from an admin-authenticated context
 * (settings/* and groups/students writes are admin-gated by Firestore rules).
 * Safe to call repeatedly and under React StrictMode.
 */
export async function ensureSeeded(): Promise<void> {
  if (seedInFlight) return seedInFlight;
  seedInFlight = (async () => {
    try {
      const meta = await getDoc(SEED_META_REF());
      if (meta.exists() && (meta.data().version ?? 0) >= SEED_VERSION) return;

      const [groupsEmpty, studentsEmpty] = await Promise.all([
        collectionIsEmpty('groups'),
        collectionIsEmpty('students'),
      ]);

      if (groupsEmpty && studentsEmpty) {
        for (const g of SEED_GROUPS) {
          const memberIds = SEED_STUDENTS.filter((s) => s.groupId === g.id).map((s) => s.id);
          await setDoc(doc(db, 'groups', g.id), { ...g, studentIds: memberIds }, { merge: true });
        }
        for (const s of SEED_STUDENTS) {
          await setDoc(
            doc(db, 'students', s.id),
            {
              ...s,
              name: s.fullName,
              teacherId: DEMO_TEACHER_UID,
              teacher: DEMO_TEACHER_NAME,
              mentor: DEMO_TEACHER_NAME,
              course: 'DTM & Milliy Sertifikat',
              tuitionFee: 380000,
              monthlyFee: 380000,
              paymentStatus: 'paid',
              lastPaymentDate: new Date().toISOString().split('T')[0],
              enrollmentDate: new Date().toISOString().split('T')[0],
              attendanceRate: 100,
              status: 'Active',
              isActive: true,
            },
            { merge: true }
          );
        }
        // Link the seed groups into the demo teacher's assignment index.
        await updateDoc(doc(db, 'users', DEMO_TEACHER_UID), {
          assignedGroupIds: arrayUnion(...SEED_GROUPS.map((g) => g.id)),
        });
      }

      await setDoc(
        SEED_META_REF(),
        { version: SEED_VERSION, seededAt: new Date().toISOString() },
        { merge: true }
      );
    } catch (err) {
      // Seeding is best-effort (e.g. non-admin caller) — never break the app.
      console.warn('ensureSeeded notice:', err);
    }
  })();
  try {
    await seedInFlight;
  } finally {
    seedInFlight = null;
  }
}
