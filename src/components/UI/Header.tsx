import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
  GraduationCap,
  Search,
  ChevronDown,
  LifeBuoy
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
  const { currentUser, userProfile, activeRole, logout } = useAuth();
  const { language, setLanguage, t } = useLanguage();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const isDarkMode = theme === 'dark';
  const [profileOpen, setProfileOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const profileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  const handleLogout = async () => {
    setProfileOpen(false);
    try {
      await logout();
    } finally {
      navigate('/login', { replace: true });
    }
  };

  const displayName =
    userProfile?.displayName || currentUser?.displayName || currentUser?.email?.split('@')[0] || 'User';
  const email = currentUser?.email || '';

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
          label: 'ADMIN',
          bg: 'bg-purple-500/10 dark:bg-purple-500/20 text-purple-600 dark:text-purple-400 border-purple-500/30',
          icon: <ShieldCheck className="w-3.5 h-3.5 text-purple-500" />
        };
      case 'teacher':
        return {
          label: "O'QITUVCHI",
          bg: 'bg-blue-500/10 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 border-blue-500/30',
          icon: <UserCheck className="w-3.5 h-3.5 text-blue-500" />
        };
      case 'receptionist':
        return {
          label: 'RECEPTIONIST',
          bg: 'bg-sky-500/10 dark:bg-sky-500/20 text-sky-600 dark:text-sky-400 border-sky-500/30',
          icon: <LifeBuoy className="w-3.5 h-3.5 text-sky-500" />
        };
      case 'support':
        return {
          label: 'SUPPORT',
          bg: 'bg-slate-500/10 dark:bg-slate-500/20 text-slate-600 dark:text-slate-400 border-slate-500/30',
          icon: <LifeBuoy className="w-3.5 h-3.5 text-slate-500" />
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
    <header className="sticky top-0 z-30 min-h-16 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-4 md:px-8 py-2 flex items-center justify-between gap-3">
      {/* Left Header: Mobile Drawer Toggle & Dynamic Page Title */}
      <div className="flex items-center gap-3 min-w-0">
        <button
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="md:hidden p-2 rounded-xl text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer shrink-0"
          aria-label="Menyu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="min-w-0">
          <h2 className="text-sm md:text-base font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2 truncate">
            <span className="truncate">{currentTabLabel}</span>
            <span className={`hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-lg border text-[10px] font-bold shrink-0 ${badge.bg}`}>
              {badge.icon}
              <span>{badge.label}</span>
            </span>
          </h2>
          <p className="hidden sm:block text-[11px] text-slate-500 dark:text-slate-400 truncate">
            CenterFlow • Renessans Learning Center
          </p>
        </div>
      </div>

      {/* Right Header Controls: Search, Notifications, Language, Dark Mode, Profile, Logout */}
      <div className="flex items-center gap-2 sm:gap-3 min-w-0">
        {/* Role-scoped search (decorative slot — does not fabricate results).
            Parent views own filtering; this keeps the shell consistent. */}
        <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 min-w-0">
          <Search className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                window.dispatchEvent(new CustomEvent('centerflow-header-search', { detail: searchQuery.trim() }));
              }
            }}
            placeholder="Qidiruv..."
            className="w-32 xl:w-44 bg-transparent text-xs text-slate-800 dark:text-slate-200 placeholder:text-slate-400 focus:outline-none"
          />
        </div>

        {/* Notifications Bell */}
        <button
          onClick={onOpenNotifications}
          className="relative p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-amber-500 transition cursor-pointer border border-slate-200 dark:border-slate-700 shrink-0"
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
        <div className="hidden md:flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shrink-0">
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
          className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:text-amber-500 transition cursor-pointer border border-slate-200 dark:border-slate-700 shrink-0"
          title="Toggle Dark / Light Mode"
        >
          {isDarkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
        </button>

        {/* Interactive Dev Role Dropdown (dev only — renders null in production) */}
        <DevRoleDropdown className="hidden sm:inline-block" />

        {/* Profile menu — consistent across Admin/Teacher/Receptionist */}
        <div className="relative shrink-0" ref={profileRef}>
          <button
            onClick={() => setProfileOpen((v) => !v)}
            className="flex items-center gap-2 pl-1.5 pr-2 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-amber-400 transition cursor-pointer"
            aria-haspopup="true"
            aria-expanded={profileOpen}
            title="Profil"
          >
            <span className="w-7 h-7 rounded-lg bg-gradient-to-tr from-amber-500 to-amber-300 text-slate-950 font-extrabold flex items-center justify-center text-xs">
              {displayName.charAt(0).toUpperCase()}
            </span>
            <span className="hidden xl:block text-left leading-none">
              <span className="block text-[11px] font-bold text-slate-900 dark:text-white max-w-24 truncate">{displayName}</span>
              <span className="block text-[9px] font-bold text-slate-500 dark:text-slate-400">{badge.label}</span>
            </span>
            <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${profileOpen ? 'rotate-180' : ''}`} />
          </button>
          {profileOpen && (
            <div className="absolute right-0 mt-2 w-60 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-2xl py-2 z-50">
              <div className="px-4 py-2.5 border-b border-slate-100 dark:border-slate-800">
                <div className="text-xs font-bold text-slate-900 dark:text-white truncate">{displayName}</div>
                {email && <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">{email}</div>}
                <div className={`mt-1.5 inline-flex items-center gap-1 px-2 py-0.5 rounded-lg border text-[10px] font-bold ${badge.bg}`}>
                  {badge.icon}
                  <span>{badge.label}</span>
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-2 px-4 py-2.5 text-xs font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 transition cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>{t.nav.logout}</span>
              </button>
            </div>
          )}
        </div>

        {/* Header Logout Button — always accessible */}
        <button
          onClick={handleLogout}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 text-xs font-bold border border-rose-500/30 transition cursor-pointer shrink-0"
          title="Sign Out"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">{t.nav.logout}</span>
        </button>
      </div>
    </header>
  );
};
