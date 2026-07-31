import React, { useEffect, useState } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { FileText, Upload, Clock, Trash2, Paperclip, Plus } from 'lucide-react';
import { subscribeAssignments, addAssignment, deleteAssignment, subscribeGroups } from '../../services/firestore';
import { Assignment, Group } from '../../types';

export const HomeworkView: React.FC = () => {
  const { language } = useLanguage();
  const t = (uz: string, en: string, ru: string) => {
    if (language === 'UZ') return uz;
    if (language === 'RU') return ru;
    return en;
  };

  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const [title, setTitle] = useState('');
  const [selectedGroup, setSelectedGroup] = useState('IELTS Intensive #12');
  const [dueDate, setDueDate] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    let unsubAssignments: () => void = () => {};
    let unsubGroups: () => void = () => {};
    let isMounted = true;

    setIsLoading(true);

    try {
      unsubAssignments = subscribeAssignments((data) => {
        if (!isMounted) return;
        setAssignments(data);
        setIsLoading(false);
      });

      unsubGroups = subscribeGroups((gList) => {
        if (!isMounted) return;
        setGroups(gList);
        if (gList.length > 0) {
          setSelectedGroup(gList[0].name);
        }
      });
    } catch (err) {
      console.error('Error connecting to Firestore homework:', err);
      if (isMounted) setIsLoading(false);
    }

    const timer = setTimeout(() => {
      if (isMounted) setIsLoading(false);
    }, 2000);

    return () => {
      isMounted = false;
      clearTimeout(timer);
      unsubAssignments();
      unsubGroups();
    };
  }, []);

  const handleCreateAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    try {
      await addAssignment({
        title: title.trim(),
        group: selectedGroup,
        dueDate: dueDate || new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
        submittedCount: 0,
        totalStudents: 14,
        file: file ? file.name : 'Assignment_Guide.pdf'
      });

      setTitle('');
      setDueDate('');
      setFile(null);
      setIsCreating(false);
      setToastMessage(t("Topshiriq e'lon qilindi!", "Assignment posted successfully!", "Задание успешно опубликовано!"));
      setTimeout(() => setToastMessage(null), 3000);
    } catch (err) {
      console.error('Error adding assignment:', err);
    }
  };

  const handleDeleteAssignment = async (id: string) => {
    try {
      await deleteAssignment(id);
      setToastMessage(t("Topshiriq o'chirildi", "Assignment deleted", "Задание удалено"));
      setTimeout(() => setToastMessage(null), 3000);
    } catch (err) {
      console.error('Error deleting assignment:', err);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Toast */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 px-5 py-3 rounded-2xl bg-emerald-500 text-slate-950 font-black text-xs shadow-xl animate-bounce">
          {toastMessage}
        </div>
      )}

      {/* Header */}
      <div className="p-6 rounded-3xl bg-slate-900 text-white border border-slate-800 shadow-xl flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black">
            {t("Vazifalar & Audio/PDF Yuklamalar", "Homework & Media Management", "Задания и Загрузка Audio/PDF")}
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            {t(
              "O'quvchilaringizga dars audiolari, insho topshiriqlari va PDF resurslarini e'lon qiling.",
              "Upload listening mp3s, PDF files, and essay assignments for your classes.",
              "Публикуйте аудиозаписи уроков, эссе и PDF-ресурсы для ваших учеников."
            )}
          </p>
        </div>

        <button
          onClick={() => setIsCreating(!isCreating)}
          className="px-5 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-md shadow-amber-500/20 transition cursor-pointer flex items-center gap-2 shrink-0"
        >
          <Upload className="w-4 h-4" />
          <span>{t("Yangi Vazifa Yuklash", "Create Assignment", "Создать Задание")}</span>
        </button>
      </div>

      {/* New Assignment Form Modal */}
      {isCreating && (
        <form onSubmit={handleCreateAssignment} className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-amber-500/50 shadow-xl space-y-4">
          <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
            {t("Yangi Topshiriq Yaratish", "Upload New Assignment", "Создать Новое Задание")}
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                {t("Topshiriq Sarlavhasi", "Assignment Title", "Название Задания")}
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Masalan: IELTS Writing Task 2 Essay"
                className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs focus:ring-2 focus:ring-amber-500 text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                {t("Guruhni Tanlang", "Select Group", "Выберите Группу")}
              </label>
              <select
                value={selectedGroup}
                onChange={(e) => setSelectedGroup(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs focus:ring-2 focus:ring-amber-500 text-slate-900 dark:text-white"
              >
                {groups.length > 0 ? (
                  groups.map((g) => (
                    <option key={g.id} value={g.name}>
                      {g.name}
                    </option>
                  ))
                ) : (
                  <>
                    <option value="IELTS Intensive #12">IELTS Intensive #12</option>
                    <option value="General English B2">General English B2</option>
                    <option value="CEFR C1 Master">CEFR C1 Master</option>
                  </>
                )}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                {t("Topshirish Muddat (Deadline)", "Due Date", "Срок Сдачи (Дедлайн)")}
              </label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs focus:ring-2 focus:ring-amber-500 text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                {t("Fayl Biriktirish (PDF/MP3)", "Attach File (PDF/MP3)", "Прикрепить Файл (PDF/MP3)")}
              </label>
              <input
                type="file"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
                className="w-full px-4 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-500"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setIsCreating(false)}
              className="px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-bold text-slate-600 dark:text-slate-300 cursor-pointer"
            >
              {t("Bekor qilish", "Cancel", "Отмена")}
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold shadow-md shadow-amber-500/20 cursor-pointer"
            >
              {t("E'lon qilish", "Publish Assignment", "Опубликовать")}
            </button>
          </div>
        </form>
      )}

      {/* Active Assignments List */}
      {isLoading ? (
        <div className="space-y-4">
          {[1, 2].map((i) => (
            <div key={i} className="h-28 rounded-3xl animate-pulse bg-slate-200 dark:bg-slate-800/50 border border-slate-300 dark:border-slate-800" />
          ))}
        </div>
      ) : assignments.length === 0 ? (
        /* Production Empty State */
        <div className="p-12 text-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl space-y-3">
          <FileText className="w-12 h-12 text-amber-500 mx-auto opacity-80" />
          <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
            {t("Ushbu guruh uchun vazifalar topilmadi", "No assignments created yet for this class group", "Для этой группы задания не найдены")}
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
            {t(
              "Yangi topshiriq e'lon qilish uchun yuqoridagi 'Yangi Vazifa Yuklash' tugmasini bosing.",
              "Click 'Create Assignment' above to upload audio drills or PDF exercises.",
              "Нажмите 'Создать Задание' выше, чтобы загрузить аудио или упражнения в PDF."
            )}
          </p>
          <button
            onClick={() => setIsCreating(true)}
            className="px-5 py-2.5 rounded-xl bg-amber-500 text-slate-950 font-bold text-xs inline-flex items-center gap-2 cursor-pointer shadow-md"
          >
            <Plus className="w-4 h-4" />
            <span>{t("Vazifa Yuklash", "Post Assignment", "Загрузить Задание")}</span>
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {assignments.map((hw) => (
            <div
              key={hw.id}
              className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-md flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
            >
              <div className="space-y-1">
                <span className="px-3 py-1 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 text-[10px] font-bold border border-amber-500/20">
                  {hw.group}
                </span>
                <h4 className="text-base font-extrabold text-slate-900 dark:text-white mt-1">
                  {hw.title}
                </h4>
                <div className="flex items-center gap-4 text-xs text-slate-500 dark:text-slate-400 pt-1">
                  <span className="flex items-center gap-1">
                    <Paperclip className="w-3.5 h-3.5 text-amber-500" />
                    {hw.file || 'Assignment_Guide.pdf'}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-rose-500" />
                    Deadline: {hw.dueDate}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <div className="text-right">
                  <span className="text-xs font-bold text-slate-900 dark:text-white block">
                    {hw.submittedCount || 0} / {hw.totalStudents || 14} {t("Topshirildi", "Submitted", "Сдано")}
                  </span>
                  <span className="text-[10px] text-emerald-500 font-bold">
                    {Math.round(((hw.submittedCount || 0) / (hw.totalStudents || 14)) * 100)}% {t("Bajarildi", "Completed", "Выполнено")}
                  </span>
                </div>

                <button
                  onClick={() => handleDeleteAssignment(hw.id)}
                  className="p-2.5 rounded-xl bg-rose-500/10 hover:bg-rose-500 hover:text-white text-rose-500 transition cursor-pointer"
                  title="Delete Assignment"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
