import React, { useState, useMemo } from 'react';
import dayjs from 'dayjs';
import { useTeacherPortal } from '../../../context/TeacherPortalContext';
import { useLanguage } from '../../../context/LanguageContext';
import { Group } from '../../../types';
import {
  Calendar,
  Clock,
  Users,
  MapPin,
  ChevronLeft,
  ChevronRight,
  Loader2,
  BookOpen,
  Sparkles,
  List,
  LayoutGrid,
  CalendarDays,
} from 'lucide-react';

type ViewMode = 'daily' | 'weekly' | 'monthly';

interface ParsedSchedule {
  days: number[];
  startTime: string;
  endTime: string;
  raw: string;
}

const DAY_MAP: Record<string, number> = {
  mon: 1, monday: 1,
  tue: 2, tuesday: 2,
  wed: 3, wednesday: 3,
  thu: 4, thursday: 4,
  fri: 5, friday: 5,
  sat: 6, saturday: 6,
  sun: 0, sunday: 0,
};

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const DAY_NAMES_FULL = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

function parseSchedule(scheduleTime: string): ParsedSchedule {
  if (!scheduleTime) return { days: [], startTime: '09:00', endTime: '11:00', raw: scheduleTime };

  const parts = scheduleTime.split(/\s+/);
  const dayPart = parts[0] || '';
  const timePart = scheduleTime.replace(dayPart, '').trim();

  const dayEntries = dayPart.split(/[\/,]/).map((d) => d.trim().toLowerCase());
  const days = dayEntries
    .map((d) => DAY_MAP[d])
    .filter((d) => d !== undefined);

  const timeMatch = timePart.match(/(\d{1,2}:\d{2})\s*[-–]\s*(\d{1,2}:\d{2})/);
  const startTime = timeMatch ? timeMatch[1] : '09:00';
  const endTime = timeMatch ? timeMatch[2] : '11:00';

  return { days, startTime, endTime, raw: scheduleTime };
}

function getSubjectColor(courseType: string): { bg: string; text: string; border: string; dot: string } {
  const ct = (courseType || '').toLowerCase();
  if (ct.includes('ielts') || ct.includes('english') || ct.includes('cefr') || ct.includes('general english'))
    return { bg: 'bg-blue-500/10', text: 'text-blue-500', border: 'border-blue-500/20', dot: 'bg-blue-500' };
  if (ct.includes('math') || ct.includes('sat'))
    return { bg: 'bg-amber-500/10', text: 'text-amber-500', border: 'border-amber-500/20', dot: 'bg-amber-500' };
  if (ct.includes('physics'))
    return { bg: 'bg-purple-500/10', text: 'text-purple-500', border: 'border-purple-500/20', dot: 'bg-purple-500' };
  if (ct.includes('cyber') || ct.includes('it') || ct.includes('programming') || ct.includes('computer'))
    return { bg: 'bg-emerald-500/10', text: 'text-emerald-500', border: 'border-emerald-500/20', dot: 'bg-emerald-500' };
  return { bg: 'bg-slate-500/10', text: 'text-slate-500', border: 'border-slate-500/20', dot: 'bg-slate-500' };
}

function timeToMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + (m || 0);
}

function formatHour(hour: number): string {
  return `${String(hour).padStart(2, '0')}:00`;
}

interface TimetableEntry {
  group: Group;
  parsed: ParsedSchedule;
  dayOfWeek: number;
}

