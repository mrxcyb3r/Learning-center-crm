import React, { useState } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { BookOpen, Users, Calendar, MapPin, Plus, CheckCircle2 } from 'lucide-react';

export const ClassesView: React.FC = () => {
  const { language } = useLanguage();
  const isUz = language === 'UZ';

  const [groupsList, setGroupsList] = useState([
    {
      id: 'g1',
      name: 'IELTS Intensive #12',
      courseType: 'IELTS Intensive',
      teacherName: 'Jasur Rahimov',
      scheduleTime: 'Mon/Wed/Fri 14:00 - 16:00',
      room: 'Room 3 (Renessans Main)',
      activeStudentsCount: 14
    },
    {
      id: 'g2',
      name: 'General English B2',
      courseType: 'General English',
      teacherName: 'Malika Azimova',
      scheduleTime: 'Tue/Thu/Sat 10:00 - 12:00',
      room: 'Room 1 (Language Lab)',
      activeStudentsCount: 12
    },
    {
      id: 'g3',
      name: 'Python & Web Development #04',
      courseType: 'IT Coding',
      teacherName: 'Bobur Ismoilov',
      scheduleTime: 'Mon/Wed/Fri 16:30 - 18:30',
      room: 'Room 2 (IT Computer Lab)',
      activeStudentsCount: 10
    }
  ]);

  const [name, setName] = useState('');
  const [courseType, setCourseType] = useState('IELTS Intensive');
  const [teacherName, setTeacherName] = useState('Jasur Rahimov');
  const [scheduleTime, setScheduleTime] = useState('Mon/Wed/Fri 14:00 - 16:00');
  const [room, setRoom] = useState('Room 3 (Renessans Main)');
  const [isAdding, setIsAdding] = useState(false);

  const handleAddGroup = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) return;

    const newGroup = {
      id: Date.now().toString(),
      name,
      courseType,
      teacherName,
      scheduleTime,
      room,
      activeStudentsCount: 0
    };

    setGroupsList([...groupsList, newGroup]);
    setName('');
    setIsAdding(false);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="p-6 rounded-3xl bg-slate-900 text-white border border-slate-800 shadow-xl flex items-center justify-between">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 text-amber-400 text-xs font-bold border border-amber-500/30 mb-2">
            <BookOpen className="w-3.5 h-3.5" />
            <span>Guruhlar & Dars Jadvallari</span>
          </div>
          <h2 className="text-2xl font-black">
            {isUz ? "O'quv Xonalari va Guruhlar Boshqaruvi" : "Classes & Course Schedules"}
          </h2>
          <p className="text-xs text-slate-400 mt-1 max-w-lg">
            {isUz
              ? "Markazdagi barcha dars guruhlari, xonalar birikmasi va o'qituvchilar jadvallarini boshqaring."
              : "Manage active class groups, assigned classrooms, and mentor schedules."}
          </p>
        </div>

        <button
          onClick={() => setIsAdding(!isAdding)}
          className="px-5 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-md shadow-amber-500/20 transition cursor-pointer flex items-center gap-2 shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>{isUz ? "Yangi Guruh Ochish" : "Create New Group"}</span>
        </button>
      </div>

      {/* Add Modal */}
      {isAdding && (
        <form onSubmit={handleAddGroup} className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-amber-500/50 shadow-xl space-y-4">
          <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">
            {isUz ? "Yangi Guruh Qo'shish" : "Add New Group"}
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Guruh Nomi
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
                Kurs Yo'nalishi
              </label>
              <select
                value={courseType}
                onChange={(e) => setCourseType(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500"
              >
                <option value="IELTS Intensive">IELTS Intensive</option>
                <option value="General English">General English</option>
                <option value="CEFR C1">CEFR C1</option>
                <option value="IT Coding">IT & Programming</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Biriktirilgan Ustoz
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
                Dars Vaqti
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
                Xona
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
              className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-bold text-slate-600 dark:text-slate-300"
            >
              Bekor qilish
            </button>
            <button
              type="submit"
              className="px-6 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold shadow-md shadow-amber-500/20"
            >
              Saqlash
            </button>
          </div>
        </form>
      )}

      {/* Class Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {groupsList.map((g) => (
          <div
            key={g.id}
            className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-md space-y-4 hover:border-amber-500/50 transition"
          >
            <div className="flex items-center justify-between">
              <span className="px-3 py-1 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 text-[10px] font-bold border border-amber-500/20">
                {g.courseType}
              </span>
              <span className="text-xs font-bold text-emerald-500 flex items-center gap-1">
                <Users className="w-3.5 h-3.5" /> {g.activeStudentsCount} o'quvchi
              </span>
            </div>

            <div>
              <h3 className="text-lg font-black text-slate-900 dark:text-white">
                {g.name}
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">Ustoz: {g.teacherName}</p>
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
          </div>
        ))}
      </div>
    </div>
  );
};
