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
import { ReceptionAssistant } from './ReceptionAssistant';
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

type SidebarGroup = {
  title: string;
  items: Array<{ id: ReceptionTab; label: string; icon: React.FC<{ className?: string }> }>;
};

// Murojaatlar (unified website/Telegram inbox) and Qabulxona (AI-escalated
// operator queue) read the same underlying inbox — they are grouped together
// under CRM so the overlap is explicit instead of duplicated top-level items.
const SIDEBAR_GROUPS: SidebarGroup[] = [
  {
    title: 'Boshqaruv',
    items: [{ id: 'dashboard', label: 'Bosh sahifa', icon: LayoutDashboard }],
  },
  {
    title: 'CRM',
    items: [
      { id: 'murojaatlar', label: 'Murojaatlar', icon: MessageSquare },
      { id: 'leads', label: 'Lidlar', icon: PhoneCall },
      { id: 'qabulxona', label: 'AI navbat', icon: LifeBuoy },
    ],
  },
  {
    title: "O'quvchilar",
    items: [
      { id: 'students', label: "O'quvchilar", icon: Users },
      { id: 'groups', label: 'Guruhlar va jadval', icon: Calendar },
      { id: 'courses', label: 'Kurslar', icon: BookOpen },
    ],
  },
  {
    title: 'Moliya',
    items: [{ id: 'payments', label: "To'lovlar", icon: CreditCard }],
  },
  {
    title: 'Yordamchi',
    items: [{ id: 'ai', label: 'AI Yordamchi', icon: Sparkles }],
  },
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
        // Front-desk may record new payments (narrow Firestore create rule:
        // existing student + positive amount). Void/edit stays admin-only.
        return <PaymentsView readOnly allowCreate />;
      case 'ai':
        return <ReceptionAssistant />;
      default:
        return <ReceptionistDashboard onNavigateTab={(t) => setActiveTab(t as ReceptionTab)} />;
    }
  };

  const allItems = SIDEBAR_GROUPS.flatMap((g) => g.items);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col lg:flex-row font-sans selection:bg-emerald-500 selection:text-white">
      <div className="lg:hidden flex items-center justify-between p-4 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-40">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white font-black flex items-center justify-center text-sm">
            Q
          </div>
          <span className="font-black text-sm tracking-tight">QABULXONA</span>
          <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 border border-emerald-500/30 rounded-md px-1.5 py-0.5">Qabulxona</span>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setSearchOpen(true)} className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800" aria-label="Qidirish">
            <Search className="w-4 h-4" />
          </button>
          <button onClick={toggleTheme} className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800" aria-label="Mavzu">
            {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
          <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800" aria-label="Menyu">
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      <aside className={`fixed lg:sticky top-0 left-0 bottom-0 z-50 w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 p-5 flex flex-col justify-between overflow-y-auto transition-transform duration-300 ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
        <div>
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-2xl bg-emerald-600 text-white font-black flex items-center justify-center text-base shadow-md">Q</div>
              <div>
                <span className="font-black text-base tracking-tight block leading-none">QABULXONA</span>
                <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider block mt-0.5">Qabulxona</span>
                <span className="text-[10px] font-semibold text-emerald-500 flex items-center gap-1 mt-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Onlayn
                </span>
              </div>
            </div>
            <button onClick={() => setMobileMenuOpen(false)} className="lg:hidden p-1.5 rounded-lg text-slate-400" aria-label="Yopish">
              <X className="w-4 h-4" />
            </button>
          </div>

          {demoActive && (
            <div className="px-3.5 mb-4 py-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-center">
              <span className="text-[9px] font-black text-emerald-700 dark:text-emerald-400 uppercase tracking-widest">Namoyish rejimi</span>
            </div>
          )}

          <nav className="space-y-5">
            {SIDEBAR_GROUPS.map((group) => (
              <div key={group.title}>
                <div className="px-3.5 mb-1.5 text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">
                  {group.title}
                </div>
                <div className="space-y-1">
                  {group.items.map((item) => {
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
                            ? 'bg-emerald-600 text-white shadow-sm font-extrabold'
                            : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/80 hover:text-slate-900 dark:hover:text-white'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <Icon className="w-4 h-4 shrink-0" />
                          <span>{item.label}</span>
                        </div>
                        {(item.id === 'leads' && leadsCount > 0) && (
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${isActive ? 'bg-white text-emerald-700' : 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30'}`}>
                            {leadsCount}
                          </span>
                        )}
                        {(item.id === 'murojaatlar' && murojaatUnread > 0) && (
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${isActive ? 'bg-white text-emerald-700' : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/30'}`}>
                            {murojaatUnread}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </nav>
        </div>

        <div className="pt-6 border-t border-slate-100 dark:border-slate-800 space-y-3">
          <button
            onClick={() => navigate('/')}
            className="w-full py-2.5 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold flex items-center justify-center gap-2 transition cursor-pointer border border-slate-200 dark:border-slate-700"
          >
            <Globe className="w-3.5 h-3.5 text-emerald-600" />
            <span>Saytni ko‘rish</span>
            <ExternalLink className="w-3 h-3 text-slate-400" />
          </button>
          <div className="flex items-center gap-2.5 px-1 min-w-0">
            <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-emerald-600 to-emerald-400 flex items-center justify-center font-bold text-white text-xs shrink-0">
              {displayName.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <span className="font-bold text-slate-900 dark:text-white block text-[11px] leading-tight truncate">{displayName}</span>
              <span className="text-[10px] text-emerald-700 dark:text-emerald-400 font-bold">QABULXONA</span>
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
            <span className="inline-flex items-center px-2 py-0.5 rounded-lg border text-[10px] font-bold bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border-emerald-500/30 shrink-0">
              QABULXONA
            </span>
            <button
              onClick={() => setSearchOpen(true)}
              className="hidden xl:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-500 cursor-pointer"
            >
              <Search className="w-3.5 h-3.5" />
              <span>Lid, o‘quvchi, kurs qidirish...</span>
            </button>
          </div>
          <div className="flex items-center gap-2.5 shrink-0">
            <span className="hidden 2xl:block text-[11px] font-bold text-slate-600 dark:text-slate-300 max-w-28 truncate">{displayName}</span>
            <button onClick={toggleTheme} className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300" aria-label="Mavzu">
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
          <span className="inline-flex items-center px-2 py-0.5 rounded-lg border text-[10px] font-bold bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30">QABULXONA</span>
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
            <div className="mb-4 px-4 py-2.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/25 flex items-center gap-2 text-[11px] font-bold text-emerald-700 dark:text-emerald-400">
              <Sparkles className="w-4 h-4 shrink-0" />
              Namoyish rejimi — ko‘rsatilgan ma’lumotlar demo ma’lumotlar asosida.
            </div>
          )}
          <AdminErrorBoundary key={activeTab} sectionName={allItems.find((s) => s.id === activeTab)?.label}>
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