export const TimetableView: React.FC = () => {
  const { myGroups, myStudents } = useTeacherPortal();
  const { language, translate } = useLanguage();
  const t = (uz: string, en: string, ru: string) => translate(uz, en, ru);

  const [viewMode, setViewMode] = useState<ViewMode>('weekly');
  const [currentDate, setCurrentDate] = useState(dayjs());
  const [selectedDay, setSelectedDay] = useState<number | null>(null);

  const entries = useMemo(() => {
    return myGroups.map((group) => ({
      group,
      parsed: parseSchedule(group.scheduleTime),
    }));
  }, [myGroups]);

  const today = dayjs();
  const todayDow = today.day();

  const dailyLessons = useMemo(() => {
    return entries.filter((e) => e.parsed.days.includes(todayDow));
  }, [entries, todayDow]);

  const weeklyEntries = useMemo(() => {
    return entries.filter((e) => e.parsed.days.length > 0);
  }, [entries]);

  const monthStart = currentDate.startOf('month');
  const monthEnd = currentDate.endOf('month');
  const monthStartDow = monthStart.day();
  const daysInMonth = monthEnd.date();

  const monthCalendarDays: (number | null)[] = [];
  for (let i = 0; i < monthStartDow; i++) monthCalendarDays.push(null);
  for (let d = 1; d <= daysInMonth; d++) monthCalendarDays.push(d);

  const getLessonsForDow = (dow: number) => entries.filter((e) => e.parsed.days.includes(dow));

  const selectedDayLessons = useMemo(() => {
    if (selectedDay === null) return [];
    return entries.filter((e) => e.parsed.days.includes(selectedDay));
  }, [entries, selectedDay]);

  const nextWeekStart = dayjs().startOf('week').add(1, 'week');
  const weekDays = useMemo(() => {
    const start = dayjs().startOf('week');
    return Array.from({ length: 7 }, (_, i) => start.add(i, 'day'));
  }, []);

  const hours = useMemo(() => {
    const allStarts = entries.map((e) => timeToMinutes(e.parsed.startTime));
    const allEnds = entries.map((e) => timeToMinutes(e.parsed.endTime));
    const minH = allStarts.length > 0 ? Math.floor(Math.min(...allStarts) / 60) : 8;
    const maxH = allEnds.length > 0 ? Math.ceil(Math.max(...allEnds) / 60) : 20;
    const result: number[] = [];
    for (let h = Math.max(8, minH); h <= Math.min(20, maxH); h++) result.push(h);
    return result;
  }, [entries]);

  const getStudentCount = (group: Group) => {
    return myStudents.filter((s) => s.groupId === group.id || s.groupName === group.name).length || group.activeStudentsCount || 0;
  };

  const handlePrevMonth = () => setCurrentDate((prev) => prev.subtract(1, 'month'));
  const handleNextMonth = () => setCurrentDate((prev) => prev.add(1, 'month'));

  const viewModeButtons: { mode: ViewMode; icon: React.ReactNode; label: string }[] = [
    { mode: 'daily', icon: <List className="w-4 h-4" />, label: t('Kunlik', 'Daily', 'Дневной') },
    { mode: 'weekly', icon: <LayoutGrid className="w-4 h-4" />, label: t('Haftalik', 'Weekly', 'Недельный') },
    { mode: 'monthly', icon: <CalendarDays className="w-4 h-4" />, label: t('Oylik', 'Monthly', 'Месячный') },
  ];

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-slate-800 text-white p-6 rounded-3xl border border-slate-800 shadow-xl relative overflow-hidden">
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="p-3.5 rounded-2xl bg-blue-500/20 text-blue-400 border border-blue-500/30 shrink-0">
              <Calendar className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-400 text-[10px] font-black uppercase tracking-wider border border-blue-500/30">
                  {t('Dars Jadvali', 'Class Timetable', 'Расписание Уроков')}
                </span>
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-bold border border-emerald-500/30 flex items-center gap-1">
                  <BookOpen className="w-3 h-3" />
                  <span>{myGroups.length} {t('ta Guruh', 'Groups', 'Групп')}</span>
                </span>
              </div>
              <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight mt-1">
                {t('Dars Jadvali Boshqaruvi', 'Timetable Management', 'Управление Расписанием')}
              </h1>
              <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
                {t(
                  'Barcha guruhlar uchun dars jadvalini kunlik, haftalik va oylik ko\'rinishda kuzating.',
                  'View your class schedules in daily, weekly, and monthly formats.',
                  'Просматривайте расписание занятий в дневном, недельном и месячном форматах.'
                )}
              </p>
            </div>
          </div>

          {/* View Mode Selector */}
          <div className="flex items-center gap-2 shrink-0 bg-slate-800/80 border border-slate-700 rounded-2xl p-1.5">
            {viewModeButtons.map((btn) => (
              <button
                key={btn.mode}
                onClick={() => setViewMode(btn.mode)}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-black transition cursor-pointer ${
                  viewMode === btn.mode
                    ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/20'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {btn.icon}
                <span className="hidden sm:inline">{btn.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Daily View */}
      {viewMode === 'daily' && (
        <div className="space-y-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-black text-slate-900 dark:text-white">
                  {today.format('dddd, MMMM D, YYYY')}
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  {dailyLessons.length} {t('ta dars rejalashtirilgan', 'lessons scheduled', 'запланировано уроков')}
                </p>
              </div>
              <div className="p-3 rounded-2xl bg-blue-500/10 border border-blue-500/20">
                <Calendar className="w-5 h-5 text-blue-500" />
              </div>
            </div>
          </div>

          {dailyLessons.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-12 text-center space-y-3">
              <div className="w-14 h-14 rounded-full bg-slate-100 dark:bg-slate-800 mx-auto flex items-center justify-center">
                <Calendar className="w-7 h-7 text-slate-400" />
              </div>
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                {t('Bugun darslar yo\'q', 'No lessons today', 'Сегодня нет уроков')}
              </h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                {t(
                  'Bugun sizning guruhlaringiz uchun dars rejalashtirilmagan.',
                  'No classes are scheduled for your groups today.',
                  'На сегодня для ваших групп не запланировано занятий.'
                )}
              </p>
            </div>
          ) : (
            <div className="relative pl-8 space-y-4">
              {/* Vertical timeline line */}
              <div className="absolute left-3 top-2 bottom-2 w-0.5 bg-slate-200 dark:bg-slate-800" />

              {dailyLessons.map((entry, idx) => {
                const colors = getSubjectColor(entry.group.courseType);
                return (
                  <div key={entry.group.id} className="relative">
                    {/* Timeline dot */}
                    <div className={`absolute -left-5 top-5 w-3 h-3 rounded-full ${colors.dot} ring-4 ring-white dark:ring-slate-900`} />

                    <div
                      className={`p-5 rounded-2xl border ${colors.bg} ${colors.border} transition-all duration-200 hover:shadow-md`}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="space-y-1.5">
                          <div className="flex items-center gap-2">
                            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider border ${colors.bg} ${colors.text} ${colors.border}`}>
                              {entry.group.courseType || 'Course'}
                            </span>
                          </div>
                          <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">
                            {entry.group.name}
                          </h3>
                          <div className="flex items-center gap-4 text-xs text-slate-500">
                            <span className="flex items-center gap-1">
                              <Clock className="w-3.5 h-3.5" />
                              {entry.parsed.startTime} – {entry.parsed.endTime}
                            </span>
                            <span className="flex items-center gap-1">
                              <MapPin className="w-3.5 h-3.5" />
                              {entry.group.room || '—'}
                            </span>
                            <span className="flex items-center gap-1">
                              <Users className="w-3.5 h-3.5" />
                              {getStudentCount(entry.group)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Weekly View */}
      {viewMode === 'weekly' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-sm overflow-x-auto">
          <div className="min-w-[900px]">
            {/* Day Headers */}
            <div className="grid grid-cols-[80px_repeat(7,1fr)] gap-1 mb-1">
              <div />
              {weekDays.map((day, i) => {
                const isToday = day.isSame(today, 'day');
                return (
                  <div
                    key={i}
                    className={`text-center py-3 rounded-2xl transition ${
                      isToday
                        ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/20'
                        : 'bg-slate-50 dark:bg-slate-800'
                    }`}
                  >
                    <div className={`text-[10px] font-bold uppercase tracking-wider ${isToday ? 'text-blue-100' : 'text-slate-400'}`}>
                      {DAY_NAMES[day.day()]}
                    </div>
                    <div className={`text-sm font-black mt-0.5 ${isToday ? 'text-white' : 'text-slate-900 dark:text-white'}`}>
                      {day.date()}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Time Grid */}
            <div className="space-y-0">
              {hours.map((hour) => (
                <div key={hour} className="grid grid-cols-[80px_repeat(7,1fr)] gap-1 min-h-[60px]">
                  <div className="flex items-start justify-end pr-3 pt-1">
                    <span className="text-[10px] font-mono font-bold text-slate-400">{formatHour(hour)}</span>
                  </div>
                  {weekDays.map((day, di) => {
                    const dayLessons = getLessonsForDow(day.day()).filter((e) => {
                      const startMin = timeToMinutes(e.parsed.startTime);
                      const hourMin = hour * 60;
                      return startMin >= hourMin && startMin < hourMin + 60;
                    });
                    const isToday = day.isSame(today, 'day');

                    return (
                      <div
                        key={di}
                        className={`border rounded-xl p-1 ${
                          isToday
                            ? 'border-blue-500/30 bg-blue-500/5'
                            : 'border-slate-100 dark:border-slate-800'
                        }`}
                      >
                        {dayLessons.map((entry) => {
                          const colors = getSubjectColor(entry.group.courseType);
                          return (
                            <div
                              key={entry.group.id}
                              className={`p-2 rounded-xl border mb-1 ${colors.bg} ${colors.border} last:mb-0`}
                            >
                              <div className={`text-[10px] font-black ${colors.text} truncate`}>
                                {entry.group.name}
                              </div>
                              <div className="text-[9px] text-slate-500 font-mono mt-0.5">
                                {entry.parsed.startTime}–{entry.parsed.endTime}
                              </div>
                              <div className="flex items-center gap-1 mt-0.5">
                                <MapPin className="w-2.5 h-2.5 text-slate-400" />
                                <span className="text-[9px] text-slate-400 truncate">{entry.group.room || '—'}</span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Monthly View */}
      {viewMode === 'monthly' && (
        <div className="space-y-4">
          {/* Month Navigator */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <button
                onClick={handlePrevMonth}
                className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <h2 className="text-lg font-black text-slate-900 dark:text-white">
                {currentDate.format('MMMM YYYY')}
              </h2>
              <button
                onClick={handleNextMonth}
                className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-7 gap-1">
              {DAY_NAMES.map((d) => (
                <div key={d} className="text-center py-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{d}</span>
                </div>
              ))}

              {monthCalendarDays.map((day, i) => {
                if (day === null) return <div key={`empty-${i}`} />;

                const isToday = currentDate.date(day).isSame(today, 'day') && currentDate.isSame(today, 'month');
                const dayDow = currentDate.date(day).day();
                const dayLessons = getLessonsForDow(dayDow);
                const isSelected = selectedDay === dayDow && currentDate.month() === today.month();

                return (
                  <button
                    key={day}
                    onClick={() => setSelectedDay(isSelected ? null : dayDow)}
                    className={`relative p-2 rounded-xl text-center transition cursor-pointer min-h-[52px] flex flex-col items-center justify-center ${
                      isToday
                        ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/20 font-black'
                        : isSelected
                        ? 'bg-blue-500/10 border border-blue-500/30'
                        : 'hover:bg-slate-50 dark:hover:bg-slate-800'
                    }`}
                  >
                    <span className={`text-sm ${isToday ? 'text-white font-black' : 'text-slate-700 dark:text-slate-300 font-semibold'}`}>
                      {day}
                    </span>
                    {dayLessons.length > 0 && (
                      <div className="flex items-center gap-0.5 mt-1">
                        {dayLessons.slice(0, 4).map((entry, li) => {
                          const colors = getSubjectColor(entry.group.courseType);
                          return (
                            <span
                              key={li}
                              className={`w-1.5 h-1.5 rounded-full ${colors.dot}`}
                            />
                          );
                        })}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Selected Day Lessons */}
          {selectedDay !== null && (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-sm space-y-3">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">
                  {t('Darslar:', 'Lessons:', 'Уроки:')} {DAY_NAMES_FULL[selectedDay]}
                </h3>
                <span className="px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-500 text-[10px] font-bold border border-blue-500/20">
                  {selectedDayLessons.length}
                </span>
              </div>

              {selectedDayLessons.length === 0 ? (
                <p className="text-xs text-slate-500 py-4 text-center">
                  {t('Bu kunda darslar yo\'q', 'No lessons on this day', 'В этот день нет уроков')}
                </p>
              ) : (
                <div className="space-y-2">
                  {selectedDayLessons.map((entry) => {
                    const colors = getSubjectColor(entry.group.courseType);
                    return (
                      <div
                        key={entry.group.id}
                        className={`p-4 rounded-2xl border ${colors.bg} ${colors.border} flex flex-col sm:flex-row sm:items-center justify-between gap-3`}
                      >
                        <div className="space-y-1">
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider border ${colors.bg} ${colors.text} ${colors.border}`}>
                            {entry.group.courseType || 'Course'}
                          </span>
                          <h4 className="text-sm font-extrabold text-slate-900 dark:text-white">
                            {entry.group.name}
                          </h4>
                        </div>
                        <div className="flex items-center gap-4 text-xs text-slate-500">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5" />
                            {entry.parsed.startTime} – {entry.parsed.endTime}
                          </span>
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5" />
                            {entry.group.room || '—'}
                          </span>
                          <span className="flex items-center gap-1">
                            <Users className="w-3.5 h-3.5" />
                            {getStudentCount(entry.group)}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
