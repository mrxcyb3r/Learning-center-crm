import React from 'react';
import { Bot } from 'lucide-react';

export const TypingIndicator: React.FC = () => {
  return (
    <div className="flex items-center gap-3 animate-fadeIn">
      <div className="w-8 h-8 rounded-xl bg-amber-500 text-slate-950 font-black flex items-center justify-center shrink-0 shadow-md">
        <Bot className="w-4 h-4" />
      </div>
      <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 text-xs text-slate-300 flex items-center gap-2 shadow-md">
        <span className="font-semibold text-amber-400">Renessans AI thinking</span>
        <div className="flex items-center gap-1.5 ml-1">
          <span className="w-2 h-2 bg-amber-400 rounded-full animate-bounce [animation-delay:-0.3s]" />
          <span className="w-2 h-2 bg-amber-400 rounded-full animate-bounce [animation-delay:-0.15s]" />
          <span className="w-2 h-2 bg-amber-400 rounded-full animate-bounce" />
        </div>
      </div>
    </div>
  );
};
