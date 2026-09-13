import React, { useEffect, useState, useMemo } from 'react';
import {
  Calendar,
  CalendarDays,
  Users,
  Wallet,
  CheckCircle,
  ClipboardCheck,
  AlertCircle,
  Bell,
  ArrowRight,
  Clock,
  MapPin,
  Phone,
  RefreshCw,
} from 'lucide-react';
import { useTeacherPortal } from '../../../context/TeacherPortalContext';
import { useTheme } from '../../../context/ThemeContext';
import { useLanguage } from '../../../context/LanguageContext';
import { subscribeNotifications } from '../../../services/firestore';
import { AppNotification, normalizeStudentPaymentStatus } from '../../../types';
import { TeacherTab } from '../../../types/teacher';
import { groupMeetsToday, classStartMinutes } from '../../../utils/dashboard';
import { formatCurrencyShort } from '../../../utils/format';

function groupDays(g: { days?: string; scheduleTime?: string; name?: string }): string {
  return (g as { days?: string }).days || g.scheduleTime || g.name || '';
}

function groupTime(g: { time?: string; scheduleTime?: string }): string {
  return (g as { time?: string }).time || g.scheduleTime || '';
}

function groupDisplayName(g: { groupName?: string; name?: string }): string {
  return g.groupName || g.name || '';
}

/** Parse "18:00 - 19:30" into [startMin, endMin]; end falls back to start+90. */
function parseRange(time: string): [number, number] {
  const matches = [...time.matchAll(/(\d{1,2}):(\d{2})/g)].map((m) => Number(m[1]) * 60 + Number(m[2]));
  if (matches.length === 0) return [Number.MAX_SAFE_INTEGER, Number.MAX_SAFE_INTEGER];
  if (matches.length === 1) return [matches[0], matches[0] + 90];
  return [matches[0], matches[1]];
}

type ClassStatus = 'upcoming' | 'ongoing' | 'done' | 'unknown';

function classStatusFor(startMin: number, endMin: number, nowMin: number): ClassStatus {
  if (!Number.isFinite(startMin) || startMin === Number.MAX_SAFE_INTEGER) return 'unknown';
  if (nowMin < startMin) return 'upcoming';
  if (nowMin <= endMin) return 'ongoing';
  return 'done';
}

// Finance-flavored notifications are only relevant when the teacher actually
// has payment visibility (see incomeAvailable). Otherwise they are noise.
function isFinanceNotice(n: AppNotification): boolean {
  const hay = `${n.title || ''} ${n.description || ''}`.toLowerCase();
  return hay.includes('qarzdorlik') || hay.includes('qarz') || hay.includes('to‘lov eslatmasi') || hay.includes("to'lov eslatmasi");
}

