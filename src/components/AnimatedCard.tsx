import React from 'react';
import { motion, HTMLMotionProps } from 'motion/react';

interface AnimatedCardProps extends HTMLMotionProps<'div'> {
  children: React.ReactNode;
  className?: string;
  hoverEffect?: boolean;
  delay?: number;
}

export const AnimatedCard: React.FC<AnimatedCardProps> = ({
  children,
  className = '',
  hoverEffect = true,
  delay = 0,
  ...props
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 15, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -10, scale: 0.98 }}
      transition={{ duration: 0.25, ease: 'easeOut', delay }}
      whileHover={hoverEffect ? { scale: 1.02, y: -2 } : undefined}
      whileTap={hoverEffect ? { scale: 0.98 } : undefined}
      className={`rounded-3xl bg-slate-900/90 border border-slate-800/80 shadow-xl backdrop-blur-md transition-colors ${className}`}
      {...props}
    >
      {children}
    </motion.div>
  );
};
