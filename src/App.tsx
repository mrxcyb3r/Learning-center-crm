import React, { useEffect } from 'react';
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate
} from 'react-router-dom';
import AOS from 'aos';
import 'aos/dist/aos.css';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import { ThemeProvider } from './context/ThemeContext';
import { LanguageProvider } from './context/LanguageContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AppDataProvider } from './context/AppDataContext';
import { AppBackground } from './components/AppBackground';
import { RenessansLandingPage } from './pages/RenessansLandingPage';
import { PublicCoursesPage } from './pages/PublicCoursesPage';
import { CourseDetailPage } from './pages/CourseDetailPage';
import { TeacherPage } from './pages/TeacherPage';
import { CenterErpApp } from './components/erp/CenterErpApp';
import { TeacherPortalApp } from './components/teacher-portal/TeacherPortalApp';
import { ParticleBackground } from './components/UI/ParticleBackground';
import { SEOHead } from './components/SEOHead';
import { preloadImages } from './utils/performance';
import { APP_ASSETS } from './constants/assets';
import { demoData } from './services/demoData';
import {
  ShieldCheck,
  Loader2
} from 'lucide-react';

// ---------------------------------------------------------------------------
// Main Application Component with Router
// ---------------------------------------------------------------------------
function MainAppRoutes() {
  const { isLoading } = useAuth();

  useEffect(() => {
    AOS.init({
      duration: 600,
      once: true,
      easing: 'ease-out-cubic'
    });

    // Preload critical application images for smooth LCP & transitions
    preloadImages([
      APP_ASSETS.bgDarkMode,
      APP_ASSETS.bgLightMode,
      APP_ASSETS.highScorerBadge,
      APP_ASSETS.aiLogo,
      APP_ASSETS.studentMockup,
      APP_ASSETS.teacherMockup
    ]);
  }, []);

  useEffect(() => {
    demoData.init();
  }, []);

  if (isLoading) {
    return (
      <div className="relative min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 transition-colors">
        <ParticleBackground />
        <div className="relative z-10 flex flex-col items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-amber-500 flex items-center justify-center text-slate-950 font-black shadow-xl shadow-amber-500/20 animate-bounce">
            <ShieldCheck className="w-8 h-8" />
          </div>
          <div className="flex items-center gap-2 text-slate-300 font-bold text-xs tracking-wide">
            <Loader2 className="w-4 h-4 animate-spin text-amber-500" />
            <span>CenterFlow Yuklanmoqda...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <Routes>
      {/* Public Website for Renessans Learning Center */}
      <Route path="/" element={<RenessansLandingPage />} />
      <Route path="/courses" element={<PublicCoursesPage />} />
      <Route path="/courses/:slug" element={<CourseDetailPage />} />
      <Route path="/teachers/:slug" element={<TeacherPage />} />

      {/* Center ERP & Leads CRM */}
      <Route path="/admin/*" element={<CenterErpApp />} />
      <Route path="/dashboard" element={<Navigate to="/dashboard/admin" replace />} />
      <Route path="/dashboard/admin/*" element={<CenterErpApp />} />
      <Route path="/dashboard/student/*" element={<CenterErpApp />} />
      <Route path="/dashboard/teacher/*" element={<CenterErpApp />} />

      {/* Teacher Portal */}
      <Route path="/teacher/*" element={<TeacherPortalApp />} />

      {/* Catch-All Fallback Redirect */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <LanguageProvider>
        <AuthProvider>
          <AppDataProvider>
            <BrowserRouter>
              <SEOHead />
              <AppBackground />
              <MainAppRoutes />
              <ToastContainer
                position="bottom-right"
                autoClose={3500}
                hideProgressBar={false}
                newestOnTop
                closeOnClick
                rtl={false}
                pauseOnFocusLoss
                draggable
                pauseOnHover
                theme="dark"
              />
            </BrowserRouter>
          </AppDataProvider>
        </AuthProvider>
      </LanguageProvider>
    </ThemeProvider>
  );
}