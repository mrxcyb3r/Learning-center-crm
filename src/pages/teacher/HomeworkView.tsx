import React, { useEffect, useState } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { FileText, Upload, Clock, Trash2, Paperclip, Plus, Edit2, Eye, X, Download, Code, Headphones, BookOpen, Layers, Award, CheckCircle2, Sparkles } from 'lucide-react';
import { subscribeAssignments, addAssignment, updateAssignment, deleteAssignment, subscribeGroups, subscribeHomeworkSubmissions, notifyStudentsNewAssignment } from '../../services/firestore';
import { Assignment, Group, HomeworkSubmission } from '../../types';
import { WPSEditor } from '../../components/UI/WPSEditor';
import { GradingModal } from '../../components/Teacher/GradingModal';

const SUBJECT_CATEGORIES = [
  '📐 Mathematics & Geometry',
  '⚡ Physics & Engineering',
  '🧪 Chemistry & Biology',
  '💻 IT & Computer Science',
  '🎯 SAT / Standardized Testing',
  '🌐 Languages & IELTS/CEFR',
  '📚 General / Humanities'
];

const RESOURCE_FORMATS = [
  '📝 Problem Set / Quiz Sheet',
  '✍️ Essay / Long Form Writing',
  '🎧 Audio / Listening Drill',
  '💻 Code / Project Submission',
  '📖 Reading & Lecture Material'
];

