/**
 * Knowledge service facade.
 *
 * The single integration point used by aiReceptionist (and nowhere else).
 * It returns deterministic answer fragments *plus* their grounding status and
 * supporting candidates, so the caller can attach the "verified" label only
 * when the data is actually verified.
 *
 * Every method is best-effort: on any read failure it returns a safe,
 * honest fallback described as such — never a fabricated statistic.
 */

import { fetchCenterContact } from '../adapters/centerAdapter';
import { fetchCatalog } from '../adapters/catalogAdapter';
import type { CanonicalContact } from '../retrieval/exact';
import type { GroundingStatus, KnowledgeResult } from '../schema/knowledge.schema';
import type { CatalogSnapshot } from '../adapters/types';

export interface DeterministicAnswer {
  text: string;
  source: string;
  status: GroundingStatus;
  candidates: KnowledgeResult[];
  verifiedFields?: string[];
}

const CONTACT_NO_DATA: GroundingStatus = 'unavailable';

let catalogSnapshot: CatalogSnapshot | null = null;
let catalogFetchedAt = 0;
const CATALOG_TTL_MS = 60_000;

export async function getCatalogCached(): Promise<CatalogSnapshot> {
  const now = Date.now();
  if (catalogSnapshot && now - catalogFetchedAt < CATALOG_TTL_MS) return catalogSnapshot;
  catalogSnapshot = await fetchCatalog();
  catalogFetchedAt = now;
  return catalogSnapshot;
}

export function resetKnowledgeServiceCache(): void {
  catalogSnapshot = null;
  catalogFetchedAt = 0;
}

export interface CenterContactView {
  phone: string | null;
  telegram: string | null;
  email: string | null;
  address: string | null;
  workingHours: string | null;
  status: GroundingStatus;
  conflictFields: string[];
}

export async function getCenterContactView(): Promise<CenterContactView> {
  const { contact } = await fetchCenterContact(null);
  const status: GroundingStatus =
    (contact.phone.verified || contact.telegram.verified || contact.address.verified) ? 'verified' : CONTACT_NO_DATA;
  return {
    phone: contact.phone.value,
    telegram: contact.telegram.value,
    email: contact.email.value,
    address: contact.address.value,
    workingHours: contact.workingHours.value,
    status,
    conflictFields: contact.conflictFields,
  };
}

export function formatContactContactAnswer(c: CenterContactView, wantFields: Array<keyof CenterContactView>): DeterministicAnswer {
  const parts: string[] = [];
  const verifiedFields: string[] = [];
  if (wantFields.includes('phone') && c.phone) parts.push('Tel: ' + c.phone);
  if (wantFields.includes('telegram') && c.telegram) parts.push('Telegram: ' + c.telegram);
  if (wantFields.includes('email') && c.email) parts.push('Email: ' + c.email);

  if (parts.length === 0) {
    return {
      text: 'Markaz bilan operator orqali bog\u2018lanishingiz mumkin — iltimos, \u201cOperator bilan bog\u2018lanish\u201d tugmasidan foydalaning.',
      source: "Bog'lanish ma'lumotlari",
      status: CONTACT_NO_DATA,
      candidates: [],
    };
  }

  const conflict = c.conflictFields.length > 0 ? ' (manbalar o\u2018rtasida ziddiyat bor)' : '';
  return {
    text: parts.join(' | ') + conflict,
    source: "Bog'lanish ma'lumotlari",
    status: c.status,
    candidates: [],
    verifiedFields: verifiedFields,
  };
}

export function formatAddressAnswer(c: CenterContactView): DeterministicAnswer {
  if (!c.address) {
    return {
      text: 'Markaz manzili hozircha tasdiqlanmagan — operator aniq manzilni aytadi.',
      source: 'Markaz manzili',
      status: CONTACT_NO_DATA,
      candidates: [],
    };
  }
  return {
    text: c.address,
    source: 'Markaz manzili',
    status: c.status,
    candidates: [],
    verifiedFields: ['address'],
  };
}

export function formatWorkingHoursAnswer(c: CenterContactView): DeterministicAnswer {
  if (!c.workingHours) {
    return {
      text: 'Markaz ish vaqti hozircha tasdiqlanmagan — operator aniq soatlarini aytadi.',
      source: 'Markaz ish vaqti',
      status: CONTACT_NO_DATA,
      candidates: [],
    };
  }
  return {
    text: c.workingHours,
    source: 'Markaz ish vaqti',
    status: c.status,
    candidates: [],
    verifiedFields: ['workingHours'],
  };
}

export async function answerContactInfo(): Promise<DeterministicAnswer> {
  const view = await getCenterContactView();
  return formatContactContactAnswer(view, ['phone', 'telegram', 'email']);
}

export async function answerBranchAddress(): Promise<DeterministicAnswer> {
  const view = await getCenterContactView();
  return formatAddressAnswer(view);
}

export async function answerWorkingHours(): Promise<DeterministicAnswer> {
  const view = await getCenterContactView();
  return formatWorkingHoursAnswer(view);
}

/** Honest results answer. Never invents statistics. */
export async function answerResultsGrants(): Promise<DeterministicAnswer> {
  try {
    const snap = await getCatalogCached();
    const published = (snap.results || []).filter((r: any) => r.published !== false);
    if (published.length === 0 || published.every((r: any) => !r.studentName)) {
      return {
        text: 'Bu yo\u2018nalish bo\u2018yicha hozircha tasdiqlangan ochiq natija topilmadi. Operatorimiz qo\u2018shimcha ma\u2019lumot bera oladi.',
        source: 'Markaz natijalari',
        status: 'unavailable',
        candidates: [],
      };
    }
    const lines = published
      .slice(0, 5)
      .map((r: any) => [r.studentName, r.score ? r.score + ' ball' : '', r.university, r.admissionType === 'Grant' ? 'Davlat granti' : ''].filter(Boolean).join(' \u2014 '));
    return {
      text: 'Renessans o\u2018quv markazi o\u2018quvchilarining ochiq natijalari: ' + lines.join('; ') + '.',
      source: 'Markaz natijalari',
      status: 'verified',
      candidates: [],
    };
  } catch {
    return {
      text: 'Bu yo\u2018nalish bo\u2018yicha hozircha tasdiqlangan ochiq natija topilmadi.',
      source: 'Markaz natijalari',
      status: 'unavailable',
      candidates: [],
    };
  }
}

/** Safe, non-committal text when deterministic data is missing entirely. */
export function missingDataText(reason: string): string {
  return 'Bu savol bo\u2018yicha tasdiqlangan ma\u2019lumot topilmadi. ' + reason;
}

export { CanonicalContact };