export const TeacherDashboardView: React.FC = () => {
  const { stats, myGroups, myStudents, attendance, incomeAvailable, error, refresh, setActiveTab, teacherUid, teacherName } = useTeacherPortal();
  const { theme } = useTheme();
  const { language } = useLanguage();
  const t = (uz: string, en: string, ru: string) => (language === 'EN' ? en : language === 'RU' ? ru : uz);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);

  useEffect(() => {
    const unsub = subscribeNotifications(teacherUid, 'teacher', (items) => {
      setNotifications(items.slice(0, 5));
    });
    return () => unsub?.();
  }, [teacherUid]);

  const now = useMemo(() => new Date(), []);
  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  const nowMin = now.getHours() * 60 + now.getMinutes();

  const todayGroups = useMemo(
    () =>
      myGroups
        .filter((g) => groupMeetsToday(groupDays(g)))
        .sort((a, b) => classStartMinutes(groupTime(a)) - classStartMinutes(groupTime(b))),
    [myGroups]
  );

  const attendanceByGroup = useMemo(() => {
    const map = new Map<string, boolean>();
    for (const a of attendance) {
      if (a.date === todayStr) map.set(a.groupId, true);
    }
    return map;
  }, [attendance, todayStr]);

  const todayMarks = useMemo(() => {
    let present = 0;
    let total = 0;
    for (const a of attendance) {
      if (a.date !== todayStr) continue;
      for (const r of Object.values(a.records || {})) {
        total++;
        const st = typeof r === 'string' ? r : r.status;
        if (st === 'present' || st === 'late') present++;
      }
    }
    return { present, total };
  }, [attendance, todayStr]);

  // At-risk students from real attendance records (30-day window in context).
  const atRisk = useMemo(() => {
    const marks = new Map<string, { absent: number; total: number }>();
    for (const a of attendance) {
      for (const [sid, r] of Object.entries(a.records || {})) {
        const st = typeof r === 'string' ? r : r.status;
        const entry = marks.get(sid) || { absent: 0, total: 0 };
        entry.total++;
        if (st === 'absent') entry.absent++;
        marks.set(sid, entry);
      }
    }
    const out: { id: string; name: string; group: string; reason: string; absent: number; total: number }[] = [];
    for (const s of myStudents) {
      const m = marks.get(s.id);
      if (m && m.total >= 2 && m.absent >= 2) {
        out.push({
          id: s.id,
          name: s.fullName,
          group: s.groupName,
          reason: t(`So'nggi ${m.total} darsdan ${m.absent} tasida qatnashmadi`, `Missed ${m.absent} of last ${m.total} classes`, `Пропустил ${m.absent} из последних ${m.total} занятий`),
          absent: m.absent,
          total: m.total,
        });
      } else if (!m && (s.attendanceRate || 100) < 70 && myStudents.length > 0) {
        out.push({
          id: s.id,
          name: s.fullName,
          group: s.groupName,
          reason: t(`Davomat darajasi past (${s.attendanceRate}%)`, `Low attendance (${s.attendanceRate}%)`, `Низкая посещаемость (${s.attendanceRate}%)`),
          absent: 0,
          total: 0,
        });
      }
    }
    return out.sort((a, b) => b.absent - a.absent).slice(0, 5);
  }, [attendance, myStudents, t]);

  // Dues visible to the teacher = normalized Due/Overdue on their own
  // students only. Paid records must never appear here.
  const dues = useMemo(
    () =>
      myStudents.filter((s) => {
        const st = normalizeStudentPaymentStatus(s.paymentStatus);
        return st === 'pending' || st === 'overdue';
      }),
    [myStudents]
  );

  const visibleNotifications = useMemo(
    () => (incomeAvailable ? notifications : notifications.filter((n) => !isFinanceNotice(n))),
    [notifications, incomeAvailable]
  );

  const quickActions: { tab: TeacherTab; icon: React.ReactNode; label: string }[] = [
    { tab: 'timetable', icon: <CalendarDays className="w-5 h-5" />, label: t('Dars jadvali', 'Timetable', 'Расписание') },
    { tab: 'students', icon: <Users className="w-5 h-5" />, label: t("O'quvchilar", 'Students', 'Ученики') },
    { tab: 'attendance', icon: <ClipboardCheck className="w-5 h-5" />, label: t('Davomat', 'Attendance', 'Посещаемость') },
    { tab: 'groups', icon: <Calendar className="w-5 h-5" />, label: t('Guruhlarim', 'My groups', 'Мои группы') },
    { tab: 'payments', icon: <Wallet className="w-5 h-5" />, label: t("To'lovlar", 'Payments', 'Оплаты') },
    { tab: 'announcements', icon: <Bell className="w-5 h-5" />, label: t("E'lonlar", 'Notices', 'Объявления') },
  ];

  const firstName = (teacherName || '').split(' ')[0] || t("O'qituvchi", 'Teacher', 'Учитель');
  const dateText = now.toLocaleDateString(language === 'RU' ? 'ru-RU' : language === 'EN' ? 'en-GB' : 'uz-UZ', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });

  const card = `rounded-2xl p-5 border transition-colors ${theme === 'dark' ? 'bg-slate-900/50 border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`;
  const heading = `text-sm font-bold ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`;

  if (error) {
    return (
      <div className={`${card} text-center py-10`}>
        <AlertCircle className="w-10 h-10 text-rose-500 mx-auto" />
        <h2 className={`mt-3 text-base font-extrabold ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>{error}</h2>
        <button
          onClick={() => refresh()}
          className="mt-4 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition cursor-pointer inline-flex items-center gap-2"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          {t('Qayta urinish', 'Retry', 'Повторить')}
        </button>
      </div>
    );
  }

  const statusLabel: Record<ClassStatus, string> = {
    upcoming: t('Boshlanmagan', 'Not started', 'Не начался'),
    ongoing: t('Davom etmoqda', 'In progress', 'Идёт сейчас'),
    done: t('Yakunlangan', 'Finished', 'Завершён'),
    unknown: '',
  };

  return (
    <div className="space-y-5 sm:space-y-6">
      {/* Compact header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h1 className={`text-xl sm:text-2xl font-black tracking-tight ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
            {t('Xush kelibsiz', 'Welcome', 'Добро пожаловать')}, {firstName}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5 capitalize">
            {dateText} • <span className="text-emerald-600 dark:text-emerald-400 font-bold">{t("O'qituvchi", 'Teacher', 'Учитель')}</span>
          </p>
        </div>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <button onClick={() => setActiveTab('timetable')} className={`${card} text-left hover:border-blue-500/40 cursor-pointer`}>
          <div className="flex items-center justify-between gap-2">
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">{t('Bugungi darslar', "Today's classes", 'Занятия сегодня')}</span>
            <span className="p-1.5 rounded-lg bg-blue-500/10 text-blue-500 shrink-0"><Calendar className="w-4 h-4" /></span>
          </div>
          <div className={`text-2xl font-black mt-1.5 ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>{todayGroups.length}</div>
          <div className="text-[11px] text-slate-400 mt-0.5 truncate">
            {todayGroups.length > 0 ? groupTime(todayGroups[0]) : t('Rejalashtirilmagan', 'None scheduled', 'Нет занятий')}
          </div>
        </button>

        <button onClick={() => setActiveTab('students')} className={`${card} text-left hover:border-emerald-500/40 cursor-pointer`}>
          <div className="flex items-center justify-between gap-2">
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">{t("Faol o'quvchilar", 'Active students', 'Активные ученики')}</span>
            <span className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-500 shrink-0"><Users className="w-4 h-4" /></span>
          </div>
          <div className={`text-2xl font-black mt-1.5 ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>{stats.activeStudentCount}</div>
          <div className="text-[11px] text-slate-400 mt-0.5 truncate">
            {t(`${stats.activeGroupCount} ta guruhda`, `Across ${stats.activeGroupCount} groups`, `В ${stats.activeGroupCount} группах`)}
          </div>
        </button>

        <button onClick={() => setActiveTab('attendance')} className={`${card} text-left hover:border-violet-500/40 cursor-pointer`}>
          <div className="flex items-center justify-between gap-2">
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">{t('Bugungi davomat', "Today's attendance", 'Посещаемость')}</span>
            <span className="p-1.5 rounded-lg bg-violet-500/10 text-violet-500 shrink-0"><CheckCircle className="w-4 h-4" /></span>
          </div>
          <div className={`text-2xl font-black mt-1.5 ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
            {todayMarks.total > 0 ? `${Math.round((todayMarks.present / todayMarks.total) * 100)}%` : '—'}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5 truncate">
            {todayMarks.total > 0
              ? t(`${todayMarks.present}/${todayMarks.total} qatnashdi`, `${todayMarks.present}/${todayMarks.total} present`, `${todayMarks.present}/${todayMarks.total} present`)
              : t('Hali belgilanmagan', 'Not marked yet', 'Ещё не отмечена')}
          </div>
        </button>

        <button onClick={() => setActiveTab('students')} className={`${card} text-left hover:border-amber-500/40 cursor-pointer`}>
          <div className="flex items-center justify-between gap-2">
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">{t('Kuzatuv kerak', 'Needs attention', 'Нуждаются во внимании')}</span>
            <span className="p-1.5 rounded-lg bg-amber-500/10 text-amber-500 shrink-0"><AlertCircle className="w-4 h-4" /></span>
          </div>
          <div className={`text-2xl font-black mt-1.5 ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>{atRisk.length}</div>
          <div className="text-[11px] text-slate-400 mt-0.5 truncate">
            {atRisk.length > 0 ? t("E'tibor talab qiladigan o'quvchilar", 'Students needing attention', 'Ученики, требующие внимания') : t('Hammasi joyida', 'All clear', 'Всё в порядке')}
          </div>
        </button>

        {incomeAvailable ? (
          <button onClick={() => setActiveTab('income')} className={`${card} text-left hover:border-emerald-500/40 cursor-pointer col-span-2 lg:col-span-1`}>
            <div className="flex items-center justify-between gap-2">
              <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">{t('Bu oy yig‘ilgan', 'Collected this month', 'Собрано за месяц')}</span>
              <span className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-500 shrink-0"><Wallet className="w-4 h-4" /></span>
            </div>
            <div className="text-xl font-black mt-1.5 text-emerald-600 dark:text-emerald-400 font-mono truncate">
              {formatCurrencyShort(stats.monthlyIncome)}
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5 truncate">{t('Guruhlarim bo‘yicha', 'Across my groups', 'По моим группам')}</div>
          </button>
        ) : (
          <div className={`${card} col-span-2 lg:col-span-1`}>
            <div className="flex items-center justify-between gap-2">
              <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">{t('Daromad', 'Income', 'Доход')}</span>
              <span className="p-1.5 rounded-lg bg-slate-500/10 text-slate-400 shrink-0"><Wallet className="w-4 h-4" /></span>
            </div>
            <div className={`text-sm font-bold mt-1.5 ${theme === 'dark' ? 'text-slate-300' : 'text-slate-600'}`}>
              {t("Hali hisoblangan daromad yo'q", 'No income calculated yet', 'Доход пока не рассчитан')}
            </div>
          </div>
        )}
      </div>

      {/* Quick actions */}
      <div className={card}>
        <h3 className={`${heading} mb-3`}>{t('Tezkor amallar', 'Quick actions', 'Быстрые действия')}</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
          {quickActions.map((a) => (
            <button
              key={a.tab}
              onClick={() => setActiveTab(a.tab)}
              className={`flex flex-col items-center gap-2 p-3.5 rounded-xl border transition cursor-pointer ${
                theme === 'dark' ? 'border-slate-800 hover:border-emerald-500/40 hover:bg-slate-800/50' : 'border-slate-200 hover:border-emerald-500/40 hover:bg-emerald-500/5'
              }`}
            >
              <span className="p-2 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">{a.icon}</span>
              <span className={`text-[11px] font-bold ${theme === 'dark' ? 'text-slate-200' : 'text-slate-700'}`}>{a.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Today's classes */}
        <div className={card}>
          <div className="flex items-center justify-between mb-4">
            <h3 className={heading}>{t('Bugungi darslar', "Today's classes", 'Занятия сегодня')}</h3>
            <button onClick={() => setActiveTab('timetable')} className="flex items-center gap-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline cursor-pointer">
              {t('Barchasi', 'All', 'Все')} <ArrowRight className="w-3 h-3" />
            </button>
          </div>
          {todayGroups.length === 0 ? (
            <div className="text-center py-8 text-slate-400">
              <Calendar className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-xs font-semibold">{t('Bugun dars rejalashtirilmagan', 'No classes scheduled today', 'Сегодня занятий нет')}</p>
            </div>
          ) : (
            <ul className="space-y-2.5">
              {todayGroups.map((g) => {
                const time = groupTime(g);
                const [startMin, endMin] = parseRange(time);
                const status = classStatusFor(startMin, endMin, nowMin);
                const marked = attendanceByGroup.get(g.id) === true;
                const count = (g as { studentsCount?: number }).studentsCount ?? g.activeStudentsCount ?? 0;
                return (
                  <li
                    key={g.id}
                    className={`p-3.5 rounded-xl border transition ${
                      status === 'ongoing'
                        ? 'border-emerald-500/50 bg-emerald-500/5'
                        : theme === 'dark'
                          ? 'border-slate-800 bg-slate-800/40'
                          : 'border-slate-200/80 bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <span className={`text-sm font-bold block truncate ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                          {groupDisplayName(g)}
                        </span>
                        <span className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-2 flex-wrap mt-0.5">
                          <span className="inline-flex items-center gap-1 font-mono font-bold"><Clock className="w-3 h-3" />{time || '—'}</span>
                          {g.room && <span className="inline-flex items-center gap-1"><MapPin className="w-3 h-3" />{g.room}</span>}
                          <span className="inline-flex items-center gap-1"><Users className="w-3 h-3" />{count} {t("o'quvchi", 'students', 'уч.')}</span>
                        </span>
                      </div>
                      <span className="flex flex-col items-end gap-1 shrink-0">
                        {status !== 'unknown' && (
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold border ${
                            status === 'ongoing'
                              ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/25'
                              : status === 'done'
                                ? 'bg-slate-500/10 text-slate-500 border-slate-500/20'
                                : 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20'
                          }`}>
                            {statusLabel[status]}
                          </span>
                        )}
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                          marked
                            ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                            : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20'
                        }`}>
                          {marked ? t('Davomat belgilangan', 'Attendance marked', 'Отмечена') : t('Davomat kutilmoqda', 'Attendance pending', 'Ожидается')}
                        </span>
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 mt-2.5">
                      <button
                        onClick={() => setActiveTab('attendance')}
                        className="px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-bold transition cursor-pointer"
                      >
                        {t('Davomatni belgilash', 'Mark attendance', 'Отметить')}
                      </button>
                      <button
                        onClick={() => setActiveTab('groups')}
                        className={`px-2.5 py-1.5 rounded-lg border text-[11px] font-bold transition cursor-pointer ${
                          theme === 'dark' ? 'border-slate-700 hover:border-emerald-500/40' : 'border-slate-200 hover:border-emerald-500/40'
                        }`}
                      >
                        {t("Guruhni ko'rish", 'View group', 'Группу')}
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {/* At-risk students */}
        <div className={card}>
          <div className="flex items-center justify-between mb-4">
            <h3 className={heading}>{t("E'tibor talab qiladigan o'quvchilar", 'Students needing attention', 'Требующие внимания')}</h3>
            <button onClick={() => setActiveTab('students')} className="flex items-center gap-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline cursor-pointer">
              {t('Barchasi', 'All', 'Все')} <ArrowRight className="w-3 h-3" />
            </button>
          </div>
          {atRisk.length === 0 ? (
            <div className="text-center py-8 text-slate-400">
              <CheckCircle className="w-8 h-8 mx-auto mb-2 text-emerald-500" />
              <p className="text-xs font-semibold">{t("Hozircha e'tibor talab qiladigan o'quvchi yo'q.", 'No students need attention right now.', 'Пока никто не требует внимания.')}</p>
            </div>
          ) : (
            <ul className="space-y-2.5">
              {atRisk.map((s) => (
                <li key={s.id} className={`p-3.5 rounded-xl border border-amber-500/25 bg-amber-500/5 flex items-center justify-between gap-2`}>
                  <div className="min-w-0">
                    <span className={`text-sm font-bold block truncate ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>{s.name}</span>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400 block truncate">{s.group} • {s.reason}</span>
                  </div>
                  <button
                    onClick={() => setActiveTab('students')}
                    aria-label={t("Qo'ng'iroq / profil", 'Call / profile', 'Позвонить / профиль')}
                    className="p-2 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20 transition shrink-0"
                  >
                    <Phone className="w-3.5 h-3.5" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Student payment status (teacher-visible dues only) + notifications */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className={card}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <h3 className={heading}>{t("O'quvchilar to'lov holati", 'Student payment status', 'Статус оплаты учеников')}</h3>
              {dues.length > 0 && (
                <span className="px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 text-[10px] font-bold border border-amber-500/20">
                  {dues.length}
                </span>
              )}
            </div>
            <button onClick={() => setActiveTab('payments')} className="flex items-center gap-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline cursor-pointer">
              {t('Barchasi', 'All', 'Все')} <ArrowRight className="w-3 h-3" />
            </button>
          </div>
          {dues.length === 0 ? (
            <div className="text-center py-8 text-slate-400">
              <CheckCircle className="w-8 h-8 mx-auto mb-2 text-emerald-500" />
              <p className="text-xs font-semibold">{t("Barcha to'lovlar joyida", 'All payments are settled', 'Все оплаты в порядке')}</p>
            </div>
          ) : (
            <ul className="space-y-2">
              {dues.slice(0, 5).map((s) => {
                const st = normalizeStudentPaymentStatus(s.paymentStatus);
                return (
                  <li key={s.id} className={`flex items-center justify-between gap-2 p-3 rounded-xl ${theme === 'dark' ? 'bg-slate-800/40' : 'bg-slate-50'}`}>
                    <div className="flex items-center gap-3 min-w-0">
                      <span className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${st === 'overdue' ? 'bg-rose-500/10' : 'bg-amber-500/10'}`}>
                        <AlertCircle className={`w-4 h-4 ${st === 'overdue' ? 'text-rose-500' : 'text-amber-500'}`} />
                      </span>
                      <div className="min-w-0">
                        <span className={`text-sm font-semibold block truncate ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>{s.fullName}</span>
                        <span className="text-xs text-slate-500 block truncate">{s.groupName}</span>
                      </div>
                    </div>
                    <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full border shrink-0 ${st === 'overdue' ? 'bg-rose-500/10 text-rose-500 border-rose-500/20' : 'bg-amber-500/10 text-amber-500 border-amber-500/20'}`}>
                      {st === 'overdue' ? t('Qarzdor', 'Overdue', 'Должник') : t('Kutilmoqda', 'Due', 'Ожидается')}
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <div className={card}>
          <div className="flex items-center justify-between mb-4">
            <h3 className={heading}>{t("So'nggi bildirishnomalar", 'Recent notifications', 'Последние уведомления')}</h3>
            <button onClick={() => setActiveTab('announcements')} className="flex items-center gap-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline cursor-pointer">
              {t('Barchasi', 'All', 'Все')} <ArrowRight className="w-3 h-3" />
            </button>
          </div>
          {visibleNotifications.length === 0 ? (
            <div className="text-center py-8 text-slate-400">
              <Bell className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-xs font-semibold">{t("Hozircha bildirishnomalar yo'q", 'No notifications yet', 'Пока нет уведомлений')}</p>
            </div>
          ) : (
            <ul className="space-y-2">
              {visibleNotifications.map((n) => (
                <li key={n.id} className={`flex items-start gap-3 p-3 rounded-xl ${theme === 'dark' ? 'bg-slate-800/40' : 'bg-slate-50'}`}>
                  <span className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${n.isRead ? 'bg-slate-500/10' : 'bg-emerald-500/10'}`}>
                    <Bell className={`w-4 h-4 ${n.isRead ? 'text-slate-400' : 'text-emerald-500'}`} />
                  </span>
                  <div className="flex-1 min-w-0">
                    <span className={`text-sm font-semibold block truncate ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>{n.title}</span>
                    <span className="text-xs text-slate-500 block truncate">{n.description}</span>
                    <span className="text-[10px] text-slate-400 mt-1 block">
                      {new Date(n.createdAt).toLocaleDateString(language === 'RU' ? 'ru-RU' : language === 'EN' ? 'en-GB' : 'uz-UZ', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
};

export default TeacherDashboardView;
