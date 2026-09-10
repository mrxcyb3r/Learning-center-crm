import React, { useState, useEffect } from 'react';
import { TrendingUp, Users, Award, DollarSign, Target, BarChart2, ShieldCheck, ArrowUpRight } from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { crmService } from '../../services/crmService';
import { TeacherRecord, StudentRecord, CourseData, LeadRecord } from '../../types/crm';
import { formatCurrency, toSafeNumber } from '../../utils/format';
import { normalizeLeadStatus } from '../../utils/leads';

export const ReportsView: React.FC = () => {
  const [teachers, setTeachers] = useState<TeacherRecord[]>([]);
  const [students, setStudents] = useState<StudentRecord[]>([]);
  const [courses, setCourses] = useState<CourseData[]>([]);
  const [leads, setLeads] = useState<LeadRecord[]>([]);

  useEffect(() => {
    setTeachers(crmService.getTeachers());
    setStudents(crmService.getStudents());
    setCourses(crmService.getCourses());
    setLeads(crmService.getLeads());
  }, []);

  const totalIncome = crmService.getTotalRevenue();
  const totalExpenses = crmService.getExpenses().reduce((acc, e) => acc + toSafeNumber(e.amount), 0);
  const netProfit = totalIncome - totalExpenses;

  // Calculate leads by source
  const sourceMap: Record<string, { total: number; converted: number }> = {};
  leads.forEach((l) => {
    const src = l.source || 'Bosh sahifa';
    if (!sourceMap[src]) sourceMap[src] = { total: 0, converted: 0 };
    sourceMap[src].total += 1;
    if (['Enrolled', 'Trial Completed'].includes(normalizeLeadStatus(l.status))) {
      sourceMap[src].converted += 1;
    }
  });

  const channelData = Object.keys(sourceMap).map((k) => ({
    name: k,
    leads: sourceMap[k].total,
    converted: sourceMap[k].converted,
    rate: sourceMap[k].total > 0 ? `${Math.round((sourceMap[k].converted / sourceMap[k].total) * 100)}%` : '0%',
  }));

  // Course distribution (real)
  const courseChartData = courses.map((c) => {
    const count = students.filter((s) => s.course === c.title).length;
    return {
      name: c.title.split(' ')[0],
      fullName: c.title,
      students: count,
    };
  });

  // Per-teacher real metrics: count of active students, avg attendance rate
  const teacherMetrics = teachers.map((t) => {
    const teacherStudents = students.filter(
      (s) => s.teacherId === t.id || s.teacher?.toLowerCase() === t.name.toLowerCase() || s.mentor?.toLowerCase() === t.name.toLowerCase()
    );
    const activeCount = teacherStudents.filter((s) => s.status === 'Active' || s.status === 'Trial').length;
    const avgAttendance = teacherStudents.length > 0
      ? Math.round(teacherStudents.reduce((sum, s) => sum + toSafeNumber(s.attendanceRate), 0) / teacherStudents.length)
      : null;
    return { ...t, teacherStudents, activeCount, avgAttendance };
  });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
          Hisobotlar va Tahliliy Ko'rsatkichlar
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
          Lidlar konversiyasi, ustozlar samaradorligi, o'quvchilar saqlanishi va sof foyda.
        </p>
      </div>

      {/* Financial Health Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <span className="text-xs font-semibold text-slate-400 block">Jami Tushum (Kassa)</span>
          <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1 font-mono">
            {formatCurrency(totalIncome)}
          </div>
          <span className="text-[11px] text-slate-500 mt-1 block">O'quv to'lovlari</span>
        </div>

        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <span className="text-xs font-semibold text-slate-400 block">Jami Xarajatlar</span>
          <div className="text-2xl font-black text-rose-600 dark:text-rose-400 mt-1 font-mono">
            {formatCurrency(totalExpenses)}
          </div>
          <span className="text-[11px] text-slate-500 mt-1 block">Maosh, ijara, marketing</span>
        </div>

        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <span className="text-xs font-semibold text-amber-500 block flex items-center gap-1">
            <TrendingUp className="w-4 h-4" /> Sof Operatsion Foyda
          </span>
          <div className="text-2xl font-black text-slate-900 dark:text-white mt-1 font-mono">
            {formatCurrency(netProfit)}
          </div>
          <span className="text-[11px] text-emerald-500 mt-1 block font-semibold flex items-center gap-1">
            <ArrowUpRight className="w-3 h-3" /> Rentabellik: {totalIncome > 0 ? Math.round((netProfit / totalIncome) * 100) : 0}%
          </span>
        </div>
      </div>

      {/* Course Enrollment Distribution Chart */}
      <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
        <h3 className="text-base font-black text-slate-900 dark:text-white mb-1">
          Kurslar Bo'yicha O'quvchilar Taqsimoti
        </h3>
        <p className="text-xs text-slate-500 mb-6">
          Har bir yo'nalishdagi faol o'quvchilar soni
        </p>

        {courseChartData.some((c) => c.students > 0) ? (
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={courseChartData}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} />
                <YAxis stroke="#94a3b8" fontSize={11} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderColor: '#334155',
                    borderRadius: '12px',
                    color: '#fff',
                    fontSize: '12px',
                  }}
                  formatter={(val: any, name: any) => [`${val} ta`, 'O\'quvchilar']}
                />
                <Bar dataKey="students" fill="#f59e0b" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="py-12 text-center text-xs text-slate-400">
            Hozircha kurslarga o'quvchilar biriktirilmagan.
          </div>
        )}
      </div>

      {/* Lead Conversion Table */}
      <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
        <h3 className="text-base font-black text-slate-900 dark:text-white mb-1">
          Murojaatlar (Lidlar) Konversiyasi Manbalar Bo'yicha
        </h3>
        <p className="text-xs text-slate-500 mb-6">
          Reklama manbalaridan kelgan arizalarning talabaga aylanish ko'rsatkichi
        </p>

        {channelData.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-[11px] font-bold text-slate-500 uppercase">
                  <th className="py-3 px-4">Kanal / Manba</th>
                  <th className="py-3 px-4">Kelgan Arizalar</th>
                  <th className="py-3 px-4">Yozilgan O'quvchilar</th>
                  <th className="py-3 px-4">Konversiya Foizi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {channelData.map((ch, idx) => (
                  <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                    <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">{ch.name}</td>
                    <td className="py-3 px-4 font-mono text-slate-600 dark:text-slate-300">{ch.leads} ta</td>
                    <td className="py-3 px-4 font-mono font-bold text-emerald-600 dark:text-emerald-400">{ch.converted} ta</td>
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
        ) : (
          <div className="py-8 text-center text-xs text-slate-400">Hozircha murojaatlar yo'q.</div>
        )}
      </div>

      {/* Teachers Performance Table - REAL data */}
      <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
        <h3 className="text-base font-black text-slate-900 dark:text-white mb-1">
          O'qituvchilar Pedagogik Ko'rsatkichlari
        </h3>
        <p className="text-xs text-slate-500 mb-6">
          Har bir ustozning guruhlari soni, faol o'quvchilari va qatnashish darajasi
        </p>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-[11px] font-bold text-slate-500 uppercase">
                <th className="py-3 px-4">O'qituvchi F.I.SH</th>
                <th className="py-3 px-4">Fan</th>
                <th className="py-3 px-4">Jami O'quvchilar</th>
                <th className="py-3 px-4">Faol O'quvchilar</th>
                <th className="py-3 px-4">Guruhlar</th>
                <th className="py-3 px-4">O'rtacha Davomat</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {teacherMetrics.map((t) => (
                <tr key={t.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                  <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">{t.name}</td>
                  <td className="py-3 px-4 text-slate-600 dark:text-slate-300">{t.subject || t.specialization}</td>
                  <td className="py-3 px-4 font-mono font-bold text-amber-600 dark:text-amber-400">{t.teacherStudents.length} ta</td>
                  <td className="py-3 px-4 font-mono text-emerald-600 dark:text-emerald-400">{t.activeCount} ta</td>
                  <td className="py-3 px-4 font-mono text-slate-600 dark:text-slate-300">{t.activeGroups} ta</td>
                  <td className="py-3 px-4">
                    {t.avgAttendance !== null ? (
                      <span className="px-2.5 py-1 rounded-full text-xs font-black bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                        {t.avgAttendance}%
                      </span>
                    ) : (
                      <span className="text-xs text-slate-400">Ma'lumot yetarli emas</span>
                    )}
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
