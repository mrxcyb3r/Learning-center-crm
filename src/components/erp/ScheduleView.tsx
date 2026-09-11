import React, { useState, useEffect } from 'react';
import {
  Calendar,
  Clock,
  MapPin,
  Users,
  Plus,
  Edit2,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  X,
  Sparkles,
} from 'lucide-react';
import { groupsService, coursesService, teachersService } from '../../services/repository';
import { CourseData, GroupScheduleItem, GroupType, TeacherRecord } from '../../types/crm';

export const ScheduleView: React.FC = () => {
  const [schedule, setSchedule] = useState<GroupScheduleItem[]>([]);
  const [courses, setCourses] = useState<CourseData[]>([]);
  const [teachers, setTeachers] = useState<TeacherRecord[]>([]);
  const [activeDayFilter, setActiveDayFilter] = useState('All');
  const [editingItem, setEditingItem] = useState<GroupScheduleItem | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  // Form State
  const [formGroupName, setFormGroupName] = useState('');
  const [formCourseId, setFormCourseId] = useState('');
  const [formTeacherId, setFormTeacherId] = useState('');
  const [formBranch, setFormBranch] = useState('1-Filial (Asosiy)');
  const [formRoom, setFormRoom] = useState('101-Auditoriya');
  const [formDays, setFormDays] = useState('Dush / Chor / Juma');
  const [formTime, setFormTime] = useState('08:30 - 10:30');
  const [formMaxCapacity, setFormMaxCapacity] = useState('16');
  const [formType, setFormType] = useState<GroupType>('Regular');
  const [conflictWarning, setConflictWarning] = useState<string | null>(null);

  const refresh = async () => {
    const [scheduleData, coursesData, teachersData] = await Promise.all([
      groupsService.getAllGroups(),
      coursesService.getAllCourses(),
      teachersService.getAllTeachers()
    ]);
    setSchedule(scheduleData as unknown as GroupScheduleItem[]);
    setCourses(coursesData.filter((c) => c.isActive) as unknown as CourseData[]);
    setTeachers(teachersData.filter((t) => t.status === 'Active') as unknown as TeacherRecord[]);
  };

  useEffect(() => {
    refresh();
  }, []);

  const showNotification = (msg: string) => {
    setNotice(msg);
    setTimeout(() => setNotice(null), 3000);
  };

  // Check conflicts in real time while typing in form
  useEffect(() => {
    if (!isModalOpen) {
      setConflictWarning(null);
      return;
    }

    const selectedTeacher = teachers.find((t) => t.id === formTeacherId)?.name || '';
    const conflictCheck = checkScheduleConflict(
      editingItem?.id,
      formDays,
      formTime,
      formRoom,
      selectedTeacher,
      schedule
    );

    if (conflictCheck.hasConflict) {
      setConflictWarning(conflictCheck.reason || 'Dars jadvalida to\'qnashuv mavjud!');
    } else {
      setConflictWarning(null);
    }
  }, [formDays, formTime, formRoom, formTeacherId, isModalOpen, editingItem, teachers, schedule]);

  // Local conflict check function
  function checkScheduleConflict(
    excludeId: string | undefined,
    days: string,
    time: string,
    room: string,
    teacherName: string,
    currentSchedule: GroupScheduleItem[]
  ) {
    const dayOverlap = (d1: string, d2: string) => {
      const normalize = (s: string) => s.toLowerCase().replace(/[/,]/g, ' ').split(/\s+/).filter(Boolean);
      const days1 = new Set(normalize(d1));
      const days2 = new Set(normalize(d2));
      for (const d of days1) if (days2.has(d)) return true;
      return false;
    };

    const timeOverlap = (t1: string, t2: string) => {
      const parse = (s: string) => {
        const [start, end] = s.split(/[-–]/).map(x => x.trim());
        const toMin = (x: string) => {
          const [h, m] = x.split(':').map(Number);
          return h * 60 + (m || 0);
        };
        return { start: toMin(start), end: toMin(end) };
      };
      const { start: s1, end: e1 } = parse(t1);
      const { start: s2, end: e2 } = parse(t2);
      return s1 < e2 && s2 < e1;
    };

    for (const item of currentSchedule) {
      if (excludeId && item.id === excludeId) continue;
      if (item.room === room && dayOverlap(item.days, days) && timeOverlap(item.time, time)) {
        return { hasConflict: true, reason: `Xona "${room}" bu vaqda band (${item.groupName}: ${item.days} ${item.time})` };
      }
      if (teacherName && item.teacher === teacherName && dayOverlap(item.days, days) && timeOverlap(item.time, time)) {
        return { hasConflict: true, reason: `Ustoz ${teacherName} bu vaqda band (${item.groupName}: ${item.days} ${item.time})` };
      }
    }
    return { hasConflict: false, reason: '' };
  }

  const handleOpenAdd = () => {
    setEditingItem(null);
    setFormGroupName('');
    setFormCourseId(courses[0]?.id || '');
    setFormTeacherId(teachers[0]?.id || '');
    setFormBranch('1-Filial (Asosiy)');
    setFormRoom('101-Auditoriya');
    setFormDays('Dush / Chor / Juma');
    setFormTime('08:30 - 10:30');
    setFormMaxCapacity('16');
    setFormType('Regular');
    setConflictWarning(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item: GroupScheduleItem) => {
    setEditingItem(item);
    setFormGroupName(item.groupName);
    setFormCourseId(item.courseId || courses.find((c) => c.title === item.course)?.id || '');
    setFormTeacherId(item.teacherId || teachers.find((t) => t.name === item.teacher)?.id || '');
    setFormBranch(item.branch || '1-Filial (Asosiy)');
    setFormRoom(item.room);
    setFormDays(item.days || 'Dush / Chor / Juma');
    setFormTime(item.time);
    setFormMaxCapacity(String(item.maxCapacity || 16));
    setFormType(item.type);
    setIsModalOpen(true);
  };

  const handleSaveGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formGroupName.trim()) return;

    if (conflictWarning) {
      showNotification('Xona / ustoz bandligi sababli jadval to\'qnashuvi bor. Avval to\'qnashuvni hal qiling.');
      return;
    }

    const courseObj = courses.find((c) => c.id === formCourseId);
    const teacherObj = teachers.find((t) => t.id === formTeacherId);

    const payload = {
      groupName: formGroupName.trim(),
      course: courseObj ? courseObj.title : (editingItem?.course || 'Kurs tanlanmagan'),
      courseId: formCourseId || editingItem?.courseId || '',
      teacher: teacherObj ? teacherObj.name : (editingItem?.teacher || 'Ustoz tayinlanmagan'),
      teacherId: formTeacherId || editingItem?.teacherId || '',
      branch: formBranch,
      room: formRoom,
      days: formDays,
      time: formTime,
      maxCapacity: Number(formMaxCapacity) || 16,
      studentsCount: editingItem ? editingItem.studentsCount : 0,
      type: formType,
      status: 'Active' as const,
    };

    if (editingItem) {
      await groupsService.updateGroup(editingItem.id, payload);
      showNotification(`"${formGroupName}" guruhi yangilandi!`);
    } else {
      await groupsService.createGroup(payload);
      showNotification(`Yangi guruh "${formGroupName}" ochildi!`);
    }

    await refresh();
    setIsModalOpen(false);
  };

  const handleDeleteGroup = async (id: string, name: string) => {
    if (window.confirm(`Rostdan ham "${name}" guruhini o'chirmoqchimisiz?`)) {
      await groupsService.deleteGroup(id);
      await refresh();
      showNotification(`"${name}" guruhi o'chirildi.`);
    }
  };

  const filtered = activeDayFilter === 'All'
    ? schedule
    : schedule.filter((s) => (s.days || '').includes(activeDayFilter));

  const totalCapacity = schedule.reduce((sum, s) => sum + (s.maxCapacity || 16), 0);
  const totalEnrolled = schedule.reduce((sum, s) => sum + (s.studentsCount || 0), 0);
  const occupancyPercent = totalCapacity > 0 ? Math.round((totalEnrolled / totalCapacity) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            Guruhlar va Dars Jadvali ({schedule.length})
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Haftalik xonalar bandligi, faol guruhlar ro'yxati va bepul sinov darslari jadvali.
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-md shadow-amber-500/20 flex items-center gap-1.5 transition cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Yangi Guruh Ochish</span>
        </button>
      </div>

      {/* Notice */}
      {notice && (
        <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-bold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" />
          <span>{notice}</span>
        </div>
      )}

      {/* Occupancy and Capacity KPI Bar */}
      <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-4 w-full md:w-auto">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center font-black text-lg">
            {occupancyPercent}%
          </div>
          <div>
            <span className="text-xs text-slate-400 font-medium">O'quv Xonalari Sig'imi</span>
            <div className="text-lg font-black text-slate-900 dark:text-white">
              {totalEnrolled} / {totalCapacity} O'rin Band ({totalCapacity - totalEnrolled} bo'sh joy)
            </div>
          </div>
        </div>

        {/* Filter day buttons */}
        <div className="inline-flex p-1 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 w-full md:w-auto overflow-x-auto">
          {['All', 'Dush / Chor / Juma', 'Sesh / Pay / Shan', 'Yakshanba'].map((day) => (
            <button
              key={day}
              onClick={() => setActiveDayFilter(day)}
              className={`px-3 py-1.5 rounded-xl font-bold text-xs whitespace-nowrap transition cursor-pointer ${
                activeDayFilter === day
                  ? 'bg-amber-500 text-slate-950 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {day === 'All' ? 'Barcha kunlar' : day}
            </button>
          ))}
        </div>
      </div>

      {/* Schedule Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtered.map((item) => {
          const cap = item.maxCapacity || 16;
          const current = item.studentsCount || 0;
          const seatsLeft = Math.max(0, cap - current);
          const percent = Math.min(100, Math.round((current / cap) * 100));

          return (
            <div
              key={item.id}
              className={`p-6 rounded-3xl bg-white dark:bg-slate-900 border shadow-sm flex flex-col justify-between hover:border-slate-300 dark:hover:border-slate-700 transition ${
                item.type === 'Trial Lesson'
                  ? 'border-amber-500/60 bg-amber-500/5'
                  : 'border-slate-200 dark:border-slate-800'
              }`}
            >
              <div>
                <div className="flex items-center justify-between">
                  <span
                    className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                      item.type === 'Trial Lesson'
                        ? 'bg-amber-500 text-slate-950 shadow-sm'
                        : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                    }`}
                  >
                    {item.type === 'Trial Lesson' ? 'Sinov Darsi' : 'Asosiy Guruh'}
                  </span>
                  <span className="text-xs font-mono font-bold text-slate-700 dark:text-slate-300">
                    {item.time}
                  </span>
                </div>

                <h3 className="text-lg font-black text-slate-900 dark:text-white mt-3">
                  {item.groupName}
                </h3>
                <p className="text-xs font-bold text-amber-600 dark:text-amber-400 mt-0.5">
                  {item.course}
                </p>

                <div className="mt-5 space-y-2 text-xs text-slate-600 dark:text-slate-300">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-3.5 h-3.5 text-amber-500" />
                    <span>Kunlar: <strong>{item.days || 'Dush / Chor / Juma'}</strong></span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="w-3.5 h-3.5 text-amber-500" />
                    <span>Ustoz: <strong className="text-slate-900 dark:text-white">{item.teacher}</strong></span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="w-3.5 h-3.5 text-amber-500" />
                    <span>Xona: {item.room} {item.branch ? `(${item.branch})` : ''}</span>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="mt-5 space-y-1.5">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-400 font-medium">To'lganlik darajasi</span>
                    <span className="font-bold text-slate-900 dark:text-white">
                      {current} / {cap} ({seatsLeft} bo'sh joy)
                    </span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${
                        percent >= 90
                          ? 'bg-rose-500'
                          : percent >= 75
                          ? 'bg-amber-500'
                          : 'bg-emerald-500'
                      }`}
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Bottom Actions */}
              <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <span className="text-xs text-slate-400">
                  {seatsLeft === 0 ? (
                    <span className="font-bold text-rose-500">Guruh to'lgan!</span>
                  ) : (
                    <span className="text-emerald-600 font-semibold">{seatsLeft} ta joy ochiq</span>
                  )}
                </span>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleOpenEdit(item)}
                    className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition cursor-pointer"
                    title="Guruhni tahrirlash"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteGroup(item.id, item.groupName)}
                    className="p-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 transition cursor-pointer"
                    title="Guruhni o'chirish"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add / Edit Group Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm overflow-y-auto">
          <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-2xl my-8">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800 mb-5">
              <h3 className="text-xl font-black text-slate-900 dark:text-white">
                {editingItem ? `Guruhni tahrirlash: ${editingItem.groupName}` : "Yangi Guruh Ochish"}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Live Conflict Alert Banner */}
            {conflictWarning && (
              <div className="mb-4 p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-800 dark:text-amber-300 text-xs font-semibold flex items-start gap-2.5">
                <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                <div>
                   <strong className="block font-bold">Ogohlantirish (Jadval to'qnashuvi):</strong>
                  <span>{conflictWarning}</span>
                </div>
              </div>
            )}

            <form onSubmit={handleSaveGroup} className="space-y-4 text-xs sm:text-sm">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                  Guruh Nomi *
                </label>
                <input
                  type="text"
                  required
                  value={formGroupName}
                  onChange={(e) => setFormGroupName(e.target.value)}
                  placeholder="Masalan: Tarix Milliy Sertifikat - 1-guruh"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                    Kursni Tanlang *
                  </label>
                  <select
                    value={formCourseId}
                    onChange={(e) => setFormCourseId(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500 cursor-pointer"
                  >
                    {courses.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.title}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                    Ustozni Tanlang *
                  </label>
                  <select
                    value={formTeacherId}
                    onChange={(e) => setFormTeacherId(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500 cursor-pointer"
                  >
                    {teachers.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name} ({t.subject || t.specialization})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                    Filial
                  </label>
                  <select
                    value={formBranch}
                    onChange={(e) => setFormBranch(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500 cursor-pointer"
                  >
                    <option value="1-Filial (Asosiy)">1-Filial (Asosiy, 1-maktab)</option>
                    <option value="2-Filial (Texnikum)">2-Filial (Texnikum)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                    Auditoriya / Xona
                  </label>
                  <input
                    type="text"
                    required
                    value={formRoom}
                    onChange={(e) => setFormRoom(e.target.value)}
                    placeholder="101-Auditoriya"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                    Dars Kunlari
                  </label>
                  <select
                    value={formDays}
                    onChange={(e) => setFormDays(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500 cursor-pointer"
                  >
                    <option value="Dush / Chor / Juma">Dushanba / Chorshanba / Juma</option>
                    <option value="Sesh / Pay / Shan">Seshanba / Payshanba / Shanba</option>
                    <option value="Yakshanba">Faqat Yakshanba (Intensiv / Trial)</option>
                    <option value="Har kuni">Har kuni (Dushanba - Shanba)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                    Vaqti (Soat)
                  </label>
                  <input
                    type="text"
                    required
                    value={formTime}
                    onChange={(e) => setFormTime(e.target.value)}
                    placeholder="08:30 - 10:30"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                    Maksimal Sig'imi (O'rin)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="50"
                    required
                    value={formMaxCapacity}
                    onChange={(e) => setFormMaxCapacity(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                    Guruh Turi
                  </label>
                  <select
                    value={formType}
                    onChange={(e) => setFormType(e.target.value as GroupType)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500 cursor-pointer"
                  >
                    <option value="Regular">Asosiy O'quv Guruhi</option>
                    <option value="Trial Lesson">Sinov Darsi</option>
                    <option value="Exam">Imtihon / Mock Test Guruhi</option>
                  </select>
                </div>
              </div>

              {/* Submit Buttons */}
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
                  {editingItem ? "O'zgarishlarni Saqlash" : "Guruhni Saqlash"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
