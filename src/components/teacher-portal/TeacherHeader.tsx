import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, Search, Moon, Sun, LogOut, Menu, X } from 'lucide-react';
import { useTeacherPortal } from '../../context/TeacherPortalContext';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';

interface TeacherHeaderProps {
  onMenuToggle: () => void;
  mobileMenuOpen: boolean;
}

export const TeacherHeader: React.FC<TeacherHeaderProps> = ({ onMenuToggle, mobileMenuOpen }) => {
  const { teacherName } = useTeacherPortal();
  const { theme, toggleTheme } = useTheme();
  const { currentUser, userProfile, logout } = useAuth();
  const { language, setLanguage } = useLanguage();
  const t = (uz: string, en: string, ru: string) => (language === 'EN' ? en : language === 'RU' ? ru : uz);
  const navigate = useNavigate();
  const [showNotifications, setShowNotifications] = useState(false);

  const handleLogout = async () => {
    try {
      await logout();
    } finally {
      navigate('/login', { replace: true });
    }
  };

  const displayName = userProfile?.displayName || currentUser?.displayName || teacherName || t('O‘qituvchi', 'Teacher', 'Учитель');

  return (
    <header
      className={`sticky top-0 z-20 min-h-16 flex items-center justify-between gap-3 px-4 sm:px-6 py-2 transition-colors border-b ${
        theme === 'dark'
          ? 'bg-slate-950/95 backdrop-blur-md border-slate-800'
          : 'bg-white/95 backdrop-blur-md border-slate-200'
      }`}
    >
      {/* Left: Mobile Menu + Workspace indicator */}
      <div className="flex items-center gap-3 min-w-0">
        <button
          onClick={onMenuToggle}
          className={`lg:hidden p-2 rounded-xl transition cursor-pointer shrink-0 ${
            theme === 'dark' ? 'text-slate-400 hover:bg-slate-800' : 'text-slate-600 hover:bg-slate-100'
          }`}
          aria-label={t('Menyu', 'Menu', 'Меню')}
        >
          {mobileMenuOpen ? <X className="w-5 h-5" aria-hidden="true" /> : <Menu className="w-5 h-5" aria-hidden="true" />}
        </button>

        <div className="min-w-0">
          <span className="text-sm font-extrabold tracking-tight truncate block" style={{ color: theme === 'dark' ? '#fff' : '#0f172a' }}>
            {t('O‘qituvchi paneli', 'Teacher Portal', 'Панель преподавателя')}
          </span>
          <p className="hidden sm:block text-[11px] text-slate-500 dark:text-slate-400 truncate">
            <span>CenterFlow</span>
            <span className="mx-1.5 text-slate-400">·</span>
            <span>{t('Renessans Ta’lim Markazi', 'Renessans Learning Center', 'Учебный Центр Renessans')}</span>
          </p>
        </div>

        {/* Desktop search slot */}
        <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 ml-2">
          <Search className="w-3.5 h-3.5 text-slate-400 shrink-0" aria-hidden="true" />
          <input
            placeholder={t('Qidiruv...', 'Search...', 'Поиск...')}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                window.dispatchEvent(new CustomEvent('centerflow-header-search', { detail: (e.target as HTMLInputElement).value.trim() }));
              }
            }}
            className="w-32 xl:w-44 bg-transparent text-xs text-slate-800 dark:text-slate-200 placeholder:text-slate-400 focus:outline-none"
          />
        </div>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-2 shrink-0">
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

        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          className={`p-2.5 rounded-xl transition cursor-pointer ${
            theme === 'dark'
              ? 'text-slate-400 hover:text-white hover:bg-slate-800'
              : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
          }`}
          title={t('Mavzu', 'Theme', 'Тема')}
          aria-label={t('Mavzu', 'Theme', 'Тема')}
        >
          {theme === 'dark' ? <Sun className="w-4 h-4" aria-hidden="true" /> : <Moon className="w-4 h-4" aria-hidden="true" />}
        </button>

        {/* Notifications */}
        <button
          onClick={() => setShowNotifications(!showNotifications)}
          className={`relative p-2.5 rounded-xl transition cursor-pointer ${
            theme === 'dark'
              ? 'text-slate-400 hover:text-white hover:bg-slate-800'
              : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
          }`}
          title={t('Bildirishnomalar', 'Notifications', 'Уведомления')}
          aria-label={t('Bildirishnomalar', 'Notifications', 'Уведомления')}
        >
          <Bell className="w-4 h-4" aria-hidden="true" />
        </button>

        {/* Teacher Avatar + profile */}
        <div className="flex items-center gap-2.5 pl-3 border-l border-slate-200 dark:border-slate-800">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
            {displayName.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()}
          </div>
          <div className="hidden sm:block leading-none">
            <span className={`text-xs font-bold block leading-none truncate max-w-28 ${
              theme === 'dark' ? 'text-white' : 'text-slate-900'
            }`}>
              {displayName}
            </span>
            <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
              {t('O‘qituvchi', 'Teacher', 'Учитель')}
            </span>
          </div>
        </div>

        {/* Logout */}
        <button
          onClick={handleLogout}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 text-xs font-bold border border-rose-500/30 transition cursor-pointer"
          title={t('Chiqish', 'Sign Out', 'Выход')}
          aria-label={t('Chiqish', 'Sign Out', 'Выход')}
        >
          <LogOut className="w-3.5 h-3.5" aria-hidden="true" />
          <span className="hidden sm:inline">{t('Chiqish', 'Sign Out', 'Выход')}</span>
        </button>
      </div>
    </header>
  );
};
