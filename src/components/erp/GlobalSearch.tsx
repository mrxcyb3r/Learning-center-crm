import React, { useEffect, useMemo, useState } from 'react';
import { Search, X, PhoneCall, Users, GraduationCap, BookOpen, Calendar, CreditCard } from 'lucide-react';
import {
  leadsService,
  studentsService,
  teachersService,
  coursesService,
  groupsService,
} from '../../services/repository';

export type SearchScope = 'admin' | 'receptionist' | 'teacher';

export interface TeacherSearchData {
  students: Array<{ id: string; fullName?: string; name?: string; phone?: string; course?: string; groupName?: string }>;
  groups: Array<{ id: string; groupName?: string; name?: string; course?: string; teacher?: string }>;
}

interface Props {
  open: boolean;
  onClose: () => void;
  scope: SearchScope;
  /** Navigate to a workspace tab (portals map tab ids to their own views). */
  onNavigate: (tab: string, record?: { kind: string; id: string }) => void;
  teacherData?: TeacherSearchData;
}

interface ResultItem {
  kind: 'lead' | 'student' | 'teacher' | 'course' | 'group' | 'payment';
  id: string;
  title: string;
  subtitle: string;
  tab: string;
}

function norm(s: unknown): string {
  return String(s || '')
    .toLowerCase()
    .split("'").join('')
    .split('’').join('')
    .split('`').join('')
    .split('ʻ').join('');
}

/**
 * Real global search over actual Firestore records (no hardcoded results).
 * - admin: leads, students, teachers, courses, groups
 * - receptionist: leads, students, courses, groups (+ trial lessons via leads)
 * - teacher: only assigned students/groups (+ public courses)
 */
