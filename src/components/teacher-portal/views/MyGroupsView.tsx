import React, { useState, useMemo } from 'react';
import {
  Search,
  X,
  Users,
  Clock,
  MapPin,
  BookOpen,
  ChevronRight,
  Calendar,
  FileText,
  UserCheck,
  BarChart3,
  StickyNote,
  Loader2,
} from 'lucide-react';
import { useTeacherPortal } from '../../../context/TeacherPortalContext';
import { useTheme } from '../../../context/ThemeContext';
import { Group, Student, AttendanceRecord } from '../../../types';

const SUBJECT_BADGE_COLORS: Record<string, string> = {
  ielts: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20',
  cefr: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20',
  english: 'bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/20',
  ingliz: 'bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/20',
  kids: 'bg-pink-500/10 text-pink-600 dark:text-pink-400 border-pink-500/20',
  math: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
  matematika: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
  fizika: 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-500/20',
  mental: 'bg-violet-500/10 text-violet-600 dark:text-violet-400 border-violet-500/20',
  physics: 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-500/20',
  science: 'bg-teal-500/10 text-teal-600 dark:text-teal-400 border-teal-500/20',
  dtm: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
  tarix: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
  'ona tili': 'bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20',
  adabiyot: 'bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20',
  sat: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20',
  default: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
};

function getSubjectBadgeColor(courseType: string): string {
  const lower = courseType.toLowerCase();
  for (const [key, color] of Object.entries(SUBJECT_BADGE_COLORS)) {
    if (lower.includes(key)) return color;
  }
  return SUBJECT_BADGE_COLORS.default;
}

type DetailTab = 'info' | 'students' | 'attendance' | 'schedule' | 'notes';

