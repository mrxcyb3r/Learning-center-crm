import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
  sectionName?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class AdminErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('AdminErrorBoundary caught an error:', error, errorInfo);
  }

  private handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="p-8 rounded-3xl bg-white dark:bg-slate-900 border border-red-200 dark:border-red-900/40 shadow-sm flex flex-col items-center text-center my-6">
          <div className="w-12 h-12 rounded-2xl bg-rose-500/10 text-rose-500 flex items-center justify-center mb-4">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-black text-slate-900 dark:text-white">
            {this.props.sectionName || "Bo'limda"} xatolik yuz berdi
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-md">
            Ushbu bo'limni yuklashda texnik muammo paydo bo'ldi. Qaytadan urinib ko'rishingiz yoki boshqa bo'limga o'tishingiz mumkin.
          </p>
          {this.state.error && (
            <div className="mt-3 p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-[11px] font-mono text-slate-600 dark:text-slate-400 max-w-lg overflow-x-auto text-left">
              {this.state.error.message}
            </div>
          )}
          <button
            onClick={this.handleRetry}
            className="mt-5 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold flex items-center gap-2 transition cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Qaytadan urinish</span>
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
