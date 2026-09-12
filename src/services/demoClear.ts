import { collection, doc, getDocs, query, where, writeBatch, setDoc, getDoc } from 'firebase/firestore';
import { db } from './firebase';

/**
 * Safe, audited demo-data clearing.
 *
 * Only records carrying the demo provenance marker (`isDemo === true`, written
 * by the sanctioned seeder src/services/seed.ts) are ever deleted. Real center
 * records — which never carry that flag — are never touched. Landing content
 * (`settings/landing_cms`) and user role documents are also never deleted.
 *
 * After clearing, `settings/seed_meta` is marked `cleared: true` so the normal
 * app-mount seeder does NOT immediately recreate the dataset. Use
 * reseedDemoData() (seed.ts) to bring the demo dataset back for presentations.
 */

export interface DemoCollectionInfo {
  name: string;
  label: string;
}

const DEMO_COLLECTIONS: DemoCollectionInfo[] = [
  { name: 'students', label: "O'quvchilar" },
  { name: 'groups', label: 'Guruhlar' },
  { name: 'payments', label: "To'lovlar" },
  { name: 'invoices', label: 'Invoyislar' },
  { name: 'teachers', label: "O'qituvchilar" },
  { name: 'courses', label: 'Kurslar' },
  { name: 'results', label: 'Natijalar' },
  { name: 'faqs', label: 'Savol-javoblar (FAQ)' },
  { name: 'branches', label: 'Filiallar' },
  { name: 'expenses', label: 'Xarajatlar' },
  { name: 'leads', label: 'Lidlar' },
  { name: 'homework', label: 'Uy vazifalari' },
  { name: 'attendance', label: 'Davomat' },
  { name: 'notifications', label: 'Bildirishnomalar' },
];

export interface DemoStat {
  collection: string;
  label: string;
  count: number;
}

const BATCH_SIZE = 400;

async function collectDemoIds(collectionName: string): Promise<string[]> {
  const snap = await getDocs(query(collection(db, collectionName), where('isDemo', '==', true)));
  return snap.docs.map((d) => d.id);
}

/** Dry-run: how many demo records exist per collection. */
export async function getDemoStats(): Promise<DemoStat[]> {
  const stats: DemoStat[] = [];
  for (const c of DEMO_COLLECTIONS) {
    try {
      const ids = await collectDemoIds(c.name);
      stats.push({ collection: c.name, label: c.label, count: ids.length });
    } catch (err) {
      console.warn(`[demoClear] stats "${c.name}" o'qib bo'lmadi:`, err?.message || String(err));
      stats.push({ collection: c.name, label: c.label, count: 0 });
    }
  }
  const total = stats.reduce((sum, s) => sum + s.count, 0);
  return total > 0 ? stats : [];
}

/** Read the seed meta mark (whether demo data was deliberately cleared). */
export async function getSeedMeta(): Promise<{ cleared: boolean; version?: number; clearedAt?: string }> {
  try {
    const snap = await getDoc(doc(db, 'settings', 'seed_meta'));
    if (!snap.exists()) return { cleared: false };
    const data = snap.data() || {};
    return {
      cleared: data.cleared === true,
      version: typeof data.version === 'number' ? data.version : undefined,
      clearedAt: typeof data.clearedAt === 'string' ? data.clearedAt : undefined,
    };
  } catch (err) {
    console.warn('[demoClear] seed_meta o\'qib bo\'lmadi:', err?.message || String(err));
    return { cleared: false };
  }
}

/**
 * Delete every record flagged `isDemo === true` across the demo collections,
 * then mark the seed meta so the app does not auto-reseed.
 */
export async function clearDemoData(): Promise<{ cleared: number }> {
  let cleared = 0;
  const clearedCollections: string[] = [];

  for (const c of DEMO_COLLECTIONS) {
    try {
      const ids = await collectDemoIds(c.name);
      for (let i = 0; i < ids.length; i += BATCH_SIZE) {
        const chunk = ids.slice(i, i + BATCH_SIZE);
        const batch = writeBatch(db);
        chunk.forEach((id) => batch.delete(doc(db, c.name, id)));
        await batch.commit();
        cleared += chunk.length;
      }
      if (ids.length > 0) clearedCollections.push(c.name);
    } catch (err) {
      console.warn(`[demoClear] "${c.name}" o'chirishda xatolik:`, err?.message || String(err));
    }
  }

  try {
    const seedRef = doc(db, 'settings', 'seed_meta');
    const existing = (await getDoc(seedRef)).exists() ? (await getDoc(seedRef)).data() || {} : {};
    await setDoc(
      seedRef,
      {
        ...existing,
        version: existing.version ?? undefined,
        cleared: true,
        clearedAt: new Date().toISOString(),
        clearedCollections,
      },
      { merge: true }
    );
  } catch (err) {
    console.warn('[demoClear] seed_meta belgilanmadi:', err?.message || String(err));
  }

  return { cleared };
}