const GroupDetail: React.FC<{
  group: Group;
  students: Student[];
  attendance: AttendanceRecord[];
  onClose: () => void;
}> = ({ group, students, attendance, onClose }) => {
  const { theme } = useTheme();
  const [activeTab, setActiveTab] = useState<DetailTab>('info');
  const [notes, setNotes] = useState('');

  const groupStudents = useMemo(
    () => students.filter((s) => s.groupId === group.id),
    [students, group.id]
  );

  const groupAttendance = useMemo(
    () => attendance.filter((a) => a.groupId === group.id).slice(0, 10),
    [attendance, group.id]
  );

  const tabs: { key: DetailTab; label: string; icon: React.ReactNode }[] = [
    { key: 'info', label: 'Ma\'lumot', icon: <FileText className="w-3.5 h-3.5" /> },
    { key: 'students', label: `O'quvchilar (${groupStudents.length})`, icon: <Users className="w-3.5 h-3.5" /> },
    { key: 'attendance', label: 'Davomat', icon: <Calendar className="w-3.5 h-3.5" /> },
    { key: 'schedule', label: 'Dars jadvali', icon: <Clock className="w-3.5 h-3.5" /> },
    { key: 'notes', label: 'Izohlar', icon: <StickyNote className="w-3.5 h-3.5" /> },
  ];

  return (
    <div
      className={`mt-4 rounded-3xl border transition-colors ${
        theme === 'dark'
          ? 'bg-slate-900/80 border-slate-800'
          : 'bg-white border-slate-200 shadow-sm'
      }`}
    >
      <div className={`flex items-center justify-between p-5 border-b ${theme === 'dark' ? 'border-slate-800' : 'border-slate-100'}`}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
            <Users className="w-5 h-5 text-blue-500" />
          </div>
          <div>
            <h3 className={`text-sm font-black ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
              {group.name}
            </h3>
            <p className="text-[11px] text-slate-500 font-semibold">
              {group.courseType} &middot; {group.room}
            </p>
          </div>
        </div>
        <button
          onClick={onClose}
          className={`p-2 rounded-xl transition cursor-pointer ${
            theme === 'dark'
              ? 'bg-slate-800 hover:bg-slate-700 text-slate-400'
              : 'bg-slate-100 hover:bg-slate-200 text-slate-500'
          }`}
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className={`flex gap-1 px-5 pt-3 overflow-x-auto border-b ${theme === 'dark' ? 'border-slate-800' : 'border-slate-100'}`}>
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition cursor-pointer ${
              activeTab === tab.key
                ? 'bg-blue-500/10 text-blue-500'
                : theme === 'dark'
                ? 'text-slate-500 hover:text-white hover:bg-slate-800/50'
                : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      <div className="p-5">
        {activeTab === 'info' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              { label: 'Kurs turi', value: group.courseType, icon: <BookOpen className="w-4 h-4 text-blue-500" /> },
              { label: 'Dars jadvali', value: group.scheduleTime || 'Belgilanmagan', icon: <Clock className="w-4 h-4 text-amber-500" /> },
              { label: 'Xona', value: group.room || 'Biriktirilmagan', icon: <MapPin className="w-4 h-4 text-rose-500" /> },
              { label: 'O\'quvchilar', value: `${groupStudents.length} yozilgan`, icon: <UserCheck className="w-4 h-4 text-emerald-500" /> },
            ].map((item) => (
              <div
                key={item.label}
                className={`p-4 rounded-2xl ${theme === 'dark' ? 'bg-slate-800/50' : 'bg-slate-50'}`}
              >
                <div className="flex items-center gap-2 mb-1.5">
                  {item.icon}
                  <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
                    {item.label}
                  </span>
                </div>
                <div className={`text-sm font-bold ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                  {item.value}
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'students' && (
          <div className="space-y-2">
            {groupStudents.length === 0 ? (
              <div className="py-8 text-center text-slate-400 text-xs font-semibold">
                Guruhda hozircha o'quvchilar yo'q.
              </div>
            ) : (
              groupStudents.map((student, idx) => (
                <div
                  key={student.id}
                  className={`flex items-center justify-between p-3 rounded-2xl ${
                    theme === 'dark' ? 'bg-slate-800/60 border border-slate-700/60' : 'bg-slate-50 border border-slate-200/80'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="w-6 font-mono text-slate-400 font-bold text-xs">#{idx + 1}</span>
                    <div className="w-8 h-8 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 font-black flex items-center justify-center text-xs">
                      {student.fullName.charAt(0)}
                    </div>
                    <div>
                      <h4 className={`text-xs font-extrabold ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                        {student.fullName}
                      </h4>
                      <p className="text-[10px] text-slate-500 font-mono">{student.phone}</p>
                    </div>
                  </div>
                  <span
                    className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                      student.paymentStatus === 'paid'
                        ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                        : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20'
                    }`}
                  >
                    {student.paymentStatus === 'paid' ? 'To\'langan' : 'Kutilmoqda'}
                  </span>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'attendance' && (
          <div className="space-y-3">
            {groupAttendance.length === 0 ? (
              <div className="py-8 text-center text-slate-400 text-xs font-semibold">
                Bu guruh uchun davomat yozuvlari topilmadi.
              </div>
            ) : (
              groupAttendance.map((record) => {
                const total = Object.keys(record.records).length;
                const present = Object.values(record.records).filter(
                  (r) => r === 'present' || (typeof r === 'object' && 'status' in r && r.status === 'present')
                ).length;
                return (
                  <div
                    key={record.date}
                    className={`flex items-center justify-between p-3 rounded-2xl ${
                      theme === 'dark' ? 'bg-slate-800/50' : 'bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Calendar className="w-4 h-4 text-blue-500" />
                      <span className={`text-xs font-bold ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                        {record.date}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <BarChart3 className="w-3.5 h-3.5 text-slate-400" />
                      <span className="text-xs font-bold text-slate-500">
                        {present}/{total} davomat
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          total > 0 && present / total >= 0.8
                            ? 'bg-emerald-500/10 text-emerald-500'
                            : 'bg-amber-500/10 text-amber-500'
                        }`}
                      >
                        {total > 0 ? Math.round((present / total) * 100) : 0}%
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {activeTab === 'schedule' && (
          <div
            className={`p-6 rounded-2xl text-center ${theme === 'dark' ? 'bg-slate-800/50' : 'bg-slate-50'}`}
          >
            <Clock className="w-8 h-8 text-amber-500 mx-auto mb-3" />
            <h4 className={`text-sm font-bold mb-1 ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
              Dars Jadvali
            </h4>
            <p className={`text-xs font-semibold ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
              {group.scheduleTime || 'Jadval belgilanmagan'}
            </p>
            <div className="mt-3 flex items-center justify-center gap-2">
              <MapPin className="w-3.5 h-3.5 text-rose-500" />
              <span className="text-xs text-slate-500 font-semibold">{group.room || 'Xona belgilanmagan'}</span>
            </div>
          </div>
        )}

        {activeTab === 'notes' && (
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Bu guruh haqida izoh qo'shish..."
            rows={6}
            className={`w-full rounded-2xl p-4 text-xs font-semibold outline-none resize-none transition ${
              theme === 'dark'
                ? 'bg-slate-800/50 border border-slate-700 text-white placeholder-slate-500 focus:border-blue-500'
                : 'bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400 focus:border-blue-500'
            }`}
          />
        )}
      </div>
    </div>
  );
};

export const MyGroupsView: React.FC = () => {
  const { myGroups, myStudents, attendance } = useTeacherPortal();
  const { theme } = useTheme();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);

  const filteredGroups = useMemo(() => {
    if (!searchQuery.trim()) return myGroups;
    const q = searchQuery.toLowerCase();
    return myGroups.filter(
      (g) =>
        g.name.toLowerCase().includes(q) ||
        g.courseType.toLowerCase().includes(q) ||
        g.room.toLowerCase().includes(q)
    );
  }, [myGroups, searchQuery]);

  const selectedGroup = useMemo(
    () => myGroups.find((g) => g.id === selectedGroupId) || null,
    [myGroups, selectedGroupId]
  );

  const getStudentCount = (groupId: string) =>
    myStudents.filter((s) => s.groupId === groupId).length;

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="p-6 rounded-3xl bg-slate-900 text-white border border-slate-800 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 text-blue-400 text-xs font-bold border border-blue-500/30 mb-2">
            <Users className="w-3.5 h-3.5" />
            <span>Mening guruhlarim</span>
          </div>
          <h1 className="text-2xl font-black tracking-tight">Biriktirilgan guruhlar</h1>
          <p className="text-xs text-slate-400 mt-1">
            Sizga biriktirilgan o'qitish guruhlarini, dars jadvallarini va ro'yxatlarni ko'ring va boshqaring.
          </p>
        </div>
        <div className="px-4 py-2 rounded-2xl bg-slate-800 border border-slate-700 text-xs font-bold flex items-center gap-2 text-amber-400">
          <Users className="w-4 h-4" />
          <span>{myGroups.length} guruh &middot; {myStudents.length} o'quvchi</span>
        </div>
      </div>

      <div
        className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border transition ${
          theme === 'dark'
            ? 'bg-slate-900 border-slate-800 focus-within:border-blue-500'
            : 'bg-slate-50 border-slate-200 focus-within:border-blue-500'
        }`}
      >
        <Search className="w-4 h-4 text-slate-400 flex-shrink-0" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Guruhni nomi, kursi yoki xonasi bo'yicha qidirish..."
          className={`flex-1 bg-transparent text-sm outline-none ${
            theme === 'dark' ? 'text-white placeholder-slate-500' : 'text-slate-900 placeholder-slate-400'
          }`}
        />
        {searchQuery && (
          <button onClick={() => setSearchQuery('')} className="cursor-pointer">
            <X className="w-4 h-4 text-slate-400 hover:text-slate-600" />
          </button>
        )}
      </div>

      {filteredGroups.length === 0 ? (
        <div
          className={`p-12 text-center rounded-3xl border ${
            theme === 'dark'
              ? 'bg-slate-900/50 border-slate-800'
              : 'bg-white border-slate-200 shadow-sm'
          }`}
        >
          <div className="w-12 h-12 rounded-full bg-blue-500/10 text-blue-500 mx-auto flex items-center justify-center mb-3">
            <Users className="w-6 h-6" />
          </div>
          <h3 className={`text-base font-extrabold mb-1 ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
            Guruhlar topilmadi
          </h3>
          <p className="text-xs text-slate-500">
            {searchQuery ? "Qidiruv so'zini o'zgartirib ko'ring." : "Biriktirilgan guruhlar mavjud emas."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredGroups.map((group) => {
            const studentCount = getStudentCount(group.id);
            const isSelected = selectedGroupId === group.id;
            return (
              <div
                key={group.id}
                onClick={() => setSelectedGroupId(isSelected ? null : group.id)}
                className={`rounded-3xl border p-6 transition-all cursor-pointer flex flex-col justify-between ${
                  isSelected
                    ? 'ring-2 ring-blue-500 shadow-lg'
                    : 'hover:shadow-md'
                } ${
                  theme === 'dark'
                    ? 'bg-slate-900/50 border-slate-800 hover:border-slate-700'
                    : 'bg-white border-slate-200/80'
                }`}
              >
                <div className="space-y-4">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span
                        className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold tracking-wide uppercase border ${getSubjectBadgeColor(
                          group.courseType
                        )}`}
                      >
                        {group.courseType || 'Umumiy'}
                      </span>
                      <h3 className={`text-lg font-black mt-2 ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                        {group.name}
                      </h3>
                    </div>
                    <div
                      className={`p-2 rounded-xl font-bold text-xs shrink-0 flex items-center gap-1 ${
                        theme === 'dark' ? 'bg-slate-800 text-slate-300' : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      <Users className="w-3.5 h-3.5 text-blue-500" />
                      <span>{studentCount}</span>
                    </div>
                  </div>

                  <div className={`space-y-2 text-xs ${theme === 'dark' ? 'text-slate-300' : 'text-slate-600'} pt-1`}>
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-amber-500 shrink-0" />
                      <span>{group.scheduleTime || 'Jadval belgilanmagan'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-rose-500 shrink-0" />
                      <span>{group.room || 'Xona belgilanmagan'}</span>
                    </div>
                  </div>
                </div>

                <div className="pt-5 mt-4 border-t border-slate-100 dark:border-slate-800">
                  <div
                    className={`flex items-center justify-between text-xs font-bold ${
                      isSelected ? 'text-blue-500' : theme === 'dark' ? 'text-slate-500' : 'text-slate-400'
                    }`}
                  >
                    <span>{isSelected ? 'Ma\'lumotlarni yashirish' : 'Batafsil ko\'rish'}</span>
                    <ChevronRight
                      className={`w-4 h-4 transition-transform ${isSelected ? 'rotate-90' : ''}`}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {selectedGroup && (
        <GroupDetail
          group={selectedGroup}
          students={myStudents}
          attendance={attendance}
          onClose={() => setSelectedGroupId(null)}
        />
      )}
    </div>
  );
};
