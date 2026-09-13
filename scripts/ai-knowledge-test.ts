/**
 * Deterministic AI knowledge retrieval tests — BEFORE Gemini.
 * Run: npx tsx scripts/ai-knowledge-test.ts
 * Verifies RETRIEVED FACTS / intent / entity, not Gemini text.
 */
import {
  normalizeText,
  normalizeForMatch,
  detectIntent,
  detectAllIntents,
  matchCoursesByEntity,
  resolveSingleCourse,
  toVerifiedCourse,
} from '../src/services/aiReceptionist';

const MOCK_COURSES = [
  { id: 'c-ielts', title: 'IELTS', shortTitle: 'IELTS', category: 'Ingliz tili', description: 'IELTS imtihoniga tayyorlov', duration: '6 oy', lessonsPerWeek: '3 marta / hafta', monthlyFee: 450000, formattedFee: '450 000 UZS', teacherName: 'Malika Yusupova', isActive: true, isPublic: true },
  { id: 'c-cefr', title: 'CEFR B2/C1', shortTitle: 'CEFR', category: 'Ingliz tili', description: 'CEFR darajalariga tayyorlov', duration: '6 oy', lessonsPerWeek: '3 marta / hafta', monthlyFee: 350000, formattedFee: '350 000 UZS', teacherName: 'Malika Yusupova', isActive: true, isPublic: true },
  { id: 'c-dtm', title: 'DTM & Milliy Sertifikat', shortTitle: 'DTM', category: 'DTM', description: 'DTM tayyorlov', duration: '8 oy', lessonsPerWeek: '3 marta / hafta', monthlyFee: 380000, formattedFee: '380 000 UZS', teacherName: 'Jasur Alimov', isActive: true, isPublic: true },
];

type Case = { q: string; intent: string | null; entity: string | null };

const CASES: Case[] = [
  { q: 'IELTS kursi qancha?', intent: 'course_price', entity: 'IELTS' },
  { q: 'IELTS narxi qancha', intent: 'course_price', entity: 'IELTS' },
  { q: 'Ayelts kurs qancha turadi?', intent: 'course_price', entity: 'IELTS' },
  { q: 'IELTS darslari qaysi kunlari?', intent: 'course_schedule', entity: 'IELTS' },
  { q: 'IELTS ustoz kim?', intent: 'course_teacher', entity: 'IELTS' },
  { q: 'Sinov darsi bormi?', intent: 'trial_lesson', entity: null },
  { q: 'Markazingiz qayerda?', intent: 'branch_address', entity: null },
  { q: 'Telefon raqamingiz nima?', intent: 'contact_info', entity: null },
  { q: 'CEFR kursi qancha va darslari qaysi kunlari?', intent: 'course_price', entity: 'CEFR B2/C1' },
];

let failures = 0;

function assertEqual(actual: unknown, expected: unknown, label: string) {
  if (actual === expected) {
    console.log('  PASS ' + label + ' => ' + JSON.stringify(actual));
  } else {
    failures++;
    console.error('  FAIL ' + label + ' => got ' + JSON.stringify(actual) + ', expected ' + JSON.stringify(expected));
  }
}

async function main() {
  console.log('[ai-knowledge-test] ' + CASES.length + ' cases');
  for (const c of CASES) {
    console.log('\nQ: ' + c.q);
    const norm = normalizeText(c.q);
    const intent = detectIntent(norm);
    assertEqual(intent, c.intent, 'intent');
    if (c.intent && c.intent.startsWith('course_')) {
      const entity = resolveSingleCourse(norm, MOCK_COURSES);
      const title = entity ? String(entity.title) : null;
      assertEqual(title, c.entity, 'entity');
      if (entity && c.intent === 'course_price') {
        const vc = toVerifiedCourse(entity);
        const hasPrice = typeof vc.price === 'number' && (vc.price as number) > 0;
        assertEqual(hasPrice, true, 'retrieved price present');
        console.log('  FACT price=' + vc.price + ' text=' + vc.priceText);
      }
    }
    if (c.q.includes('qaysi kunlari') && c.q.includes('qancha')) {
      const all = detectAllIntents(norm);
      const ok = all.includes('course_price') && all.includes('course_schedule');
      assertEqual(ok, true, 'multi-source intents ' + JSON.stringify(all));
    }
  }

  // Alias: Ayelts must resolve to IELTS record (retrieval, not fake data)
  const aliasMatch = resolveSingleCourse(normalizeText('Ayelts narxi qancha'), MOCK_COURSES);
  assertEqual(aliasMatch ? aliasMatch.id : null, 'c-ielts', 'alias Ayelts -> IELTS');

  if (failures > 0) {
    console.error('\n[ai-knowledge-test] FAILED: ' + failures + ' assertion(s)');
    process.exit(1);
  }
  console.log('\n[ai-knowledge-test] ALL PASSED');
}

main().catch((e) => {
  console.error('[ai-knowledge-test] ERROR', e);
  process.exit(1);
});
