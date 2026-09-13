import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Wallet,
  GraduationCap,
  UserPlus,
  AlertCircle,
  Users,
  CalendarDays,
  TrendingUp,
  RefreshCw,
  MessageSquare,
  ChevronRight,
  Phone,
  Send,
  ArrowUpRight,
  CreditCard,
  ClipboardList,
  BarChart3,
  Clock,
  MapPin,
  CircleCheck,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { leadsService, studentsService, paymentsService, coursesService, groupsService, murojaatlarService } from '../../services/repository';
import { Lead, GroupScheduleItem, StudentRecord, IncomePaymentRecord, CourseData, MurojaatSummary } from '../../types/crm';
import { formatCurrencyShort, formatCompactCurrency, toSafeNumber, formatDate } from '../../utils/format';
import { normalizeLeadStatus, LEAD_STATUS_LABELS } from '../../utils/leads';
import { useLanguage } from '../../context/LanguageContext';
import {
  normalizePaymentCollection,
  parseRecordDate,
  monthKeyOf,
  isSameDay,
  lastNMonths,
  groupMeetsToday,
  classStartMinutes,
  greetingKey,
} from '../../utils/dashboard';

interface DashboardViewProps {
  onNavigateTab: (tabId: string) => void;
  onSelectLeadForEdit?: (lead: Lead) => void;
}

function leadLabel(status: string): string {
  const normalized = normalizeLeadStatus(status);
  return LEAD_STATUS_LABELS[normalized] || status;
}

function paymentCourse(p: IncomePaymentRecord): string {
  const anyP = p as unknown as Record<string, unknown>;
  const course = (p.courseName || p.course || anyP['cohortGroup'] || '') as string;
  return course || '';
}

function paymentMethod(p: IncomePaymentRecord): string {
  const anyP = p as unknown as Record<string, unknown>;
  return (p.method || anyP['paymentMethod'] || '') as string;
}

/** Display amount, or '—' when the record carries no amount (never invent one). */
function paymentAmountDisplay(p: IncomePaymentRecord): string | null {
  const raw = (p as unknown as Record<string, unknown>)['amount'];
  if (raw === null || raw === undefined || raw === '') return null;
  const num = toSafeNumber(raw);
  if (typeof raw === 'string' && raw.trim() !== '' && num === 0 && !/^0+(\.0+)?$/.test(raw.replace(/[^0-9.]/g, ''))) return null;
  return `${formatCurrencyShort(num)}`;
}

