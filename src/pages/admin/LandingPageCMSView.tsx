import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { toast } from 'react-toastify';
import { useLanguage } from '../../context/LanguageContext';
import { LandingPageContent, Teacher, Course, StudentResult, WhyRenessansCard, LandingTestimonial } from '../../types';
import {
  subscribeLandingPageContent,
  publishLandingPageContent,
  DEFAULT_LANDING_PAGE_CONTENT
} from '../../services/landingCms';
import { polishLandingCopy } from '../../services/gemini';
import {
  Sparkles,
  Save,
  RotateCcw,
  Layout,
  Award,
  Users,
  BookOpen,
  MapPin,
  Plus,
  Trash2,
  CheckCircle,
  Star,
  Eye,
  Send,
  HelpCircle,
  Phone,
  Globe,
  FileText
} from 'lucide-react';

export const LandingPageCMSView: React.FC = () => {
  const { language, translate: t } = useLanguage();

  // 5 Main Tabs matching PART 3 prompt requirements:
  // Tab 1: Hero & Navbar
  // Tab 2: Mentors & Teachers
  // Tab 3: Achievements & Reviews
  // Tab 4: Courses & Pricing
  // Tab 5: Contacts, Footer & Maps
  const [activeTab, setActiveTab] = useState<'hero_nav' | 'mentors' | 'achievements_reviews' | 'courses_pricing' | 'contacts_maps'>('hero_nav');

  const [content, setContent] = useState<LandingPageContent>(DEFAULT_LANDING_PAGE_CONTENT);
  const [isSaving, setIsSaving] = useState(false);
  const [hasUnsavedEdits, setHasUnsavedEdits] = useState(false);

  useEffect(() => {
    const unsub = subscribeLandingPageContent((data) => {
      setContent(data);
    });
    return () => unsub();
  }, []);

  const handleChange = <K extends keyof LandingPageContent>(field: K, value: LandingPageContent[K]) => {
    setContent((prev) => ({
      ...prev,
      [field]: value
    }));
    setHasUnsavedEdits(true);
  };

  const handleSaveAll = async () => {
    setIsSaving(true);
    try {
      await publishLandingPageContent(content);
      setHasUnsavedEdits(false);
      toast.success(
        t(
          "🚀 Lendin sahifa kontentlari doc(db, 'settings', 'landing_cms') ga saqlandi va nashr etildi!",
          "🚀 Landing page content successfully saved & published to doc(db, 'settings', 'landing_cms')!",
          "🚀 Контент лендинга успешно сохранен в doc(db, 'settings', 'landing_cms')!"
        )
      );
    } catch (err) {
      console.error(err);
      toast.error(t("Saqlashda xatolik yuz berdi", "Error saving landing content", "Ошибка сохранения"));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6 pb-24 max-w-7xl mx-auto">
      {/* 5-Tab Navigation Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 p-1.5 bg-slate-100 dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
        <button
          onClick={() => setActiveTab('hero_nav')}
          className={`py-3 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer ${
            activeTab === 'hero_nav'
              ? 'bg-amber-500 text-slate-950 shadow-md font-black'
              : 'text-slate-600 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-800'
          }`}
        >
          <Layout className="w-4 h-4 shrink-0" />
          <span className="truncate">1. Hero & Navbar</span>
        </button>

        <button
          onClick={() => setActiveTab('mentors')}
          className={`py-3 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer ${
            activeTab === 'mentors'
              ? 'bg-amber-500 text-slate-950 shadow-md font-black'
              : 'text-slate-600 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-800'
          }`}
        >
          <Users className="w-4 h-4 shrink-0" />
          <span className="truncate">2. Mentors & Teachers</span>
        </button>

        <button
          onClick={() => setActiveTab('achievements_reviews')}
          className={`py-3 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer ${
            activeTab === 'achievements_reviews'
              ? 'bg-amber-500 text-slate-950 shadow-md font-black'
              : 'text-slate-600 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-800'
          }`}
        >
          <Award className="w-4 h-4 shrink-0" />
          <span className="truncate">3. Achievements & Reviews</span>
        </button>

        <button
          onClick={() => setActiveTab('courses_pricing')}
          className={`py-3 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer ${
            activeTab === 'courses_pricing'
              ? 'bg-amber-500 text-slate-950 shadow-md font-black'
              : 'text-slate-600 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-800'
          }`}
        >
          <BookOpen className="w-4 h-4 shrink-0" />
          <span className="truncate">4. Courses & Pricing</span>
        </button>

        <button
          onClick={() => setActiveTab('contacts_maps')}
          className={`py-3 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer ${
            activeTab === 'contacts_maps'
              ? 'bg-amber-500 text-slate-950 shadow-md font-black'
              : 'text-slate-600 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-800'
          }`}
        >
          <MapPin className="w-4 h-4 shrink-0" />
          <span className="truncate">5. Contacts & Maps</span>
        </button>
      </div>

      {/* TAB 1: HERO & NAVBAR */}
      {activeTab === 'hero_nav' && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-md space-y-4">
            <h3 className="text-sm font-extrabold uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
              <Layout className="w-4 h-4 text-amber-500" />
              <span>Header, Navbar & AI Badge</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Location Badge (UZ)
                </label>
                <input
                  type="text"
                  value={content.locationBadgeUz}
                  onChange={(e) => handleChange('locationBadgeUz', e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border text-xs text-slate-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Location Badge (EN)
                </label>
                <input
                  type="text"
                  value={content.locationBadgeEn}
                  onChange={(e) => handleChange('locationBadgeEn', e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border text-xs text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-emerald-600 dark:text-emerald-400 mb-1">
                  AI Badge Text (UZ)
                </label>
                <input
                  type="text"
                  value={content.aiBadgeUz || ''}
                  onChange={(e) => handleChange('aiBadgeUz', e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-emerald-500/30 text-xs text-slate-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-emerald-600 dark:text-emerald-400 mb-1">
                  AI Badge Text (EN)
                </label>
                <input
                  type="text"
                  value={content.aiBadgeEn || ''}
                  onChange={(e) => handleChange('aiBadgeEn', e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-emerald-500/30 text-xs text-slate-900 dark:text-white"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Hero Title (UZ)
                </label>
                <input
                  type="text"
                  value={content.heroTitleUz}
                  onChange={(e) => handleChange('heroTitleUz', e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border text-xs font-extrabold text-amber-500"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Hero Title (EN)
                </label>
                <input
                  type="text"
                  value={content.heroTitleEn}
                  onChange={(e) => handleChange('heroTitleEn', e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border text-xs font-extrabold text-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Hero Subtitle (UZ)
                </label>
                <textarea
                  rows={2}
                  value={content.heroSubtitleUz}
                  onChange={(e) => handleChange('heroSubtitleUz', e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border text-xs"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Hero Subtitle (EN)
                </label>
                <textarea
                  rows={2}
                  value={content.heroSubtitleEn}
                  onChange={(e) => handleChange('heroSubtitleEn', e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border text-xs"
                />
              </div>
            </div>
          </div>

          {/* Key Metric Stats Grid */}
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-md space-y-4">
            <h3 className="text-sm font-extrabold uppercase tracking-wider text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-3">
              Key Statistics Grid
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700">
                <label className="text-[10px] font-bold text-slate-500 uppercase">Active Students</label>
                <input
                  type="text"
                  value={content.activeStudentsCount}
                  onChange={(e) => handleChange('activeStudentsCount', e.target.value)}
                  className="w-full px-2 py-1 mt-1 rounded bg-white dark:bg-slate-900 border text-sm font-mono font-bold text-amber-500"
                />
              </div>
              <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700">
                <label className="text-[10px] font-bold text-slate-500 uppercase">IELTS 7.0+ Count</label>
                <input
                  type="text"
                  value={content.ieltsHighResults}
                  onChange={(e) => handleChange('ieltsHighResults', e.target.value)}
                  className="w-full px-2 py-1 mt-1 rounded bg-white dark:bg-slate-900 border text-sm font-mono font-bold text-amber-500"
                />
              </div>
              <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700">
                <label className="text-[10px] font-bold text-slate-500 uppercase">Admission Rate</label>
                <input
                  type="text"
                  value={content.admissionRate}
                  onChange={(e) => handleChange('admissionRate', e.target.value)}
                  className="w-full px-2 py-1 mt-1 rounded bg-white dark:bg-slate-900 border text-sm font-mono font-bold text-amber-500"
                />
              </div>
              <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700">
                <label className="text-[10px] font-bold text-slate-500 uppercase">Years Experience</label>
                <input
                  type="text"
                  value={content.yearsExperience}
                  onChange={(e) => handleChange('yearsExperience', e.target.value)}
                  className="w-full px-2 py-1 mt-1 rounded bg-white dark:bg-slate-900 border text-sm font-mono font-bold text-amber-500"
                />
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* TAB 2: MENTORS & TEACHERS */}
      {activeTab === 'mentors' && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-md space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-sm font-extrabold uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-2">
                <Users className="w-4 h-4 text-amber-500" />
                <span>Mentors & Teachers List</span>
              </h3>
              <button
                onClick={() => {
                  const newTeacher: Teacher = {
                    id: `t_${Date.now()}`,
                    name: "New Mentor",
                    role: "Senior IELTS Tutor",
                    badge: "IELTS 8.5",
                    experience: "5+ Years Exp",
                    bioUz: "Malakali ustoz bio...",
                    bioEn: "Expert mentor bio...",
                    image: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=400",
                    specialization: ["Writing", "Speaking"],
                    resultsCount: 120
                  };
                  handleChange('teachers', [...content.teachers, newTeacher]);
                }}
                className="px-3 py-1.5 rounded-xl bg-amber-500 text-slate-950 text-xs font-bold flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Add Mentor</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {content.teachers.map((mentor) => (
                <div key={mentor.id} className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 space-y-3">
                  <div className="flex items-center gap-3">
                    <img src={mentor.image} alt={mentor.name} className="w-12 h-12 rounded-xl object-cover shrink-0 border border-amber-500/40" />
                    <div className="overflow-hidden flex-1">
                      <input
                        type="text"
                        value={mentor.name}
                        onChange={(e) => {
                          const updated = content.teachers.map((t) => (t.id === mentor.id ? { ...t, name: e.target.value } : t));
                          handleChange('teachers', updated);
                        }}
                        className="w-full px-2 py-1 rounded bg-white dark:bg-slate-900 border text-xs font-extrabold"
                        placeholder="Mentor Name"
                      />
                      <input
                        type="text"
                        value={mentor.role}
                        onChange={(e) => {
                          const updated = content.teachers.map((t) => (t.id === mentor.id ? { ...t, role: e.target.value } : t));
                          handleChange('teachers', updated);
                        }}
                        className="w-full px-2 py-1 rounded bg-white dark:bg-slate-900 border text-[11px] font-bold text-amber-500 mt-1"
                        placeholder="Role / Title"
                      />
                    </div>
                    <button
                      onClick={() => {
                        const updated = content.teachers.filter((t) => t.id !== mentor.id);
                        handleChange('teachers', updated);
                      }}
                      className="p-1 rounded text-rose-500 hover:bg-rose-500/10 cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] font-bold text-slate-500">Badge Score:</label>
                      <input
                        type="text"
                        value={mentor.badge}
                        onChange={(e) => {
                          const updated = content.teachers.map((t) => (t.id === mentor.id ? { ...t, badge: e.target.value } : t));
                          handleChange('teachers', updated);
                        }}
                        className="w-full px-2 py-1 rounded bg-white dark:bg-slate-900 border text-xs font-mono font-bold text-amber-500"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-500">Experience:</label>
                      <input
                        type="text"
                        value={mentor.experience}
                        onChange={(e) => {
                          const updated = content.teachers.map((t) => (t.id === mentor.id ? { ...t, experience: e.target.value } : t));
                          handleChange('teachers', updated);
                        }}
                        className="w-full px-2 py-1 rounded bg-white dark:bg-slate-900 border text-xs"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      )}

      {/* TAB 3: ACHIEVEMENTS & REVIEWS */}
      {activeTab === 'achievements_reviews' && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-md space-y-4">
            <h3 className="text-sm font-extrabold uppercase tracking-wider text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-3 flex items-center gap-2">
              <Award className="w-4 h-4 text-amber-500" />
              <span>Student Score Achievements (L / R / W / S Band Scores)</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {content.results.map((res) => (
                <div key={res.id} className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 space-y-3">
                  <div className="flex items-center justify-between">
                    <input
                      type="text"
                      value={res.studentName}
                      onChange={(e) => {
                        const updated = content.results.map((r) => (r.id === res.id ? { ...r, studentName: e.target.value } : r));
                        handleChange('results', updated);
                      }}
                      className="px-2 py-1 rounded bg-white dark:bg-slate-900 border text-xs font-extrabold"
                      placeholder="Student Name"
                    />
                    <input
                      type="text"
                      value={res.score || String(res.overall || '8.0')}
                      onChange={(e) => {
                        const updated = content.results.map((r) => (r.id === res.id ? { ...r, score: e.target.value, overall: e.target.value } : r));
                        handleChange('results', updated);
                      }}
                      className="px-2 py-1 rounded bg-amber-500 text-slate-950 font-black text-xs w-20 text-center"
                      placeholder="Overall"
                    />
                  </div>

                  <div className="grid grid-cols-4 gap-1">
                    <div>
                      <label className="text-[9px] font-bold text-slate-500 block text-center">L</label>
                      <input
                        type="text"
                        value={String(res.listening || '')}
                        onChange={(e) => {
                          const updated = content.results.map((r) => (r.id === res.id ? { ...r, listening: e.target.value } : r));
                          handleChange('results', updated);
                        }}
                        className="w-full px-1 py-1 rounded bg-white dark:bg-slate-900 border text-center text-xs font-bold"
                      />
                    </div>
                    <div>
                      <label className="text-[9px] font-bold text-slate-500 block text-center">R</label>
                      <input
                        type="text"
                        value={String(res.reading || '')}
                        onChange={(e) => {
                          const updated = content.results.map((r) => (r.id === res.id ? { ...r, reading: e.target.value } : r));
                          handleChange('results', updated);
                        }}
                        className="w-full px-1 py-1 rounded bg-white dark:bg-slate-900 border text-center text-xs font-bold"
                      />
                    </div>
                    <div>
                      <label className="text-[9px] font-bold text-slate-500 block text-center">W</label>
                      <input
                        type="text"
                        value={String(res.writing || '')}
                        onChange={(e) => {
                          const updated = content.results.map((r) => (r.id === res.id ? { ...r, writing: e.target.value } : r));
                          handleChange('results', updated);
                        }}
                        className="w-full px-1 py-1 rounded bg-white dark:bg-slate-900 border text-center text-xs font-bold"
                      />
                    </div>
                    <div>
                      <label className="text-[9px] font-bold text-slate-500 block text-center">S</label>
                      <input
                        type="text"
                        value={String(res.speaking || '')}
                        onChange={(e) => {
                          const updated = content.results.map((r) => (r.id === res.id ? { ...r, speaking: e.target.value } : r));
                          handleChange('results', updated);
                        }}
                        className="w-full px-1 py-1 rounded bg-white dark:bg-slate-900 border text-center text-xs font-bold"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      )}

      {/* TAB 4: COURSES & PRICING */}
      {activeTab === 'courses_pricing' && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-md space-y-4">
            <h3 className="text-sm font-extrabold uppercase tracking-wider text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-3 flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-amber-500" />
              <span>Courses & Pricing Plans</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {content.courses.map((course) => (
                <div key={course.id} className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 space-y-3">
                  <input
                    type="text"
                    value={course.titleUz}
                    onChange={(e) => {
                      const updated = content.courses.map((c) => (c.id === course.id ? { ...c, titleUz: e.target.value } : c));
                      handleChange('courses', updated);
                    }}
                    className="w-full px-2 py-1 rounded bg-white dark:bg-slate-900 border text-xs font-extrabold text-amber-500"
                    placeholder="Course Title"
                  />

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] font-bold text-slate-500">Monthly Fee UZ:</label>
                      <input
                        type="text"
                        value={course.priceUz}
                        onChange={(e) => {
                          const updated = content.courses.map((c) => (c.id === course.id ? { ...c, priceUz: e.target.value } : c));
                          handleChange('courses', updated);
                        }}
                        className="w-full px-2 py-1 rounded bg-white dark:bg-slate-900 border text-xs font-mono font-bold text-emerald-500"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-500">Duration UZ:</label>
                      <input
                        type="text"
                        value={course.durationUz}
                        onChange={(e) => {
                          const updated = content.courses.map((c) => (c.id === course.id ? { ...c, durationUz: e.target.value } : c));
                          handleChange('courses', updated);
                        }}
                        className="w-full px-2 py-1 rounded bg-white dark:bg-slate-900 border text-xs"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-500">Features List (1 per line):</label>
                    <textarea
                      rows={3}
                      value={course.featuresUz.join('\n')}
                      onChange={(e) => {
                        const list = e.target.value.split('\n').filter((s) => s.trim().length > 0);
                        const updated = content.courses.map((c) => (c.id === course.id ? { ...c, featuresUz: list, featuresEn: list } : c));
                        handleChange('courses', updated);
                      }}
                      className="w-full px-2 py-1 rounded bg-white dark:bg-slate-900 border text-xs"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      )}

      {/* TAB 5: CONTACTS, FOOTER & MAPS */}
      {activeTab === 'contacts_maps' && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-md space-y-4">
            <h3 className="text-sm font-extrabold uppercase tracking-wider text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-3 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-amber-500" />
              <span>Contact Details, Footer & Google Maps</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Branch Address (UZ)
                </label>
                <input
                  type="text"
                  value={content.addressUz}
                  onChange={(e) => handleChange('addressUz', e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Phone Number
                </label>
                <input
                  type="text"
                  value={content.phone}
                  onChange={(e) => handleChange('phone', e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border text-xs font-mono font-bold text-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Telegram Handle
                </label>
                <input
                  type="text"
                  value={content.telegramHandle}
                  onChange={(e) => handleChange('telegramHandle', e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border text-xs font-mono font-bold text-sky-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Google Maps Location URL
                </label>
                <input
                  type="text"
                  value={content.googleMapsUrl}
                  onChange={(e) => handleChange('googleMapsUrl', e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border text-xs font-mono"
                />
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Floating Save Landing Page Changes Bar at Bottom */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 px-6 py-3.5 rounded-2xl bg-slate-900/95 backdrop-blur-md border border-slate-800 text-white shadow-2xl flex items-center gap-4">
        <span className="text-xs font-bold text-slate-300 flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
          {hasUnsavedEdits ? "Pending landing edits ready to save" : "Firestore synced to settings/landing_cms"}
        </span>
        <button
          onClick={handleSaveAll}
          disabled={isSaving}
          className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black shadow-lg shadow-amber-500/20 transition cursor-pointer disabled:opacity-50"
        >
          {isSaving ? "Saving..." : "💾 Save Landing Page Changes"}
        </button>
      </div>
    </div>
  );
};
