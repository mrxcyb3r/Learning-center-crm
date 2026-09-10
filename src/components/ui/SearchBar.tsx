import React from 'react';
import { Search, X } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export const SearchBar: React.FC<SearchBarProps> = ({
  value,
  onChange,
  placeholder = 'Search...',
  className = '',
}) => {
  const { theme } = useTheme();

  return (
    <div className={`relative ${className}`}>
      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={`w-full rounded-xl border bg-white py-2.5 pl-10 pr-10 text-sm font-medium outline-none transition-all placeholder:text-slate-400 focus:ring-2 focus:ring-amber-500/30 ${
          theme === 'dark'
            ? 'border-slate-700 bg-slate-800/50 text-slate-200 placeholder:text-slate-500'
            : 'border-slate-200 text-slate-900'
        }`}
      />
      {value && (
        <button
          onClick={() => onChange('')}
          className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-0.5 text-slate-400 transition-colors hover:bg-slate-200 hover:text-slate-600 dark:hover:bg-slate-700 dark:hover:text-slate-300"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
};

export default SearchBar;
