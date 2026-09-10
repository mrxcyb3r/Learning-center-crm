import React, { useMemo } from 'react';
import dayjs from 'dayjs';
import { useTeacherPortal } from '../../../context/TeacherPortalContext';
import { useTheme } from '../../../context/ThemeContext';
import { StatCard } from '../shared/StatCard';
import { DollarSign, Users, AlertTriangle, Layers } from 'lucide-react';

export const TeacherIncomeView: React.FC = () => {
  const { myStudents, payments, myGroups, businessModel } = useTeacherPortal();
  const { theme } = useTheme();

  const now = dayjs();
  const currentMonthStr = now.format('YYYY-MM');

  const currentMonthPayments = useMemo(
    () => payments.filter((p) => p.date?.startsWith(currentMonthStr)),
    [payments, currentMonthStr]
  );

  const incomeThisMonth = currentMonthPayments.reduce((sum, p) => sum + (p.amount || 0), 0);

  const paidStudentIds = new Set(
    currentMonthPayments.filter((p) => p.status === 'paid').map((p) => p.studentId)
  );
  const studentsPaid = myStudents.filter((s) => paidStudentIds.has(s.id)).length;

  const outstanding = myStudents
    .filter((s) => s.paymentStatus !== 'paid')
    .reduce((sum, s) => sum + (s.tuitionFee || 0), 0);

  const activeGroups = myGroups.length;

  const monthlyData = useMemo(() => {
    const months: {
      key: string;
      label: string;
      collected: number;
      expected: number;
      paidCount: number;
      totalStudents: number;
    }[] = [];

    for (let i = 5; i >= 0; i--) {
      const monthDate = now.subtract(i, 'month');
      const key = monthDate.format('YYYY-MM');
      const label = monthDate.format('MMM');
      const monthPayments = payments.filter((p) => p.date?.startsWith(key));
      const collected = monthPayments.reduce((sum, p) => sum + (p.amount || 0), 0);
      const expected = myStudents.reduce((sum, s) => sum + (s.tuitionFee || 0), 0);
      const paidIds = new Set(monthPayments.filter((p) => p.status === 'paid').map((p) => p.studentId));
      const paidCount = myStudents.filter((s) => paidIds.has(s.id)).length;

      months.push({ key, label, collected, expected, paidCount, totalStudents: myStudents.length });
    }

    return months;
  }, [payments, myStudents, now]);

  const maxCollected = Math.max(...monthlyData.map((m) => m.collected), 1);

  const totalExpected = myStudents.reduce((sum, s) => sum + (s.tuitionFee || 0), 0);
  const totalPaid = incomeThisMonth;
  const collectionRate = totalExpected > 0 ? Math.round((totalPaid / totalExpected) * 100) : 0;

  if (businessModel === 'learning_center') {
    return (
      <div className={`rounded-2xl p-8 border ${theme === 'dark' ? 'bg-slate-900/50 border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}>
        <div className="flex flex-col items-center justify-center text-center py-12">
          <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-4 ${theme === 'dark' ? 'bg-slate-800' : 'bg-slate-100'}`}>
            <DollarSign className={`w-8 h-8 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`} />
          </div>
          <h3 className={`text-lg font-bold mb-2 ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
            Daromad ma'lumotlari o'quv markazi tomonidan boshqariladi
          </h3>
          <p className={`text-sm max-w-md ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
            Ushbu biznes modelida moliyaviy ma'lumotlar va daromadni kuzatish o'quv markazi ma'muriyati tomonidan amalga oshiriladi.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
          <h2 className={`text-xl font-black ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
            Daromad tahlili
          </h2>
          <p className={`text-sm mt-0.5 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
            Daromadingizni va yig'ilish darajasini kuzating
          </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={<DollarSign className="w-5 h-5" />}
          value={`${incomeThisMonth.toLocaleString()} UZS`}
          label="Oylik daromad"
          color="amber"
        />
        <StatCard
          icon={<Users className="w-5 h-5" />}
          value={studentsPaid}
          label="To'lagan o'quvchilar"
          color="emerald"
        />
        <StatCard
          icon={<AlertTriangle className="w-5 h-5" />}
          value={`${outstanding.toLocaleString()} UZS`}
          label="Qarzdorlik"
          color="rose"
        />
        <StatCard
          icon={<Layers className="w-5 h-5" />}
          value={activeGroups}
          label="Faol guruhlar"
          color="blue"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Monthly Trend Bar Chart */}
        <div className={`lg:col-span-2 rounded-2xl p-5 border ${theme === 'dark' ? 'bg-slate-900/50 border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}>
          <h3 className={`text-sm font-bold mb-4 ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
            Oylik dinamika
          </h3>
          <div className="flex items-end gap-3 h-48">
            {monthlyData.map((m) => {
              const heightPct = maxCollected > 0 ? (m.collected / maxCollected) * 100 : 0;
              return (
                <div key={m.key} className="flex-1 flex flex-col items-center gap-2">
                  <span className={`text-[10px] font-bold ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
                    {m.collected > 0 ? `${(m.collected / 1000).toFixed(0)}k` : '0'}
                  </span>
                  <div
                    className={`w-full rounded-lg transition-all duration-500 ${
                      m.key === currentMonthStr
                        ? 'bg-gradient-to-t from-blue-600 to-blue-400'
                        : theme === 'dark'
                        ? 'bg-slate-700'
                        : 'bg-slate-200'
                    }`}
                    style={{ height: `${Math.max(heightPct, 4)}%` }}
                  />
                  <span className={`text-[10px] font-bold ${m.key === currentMonthStr ? 'text-blue-500' : theme === 'dark' ? 'text-slate-500' : 'text-slate-400'}`}>
                    {m.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Collection Rate Donut */}
        <div className={`rounded-2xl p-5 border flex flex-col items-center justify-center ${theme === 'dark' ? 'bg-slate-900/50 border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}>
          <h3 className={`text-sm font-bold mb-6 ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
            To'lov yig'ilishi
          </h3>
          <div className="relative w-36 h-36">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
              <circle
                cx="60"
                cy="60"
                r="50"
                fill="none"
                strokeWidth="12"
                className={theme === 'dark' ? 'stroke-slate-800' : 'stroke-slate-100'}
              />
              <circle
                cx="60"
                cy="60"
                r="50"
                fill="none"
                strokeWidth="12"
                strokeDasharray={`${(collectionRate / 100) * 314.16} 314.16`}
                strokeLinecap="round"
                className={`transition-all duration-700 ${
                  collectionRate >= 80
                    ? 'stroke-emerald-500'
                    : collectionRate >= 50
                    ? 'stroke-amber-500'
                    : 'stroke-rose-500'
                }`}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className={`text-2xl font-black ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                {collectionRate}%
              </span>
              <span className={`text-[10px] font-bold uppercase tracking-wider ${theme === 'dark' ? 'text-slate-500' : 'text-slate-400'}`}>
                Yig'ilgan
              </span>
            </div>
          </div>
          <div className="flex items-center gap-4 mt-4">
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              <span className={`text-[10px] font-bold ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
                To'langan ({collectionRate}%)
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className={`w-2.5 h-2.5 rounded-full ${theme === 'dark' ? 'bg-slate-700' : 'bg-slate-200'}`} />
              <span className={`text-[10px] font-bold ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
                To'lanmagan ({100 - collectionRate}%)
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Monthly Breakdown Table */}
      <div className={`rounded-2xl border overflow-hidden ${theme === 'dark' ? 'bg-slate-900/50 border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}>
        <div className={`px-5 py-4 border-b ${theme === 'dark' ? 'border-slate-800' : 'border-slate-100'}`}>
          <h3 className={`text-sm font-bold ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
            Oylik taqsimot
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className={`border-b ${theme === 'dark' ? 'border-slate-800' : 'border-slate-100'}`}>
                {['Oy', 'Yig\'ilgan', 'Kutilgan', 'Farq', 'Daraja'].map((h) => (
                  <th
                    key={h}
                    className={`px-5 py-3 text-left text-[10px] font-bold uppercase tracking-widest ${theme === 'dark' ? 'text-slate-500' : 'text-slate-400'}`}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {monthlyData.map((m) => {
                const diff = m.collected - m.expected;
                const rate = m.expected > 0 ? Math.round((m.collected / m.expected) * 100) : 0;
                const rateColor =
                  rate >= 80 ? 'text-emerald-500' : rate >= 50 ? 'text-amber-500' : 'text-rose-500';

                return (
                  <tr
                    key={m.key}
                    className={`border-b transition ${theme === 'dark' ? 'border-slate-800/50 hover:bg-slate-800/30' : 'border-slate-50 hover:bg-slate-50'}`}
                  >
                    <td className={`px-5 py-3 text-sm font-bold ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                      {dayjs(m.key + '-01').format('MMMM YYYY')}
                    </td>
                    <td className="px-5 py-3 text-sm font-bold text-emerald-500">
                      {m.collected.toLocaleString()} UZS
                    </td>
                    <td className={`px-5 py-3 text-sm font-semibold ${theme === 'dark' ? 'text-slate-300' : 'text-slate-600'}`}>
                      {m.expected.toLocaleString()} UZS
                    </td>
                    <td className={`px-5 py-3 text-sm font-bold ${diff >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                      {diff >= 0 ? '+' : ''}{diff.toLocaleString()} UZS
                    </td>
                    <td className={`px-5 py-3 text-sm font-black ${rateColor}`}>
                      {rate}%
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
