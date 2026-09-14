import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  PhoneCall,
  CalendarClock,
  UserPlus,
  AlertCircle,
  Wallet,
  ChevronRight,
  Phone,
  Send,
  ArrowUpRight,
  CreditCard,
  ClipboardList,
  Users,
  BookOpen,
  Search,
  RefreshCw,
  CircleCheck,
} from 'lucide-react';
import { leadsService, studentsService, coursesService, groupsService } from '../../services/repository';
import { Lead, StudentRecord, CourseData, GroupScheduleItem } from '../../types/crm';
import { normalizeLeadStatus, LEAD_STATUS_LABELS } from '../../utils/leads';
import { formatDate, toSafeNumber, getStudentName } from '../../utils/format';
import { parseRecordDate, isSameDay } from '../../utils/dashboard';
import { useLanguage } from '../../context/LanguageContext';

interface Props {
  onNavigateTab: (tabId: string) => void;
}

function leadLabel(status: string): string {
  const normalized = normalizeLeadStatus(status);
  return LEAD_STATUS_LABELS[normalized] || status;
}

/**
 * Receptionist operational dashboard — front-desk workflow only:
 * inquiry → contact → trial → enrollment → payment → follow-up.
 * No organization finance (revenue/expenses/profit) is shown here by design.
 */
