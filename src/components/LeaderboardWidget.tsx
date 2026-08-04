import React from 'react';
import { APP_ASSETS } from '../constants/assets';
import { Award, Trophy, Star, CheckCircle2, ChevronRight, GraduationCap } from 'lucide-react';

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
}

const DEFAULT_TOP_STUDENTS: LeaderboardStudent[] = [
  {
    id: '1',
    name: 'Azizbek Kholmuratov',
    bandScore: 8.5,
    course: 'IELTS Mastery 8.5+ Intensive',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200',
    breakdown: { listening: 9.0, reading: 9.0, writing: 8.0, speaking: 8.0 },
    examDate: 'July 2026'
  },
  {
    id: '2',
    name: 'Madina Tursunova',
    bandScore: 8.0,
    course: 'IELTS Target 8.0 Morning',
    avatarUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&q=80&w=200',
    breakdown: { listening: 8.5, reading: 8.5, writing: 7.5, speaking: 7.5 },
    examDate: 'June 2026'
  },
  {
    id: '3',
    name: 'Jasur Karimov',
    bandScore: 8.0,
    course: 'SAT & IELTS Combo',
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=200',
    breakdown: { listening: 8.5, reading: 8.0, writing: 7.5, speaking: 8.0 },
    examDate: 'July 2026'
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
  return (
    <div className="p-6 rounded-3xl bg-slate-900/90 dark:bg-slate-900/90 border border-amber-500/30 shadow-xl backdrop-blur-md">
      {/* Header section with High Scorer Badge Asset */}
      <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="relative">
            <img
              src={APP_ASSETS.highScorerBadge}
              alt="High Scorer Badge"
              referrerPolicy="no-referrer"
              className="w-10 h-10 object-contain drop-shadow-[0_0_8px_rgba(245,158,11,0.4)]"
            />
          </div>
          <div>
            <h3 className="text-base font-black text-white flex items-center gap-2">
              <span>{title}</span>
              <Trophy className="w-4 h-4 text-amber-400" />
            </h3>
            <p className="text-xs text-slate-400">Official CenterFlow Verified Official IELTS Results</p>
          </div>
        </div>

        <span className="px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-bold flex items-center gap-1">
          <Star className="w-3.5 h-3.5 fill-amber-400" />
          <span>Top Achievers</span>
        </span>
      </div>

      {/* Student Cards Grid */}
      <div className="space-y-3">
        {students.map((student, idx) => (
          <div
            key={student.id}
            className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 hover:border-amber-500/40 transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 group"
          >
            {/* Student Info */}
            <div className="flex items-center gap-3.5">
              <div className="font-mono text-sm font-black text-slate-500 group-hover:text-amber-400 w-5">
                #{idx + 1}
              </div>

              <div className="relative">
                <img
                  src={student.avatarUrl}
                  alt={student.name}
                  referrerPolicy="no-referrer"
                  className="w-11 h-11 rounded-2xl object-cover border-2 border-amber-500/50 shadow-md"
                />
                <span className="absolute -bottom-1 -right-1 w-4 h-4 bg-amber-500 rounded-full flex items-center justify-center text-[10px] text-slate-950 font-black">
                  ✓
                </span>
              </div>

              <div>
                <h4 className="text-sm font-bold text-white flex items-center gap-1.5 group-hover:text-amber-300 transition-colors">
                  <span>{student.name}</span>
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                </h4>
                <p className="text-xs text-slate-400 flex items-center gap-1">
                  <GraduationCap className="w-3.5 h-3.5 text-slate-500" />
                  <span>{student.course}</span>
                  <span className="text-slate-600">•</span>
                  <span className="text-slate-500">{student.examDate}</span>
                </p>
              </div>
            </div>

            {/* Score & Subscores */}
            <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end border-t sm:border-t-0 border-slate-800/80 pt-2 sm:pt-0">
              <div className="hidden md:flex items-center gap-2 text-[11px] font-mono text-slate-400 bg-slate-900/90 px-3 py-1.5 rounded-xl border border-slate-800">
                <span>L: <strong className="text-white">{student.breakdown.listening}</strong></span>
                <span>R: <strong className="text-white">{student.breakdown.reading}</strong></span>
                <span>W: <strong className="text-white">{student.breakdown.writing}</strong></span>
                <span>S: <strong className="text-white">{student.breakdown.speaking}</strong></span>
              </div>

              <div className="px-3.5 py-1.5 rounded-2xl bg-amber-500/20 border border-amber-500/40 text-amber-300 font-black text-sm flex items-center gap-1.5 shadow-sm">
                <Award className="w-4 h-4 text-amber-400" />
                <span>Band {student.bandScore.toFixed(1)}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
