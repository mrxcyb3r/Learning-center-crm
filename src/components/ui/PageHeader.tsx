import React from 'react';
import { useTheme } from '../../context/ThemeContext';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  actions?: React.ReactNode;
}

export const PageHeader: React.FC<PageHeaderProps> = ({ title, subtitle, icon, actions }) => {
  const { theme } = useTheme();

  return (
    <div
      className={`flex flex-col gap-4 border-b pb-5 sm:flex-row sm:items-center sm:justify-between ${
        theme === 'dark' ? 'border-slate-700/50' : 'border-slate-200'
      }`}
    >
      <div className="flex items-center gap-3">
        {icon && (
          <div
            className={`flex h-10 w-10 items-center justify-center rounded-xl ${
              theme === 'dark'
                ? 'bg-amber-500/10 text-amber-400'
                : 'bg-amber-500/10 text-amber-600'
            }`}
          >
            {icon}
          </div>
        )}
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white">{title}</h1>
          {subtitle && (
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{subtitle}</p>
          )}
        </div>
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
};

export default PageHeader;
