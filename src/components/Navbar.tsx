import React, { useState } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import {
  Sun,
  Moon,
  Globe,
  Menu,
  X,
  User,
  LogOut,
  Shield,
  GraduationCap,
  Sparkles,
  PhoneCall
} from 'lucide-react';

interface NavbarProps {
  onOpenAuth: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onOpenAuth }) => {
  const { language, setLanguage, t } = useLanguage();
  const { theme, toggleTheme } = useTheme();
  const { currentUser, userProfile, activeRole, logout } = useAuth();

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isLangDropdownOpen, setIsLangDropdownOpen] = useState(false);

  const navLinks = [
    { href: '#courses', label: language === 'UZ' ? 'Imkoniyatlar' : language === 'RU' ? 'Возможности' : 'Features' },
    { href: '#pricing', label: language === 'UZ' ? 'Narxlar' : language === 'RU' ? 'Цены' : 'Pricing' },
    { href: 'https://chronicle.ai.studio/', label: language === 'UZ' ? 'Blog' : language === 'RU' ? 'Блог' : 'Blog', isExternal: true },
    { href: '#contact', label: language === 'UZ' ? 'Aloqa' : language === 'RU' ? 'Контакты' : 'Contact' }
  ];

  return (
    <header className="sticky top-0 z-40 bg-white/90 dark:bg-slate-950/90 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800/80 transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Brand Logo */}
          <a href="#" className="flex items-center gap-3 group">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-amber-500 via-amber-400 to-yellow-300 flex items-center justify-center text-slate-950 shadow-md shadow-amber-500/20 group-hover:scale-105 transition-transform">
              <GraduationCap className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl font-black tracking-tight text-slate-900 dark:text-white group-hover:text-amber-500 transition-colors">
                  RENESSANS
                </span>
                <span className="text-xs font-bold px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                  LC
                </span>
              </div>
              <p className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                Toshkent / Markaziy Filial
              </p>
            </div>
          </a>

          {/* Desktop Nav Links */}
          <nav className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                target={link.isExternal ? "_blank" : undefined}
                rel={link.isExternal ? "noopener noreferrer" : undefined}
                className="text-sm font-medium text-slate-700 hover:text-amber-500 dark:text-slate-300 dark:hover:text-amber-400 transition-colors"
              >
                {link.label}
              </a>
            ))}
          </nav>

          {/* Controls & Actions */}
          <div className="hidden lg:flex items-center gap-3">
            {/* Language Switcher */}
            <div className="relative">
              <button
                onClick={() => setIsLangDropdownOpen(!isLangDropdownOpen)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-900 hover:bg-slate-200 dark:hover:bg-slate-800 border border-slate-200/60 dark:border-slate-800 transition cursor-pointer"
              >
                <Globe className="w-4 h-4 text-amber-500" />
                <span>{language === 'UZ' ? 'UZ 🇺🇿' : language === 'RU' ? 'RU 🇷🇺' : 'EN 🇬🇧'}</span>
              </button>

              {isLangDropdownOpen && (
                <div className="absolute right-0 mt-2 w-36 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl py-1 z-50">
                  <button
                    onClick={() => {
                      setLanguage('UZ');
                      setIsLangDropdownOpen(false);
                    }}
                    className={`w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold cursor-pointer ${
                      language === 'UZ'
                        ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                        : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    <span>🇺🇿</span> Uzbek (UZ)
                  </button>
                  <button
                    onClick={() => {
                      setLanguage('EN');
                      setIsLangDropdownOpen(false);
                    }}
                    className={`w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold cursor-pointer ${
                      language === 'EN'
                        ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                        : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    <span>🇬🇧</span> English (EN)
                  </button>
                  <button
                    onClick={() => {
                      setLanguage('RU');
                      setIsLangDropdownOpen(false);
                    }}
                    className={`w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold cursor-pointer ${
                      language === 'RU'
                        ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                        : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    <span>🇷🇺</span> Russian (RU)
                  </button>
                </div>
              )}
            </div>

            {/* Dark/Light Mode Toggle */}
            <button
              onClick={toggleTheme}
              className="p-2.5 rounded-xl text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-900 hover:bg-slate-200 dark:hover:bg-slate-800 border border-slate-200/60 dark:border-slate-800 transition cursor-pointer"
              aria-label="Toggle Theme"
            >
              {theme === 'dark' ? (
                <Sun className="w-4 h-4 text-amber-400" />
              ) : (
                <Moon className="w-4 h-4 text-slate-600" />
              )}
            </button>

            {/* Auth / Profile Button */}
            {currentUser ? (
              <div className="flex items-center gap-2 pl-2 border-l border-slate-200 dark:border-slate-800">
                <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                  <div className="w-7 h-7 rounded-full bg-amber-500 text-slate-950 font-bold text-xs flex items-center justify-center">
                    {userProfile?.displayName ? userProfile.displayName[0].toUpperCase() : 'U'}
                  </div>
                  <div className="text-left leading-tight">
                    <p className="text-xs font-bold text-slate-900 dark:text-white truncate max-w-[100px]">
                      {userProfile?.displayName || 'User'}
                    </p>
                    <p className="text-[10px] font-semibold text-amber-600 dark:text-amber-400 uppercase">
                      {activeRole}
                    </p>
                  </div>
                </div>
                <button
                  onClick={logout}
                  className="p-2 rounded-xl text-slate-500 hover:text-red-500 hover:bg-red-500/10 transition cursor-pointer"
                  title={t.nav.logout}
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={onOpenAuth}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-md shadow-amber-500/20 hover:shadow-amber-500/30 transition cursor-pointer"
              >
                <User className="w-4 h-4" />
                <span>{t.nav.login}</span>
              </button>
            )}

            {/* Quick Contact Header CTA */}
            <a
              href="#contact"
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 text-white font-bold text-xs border border-slate-700/50 transition cursor-pointer"
            >
              <PhoneCall className="w-3.5 h-3.5 text-amber-400" />
              <span>{t.nav.contact}</span>
            </a>
          </div>

          {/* Mobile Menu Hamburger */}
          <div className="flex lg:hidden items-center gap-2">
            <button
              onClick={toggleTheme}
              className="p-2 rounded-xl text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800"
            >
              {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
            </button>

            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2.5 rounded-xl text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800"
            >
              {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Drawer */}
      {isMobileMenuOpen && (
        <div className="lg:hidden bg-white dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 px-4 pt-4 pb-6 space-y-4">
          <nav className="flex flex-col space-y-3">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                target={link.isExternal ? "_blank" : undefined}
                rel={link.isExternal ? "noopener noreferrer" : undefined}
                onClick={() => setIsMobileMenuOpen(false)}
                className="text-base font-semibold text-slate-800 dark:text-slate-200 hover:text-amber-500 py-1"
              >
                {link.label}
              </a>
            ))}
          </nav>

          <div className="pt-4 border-t border-slate-200 dark:border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Language / Til:</span>
              <div className="flex gap-2">
                <button
                  onClick={() => setLanguage('UZ')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold ${
                    language === 'UZ' ? 'bg-amber-500 text-slate-950' : 'bg-slate-100 dark:bg-slate-900 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  UZ 🇺🇿
                </button>
                <button
                  onClick={() => setLanguage('EN')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold ${
                    language === 'EN' ? 'bg-amber-500 text-slate-950' : 'bg-slate-100 dark:bg-slate-900 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  EN 🇬🇧
                </button>
                <button
                  onClick={() => setLanguage('RU')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold ${
                    language === 'RU' ? 'bg-amber-500 text-slate-950' : 'bg-slate-100 dark:bg-slate-900 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  RU 🇷🇺
                </button>
              </div>
            </div>

            {currentUser ? (
              <div className="flex items-center justify-between pt-2">
                <div>
                  <p className="text-sm font-bold text-slate-900 dark:text-white">
                    {userProfile?.displayName || currentUser.email}
                  </p>
                  <p className="text-xs text-amber-500 font-semibold">{activeRole}</p>
                </div>
                <button
                  onClick={() => {
                    logout();
                    setIsMobileMenuOpen(false);
                  }}
                  className="px-3 py-1.5 text-xs font-bold text-red-500 bg-red-500/10 rounded-lg"
                >
                  {t.nav.logout}
                </button>
              </div>
            ) : (
              <button
                onClick={() => {
                  onOpenAuth();
                  setIsMobileMenuOpen(false);
                }}
                className="w-full py-3 rounded-xl bg-amber-500 text-slate-950 font-bold text-sm shadow-md"
              >
                {t.nav.login}
              </button>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
