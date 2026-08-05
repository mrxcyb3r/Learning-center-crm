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
          duration: 16,
          repeat: Infinity,
          ease: 'linear',
        }}
        className="absolute inset-0 bg-gradient-to-br from-amber-600/40 via-indigo-900/60 via-cyan-900/50 to-slate-950 dark:from-amber-600/45 dark:via-indigo-900/70 dark:via-cyan-900/60 dark:to-slate-950 bg-[length:250%_250%]"
      />

      {/* Atmospheric High-Contrast Base Overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-slate-950/40 via-slate-950/65 to-slate-950/90 dark:from-slate-950/50 dark:via-slate-950/80 dark:to-slate-950 backdrop-blur-[2px] transition-colors duration-500" />

      {/* Drifting Background Mesh Orb - Top Right (Indigo 600) */}
      <motion.div
        animate={{
          x: [0, 50, -35, 0],
          y: [0, -40, 30, 0],
          scale: [1, 1.3, 0.9, 1],
        }}
        transition={{
          duration: 14,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
        className="absolute -top-32 -right-32 w-[38rem] h-[38rem] bg-indigo-600/45 dark:bg-indigo-600/50 rounded-full blur-[100px] pointer-events-none"
      />

      {/* Drifting Background Mesh Orb - Bottom Left (Amber 600) */}
      <motion.div
        animate={{
          x: [0, -45, 35, 0],
          y: [0, 40, -30, 0],
          scale: [1, 1.25, 0.95, 1],
        }}
        transition={{
          duration: 16,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
        className="absolute -bottom-32 -left-32 w-[40rem] h-[40rem] bg-amber-600/40 dark:bg-amber-600/45 rounded-full blur-[110px] pointer-events-none"
      />

      {/* Drifting Background Mesh Orb - Center Core (Cyan 600) */}
      <motion.div
        animate={{
          x: [-25, 25, -25],
          y: [25, -25, 25],
          scale: [0.9, 1.2, 0.9],
          opacity: [0.4, 0.7, 0.4],
        }}
        transition={{
          duration: 11,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
        className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[32rem] h-[32rem] bg-cyan-600/35 dark:bg-cyan-500/35 rounded-full blur-[120px] pointer-events-none"
      />
    </div>
  );
};
