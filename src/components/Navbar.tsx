import React, { useState } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { DevRoleDropdown } from './DevRoleDropdown';
import {
  Globe,
  Sparkles,
  ChevronDown,
  Menu,
  X,
  User,
  LogOut,
  ShieldCheck
} from 'lucide-react';

interface NavbarProps {
  onOpenAuth: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onOpenAuth }) => {
  const { language, setLanguage, t: translateObj, translate } = useLanguage();
  const { currentUser, userProfile, activeRole, logout } = useAuth();

  const t = (uz: string, en: string, ru: string) => (language === 'EN' ? en : language === 'RU' ? ru : uz);

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isLangDropdownOpen, setIsLangDropdownOpen] = useState(false);

  const navLinks = [
    { href: '#why-us', label: t('Imkoniyatlar', 'Features', 'Возможности') },
    { href: '#multi-subject', label: t('Fanlar Xabi', 'Multi-Subject Hub', 'Хаб Предметов') },
    { href: '#role-demos', label: t('Rol Demosi', 'Role Demos', 'Демо Ролей') },
    { href: '#telegram-sec', label: t('Telegram & Xavfsizlik', 'Security & Telegram', 'Телеграм & Защита') },
    { href: '#faq', label: t('Savollar', 'FAQs', 'Вопросы') }
  ];

  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    e.preventDefault();
    const targetId = href.replace('#', '');
    const element = document.getElementById(targetId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
      if (targetId === 'hero') {
        window.history.replaceState(null, '', window.location.pathname);
      } else {
        window.history.replaceState(null, '', `#${targetId}`);
      }
    }
    setIsMobileMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-50 bg-slate-950/80 backdrop-blur-md border-b border-gray-800/60 transition-all">
      <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between gap-4">
        
        {/* Left: Brand Logo & Unified Badge */}
        <a
          href="#hero"
          onClick={(e) => handleNavClick(e, '#hero')}
          className="flex items-center gap-3 group cursor-pointer"
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center font-black text-slate-950 shadow-lg shadow-amber-500/20 group-hover:scale-105 transition-transform shrink-0">
            CF
          </div>
          <div className="flex flex-col">
            <div className="font-extrabold text-lg text-white tracking-tight flex items-center gap-1.5 leading-tight">
              <span>Center<span className="text-amber-400">Flow</span></span>
            </div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-amber-400/80 leading-none mt-0.5">
              RENESANS LC PLATFORM
            </div>
          </div>
        </a>

        {/* Center: Streamlined Center Nav Pill */}
        <nav className="hidden lg:flex items-center gap-6 px-6 py-2 rounded-full bg-gray-900/60 border border-gray-800/80 text-sm font-medium text-gray-300">
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              onClick={(e) => handleNavClick(e, link.href)}
              className="hover:text-amber-400 text-gray-300 text-xs sm:text-sm font-semibold transition-colors cursor-pointer"
            >
              {link.label}
            </a>
          ))}
        </nav>

        {/* Right: Actions */}
        <div className="hidden sm:flex items-center gap-3">
          {/* Language Selector Pill */}
          <div className="relative">
            <button
              onClick={() => setIsLangDropdownOpen(!isLangDropdownOpen)}
              className="flex items-center gap-2 px-3 py-2 rounded-xl bg-gray-800/50 hover:bg-gray-800 text-gray-300 hover:text-white text-xs font-semibold border border-gray-700/50 transition-all cursor-pointer"
              title="Switch Language"
            >
              <Globe className="w-3.5 h-3.5 text-amber-400" />
              <span>{language === 'UZ' ? 'UZ 🇺🇿' : language === 'RU' ? 'RU 🇷🇺' : 'EN 🇬🇧'}</span>
              <ChevronDown className={`w-3 h-3 text-gray-400 transition-transform ${isLangDropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            {isLangDropdownOpen && (
              <div className="absolute right-0 mt-2 w-36 bg-slate-900 border border-gray-800 rounded-2xl shadow-2xl py-1.5 z-50">
                <button
                  onClick={() => {
                    setLanguage('UZ');
                    setIsLangDropdownOpen(false);
                  }}
                  className={`w-full flex items-center gap-2 px-3.5 py-2 text-xs font-semibold transition cursor-pointer ${
                    language === 'UZ' ? 'bg-amber-500/20 text-amber-400 font-bold' : 'text-slate-300 hover:bg-white/5'
                  }`}
                >
                  <span>🇺🇿</span> O'zbek (UZ)
                </button>
                <button
                  onClick={() => {
                    setLanguage('EN');
                    setIsLangDropdownOpen(false);
                  }}
                  className={`w-full flex items-center gap-2 px-3.5 py-2 text-xs font-semibold transition cursor-pointer ${
                    language === 'EN' ? 'bg-amber-500/20 text-amber-400 font-bold' : 'text-slate-300 hover:bg-white/5'
                  }`}
                >
                  <span>🇬🇧</span> English (EN)
                </button>
                <button
                  onClick={() => {
                    setLanguage('RU');
                    setIsLangDropdownOpen(false);
                  }}
                  className={`w-full flex items-center gap-2 px-3.5 py-2 text-xs font-semibold transition cursor-pointer ${
                    language === 'RU' ? 'bg-amber-500/20 text-amber-400 font-bold' : 'text-slate-300 hover:bg-white/5'
                  }`}
                >
                  <span>🇷🇺</span> Русский (RU)
                </button>
              </div>
            )}
          </div>

          {/* Dev Role Dropdown */}
          <DevRoleDropdown />

          {/* Single Main CTA or User Badge */}
          {currentUser ? (
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-gray-900 border border-gray-800 text-xs font-semibold">
                <div className="w-6 h-6 rounded-lg bg-amber-500 text-slate-950 flex items-center justify-center font-bold text-xs">
                  {userProfile?.displayName ? userProfile.displayName[0].toUpperCase() : 'U'}
                </div>
                <span className="text-white truncate max-w-[100px]">{userProfile?.displayName || 'User'}</span>
                <span className="px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 text-[10px] uppercase font-bold border border-amber-500/20">
                  {activeRole}
                </span>
              </div>
              <button
                onClick={logout}
                className="p-2 rounded-xl text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition cursor-pointer"
                title={t('Chiqish', 'Sign Out', 'Выйти')}
              >
                <LogOut className="w-4 h-4" />
              </button>
</div>
           ) : (
             <button
               onClick={onOpenAuth}
               className="flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-sm px-5 py-2.5 rounded-xl transition-all shadow-lg shadow-amber-500/20 active:scale-95 cursor-pointer"
             >
               <Sparkles className="w-4 h-4 fill-slate-950" />
               <span>{t('Kirish / Portalga kirish', 'Sign In / Portal Access', 'Вход / Доступ к порталу')}</span>
             </button>
           )}
        </div>

        {/* Mobile Hamburger Button */}
        <div className="flex lg:hidden items-center gap-2">
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-2.5 rounded-xl text-slate-200 bg-gray-900 border border-gray-800 cursor-pointer"
            aria-label="Toggle Menu"
          >
            {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

      </div>

      {/* Mobile Drawer */}
      {isMobileMenuOpen && (
        <div className="lg:hidden bg-slate-950 border-b border-gray-800/80 px-6 pt-4 pb-6 space-y-4 animate-fadeIn">
          <nav className="flex flex-col space-y-3">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={(e) => handleNavClick(e, link.href)}
                className="text-sm font-semibold text-gray-300 hover:text-amber-400 py-1 transition-colors"
              >
                {link.label}
              </a>
            ))}
          </nav>

          <div className="pt-4 border-t border-gray-800/80 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400">Language / Til:</span>
              <div className="flex gap-1.5">
                <button
                  onClick={() => setLanguage('UZ')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold ${
                    language === 'UZ' ? 'bg-amber-500 text-slate-950' : 'bg-gray-900 text-slate-300 border border-gray-800'
                  }`}
                >
                  UZ 🇺🇿
                </button>
                <button
                  onClick={() => setLanguage('EN')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold ${
                    language === 'EN' ? 'bg-amber-500 text-slate-950' : 'bg-gray-900 text-slate-300 border border-gray-800'
                  }`}
                >
                  EN 🇬🇧
                </button>
                <button
                  onClick={() => setLanguage('RU')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold ${
                    language === 'RU' ? 'bg-amber-500 text-slate-950' : 'bg-gray-900 text-slate-300 border border-gray-800'
                  }`}
                >
                  RU 🇷🇺
                </button>
              </div>
            </div>

            <div className="pt-2">
              <DevRoleDropdown className="w-full mb-3" />
              {!currentUser && (
                <button
                  onClick={() => {
                    onOpenAuth();
                    setIsMobileMenuOpen(false);
                  }}
                  className="w-full flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-sm py-3 rounded-xl shadow-lg shadow-amber-500/20"
                >
                  <Sparkles className="w-4 h-4 fill-slate-950" />
                  <span>{t('Kirish / Portalga kirish', 'Sign In / Portal Access', 'Вход / Доступ к порталу')}</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
