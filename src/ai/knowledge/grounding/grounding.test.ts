import { describe, it, expect } from 'vitest';
import { extractFactsFromText, extractNumericClaims, extractContactClaims } from './factualClaims';
import { evaluateClaim, validateAnswer, statusOfResults } from './validateAnswer';
import { groundingLabel } from './groundingTypes';
import type { KnowledgeFact, KnowledgeResult } from '../schema/knowledge.schema';

const REFERENCE_PHONE_DIGITS = '998886484949';

function phoneFact(): KnowledgeFact {
  return {
    key: 'phone',
    value: '+998 (88) 648-49-49',
    entityType: 'contact',
    entityId: 'contact.center',
    sourceType: 'markdown',
    sourceId: 'public-reference/center/2026',
    priority: 70,
    verified: true,
    visibility: 'public',
  };
}

function priceFact(value: number): KnowledgeFact {
  return {
    key: 'price',
    value,
    entityType: 'course',
    entityId: 'course.dtm-milliy-sertifikat',
    currency: 'UZS',
    sourceType: 'firestore_cms',
    sourceId: 'courses/dtm-milliy-sertifikat',
    priority: 100,
    verified: true,
    visibility: 'public',
  };
}

function candidate(id: string, facts: KnowledgeFact[] = [], verified = true): KnowledgeResult {
  return {
    id,
    entityType: 'course',
    title: id,
    content: '',
    sourceType: 'firestore_cms',
    sourceId: 'courses/' + id,
    score: 100,
    verified,
    visibility: 'public',
    priority: 100,
    facts,
    language: 'uz',
  };
}

describe('extractFactsFromText', () => {
  it('extracts a known reference phone from free text', () => {
    const claims = extractContactClaims('Siz bilan +998 (88) 648-49-49 orqali bog' + '\u2018' + 'lanamiz');
    const phone = claims.find((c) => c.category === 'contact_phone');
    expect(phone?.claim).toBe(REFERENCE_PHONE_DIGITS);
  });

  it('extracts a price in Uzbek sum format', () => {
    const claims = extractNumericClaims("Oylik to'lov 380,000 so'm/oy");
    const price = claims.find((c) => c.category === 'price');
    expect(price?.value).toBe(380000);
    expect(price?.currency).toBe('UZS');
  });

  it('extracts a duration like "8 oy"', () => {
    const claims = extractNumericClaims('Kurs 8 oy davom etadi');
    const dur = claims.find((c) => c.category === 'duration');
    expect(dur?.claim).toBe('8 oy');
  });

  it('does not hallucinate a contact claim from heading prose', () => {
    const claims = extractContactClaims('Matematika va fizika siri');
    expect(claims).toEqual([]);
  });
});

describe('evaluateClaim', () => {
  it('supports a claim matching the canonical fact', () => {
    const price = extractNumericClaims('380,000 so\'m')[0];
    expect(evaluateClaim(price, [priceFact(380000)], [])).toBe('supported');
  });

  it('rejects a mismatched price', () => {
    const price = extractNumericClaims('520,000 so\'m')[0];
    expect(evaluateClaim(price, [priceFact(380000)], [])).toBe('unsupported');
  });

  it('returns no_data when no deterministic facts exist', () => {
    const price = extractNumericClaims('380,000 so\'m')[0];
    expect(evaluateClaim(price, [], [])).toBe('no_data');
  });

  it('rejects a documented stale phone regardless of facts', () => {
    const claim = extractContactClaims('Telefon: +998 90 862-22-26')[0];
    expect(claim).toBeDefined();
    expect(claim.category).toBe('contact_phone');
    expect(evaluateClaim(claim, [phoneFact()], [])).toBe('unsupported');
  });

  it('rejects a phone that differs from the canonical fact', () => {
    const claim = extractContactClaims('Telefon: +998 (88) 123-45-67')[0];
    expect(evaluateClaim(claim, [phoneFact()], [])).toBe('unsupported');
  });

  it('rejects absurdly low prices', () => {
    const claim = extractNumericClaims('10,000 so\'m')[0];
    expect(evaluateClaim(claim, [priceFact(380000)], [])).toBe('unsupported');
  });
});

describe('validateAnswer', () => {
  it('returns verified when answer matches an authoritative fact', () => {
    const decision = validateAnswer({
      answerText: "Oylik to'lov 380,000 so'm.",
      facts: [priceFact(380000)],
      candidates: [],
    });
    expect(decision.status).toBe('verified');
    expect(decision.supported).toBe(true);
  });

  it('returns partially_verified when part of the answer is unsupported', () => {
    const decision = validateAnswer({
      answerText: "Oylik to'lov 380,000 so'm, jami 520,000 so'm chegirma bilan.",
      facts: [priceFact(380000)],
      candidates: [],
    });
    expect(decision.status).toBe('partially_verified');
  });

  it('returns partially_verified when the extracted claim is stale', () => {
    const decision = validateAnswer({
      answerText: 'Telefon: +998 90 862-22-26',
      facts: [phoneFact()],
      candidates: [],
    });
    expect(decision.status).toBe('partially_verified');
    expect(decision.supported).toBe(false);
  });

  it('returns unavailable when there is no supporting data at all', () => {
    const decision = validateAnswer({
      answerText: 'Narx 220,000 so\'m',
      facts: [],
      candidates: [],
      fallbackUsed: true,
    });
    expect(decision.status).toBe('unavailable');
  });

  it('honors forcedStatus', () => {
    const decision = validateAnswer({ answerText: 'whatever', facts: [], candidates: [], forcedStatus: 'verified' });
    expect(decision.status).toBe('verified');
  });
});

describe('statusOfResults + groundingLabel', () => {
  it('derives verified from verified candidates', () => {
    expect(statusOfResults([candidate('x', [priceFact(380000)])])).toBe('verified');
    expect(statusOfResults([])).toBe('unavailable');
  });

  it('shows the verified label only when the status is verified', () => {
    expect(groundingLabel('verified').showLabel).toBe(true);
    expect(groundingLabel(undefined).showLabel).toBe(false);
    expect(groundingLabel('partially_verified').showLabel).toBe(false);
  });
});