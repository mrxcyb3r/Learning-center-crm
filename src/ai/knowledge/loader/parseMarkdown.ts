/**
 * Markdown knowledge document parser.
 * Parses YAML-ish frontmatter (--- block) plus body sections into a
 * KnowledgeDocument. Frontmatter values are parsed as booleans/numbers where
 * unambiguous; lists are comma-separated.
 */

import type { KnowledgeDocument, Language, Visibility } from '../schema/knowledge.schema';

const FRONTMATTER_RE = /^---\s*\n([\s\S]*?)\n---\s*\n?/;

function parseValue(raw: string): unknown {
  const v = raw.trim();
  if (v === 'true' || v === 'True') return true;
  if (v === 'false' || v === 'False') return false;
  if (/^\d+$/.test(v)) return Number(v);
  if (v.includes(',')) {
    return v
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
  }
  return v;
}

function parseFrontmatter(block: string): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const line of block.split('\n')) {
    if (!line.trim() || line.trim().startsWith('#')) continue;
    const idx = line.indexOf(':');
    if (idx <= 0) continue;
    const key = line.slice(0, idx).trim();
    const value = line.slice(idx + 1).trim();
    if (!key) continue;
    out[key] = parseValue(value);
  }
  return out;
}

function toLanguage(raw: unknown): Language {
  const s = String(raw || 'uz').toLowerCase();
  if (s.startsWith('ru')) return 'ru';
  if (s.startsWith('en')) return 'en';
  return 'uz';
}

function toVisibility(raw: unknown): Visibility {
  return String(raw || 'public') === 'private' ? 'private' : 'public';
}

export function parseMarkdownDocument(raw: string): KnowledgeDocument | null {
  if (!raw || !raw.trim()) return null;
  const m = raw.match(FRONTMATTER_RE);
  const frontmatter = m ? parseFrontmatter(m[1]) : {};
  const content = m ? raw.slice(m[0].length).trim() : raw.trim();

  const id = String(frontmatter.id || '').trim();
  if (!id) return null;

  const typeRaw = String(frontmatter.type || '').trim();
  if (!typeRaw) return null;

  const doc: KnowledgeDocument = {
    id,
    type: typeRaw as KnowledgeDocument['type'],
    title: String(frontmatter.title || id),
    aliases: Array.isArray(frontmatter.aliases)
      ? (frontmatter.aliases as string[]).filter(Boolean)
      : frontmatter.aliases
        ? String(frontmatter.aliases).split(',').map((s) => s.trim()).filter(Boolean)
        : [],
    language: toLanguage(frontmatter.language),
    status: String(frontmatter.status || 'published') === 'draft' ? 'draft' : String(frontmatter.status || 'published') === 'archived' ? 'archived' : 'published',
    visibility: toVisibility(frontmatter.visibility),
    source: String(frontmatter.source || 'markdown'),
    sourceId: String(frontmatter.sourceId || 'markdown.' + id),
    verified: frontmatter.verified !== false && frontmatter.verified !== 'false',
    version: frontmatter.version ? String(frontmatter.version) : undefined,
    updatedAt: frontmatter.updatedAt ? String(frontmatter.updatedAt) : undefined,
    relationships:
      typeof frontmatter.relationships === 'object' && frontmatter.relationships !== null
        ? (frontmatter.relationships as Record<string, string[]>)
        : undefined,
    frontmatter,
    content,
  };
  return doc;
}

/** Split a knowledge document body into heading-anchored sections. */
export function splitSections(doc: KnowledgeDocument): Array<{ heading: string; body: string }> {
  const sections: Array<{ heading: string; body: string }> = [];
  let heading = '';
  let body: string[] = [];
  for (const line of doc.content.split('\n')) {
    if (/^#{1,3}\s+/.test(line)) {
      if (heading || body.length > 0) {
        sections.push({ heading, body: body.join('\n').trim() });
      }
      heading = line.replace(/^#{1,3}\s+/, '').trim();
      body = [];
    } else {
      body.push(line);
    }
  }
  if (heading || body.length > 0) {
    sections.push({ heading, body: body.join('\n').trim() });
  }
  return sections;
}