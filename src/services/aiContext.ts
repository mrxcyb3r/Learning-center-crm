import {
  leadsService,
  studentsService,
  groupsService,
  paymentsService,
  expensesService,
  coursesService,
  userService,
} from './repository';
import { normalizeLeadStatus } from '../utils/leads';
import type { UserRole } from '../types';

/**
 * Role-scoped CenterFlow context builder for AI assistants.
 *
 * Retrieval enforces permissions BEFORE anything is sent to the model:
 * - admin/superadmin: organization aggregates + named debtor/follow-up lists
 * - receptionist: CRM/admissions/front-desk summaries only (no org finance)
 * - teacher: only assigned groups/students/timetable
 *
 * Phone numbers are masked to last digits — the model never needs full PII.
 */

export type AiErrorState = 'ok' | 'not_configured' | 'provider_error' | 'denied' | 'no_data';

export function describeAiError(state: Exclude<AiErrorState, 'ok'>): string {
  switch (state) {
    case 'not_configured':
      return 'AI xizmati hali sozlanmagan. Administrator AI xizmatini Sozlamalar orqali ulashi kerak.';
    case 'provider_error':
      return 'AI xizmatiga ulanib bo‘lmadi. Keyinroq urinib ko‘ring.';
    case 'denied':
      return 'Bu ma’lumotni ko‘rish huquqingiz mavjud emas.';
    case 'no_data':
      return 'Bu savol bo‘yicha ma’lumot topilmadi.';
  }
}

/** Never send full phone numbers to the model — last 4 digits are enough. */
function maskPhone(phone?: string): string {
  const digits = (phone || '').replace(/\D/g, '');
  if (digits.length <= 4) return '****';
  return '****' + digits.slice(-4);
}

function todayStr(): string {
  return new Date().toISOString().split('T')[0];
}

function monthKey(): string {
  const n = new Date();
  return `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, '0')}`;
}

export interface AiContextResult {
  state: AiErrorState;
  context: string;
}

async function safe<T>(fn: () => Promise<T>, fallback: T): Promise<T> {
  try {
    return await fn();
  } catch {
    return fallback;
  }
}

/** ADMIN: organization-level aggregates + actionable named lists. */
export async function buildAdminAiContext(): Promise<AiContextResult> {
  const [leads, students, payments, expenses, courses, groups] = await Promise.all([
    safe(() => leadsService.getAllLeads(), []),
    safe(() => studentsService.getAllStudents(), []),
    safe(() => paymentsService.getAllPayments(), []),
    safe(() => expensesService.getAllExpenses(), []),
    safe(() => coursesService.getAllCourses(), []),
    safe(() => groupsService.getAllGroups(), []),
  ]);

  const total = leads.length + students.length + payments.length;
  if (total === 0 && courses.length === 0) {
    return { state: 'no_data', context: '' };
  }

  const today = todayStr();
  const mk = monthKey();
  const newToday = leads.filter((l) => (l.createdAt || '').startsWith(today)).length;
  const byStatus: Record<string, number> = {};
  for (const l of leads) {
    const s = normalizeLeadStatus(l.status);
    byStatus[s] = (byStatus[s] || 0) + 1;
  }
  const untouched = leads
    .filter((l) => ['New', 'Contacted'].includes(normalizeLeadStatus(l.status)))
    .slice(0, 8)
    .map((l) => `- ${l.name} (${l.course || 'kurs belgilanmagan'}, ${maskPhone(l.phone)}, holat: ${l.status})`);
  const debtors = (students as any[])
    .filter((s) => Number(s.debtAmount) > 0 || s.paymentStatus === 'Overdue' || s.paymentStatus === 'Due')
    .slice(0, 8)
    .map((s) => `- ${s.fullName || s.name} (${s.course || ''}, qarz: ${Number(s.debtAmount) || s.monthlyFee || s.tuitionFee || 0} UZS)`);
  const monthRevenue = (payments as any[])
    .filter((p) => p.status !== 'Voided' && String(p.date || '').startsWith(mk))
    .reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
  const monthExpenses = (expenses as any[])
    .filter((e) => e.status !== 'Voided' && String(e.date || '').startsWith(mk))
    .reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
  const perCourse: Record<string, number> = {};
  for (const s of students as any[]) {
    if (s.course) perCourse[s.course] = (perCourse[s.course] || 0) + 1;
  }
  const topCourse = Object.entries(perCourse).sort((a, b) => b[1] - a[1])[0];
  const todayTrials = leads.filter((l) => l.trialDateTime && new Date(l.trialDateTime).toDateString() === new Date().toDateString());

  const lines = [
    `MARKAZ HOLATI (sana: ${today}):`,
    `- Jami lidlar: ${leads.length} (bugun yangi: ${newToday})`,
    `- Holatlar: ${Object.entries(byStatus).map(([k, v]) => `${k}: ${v}`).join(', ') || '—'}`,
    `- Faol o‘quvchilar: ${(students as any[]).filter((s) => s.status === 'Active').length} / jami ${(students as any[]).length}`,
    `- Shu oy tushum: ${monthRevenue.toLocaleString()} UZS; xarajat: ${monthExpenses.toLocaleString()} UZS`,
    `- Eng ko‘p o‘quvchili kurs: ${topCourse ? `${topCourse[0]} (${topCourse[1]} nafar)` : '—'}`,
    `- Guruhlar: ${groups.length}; Kurslar: ${courses.map((c: any) => c.title).join(', ') || '—'}`,
    `- Bugungi sinov darslari (${todayTrials.length}): ${todayTrials.slice(0, 5).map((l) => `${l.name} (${l.course})`).join('; ') || '—'}`,
    `KUZATILMAGAN MUROJAATLAR:`,
    ...(untouched.length > 0 ? untouched : ['- Hozircha yo‘q']),
    `TO‘LOVI KECHIKKAN O‘QUVCHILAR:`,
    ...(debtors.length > 0 ? debtors : ['- Qarzdorlik yo‘q']),
  ];
  return { state: 'ok', context: lines.join('\n') };
}

