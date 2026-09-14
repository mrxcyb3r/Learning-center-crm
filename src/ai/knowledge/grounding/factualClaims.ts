/**
 * Factual claim extraction.
 *
 * Provides helpers that pull structured, groundable claims out of an
 * AI answer so they can be verified against authoritative KnowledgeFacts.
 */

import { telephoneHandle, phoneDigits } from '../retrieval/exact';
import type { FactualClaim } from '../schema/knowledge.schema';

function durationText(value: number, unit: string): string {
  const u = unit.toLowerCase();
  return `${value} ${u}`;
}

/**
 * Extract every numeric price/duration/percent claim embedded in the text.
 * Returns claims with a `render` function producing the recommended display.
 */
export function extractNumericClaims(text: string): FactualClaim[] {
  const claims: FactualClaim[] = [];
  // price: digits possibly with spaces, followed by so'm/soʻm/sum/som/UZS
  const priceRe = /(\d[\d.,\s]*)\s*(?:so[''ʻ’]?m|so'm|soʻm|sum|som|UZS)/gi;
  let m: RegExpExecArray | null;
  while ((m = priceRe.exec(text)) !== null) {
    const digits = m[1].replace(/[^\d]/g, '');
    if (!digits) continue;
    const num = Number(digits);
    claims.push({
      id: `price-${digits}-${claims.length}`,
      text: m[0].trim(),
      claim: digits,
      category: 'price',
      kind: 'FACT',
      groundable: true,
      value: num,
      unit: 'UZS',
      currency: 'UZS',
      render: (v) =>
        Number(v) > 0 ? `${Number(v).toLocaleString('uz-UZ').replace(/,/g, ' ')} so'm` : '',
    });
  }
  // duration: number followed by oy/hafta/kun/yil
  const durRe = /(\d{1,2})\s*(oy|hafta|kun|yil)/gi;
  while ((m = durRe.exec(text)) !== null) {
    const num = Number(m[1]);
    const unit = m[2].toLowerCase();
    claims.push({
      id: `duration-${m[1]}-${claims.length}`,
      text: m[0].trim(),
      claim: durationText(num, unit),
      category: 'duration',
      kind: 'FACT',
      groundable: true,
      value: num,
      unit,
      render: (v) => durationText(Number(v), unit),
    });
  }
  // percentage claims
  const pctRe = /(?:\D|^)(\d{1,3})\s*%/g;
  while ((m = pctRe.exec(text)) !== null) {
    claims.push({
      id: `percent-${m[1]}-${claims.length}`,
      text: m[0].trim(),
      claim: `${m[1]}%`,
      category: 'result_stat',
      kind: 'MARKETING_CLAIM',
      groundable: true,
      value: Number(m[1]),
      unit: '%',
      render: (v) => `${v}%`,
    });
  }
  return claims;
}

/** Extract contact handles recognized by exact normalizers. */
export function extractContactClaims(text: string): FactualClaim[] {
  const claims: FactualClaim[] = [];
  const raw = text;
  const seen = new Set<string>();

  const phoneRe = /(?:\+998\s*)?(?:\(?\d{2}\)?[\s-]?\d{3}[- ]?\d{2}[- ]?\d{2})/g;
  let m: RegExpExecArray | null;
  while ((m = phoneRe.exec(raw)) !== null) {
    const digits = phoneDigits(m[0]);
    if (!digits || digits.length < 9 || seen.has(digits)) continue;
    seen.add(digits);
    claims.push({
      id: `phone-${digits}`,
      text: m[0].trim(),
      claim: digits,
      category: 'contact_phone',
      kind: 'FACT',
      groundable: true,
      value: digits,
      render: (v) => `+${phoneDigits(String(v)).slice(0, 3)} (${String(v).slice(3, 5)}) ${String(v).slice(5, 8)}-${String(v).slice(8, 10)}-${String(v).slice(10, 12)}`,
    });
  }

  const telegramRe = /(?:@|telegram\s*:\s*|tg\s*:\s*|t\.me\/)([A-Za-z][A-Za-z0-9_]{2,30})/g;
  while ((m = telegramRe.exec(raw)) !== null) {
    const handle = telephoneHandle(m[1]);
    if (!handle || handle.length < 3) continue;
    if (seen.has('tg:' + handle)) continue;
    seen.add('tg:' + handle);
    claims.push({
      id: `telegram-${handle}`,
      text: m[0].trim(),
      claim: handle,
      category: 'contact_telegram',
      kind: 'FACT',
      groundable: true,
      value: handle,
      render: (v) => `@${v}`,
    });
  }
  return claims;
}

/** Extract every groundable claim from a free-text AI answer. */
export function extractFactsFromText(text: string): FactualClaim[] {
  return [...extractNumericClaims(text), ...extractContactClaims(text)];
}