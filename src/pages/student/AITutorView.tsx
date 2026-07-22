import React from 'react';
import { PrimeAIAssistant } from '../../components/AI/PrimeAIAssistant';

export const AITutorView: React.FC = () => {
  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="relative overflow-hidden p-6 md:p-8 rounded-3xl bg-slate-900 text-white border border-slate-800 shadow-xl">
        <div className="relative z-10 max-w-2xl space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 text-amber-400 text-xs font-bold border border-amber-500/30">
            <span>CenterFlow Prime Multimodal Engine</span>
          </div>
          <h2 className="text-2xl md:text-3xl font-black text-white tracking-tight">
            24/7 AI Learning Coach & Multimodal Assistant
          </h2>
          <p className="text-xs md:text-sm text-slate-300 leading-relaxed">
            IELTS Speaking nutqini audio orqali yuborib baholatish, insho (Writing) tahlili olish, matematika va Python masalalariga akademik tushunchalar hamda ko'rsatmalar olish uchun quyidagi multimodal platformadan foydalaning.
          </p>
        </div>
      </div>

      <div className="relative min-h-[680px]">
        <PrimeAIAssistant isOpen={true} />
      </div>
    </div>
  );
};
