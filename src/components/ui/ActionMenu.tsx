import React, { useEffect, useRef, useState } from 'react';
import { MoreVertical } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

interface ActionItem {
  label: string;
  icon: React.ReactNode;
  onClick: () => void;
  variant?: 'default' | 'danger';
}

interface ActionMenuProps {
  actions: ActionItem[];
}

export const ActionMenu: React.FC<ActionMenuProps> = ({ actions }) => {
  const { theme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex h-8 w-8 items-center justify-center rounded-lg transition-all ${
          theme === 'dark'
            ? 'text-slate-400 hover:bg-slate-700 hover:text-slate-200'
            : 'text-slate-500 hover:bg-slate-100 hover:text-slate-700'
        }`}
      >
        <MoreVertical className="h-4 w-4" />
      </button>
      {isOpen && (
        <div
          className={`absolute right-0 z-50 mt-1 w-44 overflow-hidden rounded-xl border shadow-lg ${
            theme === 'dark'
              ? 'border-slate-700 bg-slate-800'
              : 'border-slate-200 bg-white'
          }`}
        >
          {actions.map((action, idx) => (
            <button
              key={idx}
              onClick={() => {
                action.onClick();
                setIsOpen(false);
              }}
              className={`flex w-full items-center gap-2.5 px-3 py-2 text-xs font-bold transition-colors ${
                action.variant === 'danger'
                  ? 'text-red-500 hover:bg-red-500/10 dark:text-red-400'
                  : theme === 'dark'
                    ? 'text-slate-300 hover:bg-slate-700/50'
                    : 'text-slate-700 hover:bg-slate-50'
              }`}
            >
              {action.icon}
              {action.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default ActionMenu;
