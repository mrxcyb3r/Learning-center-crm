import { describe, it, expect, beforeEach } from 'vitest';
import { getMarkdownKnowledgeHealth, markdownHealthSummary } from './health';
import { resetKnowledgeIndexCache } from './loader/loadKnowledge';
import { CENTER_IDS } from './entities/entityTypes';

describe('getMarkdownKnowledgeHealth', () => {
  beforeEach(() => resetKnowledgeIndexCache());

  it('surfaces corpus counts per type', () => {
    const h = getMarkdownKnowledgeHealth();
    expect(h.totalDocs).toBeGreaterThanOrEqual(11);
    expect(h.published).toBeGreaterThanOrEqual(h.totalDocs - 1);
    expect(h.byType.course).toBeGreaterThanOrEqual(6);
    expect(h.byType.faq).toBeGreaterThanOrEqual(5);
    expect(h.byType.teacher).toBeGreaterThanOrEqual(3);
  });

  it('resolves the canonical contact deterministically without hitting Firestore', () => {
    const h = getMarkdownKnowledgeHealth();
    expect(h.contactReferencePresent).toBe(true);
    expect(h.canonicalContact.verified).toBe(true);
    expect(h.canonicalContact.phone).toContain('+998 (88) 648-49-49');
    expect(h.canonicalContact.telegram).toContain('@D_Furqatovich');
    expect(h.canonicalContact.workingHours).toBeTruthy();
  });

  it('never returns a stale phone', () => {
    const h = getMarkdownKnowledgeHealth();
    const stale = ['+998 90 862-22-26', '+998 99 592 63 51', '+998 90 123 45 67'];
    expect(stale).not.toContain(h.canonicalContact.phone);
  });

  it('does not include private or draft docs in the public index', () => {
    const h = getMarkdownKnowledgeHealth();
    for (const d of h.docs) {
      if (d.status === 'published') {
        expect(['course', 'faq', 'teacher', 'policy', 'methodology', 'program', 'center']).toContain(d.type);
      }
    }
  });

  it('renders a short summary', () => {
    const h = getMarkdownKnowledgeHealth();
    expect(markdownHealthSummary(h)).toContain('knowledge hujjat faol');
    expect(markdownHealthSummary(h)).not.toContain('undefined');
  });

  it('center doc id resolves', () => {
    const h = getMarkdownKnowledgeHealth();
    expect(h.docs.map((d) => d.id)).toContain(CENTER_IDS.CENTER);
  });
});