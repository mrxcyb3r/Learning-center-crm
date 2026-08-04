import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { useTheme } from '../../context/ThemeContext';
import { DevRoleDropdown } from '../DevRoleDropdown';
import {
  Bell,
  Menu,
  Globe,
  Sun,
  Moon,
  LogOut,
  ShieldAlert,
  ShieldCheck,
  UserCheck,
  GraduationCap
} from 'lucide-react';
import { UserRole } from '../../types';

interface HeaderProps {
  currentTabLabel: string;
  isSidebarOpen: boolean;
  setIsSidebarOpen: (open: boolean) => void;
  onOpenNotifications: () => void;
  unreadNotificationsCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  currentTabLabel,
  isSidebarOpen,
  setIsSidebarOpen,
  onOpenNotifications,
  unreadNotificationsCount
}) => {
  const { activeRole, logout } = useAuth();
  const { language, setLanguage, t } = useLanguage();
  const { theme, toggleTheme } = useTheme();
  const isDarkMode = theme === 'dark';

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
          bg: 'bg-amber-500/10 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 border-amber-500/30',
          icon: <GraduationCap className="w-3.5 h-3.5 text-amber-500" />
        };
    }
  };

  const badge = getRoleBadge(activeRole);

  return (
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
            <span>{currentTabLabel}</span>
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
          onClick={onOpenNotifications}
          className="relative p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-amber-500 transition cursor-pointer border border-slate-200 dark:border-slate-700"
          title="Notification Center"
        >
          <Bell className="w-4 h-4" />
          {unreadNotificationsCount > 0 && (
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-rose-500 text-white rounded-full text-[9px] font-bold flex items-center justify-center animate-pulse">
              {unreadNotificationsCount}
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
          <button
            onClick={() => setLanguage('RU')}
            className={`px-2 py-0.5 text-[11px] font-bold rounded-lg transition cursor-pointer ${
              language === 'RU'
                ? 'bg-amber-500 text-slate-950 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            RU
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

        {/* Interactive Dev Role Dropdown */}
        <DevRoleDropdown className="hidden sm:inline-block" />

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
  );
};
