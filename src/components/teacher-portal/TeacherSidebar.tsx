import React, { useState } from 'react';
import {
  LayoutDashboard,
  Users,
  UserCog,
  Calendar,
  CheckSquare,
  DollarSign,
  TrendingUp,
  Bell,
  ListTodo,
  FileText,
  User,
  BarChart3,
  Settings,
  ChevronLeft,
  ChevronRight,
  LogOut,
} from 'lucide-react';
import { useTeacherPortal } from '../../context/TeacherPortalContext';
import { useTheme } from '../../context/ThemeContext';
import { TeacherTab } from '../../types/teacher';

interface TeacherSidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

const NAV_ITEMS: { tab: TeacherTab; icon: React.ReactNode; labelUz: string; labelEn: string; group: string }[] = [
  { tab: 'dashboard', icon: <LayoutDashboard className="w-5 h-5" />, labelUz: 'Boshqaruv', labelEn: 'Dashboard', group: 'Boshqaruv' },
  { tab: 'groups', icon: <Users className="w-5 h-5" />, labelUz: 'Guruhlarim', labelEn: 'My Groups', group: "Ta'lim" },
  { tab: 'students', icon: <UserCog className="w-5 h-5" />, labelUz: "O'quvchilarim", labelEn: 'My Students', group: "Ta'lim" },
  { tab: 'timetable', icon: <Calendar className="w-5 h-5" />, labelUz: 'Dars Jadvali', labelEn: 'Timetable', group: "Ta'lim" },
  { tab: 'attendance', icon: <CheckSquare className="w-5 h-5" />, labelUz: 'Davomat', labelEn: 'Attendance', group: 'Faoliyat' },
  { tab: 'payments', icon: <DollarSign className="w-5 h-5" />, labelUz: "To'lovlar", labelEn: 'Payments', group: 'Faoliyat' },
  { tab: 'income', icon: <TrendingUp className="w-5 h-5" />, labelUz: 'Daromad', labelEn: 'Income', group: 'Faoliyat' },
  { tab: 'announcements', icon: <Bell className="w-5 h-5" />, labelUz: "E'lonlar", labelEn: 'Announcements', group: 'Aloqa' },
  { tab: 'tasks', icon: <ListTodo className="w-5 h-5" />, labelUz: 'Vazifalar', labelEn: 'Tasks', group: 'Yordamchi' },
  { tab: 'documents', icon: <FileText className="w-5 h-5" />, labelUz: 'Hujjatlar', labelEn: 'Documents', group: 'Yordamchi' },
  { tab: 'analytics', icon: <BarChart3 className="w-5 h-5" />, labelUz: 'Tahlil', labelEn: 'Analytics', group: 'Yordamchi' },
  { tab: 'profile', icon: <User className="w-5 h-5" />, labelUz: 'Profil', labelEn: 'Profile', group: 'Yordamchi' },
  { tab: 'settings', icon: <Settings className="w-5 h-5" />, labelUz: 'Sozlamalar', labelEn: 'Settings', group: 'Yordamchi' },
];

export const TeacherSidebar: React.FC<TeacherSidebarProps> = ({ collapsed, onToggle }) => {
  const { activeTab, setActiveTab } = useTeacherPortal();
  const { theme } = useTheme();

  const groups = NAV_ITEMS.reduce<Record<string, typeof NAV_ITEMS>>((acc, item) => {
    if (!acc[item.group]) acc[item.group] = [];
    acc[item.group].push(item);
    return acc;
  }, {});

  return (
    <aside
      className={`fixed left-0 top-0 h-full z-30 flex flex-col transition-all duration-300 ${
        collapsed ? 'w-[68px]' : 'w-[260px]'
      } ${
        theme === 'dark'
          ? 'bg-slate-950 border-r border-slate-800'
          : 'bg-white border-r border-slate-200'
      }`}
    >
      {/* Brand */}
      <div className={`h-16 flex items-center ${collapsed ? 'justify-center px-2' : 'px-5'} border-b ${
        theme === 'dark' ? 'border-slate-800' : 'border-slate-200'
      }`}>
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-500 to-emerald-600 flex items-center justify-center text-white font-black text-sm shadow-lg shadow-amber-500/20 flex-shrink-0">
          R
        </div>
        {!collapsed && (
          <div className="ml-3 overflow-hidden">
            <span className={`text-sm font-black tracking-tight block leading-none ${
              theme === 'dark' ? 'text-white' : 'text-slate-900'
            }`}>
              RENESSANS
            </span>
            <span className="text-[9px] font-bold text-amber-500 uppercase tracking-widest">
              O'qituvchi
            </span>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-1">
        {Object.entries(groups).map(([group, items]) => (
          <div key={group}>
            {!collapsed && (
              <div className={`text-[10px] font-bold uppercase tracking-widest px-3 pt-3 pb-1 ${
                theme === 'dark' ? 'text-slate-500' : 'text-slate-400'
              }`}>
                {group}
              </div>
            )}
            {items.map((item) => (
              <button
                key={item.tab}
                onClick={() => setActiveTab(item.tab)}
                className={`w-full flex items-center gap-3 rounded-xl transition-all duration-200 cursor-pointer group ${
                  collapsed ? 'justify-center px-2 py-2.5' : 'px-3 py-2.5'
                } ${
                  activeTab === item.tab
                    ? 'bg-blue-500/10 text-blue-500 shadow-sm'
                    : theme === 'dark'
                    ? 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
                title={collapsed ? item.labelUz : undefined}
              >
                <span className="flex-shrink-0">{item.icon}</span>
                {!collapsed && (
                  <span className="text-sm font-semibold truncate">{item.labelUz}</span>
                )}
              </button>
            ))}
          </div>
        ))}
      </nav>

      {/* Collapse Toggle */}
      <div className={`p-2 border-t ${theme === 'dark' ? 'border-slate-800' : 'border-slate-200'}`}>
        <button
          onClick={onToggle}
          className={`w-full flex items-center justify-center py-2 rounded-xl transition cursor-pointer ${
            theme === 'dark'
              ? 'text-slate-500 hover:text-white hover:bg-slate-800'
              : 'text-slate-400 hover:text-slate-700 hover:bg-slate-100'
          }`}
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>
    </aside>
  );
};
