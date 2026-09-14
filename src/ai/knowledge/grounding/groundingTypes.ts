/**
 * Grounding layer types.
 *
 * This module defines the API surface for the factual grounding pipeline.
 * It builds on the schema's `ClaimCategory` and `GroundingStatus` so the
 * whole layer speaks one vocabulary.
 */

import type { KnowledgeResult, KnowledgeFact, GroundingStatus, ClaimCategory } from '../schema/knowledge.schema';

export type { ClaimCategory, GroundingStatus };

export interface GroundingConstraint {
  claim: string;
  category: ClaimCategory;
  allowedStatuses?: GroundingStatus[];
  pattern?: RegExp;
  /** When true the pattern is a suffix test rather than a full match. */
  patternSuffix?: boolean;
  /** Minimum value for numeric claim (inclusive). */
  min?: number;
  /** Maximum value for numeric claim (inclusive). */
  max?: number;
  /** Explicit set of acceptable values (case-insensitive compare). */
  enum?: readonly string[];
}

export interface GroundingDecision {
  status: GroundingStatus;
  supported: boolean;
  message: string;
  claimCategory: ClaimCategory;
  highestSource: string | null;
  highestPriority: number;
  conflictDetected: boolean;
  conflictingValues: string[];
  fallbackUsed: boolean;
  candidates: KnowledgeResult[];
}

export interface GroundingOptions {
  answerText: string;
  facts: KnowledgeFact[];
  candidates: KnowledgeResult[];
  conflicts?: string[];
  /** True when there were zero deterministic candidates available. */
  fallbackUsed?: boolean;
  /** Override status when caller has already validated externally. */
  forcedStatus?: GroundingStatus;
}

export const UNVERIFIED_LABEL = 'AI javobi — tasdiqlanmagan ma\'lumot';
export const VERIFIED_LABEL = 'AI javobi — tasdiqlangan ma\'lumot';

export interface GroundingLabelDecision {
  label: string;
  showLabel: boolean;
  status: GroundingStatus;
}

export function groundingLabel(status: GroundingStatus | undefined | null): GroundingLabelDecision {
  const s: GroundingStatus = status || 'unsupported';
  const showLabel = s === 'verified';
  return {
    label: showLabel ? VERIFIED_LABEL : UNVERIFIED_LABEL,
    showLabel,
    status: s,
  };
}

export const GROUNDING_CONSTRAINTS: GroundingConstraint[] = [
  {
    claim: '+998 (88) 648-49-49',
    category: 'contact_phone',
    allowedStatuses: ['verified'],
    pattern: /^\+998[\s(]*(88)[\s)]*648[- ]*49[- ]*49$/,
    patternSuffix: false,
  },
  {
    claim: '@D_Furqatovich',
    category: 'contact_telegram',
    allowedStatuses: ['verified'],
    pattern: /@?D_Furqatovich$/i,
    patternSuffix: true,
  },
  {
    claim: 'Yangiobod tumani',
    category: 'contact_address',
    allowedStatuses: ['verified'],
    pattern: /Yangiobod tumani/i,
    patternSuffix: true,
  },
  {
    claim: '08:00–19:00',
    category: 'contact_hours',
    allowedStatuses: ['verified'],
    pattern: /08:\s*00.*?19:\s*00/,
    patternSuffix: false,
  },
  {
    claim: '380 000 so\'m',
    category: 'price',
    allowedStatuses: ['verified', 'partially_verified'],
    min: 100_000,
    max: 5_000_000,
  },
  {
    claim: '8 oy',
    category: 'duration',
    allowedStatuses: ['verified', 'partially_verified'],
    min: 1,
    max: 48,
  },
  {
    claim: '100% qabul',
    category: 'result_stat',
    allowedStatuses: ['verified'],
    pattern: /100\s*%/,
    patternSuffix: false,
  },
];