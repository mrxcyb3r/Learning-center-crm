import React from 'react';
import { TrendingUp, Users, Award, DollarSign, Target, BarChart2 } from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

const CHANNEL_CONVERSION = [
  { name: 'Website Trial Form', leads: 48, converted: 18, rate: '37.5%' },
  { name: 'Telegram Bot (@renessans_bot)', leads: 36, converted: 12, rate: '33.3%' },
  { name: 'Instagram Direct / Ads', leads: 28, converted: 7, rate: '25.0%' },
  { name: 'Walk-ins (Campus)', leads: 15, converted: 8, rate: '53.3%' },
];

const TEACHER_PERFORMANCE = [
  { teacher: 'Jasur Aliyev (IELTS)', cohorts: 3, students: 38, retention: '96%', avgScore: '7.5' },
  { teacher: 'Malika Karimova (CEFR)', cohorts: 2, students: 26, retention: '92%', avgScore: 'B2/C1' },
  { teacher: 'Nodirbek Usmonov (Python)', cohorts: 2, students: 22, retention: '90%', avgScore: 'Project Demo' },
  { teacher: 'Dilnoza Saidova (Grammar)', cohorts: 2, students: 24, retention: '94%', avgScore: 'A2 -> B1' },
];

export const ReportsView: React.FC = () => {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
          Executive Reports & Analytics
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
          Conversion rates by acquisition channel, teacher performance, and cohort retention.
        </p>
      </div>

      {/* Top Conversion Channels */}
      <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
        <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">
          Lead Conversion by Acquisition Source
        </h3>
        <p className="text-xs text-slate-500 mb-6">
          Comparing lead volume against completed paid enrollments
        </p>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-[11px] font-bold text-slate-500 uppercase">
                <th className="py-3 px-4">Channel</th>
                <th className="py-3 px-4">Total Inquiries</th>
                <th className="py-3 px-4">Enrolled Students</th>
                <th className="py-3 px-4">Conversion Rate</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {CHANNEL_CONVERSION.map((ch, idx) => (
                <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                  <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">
                    {ch.name}
                  </td>
                  <td className="py-3 px-4 font-mono text-slate-600 dark:text-slate-300">
                    {ch.leads} leads
                  </td>
                  <td className="py-3 px-4 font-mono font-bold text-emerald-600 dark:text-emerald-400">
                    {ch.converted} students
                  </td>
                  <td className="py-3 px-4">
                    <span className="px-2.5 py-1 rounded-full text-xs font-black bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                      {ch.rate}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Teacher Performance */}
      <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
        <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">
          Mentor Performance & Retention
        </h3>
        <p className="text-xs text-slate-500 mb-6">
          Student retention rate and target exam success per instructor
        </p>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-[11px] font-bold text-slate-500 uppercase">
                <th className="py-3 px-4">Instructor</th>
                <th className="py-3 px-4">Active Cohorts</th>
                <th className="py-3 px-4">Active Students</th>
                <th className="py-3 px-4">Retention</th>
                <th className="py-3 px-4">Avg Student Result</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {TEACHER_PERFORMANCE.map((tp, idx) => (
                <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                  <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">
                    {tp.teacher}
                  </td>
                  <td className="py-3 px-4 text-slate-600 dark:text-slate-300">
                    {tp.cohorts} groups
                  </td>
                  <td className="py-3 px-4 font-mono font-bold text-slate-900 dark:text-white">
                    {tp.students}
                  </td>
                  <td className="py-3 px-4 font-bold text-emerald-600 dark:text-emerald-400">
                    {tp.retention}
                  </td>
                  <td className="py-3 px-4 font-bold text-amber-600 dark:text-amber-400">
                    {tp.avgScore}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
