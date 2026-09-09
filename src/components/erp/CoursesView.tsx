import React, { useState, useEffect } from 'react';
import { BookOpen, Plus, Edit2, Clock, Calendar, Check, DollarSign } from 'lucide-react';
import { crmService } from '../../services/crmService';
import { CourseData } from '../../types/crm';

export const CoursesView: React.FC = () => {
  const [courses, setCourses] = useState<CourseData[]>([]);
  const [editingCourse, setEditingCourse] = useState<CourseData | null>(null);

  useEffect(() => {
    setCourses(crmService.getCourses());
  }, []);

  const handleSaveCourse = () => {
    if (!editingCourse) return;
    crmService.updateCourse(editingCourse.id, editingCourse);
    setCourses(crmService.getCourses());
    setEditingCourse(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            Academic Courses & Pricing
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Configure course curriculum, tuition fees, lesson schedules, and public website display.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {courses.map((c) => (
          <div
            key={c.id}
            className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider">
                  {c.category}
                </span>
                {c.badge && (
                  <span className="px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 text-[10px] font-bold">
                    {c.badge}
                  </span>
                )}
              </div>

              <h3 className="text-lg font-black text-slate-900 dark:text-white mt-1">
                {c.title}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 min-h-[48px]">
                {c.description}
              </p>

              <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 space-y-2 text-xs text-slate-600 dark:text-slate-300">
                <div className="flex items-center gap-2">
                  <Clock className="w-3.5 h-3.5 text-amber-500" />
                  <span>Duration: {c.duration}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="w-3.5 h-3.5 text-amber-500" />
                  <span>Lessons: {c.lessonsPerWeek}</span>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div>
                <span className="text-[10px] text-slate-400 block font-medium">Monthly Fee</span>
                <span className="text-base font-black text-slate-900 dark:text-white">
                  {c.formattedFee}
                </span>
              </div>
              <button
                onClick={() => setEditingCourse({ ...c })}
                className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition cursor-pointer"
                title="Edit Course Details"
              >
                <Edit2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Edit Course Modal */}
      {editingCourse && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm">
          <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-2xl">
            <h3 className="text-xl font-black text-slate-900 dark:text-white mb-4">
              Edit Course: {editingCourse.title}
            </h3>

            <div className="space-y-4 text-xs sm:text-sm">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                  Monthly Tuition Fee (UZS)
                </label>
                <input
                  type="number"
                  value={editingCourse.monthlyFee}
                  onChange={(e) => {
                    const fee = Number(e.target.value);
                    setEditingCourse({
                      ...editingCourse,
                      monthlyFee: fee,
                      formattedFee: `${fee.toLocaleString()} UZS`,
                    });
                  }}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                  Duration
                </label>
                <input
                  type="text"
                  value={editingCourse.duration}
                  onChange={(e) =>
                    setEditingCourse({ ...editingCourse, duration: e.target.value })
                  }
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                  Lessons Per Week
                </label>
                <input
                  type="text"
                  value={editingCourse.lessonsPerWeek}
                  onChange={(e) =>
                    setEditingCourse({ ...editingCourse, lessonsPerWeek: e.target.value })
                  }
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                  Description
                </label>
                <textarea
                  rows={2}
                  value={editingCourse.description}
                  onChange={(e) =>
                    setEditingCourse({ ...editingCourse, description: e.target.value })
                  }
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                />
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setEditingCourse(null)}
                className="px-4 py-2 text-xs font-bold text-slate-500 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveCourse}
                className="px-5 py-2 rounded-xl bg-amber-500 text-slate-950 font-bold text-xs shadow-md shadow-amber-500/20 cursor-pointer"
              >
                Save Course
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
