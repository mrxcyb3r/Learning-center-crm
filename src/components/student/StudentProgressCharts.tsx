import React from 'react';
import {
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';
import { Award, Target, CalendarCheck } from 'lucide-react';
import { TypewriterText } from '../common/TypewriterText';

const ieltsRadarData = [
  { subject: 'Listening', score: 8.5, target: 8.5 },
  { subject: 'Reading', score: 8.0, target: 8.5 },
  { subject: 'Writing', score: 7.0, target: 7.5 },
  { subject: 'Speaking', score: 7.5, target: 8.0 },
  { subject: 'Grammar', score: 8.0, target: 8.5 },
  { subject: 'Vocabulary', score: 8.5, target: 8.5 },
];

const weeklyScoresData = [
  { week: 'W1', score: 6.5, attendance: 100 },
  { week: 'W2', score: 7.0, attendance: 100 },
  { week: 'W3', score: 7.0, attendance: 92 },
  { week: 'W4', score: 7.5, attendance: 100 },
  { week: 'W5', score: 7.5, attendance: 95 },
  { week: 'W6', score: 8.0, attendance: 100 },
];

export const StudentProgressCharts: React.FC = () => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
      {/* 1. IELTS Skills Breakdown Radar */}
      <div className="bg-white/80 dark:bg-slate-900/50 backdrop-blur-md border border-slate-200/80 dark:border-slate-800/60 rounded-3xl p-5 shadow-sm dark:shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-xl bg-amber-500/10 text-amber-500">
                <Award className="w-4 h-4" />
              </span>
              <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">
                <TypewriterText
                  texts={["IELTS Ko'nikmalar Radiusi", "IELTS Band Breakdown (Target 8.0)"]}
                  speed={40}
                  loop={true}
                  cursorColorClass="text-amber-500"
                />
              </h3>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Listening, Reading, Writing va Speaking bo'yicha tahlil
            </p>
          </div>
          <span className="px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-600 dark:text-amber-400 font-mono text-xs font-bold border border-amber-500/30">
            Overall: 7.8
          </span>
        </div>

        <div className="w-full h-64">
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart cx="50%" cy="50%" outerRadius="75%" data={ieltsRadarData}>
              <PolarGrid stroke="#334155" opacity={0.4} />
              <PolarAngleAxis dataKey="subject" stroke="#94A3B8" fontSize={11} />
              <PolarRadiusAxis angle={30} domain={[0, 9]} stroke="#64748B" fontSize={10} />
              <Radar
                name="Current Score"
                dataKey="score"
                stroke="#F59E0B"
                fill="#F59E0B"
                fillOpacity={0.45}
              />
              <Radar
                name="Target 8.0"
                dataKey="target"
                stroke="#10B981"
                fill="#10B981"
                fillOpacity={0.15}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#0F172A',
                  borderColor: '#334155',
                  borderRadius: '12px',
                  color: '#F8FAFC',
                  fontSize: '12px',
                }}
              />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 2. Weekly Mock Exam & Attendance Trend Line */}
      <div className="bg-white/80 dark:bg-slate-900/50 backdrop-blur-md border border-slate-200/80 dark:border-slate-800/60 rounded-3xl p-5 shadow-sm dark:shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-xl bg-blue-500/10 text-blue-500">
                <Target className="w-4 h-4" />
              </span>
              <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">
                <TypewriterText
                  texts={["Haftalik Mock Natijalari", "Weekly Test & Attendance Trend"]}
                  speed={40}
                  loop={true}
                  cursorColorClass="text-blue-500"
                />
              </h3>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              So'nggi 6 haftalik sinov va dars davomati dinamikasi
            </p>
          </div>
          <span className="px-2.5 py-1 rounded-full bg-blue-500/20 text-blue-600 dark:text-blue-400 font-mono text-xs font-bold border border-blue-500/30 flex items-center gap-1">
            <CalendarCheck className="w-3 h-3" />
            98% Attendance
          </span>
        </div>

        <div className="w-full h-64 pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={weeklyScoresData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.3} />
              <XAxis dataKey="week" stroke="#94A3B8" fontSize={11} tickLine={false} />
              <YAxis domain={[5, 9]} stroke="#94A3B8" fontSize={11} tickLine={false} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#0F172A',
                  borderColor: '#334155',
                  borderRadius: '12px',
                  color: '#F8FAFC',
                  fontSize: '12px',
                }}
              />
              <Line
                type="monotone"
                dataKey="score"
                name="Mock Exam Score"
                stroke="#3B82F6"
                strokeWidth={3}
                dot={{ r: 5, fill: '#3B82F6' }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};
