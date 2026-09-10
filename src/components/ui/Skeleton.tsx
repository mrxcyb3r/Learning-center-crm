import React from 'react';

interface SkeletonProps {
  className?: string;
  count?: number;
}

export const Skeleton: React.FC<SkeletonProps> = ({ className = '', count = 1 }) => {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className={`animate-pulse rounded-xl bg-slate-200 dark:bg-slate-700/50 ${className}`}
        />
      ))}
    </>
  );
};

export const SkeletonCard: React.FC<{ count?: number }> = ({ count = 4 }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="animate-pulse rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-700/50 dark:bg-slate-800/50"
        >
          <div className="h-4 w-20 rounded-lg bg-slate-200 dark:bg-slate-700/50" />
          <div className="mt-3 h-8 w-28 rounded-lg bg-slate-200 dark:bg-slate-700/50" />
          <div className="mt-2 h-3 w-16 rounded-lg bg-slate-200 dark:bg-slate-700/50" />
        </div>
      ))}
    </div>
  );
};

export const SkeletonTable: React.FC<{ rows?: number; cols?: number }> = ({
  rows = 5,
  cols = 4,
}) => {
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-slate-700/50 dark:bg-slate-800/50">
      <div className="flex gap-4 border-b border-slate-200 bg-slate-50 px-5 py-3 dark:border-slate-700/50 dark:bg-slate-800/80">
        {Array.from({ length: cols }).map((_, i) => (
          <div key={i} className="h-3 flex-1 rounded bg-slate-300 dark:bg-slate-600/50" />
        ))}
      </div>
      {Array.from({ length: rows }).map((_, rowIdx) => (
        <div
          key={rowIdx}
          className="flex gap-4 border-b border-slate-100 px-5 py-3 last:border-0 dark:border-slate-700/30"
        >
          {Array.from({ length: cols }).map((_, colIdx) => (
            <div
              key={colIdx}
              className="h-3 flex-1 animate-pulse rounded bg-slate-200 dark:bg-slate-700/50"
            />
          ))}
        </div>
      ))}
    </div>
  );
};

export const SkeletonList: React.FC<{ count?: number }> = ({ count = 5 }) => {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white px-4 py-3 dark:border-slate-700/50 dark:bg-slate-800/50"
        >
          <div className="h-10 w-10 flex-shrink-0 animate-pulse rounded-full bg-slate-200 dark:bg-slate-700/50" />
          <div className="flex-1 space-y-2">
            <div className="h-3 w-1/3 animate-pulse rounded bg-slate-200 dark:bg-slate-700/50" />
            <div className="h-3 w-2/3 animate-pulse rounded bg-slate-200 dark:bg-slate-700/50" />
          </div>
        </div>
      ))}
    </div>
  );
};

export default Skeleton;
