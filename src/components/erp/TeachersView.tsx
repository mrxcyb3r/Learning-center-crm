import React, { useState, useEffect } from 'react';
import { Award, Briefcase, GraduationCap, Phone, DollarSign, Users } from 'lucide-react';
import { crmService } from '../../services/crmService';
import { TeacherRecord } from '../../types/crm';

export const TeachersView: React.FC = () => {
  const [teachers, setTeachers] = useState<TeacherRecord[]>([]);

  useEffect(() => {
    setTeachers(crmService.getTeachers());
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            Instructors & Academic Staff
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Teacher roster, active cohort load, student headcount, and monthly salary status.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {teachers.map((t) => (
          <div
            key={t.id}
            className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col justify-between"
          >
            <div>
              <div className="h-48 overflow-hidden bg-slate-100 dark:bg-slate-800 relative">
                <img
                  src={t.photo}
                  alt={t.name}
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-3 right-3 px-2.5 py-1 rounded-full bg-slate-900/80 backdrop-blur-md text-[10px] font-bold text-amber-400 border border-white/10">
                  {t.experience} Exp
                </div>
              </div>

              <div className="p-5">
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  {t.name}
                </h3>
                <p className="text-xs text-amber-600 dark:text-amber-400 font-semibold mt-0.5">
                  {t.specialization}
                </p>
                <p className="text-xs font-mono text-slate-500 mt-1">{t.phone}</p>

                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 grid grid-cols-2 gap-2 text-center text-xs">
                  <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800">
                    <span className="text-[10px] text-slate-400 block">Groups</span>
                    <span className="font-bold text-slate-900 dark:text-white">
                      {t.activeGroups} Cohorts
                    </span>
                  </div>
                  <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800">
                    <span className="text-[10px] text-slate-400 block">Students</span>
                    <span className="font-bold text-slate-900 dark:text-white">
                      {t.studentsCount} Active
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-5 pt-0">
              <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-between text-xs">
                <span className="text-slate-500 dark:text-slate-400">Monthly Salary:</span>
                <span className="font-black text-emerald-700 dark:text-emerald-400 font-mono">
                  {(t.monthlySalary || t.salary || 10000000).toLocaleString()} UZS
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
