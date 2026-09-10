import React, { useMemo } from 'react';
import dayjs from 'dayjs';
import {
  Users,
  TrendingUp,
  DollarSign,
  CheckCircle,
  BarChart3,
  Target,
  Calendar,
  Award,
} from 'lucide-react';
import { useTeacherPortal } from '../../../context/TeacherPortalContext';
import { useTheme } from '../../../context/ThemeContext';
import { formatCurrency, formatCompactCurrency } from '../../../utils/format';

const CARD_STYLE = 'rounded-2xl border bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-sm';
const CHART_CARD = 'rounded-2xl border bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 p-5 shadow-sm';

export const TeacherAnalyticsView: React.FC = () => {
  const { theme } = useTheme();
  const { myGroups, myStudents, payments, attendance, stats } = useTeacherPortal();

  const last6Months = useMemo(() => {
    const months: { key: string; label: string }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = dayjs().subtract(i, 'month');
      months.push({ key: d.format('YYYY-MM'), label: d.format('MMM YYYY') });
    }
    return months;
  }, []);

  const studentGrowthData = useMemo(() => {
    return last6Months.map(({ key, label }) => {
      const count = myStudents.filter((s) => {
        if (s.lastPaymentDate?.startsWith(key)) return true;
        const enroll = payments.find(
          (p) => p.studentId === s.id && p.date?.startsWith(key)
        );
        return !!enroll;
      }).length;
      return { label, count };
    });
  }, [last6Months, myStudents, payments]);

  const maxStudentGrowth = Math.max(...studentGrowthData.map((d) => d.count), 1);

  const attendanceData = useMemo(() => {
    const days: { date: string; pct: number }[] = [];
    for (let i = 29; i >= 0; i--) {
      const d = dayjs().subtract(i, 'day');
      const dateStr = d.format('YYYY-MM-DD');
      const dayRecords = attendance.filter((a) => a.date === dateStr);
      let present = 0;
      let total = 0;
      dayRecords.forEach((a) => {
        Object.values(a.records).forEach((r) => {
          total++;
          if (typeof r === 'string' && r === 'present') present++;
          else if (typeof r === 'object' && r.status === 'present') present++;
        });
      });
      days.push({
        date: d.format('MMM D'),
        pct: total > 0 ? Math.round((present / total) * 100) : 0,
      });
    }
    return days;
  }, [attendance]);

  const monthlyIncomeData = useMemo(() => {
    return last6Months.map(({ key, label }) => {
      const total = payments
        .filter((p) => p.date?.startsWith(key) && p.status !== 'refunded')
        .reduce((sum, p) => sum + (p.amount || 0), 0);
      return { label, total };
    });
  }, [last6Months, payments]);

  const maxIncome = Math.max(...monthlyIncomeData.map((d) => d.total), 1);

  const groupOccupancyData = useMemo(() => {
    return myGroups.map((g) => ({
      name: g.name,
      students: g.activeStudentsCount || 0,
      capacity: Math.max(g.activeStudentsCount || 1, 15),
    }));
  }, [myGroups]);

  const maxGroupOccupancy = Math.max(...groupOccupancyData.map((d) => d.capacity), 1);

  const paymentStatusData = useMemo(() => {
    const paid = myStudents.filter((s) => s.paymentStatus === 'paid').length;
    const pending = myStudents.filter((s) => s.paymentStatus === 'pending').length;
    const overdue = myStudents.filter((s) => s.paymentStatus === 'overdue').length;
    const total = paid + pending + overdue || 1;
    return {
      paid,
      pending,
      overdue,
      total,
      paidPct: Math.round((paid / total) * 100),
      pendingPct: Math.round((pending / total) * 100),
      overduePct: Math.round((overdue / total) * 100),
    };
  }, [myStudents]);

  const coursePopularityData = useMemo(() => {
    const map: Record<string, number> = {};
    myGroups.forEach((g) => {
      const course = g.courseType || g.name;
      map[course] = (map[course] || 0) + (g.activeStudentsCount || 0);
    });
    return Object.entries(map)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);
  }, [myGroups]);

  const maxCourseCount = Math.max(...coursePopularityData.map((d) => d.count), 1);

  const paymentCollected = stats.monthlyIncome;
  const paymentExpected = stats.expectedIncome;
  const collectionRate = paymentExpected > 0 ? Math.round((paymentCollected / paymentExpected) * 100) : 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
          Tahlillar va Ko'rsatkichlar
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
          Guruhlaringiz, o'quvchilaringiz va daromadingiz bo'yicha batafsil tahlil.
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className={`${CARD_STYLE} p-5`}>
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
              <Users className="w-5 h-5 text-blue-500" />
            </div>
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              O'quvchilar
            </span>
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white font-mono">
            {stats.activeStudentCount}
          </div>
          <span className="text-[11px] text-emerald-500 font-semibold mt-1 block">
            {stats.paidStudentsCount} ta to'langan
          </span>
        </div>

        <div className={`${CARD_STYLE} p-5`}>
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-emerald-500" />
            </div>
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Davomat
            </span>
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white font-mono">
            {stats.attendanceRate}%
          </div>
          <span className="text-[11px] text-slate-500 mt-1 block">Bugungi ko'rsatkich</span>
        </div>

        <div className={`${CARD_STYLE} p-5`}>
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-amber-500" />
            </div>
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Oylik Daromad
            </span>
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white font-mono">
            {formatCompactCurrency(stats.monthlyIncome)}
          </div>
          <span className="text-[11px] text-slate-500 mt-1 block">
            {formatCompactCurrency(stats.expectedIncome)} kutilgan
          </span>
        </div>

        <div className={`${CARD_STYLE} p-5`}>
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-indigo-500" />
            </div>
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Yig'ish Darajasi
            </span>
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white font-mono">
            {collectionRate}%
          </div>
          <span className="text-[11px] text-slate-500 mt-1 block">
            {stats.paidStudentsCount}/{stats.paidStudentsCount + stats.unpaidStudentsCount} o'quvchi
          </span>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Chart 1: Student Growth */}
        <div className={CHART_CARD}>
          <div className="flex items-center gap-2 mb-1">
            <BarChart3 className="w-4 h-4 text-blue-500" />
            <h3 className="text-sm font-black text-slate-900 dark:text-white">
              O'quvchilar O'sishi
            </h3>
          </div>
          <p className="text-[11px] text-slate-500 mb-4">Oxirgi 6 oy</p>
          <div className="space-y-3">
            {studentGrowthData.map((d, i) => (
              <div key={i} className="flex items-center gap-3">
                <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 w-20 text-right flex-shrink-0">
                  {d.label.split(' ')[0]}
                </span>
                <div className="flex-1 h-6 bg-slate-100 dark:bg-slate-800 rounded-lg overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-lg transition-all duration-500"
                    style={{ width: `${(d.count / maxStudentGrowth) * 100}%` }}
                  />
                </div>
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300 w-8 text-right font-mono">
                  {d.count}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Chart 2: Attendance Rate */}
        <div className={CHART_CARD}>
          <div className="flex items-center gap-2 mb-1">
            <CheckCircle className="w-4 h-4 text-emerald-500" />
            <h3 className="text-sm font-black text-slate-900 dark:text-white">
              Davomat Darajasi
            </h3>
          </div>
          <p className="text-[11px] text-slate-500 mb-4">Oxirgi 30 kun</p>
          <div className="flex items-end gap-[3px] h-32">
            {attendanceData.map((d, i) => {
              const color =
                d.pct >= 80
                  ? 'bg-emerald-500'
                  : d.pct >= 50
                  ? 'bg-amber-500'
                  : d.pct > 0
                  ? 'bg-rose-500'
                  : 'bg-slate-200 dark:bg-slate-700';
              return (
                <div
                  key={i}
                  className="flex-1 group relative"
                  title={`${d.date}: ${d.pct}%`}
                >
                  <div
                    className={`${color} rounded-t-sm transition-all duration-300 w-full`}
                    style={{ height: `${Math.max(d.pct * 1.2, 2)}%` }}
                  />
                  <div className="hidden group-hover:block absolute bottom-full left-1/2 -translate-x-1/2 mb-1 px-2 py-1 rounded bg-slate-900 text-white text-[10px] font-bold whitespace-nowrap z-10">
                    {d.date}: {d.pct}%
                  </div>
                </div>
              );
            })}
          </div>
          <div className="flex items-center justify-between mt-3 text-[10px] font-semibold text-slate-400">
            <span>30 kun oldin</span>
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500" /> 80%+
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-amber-500" /> 50-80%
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-rose-500" /> &lt;50%
              </span>
            </div>
            <span>Bugun</span>
          </div>
        </div>

        {/* Chart 3: Monthly Income */}
        <div className={CHART_CARD}>
          <div className="flex items-center gap-2 mb-1">
            <DollarSign className="w-4 h-4 text-amber-500" />
            <h3 className="text-sm font-black text-slate-900 dark:text-white">
              Oylik Daromad
            </h3>
          </div>
          <p className="text-[11px] text-slate-500 mb-4">Oxirgi 6 oy (UZS)</p>
          <div className="flex items-end gap-3 h-40">
            {monthlyIncomeData.map((d, i) => (
              <div key={i} className="flex-1 group relative flex flex-col items-center">
                <div className="hidden group-hover:block absolute bottom-full mb-2 px-2.5 py-1.5 rounded-lg bg-slate-900 text-white text-[10px] font-bold whitespace-nowrap z-10">
                  {formatCurrency(d.total)}
                </div>
                <div
                  className="w-full bg-gradient-to-t from-amber-500 to-amber-400 rounded-t-xl transition-all duration-500"
                  style={{ height: `${(d.total / maxIncome) * 100}%` }}
                />
                <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 mt-2">
                  {d.label.split(' ')[0]}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Chart 4: Group Occupancy */}
        <div className={CHART_CARD}>
          <div className="flex items-center gap-2 mb-1">
            <Users className="w-4 h-4 text-indigo-500" />
            <h3 className="text-sm font-black text-slate-900 dark:text-white">
              Guruh To'ldirilishi
            </h3>
          </div>
          <p className="text-[11px] text-slate-500 mb-4">O'quvchilar / Sig'imi</p>
          <div className="space-y-3">
            {groupOccupancyData.length === 0 && (
              <div className="py-6 text-center text-xs text-slate-400">Guruhlar topilmadi</div>
            )}
            {groupOccupancyData.map((d, i) => {
              const pct = Math.round((d.students / d.capacity) * 100);
              const color =
                pct >= 75
                  ? 'from-emerald-500 to-emerald-400'
                  : pct >= 50
                  ? 'from-amber-500 to-amber-400'
                  : 'from-rose-500 to-rose-400';
              return (
                <div key={i} className="flex items-center gap-3">
                  <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-300 w-28 truncate flex-shrink-0" title={d.name}>
                    {d.name}
                  </span>
                  <div className="flex-1 h-6 bg-slate-100 dark:bg-slate-800 rounded-lg overflow-hidden">
                    <div
                      className={`h-full bg-gradient-to-r ${color} rounded-lg transition-all duration-500`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300 w-14 text-right font-mono flex-shrink-0">
                    {d.students}/{d.capacity}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Chart 5: Payment Collection Status */}
        <div className={CHART_CARD}>
          <div className="flex items-center gap-2 mb-1">
            <Target className="w-4 h-4 text-rose-500" />
            <h3 className="text-sm font-black text-slate-900 dark:text-white">
              To'lov Holati
            </h3>
          </div>
          <p className="text-[11px] text-slate-500 mb-4">Joriy oy</p>
          <div className="flex items-center justify-center gap-8">
            {/* Donut */}
            <div
              className="relative w-32 h-32 rounded-full flex-shrink-0"
              style={{
                background: `conic-gradient(
                  #10b981 0% ${paymentStatusData.paidPct}%,
                  #f59e0b ${paymentStatusData.paidPct}% ${paymentStatusData.paidPct + paymentStatusData.pendingPct}%,
                  #f43f5e ${paymentStatusData.paidPct + paymentStatusData.pendingPct}% 100%
                )`,
              }}
            >
              <div className="absolute inset-3 rounded-full bg-white dark:bg-slate-900 flex items-center justify-center">
                <span className="text-lg font-black text-slate-900 dark:text-white font-mono">
                  {paymentStatusData.total}
                </span>
              </div>
            </div>
            {/* Legend */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-emerald-500 flex-shrink-0" />
                <span className="text-xs text-slate-600 dark:text-slate-300">To'langan</span>
                <span className="text-xs font-bold text-slate-900 dark:text-white font-mono ml-auto">
                  {paymentStatusData.paid}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-amber-500 flex-shrink-0" />
                <span className="text-xs text-slate-600 dark:text-slate-300">Kutilmoqda</span>
                <span className="text-xs font-bold text-slate-900 dark:text-white font-mono ml-auto">
                  {paymentStatusData.pending}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-rose-500 flex-shrink-0" />
                <span className="text-xs text-slate-600 dark:text-slate-300">Muddati o'tgan</span>
                <span className="text-xs font-bold text-slate-900 dark:text-white font-mono ml-auto">
                  {paymentStatusData.overdue}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Chart 6: Course Popularity */}
        <div className={CHART_CARD}>
          <div className="flex items-center gap-2 mb-1">
            <Award className="w-4 h-4 text-purple-500" />
            <h3 className="text-sm font-black text-slate-900 dark:text-white">
              Kurslar Mashhurligi
            </h3>
          </div>
          <p className="text-[11px] text-slate-500 mb-4">O'quvchilar soni bo'yicha</p>
          <div className="space-y-3">
            {coursePopularityData.length === 0 && (
              <div className="py-6 text-center text-xs text-slate-400">Ma'lumot yo'q</div>
            )}
            {coursePopularityData.map((d, i) => (
              <div key={i} className="flex items-center gap-3">
                <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-300 w-28 truncate flex-shrink-0" title={d.name}>
                  {d.name}
                </span>
                <div className="flex-1 h-6 bg-slate-100 dark:bg-slate-800 rounded-lg overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-purple-500 to-violet-500 rounded-lg transition-all duration-500"
                    style={{ width: `${(d.count / maxCourseCount) * 100}%` }}
                  />
                </div>
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300 w-8 text-right font-mono flex-shrink-0">
                  {d.count}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
