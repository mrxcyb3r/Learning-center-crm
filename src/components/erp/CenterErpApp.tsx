import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import {
  LayoutDashboard,
  PhoneCall,
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
} from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { DashboardView } from './DashboardView';
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
import { AdminErrorBoundary } from '../common/AdminErrorBoundary';
import { crmService } from '../../services/crmService';

type ErpTab =
  | 'dashboard'
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
  | 'settings';

const SIDEBAR_ITEMS: { id: ErpTab; label: string; icon: React.FC<{ className?: string }>; badge?: string }[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'leads', label: 'Leads CRM', icon: PhoneCall, badge: 'NEW' },
  { id: 'students', label: 'Students', icon: Users },
  { id: 'teachers', label: 'Teachers', icon: GraduationCap },
  { id: 'courses', label: 'Courses & Fees', icon: BookOpen },
  { id: 'schedule', label: 'Groups & Timetable', icon: Calendar },
  { id: 'payments', label: 'Payments', icon: CreditCard },
  { id: 'expenses', label: 'Expenses & Salaries', icon: DollarSign },
  { id: 'reports', label: 'Reports & Analytics', icon: BarChart3 },
  { id: 'cms', label: 'Website CMS', icon: Globe },
  { id: 'telegram', label: 'Telegram Bot', icon: Send },
  { id: 'settings', label: 'Settings', icon: Settings },
];

export const CenterErpApp: React.FC = () => {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const [activeTab, setActiveTab] = useState<ErpTab>('dashboard');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Quick lead state
  const leadsCount = crmService.getLeads().filter((l) => l.status === 'New').length;

  const renderActiveView = () => {
    switch (activeTab) {
      case 'dashboard':
        return <DashboardView onNavigateTab={(tab) => setActiveTab(tab as ErpTab)} />;
      case 'leads':
        return <LeadsCrmView />;
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
              <div className="w-9 h-9 rounded-2xl bg-amber-500 text-slate-950 font-black flex items-center justify-center text-base shadow-md shadow-amber-500/20">
                R
              </div>
              <div>
                <span className="font-black text-base tracking-tight text-slate-900 dark:text-white block leading-none">
                  RENESSANS
                </span>
                <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider block mt-0.5">
                  Learning Center ERP
                </span>
              </div>
            </div>

            <button
              onClick={() => setMobileMenuOpen(false)}
              className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Navigation Items */}
          <nav className="space-y-1">
            {SIDEBAR_ITEMS.map((item) => {
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
          </nav>
        </div>

        {/* Sidebar Bottom Controls */}
        <div className="pt-6 border-t border-slate-100 dark:border-slate-800 space-y-3">
          {/* Return to Public Website */}
          <button
            onClick={() => navigate('/')}
            className="w-full py-2.5 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold flex items-center justify-center gap-2 transition cursor-pointer border border-slate-200 dark:border-slate-700"
          >
            <Globe className="w-3.5 h-3.5 text-amber-500" />
            <span>View Public Website</span>
            <ExternalLink className="w-3 h-3 text-slate-400" />
          </button>

          {/* User profile brief */}
          <div className="flex items-center justify-between px-1 text-xs">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center font-bold text-slate-700 dark:text-slate-200 text-xs">
                D
              </div>
              <div>
                <span className="font-bold text-slate-900 dark:text-white block text-[11px] leading-tight">
                  Director / Owner
                </span>
                <span className="text-[10px] text-emerald-500 font-semibold">Online</span>
              </div>
            </div>

            <button
              onClick={toggleTheme}
              className="p-1.5 rounded-lg text-slate-400 hover:text-amber-500 cursor-pointer"
              title="Toggle theme"
            >
              {theme === 'dark' ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>
      </aside>

      {/* Main Workspace View */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Workspace Topbar */}
        <header className="hidden lg:flex items-center justify-between px-8 py-4 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 sticky top-0 z-30">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
              <span>Campus:</span>
              <span className="px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold border border-emerald-500/20">
                Active • 08:30 – 21:00
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setActiveTab('leads')}
              className="px-3.5 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-400 border border-amber-500/30 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
            >
              <PhoneCall className="w-3.5 h-3.5" />
              <span>{leadsCount} New Inquiries</span>
            </button>

            <button
              onClick={() => navigate('/')}
              className="px-3.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer border border-slate-200 dark:border-slate-700"
            >
              <Globe className="w-3.5 h-3.5 text-amber-500" />
              <span>Landing Page</span>
            </button>
          </div>
        </header>

        {/* View Body */}
        <main className="flex-1 p-4 sm:p-8 max-w-7xl w-full mx-auto">
          <AdminErrorBoundary key={activeTab} sectionName={SIDEBAR_ITEMS.find((s) => s.id === activeTab)?.label}>
            {renderActiveView()}
          </AdminErrorBoundary>
        </main>
      </div>
    </div>
  );
};
