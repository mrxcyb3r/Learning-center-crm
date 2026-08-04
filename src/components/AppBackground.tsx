import React from 'react';
import { useTheme } from '../context/ThemeContext';
import { APP_ASSETS } from '../constants/assets';
import { SafeImage } from './common/SafeImage';

export const AppBackground: React.FC = () => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <div className="fixed inset-0 pointer-events-none -z-10 overflow-hidden select-none">
      {/* Dynamic Visual Asset Image with smooth transitions */}
      <SafeImage
        key={isDark ? 'dark' : 'light'}
        src={isDark ? APP_ASSETS.bgDarkMode : APP_ASSETS.bgLightMode}
        alt="CenterFlow App Ambient Background"
        className="w-full h-full object-cover object-center opacity-25 dark:opacity-35 transition-opacity duration-700 ease-in-out scale-105"
        fallbackClassName="w-full h-full bg-slate-950/90"
        fallbackIcon={null}
      />

      {/* Atmospheric High-Contrast Gradient & Backdrop Blur Overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-slate-100/80 via-slate-50/90 to-white dark:from-slate-950/80 dark:via-slate-950/90 dark:to-slate-950 backdrop-blur-[2px] transition-colors duration-500" />
      
      {/* Subtle Ambient Radial Glows */}
      <div className="absolute -top-40 -right-40 w-96 h-96 bg-amber-500/10 dark:bg-amber-500/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-indigo-500/10 dark:bg-indigo-500/15 rounded-full blur-3xl pointer-events-none" />
    </div>
  );
};
