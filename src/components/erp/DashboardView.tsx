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
  Sparkles,
  ChevronRight,
  UserCheck,
  CreditCard,
  Building,
} from 'lucide-react';
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
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { crmService } from '../../services/crmService';
import { Lead, GroupScheduleItem, LeadStatus } from '../../types/crm';

interface DashboardViewProps {
  onNavigateTab: (tabId: string) => void;
  onSelectLeadForEdit?: (lead: Lead) => void;
}

const MONTHLY_FINANCE_DATA = [
  { month: 'Apr', revenue: 68000000, expenses: 44000000, profit: 24000000 },
  { month: 'May', revenue: 74500000, expenses: 46000000, profit: 28500000 },
  { month: 'Jun', revenue: 82000000, expenses: 49000000, profit: 33000000 },
  { month: 'Jul', revenue: 89000000, expenses: 52000000, profit: 37000000 },
  { month: 'Aug', revenue: 94000000, expenses: 55000000, profit: 39000000 },
  { month: 'Sep (Current)', revenue: 96400000, expenses: 57700000, profit: 38700000 },
];

const COURSE_POPULARITY = [
  { name: 'IELTS Intensive', value: 45, color: '#f59e0b' },
  { name: 'General English', value: 28, color: '#3b82f6' },
  { name: 'CEFR FastTrack', value: 15, color: '#10b981' },
  { name: 'Python Programming', value: 12, color: '#8b5cf6' },
];

