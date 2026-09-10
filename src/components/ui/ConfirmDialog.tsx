import React, { useEffect } from 'react';
import { AlertTriangle, Info, AlertCircle } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'warning' | 'info';
  onConfirm: () => void;
  onCancel: () => void;
}

const VARIANT_CONFIG = {
  danger: {
    icon: AlertCircle,
    iconClass: 'text-red-500',
    btnClass:
      'bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white border border-red-500/40 shadow-lg shadow-red-600/20',
  },
  warning: {
    icon: AlertTriangle,
    iconClass: 'text-amber-500',
    btnClass:
      'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 border border-amber-400/30 shadow-lg shadow-amber-500/20',
  },
  info: {
    icon: Info,
    iconClass: 'text-blue-500',
    btnClass:
      'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white border border-blue-500/40 shadow-lg shadow-blue-600/20',
  },
};

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'danger',
  onConfirm,
  onCancel,
}) => {
  const { theme } = useTheme();
  const config = VARIANT_CONFIG[variant];
  const Icon = config.icon;

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) onCancel();
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isOpen, onCancel]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onCancel}
      />
      <div
        className={`relative w-full max-w-md rounded-2xl border p-6 shadow-2xl ${
          theme === 'dark'
            ? 'border-slate-700 bg-slate-800'
            : 'border-slate-200 bg-white'
        }`}
      >
        <div className="mb-4 flex items-center gap-3">
          <div className={`flex h-10 w-10 items-center justify-center rounded-xl bg-current/10 ${config.iconClass}`}>
            <Icon className="h-5 w-5" />
          </div>
          <h3 className="text-lg font-black text-slate-900 dark:text-white">{title}</h3>
        </div>
        <p className="mb-6 text-sm font-medium text-slate-500 dark:text-slate-400">
          {message}
        </p>
        <div className="flex justify-end gap-2">
          <button
            onClick={onCancel}
            className={`rounded-xl px-4 py-2 text-xs font-bold tracking-wide transition-all ${
              theme === 'dark'
                ? 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            className={`rounded-xl px-4 py-2 text-xs font-bold tracking-wide transition-all ${config.btnClass}`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDialog;
