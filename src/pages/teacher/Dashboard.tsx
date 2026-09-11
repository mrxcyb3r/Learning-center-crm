import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useTeacherPortal } from '../../context/TeacherPortalContext';
import { useLanguage } from '../../context/LanguageContext';
import {
  BookOpen,
  Users,
  Send,
  CheckCircle2,
  XCircle,
  Clock,
  Award,
  Sparkles,
  Search,
  Check,
  Save,
  GraduationCap,
  Code,
  FileCheck2,
  AlertCircle
} from 'lucide-react';

interface StudentGradeItem {
  id: string;
  name: string;
  telegramUsername: string;
  telegramConnected: boolean;
  score: string;
  feedback: string;
  attendance: 'present' | 'absent' | 'late';
  dispatched: boolean;
}

interface TeacherGroup {
  id: string;
  name: string;
  subject: string;
  category: 'IELTS' | 'Programming' | 'Math & SAT' | 'Physics';
  schedule: string;
  room: string;
  students: StudentGradeItem[];
}

function inferCategory(course: string): TeacherGroup['category'] {
  if (/ielts|cefr|english|ingliz/i.test(course)) return 'IELTS';
  if (/python|cyber|web|it\b|dastur/i.test(course)) return 'Programming';
  if (/physic|fizika/i.test(course)) return 'Physics';
  return 'Math & SAT';
}

