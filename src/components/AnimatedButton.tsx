import React from 'react';
import { motion, HTMLMotionProps } from 'motion/react';
import { Loader2 } from 'lucide-react';

export type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost' | 'amber';
export type ButtonSize = 'sm' | 'md' | 'lg';

interface AnimatedButtonProps extends Omit<HTMLMotionProps<'button'>, 'children'> {
  children: React.ReactNode;
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  className?: string;
}

export const AnimatedButton: React.FC<AnimatedButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  leftIcon,
  rightIcon,
  className = '',
  disabled,
  ...props
}) => {
  const baseStyles =
    'relative inline-flex items-center justify-center font-black tracking-wide rounded-2xl transition-all cursor-pointer select-none disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none';

  const variantStyles: Record<ButtonVariant, string> = {
    primary:
      'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 shadow-lg shadow-amber-500/20 border border-amber-400/30',
    amber:
      'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-md shadow-amber-500/20 border border-amber-400/40',
    secondary:
      'bg-slate-900/90 hover:bg-slate-800 text-slate-200 border border-slate-700/80 hover:border-slate-600 shadow-md',
    danger:
      'bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white shadow-lg shadow-red-600/20 border border-red-500/40',
    ghost:
      'bg-transparent hover:bg-slate-800/60 text-slate-300 hover:text-white border border-transparent',
  };

  const sizeStyles: Record<ButtonSize, string> = {
    sm: 'px-3.5 py-1.5 text-xs gap-1.5 rounded-xl',
    md: 'px-5 py-2.5 text-xs sm:text-sm gap-2 rounded-2xl',
    lg: 'px-6 py-3.5 text-sm sm:text-base gap-2.5 rounded-2xl',
  };

  return (
    <motion.button
      whileHover={{ scale: disabled || isLoading ? 1 : 1.02, y: disabled || isLoading ? 0 : -1 }}
      whileTap={{ scale: disabled || isLoading ? 1 : 0.96 }}
      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
      disabled={disabled || isLoading}
      className={`${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
      {...props}
    >
      {isLoading ? (
        <Loader2 className="w-4 h-4 animate-spin shrink-0 text-current" />
      ) : (
        leftIcon && <span className="shrink-0 transition-transform group-hover:-translate-x-0.5">{leftIcon}</span>
      )}

      <span>{children}</span>

      {!isLoading && rightIcon && (
        <span className="shrink-0 transition-transform group-hover:translate-x-0.5">{rightIcon}</span>
      )}
    </motion.button>
  );
};
