import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ChevronRight, Sparkles, Phone, Send, Briefcase, Award, GraduationCap, Users, CalendarClock } from 'lucide-react';
import { crmService } from '../services/crmService';
import { coursesService, teachersService } from '../services/repository';
import { CourseData, TeacherRecord } from '../types/crm';
import { getCourseSlug, slugify } from '../utils/content';
import { PublicLayout, useTrialModal } from '../components/public/PublicLayout';
import { TeacherAvatar } from '../components/common/TeacherAvatar';
import { CourseCard } from '../components/public/CourseCard';
import { ShareButton } from '../components/public/ShareDialog';
import { SEOHead } from '../components/SEOHead';

// ---------------------------------------------------------------------------
// /teachers/:slug — teacher profile page (single source of truth via teacherId).
// ---------------------------------------------------------------------------

export const TeacherPage: React.FC = () => {
  const { slug = '' } = useParams();
  const { openTrial } = useTrialModal();

  const [teacher, setTeacher] = useState<TeacherRecord | null>(null);
  const [courses, setCourses] = useState<CourseData[]>([]);

  useEffect(() => {
    // Production path: Firestore `teachers`/`courses`. Legacy crmService is
    // only the offline fallback.
    let cancelled = false;
    (async () => {
      try {
        const [teacherDocs, courseDocs] = await Promise.all([
          teachersService.getAllTeachers(),
          coursesService.getPublicCourses(),
        ]);
        if (cancelled) return;
        const teachers = (
          teacherDocs.length > 0 ? teacherDocs : crmService.getTeachers()
        ) as TeacherRecord[];
        const found =
          teachers.find((t) => slugify(t.name) === slug) ||
          teachers.find((t) => t.name.toLowerCase().includes(slug.replace(/-/g, ' '))) ||
          null;
        setTeacher(found && found.isPublic !== false ? found : null);

        if (found) {
          const publicCourses = (
            (courseDocs.length > 0 ? courseDocs : crmService.getCourses()) as CourseData[]
          ).filter((c) => c.isActive && c.isPublic !== false);
          const taught = publicCourses.filter(
            (c) =>
              c.teacherId === found.id ||
              (c.teacherName && c.teacherName.toLowerCase() === found.name.toLowerCase())
          );
          setCourses(taught);
        } else {
          setCourses([]);
        }
      } catch {
        if (cancelled) return;
        const teachers = crmService.getTeachers();
        const found =
          teachers.find((t) => slugify(t.name) === slug) ||
          teachers.find((t) => t.name.toLowerCase().includes(slug.replace(/-/g, ' '))) ||
          null;
        setTeacher(found && found.isPublic !== false ? found : null);
        setCourses(found
          ? crmService.getCourses().filter((c) => c.isActive && c.isPublic !== false).filter(
              (c) => c.teacherId === found.id ||
                (c.teacherName && c.teacherName.toLowerCase() === found.name.toLowerCase())
            )
          : []);
      }
    })();
    return () => { cancelled = true; };
  }, [slug]);

  if (!teacher) {
    return (
      <PublicLayout>
        <div className="pt-40 pb-32 text-center px-4">
          <Sparkles className="w-12 h-12 mx-auto mb-4 text-slate-300 dark:text-slate-600" />
          <h1 className="text-2xl font-black text-slate-900 dark:text-white">Ustoz topilmadi</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">
            Bunday ustoz mavjud emas yoki hozircha nashr qilinmagan.
          </p>
          <Link
            to="/#teachers"
            className="inline-block mt-6 px-6 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs uppercase tracking-wider transition"
          >
            Barcha ustozlar
          </Link>
        </div>
      </PublicLayout>
    );
  }

  const taughtCategories = Array.from(new Set(courses.map((c) => c.category)).values());
  const teacherSlug = slugify(teacher.name);
  const canonicalUrl = typeof window !== 'undefined' && window.location?.origin
    ? `${window.location.origin}/ustozlar/${teacherSlug}`
    : '';
  const subjectsList = [
    ...(teacher.subject ? [teacher.subject] : []),
    ...(courses.map((c) => c.category)),
  ].filter((v, i, a) => a.indexOf(v) === i);

  return (
    <PublicLayout>
      <SEOHead
        title={`${teacher.name} — Renessans O'quv Markazi`}
        description={`${teacher.name} — ${teacher.subject || teacher.specialization}. ${teacher.experience} tajribaga ega ustoz. ${teacher.qualification || teacher.description || ''}`}
        canonicalUrl={canonicalUrl}
      />

      {/* Profile header */}
      <div className="pt-28 pb-12 md:pt-36 md:pb-16 bg-gradient-to-br from-slate-50 via-transparent to-amber-500/5 dark:from-slate-950 dark:to-slate-900/40 border-b border-slate-200/70 dark:border-slate-800/70">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 mb-8" aria-label="Ustoz navigatsiyasi">
            <Link to="/" className="hover:text-amber-500 transition">Bosh sahifa</Link>
            <ChevronRight className="w-3.5 h-3.5" />
            <Link to="/#ustozlar" className="hover:text-amber-500 transition">Ustozlar</Link>
            <ChevronRight className="w-3.5 h-3.5" />
            <span className="text-slate-600 dark:text-slate-300 line-clamp-1">{teacher.name}</span>
          </nav>

          <div className="grid md:grid-cols-[auto_1fr] gap-8 items-start">
            <TeacherAvatar
              photo={teacher.photo}
              name={teacher.name}
              gender={teacher.gender}
              className="w-28 h-28 sm:w-36 sm:h-36 rounded-3xl ring-4 ring-white dark:ring-slate-900 shadow-xl"
            />
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-3 py-1.5 rounded-full bg-amber-500/10 text-amber-700 dark:text-amber-400 text-[11px] font-black uppercase tracking-wider border border-amber-500/20">
                  {teacher.subject || teacher.specialization}
                </span>
                {teacher.telegram && (
                  <a
                    href={`https://t.me/${teacher.telegram.replace('@', '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-1.5 rounded-full bg-sky-500/10 text-sky-600 dark:text-sky-400 text-[11px] font-black uppercase tracking-wider border border-sky-500/20 hover:bg-sky-500/20 transition"
                  >
                    @{teacher.telegram.replace('@', '')}
                  </a>
                )}
              </div>

              <h1 className="text-3xl sm:text-5xl font-black text-slate-900 dark:text-white mt-4 tracking-tight">
                {teacher.name}
              </h1>
              <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 mt-3 max-w-2xl leading-relaxed">
                {teacher.qualification || teacher.description}
              </p>

              {/* Quick stats */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-8 max-w-xl">
                <div className="px-4 py-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                  <Briefcase className="w-4 h-4 text-amber-500 mb-1" />
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Tajriba</div>
                  <div className="text-sm font-black text-slate-900 dark:text-white mt-0.5">{teacher.experience}</div>
                </div>
                <div className="px-4 py-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                  <Users className="w-4 h-4 text-amber-500 mb-1" />
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">O'quvchilar</div>
                  <div className="text-sm font-black text-slate-900 dark:text-white mt-0.5">
                    {teacher.studentsCount > 0 ? `${teacher.studentsCount}+` : '—'}
                  </div>
                </div>
                <div className="px-4 py-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                  <CalendarClock className="w-4 h-4 text-amber-500 mb-1" />
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Guruhlar</div>
                  <div className="text-sm font-black text-slate-900 dark:text-white mt-0.5">
                    {teacher.activeGroups > 0 ? teacher.activeGroups : '—'}
                  </div>
                </div>
                <div className="px-4 py-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                  <GraduationCap className="w-4 h-4 text-amber-500 mb-1" />
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Yo'nalishlar</div>
                  <div className="text-sm font-black text-slate-900 dark:text-white mt-0.5">{subjectsList.length || '—'}</div>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3 mt-8">
                <ShareButton title={`${teacher.name} — Renessans ustoz`} url={canonicalUrl} className="px-4 py-3" />
                <a
                  href={`tel:${teacher.phone}`}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 dark:border-slate-700 px-4 py-3 text-xs font-bold text-slate-600 dark:text-slate-300 hover:text-amber-500 transition"
                >
                  <Phone className="w-3.5 h-3.5" />
                  {teacher.phone}
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bio + achievements */}
      <section className="py-16 md:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-[1fr_380px] gap-12">
            <div>
              <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">Ustoz haqida</h2>
              {teacher.description && (
                <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 mt-4 leading-relaxed">
                  {teacher.description}
                </p>
              )}
              {teacher.qualification && (
                <p className="mt-4 text-sm text-slate-500 dark:text-slate-400">{teacher.qualification}</p>
              )}

              {/* Achiviements / certificates */}
              {teacher.achievements && teacher.achievements.length > 0 && (
                <div className="mt-10">
                  <h3 className="text-lg font-black text-slate-900 dark:text-white mb-6">Yutuqlar va sertifikatlar</h3>
                  <div className="grid sm:grid-cols-2 gap-3">
                    {teacher.achievements.map((a, i) => (
                      <div key={i} className="flex items-start gap-3 p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                        <Award className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                        <span className="text-sm text-slate-700 dark:text-slate-300">{a}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Courses sidebar */}
            <aside>
              <div className="sticky top-28 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-lg p-6">
                <h3 className="text-lg font-black text-slate-900 dark:text-white">
                  {courses.length > 0 ? 'Ushbu ustoz darslari' : 'Yo\'nalishlar'}
                </h3>
                <div className="mt-4 space-y-2">
                  {courses.length > 0 ? (
                    courses.map((c) => (
                      <Link
                        key={c.id}
                        to={`/courses/${getCourseSlug(c)}`}
                        className="block p-3 rounded-2xl border border-slate-200 dark:border-slate-700 hover:border-amber-500/50 transition group"
                      >
                        <div className="text-[10px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider">{c.category}</div>
                        <div className="text-sm font-black text-slate-900 dark:text-white group-hover:text-amber-500 transition">{c.title}</div>
                        <div className="text-[11px] text-slate-400 mt-1">{c.duration} · {c.lessonsPerWeek}</div>
                      </Link>
                    ))
                  ) : (
                    subjectsList.map((s) => (
                      <div key={s} className="px-3 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800 text-sm font-bold text-slate-700 dark:text-slate-200">
                        {s}
                      </div>
                    ))
                  )}
                </div>
                <button
                  onClick={() => openTrial()}
                  className="mt-6 w-full py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs uppercase tracking-wider transition cursor-pointer"
                >
                  Sinov darsiga yozilish
                </button>
              </div>
            </aside>
          </div>

          {/* Taught courses grid */}
          {courses.length > 0 && (
            <div className="mt-16">
              <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight mb-8">
                Ustoz qaysi kurslarda dars beradi
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {courses.map((course, idx) => (
                  <CourseCard key={course.id} course={course} index={idx} onSelectCourseForTrial={openTrial} />
                ))}
              </div>
            </div>
          )}
        </div>
      </section>
    </PublicLayout>
  );
};