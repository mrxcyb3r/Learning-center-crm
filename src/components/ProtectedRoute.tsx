import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Loader2, ShieldAlert, Lock, ArrowLeft } from 'lucide-react';

type RequiredRole = 'admin' | 'teacher' | 'superadmin' | 'support' | 'any';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: RequiredRole;
  fallbackPath?: string;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requiredRole = 'any',
  fallbackPath
}) => {
  const { currentUser, role, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
      </div>
    );
  }

  if (!currentUser) {
    return <Navigate to={fallbackPath || '/login/admin'} state={{ from: location }} replace />;
  }

  const hasAccess = (): boolean => {
    switch (requiredRole) {
      case 'admin':
        return role === 'admin' || role === 'superadmin';
      case 'teacher':
        return role === 'teacher';
      case 'superadmin':
        return role === 'superadmin';
      case 'support':
        return role === 'support';
      case 'any':
        return role !== 'guest';
      default:
        return false;
    }
  };

  if (!hasAccess()) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 px-4">
        <div className="p-8 rounded-3xl bg-slate-900/90 border border-red-500/30 text-center max-w-md mx-auto shadow-2xl backdrop-blur-md">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-red-500/10 border border-red-500/30 flex items-center justify-center text-red-400">
            <ShieldAlert className="w-8 h-8" />
          </div>

          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-500/15 border border-red-500/30 text-red-300 font-extrabold text-xs mb-3">
            <Lock className="w-3.5 h-3.5" />
            <span>Access Denied</span>
          </div>

          <h3 className="text-xl font-black text-white mb-2">Insufficient Permissions</h3>
          <p className="text-xs text-slate-400 leading-relaxed mb-6 max-w-md mx-auto">
            Your account does not have the required role to access this area. Please contact an administrator if you believe this is an error.
          </p>

          <button
            onClick={() => window.history.back()}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs transition cursor-pointer border border-slate-700"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Go Back</span>
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};