export const ReceptionistDashboard: React.FC<Props> = ({ onNavigateTab }) => {
  const { language, counter } = useLanguage();
  // See DashboardView: keep the load effect keyed on `language`, not on the
  // per-render `t` closure, to avoid an endless refetch loop.
  const t = (uz: string, en: string, ru: string) => (language === 'EN' ? en : language === 'RU' ? ru : uz);
  const tRef = React.useRef(t);
  tRef.current = t;

  const [leads, setLeads] = useState<Lead[]>([]);
  const [students, setStudents] = useState<StudentRecord[]>([]);
  const [courses, setCourses] = useState<CourseData[]>([]);
  const [groups, setGroups] = useState<GroupScheduleItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [studentQuery, setStudentQuery] = useState('');

  const loadData = useCallback(async () => {
    try {
      setLoadError(null);
      const [leadsData, studentsData, coursesData, groupsData] = await Promise.all([
        leadsService.getAllLeads(),
        studentsService.getAllStudents(),
        coursesService.getAllCourses(),
        groupsService.getAllGroups(),
      ]);
      setLeads(leadsData);
      setStudents(studentsData as unknown as StudentRecord[]);
      setCourses(coursesData as unknown as CourseData[]);
      setGroups(groupsData as unknown as GroupScheduleItem[]);
    } catch (err) {
      console.error('Receptionist dashboard load error:', err);
      setLoadError(tRef.current("Ma'lumotlarni yuklashda xatolik yuz berdi.", 'Failed to load data.', 'Ошибка при загрузке данных.'));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [language]);

  useEffect(() => {
    setLoading(true);
    void loadData();
  }, [loadData]);

  const handleRefresh = () => {
    setRefreshing(true);
    void loadData();
  };

  const now = useMemo(() => new Date(), []);

  const stats = useMemo(() => {
    const byStatus = (wanted: string) => leads.filter((l) => normalizeLeadStatus(l.status) === wanted);
    const fresh = byStatus('New');
    const todayNew = leads.filter((l) => {
      const d = parseRecordDate(l.createdAt);
      return d ? isSameDay(d, now) : false;
    });
    const trialsToday = leads.filter((l) => {
      if (!l.trialDateTime) return false;
      const d = parseRecordDate(l.trialDateTime);
      return d ? isSameDay(d, now) : false;
    });
    const attendedToday = trialsToday.filter((l) => l.trialAttended === true);
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const followUps = leads.filter((l) => {
      const st = normalizeLeadStatus(l.status);
      return st === 'New' || st === 'Contacted' || st === 'Trial Scheduled' || st === 'Trial Completed';
    });
    const overdueFollowUps = leads.filter((l) => {
      const st = normalizeLeadStatus(l.status);
      if (st !== 'New' && st !== 'Contacted') return false;
      if (!l.followUpDate) return false;
      const d = parseRecordDate(l.followUpDate);
      return d ? d < startOfToday : false;
    });
    const enrolledToday = leads.filter((l) => {
      if (normalizeLeadStatus(l.status) !== 'Enrolled') return false;
      const d = parseRecordDate(l.conversionDate) || parseRecordDate(l.updatedAt);
      return d ? isSameDay(d, now) : false;
    });
    const dues = students.filter((s) => s.paymentStatus === 'Due' || s.paymentStatus === 'Overdue');
    return { fresh, todayNew, trialsToday, attendedToday, followUps, overdueFollowUps, enrolledToday, dues, byStatus };
  }, [leads, students, now]);

  const studentMatches = useMemo(() => {
    const q = studentQuery.trim().toLowerCase();
    if (q.length < 2) return [];
    return students
      .filter((s) => {
        const hay = `${getStudentName(s)} ${s.phone || ''} ${s.course || ''} ${s.groupName || ''}`.toLowerCase();
        return q.split(/\s+/).every((tok) => hay.includes(tok));
      })
      .slice(0, 6);
  }, [students, studentQuery]);

  const go = (tab: string) => onNavigateTab(tab);

  const openLeadInCrm = (leadId: string) => {
    go('leads');
    setTimeout(() => window.dispatchEvent(new CustomEvent('centerflow-open-record', { detail: { kind: 'lead', id: leadId } })), 150);
  };

  const openStudentProfile = (studentId: string) => {
    go('students');
    setTimeout(() => window.dispatchEvent(new CustomEvent('centerflow-open-record', { detail: { kind: 'student', id: studentId } })), 150);
  };

  const quickAdd = (form: 'lead' | 'student') => {
    go(form === 'lead' ? 'leads' : 'students');
    setTimeout(() => window.dispatchEvent(new CustomEvent('centerflow-quick-add', { detail: { form } })), 150);
  };

  const dateText = now.toLocaleDateString(language === 'RU' ? 'ru-RU' : language === 'EN' ? 'en-GB' : 'uz-UZ', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });

  if (loading) {
    return (
      <div className="space-y-5" aria-busy="true" aria-label={t('Yuklanmoqda', 'Loading', 'Загрузка')}>
        <div className="h-16 rounded-2xl bg-slate-200/70 dark:bg-slate-800/70 animate-pulse" />
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-28 rounded-2xl bg-slate-200/70 dark:bg-slate-800/70 animate-pulse" />
          ))}
        </div>
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
      id: 'new', icon: PhoneCall, label: t('Yangi murojaatlar', 'New inquiries', 'Новые обращения'),
      value: `${stats.fresh.length}`, sub: `${t('Bugun', 'Today', 'Сегодня')}: ${counter(stats.todayNew.length, 'lead')}`,
      tab: 'leads', accent: 'text-blue-600 dark:text-blue-400 bg-blue-500/10',
    },
    {
      id: 'trials', icon: CalendarClock, label: t('Bugungi sinov darslari', "Today's trials", 'Пробные сегодня'),
      value: `${stats.trialsToday.length}`, sub: `${t('Qatnashdi', 'Attended', 'Посетили')}: ${counter(stats.attendedToday.length, 'student')}`,
      tab: 'leads', accent: 'text-violet-600 dark:text-violet-400 bg-violet-500/10',
    },
    {
      id: 'follow', icon: AlertCircle, label: t('Qayta bog‘lanish kerak', 'Follow-up needed', 'Нужен follow-up'),
      value: `${stats.followUps.length}`, sub: `${t('Muddati o‘tgan', 'Overdue', 'Просрочено')}: ${counter(stats.overdueFollowUps.length, 'lead')}`,
      tab: 'leads', accent: 'text-amber-600 dark:text-amber-400 bg-amber-500/10',
    },
    {
      id: 'enrolled', icon: UserPlus, label: t('Bugun qabul qilingan', 'Enrolled today', 'Стали учениками'),
      value: `${stats.enrolledToday.length}`, sub: t("Konversiya natijasi", 'Conversion result', 'Результат конверсии'),
      tab: 'students', accent: 'text-emerald-600 dark:text-emerald-400 bg-emerald-500/10',
    },
    {
      id: 'dues', icon: Wallet, label: t('Kutilayotgan to‘lovlar', 'Pending payments', 'Ожидающие платежи'),
      value: `${stats.dues.length}`, sub: t('Eslatma yuborish kerak', 'For reminders', 'Для напоминаний'),
      tab: 'payments', accent: 'text-rose-600 dark:text-rose-400 bg-rose-500/10',
    },
  ];

  const quickActions = [
    { id: 'qa-lead', icon: PhoneCall, label: t('Yangi murojaat', 'New inquiry', 'Новое обращение'), action: () => quickAdd('lead') },
    { id: 'qa-student', icon: UserPlus, label: t('O‘quvchi qo‘shish', 'Add student', 'Добавить ученика'), action: () => quickAdd('student') },
    { id: 'qa-trial', icon: ClipboardList, label: t('Sinov darsi belgilash', 'Schedule trial', 'Назначить пробный'), action: () => go('leads') },
    { id: 'qa-payment', icon: CreditCard, label: t('To‘lovlar', 'Payments', 'Платежи'), sub: t('Qarzdorlikni ko‘rish', 'View dues', 'Смотреть долги'), action: () => go('payments') },
    { id: 'qa-group', icon: Users, label: t('Guruhga biriktirish', 'Assign to group', 'В группу'), action: () => go('students') },
    { id: 'qa-courses', icon: BookOpen, label: t('Kurslar', 'Courses', 'Курсы'), action: () => go('courses') },
  ];

  const pipeline: Array<{ key: string; label: string; count: number; tone: string }> = [
    { key: 'New', label: t('Yangi', 'New', 'Новые'), count: stats.byStatus('New').length, tone: 'bg-blue-500/10 border-blue-500/25 text-blue-700 dark:text-blue-400' },
    { key: 'Contacted', label: t('Bog‘lanildi', 'Contacted', 'Связались'), count: stats.byStatus('Contacted').length, tone: 'bg-amber-500/10 border-amber-500/25 text-amber-700 dark:text-amber-400' },
    { key: 'Trial Scheduled', label: t('Sinov darsi', 'Trial', 'Пробный'), count: stats.byStatus('Trial Scheduled').length, tone: 'bg-violet-500/10 border-violet-500/25 text-violet-700 dark:text-violet-400' },
    { key: 'Trial Completed', label: t('Qatnashdi', 'Attended', 'Посетили'), count: stats.byStatus('Trial Completed').length, tone: 'bg-teal-500/10 border-teal-500/25 text-teal-700 dark:text-teal-400' },
    { key: 'Enrolled', label: t('O‘quvchi', 'Enrolled', 'Ученики'), count: stats.byStatus('Enrolled').length, tone: 'bg-emerald-500/10 border-emerald-500/25 text-emerald-700 dark:text-emerald-400' },
    { key: 'Lost', label: t('Yo‘qotilgan', 'Lost', 'Потеряны'), count: stats.byStatus('Lost').length, tone: 'bg-slate-500/10 border-slate-500/25 text-slate-500' },
  ];

  const priorityTone: Record<string, string> = {
    shoshilinch: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/25',
    muhim: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/25',
    oddiy: 'bg-slate-500/10 text-slate-500 border-slate-500/20',
  };

  const paymentTone = (s: StudentRecord['paymentStatus']) =>
    s === 'Paid'
      ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
      : s === 'Due'
        ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20'
        : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20';

  return (
    <div className="space-y-5 sm:space-y-6">
      {/* Compact greeting */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            {t('Xush kelibsiz, Qabulxona', 'Welcome, Front desk', 'Добро пожаловать, Ресепшн')}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5 capitalize">
            {dateText} • {t('Bugungi qabulxona holati', 'Daily front-desk status', 'Дневной статус ресепшн')}
          </p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          aria-label={t('Yangilash', 'Refresh', 'Обновить')}
          className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-500 hover:text-emerald-600 transition cursor-pointer disabled:opacity-50 self-start sm:self-auto"
        >
          <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Operational KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
        {kpis.map((k) => {
          const Icon = k.icon;
          return (
            <button
              key={k.id}
              onClick={() => go(k.tab)}
              className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm hover:border-emerald-500/40 transition cursor-pointer text-left focus-visible:outline-2 focus-visible:outline-emerald-500"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 leading-tight">{k.label}</span>
                <span className={`p-1.5 rounded-lg shrink-0 ${k.accent}`}>
                  <Icon className="w-4 h-4" />
                </span>
              </div>
              <div className="text-2xl font-black text-slate-900 dark:text-white mt-1.5">{k.value}</div>
              <div className="text-[11px] text-slate-400 mt-0.5 truncate">{k.sub}</div>
            </button>
          );
        })}
      </div>

      {/* Quick actions */}
      <section aria-label={t('Tezkor amallar', 'Quick actions', 'Быстрые действия')} className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm p-4 sm:p-5">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
          {quickActions.map((a) => {
            const Icon = a.icon;
            return (
              <button
                key={a.id}
                onClick={a.action}
                className="p-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white transition cursor-pointer flex flex-col items-center gap-2 text-center focus-visible:outline-2 focus-visible:outline-emerald-300"
              >
                <Icon className="w-5 h-5" />
                <span className="text-[11px] font-bold leading-tight">{a.label}</span>
                {'sub' in a && a.sub ? <span className="text-[10px] opacity-80 leading-tight">{a.sub}</span> : null}
              </button>
            );
          })}
        </div>
      </section>

      {/* Lead pipeline */}
      <section aria-label={t('Lidlar bosqichlari', 'Lead pipeline', 'Воронка лидов')} className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm p-4 sm:p-5">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-extrabold text-slate-900 dark:text-white">{t('Lidlar bosqichlari', 'Lead pipeline', 'Воронка лидов')}</h2>
          <button onClick={() => go('leads')} className="text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline cursor-pointer">
            CRM →
          </button>
        </div>
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
          {pipeline.map((p) => (
            <button
              key={p.key}
              onClick={() => go('leads')}
              className={`p-3 rounded-xl border text-center transition hover:brightness-95 cursor-pointer ${p.tone}`}
            >
              <span className="text-xl font-black block">{p.count}</span>
              <span className="text-[10px] font-bold block mt-0.5">{p.label}</span>
            </button>
          ))}
        </div>
      </section>

      {/* Follow-up queue + today's trials */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-5">
        <section aria-label={t("Bugun kimlar bilan bog'lanish kerak", 'Who to contact today', 'С кем связаться сегодня')} className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-extrabold text-slate-900 dark:text-white">{t("Bugun kimlar bilan bog'lanish kerak", 'Who to contact today', 'С кем связаться сегодня')}</h2>
            <button onClick={() => go('leads')} className="text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline cursor-pointer shrink-0">
              CRM →
            </button>
          </div>
          {stats.followUps.length > 0 ? (
            <ul className="space-y-2.5">
              {[...stats.overdueFollowUps, ...stats.followUps.filter((l) => !stats.overdueFollowUps.includes(l))].slice(0, 6).map((l) => (
                <li key={l.id} className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800">
                  <div className="flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <span className="text-sm font-bold text-slate-900 dark:text-white block truncate">{l.name}</span>
                      <span className="text-[11px] text-slate-500 dark:text-slate-400 block truncate">
                        {l.course || '—'} • {l.phone}
                      </span>
                    </div>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold border shrink-0 ${l.priority && priorityTone[l.priority] ? priorityTone[l.priority] : 'bg-slate-500/10 text-slate-500 border-slate-500/20'}`}>
                      {leadLabel(l.status)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-2 mt-2">
                    <span className="text-[11px] text-slate-400 truncate">
                      {l.followUpDate ? `${t('Qayta bog‘lanish:', 'Follow-up:', 'Follow-up:')} ${formatDate(l.followUpDate)}` : t('Qayta bog‘lanish sanasi yo‘q', 'No follow-up date', 'Дата не назначена')}
                      {l.lastContactedAt ? ` • ${t('oxirgi:', 'last:', 'посл.:')} ${formatDate(l.lastContactedAt)}` : ''}
                    </span>
                    <span className="flex items-center gap-1.5 shrink-0">
                      <a
                        href={`tel:${l.phone}`}
                        aria-label={t("Qo'ng'iroq qilish", 'Call', 'Позвонить')}
                        className="p-2 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20 transition"
                      >
                        <Phone className="w-3.5 h-3.5" />
                      </a>
                      <button
                        onClick={() => openLeadInCrm(l.id)}
                        className="px-2.5 py-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[11px] font-bold text-slate-700 dark:text-slate-200 hover:border-emerald-500/40 transition cursor-pointer"
                      >
                        {t('Ko‘rish', 'Open', 'Открыть')}
                      </button>
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <div className="py-8 text-center">
              <CircleCheck className="w-8 h-8 text-emerald-500 mx-auto" />
              <p className="mt-2 text-sm font-bold text-slate-600 dark:text-slate-300">{t('Qayta bog‘lanish kutilayotgan murojaat yo‘q', 'No pending follow-ups', 'Нет ожидающих follow-up')}</p>
            </div>
          )}
        </section>

        <section aria-label={t('Bugungi sinov darslari', "Today's trials", 'Пробные сегодня')} className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-extrabold text-slate-900 dark:text-white">{t('Bugungi sinov darslari', "Today's trials", 'Пробные сегодня')}</h2>
            <button onClick={() => go('leads')} className="text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline cursor-pointer shrink-0">
              CRM →
            </button>
          </div>
          {stats.trialsToday.length > 0 ? (
            <ul className="space-y-2.5">
              {stats.trialsToday.slice(0, 6).map((l) => {
                const trialTime = parseRecordDate(l.trialDateTime);
                return (
                  <li key={l.id} className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800">
                    <div className="flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <span className="text-sm font-bold text-slate-900 dark:text-white block truncate">{l.name}</span>
                        <span className="text-[11px] text-slate-500 dark:text-slate-400 block truncate">
                          {l.course || '—'}
                          {l.trialTeacher ? ` • ${l.trialTeacher}` : ''}
                          {l.trialRoom ? ` • ${l.trialRoom}` : ''}
                        </span>
                      </div>
                      <span className="text-right shrink-0">
                        <span className="font-mono font-black text-sm text-slate-900 dark:text-white block">
                          {trialTime ? trialTime.toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' }) : '—'}
                        </span>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold border ${l.trialAttended ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20' : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20'}`}>
                          {l.trialAttended ? t('Qatnashdi', 'Attended', 'Пришёл') : t('Kutilmoqda', 'Expected', 'Ожидается')}
                        </span>
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 mt-2">
                      <a
                        href={`tel:${l.phone}`}
                        aria-label={t("Qo'ng'iroq qilish", 'Call', 'Позвонить')}
                        className="p-2 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20 transition"
                      >
                        <Phone className="w-3.5 h-3.5" />
                      </a>
                      {l.telegramUsername && (
                        <a
                          href={`https://t.me/${l.telegramUsername.replace(/^@/, '')}`}
                          target="_blank"
                          rel="noreferrer"
                          aria-label="Telegram"
                          className="p-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:text-sky-500 transition"
                        >
                          <Send className="w-3.5 h-3.5" />
                        </a>
                      )}
                      <button
                        onClick={() => openLeadInCrm(l.id)}
                        className="px-2.5 py-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[11px] font-bold text-slate-700 dark:text-slate-200 hover:border-emerald-500/40 transition cursor-pointer"
                      >
                        {t('Ko‘rish', 'Open', 'Открыть')}
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          ) : (
            <div className="py-8 text-center">
              <CalendarClock className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto" />
              <p className="mt-2 text-sm font-bold text-slate-600 dark:text-slate-300">{t('Bugunga belgilangan sinov darsi yo‘q', 'No trials scheduled today', 'На сегодня пробных нет')}</p>
              <button onClick={() => go('leads')} className="mt-3 text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline cursor-pointer">
                {t('Sinov darsi belgilash →', 'Schedule a trial →', 'Назначить пробный →')}
              </button>
            </div>
          )}
        </section>
      </div>

      {/* Student lookup + courses lookup */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-5">
        <section aria-label={t('O‘quvchi qidirish', 'Find a student', 'Найти ученика')} className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm p-5">
          <h2 className="text-base font-extrabold text-slate-900 dark:text-white mb-3">{t('O‘quvchi qidirish', 'Find a student', 'Найти ученика')}</h2>
          <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
            <Search className="w-4 h-4 text-slate-400 shrink-0" />
            <input
              value={studentQuery}
              onChange={(e) => setStudentQuery(e.target.value)}
              placeholder={t('F.I.SH, telefon, kurs yoki guruh...', 'Name, phone, course or group...', 'ФИО, телефон, курс или группа...')}
              className="flex-1 bg-transparent text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none min-w-0"
            />
          </div>
          {studentQuery.trim().length >= 2 ? (
            studentMatches.length > 0 ? (
              <ul className="space-y-2 mt-3">
                {studentMatches.map((s) => (
                  <li key={s.id} className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800">
                    <div className="flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <span className="text-sm font-bold text-slate-900 dark:text-white block truncate">{getStudentName(s)}</span>
                        <span className="text-[11px] text-slate-500 dark:text-slate-400 block truncate">
                          {s.phone} • {s.course || '—'} • {s.groupName || '—'}
                        </span>
                      </div>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold border shrink-0 ${paymentTone(s.paymentStatus)}`}>
                        {s.paymentStatus === 'Paid' ? t('To‘langan', 'Paid', 'Оплачено') : s.paymentStatus === 'Due' ? t('Kutilmoqda', 'Due', 'Ожидается') : t('Muddati o‘tgan', 'Overdue', 'Должник')}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                      <button onClick={() => openStudentProfile(s.id)} className="px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[11px] font-bold hover:border-emerald-500/40 transition cursor-pointer">
                        {t('Profil', 'Profile', 'Профиль')}
                      </button>
                      <button onClick={() => go('groups')} className="px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[11px] font-bold hover:border-emerald-500/40 transition cursor-pointer">
                        {t('Guruh', 'Group', 'Группа')}
                      </button>
                      <button onClick={() => go('payments')} className="px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[11px] font-bold hover:border-emerald-500/40 transition cursor-pointer">
                        {t('To‘lov', 'Payment', 'Оплата')}
                      </button>
                      <a href={`tel:${s.phone}`} aria-label={t("Qo'ng'iroq qilish", 'Call', 'Позвонить')} className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20 transition">
                        <Phone className="w-3.5 h-3.5" />
                      </a>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="py-6 text-center text-xs text-slate-400">{t('Hech kim topilmadi', 'No one found', 'Никого не найдено')}</p>
            )
          ) : (
            <p className="py-6 text-center text-xs text-slate-400">{t('Kamida 2 ta belgi kiriting', 'Type at least 2 characters', 'Введите минимум 2 символа')}</p>
          )}
        </section>

        <section aria-label={t('Kurslar', 'Courses', 'Курсы')} className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm p-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-extrabold text-slate-900 dark:text-white">{t('Kurslar', 'Courses', 'Курсы')}</h2>
            <button onClick={() => go('courses')} className="text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline cursor-pointer shrink-0">
              {t('Barchasi →', 'All →', 'Все →')}
            </button>
          </div>
          {courses.length > 0 ? (
            <ul className="space-y-2">
              {courses.filter((c) => (c as unknown as { isActive?: boolean }).isActive !== false).slice(0, 5).map((c) => {
                const courseGroups = groups.filter((g) => g.course === c.title && (g.status || 'Active') === 'Active');
                const filled = courseGroups.reduce((s, g) => s + toSafeNumber(g.studentsCount), 0);
                const capacity = courseGroups.reduce((s, g) => s + toSafeNumber(g.maxCapacity), 0);
                const hasCapacity = courseGroups.some((g) => toSafeNumber(g.maxCapacity) > 0);
                return (
                  <li key={c.id} className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-bold text-slate-900 dark:text-white truncate">{c.shortTitle || c.title}</span>
                      <span className="font-mono font-black text-sm text-emerald-700 dark:text-emerald-400 whitespace-nowrap">
                        {c.formattedFee || (toSafeNumber(c.monthlyFee) > 0 ? toSafeNumber(c.monthlyFee).toLocaleString('uz-UZ') : '—')}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                      {c.duration || '—'} • {c.lessonsPerWeek || '—'}
                      {c.teacherName ? ` • ${c.teacherName}` : ''}
                    </div>
                    <div className="text-[11px] text-slate-400 mt-0.5">
                      {courseGroups.length > 0
                        ? hasCapacity
                          ? `${counter(courseGroups.length, 'group')} • ${filled}/${capacity} ${t('joy band', 'seats taken', 'мест занято')}`
                          : counter(courseGroups.length, 'group')
                        : t('Bo‘sh guruh yo‘q', 'No open groups', 'Открытых групп нет')}
                    </div>
                  </li>
                );
              })}
            </ul>
          ) : (
            <div className="py-8 text-center">
              <BookOpen className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto" />
              <p className="mt-2 text-sm font-bold text-slate-600 dark:text-slate-300">{t("Hozircha kurslar yo'q", 'No courses yet', 'Пока нет курсов')}</p>
            </div>
          )}
        </section>
      </div>

      {/* Front-desk status */}
      <section aria-label={t('Bugungi holat', "Today's status", 'Статус дня')} className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm p-4 sm:p-5">
        <h2 className="text-sm font-extrabold text-slate-900 dark:text-white mb-3">{t('Bugungi holat', "Today's status", 'Статус дня')}</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 text-center">
          {[
            { label: t('Yangi', 'New', 'Новые'), value: stats.todayNew.length },
            { label: t('Bog‘lanildi', 'Contacted', 'Связались'), value: stats.byStatus('Contacted').length },
            { label: t('Sinov darsi', 'Trials', 'Пробные'), value: stats.trialsToday.length },
            { label: t('Qatnashdi', 'Attended', 'Посетили'), value: stats.attendedToday.length },
            { label: t('O‘quvchi bo‘ldi', 'Enrolled', 'Ученики'), value: stats.enrolledToday.length },
            { label: t('Kutilayotgan to‘lov', 'Dues', 'Долги'), value: stats.dues.length },
          ].map((s) => (
            <div key={s.label} className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800">
              <span className="text-xl font-black text-slate-900 dark:text-white block">{s.value}</span>
              <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 block mt-0.5">{s.label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Recent dues for reminders */}
      <section aria-label={t('To‘lov eslatmalari', 'Payment reminders', 'Напоминания об оплате')} className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm p-5">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
            <Wallet className="w-4 h-4 text-amber-500" />
            {t('To‘lov eslatmalari', 'Payment reminders', 'Напоминания об оплате')}
          </h2>
          <button onClick={() => go('payments')} className="text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline cursor-pointer flex items-center gap-1 shrink-0">
            {t('To‘lovlar', 'Payments', 'Платежи')} <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>
        {stats.dues.length > 0 ? (
          <ul className="space-y-2">
            {stats.dues.slice(0, 5).map((s) => (
              <li key={s.id} className="p-3 rounded-xl bg-rose-500/5 dark:bg-rose-950/20 border border-rose-500/20 flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <span className="text-sm font-bold text-slate-900 dark:text-white block truncate">{getStudentName(s)}</span>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 block truncate">
                    {s.course || '—'} • {s.phone} • {s.nextDueDate ? `${t('muddati:', 'due:', 'срок:')} ${formatDate(s.nextDueDate)}` : t('muddati belgilanmagan', 'no due date', 'срок не указан')}
                  </span>
                </div>
                <a
                  href={`tel:${s.phone}`}
                  className="shrink-0 px-3 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-bold transition flex items-center gap-1.5"
                >
                  <Phone className="w-3.5 h-3.5" />
                  {t('Eslatish', 'Remind', 'Напомнить')}
                </a>
              </li>
            ))}
          </ul>
        ) : (
          <p className="py-4 text-center text-xs text-slate-400">{t('Kutilayotgan to‘lov yo‘q', 'No pending payments', 'Ожидающих платежей нет')}</p>
        )}
      </section>
    </div>
  );
};
