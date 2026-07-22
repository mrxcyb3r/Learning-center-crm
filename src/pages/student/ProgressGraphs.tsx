import React from 'react';
import { useLanguage } from '../../context/LanguageContext';
import {
  TrendingUp,
  Award,
  Calendar,
  CheckCircle2,
  BookOpen,
  Sparkles,
  BarChart2
} from 'lucide-react';

export const ProgressGraphs: React.FC = () => {
  const { language } = useLanguage();
  const isUz = language === 'UZ';

  const mockTestHistory = [
    { date: 'Yanvar 2026', overall: 6.5, listening: 7.0, reading: 6.5, writing: 6.0, speaking: 6.5 },
    { date: 'Fevral 2026', overall: 7.0, listening: 7.5, reading: 7.0, writing: 6.5, speaking: 7.0 },
    { date: 'Mart 2026', overall: 7.5, listening: 8.0, reading: 7.5, writing: 7.0, speaking: 7.5 }
  ];

  const currentScore = mockTestHistory[mockTestHistory.length - 1];

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header Banner */}
      <div className="p-6 rounded-3xl bg-slate-900 text-white border border-slate-800 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 text-amber-400 text-xs font-bold border border-amber-500/20 mb-2">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>{isUz ? "O'zlashtirish Dinamikasi" : "Academic Performance Dynamics"}</span>
          </div>
          <h2 className="text-2xl font-black tracking-tight">
            {isUz ? "O'quv Natijalari va Davomat Tahlili" : "Test Scores & Attendance Analytics"}
          </h2>
          <p className="text-xs text-slate-400 mt-1 max-w-xl">
            {isUz
              ? "Mock imtihonlari va darslardagi faolligingiz bo'yicha tayyorlangan shaxsiy tahliliy ko'rsatkichlar."
              : "Individual breakdown of your mock test scores and class attendance records."}
          </p>
        </div>

        <div className="px-6 py-4 rounded-2xl bg-slate-800/80 border border-slate-700/80 text-center shrink-0">
          <span className="text-[10px] text-slate-400 uppercase font-bold block">{isUz ? "Hozirgi IELTS Darajangiz" : "Current Band Score"}</span>
          <span className="text-3xl font-black text-amber-400">{currentScore.overall}</span>
          <span className="text-[10px] text-emerald-400 font-bold block mt-0.5">+1.0 Band O'sish</span>
        </div>
      </div>

      {/* 4 Skills Breakdown Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">Listening</span>
            <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-bold">
              {currentScore.listening}
            </span>
          </div>
          <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
            <div className="h-full bg-emerald-500 rounded-full" style={{ width: '88%' }} />
          </div>
          <p className="text-[10px] text-slate-400 font-medium">A'lo (Top Section)</p>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">Reading</span>
            <span className="px-2 py-0.5 rounded bg-blue-500/10 text-blue-600 dark:text-blue-400 text-xs font-bold">
              {currentScore.reading}
            </span>
          </div>
          <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
            <div className="h-full bg-blue-500 rounded-full" style={{ width: '83%' }} />
          </div>
          <p className="text-[10px] text-slate-400 font-medium">Barqaror o'sish</p>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">Writing</span>
            <span className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-600 dark:text-amber-400 text-xs font-bold">
              {currentScore.writing}
            </span>
          </div>
          <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
            <div className="h-full bg-amber-500 rounded-full" style={{ width: '77%' }} />
          </div>
          <p className="text-[10px] text-amber-500 font-medium">E'tibor talab (Task 2)</p>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">Speaking</span>
            <span className="px-2 py-0.5 rounded bg-purple-500/10 text-purple-600 dark:text-purple-400 text-xs font-bold">
              {currentScore.speaking}
            </span>
          </div>
          <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
            <div className="h-full bg-purple-500 rounded-full" style={{ width: '83%' }} />
          </div>
          <p className="text-[10px] text-slate-400 font-medium">Yaxshi natija</p>
        </div>
      </div>

      {/* Historical Test Progress Table */}
      <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-md">
        <h3 className="text-sm font-extrabold text-slate-900 dark:text-white uppercase tracking-wider mb-4 flex items-center gap-2">
          <BarChart2 className="w-4 h-4 text-amber-500" />
          <span>{isUz ? "Mock Imtihonlar Tarixi" : "Mock Test Score History"}</span>
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 font-bold uppercase text-[10px]">
                <th className="py-3 px-4">{isUz ? "Sana / Oy" : "Date / Month"}</th>
                <th className="py-3 px-4">Listening</th>
                <th className="py-3 px-4">Reading</th>
                <th className="py-3 px-4">Writing</th>
                <th className="py-3 px-4">Speaking</th>
                <th className="py-3 px-4 text-right">Overall Band</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-semibold">
              {mockTestHistory.map((row, index) => (
                <tr key={index} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition">
                  <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <Calendar className="w-3.5 h-3.5 text-amber-500" />
                    <span>{row.date}</span>
                  </td>
                  <td className="py-3.5 px-4 text-slate-700 dark:text-slate-300">{row.listening}</td>
                  <td className="py-3.5 px-4 text-slate-700 dark:text-slate-300">{row.reading}</td>
                  <td className="py-3.5 px-4 text-slate-700 dark:text-slate-300">{row.writing}</td>
                  <td className="py-3.5 px-4 text-slate-700 dark:text-slate-300">{row.speaking}</td>
                  <td className="py-3.5 px-4 text-right font-black text-amber-500 text-sm">
                    {row.overall}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Attendance & Teacher Recommendation Card */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-md space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-bold text-slate-900 dark:text-white">
              {isUz ? "Darslarga Qatnashish Davomati" : "Class Attendance Rate"}
            </h4>
            <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-black">
              96% Overall
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-700 dark:text-emerald-300 flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
            <p>
              {isUz
                ? "Siz o'tgan 24 ta darsdan 23 tasida qatnashdingiz! Intizomingiz a'lo darajada."
                : "You attended 23 out of the last 24 classes! Excellent discipline."}
            </p>
          </div>
        </div>

        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-md space-y-3">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 text-xs font-bold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>{isUz ? "Ustoz Tavsiyasi" : "Teacher Recommendation"}</span>
          </div>
          <h4 className="text-xs font-bold text-slate-900 dark:text-white">
            Jasur Rahimov (Head IELTS Mentor):
          </h4>
          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed italic">
            "{isUz
              ? "Writing Task 2 insholarida kiritish jumlalari va murakkab sintaksislarga e'tibor qarating. Listening va Speaking darajangiz IELTS 8.0 tayyor!"
              : "Focus more on complex linking phrases for Writing Task 2 essays. Your Listening & Speaking are ready for IELTS 8.0!"}"
          </p>
        </div>
      </div>
    </div>
  );
};
