import React from 'react';
import { APP_ASSETS } from '../constants/assets';
import { SafeImage } from './common/SafeImage';
import { Sparkles, Bot } from 'lucide-react';
import { AnimatedGradientText } from './ui/AnimatedGradientText';

interface AiHeaderProps {
  title?: string;
  subtitle?: string;
  badgeText?: string;
}

export const AiHeader: React.FC<AiHeaderProps> = ({
  title = "CenterFlow Neural Copilot v2.5 Flash",
  subtitle = "Automated essay evaluation, IELTS speaking scoring, and real-time student feedback runner.",
  badgeText = "Powered by Gemini 2.5 & AI Studio"
}) => {
  return (
    <div className="relative p-5 sm:p-6 rounded-3xl bg-slate-900/90 dark:bg-slate-900/80 border border-amber-500/40 shadow-2xl shadow-amber-500/10 backdrop-blur-md overflow-hidden flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
      {/* Background ambient glow */}
      <div className="absolute -right-16 -bottom-16 w-56 h-56 bg-gradient-to-r from-amber-500/20 to-cyan-500/20 rounded-full blur-3xl pointer-events-none" />

      <div className="flex items-center gap-4 z-10">
        {/* AI Brand Avatar with Glowing Halo */}
        <div className="relative shrink-0">
          <div className="p-0.5 rounded-2xl bg-gradient-to-r from-amber-500 via-cyan-400 to-amber-500 animate-pulse ring-2 ring-amber-500/60 shadow-lg shadow-amber-500/30">
            <SafeImage
              src={APP_ASSETS.aiLogo}
              alt="CenterFlow AI Avatar"
              className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl object-cover border border-slate-900"
              fallbackIcon={<Bot className="w-8 h-8 text-amber-400" />}
            />
          </div>
          <span className="absolute -bottom-1 -right-1 p-1 bg-amber-500 text-slate-950 rounded-full shadow-md z-10">
            <Sparkles className="w-3 h-3 fill-slate-950" />
          </span>
        </div>

        <div>
          <div className="flex items-center gap-2 mb-1">
            <h2 className="text-lg sm:text-xl font-black tracking-tight flex items-center gap-2">
              <AnimatedGradientText from="from-amber-400" via="via-amber-200" to="to-cyan-400">
                {title}
              </AnimatedGradientText>
            </h2>
          </div>
          <p className="text-xs text-slate-400 max-w-xl leading-relaxed">
            {subtitle}
          </p>
        </div>
      </div>

      <div className="z-10 shrink-0 self-end sm:self-center">
        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/15 border border-amber-500/40 text-amber-300 font-extrabold text-xs shadow-lg shadow-amber-500/10">
          <Bot className="w-3.5 h-3.5 text-amber-400" />
          <span>{badgeText}</span>
        </span>
      </div>
    </div>
  );
};
