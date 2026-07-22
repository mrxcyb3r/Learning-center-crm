import React, { useState } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { Award, CheckCircle2, Save, Send, Sparkles, User } from 'lucide-react';

export const GradebookView: React.FC = () => {
  const { language } = useLanguage();
  const isUz = language === 'UZ';

  const [studentName, setStudentName] = useState('Shahrzod Rahimov');
  const [testType, setTestType] = useState<'IELTS' | 'CEFR'>('IELTS');
  const [listening, setListening] = useState('7.5');
  const [reading, setReading] = useState('7.0');
  const [writing, setWriting] = useState('6.5');
  const [speaking, setSpeaking] = useState('7.5');
  const [feedback, setFeedback] = useState('Writing Task 2 inshoda tahlil yetarlicha chuqur, lekin paragraflar oralig\'idagi bog\'lovchi so\'zlarga ko\'proq e\'tibor qaratish kerak.');
  const [savedSuccess, setSavedSuccess] = useState(false);

  const calculatedOverall = (
    (parseFloat(listening || '0') +
      parseFloat(reading || '0') +
      parseFloat(writing || '0') +
      parseFloat(speaking || '0')) /
    4
  ).toFixed(1);

  const handleSaveGrade = (e: React.FormEvent) => {
    e.preventDefault();
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="p-6 rounded-3xl bg-slate-900 text-white border border-slate-800 shadow-xl flex items-center justify-between">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 text-amber-400 text-xs font-bold border border-amber-500/30 mb-2">
            <Award className="w-3.5 h-3.5" />
            <span>IELTS & CEFR Gradebook</span>
          </div>
          <h2 className="text-2xl font-black">
            {isUz ? "Baholash & IELTS Score Recorder" : "Gradebook & Essay Scoring Tool"}
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            {isUz
              ? "O'quvchilarning Mock IELTS / CEFR ballarini kiritib, insholar bo'yicha shaxsiy feedback va sertifikat kartasini shakllantiring."
              : "Record mock scores, generate band breakdowns, and provide teacher feedback."}
          </p>
        </div>
      </div>

      {savedSuccess && (
        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs font-bold flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
          <span>{isUz ? "Natija va feedback muvaffaqiyatli saqlandi va o'quvchi profiliga biriktirildi!" : "Score and feedback saved successfully!"}</span>
        </div>
      )}

      {/* Gradebook Form */}
      <form onSubmit={handleSaveGrade} className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-md space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              O'quvchining Ismi
            </label>
            <input
              type="text"
              required
              value={studentName}
              onChange={(e) => setStudentName(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Imtihon Turi
            </label>
            <select
              value={testType}
              onChange={(e) => setTestType(e.target.value as any)}
              className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500"
            >
              <option value="IELTS">IELTS Mock Exam</option>
              <option value="CEFR">CEFR B2/C1 National Exam</option>
            </select>
          </div>
        </div>

        {/* 4 Skills Inputs */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80">
          <div>
            <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">
              Listening
            </label>
            <input
              type="text"
              value={listening}
              onChange={(e) => setListening(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white text-center"
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">
              Reading
            </label>
            <input
              type="text"
              value={reading}
              onChange={(e) => setReading(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white text-center"
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">
              Writing
            </label>
            <input
              type="text"
              value={writing}
              onChange={(e) => setWriting(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white text-center"
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">
              Speaking
            </label>
            <input
              type="text"
              value={speaking}
              onChange={(e) => setSpeaking(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white text-center"
            />
          </div>
        </div>

        {/* Calculated Overall Band Banner */}
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-between text-xs font-bold text-slate-900 dark:text-white">
          <span>{isUz ? "Hisoblangan Umumiy (Overall Band):" : "Calculated Overall Band:"}</span>
          <span className="text-xl font-black text-amber-500">{calculatedOverall}</span>
        </div>

        {/* Feedback Textarea */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            {isUz ? "Insho va Dars Boyicha Ustoz Mulohazalari (Feedback)" : "Teacher Essay Feedback & Notes"}
          </label>
          <textarea
            rows={4}
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500"
          />
        </div>

        <button
          type="submit"
          className="w-full py-3.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-lg shadow-amber-500/20 transition cursor-pointer flex items-center justify-center gap-2"
        >
          <Save className="w-4 h-4" />
          <span>{isUz ? "Natijani Saqlash va E'lon Qilish" : "Save Grade & Certificate"}</span>
        </button>
      </form>
    </div>
  );
};
