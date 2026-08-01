import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { useLanguage } from '../../context/LanguageContext';
import {
  LandingPageContent,
  Course,
  Inquiry,
  Student,
  Group
} from '../../types';
import {
  subscribeLandingPageContent,
  publishLandingPageContent,
  DEFAULT_LANDING_PAGE_CONTENT
} from '../../services/landingCms';
import {
  subscribeInquiries,
  updateInquiryStatus,
  convertInquiryToStudentBatch,
  subscribeGroups
} from '../../services/firestore';
import {
  LayoutTemplate,
  BookOpen,
  PhoneCall,
  Megaphone,
  Plus,
  Trash2,
  Edit,
  Eye,
  EyeOff,
  CheckCircle2,
  Clock,
  XCircle,
  UserPlus,
  Send,
  Phone,
  Search,
  Filter,
  Sparkles,
  Save,
  RefreshCw,
  ExternalLink,
  Layers,
  Loader2,
  DollarSign,
  Tag,
  Check,
  X,
  MessageSquare,
  Globe,
  Award,
  Zap,
  Code,
  Calculator,
  GraduationCap
} from 'lucide-react';

export const LandingCMSAdmin: React.FC = () => {
  const { language } = useLanguage();

  const t = (uz: string, en: string, ru: string) => {
    if (language === 'UZ') return uz;
    if (language === 'RU') return ru;
    return en;
  };

  // Main 3 Tabs
  const [activeTab, setActiveTab] = useState<'courses' | 'inquiries' | 'banners'>('courses');

  // Landing Page CMS Content state
  const [content, setContent] = useState<LandingPageContent>(DEFAULT_LANDING_PAGE_CONTENT);
  const [isSaving, setIsSaving] = useState(false);
  const [hasUnsavedEdits, setHasUnsavedEdits] = useState(false);

  // Inquiries & Groups State
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [inquiriesLoading, setInquiriesLoading] = useState(true);

  // Inquiries Filter State
  const [inquirySearch, setInquirySearch] = useState('');
  const [inquiryStatusFilter, setInquiryStatusFilter] = useState<'all' | 'new' | 'contacted' | 'enrolled' | 'dismissed'>('all');

  // Course Modal State (Tab A)
  const [isCourseModalOpen, setIsCourseModalOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);

  // Course Form Fields
  const [courseTitleUz, setCourseTitleUz] = useState('');
  const [courseTitleEn, setCourseTitleEn] = useState('');
  const [courseTitleRu, setCourseTitleRu] = useState('');
  const [courseDescUz, setCourseDescUz] = useState('');
  const [courseDescEn, setCourseDescEn] = useState('');
  const [courseDescRu, setCourseDescRu] = useState('');
  const [courseDurationUz, setCourseDurationUz] = useState('3 oy / 3x haftasiga');
  const [courseDurationEn, setCourseDurationEn] = useState('3 months / 3x weekly');
  const [courseLevelUz, setCourseLevelUz] = useState('Boshlang\'ich - Yuqori');
  const [courseLevelEn, setCourseLevelEn] = useState('Beginner to Advanced');
  const [coursePriceUz, setCoursePriceUz] = useState('650,000 UZS / oy');
  const [coursePriceEn, setCoursePriceEn] = useState('650,000 UZS / mo');
  const [courseFeaturesUz, setCourseFeaturesUz] = useState<string[]>(['Audio Drills', 'Code IDE', 'Mock Exams']);
  const [courseFeaturesEn, setCourseFeaturesEn] = useState<string[]>(['Audio Drills', 'Code IDE', 'Mock Exams']);
  const [newFeatureInput, setNewFeatureInput] = useState('');
  const [courseIcon, setCourseIcon] = useState('BookOpen');
  const [courseIsPopular, setCourseIsPopular] = useState(false);

  // Convert Lead Modal State (Tab B)
  const [convertingInquiry, setConvertingInquiry] = useState<Inquiry | null>(null);
  const [selectedGroupId, setSelectedGroupId] = useState('');
  const [studentTuitionFee, setStudentTuitionFee] = useState('650000');
  const [isConverting, setIsConverting] = useState(false);

  // Toast Notification Message
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Subscribe to Landing CMS Content and Inquiries / Groups
  useEffect(() => {
    let isMounted = true;

    const unsubCMS = subscribeLandingPageContent((data) => {
      if (isMounted) setContent(data);
    });

    const unsubInquiries = subscribeInquiries((data) => {
      if (isMounted) {
        setInquiries(data);
        setInquiriesLoading(false);
      }
    });

    const unsubGroups = subscribeGroups((data) => {
      if (isMounted) {
        setGroups(data);
        if (data.length > 0 && !selectedGroupId) {
          setSelectedGroupId(data[0].id);
        }
      }
    });

    return () => {
      isMounted = false;
      unsubCMS();
      unsubInquiries();
      unsubGroups();
    };
  }, []);

  // Save Landing Content to Firestore
  const handleSaveCMS = async () => {
    setIsSaving(true);
    try {
      await publishLandingPageContent(content);
      setHasUnsavedEdits(false);
      showToast(
        t(
          "🚀 Lendlng sahifa o'zgarishlari va bannerlar Firestore ga saqlandi va nashr qilindi!",
          "🚀 Landing page configuration and banners published to Firestore!",
          "🚀 Изменения лендинга и баннеры сохранены в Firestore!"
        )
      );
    } catch (err) {
      console.error(err);
      showToast(t("Saqlashda xatolik yuz berdi!", "Failed to save CMS config.", "Ошибка сохранения!"));
    } finally {
      setIsSaving(false);
    }
  };

  // TAB A: COURSE CATALOG ACTIONS
  const handleOpenCourseModal = (course?: Course) => {
    if (course) {
      setEditingCourse(course);
      setCourseTitleUz(course.titleUz || '');
      setCourseTitleEn(course.titleEn || '');
      setCourseTitleRu(course.titleRu || '');
      setCourseDescUz(course.descUz || '');
      setCourseDescEn(course.descEn || '');
      setCourseDescRu(course.descRu || '');
      setCourseDurationUz(course.durationUz || '3 oy / 3x haftasiga');
      setCourseDurationEn(course.durationEn || '3 months / 3x weekly');
      setCourseLevelUz(course.levelUz || 'Boshlang\'ich - Yuqori');
      setCourseLevelEn(course.levelEn || 'Beginner to Advanced');
      setCoursePriceUz(course.priceUz || '650,000 UZS / oy');
      setCoursePriceEn(course.priceEn || '650,000 UZS / mo');
      setCourseFeaturesUz(course.featuresUz || []);
      setCourseFeaturesEn(course.featuresEn || []);
      setCourseIcon(course.iconName || 'BookOpen');
      setCourseIsPopular(!!course.isPopular);
    } else {
      setEditingCourse(null);
      setCourseTitleUz('');
      setCourseTitleEn('');
      setCourseTitleRu('');
      setCourseDescUz('');
      setCourseDescEn('');
      setCourseDescRu('');
      setCourseDurationUz('3 oy / 3x haftasiga');
      setCourseDurationEn('3 months / 3x weekly');
      setCourseLevelUz('Boshlang\'ich - Yuqori');
      setCourseLevelEn('Beginner to Advanced');
      setCoursePriceUz('650,000 UZS / oy');
      setCoursePriceEn('650,000 UZS / mo');
      setCourseFeaturesUz(['Audio Drills', 'Code IDE', 'Mock Exams']);
      setCourseFeaturesEn(['Audio Drills', 'Code IDE', 'Mock Exams']);
      setCourseIcon('BookOpen');
      setCourseIsPopular(false);
    }
    setIsCourseModalOpen(true);
  };

  const handleAddFeature = () => {
    if (!newFeatureInput.trim()) return;
    setCourseFeaturesUz([...courseFeaturesUz, newFeatureInput.trim()]);
    setCourseFeaturesEn([...courseFeaturesEn, newFeatureInput.trim()]);
    setNewFeatureInput('');
  };

  const handleRemoveFeature = (index: number) => {
    setCourseFeaturesUz(courseFeaturesUz.filter((_, i) => i !== index));
    setCourseFeaturesEn(courseFeaturesEn.filter((_, i) => i !== index));
  };

  const handleSaveCourse = (e: React.FormEvent) => {
    e.preventDefault();
    if (!courseTitleUz.trim() && !courseTitleEn.trim()) {
      showToast(t("Iltimos, kurs nomini kiriting!", "Please enter course title!", "Введите название курса!"));
      return;
    }

    const updatedCourse: Course = {
      id: editingCourse ? editingCourse.id : `course_${Date.now()}`,
      titleUz: courseTitleUz || courseTitleEn,
      titleEn: courseTitleEn || courseTitleUz,
      titleRu: courseTitleRu || courseTitleEn,
      descUz: courseDescUz || courseDescEn,
      descEn: courseDescEn || courseDescUz,
      descRu: courseDescRu || courseDescEn,
      durationUz: courseDurationUz,
      durationEn: courseDurationEn,
      levelUz: courseLevelUz,
      levelEn: courseLevelEn,
      priceUz: coursePriceUz,
      priceEn: coursePriceEn,
      featuresUz: courseFeaturesUz,
      featuresEn: courseFeaturesEn,
      iconName: courseIcon,
      isPopular: courseIsPopular
    };

    let newCourses = [...(content.courses || [])];
    if (editingCourse) {
      newCourses = newCourses.map((c) => (c.id === editingCourse.id ? updatedCourse : c));
    } else {
      newCourses.push(updatedCourse);
    }

    setContent((prev) => ({ ...prev, courses: newCourses }));
    setHasUnsavedEdits(true);
    setIsCourseModalOpen(false);
    showToast(t("Kurs muvaffaqiyatli saqlandi! Saqlash tugmasini bosing.", "Course saved locally! Click 'Publish' to persist.", "Курс сохранен!"));
  };

  const handleDeleteCourse = (courseId: string) => {
    const updated = (content.courses || []).filter((c) => c.id !== courseId);
    setContent((prev) => ({ ...prev, courses: updated }));
    setHasUnsavedEdits(true);
    showToast(t("Kurs ro'yxatdan o'chirildi", "Course removed", "Курс удален"));
  };

  // TAB B: INQUIRY ACTIONS
  const handleUpdateInquiryStatus = async (inquiryId: string, status: 'new' | 'contacted' | 'enrolled' | 'dismissed') => {
    try {
      await updateInquiryStatus(inquiryId, status);
      showToast(t(`Ariza statusi '${status}' ga o'zgartirildi ✅`, `Inquiry status updated to '${status}' ✅`, `Статус обновлен на '${status}' ✅`));
    } catch (err) {
      console.error(err);
      showToast(t("Statusni o'zgartirishda xatolik!", "Failed to update status", "Ошибка обновления"));
    }
  };

  const handleOpenConvertModal = (inquiry: Inquiry) => {
    setConvertingInquiry(inquiry);
    if (groups.length > 0) {
      setSelectedGroupId(groups[0].id);
    }
    setStudentTuitionFee('650000');
  };

  const handleExecuteConvert = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!convertingInquiry) return;
    if (!selectedGroupId) {
      showToast(t("Iltimos, dars guruhini tanlang!", "Please select a cohort group!", "Выберите группу!"));
      return;
    }

    setIsConverting(true);
    const matchedGroup = groups.find((g) => g.id === selectedGroupId);
    const groupName = matchedGroup ? matchedGroup.name : 'Main Cohort';

    try {
      await convertInquiryToStudentBatch(convertingInquiry.id, {
        fullName: convertingInquiry.fullName,
        phone: convertingInquiry.phoneNumber,
        groupId: selectedGroupId,
        groupName: groupName,
        tuitionFee: Number(studentTuitionFee) || 650000,
        paymentStatus: 'pending',
        lastPaymentDate: new Date().toISOString().split('T')[0]
      });

      showToast(
        t(
          `🎉 ${convertingInquiry.fullName} muvaffaqiyatli o'quvchilar safiga qo'shildi va '/students' da saqlandi!`,
          `🎉 ${convertingInquiry.fullName} successfully converted to enrolled student in '/students'!`,
          `🎉 ${convertingInquiry.fullName} успешно зачислен в ученики!`
        )
      );
      setConvertingInquiry(null);
    } catch (err) {
      console.error(err);
      showToast(t("O'quvchiga aylantirishda xatolik!", "Error converting lead to student.", "Ошибка конвертации!"));
    } finally {
      setIsConverting(false);
    }
  };

  // Filtered Inquiries List
  const filteredInquiries = inquiries.filter((iq) => {
    const matchesSearch =
      iq.fullName.toLowerCase().includes(inquirySearch.toLowerCase()) ||
      iq.phoneNumber.includes(inquirySearch) ||
      iq.selectedCourse.toLowerCase().includes(inquirySearch.toLowerCase());

    const matchesStatus = inquiryStatusFilter === 'all' || iq.status === inquiryStatusFilter;

    return matchesSearch && matchesStatus;
  });

  // Inquiries metrics
  const newInquiriesCount = inquiries.filter((i) => i.status === 'new').length;
  const contactedCount = inquiries.filter((i) => i.status === 'contacted').length;
  const enrolledCount = inquiries.filter((i) => i.status === 'enrolled').length;

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-24">
      {/* Toast Alert Notice */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 px-4 py-3 rounded-2xl bg-slate-900 text-white shadow-2xl border border-amber-500/40 text-xs font-bold flex items-center gap-2 animate-bounce">
          <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="p-6 rounded-3xl bg-slate-900 text-white border border-slate-800 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 relative overflow-hidden">
        <img
          src="https://i.ibb.co/Wv1yrFwC/image.png"
          alt="CMS Banner"
          className="absolute inset-0 w-full h-full object-cover opacity-15 pointer-events-none"
        />
        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 text-amber-400 text-xs font-bold border border-amber-500/30 mb-2">
            <LayoutTemplate className="w-3.5 h-3.5" />
            <span>CenterFlow Public Landing Page CMS</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
            {t("Lending Sayt va Lids Boshqaruvi", "Public Landing CMS & Lead Admin", "Управление Лендингом и Лидами")}
          </h1>
          <p className="text-xs text-slate-400 mt-1 max-w-xl">
            {t(
              "O'quv kurslari narxlari, e'lonlar va arizalarni dinamik Firestore orqali real-vaqt rejimida boshqaring.",
              "Manage course offerings, pricing in UZS, announcement banners, and convert public registration leads to students.",
              "Управляйте курсами, ценами, баннерами и конвертируйте заявки в учеников в реальном времени."
            )}
          </p>
        </div>

        <div className="flex items-center gap-3 relative z-10 shrink-0">
          {hasUnsavedEdits && (
            <span className="px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[10px] font-bold animate-pulse">
              {t("Saqlanmagan o'zgarishlar bor!", "Unsaved edits pending", "Есть несохраненные правки")}
            </span>
          )}

          <button
            type="button"
            onClick={handleSaveCMS}
            disabled={isSaving}
            className="px-5 py-2.5 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs shadow-lg shadow-amber-500/20 transition cursor-pointer flex items-center gap-2 disabled:opacity-50"
          >
            {isSaving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            <span>{t("Firestore ga Nashr Qilish", "Publish Changes to Firestore", "Опубликовать в Firestore")}</span>
          </button>
        </div>
      </div>

      {/* Main 3 Navigation Tabs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 p-1.5 bg-white/80 dark:bg-slate-900/60 backdrop-blur-md rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <button
          type="button"
          onClick={() => setActiveTab('courses')}
          className={`py-3 px-4 rounded-xl text-xs font-extrabold transition cursor-pointer flex items-center justify-center gap-2 ${
            activeTab === 'courses'
              ? 'bg-amber-500 text-slate-950 shadow-md'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <span>{t("Tab A: Kurslar va Narxlar", "Tab A: Course Catalog & Pricing", "Курсы и Цены")}</span>
          <span className="px-1.5 py-0.5 rounded-full bg-slate-950/10 text-[10px] font-mono">
            {content.courses?.length || 0}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('inquiries')}
          className={`py-3 px-4 rounded-xl text-xs font-extrabold transition cursor-pointer flex items-center justify-center gap-2 ${
            activeTab === 'inquiries'
              ? 'bg-emerald-500 text-slate-950 shadow-md'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <PhoneCall className="w-4 h-4" />
          <span>{t("Tab B: Kelgan Arizalar va Lids", "Tab B: Lead Inquiries (/inquiries)", "Заявки и Лиды")}</span>
          {newInquiriesCount > 0 && (
            <span className="px-2 py-0.5 rounded-full bg-rose-500 text-white text-[10px] font-black font-mono animate-bounce">
              {newInquiriesCount} new
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('banners')}
          className={`py-3 px-4 rounded-xl text-xs font-extrabold transition cursor-pointer flex items-center justify-center gap-2 ${
            activeTab === 'banners'
              ? 'bg-indigo-500 text-white shadow-md'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Megaphone className="w-4 h-4" />
          <span>{t("Tab C: E'lon va Bosh Ticker Banner", "Tab C: Announcement Ticker Banner", "Объявления и Баннеры")}</span>
          {content.announcementBannerActive && (
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
          )}
        </button>
      </div>

      {/* TAB A: DYNAMIC COURSE CATALOG & PRICING MANAGER */}
      {activeTab === 'courses' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 rounded-3xl bg-white/80 dark:bg-slate-900/50 backdrop-blur-md border border-slate-200/80 dark:border-slate-800/60 shadow-sm">
            <div>
              <h2 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-amber-500" />
                <span>{t("O'quv Yo'nalishlari Katalogi va Oylik Kontrakt Narxlari", "Subject Course Catalog & Monthly Tuition Fees", "Каталог Курсов и Цены")}</span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                {t(
                  "Lending saytda ko'rinadigan barcha fanlar (Matematika, SAT, Fizika, IT, IELTS) narx va xususiyatlarini tahrirlang.",
                  "Manage subject tracks, monthly fees in UZS, schedules, badges, and features displayed on the public site.",
                  "Редактируйте курсы, цены в UZS, расписание и функции для публичного сайта."
                )}
              </p>
            </div>

            <button
              type="button"
              onClick={() => handleOpenCourseModal()}
              className="px-4 py-2.5 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs transition cursor-pointer flex items-center gap-2 shadow-md shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>{t("Yangi Kurs Qo'shish", "Add New Course", "Добавить Курс")}</span>
            </button>
          </div>

          {/* Courses Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {(content.courses || []).map((course) => (
              <div
                key={course.id}
                className="p-5 rounded-3xl bg-white/80 dark:bg-slate-900/50 backdrop-blur-md border border-slate-200/80 dark:border-slate-800/60 shadow-sm flex flex-col justify-between space-y-4 relative group"
              >
                {course.isPopular && (
                  <span className="absolute top-4 right-4 px-3 py-1 rounded-full bg-amber-500 text-slate-950 text-[10px] font-black uppercase tracking-wider shadow">
                    🔥 Popular Track
                  </span>
                )}

                <div className="space-y-3">
                  <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-500 border border-amber-500/20 flex items-center justify-center font-black">
                    {course.iconName === 'Code' ? (
                      <Code className="w-5 h-5" />
                    ) : course.iconName === 'Calculator' ? (
                      <Calculator className="w-5 h-5" />
                    ) : course.iconName === 'Zap' ? (
                      <Zap className="w-5 h-5" />
                    ) : (
                      <BookOpen className="w-5 h-5" />
                    )}
                  </div>

                  <div>
                    <h3 className="font-black text-base text-slate-900 dark:text-white">
                      {language === 'UZ' ? course.titleUz : course.titleEn}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mt-1">
                      {language === 'UZ' ? course.descUz : course.descEn}
                    </p>
                  </div>

                  <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 space-y-1">
                    <div className="flex items-center justify-between text-xs font-mono">
                      <span className="text-slate-400 font-bold">{t("Oylik Kontrakt:", "Monthly Fee:", "Контракт:")}</span>
                      <span className="font-extrabold text-emerald-500">{course.priceUz || course.priceEn}</span>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
                      <span>{t("Jadval / Davomiyligi:", "Schedule / Duration:", "Расписание:")}</span>
                      <span className="font-bold">{course.durationUz || course.durationEn}</span>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
                      <span>{t("Daraja / Badge:", "Level Badge:", "Уровень:")}</span>
                      <span className="font-bold text-amber-500">{course.levelUz || course.levelEn}</span>
                    </div>
                  </div>

                  {/* Feature Bullet Points */}
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                      {t("Xususiyatlar / Imkoniyatlar:", "Features Included:", "Особенности:")}
                    </span>
                    <ul className="space-y-1">
                      {(course.featuresUz || course.featuresEn || []).slice(0, 4).map((f, idx) => (
                        <li key={idx} className="text-xs text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                          <span>{f}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Card Actions */}
                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => handleOpenCourseModal(course)}
                    className="flex-1 py-2 px-3 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-amber-500/20 text-slate-700 dark:text-slate-200 hover:text-amber-500 font-bold text-xs transition cursor-pointer flex items-center justify-center gap-1.5 border border-slate-200 dark:border-slate-700"
                  >
                    <Edit className="w-3.5 h-3.5" />
                    <span>{t("Tahrirlash", "Edit Course", "Изменить")}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDeleteCourse(course.id)}
                    className="p-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 font-bold text-xs transition cursor-pointer border border-rose-500/30"
                    title="Delete Course"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB B: PUBLIC LEAD INQUIRIES TABLE (/inquiries) */}
      {activeTab === 'inquiries' && (
        <div className="space-y-6">
          {/* Summary Metrics Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-4 rounded-3xl bg-white/80 dark:bg-slate-900/50 backdrop-blur-md border border-slate-200/80 dark:border-slate-800/60 shadow-sm space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{t("Jami Arizalar", "Total Inquiries", "Всего Заявок")}</span>
              <p className="text-2xl font-black text-slate-900 dark:text-white font-mono">{inquiries.length}</p>
            </div>

            <div className="p-4 rounded-3xl bg-white/80 dark:bg-slate-900/50 backdrop-blur-md border border-slate-200/80 dark:border-slate-800/60 shadow-sm space-y-1">
              <span className="text-[10px] font-bold text-rose-500 uppercase tracking-wider">{t("Yangi (Bog'lanilmagan)", "New Uncontacted", "Новые Заявки")}</span>
              <p className="text-2xl font-black text-rose-500 font-mono">{newInquiriesCount}</p>
            </div>

            <div className="p-4 rounded-3xl bg-white/80 dark:bg-slate-900/50 backdrop-blur-md border border-slate-200/80 dark:border-slate-800/60 shadow-sm space-y-1">
              <span className="text-[10px] font-bold text-amber-500 uppercase tracking-wider">{t("Muloqot Qilingan", "Contacted Leads", "Связались")}</span>
              <p className="text-2xl font-black text-amber-500 font-mono">{contactedCount}</p>
            </div>

            <div className="p-4 rounded-3xl bg-white/80 dark:bg-slate-900/50 backdrop-blur-md border border-slate-200/80 dark:border-slate-800/60 shadow-sm space-y-1">
              <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-wider">{t("O'quvchiga Aylantirilgan", "Enrolled Students", "Зачислены")}</span>
              <p className="text-2xl font-black text-emerald-500 font-mono">{enrolledCount}</p>
            </div>
          </div>

          {/* Filters Toolbar */}
          <div className="p-4 rounded-3xl bg-white/80 dark:bg-slate-900/50 backdrop-blur-md border border-slate-200/80 dark:border-slate-800/60 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
            {/* Status Filter Tabs */}
            <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-800 rounded-2xl w-full sm:w-auto overflow-x-auto text-xs">
              {(['all', 'new', 'contacted', 'enrolled', 'dismissed'] as const).map((status) => (
                <button
                  key={status}
                  type="button"
                  onClick={() => setInquiryStatusFilter(status)}
                  className={`px-3 py-1.5 rounded-xl font-extrabold capitalize transition cursor-pointer shrink-0 ${
                    inquiryStatusFilter === status
                      ? 'bg-amber-500 text-slate-950 shadow'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  {status}
                </button>
              ))}
            </div>

            {/* Search Input */}
            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={inquirySearch}
                onChange={(e) => setInquirySearch(e.target.value)}
                placeholder={t("Ism, tel, kurs bo'yicha qidirish...", "Search name, phone, course...", "Поиск...")}
                className="w-full pl-9 pr-3 py-2 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>
          </div>

          {/* Inquiries Table */}
          <div className="p-6 rounded-3xl bg-white/80 dark:bg-slate-900/50 backdrop-blur-md border border-slate-200/80 dark:border-slate-800/60 shadow-sm">
            {inquiriesLoading ? (
              <div className="py-12 text-center text-slate-400">
                <Loader2 className="w-6 h-6 animate-spin mx-auto text-amber-500 mb-2" />
                <p className="text-xs">{t("Arizalar yuklanmoqda...", "Loading inquiries...", "Загрузка...")}</p>
              </div>
            ) : filteredInquiries.length === 0 ? (
              <div className="py-12 text-center text-slate-400 space-y-2">
                <CheckCircle2 className="w-8 h-8 mx-auto text-emerald-500" />
                <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  {t("Belgilangan filtr bo'yicha arizalar topilmadi", "No lead inquiries match current filter", "Заявки не найдены")}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 font-bold uppercase tracking-wider">
                      <th className="pb-3 px-2">{t("LEAD NAME", "LEAD NAME", "ИМЯ ЛИДА")}</th>
                      <th className="pb-3 px-2">{t("CONTACT PHONE", "CONTACT PHONE", "ТЕЛЕФОН")}</th>
                      <th className="pb-3 px-2">{t("SELECTED COURSE", "SELECTED COURSE", "KURS / ПРЕДМЕТ")}</th>
                      <th className="pb-3 px-2">{t("DATE", "DATE", "ДАТА")}</th>
                      <th className="pb-3 px-2">{t("STATUS", "STATUS", "СТАТУС")}</th>
                      <th className="pb-3 px-2 text-right">{t("ACTIONS", "ACTIONS", "ДЕЙСТВИЯ")}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {filteredInquiries.map((iq) => (
                      <tr key={iq.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition">
                        <td className="py-3.5 px-2 font-bold text-slate-900 dark:text-white flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-amber-500/10 text-amber-500 font-black flex items-center justify-center shrink-0">
                            {iq.fullName.charAt(0)}
                          </div>
                          <div>
                            <span className="block">{iq.fullName}</span>
                            {iq.message && (
                              <span className="text-[10px] text-slate-400 line-clamp-1 italic">"{iq.message}"</span>
                            )}
                          </div>
                        </td>

                        <td className="py-3.5 px-2 font-mono font-bold text-slate-700 dark:text-slate-300">
                          {iq.phoneNumber}
                        </td>

                        <td className="py-3.5 px-2">
                          <span className="px-2.5 py-1 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 font-bold border border-amber-500/20 text-[11px]">
                            {iq.selectedCourse}
                          </span>
                        </td>

                        <td className="py-3.5 px-2 text-slate-400 text-[11px] font-mono">
                          {iq.createdAt ? new Date(iq.createdAt).toLocaleDateString() : 'Today'}
                        </td>

                        <td className="py-3.5 px-2">
                          <select
                            value={iq.status}
                            onChange={(e) => handleUpdateInquiryStatus(iq.id, e.target.value as any)}
                            className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold border cursor-pointer focus:outline-none ${
                              iq.status === 'enrolled'
                                ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/30'
                                : iq.status === 'contacted'
                                ? 'bg-amber-500/10 text-amber-500 border-amber-500/30'
                                : iq.status === 'dismissed'
                                ? 'bg-slate-500/10 text-slate-400 border-slate-500/30'
                                : 'bg-rose-500/10 text-rose-500 border-rose-500/30'
                            }`}
                          >
                            <option value="new" className="bg-slate-900 text-rose-400">New 🔴</option>
                            <option value="contacted" className="bg-slate-900 text-amber-400">Contacted ⏳</option>
                            <option value="enrolled" className="bg-slate-900 text-emerald-400">Enrolled ✅</option>
                            <option value="dismissed" className="bg-slate-900 text-slate-400">Closed ❌</option>
                          </select>
                        </td>

                        <td className="py-3.5 px-2 text-right space-x-2">
                          {/* Telegram Quick Launch Button */}
                          <a
                            href={`https://t.me/${iq.phoneNumber.replace(/[^0-9]/g, '')}`}
                            target="_blank"
                            rel="noreferrer"
                            className="p-2 rounded-xl bg-blue-500/10 hover:bg-blue-500/20 text-blue-500 font-bold text-xs inline-flex items-center gap-1 border border-blue-500/30 transition"
                            title="Open Telegram Chat"
                          >
                            <Send className="w-3.5 h-3.5" />
                          </a>

                          {/* Direct Phone Call Button */}
                          <a
                            href={`tel:${iq.phoneNumber}`}
                            className="p-2 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-500 font-bold text-xs inline-flex items-center gap-1 border border-emerald-500/30 transition"
                            title="Call Student Phone"
                          >
                            <Phone className="w-3.5 h-3.5" />
                          </a>

                          {/* 1-Tap Convert to Student Action Button */}
                          {iq.status !== 'enrolled' && (
                            <button
                              type="button"
                              onClick={() => handleOpenConvertModal(iq)}
                              className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-[11px] shadow transition cursor-pointer inline-flex items-center gap-1"
                            >
                              <UserPlus className="w-3.5 h-3.5" />
                              <span>{t("O'quvchiga Aylantirish", "Convert to Student", "Зачислить")}</span>
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB C: BRANCH BANNERS & ANNOUNCEMENT TICKER */}
      {activeTab === 'banners' && (
        <div className="space-y-6">
          <div className="p-6 rounded-3xl bg-white/80 dark:bg-slate-900/50 backdrop-blur-md border border-slate-200/80 dark:border-slate-800/60 shadow-sm space-y-6">
            <div>
              <h2 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                <Megaphone className="w-5 h-5 text-indigo-500" />
                <span>{t("Bosh Sahifa Top-Bar E'lon Ticker Bannersi", "Public Page Top-Bar Announcement Ticker", "Объявления и Верхний Баннер")}</span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                {t(
                  "Lending saytining eng yuqori qismida ko'rinadigan shoshilinch e'lonlar satrini matni, rangi va havolasini sozlang.",
                  "Customize top-bar announcement text (e.g. '🔥 New Evening Python Cohort starting Monday!'), active toggle, and theme style.",
                  "Настройте бегущую строку объявлений вверху публичного сайта."
                )}
              </p>
            </div>

            {/* Interactive Live Banner Preview */}
            <div className="space-y-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                {t("Jonli Ko'rinish Namoyishi (Live Preview):", "Live Top-Bar Preview:", "Предпросмотр:")}
              </span>

              {content.announcementBannerActive ? (
                <div
                  className={`p-3 rounded-2xl text-xs font-bold flex items-center justify-between gap-3 shadow-md border ${
                    content.announcementBannerTheme === 'emerald'
                      ? 'bg-emerald-500 text-slate-950 border-emerald-400'
                      : content.announcementBannerTheme === 'rose'
                      ? 'bg-rose-500 text-white border-rose-400'
                      : content.announcementBannerTheme === 'indigo'
                      ? 'bg-indigo-600 text-white border-indigo-500'
                      : 'bg-amber-500 text-slate-950 border-amber-400'
                  }`}
                >
                  <div className="flex items-center gap-2 overflow-hidden">
                    <Sparkles className="w-4 h-4 shrink-0 animate-bounce" />
                    <span className="truncate">
                      {language === 'UZ'
                        ? content.announcementBannerUz || '🔥 Dushanba kunidan yangi Kechki Python & IT guruhlari boshlanmoqda! Hoziroq ro\'yxatdan o\'ting.'
                        : content.announcementBannerEn || '🔥 New Evening Python Cohort starting Monday! Register now.'}
                    </span>
                  </div>

                  <a
                    href={content.announcementBannerLink || '#register'}
                    target="_blank"
                    rel="noreferrer"
                    className="px-3 py-1 rounded-xl bg-slate-950/20 hover:bg-slate-950/40 text-current text-[11px] font-black uppercase tracking-wider border border-current/30 shrink-0 inline-flex items-center gap-1"
                  >
                    <span>Register</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              ) : (
                <div className="p-4 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400 text-xs text-center border border-dashed border-slate-300 dark:border-slate-700 font-bold">
                  {t("E'lon bansi hozirda faolsizlantirilgan (Disabled)", "Announcement banner is currently disabled", "Баннер отключен")}
                </div>
              )}
            </div>

            {/* Banner Editor Controls Form */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-slate-100 dark:border-slate-800">
              {/* Active Toggle */}
              <div className="col-span-1 md:col-span-2 flex items-center justify-between p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                <div>
                  <h4 className="font-extrabold text-xs text-slate-900 dark:text-white">
                    {t("Top-Bar E'lon Bansi Aktivligi", "Enable Top-Bar Announcement Ticker", "Включить Баннер Объявлений")}
                  </h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    {t("Lending sayt tepasida ko'rsatish yoki yashirish", "Show or hide top-bar ticker on public site", "Показать или скрыть")}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setContent((prev) => ({ ...prev, announcementBannerActive: !prev.announcementBannerActive }));
                    setHasUnsavedEdits(true);
                  }}
                  className={`w-12 h-6 rounded-full transition-colors relative cursor-pointer ${
                    content.announcementBannerActive ? 'bg-amber-500' : 'bg-slate-300 dark:bg-slate-700'
                  }`}
                >
                  <div
                    className={`w-5 h-5 rounded-full bg-white absolute top-0.5 transition-transform ${
                      content.announcementBannerActive ? 'left-6.5' : 'left-0.5'
                    }`}
                  />
                </button>
              </div>

              {/* Banner Text UZ */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  {t("E'lon Matni (O'zbekcha)", "Announcement Text (Uzbek)", "Текст (Узбекский)")}
                </label>
                <input
                  type="text"
                  value={content.announcementBannerUz || ''}
                  onChange={(e) => {
                    setContent((prev) => ({ ...prev, announcementBannerUz: e.target.value }));
                    setHasUnsavedEdits(true);
                  }}
                  placeholder="🔥 Dushanba kunidan yangi Kechki Python guruhlari..."
                  className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white font-medium focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              {/* Banner Text EN */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  {t("E'lon Matni (English)", "Announcement Text (English)", "Текст (Английский)")}
                </label>
                <input
                  type="text"
                  value={content.announcementBannerEn || ''}
                  onChange={(e) => {
                    setContent((prev) => ({ ...prev, announcementBannerEn: e.target.value }));
                    setHasUnsavedEdits(true);
                  }}
                  placeholder="🔥 New Evening Python Cohort starting Monday!..."
                  className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white font-medium focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              {/* Banner Link */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  {t("CTA Tugma Havolasi (URL)", "CTA Button Link (URL)", "Ссылка Кнопки")}
                </label>
                <input
                  type="text"
                  value={content.announcementBannerLink || ''}
                  onChange={(e) => {
                    setContent((prev) => ({ ...prev, announcementBannerLink: e.target.value }));
                    setHasUnsavedEdits(true);
                  }}
                  placeholder="https://t.me/centerflow_admin"
                  className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white font-mono focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              {/* Banner Theme Color */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  {t("Banner Rangi / Uslubi", "Banner Theme Color", "Тема Баннера")}
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {(['amber', 'emerald', 'indigo', 'rose'] as const).map((theme) => (
                    <button
                      key={theme}
                      type="button"
                      onClick={() => {
                        setContent((prev) => ({ ...prev, announcementBannerTheme: theme }));
                        setHasUnsavedEdits(true);
                      }}
                      className={`py-2 px-3 rounded-xl text-xs font-extrabold capitalize border transition cursor-pointer flex items-center justify-center gap-1 ${
                        content.announcementBannerTheme === theme
                          ? 'ring-2 ring-amber-500 font-black'
                          : ''
                      } ${
                        theme === 'amber'
                          ? 'bg-amber-500 text-slate-950 border-amber-400'
                          : theme === 'emerald'
                          ? 'bg-emerald-500 text-slate-950 border-emerald-400'
                          : theme === 'indigo'
                          ? 'bg-indigo-600 text-white border-indigo-500'
                          : 'bg-rose-500 text-white border-rose-400'
                      }`}
                    >
                      <span>{theme}</span>
                      {content.announcementBannerTheme === theme && <Check className="w-3 h-3" />}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 1: ADD / EDIT COURSE MODAL */}
      {isCourseModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md animate-fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-2xl rounded-3xl p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <button
              type="button"
              onClick={() => setIsCourseModalOpen(false)}
              className="absolute top-4 right-4 p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-5">
              <div className="p-3 rounded-2xl bg-amber-500/10 text-amber-500 border border-amber-500/20">
                <BookOpen className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-extrabold text-lg text-slate-900 dark:text-white">
                  {editingCourse ? t("Kursni Tahrirlash", "Edit Subject Course", "Редактировать Курс") : t("Yangi Fan Kursi Qo'shish", "Add New Subject Course", "Добавить Курс")}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {t("Lending katalogida va narxlar jadvalida ko'rinadigan ma'lumotlarni kiriting", "Enter details displayed in public course catalog and pricing cards", "Данные для каталога курсов")}
                </p>
              </div>
            </div>

            <form onSubmit={handleSaveCourse} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    {t("Kurs Nomi (O'zbekcha) *", "Course Title (Uzbek) *", "Название (O'zbek) *")}
                  </label>
                  <input
                    type="text"
                    required
                    value={courseTitleUz}
                    onChange={(e) => setCourseTitleUz(e.target.value)}
                    placeholder="Matematika & SAT Prep"
                    className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-amber-500 text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    {t("Kurs Nomi (English) *", "Course Title (English) *", "Название (English) *")}
                  </label>
                  <input
                    type="text"
                    required
                    value={courseTitleEn}
                    onChange={(e) => setCourseTitleEn(e.target.value)}
                    placeholder="Mathematics & SAT Prep"
                    className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-amber-500 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  {t("Tavsif / Description", "Course Description", "Описание Курса")}
                </label>
                <textarea
                  rows={2}
                  value={courseDescUz}
                  onChange={(e) => {
                    setCourseDescUz(e.target.value);
                    setCourseDescEn(e.target.value);
                  }}
                  placeholder="Mantiqiy masalalar, formula yechimlari va haftalik sinov testlari..."
                  className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-amber-500 text-slate-900 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    {t("Oylik Kontrakt (UZS) *", "Monthly Price (UZS) *", "Цена в Месяц (UZS) *")}
                  </label>
                  <input
                    type="text"
                    required
                    value={coursePriceUz}
                    onChange={(e) => {
                      setCoursePriceUz(e.target.value);
                      setCoursePriceEn(e.target.value);
                    }}
                    placeholder="650,000 UZS / oy"
                    className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold font-mono text-emerald-500 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    {t("Dars Jadvali / Davomiy", "Schedule / Duration", "Расписание")}
                  </label>
                  <input
                    type="text"
                    value={courseDurationUz}
                    onChange={(e) => {
                      setCourseDurationUz(e.target.value);
                      setCourseDurationEn(e.target.value);
                    }}
                    placeholder="3 oy / 3x haftasiga"
                    className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-amber-500 text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    {t("Daraja Badge", "Level Badge", "Уровень")}
                  </label>
                  <input
                    type="text"
                    value={courseLevelUz}
                    onChange={(e) => {
                      setCourseLevelUz(e.target.value);
                      setCourseLevelEn(e.target.value);
                    }}
                    placeholder="IELTS 7.5+ Rocket"
                    className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-amber-500 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              {/* Features Bullet Points List */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  {t("Kurs Imkoniyatlari va Xususiyatlari (Features)", "Included Features & Tools", "Особенности Курса")}
                </label>

                <div className="flex items-center gap-2 mb-2">
                  <input
                    type="text"
                    value={newFeatureInput}
                    onChange={(e) => setNewFeatureInput(e.target.value)}
                    placeholder="Masalan: Audio Speaking Drills, Code IDE..."
                    className="flex-1 px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                  <button
                    type="button"
                    onClick={handleAddFeature}
                    className="px-3 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shrink-0 cursor-pointer"
                  >
                    + Add
                  </button>
                </div>

                <div className="flex flex-wrap gap-2">
                  {courseFeaturesUz.map((feat, idx) => (
                    <span
                      key={idx}
                      className="px-3 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs flex items-center gap-1.5 border border-slate-200 dark:border-slate-700"
                    >
                      <span>{feat}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveFeature(idx)}
                        className="text-rose-500 hover:text-rose-700 font-bold ml-1 cursor-pointer"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              {/* Icon & Popular Toggle */}
              <div className="flex items-center justify-between pt-2">
                <div className="flex items-center gap-3">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Icon:
                  </label>
                  <select
                    value={courseIcon}
                    onChange={(e) => setCourseIcon(e.target.value)}
                    className="px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white"
                  >
                    <option value="BookOpen">BookOpen (English/Languages)</option>
                    <option value="Code">Code (IT / Web Dev)</option>
                    <option value="Calculator">Calculator (Math / Physics)</option>
                    <option value="Zap">Zap (Intensive)</option>
                  </select>
                </div>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={courseIsPopular}
                    onChange={(e) => setCourseIsPopular(e.target.checked)}
                    className="w-4 h-4 rounded text-amber-500 focus:ring-amber-500"
                  />
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    🔥 Highlight as Popular
                  </span>
                </label>
              </div>

              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsCourseModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-500 hover:text-slate-700 cursor-pointer"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs shadow-md cursor-pointer"
                >
                  {t("Kursni Saqlash", "Save Course", "Сохранить Курс")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: CONVERT LEAD TO STUDENT MODAL */}
      {convertingInquiry && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md animate-fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-md rounded-3xl p-6 shadow-2xl relative">
            <button
              type="button"
              onClick={() => setConvertingInquiry(null)}
              className="absolute top-4 right-4 p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-5">
              <div className="p-3 rounded-2xl bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                <UserPlus className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-extrabold text-lg text-slate-900 dark:text-white">
                  {t("Arizani O'quvchiga Aylantirish", "Convert Lead to Student", "Зачислить Ученика")}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {convertingInquiry.fullName} ({convertingInquiry.phoneNumber})
                </p>
              </div>
            </div>

            <form onSubmit={handleExecuteConvert} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  {t("Biriktiriladigan Guruhni Tanlang *", "Select Active Cohort Group *", "Выберите Группу *")}
                </label>
                <select
                  value={selectedGroupId}
                  onChange={(e) => setSelectedGroupId(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  {groups.map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.name} ({g.courseType}) - Teacher: {g.teacherName}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  {t("Oylik Kontrakt Summasi (UZS) *", "Monthly Tuition Fee (UZS) *", "Сумма Контракта (UZS) *")}
                </label>
                <input
                  type="number"
                  required
                  value={studentTuitionFee}
                  onChange={(e) => setStudentTuitionFee(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold font-mono text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs space-y-1">
                <p className="font-bold">✨ Nima Sodir Bo'ladi?</p>
                <p className="text-[11px] text-slate-600 dark:text-slate-300">
                  - O'quvchi '/students' ro'yxatiga qo'shiladi.<br />
                  - Kirish kodi shakllantiriladi.<br />
                  - Arizasi statusi 'Enrolled ✅' ga o'tadi.
                </p>
              </div>

              <div className="pt-3 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setConvertingInquiry(null)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-500 cursor-pointer"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={isConverting}
                  className="px-5 py-2.5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs shadow-md transition cursor-pointer flex items-center gap-2"
                >
                  {isConverting && <Loader2 className="w-4 h-4 animate-spin" />}
                  <span>{t("O'quvchilar Safiga Qo'shish", "Confirm Enrollment", "Зачислить")}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
