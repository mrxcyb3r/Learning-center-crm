/**
 * Grounding decision engine.
 *
 * Given an AI answer plus deterministic facts and candidates, decides the
 * grounding status: verified / partially_verified / conflict / unsupported /
 * stale / unavailable.
 *
 * Industry rule we implement: the LLM is a renderer, NOT the authority.
 * A claim is only `verified` when a deterministic source (Firestore/curated
 * markdown/known file) supports it at sufficient priority.
 */

import { extractFactsFromText } from './factualClaims';
import { GROUNDING_CONSTRAINTS } from './groundingTypes';
import type { GroundingDecision, GroundingOptions, ClaimCategory } from './groundingTypes';
import { telephoneHandle, phoneDigits, isKnownStale } from '../retrieval/exact';
import type { KnowledgeResult, KnowledgeFact, FactualClaim, GroundingStatus } from '../schema/knowledge.schema';

type Verdict = 'supported' | 'unsupported' | 'no_data';

function normalizeClaimValue(claim: FactualClaim): string {
  switch (claim.category) {
    case 'contact_phone':
      return phoneDigits(String(claim.claim));
    case 'contact_telegram':
      return telephoneHandle(String(claim.claim));
    case 'price':
      return String(claim.claim).replace(/[^\d]/g, '');
    case 'duration':
      return String(claim.claim).trim().toLowerCase();
    default:
      return String(claim.claim).trim().toLowerCase();
  }
}

function normalizeFactValue(fact: KnowledgeFact): string {
  switch (fact.key) {
    case 'price':
      return String(fact.value).replace(/[^\d]/g, '');
    case 'duration':
      return String(fact.value).trim().toLowerCase();
    case 'phone':
    case 'phone_main':
    case 'phone_sub':
      return phoneDigits(String(fact.value));
    case 'telegram':
      return telephoneHandle(String(fact.value));
    default:
      return String(fact.value).trim().toLowerCase();
  }
}

function factKeyForCategory(category: ClaimCategory): string {
  switch (category) {
    case 'contact_phone':
      return 'phone';
    case 'contact_telegram':
      return 'telegram';
    case 'price':
      return 'price';
    case 'duration':
      return 'duration';
    case 'age':
      return 'ageRange';
    case 'result_stat':
      return 'result';
    default:
      return '';
  }
}

function factMatchesCategory(fact: KnowledgeFact, category: ClaimCategory): boolean {
  const key = factKeyForCategory(category);
  if (!key) return false;
  return fact.key === key || fact.key.startsWith(key + '_');
}

/** Extract candidate facts from a single KnowledgeResult. */
function factsFromCandidate(candidate: KnowledgeResult): KnowledgeFact[] {
  if (candidate.facts && candidate.facts.length > 0) return candidate.facts;
  return [];
}

/** Numeric constraint check: min/max bounds on price/duration/percent. */
function claimOutOfBounds(claim: FactualClaim): boolean {
  const constraint = GROUNDING_CONSTRAINTS.find((c) => c.category === claim.category);
  if (!constraint) return false;
  if (claim.category === 'result_stat') {
    const pct = Number(claim.value ?? 0);
    if (pct > 100) return true;
  }
  if (claim.value === undefined) return false;
  const num = Number(claim.value);
  if (Number.isFinite(num)) {
    if (constraint.min !== undefined && num < constraint.min) return true;
    if (constraint.max !== undefined && num > constraint.max) return true;
  }
  return false;
}

function isVerySmallPrice(claim: FactualClaim): boolean {
  if (claim.category !== 'price') return false;
  const num = Number(claim.value ?? String(claim.claim).replace(/[^\d]/g, ''));
  return Number.isFinite(num) && num < 50_000;
}

export function evaluateClaim(claim: FactualClaim, facts: KnowledgeFact[], candidates: KnowledgeResult[]): Verdict {
  const categoryFacts = facts.filter((f) => factMatchesCategory(f, claim.category));
  const candidateFacts = candidates.flatMap((c) => factsFromCandidate(c));

  // 1) Demonstrably false values (stale / absurd).
  if (claim.category === 'contact_phone' && isKnownStale('phone', String(claim.claim))) return 'unsupported';
  if (claim.category === 'contact_telegram' && isKnownStale('telegram', String(claim.claim))) return 'unsupported';
  if (claim.category === 'result_stat' && Number(claim.value ?? 0) > 100) return 'unsupported';
  if (claimOutOfBounds(claim)) return 'unsupported';
  if (isVerySmallPrice(claim)) return 'unsupported'; // obviously impossible monthly fee

  const all = [...categoryFacts, ...candidateFacts].sort((a, b) => (b.priority ?? -1) - (a.priority ?? -1));
  if (all.length === 0) return 'no_data';

  const wanted = normalizeClaimValue(claim);
  const pool = all.map((f) => normalizeFactValue(f));
  return pool.includes(wanted) ? 'supported' : 'unsupported';
}

