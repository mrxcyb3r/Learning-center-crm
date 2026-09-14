/**
 * Exact / deterministic retrieval.
 *
 * Contains (a) canonical contact resolution with source priority + conflict
 * detection, and (b) deterministic fact extraction helpers. This is the layer
 * that guarantees phone/Telegram/address are NEVER sourced from arbitrary
 * semantic documents when a canonical field exists.
 */

import type {
  ContactField,
} from '../entities/aliases';
import {
  isStalePhone,
  isStaleTelegram,
} from '../entities/aliases';
import {
  SOURCE_PRIORITY,
  type SourcePriorityKey,
} from '../grounding/sourcePriority';
import type {
  KnowledgeDocument,
  KnowledgeFact,
  SourceType,
  Visibility,
} from '../schema/knowledge.schema';
import { normalizeForMatch } from '../../../services/aiNormalize';

export interface CandidateContactValue {
  field: ContactField;
  value: string | null;
  sourceType: SourceType;
  sourceId: string;
  priority: number;
  updatedAt?: string;
}

export interface CanonicalContactField {
  value: string | null;
  sourceType: SourceType;
  sourceId: string;
  priority: number;
  verified: boolean;
  conflict: boolean;
  updatedAt?: string;
}

export interface CanonicalContact {
  phone: CanonicalContactField;
  telegram: CanonicalContactField;
  email: CanonicalContactField;
  address: CanonicalContactField;
  workingHours: CanonicalContactField;
  conflictFields: ContactField[];
}

export interface CanonicalContactInput {
  phone?: CandidateContactValue[];
  telegram?: CandidateContactValue[];
  email?: CandidateContactValue[];
  address?: CandidateContactValue[];
  workingHours?: CandidateContactValue[];
}

export function phoneDigits(raw: string | null): string {
  if (!raw) return '';
  let d = raw.replace(/\D/g, '');
  if (d.length === 10 && d.startsWith('8')) d = d.slice(1); // "8 (88) …" trunk-prefix form
  if (d.length === 9) d = '998' + d; // national form without country code
  return d;
}

export function telephoneHandle(raw: string | null): string {
  if (!raw) return '';
  return String(raw).trim().toLowerCase().replace(/^@/, '').replace(/[^a-z0-9_]/g, '');
}

/** Normalize a candidate value for equality comparison per field. */
export function comparableValue(field: ContactField, value: string | null): string {
  if (value == null) return '';
  switch (field) {
    case 'phone':
      return phoneDigits(value);
    case 'telegram':
      return telephoneHandle(value);
    case 'email':
      return String(value).trim().toLowerCase();
    default:
      return normalizeForMatch(value);
  }
}

/** True when a contact candidate is a documented stale value. */
export function isKnownStale(field: ContactField, value: string | null): boolean {
  if (value == null) return false;
  if (field === 'phone') return isStalePhone(comparableValue(field, value));
  if (field === 'telegram') return isStaleTelegram(comparableValue(field, value));
  return false;
}

function resolveField(
  candidates: CandidateContactValue[],
  field: ContactField
): CanonicalContactField {
  const empty: CanonicalContactField = {
    value: null,
    sourceType: 'default',
    sourceId: 'none',
    priority: -1,
    verified: false,
    conflict: false,
  };
  if (!candidates || candidates.length === 0) return empty;

  const viable = candidates.filter((c) => c.value && c.value.trim()).filter((c) => !isKnownStale(field, c.value));
  const pool = viable.length > 0 ? viable : (candidates.length ? candidates : []);

  // Sort by priority DESC (higher number = more authoritative), then by sourceId.
  const sorted = [...pool].sort((a, b) => {
    if (b.priority !== a.priority) return b.priority - a.priority;
    return a.sourceId.localeCompare(b.sourceId);
  });

  const top = sorted[0];
  if (!top) return empty;

  const distinct = new Map<string, CandidateContactValue>();
  for (const c of sorted.filter((c) => c.priority === top.priority)) {
    distinct.set(comparableValue(field, c.value), c);
  }
  const conflict = distinct.size > 1;

  return {
    value: top.value,
    sourceType: top.sourceType,
    sourceId: top.sourceId,
    priority: top.priority,
    verified: !isKnownStale(field, top.value) && !conflict,
    conflict,
    updatedAt: top.updatedAt,
  };
}

/** Resolve a canonical center contact from ordered per-field candidates. */
export function resolveCanonicalContact(input: CanonicalContactInput): CanonicalContact {
  const phone = resolveField(input.phone || [], 'phone');
  const telegram = resolveField(input.telegram || [], 'telegram');
  const email = resolveField(input.email || [], 'email');
  const address = resolveField(input.address || [], 'address');
  const workingHours = resolveField(input.workingHours || [], 'workingHours');

  const conflictFields: ContactField[] = [];
  if (phone.conflict) conflictFields.push('phone');
  if (telegram.conflict) conflictFields.push('telegram');
  if (address.conflict) conflictFields.push('address');
  if (workingHours.conflict) conflictFields.push('workingHours');

  return { phone, telegram, email, address, workingHours, conflictFields };
}

