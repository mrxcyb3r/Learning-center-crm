import React from 'react';
import { motion } from 'motion/react';
import { APP_ASSETS } from '../constants/assets';
import { SafeImage } from './common/SafeImage';
import { Award, Trophy, Star, CheckCircle2, Crown, Medal, GraduationCap, Flame } from 'lucide-react';

export interface LeaderboardStudent {
  id: string;
  name: string;
  bandScore: number;
  course: string;
  avatarUrl?: string;
  breakdown: {
    listening: number;
    reading: number;
    writing: number;
    speaking: number;
  };
  examDate: string;
  badgeTitle?: string;
}

const DEFAULT_TOP_STUDENTS: LeaderboardStudent[] = [
  {
    id: '1',
    name: 'Azizbek Kholmuratov',
    bandScore: 8.5,
    course: 'IELTS Mastery 8.5+ Intensive',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200',
    breakdown: { listening: 9.0, reading: 9.0, writing: 8.0, speaking: 8.0 },
    examDate: 'July 2026',
    badgeTitle: 'Top National Achiever'
  },
  {
    id: '2',
    name: 'Madina Tursunova',
    bandScore: 8.0,
    course: 'IELTS Target 8.0 Morning',
    avatarUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&q=80&w=200',
    breakdown: { listening: 8.5, reading: 8.5, writing: 7.5, speaking: 7.5 },
    examDate: 'June 2026',
    badgeTitle: 'Academic Honor'
  },
  {
    id: '3',
    name: 'Jasur Karimov',
    bandScore: 8.0,
    course: 'SAT & IELTS Combo',
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=200',
    breakdown: { listening: 8.5, reading: 8.0, writing: 7.5, speaking: 8.0 },
    examDate: 'July 2026',
    badgeTitle: 'Fluency Master'
  },
  {
    id: '4',
    name: 'Shakhzoda Rahimova',
    bandScore: 7.5,
    course: 'General English C1',
    avatarUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=200',
    breakdown: { listening: 8.0, reading: 8.0, writing: 7.0, speaking: 7.0 },
    examDate: 'July 2026'
  },
  {
    id: '5',
    name: 'Diyorbek Alimov',
    bandScore: 7.5,
    course: 'IELTS Express Crash Course',
    avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=200',
    breakdown: { listening: 8.0, reading: 7.5, writing: 7.5, speaking: 7.0 },
    examDate: 'June 2026'
  }
];

interface LeaderboardWidgetProps {
  students?: LeaderboardStudent[];
  title?: string;
}

