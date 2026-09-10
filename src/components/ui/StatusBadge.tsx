import React from 'react';

type StatusType =
  | 'new'
  | 'in_progress'
  | 'contacted'
  | 'enrolled'
  | 'completed'
  | 'cancelled'
  | 'archived'
  | 'paid'
  | 'pending'
  | 'overdue'
  | 'refunded'
  | 'active'
  | 'inactive';

interface StatusBadgeProps {
  status: StatusType | string;
  size?: 'sm' | 'md';
}

const STATUS_STYLES: Record<string, string> = {
  new: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
  in_progress: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
  contacted: 'bg-purple-500/10 text-purple-600 dark:text-purple-400',
  enrolled: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
  completed: 'bg-green-500/10 text-green-600 dark:text-green-400',
  cancelled: 'bg-red-500/10 text-red-600 dark:text-red-400',
  archived: 'bg-slate-500/10 text-slate-600 dark:text-slate-400',
  paid: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
  pending: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
  overdue: 'bg-red-500/10 text-red-600 dark:text-red-400',
  refunded: 'bg-slate-500/10 text-slate-600 dark:text-slate-400',
  active: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
  inactive: 'bg-slate-500/10 text-slate-600 dark:text-slate-400',
};

const SIZE_CLASSES: Record<string, string> = {
  sm: 'px-2 py-0.5 text-[10px]',
  md: 'px-2.5 py-1 text-xs',
};

const formatLabel = (status: string): string => {
  return status
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
};

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'md' }) => {
  const style =
    STATUS_STYLES[status] || 'bg-slate-500/10 text-slate-600 dark:text-slate-400';

  return (
    <span
      className={`inline-flex items-center rounded-full font-bold tracking-wide ${SIZE_CLASSES[size]} ${style}`}
    >
      {formatLabel(status)}
    </span>
  );
};

export default StatusBadge;
