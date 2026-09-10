import React, { useState, useMemo } from 'react';
import { Search, X, Users, UserCog, DollarSign, Calendar } from 'lucide-react';
import { useTeacherPortal } from '../../context/TeacherPortalContext';
import { useTheme } from '../../context/ThemeContext';
import { TeacherTab } from '../../types/teacher';

interface TeacherSearchProps {
  onNavigate: (tab: TeacherTab) => void;
}

export const TeacherSearch: React.FC<TeacherSearchProps> = ({ onNavigate }) => {
  const { myGroups, myStudents, payments } = useTeacherPortal();
  const { theme } = useTheme();
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);

  const results = useMemo(() => {
    if (!query.trim()) return { groups: [], students: [], payments: [] };
    const q = query.toLowerCase();
    return {
      groups: myGroups.filter(
        (g) => g.name.toLowerCase().includes(q) || g.courseType.toLowerCase().includes(q)
      ).slice(0, 5),
      students: myStudents.filter(
        (s) => s.fullName.toLowerCase().includes(q) || s.phone.includes(q)
      ).slice(0, 5),
      payments: payments.filter(
        (p) => p.studentName?.toLowerCase().includes(q)
      ).slice(0, 5),
    };
  }, [query, myGroups, myStudents, payments]);

  const hasResults = results.groups.length + results.students.length + results.payments.length > 0;

  return (
    <div className="relative">
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
          value={query}
          onChange={(e) => { setQuery(e.target.value); setIsOpen(true); }}
          onFocus={() => setIsOpen(true)}
          placeholder="Search students, groups, payments..."
          className={`flex-1 bg-transparent text-sm outline-none ${
            theme === 'dark' ? 'text-white placeholder-slate-500' : 'text-slate-900 placeholder-slate-400'
          }`}
        />
        {query && (
          <button onClick={() => { setQuery(''); setIsOpen(false); }} className="cursor-pointer">
            <X className="w-4 h-4 text-slate-400 hover:text-slate-600" />
          </button>
        )}
      </div>

      {isOpen && query && (
        <div
          className={`absolute top-full left-0 right-0 mt-2 rounded-2xl shadow-2xl border overflow-hidden z-50 max-h-80 overflow-y-auto ${
            theme === 'dark'
              ? 'bg-slate-900 border-slate-800'
              : 'bg-white border-slate-200'
          }`}
        >
          {!hasResults && (
            <div className="p-6 text-center">
              <span className={`text-sm ${theme === 'dark' ? 'text-slate-500' : 'text-slate-400'}`}>
                No results found
              </span>
            </div>
          )}

          {results.groups.length > 0 && (
            <div>
              <div className={`px-4 py-2 text-[10px] font-bold uppercase tracking-widest ${
                theme === 'dark' ? 'text-slate-500 bg-slate-800/50' : 'text-slate-400 bg-slate-50'
              }`}>
                Groups
              </div>
              {results.groups.map((g) => (
                <button
                  key={g.id}
                  onClick={() => { setIsOpen(false); setQuery(''); onNavigate('groups'); }}
                  className={`w-full flex items-center gap-3 px-4 py-3 text-left transition cursor-pointer ${
                    theme === 'dark' ? 'hover:bg-slate-800' : 'hover:bg-slate-50'
                  }`}
                >
                  <Users className="w-4 h-4 text-blue-500 flex-shrink-0" />
                  <div>
                    <div className={`text-sm font-semibold ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                      {g.name}
                    </div>
                    <div className="text-xs text-slate-500">{g.courseType} &middot; {g.room}</div>
                  </div>
                </button>
              ))}
            </div>
          )}

          {results.students.length > 0 && (
            <div>
              <div className={`px-4 py-2 text-[10px] font-bold uppercase tracking-widest ${
                theme === 'dark' ? 'text-slate-500 bg-slate-800/50' : 'text-slate-400 bg-slate-50'
              }`}>
                Students
              </div>
              {results.students.map((s) => (
                <button
                  key={s.id}
                  onClick={() => { setIsOpen(false); setQuery(''); onNavigate('students'); }}
                  className={`w-full flex items-center gap-3 px-4 py-3 text-left transition cursor-pointer ${
                    theme === 'dark' ? 'hover:bg-slate-800' : 'hover:bg-slate-50'
                  }`}
                >
                  <UserCog className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                  <div>
                    <div className={`text-sm font-semibold ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                      {s.fullName}
                    </div>
                    <div className="text-xs text-slate-500">{s.groupName} &middot; {s.phone}</div>
                  </div>
                </button>
              ))}
            </div>
          )}

          {results.payments.length > 0 && (
            <div>
              <div className={`px-4 py-2 text-[10px] font-bold uppercase tracking-widest ${
                theme === 'dark' ? 'text-slate-500 bg-slate-800/50' : 'text-slate-400 bg-slate-50'
              }`}>
                Payments
              </div>
              {results.payments.map((p) => (
                <button
                  key={p.id}
                  onClick={() => { setIsOpen(false); setQuery(''); onNavigate('payments'); }}
                  className={`w-full flex items-center gap-3 px-4 py-3 text-left transition cursor-pointer ${
                    theme === 'dark' ? 'hover:bg-slate-800' : 'hover:bg-slate-50'
                  }`}
                >
                  <DollarSign className="w-4 h-4 text-amber-500 flex-shrink-0" />
                  <div>
                    <div className={`text-sm font-semibold ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                      {p.studentName} — {p.amount?.toLocaleString()} UZS
                    </div>
                    <div className="text-xs text-slate-500">{p.date}</div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
