import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'motion/react';
import { Mail, Lock, Eye, EyeOff, AlertCircle, Loader2, GraduationCap } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { DEMO_TEACHER_EMAIL, DEMO_TEACHER_PASSWORD } from '../../services/demoProvisioning';

export const TeacherLoginPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { loginWithEmail, loginWithGoogle, logout, isLoading: authLoading, role, refreshUserRole } = useAuth();
  const { theme } = useTheme();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  const [selectedRole, setSelectedRole] = useState<'admin' | 'teacher' | 'receptionist' | null>(null);

  const from = (location.state as any)?.from?.pathname || '/app';

  // Determine workspace after login based on role
  const resolveLanding = () => {
    if (role === 'support') return '/support';
    if (role === 'teacher') return '/app';
    // Admin/receptionist go to /app, then sidebar determines workspace
    return '/app';
  };

  // Handle role selection for demo/login purposes
  const handleRoleSelect = (role: 'admin' | 'teacher' | 'receptionist') => {
    setSelectedRole(role);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await loginWithEmail(email, password);
      // Role verification happens in AuthContext via Firestore
      setTimeout(async () => {
        await refreshUserRole();
        navigate(resolveLanding(), { replace: true });
      }, 200);
    } catch (err: any) {
      setError(getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

const handleGoogleLogin = async () => {
    setError('');
    setIsGoogleLoading(true);
    try {
      await loginWithGoogle();
      setTimeout(async () => {
        await refreshUserRole();
        navigate(resolveLanding(), { replace: true });
      }, 200);
    } catch (err: any) {
      setError(getErrorMessage(err));
    } finally {
      setIsGoogleLoading(false);
    }
  };

  const getErrorMessage = (err: any): string => {
    switch (err.code) {
      case 'auth/user-not-found':
        return 'No account found with this email address.';
      case 'auth/wrong-password':
        return 'Incorrect password. Please try again.';
      case 'auth/invalid-email':
        return 'Invalid email address format.';
      case 'auth/user-disabled':
        return 'This account has been disabled. Contact support.';
      case 'auth/too-many-requests':
        return 'Too many failed attempts. Please try again later.';
      case 'auth/network-request-failed':
        return 'Network error. Please check your connection.';
      default:
        return err.message || 'Login failed. Please try again.';
    }
  };

  // Demo login handler
  const handleDemoTeacherLogin = async () => {
    setError('');
    setIsLoading(true);
    try {
      await loginWithEmail(DEMO_TEACHER_EMAIL, DEMO_TEACHER_PASSWORD);
      setTimeout(async () => {
        await refreshUserRole();
        navigate(resolveLanding(), { replace: true });
      }, 200);
    } catch (err: any) {
      setError(getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
      </div>
    );
  }

  // If role is already known from Firestore, show role-specific dashboard
  if (role && role !== 'guest' && !selectedRole) {
    setTimeout(() => navigate(resolveLanding(), { replace: true }), 100);
    return null; // Prevent rendering login form after redirect
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 px-4 py-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md"
      >
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-sky-500 mx-auto mb-4 flex items-center justify-center shadow-lg shadow-sky-500/20">
            <GraduationCap className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            {selectedRole ? `${selectedRole.charAt(0).toUpperCase() + selectedRole.slice(1)} Kirish` : 'CenterFlow'}
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-2">
            {selectedRole ? 'Ro\'yxatdan o\'tish uchun tizimga kiriting' : 'CenterFlow tizimiga kirish'}
          </p>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-8 shadow-xl">
          {error && (
            <div className="mb-6 p-4 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-200 dark:border-red-800 flex items-center gap-3 text-red-700 dark:text-red-300 text-sm">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Role Selection Form */}
          {selectedRole === null && (
            <form onSubmit={(e) => {
              e.preventDefault();
              handleRoleSelect('teacher');
            }} className="space-y-5 mb-8">
              <h3 className="text-sm font-black text-slate-900 dark:text-white mb-3 uppercase tracking-wider">Qanday rolda kirish kerak?</h3>
              <div>
                <button
                  type="button"
                  onClick={() => handleRoleSelect('admin')}
                  className={`w-full py-3 rounded-xl bg-amber-50 hover:bg-amber-100 text-slate-900 dark:text-slate-200 border border-amber-200 dark:border-amber-400 text-xs font-bold flex items-center justify-center gap-2 transition cursor-pointer ${
                    selectedRole === 'admin'
                      ? 'bg-amber-100 text-amber-800 border-amber-400'
                      : ''}`}
                >
                  <div className="w-3 h-3 rounded-full bg-amber-500 shrink-0" />
                  <span>Admin / Direktor</span>
                </button>
              </div>
              <div>
                <button
                  type="button"
                  onClick={() => handleRoleSelect('teacher')}
                  className={`w-full py-3 rounded-xl bg-sky-50 hover:bg-sky-100 text-slate-900 dark:text-slate-200 border border-sky-200 dark:border-sky-400 text-xs font-bold flex items-center justify-center gap-2 transition cursor-pointer ${
                    selectedRole === 'teacher'
                      ? 'bg-sky-100 text-sky-800 border-sky-400'
                      : ''}`}
                >
                  <div className="w-3 h-3 rounded-full bg-sky-500 shrink-0" />
                  <span>O'qituvchi</span>
                </button>
              </div>
              <div>
                <button
                  type="button"
                  onClick={() => handleRoleSelect('receptionist')}
                  className={`w-full py-3 rounded-xl bg-rose-50 hover:bg-rose-100 text-slate-900 dark:text-slate-200 border border-rose-200 dark:border-rose-400 text-xs font-bold flex items-center justify-center gap-2 transition cursor-pointer ${
                    selectedRole === 'receptionist'
                      ? 'bg-rose-100 text-rose-800 border-rose-400'
                      : ''}`}
                >
                  <div className="w-3 h-3 rounded-full bg-rose-500 shrink-0" />
                  <span>Qabulxona</span>
                </button>
              </div>
            </form>
          )}

          {/* Demo Login Section */}
          <div>
            <h3 className="text-xs font-black text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-3">Demo hisoblari</h3>
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div>
                <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">O'qituvchi</label>
                <input
                  type="text"
                  value={DEMO_TEACHER_EMAIL}
                  readOnly
                  className="w-full py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>
              <div>
                <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">Parol</label>
                <input
                  type="text"
                  value={DEMO_TEACHER_PASSWORD}
                  readOnly
                  className="w-full py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>
            </div>
            <button
              type="button"
              onClick={() => handleDemoTeacherLogin()}
              className="w-full py-2.5 rounded-xl bg-sky-50 hover:bg-sky-400 text-white font-black text-xs shadow-md shadow-sky-500/20 transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              O'qituvchi sifatida kirish
            </button>
          </div>

          {/* Guest access notice */}
          <p className="mt-6 text-xs text-slate-500 dark:text-slate-400 text-center">
            Yoki <a href="/app" className="text-amber-600 dark:text-amber-400 hover:text-amber-500 transition">Bosh sahifaga o'ting</a> — avval ro\'yxatdan o\'tgan foydalanuvchilar uchun.
          </p>
        </div>
      </motion.div>
    </div>
  );
};