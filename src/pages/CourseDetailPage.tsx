import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ChevronRight, ChevronLeft, Calendar, Clock, User, CheckCircle2, Sparkles, ArrowRight, GraduationCap, Phone, Send, Award } from 'lucide-react';
import { crmService } from '../services/crmService';
import { coursesService, teachersService, resultsService } from '../services/repository';
import { CourseData, StudentResult, TeacherRecord } from '../types/crm';
import { getCourseSlug, getCourseUrl, getPublicResults, getResultsForCourse, getHeadTeacher, slugify } from '../utils/content';
import { getSubjectVisual } from '../config/subjectVisuals';
import { PublicLayout, useTrialModal } from '../components/public/PublicLayout';
import { SmartImage } from '../components/common/SmartImage';
import { TeacherAvatar } from '../components/common/TeacherAvatar';
import { ShareButton } from '../components/public/ShareDialog';
import { ResultsCarousel } from '../components/public/ResultsCarousel';
import { QuestionForm } from '../components/public/QuestionForm';
import { SEOHead } from '../components/SEOHead';

// ---------------------------------------------------------------------------
// /courses/:slug — full course detail page generated from CMS data.
// ---------------------------------------------------------------------------

interface CourseDetailPageProps {
  isPreview?: boolean;
}

export const CourseDetailPage: React.FC<CourseDetailPageProps> = ({ isPreview = false }) => {
  const { slug = '' } = useParams();
  const navigate = useNavigate();
  const { openTrial } = useTrialModal();

const [course, setCourse] = useState<CourseData | null>(null);
  const [courses, setCourses] = useState<CourseData[]>([]);
  const [teachers, setTeachers] = useState<TeacherRecord[]>([]);
  const [results, setResults] = useState<StudentResult[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Production path: Firestore collections. Legacy crmService is only the
    // offline fallback.
    let cancelled = false;
    (async () => {
      try {
        const [courseDocs, teacherDocs, resultDocs] = await Promise.all([
          coursesService.getPublicCourses(),
          teachersService.getAllTeachers(),
          resultsService.getPublishedResults(),
        ]);
        if (cancelled) return;
        const allCourses = ((courseDocs.length > 0 ? courseDocs : crmService.getCourses()) as CourseData[])
          .filter((c) => c.isActive && c.isPublic !== false);
        const allTeachers = (
          teacherDocs.length > 0 ? teacherDocs : crmService.getTeachers()
        ) as TeacherRecord[];
        setCourses(allCourses);
        setTeachers(allTeachers);
        const found =
          allCourses.find((c) => getCourseSlug(c) === slug) ||
          crmService.getCourseBySlug(slug) ||
          null;
        setCourse(found);
        setResults(
          resultDocs.length > 0
            ? getPublicResults(resultDocs as unknown as StudentResult[])
            : getPublicResults(crmService.getCmsData().results || [])
        );
      } catch {
        if (cancelled) return;
        const allCourses = crmService.getCourses().filter((c) => c.isActive && c.isPublic !== false);
        setCourses(allCourses);
        setTeachers(crmService.getTeachers());
        setCourse(crmService.getCourseBySlug(slug) || null);
        setResults(getPublicResults(crmService.getCmsData().results || []));
      }
      setIsLoading(false);
    })();
    return () => { cancelled = true; };
  }, [slug, isPreview]);

  useEffect(() => {
    if (course) window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
  }, [slug, course]);

  if (isLoading) {
    return (
      <PublicLayout>
        <div className="pt-40 pb-32 text-center px-4">
          <Sparkles className="w-12 h-12 mx-auto mb-4 text-slate-300 dark:text-slate-600" />
          <h1 className="text-2xl font-black text-slate-900 dark:text-white">Yuklanmoqda...</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">Kurs ma'lumotlari yuklanmoqda. Iltimos, biroz kuting.</p>
        </div>
      </PublicLayout>
    );
  }

  if (!course) {
    return (
      <PublicLayout>
        <div className="pt-40 pb-32 text-center px-4">
          <Sparkles className="w-12 h-12 mx-auto mb-4 text-slate-300 dark:text-slate-600" />
          <h1 className="text-2xl font-black text-slate-900 dark:text-white">Kurs topilmadi</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">Bunday kurs mavjud emas yoki hozircha nashr qilinmagan.</p>
          <button
            onClick={() => navigate('/courses')}
            className="mt-6 px-6 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs uppercase tracking-wider transition cursor-pointer"
          >
            Barcha kurslar
          </button>
        </div>
      </PublicLayout>
    );
  }

  const visual = getSubjectVisual(course);
  const headTeacher = getHeadTeacher(teachers, course);
  const slugKey = getCourseSlug(course);
  const canonicalUrl = getCourseUrl(slugKey);
  const courseResults = getResultsForCourse(results, course);
  const teacherSlug = headTeacher ? slugify(headTeacher.name) : '';

  // Prev / next + related
  const sorted = [...courses].sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0));
  const idx = sorted.findIndex((c) => c.id === course.id);
  const prevCourse = idx > 0 ? sorted[idx - 1] : null;
  const nextCourse = idx < sorted.length - 1 ? sorted[idx + 1] : null;
  const related =
    courses
      .filter((c) => c.id !== course.id && (c.category === course.category || c.featured))
      .slice(0, 3)
      .concat(nextCourse && nextCourse.id !== course.id ? [nextCourse] : []);

  const meta: { icon: React.ReactNode; label: string; value: string }[] = [
    { icon: <Calendar className="w-4 h-4 text-amber-500" />, label: 'Davomiylik', value: course.duration },
    { icon: <Clock className="w-4 h-4 text-amber-500" />, label: 'Darslar', value: course.lessonsPerWeek },
    { icon: <GraduationCap className="w-4 h-4 text-amber-500" />, label: 'Yo\'nalish', value: course.category },
  ];

  return (
    <PublicLayout activePage="courses">
      <SEOHead
        title={`${course.title} — Renessans O'quv Markazi`}
        description={course.description}
        ogImage={course.socialImage || course.imageUrl || visual.imageLarge}
        canonicalUrl={canonicalUrl}
      />

      {/* ===== HERO ===== */}
      <div className="pt-24 md:pt-28 border-b border-slate-200/70 dark:border-slate-800/70 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12 md:pb-16">
          {/* Breadcrumbs */}
          <nav className="flex flex-wrap items-center gap-1.5 text-xs font-semibold text-slate-400 mb-6" aria-label="Kurs navigatsiyasi">
            <Link to="/" className="hover:text-amber-500 transition">Bosh sahifa</Link>
            <ChevronRight className="w-3.5 h-3.5" />
            <Link to="/courses" className="hover:text-amber-500 transition">Kurslar</Link>
            <ChevronRight className="w-3.5 h-3.5" />
            <span className="text-slate-600 dark:text-slate-300">{course.title}</span>
          </nav>

          <div className="grid lg:grid-cols-2 gap-10 items-center">
            {/* Copy */}
            <div>
              {course.badge && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-500/10 text-amber-700 dark:text-amber-400 text-[11px] font-black uppercase tracking-wider border border-amber-500/20">
                  <Sparkles className="w-3 h-3" />
                  {course.badge}
                </span>
              )}
              <h1 className="text-3xl sm:text-5xl font-black text-slate-900 dark:text-white mt-4 tracking-tight">
                {course.title}
              </h1>
              <p className="text-base sm:text-lg text-slate-600 dark:text-slate-400 mt-4 leading-relaxed">
                {course.overview || course.description}
              </p>

              {/* Meta strip */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-8">
                {meta.map((m) => (
                  <div key={m.label} className="px-4 py-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                    <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      {m.icon}
                      {m.label}
                    </div>
                    <div className="text-sm font-black text-slate-900 dark:text-white mt-1">{m.value}</div>
                  </div>
                ))}
              </div>

              {/* Price + teacher */}
              <div className="flex flex-wrap items-center gap-6 mt-6">
                <div>
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Oylik to'lov</div>
                  <div className="text-2xl font-black text-slate-900 dark:text-white font-mono">
                    {course.monthlyFee ? `${course.monthlyFee.toLocaleString()} UZS` : course.formattedFee}
                  </div>
                </div>
                {headTeacher && (
                  <Link to={`/teachers/${teacherSlug}`} className="flex items-center gap-2 group">
                    <TeacherAvatar photo={headTeacher.photo} name={headTeacher.name} gender={headTeacher.gender} className="w-10 h-10 rounded-full" />
                    <div>
                      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Bosh ustoz</div>
                      <div className="text-xs font-black text-slate-900 dark:text-white group-hover:text-amber-500 transition">
                        {headTeacher.name}
                      </div>
                    </div>
                  </Link>
                )}
              </div>

              {/* CTAs */}
              <div className="flex flex-wrap items-center gap-3 mt-8">
                <button
                  onClick={() => openTrial(course.title)}
                  className="px-6 py-3.5 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs uppercase tracking-wider shadow-lg shadow-amber-500/25 transition cursor-pointer flex items-center gap-2"
                >
                  <span>Sinov Darsiga Yozilish</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
                <ShareButton title={course.title} url={canonicalUrl} className="px-4 py-3" />
              </div>
            </div>

            {/* Hero image */}
            <div className="relative">
              <div className="rounded-3xl overflow-hidden shadow-2xl shadow-slate-900/10">
                <SmartImage
                  src={course.imageUrl}
                  alt={visual.alt}
                  visual={visual}
                  ratio="16 / 9"
                  rounded
                  className="h-auto"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ===== OVERVIEW ===== */}
      <section className="py-16 md:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-[1fr_380px] gap-12">
            <div>
              <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                Kurs haqida
              </h2>
              <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 mt-4 leading-relaxed">
                {course.description}
              </p>

              {/* Course benefits */}
              <div className="mt-10">
                <h3 className="text-lg font-black text-slate-900 dark:text-white mb-6">Kurs imtiyozlari</h3>
                <div className="grid sm:grid-cols-2 gap-3">
                  {course.features.map((feat, fIdx) => (
                    <div key={fIdx} className="flex items-start gap-3 p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                      <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                      <span className="text-sm text-slate-700 dark:text-slate-300">{feat}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Sidebar: teacher contact */}
            <aside>
              <div className="sticky top-28 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-lg overflow-hidden">
                {headTeacher ? (
                  <>
                    <div className="h-28 bg-gradient-to-br from-amber-500/60 via-amber-500/20 to-transparent" />
                    <div className="-mt-12 px-6 pb-6">
                      <TeacherAvatar
                        photo={headTeacher.photo}
                        name={headTeacher.name}
                        gender={headTeacher.gender}
                        className="w-20 h-20 rounded-2xl ring-4 ring-white dark:ring-slate-900 shadow-xl"
                      />
                      <Link to={`/teachers/${teacherSlug}`}>
                        <h3 className="text-xl font-black text-slate-900 dark:text-white mt-4 hover:text-amber-500 transition">
                          {headTeacher.name}
                        </h3>
                      </Link>
                      <p className="text-xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider mt-1">
                        {headTeacher.subject || headTeacher.specialization}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-3 line-clamp-3">
                        {headTeacher.qualification}
                      </p>
                      {headTeacher.achievements && headTeacher.achievements.length > 0 && (
                        <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 space-y-1.5">
                          {headTeacher.achievements.slice(0, 2).map((a, i) => (
                            <div key={i} className="flex items-start gap-2 text-xs text-slate-600 dark:text-slate-300">
                              <Award className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
                              <span>{a}</span>
                            </div>
                          ))}
                        </div>
                      )}
                      <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-800 space-y-2">
                        <a href={`tel:${headTeacher.phone}`} className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-200">
                          <Phone className="w-3.5 h-3.5 text-amber-500" />
                          {headTeacher.phone}
                        </a>
                        {headTeacher.telegram && (
                          <a
                            href={`https://t.me/${headTeacher.telegram.replace('@', '')}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-200"
                          >
                            <Send className="w-3.5 h-3.5 text-sky-500" />
                            {headTeacher.telegram}
                          </a>
                        )}
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="p-6">
                    <h3 className="text-lg font-black text-slate-900 dark:text-white">Bosh ustoz</h3>
                    <p className="text-sm text-slate-600 dark:text-slate-400 mt-2">{course.teacherName}</p>
                  </div>
                )}
              </div>
            </aside>
          </div>
        </div>
      </section>

      {/* ===== COURSE RESULTS SLIDER ===== */}
      {courseResults.length > 0 && (
        <section className="py-16 md:py-20 bg-slate-100/60 dark:bg-slate-900/40 border-y border-slate-200/80 dark:border-slate-800/80">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-wrap items-end justify-between gap-4 mb-10">
              <div>
                <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                  Ushbu kurs natijalari
                </h2>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">
                  O'quvchilarimizning ushbu yo'nalishdagi haqiqiy qabul natijalari.
                </p>
              </div>
              <Link to="/#results" className="text-xs font-bold text-amber-600 dark:text-amber-400 hover:underline">
                Barcha natijalar →
              </Link>
            </div>

            <ResultsCarousel
              items={courseResults}
              cardClassName="w-full sm:w-[calc(50%-0.5rem)] lg:w-[calc(33.333%-0.667rem)] xl:w-[calc(25%-0.75rem)]"
              renderCard={(res, rIdx) => {
                const isGrant = res.admissionType === 'Grant' || res.badge?.includes('Grant');
                return (
                  <div
                    key={`${res.id || rIdx}`}
                    className={`relative h-full p-6 rounded-3xl flex flex-col justify-between ${
                      isGrant
                        ? 'bg-white dark:bg-slate-900 border-2 border-amber-500/80 shadow-xl shadow-amber-500/10'
                        : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-md'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-[11px] font-black text-amber-600 dark:text-amber-400 uppercase tracking-wider">{res.subject}</span>
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${isGrant ? 'bg-amber-500 text-slate-950' : 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20'}`}>
                          {res.badge || (isGrant ? '100% Davlat Granti' : 'Talaba')}
                        </span>
                      </div>
                      <div className="flex items-baseline gap-1.5">
                        <span className="text-3xl font-black text-slate-900 dark:text-white font-mono">{res.score}</span>
                        <span className="text-[10px] text-slate-400 font-semibold">natija</span>
                      </div>
                      <h3 className="text-lg font-black text-slate-900 dark:text-white mt-3">{res.studentName}</h3>
                      <p className="text-xs text-slate-600 dark:text-slate-300 mt-1.5 line-clamp-1">{res.university}</p>
                    </div>
                    <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
                      <span>Mavsum: {res.year || '2025–2026'}</span>
                      <span className="font-bold text-amber-600 dark:text-amber-400">Renessans LC</span>
                    </div>
                  </div>
                );
              }}
            />
          </div>
        </section>
      )}

      {/* ===== RELATED + PREV/NEXT ===== */}
      {related.length > 0 && (
        <section className="py-16 md:py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight mb-10">
              Boshqa kurslar
            </h2>
            <div className="grid sm:grid-cols-3 gap-6">
              {related.map((c) => {
                const v = getSubjectVisual(c);
                return (
                  <Link
                    key={c.id}
                    to={`/courses/${getCourseSlug(c)}`}
                    className="group rounded-3xl overflow-hidden bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-md hover:shadow-xl transition-all duration-300"
                  >
                    <SmartImage src={c.imageUrl} alt={v.alt} visual={v} rounded={false} className="h-36" />
                    <div className="p-5">
                      <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider">{c.category}</span>
                      <h3 className="text-base font-black text-slate-900 dark:text-white mt-1 group-hover:text-amber-500 transition">{c.title}</h3>
                      <div className="mt-3 flex items-center justify-between text-xs">
                        <span className="text-slate-400">{c.duration}</span>
                        <span className="font-black font-mono text-slate-900 dark:text-white">{c.monthlyFee ? `${c.monthlyFee.toLocaleString()} UZS` : c.formattedFee}</span>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>

            {/* Prev / Next */}
            {(prevCourse || nextCourse) && (
              <div className="mt-10 grid sm:grid-cols-2 gap-4">
                {prevCourse && (
                  <Link
                    to={`/courses/${getCourseSlug(prevCourse)}`}
                    className="flex items-center gap-3 p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-amber-500/50 transition group"
                  >
                    <ChevronLeft className="w-4 h-4 text-slate-400 group-hover:text-amber-500" />
                    <div className="min-w-0">
                      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Oldingi kurs</div>
                      <div className="text-sm font-black text-slate-900 dark:text-white truncate">{prevCourse.title}</div>
                    </div>
                  </Link>
                )}
                {nextCourse && (
                  <Link
                    to={`/courses/${getCourseSlug(nextCourse)}`}
                    className="flex items-center justify-end gap-3 p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-amber-500/50 transition group sm:text-right"
                  >
                    <div className="min-w-0">
                      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Keyingi kurs</div>
                      <div className="text-sm font-black text-slate-900 dark:text-white truncate">{nextCourse.title}</div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-amber-500" />
                  </Link>
                )}
              </div>
            )}
          </div>
        </section>
      )}

      {/* ===== QUESTION FORM ===== */}
      <section className="py-16 md:py-20">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <QuestionForm coursePreselected={course.id} courseName={course.title} />
        </div>
      </section>

      {/* ===== CTA ===== */}
      <section className="py-16 md:py-24">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white p-8 sm:p-14 text-center">
            <div className="relative z-10">
              <h2 className="text-2xl sm:text-4xl font-black tracking-tight">
                {course.title} — sinov darsiga yoziling
              </h2>
              <p className="text-sm sm:text-base text-slate-300 mt-3 max-w-xl mx-auto">
                1-dars mutlaqo bepul. Kelib metodika va ustoz bilan tanishing, keyin qaror qiling.
              </p>
              <button
                onClick={() => openTrial(course.title)}
                className="mt-8 px-8 py-4 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-sm shadow-xl shadow-amber-500/30 transition cursor-pointer"
              >
                Bepul Sinov Darsiga Yozilish
              </button>
            </div>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
};