import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, Sparkles, LayoutGrid, Search } from 'lucide-react';
import { crmService } from '../services/crmService';
import { CourseData } from '../types/crm';
import { PublicLayout, useTrialModal } from '../components/public/PublicLayout';
import { CourseCard } from '../components/public/CourseCard';
import { SEOHead } from '../components/SEOHead';
import { getSiteUrl } from '../utils/content';

// ---------------------------------------------------------------------------
// /courses — catalog of all public courses with category filtering.
// Categories are derived from live CMS data (never hardcoded).
// ---------------------------------------------------------------------------

export const PublicCoursesPage: React.FC = () => {
  const { openTrial } = useTrialModal();
  const [courses, setCourses] = useState<CourseData[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('Barchasi');

  useEffect(() => {
    const activeCourses = crmService
      .getCourses()
      .filter((c) => c.isActive && c.isPublic !== false)
      .sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0));
    setCourses(activeCourses);
  }, []);

  const categories = ['Barchasi', ...Array.from(new Set(courses.map((c) => c.category)).values()).filter(Boolean)];

  const filtered =
    selectedCategory === 'Barchasi'
      ? courses
      : courses.filter((c) => c.category === selectedCategory);

  return (
    <PublicLayout activePage="courses">
      <SEOHead
        title="Kurslar — Renessans O'quv Markazi"
        description="Renessans O'quv markazining barcha kurslari: DTM va Milliy sertifikat, matematika–fizika, CEFR ingliz tili, English Kids, mental arifmetika va ona tili. Bepul sinov darsi!"
        canonicalUrl={`${getSiteUrl()}/courses`}
      />

      {/* Header with breadcrumbs */}
      <div className="pt-28 pb-12 md:pt-36 md:pb-16 bg-gradient-to-br from-slate-50 via-transparent to-amber-500/5 dark:from-slate-950 dark:to-slate-900/40 border-b border-slate-200/70 dark:border-slate-800/70">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Breadcrumbs */}
          <nav className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 mb-6" aria-label="Kurslar navigatsiyasi">
            <Link to="/" className="hover:text-amber-500 transition">Bosh sahifa</Link>
            <ChevronRight className="w-3.5 h-3.5" />
            <span className="text-slate-600 dark:text-slate-300">Kurslar</span>
          </nav>

          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center shrink-0">
              <LayoutGrid className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-3xl sm:text-5xl font-black text-slate-900 dark:text-white tracking-tight">
                Barcha Kurslarimiz
              </h1>
              <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 mt-2 max-w-2xl">
                Har bir kurs uchun bepul diagnostik test, tajribali ustoz va natijaga yo'naltirilgan metodika. Sinov darsi mutlaqo bepul.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Catalog */}
      <section className="py-12 md:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Category filters */}
          <div className="flex flex-wrap items-center gap-2 mb-10">
            <Search className="w-4 h-4 text-slate-400 mr-1 hidden sm:block" />
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-2 rounded-full text-xs font-bold transition cursor-pointer ${
                  selectedCategory === cat
                    ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                    : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Courses grid */}
          {filtered.length === 0 ? (
            <div className="py-20 text-center text-sm text-slate-400">
              <Sparkles className="w-10 h-10 mx-auto mb-3 text-slate-300 dark:text-slate-600" />
              Hozircha bu yo'nalishda kurs yo'q. Tez orada yangi kurslar qo'shiladi.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
              {filtered.map((course, idx) => (
                <CourseCard key={course.id} course={course} index={idx} onSelectCourseForTrial={openTrial} />
              ))}
            </div>
          )}
        </div>
      </section>
    </PublicLayout>
  );
};