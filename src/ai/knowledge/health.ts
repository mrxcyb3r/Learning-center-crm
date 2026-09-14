/**
 * Knowledge layer health / diagnostics.
 *
 * Admin-only observability for the curated markdown corpus + canonical contact
 * state. Live Firestore counts already live in aiReceptionist.getKnowledgeHealth();
 * this adds the markdown-layer surface (doc validation, alias coverage, stale
 * contact risk) so the AI dashboard can show the full picture.
 */

import { getKnowledgeIndex, type KnowledgeIndex } from './loader/loadKnowledge';
import type { KnowledgeIssue } from '../../services/aiKnowledge';
import { resolveCanonicalContact, markdownContactCandidate } from './retrieval/exact';
import type { CanonicalContact, CandidateContactValue } from './retrieval/exact';
import { MARKDOWN_PRIORITY } from './grounding/sourcePriority';
import { CENTER_IDS } from './entities/entityTypes';

export interface MarkdownDocHealth {
  id: string;
  type: string;
  title: string;
  status: string;
  validationIssues: KnowledgeIssue[];
}

export interface MarkdownKnowledgeHealth {
  totalDocs: number;
  published: number;
  byType: Record<string, number>;
  docs: MarkdownDocHealth[];
  validationIssues: KnowledgeIssue[];
  canonicalContact: {
    phone: string | null;
    telegram: string | null;
    address: string | null;
    workingHours: string | null;
    conflictFields: string[];
    verified: boolean;
  };
  /** True when the curated reference carries a valid phone (deterministic answer available). */
  contactReferencePresent: boolean;
  builtAt: string;
}

export type { KnowledgeIndex };

function renderCenterContact(index: KnowledgeIndex): CanonicalContact {
  const centerDoc = index.byId.get(CENTER_IDS.CENTER);
  const allCandidates: CandidateContactValue[] = centerDoc
    ? markdownContactCandidate(centerDoc, 'markdown', MARKDOWN_PRIORITY)
    : [];
  const byField = (field: CandidateContactValue['field']) => allCandidates.filter((c) => c.field === field);
  return resolveCanonicalContact({
    phone: byField('phone'),
    telegram: byField('telegram'),
    address: byField('address'),
    workingHours: byField('workingHours'),
  });
}

/** Aggregate markdown corpus health. Pure — reads the built index only. */
export function getMarkdownKnowledgeHealth(): MarkdownKnowledgeHealth {
  const index = getKnowledgeIndex();
  const docs = index.documents.map((d) => ({
    id: d.id,
    type: d.type,
    title: d.title,
    status: d.status,
    validationIssues: [],
  }));

  const byType: Record<string, number> = {};
  for (const d of index.documents) byType[d.type] = (byType[d.type] || 0) + 1;

  const contact = renderCenterContact(index);

  return {
    totalDocs: index.documents.length,
    published: index.documents.filter((d) => d.status === 'published').length,
    byType,
    docs,
    validationIssues: index.issues,
    canonicalContact: {
      phone: contact.phone.value,
      telegram: contact.telegram.value,
      address: contact.address.value,
      workingHours: contact.workingHours.value,
      conflictFields: contact.conflictFields,
      verified: contact.phone.verified || contact.telegram.verified || contact.address.verified,
    },
    contactReferencePresent: Boolean(contact.phone.value) || Boolean(contact.telegram.value),
    builtAt: index.builtAt,
  };
}

/** Short human summary line for dashboards. */
export function markdownHealthSummary(health: MarkdownKnowledgeHealth): string {
  const issues = health.validationIssues.filter((i) => i.severity === 'critical').length;
  return `${health.published}/${health.totalDocs} ta knowledge hujjat faol; ${issues} jiddiy muammo; telefon ${health.canonicalContact.phone || "yo'q"}`;
}