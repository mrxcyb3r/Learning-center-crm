import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Sparkles, Phone, Send, Menu, X, Sun, Moon, LayoutDashboard, ArrowRight, ShieldCheck, GraduationCap } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { DEMO_MODE } from '../../config/demo';
import { cmsBridge } from '../../services/cmsBridge';
import { landingCmsService } from '../../services/repository';

interface PublicNavbarProps {
  onOpenTrialModal: () => void;
  activePage?: string;
}

export const PublicNavbar: React.FC<PublicNavbarProps> = ({ onOpenTrialModal, activePage = 'landing' }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { theme, toggleTheme } = useTheme();
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [phone, setPhone] = useState(cmsBridge.getContact().phone);

  useEffect(() => {
    // Production path: Firestore `settings/landing_cms` (public read).
    let cancelled = false;
    landingCmsService.getLandingContent()
      .then((doc) => {
        if (cancelled) return;
        const livePhone = (doc?.contact?.phone || doc?.phone) as string | undefined;
        setPhone(livePhone || cmsBridge.getContact().phone);
      })
      .catch(() => {
        if (!cancelled) setPhone(cmsBridge.getContact().phone);
      });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const goCourses = () => {
    setMobileMenuOpen(false);
    navigate('/courses');
  };

  const goSection = (id: string) => {
    setMobileMenuOpen(false);
    if (location.pathname !== '/') {
      navigate('/');
      setTimeout(() => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' }), 350);
    } else {
      document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const goHome = () => {
    setMobileMenuOpen(false);
    navigate('/');
  };

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-40 transition-all duration-300 ${
        isScrolled
          ? 'bg-white/95 dark:bg-slate-950/95 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800/80 py-3.5 shadow-sm'
          : 'bg-transparent py-5'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          {/* Brand Logo */}
          <div
            onClick={goHome}
            className="flex items-center gap-3 cursor-pointer group"
          >
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 to-amber-600 flex items-center justify-center text-slate-950 font-black text-lg shadow-md shadow-amber-500/20 group-hover:scale-105 transition">
              R
            </div>
            <div>
              <span className="text-lg font-black text-slate-900 dark:text-white tracking-tight block leading-none">
                RENESSANS
              </span>
              <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-widest block mt-0.5">
                O'quv Markazi
              </span>
            </div>
          </div>

          {/* Desktop Nav Links */}
          <nav className="hidden lg:flex items-center gap-7">
            <button
              onClick={goCourses}
              className={`text-sm font-semibold transition cursor-pointer ${
                activePage === 'courses'
                  ? 'text-amber-500 dark:text-amber-400'
                  : 'text-slate-700 dark:text-slate-300 hover:text-amber-500 dark:hover:text-amber-400'
              }`}
            >
              Kurslar
            </button>
            <button
              onClick={() => goSection('teachers')}
              className="text-sm font-semibold text-slate-700 dark:text-slate-300 hover:text-amber-500 dark:hover:text-amber-400 transition cursor-pointer"
            >
              Ustozlar
            </button>
            <button
              onClick={() => goSection('results')}
              className="text-sm font-semibold text-slate-700 dark:text-slate-300 hover:text-amber-500 dark:hover:text-amber-400 transition cursor-pointer"
            >
              Natijalar
            </button>
            <button
              onClick={() => goSection('contact')}
              className="text-sm font-semibold text-slate-700 dark:text-slate-300 hover:text-amber-500 dark:hover:text-amber-400 transition cursor-pointer"
            >
              Manzillarimiz
            </button>
          </nav>

          {/* Right Actions */}
          <div className="hidden sm:flex items-center gap-3">
            {/* Direct Phone */}
            <a
              href={`tel:${phone.replace(/[^+\d]/g, '')}`}
              className="px-3.5 py-2 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 hover:text-amber-500 flex items-center gap-2 border border-slate-200 dark:border-slate-800 transition"
            >
              <Phone className="w-3.5 h-3.5 text-amber-500" />
              <span>{phone}</span>
            </a>

            {/* Dark / Light Toggle */}
            <button
              onClick={toggleTheme}
              className="p-2.5 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
              title="Mavzuni almashtirish"
            >
              {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>

            {/* Admin Panel Button */}
            <button
              onClick={() => navigate('/admin')}
              className="px-2.5 py-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 text-[10px] font-bold border border-slate-200/60 dark:border-slate-800/60 hover:border-slate-300 dark:hover:border-slate-700 transition flex items-center gap-1 cursor-pointer"
              title="Admin Panel"
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Admin</span>
            </button>

            {/* Teacher Panel Button */}
            <button
              onClick={() => navigate('/teacher')}
              className="px-2.5 py-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 text-[10px] font-bold border border-slate-200/60 dark:border-slate-800/60 hover:border-slate-300 dark:hover:border-slate-700 transition flex items-center gap-1 cursor-pointer"
              title="O'qituvchi paneli"
            >
              <GraduationCap className="w-3.5 h-3.5" />
              <span>O'qituvchi</span>
            </button>

            {/* Demo badge */}
            <span className="px-2 py-1 rounded-md bg-amber-500/10 text-amber-600 dark:text-amber-400 text-[9px] font-black uppercase tracking-widest border border-amber-500/20 hidden lg:inline-flex">
              Demo
            </span>

            {/* CTA Button */}
            <button
              onClick={onOpenTrialModal}
              className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs shadow-md shadow-amber-500/20 hover:shadow-amber-500/35 transition cursor-pointer flex items-center gap-1.5"
            >
              <span>Sinov Darsi</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Mobile Menu Trigger */}
          <div className="flex sm:hidden items-center gap-2">
            <button
              onClick={toggleTheme}
              className="p-2 rounded-xl text-slate-600 dark:text-slate-300"
            >
              {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>

            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800 cursor-pointer"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown */}
        {mobileMenuOpen && (
          <div className="lg:hidden mt-4 p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4">
            <div className="flex flex-col gap-3">
              <button
                onClick={goCourses}
                className={`text-left font-bold text-sm py-2 ${
                  activePage === 'courses' ? 'text-amber-500' : 'text-slate-800 dark:text-slate-200'
                }`}
              >
                Kurslar
              </button>
              <button
                onClick={() => goSection('teachers')}
                className="text-left font-bold text-sm py-2 text-slate-800 dark:text-slate-200 hover:text-amber-500"
              >
                Ustozlar
              </button>
              <button
                onClick={() => goSection('results')}
                className="text-left font-bold text-sm py-2 text-slate-800 dark:text-slate-200 hover:text-amber-500"
              >
                Natijalar
              </button>
              <button
                onClick={() => goSection('contact')}
                className="text-left font-bold text-sm py-2 text-slate-800 dark:text-slate-200 hover:text-amber-500"
              >
                Manzillarimiz
              </button>
            </div>

            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2.5">
              <a
                href={`tel:${phone.replace(/[^+\d]/g, '')}`}
                className="w-full py-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white font-bold text-xs flex items-center justify-center gap-2"
              >
                <Phone className="w-4 h-4 text-amber-500" />
                <span>{phone}</span>
              </a>

              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    navigate('/admin');
                  }}
                  className="flex-1 py-2.5 rounded-xl text-slate-500 dark:text-slate-400 font-bold text-[10px] flex items-center justify-center gap-1.5 border border-slate-200 dark:border-slate-800"
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Admin</span>
                </button>

                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    navigate('/teacher');
                  }}
                  className="flex-1 py-2.5 rounded-xl text-slate-500 dark:text-slate-400 font-bold text-[10px] flex items-center justify-center gap-1.5 border border-slate-200 dark:border-slate-800"
                >
                  <GraduationCap className="w-3.5 h-3.5" />
                  <span>O'qituvchi</span>
                </button>
              </div>

              <span className="text-center text-[9px] font-bold text-amber-500 uppercase tracking-widest pt-1 block">
                Demo Rejimi
              </span>

              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  onOpenTrialModal();
                }}
                className="w-full py-3.5 rounded-xl bg-amber-500 text-slate-950 font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg"
              >
                <span>Sinov Darsiga Yozilish</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};
