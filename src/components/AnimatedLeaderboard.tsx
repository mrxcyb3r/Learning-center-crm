import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { APP_ASSETS } from '../constants/assets';
import { SafeImage } from './common/SafeImage';
import { Trophy, Medal, Award, Crown, Star, Flame, CheckCircle2, GraduationCap, Filter } from 'lucide-react';

export interface LeaderboardStudent {
  id: string;
  name: string;
  bandScore: number;
  courseCategory: 'ielts' | 'sat' | 'general';
  courseName: string;
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

const DEFAULT_LEADERBOARD_STUDENTS: LeaderboardStudent[] = [
  {
    id: 's1',
    name: 'Azizbek Kholmuratov',
    bandScore: 8.5,
    courseCategory: 'ielts',
    courseName: 'IELTS Mastery 8.5+ Intensive',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200',
    breakdown: { listening: 9.0, reading: 9.0, writing: 8.0, speaking: 8.0 },
    examDate: 'July 2026',
    badgeTitle: 'Top National Achiever'
  },
  {
    id: 's2',
    name: 'Madina Tursunova',
    bandScore: 8.0,
    courseCategory: 'ielts',
    courseName: 'IELTS Target 8.0 Morning',
    avatarUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&q=80&w=200',
    breakdown: { listening: 8.5, reading: 8.5, writing: 7.5, speaking: 7.5 },
    examDate: 'June 2026',
    badgeTitle: 'Academic Honor'
  },
  {
    id: 's3',
    name: 'Jasur Karimov',
    bandScore: 8.0,
    courseCategory: 'sat',
    courseName: 'SAT 1520 & IELTS Combo',
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=200',
    breakdown: { listening: 8.5, reading: 8.0, writing: 7.5, speaking: 8.0 },
    examDate: 'July 2026',
    badgeTitle: 'Fluency Master'
  },
  {
    id: 's4',
    name: 'Shakhzoda Rahimova',
    bandScore: 7.5,
    courseCategory: 'general',
    courseName: 'General English C1 Advanced',
    avatarUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=200',
    breakdown: { listening: 8.0, reading: 8.0, writing: 7.0, speaking: 7.0 },
    examDate: 'July 2026'
  },
  {
    id: 's5',
    name: 'Diyorbek Alimov',
    bandScore: 7.5,
    courseCategory: 'ielts',
    courseName: 'IELTS Express Crash Course',
    avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=200',
    breakdown: { listening: 8.0, reading: 7.5, writing: 7.5, speaking: 7.0 },
    examDate: 'June 2026'
  }
];

export const AnimatedLeaderboard: React.FC = () => {
  const [category, setCategory] = useState<'all' | 'ielts' | 'sat' | 'general'>('all');

  const filteredStudents = DEFAULT_LEADERBOARD_STUDENTS.filter(
    (student) => category === 'all' || student.courseCategory === category
  ).sort((a, b) => b.bandScore - a.bandScore);

  const topStudent = filteredStudents[0];
  const remainingStudents = filteredStudents.slice(1);

  return (
    <div className="p-6 rounded-3xl bg-slate-900/90 border border-amber-500/30 shadow-2xl backdrop-blur-md space-y-6">
      {/* HEADER WITH CATEGORY FILTER PILLS */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="relative shrink-0">
            <SafeImage
              src={APP_ASSETS.highScorerBadge}
              alt="High Scorer Badge"
              className="w-12 h-12 object-contain drop-shadow-[0_0_12px_rgba(245,158,11,0.5)]"
              fallbackIcon={<Trophy className="w-8 h-8 text-amber-400" />}
            />
          </div>
          <div>
            <h3 className="text-xl font-black text-white flex items-center gap-2">
              <span>CenterFlow High-Score Hall of Fame</span>
              <Trophy className="w-5 h-5 text-amber-400" />
            </h3>
            <p className="text-xs text-slate-400">Verified official IELTS Band & CEFR student achievements</p>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-950/80 rounded-2xl border border-slate-800 self-start md:self-auto">
          {[
            { key: 'all', label: 'All Achievers' },
            { key: 'ielts', label: 'IELTS Band 8+' },
            { key: 'sat', label: 'SAT & CEFR' },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setCategory(tab.key as any)}
              className={`relative px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                category === tab.key ? 'text-slate-950 font-black' : 'text-slate-400 hover:text-white'
              }`}
            >
              {category === tab.key && (
                <motion.div
                  layoutId="leaderboardTabPill"
                  className="absolute inset-0 bg-amber-500 rounded-xl shadow-md"
                  transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                />
              )}
              <span className="relative z-10">{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* TOP #1 HERO PODIUM CARD */}
      {topStudent && (
        <motion.div
          key={`top-${topStudent.id}`}
          layout
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          whileHover={{ scale: 1.015, y: -2 }}
          transition={{ duration: 0.25 }}
          className="relative p-5 rounded-2xl bg-gradient-to-r from-amber-500/15 via-amber-500/5 to-slate-950 border-2 border-amber-500/60 shadow-xl shadow-amber-500/10 overflow-hidden"
        >
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="relative shrink-0">
                <div className="w-14 h-14 rounded-2xl overflow-hidden border-2 border-amber-400 shadow-xl">
                  <SafeImage src={topStudent.avatarUrl} alt={topStudent.name} className="w-full h-full object-cover" />
                </div>
                <span className="absolute -top-2 -left-2 p-1 bg-amber-400 text-slate-950 rounded-full shadow-md">
                  <Crown className="w-4 h-4 fill-slate-950 stroke-slate-950" />
                </span>
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <h4 className="text-base font-black text-white">{topStudent.name}</h4>
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  {topStudent.badgeTitle && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold">
                      {topStudent.badgeTitle}
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-300 flex items-center gap-1.5 mt-0.5">
                  <GraduationCap className="w-3.5 h-3.5 text-amber-400" />
                  <span>{topStudent.courseName}</span>
                </p>
              </div>
            </div>

            <div className="px-4 py-2 rounded-2xl bg-amber-500 text-slate-950 font-black text-base flex items-center gap-2 shadow-lg shadow-amber-500/30 self-end sm:self-auto">
              <Trophy className="w-5 h-5 fill-slate-950" />
              <span>Band {topStudent.bandScore.toFixed(1)}</span>
            </div>
          </div>
        </motion.div>
      )}

      {/* REORDERABLE LIST OF OTHER ACHIEVERS */}
      <div className="space-y-2.5">
        <AnimatePresence mode="popLayout">
          {remainingStudents.map((student, index) => {
            const rankNumber = index + 2;
            const isSilver = rankNumber === 2;
            const isBronze = rankNumber === 3;

            return (
              <motion.div
                key={student.id}
                layout
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                whileHover={{ scale: 1.01, y: -1 }}
                transition={{ duration: 0.2 }}
                className={`p-3.5 rounded-2xl bg-slate-950/70 border ${
                  isSilver
                    ? 'border-slate-400/40 hover:border-slate-300'
                    : isBronze
                    ? 'border-amber-700/40 hover:border-amber-600'
                    : 'border-slate-800/80 hover:border-slate-700'
                } transition-all flex items-center justify-between gap-3`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-7 h-7 flex items-center justify-center shrink-0">
                    {isSilver ? (
                      <span className="p-1 rounded-lg bg-slate-400/20 text-slate-200 border border-slate-400/40 flex items-center gap-1 text-[10px] font-bold">
                        <Medal className="w-3.5 h-3.5 text-slate-300" /> #2
                      </span>
                    ) : isBronze ? (
                      <span className="p-1 rounded-lg bg-amber-700/20 text-amber-400 border border-amber-700/40 flex items-center gap-1 text-[10px] font-bold">
                        <Award className="w-3.5 h-3.5 text-amber-500" /> #3
                      </span>
                    ) : (
                      <span className="font-mono text-xs font-bold text-slate-500">#{rankNumber}</span>
                    )}
                  </div>

                  <div className="w-8 h-8 rounded-xl overflow-hidden border border-slate-700 shrink-0">
                    <SafeImage src={student.avatarUrl} alt={student.name} className="w-full h-full object-cover" />
                  </div>

                  <div>
                    <h4 className="text-sm font-bold text-white flex items-center gap-1.5">
                      <span>{student.name}</span>
                      <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                    </h4>
                    <p className="text-[11px] text-slate-400">{student.courseName}</p>
                  </div>
                </div>

                <div className="px-3 py-1 rounded-xl bg-slate-900 border border-slate-800 text-slate-200 font-bold text-xs flex items-center gap-1.5">
                  <Star className="w-3.5 h-3.5 text-amber-400" />
                  <span>Band {student.bandScore.toFixed(1)}</span>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
};
