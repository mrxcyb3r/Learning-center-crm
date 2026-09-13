import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'motion/react';
import { Mail, Lock, Eye, EyeOff, AlertCircle, Loader2, ShieldCheck } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { DEMO_ADMIN_EMAIL, DEMO_ADMIN_PASSWORD, DEMO_TEACHER_EMAIL, DEMO_TEACHER_PASSWORD, DEMO_RECEPTIONIST_EMAIL, DEMO_RECEPTIONIST_PASSWORD } from '../../services/demoProvisioning';

export const AdminLoginPage: React.FC = () => {
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

  const roleLabel = (r: 'admin' | 'teacher' | 'receptionist') =>
    r === 'admin' ? 'Admin' : r === 'teacher' ? 'O‘qituvchi' : 'Qabulxona';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await loginWithEmail(email, password);
      // Role verification happens in AuthContext via Firestore
      // Check role after login
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
        return 'Bu email manzil bilan hisob topilmadi.';
      case 'auth/wrong-password':
      case 'auth/invalid-credential':
        return 'Email yoki parol noto‘g‘ri. Qayta urinib ko‘ring.';
      case 'auth/invalid-email':
        return 'Email manzili formati noto‘g‘ri.';
      case 'auth/user-disabled':
        return 'Bu hisob o‘chirilgan. Administrator bilan bog‘laning.';
      case 'auth/too-many-requests':
        return 'Juda ko‘p urinish. Birozdan keyin qayta urinib ko‘ring.';
      case 'auth/network-request-failed':
        return 'Tarmoq xatosi. Internet aloqasini tekshiring.';
      default:
        return err.message || 'Kirishda xatolik yuz berdi. Qayta urinib ko‘ring.';
    }
  };

  // Demo login handlers
  const handleDemoAdminLogin = async () => {
    setError('');
    setIsLoading(true);
    try {
      await loginWithEmail(DEMO_ADMIN_EMAIL, DEMO_ADMIN_PASSWORD);
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

  const handleDemoReceptionistLogin = async () => {
    setError('');
    setIsLoading(true);
    try {
      await loginWithEmail(DEMO_RECEPTIONIST_EMAIL, DEMO_RECEPTIONIST_PASSWORD);
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
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 px-4 py-8 sm:py-12 overflow-x-hidden">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md"
      >
        <div className="text-center mb-6 sm:mb-8">
          <div className="w-16 h-16 rounded-2xl bg-amber-500 mx-auto mb-4 flex items-center justify-center shadow-lg shadow-amber-500/20">
            <ShieldCheck className="w-8 h-8 text-slate-950" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            {selectedRole ? `${roleLabel(selectedRole)} — Kirish` : 'CenterFlow'}
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-2 text-sm">
            {selectedRole ? "Tizimga kirish uchun ma'lumotlaringizni kiriting" : 'CenterFlow tizimiga kirish'}
          </p>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 sm:p-8 shadow-xl overflow-hidden">
          {error && (
            <div className="mb-5 p-4 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 flex items-start gap-3 text-red-700 dark:text-red-300 text-sm break-words">
              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <span className="min-w-0">{error}</span>
            </div>
          )}

          {/* Role hint — visual only, never grants privileges */}
          <div className="mb-5">
            <h3 className="text-xs font-black text-slate-700 dark:text-slate-300 mb-2.5 uppercase tracking-wider">Qanday rolda kirish kerak?</h3>
            <div className="grid grid-cols-3 gap-2">
              {(['admin', 'teacher', 'receptionist'] as const).map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => handleRoleSelect(r)}
                  className={`py-2 px-1 rounded-xl text-[11px] font-bold border transition cursor-pointer truncate ${
                    selectedRole === r
                      ? 'bg-amber-500 text-slate-950 border-amber-500 shadow-sm'
                      : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-amber-400'
                  }`}
                >
                  {r === 'admin' ? 'Admin' : r === 'teacher' ? "O'qituvchi" : 'Qabulxona'}
                </button>
              ))}
            </div>
          </div>

          {/* Normal login — email/password */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <h3 className="text-xs font-black text-slate-700 dark:text-slate-300 uppercase tracking-wider">Kirish</h3>
            <div>
              <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1.5">Email</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="email@markaz.uz"
                  autoComplete="email"
                  required
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1.5">Parol</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  required
                  className="w-full pl-10 pr-11 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                  aria-label={showPassword ? 'Parolni yashirish' : "Parolni ko'rsatish"}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <button
              type="submit"
              disabled={isLoading || !email.trim() || !password}
              className="w-full py-2.5 rounded-xl bg-slate-900 dark:bg-amber-500 hover:opacity-90 text-white dark:text-slate-950 font-bold text-sm shadow-md transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <span className="inline-flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" /> Kirilmoqda...
                </span>
              ) : (
                'Kirish'
              )}
            </button>
            <button
              type="button"
              onClick={handleGoogleLogin}
              disabled={isGoogleLoading || isLoading}
              className="w-full py-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-bold text-sm hover:bg-slate-50 dark:hover:bg-slate-700 transition cursor-pointer disabled:opacity-50"
            >
              {isGoogleLoading ? 'Google orqali kirilmoqda...' : 'Google orqali kirish'}
            </button>
          </form>

          <div className="flex items-center gap-3 my-5">
            <span className="flex-1 h-px bg-slate-200 dark:bg-slate-800" />
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Demo sifatida kirish</span>
            <span className="flex-1 h-px bg-slate-200 dark:bg-slate-800" />
          </div>

          {/* Demo Login Section — high-contrast, always visible, responsive */}
          <div>
            <h3 className="text-xs font-black text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-3">Demo hisoblari</h3>
            <div className="space-y-2">
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                <div className="text-xs font-black text-slate-900 dark:text-white">Admin</div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400">Administrator demo hisobi • {DEMO_ADMIN_EMAIL}</div>
                <button
                  type="button"
                  onClick={handleDemoAdminLogin}
                  disabled={isLoading}
                  className="mt-2 w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-sm shadow-md shadow-amber-500/20 transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? 'Kirilmoqda...' : 'Admin sifatida kirish'}
                </button>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                <div className="text-xs font-black text-slate-900 dark:text-white">Qabulxona</div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400">Receptionist demo hisobi • {DEMO_RECEPTIONIST_EMAIL}</div>
                <button
                  type="button"
                  onClick={handleDemoReceptionistLogin}
                  disabled={isLoading}
                  className="mt-2 w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-sm shadow-md shadow-emerald-500/20 transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Qabulxona sifatida kirish
                </button>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                <div className="text-xs font-black text-slate-900 dark:text-white">O‘qituvchi</div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400">Jasur Alimov • {DEMO_TEACHER_EMAIL}</div>
                <button
                  type="button"
                  onClick={handleDemoTeacherLogin}
                  disabled={isLoading}
                  className="mt-2 w-full py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-black text-sm shadow-md shadow-sky-500/20 transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  O‘qituvchi sifatida kirish
                </button>
              </div>
            </div>
          </div>

          {/* Guest access notice */}
          <p className="mt-6 text-xs text-slate-500 dark:text-slate-400 text-center break-words">
            Yoki <a href="/app" className="text-amber-600 dark:text-amber-400 hover:text-amber-500 transition font-bold">Bosh sahifaga o'ting</a> — tizimga kirgan foydalanuvchilar uchun.
          </p>
        </div>
      </motion.div>
    </div>
  );
};