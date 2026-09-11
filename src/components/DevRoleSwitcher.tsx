import React, { useState } from 'react';
import { useAuth, SUPER_ADMIN_UUID } from '../context/AuthContext';
import { UserRole } from '../types';
import { ShieldCheck, UserCheck, ChevronUp, ChevronDown, Sparkles } from 'lucide-react';

export const DevRoleSwitcher: React.FC = () => {
  const { role, activeRole, setMockRole, resetMockRole, currentUser, userProfile } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  // Dev-only tool. Renders nothing in production builds so frontend-only role
  // switching is never reachable outside development.
  if (!import.meta.env.DEV) {
    return null;
  }

  const roles: { key: UserRole; label: string; badgeColor: string }[] = [
    { key: 'superadmin', label: 'SuperAdmin', badgeColor: 'bg-red-500 text-white' },
    { key: 'admin', label: 'Admin', badgeColor: 'bg-amber-500 text-white' },
    { key: 'teacher', label: 'Teacher', badgeColor: 'bg-emerald-500 text-white' },
    { key: 'student', label: 'Student', badgeColor: 'bg-blue-500 text-white' },
    { key: 'guest', label: 'Guest', badgeColor: 'bg-gray-500 text-white' }
  ];

  return (
    <div className="fixed bottom-4 right-4 z-50 font-sans">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden transition-all duration-300">
        {/* Toggle header bar */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-2.5 px-4 py-2.5 bg-slate-900 dark:bg-slate-800 text-white text-xs font-medium cursor-pointer hover:bg-slate-800 dark:hover:bg-slate-700 transition"
        >
          <Sparkles className="w-4 h-4 text-amber-400 animate-pulse" />
          <span>Dev Role:</span>
          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
            roles.find(r => r.key === activeRole)?.badgeColor || 'bg-slate-700 text-white'
          }`}>
            {activeRole}
          </span>
          {currentUser?.uid === SUPER_ADMIN_UUID && (
            <span className="bg-red-600/30 text-red-300 text-[10px] px-1.5 py-0.5 rounded border border-red-500/40">
              SuperAdmin Match
            </span>
          )}
          {isOpen ? <ChevronDown className="w-4 h-4 ml-1" /> : <ChevronUp className="w-4 h-4 ml-1" />}
        </button>

        {/* Panel */}
        {isOpen && (
          <div className="p-3 bg-white dark:bg-slate-900 w-64 space-y-2 border-t border-slate-100 dark:border-slate-800">
            <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
              Switch Active View Role
            </div>

            <div className="grid grid-cols-1 gap-1">
              {roles.map(r => (
                <button
                  key={r.key}
                  onClick={() => {
                    setMockRole(r.key);
                  }}
                  className={`flex items-center justify-between px-3 py-1.5 rounded-lg text-xs font-medium text-left transition cursor-pointer ${
                    activeRole === r.key
                      ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 font-semibold border border-amber-500/30'
                      : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    {r.key === 'superadmin' ? (
                      <ShieldCheck className="w-3.5 h-3.5 text-red-500" />
                    ) : (
                      <UserCheck className="w-3.5 h-3.5 text-slate-400" />
                    )}
                    {r.label}
                  </span>
                  {activeRole === r.key && (
                    <span className="w-2 h-2 rounded-full bg-amber-500" />
                  )}
                </button>
              ))}
            </div>

            {role !== activeRole && (
              <button
                onClick={resetMockRole}
                className="w-full mt-2 py-1 px-2 text-[11px] text-center text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 underline cursor-pointer"
              >
                Reset to authenticated role ({role})
              </button>
            )}

            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 text-[10px] text-slate-400 dark:text-slate-500 leading-tight">
              {currentUser ? (
                <div>
                  Logged in as: <span className="font-mono text-slate-700 dark:text-slate-300">{userProfile?.displayName || currentUser.email}</span>
                </div>
              ) : (
                <div>Not logged in (Guest state)</div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
