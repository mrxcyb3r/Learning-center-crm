import React, { useState } from 'react';
import { Bell, Search, Moon, Sun, LogOut, Menu, X } from 'lucide-react';
import { useTeacherPortal } from '../../context/TeacherPortalContext';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';

interface TeacherHeaderProps {
  onMenuToggle: () => void;
  mobileMenuOpen: boolean;
}

export const TeacherHeader: React.FC<TeacherHeaderProps> = ({ onMenuToggle, mobileMenuOpen }) => {
  const { teacherName } = useTeacherPortal();
  const { theme, toggleTheme } = useTheme();
  const { currentUser, logout } = useAuth();
  const [showNotifications, setShowNotifications] = useState(false);

  return (
    <header
      className={`sticky top-0 z-20 h-16 flex items-center justify-between px-4 sm:px-6 transition-colors border-b ${
        theme === 'dark'
          ? 'bg-slate-950/95 backdrop-blur-md border-slate-800'
          : 'bg-white/95 backdrop-blur-md border-slate-200'
      }`}
    >
      {/* Left: Mobile Menu + Demo Banner */}
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuToggle}
          className={`lg:hidden p-2 rounded-xl transition cursor-pointer ${
            theme === 'dark' ? 'text-slate-400 hover:bg-slate-800' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>

        
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-2">
        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          className={`p-2.5 rounded-xl transition cursor-pointer ${
            theme === 'dark'
              ? 'text-slate-400 hover:text-white hover:bg-slate-800'
              : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>

        {/* Notifications */}
        <button
          onClick={() => setShowNotifications(!showNotifications)}
          className={`relative p-2.5 rounded-xl transition cursor-pointer ${
            theme === 'dark'
              ? 'text-slate-400 hover:text-white hover:bg-slate-800'
              : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Bell className="w-4 h-4" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-500" />
        </button>

        {/* Teacher Avatar */}
        <div className="flex items-center gap-2.5 pl-3 border-l border-slate-200 dark:border-slate-800">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-xs font-bold">
            {teacherName.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()}
          </div>
          <div className="hidden sm:block">
            <span className={`text-xs font-bold block leading-none ${
              theme === 'dark' ? 'text-white' : 'text-slate-900'
            }`}>
              {teacherName}
            </span>
            <span className="text-[10px] font-semibold text-blue-500">O'qituvchi</span>
          </div>
        </div>

        {/* Logout */}
        {currentUser && (
          <button
            onClick={() => logout()}
            className={`p-2.5 rounded-xl transition cursor-pointer ${
              theme === 'dark'
                ? 'text-slate-500 hover:text-rose-400 hover:bg-slate-800'
                : 'text-slate-400 hover:text-rose-500 hover:bg-slate-100'
            }`}
            title="Chiqish"
          >
            <LogOut className="w-4 h-4" />
          </button>
        )}
      </div>
    </header>
  );
};
