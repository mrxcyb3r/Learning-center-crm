import React, { useState, useEffect } from 'react';
import {
  BookOpen,
  Plus,
  Edit2,
  Trash2,
  Clock,
  Calendar,
  Check,
  DollarSign,
  User,
  CheckCircle2,
  Eye,
  EyeOff,
  X,
  Sparkles,
} from 'lucide-react';
import { crmService } from '../../services/crmService';
import { CourseData, TeacherRecord } from '../../types/crm';

export const CoursesView: React.FC = () => {
  const [courses, setCourses] = useState<CourseData[]>([]);
  const [teachers, setTeachers] = useState<TeacherRecord[]>([]);
  const [editingCourse, setEditingCourse] = useState<CourseData | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);

  // Form
  const [formTitle, setFormTitle] = useState('');
  const [formShortTitle, setFormShortTitle] = useState('');
  const [formCategory, setFormCategory] = useState('DTM & Milliy Sertifikat');
  const [formBadge, setFormBadge] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formDuration, setFormDuration] = useState('8 oy');
  const [formLessonsPerWeek, setFormLessonsPerWeek] = useState('Haftada 3 kun / 2 soatdan');
  const [formLessonDuration, setFormLessonDuration] = useState('120 daqiqa');
  const [formMonthlyFee, setFormMonthlyFee] = useState('380000');
  const [formTeacherId, setFormTeacherId] = useState('');
  const [formFeatures, setFormFeatures] = useState('');
  const [formIsActive, setFormIsActive] = useState(true);
  const [formIsPublic, setFormIsPublic] = useState(true);

  const refreshData = () => {
    setCourses(crmService.getCourses());
    setTeachers(crmService.getTeachers().filter((t) => t.status === 'Active'));
  };

  useEffect(() => {
    refreshData();
  }, []);

  const showNotification = (msg: string) => {
    setSuccessNotice(msg);
    setTimeout(() => setSuccessNotice(null), 3000);
  };

  const handleOpenAdd = () => {
    setEditingCourse(null);
    setFormTitle('');
    setFormShortTitle('');
    setFormCategory('DTM & Milliy Sertifikat');
    setFormBadge('Yangi Kurs');
    setFormDescription('');
    setFormDuration('8 oy');
    setFormLessonsPerWeek('Haftada 3 kun / 2 soatdan');
    setFormLessonDuration('120 daqiqa');
    setFormMonthlyFee('380000');
    setFormTeacherId(teachers[0]?.id || '');
    setFormFeatures('Haftalik testlar\nMualliflik konspektlari\nOylik hisobotlar');
    setFormIsActive(true);
    setFormIsPublic(true);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (c: CourseData) => {
    setEditingCourse(c);
    setFormTitle(c.title);
    setFormShortTitle(c.shortTitle || '');
    setFormCategory(c.category);
    setFormBadge(c.badge || '');
    setFormDescription(c.description);
    setFormDuration(c.duration);
    setFormLessonsPerWeek(c.lessonsPerWeek);
    setFormLessonDuration(c.lessonDuration || '120 daqiqa');
    setFormMonthlyFee(String(c.monthlyFee));
    setFormTeacherId(c.teacherId || '');
    setFormFeatures((c.features || []).join('\n'));
    setFormIsActive(c.isActive ?? true);
    setFormIsPublic(c.isPublic ?? true);
    setIsModalOpen(true);
  };

  const handleSaveCourse = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim()) return;

    const assignedTeacher = teachers.find((t) => t.id === formTeacherId);
    const featuresList = formFeatures
      .split('\n')
      .map((f) => f.trim())
      .filter(Boolean);

    const feeNumber = Number(formMonthlyFee) || 0;
    const formattedFee = `${feeNumber.toLocaleString()} UZS / oy`;

    const payload = {
      title: formTitle.trim(),
      shortTitle: formShortTitle.trim() || formTitle.trim(),
      category: formCategory.trim(),
      badge: formBadge.trim(),
      description: formDescription.trim(),
      duration: formDuration.trim(),
      lessonsPerWeek: formLessonsPerWeek.trim(),
      lessonDuration: formLessonDuration.trim(),
      monthlyFee: feeNumber,
      formattedFee,
      currency: 'UZS',
      teacherId: formTeacherId,
      teacherName: assignedTeacher ? assignedTeacher.name : undefined,
      features: featuresList,
      isActive: formIsActive,
      isPublic: formIsPublic,
    };

    if (editingCourse) {
      crmService.updateCourse(editingCourse.id, payload);
      showNotification(`${formTitle} kursi muvaffaqiyatli saqlandi!`);
    } else {
      crmService.addCourse(payload);
      showNotification(`Yangi kurs "${formTitle}" qo'shildi!`);
    }

    refreshData();
    setIsModalOpen(false);
  };

  const handleDeleteCourse = (id: string, title: string) => {
    if (window.confirm(`Rostdan ham "${title}" kursini o'chirmoqchimisiz?`)) {
      crmService.deleteCourse(id);
      refreshData();
      showNotification(`"${title}" kursi o'chirildi.`);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            O'quv Yo'nalishlari va Kurs Narxlari ({courses.length})
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Kurslar ro'yxati, dars jadvali me'yorlari, oylik to'lov narxlari va bosh sahifadagi ko'rinishini boshqaring.
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-md shadow-amber-500/20 flex items-center gap-1.5 transition cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Yangi Kurs Yaratish</span>
        </button>
      </div>

      {/* Notice */}
      {successNotice && (
        <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-bold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" />
          <span>{successNotice}</span>
        </div>
      )}

      {/* Courses Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {courses.map((c) => (
          <div
            key={c.id}
            className={`p-6 rounded-3xl bg-white dark:bg-slate-900 border shadow-sm flex flex-col justify-between hover:border-slate-300 dark:hover:border-slate-700 transition ${
              !c.isActive ? 'opacity-60 border-slate-300' : 'border-slate-200 dark:border-slate-800'
            }`}
          >
            <div>
              <div className="flex items-center justify-between gap-2">
                <span className="text-[10px] font-black text-amber-600 dark:text-amber-400 uppercase tracking-wider">
                  {c.category}
                </span>
                <div className="flex items-center gap-1.5">
                  {c.badge && (
                    <span className="px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 text-[10px] font-bold">
                      {c.badge}
                    </span>
                  )}
                  {c.isPublic === false && (
                    <span className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 text-[10px] font-semibold flex items-center gap-1">
                      <EyeOff className="w-3 h-3" /> Saytda yopiq
                    </span>
                  )}
                </div>
              </div>

              <h3 className="text-lg font-black text-slate-900 dark:text-white mt-2">
                {c.title}
              </h3>

              <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 line-clamp-2 min-h-[32px]">
                {c.description}
              </p>

              {/* Meta details */}
              <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2 text-xs text-slate-600 dark:text-slate-300">
                <div className="flex items-center gap-2">
                  <Clock className="w-3.5 h-3.5 text-amber-500" />
                  <span>Davomiyligi: {c.duration}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="w-3.5 h-3.5 text-amber-500" />
                  <span>Darslar: {c.lessonsPerWeek}</span>
                </div>
                {c.teacherName && (
                  <div className="flex items-center gap-2">
                    <User className="w-3.5 h-3.5 text-emerald-500" />
                    <span>Mas'ul Ustoz: <strong className="text-slate-900 dark:text-white">{c.teacherName}</strong></span>
                  </div>
                )}
              </div>

              {/* Features preview */}
              {c.features && c.features.length > 0 && (
                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 space-y-1">
                  {c.features.slice(0, 3).map((f, fIdx) => (
                    <div key={fIdx} className="flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400">
                      <Check className="w-3 h-3 text-emerald-500 shrink-0" />
                      <span className="truncate">{f}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Bottom: Monthly Fee & Actions */}
            <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div>
                <span className="text-[10px] text-slate-400 block font-medium">Oylik To'lov</span>
                <span className="text-base font-black text-emerald-600 dark:text-emerald-400 font-mono">
                  {c.formattedFee || `${c.monthlyFee.toLocaleString()} UZS / oy`}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleOpenEdit(c)}
                  className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition cursor-pointer"
                  title="Kursni tahrirlash"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDeleteCourse(c.id, c.title)}
                  className="p-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 transition cursor-pointer"
                  title="Kursni o'chirish"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Add / Edit Course Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm overflow-y-auto">
          <div className="w-full max-w-xl bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-2xl my-8">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800 mb-5">
              <h3 className="text-xl font-black text-slate-900 dark:text-white">
                {editingCourse ? `Kursni tahrirlash: ${editingCourse.title}` : "Yangi Kurs Yaratish"}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveCourse} className="space-y-4 text-xs sm:text-sm">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                    Kurs Nomi *
                  </label>
                  <input
                    type="text"
                    required
                    value={formTitle}
                    onChange={(e) => setFormTitle(e.target.value)}
                    placeholder="Masalan: Tarix, Huquq, Geografiya"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                    Kategoriya / Bo'lim *
                  </label>
                  <input
                    type="text"
                    required
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value)}
                    placeholder="DTM & Milliy Sertifikat"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                    Belgi / Badge (Ixtiyoriy)
                  </label>
                  <input
                    type="text"
                    value={formBadge}
                    onChange={(e) => setFormBadge(e.target.value)}
                    placeholder="Eng Ommabop, Sertifikat Kafolati"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                  Kurs Tavsifi (Saytda ko'rsatiladi)
                </label>
                <textarea
                  rows={2}
                  required
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="Kurs kimlar uchun mo'ljallangan va qanday natija beradi..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              {/* Fee and Duration */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                    Oylik To'lov (UZS) *
                  </label>
                  <input
                    type="number"
                    step="10000"
                    required
                    value={formMonthlyFee}
                    onChange={(e) => setFormMonthlyFee(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500 font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                    Davomiyligi
                  </label>
                  <input
                    type="text"
                    value={formDuration}
                    onChange={(e) => setFormDuration(e.target.value)}
                    placeholder="8 oy"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                    Darslar jadvali
                  </label>
                  <input
                    type="text"
                    value={formLessonsPerWeek}
                    onChange={(e) => setFormLessonsPerWeek(e.target.value)}
                    placeholder="Haftada 3 kun / 2 soatdan"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>

              {/* Teacher and Visibility */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                    Mas'ul O'qituvchi
                  </label>
                  <select
                    value={formTeacherId}
                    onChange={(e) => setFormTeacherId(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500 cursor-pointer"
                  >
                    <option value="">(Ustoz belgilanmagan)</option>
                    {teachers.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name} ({t.subject || t.specialization})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center gap-6 pt-5">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formIsActive}
                      onChange={(e) => setFormIsActive(e.target.checked)}
                      className="w-4 h-4 text-amber-500 rounded focus:ring-amber-500"
                    />
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      Faol Kurs
                    </span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formIsPublic}
                      onChange={(e) => setFormIsPublic(e.target.checked)}
                      className="w-4 h-4 text-amber-500 rounded focus:ring-amber-500"
                    />
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      Bosh sahifada ko'rinsin
                    </span>
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                  Afzalliklar / Xususiyatlar (Har bir qatorda bittadan)
                </label>
                <textarea
                  rows={3}
                  value={formFeatures}
                  onChange={(e) => setFormFeatures(e.target.value)}
                  placeholder="Haftalik DTM test sinovlari&#10;Barcha dars materiallari bepul beriladi&#10;Ota-onalar bilan haftalik hisobot"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              {/* Modal Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                >
                  Bekor qilish
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-md shadow-amber-500/20 transition cursor-pointer"
                >
                  {editingCourse ? "O'zgarishlarni Saqlash" : "Kursni Saqlash"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