export const HomeworkView: React.FC = () => {
  const { language } = useLanguage();
  const t = (uz: string, en: string, ru: string) => {
    if (language === 'UZ') return uz;
    if (language === 'RU') return ru;
    return en;
  };

  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [allSubmissions, setAllSubmissions] = useState<HomeworkSubmission[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Form states
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [subjectCategory, setSubjectCategory] = useState(SUBJECT_CATEGORIES[0]);
  const [resourceFormat, setResourceFormat] = useState(RESOURCE_FORMATS[0]);
  const [selectedGroup, setSelectedGroup] = useState('IELTS Intensive #12');
  const [dueDate, setDueDate] = useState('');
  const [file, setFile] = useState<File | null>(null);

  // Modal controls
  const [isCreating, setIsCreating] = useState(false);
  const [editingAssignment, setEditingAssignment] = useState<Assignment | null>(null);
  const [viewSubmissionsAssignment, setViewSubmissionsAssignment] = useState<Assignment | null>(null);
  const [gradingSubmission, setGradingSubmission] = useState<HomeworkSubmission | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    let unsubAssignments: () => void = () => {};
    let unsubGroups: () => void = () => {};
    let unsubSubmissions: () => void = () => {};
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

      unsubSubmissions = subscribeHomeworkSubmissions((subs) => {
        if (!isMounted) return;
        setAllSubmissions(subs);
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
      unsubSubmissions();
    };
  }, []);

  const handleDownloadFile = (fileUrl?: string, fileName?: string) => {
    const targetName = fileName || 'assignment_material';
    if (!fileUrl || fileUrl === '#' || fileUrl.trim() === '') {
      const blob = new Blob([
        `=== CenterFlow Learning Material ===\nTitle: ${targetName}\nDate: ${new Date().toLocaleDateString()}\nCourse study material generated for download.`
      ], { type: 'text/plain;charset=utf-8' });
      const dummyUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = dummyUrl;
      link.download = targetName.endsWith('.pdf') || targetName.endsWith('.txt') ? targetName : `${targetName}.txt`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(dummyUrl);
      setToastMessage(t("Fayl yuklab olindi! ⬇️", "Material downloaded! ⬇️", "Файл скачан! ⬇️"));
      setTimeout(() => setToastMessage(null), 3000);
      return;
    }
    const link = document.createElement('a');
    link.href = fileUrl;
    link.target = '_blank';
    link.download = targetName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleCreateAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const targetGroup = groups.find((g) => g.name === selectedGroup);

    try {
      if (editingAssignment) {
        await updateAssignment(editingAssignment.id, {
          title: title.trim(),
          description: description.trim(),
          subjectCategory,
          resourceFormat,
          group: selectedGroup,
          groupName: selectedGroup,
          groupId: targetGroup ? targetGroup.id : editingAssignment.groupId || 'Br2GDIO86SR5GcqfbmOD',
          dueDate: dueDate || editingAssignment.dueDate,
          deadline: dueDate || editingAssignment.deadline,
          file: file ? file.name : editingAssignment.file || 'Assignment_Guide.pdf',
          fileName: file ? file.name : editingAssignment.fileName || 'Assignment_Guide.pdf'
        });
        setToastMessage(t("Topshiriq yangilandi!", "Assignment updated successfully!", "Задание обновлено!"));
      } else {
        const newId = await addAssignment({
          title: title.trim(),
          description: description.trim(),
          subjectCategory,
          resourceFormat,
          group: selectedGroup,
          groupName: selectedGroup,
          groupId: targetGroup ? targetGroup.id : 'Br2GDIO86SR5GcqfbmOD',
          dueDate: dueDate || new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
          deadline: dueDate || new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
          submittedCount: 0,
          totalStudents: targetGroup ? targetGroup.activeStudentsCount : 14,
          file: file ? file.name : 'Assignment_Guide.pdf',
          fileName: file ? file.name : 'Assignment_Guide.pdf'
        });

        // Trigger notification for students
        const targetGroupId = targetGroup ? targetGroup.id : 'Br2GDIO86SR5GcqfbmOD';
        const formattedDueDate = dueDate || new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0];

        console.log('🚀 Dispatching homework notification to students:', {
          category: 'assignment_created',
          recipientRole: 'student',
          groupId: targetGroupId,
          linkId: newId,
          title: `New Assignment: ${title.trim()}`,
          message: `New homework posted for ${selectedGroup}. Due date: ${formattedDueDate}.`,
          isRead: false
        });

        await notifyStudentsNewAssignment(
          title.trim(),
          selectedGroup,
          targetGroupId,
          'Mr. Javohirbek',
          newId,
          formattedDueDate
        );
        console.log('✅ Notification created in Firestore');

        setToastMessage(t("Topshiriq e'lon qilindi!", "Assignment posted successfully!", "Задание успешно опубликовано!"));
      }

      resetForm();
      setTimeout(() => setToastMessage(null), 3000);
    } catch (err) {
      console.error('Error saving assignment:', err);
    }
  };

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setSubjectCategory(SUBJECT_CATEGORIES[0]);
    setResourceFormat(RESOURCE_FORMATS[0]);
    setDueDate('');
    setFile(null);
    setIsCreating(false);
    setEditingAssignment(null);
  };

  const startEditAssignment = (hw: Assignment) => {
    setEditingAssignment(hw);
    setTitle(hw.title);
    setDescription(hw.description || '');
    setSubjectCategory(hw.subjectCategory || SUBJECT_CATEGORIES[0]);
    setResourceFormat(hw.resourceFormat || RESOURCE_FORMATS[0]);
    setSelectedGroup(hw.group || hw.groupName || 'IELTS Intensive #12');
    setDueDate(hw.dueDate || hw.deadline || '');
    setIsCreating(true);
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

  const getSubjectBadgeStyle = (category?: string) => {
    if (!category) return 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20';
    if (category.includes('Math')) return 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20';
    if (category.includes('Physics')) return 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20';
    if (category.includes('Chemistry')) return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20';
    if (category.includes('IT') || category.includes('Computer')) return 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-500/20';
    if (category.includes('SAT')) return 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20';
    if (category.includes('Languages') || category.includes('IELTS')) return 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20';
    return 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20';
  };

  const currentSubmissions = viewSubmissionsAssignment
    ? allSubmissions.filter((s) => s.assignmentId === viewSubmissionsAssignment.id)
    : [];

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
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 text-amber-400 text-[10px] font-bold border border-amber-500/30 mb-2">
            <Layers className="w-3 h-3" />
            <span>Multi-Subject Universal Course Center</span>
          </div>
          <h2 className="text-2xl font-black">
            {t("Vazifalar & O'quv Materallari", "Universal Homework & Resource Center", "Универсальный Центр Заданий и Материалов")}
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            {t(
              "Matematika, Fizika, IT, SAT, Kimyo va Tillar bo'yicha mashq fayllari, kodlar va vazifalarni e'lon qiling va baholang.",
              "Publish problem sets, code repos, audio drills, and reading passages for any course subject.",
              "Публикуйте практические задачи, код, аудио и упражнения для любых предметов."
            )}
          </p>
        </div>

        <button
          onClick={() => {
            resetForm();
            setIsCreating(!isCreating);
          }}
          className="px-5 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-md shadow-amber-500/20 transition cursor-pointer flex items-center gap-2 shrink-0"
        >
          <Upload className="w-4 h-4" />
          <span>{t("Yangi Vazifa Yuklash", "Create Assignment", "Создать Задание")}</span>
        </button>
      </div>

      {/* New / Edit Assignment Form Modal */}
      {isCreating && (
        <form onSubmit={handleCreateAssignment} className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-amber-500/50 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
              {editingAssignment
                ? t("Topshiriqni Tahrirlash", "Edit Assignment", "Редактировать Задание")
                : t("Yangi Multi-Fan Topshiriq Yaratish", "Upload Multi-Subject Assignment", "Создать Новое Задание")}
            </h3>
            <button
              type="button"
              onClick={resetForm}
              className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

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
                placeholder="Masalan: SAT Math Quadratics Problem Set #4"
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
                className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs focus:ring-2 focus:ring-amber-500 text-slate-900 dark:text-white font-bold"
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
                    <option value="SAT Math Prep #3">SAT Math Prep #3</option>
                    <option value="Python Programming A1">Python Programming A1</option>
                  </>
                )}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                {t("Fan Kategoriya", "Subject Category", "Категория Предмета")}
              </label>
              <select
                value={subjectCategory}
                onChange={(e) => setSubjectCategory(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs focus:ring-2 focus:ring-amber-500 text-slate-900 dark:text-white"
              >
                {SUBJECT_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                {t("Material/Vazifa Formati", "Resource / Task Format", "Формат Задания / Ресурса")}
              </label>
              <select
                value={resourceFormat}
                onChange={(e) => setResourceFormat(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs focus:ring-2 focus:ring-amber-500 text-slate-900 dark:text-white"
              >
                {RESOURCE_FORMATS.map((fmt) => (
                  <option key={fmt} value={fmt}>
                    {fmt}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              {t("Tavsif & Ko'rsatmalar (WPS Rich Text)", "Description & Instructions (WPS Office Suite)", "Описание и Инструкции (WPS Office)")}
            </label>
            <WPSEditor
              value={description}
              onChange={setDescription}
              placeholder="Masalan: 1-15 masalalarni yechib, formulalar va hisoblarni kiriting..."
              minHeight="140px"
            />
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
                {t("Fayl Biriktirish (PDF/ZIP/MP3)", "Attach File (PDF/ZIP/MP3)", "Прикрепить Файл (PDF/ZIP/MP3)")}
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
              onClick={resetForm}
              className="px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-bold text-slate-600 dark:text-slate-300 cursor-pointer"
            >
              {t("Bekor qilish", "Cancel", "Отмена")}
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold shadow-md shadow-amber-500/20 cursor-pointer"
            >
              {editingAssignment
                ? t("Saqlash", "Save Changes", "Сохранить")
                : t("E'lon qilish", "Publish Assignment", "Опубликовать")}
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
        <div className="p-12 text-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl space-y-3">
          <FileText className="w-12 h-12 text-amber-500 mx-auto opacity-80" />
          <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
            {t("Ushbu guruh uchun vazifalar topilmadi", "No assignments created yet for this class group", "Для этой группы задания не найдены")}
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
            {t(
              "Yangi topshiriq e'lon qilish uchun yuqoridagi 'Yangi Vazifa Yuklash' tugmasini bosing.",
              "Click 'Create Assignment' above to upload math sets, physics exercises, or reading files.",
              "Нажмите 'Создать Задание' выше, чтобы загрузить задачи или упражнения."
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
          {assignments.map((hw) => {
            const submissionCount = allSubmissions.filter((s) => s.assignmentId === hw.id).length || hw.submittedCount || 0;
            return (
              <div
                key={hw.id}
                className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-md flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
              >
                <div className="space-y-2 max-w-xl">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[10px] font-bold border border-slate-200 dark:border-slate-700">
                      {hw.group}
                    </span>
                    <span className={`px-3 py-1 rounded-full text-[10px] font-bold border ${getSubjectBadgeStyle(hw.subjectCategory)}`}>
                      {hw.subjectCategory || '📐 Mathematics'}
                    </span>
                    <span className="px-3 py-1 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 text-[10px] font-bold border border-amber-500/20">
                      {hw.resourceFormat || '📝 Problem Set'}
                    </span>
                  </div>

                  <h4 className="text-base font-extrabold text-slate-900 dark:text-white">
                    {hw.title}
                  </h4>

                  {hw.description && (
                    <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2">
                      {hw.description}
                    </p>
                  )}

                  <div className="flex items-center gap-4 text-xs text-slate-500 dark:text-slate-400 pt-1">
                    <span className="flex items-center gap-1 font-semibold">
                      <Paperclip className="w-3.5 h-3.5 text-amber-500" />
                      {hw.file || hw.fileName || 'Assignment_Guide.pdf'}
                    </span>
                    <span className="flex items-center gap-1 font-semibold">
                      <Clock className="w-3.5 h-3.5 text-rose-500" />
                      Deadline: {hw.dueDate || hw.deadline}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <button
                    onClick={() => setViewSubmissionsAssignment(hw)}
                    className="px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5 transition cursor-pointer"
                  >
                    <Eye className="w-3.5 h-3.5 text-amber-500" />
                    <span>{submissionCount} / {hw.totalStudents || 14} {t("Topshirildi", "Submitted", "Сдано")}</span>
                  </button>

                  <button
                    onClick={() => startEditAssignment(hw)}
                    className="p-2.5 rounded-xl bg-amber-500/10 hover:bg-amber-500 hover:text-slate-950 text-amber-600 dark:text-amber-400 transition cursor-pointer"
                    title="Edit Assignment"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => handleDeleteAssignment(hw.id)}
                    className="p-2.5 rounded-xl bg-rose-500/10 hover:bg-rose-500 hover:text-white text-rose-500 transition cursor-pointer"
                    title="Delete Assignment"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* View Submissions Drawer / Modal */}
      {viewSubmissionsAssignment && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-2xl w-full p-6 shadow-2xl space-y-4 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <span className="text-[10px] font-bold text-amber-500 uppercase tracking-wider block">
                  {viewSubmissionsAssignment.group} • {viewSubmissionsAssignment.subjectCategory}
                </span>
                <h3 className="text-base font-black text-slate-900 dark:text-white">
                  {viewSubmissionsAssignment.title}
                </h3>
              </div>
              <button
                onClick={() => setViewSubmissionsAssignment(null)}
                className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                {t("O'quvchi Topshiriqlari", "Student Submissions", "Работы Учеников")} ({currentSubmissions.length})
              </h4>

              {currentSubmissions.length === 0 ? (
                <div className="p-8 text-center bg-slate-50 dark:bg-slate-800/50 rounded-2xl text-xs text-slate-500">
                  {t("Hozircha o'quvchilar javob yuklamadi.", "No student submissions received yet for this homework.", "Пока нет ответов от учеников.")}
                </div>
              ) : (
                <div className="space-y-2">
                  {currentSubmissions.map((sub) => (
                    <div
                      key={sub.id}
                      className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700/60 space-y-2"
                    >
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-extrabold text-slate-900 dark:text-white">
                          {sub.studentName || 'Student'}
                        </span>
                        <span className="text-[10px] text-slate-400 font-semibold">
                          {sub.date || sub.submittedAt || 'Today'}
                        </span>
                      </div>

                      {sub.solutionText && (
                        sub.solutionText.includes('<') ? (
                          <div
                            className="text-xs text-slate-800 dark:text-slate-200 bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 prose dark:prose-invert max-w-none font-sans overflow-x-auto"
                            dangerouslySetInnerHTML={{ __html: sub.solutionText }}
                          />
                        ) : (
                          <p className="text-xs text-slate-700 dark:text-slate-300 whitespace-pre-wrap bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-100 dark:border-slate-800">
                            {sub.solutionText}
                          </p>
                        )
                      )}

                      {sub.fileName && (
                        <div className="flex items-center justify-between text-xs pt-1">
                          <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400 font-bold">
                            <Paperclip className="w-3.5 h-3.5" />
                            {sub.fileName}
                          </span>
                          <button
                            onClick={() => handleDownloadFile(sub.fileUrl, sub.fileName)}
                            className="px-3 py-1 rounded-lg bg-amber-500 text-slate-950 font-extrabold text-[10px] flex items-center gap-1 hover:bg-amber-400 cursor-pointer"
                          >
                            <Download className="w-3 h-3" />
                            <span>Download</span>
                          </button>
                        </div>
                      )}

                      {/* Evaluation & Grading Action Bar */}
                      <div className="flex items-center justify-between text-xs border-t border-slate-200 dark:border-slate-700/60 pt-3 mt-2">
                        <div>
                          {sub.status === 'graded' ? (
                            <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-black text-[11px] border border-emerald-500/20 flex items-center gap-1">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>{t("Baholandi", "Graded", "Оценено")}: {sub.score || sub.grade}</span>
                            </span>
                          ) : (
                            <span className="px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 font-bold text-[11px] border border-amber-500/20 flex items-center gap-1">
                              <Sparkles className="w-3.5 h-3.5" />
                              <span>{t("Tekshirilmoqda", "Pending Review", "На проверке")}</span>
                            </span>
                          )}
                        </div>

                        <button
                          onClick={() => setGradingSubmission({
                            ...sub,
                            assignmentTitle: viewSubmissionsAssignment.title,
                            groupName: viewSubmissionsAssignment.group
                          })}
                          className="px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs flex items-center gap-1.5 shadow-md transition cursor-pointer active:scale-95"
                        >
                          <Award className="w-3.5 h-3.5" />
                          <span>{sub.status === 'graded' ? t("Qayta Baholash", "Re-evaluate", "Переоценить") : t("Baholash & Feedback", "Evaluate & Grade", "Оценить")}</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setViewSubmissionsAssignment(null)}
                className="px-5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold"
              >
                {t("Yopish", "Close", "Закрыть")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Production Teacher Grading & Feedback Modal */}
      <GradingModal
        isOpen={Boolean(gradingSubmission)}
        onClose={() => setGradingSubmission(null)}
        submission={gradingSubmission}
        onGradeSubmitted={() => {
          setToastMessage(t("Baho va bildirishnoma e'lon qilindi!", "Grade & notification published!", "Оценка и уведомление опубликованы!"));
          setTimeout(() => setToastMessage(null), 3500);
        }}
      />
    </div>
  );
};

