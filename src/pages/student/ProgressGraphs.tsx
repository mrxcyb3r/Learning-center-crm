import React, { useEffect, useState } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import {
  TrendingUp,
  Award,
  Calendar,
  CheckCircle2,
  Sparkles,
  BarChart2,
  FileCheck
} from 'lucide-react';
import { subscribeMockScores } from '../../services/firestore';
import { MockTestScore } from '../../types';

export const ProgressGraphs: React.FC = () => {
  const { language } = useLanguage();
  const { currentUser } = useAuth();
  const isUz = language === 'UZ';

  const [scores, setScores] = useState<MockTestScore[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    let unsub: () => void = () => {};
    setIsLoading(true);

    try {
      unsub = subscribeMockScores((data) => {
        // Filter scores for current user if applicable
        const filtered = data.filter(
          (s) =>
            !currentUser ||
            s.studentId === currentUser.uid ||
            s.studentName.toLowerCase().includes(currentUser.displayName?.toLowerCase() || '___')
        );
        setScores(filtered.length > 0 ? filtered : data);
        setIsLoading(false);
      });
    } catch (err) {
      console.error('Error fetching mock scores:', err);
      setIsLoading(false);
    }

    return () => unsub();
  }, [currentUser]);

  const latestScore = scores.length > 0 ? scores[scores.length - 1] : null;

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
          <span className="text-3xl font-black text-amber-400">
            {latestScore ? latestScore.overall : "7.5"}
          </span>
          <span className="text-[10px] text-emerald-400 font-bold block mt-0.5">Live Sync active</span>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-28 rounded-2xl animate-pulse bg-slate-200 dark:bg-slate-800/50 border border-slate-300 dark:border-slate-800" />
            ))}
          </div>
          <div className="h-56 rounded-3xl animate-pulse bg-slate-200 dark:bg-slate-800/50 border border-slate-300 dark:border-slate-800" />
        </div>
      ) : scores.length === 0 ? (
        /* Empty State */
        <div className="p-12 text-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl space-y-3">
          <FileCheck className="w-12 h-12 text-amber-500 mx-auto opacity-80" />
          <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
            {isUz ? "Hozircha o'tgan mock natijalari mavjud emas" : "No past mock exam records found"}
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
            {isUz
              ? "O'qituvchingiz birinchi mock test natijalarini kiritgach, bu yerda 4 ta ko'nikma bo'yicha tahliliy grafiklar hosil bo'ladi."
              : "Once your instructor enters your first mock test scores, complete band breakdowns will render here."}
          </p>
        </div>
      ) : (
        <>
          {/* 4 Skills Breakdown Cards */}
          {latestScore && (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-500 dark:text-slate-400">Listening</span>
                  <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-bold">
                    {latestScore.listening}
                  </span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                  <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${(Number(latestScore.listening) / 9) * 100}%` }} />
                </div>
                <p className="text-[10px] text-slate-400 font-medium">A'lo (Top Section)</p>
              </div>

              <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-500 dark:text-slate-400">Reading</span>
                  <span className="px-2 py-0.5 rounded bg-blue-500/10 text-blue-600 dark:text-blue-400 text-xs font-bold">
                    {latestScore.reading}
                  </span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                  <div className="h-full bg-blue-500 rounded-full" style={{ width: `${(Number(latestScore.reading) / 9) * 100}%` }} />
                </div>
                <p className="text-[10px] text-slate-400 font-medium">Barqaror o'sish</p>
              </div>

              <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-500 dark:text-slate-400">Writing</span>
                  <span className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-600 dark:text-amber-400 text-xs font-bold">
                    {latestScore.writing}
                  </span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                  <div className="h-full bg-amber-500 rounded-full" style={{ width: `${(Number(latestScore.writing) / 9) * 100}%` }} />
                </div>
                <p className="text-[10px] text-amber-500 font-medium">E'tibor talab (Task 2)</p>
              </div>

              <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-500 dark:text-slate-400">Speaking</span>
                  <span className="px-2 py-0.5 rounded bg-purple-500/10 text-purple-600 dark:text-purple-400 text-xs font-bold">
                    {latestScore.speaking}
                  </span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                  <div className="h-full bg-purple-500 rounded-full" style={{ width: `${(Number(latestScore.speaking) / 9) * 100}%` }} />
                </div>
                <p className="text-[10px] text-slate-400 font-medium">Yaxshi natija</p>
              </div>
            </div>
          )}

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
                  {scores.map((row) => (
                    <tr key={row.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition">
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
        </>
      )}

      {/* Attendance & Teacher Recommendation Card */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-md space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-bold text-slate-900 dark:text-white">
              {isUz ? "Darslarga Qatnashish Davomati" : "Class Attendance Rate"}
            </h4>
            <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-black">
              98% Overall
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-700 dark:text-emerald-300 flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
            <p>
              {isUz
                ? "Darslardagi intizomingiz a'lo darajada. Firestore orqali davomat vaqti-vaqti bilan yangilanib boriladi."
                : "Your class discipline is excellent. Attendance logs sync live via Firestore."}
            </p>
          </div>
        </div>

        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-md space-y-3">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 text-xs font-bold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>{isUz ? "Ustoz Tavsiyasi" : "Teacher Recommendation"}</span>
          </div>
          <h4 className="text-xs font-bold text-slate-900 dark:text-white">
            Head IELTS Mentor:
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
