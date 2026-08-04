import React from 'react';
import { motion } from 'motion/react';
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
        className="w-full h-full object-cover object-center opacity-20 dark:opacity-30 transition-opacity duration-700 ease-in-out scale-105"
        fallbackClassName="w-full h-full bg-slate-950"
        fallbackIcon={null}
      />

      {/* Shifting Multi-Color Linear Gradient Background Layer */}
      <motion.div
        animate={{
          backgroundPosition: ['0% 0%', '100% 100%', '0% 100%', '100% 0%', '0% 0%'],
        }}
        transition={{
          duration: 18,
          repeat: Infinity,
          ease: 'linear',
        }}
        className="absolute inset-0 bg-gradient-to-br from-amber-600/20 via-indigo-900/30 via-cyan-900/30 to-amber-500/20 dark:from-amber-500/25 dark:via-indigo-950/60 dark:via-cyan-950/50 dark:to-amber-600/25 bg-[length:200%_200%]"
      />

      {/* Atmospheric High-Contrast Base Overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-slate-100/70 via-slate-50/85 to-white dark:from-slate-950/70 dark:via-slate-950/85 dark:to-slate-950 backdrop-blur-[2px] transition-colors duration-500" />

      {/* Drifting Background Mesh Orb - Top Right (Indigo/Purple 600) */}
      <motion.div
        animate={{
          x: [0, 45, -30, 0],
          y: [0, -35, 25, 0],
          scale: [1, 1.25, 0.9, 1],
        }}
        transition={{
          duration: 12,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
        className="absolute -top-32 -right-32 w-[36rem] h-[36rem] bg-indigo-600/35 dark:bg-indigo-600/40 rounded-full blur-[110px] pointer-events-none"
      />

      {/* Drifting Background Mesh Orb - Bottom Left (Amber 600) */}
      <motion.div
        animate={{
          x: [0, -40, 30, 0],
          y: [0, 35, -25, 0],
          scale: [1, 1.2, 0.95, 1],
        }}
        transition={{
          duration: 15,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
        className="absolute -bottom-32 -left-32 w-[38rem] h-[38rem] bg-amber-600/30 dark:bg-amber-600/35 rounded-full blur-[120px] pointer-events-none"
      />

      {/* Drifting Background Mesh Orb - Center Core (Cyan 600) */}
      <motion.div
        animate={{
          x: [-20, 20, -20],
          y: [20, -20, 20],
          scale: [0.95, 1.15, 0.95],
          opacity: [0.35, 0.65, 0.35],
        }}
        transition={{
          duration: 10,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
        className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[30rem] h-[30rem] bg-cyan-600/25 dark:bg-cyan-500/25 rounded-full blur-[125px] pointer-events-none"
      />
    </div>
  );
};
