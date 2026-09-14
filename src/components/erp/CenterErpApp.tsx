import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  PhoneCall,
  MessageSquare,
  Users,
  GraduationCap,
  BookOpen,
  Calendar,
  CreditCard,
  DollarSign,
  BarChart3,
  Globe,
  Send,
  Settings,
  ExternalLink,
  Sun,
  Moon,
  Menu,
  X,
  Plus,
  Bell,
  Sparkles,
  Search,
  LifeBuoy,
  LogOut,
} from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { DashboardView } from './DashboardView';
import { MurojaatlarView } from './MurojaatlarView';
import { LeadsCrmView } from './LeadsCrmView';
import { StudentsView } from './StudentsView';
import { TeachersView } from './TeachersView';
import { CoursesView } from './CoursesView';
import { ScheduleView } from './ScheduleView';
import { PaymentsView } from './PaymentsView';
import { ExpensesView } from './ExpensesView';
import { ReportsView } from './ReportsView';
import { WebsiteCmsView } from './WebsiteCmsView';
import { TelegramView } from './TelegramView';
import { SettingsView } from './SettingsView';
import { SupportPanel } from './SupportPanel';
import { ReceptionistView } from './ReceptionistView';
import { AdminErrorBoundary } from '../common/AdminErrorBoundary';
import { GlobalSearch } from './GlobalSearch';
import { normalizeLeadStatus } from '../../utils/leads';
import { leadsService, murojaatlarService } from '../../services/repository';
import { ensureSeeded } from '../../services/seed';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { DEMO_MODE } from '../../config/demo';

type ErpTab =
  | 'dashboard'
  | 'murojaatlar'
  | 'leads'
  | 'students'
  | 'teachers'
  | 'courses'
  | 'schedule'
  | 'payments'
  | 'expenses'
  | 'reports'
  | 'cms'
  | 'telegram'
  | 'settings'
  | 'support'
  | 'receptionist';

type SidebarGroup = {
  title: string;
  items: { id: ErpTab; label: string; icon: React.FC<{ className?: string }>; badge?: string }[];
};

const getSidebarGroups = (t: (uz: string, en: string, ru: string) => string): SidebarGroup[] => [
  {
    title: t('Boshqaruv', 'Management', 'Управление'),
    items: [{ id: 'dashboard', label: t('Bosh sahifa', 'Dashboard', 'Главная'), icon: LayoutDashboard }],
  },
  {
    title: t('Qabul va o‘quvchilar', 'Admissions & Students', 'Приём и ученики'),
    items: [
      { id: 'murojaatlar', label: t('Murojaatlar', 'Inquiries', 'Обращения'), icon: MessageSquare },
      { id: 'leads', label: t('Lidlar CRM', 'Leads CRM', 'Лиды CRM'), icon: PhoneCall },
      { id: 'students', label: t('O‘quvchilar', 'Students', 'Ученики'), icon: Users },
      { id: 'receptionist', label: t('Qabulxona', 'Front Desk', 'Ресепшн'), icon: LifeBuoy },
    ],
  },
  {
    title: t('Ta’lim', 'Teaching', 'Обучение'),
    items: [
      { id: 'teachers', label: t('O‘qituvchilar', 'Teachers', 'Преподаватели'), icon: GraduationCap },
      { id: 'courses', label: t('Kurslar va to‘lovlar', 'Courses & Fees', 'Курсы и тарифы'), icon: BookOpen },
      { id: 'schedule', label: t('Guruhlar va dars jadvali', 'Groups & Schedule', 'Группы и расписание'), icon: Calendar },
    ],
  },
  {
    title: t('Moliya', 'Finance', 'Финансы'),
    items: [
      { id: 'payments', label: t('To‘lovlar', 'Payments', 'Оплаты'), icon: CreditCard },
      { id: 'expenses', label: t('Xarajatlar va ish haqlari', 'Expenses & Payroll', 'Расходы и зарплаты'), icon: DollarSign },
    ],
  },
  {
    title: t('Tahlil', 'Analytics', 'Аналитика'),
    items: [{ id: 'reports', label: t('Hisobotlar va tahlil', 'Reports & Analytics', 'Отчёты и аналитика'), icon: BarChart3 }],
  },
  {
    title: t('Marketing', 'Marketing', 'Маркетинг'),
    items: [
      { id: 'cms', label: t('Veb-sayt', 'Website CMS', 'Веб-сайт'), icon: Globe },
      { id: 'telegram', label: t('Telegram bot', 'Telegram Bot', 'Telegram бот'), icon: Send },
    ],
  },
  {
    title: t('Tizim', 'System', 'Система'),
    items: [
      { id: 'settings', label: t('Sozlamalar', 'Settings', 'Настройки'), icon: Settings },
      { id: 'support', label: t('Yordam', 'Support', 'Поддержка'), icon: LifeBuoy },
    ],
  },
];

