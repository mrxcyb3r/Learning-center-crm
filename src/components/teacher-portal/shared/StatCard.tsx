import React from 'react';
import { useTheme } from '../../context/ThemeContext';

interface StatCardProps {
  icon: React.ReactNode;
  value: string | number;
  label: string;
  trend?: { value: number; positive: boolean };
  color?: 'blue' | 'amber' | 'emerald' | 'rose' | 'purple';
}

const colorMap = {
  blue: 'from-blue-500/10 to-indigo-500/10 text-blue-500',
  amber: 'from-amber-500/10 to-orange-500/10 text-amber-500',
  emerald: 'from-emerald-500/10 to-teal-500/10 text-emerald-500',
  rose: 'from-rose-500/10 to-pink-500/10 text-rose-500',
  purple: 'from-purple-500/10 to-violet-500/10 text-purple-500',
};

const iconBgMap = {
  blue: 'bg-blue-500/10',
  amber: 'bg-amber-500/10',
  emerald: 'bg-emerald-500/10',
  rose: 'bg-rose-500/10',
  purple: 'bg-purple-500/10',
};

export const StatCard: React.FC<StatCardProps> = ({ icon, value, label, trend, color = 'blue' }) => {
  const { theme } = useTheme();

  return (
    <div
      className={`rounded-2xl p-5 border transition-colors ${
        theme === 'dark'
          ? 'bg-slate-900/50 border-slate-800 hover:border-slate-700'
          : 'bg-white border-slate-200 hover:border-slate-300 shadow-sm'
      }`}
    >
      <div className="flex items-start justify-between">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${iconBgMap[color]}`}>
          <span className={colorMap[color].split(' ').pop()}>{icon}</span>
        </div>
        {trend && (
          <span
            className={`text-xs font-bold px-2 py-1 rounded-lg ${
              trend.positive ? 'text-emerald-500 bg-emerald-500/10' : 'text-rose-500 bg-rose-500/10'
            }`}
          >
            {trend.positive ? '+' : ''}{trend.value}%
          </span>
        )}
      </div>
      <div className="mt-3">
        <div className={`text-2xl font-black ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
          {value}
        </div>
        <div className={`text-xs font-semibold mt-1 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
          {label}
        </div>
      </div>
    </div>
  );
};
