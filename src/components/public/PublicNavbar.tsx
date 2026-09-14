import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Phone, Menu, X, ArrowRight } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
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
  const [phone, setPhone] = useState('+998 (88) 648-49-49');

  useEffect(() => {
    let cancelled = false;
    landingCmsService.getLandingContent()
      .then((doc) => {
        if (cancelled) return;
        const livePhone = (doc?.contact?.phone || doc?.phone) as string | undefined;
        setPhone(livePhone || '+998 (88) 648-49-49');
      })
      .catch(() => {
        if (!cancelled) setPhone('+998 (88) 648-49-49');
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

  const navItems = [
    { id: 'courses', label: 'Kurslar', onClick: goCourses },
    { id: 'teachers', label: 'Ustozlar', onClick: () => goSection('ustozlar') },
    { id: 'results', label: 'Natijalar', onClick: () => goSection('natijalar') },
    { id: 'contact', label: 'Manzillarimiz', onClick: () => goSection('manzil') },
  ];

  return (
    <header
      className={`fixed inset-x-0 top-0 z-[100] transition-all duration-300 ease-in-out ${
        isScrolled ? "py-2.5 px-4 sm:px-8" : "py-5 px-4 sm:px-8"
      }`}
    >
      <div
        className={`mx-auto flex max-w-[1400px] items-center justify-between rounded-full transition-all duration-300 ease-in-out ${
          isScrolled
            ? "border border-white/10 bg-[#07090d]/85 px-5 py-2.5 backdrop-blur-md shadow-2xl"
            : "border border-transparent bg-transparent px-5 py-2"
        }`}
      >
        <button
          type="button"
          onClick={goHome}
          className="group flex items-center gap-3 text-left focus:outline-none flex-shrink-0"
          aria-label="Renessans Asosiy Sahifa"
        >
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-amber-400 to-amber-500 font-serif text-base font-bold text-black shadow-[0_0_20px_rgba(245,158,11,0.45)] transition-transform group-hover:scale-105">
            R
          </span>
          <div className="flex flex-col">
            <span className="font-serif text-sm font-bold tracking-[0.2em] text-stone-100 group-hover:text-amber-400 transition-colors">
              RENESSANS
            </span>
            <span className="font-mono text-[8px] uppercase tracking-widest text-stone-400">
              O‘quv Markazi • Yangiobod
            </span>
          </div>
        </button>

        <nav
          aria-label="Asosiy menyu"
          className="hidden xl:flex items-center gap-1 font-mono text-[10px] uppercase tracking-[0.15em] text-stone-400"
        >
          {navItems.map(({ id, label, onClick }) => {
            const isActive = activePage === id || (id !== 'courses' && activePage === 'landing');
            return (
              <button
                key={id}
                type="button"
                onClick={onClick}
                className="relative px-3.5 py-2 transition-colors hover:text-stone-100 min-h-[44px] flex items-center rounded-full"
              >
                <span className="relative z-10">{label}</span>
                {isActive && (
                  <div
                    className="absolute inset-0 z-0 rounded-full bg-amber-400/[0.12] border border-amber-400/40 shadow-[0_0_15px_rgba(245,158,11,0.15)]"
                  />
                )}
              </button>
            );
          })}
        </nav>

        <div className="flex items-center gap-4 flex-shrink-0">
          <a
            href={`tel:${phone.replace(/[^+\d]/g, '')}`}
            className="hidden sm:inline-flex items-center gap-2 whitespace-nowrap flex-shrink-0 font-mono text-xs text-stone-300 hover:text-amber-400 transition-colors min-h-[44px] px-2.5 rounded-full hover:bg-white/[0.04]"
          >
            <Phone className="h-3.5 w-3.5 text-amber-400 shrink-0" />
            <span className="whitespace-nowrap tabular-nums">{phone}</span>
          </a>

          <button
            type="button"
            onClick={toggleTheme}
            className="p-2.5 rounded-xl text-stone-300 hover:text-amber-400 transition-colors flex-shrink-0"
            title="Mavzuni almashtirish"
          >
            {theme === 'dark' ? (
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            ) : (
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
              </svg>
            )}
          </button>

          <button
            type="button"
            onClick={onOpenTrialModal}
            className="group relative inline-flex items-center gap-2 overflow-hidden rounded-full bg-gradient-to-r from-amber-400 to-amber-300 px-6 py-2.5 min-h-[44px] text-[11px] font-bold uppercase tracking-[0.14em] text-black transition-all hover:shadow-[0_0_30px_rgba(245,158,11,0.45)] whitespace-nowrap flex-shrink-0"
          >
            <span>Sinov Darsi</span>
            <ArrowRight className="h-3 w-3 transition-transform duration-300 group-hover:translate-x-1" />
          </button>

          <button
            type="button"
            onClick={() => setMobileMenuOpen(true)}
            className="flex h-11 w-11 items-center justify-center rounded-full border border-white/10 text-stone-300 xl:hidden hover:text-amber-400 transition-colors flex-shrink-0"
            aria-label="Menyu"
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>
    </header>
  );
};