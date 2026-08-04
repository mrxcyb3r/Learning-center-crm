import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ShieldAlert, Zap, UserCheck, Shield, GraduationCap, X } from 'lucide-react';
import { UserRole } from '../types';

interface AnimatedBannerProps {
  isVisible: boolean;
  demoPreviewRole: UserRole;
  onSelectRole: (role: UserRole) => void;
  onOpenAuth: () => void;
  onDismiss?: () => void;
}

export const AnimatedBanner: React.FC<AnimatedBannerProps> = ({
  isVisible,
  demoPreviewRole,
  onSelectRole,
  onOpenAuth,
  onDismiss
}) => {
  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: -20, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.98 }}
          transition={{ duration: 0.25, ease: 'easeOut' as const }}
          className="relative overflow-hidden p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 shadow-lg shadow-amber-500/5 backdrop-blur-md flex flex-col sm:flex-row items-center justify-between gap-4"
        >
          {/* Glowing Animated Ambient Glow */}
          <div className="absolute -top-10 -left-10 w-32 h-32 bg-amber-500/15 rounded-full blur-2xl pointer-events-none animate-pulse" />
          <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />

          {/* Left Content */}
          <div className="flex items-center gap-3 z-10">
            <motion.div
              whileHover={{ rotate: 15, scale: 1.1 }}
              transition={{ type: 'spring', stiffness: 300 }}
              className="p-2.5 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30 shrink-0 shadow-inner"
            >
              <ShieldAlert className="w-5 h-5" />
            </motion.div>
            <div className="text-xs">
              <span className="font-bold text-amber-300 flex items-center gap-1.5">
                <span>Interactive Demo Mode Active</span>
                <span className="inline-block w-2 h-2 rounded-full bg-amber-400 animate-ping" />
              </span>
              <span className="text-slate-400 block mt-0.5">
                You are exploring mock datasets. Switch roles below or log in to access live features.
              </span>
            </div>
          </div>

          {/* Right Action Bar & Role Switcher */}
          <div className="flex items-center gap-2.5 z-10 w-full sm:w-auto justify-end">
            <div className="relative inline-flex p-1 bg-gray-900/90 border border-gray-800 rounded-xl shadow-inner">
              {(['student', 'teacher', 'admin'] as const).map((role) => {
                const isActive = demoPreviewRole === role;
                return (
                  <button
                    key={role}
                    onClick={() => onSelectRole(role)}
                    className={`relative px-3 py-1.5 rounded-lg text-xs font-bold transition-colors capitalize z-10 flex items-center gap-1 cursor-pointer ${
                      isActive ? 'text-slate-950' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {isActive && (
                      <motion.div
                        layoutId="activeBannerRoleTab"
                        className="absolute inset-0 bg-amber-500 rounded-lg shadow-md"
                        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                      />
                    )}
                    <span className="relative z-10 flex items-center gap-1">
                      {role === 'student' && <GraduationCap className="w-3.5 h-3.5" />}
                      {role === 'teacher' && <UserCheck className="w-3.5 h-3.5" />}
                      {role === 'admin' && <Shield className="w-3.5 h-3.5" />}
                      <span>{role}</span>
                    </span>
                  </button>
                );
              })}
            </div>

            <motion.button
              whileHover={{ scale: 1.05, translateY: -1 }}
              whileTap={{ scale: 0.95 }}
              onClick={onOpenAuth}
              className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs transition-colors flex items-center gap-1.5 cursor-pointer shadow-md shadow-amber-500/20"
            >
              <Zap className="w-3.5 h-3.5 fill-slate-950" />
              <span>Log In</span>
            </motion.button>

            {onDismiss && (
              <button
                onClick={onDismiss}
                className="p-1.5 rounded-lg text-slate-500 hover:text-slate-300 hover:bg-slate-800/60 transition cursor-pointer"
                title="Dismiss banner"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