export const GlobalSearch: React.FC<Props> = ({ open, onClose, scope, onNavigate, teacherData }) => {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [leads, setLeads] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [teachers, setTeachers] = useState<any[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [groups, setGroups] = useState<any[]>([]);

  useEffect(() => {
    if (!open) return;
    setQuery('');
    if (scope === 'teacher') return; // uses teacherData only
    setLoading(true);
    const jobs: Array<Promise<void>> = [
      leadsService.getAllLeads().then((d) => setLeads(d)).catch(() => setLeads([])),
      studentsService.getAllStudents().then((d) => setStudents(d as any[])).catch(() => setStudents([])),
      coursesService.getAllCourses().then((d) => setCourses(d)).catch(() => setCourses([])),
      groupsService.getAllGroups().then((d) => setGroups(d as any[])).catch(() => setGroups([])),
    ];
    if (scope === 'admin') {
      jobs.push(
        teachersService.getAllTeachers().then((d) => setTeachers(d)).catch(() => setTeachers([]))
      );
    }
    Promise.all(jobs).finally(() => setLoading(false));
  }, [open, scope]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  const results: ResultItem[] = useMemo(() => {
    const needle = norm(query).trim();
    if (needle.length < 2) return [];
    const tokens = needle.split(/\s+/).filter((t) => t.length > 1);
    const hay = (v: unknown) => norm(v);
    const match = (...fields: unknown[]) => {
      const h = fields.map(hay).join(' ');
      return tokens.every((t) => h.includes(t));
    };
    const out: ResultItem[] = [];
    const push = (r: ResultItem) => {
      if (out.length < 30 && !out.some((x) => x.kind === r.kind && x.id === r.id)) out.push(r);
    };

    const studentPool = scope === 'teacher' ? teacherData?.students || [] : students;
    const groupPool = scope === 'teacher' ? teacherData?.groups || [] : groups;

    for (const l of leads) {
      if (match(l.name, l.phone, l.course, l.status, l.source)) {
        push({ kind: 'lead', id: l.id, title: l.name, subtitle: `Lid • ${l.course || ''} • ${l.phone || ''} • ${l.status || ''}`, tab: scope === 'admin' ? 'leads' : 'leads' });
      }
    }
    for (const s of studentPool as any[]) {
      const name = s.fullName || s.name;
      if (match(name, s.phone, s.course, s.groupName)) {
        push({ kind: 'student', id: s.id, title: name, subtitle: `O‘quvchi • ${s.course || ''} • ${s.groupName || ''}`, tab: 'students' });
      }
    }
    if (scope === 'admin') {
      for (const t of teachers as any[]) {
        if (match(t.name, t.subject, t.specialization, t.phone)) {
          push({ kind: 'teacher', id: t.id, title: t.name, subtitle: `O‘qituvchi • ${t.subject || t.specialization || ''}`, tab: 'teachers' });
        }
      }
    }
    for (const c of courses as any[]) {
      if (match(c.title, c.shortTitle, c.category)) {
        push({ kind: 'course', id: c.id, title: c.title, subtitle: `Kurs • ${c.category || ''} • ${c.formattedFee || ''}`, tab: 'courses' });
      }
    }
    for (const g of groupPool as any[]) {
      const gname = g.groupName || g.name;
      if (match(gname, g.course, g.teacher, g.room)) {
        push({ kind: 'group', id: g.id, title: gname, subtitle: `Guruh • ${g.course || ''} • ${g.teacher || ''}`, tab: scope === 'admin' ? 'schedule' : 'groups' });
      }
    }
    return out;
  }, [query, leads, students, teachers, courses, groups, scope, teacherData]);

  if (!open) return null;

  const iconFor = (kind: ResultItem['kind']) => {
    switch (kind) {
      case 'lead': return <PhoneCall className="w-4 h-4 text-blue-500" />;
      case 'student': return <Users className="w-4 h-4 text-emerald-500" />;
      case 'teacher': return <GraduationCap className="w-4 h-4 text-purple-500" />;
      case 'course': return <BookOpen className="w-4 h-4 text-amber-500" />;
      case 'group': return <Calendar className="w-4 h-4 text-sky-500" />;
      default: return <CreditCard className="w-4 h-4 text-slate-400" />;
    }
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-start justify-center p-4 pt-20 bg-slate-950/60 backdrop-blur-sm" onClick={onClose}>
      <div
        className="w-full max-w-xl rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-200 dark:border-slate-800">
          <Search className="w-4 h-4 text-slate-400 shrink-0" />
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Lid, o‘quvchi, o‘qituvchi, kurs, guruh yoki telefon qidirish..."
            className="flex-1 bg-transparent text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none min-w-0"
          />
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white" aria-label="Yopish">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="max-h-[50vh] overflow-y-auto p-2">
          {loading && <div className="px-4 py-6 text-center text-xs text-slate-400">Qidirilmoqda...</div>}
          {!loading && query.trim().length >= 2 && results.length === 0 && (
            <div className="px-4 py-6 text-center text-xs text-slate-400">Hech narsa topilmadi</div>
          )}
          {!loading && query.trim().length < 2 && (
            <div className="px-4 py-6 text-center text-xs text-slate-400">
              Qidiruv uchun kamida 2 ta belgi kiriting. Masalan: ism, telefon raqam yoki kurs nomi.
            </div>
          )}
          {(['lead', 'student', 'course', 'group', 'teacher'] as const).map((kind) => {
            const group = results.filter((r) => r.kind === kind);
            if (group.length === 0) return null;
            const heading =
              kind === 'lead' ? 'Lidlar'
              : kind === 'student' ? "O'quvchilar"
              : kind === 'course' ? 'Kurslar'
              : kind === 'group' ? 'Guruhlar'
              : "O'qituvchilar";
            return (
              <div key={kind}>
                <div className="px-3 pt-2 pb-1 text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">
                  {heading} ({group.length})
                </div>
                {group.map((r) => (
                  <button
                    key={r.kind + ':' + r.id}
                    onClick={() => {
                      onNavigate(r.tab, { kind: r.kind, id: r.id });
                      onClose();
                    }}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer text-left"
                  >
                    <span className="shrink-0">{iconFor(r.kind)}</span>
                    <span className="min-w-0">
                      <span className="block text-sm font-bold text-slate-900 dark:text-white truncate">{r.title}</span>
                      <span className="block text-[11px] text-slate-500 dark:text-slate-400 truncate">{r.subtitle}</span>
                    </span>
                  </button>
                ))}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default GlobalSearch;
