import React, { useState, useEffect } from 'react';
import {
  Users,
  PhoneCall,
  Calendar,
  DollarSign,
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  Send,
  Phone,
  CheckCircle2,
  AlertCircle,
  CreditCard,
  Building,
  HandCoins,
  UserPlus,
  PlusCircle,
  BookOpen,
  GraduationCap,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { crmService } from '../../services/crmService';
import { Lead, GroupScheduleItem, StudentRecord } from '../../types/crm';
import { formatCurrency, formatCurrencyShort, formatCompactCurrency, toSafeNumber, getStudentName } from '../../utils/format';
import { normalizeLeadStatus } from '../../utils/leads';

interface DashboardViewProps {
  onNavigateTab: (tabId: string) => void;
  onSelectLeadForEdit?: (lead: Lead) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({ onNavigateTab, onSelectLeadForEdit }) => {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [schedule, setSchedule] = useState<GroupScheduleItem[]>([]);
  const [students, setStudents] = useState<StudentRecord[]>([]);

  useEffect(() => {
    setLeads(crmService.getLeads());
    setSchedule(crmService.getSchedule());
    setStudents(crmService.getStudents());
  }, []);

  const studentsList = crmService.getStudents();
  const payments = crmService.getPayments();
  const expenses = crmService.getExpenses();
  const courses = crmService.getCourses();

  // ---- REAL DATA CALCULATIONS ----
  const activeStudents = studentsList.filter((s) => s.status === 'Active' || s.status === 'Trial' || s.status === 'Paused').length;
  const newLeadsToday = leads.filter((l) => {
    const d = new Date(l.createdAt);
    const today = new Date();
    return d.toDateString() === today.toDateString();
  }).length;
  const recentLeads = leads.length;

  const monthlyRevenue = payments
    .filter((p) => p.status !== 'Voided')
    .reduce((sum, p) => sum + toSafeNumber(p.amount), 0);

  const monthlyExpenses = expenses
    .filter((e) => e.status !== 'Voided')
    .reduce((sum, e) => sum + toSafeNumber(e.amount), 0);

  const monthlySalaryExpense = expenses
    .filter((e) => e.status !== 'Voided' && (e.category === 'Teacher Salary' || e.category === 'Salaries' || e.category === 'Payroll'))
    .reduce((sum, e) => sum + toSafeNumber(e.amount), 0);

  const monthlyOperatingExpense = monthlyExpenses - monthlySalaryExpense;
  const netProfit = monthlyRevenue - monthlyExpenses;

  const outstandingDebt = studentsList
    .filter((s) => s.paymentStatus === 'Overdue' || (toSafeNumber(s.debtAmount) > 0))
    .reduce((sum, s) => sum + toSafeNumber(s.debtAmount || s.monthlyFee || s.tuitionFee), 0);

  // Today's trials
  const todayTrials = leads.filter((l) => {
    const status = normalizeLeadStatus(l.status);
    return status === 'Trial Scheduled' || status === 'Trial Completed';
  }).length;

  // Pipeline funnel
  const countNew = leads.filter((l) => normalizeLeadStatus(l.status) === 'New').length;
  const countContacted = leads.filter((l) => normalizeLeadStatus(l.status) === 'Contacted').length;
  const countTrial = leads.filter((l) => normalizeLeadStatus(l.status) === 'Trial Scheduled' || normalizeLeadStatus(l.status) === 'Trial Completed').length;
  const countEnrolled = leads.filter((l) => normalizeLeadStatus(l.status) === 'Enrolled').length;
  const countLost = leads.filter((l) => normalizeLeadStatus(l.status) === 'Lost').length;

  // Conversion rate (real)
  const totalLeads = leads.length;
  const conversionRate = totalLeads > 0 ? Math.round((countEnrolled / totalLeads) * 100) : 0;

  // Leader pipeline status counts
  const paymentStats = {
    paid: studentsList.filter((s) => s.paymentStatus === 'Paid').length,
    due: studentsList.filter((s) => s.paymentStatus === 'Due').length,
    overdue: studentsList.filter((s) => s.paymentStatus === 'Overdue').length,
  };

  // Recent activity (unified timeline from real data)
  const recentActivity: { id: string; type: string; label: string; date: string; icon: 'student' | 'payment' | 'lead' | 'expense' }[] = [];

  studentsList.slice(0, 3).forEach((s) => {
    recentActivity.push({
      id: `act-st-${s.id}`,
      type: 'student',
      label: `Yangi o'quvchi: ${getStudentName(s)}`,
      date: s.enrollmentDate,
      icon: 'student',
    });
  });
  payments.slice(0, 3).forEach((p) => {
    recentActivity.push({
      id: `act-pay-${p.id}`,
      type: 'payment',
      label: `To'lov: ${p.studentName} - ${formatCurrencyShort(p.amount)} UZS`,
      date: p.date,
      icon: 'payment',
    });
  });
  leads.slice(0, 3).forEach((l) => {
    recentActivity.push({
      id: `act-lead-${l.id}`,
      type: 'lead',
      label: `Yangi murojaat: ${l.name}`,
      date: l.createdAt,
      icon: 'lead',
    });
  });

  recentActivity.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  const recentActivityTop = recentActivity.slice(0, 6);

  // Finance chart data from actual monthly payments
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  const monthLabels = ['Yan', 'Fev', 'Mar', 'Apr', 'May', 'Iyn', 'Iyl', 'Avg', 'Sen', 'Okt', 'Noy', 'Dek'];

  const financeChartData = Array.from({ length: 6 }, (_, i) => {
    const monthIndex = (currentMonth - 5 + i + 12) % 12;
    const yearOffset = monthIndex > currentMonth ? currentYear - 1 : currentYear;
    const mm = String(monthIndex + 1).padStart(2, '0');
    const monthPayments = payments.filter((p) => {
      if (p.status === 'Voided') return false;
      return p.date.startsWith(`${yearOffset}-${mm}`) || p.date.includes(`-${mm}-`);
    });
    const monthExpenses = expenses.filter((e) => {
      if (e.status === 'Voided') return false;
      return e.date.startsWith(`${yearOffset}-${mm}`) || e.date.includes(`-${mm}-`);
    });
    const revenue = monthPayments.reduce((sum, p) => sum + toSafeNumber(p.amount), 0);
    const exp = monthExpenses.reduce((sum, e) => sum + toSafeNumber(e.amount), 0);
    return {
      month: monthLabels[monthIndex],
      revenue,
      expenses: exp,
      profit: revenue - exp,
    };
  });

  // Course distribution (real)
  const courseDistribution = courses.map((c) => {
    const count = studentsList.filter((s) => s.course === c.title).length;
    return { name: c.shortTitle || c.title, fullName: c.title, students: count, color: '#f59e0b' };
  }).filter((c) => c.students > 0);
  const courseTotal = courseDistribution.reduce((sum, c) => sum + c.students, 0);

  const handleStatusChange = (leadId: string, newStatus: string) => {
    crmService.updateLeadStatus(leadId, newStatus as Lead['status']);
    setLeads(crmService.getLeads());
  };

  const today = new Date().toLocaleDateString('uz-UZ', { weekday: 'long', day: 'numeric', month: 'long' });

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            Markaz Holati
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            {today} • Barcha ko'rsatkichlar haqiqiy ma'lumotlardan hisoblanadi
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => onNavigateTab('leads')}
            className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-md shadow-amber-500/20 flex items-center gap-2 transition cursor-pointer"
          >
            <PhoneCall className="w-4 h-4" />
            <span>Murojaatlar ({recentLeads})</span>
          </button>
        </div>
      </div>

      {/* Top KPI Cards - ALL REAL DATA */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-7 gap-3 sm:gap-4">
        <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <span className="text-[10px] sm:text-xs font-semibold text-slate-500 dark:text-slate-400 block">
            Faol O'quvchilar
          </span>
          <div className="text-xl sm:text-3xl font-black text-slate-900 dark:text-white mt-1">
            {activeStudents}
          </div>
          <div className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 mt-1">
            {studentsList.length} jami
          </div>
        </div>

        <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <span className="text-[10px] sm:text-xs font-semibold text-slate-500 dark:text-slate-400 block">
            Yangi Murojaatlar (Bugun)
          </span>
          <div className="text-xl sm:text-3xl font-black text-blue-600 dark:text-blue-400 mt-1">
            {newLeadsToday}
          </div>
          <div className="text-[10px] text-slate-400 mt-1">
            {recentLeads} jami murojaat
          </div>
        </div>

        <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <span className="text-[10px] sm:text-xs font-semibold text-slate-500 dark:text-slate-400 block">
            Bugungi Sinov Darslari
          </span>
          <div className="text-xl sm:text-3xl font-black text-amber-600 dark:text-amber-400 mt-1">
            {todayTrials}
          </div>
          <div className="text-[10px] text-slate-400 mt-1">
            Rejalashtirilgan
          </div>
        </div>

        <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <span className="text-[10px] sm:text-xs font-semibold text-slate-500 dark:text-slate-400 block">
            Oylik Tushum
          </span>
          <div className="text-base sm:text-xl font-black text-slate-900 dark:text-white mt-1 font-mono">
            {formatCompactCurrency(monthlyRevenue)} <span className="text-[10px] sm:text-xs font-normal text-slate-400">UZS</span>
          </div>
          <div className="text-[10px] text-slate-400 mt-1">
            {payments.filter((p) => p.status !== 'Voided').length} ta to'lov
          </div>
        </div>

        <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <span className="text-[10px] sm:text-xs font-semibold text-rose-500 block">
            Qarzdorlik
          </span>
          <div className="text-base sm:text-xl font-black text-rose-600 dark:text-rose-400 mt-1 font-mono">
            {formatCompactCurrency(outstandingDebt)} <span className="text-[10px] sm:text-xs font-normal text-slate-400">UZS</span>
          </div>
          <div className="text-[10px] font-bold text-rose-500 mt-1">
            {paymentStats.overdue} ta qarzdor
          </div>
        </div>

        <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <span className="text-[10px] sm:text-xs font-semibold text-slate-500 dark:text-slate-400 block">
            Oylik Xarajatlar
          </span>
          <div className="text-base sm:text-xl font-black text-slate-900 dark:text-white mt-1 font-mono">
            {formatCompactCurrency(monthlyExpenses)} <span className="text-[10px] sm:text-xs font-normal text-slate-400">UZS</span>
          </div>
          <div className="text-[10px] text-slate-400 mt-1">
            Shu jumladan maosh: {formatCompactCurrency(monthlySalaryExpense)}
          </div>
        </div>

        <div className={`p-4 sm:p-5 rounded-2xl border shadow-sm ${netProfit >= 0 ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-rose-500/10 border-rose-500/30'}`}>
          <span className={`text-[10px] sm:text-xs font-bold block ${netProfit >= 0 ? 'text-emerald-700 dark:text-emerald-400' : 'text-rose-700 dark:text-rose-400'}`}>
            Sof Foyda
          </span>
          <div className={`text-base sm:text-xl font-black mt-1 font-mono ${netProfit >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
            {formatCompactCurrency(netProfit)} <span className="text-[10px] sm:text-xs font-normal opacity-60">UZS</span>
          </div>
          <div className="text-[10px] font-bold mt-1 text-slate-500 dark:text-slate-400">
            Tushum - Xarajatlar
          </div>
        </div>
      </div>

      {/* Lead Pipeline Funnel */}
      <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              Murojaatlar Pipeline
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Yangi → Bog'lanildi → Sinov darsi → O'quvchiga aylandi
            </p>
          </div>
          <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20">
            Konversiya: {conversionRate}%
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 sm:gap-4">
          <div className="p-4 rounded-2xl bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/50">
            <div className="flex items-center justify-between text-xs font-bold text-blue-700 dark:text-blue-400">
              <span>Yangi</span>
              <span className="w-6 h-6 rounded-full bg-blue-500 text-white flex items-center justify-center text-xs">{countNew}</span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-2">Qo'ng'iroq kutilmoqda</p>
          </div>
          <div className="p-4 rounded-2xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50">
            <div className="flex items-center justify-between text-xs font-bold text-amber-700 dark:text-amber-400">
              <span>Bog'lanildi</span>
              <span className="w-6 h-6 rounded-full bg-amber-500 text-slate-950 flex items-center justify-center text-xs">{countContacted}</span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-2">Maslahat berildi</p>
          </div>
          <div className="p-4 rounded-2xl bg-purple-50/70 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-900/50">
            <div className="flex items-center justify-between text-xs font-bold text-purple-700 dark:text-purple-400">
              <span>Sinov Darsi</span>
              <span className="w-6 h-6 rounded-full bg-purple-500 text-white flex items-center justify-center text-xs">{countTrial}</span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-2">Vaqt belgilangan</p>
          </div>
          <div className="p-4 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/50">
            <div className="flex items-center justify-between text-xs font-bold text-emerald-700 dark:text-emerald-400">
              <span>O'quvchiga Aylandi</span>
              <span className="w-6 h-6 rounded-full bg-emerald-500 text-white flex items-center justify-center text-xs">{countEnrolled}</span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-2">To'lov amalga oshdi</p>
          </div>
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
            <div className="flex items-center justify-between text-xs font-bold text-slate-600 dark:text-slate-400">
              <span>Yo'qotildi</span>
              <span className="w-6 h-6 rounded-full bg-slate-400 dark:bg-slate-600 text-white flex items-center justify-center text-xs">{countLost}</span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-2">Sabab qayd etilsin</p>
          </div>
        </div>
      </div>

      {/* Main Grid: Recent Leads & Today's Schedule */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Recent Leads */}
        <div className="lg:col-span-7 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-5">
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  So'nggi Murojaatlar
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Veb-sayt, Telegram va telefondan kelgan so'nggi arizalar
                </p>
              </div>
              <button
                onClick={() => onNavigateTab('leads')}
                className="text-xs font-bold text-amber-600 dark:text-amber-400 hover:underline flex items-center gap-1 cursor-pointer"
              >
                <span>Barchasi</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="space-y-3">
              {leads.slice(0, 5).map((lead) => {
                const status = normalizeLeadStatus(lead.status);
                return (
                  <div
                    key={lead.id}
                    className="p-4 rounded-2xl bg-slate-50/70 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-800 hover:border-amber-500/40 transition flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold text-sm shrink-0">
                        {lead.name.charAt(0)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900 dark:text-white text-sm">{lead.name}</span>
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                              status === 'New'
                                ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20'
                                : status === 'Contacted'
                                ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
                                : status === 'Trial Scheduled' || status === 'Trial Completed'
                                ? 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20'
                                : status === 'Enrolled'
                                ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                                : 'bg-slate-200 dark:bg-slate-800 text-slate-500'
                            }`}
                          >
                            {lead.status}
                          </span>
                        </div>
                        <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 flex items-center gap-2 flex-wrap">
                          <span className="font-medium text-amber-600 dark:text-amber-400">{lead.course}</span>
                          <span>•</span>
                          <span>{lead.phone}</span>
                          {lead.source && (
                            <>
                              <span>•</span>
                              <span className="text-slate-400">{lead.source}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-center">
                      <a href={`tel:${lead.phone}`} className="p-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:text-emerald-500 transition" title="Qo'ng'iroq qilish">
                        <Phone className="w-3.5 h-3.5" />
                      </a>
                      <a
                        href={`https://t.me/+${lead.phone.replace(/\D/g, '')}`}
                        target="_blank"
                        rel="noreferrer"
                        className="p-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:text-sky-500 transition"
                        title="Telegramda ochish"
                      >
                        <Send className="w-3.5 h-3.5" />
                      </a>

                      <select
                        value={lead.status}
                        onChange={(e) => handleStatusChange(lead.id, e.target.value)}
                        className="text-xs font-semibold py-1.5 px-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 focus:outline-none cursor-pointer"
                      >
                        <option value="Yangi">Yangi</option>
                        <option value="Bog'lanildi">Bog'lanildi</option>
                        <option value="Sinov darsi belgilandi">Sinov darsi</option>
                        <option value="O'quvchiga aylandi">O'quvchiga aylandi</option>
                        <option value="Yo'qotildi">Yo'qotildi</option>
                      </select>
                    </div>
                  </div>
                );
              })}
              {leads.length === 0 && (
                <div className="py-8 text-center text-xs text-slate-400">
                  Hozircha murojaatlar yo'q.
                </div>
              )}
            </div>
          </div>

          <button
            onClick={() => onNavigateTab('leads')}
            className="w-full mt-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs transition cursor-pointer text-center"
          >
            To'liq Murojaatlar CRM'ni ochish
          </button>
        </div>

        {/* Right: Today's Schedule & Payment Status + Recent Activity */}
        <div className="lg:col-span-5 space-y-6">
          {/* Today's Schedule */}
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Bugungi Darslar
                </h3>
                <p className="text-xs text-slate-500">Guruhlar va bepul sinov darslari</p>
              </div>
              <button
                onClick={() => onNavigateTab('schedule')}
                className="text-xs font-bold text-amber-600 dark:text-amber-400 hover:underline cursor-pointer"
              >
                Jadval
              </button>
            </div>

            <div className="space-y-2.5">
              {schedule.slice(0, 4).map((item) => (
                <div
                  key={item.id}
                  className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800 flex items-center justify-between text-xs"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full ${item.type === 'Trial Lesson' ? 'bg-amber-500 animate-ping' : 'bg-emerald-500'}`} />
                    <div>
                      <span className="font-bold text-slate-900 dark:text-white block">{item.groupName}</span>
                      <span className="text-slate-500 dark:text-slate-400">
                        {item.teacher} • {item.room} • {item.studentsCount}/{item.maxCapacity}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="font-mono font-bold text-slate-800 dark:text-slate-200 block">{item.time}</span>
                    <span className="text-[10px] text-amber-600 dark:text-amber-400 font-semibold">{item.type}</span>
                  </div>
                </div>
              ))}
              {schedule.length === 0 && (
                <div className="py-6 text-center text-xs text-slate-400">
                  Hozircha guruhlar yo'q.
                </div>
              )}
            </div>
          </div>

          {/* Payment Status Quick Glance */}
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-3">
              To'lov Holati
            </h3>
            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/50">
                <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400 block">To'lagan</span>
                <span className="text-xl font-black text-emerald-700 dark:text-emerald-300 mt-0.5 block">{paymentStats.paid}</span>
                <span className="text-[10px] text-slate-400">O'quvchi</span>
              </div>
              <div className="p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50">
                <span className="text-[11px] font-bold text-amber-700 dark:text-amber-400 block">Muddati Kelgan</span>
                <span className="text-xl font-black text-amber-700 dark:text-amber-400 mt-0.5 block">{paymentStats.due}</span>
                <span className="text-[10px] text-slate-400">To'lov kerak</span>
              </div>
              <div className="p-3 rounded-2xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50">
                <span className="text-[11px] font-bold text-red-700 dark:text-red-400 block">Qarzdor</span>
                <span className="text-xl font-black text-red-600 dark:text-red-400 mt-0.5 block">{paymentStats.overdue}</span>
                <span className="text-[10px] text-slate-400">Eslatma kerak</span>
              </div>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-4">
              So'nggi Faoliyat
            </h3>
            <div className="space-y-3">
              {recentActivityTop.map((act) => (
                <div key={act.id} className="flex items-start gap-3">
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                    act.icon === 'student' ? 'bg-emerald-500/10 text-emerald-500'
                    : act.icon === 'payment' ? 'bg-amber-500/10 text-amber-500'
                    : act.icon === 'lead' ? 'bg-blue-500/10 text-blue-500'
                    : 'bg-slate-500/10 text-slate-500'
                  }`}>
                    {act.icon === 'student' ? <UserPlus className="w-3.5 h-3.5" />
                      : act.icon === 'payment' ? <CreditCard className="w-3.5 h-3.5" />
                      : <PhoneCall className="w-3.5 h-3.5" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">{act.label}</div>
                    <div className="text-[10px] text-slate-400">
                      {new Date(act.date).toLocaleDateString('uz-UZ', { day: 'numeric', month: 'short' })}
                    </div>
                  </div>
                </div>
              ))}
              {recentActivity.length === 0 && (
                <div className="py-6 text-center text-xs text-slate-400">
                  Hozircha faoliyat qaydlari yo'q.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Financial Charts: Real Revenue vs Expenses */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-12 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                Oylik Moliyaviy Holat
              </h3>
              <p className="text-xs text-slate-500">
                Haqiqiy to'lovlar va xarajatlar asosida hisoblangan
              </p>
            </div>
            <div className="flex items-center gap-4 text-xs font-semibold">
              <span className="flex items-center gap-1.5 text-amber-500">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500" /> Tushum
              </span>
              <span className="flex items-center gap-1.5 text-rose-500">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500" /> Xarajatlar
              </span>
              <span className="flex items-center gap-1.5 text-emerald-500">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Foyda
              </span>
            </div>
          </div>

          {financeChartData.some((d) => d.revenue > 0 || d.expenses > 0) ? (
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={financeChartData}>
                  <defs>
                    <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorProf" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.2} />
                  <XAxis dataKey="month" stroke="#94a3b8" fontSize={11} />
                  <YAxis
                    stroke="#94a3b8"
                    fontSize={10}
                    tickFormatter={(val) => `${(val / 1000000).toFixed(0)}M`}
                  />
                  <Tooltip
                    formatter={(val: any) => [`${Number(val).toLocaleString()} UZS`, '']}
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', fontSize: '12px' }}
                  />
                  <Area type="monotone" dataKey="revenue" stroke="#f59e0b" strokeWidth={2.5} fillOpacity={1} fill="url(#colorRev)" />
                  <Area type="monotone" dataKey="expenses" stroke="#f43f5e" strokeWidth={2} fillOpacity={0.15} fill="url(#colorRev)" />
                  <Area type="monotone" dataKey="profit" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorProf)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="py-12 text-center text-xs text-slate-400">
              Moliyaviy ma'lumotlar yetarli emas. To'lovlar va xarajatlarni kiritishni boshlang.
            </div>
          )}
        </div>
      </div>

      {/* Course Distribution */}
      <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
        <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">
          Kurslar Bo'yicha O'quvchilar
        </h3>
        <p className="text-xs text-slate-500 mb-4">
          Haqiqiy guruh a'zoligi asosida
        </p>

        {courseTotal > 0 ? (
          <div className="space-y-3">
            {courseDistribution.map((c) => (
              <div key={c.fullName} className="space-y-1">
                <div className="flex justify-between text-xs font-semibold">
                  <span className="text-slate-700 dark:text-slate-300">{c.fullName}</span>
                  <span className="text-slate-900 dark:text-white font-bold">{c.students} ta</span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                  <div
                    className="h-full rounded-full"
                    style={{ width: `${courseTotal > 0 ? (c.students / courseTotal) * 100 : 0}%`, backgroundColor: c.color }}
                  />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-6 text-center text-xs text-slate-400">
            Hozircha kurslarga o'quvchilar biriktirilmagan.
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
        <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">
          Tezkor Amallar
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <button
            onClick={() => onNavigateTab('leads')}
            className="p-4 rounded-2xl bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/40 hover:border-blue-500/50 transition cursor-pointer text-left"
          >
            <PhoneCall className="w-5 h-5 text-blue-500 mb-2" />
            <div className="text-xs font-bold text-slate-800 dark:text-slate-200">Yangi Murojaat</div>
          </button>
          <button
            onClick={() => onNavigateTab('students')}
            className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/40 hover:border-emerald-500/50 transition cursor-pointer text-left"
          >
            <UserPlus className="w-5 h-5 text-emerald-500 mb-2" />
            <div className="text-xs font-bold text-slate-800 dark:text-slate-200">Yangi O'quvchi</div>
          </button>
          <button
            onClick={() => onNavigateTab('payments')}
            className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/40 hover:border-amber-500/50 transition cursor-pointer text-left"
          >
            <CreditCard className="w-5 h-5 text-amber-500 mb-2" />
            <div className="text-xs font-bold text-slate-800 dark:text-slate-200">Yangi To'lov</div>
          </button>
          <button
            onClick={() => onNavigateTab('schedule')}
            className="p-4 rounded-2xl bg-purple-50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-900/40 hover:border-purple-500/50 transition cursor-pointer text-left"
          >
            <Calendar className="w-5 h-5 text-purple-500 mb-2" />
            <div className="text-xs font-bold text-slate-800 dark:text-slate-200">Yangi Guruh</div>
          </button>
          <button
            onClick={() => onNavigateTab('teachers')}
            className="p-4 rounded-2xl bg-sky-50 dark:bg-sky-950/30 border border-sky-200 dark:border-sky-900/40 hover:border-sky-500/50 transition cursor-pointer text-left"
          >
            <GraduationCap className="w-5 h-5 text-sky-500 mb-2" />
            <div className="text-xs font-bold text-slate-800 dark:text-slate-200">Ustoz Qo'shish</div>
          </button>
          <button
            onClick={() => onNavigateTab('courses')}
            className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/40 hover:border-rose-500/50 transition cursor-pointer text-left"
          >
            <BookOpen className="w-5 h-5 text-rose-500 mb-2" />
            <div className="text-xs font-bold text-slate-800 dark:text-slate-200">Yangi Kurs</div>
          </button>
        </div>
      </div>
    </div>
  );
};