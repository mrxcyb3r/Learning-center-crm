import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { toast } from 'react-toastify';
import { useLanguage } from '../../context/LanguageContext';
import { LandingPageContent, Teacher, Course, StudentResult, WhyRenessansCard, LandingTestimonial, FAQItem } from '../../types';
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
  Image as ImageIcon,
  Layout,
  Award,
  Users,
  BookOpen,
  MapPin,
  MessageSquare,
  Plus,
  Trash2,
  CheckCircle,
  Eye,
  Globe,
  Star,
  ChevronDown,
  ChevronUp,
  FileText,
  Phone,
  Send
} from 'lucide-react';

interface AIPolishButtonProps {
  currentText: string;
  lang?: 'uz' | 'en' | 'ru';
  onPolished: (newText: string) => void;
  label?: string;
}

const AIPolishButton: React.FC<AIPolishButtonProps> = ({
  currentText,
  lang = 'en',
  onPolished,
  label = "✨ Auto-Polish Copy with AI"
}) => {
  const [loading, setLoading] = useState(false);

  const handlePolish = async () => {
    if (!currentText || !currentText.trim()) {
      toast.info('Matnni AI yordamida mukammallashtirish uchun avval matn kiriting');
      return;
    }
    setLoading(true);
    try {
      const polished = await polishLandingCopy(currentText, lang);
      if (polished && polished.trim()) {
        onPolished(polished);
        toast.success('✨ Matn AI yordamida mukammallashtirildi!');
      }
    } catch (err) {
      console.error(err);
      toast.error('AI polish error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handlePolish}
      disabled={loading}
      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 text-[11px] font-extrabold border border-amber-500/30 transition cursor-pointer shrink-0 disabled:opacity-50"
      title="Enhance text with Gemini AI"
    >
      <Sparkles className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-amber-500' : 'text-amber-500'}`} />
      <span>{loading ? 'Bajarilmoqda...' : label}</span>
    </button>
  );
};

export const LandingPageEditor: React.FC = () => {
  const { language, translate: t } = useLanguage();

  // Active sub-tab in editor
  const [activeTab, setActiveTab] = useState<'bg' | 'hero' | 'why' | 'teachers' | 'results' | 'reviews' | 'courses' | 'contact' | 'preview'>('hero');

  // Main editable state payload
  const [content, setContent] = useState<LandingPageContent>(DEFAULT_LANDING_PAGE_CONTENT);
  const [isPublishing, setIsPublishing] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Subscribe to live Firestore state on mount
  useEffect(() => {
    const unsubscribe = subscribeLandingPageContent((data) => {
      setContent(data);
    });
    return () => unsubscribe();
  }, []);

  const handleChange = <K extends keyof LandingPageContent>(field: K, value: LandingPageContent[K]) => {
    setContent((prev) => ({
      ...prev,
      [field]: value
    }));
    setHasUnsavedChanges(true);
  };

  const handlePublish = async () => {
    setIsPublishing(true);
    try {
      await publishLandingPageContent(content);
      setHasUnsavedChanges(false);
      toast.success(
        t(
          "🚀 O'zgartirishlar jonli saytda chop etildi!",
          "🚀 Changes published live on the public landing page!",
          "🚀 Изменения успешно опубликованы на главной странице!"
        )
      );
    } catch (err) {
      console.error(err);
      toast.error(t("Chop etishda xatolik yuz berdi", "Error publishing changes", "Ошибка публикации"));
    } finally {
      setIsPublishing(false);
    }
  };

  const handleReset = () => {
    if (window.confirm(t("Barcha ma'lumotlarni boshlang'ich holatga qaytarmoqchimisiz?", "Reset all landing page content to default?", "Сбросить все данные до начальных?"))) {
      setContent(DEFAULT_LANDING_PAGE_CONTENT);
      setHasUnsavedChanges(true);
      toast.info(t("Standart ma'lumotlar tiklandi", "Default content restored", "Восстановлены стандартные данные"));
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header Bar */}
      <div className="bg-white/90 dark:bg-slate-900/80 backdrop-blur-md border border-slate-200 dark:border-slate-800 rounded-3xl p-5 md:p-6 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4 sticky top-16 z-20">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-2xl bg-amber-500/10 text-amber-500 border border-amber-500/20">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                <span>Visual Landing Page CMS & Editor</span>
                {hasUnsavedChanges && (
                  <span className="text-[10px] uppercase px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-500 font-bold border border-amber-500/30">
                    {t("Saqlanmagan", "Unsaved Edits", "Не сохранено")}
                  </span>
                )}
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {t(
                  "Asosiy sahifa kontentini, rasmlarini va narxlarini real-vaqtda tahrirlang va Firestore ga nashr eting",
                  "Edit landing page hero, teachers, pricing & images in real time and publish to Firestore",
                  "Редактируйте контент, преподавателей и цены в реальном времени"
                )}
              </p>
            </div>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2.5 shrink-0">
          <button
            onClick={handleReset}
            className="px-4 py-2.5 rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer border border-slate-200 dark:border-slate-700"
          >
            <RotateCcw className="w-4 h-4" />
            <span>{t("Tiklash", "Reset", "Сбросить")}</span>
          </button>

          <button
            onClick={handlePublish}
            disabled={isPublishing}
            className="px-6 py-2.5 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs shadow-lg shadow-amber-500/20 transition flex items-center gap-2 cursor-pointer active:scale-95"
          >
            <Send className="w-4 h-4" />
            <span>{isPublishing ? t("Nashr etilmoqda...", "Publishing...", "Публикация...") : t("🚀 Publish Changes Live", "🚀 Publish Changes Live", "🚀 Опубликовать на сайте")}</span>
          </button>
        </div>
      </div>

      {/* Editor Tab Navigation */}
      <div className="flex overflow-x-auto gap-2 p-1.5 bg-slate-100 dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 no-scrollbar">
        {[
          { id: 'hero', label: t('Hero & Stats', 'Hero & Stats', 'Главный & Статистика'), icon: <Layout className="w-4 h-4" /> },
          { id: 'bg', label: t('Background Pattern', 'Background Image', 'Фоновое изображение'), icon: <ImageIcon className="w-4 h-4" /> },
          { id: 'why', label: t('Why Renessans?', 'Why Renessans?', 'Почему Renessans?'), icon: <CheckCircle className="w-4 h-4" /> },
          { id: 'teachers', label: t('Mentors Roster', 'Mentors Roster', 'Преподаватели'), icon: <Users className="w-4 h-4" /> },
          { id: 'results', label: t('Student Results', 'Student Results', 'Результаты'), icon: <Award className="w-4 h-4" /> },
          { id: 'reviews', label: t('Reviews CMS', 'Reviews & Achievers', 'Отзывы'), icon: <Star className="w-4 h-4" /> },
          { id: 'courses', label: t('Courses & Pricing', 'Courses & Pricing', 'Курсы и Цены'), icon: <BookOpen className="w-4 h-4" /> },
          { id: 'contact', label: t('Contact & Footer', 'Contact & Footer', 'Контакты и FAQ'), icon: <MapPin className="w-4 h-4" /> },
          { id: 'preview', label: t('Live Preview', 'Live Preview', 'Предпросмотр'), icon: <Eye className="w-4 h-4 text-emerald-500" /> }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition flex items-center gap-2 cursor-pointer ${
              activeTab === tab.id
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/10 font-black'
                : 'text-slate-600 dark:text-slate-400 hover:bg-white/60 dark:hover:bg-slate-800'
            }`}
          >
            {tab.icon}
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* TAB CONTENT PANELS */}

      {/* A. LIGHT & DARK MODE BACKGROUND MANAGER */}
      {activeTab === 'bg' && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/90 dark:bg-slate-900/70 backdrop-blur-md border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-xl space-y-6"
        >
          <div className="flex items-center gap-2 pb-4 border-b border-slate-200 dark:border-slate-800">
            <ImageIcon className="w-5 h-5 text-amber-500" />
            <div>
              <h2 className="text-base font-extrabold text-slate-900 dark:text-white">
                {t("Dynamic Light & Dark Mode Background Image Manager", "Dynamic Light & Dark Mode Background Image Manager", "Менеджер фонового изображения Light/Dark")}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {t("Saytning Light va Dark mode dagi orqa fon rasmini o'zgartiring", "Manage subtle background pattern overlay rendered across the landing page", "Настройка фонового узора для главной страницы")}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Light Mode Bg */}
            <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
                  Light Mode Background Pattern URL
                </span>
                <button
                  onClick={() => handleChange('lightModeBgImage', 'https://i.ibb.co/YTjMPbcZ/image.png')}
                  className="text-[11px] font-bold text-amber-600 dark:text-amber-400 hover:underline cursor-pointer"
                >
                  Reset Default Image
                </button>
              </div>

              <input
                type="text"
                value={content.lightModeBgImage}
                onChange={(e) => handleChange('lightModeBgImage', e.target.value)}
                placeholder="https://i.ibb.co/YTjMPbcZ/image.png"
                className="w-full px-4 py-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white font-mono focus:outline-none focus:ring-2 focus:ring-amber-500"
              />

              {/* Live Image Preview */}
              <div className="space-y-2">
                <label className="text-[11px] font-bold text-slate-500">Light Mode Live Canvas Preview:</label>
                <div className="h-44 rounded-xl border border-slate-300 overflow-hidden relative bg-slate-100 flex items-center justify-center">
                  <div
                    className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-95"
                    style={{ backgroundImage: `url('${content.lightModeBgImage}')` }}
                  />
                  <div className="relative z-10 p-4 rounded-xl bg-white/80 backdrop-blur-md shadow-lg border border-slate-200 text-center">
                    <p className="text-xs font-extrabold text-slate-900">Renessans Learning Center</p>
                    <p className="text-[10px] text-slate-600">Light Theme Pattern Background Active</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Dark Mode Bg */}
            <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4 text-white">
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-indigo-500"></span>
                  Dark Mode Background Pattern URL
                </span>
                <button
                  onClick={() => handleChange('darkModeBgImage', 'https://i.ibb.co/Wv1yrFwC/image.png')}
                  className="text-[11px] font-bold text-indigo-400 hover:underline cursor-pointer"
                >
                  Reset Default Image
                </button>
              </div>

              <input
                type="text"
                value={content.darkModeBgImage}
                onChange={(e) => handleChange('darkModeBgImage', e.target.value)}
                placeholder="https://i.ibb.co/Wv1yrFwC/image.png"
                className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />

              {/* Live Image Preview */}
              <div className="space-y-2">
                <label className="text-[11px] font-bold text-slate-400">Dark Mode Live Canvas Preview:</label>
                <div className="h-44 rounded-xl border border-slate-800 overflow-hidden relative bg-slate-950 flex items-center justify-center">
                  <div
                    className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-60"
                    style={{ backgroundImage: `url('${content.darkModeBgImage}')` }}
                  />
                  <div className="relative z-10 p-4 rounded-xl bg-slate-900/90 backdrop-blur-md shadow-lg border border-slate-800 text-center">
                    <p className="text-xs font-extrabold text-white">Renessans Learning Center</p>
                    <p className="text-[10px] text-slate-400">Dark Theme Pattern Background Active</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* B. HERO & METRIC STATS EDITOR */}
      {activeTab === 'hero' && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {/* Main Hero Form */}
          <div className="bg-white/90 dark:bg-slate-900/70 backdrop-blur-md border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-xl space-y-5">
            <h2 className="text-base font-extrabold text-slate-900 dark:text-white border-b border-slate-200 dark:border-slate-800 pb-3 flex items-center gap-2">
              <Layout className="w-4 h-4 text-amber-500" />
              <span>{t("Hero Section Content", "Hero Section Content", "Контент главного блока")}</span>
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Location Badge */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Location Badge Text (UZ)
                  </label>
                  <AIPolishButton
                    currentText={content.locationBadgeUz}
                    lang="uz"
                    onPolished={(txt) => handleChange('locationBadgeUz', txt)}
                  />
                </div>
                <input
                  type="text"
                  value={content.locationBadgeUz}
                  onChange={(e) => handleChange('locationBadgeUz', e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs focus:ring-2 focus:ring-amber-500"
                />
              </div>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Location Badge Text (EN)
                  </label>
                  <AIPolishButton
                    currentText={content.locationBadgeEn}
                    lang="en"
                    onPolished={(txt) => handleChange('locationBadgeEn', txt)}
                  />
                </div>
                <input
                  type="text"
                  value={content.locationBadgeEn}
                  onChange={(e) => handleChange('locationBadgeEn', e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs focus:ring-2 focus:ring-amber-500"
                />
              </div>

              {/* AI Pill Badge */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                    <Sparkles className="w-3 h-3" /> AI Pill Badge (UZ)
                  </label>
                  <AIPolishButton
                    currentText={content.aiBadgeUz || ''}
                    lang="uz"
                    onPolished={(txt) => handleChange('aiBadgeUz', txt)}
                  />
                </div>
                <input
                  type="text"
                  value={content.aiBadgeUz || ''}
                  onChange={(e) => handleChange('aiBadgeUz', e.target.value)}
                  placeholder="⚡ Keyingi Avlod 24/7 AI O'quv Murabbiyi bilan Quvvatlantirilgan"
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-emerald-500/30 text-xs focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                    <Sparkles className="w-3 h-3" /> AI Pill Badge (EN)
                  </label>
                  <AIPolishButton
                    currentText={content.aiBadgeEn || ''}
                    lang="en"
                    onPolished={(txt) => handleChange('aiBadgeEn', txt)}
                  />
                </div>
                <input
                  type="text"
                  value={content.aiBadgeEn || ''}
                  onChange={(e) => handleChange('aiBadgeEn', e.target.value)}
                  placeholder="⚡ Powered by Next-Gen 24/7 AI Learning Coach"
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-emerald-500/30 text-xs focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {/* Headlines */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Main Headline (UZ)
                  </label>
                  <AIPolishButton
                    currentText={content.heroTitleUz}
                    lang="uz"
                    onPolished={(txt) => handleChange('heroTitleUz', txt)}
                  />
                </div>
                <input
                  type="text"
                  value={content.heroTitleUz}
                  onChange={(e) => handleChange('heroTitleUz', e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-extrabold text-amber-500 focus:ring-2 focus:ring-amber-500"
                />
              </div>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Main Headline (EN)
                  </label>
                  <AIPolishButton
                    currentText={content.heroTitleEn}
                    lang="en"
                    onPolished={(txt) => handleChange('heroTitleEn', txt)}
                  />
                </div>
                <input
                  type="text"
                  value={content.heroTitleEn}
                  onChange={(e) => handleChange('heroTitleEn', e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-extrabold text-amber-500 focus:ring-2 focus:ring-amber-500"
                />
              </div>

              {/* Subtitles */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Subtitle (UZ)
                  </label>
                  <AIPolishButton
                    currentText={content.heroSubtitleUz}
                    lang="uz"
                    onPolished={(txt) => handleChange('heroSubtitleUz', txt)}
                  />
                </div>
                <textarea
                  rows={2}
                  value={content.heroSubtitleUz}
                  onChange={(e) => handleChange('heroSubtitleUz', e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs focus:ring-2 focus:ring-amber-500"
                />
              </div>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Subtitle (EN)
                  </label>
                  <AIPolishButton
                    currentText={content.heroSubtitleEn}
                    lang="en"
                    onPolished={(txt) => handleChange('heroSubtitleEn', txt)}
                  />
                </div>
                <textarea
                  rows={2}
                  value={content.heroSubtitleEn}
                  onChange={(e) => handleChange('heroSubtitleEn', e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs focus:ring-2 focus:ring-amber-500"
                />
              </div>

              {/* Description Paragraphs */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Description Paragraph (UZ)
                  </label>
                  <AIPolishButton
                    currentText={content.heroDescUz}
                    lang="uz"
                    onPolished={(txt) => handleChange('heroDescUz', txt)}
                  />
                </div>
                <textarea
                  rows={3}
                  value={content.heroDescUz}
                  onChange={(e) => handleChange('heroDescUz', e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs focus:ring-2 focus:ring-amber-500"
                />
              </div>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Description Paragraph (EN)
                  </label>
                  <AIPolishButton
                    currentText={content.heroDescEn}
                    lang="en"
                    onPolished={(txt) => handleChange('heroDescEn', txt)}
                  />
                </div>
                <textarea
                  rows={3}
                  value={content.heroDescEn}
                  onChange={(e) => handleChange('heroDescEn', e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  CTA Button Primary (UZ / EN)
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    value={content.ctaPrimaryUz}
                    onChange={(e) => handleChange('ctaPrimaryUz', e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs"
                    placeholder="Kurslarni ko'rish"
                  />
                  <input
                    type="text"
                    value={content.ctaPrimaryEn}
                    onChange={(e) => handleChange('ctaPrimaryEn', e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs"
                    placeholder="Explore Courses"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  CTA Button Secondary (UZ / EN)
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    value={content.ctaSecondaryUz}
                    onChange={(e) => handleChange('ctaSecondaryUz', e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs"
                    placeholder="Bog'lanish"
                  />
                  <input
                    type="text"
                    value={content.ctaSecondaryEn}
                    onChange={(e) => handleChange('ctaSecondaryEn', e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs"
                    placeholder="Get in Touch"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Metric Stats Cards Editor */}
          <div className="bg-white/90 dark:bg-slate-900/70 backdrop-blur-md border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
            <h2 className="text-base font-extrabold text-slate-900 dark:text-white border-b border-slate-200 dark:border-slate-800 pb-3 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-500" />
              <span>{t("Hero Metric Cards Editor", "Hero Metric Cards Editor", "Карточки статистики")}</span>
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 space-y-2">
                <p className="text-[11px] font-bold text-amber-500 uppercase">Card 1: Active Students</p>
                <input
                  type="text"
                  value={content.activeStudentsCount}
                  onChange={(e) => handleChange('activeStudentsCount', e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border text-base font-black text-amber-500 font-mono"
                  placeholder="1,500+"
                />
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 space-y-2">
                <p className="text-[11px] font-bold text-amber-500 uppercase">Card 2: IELTS 7.0+ Results</p>
                <input
                  type="text"
                  value={content.ieltsHighResults}
                  onChange={(e) => handleChange('ieltsHighResults', e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border text-base font-black text-amber-500 font-mono"
                  placeholder="280+"
                />
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 space-y-2">
                <p className="text-[11px] font-bold text-amber-500 uppercase">Card 3: University Rate</p>
                <input
                  type="text"
                  value={content.admissionRate}
                  onChange={(e) => handleChange('admissionRate', e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border text-base font-black text-amber-500 font-mono"
                  placeholder="95%"
                />
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 space-y-2">
                <p className="text-[11px] font-bold text-amber-500 uppercase">Card 4: Experience</p>
                <input
                  type="text"
                  value={content.yearsExperience}
                  onChange={(e) => handleChange('yearsExperience', e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border text-base font-black text-amber-500 font-mono"
                  placeholder="4+ Yil"
                />
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* C. WHY RENESSANS MANAGER */}
      {activeTab === 'why' && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/90 dark:bg-slate-900/70 backdrop-blur-md border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-xl space-y-6"
        >
          <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
            <div>
              <h2 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-amber-500" />
                <span>{t('"Nega Aynan Renessans?" Manager', '"Why Renessans?" Manager', 'Менеджер карточек "Почему Renessans?"')}</span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {t("Afzalliklar ro'yxatini va har bir kartaning matnini tahrirlang", "Add, edit, or remove value proposition cards on the public landing page", "Редактирование ключевых преимуществ")}
              </p>
            </div>
            <button
              onClick={() => {
                const newCard: WhyRenessansCard = {
                  id: `w_${Date.now()}`,
                  iconNumber: content.whyRenessans.length + 1,
                  titleUz: 'Yangi Afzallik',
                  titleEn: 'New Value Proposition',
                  descUz: "Tavsif matnini kiritishingiz mumkin.",
                  descEn: 'Description of the feature.'
                };
                handleChange('whyRenessans', [...content.whyRenessans, newCard]);
              }}
              className="px-4 py-2 rounded-xl bg-amber-500 text-slate-950 text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow"
            >
              <Plus className="w-4 h-4" />
              <span>{t("Karta Qo'shish", "Add Feature Card", "Добавить карту")}</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {content.whyRenessans.map((card, idx) => (
              <div
                key={card.id}
                className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 space-y-3 relative group"
              >
                <div className="flex items-center justify-between">
                  <span className="w-7 h-7 rounded-lg bg-amber-500 text-slate-950 font-black text-xs flex items-center justify-center">
                    {idx + 1}
                  </span>
                  <button
                    onClick={() => {
                      const updated = content.whyRenessans.filter((w) => w.id !== card.id);
                      handleChange('whyRenessans', updated);
                    }}
                    className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-500/10 transition cursor-pointer"
                    title="Delete card"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-500">Title (UZ / EN):</label>
                  <div className="grid grid-cols-2 gap-2 mt-1">
                    <input
                      type="text"
                      value={card.titleUz}
                      onChange={(e) => {
                        const updated = content.whyRenessans.map((w) => (w.id === card.id ? { ...w, titleUz: e.target.value } : w));
                        handleChange('whyRenessans', updated);
                      }}
                      className="px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border text-xs font-bold"
                      placeholder="Title UZ"
                    />
                    <input
                      type="text"
                      value={card.titleEn}
                      onChange={(e) => {
                        const updated = content.whyRenessans.map((w) => (w.id === card.id ? { ...w, titleEn: e.target.value } : w));
                        handleChange('whyRenessans', updated);
                      }}
                      className="px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border text-xs font-bold"
                      placeholder="Title EN"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-500">Description (UZ / EN):</label>
                  <div className="grid grid-cols-2 gap-2 mt-1">
                    <textarea
                      rows={2}
                      value={card.descUz}
                      onChange={(e) => {
                        const updated = content.whyRenessans.map((w) => (w.id === card.id ? { ...w, descUz: e.target.value } : w));
                        handleChange('whyRenessans', updated);
                      }}
                      className="px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border text-xs"
                      placeholder="Desc UZ"
                    />
                    <textarea
                      rows={2}
                      value={card.descEn}
                      onChange={(e) => {
                        const updated = content.whyRenessans.map((w) => (w.id === card.id ? { ...w, descEn: e.target.value } : w));
                        handleChange('whyRenessans', updated);
                      }}
                      className="px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border text-xs"
                      placeholder="Desc EN"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* D. MENTORS ROSTER CMS */}
      {activeTab === 'teachers' && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/90 dark:bg-slate-900/70 backdrop-blur-md border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-xl space-y-6"
        >
          <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
            <div>
              <h2 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                <Users className="w-5 h-5 text-amber-500" />
                <span>{t("Renessans Mentors Roster CMS", "Renessans Mentors Roster CMS", "CMS Преподавателей")}</span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {t("O'qituvchilar rasmi, ismi, lavozimi va tajribasini boshqaring", "Manage teacher profile cards shown on landing page roster", "Управление профилями преподавателей")}
              </p>
            </div>
            <button
              onClick={() => {
                const newTeacher: Teacher = {
                  id: `t_${Date.now()}`,
                  name: 'Yangi O\'qituvchi',
                  role: 'Senior IELTS Instructor',
                  badge: 'IELTS 8.0',
                  experience: '4+ Yillik tajriba',
                  bioUz: "Tavsif va metodikalar...",
                  bioEn: "Specialist instructor biography...",
                  image: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=400',
                  specialization: ['Writing Task 2', 'Reading'],
                  resultsCount: 150
                };
                handleChange('teachers', [...content.teachers, newTeacher]);
              }}
              className="px-4 py-2 rounded-xl bg-amber-500 text-slate-950 text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow"
            >
              <Plus className="w-4 h-4" />
              <span>{t("Ustoz Qo'shish", "Add Teacher Profile", "Добавить учителя")}</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {content.teachers.map((tItem) => (
              <div
                key={tItem.id}
                className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 space-y-4 flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <img
                      src={tItem.image}
                      alt={tItem.name}
                      referrerPolicy="no-referrer"
                      className="w-14 h-14 rounded-2xl object-cover shrink-0 border-2 border-amber-500/40"
                    />
                    <div className="overflow-hidden flex-1">
                      <input
                        type="text"
                        value={tItem.name}
                        onChange={(e) => {
                          const updated = content.teachers.map((t) => (t.id === tItem.id ? { ...t, name: e.target.value } : t));
                          handleChange('teachers', updated);
                        }}
                        className="w-full px-2 py-1 rounded bg-white dark:bg-slate-900 border text-xs font-extrabold"
                        placeholder="Teacher Name"
                      />
                      <input
                        type="text"
                        value={tItem.role}
                        onChange={(e) => {
                          const updated = content.teachers.map((t) => (t.id === tItem.id ? { ...t, role: e.target.value } : t));
                          handleChange('teachers', updated);
                        }}
                        className="w-full px-2 py-1 rounded bg-white dark:bg-slate-900 border text-[11px] font-bold text-amber-500 mt-1"
                        placeholder="Role / Title"
                      />
                    </div>
                    <button
                      onClick={() => {
                        const updated = content.teachers.filter((t) => t.id !== tItem.id);
                        handleChange('teachers', updated);
                      }}
                      className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-500/10 transition cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Photo Image URL:</label>
                    <input
                      type="text"
                      value={tItem.image}
                      onChange={(e) => {
                        const updated = content.teachers.map((t) => (t.id === tItem.id ? { ...t, image: e.target.value } : t));
                        handleChange('teachers', updated);
                      }}
                      className="w-full px-2 py-1 rounded bg-white dark:bg-slate-900 border text-[10px] font-mono mt-0.5"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 uppercase">Score Badge:</label>
                      <input
                        type="text"
                        value={tItem.badge}
                        onChange={(e) => {
                          const updated = content.teachers.map((t) => (t.id === tItem.id ? { ...t, badge: e.target.value } : t));
                          handleChange('teachers', updated);
                        }}
                        className="w-full px-2 py-1 rounded bg-white dark:bg-slate-900 border text-xs font-mono font-bold text-amber-500"
                        placeholder="IELTS 8.5"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 uppercase">Experience:</label>
                      <input
                        type="text"
                        value={tItem.experience}
                        onChange={(e) => {
                          const updated = content.teachers.map((t) => (t.id === tItem.id ? { ...t, experience: e.target.value } : t));
                          handleChange('teachers', updated);
                        }}
                        className="w-full px-2 py-1 rounded bg-white dark:bg-slate-900 border text-xs"
                        placeholder="6+ Yillik tajriba"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Bio (UZ):</label>
                    <textarea
                      rows={2}
                      value={tItem.bioUz}
                      onChange={(e) => {
                        const updated = content.teachers.map((t) => (t.id === tItem.id ? { ...t, bioUz: e.target.value } : t));
                        handleChange('teachers', updated);
                      }}
                      className="w-full px-2 py-1 rounded bg-white dark:bg-slate-900 border text-xs"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Specializations (Comma separated):</label>
                    <input
                      type="text"
                      value={tItem.specialization.join(', ')}
                      onChange={(e) => {
                        const specs = e.target.value.split(',').map((s) => s.trim()).filter(Boolean);
                        const updated = content.teachers.map((t) => (t.id === tItem.id ? { ...t, specialization: specs } : t));
                        handleChange('teachers', updated);
                      }}
                      className="w-full px-2 py-1 rounded bg-white dark:bg-slate-900 border text-xs"
                    />
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-200 dark:border-slate-700/60 flex items-center justify-between text-xs">
                  <span className="text-[11px] font-bold text-slate-500">Student Results Count:</span>
                  <input
                    type="number"
                    value={tItem.resultsCount}
                    onChange={(e) => {
                      const updated = content.teachers.map((t) => (t.id === tItem.id ? { ...t, resultsCount: Number(e.target.value) } : t));
                      handleChange('teachers', updated);
                    }}
                    className="w-20 px-2 py-1 rounded bg-white dark:bg-slate-900 border text-xs font-mono font-bold text-emerald-500"
                  />
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* E. STUDENT ACHIEVEMENTS & BAND SCORES CMS */}
      {activeTab === 'results' && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/90 dark:bg-slate-900/70 backdrop-blur-md border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-xl space-y-6"
        >
          <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
            <div>
              <h2 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                <Award className="w-5 h-5 text-amber-500" />
                <span>{t("Student Achievements & Verified Band Scores CMS", "Student Achievements & Verified Band Scores CMS", "CMS Результатов Студентов")}</span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {t("O'quvchilar IELTS/CEFR sertifikat natijalari hamda bo'lim ballarini kiritib boring", "Log verified IELTS/CEFR band score achievements displayed on public site", "Добавление результатов сертификатов")}
              </p>
            </div>
            <button
              onClick={() => {
                const newRes: StudentResult = {
                  id: `res_${Date.now()}`,
                  studentName: "Azizbek Karimov",
                  testType: "IELTS",
                  score: "8.0",
                  date: "Fevral 2026",
                  overall: 8.0,
                  listening: 8.5,
                  reading: 8.5,
                  writing: 7.5,
                  speaking: 7.5,
                  teacherName: "Jasur Rahimov",
                  badge: "IELTS 8.0"
                };
                handleChange('results', [...content.results, newRes]);
              }}
              className="px-4 py-2 rounded-xl bg-amber-500 text-slate-950 text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow"
            >
              <Plus className="w-4 h-4" />
              <span>{t("Natija Qo'shish", "Add Student Score Result", "Добавить результат")}</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {content.results.map((res) => (
              <div
                key={res.id}
                className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <input
                    type="text"
                    value={res.badge}
                    onChange={(e) => {
                      const updated = content.results.map((r) => (r.id === res.id ? { ...r, badge: e.target.value } : r));
                      handleChange('results', updated);
                    }}
                    className="w-28 px-2 py-0.5 rounded bg-amber-500/20 text-amber-500 border border-amber-500/30 text-xs font-black font-mono"
                  />
                  <button
                    onClick={() => {
                      const updated = content.results.filter((r) => r.id !== res.id);
                      handleChange('results', updated);
                    }}
                    className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-500/10 transition cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Student Name:</label>
                  <input
                    type="text"
                    value={res.studentName}
                    onChange={(e) => {
                      const updated = content.results.map((r) => (r.id === res.id ? { ...r, studentName: e.target.value } : r));
                      handleChange('results', updated);
                    }}
                    className="w-full px-2 py-1 rounded bg-white dark:bg-slate-900 border text-xs font-extrabold mt-0.5"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Date:</label>
                    <input
                      type="text"
                      value={res.date}
                      onChange={(e) => {
                        const updated = content.results.map((r) => (r.id === res.id ? { ...r, date: e.target.value } : r));
                        handleChange('results', updated);
                      }}
                      className="w-full px-2 py-1 rounded bg-white dark:bg-slate-900 border text-xs"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Instructor Name:</label>
                    <input
                      type="text"
                      value={res.teacherName}
                      onChange={(e) => {
                        const updated = content.results.map((r) => (r.id === res.id ? { ...r, teacherName: e.target.value } : r));
                        handleChange('results', updated);
                      }}
                      className="w-full px-2 py-1 rounded bg-white dark:bg-slate-900 border text-xs"
                    />
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-200 dark:border-slate-700/60">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Sub-scores (L, R, W, S):</label>
                  <div className="grid grid-cols-4 gap-1.5 mt-1 text-center">
                    <div>
                      <span className="text-[9px] text-slate-400">L</span>
                      <input
                        type="text"
                        value={res.listening}
                        onChange={(e) => {
                          const updated = content.results.map((r) => (r.id === res.id ? { ...r, listening: e.target.value } : r));
                          handleChange('results', updated);
                        }}
                        className="w-full px-1 py-1 rounded bg-white dark:bg-slate-900 border text-xs font-mono font-bold text-center"
                      />
                    </div>
                    <div>
                      <span className="text-[9px] text-slate-400">R</span>
                      <input
                        type="text"
                        value={res.reading}
                        onChange={(e) => {
                          const updated = content.results.map((r) => (r.id === res.id ? { ...r, reading: e.target.value } : r));
                          handleChange('results', updated);
                        }}
                        className="w-full px-1 py-1 rounded bg-white dark:bg-slate-900 border text-xs font-mono font-bold text-center"
                      />
                    </div>
                    <div>
                      <span className="text-[9px] text-slate-400">W</span>
                      <input
                        type="text"
                        value={res.writing}
                        onChange={(e) => {
                          const updated = content.results.map((r) => (r.id === res.id ? { ...r, writing: e.target.value } : r));
                          handleChange('results', updated);
                        }}
                        className="w-full px-1 py-1 rounded bg-white dark:bg-slate-900 border text-xs font-mono font-bold text-center"
                      />
                    </div>
                    <div>
                      <span className="text-[9px] text-slate-400">S</span>
                      <input
                        type="text"
                        value={res.speaking}
                        onChange={(e) => {
                          const updated = content.results.map((r) => (r.id === res.id ? { ...r, speaking: e.target.value } : r));
                          handleChange('results', updated);
                        }}
                        className="w-full px-1 py-1 rounded bg-white dark:bg-slate-900 border text-xs font-mono font-bold text-center"
                      />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* F. TOP ACHIEVERS & REVIEWS CMS */}
      {activeTab === 'reviews' && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/90 dark:bg-slate-900/70 backdrop-blur-md border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-xl space-y-6"
        >
          <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
            <div>
              <h2 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                <Star className="w-5 h-5 text-amber-500" />
                <span>{t("Top Achievers & Reviews CMS", "Top Achievers & Reviews CMS", "CMS Отзывов и Успешных Выпускников")}</span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {t("O'quvchilar fikrlari hamda kirgan OTMlarini tahrirlang", "Manage testimonials and university admission stories shown in carousel", "Отзывы и поступившие ВУЗы")}
              </p>
            </div>
            <button
              onClick={() => {
                const newRev: LandingTestimonial = {
                  id: `rev_${Date.now()}`,
                  quoteUz: "Ajoyib o'quv markaz! Ustozlar juda ham mehribon.",
                  quoteEn: "Amazing learning experience and supportive tutors!",
                  studentName: "Shahzoda Rahimova",
                  scoreBadge: "IELTS 8.0",
                  targetCourse: "IELTS Intensive",
                  university: "INHA University Tashkent",
                  photoUrl: "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&q=80&w=200"
                };
                handleChange('testimonials', [...content.testimonials, newRev]);
              }}
              className="px-4 py-2 rounded-xl bg-amber-500 text-slate-950 text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow"
            >
              <Plus className="w-4 h-4" />
              <span>{t("Izoh Qo'shish", "Add Review Testimonial", "Добавить отзыв")}</span>
            </button>
          </div>

          {/* Section Header Controls */}
          <div className="p-4 rounded-2xl bg-amber-500/5 border border-amber-500/20 space-y-3">
            <h3 className="text-xs font-black uppercase tracking-wider text-amber-600 dark:text-amber-400">
              Reviews Section Custom Header & Subtitle
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                    Section Title (UZ)
                  </label>
                  <AIPolishButton
                    currentText={content.reviewSectionTitleUz || ''}
                    lang="uz"
                    onPolished={(txt) => handleChange('reviewSectionTitleUz', txt)}
                  />
                </div>
                <input
                  type="text"
                  value={content.reviewSectionTitleUz || ''}
                  onChange={(e) => handleChange('reviewSectionTitleUz', e.target.value)}
                  placeholder="100% Tasdiqlangan Natijalar va Talabalar Muvaffaqiyat Tarixlari"
                  className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-bold"
                />
              </div>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                    Section Title (EN)
                  </label>
                  <AIPolishButton
                    currentText={content.reviewSectionTitleEn || ''}
                    lang="en"
                    onPolished={(txt) => handleChange('reviewSectionTitleEn', txt)}
                  />
                </div>
                <input
                  type="text"
                  value={content.reviewSectionTitleEn || ''}
                  onChange={(e) => handleChange('reviewSectionTitleEn', e.target.value)}
                  placeholder="100% Verified Results & Student Success Stories"
                  className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-bold"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                    Section Subtitle (UZ)
                  </label>
                  <AIPolishButton
                    currentText={content.reviewSectionSubtitleUz || ''}
                    lang="uz"
                    onPolished={(txt) => handleChange('reviewSectionSubtitleUz', txt)}
                  />
                </div>
                <textarea
                  rows={2}
                  value={content.reviewSectionSubtitleUz || ''}
                  onChange={(e) => handleChange('reviewSectionSubtitleUz', e.target.value)}
                  placeholder="Renessans Learning Center bitiruvchilarining erishgan rasmiy ballari"
                  className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs"
                />
              </div>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                    Section Subtitle (EN)
                  </label>
                  <AIPolishButton
                    currentText={content.reviewSectionSubtitleEn || ''}
                    lang="en"
                    onPolished={(txt) => handleChange('reviewSectionSubtitleEn', txt)}
                  />
                </div>
                <textarea
                  rows={2}
                  value={content.reviewSectionSubtitleEn || ''}
                  onChange={(e) => handleChange('reviewSectionSubtitleEn', e.target.value)}
                  placeholder="Real reviews and official band scores from Renessans Learning Center graduates."
                  className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {content.testimonials.map((item) => (
              <div
                key={item.id}
                className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-amber-500">{item.scoreBadge}</span>
                  <button
                    onClick={() => {
                      const updated = content.testimonials.filter((t) => t.id !== item.id);
                      handleChange('testimonials', updated);
                    }}
                    className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-500/10 transition cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Student Name:</label>
                    <input
                      type="text"
                      value={item.studentName}
                      onChange={(e) => {
                        const updated = content.testimonials.map((t) => (t.id === item.id ? { ...t, studentName: e.target.value } : t));
                        handleChange('testimonials', updated);
                      }}
                      className="w-full px-2 py-1 rounded bg-white dark:bg-slate-900 border text-xs font-extrabold"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Admitted University:</label>
                    <input
                      type="text"
                      value={item.university}
                      onChange={(e) => {
                        const updated = content.testimonials.map((t) => (t.id === item.id ? { ...t, university: e.target.value } : t));
                        handleChange('testimonials', updated);
                      }}
                      className="w-full px-2 py-1 rounded bg-white dark:bg-slate-900 border text-xs text-emerald-500 font-bold"
                      placeholder="Westminster Int. University"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Review Quote (UZ):</label>
                    <AIPolishButton
                      currentText={item.quoteUz}
                      lang="uz"
                      onPolished={(txt) => {
                        const updated = content.testimonials.map((t) => (t.id === item.id ? { ...t, quoteUz: txt } : t));
                        handleChange('testimonials', updated);
                      }}
                    />
                  </div>
                  <textarea
                    rows={2}
                    value={item.quoteUz}
                    onChange={(e) => {
                      const updated = content.testimonials.map((t) => (t.id === item.id ? { ...t, quoteUz: e.target.value } : t));
                      handleChange('testimonials', updated);
                    }}
                    className="w-full px-2 py-1 rounded bg-white dark:bg-slate-900 border text-xs"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Review Quote (EN):</label>
                    <AIPolishButton
                      currentText={item.quoteEn}
                      lang="en"
                      onPolished={(txt) => {
                        const updated = content.testimonials.map((t) => (t.id === item.id ? { ...t, quoteEn: txt } : t));
                        handleChange('testimonials', updated);
                      }}
                    />
                  </div>
                  <textarea
                    rows={2}
                    value={item.quoteEn}
                    onChange={(e) => {
                      const updated = content.testimonials.map((t) => (t.id === item.id ? { ...t, quoteEn: e.target.value } : t));
                      handleChange('testimonials', updated);
                    }}
                    className="w-full px-2 py-1 rounded bg-white dark:bg-slate-900 border text-xs"
                  />
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* G. COURSES & PRICING PLANS CMS */}
      {activeTab === 'courses' && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/90 dark:bg-slate-900/70 backdrop-blur-md border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-xl space-y-6"
        >
          <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
            <div>
              <h2 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-amber-500" />
                <span>{t("Courses & Pricing Plans CMS", "Courses & Pricing Plans CMS", "CMS Курсов и Тарифов")}</span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {t("Kurs nomlari, oylik to'lov summalari va imkoniyatlar ro'yxatini tahrirlang", "Full CRUD manager for course titles, monthly fees, and bulleted feature lists", "Управление тарифами и описанием курсов")}
              </p>
            </div>
            <button
              onClick={() => {
                const newCourse: Course = {
                  id: `c_${Date.now()}`,
                  titleUz: "Master Speaking & Grammar",
                  titleEn: "Master Speaking & Grammar",
                  descUz: "Erkin so'zlashuv va amaliy grammatika kursi.",
                  descEn: "Intensive spoken fluency and active grammar drills.",
                  durationUz: "2 Oylik",
                  durationEn: "2 Months",
                  levelUz: "A2 - B2 Daraja",
                  levelEn: "A2 - B2 Level",
                  priceUz: "380,000 so'm/oy",
                  priceEn: "380,000 UZS/month",
                  featuresUz: ["Haftada 3 kun 2 soat dars", "Speaking club", "Materiallar bepul"],
                  featuresEn: ["3 core lessons per week", "Free speaking club", "Free study materials"],
                  iconName: "BookOpen",
                  isPopular: false
                };
                handleChange('courses', [...content.courses, newCourse]);
              }}
              className="px-4 py-2 rounded-xl bg-amber-500 text-slate-950 text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow"
            >
              <Plus className="w-4 h-4" />
              <span>{t("Kurs Qo'shish", "Add Course Plan", "Добавить курс")}</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {content.courses.map((course) => (
              <div
                key={course.id}
                className={`p-6 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border space-y-4 ${
                  course.isPopular ? 'border-amber-500 ring-1 ring-amber-500/30' : 'border-slate-200 dark:border-slate-700/60'
                }`}
              >
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 text-xs font-bold text-amber-500 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={!!course.isPopular}
                      onChange={(e) => {
                        const updated = content.courses.map((c) => (c.id === course.id ? { ...c, isPopular: e.target.checked } : c));
                        handleChange('courses', updated);
                      }}
                      className="rounded accent-amber-500"
                    />
                    <span>{t("Eng ommabop (Highlight Most Popular)", "Most Popular Highlight", "Самый популярный")}</span>
                  </label>
                  <button
                    onClick={() => {
                      const updated = content.courses.filter((c) => c.id !== course.id);
                      handleChange('courses', updated);
                    }}
                    className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-500/10 transition cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Title UZ:</label>
                    <input
                      type="text"
                      value={course.titleUz}
                      onChange={(e) => {
                        const updated = content.courses.map((c) => (c.id === course.id ? { ...c, titleUz: e.target.value } : c));
                        handleChange('courses', updated);
                      }}
                      className="w-full px-2 py-1 rounded bg-white dark:bg-slate-900 border text-xs font-extrabold"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Title EN:</label>
                    <input
                      type="text"
                      value={course.titleEn}
                      onChange={(e) => {
                        const updated = content.courses.map((c) => (c.id === course.id ? { ...c, titleEn: e.target.value } : c));
                        handleChange('courses', updated);
                      }}
                      className="w-full px-2 py-1 rounded bg-white dark:bg-slate-900 border text-xs font-extrabold"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Monthly Fee UZ:</label>
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
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Monthly Fee EN:</label>
                    <input
                      type="text"
                      value={course.priceEn}
                      onChange={(e) => {
                        const updated = content.courses.map((c) => (c.id === course.id ? { ...c, priceEn: e.target.value } : c));
                        handleChange('courses', updated);
                      }}
                      className="w-full px-2 py-1 rounded bg-white dark:bg-slate-900 border text-xs font-mono font-bold text-emerald-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Duration UZ / EN:</label>
                    <input
                      type="text"
                      value={course.durationUz}
                      onChange={(e) => {
                        const updated = content.courses.map((c) => (c.id === course.id ? { ...c, durationUz: e.target.value } : c));
                        handleChange('courses', updated);
                      }}
                      className="w-full px-2 py-1 rounded bg-white dark:bg-slate-900 border text-xs"
                      placeholder="3-6 Oylik"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Target Level UZ / EN:</label>
                    <input
                      type="text"
                      value={course.levelUz}
                      onChange={(e) => {
                        const updated = content.courses.map((c) => (c.id === course.id ? { ...c, levelUz: e.target.value } : c));
                        handleChange('courses', updated);
                      }}
                      className="w-full px-2 py-1 rounded bg-white dark:bg-slate-900 border text-xs"
                      placeholder="A1 - C1"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Bulleted Features List (One per line):</label>
                  <textarea
                    rows={4}
                    value={course.featuresUz.join('\n')}
                    onChange={(e) => {
                      const list = e.target.value.split('\n').filter((s) => s.trim().length > 0);
                      const updated = content.courses.map((c) => (c.id === course.id ? { ...c, featuresUz: list, featuresEn: list } : c));
                      handleChange('courses', updated);
                    }}
                    className="w-full px-2 py-1 rounded bg-white dark:bg-slate-900 border text-xs leading-relaxed"
                  />
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* H. LOCATION, FAQ & FOOTER CONTACT INFORMATION */}
      {activeTab === 'contact' && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/90 dark:bg-slate-900/70 backdrop-blur-md border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-xl space-y-6"
        >
          <div className="border-b border-slate-200 dark:border-slate-800 pb-4">
            <h2 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
              <MapPin className="w-5 h-5 text-amber-500" />
              <span>{t("Location, FAQ & Footer Contact Information", "Location, FAQ & Footer Contact Information", "Контакты, Карта и FAQ")}</span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {t("Manzil, telefon raqami, telegram va ish vaqtlarini tahrirlang", "Update location branch address, telephone, telegram username & operating hours", "Настройка контактов и локации")}
            </p>
          </div>

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
                Branch Address (EN)
              </label>
              <input
                type="text"
                value={content.addressEn}
                onChange={(e) => handleChange('addressEn', e.target.value)}
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
                placeholder="+998 90 123 45 67"
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
                placeholder="@renessans_lc_official"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Operating Hours (UZ)
              </label>
              <input
                type="text"
                value={content.operatingHoursUz}
                onChange={(e) => handleChange('operatingHoursUz', e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border text-xs"
                placeholder="Ish vaqti: Dushanba - Shanba 08:00 - 20:00"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Google Maps Embed / Link URL
              </label>
              <input
                type="text"
                value={content.googleMapsUrl}
                onChange={(e) => handleChange('googleMapsUrl', e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border text-xs font-mono"
                placeholder="https://maps.google.com"
              />
            </div>
          </div>
        </motion.div>
      )}

      {/* LIVE PREVIEW TAB */}
      {activeTab === 'preview' && (
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="p-6 rounded-3xl bg-slate-950 border border-slate-800 text-white space-y-6"
        >
          <div className="flex items-center justify-between pb-4 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <Eye className="w-5 h-5 text-emerald-400" />
              <h2 className="text-base font-extrabold text-white">Live Public Landing Page Preview</h2>
            </div>
            <a
              href="/"
              target="_blank"
              rel="noreferrer"
              className="px-4 py-2 rounded-xl bg-amber-500 text-slate-950 font-extrabold text-xs shadow hover:bg-amber-400 transition"
            >
              Open Site in New Tab ↗
            </a>
          </div>

          <div className="rounded-2xl border border-slate-800 overflow-hidden bg-slate-900 p-6 space-y-8">
            <div className="text-center space-y-3">
              <span className="inline-block px-3 py-1 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 text-xs font-bold">
                {content.locationBadgeUz}
              </span>
              <h1 className="text-3xl font-black text-amber-500">{content.heroTitleUz}</h1>
              <p className="text-sm text-slate-300 max-w-xl mx-auto">{content.heroSubtitleUz}</p>
            </div>

            {/* Metric Stats preview */}
            <div className="grid grid-cols-4 gap-3">
              <div className="p-3 rounded-xl bg-slate-800 text-center">
                <p className="text-lg font-black text-amber-500">{content.activeStudentsCount}</p>
                <p className="text-[10px] text-slate-400">Students</p>
              </div>
              <div className="p-3 rounded-xl bg-slate-800 text-center">
                <p className="text-lg font-black text-amber-500">{content.ieltsHighResults}</p>
                <p className="text-[10px] text-slate-400">IELTS 7.0+</p>
              </div>
              <div className="p-3 rounded-xl bg-slate-800 text-center">
                <p className="text-lg font-black text-amber-500">{content.admissionRate}</p>
                <p className="text-[10px] text-slate-400">Admission</p>
              </div>
              <div className="p-3 rounded-xl bg-slate-800 text-center">
                <p className="text-lg font-black text-amber-500">{content.yearsExperience}</p>
                <p className="text-[10px] text-slate-400">Experience</p>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Fixed Sticky Publish Bar at bottom */}
      <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-30 px-6 py-3 rounded-2xl bg-slate-900/90 backdrop-blur-md border border-slate-800 text-white shadow-2xl flex items-center gap-4">
        <span className="text-xs font-bold text-slate-300 flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
          {hasUnsavedChanges ? t("Tahrirlangan ma'lumotlar saqlanishi kutilmoqda", "Pending edits ready to publish", "Есть несохраненные изменения") : t("Barcha o'zgarishlar sinxronlangan", "All changes published live", "Все изменения опубликованы")}
        </span>
        <button
          onClick={handlePublish}
          disabled={isPublishing}
          className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black shadow-lg shadow-amber-500/20 transition cursor-pointer"
        >
          {isPublishing ? t("Chop etilmoqda...", "Publishing...", "Публикация...") : t("🚀 Publish Changes Live", "🚀 Publish Changes Live", "🚀 Опубликовать")}
        </button>
      </div>
    </div>
  );
};
