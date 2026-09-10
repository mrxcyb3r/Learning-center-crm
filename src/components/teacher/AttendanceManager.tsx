import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { notificationService } from '../../services/notificationService';
import {
  subscribeGroups,
  subscribeStudents,
  saveAttendanceRecord,
  getAttendanceRecord,
  seedFirestoreIfEmpty
} from '../../services/firestore';
import { DEFAULT_MOCK_GROUPS, DEFAULT_MOCK_STUDENTS } from '../../data/mockData';
import { Group, Student, AttendanceStudentEntry } from '../../types';
import {
  Calendar,
  CheckCircle2,
  XCircle,
  Clock,
  ShieldAlert,
  Save,
  BookOpen,
  UserCheck,
  Sparkles,
  Loader2,
  Check,
  RotateCcw,
  Users,
  Search,
  MessageSquare,
  AlertCircle,
  TrendingUp,
  Phone,
  Send,
  Sliders
} from 'lucide-react';

interface AttendanceManagerProps {
  initialGroupId?: string;
}

export interface StudentAttendanceState {
  status: 'present' | 'late' | 'absent' | 'excused';
  lateMinutes?: number;
  note?: string;
}

export const AttendanceManager: React.FC<AttendanceManagerProps> = ({ initialGroupId }) => {
  const { currentUser, userProfile } = useAuth();
  const { language, translate } = useLanguage();
  const t = (uz: string, en: string, ru: string) => translate(uz, en, ru);

  const [groups, setGroups] = useState<Group[]>([]);
  const [allStudents, setAllStudents] = useState<Student[]>([]);
  const [selectedGroupId, setSelectedGroupId] = useState(initialGroupId || '');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  
  // Matrix state map
  const [attendanceState, setAttendanceState] = useState<{ [studentId: string]: StudentAttendanceState }>({});
  const [initialLoadedState, setInitialLoadedState] = useState<{ [studentId: string]: StudentAttendanceState }>({});

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  useEffect(() => {
    let isMounted = true;
    seedFirestoreIfEmpty();

    const unsubGroups = subscribeGroups((groupList) => {
      if (!isMounted) return;
      const effectiveGroups = groupList.length > 0 ? groupList : DEFAULT_MOCK_GROUPS;
      setGroups(effectiveGroups);
      if (effectiveGroups.length > 0 && !selectedGroupId) {
        setSelectedGroupId(
          initialGroupId && effectiveGroups.some((g) => g.id === initialGroupId)
            ? initialGroupId
            : effectiveGroups[0].id
        );
      }
      setIsLoading(false);
    });

    const unsubStudents = subscribeStudents((studentList) => {
      if (!isMounted) return;
      setAllStudents(studentList.length > 0 ? studentList : DEFAULT_MOCK_STUDENTS);
      setIsLoading(false);
    });

    const timer = setTimeout(() => {
      if (isMounted) setIsLoading(false);
    }, 2000);

    return () => {
      isMounted = false;
      clearTimeout(timer);
      unsubGroups();
      unsubStudents();
    };
  }, []);

  // Filter students by selected group and sort alphabetically by name
  const activeGroupStudents = allStudents
    .filter(
      (s) => s.groupId === selectedGroupId || s.groupName === groups.find((g) => g.id === selectedGroupId)?.name
    )
    .sort((a, b) => a.fullName.localeCompare(b.fullName));

  // Filter students by search input
  const displayedStudents = activeGroupStudents.filter((st) =>
    st.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    st.phone.includes(searchQuery)
  );

  // Load existing attendance record from Firestore
  useEffect(() => {
    if (!selectedGroupId || activeGroupStudents.length === 0) return;

    async function loadAttendance() {
      setIsLoading(true);
      try {
        const existing = await getAttendanceRecord(selectedGroupId, selectedDate);
        if (existing && existing.records) {
          const formattedMap: { [studentId: string]: StudentAttendanceState } = {};
          
          activeGroupStudents.forEach((st) => {
            const rawVal = existing.records[st.id];
            if (typeof rawVal === 'string') {
              formattedMap[st.id] = { status: rawVal as any };
            } else if (rawVal && typeof rawVal === 'object') {
              formattedMap[st.id] = {
                status: rawVal.status || 'present',
                lateMinutes: rawVal.lateMinutes || 15,
                note: rawVal.note || ''
              };
            } else {
              formattedMap[st.id] = { status: 'present' };
            }
          });

          setAttendanceState(formattedMap);
          setInitialLoadedState(formattedMap);
        } else {
          // Default everyone to 'present'
          const defaultMap: { [studentId: string]: StudentAttendanceState } = {};
          activeGroupStudents.forEach((st) => {
            defaultMap[st.id] = { status: 'present' };
          });
          setAttendanceState(defaultMap);
          setInitialLoadedState(defaultMap);
        }
      } catch (err) {
        console.error('Error fetching attendance record:', err);
      } finally {
        setIsLoading(false);
      }
    }

    loadAttendance();
  }, [selectedGroupId, selectedDate, activeGroupStudents.length]);

  // Master Action: Mark All Present
  const handleMarkAllPresent = () => {
    const updatedMap: { [studentId: string]: StudentAttendanceState } = {};
    activeGroupStudents.forEach((st) => {
      updatedMap[st.id] = {
        ...attendanceState[st.id],
        status: 'present'
      };
    });
    setAttendanceState(updatedMap);
    showToast(t("Barcha o'quvchilar Darsda deb belgilandi!", "Marked all students as Present! ✅", "Все ученики отмечены как Присутствуют!"));
  };

  // Master Action: Reset Form
  const handleResetForm = () => {
    setAttendanceState({ ...initialLoadedState });
    showToast(t("O'zgarishlar bekor qilindi", "Attendance form reset", "Изменения сброшены"));
  };

  // Individual Student Status Pill Toggle
  const handleSetStatus = (studentId: string, status: 'present' | 'late' | 'absent' | 'excused') => {
    setAttendanceState((prev) => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        status,
        lateMinutes: status === 'late' ? prev[studentId]?.lateMinutes || 15 : undefined
      }
    }));
  };

  // Late Minutes update
  const handleLateMinutesChange = (studentId: string, minutes: number) => {
    setAttendanceState((prev) => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        lateMinutes: minutes
      }
    }));
  };

  // Note text update
  const handleNoteChange = (studentId: string, note: string) => {
    setAttendanceState((prev) => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        note
      }
    }));
  };

  // Save to Firestore
  const handleSaveAttendance = async () => {
    if (!selectedGroupId) return;
    setIsSaving(true);
    const selectedGroupObj = groups.find((g) => g.id === selectedGroupId);
    const teacherName = userProfile?.displayName || currentUser?.displayName || 'Mr. Javohirbek';

    try {
      await saveAttendanceRecord(selectedGroupId, selectedDate, attendanceState, teacherName);
      setInitialLoadedState({ ...attendanceState });
      notificationService.onAttendanceUpdated(selectedGroupObj?.name || 'Group', teacherName);
      showToast(
        t(
          `${selectedGroupObj?.name || 'Guruh'} uchun davomat Firestore ga saqlandi! ✅`,
          `Attendance record saved for ${selectedGroupObj?.name || 'Group'}! ✅`,
          `Посещаемость сохранена для ${selectedGroupObj?.name || 'Группы'}! ✅`
        )
      );
    } catch (err) {
      console.error(err);
      showToast(t("Davomatni saqlashda xatolik yuz berdi!", "Failed to save attendance record.", "Ошибка при сохранении!"));
    } finally {
      setIsSaving(false);
    }
  };

  const currentGroupObj = groups.find((g) => g.id === selectedGroupId);

  // Live Metrics Calculation
  const totalCount = activeGroupStudents.length;
  let presentCount = 0;
  let lateCount = 0;
  let absentCount = 0;
  let excusedCount = 0;

  Object.values(attendanceState).forEach((item) => {
    if (item.status === 'present') presentCount++;
    else if (item.status === 'late') lateCount++;
    else if (item.status === 'absent') absentCount++;
    else if (item.status === 'excused') excusedCount++;
  });

  const presentPct = totalCount > 0 ? Math.round(((presentCount + lateCount) / totalCount) * 100) : 100;

  return (
    <div className="space-y-6">
      
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 px-4 py-3 rounded-2xl bg-slate-900 text-white shadow-2xl border border-amber-500/40 text-xs font-extrabold flex items-center gap-2 animate-in fade-in slide-in-from-bottom-5 duration-200">
          <Sparkles className="w-4 h-4 text-amber-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Main Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-slate-800 text-white p-6 rounded-3xl border border-slate-800 shadow-xl relative overflow-hidden">
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          
          {/* Title & Description */}
          <div className="flex items-start gap-4">
            <div className="p-3.5 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30 shrink-0">
              <Calendar className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-400 text-[10px] font-black uppercase tracking-wider border border-amber-500/30">
                  CenterFlow Physical Attendance
                </span>
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-bold border border-emerald-500/30 flex items-center gap-1">
                  <TrendingUp className="w-3 h-3" />
                  <span>{presentPct}% Attendance Rate</span>
                </span>
              </div>
              <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight mt-1">
                {t("1-Tap Class Attendance & Cohort Manager", "1-Tap Class Attendance & Cohort Manager", "1-Клик Посещаемость Занятий")}
              </h1>
              <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
                {t(
                  "Dars davomida o'quvchilar qatnashishini 1-Bosish bilan belgilang. Kechikish daqiqalari, sababli va izohlarni tezkor kiritish va Firestore bilan sinxronlash.",
                  "Log physical class attendance in seconds. Features 1-tap pills, late arrival minute counters, excused status, and instant Firestore synchronization.",
                  "Быстро отмечайте посещаемость. Поддерживает опоздания, уважительные причины и автосохранение в Firestore."
                )}
              </p>
            </div>
          </div>

          {/* Master Save Action Button */}
          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={handleSaveAttendance}
              disabled={isSaving || activeGroupStudents.length === 0}
              className="w-full sm:w-auto px-6 py-3.5 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 font-black text-xs sm:text-sm rounded-2xl shadow-xl shadow-amber-500/20 flex items-center justify-center gap-2 transition cursor-pointer active:scale-98"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>{t("Saqlanmoqda...", "Saving Records...", "Сохранение...")}</span>
                </>
              ) : (
                <>
                  <Save className="w-5 h-5" />
                  <span>{t("Davomatni Saqlash", "Save Attendance Record", "Сохранить Посещаемость")}</span>
                </>
              )}
            </button>
          </div>

        </div>
      </div>

      {/* Control Toolbar: Group Selector, Date Picker & Master Actions */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-sm space-y-4">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 w-full lg:w-auto">
            {/* Active Cohort Group Selector */}
            <div className="w-full sm:w-auto">
              <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1">
                {t("Aktiv Guruh / Cohort:", "Active Cohort Group:", "Группа Занятий:")}
              </label>
              <select
                value={selectedGroupId}
                onChange={(e) => setSelectedGroupId(e.target.value)}
                className="w-full sm:w-auto py-2.5 px-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-black text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500 cursor-pointer min-w-[220px]"
              >
                {groups.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.name} ({g.courseType || 'Kurs'})
                  </option>
                ))}
              </select>
            </div>

            {/* Date Picker */}
            <div className="w-full sm:w-auto">
              <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1">
                {t("Dars Sanasi:", "Lesson Date:", "Дата Занятия:")}
              </label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full sm:w-auto py-2 px-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500 cursor-pointer"
              />
            </div>
          </div>

          {/* Master Shortcuts & Search */}
          <div className="flex items-center gap-2 w-full lg:w-auto flex-wrap justify-end">
            <button
              onClick={handleMarkAllPresent}
              disabled={activeGroupStudents.length === 0}
              className="px-3.5 py-2 rounded-2xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 font-black text-xs flex items-center gap-1.5 transition cursor-pointer"
              title="Set all students to Present"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{t("Hammasi Kelgan", "Mark All Present", "Все Пришли")}</span>
            </button>

            <button
              onClick={handleResetForm}
              className="px-3.5 py-2 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-amber-500 font-extrabold text-xs flex items-center gap-1.5 transition cursor-pointer"
              title="Reset unsaved changes"
            >
              <RotateCcw className="w-4 h-4" />
              <span>{t("Qayta Tiklash", "Reset Form", "Сбросить")}</span>
            </button>
          </div>

        </div>

        {/* Live Counters Analytics Badges */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
          
          <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 text-center">
            <span className="text-[10px] font-extrabold uppercase text-slate-400 block">Total Enrolled</span>
            <span className="text-lg font-black text-slate-900 dark:text-white font-mono">{totalCount}</span>
          </div>

          <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-center">
            <span className="text-[10px] font-extrabold uppercase text-emerald-600 dark:text-emerald-400 block">🟢 Present</span>
            <span className="text-lg font-black text-emerald-600 dark:text-emerald-400 font-mono">{presentCount}</span>
          </div>

          <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-center">
            <span className="text-[10px] font-extrabold uppercase text-amber-600 dark:text-amber-400 block">🟡 Late Arrival</span>
            <span className="text-lg font-black text-amber-600 dark:text-amber-400 font-mono">{lateCount}</span>
          </div>

          <div className="p-3 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-center">
            <span className="text-[10px] font-extrabold uppercase text-rose-600 dark:text-rose-400 block">🔴 Absent</span>
            <span className="text-lg font-black text-rose-600 dark:text-rose-400 font-mono">{absentCount}</span>
          </div>

          <div className="p-3 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-center col-span-2 sm:col-span-1">
            <span className="text-[10px] font-extrabold uppercase text-blue-600 dark:text-blue-400 block">🔵 Excused</span>
            <span className="text-lg font-black text-blue-600 dark:text-blue-400 font-mono">{excusedCount}</span>
          </div>

        </div>
      </div>

      {/* Roster Search Bar */}
      <div className="flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t("O'quvchi ismi yoki telefon raqami bo'yicha izlash...", "Search student by name or phone...", "Поиск по имени или телефону...")}
            className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500 shadow-sm"
          />
        </div>

        <span className="text-xs font-bold text-slate-400">
          Showing {displayedStudents.length} of {activeGroupStudents.length}
        </span>
      </div>

      {/* Quick Attendance Roster Matrix */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-sm space-y-3">
        
        {isLoading ? (
          <div className="py-16 flex flex-col items-center justify-center text-slate-400 gap-2">
            <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
            <span className="text-xs font-bold">Loading Cohort Attendance Grid...</span>
          </div>
        ) : displayedStudents.length === 0 ? (
          <div className="py-16 text-center text-slate-400 italic space-y-2">
            <Users className="w-8 h-8 mx-auto text-slate-300 dark:text-slate-700" />
            <p className="text-xs font-semibold">No students found matching your search or group selection.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {displayedStudents.map((st, idx) => {
              const studentState = attendanceState[st.id] || { status: 'present' };
              const currentStatus = studentState.status;

              return (
                <div
                  key={st.id}
                  className={`p-4 rounded-2xl border transition-all duration-200 space-y-3 ${
                    currentStatus === 'present'
                      ? 'bg-emerald-500/5 dark:bg-emerald-500/10 border-emerald-500/30'
                      : currentStatus === 'late'
                      ? 'bg-amber-500/5 dark:bg-amber-500/10 border-amber-500/30'
                      : currentStatus === 'absent'
                      ? 'bg-rose-500/5 dark:bg-rose-500/10 border-rose-500/30'
                      : 'bg-blue-500/5 dark:bg-blue-500/10 border-blue-500/30'
                  }`}
                >
                  <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                    
                    {/* Student Profile Info */}
                    <div className="flex items-center gap-3.5">
                      <span className="w-6 text-xs font-mono font-bold text-slate-400 shrink-0">#{idx + 1}</span>
                      <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-600 dark:text-amber-400 font-black flex items-center justify-center text-sm shadow-sm border border-amber-500/30 shrink-0">
                        {st.fullName.charAt(0)}
                      </div>
                      <div>
                        <h4 className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                          <span>{st.fullName}</span>
                        </h4>
                        <div className="flex items-center gap-3 text-[11px] text-slate-500 dark:text-slate-400 font-mono mt-0.5">
                          <span className="flex items-center gap-1">
                            <Phone className="w-3 h-3 text-amber-500" />
                            {st.phone}
                          </span>
                          <span className="flex items-center gap-1">
                            <Send className="w-3 h-3 text-blue-400" />
                            @{st.fullName.toLowerCase().replace(/\s+/g, '_')}_tg
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* 4-State 1-Tap Toggle Pills */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 w-full md:w-auto">
                      
                      {/* Present Pill */}
                      <button
                        type="button"
                        onClick={() => handleSetStatus(st.id, 'present')}
                        className={`py-2 px-3 rounded-xl text-xs font-black transition cursor-pointer flex items-center justify-center gap-1.5 ${
                          currentStatus === 'present'
                            ? 'bg-emerald-500 text-slate-950 shadow-md scale-105'
                            : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800 hover:border-emerald-500/40'
                        }`}
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Keldi</span>
                      </button>

                      {/* Late Pill */}
                      <button
                        type="button"
                        onClick={() => handleSetStatus(st.id, 'late')}
                        className={`py-2 px-3 rounded-xl text-xs font-black transition cursor-pointer flex items-center justify-center gap-1.5 ${
                          currentStatus === 'late'
                            ? 'bg-amber-500 text-slate-950 shadow-md scale-105'
                            : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800 hover:border-amber-500/40'
                        }`}
                      >
                        <Clock className="w-3.5 h-3.5" />
                        <span>Kechikdi</span>
                      </button>

                      {/* Absent Pill */}
                      <button
                        type="button"
                        onClick={() => handleSetStatus(st.id, 'absent')}
                        className={`py-2 px-3 rounded-xl text-xs font-black transition cursor-pointer flex items-center justify-center gap-1.5 ${
                          currentStatus === 'absent'
                            ? 'bg-rose-500 text-white shadow-md scale-105'
                            : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800 hover:border-rose-500/40'
                        }`}
                      >
                        <XCircle className="w-3.5 h-3.5" />
                        <span>Kelmadi</span>
                      </button>

                      {/* Excused Pill */}
                      <button
                        type="button"
                        onClick={() => handleSetStatus(st.id, 'excused')}
                        className={`py-2 px-3 rounded-xl text-xs font-black transition cursor-pointer flex items-center justify-center gap-1.5 ${
                          currentStatus === 'excused'
                            ? 'bg-blue-500 text-white shadow-md scale-105'
                            : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800 hover:border-blue-500/40'
                        }`}
                      >
                        <ShieldAlert className="w-3.5 h-3.5" />
                        <span>Sababli kelmadi</span>
                      </button>

                    </div>

                  </div>

                  {/* Contextual Sub-row: Late Arrival Minutes Input + Teacher Note */}
                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 pt-2 border-t border-slate-200/60 dark:border-slate-800">
                    
                    {/* Late Minutes Trigger Box */}
                    {currentStatus === 'late' && (
                      <div className="sm:col-span-4 flex items-center gap-2 bg-amber-500/10 p-2 rounded-xl border border-amber-500/20">
                        <Clock className="w-4 h-4 text-amber-500 shrink-0" />
                        <span className="text-[10px] font-black uppercase text-amber-600 dark:text-amber-400 shrink-0">
                          Kechikish (daq):
                        </span>
                        <input
                          type="number"
                          min="1"
                          max="120"
                          value={studentState.lateMinutes || 15}
                          onChange={(e) => handleLateMinutesChange(st.id, Number(e.target.value))}
                          className="w-16 p-1 rounded-lg border border-amber-500/30 bg-white dark:bg-slate-900 font-extrabold text-xs text-amber-600 dark:text-amber-400 text-center focus:outline-none"
                        />
                        <span className="text-[10px] font-bold text-amber-500">daq</span>
                      </div>
                    )}

                    {/* Quick Teacher Note Input */}
                    <div className={currentStatus === 'late' ? 'sm:col-span-8' : 'sm:col-span-12'}>
                      <div className="relative">
                        <MessageSquare className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          value={studentState.note || ''}
                          onChange={(e) => handleNoteChange(st.id, e.target.value)}
                          placeholder="Izoh (masalan: Telegram orqali oldindan xabar bergan, daftarini unutgan...)"
                          className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-white/80 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 text-xs text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-amber-500"
                        />
                      </div>
                    </div>

                  </div>

                </div>
              );
            })}
          </div>
        )}

      </div>
    </div>
  );
};

export default AttendanceManager;
