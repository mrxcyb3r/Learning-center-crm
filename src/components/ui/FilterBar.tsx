import React, { useRef, useState } from 'react';
import { ChevronDown, X } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

interface FilterOption {
  label: string;
  value: string;
}

interface FilterBarProps {
  filters: { key: string; label: string; options: FilterOption[]; value: string }[];
  onChange: (key: string, value: string) => void;
  className?: string;
}

export const FilterBar: React.FC<FilterBarProps> = ({ filters, onChange, className = '' }) => {
  const { theme } = useTheme();
  const [openKey, setOpenKey] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpenKey(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getSelectedLabel = (filter: { label: string; value: string; options: FilterOption[] }) => {
    if (!filter.value) return filter.label;
    const opt = filter.options.find((o) => o.value === filter.value);
    return opt ? opt.label : filter.label;
  };

  return (
    <div ref={containerRef} className={`flex flex-wrap items-center gap-2 ${className}`}>
      {filters.map((filter) => (
        <div key={filter.key} className="relative">
          <button
            onClick={() => setOpenKey(openKey === filter.key ? null : filter.key)}
            className={`flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-bold tracking-wide transition-all ${
              filter.value
                ? 'border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400'
                : theme === 'dark'
                  ? 'border-slate-700 bg-slate-800/50 text-slate-300 hover:border-slate-600'
                  : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
            }`}
          >
            {getSelectedLabel(filter)}
            <ChevronDown className="h-3 w-3" />
          </button>
          {openKey === filter.key && (
            <div
              className={`absolute left-0 z-50 mt-1 w-48 overflow-hidden rounded-xl border shadow-lg ${
                theme === 'dark'
                  ? 'border-slate-700 bg-slate-800'
                  : 'border-slate-200 bg-white'
              }`}
            >
              <button
                onClick={() => {
                  onChange(filter.key, '');
                  setOpenKey(null);
                }}
                className={`flex w-full items-center px-3 py-2 text-xs font-bold transition-colors ${
                  !filter.value
                    ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                    : theme === 'dark'
                      ? 'text-slate-300 hover:bg-slate-700/50'
                      : 'text-slate-700 hover:bg-slate-50'
                }`}
              >
                All {filter.label}
              </button>
              {filter.options.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => {
                    onChange(filter.key, opt.value);
                    setOpenKey(null);
                  }}
                  className={`flex w-full items-center px-3 py-2 text-xs font-bold transition-colors ${
                    filter.value === opt.value
                      ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                      : theme === 'dark'
                        ? 'text-slate-300 hover:bg-slate-700/50'
                        : 'text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          )}
        </div>
      ))}
      {filters.some((f) => f.value) && (
        <button
          onClick={() => filters.forEach((f) => onChange(f.key, ''))}
          className="flex items-center gap-1 rounded-xl px-2 py-1.5 text-xs font-bold text-red-500 transition-colors hover:bg-red-500/10 dark:text-red-400"
        >
          <X className="h-3 w-3" />
          Clear
        </button>
      )}
    </div>
  );
};

export default FilterBar;
