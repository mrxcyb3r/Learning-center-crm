import React from 'react';
import { useTheme } from '../context/ThemeContext';
import { APP_ASSETS } from '../constants/assets';

export const AppBackground: React.FC = () => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <div className="fixed inset-0 pointer-events-none -z-10 overflow-hidden select-none">
      {/* Dynamic Visual Asset Image */}
      <img
        src={isDark ? APP_ASSETS.bgDarkMode : APP_ASSETS.bgLightMode}
        alt="CenterFlow App Ambient Background"
        referrerPolicy="no-referrer"
        className="w-full h-full object-cover object-center opacity-20 dark:opacity-30 transition-opacity duration-700 ease-in-out scale-105"
      />

      {/* Atmospheric High-Contrast Gradient Masking */}
      <div className="absolute inset-0 bg-gradient-to-b from-white/70 via-slate-50/85 to-slate-100/95 dark:from-slate-950/80 dark:via-slate-950/95 dark:to-slate-950 transition-colors duration-500" />
      
      {/* Subtle Ambient Radial Glow */}
      <div className="absolute -top-40 -right-40 w-96 h-96 bg-amber-500/10 dark:bg-amber-500/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-indigo-500/10 dark:bg-indigo-500/15 rounded-full blur-3xl pointer-events-none" />
    </div>
  );
};
