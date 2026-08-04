import React from 'react';
import { APP_ASSETS } from '../constants/assets';
import { SafeImage } from './common/SafeImage';
import { Sparkles, Bot } from 'lucide-react';

interface AiHeaderProps {
  title?: string;
  subtitle?: string;
  badgeText?: string;
}

export const AiHeader: React.FC<AiHeaderProps> = ({
  title = "CenterFlow AI Workspace Engine",
  subtitle = "Automated essay evaluation, IELTS speaking scoring, and real-time student feedback runner.",
  badgeText = "Powered by Gemini & AI Studio"
}) => {
  return (
    <div className="relative p-5 sm:p-6 rounded-3xl bg-slate-900/90 dark:bg-slate-900/80 border border-amber-500/30 shadow-xl backdrop-blur-md overflow-hidden flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
      {/* Background ambient glow */}
      <div className="absolute -right-16 -bottom-16 w-48 h-48 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />

      <div className="flex items-center gap-4 z-10">
        {/* AI Brand Avatar with Glowing Shadow */}
        <div className="relative shrink-0">
          <SafeImage
            src={APP_ASSETS.aiLogo}
            alt="CenterFlow AI Avatar"
            className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl object-cover border-2 border-amber-500/50 shadow-lg drop-shadow-[0_0_12px_rgba(245,158,11,0.35)]"
            fallbackIcon={<Bot className="w-8 h-8 text-amber-400" />}
          />
          <span className="absolute -bottom-1 -right-1 p-1 bg-amber-500 text-slate-950 rounded-full shadow-md">
            <Sparkles className="w-3 h-3 fill-slate-950" />
          </span>
        </div>

        <div>
          <div className="flex items-center gap-2 mb-1">
            <h2 className="text-lg sm:text-xl font-black text-white tracking-tight flex items-center gap-2">
              <span>{title}</span>
            </h2>
          </div>
          <p className="text-xs text-slate-400 max-w-xl leading-relaxed">
            {subtitle}
          </p>
        </div>
      </div>

      <div className="z-10 shrink-0 self-end sm:self-center">
        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-400 font-extrabold text-xs shadow-inner">
          <Bot className="w-3.5 h-3.5 text-amber-400" />
          <span>{badgeText}</span>
        </span>
      </div>
    </div>
  );
};
