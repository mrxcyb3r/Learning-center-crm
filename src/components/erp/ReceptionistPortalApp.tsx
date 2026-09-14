import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  PhoneCall,
  MessageSquare,
  Users,
  BookOpen,
  Calendar,
  CreditCard,
  Globe,
  ExternalLink,
  Sun,
  Moon,
  Menu,
  X,
  Search,
  LogOut,
} from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { ReceptionistDashboard } from './ReceptionistDashboard';
import { MurojaatlarView } from './MurojaatlarView';
import { LeadsCrmView } from './LeadsCrmView';
import { StudentsView } from './StudentsView';
import { ScheduleView } from './ScheduleView';
import { CoursesView } from './CoursesView';
import { PaymentsView } from './PaymentsView';
import { GlobalSearch } from './GlobalSearch';
import { AdminErrorBoundary } from '../common/AdminErrorBoundary';
import { leadsService, murojaatlarService } from '../../services/repository';
import { normalizeLeadStatus } from '../../utils/leads';
import { DEMO_MODE } from '../../config/demo';

export type ReceptionTab =
  | 'dashboard'
  | 'murojaatlar'
  | 'leads'
  | 'students'
  | 'groups'
  | 'courses'
  | 'payments';

type SidebarGroup = {
  title: string;
  items: Array<{ id: ReceptionTab; label: string; icon: React.FC<{ className?: string }> }>;
};

const getSidebarGroups = (t: (uz: string, en: string, ru: string) => string): SidebarGroup[] => [
  {
    title: t('Boshqaruv', 'Management', 'Управление'),
    items: [{ id: 'dashboard', label: t('Bosh sahifa', 'Dashboard', 'Главная'), icon: LayoutDashboard }],
  },
  {
    title: 'CRM',
    items: [
      { id: 'murojaatlar', label: t('Murojaatlar', 'Inquiries', 'Обращения'), icon: MessageSquare },
      { id: 'leads', label: t('Lidlar', 'Leads', 'Лиды'), icon: PhoneCall },
    ],
  },
  {
    title: t('O‘quvchilar', 'Students', 'Ученики'),
    items: [
      { id: 'students', label: t('O‘quvchilar', 'Students', 'Ученики'), icon: Users },
      { id: 'groups', label: t('Guruhlar va jadval', 'Groups & Schedule', 'Группы и расписание'), icon: Calendar },
      { id: 'courses', label: t('Kurslar', 'Courses', 'Курсы'), icon: BookOpen },
    ],
  },
  {
    title: t('Moliya', 'Finance', 'Финансы'),
    items: [{ id: 'payments', label: t('To‘lovlar', 'Payments', 'Оплаты'), icon: CreditCard }],
  },
];

/**
 * Dedicated front-desk workspace for the RECEPTIONIST role.
 * Focused on admissions/CRM; organization finance and admin settings
 * are intentionally unreachable here (see Firestore rules).
 */
