import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { BookOpen, Calendar, Clock, Check, ArrowRight, Sparkles, User, Award, CheckCircle2 } from 'lucide-react';
import { CourseData } from '../../types/crm';
import { crmService } from '../../services/crmService';

interface CoursesSectionProps {
  onSelectCourseForTrial: (courseTitle: string) => void;
  courses?: CourseData[];
}

export const CoursesSection: React.FC<CoursesSectionProps> = ({
  onSelectCourseForTrial,
  courses: propCourses,
}) => {
  const [courses, setCourses] = useState<CourseData[]>([]);

  useEffect(() => {
    if (propCourses && propCourses.length > 0) {
      setCourses(propCourses);
    } else {
      const activeCourses = crmService.getCourses().filter((c) => c.isActive && c.isPublic !== false);
      setCourses(activeCourses);
    }
  }, [propCourses]);

  return (
    <section id="courses" className="py-20 md:py-28 bg-slate-100/60 dark:bg-slate-900/40 border-y border-slate-200/80 dark:border-slate-800/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="px-4 py-1.5 rounded-full bg-amber-500/10 text-amber-700 dark:text-amber-400 font-bold text-xs uppercase tracking-wider border border-amber-500/20">
            O'quv Yo'nalishlari
          </span>
          <h2 className="text-3xl sm:text-5xl font-black text-slate-900 dark:text-white mt-4 tracking-tight">
            Bizning Asosiy Kurslarimiz
          </h2>
          <p className="text-base sm:text-lg text-slate-600 dark:text-slate-400 mt-3">
            Har bir kurs zamonaviy metodika, bepul diagnostik testlar va tajribali ustozlar nazoratini o'z ichiga oladi.
          </p>
        </div>

        {/* Courses Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          {courses.map((course, idx) => {
            const isFeatured = idx === 0 || course.badge?.includes('Ommabop') || course.badge?.includes('Tavsiya');
            return (
              <motion.div
                key={course.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: idx * 0.08 }}
                className={`relative rounded-3xl p-7 flex flex-col justify-between transition-all duration-300 ${
                  isFeatured
                    ? 'bg-white dark:bg-slate-900 border-2 border-amber-500 shadow-xl shadow-amber-500/10'
                    : 'bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 shadow-md'
                }`}
              >
                {/* Badge */}
                {course.badge && (
                  <div className="absolute -top-3.5 left-6">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider shadow-sm ${
                        isFeatured
                          ? 'bg-amber-500 text-slate-950'
                          : 'bg-slate-800 text-amber-400 border border-amber-500/30'
                      }`}
                    >
                      {course.badge}
                    </span>
                  </div>
                )}

                <div>
                  {/* Category */}
                  <span className="text-xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider block mt-1">
                    {course.category}
                  </span>

                  <h3 className="text-2xl font-black text-slate-900 dark:text-white mt-1">
                    {course.title}
                  </h3>

                  <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-3 line-clamp-3">
                    {course.description}
                  </p>

                  {/* Course Meta */}
                  <div className="mt-5 space-y-2 text-xs text-slate-600 dark:text-slate-300">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-amber-500" />
                      <span>Davomiyligi: <strong>{course.duration}</strong></span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-amber-500" />
                      <span>Darslar: <strong>{course.lessonsPerWeek}</strong></span>
                    </div>
                    {course.teacherName && (
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-amber-500" />
                        <span>Bosh ustoz: <strong>{course.teacherName}</strong></span>
                      </div>
                    )}
                  </div>

                  {/* Highlights */}
                  {course.features && course.features.length > 0 && (
                    <div className="mt-6 pt-5 border-t border-slate-100 dark:border-slate-800 space-y-2">
                      {course.features.map((feat, fIdx) => (
                        <div key={fIdx} className="flex items-start gap-2 text-xs text-slate-700 dark:text-slate-300">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                          <span>{feat}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Bottom Pricing & CTA */}
                <div className="mt-8 pt-5 border-t border-slate-100 dark:border-slate-800">
                  <div className="flex items-baseline justify-between mb-4">
                    <span className="text-xs text-slate-400 font-medium">Oylik to'lov</span>
                    <span className="text-xl font-black text-slate-900 dark:text-white font-mono">
                      {course.formattedFee || `${course.monthlyFee.toLocaleString()} UZS / oy`}
                    </span>
                  </div>

                  <button
                    onClick={() => onSelectCourseForTrial(course.title)}
                    className={`w-full py-3.5 rounded-2xl font-black text-xs sm:text-sm uppercase tracking-wider flex items-center justify-center gap-2 transition cursor-pointer ${
                      isFeatured
                        ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-md shadow-amber-500/25'
                        : 'bg-slate-900 hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 text-white'
                    }`}
                  >
                    <span>Sinov Darsiga Yozilish</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