export const CenterErpApp: React.FC = () => {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const { currentUser, userProfile, activeRole, logout } = useAuth();
  const { language, setLanguage, t: translateObj } = useLanguage();
  const t = (uz: string, en: string, ru: string) => (language === 'EN' ? en : language === 'RU' ? ru : uz);
  const [activeTab, setActiveTab] = useState<ErpTab>('dashboard');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [leadsCount, setLeadsCount] = useState(0);
  const [murojaatUnread, setMurojaatUnread] = useState(0);

  const sidebarGroups = useMemo(() => getSidebarGroups(t), [language]);
  const sidebarItems = sidebarGroups.flatMap((group) => group.items);

  const displayName =
    userProfile?.displayName || currentUser?.displayName || currentUser?.email?.split('@')[0] || t('Direktor', 'Director', 'Директор');
  const roleLabel =
    activeRole === 'superadmin' ? t('SuperAdmin', 'SuperAdmin', 'СуперАдмин') :
    activeRole === 'admin' ? t('Direktor', 'Director', 'Директор') :
    activeRole === 'receptionist' ? t('Qabulxona', 'Front Desk', 'Ресепшн') :
    activeRole === 'teacher' ? t('O‘qituvchi', 'Teacher', 'Учитель') :
    String(activeRole || '');

  const handleLogout = async () => {
    try {
      await logout();
    } finally {
      navigate('/login', { replace: true });
    }
  };

  // Whether the workspace is currently running on demo data. Defaults to the
  // build flag; flips off once an operator clears the demo namespace and back
  // on when it is restored for presentations.
  const [demoActive, setDemoActive] = useState(DEMO_MODE);
  const [searchOpen, setSearchOpen] = useState(false);

  // Fetch counts on mount
  useEffect(() => {
    leadsService.getAllLeads().then((leads) => {
      setLeadsCount(leads.filter((l) => normalizeLeadStatus(l.status) === 'New').length);
    }).catch(() => setLeadsCount(0));
    murojaatlarService.getSummary().then((s) => {
      setMurojaatUnread(s.unread);
    }).catch(() => setMurojaatUnread(0));
    // Centralized demo-data seed — the single sanctioned invocation site.
    // Runs only inside the admin-guarded shell; safe under StrictMode.
    ensureSeeded().catch(() => {});
    // Reflect operator-visible demo state (cleared via Settings → launch).
    getDoc(doc(db, 'settings', 'seed_meta'))
      .then((s) => {
        if (s.exists() && s.data()?.cleared === true) setDemoActive(false);
      })
      .catch(() => {});
    const onCleared = () => setDemoActive(false);
    const onRestored = () => setDemoActive(DEMO_MODE);
    window.addEventListener('centerflow-demo-cleared', onCleared);
    window.addEventListener('centerflow-demo-restored', onRestored);
    return () => {
      window.removeEventListener('centerflow-demo-cleared', onCleared);
      window.removeEventListener('centerflow-demo-restored', onRestored);
    };
  }, []);

  // Shared header search opens the scoped global search.
  useEffect(() => {
    const onSearch = () => setSearchOpen(true);
    window.addEventListener('centerflow-header-search', onSearch);
    return () => window.removeEventListener('centerflow-header-search', onSearch);
  }, []);

  const renderActiveView = () => {
    switch (activeTab) {
      case 'dashboard':
        return <DashboardView onNavigateTab={(tab) => setActiveTab(tab as ErpTab)} />;
case 'murojaatlar':
      return <MurojaatlarView onSummaryChange={(s) => setMurojaatUnread(s.unread)} />;
    case 'leads':
      return <LeadsCrmView />;
    case 'receptionist':
      return <ReceptionistView />;
    case 'students':
        return <StudentsView />;
      case 'teachers':
        return <TeachersView />;
      case 'courses':
        return <CoursesView />;
      case 'schedule':
        return <ScheduleView />;
      case 'payments':
        return <PaymentsView />;
      case 'expenses':
        return <ExpensesView />;
      case 'reports':
        return <ReportsView />;
      case 'cms':
        return <WebsiteCmsView />;
      case 'telegram':
        return <TelegramView />;
      case 'settings':
        return <SettingsView />;
      case 'support':
        return <SupportPanel />;
      default:
        return <DashboardView onNavigateTab={(tab) => setActiveTab(tab as ErpTab)} />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col lg:flex-row font-sans selection:bg-amber-500 selection:text-slate-950">
      {/* Mobile Header Bar */}
      <div className="lg:hidden flex items-center justify-between p-4 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-40">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-amber-500 text-slate-950 font-black flex items-center justify-center text-sm">
            R
          </div>
          <span className="font-black text-sm tracking-tight text-slate-900 dark:text-white">
            RENESSANS ERP
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={toggleTheme}
            className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300"
          >
            {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Desktop Persistent Sidebar */}
      <aside
        className={`fixed lg:sticky top-0 left-0 bottom-0 z-50 w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 p-5 flex flex-col justify-between overflow-y-auto transition-transform duration-300 ${
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div>
          {/* Brand */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-2xl bg-amber-500 text-slate-950 font-black flex items-center justify-center text-base shadow-md shadow-amber-500/20 shrink-0">
                R
              </div>
              <div className="space-y-0.5">
                <div className="font-black text-base tracking-tight text-slate-900 dark:text-white leading-none">
                  RENESSANS
                </div>
                <div className="text-[10px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider">
                  {t('O‘quv markazi', 'Learning Center', 'Учебный центр')}
                </div>
                <div className="text-[10px] font-semibold text-emerald-500 flex items-center gap-1.5 pt-0.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shrink-0" aria-hidden="true" />
                  <span>{roleLabel}</span>
                  <span className="text-slate-400">·</span>
                  <span>{t('Onlayn', 'Online', 'Онлайн')}</span>
                </div>
              </div>
            </div>

            <button
              onClick={() => setMobileMenuOpen(false)}
              className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-white"
              aria-label={t('Yopish', 'Close', 'Закрыть')}
            >
              <X className="w-4 h-4" aria-hidden="true" />
            </button>
          </div>

          {/* Demo indicator (visible only while demo data is loaded) */}
          {demoActive && (
            <div className="px-3.5 mb-4 py-2 rounded-lg bg-amber-500/10 border border-amber-500/20 text-center">
              <span className="text-[9px] font-black text-amber-600 dark:text-amber-400 uppercase tracking-widest">
                {t('Namoyish rejimi', 'Demo Mode', 'Демонстрационный режим')}
              </span>
            </div>
          )}

          {/* Navigation Items */}
          <nav className="space-y-5">
            {sidebarGroups.map((group) => (
              <div key={group.title}>
                <div className="px-3.5 mb-1.5 text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">
                  {group.title}
                </div>
                <div className="space-y-1">
                  {group.items.map((item) => {
                    const Icon = item.icon;
                    const isActive = activeTab === item.id;
                    return (
                      <button
                        key={item.id}
                        onClick={() => {
                          setActiveTab(item.id);
                          setMobileMenuOpen(false);
                        }}
                        className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                          isActive
                            ? 'bg-amber-500 text-slate-950 shadow-sm font-extrabold'
                            : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/80 hover:text-slate-900 dark:hover:text-white'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-slate-950' : 'text-slate-400'}`} />
                          <span>{item.label}</span>
                        </div>

                        {item.id === 'murojaatlar' && murojaatUnread > 0 && (
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                              isActive
                                ? 'bg-slate-950 text-amber-400'
                                : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/30'
                            }`}
                          >
                            {murojaatUnread}
                          </span>
                        )}

                        {item.id === 'leads' && leadsCount > 0 && (
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                              isActive
                                ? 'bg-slate-950 text-amber-400'
                                : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/30'
                            }`}
                          >
                            {leadsCount}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </nav>
        </div>

        {/* Sidebar Bottom Controls */}
        <div className="pt-6 border-t border-slate-100 dark:border-slate-800 space-y-3">
          {/* Return to Public Website */}
          <button
            onClick={() => navigate('/')}
            className="w-full py-2.5 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold flex items-center justify-center gap-2 transition cursor-pointer border border-slate-200 dark:border-slate-700"
          >
            <Globe className="w-3.5 h-3.5 text-amber-500" aria-hidden="true" />
            <span>{t('Saytni ko‘rish', 'View Website', 'Открыть сайт')}</span>
            <ExternalLink className="w-3 h-3 text-slate-400" aria-hidden="true" />
          </button>

          {/* User profile brief — real authenticated user */}
          <div className="flex items-center justify-between px-1 text-xs gap-2">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-amber-500 to-amber-300 flex items-center justify-center font-bold text-slate-950 text-xs shrink-0">
                {displayName.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0">
                <span className="font-bold text-slate-900 dark:text-white block text-[11px] leading-tight truncate">
                  {displayName}
                </span>
                <span className="text-[10px] text-amber-600 dark:text-amber-400 font-bold">{roleLabel}</span>
              </div>
            </div>

            <button
              onClick={toggleTheme}
              className="p-1.5 rounded-lg text-slate-400 hover:text-amber-500 cursor-pointer shrink-0"
              title={t('Mavzuni almashtirish', 'Toggle Theme', 'Переключить тему')}
            >
              {theme === 'dark' ? <Sun className="w-3.5 h-3.5" aria-hidden="true" /> : <Moon className="w-3.5 h-3.5" aria-hidden="true" />}
            </button>
          </div>

          {/* Logout */}
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 border border-rose-500/20 transition cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" aria-hidden="true" />
            <span>{t('Chiqish', 'Sign Out', 'Выход')}</span>
          </button>
        </div>
      </aside>

      {/* Main Workspace View */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Workspace Topbar */}
        <header className="hidden lg:flex items-center justify-between gap-4 px-8 py-3 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 sticky top-0 z-30">
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-500 shrink-0">
              <span>{t('Kampus:', 'Campus:', 'Кампус:')}</span>
              <span className="px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold border border-emerald-500/20">
                {t('Faol · 08:30 – 21:00', 'Active · 08:30 – 21:00', 'Активен · 08:30 – 21:00')}
              </span>
            </div>
            <span className="inline-flex items-center px-2 py-0.5 rounded-lg border text-[10px] font-bold bg-purple-500/10 dark:bg-purple-500/20 text-purple-600 dark:text-purple-400 border-purple-500/30 shrink-0">
              {roleLabel}
            </span>
            <div className="hidden xl:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
              <Search className="w-3.5 h-3.5 text-slate-400 shrink-0" aria-hidden="true" />
              <button
                onClick={() => setSearchOpen(true)}
                className="text-xs text-slate-500 dark:text-slate-400 cursor-pointer"
              >
                {t('Lid, o‘quvchi yoki kurs qidirish...', 'Search leads, students or courses...', 'Поиск лидов, учеников или курсов...')}
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            {/* Language Switcher */}
            <div className="flex items-center rounded-xl bg-slate-100 dark:bg-slate-800 p-0.5 border border-slate-200 dark:border-slate-700 text-[11px] font-bold" role="group" aria-label={t('Tilni tanlash', 'Select language', 'Выбор языка')}>
              <button
                type="button"
                onClick={() => setLanguage('UZ')}
                className={`px-2 py-1 rounded-lg transition cursor-pointer ${language === 'UZ' ? 'bg-amber-500 text-slate-950 font-black shadow-xs' : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'}`}
              >
                UZ
              </button>
              <button
                type="button"
                onClick={() => setLanguage('RU')}
                className={`px-2 py-1 rounded-lg transition cursor-pointer ${language === 'RU' ? 'bg-amber-500 text-slate-950 font-black shadow-xs' : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'}`}
              >
                RU
              </button>
              <button
                type="button"
                onClick={() => setLanguage('EN')}
                className={`px-2 py-1 rounded-lg transition cursor-pointer ${language === 'EN' ? 'bg-amber-500 text-slate-950 font-black shadow-xs' : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'}`}
              >
                EN
              </button>
            </div>

            <button
              onClick={() => setActiveTab('murojaatlar')}
              className="px-3.5 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-400 border border-amber-500/30 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
            >
              <MessageSquare className="w-3.5 h-3.5" aria-hidden="true" />
              <span>{murojaatUnread} {t('ta o‘qilmagan', 'unread', 'непрочитанных')}</span>
            </button>

            <button
              onClick={() => navigate('/')}
              className="px-3.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer border border-slate-200 dark:border-slate-700"
            >
              <Globe className="w-3.5 h-3.5 text-amber-500" aria-hidden="true" />
              <span>{t('Saytni ko‘rish', 'View Website', 'Открыть сайт')}</span>
            </button>

            <span className="hidden 2xl:block text-[11px] font-bold text-slate-600 dark:text-slate-300 max-w-28 truncate" title={displayName}>
              {displayName}
            </span>
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 text-xs font-bold border border-rose-500/30 transition cursor-pointer"
              title={t('Chiqish', 'Sign Out', 'Выход')}
            >
              <LogOut className="w-3.5 h-3.5" aria-hidden="true" />
              <span>{t('Chiqish', 'Sign Out', 'Выход')}</span>
            </button>
          </div>
        </header>

        {/* Mobile topbar logout row */}
        <div className="lg:hidden flex items-center justify-between gap-2 px-4 py-2 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 sticky top-0 z-30">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center px-2 py-0.5 rounded-lg border text-[10px] font-bold bg-purple-500/10 dark:bg-purple-500/20 text-purple-600 dark:text-purple-400 border-purple-500/30">
              {roleLabel}
            </span>
            {/* Mobile language switcher */}
            <div className="flex items-center rounded-lg bg-slate-100 dark:bg-slate-800 p-0.5 border border-slate-200 dark:border-slate-700 text-[10px] font-bold">
              <button
                type="button"
                onClick={() => setLanguage('UZ')}
                className={`px-1.5 py-0.5 rounded transition ${language === 'UZ' ? 'bg-amber-500 text-slate-950 font-black' : 'text-slate-500'}`}
              >
                UZ
              </button>
              <button
                type="button"
                onClick={() => setLanguage('RU')}
                className={`px-1.5 py-0.5 rounded transition ${language === 'RU' ? 'bg-amber-500 text-slate-950 font-black' : 'text-slate-500'}`}
              >
                RU
              </button>
              <button
                type="button"
                onClick={() => setLanguage('EN')}
                className={`px-1.5 py-0.5 rounded transition ${language === 'EN' ? 'bg-amber-500 text-slate-950 font-black' : 'text-slate-500'}`}
              >
                EN
              </button>
            </div>
          </div>
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300 truncate max-w-32">{displayName}</span>
            <button
              onClick={handleLogout}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-rose-500/10 text-rose-600 dark:text-rose-400 text-[11px] font-bold border border-rose-500/30 shrink-0"
            >
              <LogOut className="w-3 h-3" aria-hidden="true" />
              <span>{t('Chiqish', 'Sign Out', 'Выход')}</span>
            </button>
          </div>
        </div>

        {/* View Body */}
        <main className="flex-1 p-4 sm:p-8 max-w-7xl w-full mx-auto">
          {demoActive && (
            <div className="mb-4 px-4 py-2.5 rounded-2xl bg-amber-500/10 border border-amber-500/25 flex items-center gap-2 text-[11px] font-bold text-amber-700 dark:text-amber-400">
              <Sparkles className="w-4 h-4 shrink-0" aria-hidden="true" />
              <span>{t('Namoyish rejimi — ko‘rsatilgan ma’lumotlar demo ma’lumotlar asosida.', 'Demo mode — displayed data is based on sample data.', 'Демо-режим — данные сформированы на основе демонстрационных образцов.')}</span>
            </div>
          )}
          <AdminErrorBoundary key={activeTab} sectionName={sidebarItems.find((s) => s.id === activeTab)?.label}>
            {renderActiveView()}
          </AdminErrorBoundary>
        </main>
      </div>

      <GlobalSearch
        open={searchOpen}
        onClose={() => setSearchOpen(false)}
        scope="admin"
        onNavigate={(tab, record) => {
          setActiveTab(tab as ErpTab);
          if (record) {
            // Let the target view mount first, then deep-link the record.
            setTimeout(() => window.dispatchEvent(new CustomEvent('centerflow-open-record', { detail: record })), 150);
          }
        }}
      />
    </div>
  );
};
