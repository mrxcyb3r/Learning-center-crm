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
import { HomeworkView } from '../../pages/teacher/HomeworkView';
import { GradebookView } from '../../pages/teacher/GradebookView';

// Admin Page Views
import { SuperAdminControlView } from '../../pages/admin/SuperAdminControlView';
import { PayrollView } from '../../pages/admin/PayrollView';
import { ClassesView } from '../../pages/admin/ClassesView';
import { BlogCMSView } from '../../pages/admin/BlogCMSView';
import { SettingsView } from '../../pages/admin/SettingsView';
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
  Key,
  DollarSign,
  TrendingUp,
  Sparkles
} from 'lucide-react';
import { UserRole } from '../../types';

interface AppLayoutProps {
  children: React.ReactNode;
}

export const AppLayout: React.FC<AppLayoutProps> = ({ children }) => {
  const { currentUser, userProfile, activeRole, setMockRole, logout } = useAuth();
  const { language, setLanguage, t } = useLanguage();
  const { isDarkMode, toggleTheme } = useTheme();

  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [unreadNotifications, setUnreadNotifications] = useState(3);
  const [isAIFloatingOpen, setIsAIFloatingOpen] = useState(false);

  // Reset active tab to dashboard when activeRole changes
  useEffect(() => {
    setActiveTab('dashboard');
  }, [activeRole]);

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
    const isUz = language === 'UZ';

    if (activeRole === 'superadmin') {
      return [
        { id: 'dashboard', label: isUz ? 'Boshqaruv Paneli' : 'Dashboard', icon: <LayoutDashboard className="w-4 h-4" /> },
        { id: 'superadmin_control', label: isUz ? 'SuperAdmin Boshqaruvi' : 'SuperAdmin Control', icon: <ShieldAlert className="w-4 h-4 text-rose-500" /> },
        { id: 'students', label: isUz ? "O'quvchilar" : 'Students', icon: <Users className="w-4 h-4" /> },
        { id: 'payments', label: isUz ? "To'lovlar & Kontrakt" : 'Tuition & Payments', icon: <CreditCard className="w-4 h-4" /> },
        { id: 'payroll', label: isUz ? "Oylik Maosh & Harajatlar" : 'Payroll & Expenses', icon: <DollarSign className="w-4 h-4" /> },
        { id: 'classes', label: isUz ? "Guruhlar & Darslar" : 'Classes & Groups', icon: <BookOpen className="w-4 h-4" /> },
        { id: 'homework', label: isUz ? "Vazifalar & Media" : 'Homework & Media', icon: <FileText className="w-4 h-4" /> },
        { id: 'blog', label: isUz ? "Blog CMS" : 'Blog CMS', icon: <Newspaper className="w-4 h-4" /> },
        { id: 'settings', label: isUz ? "Sozlamalar & PIN" : 'Settings & Security PINs', icon: <Settings className="w-4 h-4" /> }
      ];
    }

    if (activeRole === 'admin') {
      return [
        { id: 'dashboard', label: isUz ? 'Boshqaruv Paneli' : 'Dashboard', icon: <LayoutDashboard className="w-4 h-4" /> },
        { id: 'students', label: isUz ? "O'quvchilar" : 'Students', icon: <Users className="w-4 h-4" /> },
        { id: 'payments', label: isUz ? "To'lovlar & Qarzdorlar" : 'Tuition & Debtor List', icon: <CreditCard className="w-4 h-4" /> },
        { id: 'payroll', label: isUz ? "Oylik Maosh & Harajatlar" : 'Payroll & Expenses', icon: <DollarSign className="w-4 h-4" /> },
        { id: 'blog', label: isUz ? "Blog CMS" : 'Blog CMS', icon: <Newspaper className="w-4 h-4" /> }
      ];
    }

    if (activeRole === 'teacher') {
      return [
        { id: 'dashboard', label: isUz ? 'Boshqaruv Paneli' : 'Dashboard', icon: <LayoutDashboard className="w-4 h-4" /> },
        { id: 'classes', label: isUz ? "Mening Guruhlarim" : 'My Classes', icon: <BookOpen className="w-4 h-4" /> },
        { id: 'attendance', label: isUz ? "1-Tap Davomat" : '1-Tap Attendance', icon: <Calendar className="w-4 h-4" /> },
        { id: 'homework', label: isUz ? "Vazifalar & Audio" : 'Homework & Audio Uploads', icon: <FileText className="w-4 h-4" /> },
        { id: 'gradebook', label: isUz ? "Bahlash & IELTS Scoring" : 'Gradebook & IELTS Scoring', icon: <Award className="w-4 h-4" /> }
      ];
    }

    // Default: student
    return [
      { id: 'dashboard', label: isUz ? 'Boshqaruv Paneli' : 'Dashboard', icon: <LayoutDashboard className="w-4 h-4" /> },
      { id: 'feed', label: isUz ? "Guruh Lentasim" : 'My Group Feed', icon: <Newspaper className="w-4 h-4" /> },
      { id: 'progress', label: isUz ? "O'zlashtirish Grafigi" : 'Progress Graphs', icon: <TrendingUp className="w-4 h-4" /> },
      { id: 'leaderboard', label: isUz ? "Guruh Reytingi" : 'Class Leaderboard', icon: <Award className="w-4 h-4" /> },
      { id: 'ai_tutor', label: isUz ? "24/7 AI Tutor Yordamchi" : '24/7 AI Tutor Assistant', icon: <Sparkles className="w-4 h-4 text-amber-500" /> }
    ];
  };

  const navItems = getNavItems();
  const currentTabObj = navItems.find((n) => n.id === activeTab) || navItems[0];

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col md:flex-row font-sans transition-colors duration-200">
      
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
                  onClick={() => setActiveTab(item.id)}
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
        <header className="sticky top-0 z-30 h-16 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-4 md:px-8 flex items-center justify-between">
          
          {/* Left Header: Mobile Drawer Toggle & Dynamic Page Title */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="md:hidden p-2 rounded-xl text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
            >
              <Menu className="w-5 h-5" />
            </button>

            <div>
              <h2 className="text-sm md:text-base font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                <span>{currentTabObj.label}</span>
              </h2>
              <p className="hidden sm:block text-[11px] text-slate-500 dark:text-slate-400">
                Renessans Learning Center • Toshkent
              </p>
            </div>
          </div>

          {/* Right Header Controls: Notifications, Language, Dark Mode, Role Badge, Logout */}
          <div className="flex items-center gap-2 sm:gap-3">
            
            {/* Notifications Bell */}
            <button
              onClick={() => setUnreadNotifications(0)}
              className="relative p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-amber-500 transition cursor-pointer border border-slate-200 dark:border-slate-700"
              title="Notifications"
            >
              <Bell className="w-4 h-4" />
              {unreadNotifications > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-rose-500 text-white rounded-full text-[9px] font-bold flex items-center justify-center animate-pulse">
                  {unreadNotifications}
                </span>
              )}
            </button>

            {/* Language Switcher */}
            <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
              <Globe className="w-3.5 h-3.5 text-amber-500 ml-1" />
              <button
                onClick={() => setLanguage('UZ')}
                className={`px-2 py-0.5 text-[11px] font-bold rounded-lg transition cursor-pointer ${
                  language === 'UZ'
                    ? 'bg-amber-500 text-slate-950 shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                UZ
              </button>
              <button
                onClick={() => setLanguage('EN')}
                className={`px-2 py-0.5 text-[11px] font-bold rounded-lg transition cursor-pointer ${
                  language === 'EN'
                    ? 'bg-amber-500 text-slate-950 shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                EN
              </button>
            </div>

            {/* Dark Mode Toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:text-amber-500 transition cursor-pointer border border-slate-200 dark:border-slate-700"
              title="Toggle Dark / Light Mode"
            >
              {isDarkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
            </button>

            {/* User Role Badge */}
            <div className={`hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-bold ${badge.bg}`}>
              {badge.icon}
              <span>{badge.label}</span>
            </div>

            {/* Header Logout Button */}
            <button
              onClick={() => logout()}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 text-xs font-bold border border-rose-500/30 transition cursor-pointer"
              title="Sign Out"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{t.nav.logout}</span>
            </button>
          </div>
        </header>

        {/* MAIN CONTENT AREA */}
        <main className="flex-1 p-4 sm:p-6 md:p-8 overflow-y-auto">
          {/* Student Role Pages */}
          {activeTab === 'feed' && <GroupFeed />}
          {activeTab === 'progress' && <ProgressGraphs />}
          {activeTab === 'leaderboard' && <Leaderboard />}
          {activeTab === 'ai_tutor' && <AITutorView />}

          {/* Teacher Role Pages */}
          {activeTab === 'attendance' && <TeacherAttendance />}
          {activeTab === 'homework' && <HomeworkView />}
          {activeTab === 'gradebook' && <GradebookView />}

          {/* Admin & SuperAdmin Role Pages */}
          {activeTab === 'superadmin_control' && <SuperAdminControlView />}
          {activeTab === 'students' && <StudentsPage />}
          {activeTab === 'payments' && <PaymentsPage />}
          {activeTab === 'payroll' && <PayrollView />}
          {activeTab === 'classes' && (
            activeRole === 'teacher' ? <TeacherAttendance /> : <ClassesView />
          )}
          {activeTab === 'blog' && <BlogCMSView />}
          {activeTab === 'settings' && <SettingsView />}

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
              'students',
              'payments',
              'payroll',
              'classes',
              'blog',
              'settings'
            ].includes(activeTab)) && children}
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
  );
};
