import React, { useState, useEffect } from 'react';
import {
  PhoneCall,
  ArrowUpRight,
  Send,
  Phone,
  AlertCircle,
  MessageSquare,
  ChevronRight,
} from 'lucide-react';
import { leadsService, studentsService, paymentsService, expensesService, coursesService, groupsService, murojaatlarService } from '../../services/repository';
import { Lead, GroupScheduleItem, StudentRecord, IncomePaymentRecord, ExpenseRecord, CourseData, MurojaatSummary } from '../../types/crm';
import { formatCurrencyShort, formatCompactCurrency, toSafeNumber, getStudentName } from '../../utils/format';
import { normalizeLeadStatus } from '../../utils/leads';

interface DashboardViewProps {
  onNavigateTab: (tabId: string) => void;
  onSelectLeadForEdit?: (lead: Lead) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({ onNavigateTab, onSelectLeadForEdit }) => {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [schedule, setSchedule] = useState<GroupScheduleItem[]>([]);
  const [students, setStudents] = useState<StudentRecord[]>([]);
  const [payments, setPayments] = useState<IncomePaymentRecord[]>([]);
  const [expenses, setExpenses] = useState<ExpenseRecord[]>([]);
  const [courses, setCourses] = useState<CourseData[]>([]);
  const [murojaat, setMurojaat] = useState<MurojaatSummary>({ total: 0, newCount: 0, unread: 0, telegram: 0, website: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const loadData = async () => {
      try {
        const [leadsData, scheduleData, studentsData, paymentsData, expensesData, coursesData, murojaatData] = await Promise.all([
          leadsService.getAllLeads(),
          groupsService.getAllGroups(),
          studentsService.getAllStudents(),
          paymentsService.getAllPayments(),
          expensesService.getAllExpenses(),
          coursesService.getAllCourses(),
          murojaatlarService.getSummary()
        ]);

        if (mounted) {
          setLeads(leadsData);
          setSchedule(scheduleData as unknown as GroupScheduleItem[]);
          setStudents(studentsData as unknown as StudentRecord[]);
          setPayments(paymentsData as unknown as IncomePaymentRecord[]);
          setExpenses(expensesData as unknown as ExpenseRecord[]);
          setCourses(coursesData as unknown as CourseData[]);
          setMurojaat(murojaatData);
          setLoading(false);
        }
      } catch (err) {
        console.error('Dashboard data load error:', err);
        if (mounted) setLoading(false);
      }
    };

    loadData();

    return () => { mounted = false; };
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500" />
      </div>
    );
  }

  const studentsList = students;

  // ---- REAL DATA CALCULATIONS ----
  const activeStudents = studentsList.filter((s) => s.status === 'Active' || s.status === 'Trial' || s.status === 'Paused').length;
  const newLeadsToday = leads.filter((l) => {
    const d = new Date(l.createdAt);
    const today = new Date();
    return d.toDateString() === today.toDateString();
  }).length;
  const recentLeads = leads.length;

  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  const currentMonthKey = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}`;

  const monthlyRevenue = payments
    .filter((p) => p.status !== 'Voided' && p.date.startsWith(currentMonthKey))
    .reduce((sum, p) => sum + toSafeNumber(p.amount), 0);

  const monthlyExpenses = expenses
    .filter((e) => e.status !== 'Voided' && e.date.startsWith(currentMonthKey))
    .reduce((sum, e) => sum + toSafeNumber(e.amount), 0);

  const monthlySalaryExpense = expenses
    .filter((e) => e.status !== 'Voided' && e.date.startsWith(currentMonthKey) && (e.category === 'Teacher Salary' || e.category === 'Salaries' || e.category === 'Payroll'))
    .reduce((sum, e) => sum + toSafeNumber(e.amount), 0);

  const netProfit = monthlyRevenue - monthlyExpenses;

  // Today's trials (scheduled for today per trialDateTime)
  const todayTrials = leads.filter((l) => {
    if (!l.trialDateTime) return false;
    return new Date(l.trialDateTime).toDateString() === new Date().toDateString();
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

  // Follow-up required: leads that still need contact (New / Contacted, no trial date yet)
  const followUpLeads = leads
    .filter((l) => {
      const st = normalizeLeadStatus(l.status);
      return st === 'New' || st === 'Contacted' || st === 'Trial Scheduled' || st === 'Trial Completed';
    })
    .slice(0, 5);

  // Payment alerts: students with real debt or overdue status
  const debtorsList = studentsList
    .filter((s) => toSafeNumber(s.debtAmount) > 0 || s.paymentStatus === 'Overdue' || s.paymentStatus === 'Due')
    .map((s) => {
      const amount = toSafeNumber(s.debtAmount) > 0 ? toSafeNumber(s.debtAmount) : toSafeNumber(s.monthlyFee || s.tuitionFee);
      return {
        id: s.id,
        name: getStudentName(s),
        course: s.course,
        amount,
        monthsOverdue: 0,
      };
    });

  // Leader pipeline status counts
  const paymentStats = {
    paid: studentsList.filter((s) => s.paymentStatus === 'Paid').length,
    due: studentsList.filter((s) => s.paymentStatus === 'Due').length,
    overdue: studentsList.filter((s) => s.paymentStatus === 'Overdue').length,
  };

  const handleStatusChange = async (leadId: string, newStatus: string) => {
    await leadsService.updateLead(leadId, { status: newStatus as Lead['status'] });
    const updatedLeads = await leadsService.getAllLeads();
    setLeads(updatedLeads);
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
            onClick={() => onNavigateTab('murojaatlar')}
            className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-md shadow-amber-500/20 flex items-center gap-2 transition cursor-pointer"
          >
            <MessageSquare className="w-4 h-4" />
            <span>Murojaatlar ({murojaat.total})</span>
          </button>
        </div>
      </div>

      {/* Top KPI Cards - ALL REAL DATA */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
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

      {/* Unified Murojaatlar summary (real data) */}
      <button
        onClick={() => onNavigateTab('murojaatlar')}
        className="w-full px-5 py-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm hover:border-amber-500/40 transition cursor-pointer flex items-center justify-between gap-4 text-left"
      >
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
            <MessageSquare className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-black text-slate-900 dark:text-white">Murojaatlar</div>
            <div className="flex items-center gap-3 mt-1 text-[11px] font-semibold text-slate-500 dark:text-slate-400">
              <span>{murojaat.total} jami</span>
              <span className="text-blue-600 dark:text-blue-400">{murojaat.newCount} yangi</span>
              <span className="text-amber-600 dark:text-amber-400">{murojaat.unread} o'qilmagan</span>
            </div>
          </div>
        </div>
        <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
      </button>

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
                   Kuzatuv Talab Qilinadi
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Hali aloqa qilinmagan yoki ishlanmagan arizalar
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
              {followUpLeads.map((lead) => {
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

                      <button
                        onClick={() => onNavigateTab('leads')}
                        className="p-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:text-amber-500 hover:border-amber-500/40 transition cursor-pointer"
                        title="CRM da ochish"
                      >
                        <ArrowUpRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
              {followUpLeads.length === 0 && (
                <div className="py-8 text-center text-xs text-slate-400">
                  Hozircha ishlanmagan murojaatlar yo'q.
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
                    <span className="text-[10px] text-amber-600 dark:text-amber-400 font-semibold">{item.type === 'Trial Lesson' ? 'Sinov Darsi' : 'Asosiy Guruh'}</span>
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

            <div className="mt-4">
              <div className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-2 flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5 text-rose-500" />
                To'lov Eslatmalari
              </div>
              {debtorsList.length > 0 ? (
                <div className="space-y-2">
                  {debtorsList.slice(0, 4).map((d) => (
                    <div key={d.id} className="p-3 rounded-2xl bg-rose-50/60 dark:bg-rose-950/20 border border-rose-200/70 dark:border-rose-900/40 flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-slate-900 dark:text-white truncate">{d.name}</div>
                        <div className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                          {d.course} • <span className="text-rose-600 dark:text-rose-400 font-semibold">{formatCurrencyShort(d.amount)} UZS</span>
                        </div>
                      </div>
                      <button
                        onClick={() => onNavigateTab('payments')}
                        className="shrink-0 text-[10px] font-bold px-2.5 py-1.5 rounded-lg bg-rose-500 text-white hover:bg-rose-600 transition cursor-pointer"
                      >
                        To'lov
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-3 text-center text-xs text-slate-400">
                  Qarzdorlik yo'q.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Ops quick facts */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <h3 className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-2 flex items-center gap-1.5">
            <AlertCircle className="w-3.5 h-3.5 text-amber-500" />
            Kurslar Bo'yicha O'quvchilar
          </h3>
          {courses.filter((c) => studentsList.filter((s) => s.course === c.title).length > 0).length > 0 ? (
            <div className="space-y-2.5">
              {courses.map((c) => {
                const count = studentsList.filter((s) => s.course === c.title).length;
                if (count === 0) return null;
                return (
                  <div key={c.id} className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-700 dark:text-slate-300 truncate">{c.shortTitle || c.title}</span>
                    <span className="font-bold text-slate-900 dark:text-white ml-2 shrink-0">{count} ta</span>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="py-3 text-center text-xs text-slate-400">
              Hozircha kurslarga o'quvchilar biriktirilmagan.
            </div>
          )}
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <h3 className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
            Tezkor Amallar
          </h3>
          <div className="space-y-2">
            <button
              onClick={() => onNavigateTab('leads')}
              className="w-full p-3 rounded-xl bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/40 hover:border-blue-500/50 transition cursor-pointer text-left flex items-center justify-between gap-2"
            >
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200">Murojaatlar CRM</span>
              <ArrowUpRight className="w-4 h-4 text-blue-500 shrink-0" />
            </button>
            <button
              onClick={() => onNavigateTab('students')}
              className="w-full p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/40 hover:border-emerald-500/50 transition cursor-pointer text-left flex items-center justify-between gap-2"
            >
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200">O'quvchilar</span>
              <ArrowUpRight className="w-4 h-4 text-emerald-500 shrink-0" />
            </button>
            <button
              onClick={() => onNavigateTab('payments')}
              className="w-full p-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/40 hover:border-amber-500/50 transition cursor-pointer text-left flex items-center justify-between gap-2"
            >
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200">To'lovlar</span>
              <ArrowUpRight className="w-4 h-4 text-amber-500 shrink-0" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};