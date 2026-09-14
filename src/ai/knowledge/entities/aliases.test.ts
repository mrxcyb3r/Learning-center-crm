import { describe, it, expect } from 'vitest';
import {
  resolveCourseAlias,
  resolveContactField,
  resolveResultType,
  mentionsTrial,
  mentionsEnrollment,
  mentionsPresidentSchool,
  mentionsPrivateData,
  isStalePhone,
  isStaleTelegram,
  COURSE_ALIAS_TO_ID,
  CONTACT_ALIAS_TO_FIELD,
  RESULT_ALIAS_TO_TYPE,
} from './aliases';
import { normalizeForMatch } from '../../../services/aiNormalize';
import { COURSE_IDS, RESULT_TYPES, CENTER_IDS } from './entityTypes';

describe('course alias resolution', () => {
  it('resolves dtm queries', () => {
    expect(resolveCourseAlias(normalizeForMatch('DTM kursi narxi qancha'))).toBe(COURSE_IDS.DTM_MILLIY_SERTIFIKAT);
    expect(resolveCourseAlias('milliy sertifikatga tayyorlov bormi')).toBe(COURSE_IDS.DTM_MILLIY_SERTIFIKAT);
  });

  it('resolves english / cefr', () => {
    expect(resolveCourseAlias('ingliz tili kursi')).toBe(COURSE_IDS.CEFR_B2_C1);
    expect(resolveCourseAlias('cefr b2 c1')).toBe(COURSE_IDS.CEFR_B2_C1);
  });

  it('resolves mental arifmetika', () => {
    expect(resolveCourseAlias('mental arifmetika')).toBe(COURSE_IDS.MENTAL_ARIFMETIKA);
  });

  it('longest alias wins', () => {
    const norm = normalizeForMatch('ona tili va adabiyot kursi');
    // "ona tili va adabiyot" is longer than "ona tili" and both are in the map
    const resolved = COURSE_ALIAS_TO_ID.get('ona tili va adabiyot');
    expect(resolved).toBe(COURSE_IDS.ONA_TILI_ADABIYOTI);
    expect(norm.includes('ona tili va adabiyot')).toBe(true);
    expect(resolveCourseAlias(norm)).toBe(COURSE_IDS.ONA_TILI_ADABIYOTI);
  });

  it('returns null when no course matches', () => {
    expect(resolveCourseAlias(normalizeForMatch('ob-havo qanday'))).toBeNull();
    expect(resolveCourseAlias('')).toBeNull();
  });
});

describe('contact field resolution', () => {
  it('maps to phone', () => {
    expect(resolveContactField('telefon raqamingiz qanday')).toBe('phone');
  });

  it('maps to telegram', () => {
    expect(resolveContactField('telegram manzilingizni bering')).toBe('telegram');
  });

  it('maps to address', () => {
    expect(resolveContactField('markaz qayerda joylashgan')).toBe('address');
  });

  it('maps to working hours', () => {
    expect(resolveContactField('ish vaqtlari qanday')).toBe('workingHours');
  });

  it('longest phrase wins over single-word overlap', () => {
    const norm = normalizeForMatch('telegram username');
    expect(CONTACT_ALIAS_TO_FIELD.get('telegram user') ?? CONTACT_ALIAS_TO_FIELD.get('telegram username')).toBe('telegram');
    expect(resolveContactField(norm)).toBe('telegram');
  });
});

describe('result type resolution', () => {
  it('resolves grant', () => {
    expect(resolveResultType('grant natijalar qanday')).toBe(RESULT_TYPES.GRANT);
    expect(resolveResultType('davlat grantiga')).toBe(RESULT_TYPES.GRANT);
  });

  it('resolves dtm', () => {
    expect(resolveResultType('dtm ballari qanaqa')).toBe(RESULT_TYPES.DTM);
  });

  it('resolves cefr', () => {
    expect(resolveResultType('cefr natijalari bormi')).toBe(RESULT_TYPES.CEFR);
  });

  it('returns null for unrelated', () => {
    expect(resolveResultType('kurs narxi qancha')).toBeNull();
  });
});

describe('intent keyword matchers', () => {
  it('detects trial', () => {
    expect(mentionsTrial('sinov darsiga yozilish')).toBe(true);
    expect(mentionsTrial('kurs narxi')).toBe(false);
  });

  it('detects enrollment', () => {
    expect(mentionsEnrollment('qanday yozilaman')).toBe(true);
  });

  it('detects president school', () => {
    expect(mentionsPresidentSchool('prezident maktabiga tayyorlov')).toBe(true);
  });

  it('detects private-data requests', () => {
    expect(mentionsPrivateData('barcha studentlar ro\'yxati')).toBe(true);
    expect(mentionsPrivateData('kurs narxi')).toBe(false);
  });
});

describe('stale contact denylist', () => {
  it('flags stale phones', () => {
    expect(isStalePhone('+998 90 862-22-26')).toBe(true);
    expect(isStalePhone('+998 (88) 648-49-49')).toBe(false);
  });

  it('flags stale telegrams', () => {
    expect(isStaleTelegram('@renessans_lc_official')).toBe(true);
    expect(isStaleTelegram('centerflow_bot')).toBe(true);
    expect(isStaleTelegram('@D_Furqatovich')).toBe(false);
  });
});

describe('alias maps are normalized', () => {
  it('all course alias keys are pre-normalized', () => {
    const unnormalized = [...COURSE_ALIAS_TO_ID.keys()].filter((k) => k !== normalizeForMatch(k));
    expect(unnormalized).toEqual([]);
  });

  it('center id constant exists', () => {
    expect(CENTER_IDS.CENTER).toBe('center.renessans-yangiobod');
  });
});