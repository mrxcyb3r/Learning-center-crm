import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  perPage: number;
  onPageChange: (page: number) => void;
  onPerPageChange?: (perPage: number) => void;
}

const getPageNumbers = (current: number, total: number): (number | '...')[] => {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const pages: (number | '...')[] = [1];
  if (current > 3) pages.push('...');
  for (let i = Math.max(2, current - 1); i <= Math.min(total - 1, current + 1); i++) {
    pages.push(i);
  }
  if (current < total - 2) pages.push('...');
  pages.push(total);
  return pages;
};

export const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  totalItems,
  perPage,
  onPageChange,
  onPerPageChange,
}) => {
  const { theme } = useTheme();
  const start = (currentPage - 1) * perPage + 1;
  const end = Math.min(currentPage * perPage, totalItems);
  const pages = getPageNumbers(currentPage, totalPages);

  const btnBase = `flex h-8 min-w-[32px] items-center justify-center rounded-lg text-xs font-bold transition-all ${
    theme === 'dark' ? 'text-slate-400 hover:bg-slate-700' : 'text-slate-600 hover:bg-slate-100'
  }`;
  const btnActive =
    'bg-amber-500 text-slate-950 hover:bg-amber-400 shadow shadow-amber-500/20';

  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <span className="text-xs font-bold text-slate-500">
        Showing {start}–{end} of {totalItems}
      </span>
      <div className="flex items-center gap-1">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className={`${btnBase} ${currentPage === 1 ? 'pointer-events-none opacity-30' : ''}`}
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        {pages.map((page, idx) =>
          page === '...' ? (
            <span key={`e-${idx}`} className="px-1 text-xs text-slate-400">
              …
            </span>
          ) : (
            <button
              key={page}
              onClick={() => onPageChange(page)}
              className={`${btnBase} ${page === currentPage ? btnActive : ''}`}
            >
              {page}
            </button>
          ),
        )}
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className={`${btnBase} ${currentPage === totalPages ? 'pointer-events-none opacity-30' : ''}`}
        >
          <ChevronRight className="h-4 w-4" />
        </button>
        {onPerPageChange && (
          <select
            value={perPage}
            onChange={(e) => onPerPageChange(Number(e.target.value))}
            className={`ml-2 rounded-lg border px-2 py-1 text-xs font-bold outline-none ${
              theme === 'dark'
                ? 'border-slate-700 bg-slate-800 text-slate-300'
                : 'border-slate-200 bg-white text-slate-700'
            }`}
          >
            {[10, 25, 50, 100].map((n) => (
              <option key={n} value={n}>
                {n} / page
              </option>
            ))}
          </select>
        )}
      </div>
    </div>
  );
};

export default Pagination;