export const ReceptionistPortalApp: React.FC = () => {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const { currentUser, userProfile, logout } = useAuth();
  const { language, setLanguage } = useLanguage();
  const t = (uz: string, en: string, ru: string) => (language === 'EN' ? en : language === 'RU' ? ru : uz);
  const [activeTab, setActiveTab] = useState<ReceptionTab>('dashboard');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [leadsCount, setLeadsCount] = useState(0);
  const [murojaatUnread, setMurojaatUnread] = useState(0);
  const [searchOpen, setSearchOpen] = useState(false);
  const [demoActive] = useState(DEMO_MODE);

  const sidebarGroups = useMemo(() => getSidebarGroups(t), [language]);
  const allItems = useMemo(() => sidebarGroups.flatMap((g) => g.items), [sidebarGroups]);

  const displayName =
    userProfile?.displayName || currentUser?.displayName || currentUser?.email?.split('@')[0] || t('Qabulxona', 'Front Desk', 'Ресепшн');

  const handleLogout = async () => {
    try {
      await logout();
    } finally {
      navigate('/login', { replace: true });
    }
  };

  useEffect(() => {
    leadsService.getAllLeads().then((leads) => {
      setLeadsCount(leads.filter((l) => normalizeLeadStatus(l.status) === 'New').length);
    }).catch(() => setLeadsCount(0));
    murojaatlarService.getSummary().then((s) => {
      setMurojaatUnread(s.unread);
    }).catch(() => setMurojaatUnread(0));
  }, []);

  // Shared header search opens the scoped front-desk search.
  useEffect(() => {
    const onSearch = () => setSearchOpen(true);
    window.addEventListener('centerflow-header-search', onSearch);
    return () => window.removeEventListener('centerflow-header-search', onSearch);
  }, []);

  const renderView = () => {
    switch (activeTab) {
      case 'dashboard':
        return <ReceptionistDashboard onNavigateTab={(t) => setActiveTab(t as ReceptionTab)} />;
      case 'murojaatlar':
        return <MurojaatlarView onSummaryChange={(s) => setMurojaatUnread(s.unread)} />;
      case 'leads':
        return <LeadsCrmView />;
      case 'students':
        return <StudentsView readOnly />;
      case 'groups':
        return <ScheduleView readOnly />;
      case 'courses':
        return <CoursesView readOnly />;
      case 'payments':
        // Front-desk may record new payments (narrow Firestore create rule:
        // existing student + positive amount). Void/edit stays admin-only.
        return <PaymentsView readOnly allowCreate />;
      default:
        return <ReceptionistDashboard onNavigateTab={(t) => setActiveTab(t as ReceptionTab)} />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col lg:flex-row font-sans selection:bg-emerald-500 selection:text-white">
      {/* Mobile Top Header */}
      <div className="lg:hidden flex items-center justify-between p-4 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-40">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white font-black flex items-center justify-center text-sm shrink-0">
            Q
          </div>
          <div>
            <div className="font-black text-sm tracking-tight leading-none text-slate-900 dark:text-white">
              {t('Qabulxona', 'Front Desk', 'Ресепшн')}
            </div>
            <div className="text-[10px] font-semibold text-emerald-500 flex items-center gap-1 mt-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shrink-0" aria-hidden="true" />
              <span>{t('Onlayn', 'Online', 'Онлайн')}</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {/* Mobile Language Switcher */}
          <div className="flex items-center rounded-lg bg-slate-100 dark:bg-slate-800 p-0.5 border border-slate-200 dark:border-slate-700 text-[10px] font-bold">
            <button
              type="button"
              onClick={() => setLanguage('UZ')}
              className={`px-1.5 py-0.5 rounded transition cursor-pointer ${language === 'UZ' ? 'bg-emerald-600 text-white font-black' : 'text-slate-500'}`}
            >
              UZ
            </button>
            <button
              type="button"
              onClick={() => setLanguage('RU')}
              className={`px-1.5 py-0.5 rounded transition cursor-pointer ${language === 'RU' ? 'bg-emerald-600 text-white font-black' : 'text-slate-500'}`}
            >
              RU
            </button>
            <button
              type="button"
              onClick={() => setLanguage('EN')}
              className={`px-1.5 py-0.5 rounded transition cursor-pointer ${language === 'EN' ? 'bg-emerald-600 text-white font-black' : 'text-slate-500'}`}
            >
              EN
            </button>
          </div>

          <button onClick={() => setSearchOpen(true)} className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 cursor-pointer" aria-label={t('Qidirish', 'Search', 'Поиск')}>
            <Search className="w-4 h-4" aria-hidden="true" />
          </button>
          <button onClick={toggleTheme} className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 cursor-pointer" aria-label={t('Mavzu', 'Theme', 'Тема')}>
            {theme === 'dark' ? <Sun className="w-4 h-4" aria-hidden="true" /> : <Moon className="w-4 h-4" aria-hidden="true" />}
          </button>
          <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 cursor-pointer" aria-label={t('Menyu', 'Menu', 'Меню')}>
            {mobileMenuOpen ? <X className="w-5 h-5" aria-hidden="true" /> : <Menu className="w-5 h-5" aria-hidden="true" />}
          </button>
        </div>
      </div>

      <aside className={`fixed lg:sticky top-0 left-0 bottom-0 z-50 w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 p-5 flex flex-col justify-between overflow-y-auto transition-transform duration-300 ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
        <div>
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-2xl bg-emerald-600 text-white font-black flex items-center justify-center text-base shadow-md shrink-0">Q</div>
              <div>
                <div className="font-black text-base tracking-tight leading-none text-slate-900 dark:text-white">
                  {t('Qabulxona', 'Front Desk', 'Ресепшн')}
                </div>
                <div className="text-[10px] font-semibold text-emerald-500 flex items-center gap-1.5 mt-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shrink-0" aria-hidden="true" />
                  <span>{t('Onlayn', 'Online', 'Онлайн')}</span>
                </div>
              </div>
            </div>
            <button onClick={() => setMobileMenuOpen(false)} className="lg:hidden p-1.5 rounded-lg text-slate-400 cursor-pointer" aria-label={t('Yopish', 'Close', 'Закрыть')}>
              <X className="w-4 h-4" aria-hidden="true" />
            </button>
          </div>

          {demoActive && (
            <div className="px-3.5 mb-4 py-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-center">
              <span className="text-[9px] font-black text-emerald-700 dark:text-emerald-400 uppercase tracking-widest">
                {t('Namoyish rejimi', 'Demo Mode', 'Демонстрационный режим')}
              </span>
            </div>
          )}

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
                            ? 'bg-emerald-600 text-white shadow-sm font-extrabold'
                            : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/80 hover:text-slate-900 dark:hover:text-white'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <Icon className="w-4 h-4 shrink-0" />
                          <span>{item.label}</span>
                        </div>
                        {(item.id === 'leads' && leadsCount > 0) && (
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${isActive ? 'bg-white text-emerald-700' : 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30'}`}>
                            {leadsCount}
                          </span>
                        )}
                        {(item.id === 'murojaatlar' && murojaatUnread > 0) && (
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${isActive ? 'bg-white text-emerald-700' : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/30'}`}>
                            {murojaatUnread}
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

        <div className="pt-6 border-t border-slate-100 dark:border-slate-800 space-y-3">
          <button
            onClick={() => navigate('/')}
            className="w-full py-2.5 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold flex items-center justify-center gap-2 transition cursor-pointer border border-slate-200 dark:border-slate-700"
          >
            <Globe className="w-3.5 h-3.5 text-emerald-600" aria-hidden="true" />
            <span>{t('Saytni ko‘rish', 'View Website', 'Открыть сайт')}</span>
            <ExternalLink className="w-3 h-3 text-slate-400" aria-hidden="true" />
          </button>
          <div className="flex items-center gap-2.5 px-1 min-w-0">
            <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-emerald-600 to-emerald-400 flex items-center justify-center font-bold text-white text-xs shrink-0">
              {displayName.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <span className="font-bold text-slate-900 dark:text-white block text-[11px] leading-tight truncate">{displayName}</span>
              <span className="text-[10px] text-emerald-700 dark:text-emerald-400 font-bold uppercase">{t('Qabulxona', 'Front Desk', 'Ресепшн')}</span>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 border border-rose-500/20 transition cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" aria-hidden="true" />
            <span>{t('Chiqish', 'Sign Out', 'Выход')}</span>
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="hidden lg:flex items-center justify-between gap-4 px-8 py-3 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 sticky top-0 z-30">
          <div className="flex items-center gap-3 min-w-0">
            <span className="inline-flex items-center px-2 py-0.5 rounded-lg border text-[10px] font-bold bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border-emerald-500/30 shrink-0">
              {t('Qabulxona', 'Front Desk', 'Ресепшн')}
            </span>
            <button
              onClick={() => setSearchOpen(true)}
              className="hidden xl:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-500 cursor-pointer"
            >
              <Search className="w-3.5 h-3.5" aria-hidden="true" />
              <span>{t('Lid, o‘quvchi, kurs qidirish...', 'Search leads, students, courses...', 'Поиск лидов, учеников, курсов...')}</span>
            </button>
          </div>
          <div className="flex items-center gap-2.5 shrink-0">
            {/* Language Switcher */}
            <div className="flex items-center rounded-xl bg-slate-100 dark:bg-slate-800 p-0.5 border border-slate-200 dark:border-slate-700 text-[11px] font-bold" role="group" aria-label={t('Tilni tanlash', 'Select language', 'Выбор языка')}>
              <button
                type="button"
                onClick={() => setLanguage('UZ')}
                className={`px-2 py-1 rounded-lg transition cursor-pointer ${language === 'UZ' ? 'bg-emerald-600 text-white font-black shadow-xs' : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'}`}
              >
                UZ
              </button>
              <button
                type="button"
                onClick={() => setLanguage('RU')}
                className={`px-2 py-1 rounded-lg transition cursor-pointer ${language === 'RU' ? 'bg-emerald-600 text-white font-black shadow-xs' : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'}`}
              >
                RU
              </button>
              <button
                type="button"
                onClick={() => setLanguage('EN')}
                className={`px-2 py-1 rounded-lg transition cursor-pointer ${language === 'EN' ? 'bg-emerald-600 text-white font-black shadow-xs' : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'}`}
              >
                EN
              </button>
            </div>

            <button
              onClick={() => navigate('/')}
              className="px-3.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer border border-slate-200 dark:border-slate-700"
            >
              <Globe className="w-3.5 h-3.5 text-emerald-600" aria-hidden="true" />
              <span>{t('Saytni ko‘rish', 'View Website', 'Открыть сайт')}</span>
            </button>

            <span className="hidden 2xl:block text-[11px] font-bold text-slate-600 dark:text-slate-300 max-w-28 truncate">{displayName}</span>
            <button onClick={toggleTheme} className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 cursor-pointer" aria-label={t('Mavzu', 'Theme', 'Тема')}>
              {theme === 'dark' ? <Sun className="w-4 h-4" aria-hidden="true" /> : <Moon className="w-4 h-4" aria-hidden="true" />}
            </button>
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 text-xs font-bold border border-rose-500/30 transition cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" aria-hidden="true" />
              <span>{t('Chiqish', 'Sign Out', 'Выход')}</span>
            </button>
          </div>
        </header>

        <div className="lg:hidden flex items-center justify-between gap-2 px-4 py-2 bg-white/80 dark:bg-slate-900/80 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-30">
          <span className="inline-flex items-center px-2 py-0.5 rounded-lg border text-[10px] font-bold bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30">
            {t('Qabulxona', 'Front Desk', 'Ресепшн')}
          </span>
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300 truncate max-w-32">{displayName}</span>
            <button
              onClick={handleLogout}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-rose-500/10 text-rose-600 dark:text-rose-400 text-[11px] font-bold border border-rose-500/30 cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" aria-hidden="true" />
              <span>{t('Chiqish', 'Sign Out', 'Выход')}</span>
            </button>
          </div>
        </div>

        <main className="flex-1 p-4 sm:p-8 max-w-7xl w-full mx-auto">
          {demoActive && (
            <div className="mb-4 px-4 py-2.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/25 flex items-center gap-2 text-[11px] font-bold text-emerald-700 dark:text-emerald-400">
              <MessageSquare className="w-4 h-4 shrink-0" aria-hidden="true" />
              <span>{t('Namoyish rejimi — ko‘rsatilgan ma’lumotlar demo ma’lumotlar asosida.', 'Demo mode — displayed data is based on sample data.', 'Демо-режим — данные сформированы на основе демонстрационных образцов.')}</span>
            </div>
          )}
          <AdminErrorBoundary key={activeTab} sectionName={allItems.find((s) => s.id === activeTab)?.label}>
            {renderView()}
          </AdminErrorBoundary>
        </main>
      </div>

      <GlobalSearch
        open={searchOpen}
        onClose={() => setSearchOpen(false)}
        scope="receptionist"
        onNavigate={(tab, record) => {
          setActiveTab(tab as ReceptionTab);
          if (record) {
            setTimeout(() => window.dispatchEvent(new CustomEvent('centerflow-open-record', { detail: record })), 150);
          }
        }}
      />
    </div>
  );
};

export default ReceptionistPortalApp;
