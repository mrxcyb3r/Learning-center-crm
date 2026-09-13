import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  PhoneCall,
  MessageSquare,
  Users,
  BookOpen,
  Calendar,
  CreditCard,
  Sparkles,
  Globe,
  ExternalLink,
  Sun,
  Moon,
  Menu,
  X,
  Search,
  LogOut,
  LifeBuoy,
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
import { ReceptionistView } from './ReceptionistView';
import { AIChatCore } from '../AI/AIChatCore';
import { GlobalSearch } from './GlobalSearch';
import { AdminErrorBoundary } from '../common/AdminErrorBoundary';
import { leadsService, murojaatlarService } from '../../services/repository';
import { normalizeLeadStatus } from '../../utils/leads';
import { DEMO_MODE } from '../../config/demo';

type ReceptionTab =
  | 'dashboard'
  | 'murojaatlar'
  | 'leads'
  | 'qabulxona'
  | 'students'
  | 'groups'
  | 'courses'
  | 'payments'
  | 'ai';

const TABS: Array<{ id: ReceptionTab; label: string; icon: React.FC<{ className?: string }> }> = [
  { id: 'dashboard', label: 'Bosh sahifa', icon: LayoutDashboard },
  { id: 'murojaatlar', label: 'Murojaatlar', icon: MessageSquare },
  { id: 'leads', label: 'Lidlar CRM', icon: PhoneCall },
  { id: 'qabulxona', label: 'Qabulxona', icon: LifeBuoy },
  { id: 'students', label: "O'quvchilar", icon: Users },
  { id: 'groups', label: 'Guruhlar va Jadval', icon: Calendar },
  { id: 'courses', label: 'Kurslar', icon: BookOpen },
  { id: 'payments', label: "To'lovlar", icon: CreditCard },
  { id: 'ai', label: 'AI Yordamchi', icon: Sparkles },
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
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState<ReceptionTab>('dashboard');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [leadsCount, setLeadsCount] = useState(0);
  const [murojaatUnread, setMurojaatUnread] = useState(0);
  const [searchOpen, setSearchOpen] = useState(false);
  const [demoActive] = useState(DEMO_MODE);

  const displayName =
    userProfile?.displayName || currentUser?.displayName || currentUser?.email?.split('@')[0] || 'Qabulxona';

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
      case 'qabulxona':
        return <ReceptionistView />;
      case 'students':
        return <StudentsView readOnly />;
      case 'groups':
        return <ScheduleView readOnly />;
      case 'courses':
        return <CoursesView readOnly />;
      case 'payments':
        return <PaymentsView readOnly />;
      case 'ai':
        return <AIChatCore variant="full" />;
      default:
        return <ReceptionistDashboard onNavigateTab={(t) => setActiveTab(t as ReceptionTab)} />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col lg:flex-row font-sans selection:bg-amber-500 selection:text-slate-950">
      <div className="lg:hidden flex items-center justify-between p-4 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-40">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-sky-500 text-white font-black flex items-center justify-center text-sm">
            Q
          </div>
          <span className="font-black text-sm tracking-tight">QABULXONA</span>
          <span className="text-[10px] font-bold text-sky-600 dark:text-sky-400 border border-sky-500/30 rounded-md px-1.5 py-0.5">RECEPTIONIST</span>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setSearchOpen(true)} className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800" aria-label="Qidirish">
            <Search className="w-4 h-4" />
          </button>
          <button onClick={toggleTheme} className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800">
            {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
          <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800">
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      <aside className={`fixed lg:sticky top-0 left-0 bottom-0 z-50 w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 p-5 flex flex-col justify-between overflow-y-auto transition-transform duration-300 ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
        <div>
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-2xl bg-sky-500 text-white font-black flex items-center justify-center text-base shadow-md">Q</div>
              <div>
                <span className="font-black text-base tracking-tight block leading-none">QABULXONA</span>
                <span className="text-[10px] font-bold text-sky-600 dark:text-sky-400 uppercase tracking-wider block mt-0.5">Receptionist paneli</span>
                <span className="text-[10px] font-semibold text-emerald-500 flex items-center gap-1 mt-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Onlayn
                </span>
              </div>
            </div>
            <button onClick={() => setMobileMenuOpen(false)} className="lg:hidden p-1.5 rounded-lg text-slate-400">
              <X className="w-4 h-4" />
            </button>
          </div>

          {demoActive && (
            <div className="px-3.5 mb-4 py-2 rounded-lg bg-sky-500/10 border border-sky-500/20 text-center">
              <span className="text-[9px] font-black text-sky-600 dark:text-sky-400 uppercase tracking-widest">Namoyish rejimi</span>
            </div>
          )}

          <nav className="space-y-1">
            {TABS.map((item) => {
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
                      ? 'bg-sky-500 text-white shadow-sm font-extrabold'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/80 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className="w-4 h-4 shrink-0" />
                    <span>{item.label}</span>
                  </div>
                  {(item.id === 'leads' && leadsCount > 0) && (
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${isActive ? 'bg-white text-sky-600' : 'bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/30'}`}>
                      {leadsCount}
                    </span>
                  )}
                  {(item.id === 'murojaatlar' && murojaatUnread > 0) && (
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${isActive ? 'bg-white text-sky-600' : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/30'}`}>
                      {murojaatUnread}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        <div className="pt-6 border-t border-slate-100 dark:border-slate-800 space-y-3">
          <button
            onClick={() => navigate('/')}
            className="w-full py-2.5 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold flex items-center justify-center gap-2 transition cursor-pointer border border-slate-200 dark:border-slate-700"
          >
            <Globe className="w-3.5 h-3.5 text-sky-500" />
            <span>Saytni ko‘rish</span>
            <ExternalLink className="w-3 h-3 text-slate-400" />
          </button>
          <div className="flex items-center gap-2.5 px-1 min-w-0">
            <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-sky-500 to-sky-300 flex items-center justify-center font-bold text-white text-xs shrink-0">
              {displayName.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <span className="font-bold text-slate-900 dark:text-white block text-[11px] leading-tight truncate">{displayName}</span>
              <span className="text-[10px] text-sky-600 dark:text-sky-400 font-bold">QABULXONA</span>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 border border-rose-500/20 transition cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>{t.nav.logout}</span>
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="hidden lg:flex items-center justify-between gap-4 px-8 py-3 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 sticky top-0 z-30">
          <div className="flex items-center gap-3 min-w-0">
            <span className="inline-flex items-center px-2 py-0.5 rounded-lg border text-[10px] font-bold bg-sky-500/10 dark:bg-sky-500/20 text-sky-600 dark:text-sky-400 border-sky-500/30 shrink-0">
              QABULXONA
            </span>
            <button
              onClick={() => setSearchOpen(true)}
              className="hidden xl:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-500"
            >
              <Search className="w-3.5 h-3.5" />
              <span>Lid, o‘quvchi, kurs qidirish...</span>
            </button>
          </div>
          <div className="flex items-center gap-2.5 shrink-0">
            <span className="hidden 2xl:block text-[11px] font-bold text-slate-600 dark:text-slate-300 max-w-28 truncate">{displayName}</span>
            <button onClick={toggleTheme} className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
              {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 text-xs font-bold border border-rose-500/30 transition cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>{t.nav.logout}</span>
            </button>
          </div>
        </header>

        <div className="lg:hidden flex items-center justify-between gap-2 px-4 py-2 bg-white/80 dark:bg-slate-900/80 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-30">
          <span className="inline-flex items-center px-2 py-0.5 rounded-lg border text-[10px] font-bold bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/30">QABULXONA</span>
          <button
            onClick={handleLogout}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-rose-500/10 text-rose-600 dark:text-rose-400 text-[11px] font-bold border border-rose-500/30"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>{t.nav.logout}</span>
          </button>
        </div>

        <main className="flex-1 p-4 sm:p-8 max-w-7xl w-full mx-auto">
          {demoActive && (
            <div className="mb-4 px-4 py-2.5 rounded-2xl bg-sky-500/10 border border-sky-500/25 flex items-center gap-2 text-[11px] font-bold text-sky-700 dark:text-sky-400">
              <Sparkles className="w-4 h-4 shrink-0" />
              Namoyish rejimi — ko‘rsatilgan ma’lumotlar demo ma’lumotlar asosida.
            </div>
          )}
          <AdminErrorBoundary key={activeTab} sectionName={TABS.find((s) => s.id === activeTab)?.label}>
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
