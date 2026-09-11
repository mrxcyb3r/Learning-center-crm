import React from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { auth } from '../services/firebase';

/**
 * Development-only auth → profile → guard diagnostic panel.
 * Renders nothing in production builds. Never displays passwords or tokens.
 */
export const AuthDebugPanel: React.FC = () => {
  const { currentUser, userProfile, role, isLoading } = useAuth();
  const location = useLocation();

  if (!import.meta.env.DEV) {
    return null;
  }

  const opts = auth.app.options as { projectId?: string; authDomain?: string };
  const path = location.pathname;
  const requiredRole = path.startsWith('/admin') || path.startsWith('/dashboard/admin')
    ? 'admin'
    : path.startsWith('/teacher') || path.startsWith('/dashboard/teacher')
      ? 'teacher'
      : '(public)';

  const guardResult = isLoading
    ? 'LOADING'
    : !currentUser
      ? (requiredRole === '(public)' ? 'ALLOWED' : 'REDIRECT-TO-LOGIN')
      : requiredRole === '(public)'
        ? 'ALLOWED'
        : requiredRole === 'admin'
          ? (role === 'admin' || role === 'superadmin' ? 'ALLOWED' : 'DENIED')
          : (role === requiredRole ? 'ALLOWED' : 'DENIED');

  return (
    <details
      style={{ position: 'fixed', left: 8, bottom: 8, zIndex: 9999 }}
      className="rounded-xl bg-slate-950/90 text-slate-200 border border-amber-500/40 text-[11px] font-mono shadow-2xl max-w-xs"
    >
      <summary className="cursor-pointer px-3 py-1.5 font-bold text-amber-400 select-none">
        AUTH {guardResult}
      </summary>
      <div className="px-3 pb-2 pt-1 space-y-1 whitespace-pre-wrap break-all">
        <div>Firebase: {currentUser ? 'authenticated' : 'anonymous'}</div>
        <div>UID: {currentUser?.uid ?? '—'}</div>
        <div>Email: {currentUser?.email ?? '—'}</div>
        <div>Project: {opts.projectId ?? '—'}</div>
        <div>Profile: {userProfile ? 'found' : 'missing'}</div>
        <div>Role: {role}</div>
        <div>Active: n/a (no active field in UserProfile)</div>
        <div>Path: {path}</div>
        <div>Required: {requiredRole}</div>
        <div>Guard: {guardResult}</div>
      </div>
    </details>
  );
};
