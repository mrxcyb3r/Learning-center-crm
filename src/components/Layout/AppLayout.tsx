import React, { useState, useEffect } from 'react';
import { useAuth, SUPER_ADMIN_UUID } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { useTheme } from '../../context/ThemeContext';
import { StudentsPage } from '../../pages/StudentsPage';
import { PaymentsPage } from '../../pages/PaymentsPage';
import { TeacherAttendance } from '../../pages/TeacherAttendance';

// Student Page Views
import { GroupFeed } from '../../pages/student/GroupFeed';
import { ProgressGraphs } from '../../pages/student/ProgressGraphs';
import { Leaderboard } from '../../pages/student/Leaderboard';
import { AITutorView } from '../../pages/student/AITutorView';

// Teacher Page Views
import { MyClassesView } from '../../pages/teacher/MyClassesView';
import { HomeworkView } from '../../pages/teacher/HomeworkView';
import { GradebookView } from '../../pages/teacher/GradebookView';

// Admin Page Views
import { SuperAdminControlView } from '../../pages/admin/SuperAdminControlView';
import { PayrollView } from '../../pages/admin/PayrollView';
import { ClassesView } from '../../pages/admin/ClassesView';
import { BlogCMSView } from '../../pages/admin/BlogCMSView';
import { LandingPageEditor } from '../../pages/admin/LandingPageEditor';
import { LandingPageCMSView } from '../../pages/admin/LandingPageCMSView';
import { InquiriesView } from '../../pages/admin/InquiriesView';
import { SettingsView } from '../../pages/admin/SettingsView';
import { TelegramPanel } from '../TelegramPanel';
import { TelegramSettingsCard } from '../TelegramSettingsCard';
import { PrimeAIAssistant } from '../AI/PrimeAIAssistant';
import {
  ShieldCheck,
  LayoutDashboard,
  BookOpen,
  Users,
  GraduationCap,
  Calendar,
  Award,
  Settings,
  LogOut,
  Sun,
  Moon,
  Globe,
  ChevronRight,
  Bell,
  Menu,
  X,
  UserCheck,
  ShieldAlert,
  CreditCard,
  FileText,
  Newspaper,
  LayoutTemplate,
  Key,
  DollarSign,
  TrendingUp,
  Sparkles,
  PhoneCall,
  Send
} from 'lucide-react';
import { subscribeInquiries, subscribeNotifications } from '../../services/firestore';
import { NotificationCenter } from '../UI/NotificationCenter';
import { Header } from '../UI/Header';
import { UserRole } from '../../types';

interface AppLayoutProps {
  children: React.ReactNode;
}

