/**
 * Center contact adapter.
 *
 * Collects every authoritative candidate for the center's contact fields
 * (phone, telegram, email, address, working hours) from:
 *   1. settings/center      (admin, priority 90)
 *   2. curated markdown     (knowledge docs, priority 70)
 *   3. settings/landing_cms (public site, priority 60)
 * then resolves the canonical contact via `resolveCanonicalContact`.
 *
 * Candidates pass through the stale denylist + conflict detection, so a stale
 * phone that still lives in landing_cms can never surface as the answer.
 */

import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../../services/firebase';
import { landingCmsService } from '../../../services/repository';
import type {
  CanonicalContact,
  CanonicalContactInput,
  CandidateContactValue,
} from '../retrieval/exact';
import {
  resolveCanonicalContact,
  markdownContactCandidate,
} from '../retrieval/exact';
import {
  SETTINGS_PRIORITY,
  MARKDOWN_PRIORITY,
} from '../grounding/sourcePriority';
import type { KnowledgeIndex } from '../loader/loadKnowledge';
import type { CenterSettingsShape } from './types';
import { CENTER_IDS } from '../entities/entityTypes';

const CENTER_DOC_ID = CENTER_IDS.CENTER;

const LANDING_PRIORITY = 60;

interface ContactSourceInput {
  index?: KnowledgeIndex | null;
  settings?: CenterSettingsShape | null;
  landingCms?: Record<string, unknown> | null;
}

function settingsCandidates(s: CenterSettingsShape): CandidateContactValue[] {
  const out: CandidateContactValue[] = [];
  const push = (field: CandidateContactValue['field'], value: string | null | undefined, subPhone?: boolean) => {
    if (!value) return;
    out.push({
      field,
      value,
      sourceType: 'firestore_settings',
      sourceId: subPhone ? 'settings/center.secondaryPhone' : 'settings/center',
      priority: SETTINGS_PRIORITY,
      updatedAt: new Date().toISOString(),
    });
  };
  push('phone', s.hotline);
  push('phone', s.secondaryPhone, true);
  push('email', s.email);
  push('workingHours', s.workingHours);
  if (s.telegramSettings?.botUsername) push('telegram', '@' + s.telegramSettings.botUsername);
  if (s.address) push('address', s.address);
  for (const [i, b] of (s.branches || []).entries()) {
    push('address', b.name + (b.address ? ': ' + b.address : ''), i > 0);
  }
  return out;
}

function landingCandidates(cms: Record<string, unknown>): CandidateContactValue[] {
  const out: CandidateContactValue[] = [];
  const push = (field: CandidateContactValue['field'], value: unknown) => {
    if (value == null || String(value).trim() === '') return;
    out.push({
      field,
      value: String(value),
      sourceType: 'firestore_settings',
      sourceId: 'settings/landing_cms',
      priority: LANDING_PRIORITY,
    });
  };
  const contact = (cms as Record<string, unknown>).contact as Record<string, unknown> | undefined;
  if (contact) {
    push('phone', contact.phone);
    push('telegram', contact.telegram);
    push('email', contact.email);
    if (contact.branches && Array.isArray(contact.branches)) {
      (contact.branches as Array<unknown>).forEach((b) => push('address', b));
    }
  }
  push('phone', cms.phone || cms.phonePrimary || cms.phoneSecondary);
  push('telegram', cms.telegramHandle || cms.telegramUsername);
  push('workingHours', cms.workingHours || cms.operatingHoursUz);
  push('address', cms.addressUz || cms.address || cms.location1);
  return out;
}

export function buildContactCandidates(input: ContactSourceInput): CanonicalContactInput {
  const settings = input.settings || {};
  const landing = input.landingCms || {};
  const centerDoc = input.index?.byId.get(CENTER_DOC_ID);

  const allSettings = settingsCandidates(settings);
  const allLanding = landingCandidates(landing);
  const allMarkdown = centerDoc ? markdownContactCandidate(centerDoc, 'markdown', MARKDOWN_PRIORITY) : [];

  const perField: CanonicalContactInput = {};
  for (const field of ['phone', 'telegram', 'email', 'address', 'workingHours'] as const) {
    perField[field] = [
      ...allSettings.filter((c) => c.field === field),
      ...allLanding.filter((c) => c.field === field),
      ...allMarkdown.filter((c) => c.field === field),
    ];
  }
  return perField;
}

/** Resolve the canonical contact from a candidate bundle. */
export function resolveContact(input: CanonicalContactInput): CanonicalContact {
  return resolveCanonicalContact(input);
}

/**
 * Live helper: read settings/center (anon-safe) + landing_cms and produce the
 * canonical contact. On any DB error, still returns markdown-backed candidates.
 */
export async function fetchCenterContact(index: KnowledgeIndex | null): Promise<{ contact: CanonicalContact; candidates: CanonicalContactInput }> {
  let settings: CenterSettingsShape | null = null;
  let landingCms: Record<string, unknown> | null = null;

  try {
    const snap = await getDoc(doc(db, 'settings', 'center'));
    settings = snap.exists() ? (snap.data() as CenterSettingsShape) : null;
  } catch {
    settings = null; // anon/public cannot read admin settings — expected.
  }
  try {
    landingCms = await landingCmsService.getLandingContent();
  } catch {
    landingCms = null;
  }

  const candidates = buildContactCandidates({ index, settings, landingCms });
  return { contact: resolveCanonicalContact(candidates), candidates };
}