/** RECEPTIONIST: CRM/admissions/front-desk only. No org finance. */
export async function buildReceptionistAiContext(): Promise<AiContextResult> {
  const [leads, students, groups, courses] = await Promise.all([
    safe(() => leadsService.getAllLeads(), []),
    safe(() => studentsService.getAllStudents(), []),
    safe(() => groupsService.getAllGroups(), []),
    safe(() => coursesService.getAllCourses(), []),
  ]);

  if (leads.length === 0 && students.length === 0) {
    return { state: 'no_data', context: '' };
  }

  const today = todayStr();
  const newToday = leads.filter((l) => (l.createdAt || '').startsWith(today));
  const untouched = leads.filter((l) => ['New', 'Contacted'].includes(normalizeLeadStatus(l.status))).slice(0, 10);
  const todayTrials = leads.filter((l) => l.trialDateTime && new Date(l.trialDateTime).toDateString() === new Date().toDateString());
  const followUps = leads
    .filter((l) => l.followUpDate && l.followUpDate <= today && !['Enrolled', 'Lost'].includes(normalizeLeadStatus(l.status)))
    .slice(0, 8);

  const lines = [
    `QABULXONA HOLATI (sana: ${today}):`,
    `- Bugun yangi murojaatlar (${newToday.length}): ${newToday.slice(0, 6).map((l) => `${l.name} (${l.course}, ${maskPhone(l.phone)})`).join('; ') || '—'}`,
    `- Ishlanmagan murojaatlar (${untouched.length}): ${untouched.slice(0, 6).map((l) => `${l.name} — ${l.status}`).join('; ') || '—'}`,
    `- Bugungi sinov darslari: ${todayTrials.map((l) => `${l.name} (${l.course}, ${l.trialDateTime})`).join('; ') || '—'}`,
    `- Kuzatuv muddati kelganlar: ${followUps.map((l) => `${l.name} (${l.followUpDate})`).join('; ') || '—'}`,
    `- Guruhlar: ${groups.slice(0, 10).map((g: any) => `${g.groupName || g.name} (${g.course}, ${g.studentsCount || 0} o‘quvchi)`).join('; ') || '—'}`,
    `- Kurslar: ${courses.map((c: any) => `${c.title} (${c.formattedFee || ''})`).join('; ') || '—'}`,
  ];
  return { state: 'ok', context: lines.join('\n') };
}

/** TEACHER: only assigned groups/students. Financial org data excluded. */
export async function buildTeacherAiContext(uid: string): Promise<AiContextResult> {
  if (!uid) return { state: 'denied', context: '' };
  const profile = await safe(() => userService.getUserProfile(uid), null);
  const groupIds: string[] = (profile as any)?.assignedGroupIds || [];
  if (groupIds.length === 0) return { state: 'no_data', context: '' };

  const { groupsService: gs, studentsService: ss, attendanceService } = await import('./repository');
  const teacherGroups = await safe(() => gs.getGroupsByIds(groupIds), []);
  const studentIds = teacherGroups.flatMap((g: any) => g.studentIds || []);
  const teacherStudents = await safe(() => ss.getStudentsByIds(studentIds), []);
  const recordIds = teacherGroups.flatMap((g: any) =>
    attendanceService.attendanceWindowIds(g.id, 7)
  );
  const attendance = await safe(() => attendanceService.getAttendanceByIds(recordIds), []);

  const today = todayStr();
  const absentProne = (teacherStudents as any[])
    .filter((s) => Number(s.attendanceRate || 100) < 75)
    .map((s) => `${s.fullName || s.name} (davomat: ${s.attendanceRate || 0}%)`);

  const lines = [
    `O‘QITUVCHI KONTEKSTI (sana: ${today}):`,
    `- Guruhlarim (${teacherGroups.length}): ${teacherGroups.map((g: any) => `${g.groupName || g.name} (${(g.studentIds || []).length} o‘quvchi, ${g.days || ''} ${g.time || ''})`).join('; ')}`,
    `- O‘quvchilarim soni: ${teacherStudents.length}`,
    `- Davomatida muammo borlar: ${absentProne.join('; ') || '—'}`,
    `- So‘nggi 7 kun davomat yozuvlari: ${attendance.length} ta`,
  ];
  return { state: 'ok', context: lines.join('\n') };
}

export async function buildAiContextForRole(role: UserRole, uid?: string): Promise<AiContextResult> {
  if (role === 'admin' || role === 'superadmin') return buildAdminAiContext();
  if (role === 'receptionist' || role === 'support') return buildReceptionistAiContext();
  if (role === 'teacher') return buildTeacherAiContext(uid || '');
  return { state: 'denied', context: '' };
}
