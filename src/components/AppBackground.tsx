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
        className="w-full h-full object-cover object-center opacity-25 dark:opacity-35 transition-opacity duration-700 ease-in-out scale-105"
        fallbackClassName="w-full h-full bg-slate-950/90"
        fallbackIcon={null}
      />

      {/* Atmospheric High-Contrast Gradient & Backdrop Blur Overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-slate-100/80 via-slate-50/90 to-white dark:from-slate-950/80 dark:via-slate-950/90 dark:to-slate-950 backdrop-blur-[2px] transition-colors duration-500" />

      {/* Drifting Ambient Gradient Orbs (Top-Right Amber Glow) */}
      <motion.div
        animate={{
          x: [0, 30, -20, 0],
          y: [0, -30, 20, 0],
          scale: [1, 1.15, 0.95, 1],
        }}
        transition={{
          duration: 14,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
        className="absolute -top-40 -right-40 w-[30rem] h-[30rem] bg-amber-500/15 dark:bg-amber-500/20 rounded-full blur-[100px] pointer-events-none"
      />

      {/* Drifting Ambient Gradient Orbs (Bottom-Left Cyan / Indigo Glow) */}
      <motion.div
        animate={{
          x: [0, -30, 20, 0],
          y: [0, 30, -20, 0],
          scale: [1, 1.2, 0.9, 1],
        }}
        transition={{
          duration: 16,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
        className="absolute -bottom-40 -left-40 w-[32rem] h-[32rem] bg-cyan-500/10 dark:bg-cyan-500/15 rounded-full blur-[110px] pointer-events-none"
      />

      {/* Center Floating Accent Mesh Orb */}
      <motion.div
        animate={{
          opacity: [0.3, 0.6, 0.3],
          scale: [1, 1.08, 1],
        }}
        transition={{
          duration: 10,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
        className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[24rem] h-[24rem] bg-indigo-500/10 dark:bg-indigo-500/10 rounded-full blur-[120px] pointer-events-none"
      />
    </div>
  );
};
