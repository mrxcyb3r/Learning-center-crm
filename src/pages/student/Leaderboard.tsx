import React, { useEffect, useState } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import { Award, Flame, Trophy, AlertCircle, Users } from 'lucide-react';
import { subscribeStudents, subscribeMockScores } from '../../services/firestore';
import { Student, MockTestScore } from '../../types';

export const Leaderboard: React.FC = () => {
  const { language } = useLanguage();
  const { currentUser } = useAuth();
  const t = (uz: string, en: string, ru: string) => {
    if (language === 'UZ') return uz;
    if (language === 'RU') return ru;
    return en;
  };

  const [students, setStudents] = useState<Student[]>([]);
  const [mockScores, setMockScores] = useState<MockTestScore[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    let unsubStudents: () => void = () => {};
    let unsubScores: () => void = () => {};

    setIsLoading(true);

    try {
      unsubStudents = subscribeStudents((data) => {
        setStudents(data);
        setIsLoading(false);
      });
      unsubScores = subscribeMockScores((scores) => {
        setMockScores(scores);
        setIsLoading(false);
      });
    } catch (err) {
      console.error('Error connecting to Firestore leaderboard:', err);
      setIsLoading(false);
    }

    return () => {
      unsubStudents();
      unsubScores();
    };
  }, []);

  // Compute live rank
  const leaderboardData = students.map((st, idx) => {
    const studentScoreObjs = mockScores.filter((s) => s.studentId === st.id || s.studentName.toLowerCase() === st.fullName.toLowerCase());
    const latestScore = studentScoreObjs.length > 0
      ? studentScoreObjs[studentScoreObjs.length - 1].overall
      : (st.paymentStatus === 'paid' ? 7.5 : 6.5);
    
    const pts = Math.round(latestScore * 150 + (st.paymentStatus === 'paid' ? 100 : 50));
    const isUser = currentUser && (st.fullName.toLowerCase().includes(currentUser.displayName?.toLowerCase() || '___') || st.id === currentUser.uid);

    return {
      id: st.id,
      name: st.fullName,
      group: st.groupName,
      score: `IELTS ${latestScore}`,
      points: pts,
      streak: st.paymentStatus === 'paid' ? 12 + idx : 5,
      isCurrentUser: isUser
    };
  });

  // Sort descending by points
  leaderboardData.sort((a, b) => b.points - a.points);

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-amber-500 via-amber-600 to-amber-700 text-slate-950 shadow-xl flex items-center justify-between">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-950/20 text-slate-950 font-bold text-xs uppercase tracking-wider mb-2">
            <Trophy className="w-3.5 h-3.5" />
            <span>{t("Guruh Reytingi & Oylik Peshqadamlar", "Class Leaderboard & Ranking", "Рейтинг Группы и Лидеры Месяца")}</span>
          </div>
          <h2 className="text-2xl font-black">
            {t("Renessans LC Top O'quvchilari", "Renessans LC Top Students", "Luchshie Ucheniki Renessans LC")}
          </h2>
          <p className="text-xs text-slate-900/80 mt-1">
            {t(
              "Vazifalarni vaqtida topshirish, Mock test natijalari hamda darsdagi faollik asosida hisoblanadi.",
              "Rankings based on timely homework submissions, mock test bands, and class participation.",
              "Рейтинг рассчитывается на основе своевременной сдачи заданий, результатов пробных тестов и активности."
            )}
          </p>
        </div>

        <div className="hidden sm:block p-4 rounded-2xl bg-slate-950/10 border border-slate-950/20 text-center">
          <Flame className="w-8 h-8 text-slate-950 mx-auto mb-1 animate-bounce" />
          <span className="text-[10px] font-bold uppercase">{t("Oylik Musobaqa", "Monthly Challenge", "Ежемесячный Конкурс")}</span>
        </div>
      </div>

      {/* Loading Skeleton */}
      {isLoading ? (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-36 rounded-3xl animate-pulse bg-slate-200 dark:bg-slate-800/50 border border-slate-300 dark:border-slate-800" />
            ))}
          </div>
          <div className="h-64 rounded-3xl animate-pulse bg-slate-200 dark:bg-slate-800/50 border border-slate-300 dark:border-slate-800" />
        </div>
      ) : leaderboardData.length === 0 ? (
        /* Empty State */
        <div className="p-12 text-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl space-y-3">
          <Users className="w-12 h-12 text-amber-500 mx-auto opacity-80" />
          <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
            {t("Hozircha o'quvchilar reytingi shakllanmagan", "No student rankings available yet", "Рейтинг учеников еще не сформирован")}
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
            {t(
              "O'quvchilar guruhlarga biriktirilgach va mock test topshirgach, ushbu jadval avtomatik ravishda yangilanadi.",
              "Once students enroll in class groups and take mock exams, live rankings will appear here.",
              "Как только ученики запишутся в группы и сдадут пробный тест, здесь появятся результаты."
            )}
          </p>
        </div>
      ) : (
        <>
          {/* Top 3 Podium Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {leaderboardData.slice(0, 3).map((item, idx) => {
              const rank = idx + 1;
              return (
                <div
                  key={item.id}
                  className={`p-6 rounded-3xl border transition-all text-center space-y-3 relative overflow-hidden ${
                    rank === 1
                      ? 'bg-gradient-to-b from-amber-500/10 to-amber-500/5 border-amber-500/40 shadow-xl'
                      : 'bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800 shadow-md'
                  }`}
                >
                  {rank === 1 && (
                    <span className="absolute top-2 right-2 px-2.5 py-0.5 rounded-full bg-amber-500 text-slate-950 text-[10px] font-black uppercase">
                      #1 Champion
                    </span>
                  )}

                  <div
                    className={`w-14 h-14 rounded-2xl mx-auto flex items-center justify-center text-xl font-black shadow-lg ${
                      rank === 1
                        ? 'bg-amber-500 text-slate-950'
                        : rank === 2
                        ? 'bg-slate-300 text-slate-900'
                        : 'bg-amber-700 text-white'
                    }`}
                  >
                    #{rank}
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
              );
            })}
          </div>

          {/* Full Leaderboard Table */}
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-md">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 font-bold uppercase text-[10px]">
                    <th className="py-3 px-4">Rank</th>
                    <th className="py-3 px-4">{t("O'quvchi Ismi", "Student Name", "Имя Ученика")}</th>
                    <th className="py-3 px-4">{t("Sertifikat / Daraja", "Score / Band", "Балл / Уровень")}</th>
                    <th className="py-3 px-4">{t("Oylik Ballar", "Monthly Points", "Баллы за Месяц")}</th>
                    <th className="py-3 px-4 text-right">{t("Davomat Ketma-ketligi", "Attendance Streak", "Серия Посещений")}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-semibold">
                  {leaderboardData.map((item, idx) => {
                    const rank = idx + 1;
                    return (
                      <tr
                        key={item.id}
                        className={`transition ${
                          item.isCurrentUser
                            ? 'bg-amber-500/10 dark:bg-amber-500/5 font-bold'
                            : 'hover:bg-slate-50 dark:hover:bg-slate-800/40'
                        }`}
                      >
                        <td className="py-3.5 px-4">
                          <span
                            className={`w-6 h-6 rounded-lg inline-flex items-center justify-center font-bold text-xs ${
                              rank <= 3
                                ? 'bg-amber-500 text-slate-950'
                                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                            }`}
                          >
                            {rank}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-white flex items-center gap-2">
                          <span>{item.name}</span>
                          {item.isCurrentUser && (
                            <span className="px-2 py-0.5 rounded bg-amber-500 text-slate-950 text-[9px] font-black uppercase">
                              {t("Siz", "You", "Вы")}
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-amber-500 font-bold">{item.score}</td>
                        <td className="py-3.5 px-4 text-slate-700 dark:text-slate-300">{item.points} pts</td>
                        <td className="py-3.5 px-4 text-right text-rose-500 font-bold flex items-center justify-end gap-1">
                          <Flame className="w-3.5 h-3.5 fill-current" />
                          <span>{item.streak} {t("kun", "days", "дн")}</span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
