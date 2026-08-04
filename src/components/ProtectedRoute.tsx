import React from 'react';
import { UserRole, hasRequiredRole } from '../utils/security';
import { ShieldAlert, Lock, ArrowLeft } from 'lucide-react';

interface ProtectedRouteProps {
  userRole: UserRole;
  allowedRoles: UserRole[];
  children: React.ReactNode;
  fallbackTitle?: string;
  fallbackDescription?: string;
  onNavigateBack?: () => void;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  userRole,
  allowedRoles,
  children,
  fallbackTitle = "Access Restricted",
  fallbackDescription = "You do not have the required permissions to access this administrative module or financial workspace.",
  onNavigateBack
}) => {
  const isAuthorized = hasRequiredRole(userRole, allowedRoles);

  if (!isAuthorized) {
    return (
      <div className="p-8 my-6 rounded-3xl bg-slate-900/90 border border-red-500/30 text-center max-w-2xl mx-auto shadow-2xl backdrop-blur-md">
        <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-red-500/10 border border-red-500/30 flex items-center justify-center text-red-400">
          <ShieldAlert className="w-8 h-8" />
        </div>

        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-500/15 border border-red-500/30 text-red-300 font-extrabold text-xs mb-3">
          <Lock className="w-3.5 h-3.5" />
          <span>Role Clearance Needed ({allowedRoles.join(', ')})</span>
        </div>

        <h3 className="text-xl font-black text-white mb-2">{fallbackTitle}</h3>
        <p className="text-xs text-slate-400 leading-relaxed mb-6 max-w-md mx-auto">
          {fallbackDescription}
        </p>

        {onNavigateBack && (
          <button
            onClick={onNavigateBack}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs transition cursor-pointer border border-slate-700"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Return to Safe Workspace</span>
          </button>
        )}
      </div>
    );
  }

  return <>{children}</>;
};
