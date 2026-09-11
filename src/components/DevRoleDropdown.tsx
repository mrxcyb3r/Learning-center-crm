import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { UserRole } from '../types';
import {
  ShieldAlert,
  ShieldCheck,
  UserCheck,
  GraduationCap,
  ChevronDown,
  Sparkles,
  Check
} from 'lucide-react';

export interface DevRoleDropdownProps {
  className?: string;
  onRoleChange?: (role: UserRole) => void;
}

export const DevRoleDropdown: React.FC<DevRoleDropdownProps> = ({
  className = '',
  onRoleChange
}) => {
  const { activeRole, setMockRole, loginAsDemoUser } = useAuth();
  // Dev-only tool. Frontend-only role switching must never be reachable in
  // production: authorization comes exclusively from Firestore users/{uid}.
  // In production builds this component renders nothing.
  const isDev = import.meta.env.DEV;
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const rolesConfig: {
    role: UserRole;
    label: string;
    icon: React.ReactNode;
    badgeBg: string;
    textColor: string;
    description: string;
  }[] = [
    {
      role: 'student',
      label: 'Student',
      icon: <GraduationCap className="w-4 h-4 text-amber-500" />,
      badgeBg: 'bg-amber-500/10 dark:bg-amber-500/20 border-amber-500/30 text-amber-600 dark:text-amber-400',
      textColor: 'text-amber-500',
      description: 'Grades, schedule, AI tutor, leaderboard'
    },
    {
      role: 'teacher',
      label: 'Teacher',
      icon: <UserCheck className="w-4 h-4 text-blue-500" />,
      badgeBg: 'bg-blue-500/10 dark:bg-blue-500/20 border-blue-500/30 text-blue-600 dark:text-blue-400',
      textColor: 'text-blue-500',
      description: 'Gradebook, homework & class management'
    },
    {
      role: 'admin',
      label: 'Admin',
      icon: <ShieldCheck className="w-4 h-4 text-purple-500" />,
      badgeBg: 'bg-purple-500/10 dark:bg-purple-500/20 border-purple-500/30 text-purple-600 dark:text-purple-400',
      textColor: 'text-purple-500',
      description: 'Telegram suite, health monitor, payroll'
    },
    {
      role: 'superadmin',
      label: 'SuperAdmin',
      icon: <ShieldAlert className="w-4 h-4 text-rose-500" />,
      badgeBg: 'bg-rose-500/10 dark:bg-rose-500/20 border-rose-500/30 text-rose-600 dark:text-rose-400',
      textColor: 'text-rose-500',
      description: 'Full system control & root security'
    }
  ];

  const currentConfig = rolesConfig.find((r) => r.role === activeRole) || rolesConfig[0];

  const handleSelectRole = async (targetRole: UserRole) => {
    setIsOpen(false);
    setMockRole(targetRole);
    await loginAsDemoUser(targetRole);
    const targetPath = targetRole === 'superadmin' ? '/dashboard/admin' : `/dashboard/${targetRole}`;
    try {
      navigate(targetPath);
    } catch {
      // Fallback
    }
    if (onRoleChange) {
      onRoleChange(targetRole);
    }
  };

  if (!isDev) {
    return null;
  }

  return (
    <div className={`relative inline-block text-left ${className}`} ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-bold transition cursor-pointer shadow-sm hover:shadow ${currentConfig.badgeBg}`}
        aria-expanded={isOpen}
        aria-haspopup="true"
        title="Fast Dev Role Switcher"
      >
        <div className="flex items-center gap-1.5">
          {currentConfig.icon}
          <span>{currentConfig.label}</span>
        </div>
        <span className="text-[10px] px-1 rounded bg-slate-900/10 dark:bg-white/10 font-mono text-slate-500 dark:text-slate-300">
          DEV
        </span>
        <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl py-2 z-50 animate-fadeIn">
          <div className="px-3 py-1.5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-amber-500" /> Fast Role Switcher
            </span>
            <span className="text-[10px] font-mono text-amber-500 font-bold">1-Click Demo</span>
          </div>

          <div className="p-1 space-y-1">
            {rolesConfig.map((item) => {
              const isSelected = item.role === activeRole;
              return (
                <button
                  key={item.role}
                  type="button"
                  onClick={() => handleSelectRole(item.role)}
                  className={`w-full flex items-start gap-2.5 p-2 rounded-xl text-left transition cursor-pointer ${
                    isSelected
                      ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white font-bold'
                      : 'hover:bg-slate-50 dark:hover:bg-slate-800/50 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <div className="mt-0.5 shrink-0">{item.icon}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold">{item.label}</span>
                      {isSelected && <Check className="w-3.5 h-3.5 text-emerald-500" />}
                    </div>
                    <p className="text-[10px] text-slate-400 leading-snug truncate">
                      {item.description}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default DevRoleDropdown;
