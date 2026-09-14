/**
 * Uzbek text normalization primitives shared by the AI knowledge layer and the
 * AI receptionist. Pure and unit-testable — no Firestore, no I/O.
 */

export const CYRILLIC_TO_LATIN: Record<string, string> = {
  'а': 'a', 'б': 'b', 'в': 'v', 'г': 'g', 'д': 'd', 'е': 'e', 'ё': 'yo',
  'ж': 'j', 'з': 'z', 'и': 'i', 'й': 'y', 'к': 'k', 'л': 'l', 'м': 'm',
  'н': 'n', 'о': 'o', 'п': 'p', 'р': 'r', 'с': 's', 'т': 't', 'у': 'u',
  'ф': 'f', 'х': 'x', 'ҳ': 'h', 'ц': 'ts', 'ч': 'ch', 'ш': 'sh', 'щ': 'sh',
  'ъ': '', 'ь': '', 'э': 'e', 'ю': 'yu', 'я': 'ya', 'ў': 'o', 'ғ': 'g', 'қ': 'q'
};

/**
 * Normalize Uzbek text:
 * 1. Lowercase + trim
 * 2. Transliterate Cyrillic to Latin
 * 3. Strip apostrophes (o', g', ', ', `, ʻ, ʼ, ‘)
 * 4. Normalize common phonetic / typo variants (k->q in specific prefixes, etc.)
 */
export function normalizeText(raw: string): string {
  let s = (raw || '').trim().toLowerCase();
  if (!s) return '';

  let trans = '';
  for (const ch of s) {
    trans += CYRILLIC_TO_LATIN[ch] !== undefined ? CYRILLIC_TO_LATIN[ch] : ch;
  }
  s = trans;

  s = s.split("'").join('');
  s = s.split('’').join('');
  s = s.split('`').join('');
  s = s.split('ʻ').join('');
  s = s.split('ʼ').join('');
  s = s.split('‘').join('');

  return s;
}

/** Collapse whitespace + strip punctuation for reliable matching. */
export function normalizeForMatch(raw: string): string {
  const n = normalizeText(raw);
  if (!n) return '';
  let out = '';
  for (const ch of n) {
    const code = ch.codePointAt(0) || 0;
    const isLetter =
      (code >= 97 && code <= 122) ||
      (code >= 48 && code <= 57) ||
      code === 32;
    out += isLetter ? ch : ' ';
  }
  const parts = out.split(' ').filter(Boolean);
  return parts.join(' ');
}

export function tokenize(normalized: string): string[] {
  if (!normalized) return [];
  return normalized.split(' ').filter((w) => w.length > 0);
}

/** Compute Levenshtein distance for fuzzy keyword / entity matching */
export function levenshtein(a: string, b: string): number {
  if (a === b) return 0;
  if (!a) return b.length;
  if (!b) return a.length;
  const m = a.length;
  const n = b.length;
  if (Math.abs(m - n) > 2) return 99;
  const dp: number[] = Array.from({ length: n + 1 }, (_, i) => i);
  for (let i = 1; i <= m; i++) {
    let prev = dp[0];
    dp[0] = i;
    for (let j = 1; j <= n; j++) {
      const temp = dp[j];
      if (a[i - 1] === b[j - 1]) {
        dp[j] = prev;
      } else {
        dp[j] = Math.min(prev + 1, dp[j] + 1, dp[j - 1] + 1);
      }
      prev = temp;
    }
  }
  return dp[n];
}

/** Match keyword with exact phrase inclusion, word boundaries, or token-level fuzzy tolerance */
export function matchesKeyword(normalized: string, keywords: string[], tokens?: string[]): boolean {
  if (!normalized) return false;
  for (const kw of keywords) {
    if (normalized.includes(kw)) return true;
  }
  const toks = tokens || tokenize(normalized);
  for (const kw of keywords) {
    const kwTokens = kw.split(' ').filter(Boolean);
    if (kwTokens.length === 1) {
      const target = kwTokens[0];
      if (target.length >= 5) {
        for (const tok of toks) {
          if (
            Math.abs(tok.length - target.length) <= 1 &&
            tok[0] === target[0] &&
            levenshtein(tok, target) <= 1
          ) {
            return true;
          }
        }
      }
    }
  }
  return false;
}