export const TeacherDashboard: React.FC = () => {
  const { userProfile, currentUser } = useAuth();
  // Scoped source: only groups/students from this teacher's assignment index.
  const { myGroups, myStudents } = useTeacherPortal();
  const { language } = useLanguage();

  const t = (uz: string, en: string, ru: string) => {
    if (language === 'UZ') return uz;
    if (language === 'RU') return ru;
    return en;
  };

  // Local interactive state (grades/feedback/attendance/dispatch) seeded from
  // scoped Firestore data. Empty when nothing is assigned — never mock data.
  const [groups, setGroups] = useState<TeacherGroup[]>([]);
  const [selectedGroupId, setSelectedGroupId] = useState<string>('');

  useEffect(() => {
    const mapped: TeacherGroup[] = myGroups.map((g) => {
      const course = g.course || g.courseType || '';
      const memberIds = new Set(g.studentIds ?? []);
      const members = myStudents.filter((s) => memberIds.has(s.id) || s.groupId === g.id);
      return {
        id: g.id,
        name: g.groupName || g.name,
        subject: course,
        category: inferCategory(course),
        schedule: g.scheduleTime || [g.days, g.time].filter(Boolean).join(' ') || '',
        room: g.room || '',
        students: members.map((s) => ({
          id: s.id,
          name: s.fullName,
          telegramUsername: s.telegramHandle || '',
          telegramConnected: Boolean(s.telegramHandle),
          score: '',
          feedback: '',
          attendance: 'present' as const,
          dispatched: false,
        })),
      };
    });
    setGroups(mapped);
    setSelectedGroupId((prev) => (mapped.some((g) => g.id === prev) ? prev : (mapped[0]?.id || '')));
  }, [myGroups, myStudents]);
  const [testTitle, setTestTitle] = useState<string>('Diagnostic Test #4');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const activeGroup = groups.find((g) => g.id === selectedGroupId) || groups[0] || null;

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Handle Grade Change
  const handleGradeChange = (studentId: string, newScore: string) => {
    setGroups((prevGroups) =>
      prevGroups.map((group) => {
        if (group.id !== selectedGroupId) return group;
        return {
          ...group,
          students: group.students.map((student) =>
            student.id === studentId ? { ...student, score: newScore, dispatched: false } : student
          ),
        };
      })
    );
  };

  // Handle Feedback Change
  const handleFeedbackChange = (studentId: string, newFeedback: string) => {
    setGroups((prevGroups) =>
      prevGroups.map((group) => {
        if (group.id !== selectedGroupId) return group;
        return {
          ...group,
          students: group.students.map((student) =>
            student.id === studentId ? { ...student, feedback: newFeedback } : student
          ),
        };
      })
    );
  };

  // Handle Attendance Toggle
  const handleAttendanceToggle = (studentId: string, status: 'present' | 'absent' | 'late') => {
    setGroups((prevGroups) =>
      prevGroups.map((group) => {
        if (group.id !== selectedGroupId) return group;
        return {
          ...group,
          students: group.students.map((student) =>
            student.id === studentId ? { ...student, attendance: status } : student
          ),
        };
      })
    );
  };

  // Quick Action: Mark All Present
  const handleMarkAllPresent = () => {
    setGroups((prevGroups) =>
      prevGroups.map((group) => {
        if (group.id !== selectedGroupId) return group;
        return {
          ...group,
          students: group.students.map((student) => ({ ...student, attendance: 'present' })),
        };
      })
    );
    showToast(t("Barcha o'quvchilar 'Qatnashdi' deb belgilandi! ✅", "All students marked as Present! ✅", "Все студенты отмечены как Присутствующие! ✅"));
  };

  // Dispatch single grade via Telegram API
  const handleDispatchSingle = async (student: StudentGradeItem) => {
    if (!activeGroup) return;
    try {
      const response = await fetch('/api/bot/notify-grade', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentUid: student.id,
          title: `${activeGroup.name} - ${testTitle}`,
          score: `${student.score} (${student.feedback || 'No comments'})`
        }),
      });

      if (!response.ok) {
        throw new Error(`Server returned ${response.status}`);
      }

      setGroups((prevGroups) =>
        prevGroups.map((group) => {
          if (group.id !== selectedGroupId) return group;
          return {
            ...group,
            students: group.students.map((st) =>
              st.id === student.id ? { ...st, dispatched: true } : st
            ),
          };
        })
      );

      showToast(t(`${student.name} ga Telegram xabari yuborildi! 🚀`, `Telegram alert sent to ${student.name}! 🚀`, `Отправлено уведомление в Telegram для ${student.name}! 🚀`));
    } catch (err: unknown) {
      console.error('Failed to dispatch grade:', err);
      showToast(t("Telegram bildirishnomasini yuborishda xatolik yuz berdi.", "Error sending Telegram alert.", "Ошибка отправки уведомления Telegram."));
    }
  };

  // Dispatch batch grades via Telegram API
  const handleDispatchAll = async () => {
    if (!activeGroup) return;
    setIsSubmitting(true);
    try {
      let successCount = 0;
      for (const student of activeGroup.students) {
        if (!student.dispatched && student.telegramConnected) {
          const response = await fetch('/api/bot/notify-grade', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              studentUid: student.id,
              title: `${activeGroup.name} - ${testTitle}`,
              score: `${student.score} | Attendance: ${student.attendance.toUpperCase()}`
            }),
          });
          if (response.ok) successCount++;
        }
      }

      setGroups((prevGroups) =>
        prevGroups.map((group) => {
          if (group.id !== selectedGroupId) return group;
          return {
            ...group,
            students: group.students.map((st) => ({ ...st, dispatched: true })),
          };
        })
      );

      showToast(t(`Barcha ${successCount} ta ulashtirilgan o'quvchilarga natijalar jo'natildi! 📲`, `Batch dispatched grade alerts to ${successCount} connected students! 📲`, `Пакетные результаты отправлены ${successCount} студентам! 📲`));
    } catch (err: unknown) {
      console.error('Batch dispatch error:', err);
      showToast(t("Pakerli yuborishda xatolik yuz berdi.", "Error during batch grade dispatch.", "Ошибка при пакетной отправке."));
    } finally {
      setIsSubmitting(false);
    }
  };

  // Empty assignment set: show an empty state instead of mock data.
  if (!activeGroup) {
    return (
      <div className="space-y-6">
        <div className="p-12 text-center rounded-3xl bg-slate-900/60 border border-slate-800">
          <GraduationCap className="w-10 h-10 mx-auto mb-3 text-slate-600" />
          <h3 className="text-base font-extrabold text-white">
            {t("Sizga hali guruh biriktirilmagan", "No groups assigned yet", "Вам пока не назначены группы")}
          </h3>
          <p className="text-xs text-slate-400 mt-2">
            {t(
              "Administrator guruh tayinlagach, ular shu yerda ko'rinadi.",
              "Groups will appear here once an administrator assigns them.",
              "Группы появятся здесь после назначения администратором."
            )}
          </p>
        </div>
      </div>
    );
  }

  const filteredStudents = activeGroup.students.filter(s =>
    s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.telegramUsername.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const presentCount = activeGroup.students.filter(s => s.attendance === 'present').length;
  const lateCount = activeGroup.students.filter(s => s.attendance === 'late').length;
  const absentCount = activeGroup.students.filter(s => s.attendance === 'absent').length;

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 px-4 py-3 rounded-2xl bg-slate-900 text-white shadow-2xl border border-amber-500/40 text-xs font-bold flex items-center gap-2 animate-bounce">
          <Sparkles className="w-4 h-4 text-amber-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="p-6 rounded-3xl bg-slate-900/60 border border-slate-800 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/30 text-xs font-extrabold uppercase tracking-wider">
              {t('Oqituvchi Portali', 'Teacher Portal', 'Портал Преподавателя')}
            </span>
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-[10px] font-mono font-bold">
              LIVE CO-PILOT ACTIVE
            </span>
          </div>
          <h1 className="text-2xl font-black text-white mt-2 flex items-center gap-2">
            <GraduationCap className="w-7 h-7 text-amber-400" />
            <span>{t('Multi-Fan O\'qituvchi Boshqaruv Markazi', 'Multi-Subject Instructor Control Center', 'Мульти-Предметный Центр Управления')}</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            {t(
              `Xush kelibsiz, ${userProfile?.displayName || currentUser?.displayName || 'Ustoz'}! Guruhlarni tanlang, baholarni kiriting va 1-bosish bilan Telegramga tarqating.`,
              `Welcome back, ${userProfile?.displayName || currentUser?.displayName || 'Instructor'}! Select class groups, manage grades, and dispatch via 1-click Telegram alerts.`,
              `Добро пожаловать, ${userProfile?.displayName || currentUser?.displayName || 'Преподаватель'}! Выберите группу, введите оценки и отправляйте в Telegram.`
            )}
          </p>
        </div>

        {/* Quick Stats Cards */}
        <div className="flex items-center gap-3">
          <div className="px-4 py-3 rounded-2xl bg-slate-950/80 border border-slate-800 text-center min-w-[100px]">
            <div className="text-lg font-black text-amber-400">{groups.length}</div>
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{t('Guruhlar', 'Active Groups', 'Группы')}</div>
          </div>
          <div className="px-4 py-3 rounded-2xl bg-slate-950/80 border border-slate-800 text-center min-w-[100px]">
            <div className="text-lg font-black text-emerald-400">{activeGroup.students.length}</div>
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{t('O\'quvchilar', 'Total Students', 'Студенты')}</div>
          </div>
        </div>
      </div>

      {/* 1. Group & Subject Selector Tabs */}
      <div className="p-4 rounded-3xl bg-slate-900/60 border border-slate-800 shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-extrabold text-white flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-amber-400" />
            <span>{t('Faol Fan va Guruhni Tanlang:', 'Select Active Class Group:', 'Выберите Активную Группу:')}</span>
          </h2>
          <span className="text-xs font-semibold text-slate-400">
            {activeGroup.schedule} • {activeGroup.room}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {groups.map((group) => {
            const isSelected = group.id === selectedGroupId;
            return (
              <button
                key={group.id}
                onClick={() => setSelectedGroupId(group.id)}
                className={`p-4 rounded-2xl border text-left transition-all cursor-pointer relative overflow-hidden ${
                  isSelected
                    ? 'bg-gradient-to-br from-amber-500/20 via-slate-900 to-slate-900 border-amber-500/60 shadow-lg shadow-amber-500/10'
                    : 'bg-slate-950/60 border-slate-800 hover:border-slate-700 text-slate-300'
                }`}
              >
                {isSelected && (
                  <div className="absolute top-0 right-0 w-12 h-12 bg-amber-500/20 rounded-bl-full flex items-start justify-end p-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  </div>
                )}
                <div className="text-xs font-bold text-amber-400/90 uppercase tracking-wider mb-1">
                  {group.category}
                </div>
                <div className="font-extrabold text-white text-base leading-tight">
                  {group.name}
                </div>
                <div className="text-xs text-slate-400 mt-1 line-clamp-1">
                  {group.subject}
                </div>
                <div className="mt-3 flex items-center justify-between text-[11px] font-semibold text-slate-400 pt-2 border-t border-slate-800/80">
                  <span className="flex items-center gap-1">
                    <Users className="w-3 h-3 text-slate-400" />
                    {group.students.length} {t('O\'quvchi', 'Students', 'Студентов')}
                  </span>
                  <span className="text-amber-400/80 font-mono">
                    {group.students.filter(s => s.dispatched).length}/{group.students.length} Sent
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Controls & Filter Header */}
      <div className="p-4 rounded-3xl bg-slate-900/60 border border-slate-800 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Test Title & Search */}
        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
          <div className="flex items-center gap-2 bg-slate-950 px-3.5 py-2 rounded-xl border border-slate-800">
            <Award className="w-4 h-4 text-amber-400 shrink-0" />
            <input
              type="text"
              value={testTitle}
              onChange={(e) => setTestTitle(e.target.value)}
              placeholder="Test Title (e.g., Mock #4)"
              className="bg-transparent text-xs font-bold text-white focus:outline-none w-36 sm:w-44"
            />
          </div>

          <div className="flex items-center gap-2 bg-slate-950 px-3 py-2 rounded-xl border border-slate-800 w-full sm:w-auto">
            <Search className="w-3.5 h-3.5 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t('Qidirish...', 'Search student...', 'Поиск студента...')}
              className="bg-transparent text-xs font-semibold text-white focus:outline-none w-full sm:w-36"
            />
          </div>
        </div>

        {/* Action Dispatch Buttons */}
        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <button
            onClick={handleMarkAllPresent}
            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
          >
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>{t("Hamma keldi", "Mark All Present", "Все пришли")}</span>
          </button>

          <button
            onClick={handleDispatchAll}
            disabled={isSubmitting}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs transition shadow-lg shadow-amber-500/20 flex items-center gap-2 cursor-pointer disabled:opacity-50"
          >
            <Send className="w-3.5 h-3.5 fill-slate-950" />
            <span>{isSubmitting ? 'Yuborilmoqda...' : t("Telegram'ga Barchaga Jo'natish", "Dispatch All via Telegram", "Отправить Всем в Telegram")}</span>
          </button>
        </div>
      </div>

      {/* 3. Batch Grade & Attendance Table */}
      <div className="p-4 sm:p-6 rounded-3xl bg-slate-900/60 border border-slate-800 shadow-xl overflow-x-auto">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-extrabold text-white flex items-center gap-2">
            <FileCheck2 className="w-5 h-5 text-amber-400" />
            <span>{activeGroup.name} - {t('Baholash va Davomat', 'Batch Grades & Attendance', 'Оценки и Посещаемость')}</span>
          </h3>

          <div className="flex items-center gap-3 text-xs font-bold">
            <span className="flex items-center gap-1 text-emerald-400">
              <CheckCircle2 className="w-3.5 h-3.5" /> {presentCount} Present
            </span>
            <span className="flex items-center gap-1 text-amber-400">
              <Clock className="w-3.5 h-3.5" /> {lateCount} Late
            </span>
            <span className="flex items-center gap-1 text-rose-400">
              <XCircle className="w-3.5 h-3.5" /> {absentCount} Absent
            </span>
          </div>
        </div>

        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-800 text-[11px] font-black uppercase text-slate-400 tracking-wider">
              <th className="py-3 px-4">{t('O\'quvchi F.I.Sh.', 'Student Name', 'Студент')}</th>
              <th className="py-3 px-4">{t('Telegram Akkount', 'Telegram Account', 'Telegram Аккаунт')}</th>
              <th className="py-3 px-4">{t('Davomat', 'Attendance Status', 'Посещаемость')}</th>
              <th className="py-3 px-4">{t('Natija / Ball', 'Grade / Band / Score', 'Оценка / Балл')}</th>
              <th className="py-3 px-4">{t('O\'qituvchi Izohi', 'Teacher Feedback', 'Комментарий')}</th>
              <th className="py-3 px-4 text-right">{t('Telegram Xabar', 'Dispatch Alert', 'Отправка')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 text-xs">
            {filteredStudents.map((student) => (
              <tr key={student.id} className="hover:bg-slate-950/40 transition">
                {/* Student Name */}
                <td className="py-3.5 px-4 font-extrabold text-white">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-slate-800 text-amber-400 font-black flex items-center justify-center border border-slate-700 shrink-0">
                      {student.name[0]}
                    </div>
                    <div>
                      <div>{student.name}</div>
                      <div className="text-[10px] font-mono text-slate-400">ID: {student.id}</div>
                    </div>
                  </div>
                </td>

                {/* Telegram Connection Badge */}
                <td className="py-3.5 px-4">
                  {student.telegramConnected ? (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 text-[11px] font-mono font-bold">
                      <Send className="w-3 h-3" />
                      {student.telegramUsername}
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-800 text-slate-400 text-[11px] font-mono">
                      <AlertCircle className="w-3 h-3 text-amber-400" />
                      Not Linked
                    </span>
                  )}
                </td>

                {/* Attendance Toggles */}
                <td className="py-3.5 px-4">
                  <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 w-fit">
                    <button
                      onClick={() => handleAttendanceToggle(student.id, 'present')}
                      className={`px-2.5 py-1 rounded-lg text-[10px] font-extrabold transition cursor-pointer ${
                        student.attendance === 'present'
                          ? 'bg-emerald-500 text-slate-950 shadow-md'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      Present
                    </button>
                    <button
                      onClick={() => handleAttendanceToggle(student.id, 'late')}
                      className={`px-2.5 py-1 rounded-lg text-[10px] font-extrabold transition cursor-pointer ${
                        student.attendance === 'late'
                          ? 'bg-amber-500 text-slate-950 shadow-md'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      Late
                    </button>
                    <button
                      onClick={() => handleAttendanceToggle(student.id, 'absent')}
                      className={`px-2.5 py-1 rounded-lg text-[10px] font-extrabold transition cursor-pointer ${
                        student.attendance === 'absent'
                          ? 'bg-rose-500 text-white shadow-md'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      Absent
                    </button>
                  </div>
                </td>

                {/* Score Input */}
                <td className="py-3.5 px-4">
                  <input
                    type="text"
                    value={student.score}
                    onChange={(e) => handleGradeChange(student.id, e.target.value)}
                    className="w-24 px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-amber-400 font-extrabold text-xs focus:border-amber-500 focus:outline-none"
                    placeholder="e.g. 7.5 or 90/100"
                  />
                </td>

                {/* Feedback Input */}
                <td className="py-3.5 px-4">
                  <input
                    type="text"
                    value={student.feedback}
                    onChange={(e) => handleFeedbackChange(student.id, e.target.value)}
                    className="w-full min-w-[180px] px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 font-medium text-xs focus:border-amber-500 focus:outline-none"
                    placeholder="Feedback comments..."
                  />
                </td>

                {/* Action Single Dispatch Button */}
                <td className="py-3.5 px-4 text-right">
                  <button
                    onClick={() => handleDispatchSingle(student)}
                    disabled={!student.telegramConnected}
                    className={`px-3 py-1.5 rounded-xl font-extrabold text-xs transition inline-flex items-center gap-1.5 cursor-pointer ${
                      student.dispatched
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        : student.telegramConnected
                        ? 'bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30'
                        : 'bg-slate-800 text-slate-500 border border-slate-800 cursor-not-allowed'
                    }`}
                  >
                    {student.dispatched ? (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>Dispatched</span>
                      </>
                    ) : (
                      <>
                        <Send className="w-3.5 h-3.5" />
                        <span>Alert</span>
                      </>
                    )}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default TeacherDashboard;
