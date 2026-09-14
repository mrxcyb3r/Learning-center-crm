/**
 * Semantic retrieval provider interface.
 * Currently the project has no embedding/vector infrastructure.
 * This module provides a clean provider contract so a future semantic layer
 * can be dropped in without changing callers. The default returns empty.
 */

export interface SemanticHit {
  id: string;
  score: number;
}

export interface SemanticProvider {
  /** Embed a normalized query into a vector (returns null if not available). */
  embed(query: string): Promise<number[] | null>;
  /** Semantic search over the corpus. Returns hits ordered by relevance. */
  search(query: string, limit?: number): Promise<SemanticHit[]>;
  /** True when the provider is configured and available. */
  available: boolean;
}

const NOOP_PROVIDER: SemanticProvider = {
  available: false,
  async embed(): Promise<null> {
    return null;
  },
  async search(): Promise<SemanticHit[]> {
    return [];
  },
};

let current: SemanticProvider = NOOP_PROVIDER;

export function getSemanticProvider(): SemanticProvider {
  return current;
}

export function setSemanticProvider(provider: SemanticProvider): void {
  current = provider;
}

/** Convenience: semantic search with automatic fallback. */
export async function semanticSearch(query: string, limit = 10): Promise<SemanticHit[]> {
  const p = getSemanticProvider();
  if (!p.available) return [];
  return p.search(query, limit);
}
