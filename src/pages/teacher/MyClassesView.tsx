import React, { useState } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { useTeacherPortal } from '../../context/TeacherPortalContext';
import { Group } from '../../types';
import {
  BookOpen,
  Users,
  Calendar,
  Clock,
  MapPin,
  Sparkles,
  Loader2,
  CheckCircle2,
  XCircle,
  ChevronRight,
  X,
  UserCheck
} from 'lucide-react';

export const MyClassesView: React.FC<{ onNavigateToAttendance?: (groupId: string) => void }> = ({
  onNavigateToAttendance
}) => {
  const { language } = useLanguage();
  const t = (uz: string, en: string, ru: string) => {
    if (language === 'UZ') return uz;
    if (language === 'RU') return ru;
    return en;
  };

  // Canonical scoped data: only groups/students from the teacher's own
  // assignment index. Empty means "no assignments yet" — never mock data.
  const { groups, students, isLoading } = useTeacherPortal();
  const [selectedGroupRoster, setSelectedGroupRoster] = useState<Group | null>(null);

  const getStudentsForGroup = (group: Group) => {
    return students.filter(
      (s) => s.groupId === group.id || s.groupName === group.name
    );
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header Banner */}
      <div className="p-6 rounded-3xl bg-slate-900 text-white border border-slate-800 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 text-blue-400 text-xs font-bold border border-blue-500/30 mb-2">
            <BookOpen className="w-3.5 h-3.5" />
            <span>{t("Mening Guruhlarim & Roster", "My Classes & Rosters", "Мои Группы и Списки")}</span>
          </div>
          <h1 className="text-2xl font-black tracking-tight">
            {t("O'qituvchi Dars Guruhlari", "Teacher Assigned Classes", "Учебные Группы Преподавателя")}
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            {t(
              "Guruhlar ro'yxati, dars vaqtlari, xonalar hamda o'quvchilar kontingenti boshqaruvi.",
              "Manage assigned groups, schedules, classrooms, and student class rosters.",
              "Управление группами, расписанием, кабинетами и списками учеников."
            )}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="px-4 py-2 rounded-2xl bg-slate-800 border border-slate-700 text-xs font-bold flex items-center gap-2 text-amber-400">
            <Users className="w-4 h-4" />
            <span>
              {groups.length} {t("ta Guruh", "Active Groups", "Групп")} • {students.length} {t("ta O'quvchi", "Enrolled Students", "Учеников")}
            </span>
          </div>
        </div>
      </div>

      {/* Classes Grid */}
      {isLoading ? (
        <div className="py-16 flex flex-col items-center justify-center text-slate-400 gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
          <span className="text-xs font-bold">
            {t("Guruhlar ro'yxati yuklanmoqda...", "Loading your assigned classes...", "Загрузка списка ваших групп...")}
          </span>
        </div>
      ) : groups.length === 0 ? (
        <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
          <div className="w-12 h-12 rounded-full bg-blue-500/10 text-blue-500 mx-auto flex items-center justify-center">
            <BookOpen className="w-6 h-6" />
          </div>
          <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
            {t("Hozircha biriktirilgan guruhlar yo'q", "No assigned classes found", "Пока нет прикрепленных групп")}
          </h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            {t(
              "Sizga hali guruh biriktirilmagan. Administrator guruh tayinlagach, ular shu yerda ko'rinadi.",
              "No groups assigned to you yet. Groups will appear here once an administrator assigns them.",
              "Вам пока не назначены группы. Они появятся здесь после назначения администратором."
            )}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {groups.map((group) => {
            const groupStudents = getStudentsForGroup(group);
            return (
              <div
                key={group.id}
                className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-6 shadow-sm hover:shadow-md transition flex flex-col justify-between"
              >
                <div className="space-y-4">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold tracking-wide uppercase bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                        {group.courseType || 'IELTS & CEFR'}
                      </span>
                      <h3 className="text-lg font-black text-slate-900 dark:text-white mt-2">
                        {group.name}
                      </h3>
                    </div>
                    <div className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold text-xs shrink-0 flex items-center gap-1">
                      <Users className="w-3.5 h-3.5 text-blue-500" />
                      <span>{groupStudents.length}</span>
                    </div>
                  </div>

                  <div className="space-y-2 text-xs text-slate-600 dark:text-slate-300 pt-1">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-amber-500 shrink-0" />
                      <span>{group.scheduleTime || 'Mon/Wed/Fri 14:00 - 16:00'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-rose-500 shrink-0" />
                      <span>{group.room || 'Room 3 (Main Hall)'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <UserCheck className="w-4 h-4 text-emerald-500 shrink-0" />
                      <span>{t("O'qituvchi:", "Teacher:", "Преподаватель:")} {group.teacherName || 'Mr. Javohirbek'}</span>
                    </div>
                  </div>
                </div>

                <div className="pt-6 mt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                  <button
                    onClick={() => setSelectedGroupRoster(group)}
                    className="flex-1 px-3 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-900 dark:text-white font-bold text-xs transition cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <Users className="w-3.5 h-3.5 text-blue-500" />
                    <span>{t("Ro'yxatni Ko'rish", "View Roster", "Список Учеников")}</span>
                  </button>

                  <button
                    onClick={() => onNavigateToAttendance?.(group.id)}
                    className="px-3.5 py-2.5 rounded-xl bg-blue-500 hover:bg-blue-600 text-white font-bold text-xs transition cursor-pointer flex items-center gap-1.5 shadow-sm"
                    title="Open Attendance Grid"
                  >
                    <Calendar className="w-3.5 h-3.5" />
                    <span>{t("Davomat", "Attendance", "Посещаемость")}</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Group Roster Modal */}
      {selectedGroupRoster && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-2xl w-full p-6 shadow-2xl space-y-4 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
              <div>
                <h3 className="text-lg font-black text-slate-900 dark:text-white">
                  {selectedGroupRoster.name} — {t("O'quvchilar Tarkibi", "Class Roster", "Состав Группы")}
                </h3>
                <p className="text-xs text-slate-500">
                  {selectedGroupRoster.scheduleTime} • {selectedGroupRoster.room}
                </p>
              </div>

              <button
                onClick={() => setSelectedGroupRoster(null)}
                className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 text-xs font-bold cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-2 pr-1">
              {getStudentsForGroup(selectedGroupRoster).length === 0 ? (
                <div className="py-8 text-center text-slate-400 text-xs">
                  {t("Ushbu guruhga hali o'quvchi biriktirilmagan.", "No students currently enrolled in this group.", "В эту группу пока не добавлены ученики.")}
                </div>
              ) : (
                getStudentsForGroup(selectedGroupRoster).map((student, idx) => (
                  <div
                    key={student.id}
                    className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-6 font-mono text-slate-400 font-bold">#{idx + 1}</span>
                      <div className="w-8 h-8 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 font-black flex items-center justify-center text-xs">
                        {student.fullName.charAt(0)}
                      </div>
                      <div>
                        <h4 className="font-extrabold text-slate-900 dark:text-white">
                          {student.fullName}
                        </h4>
                        <p className="text-[10px] text-slate-500 font-mono">
                          {student.phone}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span
                        className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                          student.paymentStatus === 'paid'
                            ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                            : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20'
                        }`}
                      >
                        {student.paymentStatus === 'paid' ? t("To'langan ✅", "Paid ✅", "Оплачено ✅") : t("Qarzdor ⚠️", "Pending ⚠️", "Задолженность ⚠️")}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end">
              <button
                onClick={() => setSelectedGroupRoster(null)}
                className="px-4 py-2 rounded-xl bg-slate-900 text-white font-bold text-xs cursor-pointer"
              >
                {t("Yopish", "Close", "Закрыть")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
