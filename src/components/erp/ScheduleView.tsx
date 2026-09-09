import React, { useState, useEffect } from 'react';
import { Calendar, Clock, MapPin, Users, Plus, CheckCircle2 } from 'lucide-react';
import { crmService } from '../../services/crmService';
import { GroupScheduleItem } from '../../types/crm';

export const ScheduleView: React.FC = () => {
  const [schedule, setSchedule] = useState<GroupScheduleItem[]>([]);
  const [activeDayFilter, setActiveDayFilter] = useState('All');

  useEffect(() => {
    setSchedule(crmService.getSchedule());
  }, []);

  const filtered = activeDayFilter === 'All'
    ? schedule
    : schedule.filter((s) => (s.days || 'Mon/Wed/Fri').includes(activeDayFilter));

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            Class Schedule & Trial Slots
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Weekly room timetable, active cohort rosters, and prospective trial lesson slots.
          </p>
        </div>

        <div className="inline-flex p-1 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
          {['All', 'Mon/Wed/Fri', 'Tue/Thu/Sat', 'Sunday'].map((day) => (
            <button
              key={day}
              onClick={() => setActiveDayFilter(day)}
              className={`px-3.5 py-1.5 rounded-xl font-bold text-xs transition cursor-pointer ${
                activeDayFilter === day
                  ? 'bg-amber-500 text-slate-950 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {day}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtered.map((item) => (
          <div
            key={item.id}
            className={`p-6 rounded-3xl bg-white dark:bg-slate-900 border shadow-sm flex flex-col justify-between ${
              item.type === 'Trial Lesson'
                ? 'border-amber-500/50 bg-amber-50/10'
                : 'border-slate-200 dark:border-slate-800'
            }`}
          >
            <div>
              <div className="flex items-center justify-between">
                <span
                  className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                    item.type === 'Trial Lesson'
                      ? 'bg-amber-500 text-slate-950'
                      : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                  }`}
                >
                  {item.type}
                </span>
                <span className="text-xs font-mono font-bold text-slate-700 dark:text-slate-300">
                  {item.time}
                </span>
              </div>

              <h3 className="text-lg font-black text-slate-900 dark:text-white mt-3">
                {item.groupName}
              </h3>
              <p className="text-xs font-semibold text-amber-600 dark:text-amber-400 mt-0.5">
                {item.course}
              </p>

              <div className="mt-5 space-y-2 text-xs text-slate-600 dark:text-slate-300">
                <div className="flex items-center gap-2">
                  <Calendar className="w-3.5 h-3.5 text-amber-500" />
                  <span>Days: {item.days || 'Mon/Wed/Fri'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="w-3.5 h-3.5 text-amber-500" />
                  <span>Teacher: {item.teacher}</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="w-3.5 h-3.5 text-amber-500" />
                  <span>Room: {item.room}</span>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
              <span className="text-slate-400 font-medium">Capacity</span>
              <span className="font-bold text-slate-900 dark:text-white">
                {item.studentsCount} / {item.maxCapacity || 16} Students
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