export const DashboardView: React.FC<DashboardViewProps> = ({ onNavigateTab, onSelectLeadForEdit }) => {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [schedule, setSchedule] = useState<GroupScheduleItem[]>([]);

  useEffect(() => {
    setLeads(crmService.getLeads());
    setSchedule(crmService.getSchedule());
  }, []);

  // Calculate Pipeline Funnel numbers
  const countNew = leads.filter((l) => l.status === 'New').length;
  const countContacted = leads.filter((l) => l.status === 'Contacted').length;
  const countTrial = leads.filter((l) => l.status === 'Trial Scheduled').length;
  const countEnrolled = leads.filter((l) => l.status === 'Enrolled').length;
  const countLost = leads.filter((l) => l.status === 'Lost').length;

  const handleStatusChange = (leadId: string, newStatus: LeadStatus) => {
    crmService.updateLeadStatus(leadId, newStatus);
    setLeads(crmService.getLeads());
  };

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            Center Overview & Operations
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Real-time enrollment pipeline, revenue statistics, and student flow.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => onNavigateTab('leads')}
            className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-md shadow-amber-500/20 flex items-center gap-2 transition cursor-pointer"
          >
            <PhoneCall className="w-4 h-4" />
            <span>Manage All Leads ({leads.length})</span>
          </button>
        </div>
      </div>

      {/* 1. Core Business KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {/* Today's New Leads */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 block">
            Today's New Leads
          </span>
          <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white mt-1">
            12
          </div>
          <div className="flex items-center gap-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400 mt-2">
            <ArrowUpRight className="w-3.5 h-3.5" />
            <span>+4 from yesterday</span>
          </div>
        </div>

        {/* Trial Lessons */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 block">
            Today's Trials
          </span>
          <div className="text-2xl sm:text-3xl font-black text-amber-600 dark:text-amber-400 mt-1">
            6
          </div>
          <div className="text-[11px] text-slate-400 mt-2">
            4 in morning, 2 evening
          </div>
        </div>

        {/* Enrolled Students */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 block">
            Active Students
          </span>
          <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white mt-1">
            247
          </div>
          <div className="flex items-center gap-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400 mt-2">
            <span>+3 new enrollments</span>
          </div>
        </div>

        {/* Monthly Revenue */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 block">
            Monthly Revenue
          </span>
          <div className="text-lg sm:text-xl font-black text-slate-900 dark:text-white mt-1">
            96.4M <span className="text-xs font-normal text-slate-400">UZS</span>
          </div>
          <div className="text-[11px] text-emerald-600 dark:text-emerald-400 font-bold mt-2">
            87% collected
          </div>
        </div>

        {/* Monthly Expenses */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 block">
            Monthly Expenses
          </span>
          <div className="text-lg sm:text-xl font-black text-slate-900 dark:text-white mt-1">
            57.7M <span className="text-xs font-normal text-slate-400">UZS</span>
          </div>
          <div className="text-[11px] text-slate-400 mt-2">
            Rent, salaries, ads
          </div>
        </div>

        {/* Net Profit */}
        <div className="p-5 rounded-2xl bg-amber-500/10 border border-amber-500/30 shadow-sm">
          <span className="text-xs font-bold text-amber-700 dark:text-amber-400 block">
            Net Monthly Profit
          </span>
          <div className="text-lg sm:text-xl font-black text-amber-600 dark:text-amber-400 mt-1">
            38.7M <span className="text-xs font-normal text-amber-500/80">UZS</span>
          </div>
          <div className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 mt-2">
            +14% vs August
          </div>
        </div>
      </div>

      {/* 2. Leads Conversion Pipeline Funnel */}
      <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              Leads Conversion Pipeline
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Visual drop-off from initial contact to enrolled student.
            </p>
          </div>
          <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20">
            Overall Conversion: 28.5%
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 sm:gap-4">
          {/* Step 1: New */}
          <div className="p-4 rounded-2xl bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/50">
            <div className="flex items-center justify-between text-xs font-bold text-blue-700 dark:text-blue-400">
              <span>New</span>
              <span className="w-6 h-6 rounded-full bg-blue-500 text-white flex items-center justify-center text-xs">
                {countNew}
              </span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-2">
              Waiting for first call
            </p>
          </div>

          {/* Step 2: Contacted */}
          <div className="p-4 rounded-2xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50">
            <div className="flex items-center justify-between text-xs font-bold text-amber-700 dark:text-amber-400">
              <span>Contacted</span>
              <span className="w-6 h-6 rounded-full bg-amber-500 text-slate-950 flex items-center justify-center text-xs">
                {countContacted}
              </span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-2">
              Discussed course info
            </p>
          </div>

          {/* Step 3: Trial Scheduled */}
          <div className="p-4 rounded-2xl bg-purple-50/70 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-900/50">
            <div className="flex items-center justify-between text-xs font-bold text-purple-700 dark:text-purple-400">
              <span>Trial Scheduled</span>
              <span className="w-6 h-6 rounded-full bg-purple-500 text-white flex items-center justify-center text-xs">
                {countTrial}
              </span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-2">
              Assigned time slot
            </p>
          </div>

          {/* Step 4: Enrolled */}
          <div className="p-4 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/50">
            <div className="flex items-center justify-between text-xs font-bold text-emerald-700 dark:text-emerald-400">
              <span>Enrolled</span>
              <span className="w-6 h-6 rounded-full bg-emerald-500 text-white flex items-center justify-center text-xs font-black">
                {countEnrolled}
              </span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-2">
              Paid tuition fee
            </p>
          </div>

          {/* Step 5: Lost */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
            <div className="flex items-center justify-between text-xs font-bold text-slate-600 dark:text-slate-400">
              <span>Lost</span>
              <span className="w-6 h-6 rounded-full bg-slate-400 dark:bg-slate-600 text-white flex items-center justify-center text-xs">
                {countLost}
              </span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-2">
              Timing or price mismatch
            </p>
          </div>
        </div>
      </div>

      {/* 3. Main Grid: Recent Leads & Today's Schedule */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left: Recent Leads with Immediate Actions */}
        <div className="lg:col-span-7 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-5">
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  Recent Leads
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Newest inquiries from the website modal and Telegram
                </p>
              </div>
              <button
                onClick={() => onNavigateTab('leads')}
                className="text-xs font-bold text-amber-600 dark:text-amber-400 hover:underline flex items-center gap-1 cursor-pointer"
              >
                <span>View all CRM</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="space-y-3">
              {leads.slice(0, 5).map((lead) => (
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
                        <span className="font-bold text-slate-900 dark:text-white text-sm">
                          {lead.name}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                            lead.status === 'New'
                              ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20'
                              : lead.status === 'Contacted'
                              ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
                              : lead.status === 'Trial Scheduled'
                              ? 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20'
                              : lead.status === 'Enrolled'
                              ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                              : 'bg-slate-200 dark:bg-slate-800 text-slate-500'
                          }`}
                        >
                          {lead.status}
                        </span>
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 flex items-center gap-2">
                        <span className="font-medium text-amber-600 dark:text-amber-400">
                          {lead.course}
                        </span>
                        <span>•</span>
                        <span>{lead.phone}</span>
                      </div>
                    </div>
                  </div>

                  {/* Fast Action Buttons */}
                  <div className="flex items-center gap-2 self-end sm:self-center">
                    <a
                      href={`tel:${lead.phone}`}
                      className="p-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:text-emerald-500 transition"
                      title="Call Student"
                    >
                      <Phone className="w-3.5 h-3.5" />
                    </a>
                    <a
                      href={`https://t.me/${lead.phone.replace(/\D/g, '')}`}
                      target="_blank"
                      rel="noreferrer"
                      className="p-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:text-sky-500 transition"
                      title="Open in Telegram"
                    >
                      <Send className="w-3.5 h-3.5" />
                    </a>

                    {/* Quick status dropdown */}
                    <select
                      value={lead.status}
                      onChange={(e) => handleStatusChange(lead.id, e.target.value as LeadStatus)}
                      className="text-xs font-semibold py-1.5 px-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 focus:outline-none cursor-pointer"
                    >
                      <option value="New">New</option>
                      <option value="Contacted">Contacted</option>
                      <option value="Trial Scheduled">Trial</option>
                      <option value="Enrolled">Enrolled</option>
                      <option value="Lost">Lost</option>
                    </select>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <button
            onClick={() => onNavigateTab('leads')}
            className="w-full mt-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs transition cursor-pointer text-center"
          >
            Open Full Leads CRM Table
          </button>
        </div>

        {/* Right: Today's Schedule & Payment Status */}
        <div className="lg:col-span-5 space-y-6">
          {/* Today's Schedule */}
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Today's Schedule
                </h3>
                <p className="text-xs text-slate-500">Live cohorts & free trial classes</p>
              </div>
              <button
                onClick={() => onNavigateTab('schedule')}
                className="text-xs font-bold text-amber-600 dark:text-amber-400 hover:underline cursor-pointer"
              >
                Full Timetable
              </button>
            </div>

            <div className="space-y-2.5">
              {schedule.slice(0, 4).map((item) => (
                <div
                  key={item.id}
                  className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800 flex items-center justify-between text-xs"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-2 h-2 rounded-full ${
                        item.type === 'Trial Lesson' ? 'bg-amber-500 animate-ping' : 'bg-emerald-500'
                      }`}
                    />
                    <div>
                      <span className="font-bold text-slate-900 dark:text-white block">
                        {item.groupName}
                      </span>
                      <span className="text-slate-500 dark:text-slate-400">
                        {item.teacher} • {item.room}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="font-mono font-bold text-slate-800 dark:text-slate-200 block">
                      {item.time}
                    </span>
                    <span className="text-[10px] text-amber-600 dark:text-amber-400 font-semibold">
                      {item.type}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Payment Status Quick Glance */}
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-3">
              Tuition Payment Status
            </h3>
            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/50">
                <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400 block">
                  Paid
                </span>
                <span className="text-xl font-black text-emerald-700 dark:text-emerald-300 mt-0.5 block">
                  184
                </span>
                <span className="text-[10px] text-slate-400">Students</span>
              </div>
              <div className="p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50">
                <span className="text-[11px] font-bold text-amber-700 dark:text-amber-400 block">
                  Due This Week
                </span>
                <span className="text-xl font-black text-amber-700 dark:text-amber-400 mt-0.5 block">
                  49
                </span>
                <span className="text-[10px] text-slate-400">Upcoming</span>
              </div>
              <div className="p-3 rounded-2xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50">
                <span className="text-[11px] font-bold text-red-700 dark:text-red-400 block">
                  Overdue
                </span>
                <span className="text-xl font-black text-red-600 dark:text-red-400 mt-0.5 block">
                  14
                </span>
                <span className="text-[10px] text-slate-400">Needs Reminder</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 4. Financial Charts: Monthly Revenue vs Expenses & Course Popularity */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Monthly Revenue Chart */}
        <div className="lg:col-span-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                Revenue & Profit Growth
              </h3>
              <p className="text-xs text-slate-500">
                Monthly revenue, operating expenses, and net profit in UZS
              </p>
            </div>
            <div className="flex items-center gap-4 text-xs font-semibold">
              <span className="flex items-center gap-1.5 text-amber-500">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500" /> Revenue
              </span>
              <span className="flex items-center gap-1.5 text-emerald-500">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Net Profit
              </span>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={MONTHLY_FINANCE_DATA}>
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
                <Area type="monotone" dataKey="profit" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorProf)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Course Popularity Share */}
        <div className="lg:col-span-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              Course Inquiries Share
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Where new leads are concentrating
            </p>

            <div className="space-y-3">
              {COURSE_POPULARITY.map((c) => (
                <div key={c.name} className="space-y-1">
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-slate-700 dark:text-slate-300">{c.name}</span>
                    <span className="text-slate-900 dark:text-white font-bold">{c.value}%</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${c.value}%`, backgroundColor: c.color }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-500 flex items-center justify-between">
            <span>Highest converting:</span>
            <span className="font-bold text-amber-600 dark:text-amber-400">
              IELTS Intensive (45%)
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
