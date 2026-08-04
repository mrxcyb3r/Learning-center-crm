import React from 'react';
import { motion, HTMLMotionProps } from 'motion/react';

interface GradientBorderCardProps extends HTMLMotionProps<'div'> {
  children: React.ReactNode;
  className?: string;
  gradientFrom?: string;
  gradientVia?: string;
  gradientTo?: string;
  hoverScale?: boolean;
}

export const GradientBorderCard: React.FC<GradientBorderCardProps> = ({
  children,
  className = '',
  gradientFrom = 'from-amber-500/50',
  gradientVia = 'via-cyan-500/30',
  gradientTo = 'to-amber-500/50',
  hoverScale = true,
  ...props
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 15, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -10, scale: 0.98 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
      whileHover={hoverScale ? { scale: 1.015, y: -2 } : undefined}
      whileTap={hoverScale ? { scale: 0.985 } : undefined}
      className={`relative p-[1.5px] rounded-3xl overflow-hidden group shadow-xl ${className}`}
      {...props}
    >
      {/* Animated Multi-Color Gradient Border Layer */}
      <motion.div
        className={`absolute inset-0 bg-gradient-to-r ${gradientFrom} ${gradientVia} ${gradientTo} opacity-70 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none rounded-3xl`}
        animate={{
          backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'],
        }}
        transition={{
          duration: 5,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
        style={{
          backgroundSize: '200% 200%',
        }}
      />

      {/* Inner Obsidian Slate Card Content */}
      <div className="relative w-full h-full rounded-[23px] bg-slate-900/95 dark:bg-slate-900/95 backdrop-blur-md p-5 sm:p-6 z-10 text-white">
        {children}
      </div>
    </motion.div>
  );
};