export const CanonicalContactSelectors = {
  getCenterPhone(c: CanonicalContact): CanonicalContactField {
    return c.phone;
  },
  getCenterTelegram(c: CanonicalContact): CanonicalContactField {
    return c.telegram;
  },
  getCenterAddress(c: CanonicalContact): CanonicalContactField {
    return c.address;
  },
  getCenterWorkingHours(c: CanonicalContact): CanonicalContactField {
    return c.workingHours;
  },
};

/**
 * Deterministic fact extraction from a course knowledge document.
 * Returns stable KnowledgeFact records (price, duration, age) so answers can
 * be grounded even when a live Firestore read is unavailable.
 */
export function extractFactsFromDocument(doc: KnowledgeDocument): KnowledgeFact[] {
  const facts: KnowledgeFact[] = [];
  if (doc.type !== 'course') return facts;
  const body = normalizeForMatch(doc.content);
  const push = (key: string, value: string | null, currency?: string) => {
    if (!value) return;
    facts.push({
      key,
      value,
      entityType: 'course',
      entityId: doc.id,
      currency,
      sourceType: doc.visibility === 'public' ? 'markdown' : 'default',
      sourceId: doc.sourceId,
      priority: SOURCE_PRIORITY.markdown,
      verified: doc.verified === true,
      visibility: 'public',
      updatedAt: doc.updatedAt,
    });
  };

  const priceMatch = doc.content.match(/Narx:\s*([\d.,\s]+)\s*(so'm|soʻm|sõm|sum|UZS)?\s*\/?\s*(oy)?/i);
  if (priceMatch) {
    const digits = priceMatch[1].replace(/[^\d]/g, '');
    if (digits) push('price', digits, 'UZS');
  }
  const durationMatch = doc.content.match(/Davomiylik:\s*(\d+)\s*(oy|hafta|kun|yil|am)?/i);
  if (durationMatch) {
    push('duration', durationMatch[1] + (durationMatch[2] || ''), undefined);
  }
  const ageMatch = doc.content.match(/Yoshi:\s*(\d+)\s*[-–]\s*(\d+)\s*yosh/i);
  if (ageMatch) {
    push('ageRange', ageMatch[1] + '-' + ageMatch[2], undefined);
  }
  void body;
  return facts;
}

/** Build a pure `CandidateContactValue` for a curated markdown doc. */
export function markdownContactCandidate(
  doc: KnowledgeDocument,
  sourceType: SourceType = 'markdown',
  priority: number = SOURCE_PRIORITY.markdown
): CandidateContactValue[] {
  const out: CandidateContactValue[] = [];
  const phoneMatch = doc.content.match(/Telefon:\s*([+\d][\d\s()-]*)/i);
  if (phoneMatch) {
    out.push({ field: 'phone', value: phoneMatch[1].trim(), sourceType, sourceId: doc.sourceId, priority, updatedAt: doc.updatedAt });
  }
  const telegramMatch = doc.content.match(/Telegram:\s*(@?[A-Za-z0-9_]+)/i);
  if (telegramMatch) {
    out.push({ field: 'telegram', value: telegramMatch[1].trim(), sourceType, sourceId: doc.sourceId, priority, updatedAt: doc.updatedAt });
  }
  const addrMatch = doc.content.match(/Yangiobod\s+tumani[^\n]*/i);
  if (addrMatch) {
    out.push({ field: 'address', value: addrMatch[0].trim(), sourceType, sourceId: doc.sourceId, priority, updatedAt: doc.updatedAt });
  }
  const hoursMatch = doc.content.match(/Dushanba[^\n]*09:00[^\n]*/i) || doc.content.match(/Dushanba[–-]Shanba:[^\n]*/i);
  if (hoursMatch) {
    out.push({ field: 'workingHours', value: hoursMatch[0].trim(), sourceType, sourceId: doc.sourceId, priority, updatedAt: doc.updatedAt });
  }
  return out;
}

/** Format a price value (digit string) as "380 000 so'm". */
export function formatUzbekSum(digits: string | number): string {
  const n = Number(digits);
  if (!Number.isFinite(n) || n <= 0) return '';
  const whole = String(Math.round(n));
  const grouped = whole.replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  return grouped + ' so\'m';
}

/** Map a SourcePriority to a numeric rank (higher wins). */
export function priorityNumber(key: SourcePriorityKey): number {
  return SOURCE_PRIORITY[key];
}

export type { SourcePriorityKey, Visibility };