function forcedDecision(status: GroundingStatus, options: GroundingOptions): GroundingDecision {
  return {
    status,
    supported: status === 'verified',
    message:
      status === 'verified'
        ? 'Barcha tekshiriladigan daʼvolar tasdiqlangan manba tomonidan qoʻllab-quvvatlanadi.'
        : "Ma'lumot tasdiqlanmagan — javob ikkinchi darajali.",
    claimCategory: 'other',
    highestSource: options.candidates[0]?.sourceId ?? null,
    highestPriority: options.candidates[0]?.priority ?? -1,
    conflictDetected: (options.conflicts?.length ?? 0) > 0,
    conflictingValues: options.conflicts || [],
    fallbackUsed: options.fallbackUsed === true,
    candidates: options.candidates.slice(0, 5),
  };
}

/** Full grounding decision. */
export function validateAnswer(options: GroundingOptions): GroundingDecision {
  if (options.forcedStatus) return forcedDecision(options.forcedStatus, options);

  const claims = extractFactsFromText(options.answerText || '');
  const facts = options.facts || [];
  const candidates = options.candidates || [];

  const results: Array<{ claim: FactualClaim; verdict: Verdict }> = claims.map((c) => ({
    claim: c,
    verdict: evaluateClaim(c, facts, candidates),
  }));

  const supported = results.filter((r) => r.verdict === 'supported');
  const unsupported = results.filter((r) => r.verdict === 'unsupported');
  const noData = results.filter((r) => r.verdict === 'no_data');

  const conflictDetected = (options.conflicts?.length ?? 0) > 0;
  const fallbackUsed = options.fallbackUsed === true;

  let status: GroundingStatus;
  if (results.length === 0 || (supported.length === 0 && noData.length === results.length && unsupported.length === 0)) {
    status = fallbackUsed ? 'unavailable' : (results.length === 0 ? 'unsupported' : 'unavailable');
  } else if (conflictDetected) {
    status = 'conflict';
  } else if (unsupported.length > 0) {
    status = 'partially_verified';
  } else if (noData.length > 0) {
    status = 'partially_verified';
  } else {
    status = 'verified';
  }

  const message =
    status === 'verified'
      ? 'Barcha tekshiriladigan daʼvolar tasdiqlangan manba tomonidan qoʻllab-quvvatlanadi.'
      : status === 'partially_verified'
        ? "Javobdagi ayrim ma'lumotlar tasdiqlangan manba bilan mos kelmadi yoki yetarli manba topilmadi."
        : status === 'conflict'
          ? 'Manbalar oʼrtasida ziddiyat aniqlangan — qoʼshimcha tekshirish zarur.'
          : status === 'unavailable'
            ? 'Qoʼllab-quvvatlovchi maʼlumot hozircha ochiq emas — javob ikkinchi darajali (unavailable).'
            : 'Hech qanday tekshiriladigan daʼvo topilmadi — javob maʼlumotlarsiz qoldirildi.';

  const highestPriority = Math.max(-1, ...facts.map((f) => f.priority ?? -1), ...candidates.map((c) => c.priority ?? -1));
  const highestCandidates = [
    ...facts.filter((f) => f.priority === highestPriority),
    ...candidates.filter((c) => c.priority === highestPriority),
  ];
  const conflictingValues = [
    ...new Set(highestCandidates.map((f) => String('key' in f ? f.value : f.content))),
  ].filter(Boolean).slice(0, 3);

  return {
    status,
    supported: supported.length > 0,
    message,
    claimCategory: claims[0]?.category ?? 'other',
    highestSource: highestCandidates[0]?.sourceId ?? null,
    highestPriority,
    conflictDetected,
    conflictingValues,
    fallbackUsed,
    candidates: candidates.slice(0, 5),
  };
}

/** Convenience status for a deterministic candidate bundle. */
export function statusOfResults(candidates: KnowledgeResult[]): GroundingStatus {
  if (candidates.length === 0) return 'unavailable';
  const top = candidates[0];
  if (top.verified) return 'verified';
  if (top.visibility === 'private') return 'unsupported';
  return top.sourceType === 'markdown' || top.sourceType === 'firestore_cms' ? 'verified' : 'unavailable';
}