export const LeaderboardWidget: React.FC<LeaderboardWidgetProps> = ({
  students = DEFAULT_TOP_STUDENTS,
  title = "High-Score Student Leaderboard"
}) => {
  const rank1 = students[0];
  const otherStudents = students.slice(1);

  return (
    <div className="p-6 rounded-3xl bg-slate-900/90 dark:bg-slate-900/90 border border-amber-500/30 shadow-2xl backdrop-blur-md space-y-5">
      {/* Header section with High Scorer Badge Asset */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="relative shrink-0">
            <SafeImage
              src={APP_ASSETS.highScorerBadge}
              alt="High Scorer Badge"
              className="w-11 h-11 object-contain drop-shadow-[0_0_10px_rgba(245,158,11,0.45)]"
              fallbackIcon={<Trophy className="w-7 h-7 text-amber-400" />}
            />
          </div>
          <div>
            <h3 className="text-lg font-black text-white flex items-center gap-2">
              <span>{title}</span>
              <Trophy className="w-4 h-4 text-amber-400" />
            </h3>
            <p className="text-xs text-slate-400">Official CenterFlow Verified Official IELTS Hall of Fame</p>
          </div>
        </div>

        <span className="px-3 py-1.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs font-bold flex items-center gap-1.5 shadow-sm">
          <Flame className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
          <span>Top Achievers</span>
        </span>
      </div>

      {/* RANK #1 HERO CARD */}
      {rank1 && (
        <motion.div
          whileHover={{ scale: 1.015, y: -2 }}
          transition={{ duration: 0.2 }}
          className="relative p-5 rounded-2xl bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-slate-950/80 border-2 border-amber-500/50 shadow-lg shadow-amber-500/10 overflow-hidden group"
        >
          {/* Ambient Glow */}
          <div className="absolute top-0 right-0 -mt-8 -mr-8 w-36 h-36 bg-amber-500/20 rounded-full blur-2xl pointer-events-none" />

          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 z-10 relative">
            {/* Rank & Student Info */}
            <div className="flex items-center gap-4">
              <div className="relative shrink-0">
                <div className="w-14 h-14 rounded-2xl overflow-hidden border-2 border-amber-400 shadow-xl relative">
                  <SafeImage
                    src={rank1.avatarUrl}
                    alt={rank1.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <span className="absolute -top-2 -left-2 p-1 bg-amber-400 text-slate-950 rounded-full shadow-lg">
                  <Crown className="w-4 h-4 fill-slate-950 stroke-slate-950" />
                </span>
                <span className="absolute -bottom-1 -right-1 px-1.5 py-0.5 bg-amber-500 text-slate-950 rounded-md font-black text-[10px]">
                  #1
                </span>
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <h4 className="text-base font-black text-white group-hover:text-amber-300 transition-colors">
                    {rank1.name}
                  </h4>
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  {rank1.badgeTitle && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold">
                      {rank1.badgeTitle}
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-300 flex items-center gap-1.5 mt-0.5">
                  <GraduationCap className="w-3.5 h-3.5 text-amber-400" />
                  <span>{rank1.course}</span>
                  <span className="text-slate-600">•</span>
                  <span className="text-slate-400">{rank1.examDate}</span>
                </p>
              </div>
            </div>

            {/* Score Pill */}
            <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end border-t sm:border-t-0 border-amber-500/20 pt-3 sm:pt-0">
              <div className="hidden lg:flex items-center gap-2.5 text-xs font-mono text-slate-300 bg-slate-950/80 px-3 py-2 rounded-xl border border-amber-500/30">
                <span>L: <strong className="text-amber-400">{rank1.breakdown.listening}</strong></span>
                <span>R: <strong className="text-amber-400">{rank1.breakdown.reading}</strong></span>
                <span>W: <strong className="text-amber-400">{rank1.breakdown.writing}</strong></span>
                <span>S: <strong className="text-amber-400">{rank1.breakdown.speaking}</strong></span>
              </div>

              <div className="px-4 py-2 rounded-2xl bg-amber-500 text-slate-950 font-black text-base flex items-center gap-2 shadow-lg shadow-amber-500/30">
                <Trophy className="w-5 h-5 fill-slate-950" />
                <span>Band {rank1.bandScore.toFixed(1)}</span>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* RANKS #2 AND BELOW */}
      <div className="space-y-2.5">
        {otherStudents.map((student, index) => {
          const rankNumber = index + 2;
          const isSilver = rankNumber === 2;
          const isBronze = rankNumber === 3;

          return (
            <motion.div
              key={student.id}
              whileHover={{ scale: 1.01, y: -1 }}
              transition={{ duration: 0.15 }}
              className={`p-3.5 rounded-2xl bg-slate-950/60 border ${
                isSilver
                  ? 'border-slate-400/30 hover:border-slate-300/60'
                  : isBronze
                  ? 'border-amber-700/30 hover:border-amber-600/60'
                  : 'border-slate-800 hover:border-slate-700'
              } transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 group`}
            >
              {/* Student Info */}
              <div className="flex items-center gap-3">
                {/* Rank Badge */}
                <div className="w-7 h-7 rounded-xl flex items-center justify-center shrink-0 font-bold text-xs">
                  {isSilver ? (
                    <span className="p-1 rounded-lg bg-slate-400/20 text-slate-200 border border-slate-400/40 flex items-center gap-1">
                      <Medal className="w-3.5 h-3.5 text-slate-300" />
                      <span className="text-[10px]">#2</span>
                    </span>
                  ) : isBronze ? (
                    <span className="p-1 rounded-lg bg-amber-700/20 text-amber-400 border border-amber-700/40 flex items-center gap-1">
                      <Award className="w-3.5 h-3.5 text-amber-500" />
                      <span className="text-[10px]">#3</span>
                    </span>
                  ) : (
                    <span className="font-mono text-xs font-bold text-slate-500 group-hover:text-amber-400">
                      #{rankNumber}
                    </span>
                  )}
                </div>

                {/* Avatar */}
                <div className="relative shrink-0">
                  <div className="w-9 h-9 rounded-xl overflow-hidden border border-slate-700">
                    <SafeImage
                      src={student.avatarUrl}
                      alt={student.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>

                {/* Details */}
                <div>
                  <h4 className="text-sm font-bold text-white flex items-center gap-1.5 group-hover:text-amber-300 transition-colors">
                    <span>{student.name}</span>
                    <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                  </h4>
                  <p className="text-[11px] text-slate-400 flex items-center gap-1">
                    <span>{student.course}</span>
                    <span className="text-slate-600">•</span>
                    <span className="text-slate-500">{student.examDate}</span>
                  </p>
                </div>
              </div>

              {/* Subscores & Band Badge */}
              <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end border-t sm:border-t-0 border-slate-800/80 pt-2 sm:pt-0">
                <div className="hidden md:flex items-center gap-2 text-[10px] font-mono text-slate-400 bg-slate-900/90 px-2.5 py-1 rounded-lg border border-slate-800">
                  <span>L: <strong className="text-white">{student.breakdown.listening}</strong></span>
                  <span>R: <strong className="text-white">{student.breakdown.reading}</strong></span>
                  <span>W: <strong className="text-white">{student.breakdown.writing}</strong></span>
                  <span>S: <strong className="text-white">{student.breakdown.speaking}</strong></span>
                </div>

                <div className="px-3 py-1 rounded-xl bg-slate-800/90 border border-slate-700 text-slate-200 font-bold text-xs flex items-center gap-1.5 shadow-sm group-hover:border-amber-500/30 group-hover:text-amber-300">
                  <Star className="w-3.5 h-3.5 text-amber-400" />
                  <span>Band {student.bandScore.toFixed(1)}</span>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};
