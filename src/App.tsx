import React, { useState } from 'react';
import { ThemeProvider } from './context/ThemeContext';
import { LanguageProvider } from './context/LanguageContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { LandingPage } from './pages/LandingPage';
import { AuthModal } from './components/Auth/AuthModal';
import { AppLayout } from './components/Layout/AppLayout';
import { Dashboard } from './components/Dashboard/Dashboard';
import { DevRoleSwitcher } from './components/DevRoleSwitcher';
import { ShieldCheck, Loader2 } from 'lucide-react';

function MainApp() {
  const { currentUser, isLoading } = useAuth();
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  // 1. Loading State
  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-4 transition-colors">
        <div className="flex flex-col items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-amber-500 flex items-center justify-center text-slate-950 font-black shadow-xl shadow-amber-500/20 animate-bounce">
            <ShieldCheck className="w-8 h-8" />
          </div>
          <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300 font-bold text-xs tracking-wide">
            <Loader2 className="w-4 h-4 animate-spin text-amber-500" />
            <span>CenterFlow Yuklanmoqda...</span>
          </div>
        </div>
      </div>
    );
  }

  // 2. Unauthenticated View (Public Landing Page)
  if (!currentUser) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 font-sans selection:bg-amber-500 selection:text-slate-950">
        {/* Public Navigation Bar */}
        <Navbar onOpenAuth={() => setIsAuthModalOpen(true)} />

        {/* Public Landing Page */}
        <LandingPage onOpenAuth={() => setIsAuthModalOpen(true)} />

        {/* Auth Modal (Login & Register) */}
        <AuthModal
          isOpen={isAuthModalOpen}
          onClose={() => setIsAuthModalOpen(false)}
        />

        {/* Dev Mock Role Switcher */}
        <DevRoleSwitcher />
      </div>
    );
  }

  // 3. Authenticated View (Internal Main App Dashboard)
  return (
    <AppLayout>
      <Dashboard />
      <DevRoleSwitcher />
    </AppLayout>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <LanguageProvider>
        <AuthProvider>
          <MainApp />
        </AuthProvider>
      </LanguageProvider>
    </ThemeProvider>
  );
}
