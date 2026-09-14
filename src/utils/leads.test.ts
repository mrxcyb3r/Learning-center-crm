import { describe, it, expect } from 'vitest';
import { normalizeLeadStatus, LEAD_STATUS_LABELS, leadStatusLabel } from './leads';

describe('normalizeLeadStatus', () => {
  it('maps Uzbek lead statuses to the canonical English vocabulary', () => {
    expect(normalizeLeadStatus('Yangi')).toBe('New');
    expect(normalizeLeadStatus("Bog'lanildi")).toBe('Contacted');
    expect(normalizeLeadStatus('Sinov darsi belgilandi')).toBe('Trial Scheduled');
    expect(normalizeLeadStatus("O'quvchiga aylandi")).toBe('Enrolled');
  });

  it('passes canonical English statuses through unchanged', () => {
    expect(normalizeLeadStatus('New')).toBe('New');
    expect(normalizeLeadStatus('Contacted')).toBe('Contacted');
    expect(normalizeLeadStatus('Trial Completed')).toBe('Trial Completed');
  });

  it('falls back to the raw value instead of throwing on unknown status', () => {
    expect(normalizeLeadStatus('something_weird')).toBe('something_weird');
    expect(LEAD_STATUS_LABELS['something_weird']).toBeUndefined();
  });
});

describe('leadStatusLabel', () => {
  it('returns Uzbek labels by default', () => {
    expect(leadStatusLabel('New')).toBe(LEAD_STATUS_LABELS['New']);
  });

  it('returns English/Russian variants when requested', () => {
    expect(leadStatusLabel('New', 'EN')).toBe('New');
    expect(leadStatusLabel('New', 'RU')).toBe('Новые');
  });

  it('falls back to the raw status when translation is missing', () => {
    expect(leadStatusLabel('no_such_status', 'RU')).toBe('no_such_status');
    expect(leadStatusLabel('no_such_status')).toBe('no_such_status');
  });
});