export const DashboardView: React.FC<DashboardViewProps> = ({ onNavigateTab }) => {
  const { language } = useLanguage();
  const t = (uz: string, en: string, ru: string) => (language === 'EN' ? en : language === 'RU' ? ru : uz);

  const [leads, setLeads] = useState<Lead[]>([]);
  const [schedule, setSchedule] = useState<GroupScheduleItem[]>([]);
  const [students, setStudents] = useState<StudentRecord[]>([]);
  const [payments, setPayments] = useState<IncomePaymentRecord[]>([]);
  const [courses, setCourses] = useState<CourseData[]>([]);
  const [murojaat, setMurojaat] = useState<MurojaatSummary>({ total: 0, newCount: 0, unread: 0, telegram: 0, website: 0 });
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async () => {
    try {
      setLoadError(null);
      const [leadsData, scheduleData, studentsData, paymentsData, coursesData, murojaatData] = await Promise.all([
        leadsService.getAllLeads(),
        groupsService.getAllGroups(),
        studentsService.getAllStudents(),
        paymentsService.getAllPayments(),
        coursesService.getAllCourses(),
        murojaatlarService.getSummary(),
      ]);
      setLeads(leadsData);
      setSchedule(scheduleData as unknown as GroupScheduleItem[]);
      setStudents(studentsData as unknown as StudentRecord[]);
      setPayments(paymentsData as unknown as IncomePaymentRecord[]);
      setCourses(coursesData as unknown as CourseData[]);
      setMurojaat(murojaatData);
    } catch (err) {
      console.error('Dashboard data load error:', err);
      setLoadError(t("Ma'lumotlarni yuklashda xatolik yuz berdi.", 'Failed to load data.', 'Ошибка при загрузке данных.'));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [t]);

  useEffect(() => {
    setLoading(true);
    void loadData();
  }, [loadData]);

  const handleRefresh = () => {
    setRefreshing(true);
    void loadData();
  };

  const now = useMemo(() => new Date(), []);
  const currentMonthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

  // ---- Revenue: ONLY collected payments count. Pending/voided never count.
  const revenue = useMemo(() => {
    let monthCollected = 0;
    let monthCollectedCount = 0;
    let todayCollected = 0;
    let pendingSum = 0;
    let pendingCount = 0;
    let voidedCount = 0;
    for (const p of payments) {
      const state = normalizePaymentCollection(p.status);
      if (state === 'voided') {
        voidedCount += 1;
        continue;
      }
      if (state === 'pending') {
        pendingCount += 1;
        pendingSum += toSafeNumber(p.amount);
        continue;
      }
      const d = parseRecordDate(p.date);
      if (!d) continue;
      if (monthKeyOf(d) === currentMonthKey) {
        monthCollected += toSafeNumber(p.amount);
        monthCollectedCount += 1;
      }
      if (isSameDay(d, now)) todayCollected += toSafeNumber(p.amount);
    }
    return { monthCollected, monthCollectedCount, todayCollected, pendingSum, pendingCount, voidedCount };
  }, [payments, currentMonthKey, now]);

  // ---- Real 6-month collected-revenue trend (no fabrication).
  const revenueTrend = useMemo(() => {
    const months = lastNMonths(6, now);
    return months.map((m) => {
      let collected = 0;
      let pending = 0;
      for (const p of payments) {
        const d = parseRecordDate(p.date);
        if (!d || monthKeyOf(d) !== m.key) continue;
        const state = normalizePaymentCollection(p.status);
        if (state === 'collected') collected += toSafeNumber(p.amount);
        else if (state === 'pending') pending += toSafeNumber(p.amount);
      }
      return { month: m.label, collected, pending };
    });
  }, [payments, now]);
  const trendTotal = revenueTrend.reduce((s, r) => s + r.collected, 0);

  // ---- Students & debtors (same definition as StudentsView).
  const studentStats = useMemo(() => {
    const active = students.filter((s) => s.status === 'Active' || s.status === 'Trial' || s.status === 'Paused');
    const debtors = students.filter((s) => toSafeNumber(s.debtAmount) > 0 || s.paymentStatus === 'Overdue');
    const outstanding = debtors.reduce((s, x) => s + toSafeNumber(x.debtAmount), 0);
    const due = students.filter((s) => s.paymentStatus === 'Due' && toSafeNumber(s.debtAmount) <= 0);
    const paid = students.filter((s) => s.paymentStatus === 'Paid').length;
    const dueCount = students.filter((s) => s.paymentStatus === 'Due').length;
    const overdueCount = students.filter((s) => s.paymentStatus === 'Overdue').length;
    return { activeCount: active.length, total: students.length, debtors, outstanding, due, paid, dueCount, overdueCount };
  }, [students]);

  // ---- Leads.
  const leadStats = useMemo(() => {
    const byStatus = (wanted: string) => leads.filter((l) => normalizeLeadStatus(l.status) === wanted);
    const fresh = byStatus('New');
    const todayNew = fresh.filter((l) => {
      const d = parseRecordDate(l.createdAt);
      return d ? isSameDay(d, now) : false;
    }).length;
    const trialsToday = leads.filter((l) => {
      if (!l.trialDateTime) return false;
      const d = parseRecordDate(l.trialDateTime);
      return d ? isSameDay(d, now) : false;
    });
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const overdueFollowUps = leads.filter((l) => {
      const st = normalizeLeadStatus(l.status);
      if (st !== 'New' && st !== 'Contacted') return false;
      if (!l.followUpDate) return false;
      const d = parseRecordDate(l.followUpDate);
      return d ? d < startOfToday : false;
    });
    const conversion = leads.length > 0 ? Math.round((byStatus('Enrolled').length / leads.length) * 100) : 0;
    const recent = [...leads]
      .sort((a, b) => {
        const da = parseRecordDate(a.createdAt)?.getTime() ?? 0;
        const db = parseRecordDate(b.createdAt)?.getTime() ?? 0;
        return db - da;
      })
      .slice(0, 5);
    return { fresh, todayNew, trialsToday, overdueFollowUps, conversion, recent };
  }, [leads, now]);

  // ---- Groups & today's schedule (real timetable data only).
  const groupStats = useMemo(() => {
    const activeGroups = schedule.filter((g) => (g.status || 'Active') === 'Active');
    const todayClasses = activeGroups
      .filter((g) => groupMeetsToday(g.days, now))
      .sort((a, b) => classStartMinutes(a.time) - classStartMinutes(b.time));
    const seatsTaken = activeGroups.reduce((s, g) => s + toSafeNumber(g.studentsCount), 0);
    return { activeCount: activeGroups.length, total: schedule.length, todayClasses, seatsTaken };
  }, [schedule, now]);

  // ---- Recent payments (newest first, real records only).
  const recentPayments = useMemo(
    () =>
      [...payments]
        .sort((a, b) => {
          const da = parseRecordDate(a.date)?.getTime() ?? 0;
          const db = parseRecordDate(b.date)?.getTime() ?? 0;
          return db - da;
        })
        .slice(0, 7),
    [payments]
  );

  // ---- Attention items (only real operational warnings).
  const attention = useMemo(() => {
    const items: { id: string; title: string; detail: string; tab: string; tone: 'red' | 'amber' | 'blue' | 'purple' }[] = [];
    if (studentStats.debtors.length > 0) {
      items.push({
        id: 'debt',
        title: t(`${studentStats.debtors.length} ta qarzdor`, `${studentStats.debtors.length} debtors`, `${studentStats.debtors.length} должников`),
        detail:
          studentStats.outstanding > 0
            ? t(`${formatCurrencyShort(studentStats.outstanding)} so'm to'lov kutilmoqda`, `${formatCurrencyShort(studentStats.outstanding)} UZS outstanding`, `Ожидается ${formatCurrencyShort(studentStats.outstanding)} сум`)
            : t("To'lov holatini tekshiring", 'Check payment status', 'Проверьте статус оплаты'),
        tab: 'payments',
        tone: 'red',
      });
    }
    if (leadStats.fresh.length > 0) {
      items.push({
        id: 'leads',
        title: t(`${leadStats.fresh.length} ta yangi lid`, `${leadStats.fresh.length} new leads`, `${leadStats.fresh.length} новых лидов`),
        detail: t('follow-up kerak', 'need follow-up', 'нужен follow-up'),
        tab: 'leads',
        tone: 'blue',
      });
    }
    if (leadStats.trialsToday.length > 0) {
      items.push({
        id: 'trials',
        title: t(`${leadStats.trialsToday.length} ta sinov darsi — bugun`, `${leadStats.trialsToday.length} trial lessons today`, `${leadStats.trialsToday.length} пробных уроков сегодня`),
        detail: leadStats.trialsToday
          .slice(0, 2)
          .map((l) => l.name)
          .join(', '),
        tab: 'leads',
        tone: 'purple',
      });
    }
    if (leadStats.overdueFollowUps.length > 0) {
      items.push({
        id: 'followup',
        title: t(`${leadStats.overdueFollowUps.length} ta kechikkan follow-up`, `${leadStats.overdueFollowUps.length} overdue follow-ups`, `${leadStats.overdueFollowUps.length} просроченных follow-up`),
        detail: t('Qayta bog‘lanish zarur', 'Need to reach out again', 'Нужно связаться повторно'),
        tab: 'leads',
        tone: 'amber',
      });
    }
    if (revenue.pendingCount > 0) {
      items.push({
        id: 'pending',
        title: t(`${revenue.pendingCount} ta kutilayotgan to'lov`, `${revenue.pendingCount} pending payments`, `${revenue.pendingCount} ожидающих платежей`),
        detail: t(`${formatCurrencyShort(revenue.pendingSum)} so'm tasdiqlanmagan`, `${formatCurrencyShort(revenue.pendingSum)} UZS unconfirmed`, `${formatCurrencyShort(revenue.pendingSum)} сум не подтверждено`),
        tab: 'payments',
        tone: 'amber',
      });
    }
    return items;
  }, [studentStats, leadStats, revenue, t]);

  const greeting = greetingKey(now);
  const greetingText =
    greeting === 'morning'
      ? t('Xayrli tong', 'Good morning', 'Доброе утро')
      : greeting === 'day'
        ? t('Xayrli kun', 'Good afternoon', 'Добрый день')
        : t('Xayrli kech', 'Good evening', 'Добрый вечер');
  const dateText = now.toLocaleDateString(language === 'RU' ? 'ru-RU' : language === 'EN' ? 'en-GB' : 'uz-UZ', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });

  // ---- Loading skeletons (never flash "0" while data is loading).
  if (loading) {
    return (
      <div className="space-y-6" aria-busy="true" aria-label={t('Yuklanmoqda', 'Loading', 'Загрузка')}>
        <div className="h-20 rounded-2xl bg-slate-200/70 dark:bg-slate-800/70 animate-pulse" />
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-28 rounded-2xl bg-slate-200/70 dark:bg-slate-800/70 animate-pulse" />
          ))}
        </div>
        <div className="h-72 rounded-2xl bg-slate-200/70 dark:bg-slate-800/70 animate-pulse" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="h-64 rounded-2xl bg-slate-200/70 dark:bg-slate-800/70 animate-pulse" />
          <div className="h-64 rounded-2xl bg-slate-200/70 dark:bg-slate-800/70 animate-pulse" />
        </div>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-10 text-center shadow-sm">
        <AlertCircle className="w-10 h-10 text-rose-500 mx-auto" />
        <h2 className="mt-3 text-base font-extrabold text-slate-900 dark:text-white">{loadError}</h2>
        <button
          onClick={handleRefresh}
          className="mt-4 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition cursor-pointer"
        >
          {t('Qayta urinish', 'Retry', 'Повторить')}
        </button>
      </div>
    );
  }

  const kpis = [
    {
      id: 'revenue',
      icon: Wallet,
      label: t('Bu oy tushumi', 'Revenue this month', 'Доход за месяц'),
      value: `${formatCompactCurrency(revenue.monthCollected)}`,
      suffix: t("so'm", 'UZS', 'сум'),
      sub: t(`Jami yig'ilgan • ${revenue.monthCollectedCount} ta to'lov`, `Collected • ${revenue.monthCollectedCount} payments`, `Собрано • ${revenue.monthCollectedCount} платежей`),
      tab: 'payments',
      accent: 'text-emerald-600 dark:text-emerald-400 bg-emerald-500/10',
    },
    {
      id: 'students',
      icon: GraduationCap,
      label: t("Faol o'quvchilar", 'Active students', 'Активные ученики'),
      value: `${studentStats.activeCount}`,
      suffix: '',
      sub: t(`${studentStats.total} jami`, `${studentStats.total} total`, `Всего ${studentStats.total}`),
      tab: 'students',
      accent: 'text-blue-600 dark:text-blue-400 bg-blue-500/10',
    },
    {
      id: 'leads',
      icon: UserPlus,
      label: t('Yangi lidlar', 'New leads', 'Новые лиды'),
      value: `${leadStats.fresh.length}`,
      suffix: '',
      sub: t(`Bugun: ${leadStats.todayNew} ta`, `Today: ${leadStats.todayNew}`, `Сегодня: ${leadStats.todayNew}`),
      tab: 'leads',
      accent: 'text-amber-600 dark:text-amber-400 bg-amber-500/10',
    },
    {
      id: 'debtors',
      icon: AlertCircle,
      label: t('Qarzdorlar', 'Debtors', 'Должники'),
      value: `${studentStats.debtors.length}`,
      suffix: '',
      sub:
        studentStats.outstanding > 0
          ? t(`${formatCompactCurrency(studentStats.outstanding)} so'm`, `${formatCompactCurrency(studentStats.outstanding)} UZS`, `${formatCompactCurrency(studentStats.outstanding)} сум`)
          : t('Qarzdorlik yo‘q', 'No outstanding debt', 'Нет задолженности'),
      tab: 'payments',
      accent: 'text-rose-600 dark:text-rose-400 bg-rose-500/10',
    },
    {
      id: 'groups',
      icon: Users,
      label: t('Faol guruhlar', 'Active groups', 'Активные группы'),
      value: `${groupStats.activeCount}`,
      suffix: '',
      sub: t(`${groupStats.seatsTaken} o'quvchi joylashgan`, `${groupStats.seatsTaken} students seated`, `Учатся ${groupStats.seatsTaken}`),
      tab: 'schedule',
      accent: 'text-violet-600 dark:text-violet-400 bg-violet-500/10',
    },
    {
      id: 'today',
      icon: CalendarDays,
      label: t('Bugungi darslar', "Today's classes", 'Занятия сегодня'),
      value: `${groupStats.todayClasses.length}`,
      suffix: '',
      sub:
        groupStats.todayClasses.length > 0
          ? t(`Keyingi: ${groupStats.todayClasses[0].time}`, `Next: ${groupStats.todayClasses[0].time}`, `След.: ${groupStats.todayClasses[0].time}`)
          : t('Rejalashtirilmagan', 'None scheduled', 'Не запланировано'),
      tab: 'schedule',
      accent: 'text-teal-600 dark:text-teal-400 bg-teal-500/10',
    },
  ];

  const quickActions = [
    { id: 'qa-student', icon: UserPlus, label: t("O'quvchi qo'shish", 'Add student', 'Добавить ученика'), tab: 'students' },
    { id: 'qa-lead', icon: Phone, label: t("Lid qo'shish", 'Add lead', 'Добавить лид'), tab: 'leads' },
    { id: 'qa-payment', icon: CreditCard, label: t("To'lov kiritish", 'Record payment', 'Внести оплату'), tab: 'payments' },
    { id: 'qa-group', icon: CalendarDays, label: t('Guruh yaratish', 'Create group', 'Создать группу'), tab: 'schedule' },
    { id: 'qa-trial', icon: ClipboardList, label: t('Sinov darsi', 'Trial lesson', 'Пробный урок'), tab: 'leads' },
    { id: 'qa-reports', icon: BarChart3, label: t('Hisobotlar', 'Reports', 'Отчёты'), tab: 'reports' },
  ];

  const toneStyles: Record<string, string> = {
    red: 'bg-rose-500/10 border-rose-500/25 text-rose-600 dark:text-rose-400',
    amber: 'bg-amber-500/10 border-amber-500/25 text-amber-600 dark:text-amber-400',
    blue: 'bg-blue-500/10 border-blue-500/25 text-blue-600 dark:text-blue-400',
    purple: 'bg-violet-500/10 border-violet-500/25 text-violet-600 dark:text-violet-400',
  };

  return (
    <div className="space-y-5 sm:space-y-6">
      {/* 1 — Compact header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            {greetingText} 👋
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            {dateText} • {t("Markaz faoliyati bo'yicha bugungi umumiy ko'rinish", "Today's overview of the center", 'Сегодняшний обзор центра')}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            aria-label={t('Yangilash', 'Refresh', 'Обновить')}
            className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-500 hover:text-emerald-600 dark:hover:text-emerald-400 transition cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={() => onNavigateTab('murojaatlar')}
            className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-sm flex items-center gap-2 transition cursor-pointer"
          >
            <MessageSquare className="w-4 h-4" />
            <span>
              {t('Murojaatlar', 'Inquiries', 'Обращения')} ({murojaat.total})
            </span>
          </button>
        </div>
      </div>

      {/* 2 — KPI overview */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
        {kpis.map((k) => {
          const Icon = k.icon;
          return (
            <button
              key={k.id}
              onClick={() => onNavigateTab(k.tab)}
              className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm hover:border-emerald-500/40 transition cursor-pointer text-left focus-visible:outline-2 focus-visible:outline-emerald-500"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 leading-tight">{k.label}</span>
                <span className={`p-1.5 rounded-lg shrink-0 ${k.accent}`}>
                  <Icon className="w-4 h-4" />
                </span>
              </div>
              <div className="text-xl font-black text-slate-900 dark:text-white mt-1.5 font-mono truncate">
                {k.value} {k.suffix && <span className="text-[11px] font-bold text-slate-400">{k.suffix}</span>}
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5 truncate">{k.sub}</div>
            </button>
          );
        })}
      </div>

      {/* 3 — Revenue & collection analytics (real payment records only) */}
      <section aria-label={t('Tushum tahlili', 'Revenue analytics', 'Аналитика доходов')} className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm p-5 sm:p-6 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <TrendingUp className="w-4 h-4" />
            </span>
            <h2 className="text-base font-extrabold text-slate-900 dark:text-white">{t('Tushum va yig‘uvchanlik', 'Revenue & collection', 'Доход и сборы')}</h2>
          </div>
          <button
            onClick={() => onNavigateTab('payments')}
            className="text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1 cursor-pointer self-start sm:self-auto"
          >
            <span>{t("Batafsil to'lovlar", 'All payments', 'Все платежи')}</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-800">
            <div className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide">{t('Bugun yig‘ilgan', 'Collected today', 'Собрано сегодня')}</div>
            <div className="text-lg font-black text-slate-900 dark:text-white font-mono mt-1">{formatCurrencyShort(revenue.todayCollected)}</div>
          </div>
          <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
            <div className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wide">{t('Bu oy yig‘ilgan', 'Collected this month', 'Собрано за месяц')}</div>
            <div className="text-lg font-black text-emerald-700 dark:text-emerald-400 font-mono mt-1">{formatCurrencyShort(revenue.monthCollected)}</div>
          </div>
          <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20">
            <div className="text-[11px] font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wide">{t('Kutilayotgan', 'Pending', 'Ожидается')}</div>
            <div className="text-lg font-black text-amber-700 dark:text-amber-400 font-mono mt-1">
              {revenue.pendingCount > 0 ? formatCurrencyShort(revenue.pendingSum) : '—'}
            </div>
          </div>
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-800">
            <div className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide">{t('Bekor qilingan', 'Voided', 'Аннулировано')}</div>
            <div className="text-lg font-black text-slate-500 dark:text-slate-400 font-mono mt-1">{revenue.voidedCount > 0 ? `${revenue.voidedCount} ta` : '—'}</div>
          </div>
        </div>

        {trendTotal > 0 ? (
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={revenueTrend} margin={{ top: 8, right: 8, left: -8, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#64748b" opacity={0.25} />
                <XAxis dataKey="month" stroke="#94a3b8" fontSize={11} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={11} tickFormatter={(v: number) => formatCompactCurrency(v)} tickLine={false} width={56} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', color: '#f8fafc', fontSize: '12px' }}
                  formatter={(value: unknown) => [`${formatCurrencyShort(value)} so'm`, '']}
                />
                <Bar dataKey="collected" name={t('Yig‘ilgan', 'Collected', 'Собрано')} fill="#10b981" radius={[6, 6, 0, 0]} />
                <Bar dataKey="pending" name={t('Kutilayotgan', 'Pending', 'Ожидается')} fill="#f59e0b" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="py-10 text-center">
            <Wallet className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto" />
            <p className="mt-2 text-sm font-bold text-slate-700 dark:text-slate-300">{t('Hozircha grafik uchun ma’lumot yetarli emas', 'Not enough data for a chart yet', 'Пока недостаточно данных для графика')}</p>
            <p className="text-xs text-slate-400 mt-1">{t("To'lovlar kiritilgach, oylik dinamika shu yerda ko'rinadi", 'Monthly dynamics will appear here once payments are recorded', 'Месячная динамика появится после внесения платежей')}</p>
            <button
              onClick={() => onNavigateTab('payments')}
              className="mt-4 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition cursor-pointer"
            >
              {t("To'lov kiritish", 'Record payment', 'Внести оплату')}
            </button>
          </div>
        )}
      </section>

      {/* 4 + 5 — Today's schedule & Attention required */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-5">
        <section aria-label={t('Bugungi darslar', "Today's classes", 'Занятия сегодня')} className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm p-5 sm:p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                <CalendarDays className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                {t('Bugungi darslar', "Today's classes", 'Занятия сегодня')}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {groupStats.todayClasses.length > 0
                  ? t(`${groupStats.todayClasses.length} ta dars rejalashtirilgan`, `${groupStats.todayClasses.length} classes scheduled`, `Запланировано занятий: ${groupStats.todayClasses.length}`)
                  : t('Bugun dars rejalashtirilmagan', 'No classes scheduled today', 'Сегодня занятий нет')}
              </p>
            </div>
            <button onClick={() => onNavigateTab('schedule')} className="text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline cursor-pointer shrink-0">
              {t('Jadval', 'Schedule', 'Расписание')}
            </button>
          </div>
          {groupStats.todayClasses.length > 0 ? (
            <ul className="space-y-2.5">
              {groupStats.todayClasses.slice(0, 6).map((g) => (
                <li key={g.id}>
                  <button
                    onClick={() => onNavigateTab('schedule')}
                    className="w-full p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800 hover:border-emerald-500/40 transition cursor-pointer flex items-center justify-between gap-3 text-left"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="px-2 py-1 rounded-lg bg-emerald-600 text-white text-xs font-black font-mono shrink-0">{g.time.split('-')[0]?.trim() || g.time}</span>
                      <div className="min-w-0">
                        <span className="font-bold text-slate-900 dark:text-white text-sm block truncate">{g.groupName}</span>
                        <span className="text-xs text-slate-500 dark:text-slate-400 block truncate">
                          {g.course && <>{g.course} • </>}{g.teacher}
                          {g.room && (
                            <span className="inline-flex items-center gap-0.5 ml-1">
                              <MapPin className="w-3 h-3" />
                              {g.room}
                            </span>
                          )}
                          {toSafeNumber(g.studentsCount) > 0 && <span> • {toSafeNumber(g.studentsCount)} {t("o'quvchi", 'students', 'уч.')}</span>}
                        </span>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <div className="py-8 text-center">
              <CalendarDays className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto" />
              <p className="mt-2 text-sm font-bold text-slate-600 dark:text-slate-300">{t('Bugun darslar yo‘q', 'No classes today', 'Сегодня занятий нет')}</p>
              <button onClick={() => onNavigateTab('schedule')} className="mt-3 text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline cursor-pointer">
                {t('Dars jadvalini ko‘rish →', 'View timetable →', 'Смотреть расписание →')}
              </button>
            </div>
          )}
        </section>

        <section aria-label={t("Diqqat talab qiladi", 'Needs attention', 'Требует внимания')} className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm p-5 sm:p-6">
          <h2 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2 mb-4">
            <AlertCircle className="w-4 h-4 text-amber-500" />
            {t("Diqqat talab qiladi", 'Needs attention', 'Требует внимания')}
          </h2>
          {attention.length > 0 ? (
            <ul className="space-y-2.5">
              {attention.map((a) => (
                <li key={a.id}>
                  <button
                    onClick={() => onNavigateTab(a.tab)}
                    className={`w-full p-3.5 rounded-xl border transition cursor-pointer flex items-center justify-between gap-3 text-left ${toneStyles[a.tone]}`}
                  >
                    <div className="min-w-0">
                      <span className="font-extrabold text-sm block text-slate-900 dark:text-white">{a.title}</span>
                      <span className="text-xs opacity-80 block truncate">{a.detail}</span>
                    </div>
                    <ChevronRight className="w-4 h-4 shrink-0 opacity-60" />
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <div className="py-8 text-center">
              <CircleCheck className="w-8 h-8 text-emerald-500 mx-auto" />
              <p className="mt-2 text-sm font-bold text-slate-700 dark:text-slate-200">{t('Hammasi joyida 🎉', 'All clear 🎉', 'Всё в порядке 🎉')}</p>
              <p className="text-xs text-slate-400 mt-1">{t('Shoshilinch ishlar yo‘q', 'Nothing urgent right now', 'Срочных дел нет')}</p>
            </div>
          )}
        </section>
      </div>

      {/* 6 + 7 — Recent leads & Recent payments */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-5">
        <section aria-label={t("So'nggi murojaatlar", 'Recent leads', 'Последние лиды')} className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm p-5 sm:p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-extrabold text-slate-900 dark:text-white">{t("So'nggi murojaatlar", 'Recent leads', 'Последние лиды')}</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {t(`Konversiya: ${leadStats.conversion}%`, `Conversion: ${leadStats.conversion}%`, `Конверсия: ${leadStats.conversion}%`)}
              </p>
            </div>
            <button onClick={() => onNavigateTab('leads')} className="text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline cursor-pointer shrink-0">
              {t('Barchasi →', 'View all →', 'Все →')}
            </button>
          </div>
          {leadStats.recent.length > 0 ? (
            <ul className="space-y-2.5">
              {leadStats.recent.map((lead) => (
                <li key={lead.id} className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold text-sm shrink-0">
                      {(lead.name || '?').charAt(0).toUpperCase()}
                    </span>
                    <div className="min-w-0">
                      <span className="font-bold text-slate-900 dark:text-white text-sm block truncate">{lead.name}</span>
                      <span className="text-xs text-slate-500 dark:text-slate-400 block truncate">
                        {lead.phone} • {lead.course || '—'}
                      </span>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 block w-fit ml-auto">
                      {leadLabel(lead.status)}
                    </span>
                    <span className="text-[11px] text-slate-400 block mt-1">{formatDate(lead.createdAt)}</span>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <div className="py-8 text-center">
              <UserPlus className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto" />
              <p className="mt-2 text-sm font-bold text-slate-600 dark:text-slate-300">{t("Hozircha murojaatlar yo'q", 'No leads yet', 'Пока нет обращений')}</p>
              <button onClick={() => onNavigateTab('leads')} className="mt-3 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition cursor-pointer">
                {t("Lid qo'shish", 'Add lead', 'Добавить лид')}
              </button>
            </div>
          )}
          {leadStats.recent.length > 0 && (
            <button
              onClick={() => onNavigateTab('leads')}
              className="w-full mt-3 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs transition cursor-pointer"
            >
              {t('Barcha murojaatlarni ko‘rish →', 'View all inquiries →', 'Смотреть все обращения →')}
            </button>
          )}
        </section>

        <section aria-label={t("So'nggi to'lovlar", 'Recent payments', 'Последние платежи')} className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm p-5 sm:p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-extrabold text-slate-900 dark:text-white">{t("So'nggi to'lovlar", 'Recent payments', 'Последние платежи')}</h2>
            <button onClick={() => onNavigateTab('payments')} className="text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline cursor-pointer shrink-0">
              {t('Barchasi →', 'View all →', 'Все →')}
            </button>
          </div>
          {recentPayments.length > 0 ? (
            <>
              {/* Desktop table */}
              <div className="hidden md:block overflow-x-auto -mx-1 px-1">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 font-bold uppercase tracking-wider">
                      <th scope="col" className="pb-2 pr-2">{t('O‘quvchi', 'Student', 'Ученик')}</th>
                      <th scope="col" className="pb-2 pr-2">{t('Summa', 'Amount', 'Сумма')}</th>
                      <th scope="col" className="pb-2 pr-2">{t('Usul', 'Method', 'Способ')}</th>
                      <th scope="col" className="pb-2 pr-2">{t('Holat', 'Status', 'Статус')}</th>
                      <th scope="col" className="pb-2 text-right">{t('Sana', 'Date', 'Дата')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {recentPayments.map((p) => {
                      const state = normalizePaymentCollection(p.status);
                      const amount = paymentAmountDisplay(p);
                      return (
                        <tr key={p.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition">
                          <td className="py-2.5 pr-2 font-bold text-slate-900 dark:text-white">
                            {p.studentName || t("Noma'lum", 'Unknown', 'Неизвестно')}
                            {paymentCourse(p) && <span className="block font-normal text-slate-400 text-[11px] truncate max-w-32">{paymentCourse(p)}</span>}
                          </td>
                          <td className="py-2.5 pr-2 font-mono font-extrabold text-slate-900 dark:text-white whitespace-nowrap">
                            {amount ? `${amount} ${t("so'm", 'UZS', 'сум')}` : '—'}
                          </td>
                          <td className="py-2.5 pr-2 text-slate-500 dark:text-slate-400">{paymentMethod(p) || '—'}</td>
                          <td className="py-2.5 pr-2">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold border ${
                                state === 'collected'
                                  ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                                  : state === 'pending'
                                    ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20'
                                    : 'bg-slate-200 dark:bg-slate-800 text-slate-500 border-slate-300 dark:border-slate-700'
                              }`}
                            >
                              {state === 'collected' ? t("To'langan", 'Paid', 'Оплачено') : state === 'pending' ? t('Kutilmoqda', 'Pending', 'Ожидается') : t('Bekor qilingan', 'Voided', 'Аннулировано')}
                            </span>
                          </td>
                          <td className="py-2.5 text-right font-mono text-slate-400 text-[11px] whitespace-nowrap">{formatDate(p.date)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              {/* Mobile cards */}
              <ul className="md:hidden space-y-2.5">
                {recentPayments.map((p) => {
                  const state = normalizePaymentCollection(p.status);
                  const amount = paymentAmountDisplay(p);
                  return (
                    <li key={p.id} className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-bold text-slate-900 dark:text-white text-sm truncate">{p.studentName || t("Noma'lum", 'Unknown', 'Неизвестно')}</span>
                        <span className="font-mono font-extrabold text-slate-900 dark:text-white text-sm whitespace-nowrap">
                          {amount ? `${amount}` : '—'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between gap-2 mt-1.5">
                        <span className="text-[11px] text-slate-400 truncate">
                          {paymentCourse(p) || '—'} • {paymentMethod(p) || '—'} • {formatDate(p.date)}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold border shrink-0 ${
                            state === 'collected'
                              ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                              : state === 'pending'
                                ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20'
                                : 'bg-slate-200 dark:bg-slate-800 text-slate-500 border-slate-300 dark:border-slate-700'
                          }`}
                        >
                          {state === 'collected' ? t("To'langan", 'Paid', 'Оплачено') : state === 'pending' ? t('Kutilmoqda', 'Pending', 'Ожидается') : t('Bekor qilingan', 'Voided', 'Аннулировано')}
                        </span>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </>
          ) : (
            <div className="py-8 text-center">
              <CreditCard className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto" />
              <p className="mt-2 text-sm font-bold text-slate-600 dark:text-slate-300">{t("Hozircha to'lovlar yo'q", 'No payments yet', 'Пока нет платежей')}</p>
              <button onClick={() => onNavigateTab('payments')} className="mt-3 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition cursor-pointer">
                {t("To'lov kiritish", 'Record payment', 'Внести оплату')}
              </button>
            </div>
          )}
        </section>
      </div>

      {/* Ops strip: courses + payment glance */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <h3 className="text-xs font-extrabold text-slate-700 dark:text-slate-300 mb-3 flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5 text-emerald-500" />
            {t("Kurslar bo'yicha o'quvchilar", 'Students by course', 'Ученики по курсам')}
          </h3>
          {courses.filter((c) => students.filter((s) => s.course === c.title).length > 0).length > 0 ? (
            <ul className="space-y-2.5">
              {courses.map((c) => {
                const count = students.filter((s) => s.course === c.title).length;
                if (count === 0) return null;
                return (
                  <li key={c.id} className="flex items-center justify-between gap-2 text-xs">
                    <span className="font-semibold text-slate-700 dark:text-slate-300 truncate">{c.shortTitle || c.title}</span>
                    <span className="font-bold text-slate-900 dark:text-white shrink-0">{count} {t('ta', '', '')}</span>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="py-3 text-center text-xs text-slate-400">{t("Hozircha kurslarga o'quvchilar biriktirilmagan", 'No students assigned to courses yet', 'Ученики пока не распределены по курсам')}</p>
          )}
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <h3 className="text-xs font-extrabold text-slate-700 dark:text-slate-300 mb-3 flex items-center gap-1.5">
            <Wallet className="w-3.5 h-3.5 text-amber-500" />
            {t("To'lov holati", 'Payment status', 'Статус оплаты')}
          </h3>
          <div className="grid grid-cols-3 gap-2.5 text-center">
            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
              <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400 block">{t("To'lagan", 'Paid', 'Оплатили')}</span>
              <span className="text-xl font-black text-emerald-700 dark:text-emerald-300 block mt-0.5">{studentStats.paid}</span>
            </div>
            <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20">
              <span className="text-[11px] font-bold text-amber-700 dark:text-amber-400 block">{t('Kutilmoqda', 'Due', 'Ожидается')}</span>
              <span className="text-xl font-black text-amber-700 dark:text-amber-400 block mt-0.5">{studentStats.dueCount}</span>
            </div>
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20">
              <span className="text-[11px] font-bold text-rose-700 dark:text-rose-400 block">{t('Qarzdor', 'Overdue', 'Должники')}</span>
              <span className="text-xl font-black text-rose-600 dark:text-rose-400 block mt-0.5">{studentStats.overdueCount}</span>
            </div>
          </div>
          {studentStats.debtors.length > 0 && (
            <button
              onClick={() => onNavigateTab('payments')}
              className="w-full mt-3 py-2.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/25 text-rose-600 dark:text-rose-400 font-bold text-xs transition cursor-pointer flex items-center justify-center gap-1.5"
            >
              <Clock className="w-3.5 h-3.5" />
              {t(`${studentStats.debtors.length} ta qarzdorlikni ko‘rish`, `Review ${studentStats.debtors.length} debtors`, `Проверить ${studentStats.debtors.length} должников`)}
            </button>
          )}
        </div>
      </div>

      {/* 8 — Quick actions (only real destinations) */}
      <section aria-label={t('Tezkor amallar', 'Quick actions', 'Быстрые действия')} className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm p-5 sm:p-6">
        <h2 className="text-base font-extrabold text-slate-900 dark:text-white mb-4">{t('Tezkor amallar', 'Quick actions', 'Быстрые действия')}</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
          {quickActions.map((a) => {
            const Icon = a.icon;
            return (
              <button
                key={a.id}
                onClick={() => onNavigateTab(a.tab)}
                className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 hover:border-emerald-500/50 hover:bg-emerald-500/5 transition cursor-pointer flex flex-col items-center gap-2 text-center focus-visible:outline-2 focus-visible:outline-emerald-500"
              >
                <span className="p-2 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                  <Icon className="w-4 h-4" />
                </span>
                <span className="text-[11px] font-bold text-slate-700 dark:text-slate-200 leading-tight">{a.label}</span>
              </button>
            );
          })}
        </div>
      </section>

      {/* Follow-up worklist (compact, real data) */}
      {leadStats.fresh.length + leadStats.overdueFollowUps.length > 0 && (
        <section aria-label={t('Kuzatuv ro‘yxati', 'Follow-up list', 'Список follow-up')} className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm p-5 sm:p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-extrabold text-slate-900 dark:text-white">{t('Kuzatuv talab qiladi', 'Needs follow-up', 'Требует follow-up')}</h2>
            <button onClick={() => onNavigateTab('leads')} className="text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1 cursor-pointer">
              <span>{t('CRM ni ochish', 'Open CRM', 'Открыть CRM')}</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>
          <ul className="space-y-2.5">
            {[...leadStats.overdueFollowUps.slice(0, 2), ...leadStats.fresh.filter((l) => !leadStats.overdueFollowUps.includes(l)).slice(0, 3)].map((lead) => (
              <li key={lead.id} className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <span className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold text-sm shrink-0">
                    {(lead.name || '?').charAt(0).toUpperCase()}
                  </span>
                  <div className="min-w-0">
                    <span className="font-bold text-slate-900 dark:text-white text-sm block truncate">{lead.name}</span>
                    <span className="text-xs text-slate-500 dark:text-slate-400 block truncate">
                      {lead.course || '—'} • {lead.phone}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                  <a
                    href={`tel:${lead.phone}`}
                    aria-label={t('Qong‘iroq qilish', 'Call', 'Позвонить')}
                    className="p-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:text-emerald-600 transition"
                  >
                    <Phone className="w-3.5 h-3.5" />
                  </a>
                  {lead.telegramUsername && (
                    <a
                      href={`https://t.me/${lead.telegramUsername.replace(/^@/, '')}`}
                      target="_blank"
                      rel="noreferrer"
                      aria-label="Telegram"
                      className="p-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:text-sky-500 transition"
                    >
                      <Send className="w-3.5 h-3.5" />
                    </a>
                  )}
                  <button
                    onClick={() => onNavigateTab('leads')}
                    className="px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-bold transition cursor-pointer"
                  >
                    {t('CRM da ochish', 'Open in CRM', 'Открыть в CRM')}
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
};
