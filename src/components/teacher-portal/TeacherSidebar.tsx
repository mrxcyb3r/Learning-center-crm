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
import { useLanguage } from '../../context/LanguageContext';
import { TeacherTab } from '../../types/teacher';

interface TeacherSidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

const NAV_ITEMS: { tab: TeacherTab; icon: React.ReactNode; labelUz: string; labelEn: string; labelRu: string; groupUz: string; groupEn: string; groupRu: string }[] = [
  { tab: 'dashboard', icon: <LayoutDashboard className="w-5 h-5" aria-hidden="true" />, labelUz: 'Bosh sahifa', labelEn: 'Dashboard', labelRu: 'Главная', groupUz: 'Boshqaruv', groupEn: 'Manage', groupRu: 'Управление' },
  { tab: 'groups', icon: <Users className="w-5 h-5" aria-hidden="true" />, labelUz: 'Mening guruhlarim', labelEn: 'My Groups', labelRu: 'Мои группы', groupUz: 'O‘qitish', groupEn: 'Teaching', groupRu: 'Обучение' },
  { tab: 'students', icon: <UserCog className="w-5 h-5" aria-hidden="true" />, labelUz: 'O‘quvchilarim', labelEn: 'My Students', labelRu: 'Мои ученики', groupUz: 'O‘qitish', groupEn: 'Teaching', groupRu: 'Обучение' },
  { tab: 'timetable', icon: <Calendar className="w-5 h-5" aria-hidden="true" />, labelUz: 'Dars jadvali', labelEn: 'Timetable', labelRu: 'Расписание', groupUz: 'O‘qitish', groupEn: 'Teaching', groupRu: 'Обучение' },
  { tab: 'attendance', icon: <CheckSquare className="w-5 h-5" aria-hidden="true" />, labelUz: 'Davomat', labelEn: 'Attendance', labelRu: 'Посещаемость', groupUz: 'O‘qitish', groupEn: 'Teaching', groupRu: 'Обучение' },
  { tab: 'payments', icon: <DollarSign className="w-5 h-5" aria-hidden="true" />, labelUz: 'O‘quvchi to‘lovlari', labelEn: 'Teacher Payments', labelRu: 'Оплаты', groupUz: 'Moliya', groupEn: 'Finance', groupRu: 'Финансы' },
  { tab: 'income', icon: <TrendingUp className="w-5 h-5" aria-hidden="true" />, labelUz: 'Oylik va daromad', labelEn: 'Salary & Income', labelRu: 'Зарплата и доход', groupUz: 'Moliya', groupEn: 'Finance', groupRu: 'Финансы' },
  { tab: 'announcements', icon: <Bell className="w-5 h-5" aria-hidden="true" />, labelUz: 'E’lonlar', labelEn: 'Announcements', labelRu: 'Объявления', groupUz: 'Tashkiliy', groupEn: 'Organization', groupRu: 'Организация' },
  { tab: 'tasks', icon: <ListTodo className="w-5 h-5" aria-hidden="true" />, labelUz: 'Vazifalar', labelEn: 'Tasks', labelRu: 'Задачи', groupUz: 'Tashkiliy', groupEn: 'Organization', groupRu: 'Организация' },
  { tab: 'documents', icon: <FileText className="w-5 h-5" aria-hidden="true" />, labelUz: 'Hujjatlar', labelEn: 'Documents', labelRu: 'Документы', groupUz: 'Tashkiliy', groupEn: 'Organization', groupRu: 'Организация' },
  { tab: 'analytics', icon: <BarChart3 className="w-5 h-5" aria-hidden="true" />, labelUz: 'Tahlil', labelEn: 'Analytics', labelRu: 'Аналитика', groupUz: 'Tizim', groupEn: 'System', groupRu: 'Система' },
  { tab: 'profile', icon: <User className="w-5 h-5" aria-hidden="true" />, labelUz: 'Profil', labelEn: 'Profile', labelRu: 'Профиль', groupUz: 'Tizim', groupEn: 'System', groupRu: 'Система' },
  { tab: 'settings', icon: <Settings className="w-5 h-5" aria-hidden="true" />, labelUz: 'Sozlamalar', labelEn: 'Teacher Settings', labelRu: 'Настройки', groupUz: 'Tizim', groupEn: 'System', groupRu: 'Система' },
];

export const TeacherSidebar: React.FC<TeacherSidebarProps> = ({ collapsed, onToggle }) => {
  const { activeTab, setActiveTab } = useTeacherPortal();
  const { theme } = useTheme();
  const { language } = useLanguage();
  const label = (item: (typeof NAV_ITEMS)[number]) => (language === 'EN' ? item.labelEn : language === 'RU' ? item.labelRu : item.labelUz);
  const groupName = (item: (typeof NAV_ITEMS)[number]) => (language === 'EN' ? item.groupEn : language === 'RU' ? item.groupRu : item.groupUz);

  const groups = NAV_ITEMS.reduce<Record<string, typeof NAV_ITEMS>>((acc, item) => {
    const key = groupName(item);
    if (!acc[key]) acc[key] = [];
    acc[key].push(item);
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
            <div className={`text-sm font-black tracking-tight leading-none ${
              theme === 'dark' ? 'text-white' : 'text-slate-900'
            }`}>
              RENESSANS
            </div>
            <div className="text-[9px] font-bold text-amber-500 uppercase tracking-widest mt-1">
              {language === 'EN' ? 'Teacher' : language === 'RU' ? 'Учитель' : 'O‘qituvchi'}
            </div>
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
                    ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 shadow-sm'
                    : theme === 'dark'
                    ? 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
                title={collapsed ? label(item) : undefined}
              >
                <span className="flex-shrink-0" aria-hidden="true">{item.icon}</span>{' '}
                {!collapsed && (
                  <span className="text-sm font-semibold truncate">{label(item)}</span>
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
