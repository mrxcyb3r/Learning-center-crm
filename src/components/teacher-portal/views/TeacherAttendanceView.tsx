import React, { useState, useMemo } from 'react';
import { useTeacherPortal } from '../../../context/TeacherPortalContext';
import { useLanguage } from '../../../context/LanguageContext';
import { AttendanceManager } from '../../teacher/AttendanceManager';
import { AttendanceRecord } from '../../../types';
import {
  CheckSquare,
  Calendar,
  TrendingUp,
  Users,
  AlertTriangle,
  Clock,
  Filter,
  BarChart3,
  UserX,
  ChevronDown,
  Loader2,
} from 'lucide-react';

export const TeacherAttendanceView: React.FC = () => {
  const { myGroups, myStudents, attendance } = useTeacherPortal();
  const { language, translate } = useLanguage();
  const t = (uz: string, en: string, ru: string) => translate(uz, en, ru);

  const [selectedGroupId, setSelectedGroupId] = useState<string>('');
  const [dateFrom, setDateFrom] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d.toISOString().split('T')[0];
  });
  const [dateTo, setDateTo] = useState(() => new Date().toISOString().split('T')[0]);

  const myGroupIds = useMemo(() => new Set(myGroups.map((g) => g.id)), [myGroups]);

  const filteredAttendance = useMemo(() => {
    return attendance
      .filter(
        (a) =>
          myGroupIds.has(a.groupId) &&
          a.date >= dateFrom &&
          a.date <= dateTo
      )
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [attendance, myGroupIds, dateFrom, dateTo]);

  const stats = useMemo(() => {
    const totalLessons = filteredAttendance.length;
    let totalPresent = 0;
    let totalLate = 0;
    let totalAbsent = 0;
    let totalExcused = 0;
    let totalRecords = 0;
    const absentCounts: Record<string, number> = {};

    filteredAttendance.forEach((record) => {
      Object.entries(record.records).forEach(([studentId, status]) => {
        totalRecords++;
        const st = typeof status === 'string' ? status : status.status;
        if (st === 'present') totalPresent++;
        else if (st === 'late') totalLate++;
        else if (st === 'absent') {
          totalAbsent++;
          absentCounts[studentId] = (absentCounts[studentId] || 0) + 1;
        } else if (st === 'excused') totalExcused++;
      });
    });

    const attendanceRate = totalRecords > 0
      ? Math.round(((totalPresent + totalLate) / totalRecords) * 100)
      : myStudents.length > 0
        ? Math.round(myStudents.reduce((sum, s) => sum + (s.attendanceRate || 0), 0) / myStudents.length)
        : 0;

    const mostAbsent = Object.entries(absentCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([sid, count]) => {
        const student = myStudents.find((s) => s.id === sid);
        return { name: student?.fullName || "Noma'lum", count };
      });

    return { totalLessons, totalPresent, totalLate, totalAbsent, totalExcused, attendanceRate, mostAbsent };
  }, [filteredAttendance, myStudents]);

  const getGroupName = (groupId: string) => myGroups.find((g) => g.id === groupId)?.name || '—';

  const getStatusCounts = (record: AttendanceRecord) => {
    let present = 0, late = 0, absent = 0, excused = 0;
    Object.values(record.records).forEach((status) => {
      const st = typeof status === 'string' ? status : status.status;
      if (st === 'present') present++;
      else if (st === 'late') late++;
      else if (st === 'absent') absent++;
      else if (st === 'excused') excused++;
    });
    const total = present + late + absent + excused;
    const rate = total > 0 ? Math.round(((present + late) / total) * 100) : 0;
    return { present, late, absent, excused, rate };
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-slate-800 text-white p-6 rounded-3xl border border-slate-800 shadow-xl relative overflow-hidden">
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="p-3.5 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30 shrink-0">
              <CheckSquare className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-400 text-[10px] font-black uppercase tracking-wider border border-amber-500/30">
                  {t('Davomat Boshqaruvi', 'Attendance Manager', 'Управление Посещаемостью')}
                </span>
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-bold border border-emerald-500/30 flex items-center gap-1">
                  <TrendingUp className="w-3 h-3" />
                  <span>{stats.attendanceRate}% {t('Narx', 'Rate', 'Уровень')}</span>
                </span>
              </div>
              <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight mt-1">
                {t('Davomat va Qatnashish', 'Attendance & Participation', 'Посещаемость и Участие')}
              </h1>
              <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
                {t(
                  'Guruhlaringiz uchun davomatni boshqaring, tarixini ko\'ring va tahlil qiling.',
                  'Manage attendance for your groups, view history, and analyze participation.',
                  'Управляйте посещаемостью ваших групп, просматривайте историю и анализируйте.'
                )}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <div className="px-4 py-2 rounded-2xl bg-slate-800 border border-slate-700 text-xs font-bold flex items-center gap-2 text-amber-400">
              <Users className="w-4 h-4" />
              <span>{myGroups.length} {t('ta Guruh', 'Groups', 'Групп')} • {myStudents.length} {t('ta O\'quvchi', 'Students', 'Учеников')}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-xl bg-blue-500/10 flex items-center justify-center">
              <Calendar className="w-4 h-4 text-blue-500" />
            </div>
            <span className="text-[10px] font-black uppercase text-slate-400">{t('Darslar', 'Lessons', 'Уроки')}</span>
          </div>
          <div className="text-xl font-black text-slate-900 dark:text-white font-mono">{stats.totalLessons}</div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 flex items-center justify-center">
              <TrendingUp className="w-4 h-4 text-emerald-500" />
            </div>
            <span className="text-[10px] font-black uppercase text-slate-400">{t('O\'rtacha', 'Avg Rate', 'Средний')}</span>
          </div>
          <div className="text-xl font-black text-emerald-500 font-mono">{stats.attendanceRate}%</div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 flex items-center justify-center">
              <Clock className="w-4 h-4 text-amber-500" />
            </div>
            <span className="text-[10px] font-black uppercase text-slate-400">{t('Kechikishlar', 'Late', 'Опоздания')}</span>
          </div>
          <div className="text-xl font-black text-amber-500 font-mono">{stats.totalLate}</div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-xl bg-rose-500/10 flex items-center justify-center">
              <UserX className="w-4 h-4 text-rose-500" />
            </div>
            <span className="text-[10px] font-black uppercase text-slate-400">{t('Yo\'q', 'Absent', 'Отсутствия')}</span>
          </div>
          <div className="text-xl font-black text-rose-500 font-mono">{stats.totalAbsent}</div>
        </div>
      </div>

      {/* Top Section: Attendance Manager */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-sm">
        <AttendanceManager initialGroupId={selectedGroupId || undefined} />
      </div>

      {/* Bottom Section: Attendance History */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-blue-500" />
            <h2 className="text-sm font-extrabold text-slate-900 dark:text-white">
              {t('Davomat Tarixi', 'Attendance History', 'История Посещаемости')}
            </h2>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-1.5">
              <label className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                {t('Dan:', 'From:', 'С:')}
              </label>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="py-1.5 px-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500 cursor-pointer"
              />
            </div>
            <div className="flex items-center gap-1.5">
              <label className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                {t('Gacha:', 'To:', 'До:')}
              </label>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="py-1.5 px-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500 cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* History Table */}
        {filteredAttendance.length === 0 ? (
          <div className="py-12 text-center space-y-2">
            <Calendar className="w-8 h-8 mx-auto text-slate-300 dark:text-slate-700" />
            <p className="text-xs font-semibold text-slate-400">
              {t('Tanlangan sana oralig\'ida davomat topilmadi.', 'No attendance records found for the selected date range.', 'За выбранный период записи посещаемости не найдены.')}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800">
                  <th className="text-left py-3 px-3 text-[10px] font-black uppercase tracking-wider text-slate-400">
                    {t('Sana', 'Date', 'Дата')}
                  </th>
                  <th className="text-left py-3 px-3 text-[10px] font-black uppercase tracking-wider text-slate-400">
                    {t('Guruh', 'Group', 'Группа')}
                  </th>
                  <th className="text-center py-3 px-3 text-[10px] font-black uppercase tracking-wider text-emerald-400">
                    {t('Kelgan', 'Present', 'Присутствует')}
                  </th>
                  <th className="text-center py-3 px-3 text-[10px] font-black uppercase tracking-wider text-amber-400">
                    {t('Kechikkan', 'Late', 'Опоздал')}
                  </th>
                  <th className="text-center py-3 px-3 text-[10px] font-black uppercase tracking-wider text-rose-400">
                    {t('Yo\'q', 'Absent', 'Отсутствует')}
                  </th>
                  <th className="text-center py-3 px-3 text-[10px] font-black uppercase tracking-wider text-blue-400">
                    {t('Sababli', 'Excused', 'Уважит.')}
                  </th>
                  <th className="text-center py-3 px-3 text-[10px] font-black uppercase tracking-wider text-slate-400">
                    {t('Narx', 'Rate', 'Уровень')}
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredAttendance.map((record) => {
                  const counts = getStatusCounts(record);
                  return (
                    <tr
                      key={record.id}
                      className="border-b border-slate-100 dark:border-slate-800/60 hover:bg-slate-50 dark:hover:bg-slate-800/30 transition"
                    >
                      <td className="py-3 px-3 font-mono font-bold text-slate-900 dark:text-white">
                        {record.date}
                      </td>
                      <td className="py-3 px-3 font-semibold text-slate-700 dark:text-slate-300">
                        {getGroupName(record.groupId)}
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-emerald-500/10 text-emerald-500 font-black">
                          {counts.present}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-amber-500/10 text-amber-500 font-black">
                          {counts.late}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-rose-500/10 text-rose-500 font-black">
                          {counts.absent}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-blue-500/10 text-blue-500 font-black">
                          {counts.excused}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span
                          className={`px-2.5 py-1 rounded-lg font-black ${
                            counts.rate >= 80
                              ? 'bg-emerald-500/10 text-emerald-500'
                              : counts.rate >= 50
                              ? 'bg-amber-500/10 text-amber-500'
                              : 'bg-rose-500/10 text-rose-500'
                          }`}
                        >
                          {counts.rate}%
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Most Absent Students */}
      {stats.mostAbsent.length > 0 && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-sm space-y-3">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-rose-500" />
            <h2 className="text-sm font-extrabold text-slate-900 dark:text-white">
              {t('Ko\'p Qatnashmagan O\'quvchilar', 'Most Absent Students', 'Наиболее Отсутствующие Ученики')}
            </h2>
          </div>

          <div className="space-y-2">
            {stats.mostAbsent.map((student, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between p-3 rounded-2xl bg-rose-500/5 dark:bg-rose-500/10 border border-rose-500/20"
              >
                <div className="flex items-center gap-3">
                  <span className="w-6 text-xs font-mono font-bold text-slate-400">#{idx + 1}</span>
                  <div className="w-8 h-8 rounded-xl bg-rose-500/10 text-rose-500 font-black flex items-center justify-center text-xs">
                    {student.name.charAt(0)}
                  </div>
                  <span className="text-sm font-extrabold text-slate-900 dark:text-white">
                    {student.name}
                  </span>
                </div>
                <span className="px-3 py-1.5 rounded-xl bg-rose-500/10 text-rose-500 text-xs font-black border border-rose-500/20">
                  {student.count} {t('marta kelmagan', 'absences', 'отсутствий')}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
