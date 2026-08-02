import React from 'react';
import { StudentResult } from '../types';
import { X, Award, CheckCircle2, Share2, Sparkles } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

interface ResultCertificateModalProps {
  result: StudentResult | null;
  onClose: () => void;
}

export const ResultCertificateModal: React.FC<ResultCertificateModalProps> = ({ result, onClose }) => {
  const { t } = useLanguage();

  if (!result) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden p-6 sm:p-8">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Certificate Frame Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 text-xs font-bold border border-amber-500/20 mb-3">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Renessans LC Verified Result</span>
          </div>
          <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            Official {result.testType} Score Card
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Imtihon topshirilgan sana: <span className="font-semibold">{result.date}</span>
          </p>
        </div>

        {/* Certificate Card Graphics */}
        <div className="relative p-6 rounded-2xl bg-gradient-to-br from-amber-500/5 via-yellow-500/5 to-amber-500/10 border-2 border-amber-500/30 text-slate-900 dark:text-white mb-6">
          <div className="flex items-center justify-between pb-4 border-b border-amber-500/20">
            <div>
              <p className="text-[10px] uppercase tracking-widest text-slate-400 font-bold">O'quvchi / Candidate</p>
              <h4 className="text-xl font-bold text-amber-500">{result.studentName}</h4>
              <p className="text-xs text-slate-500 dark:text-slate-400">Ustoz: {result.teacherName}</p>
            </div>
            <div className="text-right">
              <p className="text-[10px] uppercase tracking-widest text-slate-400 font-bold">Overall Score</p>
              <div className="text-3xl font-black text-amber-500">{result.score}</div>
            </div>
          </div>

          {/* Subscores Grid */}
          <div className="grid grid-cols-4 gap-3 mt-4 text-center">
            <div className="p-2.5 rounded-xl bg-white/80 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700">
              <p className="text-[10px] font-bold text-slate-400 uppercase">Listening</p>
              <p className="text-base font-extrabold text-slate-800 dark:text-slate-100">{result.listening}</p>
            </div>
            <div className="p-2.5 rounded-xl bg-white/80 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700">
              <p className="text-[10px] font-bold text-slate-400 uppercase">Reading</p>
              <p className="text-base font-extrabold text-slate-800 dark:text-slate-100">{result.reading}</p>
            </div>
            <div className="p-2.5 rounded-xl bg-white/80 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700">
              <p className="text-[10px] font-bold text-slate-400 uppercase">Writing</p>
              <p className="text-base font-extrabold text-slate-800 dark:text-slate-100">{result.writing}</p>
            </div>
            <div className="p-2.5 rounded-xl bg-white/80 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700">
              <p className="text-[10px] font-bold text-slate-400 uppercase">Speaking</p>
              <p className="text-base font-extrabold text-slate-800 dark:text-slate-100">{result.speaking}</p>
            </div>
          </div>

          {/* Verification Badge */}
          <div className="flex items-center justify-between mt-5 pt-3 border-t border-amber-500/20 text-xs">
            <span className="flex items-center gap-1.5 font-semibold text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="w-4 h-4" /> Renessans LC / CenterFlow Verified TRF
            </span>
            <span className="text-[10px] font-mono text-slate-400">ID: RLC-2026-0982</span>
          </div>
        </div>

        {/* Real High-Res TRF Image Document Preview */}
        <div className="mb-6 rounded-2xl overflow-hidden border border-amber-500/30 bg-slate-950 p-2 shadow-inner">
          <p className="text-[10px] uppercase font-bold text-amber-400 px-2 py-1 flex items-center justify-between">
            <span>Official TRF Document Scan</span>
            <span className="text-slate-400">Verified IDP/BC</span>
          </p>
          <img
            src={result.certificateUrl || "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?q=80&w=1000&auto=format&fit=crop"}
            alt="Official IELTS Test Report Form"
            referrerPolicy="no-referrer"
            className="w-full h-48 object-cover rounded-xl border border-white/10 hover:scale-105 transition duration-500"
          />
        </div>

        {/* Modal Actions */}
        <div className="flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs hover:bg-slate-200 dark:hover:bg-slate-700 transition cursor-pointer"
          >
            {t.results.closeModal}
          </button>
        </div>
      </div>
    </div>
  );
};
