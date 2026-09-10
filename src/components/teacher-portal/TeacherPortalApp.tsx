import React, { useState } from 'react';
import { TeacherPortalProvider, useTeacherPortal } from '../../context/TeacherPortalContext';
import { TeacherSidebar } from './TeacherSidebar';
import { TeacherHeader } from './TeacherHeader';
import { TeacherDashboardView } from './views/TeacherDashboardView';
import { MyGroupsView } from './views/MyGroupsView';
import { MyStudentsView } from './views/MyStudentsView';
import { TimetableView } from './views/TimetableView';
import { TeacherAttendanceView } from './views/TeacherAttendanceView';
import { TeacherPaymentsView } from './views/TeacherPaymentsView';
import { TeacherIncomeView } from './views/TeacherIncomeView';
import { TeacherAnnouncementsView } from './views/TeacherAnnouncementsView';
import { TeacherTasksView } from './views/TeacherTasksView';
import { TeacherDocumentsView } from './views/TeacherDocumentsView';
import { TeacherProfileView } from './views/TeacherProfileView';
import { TeacherAnalyticsView } from './views/TeacherAnalyticsView';
import { TeacherSettingsView } from './views/TeacherSettingsView';
import { useTheme } from '../../context/ThemeContext';
import { Loader2 } from 'lucide-react';

const TeacherPortalLayout: React.FC = () => {
  const { activeTab, isLoading, isDemoMode } = useTeacherPortal();
  const { theme } = useTheme();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const sidebarWidth = sidebarCollapsed ? 68 : 260;

  const renderView = () => {
    switch (activeTab) {
      case 'dashboard':
        return <TeacherDashboardView />;
      case 'groups':
        return <MyGroupsView />;
      case 'students':
        return <MyStudentsView />;
      case 'timetable':
        return <TimetableView />;
      case 'attendance':
        return <TeacherAttendanceView />;
      case 'payments':
        return <TeacherPaymentsView />;
      case 'income':
        return <TeacherIncomeView />;
      case 'announcements':
        return <TeacherAnnouncementsView />;
      case 'tasks':
        return <TeacherTasksView />;
      case 'documents':
        return <TeacherDocumentsView />;
      case 'profile':
        return <TeacherProfileView />;
      case 'analytics':
        return <TeacherAnalyticsView />;
      case 'settings':
        return <TeacherSettingsView />;
      default:
        return <TeacherDashboardView />;
    }
  };

  return (
    <div className={`min-h-screen ${theme === 'dark' ? 'bg-slate-950' : 'bg-slate-50'}`}>
      {/* Sidebar - Desktop */}
      <div className="hidden lg:block">
        <TeacherSidebar collapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed(!sidebarCollapsed)} />
      </div>

      {/* Sidebar - Mobile Overlay */}
      {mobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-40">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className="relative z-50">
            <TeacherSidebar collapsed={false} onToggle={() => setMobileMenuOpen(false)} />
          </div>
        </div>
      )}

      {/* Main Content */}
      <div
        className="transition-all duration-300 min-h-screen flex flex-col"
        style={{ marginLeft: typeof window !== 'undefined' && window.innerWidth >= 1024 ? sidebarWidth : 0 }}
      >
        <TeacherHeader onMenuToggle={() => setMobileMenuOpen(!mobileMenuOpen)} mobileMenuOpen={mobileMenuOpen} />

        {/* Demo Mode Banner */}
        {isDemoMode && (
          <div className="mx-4 sm:mx-6 mt-4 px-4 py-3 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse flex-shrink-0" />
            <span className="text-xs font-bold text-amber-600 dark:text-amber-400">
              Demo Mode — Data shown is for demonstration purposes only
            </span>
          </div>
        )}

        {/* Content Area */}
        <main className="flex-1 p-4 sm:p-6">
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 className={`w-8 h-8 animate-spin ${theme === 'dark' ? 'text-blue-400' : 'text-blue-500'}`} />
            </div>
          ) : (
            renderView()
          )}
        </main>
      </div>
    </div>
  );
};

export const TeacherPortalApp: React.FC = () => {
  return (
    <TeacherPortalProvider>
      <TeacherPortalLayout />
    </TeacherPortalProvider>
  );
};

export default TeacherPortalApp;
