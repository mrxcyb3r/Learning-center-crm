import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { subscribeSecurityPins, SecurityPinsData } from '../../services/firestore';
import { TelegramBotConnectModal } from './TelegramBotConnectModal';
import { useKeyboardShortcuts } from '../../hooks/useKeyboardShortcuts';
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
  GraduationCap,
  Shield,
  UserCheck,
  RefreshCw,
  CheckCircle2,
  MailWarning,
  Send
} from 'lucide-react';
import { UserRole } from '../../types';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose }) => {
  const { t } = useLanguage(); // Single Source of Truth for Language
  const {
    loginWithEmail,
    registerWithEmail,
    loginWithGoogle,
    loginAsDemoUser,
    isLoading,
    currentUser,
    isEmailVerified,
    unverifiedUserEmail,
    resendVerificationEmail,
    checkEmailVerification
  } = useAuth();

  // Key binding hook to close modal on Escape
  useKeyboardShortcuts({ onEscape: onClose, enabled: isOpen });

  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');
  const [selectedRole, setSelectedRole] = useState<UserRole>('student');
  const [securityPin, setSecurityPin] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');

  const [showPassword, setShowPassword] = useState(false);
  const [showPin, setShowPin] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [resendLoading, setResendLoading] = useState(false);
  const [showTelegramConnect, setShowTelegramConnect] = useState(false);

  const [livePins, setLivePins] = useState<SecurityPinsData>({
    adminPin: 'secureadmin',
    teacherPin: 'secureteacher',
    studentPin: 'securestudent'
  });

  useEffect(() => {
    const unsub = subscribeSecurityPins((pins) => {
      setLivePins(pins);
    });
    return () => unsub();
  }, []);

  if (!isOpen) return null;

  // Validate security PIN before executing authentication
  const validatePin = (): boolean => {
    const entered = securityPin.trim();
    if (selectedRole === 'student') {
      const expected = livePins.studentPin || 'securestudent';
      if (entered !== expected) {
        setErrorMsg(
          t.auth.invalidPinStudent || `Xato PIN! Student sifatida kirish uchun PIN: '${expected}'`
        );
        return false;
      }
    } else if (selectedRole === 'teacher') {
      const expected = livePins.teacherPin || 'secureteacher';
      if (entered !== expected) {
        setErrorMsg(
          t.auth.invalidPinTeacher || `Xato PIN! O'qituvchi sifatida kirish uchun PIN: '${expected}'`
        );
        return false;
      }
    } else if (selectedRole === 'admin' || selectedRole === 'superadmin') {
      const expected = livePins.adminPin || 'secureadmin';
      if (entered !== expected) {
        setErrorMsg(
          t.auth.invalidPinAdmin || `Xato PIN! Admin sifatida kirish uchun PIN: '${expected}'`
        );
        return false;
      }
    }
    return true;
  };

  const handleResendLink = async () => {
    setErrorMsg('');
    setSuccessMsg('');
    setResendLoading(true);
    try {
      await resendVerificationEmail();
      setSuccessMsg(t.auth.verificationSentSuccess || 'Verification email resent! Check your inbox.');
    } catch (err: any) {
      console.error('Resend verification error:', err);
      setErrorMsg(err?.message || 'Failed to resend verification email.');
    } finally {
      setResendLoading(false);
    }
  };

  const handleCheckVerification = async () => {
    setErrorMsg('');
    setSuccessMsg('');
    setResendLoading(true);
    try {
      const verified = await checkEmailVerification();
      if (verified) {
        setSuccessMsg(t.auth.emailVerifiedSuccess || 'Email successfully verified! Welcome.');
        setTimeout(() => {
          onClose();
        }, 1000);
      } else {
        setErrorMsg('Email is still not verified. Please click the link in your inbox.');
      }
    } catch (err: any) {
      console.error('Check verification error:', err);
      setErrorMsg(err?.message || 'Error checking email status.');
    } finally {
      setResendLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!validatePin()) {
      return;
    }

    try {
      if (activeTab === 'login') {
        await loginWithEmail(email, password, selectedRole);
      } else {
        await registerWithEmail(email, password, displayName, selectedRole);
        setSuccessMsg(t.auth.verificationSentSuccess || 'Verification email sent! Please check your inbox.');
      }

      if (isEmailVerified || activeTab === 'register') {
        // Unverified users stay on verification screen
      } else {
        if (selectedRole === 'student' || selectedRole === 'teacher') {
          setShowTelegramConnect(true);
        } else {
          onClose();
        }
      }
    } catch (err: any) {
      console.error('Auth Error:', err);
      const code = err?.code || '';
      const message = err?.message || '';

      if (code === 'auth/unauthorized-domain' || message.includes('unauthorized-domain')) {
        setErrorMsg('Domain error: This preview host is not listed under Firebase Auth Authorized Domains. Use Email & Password or Demo Quick Login.');
      } else if (
        code === 'auth/invalid-credential' ||
        message.includes('auth/invalid-credential') ||
        code === 'auth/user-not-found' ||
        code === 'auth/wrong-password' ||
        message.includes('invalid-credential')
      ) {
        setErrorMsg(
          activeTab === 'login'
            ? "Noto'g'ri email yoki parol (auth/invalid-credential). Agar hisobingiz bo'lmasa, Ro'yxatdan o'tish (Register) bo'limiga o'ting yoki Fast Demo login tugmasidan foydalaning."
            : "Kiritilgan ma'lumotlar mos kelmadi. Iltimos, boshqa email va parol kiriting."
        );
      } else if (code === 'auth/email-already-in-use' || message.includes('email-already-in-use')) {
        setErrorMsg("Ushbu email bilan allaqachon hisob yaratilgan. Kirish (Sign In) bo'limiga o'ting.");
      } else if (code === 'auth/invalid-email' || message.includes('invalid-email')) {
        setErrorMsg("Email manzili noto'g'ri formatda kiritilgan.");
      } else if (code === 'auth/weak-password' || message.includes('weak-password')) {
        setErrorMsg("Parol juda qisqa (kamida 6 ta belgi bo'lishi kerak).");
      } else {
        setErrorMsg(err?.message || 'Authentication failed. Please check credentials.');
      }
    }
  };

  const handleGoogleSignIn = async () => {
    setErrorMsg('');
    setSuccessMsg('');

    if (!validatePin()) {
      return;
    }

    try {
      await loginWithGoogle(selectedRole);
      if (selectedRole === 'student' || selectedRole === 'teacher') {
        setShowTelegramConnect(true);
      } else {
        onClose();
      }
    } catch (err: any) {
      console.error('Google Auth Error:', err);
      if (err?.code === 'auth/unauthorized-domain' || err?.message?.includes('unauthorized-domain') || err?.message?.includes('Authorized Domains')) {
        setErrorMsg('Domain Error: Google Sign-In requires adding preview domain to Firebase Console. Please log in using Email & Password or use 1-Click Demo Login below!');
      } else {
        setErrorMsg(err?.message || 'Google Sign-In failed.');
      }
    }
  };

  const isGoogleUser = currentUser?.providerData?.some((p) => p.providerId === 'google.com');
  const showUnverifiedScreen = currentUser && !isEmailVerified && !isGoogleUser;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      <div
        data-aos="zoom-in"
        className="relative w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden p-6 sm:p-8 transition-colors duration-200"
      >
        {/* Header Bar (Modal Title & Close Button) */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center border border-amber-500/20 font-black">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <span className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-slate-200">
              Renessans LC CenterFlow
            </span>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* UNVERIFIED EMAIL WARNING SCREEN */}
        {showUnverifiedScreen ? (
          <div className="text-center py-4 animate-fadeIn">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-amber-500/10 text-amber-500 mb-4 border border-amber-500/20">
              <MailWarning className="w-7 h-7" />
            </div>
            <h3 className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight mb-2">
              {t.auth.unverifiedTitle || 'Email Verification Required'}
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed max-w-sm mx-auto mb-4">
              {t.auth.unverifiedNotice ||
                'A verification link was sent to your email address. Please verify your email before accessing the dashboard.'}
            </p>
            <div className="p-3 bg-slate-100 dark:bg-slate-800/60 rounded-xl font-mono text-xs text-amber-600 dark:text-amber-400 font-bold mb-5 break-all">
              {unverifiedUserEmail || currentUser?.email}
            </div>

            {/* Error & Success Messages */}
            {errorMsg && (
              <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-xs flex items-center gap-2 text-left">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}
            {successMsg && (
              <div className="mb-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs flex items-center gap-2 text-left">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{successMsg}</span>
              </div>
            )}

            <div className="space-y-2.5">
              <button
                type="button"
                onClick={handleCheckVerification}
                disabled={resendLoading}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-md shadow-amber-500/20 transition cursor-pointer disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${resendLoading ? 'animate-spin' : ''}`} />
                <span>{t.auth.checkVerificationBtn || "I've Verified, Check Status"}</span>
              </button>

              <button
                type="button"
                onClick={handleResendLink}
                disabled={resendLoading}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs border border-slate-200 dark:border-slate-700 transition cursor-pointer disabled:opacity-50"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{t.auth.resendVerificationBtn || 'Resend Verification Email'}</span>
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* Modal Subtitle Header */}
            <div className="text-center mb-5">
              <h3 className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                {activeTab === 'login' ? t.auth.welcomeLogin : t.auth.welcomeRegister}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                CenterFlow Educational Management System
              </p>
            </div>

            {/* Tab Switcher (Sign In vs Sign Up) */}
            <div className="grid grid-cols-2 p-1 mb-5 bg-slate-100 dark:bg-slate-800/60 rounded-2xl">
              <button
                type="button"
                onClick={() => {
                  setActiveTab('login');
                  setErrorMsg('');
                  setSuccessMsg('');
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
                  setSuccessMsg('');
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

            {/* Security PIN Field (Enforced for Student / Teacher / Admin) */}
            <div className="mb-4 p-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 animate-fadeIn">
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-amber-700 dark:text-amber-400 flex items-center gap-1.5">
                  <Key className="w-3.5 h-3.5 text-amber-500" />
                  <span>
                    {selectedRole === 'student'
                      ? t.auth.pinLabelStudent || 'Student Security PIN'
                      : selectedRole === 'teacher'
                      ? t.auth.pinLabelTeacher
                      : t.auth.pinLabelAdmin}
                  </span>
                </label>
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
                  placeholder="••••••••"
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

            {/* Error Alert Box */}
            {errorMsg && (
              <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-xs flex flex-col gap-2 animate-shake">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span className="leading-relaxed">{errorMsg}</span>
                </div>
                {(errorMsg.includes('invalid-credential') || errorMsg.includes("Noto'g'ri email") || errorMsg.includes('Ro\'yxatdan o\'tish')) && (
                  <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-red-500/20 mt-1">
                    {activeTab === 'login' && (
                      <button
                        type="button"
                        onClick={() => {
                          setActiveTab('register');
                          setErrorMsg('');
                        }}
                        className="px-2.5 py-1 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-700 dark:text-red-300 font-bold text-[11px] transition cursor-pointer"
                      >
                        👉 Ro'yxatdan o'tish (Sign Up)
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={async () => {
                        await loginAsDemoUser(selectedRole);
                        onClose();
                      }}
                      className="px-2.5 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-700 dark:text-amber-300 font-bold text-[11px] transition cursor-pointer"
                    >
                      ⚡ 1-Click Fast Demo Login
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Success Alert Box */}
            {successMsg && (
              <div className="mb-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{successMsg}</span>
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

            {/* Quick Demo Login Section */}
            <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-800 space-y-3">
              {/* Telegram Bot Direct Connection CTA */}
              <button
                type="button"
                onClick={() => setShowTelegramConnect(true)}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-[#229ED9] hover:bg-[#1f91c7] text-white font-bold text-xs shadow-md shadow-[#229ED9]/20 transition cursor-pointer"
              >
                <Send className="w-4 h-4" />
                <span>🚀 Connect @CenterFlowBot (Real-Time Alerts)</span>
              </button>

              <div className="flex items-center justify-between mb-1">
                <span className="text-[11px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  ⚡ Fast Demo Access
                </span>
                <span className="text-[10px] text-amber-500 font-bold">1-Click Login</span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={async () => {
                    await loginAsDemoUser('student');
                    setShowTelegramConnect(true);
                  }}
                  className="py-2 px-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30 text-[11px] font-bold transition cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <GraduationCap className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                  <span>Student</span>
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    await loginAsDemoUser('teacher');
                    setShowTelegramConnect(true);
                  }}
                  className="py-2 px-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30 text-[11px] font-bold transition cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <UserCheck className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                  <span>Teacher</span>
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    await loginAsDemoUser('admin');
                    onClose();
                  }}
                  className="py-2 px-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30 text-[11px] font-bold transition cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <Shield className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                  <span>Admin</span>
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      <TelegramBotConnectModal
        isOpen={showTelegramConnect}
        onClose={() => {
          setShowTelegramConnect(false);
          onClose();
        }}
        onComplete={() => {
          setShowTelegramConnect(false);
          onClose();
        }}
      />
    </div>
  );
};
