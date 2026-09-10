import React, { useEffect, useState } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { BookOpen, Users, Calendar, MapPin, Plus, CheckCircle2, Trash2 } from 'lucide-react';
import { subscribeGroups, addGroup, deleteGroup } from '../../services/firestore';
import { Group } from '../../types';

export const ClassesView: React.FC = () => {
  const { language } = useLanguage();
  const t = (uz: string, en: string, ru: string) => {
    if (language === 'UZ') return uz;
    if (language === 'RU') return ru;
    return en;
  };

  const [groupsList, setGroupsList] = useState<Group[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const [name, setName] = useState('');
  const [courseType, setCourseType] = useState('DTM & Milliy Sertifikat');
  const [teacherName, setTeacherName] = useState('Diyorbek Furqatovich');
  const [scheduleTime, setScheduleTime] = useState('Dush/Chor/Juma 14:00 - 16:00');
  const [room, setRoom] = useState("101-Auditoriya (1-Filial)");
  const [isAdding, setIsAdding] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    setIsLoading(true);
    const unsub = subscribeGroups((data) => {
      setGroupsList(data);
      setIsLoading(false);
    });

    return () => unsub();
  }, []);

  const handleAddGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    try {
      await addGroup({
        name: name.trim(),
        courseType,
        teacherId: 'teacher-1',
        teacherName: teacherName.trim(),
        scheduleTime: scheduleTime.trim(),
        room: room.trim(),
        activeStudentsCount: 0
      });

      setName('');
      setIsAdding(false);
      setToastMessage(t("Yangi guruh saqlandi!", "Group created successfully!", "Новая группа создана!"));
      setTimeout(() => setToastMessage(null), 3000);
    } catch (err) {
      console.error('Error adding group:', err);
    }
  };

  const handleDeleteGroup = async (id: string) => {
    try {
      await deleteGroup(id);
      setToastMessage(t("Guruh o'chirildi", "Group deleted", "Группа удалена"));
      setTimeout(() => setToastMessage(null), 3000);
    } catch (err) {
      console.error('Error deleting group:', err);
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
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 text-amber-400 text-xs font-bold border border-amber-500/30 mb-2">
            <BookOpen className="w-3.5 h-3.5" />
            <span>{t("Guruhlar & Dars Jadvallari", "Classes & Schedules", "Группы и Расписание")}</span>
          </div>
          <h2 className="text-2xl font-black">
            {t("O'quv Xonalari va Guruhlar Boshqaruvi", "Classes & Course Schedules", "Управление Классами и Группами")}
          </h2>
          <p className="text-xs text-slate-400 mt-1 max-w-lg">
            {t(
              "Markazdagi barcha dars guruhlari, xonalar birikmasi va o'qituvchilar jadvallarini boshqaring.",
              "Manage active class groups, assigned classrooms, and mentor schedules.",
              "Управление учебными группами, аудиториями и расписанием преподавателей."
            )}
          </p>
        </div>

        <button
          onClick={() => setIsAdding(!isAdding)}
          className="px-5 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-md shadow-amber-500/20 transition cursor-pointer flex items-center gap-2 shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>{t("Yangi Guruh Ochish", "Create New Group", "Создать Новую Группу")}</span>
        </button>
      </div>

      {/* Add Modal Form */}
      {isAdding && (
        <form onSubmit={handleAddGroup} className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-amber-500/50 shadow-xl space-y-4">
          <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">
            {t("Yangi Guruh Qo'shish", "Add New Group", "Добавить Новую Группу")}
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                {t("Guruh Nomi", "Group Name", "Название Группы")}
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="IELTS Master #15"
                className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                {t("Kurs Yo'nalishi", "Course Track", "Направление Курса")}
              </label>
              <select
                value={courseType}
                onChange={(e) => setCourseType(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500"
              >
                <option value="DTM & Milliy Sertifikat">DTM & Milliy Sertifikat</option>
                <option value="Matematika & Fizika">Matematika & Fizika</option>
                <option value="CEFR Ingliz Tili (B2 / C1)">CEFR Ingliz Tili (B2 / C1)</option>
                <option value="English Kids (3–10 yosh)">English Kids (3–10 yosh)</option>
                <option value="Mental Arifmetika">Mental Arifmetika</option>
                <option value="Ona Tili va Adabiyot">Ona Tili va Adabiyot</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                {t("Biriktirilgan Ustoz", "Assigned Teacher", "Преподаватель")}
              </label>
              <input
                type="text"
                value={teacherName}
                onChange={(e) => setTeacherName(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                {t("Dars Vaqti", "Schedule Time", "Время Занятий")}
              </label>
              <input
                type="text"
                value={scheduleTime}
                onChange={(e) => setScheduleTime(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                {t("Xona", "Classroom", "Аудитория")}
              </label>
              <input
                type="text"
                value={room}
                onChange={(e) => setRoom(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setIsAdding(false)}
              className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-bold text-slate-600 dark:text-slate-300 cursor-pointer"
            >
              {t("Bekor qilish", "Cancel", "Отмена")}
            </button>
            <button
              type="submit"
              className="px-6 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold shadow-md shadow-amber-500/20 cursor-pointer"
            >
              {t("Saqlash", "Save Group", "Сохранить")}
            </button>
          </div>
        </form>
      )}

      {/* Class Cards Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-44 rounded-3xl animate-pulse bg-slate-200 dark:bg-slate-800/50 border border-slate-300 dark:border-slate-800" />
          ))}
        </div>
      ) : groupsList.length === 0 ? (
        /* Empty State */
        <div className="p-12 text-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl space-y-3">
          <BookOpen className="w-12 h-12 text-amber-500 mx-auto opacity-80" />
          <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
            {t("Hozircha faol guruhlar ro'yxatga olinmagan", "No active class groups found in Firestore", "Активные группы не найдены")}
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
            {t(
              "Yangi guruh ochish uchun yuqoridagi 'Yangi Guruh Ochish' tugmasini bosing.",
              "Click 'Create New Group' above to create classrooms and course schedules.",
              "Нажмите 'Создать Новую Группу' выше, чтобы добавить аудиторию и расписание."
            )}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {groupsList.map((g) => (
            <div
              key={g.id}
              className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-md space-y-4 hover:border-amber-500/50 transition relative group"
            >
              <div className="flex items-center justify-between">
                <span className="px-3 py-1 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 text-[10px] font-bold border border-amber-500/20">
                  {g.courseType}
                </span>
                <span className="text-xs font-bold text-emerald-500 flex items-center gap-1">
                  <Users className="w-3.5 h-3.5" /> {g.activeStudentsCount || 0} {t("o'quvchi", "students", "учеников")}
                </span>
              </div>

              <div>
                <h3 className="text-lg font-black text-slate-900 dark:text-white">
                  {g.name}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">{t("Ustoz", "Teacher", "Преподаватель")}: {g.teacherName}</p>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 text-xs space-y-1.5 text-slate-600 dark:text-slate-300 font-semibold">
                <div className="flex items-center gap-2">
                  <Calendar className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                  <span>{g.scheduleTime}</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                  <span>{g.room}</span>
                </div>
              </div>

              <div className="flex justify-end pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  onClick={() => handleDeleteGroup(g.id)}
                  className="p-2 rounded-xl text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 transition cursor-pointer"
                  title={t("Guruhni o'chirish", "Delete group", "Удалить группу")}
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
