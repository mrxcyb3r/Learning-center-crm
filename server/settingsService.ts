import { getFirestore } from './firebaseAdmin';

/**
 * Server-side center configuration reader (Admin SDK).
 *
 * The single source of truth is the `settings/center` Firestore document
 * maintained by the Settings UI (settingsService). This helper lets server
 * surfaces (Telegram bot text, status diagnostics) reuse the configured
 * center identity instead of hardcoding Renessans values. It always falls
 * back to safe defaults when the document is absent or Firestore is off.
 */

export interface CenterConfig {
  name: string;
  address: string;
  phone: string;
  legalName?: string;
  stir?: string;
}

const DEFAULTS: CenterConfig = {
  name: "Renessans O'quv Markazi",
  address: 'Yangiobod tumani, 1-maktab binosi',
  phone: '+998 (90) 862-22-26',
};

const TTL_MS = 5 * 60 * 1000;
let cached: { at: number; center: CenterConfig | null } | null = null;

export async function getCenterConfig(force = false): Promise<CenterConfig> {
  const now = Date.now();
  if (!force && cached && now - cached.at < TTL_MS) {
    return cached.center || DEFAULTS;
  }

  try {
    const db = getFirestore();
    if (!db) {
      cached = { at: now, center: DEFAULTS };
      return DEFAULTS;
    }
    const snap = await db.doc('settings/center').get();
    const data = snap.exists ? (snap.data() as Record<string, any>) : {};
    const branches = Array.isArray(data.branches) ? data.branches : [];
    const center: CenterConfig = {
      name: String(data.centerName || DEFAULTS.name),
      address: String(branches?.[0]?.address || data.address || DEFAULTS.address),
      phone: String(data.hotline || DEFAULTS.phone),
      legalName: data.legalName ? String(data.legalName) : undefined,
      stir: data.stir ? String(data.stir) : undefined,
    };
    cached = { at: now, center };
    return center;
  } catch (err: any) {
    console.warn('[SETTINGS] settings/center o\'qishda xato, zahira qo\'llanilmoqda:', err?.message || String(err));
    cached = { at: now, center: DEFAULTS };
    return DEFAULTS;
  }
}