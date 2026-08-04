import React from 'react';
import { motion } from 'motion/react';

interface AnimatedGradientTextProps {
  children: React.ReactNode;
  className?: string;
  from?: string;
  via?: string;
  to?: string;
  animate?: boolean;
}

export const AnimatedGradientText: React.FC<AnimatedGradientTextProps> = ({
  children,
  className = '',
  from = 'from-amber-400',
  via = 'via-amber-200',
  to = 'to-cyan-400',
  animate = true,
}) => {
  return (
    <motion.span
      className={`inline-block bg-gradient-to-r ${from} ${via} ${to} bg-clip-text text-transparent bg-[length:200%_auto] ${
        animate ? 'animate-[gradientShift_4s_ease_infinite]' : ''
      } ${className}`}
      style={{
        backgroundImage: undefined, // Uses Tailwind bg-gradient-to-r
      }}
      animate={
        animate
          ? {
              backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'],
            }
          : undefined
      }
      transition={
        animate
          ? {
              duration: 6,
              repeat: Infinity,
              ease: 'easeInOut',
            }
          : undefined
      }
    >
      {children}
    </motion.span>
  );
};
