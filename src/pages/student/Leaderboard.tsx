import React from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { Award, Flame, Star, Trophy, CheckCircle } from 'lucide-react';

export const Leaderboard: React.FC = () => {
  const { language } = useLanguage();
  const isUz = language === 'UZ';

  const studentsLeaderboard = [
    { rank: 1, name: 'Shahrzod Rahimov', score: 'IELTS 8.5', points: 1250, streak: 14, isCurrentUser: false },
    { rank: 2, name: 'Madina Umarova', score: 'IELTS 8.0', points: 1180, streak: 12, isCurrentUser: false },
    { rank: 3, name: 'Jahongir Qodirov', score: 'IELTS 8.0', points: 1120, streak: 10, isCurrentUser: true },
    { rank: 4, name: 'Aziza Jalolova', score: 'CEFR C1', points: 980, streak: 8, isCurrentUser: false },
    { rank: 5, name: 'Sardor Ergashev', score: 'IELTS 7.5', points: 940, streak: 7, isCurrentUser: false },
    { rank: 6, name: 'Bekzod Nabiyev', score: 'IT Portfolio', points: 890, streak: 6, isCurrentUser: false }
  ];

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-amber-500 via-amber-600 to-amber-700 text-slate-950 shadow-xl flex items-center justify-between">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-950/20 text-slate-950 font-bold text-xs uppercase tracking-wider mb-2">
            <Trophy className="w-3.5 h-3.5" />
            <span>{isUz ? "Guruh Reytingi & Oylik Peshqadamlar" : "Class Leaderboard & Ranking"}</span>
          </div>
          <h2 className="text-2xl font-black">
            {isUz ? "Renessans LC Top O'quvchilari" : "Renessans LC Top Students"}
          </h2>
          <p className="text-xs text-slate-900/80 mt-1">
            {isUz
              ? "Vazifalarni vaqtida topshirish, Mock test natijalari hamda darsdagi faollik asosida hisoblanadi."
              : "Rankings based on timely homework submissions, mock test bands, and class participation."}
          </p>
        </div>

        <div className="hidden sm:block p-4 rounded-2xl bg-slate-950/10 border border-slate-950/20 text-center">
          <Flame className="w-8 h-8 text-slate-950 mx-auto mb-1 animate-bounce" />
          <span className="text-[10px] font-bold uppercase">{isUz ? "Oylik Musobaqa" : "Monthly Challenge"}</span>
        </div>
      </div>

      {/* Top 3 Podium Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {studentsLeaderboard.slice(0, 3).map((item) => (
          <div
            key={item.rank}
            className={`p-6 rounded-3xl border transition-all text-center space-y-3 relative overflow-hidden ${
              item.rank === 1
                ? 'bg-gradient-to-b from-amber-500/10 to-amber-500/5 border-amber-500/40 shadow-xl'
                : 'bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800 shadow-md'
            }`}
          >
            {item.rank === 1 && (
              <span className="absolute top-2 right-2 px-2.5 py-0.5 rounded-full bg-amber-500 text-slate-950 text-[10px] font-black uppercase">
                #1 Champion
              </span>
            )}

            <div
              className={`w-14 h-14 rounded-2xl mx-auto flex items-center justify-center text-xl font-black shadow-lg ${
                item.rank === 1
                  ? 'bg-amber-500 text-slate-950'
                  : item.rank === 2
                  ? 'bg-slate-300 text-slate-900'
                  : 'bg-amber-700 text-white'
              }`}
            >
              #{item.rank}
            </div>

            <div>
              <h4 className="text-sm font-extrabold text-slate-900 dark:text-white truncate">
                {item.name}
              </h4>
              <p className="text-xs font-bold text-amber-500 mt-0.5">{item.score}</p>
            </div>

            <div className="flex items-center justify-center gap-3 text-xs pt-2 border-t border-slate-100 dark:border-slate-800/80">
              <span className="font-bold text-slate-700 dark:text-slate-300">{item.points} pt</span>
              <span className="text-rose-500 font-bold flex items-center gap-1">
                <Flame className="w-3.5 h-3.5 fill-current" /> {item.streak}d
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Full Leaderboard Table */}
      <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-md">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 font-bold uppercase text-[10px]">
                <th className="py-3 px-4">Rank</th>
                <th className="py-3 px-4">O'quvchi Ismi</th>
                <th className="py-3 px-4">Sertifikat / Daraja</th>
                <th className="py-3 px-4">Oylik Ballar</th>
                <th className="py-3 px-4 text-right">Davomat Ketma-ketligi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-semibold">
              {studentsLeaderboard.map((item) => (
                <tr
                  key={item.rank}
                  className={`transition ${
                    item.isCurrentUser
                      ? 'bg-amber-500/10 dark:bg-amber-500/5 font-bold'
                      : 'hover:bg-slate-50 dark:hover:bg-slate-800/40'
                  }`}
                >
                  <td className="py-3.5 px-4">
                    <span
                      className={`w-6 h-6 rounded-lg inline-flex items-center justify-center font-bold text-xs ${
                        item.rank <= 3
                          ? 'bg-amber-500 text-slate-950'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      {item.rank}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <span>{item.name}</span>
                    {item.isCurrentUser && (
                      <span className="px-2 py-0.5 rounded bg-amber-500 text-slate-950 text-[9px] font-black uppercase">
                        Siz
                      </span>
                    )}
                  </td>
                  <td className="py-3.5 px-4 text-amber-500 font-bold">{item.score}</td>
                  <td className="py-3.5 px-4 text-slate-700 dark:text-slate-300">{item.points} pts</td>
                  <td className="py-3.5 px-4 text-right text-rose-500 font-bold flex items-center justify-end gap-1">
                    <Flame className="w-3.5 h-3.5 fill-current" />
                    <span>{item.streak} kun</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
