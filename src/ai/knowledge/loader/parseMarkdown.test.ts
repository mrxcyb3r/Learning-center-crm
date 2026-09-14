import { describe, it, expect } from 'vitest';
import { parseMarkdownDocument, splitSections } from './parseMarkdown';
import { validateKnowledgeDocument, hasCriticalIssue } from './validateKnowledge';

const SAMPLE = `---
id: course.test
type: course
title: Test Kursi
aliases: test, sinov kurs, trialdars
language: uz
status: published
visibility: public
source: supplied-reference-2026
sourceId: reference/test
verified: true
version: "1.0"
updatedAt: 2026-09-10
---

# Test Kursi

## Narx

- Narx: 400,000 so'm / oy
- Davomiylik: 6 oy
`;

describe('parseMarkdownDocument', () => {
  it('parses frontmatter fields into a KnowledgeDocument', () => {
    const doc = parseMarkdownDocument(SAMPLE)!;
    expect(doc).not.toBeNull();
    expect(doc.id).toBe('course.test');
    expect(doc.type).toBe('course');
    expect(doc.title).toBe('Test Kursi');
    expect(doc.aliases).toEqual(['test', 'sinov kurs', 'trialdars']);
    expect(doc.language).toBe('uz');
    expect(doc.verified).toBe(true);
    expect(doc.content).toContain('# Test Kursi');
    expect(doc.content).toContain('Narx: 400,000 so\'m / oy');
  });

  it('returns null for empty input or missing id/type', () => {
    expect(parseMarkdownDocument('')).toBeNull();
    expect(parseMarkdownDocument('---\ntitle: yo id\n---\nbody')).toBeNull();
    expect(parseMarkdownDocument('---\nid: x\n---\nbody')).toBeNull();
  });

  it('falls back gracefully when frontmatter is absent but id exists in body text', () => {
    // A doc without a --- block has no id → null (id is mandatory).
    expect(parseMarkdownDocument('# Hello\nplain body')).toBeNull();
  });
});

describe('splitSections', () => {
  it('splits document into heading-anchored sections', () => {
    const doc = parseMarkdownDocument(SAMPLE)!;
    const sections = splitSections(doc);
    expect(sections.length).toBeGreaterThanOrEqual(2);
    expect(sections[0].heading).toBe('Test Kursi');
    expect(sections[1].heading).toBe('Narx');
    expect(sections[1].body).toContain('Narx: 400,000 so\'m / oy');
  });
});

describe('validateKnowledgeDocument', () => {
  it('passes a well-formed document', () => {
    const doc = parseMarkdownDocument(SAMPLE)!;
    const issues = validateKnowledgeDocument(doc);
    expect(issues.filter((i) => i.severity === 'critical')).toHaveLength(0);
    expect(hasCriticalIssue(doc)).toBe(false);
  });

  it('flags an invalid entity type', () => {
    const parsed = parseMarkdownDocument(SAMPLE)!;
    const bad = { ...parsed, type: 'nonsense' as any };
    expect(validateKnowledgeDocument(bad).some((i) => i.code === 'doc_invalid_type')).toBe(true);
    expect(hasCriticalIssue(bad)).toBe(true);
  });

  it('flags empty content as a warning', () => {
    const parsed = parseMarkdownDocument(SAMPLE)!;
    const bad = { ...parsed, content: '   ' };
    expect(validateKnowledgeDocument(bad).some((i) => i.code === 'doc_empty_content')).toBe(true);
  });
});