export const AppLayout: React.FC<AppLayoutProps> = ({ children }) => {
  const { currentUser, userProfile, activeRole, setMockRole, logout } = useAuth();
  const { language, setLanguage, t } = useLanguage();
  const { theme, toggleTheme } = useTheme();
  const isDarkMode = theme === 'dark';

  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [isAIFloatingOpen, setIsAIFloatingOpen] = useState(false);
  const [newInquiriesCount, setNewInquiriesCount] = useState(2);

  // Subscribe to real-time notifications
  useEffect(() => {
    const unsubNotifs = subscribeNotifications(
      currentUser?.uid,
      activeRole,
      (items) => {
        const count = items.filter((n) => !n.isRead).length;
        setUnreadNotifications(count);
      }
    );
    return () => unsubNotifs();
  }, [currentUser?.uid, activeRole]);

  // Subscribe to real-time inquiries count
  useEffect(() => {
    const unsub = subscribeInquiries((items) => {
      const newCount = items.filter((i) => i.status === 'new').length;
      setNewInquiriesCount(newCount);
    });
    return () => unsub();
  }, []);

  // Reset active tab and update clean path URL when activeRole or activeTab changes
  useEffect(() => {
    const rolePath = activeRole === 'superadmin' ? 'admin' : activeRole;
    const tabPath = activeTab === 'dashboard' ? '' : `/${activeTab}`;
    const cleanUrl = `/dashboard/${rolePath}${tabPath}`;
    if (window.location.pathname !== cleanUrl) {
      window.history.pushState(null, '', cleanUrl);
    }
  }, [activeRole, activeTab]);

  const displayName = userProfile?.displayName || currentUser?.displayName || currentUser?.email?.split('@')[0] || 'User';
  const email = currentUser?.email || 'user@renessans.lc';

  // Badge styles based on current active role
  const getRoleBadge = (role: UserRole) => {
    switch (role) {
      case 'superadmin':
        return {
          label: 'SuperAdmin',
          bg: 'bg-rose-500/10 dark:bg-rose-500/20 text-rose-600 dark:text-rose-400 border-rose-500/30',
          icon: <ShieldAlert className="w-3.5 h-3.5 text-rose-500" />
        };
      case 'admin':
        return {
          label: 'Admin',
          bg: 'bg-purple-500/10 dark:bg-purple-500/20 text-purple-600 dark:text-purple-400 border-purple-500/30',
          icon: <ShieldCheck className="w-3.5 h-3.5 text-purple-500" />
        };
      case 'teacher':
        return {
          label: 'Teacher',
          bg: 'bg-blue-500/10 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 border-blue-500/30',
          icon: <UserCheck className="w-3.5 h-3.5 text-blue-500" />
        };
      case 'student':
      default:
        return {
          label: 'Student',
          bg: 'bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border-emerald-500/30',
          icon: <GraduationCap className="w-3.5 h-3.5 text-emerald-500" />
        };
    }
  };

  const badge = getRoleBadge(activeRole);

  // Dynamic Navigation Items per role
  const getNavItems = () => {
    const t = (uz: string, en: string, ru: string) => {
      if (language === 'UZ') return uz;
      if (language === 'RU') return ru;
      return en;
    };

    if (activeRole === 'superadmin') {
      return [
        { id: 'dashboard', label: t('Boshqaruv Paneli', 'Dashboard', 'Панель Управления'), icon: <LayoutDashboard className="w-4 h-4" /> },
        { id: 'inquiries', label: t('Arizalar & Lids', 'Leads & Inquiries', 'Заявки и Лиды'), icon: <PhoneCall className="w-4 h-4 text-emerald-500" />, badge: newInquiriesCount > 0 ? newInquiriesCount : undefined },
        { id: 'landing', label: t('Lending Sayt CMS', 'Landing Page CMS', 'Редактор Лендинга'), icon: <LayoutTemplate className="w-4 h-4 text-amber-500" /> },
        { id: 'students', label: t("O'quvchilar", 'Students', 'Ученики'), icon: <Users className="w-4 h-4" /> },
        { id: 'classes', label: t("Guruhlar & Darslar", 'Classes & Groups', 'Группы и Занятия'), icon: <BookOpen className="w-4 h-4" /> },
        { id: 'payments', label: t("To'lovlar & Kontrakt", 'Tuition & Payments', 'Оплата и Контракты'), icon: <CreditCard className="w-4 h-4" /> },
        { id: 'payroll', label: t("Oylik Maosh & Harajatlar", 'Payroll & Expenses', 'Зарплаты и Расходы'), icon: <DollarSign className="w-4 h-4" /> },
        { id: 'telegram', label: t('Telegram Bot Suite', 'Telegram Bot Suite', 'Telegram Бот Панель'), icon: <Send className="w-4 h-4 text-blue-400" /> },
        { id: 'security', label: t("Xavfsizlik va PIN Kodlar", 'Security & PIN Codes', 'Безопасность и PIN-коды'), icon: <Settings className="w-4 h-4" /> },
        { id: 'superadmin_control', label: t('SuperAdmin Boshqaruvi', 'SuperAdmin Control', 'Панель SuperAdmin'), icon: <ShieldAlert className="w-4 h-4 text-rose-500" /> }
      ];
    }

    if (activeRole === 'admin') {
      return [
        { id: 'dashboard', label: t('Boshqaruv Paneli', 'Dashboard', 'Панель Управления'), icon: <LayoutDashboard className="w-4 h-4" /> },
        { id: 'inquiries', label: t('Arizalar & Lids', 'Leads & Inquiries', 'Заявки и Лиды'), icon: <PhoneCall className="w-4 h-4 text-emerald-500" />, badge: newInquiriesCount > 0 ? newInquiriesCount : undefined },
        { id: 'landing', label: t('Lending Sayt CMS', 'Landing Page CMS', 'Редактор Лендинга'), icon: <LayoutTemplate className="w-4 h-4 text-amber-500" /> },
        { id: 'students', label: t("O'quvchilar", 'Students', 'Ученики'), icon: <Users className="w-4 h-4" /> },
        { id: 'classes', label: t("Guruhlar & Darslar", 'Classes & Groups', 'Группы и Занятия'), icon: <BookOpen className="w-4 h-4" /> },
        { id: 'payments', label: t("To'lovlar & Kontrakt", 'Tuition & Payments', 'Оплата и Контракты'), icon: <CreditCard className="w-4 h-4" /> },
        { id: 'payroll', label: t("Oylik Maosh & Harajatlar", 'Payroll & Expenses', 'Зарплаты и Расходы'), icon: <DollarSign className="w-4 h-4" /> },
        { id: 'telegram', label: t('Telegram Bot Suite', 'Telegram Bot Suite', 'Telegram Бот Панель'), icon: <Send className="w-4 h-4 text-blue-400" /> },
        { id: 'security', label: t("Xavfsizlik va PIN Kodlar", 'Security & PIN Codes', 'Безопасность и PIN-коды'), icon: <Settings className="w-4 h-4" /> }
      ];
    }

    if (activeRole === 'teacher') {
      return [
        { id: 'dashboard', label: t('Boshqaruv Paneli', 'Dashboard', 'Панель Управления'), icon: <LayoutDashboard className="w-4 h-4" /> },
        { id: 'classes', label: t("Mening Guruhlarim", 'My Classes', 'Мои Группы'), icon: <BookOpen className="w-4 h-4" /> },
        { id: 'attendance', label: t("1-Tap Davomat", '1-Tap Attendance', '1-Клик Посещаемость'), icon: <Calendar className="w-4 h-4" /> },
        { id: 'homework', label: t("Vazifalar & Audio", 'Homework & Audio Uploads', 'Задания и Аудио'), icon: <FileText className="w-4 h-4" /> },
        { id: 'gradebook', label: t("Bahlash & IELTS Scoring", 'Gradebook & IELTS Scoring', 'Журнал Оценок'), icon: <Award className="w-4 h-4" /> }
      ];
    }

    // Default: student
    return [
      { id: 'dashboard', label: t('Boshqaruv Paneli', 'Dashboard', 'Панель Управления'), icon: <LayoutDashboard className="w-4 h-4" /> },
      { id: 'feed', label: t("Guruh Lentasim", 'My Group Feed', 'Лента Группы'), icon: <Newspaper className="w-4 h-4" /> },
      { id: 'progress', label: t("O'zlashtirish Grafigi", 'Progress Graphs', 'График Успеваемости'), icon: <TrendingUp className="w-4 h-4" /> },
      { id: 'leaderboard', label: t("Guruh Reytingi", 'Class Leaderboard', 'Рейтинг Группы'), icon: <Award className="w-4 h-4" /> },
      { id: 'ai_tutor', label: t("24/7 AI Tutor Yordamchi", '24/7 AI Tutor Assistant', '24/7 AI Репетитор'), icon: <Sparkles className="w-4 h-4 text-amber-500" /> }
    ];
  };

  const navItems = getNavItems();
  const currentTabObj = navItems.find((n) => n.id === activeTab) || navItems[0];

  const handleNavigate = (tab: string) => {
    const normalized = tab.replace(/^\//, '');
    if (normalized === 'ai-tutor' || normalized === 'ai_tutor') {
      setActiveTab('ai_tutor');
    } else if (normalized === 'homework' || normalized === 'my-group-feed' || normalized === 'feed') {
      setActiveTab('feed');
    } else if (normalized === 'leaderboard' || normalized === 'class-leaderboard') {
      setActiveTab('leaderboard');
    } else if (normalized === 'mock-tests' || normalized === 'mock_tests' || normalized === 'progress') {
      setActiveTab('progress');
    } else if (normalized === 'landing-editor' || normalized === 'landing_editor' || normalized === 'landing-page' || normalized === 'landing') {
      setActiveTab('landing');
    } else {
      setActiveTab(normalized);
    }
  };

  return (
    <div className="relative min-h-screen text-slate-900 dark:text-slate-100 font-sans transition-colors duration-200">
      {/* Dynamic Background Layer with Theme Inversion for Light Mode */}
      <div
        className="fixed inset-0 pointer-events-none z-0 bg-cover bg-center bg-fixed transition-all duration-300"
        style={{
          backgroundImage: isDarkMode
            ? `linear-gradient(to bottom, rgba(15, 23, 42, 0.45), rgba(15, 23, 42, 0.65)), url('https://i.ibb.co/Wv1yrFwC/image.png')`
            : `linear-gradient(to bottom, rgba(248, 250, 252, 0.85), rgba(241, 245, 249, 0.92)), url('https://i.ibb.co/Wv1yrFwC/image.png')`,
          filter: isDarkMode ? 'none' : 'invert(0.85) hue-rotate(180deg) brightness(1.1)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundAttachment: 'fixed',
        }}
      />

      <div className="relative z-10 flex flex-col md:flex-row min-h-screen">
      
      {/* LEFT SIDEBAR */}
      <aside
        className={`fixed md:static inset-y-0 left-0 z-40 w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col justify-between transition-transform duration-300 ease-in-out ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        <div>
          {/* Brand Header */}
          <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-500 flex items-center justify-center text-slate-950 font-black shadow-lg shadow-amber-500/20">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <h1 className="font-extrabold text-base tracking-tight text-slate-900 dark:text-white leading-tight">
                  CenterFlow
                </h1>
                <p className="text-[10px] text-amber-600 dark:text-amber-400 font-bold uppercase tracking-wider">
                  Renessans LC Platform
                </p>
              </div>
            </div>

            <button
              onClick={() => setIsSidebarOpen(false)}
              className="md:hidden p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* User Profile Summary Box inside Sidebar */}
          <div className="p-4 mx-3 my-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-amber-500 to-amber-300 text-slate-950 font-extrabold flex items-center justify-center text-sm shadow-sm shrink-0">
                {displayName.charAt(0).toUpperCase()}
              </div>
              <div className="overflow-hidden">
                <h4 className="text-xs font-bold text-slate-900 dark:text-white truncate">
                  {displayName}
                </h4>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                  {email}
                </p>
              </div>
            </div>

            <div className="mt-2.5 pt-2 border-t border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between">
              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg border text-[10px] font-bold ${badge.bg}`}>
                {badge.icon}
                <span>{badge.label}</span>
              </span>

              {currentUser?.uid === SUPER_ADMIN_UUID && (
                <span className="text-[9px] font-mono text-amber-500 font-bold bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20">
                  SuperAdmin
                </span>
              )}
            </div>
          </div>

          {/* Navigation Menu */}
          <nav className="px-3 space-y-1">
            <p className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-2">
              {language === 'UZ' ? 'Boshqaruv Bo\'limlari' : 'Navigation Sections'}
            </p>
            {navItems.map((item) => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id);
                    if (window.innerWidth < 768) {
                      setIsSidebarOpen(false);
                    }
                  }}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
                    isActive
                      ? 'bg-amber-500 text-slate-950 font-bold shadow-md shadow-amber-500/10'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/80 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {item.icon}
                    <span>{item.label}</span>
                  </div>
                  {isActive && <ChevronRight className="w-4 h-4 opacity-70" />}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Sidebar Footer (Logout) */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800">
          <button
            onClick={() => logout()}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 border border-rose-500/20 transition cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>{t.nav.logout}</span>
          </button>
        </div>
      </aside>

      {/* RIGHT MAIN CONTAINER */}
      <div className="flex-1 flex flex-col min-w-0">
        
        {/* TOP HEADER BAR */}
        <Header
          currentTabLabel={currentTabObj.label}
          isSidebarOpen={isSidebarOpen}
          setIsSidebarOpen={setIsSidebarOpen}
          onOpenNotifications={() => setIsNotificationOpen(true)}
          unreadNotificationsCount={unreadNotifications}
        />

        {/* NOTIFICATION CENTER SLIDE-OVER DRAWER */}
        <NotificationCenter
          isOpen={isNotificationOpen}
          onClose={() => setIsNotificationOpen(false)}
          onNavigate={(route) => setActiveTab(route)}
        />


        {/* MAIN CONTENT AREA */}
        <main className="flex-1 p-4 sm:p-6 md:p-8 overflow-y-auto">
          {/* Student Role Pages */}
          {activeTab === 'feed' && <GroupFeed />}
          {activeTab === 'progress' && <ProgressGraphs />}
          {activeTab === 'leaderboard' && <Leaderboard />}
          {activeTab === 'ai_tutor' && (
            <AITutorView onBackToDashboard={() => setActiveTab('dashboard')} />
          )}

          {/* Teacher Role Pages */}
          {activeTab === 'attendance' && <TeacherAttendance />}
          {activeTab === 'homework' && <HomeworkView />}
          {activeTab === 'gradebook' && <GradebookView />}

          {/* Admin & SuperAdmin Role Pages */}
          {(activeTab === 'inquiries' || activeTab === 'leads') && <InquiriesView />}
          {activeTab === 'superadmin_control' && <SuperAdminControlView />}
          {(activeTab === 'landing' || activeTab === 'landing-editor' || activeTab === 'landing_editor') && <LandingPageCMSView />}
          {activeTab === 'students' && <StudentsPage />}
          {activeTab === 'payments' && <PaymentsPage />}
          {activeTab === 'payroll' && <PayrollView />}
          {activeTab === 'classes' && (
            activeRole === 'teacher' ? (
              <MyClassesView onNavigateToAttendance={() => setActiveTab('attendance')} />
            ) : (
              <ClassesView />
            )
          )}
          {activeTab === 'blog' && (
            (activeRole === 'admin' || activeRole === 'superadmin') ? (
              React.isValidElement(children)
                ? React.cloneElement(children as React.ReactElement<any>, { onNavigate: handleNavigate })
                : children
            ) : <BlogCMSView />
          )}
          {(activeTab === 'settings' || activeTab === 'security') && <SettingsView />}
          {activeTab === 'telegram' && <TelegramPanel />}

          {/* Fallback to Dashboard / children */}
          {(activeTab === 'dashboard' ||
            ![
              'feed',
              'progress',
              'leaderboard',
              'ai_tutor',
              'attendance',
              'homework',
              'gradebook',
              'superadmin_control',
              'landing',
              'landing-editor',
              'landing_editor',
              'students',
              'payments',
              'payroll',
              'classes',
              'blog',
              'settings',
              'security',
              'telegram'
            ].includes(activeTab)) &&
            (React.isValidElement(children)
              ? React.cloneElement(children as React.ReactElement<any>, { onNavigate: handleNavigate })
              : children)}
        </main>

        {/* FLOATING PRIME AI ASSISTANT TRIGGER BUTTON & WIDGET */}
        {activeTab !== 'ai_tutor' && (
          <>
            <button
              onClick={() => setIsAIFloatingOpen(!isAIFloatingOpen)}
              className="fixed bottom-6 right-6 z-50 p-3.5 rounded-full bg-amber-500 hover:bg-amber-400 text-slate-950 font-black shadow-2xl shadow-amber-500/30 border-2 border-amber-300 hover:scale-105 transition cursor-pointer flex items-center gap-2 group"
              title="Open CenterFlow Prime AI Assistant"
            >
              <Sparkles className="w-6 h-6 animate-pulse text-slate-950" />
              <span className="hidden group-hover:inline text-xs font-extrabold pr-1">
                AI Coach
              </span>
            </button>

            {isAIFloatingOpen && (
              <PrimeAIAssistant
                isOpen={isAIFloatingOpen}
                onClose={() => setIsAIFloatingOpen(false)}
              />
            )}
          </>
        )}

      </div>

    </div>
  </div>
);
};
