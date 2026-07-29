import React, { useState } from 'react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';
import dayjs from 'dayjs';
import { TypewriterText } from '../common/TypewriterText';
import { TrendingUp, DollarSign, AlertCircle, Calendar } from 'lucide-react';

interface RevenueDataPoint {
  month: string;
  revenue: number;
  debt: number;
  students: number;
}

const mockMonthlyData: RevenueDataPoint[] = [
  { month: 'Jan', revenue: 42000000, debt: 12000000, students: 85 },
  { month: 'Feb', revenue: 48500000, debt: 9500000, students: 92 },
  { month: 'Mar', revenue: 54000000, debt: 8200000, students: 104 },
  { month: 'Apr', revenue: 61000000, debt: 7000000, students: 118 },
  { month: 'May', revenue: 68000000, debt: 6500000, students: 130 },
  { month: 'Jun', revenue: 75500000, debt: 5200000, students: 142 },
  { month: 'Jul', revenue: 84000000, debt: 4800000, students: 156 },
];

const formatCurrency = (val: number) => {
  if (val >= 1000000) {
    return `${(val / 1000000).toFixed(1)}M UZS`;
  }
  return `${val.toLocaleString()} UZS`;
};

export const TuitionRevenueChart: React.FC = () => {
  const [chartType, setChartType] = useState<'area' | 'bar'>('area');
  const currentDate = dayjs().format('MMMM YYYY');

  return (
    <div className="bg-white/80 dark:bg-slate-900/50 backdrop-blur-md border border-slate-200/80 dark:border-slate-800/60 rounded-3xl p-5 md:p-6 shadow-sm dark:shadow-xl space-y-5">
      {/* Chart Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-xl bg-emerald-500/10 text-emerald-500">
              <TrendingUp className="w-4 h-4" />
            </span>
            <h3 className="text-base font-extrabold text-slate-900 dark:text-white tracking-tight">
              <TypewriterText
                texts={["Tushum & Debtorlar Trendi (2026)", "Revenue & Debt Analytics Stream"]}
                speed={40}
                loop={true}
                cursorColorClass="text-emerald-500"
              />
            </h3>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5 text-amber-500" />
            <span>Sinxronlashtirilgan oylik moliya ko'rsatkichlari • {currentDate}</span>
          </p>
        </div>

        {/* Chart View Toggle */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-800 rounded-2xl shrink-0 self-start sm:self-auto">
          <button
            onClick={() => setChartType('area')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
              chartType === 'area'
                ? 'bg-amber-500 text-slate-950 shadow-md'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Area View
          </button>
          <button
            onClick={() => setChartType('bar')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
              chartType === 'bar'
                ? 'bg-amber-500 text-slate-950 shadow-md'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Bar View
          </button>
        </div>
      </div>

      {/* Metric Highlights */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400">
          <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider">
            <DollarSign className="w-3.5 h-3.5" />
            <span>Iyul Tushumi</span>
          </div>
          <p className="text-lg font-black font-mono mt-1">84.0M UZS</p>
        </div>

        <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400">
          <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider">
            <AlertCircle className="w-3.5 h-3.5" />
            <span>Qolgan Qarzdorlik</span>
          </div>
          <p className="text-lg font-black font-mono mt-1">4.8M UZS</p>
        </div>

        <div className="col-span-2 sm:col-span-1 p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400">
          <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>O'sish Sur'ati</span>
          </div>
          <p className="text-lg font-black font-mono mt-1">+11.2% / oy</p>
        </div>
      </div>

      {/* Recharts Canvas */}
      <div className="w-full h-72 pt-2">
        <ResponsiveContainer width="100%" height="100%">
          {chartType === 'area' ? (
            <AreaChart data={mockMonthlyData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
              <defs>
                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10B981" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="#10B981" stopOpacity={0.0} />
                </linearGradient>
                <linearGradient id="colorDebt" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#F59E0B" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="#F59E0B" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.3} />
              <XAxis dataKey="month" stroke="#94A3B8" fontSize={11} tickLine={false} />
              <YAxis stroke="#94A3B8" fontSize={11} tickFormatter={(v) => `${v / 1000000}M`} tickLine={false} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#0F172A',
                  borderColor: '#334155',
                  borderRadius: '16px',
                  color: '#F8FAFC',
                  fontSize: '12px',
                  boxShadow: '0 10px 25px rgba(0,0,0,0.5)',
                }}
                formatter={(value: any) => [formatCurrency(Number(value)), '']}
              />
              <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
              <Area
                type="monotone"
                dataKey="revenue"
                name="Qabul Qilingan Tushum"
                stroke="#10B981"
                strokeWidth={3}
                fillOpacity={1}
                fill="url(#colorRevenue)"
              />
              <Area
                type="monotone"
                dataKey="debt"
                name="Kutilayotgan Qarz"
                stroke="#F59E0B"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorDebt)"
              />
            </AreaChart>
          ) : (
            <BarChart data={mockMonthlyData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.3} />
              <XAxis dataKey="month" stroke="#94A3B8" fontSize={11} tickLine={false} />
              <YAxis stroke="#94A3B8" fontSize={11} tickFormatter={(v) => `${v / 1000000}M`} tickLine={false} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#0F172A',
                  borderColor: '#334155',
                  borderRadius: '16px',
                  color: '#F8FAFC',
                  fontSize: '12px',
                }}
                formatter={(value: any) => [formatCurrency(Number(value)), '']}
              />
              <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
              <Bar dataKey="revenue" name="Tushum" fill="#10B981" radius={[8, 8, 0, 0]} />
              <Bar dataKey="debt" name="Qarzdorlik" fill="#F59E0B" radius={[8, 8, 0, 0]} />
            </BarChart>
          )}
        </ResponsiveContainer>
      </div>
    </div>
  );
};
