import { describe, it, expect } from 'vitest';
import {
  courseToKnowledgeResult,
  teacherToKnowledgeResult,
  resultToKnowledgeResult,
  faqToKnowledgeResult,
  coursePriceFact,
  formatPrice,
} from './firestoreAdapter';

describe('courseToKnowledgeResult', () => {
  it('maps a course shape deterministically with a price fact', () => {
    const r = courseToKnowledgeResult({
      id: 'c1',
      title: 'DTM Milliy Sertifikat',
      shortTitle: 'DTM',
      description: 'Tayyorlov',
      monthlyFee: 380000,
      duration: '8 oy',
      ageRangeLabel: '10-11 sinf',
      teacherId: 't1',
      updatedAt: '2026-09-01',
    });
    expect(r).not.toBeNull();
    expect(r!.id).toBe('c1');
    expect(r!.entityType).toBe('course');
    expect(r!.verified).toBe(true);
    const price = r!.facts.find((f) => f.key === 'price');
    expect(price?.value).toBe(380000);
    expect(price?.currency).toBe('UZS');
    expect(price?.sourceType).toBe('firestore_cms');
    expect(r!.relationships).toContain('t1');
    expect(r!.visibility).toBe('public');
  });

  it('returns null without an id', () => {
    expect(courseToKnowledgeResult({ title: 'X' })).toBeNull();
  });

  it('marks private when isPublic is false and omits zero prices', () => {
    const r = courseToKnowledgeResult({ id: 'c2', title: 'x', isPublic: false });
    expect(r!.visibility).toBe('private');
    expect(r!.facts.some((f) => f.key === 'price')).toBe(false);
  });
});

describe('teacherToKnowledgeResult', () => {
  it('maps experience into a unit-bearing fact', () => {
    const r = teacherToKnowledgeResult({
      id: 't1',
      name: 'Jasur Alimov',
      subject: 'Matematika',
      specialization: 'Olimpiada',
      experienceYears: 12,
      achievements: 'Xalqaro olimpiada',
      courseIds: ['c1', 'c2'],
    })!;
    const exp = r.facts.find((f) => f.key === 'experience');
    expect(exp?.value).toBe(12);
    expect(exp?.unit).toBe('yil');
    expect(r.relationships).toEqual(['c1', 'c2']);
    expect(r.title).toBe('Jasur Alimov');
  });
});

describe('resultToKnowledgeResult', () => {
  it('maps a published result with ball fact', () => {
    const r = resultToKnowledgeResult({ id: 'r1', studentName: 'Aziza', score: 187.9, university: 'TDTU', published: true })!;
    const ball = r.facts.find((f) => f.key === 'result');
    expect(ball?.value).toBe(187.9);
    expect(ball?.unit).toBe('ball');
    expect(ball?.verified).toBe(true);
    expect(r.visibility).toBe('public');
  });

  it('unpublished results are private and unverifiable', () => {
    const r = resultToKnowledgeResult({ id: 'r2', studentName: 'Bob', score: 150, published: false })!;
    expect(r.visibility).toBe('private');
    expect(r.facts.find((f) => f.key === 'result')?.verified).toBe(false);
  });
});

describe('faqToKnowledgeResult', () => {
  it('maps question/answer', () => {
    const r = faqToKnowledgeResult({ id: 'f1', question: 'Sinov darsi bepulmi?', answer: 'Ha, birinchi dars bepul.' })!;
    expect(r.title).toContain('Sinov darsi');
    expect(r.content).toContain('bepul');
    expect(r.entityType).toBe('faq');
  });
});

describe('coursePriceFact / formatPrice', () => {
  it('builds the price fact and formats sum', () => {
    const f = coursePriceFact({ id: 'c1', monthlyFee: 380000, currency: 'UZS' })!;
    expect(f.verified).toBe(true);
    expect(formatPrice(380000)).toBe("380 000 so'm");
  });

  it('returns null for missing price', () => {
    expect(coursePriceFact({ id: 'c1' })).toBeNull();
  });
});