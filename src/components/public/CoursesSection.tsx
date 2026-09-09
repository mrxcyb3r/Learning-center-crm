import React from 'react';
import { motion } from 'motion/react';
import { BookOpen, Calendar, Clock, Check, ArrowRight, Sparkles, User, Award, CheckCircle2 } from 'lucide-react';
import { CourseData } from '../../types/crm';
import { INITIAL_COURSES } from '../../services/crmService';

interface CoursesSectionProps {
  onSelectCourseForTrial: (courseTitle: string) => void;
  courses?: CourseData[];
}

export const CoursesSection: React.FC<CoursesSectionProps> = ({
  onSelectCourseForTrial,
  courses = INITIAL_COURSES,
}) => {
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
            const isFeatured = course.id === 'c-tarix' || course.id === 'c-matematika';
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
                  {/* Category and Teacher */}
                  <div className="mt-2 flex items-center justify-between text-xs">
                    <span className="font-semibold text-amber-600 dark:text-amber-400 uppercase tracking-wider">
                      {course.category}
                    </span>
                    {course.teacherName && (
                      <span className="inline-flex items-center gap-1 font-medium text-slate-500 dark:text-slate-400">
                        <User className="w-3.5 h-3.5 text-amber-500" />
                        {course.teacherName}
                      </span>
                    )}
                  </div>

                  {/* Title */}
                  <h3 className="text-xl font-black text-slate-900 dark:text-white mt-2 tracking-tight">
                    {course.title}
                  </h3>

                  {/* Description */}
                  <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-2.5 leading-relaxed">
                    {course.description}
                  </p>

                  {/* Meta Specs */}
                  <div className="my-5 py-3 border-y border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-600 dark:text-slate-400">
                    <span className="flex items-center gap-1.5 font-medium">
                      <Calendar className="w-4 h-4 text-amber-500" />
                      {course.duration}
                    </span>
                    <span className="flex items-center gap-1.5 font-medium">
                      <Clock className="w-4 h-4 text-amber-500" />
                      {course.lessonsPerWeek}
                    </span>
                  </div>

                  {/* Bullet features */}
                  <ul className="space-y-2.5 my-5">
                    {course.features.map((feat, fIdx) => (
                      <li key={fIdx} className="flex items-start gap-2.5 text-xs text-slate-700 dark:text-slate-300">
                        <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                        <span>{feat}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Price and CTA */}
                <div className="pt-5 border-t border-slate-100 dark:border-slate-800 mt-2">
                  <div className="flex items-baseline justify-between mb-4">
                    <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Oylik to'lov:</span>
                    <span className="text-xl font-black text-slate-900 dark:text-white">
                      {course.formattedFee}
                    </span>
                  </div>

                  <button
                    onClick={() => onSelectCourseForTrial(course.title)}
                    className={`w-full py-3.5 rounded-xl font-extrabold text-xs tracking-wide transition flex items-center justify-center gap-2 cursor-pointer shadow-md ${
                      isFeatured
                        ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-amber-500/20'
                        : 'bg-slate-900 hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 text-white'
                    }`}
                  >
                    <span>Sinov darsiga yozilish</span>
                    <ArrowRight className="w-3.5 h-3.5" />
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
