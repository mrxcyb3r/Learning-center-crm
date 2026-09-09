import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles } from 'lucide-react';
import { CourseData } from '../../types/crm';
import { crmService } from '../../services/crmService';
import { CourseCard } from './CourseCard';

interface CoursesSectionProps {
  onSelectCourseForTrial: (courseTitle: string) => void;
  courses?: CourseData[];
}

export const CoursesSection: React.FC<CoursesSectionProps> = ({
  onSelectCourseForTrial,
  courses: propCourses,
}) => {
  const navigate = useNavigate();
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
          {courses.map((course, idx) => (
            <CourseCard key={course.id} course={course} index={idx} onSelectCourseForTrial={onSelectCourseForTrial} />
          ))}
        </div>

        {/* All courses CTA */}
        <div className="text-center mt-12">
          <button
            onClick={() => navigate('/courses')}
            className="px-6 py-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white font-black text-xs uppercase tracking-wider flex items-center gap-2 hover:border-amber-500/50 hover:text-amber-500 transition cursor-pointer shadow-sm"
          >
            <Sparkles className="w-4 h-4 text-amber-500" />
            Barcha kurslarni ko'rish
          </button>
        </div>
      </div>
    </section>
  );
};