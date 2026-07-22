import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import {
  subscribeGroups,
  subscribeStudents,
  saveAttendanceRecord,
  getAttendanceRecord,
  seedFirestoreIfEmpty
} from '../services/firestore';
import { Group, Student } from '../types';
import {
  Calendar,
  CheckCircle2,
  XCircle,
  Clock,
  Save,
  BookOpen,
  UserCheck,
  Sparkles,
  Loader2,
  Check
} from 'lucide-react';

export const TeacherAttendance: React.FC = () => {
  const { currentUser, userProfile, activeRole } = useAuth();
  const { language } = useLanguage();
  const isUz = language === 'UZ';

  const [groups, setGroups] = useState<Group[]>([]);
  const [allStudents, setAllStudents] = useState<Student[]>([]);
  const [selectedGroupId, setSelectedGroupId] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [attendanceState, setAttendanceState] = useState<{ [studentId: string]: 'present' | 'absent' | 'late' }>({});

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  useEffect(() => {
    seedFirestoreIfEmpty();

    const unsubGroups = subscribeGroups((groupList) => {
      setGroups(groupList);
      if (groupList.length > 0 && !selectedGroupId) {
        setSelectedGroupId(groupList[0].id);
      }
    });

    const unsubStudents = subscribeStudents((studentList) => {
      setAllStudents(studentList);
      setIsLoading(false);
    });

    return () => {
      unsubGroups();
      unsubStudents();
    };
  }, []);

  // Filter students by selected group
  const activeGroupStudents = allStudents.filter(
    (s) => s.groupId === selectedGroupId || s.groupName === groups.find((g) => g.id === selectedGroupId)?.name
  );

  // Initialize or load attendance state when selected group or date changes
  useEffect(() => {
    if (!selectedGroupId || activeGroupStudents.length === 0) return;

    async function loadAttendance() {
      const existing = await getAttendanceRecord(selectedGroupId, selectedDate);
      if (existing && existing.records) {
        setAttendanceState(existing.records);
      } else {
        // Default everyone to present
        const initialMap: { [studentId: string]: 'present' | 'absent' | 'late' } = {};
        activeGroupStudents.forEach((st) => {
          initialMap[st.id] = 'present';
        });
        setAttendanceState(initialMap);
      }
    }

    loadAttendance();
  }, [selectedGroupId, selectedDate, activeGroupStudents.length]);

  const toggleStudentAttendance = (studentId: string, status: 'present' | 'absent' | 'late') => {
    setAttendanceState((prev) => ({
      ...prev,
      [studentId]: status
    }));
  };

  const handleSaveAttendance = async () => {
    if (!selectedGroupId) return;
    setIsSaving(true);
    const selectedGroupObj = groups.find((g) => g.id === selectedGroupId);
    const teacherName = userProfile?.displayName || currentUser?.displayName || 'Teacher';

    try {
      await saveAttendanceRecord(selectedGroupId, selectedDate, attendanceState, teacherName);
      showToast(isUz ? `${selectedGroupObj?.name} uchun davomat saqlandi! ✅` : `Attendance saved for ${selectedGroupObj?.name}! ✅`);
    } catch (err) {
      console.error(err);
      showToast(isUz ? "Davomatni saqlashda xatolik!" : "Failed to save attendance record.");
    } finally {
      setIsSaving(false);
    }
  };

  const currentGroupObj = groups.find((g) => g.id === selectedGroupId);

  // Count metrics for selected class
  const totalCount = activeGroupStudents.length;
  const presentCount = Object.values(attendanceState).filter((v) => v === 'present').length;
  const absentCount = Object.values(attendanceState).filter((v) => v === 'absent').length;
  const lateCount = Object.values(attendanceState).filter((v) => v === 'late').length;

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 px-4 py-3 rounded-2xl bg-slate-900 text-white shadow-2xl border border-amber-500/40 text-xs font-bold flex items-center gap-2 animate-bounce">
          <Sparkles className="w-4 h-4 text-amber-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2.5 rounded-2xl bg-blue-500/10 text-blue-600 dark:text-blue-400 font-bold">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                {isUz ? "1-Tap Davomat Boshqaruvi (Teacher Portal)" : "1-Tap Attendance Grid"}
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {isUz
                  ? "Guruh bo'yicha o'quvchilar qatnashishini 1-Bosish bilan belgilash va Firestore ga saqlash"
                  : "Mark attendance with 1-tap buttons and log directly to live Firestore database"}
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={handleSaveAttendance}
          disabled={isSaving || activeGroupStudents.length === 0}
          className="w-full sm:w-auto px-5 py-2.5 bg-blue-500 hover:bg-blue-600 disabled:opacity-50 text-white font-bold text-xs rounded-2xl shadow-lg shadow-blue-500/20 flex items-center justify-center gap-2 transition cursor-pointer"
        >
          {isSaving ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>{isUz ? "Saqlanmoqda..." : "Saving..."}</span>
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              <span>{isUz ? "Davomatni Saqlash" : "Save Attendance"}</span>
            </>
          )}
        </button>
      </div>

      {/* Group & Date Selectors Panel */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 w-full md:w-auto">
          {/* Select Group */}
          <div>
            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">
              {isUz ? "Guruhni Tanlang:" : "Select Study Group:"}
            </label>
            <div className="relative">
              <select
                value={selectedGroupId}
                onChange={(e) => setSelectedGroupId(e.target.value)}
                className="py-2.5 pl-3 pr-8 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-extrabold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 min-w-[200px]"
              >
                {groups.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.name} ({g.courseType})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Select Date */}
          <div>
            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">
              {isUz ? "Dars Sanasi:" : "Lesson Date:"}
            </label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="py-2 px-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Live Attendance Counters */}
        <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800/60 p-2.5 rounded-2xl border border-slate-200/80 dark:border-slate-700/60 text-xs font-bold w-full md:w-auto justify-around">
          <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
            <CheckCircle2 className="w-4 h-4" />
            <span>{presentCount} {isUz ? "Kelgan" : "Present"}</span>
          </div>
          <div className="h-4 w-px bg-slate-300 dark:bg-slate-700" />
          <div className="flex items-center gap-1.5 text-rose-600 dark:text-rose-400">
            <XCircle className="w-4 h-4" />
            <span>{absentCount} {isUz ? "Kelmagan" : "Absent"}</span>
          </div>
          <div className="h-4 w-px bg-slate-300 dark:bg-slate-700" />
          <div className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400">
            <Clock className="w-4 h-4" />
            <span>{lateCount} {isUz ? "Kechikkan" : "Late"}</span>
          </div>
        </div>
      </div>

      {/* Student Attendance Grid */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-extrabold text-base text-slate-900 dark:text-white flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-blue-500" />
              <span>{currentGroupObj?.name || 'Group Roster'}</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {currentGroupObj?.scheduleTime} • {currentGroupObj?.room} • O'qituvchi: {currentGroupObj?.teacherName}
            </p>
          </div>

          <span className="px-3 py-1 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 font-bold text-xs border border-blue-500/20">
            {activeGroupStudents.length} {isUz ? "O'quvchi" : "Students Enrolled"}
          </span>
        </div>

        {isLoading ? (
          <div className="py-12 flex flex-col items-center justify-center text-slate-400 gap-2">
            <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
            <span className="text-xs font-bold">{isUz ? "O'quvchilar ro'yxati yuklanmoqda..." : "Loading student roster..."}</span>
          </div>
        ) : activeGroupStudents.length === 0 ? (
          <div className="py-12 text-center text-slate-400">
            <p className="text-sm font-bold">{isUz ? "Ushbu guruhga hali o'quvchi biriktirilmagan" : "No students assigned to this group yet"}</p>
            <p className="text-xs mt-1">{isUz ? "Admin panelidan O'quvchilar bo'limiga o'tib guruhga tayinlang." : "Go to Students tab to enroll students into this group."}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {activeGroupStudents.map((st, idx) => {
              const currentStatus = attendanceState[st.id] || 'present';
              return (
                <div
                  key={st.id}
                  className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/60 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 hover:border-slate-300 dark:hover:border-slate-600 transition"
                >
                  {/* Student Details */}
                  <div className="flex items-center gap-3">
                    <span className="w-6 text-xs font-mono font-bold text-slate-400">#{idx + 1}</span>
                    <div className="w-9 h-9 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 font-extrabold flex items-center justify-center text-sm shadow-sm">
                      {st.fullName.charAt(0)}
                    </div>
                    <div>
                      <h4 className="text-xs font-extrabold text-slate-900 dark:text-white">
                        {st.fullName}
                      </h4>
                      <p className="text-[10px] text-slate-500 font-mono">
                        {st.phone}
                      </p>
                    </div>
                  </div>

                  {/* 1-Tap Toggle Buttons */}
                  <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                    {/* Present Button */}
                    <button
                      type="button"
                      onClick={() => toggleStudentAttendance(st.id, 'present')}
                      className={`px-3.5 py-1.5 rounded-xl font-bold text-xs transition flex items-center gap-1.5 cursor-pointer ${
                        currentStatus === 'present'
                          ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                          : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 hover:border-emerald-500/40'
                      }`}
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>{isUz ? "Keldi ✅" : "Present ✅"}</span>
                    </button>

                    {/* Absent Button */}
                    <button
                      type="button"
                      onClick={() => toggleStudentAttendance(st.id, 'absent')}
                      className={`px-3.5 py-1.5 rounded-xl font-bold text-xs transition flex items-center gap-1.5 cursor-pointer ${
                        currentStatus === 'absent'
                          ? 'bg-rose-500 text-white shadow-md shadow-rose-500/20'
                          : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 hover:border-rose-500/40'
                      }`}
                    >
                      <XCircle className="w-3.5 h-3.5" />
                      <span>{isUz ? "Sababsiz ❌" : "Absent ❌"}</span>
                    </button>

                    {/* Late Button */}
                    <button
                      type="button"
                      onClick={() => toggleStudentAttendance(st.id, 'late')}
                      className={`px-3.5 py-1.5 rounded-xl font-bold text-xs transition flex items-center gap-1.5 cursor-pointer ${
                        currentStatus === 'late'
                          ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                          : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 hover:border-amber-500/40'
                      }`}
                    >
                      <Clock className="w-3.5 h-3.5" />
                      <span>{isUz ? "Kechikdi ⏳" : "Late ⏳"}</span>
                    </button>
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
