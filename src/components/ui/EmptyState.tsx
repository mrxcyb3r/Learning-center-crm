import React from 'react';
import { useTheme } from '../../context/ThemeContext';

interface EmptyStateProps {
  icon: React.ReactNode;
  title: string;
  description?: string;
  action?: { label: string; onClick: () => void };
}

export const EmptyState: React.FC<EmptyStateProps> = ({ icon, title, description, action }) => {
  const { theme } = useTheme();

  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div
        className={`mb-4 flex h-16 w-16 items-center justify-center rounded-2xl ${
          theme === 'dark' ? 'bg-slate-800 text-slate-400' : 'bg-slate-100 text-slate-500'
        }`}
      >
        {icon}
      </div>
      <h3 className="text-lg font-black text-slate-900 dark:text-white">{title}</h3>
      {description && (
        <p className="mt-1 max-w-sm text-sm font-medium text-slate-500 dark:text-slate-400">
          {description}
        </p>
      )}
      {action && (
        <button
          onClick={action.onClick}
          className="mt-5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 px-5 py-2 text-xs font-bold tracking-wide text-slate-950 shadow-lg shadow-amber-500/20 transition-all hover:from-amber-400 hover:to-amber-500"
        >
          {action.label}
        </button>
      )}
    </div>
  );
};

export default EmptyState;
