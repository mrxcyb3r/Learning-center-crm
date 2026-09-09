import React from 'react';
import { motion } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { Calendar, Clock, User, ArrowRight } from 'lucide-react';
import { CourseData } from '../../types/crm';
import { getCourseSlug, getCourseUrl } from '../../utils/content';
import { getSubjectVisual } from '../../config/subjectVisuals';
import { SmartImage } from '../common/SmartImage';
import { ShareButton } from './ShareDialog';

interface CourseCardProps {
  course: CourseData;
  index?: number;
  onSelectCourseForTrial: (courseTitle: string) => void;
}

export const CourseCard: React.FC<CourseCardProps> = ({ course, index = 0, onSelectCourseForTrial }) => {
  const navigate = useNavigate();
  const isFeatured = course.featured || course.badge?.includes('Ommabop') || course.badge?.includes('Tavsiya');
  const visual = getSubjectVisual(course);
  const slug = getCourseSlug(course);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4, delay: index * 0.06 }}
      className={`group rounded-3xl bg-white dark:bg-slate-900 overflow-hidden flex flex-col transition-all duration-300 ${
        isFeatured
          ? 'border-2 border-amber-500 shadow-xl shadow-amber-500/10'
          : 'border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 shadow-md hover:shadow-xl'
      }`}
    >
      {/* Image — roughly 35–50% of the card */}
      <button
        onClick={() => navigate(`/courses/${slug}`)}
        className="relative text-left cursor-pointer block"
        aria-label={`${course.title} — kursni ko'rish`}
      >
        <SmartImage
          src={course.imageUrl}
          alt={visual.alt}
          visual={visual}
          rounded={false}
          className="h-48 sm:h-52"
        />
        {isFeatured && (
          <div className="absolute inset-0 bg-gradient-to-t from-transparent to-amber-500/10 pointer-events-none" />
        )}
        <span className="absolute top-3 right-3 px-2.5 py-1 rounded-full bg-slate-950/70 backdrop-blur-md text-white text-[10px] font-black uppercase tracking-wider flex items-center gap-1">
          <Calendar className="w-3 h-3 text-amber-400" />
          {course.duration}
        </span>
      </button>

      {/* Badge */}
      {course.badge && (
        <div className="absolute -mt-4 ml-5 z-10">
          <span
            className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider shadow-sm ${
              isFeatured ? 'bg-amber-500 text-slate-950' : 'bg-slate-800 text-amber-400 border border-amber-500/30'
            }`}
          >
            {course.badge}
          </span>
        </div>
      )}

      {/* Content */}
      <div className="p-6 flex flex-col flex-1">
        <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider">
          {course.category}
        </span>
        <h3 className="text-xl font-black text-slate-900 dark:text-white mt-1">
          {course.title}
        </h3>
        <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-2 line-clamp-2">
          {course.description}
        </p>

        {/* Meta row */}
        <div className="mt-4 grid grid-cols-1 gap-1.5 text-[11px] text-slate-600 dark:text-slate-300">
          <div className="flex items-center gap-2">
            <Clock className="w-3.5 h-3.5 text-amber-500 shrink-0" />
            <span>Darslar: <strong>{course.lessonsPerWeek}</strong></span>
          </div>
          <div className="flex items-center gap-2">
            <User className="w-3.5 h-3.5 text-amber-500 shrink-0" />
            <span>Bosh ustoz: <strong>{course.teacherName}</strong></span>
          </div>
        </div>

        <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <span className="text-[10px] text-slate-400 font-medium">Oylik to'lov</span>
          <span className="text-lg font-black text-slate-900 dark:text-white font-mono">
            {course.monthlyFee ? `${course.monthlyFee.toLocaleString()} UZS` : course.formattedFee}
          </span>
        </div>

        {/* Actions */}
        <div className="mt-4 flex items-center gap-2">
          <button
            onClick={() => navigate(`/courses/${slug}`)}
            className="flex-1 py-2.5 rounded-xl font-black text-[11px] uppercase tracking-wider flex items-center justify-center gap-1.5 transition cursor-pointer bg-slate-900 hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 text-white"
          >
            <span>Kursni Ko'rish</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => onSelectCourseForTrial(course.title)}
            className="flex-1 py-2.5 rounded-xl font-black text-[11px] uppercase tracking-wider transition cursor-pointer bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-md shadow-amber-500/20"
          >
            <span>Sinov Darsi</span>
          </button>
          <ShareButton title={course.title} url={getCourseUrl(slug)} />
        </div>
      </div>
    </motion.div>
  );
};