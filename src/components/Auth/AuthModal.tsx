import React, { useState } from 'react';
import { useAuth, SUPER_ADMIN_UUID } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import {
  X,
  Mail,
  Lock,
  User,
  ShieldCheck,
  Key,
  AlertCircle,
  Eye,
  EyeOff,
  Globe,
  GraduationCap,
  Shield,
  UserCheck
} from 'lucide-react';
import { UserRole } from '../../types';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose }) => {
  const { language, setLanguage, t } = useLanguage();
  const { loginWithEmail, registerWithEmail, loginWithGoogle, loginAsDemoUser, isLoading } = useAuth();

  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');
  const [selectedRole, setSelectedRole] = useState<UserRole>('student');
  const [securityPin, setSecurityPin] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  
  const [showPassword, setShowPassword] = useState(false);
  const [showPin, setShowPin] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  // Validate security PIN before executing authentication
  const validatePin = (): boolean => {
    if (selectedRole === 'teacher') {
      if (securityPin.trim() !== 'secureteacher') {
        setErrorMsg(t.auth.invalidPinTeacher);
        return false;
      }
    } else if (selectedRole === 'admin' || selectedRole === 'superadmin') {
      if (securityPin.trim() !== 'secureadmin') {
        setErrorMsg(t.auth.invalidPinAdmin);
        return false;
      }
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    // Enforce PIN security rule BEFORE calling auth
    if (!validatePin()) {
      return;
    }

    try {
      if (activeTab === 'login') {
        await loginWithEmail(email, password);
      } else {
        await registerWithEmail(email, password, displayName, selectedRole);
      }
      onClose();
    } catch (err: any) {
      console.error('Auth Error:', err);
      if (err?.code === 'auth/unauthorized-domain' || err?.message?.includes('unauthorized-domain')) {
        setErrorMsg('Domain error: This preview host is not listed under Firebase Auth Authorized Domains. Use Email & Password or Demo Quick Login.');
      } else {
        setErrorMsg(err?.message || 'Authentication failed. Please check credentials.');
      }
    }
  };

  const handleGoogleSignIn = async () => {
    setErrorMsg('');

    // Enforce PIN security rule BEFORE calling Google OAuth popup
    if (!validatePin()) {
      return;
    }

    try {
      await loginWithGoogle(selectedRole);
      onClose();
    } catch (err: any) {
      console.error('Google Auth Error:', err);
      if (err?.code === 'auth/unauthorized-domain' || err?.message?.includes('unauthorized-domain')) {
        setErrorMsg('Google OAuth Note: Domain is not authorized in Firebase Console for popup auth. Use Email / Password or Fast Demo Login below.');
      } else {
        setErrorMsg(err?.message || 'Google Sign-In failed.');
      }
    }
  };

  const handleDemoSignIn = async (role: UserRole) => {
    setErrorMsg('');
    try {
      await loginAsDemoUser(role);
      onClose();
    } catch (err: any) {
      console.error('Demo Auth Error:', err);
      setErrorMsg('Demo sign in failed.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden p-6 sm:p-8 transition-colors duration-200">
        
        {/* Top Header Controls: Language Switcher & Close Button */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-xl border border-slate-200/80 dark:border-slate-700/60">
            <Globe className="w-3.5 h-3.5 text-amber-500 ml-1.5" />
            <button
              onClick={() => setLanguage('UZ')}
              className={`px-2 py-1 text-[11px] font-bold rounded-lg transition cursor-pointer ${
                language === 'UZ'
                  ? 'bg-amber-500 text-slate-950 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              UZ 🇺🇿
            </button>
            <button
              onClick={() => setLanguage('EN')}
              className={`px-2 py-1 text-[11px] font-bold rounded-lg transition cursor-pointer ${
                language === 'EN'
                  ? 'bg-amber-500 text-slate-950 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              EN 🇬🇧
            </button>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Branding Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-500 mb-3 border border-amber-500/20">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <h3 className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Camelot LC CenterFlow
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            {activeTab === 'login' ? t.auth.welcomeLogin : t.auth.welcomeRegister}
          </p>
        </div>

        {/* Tab Switcher (Sign In vs Sign Up) */}
        <div className="grid grid-cols-2 p-1 mb-5 bg-slate-100 dark:bg-slate-800/60 rounded-2xl">
          <button
            type="button"
            onClick={() => {
              setActiveTab('login');
              setErrorMsg('');
            }}
            className={`py-2 text-xs font-bold rounded-xl transition cursor-pointer ${
              activeTab === 'login'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
            }`}
          >
            {t.auth.loginTab}
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab('register');
              setErrorMsg('');
            }}
            className={`py-2 text-xs font-bold rounded-xl transition cursor-pointer ${
              activeTab === 'register'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
            }`}
          >
            {t.auth.registerTab}
          </button>
        </div>

        {/* Role Selector Tabs (Student / Teacher / Admin) */}
        <div className="mb-5">
          <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
            {t.auth.roleLabel}
          </label>
          <div className="grid grid-cols-3 gap-1.5 p-1 bg-slate-100 dark:bg-slate-800/60 rounded-xl">
            <button
              type="button"
              onClick={() => {
                setSelectedRole('student');
                setErrorMsg('');
              }}
              className={`flex items-center justify-center gap-1 py-2 px-1 text-[11px] font-bold rounded-lg transition cursor-pointer ${
                selectedRole === 'student'
                  ? 'bg-amber-500 text-slate-950 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <GraduationCap className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">{t.auth.studentRole}</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setSelectedRole('teacher');
                setErrorMsg('');
              }}
              className={`flex items-center justify-center gap-1 py-2 px-1 text-[11px] font-bold rounded-lg transition cursor-pointer ${
                selectedRole === 'teacher'
                  ? 'bg-amber-500 text-slate-950 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <UserCheck className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">{t.auth.teacherRole}</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setSelectedRole('admin');
                setErrorMsg('');
              }}
              className={`flex items-center justify-center gap-1 py-2 px-1 text-[11px] font-bold rounded-lg transition cursor-pointer ${
                selectedRole === 'admin' || selectedRole === 'superadmin'
                  ? 'bg-amber-500 text-slate-950 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Shield className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">{t.auth.adminRole}</span>
            </button>
          </div>
        </div>

        {/* Security PIN Field (Enforced for Teacher / Admin) */}
        {selectedRole !== 'student' && (
          <div className="mb-4 p-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 animate-fadeIn">
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-amber-700 dark:text-amber-400 flex items-center gap-1.5">
                <Key className="w-3.5 h-3.5 text-amber-500" />
                <span>
                  {selectedRole === 'teacher' ? t.auth.pinLabelTeacher : t.auth.pinLabelAdmin}
                </span>
              </label>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-800 dark:text-amber-300 font-bold">
                {selectedRole === 'teacher' ? 'secureteacher' : 'secureadmin'}
              </span>
            </div>
            <div className="relative">
              <input
                type={showPin ? 'text' : 'password'}
                required
                value={securityPin}
                onChange={(e) => {
                  setSecurityPin(e.target.value);
                  setErrorMsg('');
                }}
                placeholder={
                  selectedRole === 'teacher'
                    ? t.auth.pinPlaceholderTeacher
                    : t.auth.pinPlaceholderAdmin
                }
                className="w-full pl-3 pr-10 py-2 rounded-xl bg-white dark:bg-slate-900 border border-amber-500/40 text-xs font-mono text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
              <button
                type="button"
                onClick={() => setShowPin(!showPin)}
                className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              >
                {showPin ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>
        )}

        {/* Error Alert Box */}
        {errorMsg && (
          <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-xs flex items-center gap-2 animate-shake">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Authentication Form */}
        <form onSubmit={handleSubmit} className="space-y-3.5">
          {activeTab === 'register' && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                {t.auth.nameLabel}
              </label>
              <div className="relative">
                <User className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
                <input
                  type="text"
                  required
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Jasur Rahimov"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500 transition"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              {t.auth.emailLabel}
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500 transition"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              {t.auth.passwordLabel}
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500 transition"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-md shadow-amber-500/20 transition cursor-pointer disabled:opacity-50 mt-1"
          >
            {isLoading ? '...' : activeTab === 'login' ? t.auth.loginBtn : t.auth.registerBtn}
          </button>
        </form>

        {/* Divider */}
        <div className="relative my-5">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-200 dark:border-slate-800" />
          </div>
          <div className="relative flex justify-center text-[10px] uppercase tracking-wider">
            <span className="bg-white dark:bg-slate-900 px-3 text-slate-400 font-bold">
              {t.auth.orText}
            </span>
          </div>
        </div>

        {/* Google OAuth Sign In */}
        <button
          type="button"
          onClick={handleGoogleSignIn}
          disabled={isLoading}
          className="w-full flex items-center justify-center gap-2.5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs border border-slate-200 dark:border-slate-700 transition cursor-pointer"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"
            />
            <path
              fill="#34A853"
              d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.11-6.72-4.96H1.29v3.15C3.26 21.3 7.31 24 12 24z"
            />
            <path
              fill="#FBBC05"
              d="M5.28 14.24c-.25-.72-.38-1.49-.38-2.24s.13-1.52.38-2.24V6.61H1.29C.47 8.24 0 10.06 0 12s.47 3.76 1.29 5.39l3.99-3.15z"
            />
            <path
              fill="#EA4335"
              d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.61l3.99 3.15c.95-2.85 3.6-4.96 6.72-4.96z"
            />
          </svg>
          <span>{t.auth.googleBtn}</span>
        </button>

        {/* SuperAdmin Target Info */}
        <div className="mt-5 pt-3.5 border-t border-slate-100 dark:border-slate-800/80 text-center">
          <p className="text-[10px] text-slate-400 dark:text-slate-500">
            SuperAdmin Account UID:{' '}
            <span className="font-mono text-amber-500 font-bold">{SUPER_ADMIN_UUID.slice(0, 12)}...</span>
          </p>
        </div>
      </div>
    </div>
  );
};

