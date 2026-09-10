import React, { useState, useMemo } from 'react';
import {
  Search,
  X,
  Users,
  Phone,
  DollarSign,
  Calendar,
  ChevronRight,
  UserCog,
  Filter,
  BookOpen,
  Award,
  StickyNote,
  Clock,
  CreditCard,
  TrendingUp,
} from 'lucide-react';
import { useTeacherPortal } from '../../../context/TeacherPortalContext';
import { useTheme } from '../../../context/ThemeContext';
import { Student } from '../../../types';

function computeAttendanceRate(
  studentId: string,
  groupId: string,
  attendance: { groupId: string; records: Record<string, string | { status: string }> }[]
): number {
  const relevant = attendance.filter((a) => a.groupId === groupId);
  if (relevant.length === 0) return 0;
  let total = 0;
  let present = 0;
  relevant.forEach((a) => {
    const rec = a.records[studentId];
    if (rec) {
      total++;
      if (rec === 'present' || (typeof rec === 'object' && rec.status === 'present')) {
        present++;
      }
    }
  });
  return total > 0 ? Math.round((present / total) * 100) : 0;
}

type StudentDetailTab = 'overview' | 'attendance' | 'payments' | 'notes';

const StudentDetailPanel: React.FC<{
  student: Student;
  attendance: { groupId: string; date: string; records: Record<string, string | { status: string }> }[];
  payments: { studentId: string; amount: number; date: string; status?: string }[];
  onClose: () => void;
}> = ({ student, attendance, payments, onClose }) => {
  const { theme } = useTheme();
  const [activeTab, setActiveTab] = useState<StudentDetailTab>('overview');
  const [notes, setNotes] = useState('');

  const studentPayments = useMemo(
    () => payments.filter((p) => p.studentId === student.id).slice(0, 10),
    [payments, student.id]
  );

  const attendanceRate = computeAttendanceRate(student.id, student.groupId, attendance);

  const studentAttendance = useMemo(
    () =>
      attendance
        .filter((a) => a.groupId === student.groupId)
        .slice(0, 10)
        .map((a) => ({
          date: a.date,
          status: a.records[student.id] || 'N/A',
        })),
    [attendance, student.id, student.groupId]
  );

  const lastPayment = studentPayments[0];

  const tabs: { key: StudentDetailTab; label: string; icon: React.ReactNode }[] = [
    { key: 'overview', label: 'Overview', icon: <UserCog className="w-3.5 h-3.5" /> },
    { key: 'attendance', label: 'Attendance', icon: <Calendar className="w-3.5 h-3.5" /> },
    { key: 'payments', label: 'Payments', icon: <DollarSign className="w-3.5 h-3.5" /> },
    { key: 'notes', label: 'Notes', icon: <StickyNote className="w-3.5 h-3.5" /> },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div
        className={`w-full max-w-2xl max-h-[90vh] flex flex-col rounded-3xl shadow-2xl border overflow-hidden ${
          theme === 'dark' ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
        }`}
      >
        <div className={`flex items-center justify-between p-5 border-b ${theme === 'dark' ? 'border-slate-800' : 'border-slate-100'}`}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
              <UserCog className="w-5 h-5 text-blue-500" />
            </div>
            <div>
              <h3 className={`text-sm font-black ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                {student.fullName}
              </h3>
              <p className="text-[11px] text-slate-500 font-semibold">
                {student.groupName} &middot; {student.phone}
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

        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {activeTab === 'overview' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className={`p-4 rounded-2xl ${theme === 'dark' ? 'bg-slate-800/50' : 'bg-slate-50'}`}>
                  <div className="flex items-center gap-2 mb-1.5">
                    <Phone className="w-4 h-4 text-blue-500" />
                    <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Phone</span>
                  </div>
                  <div className={`text-sm font-bold ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                    {student.phone}
                  </div>
                </div>
                <div className={`p-4 rounded-2xl ${theme === 'dark' ? 'bg-slate-800/50' : 'bg-slate-50'}`}>
                  <div className="flex items-center gap-2 mb-1.5">
                    <BookOpen className="w-4 h-4 text-purple-500" />
                    <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Group</span>
                  </div>
                  <div className={`text-sm font-bold ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                    {student.groupName}
                  </div>
                </div>
                <div className={`p-4 rounded-2xl ${theme === 'dark' ? 'bg-slate-800/50' : 'bg-slate-50'}`}>
                  <div className="flex items-center gap-2 mb-1.5">
                    <CreditCard className="w-4 h-4 text-amber-500" />
                    <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Payment</span>
                  </div>
                  <span
                    className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-bold ${
                      student.paymentStatus === 'paid'
                        ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                        : student.paymentStatus === 'overdue'
                        ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20'
                        : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
                    }`}
                  >
                    {student.paymentStatus === 'paid' ? 'Paid' : student.paymentStatus === 'overdue' ? 'Overdue' : 'Pending'}
                  </span>
                </div>
                <div className={`p-4 rounded-2xl ${theme === 'dark' ? 'bg-slate-800/50' : 'bg-slate-50'}`}>
                  <div className="flex items-center gap-2 mb-1.5">
                    <TrendingUp className="w-4 h-4 text-emerald-500" />
                    <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Attendance</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-sm font-bold ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                      {attendanceRate}%
                    </span>
                    <div className="flex-1 h-2 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${
                          attendanceRate >= 80 ? 'bg-emerald-500' : attendanceRate >= 50 ? 'bg-amber-500' : 'bg-rose-500'
                        }`}
                        style={{ width: `${attendanceRate}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className={`p-4 rounded-2xl ${theme === 'dark' ? 'bg-slate-800/50' : 'bg-slate-50'}`}>
                <div className="flex items-center gap-2 mb-1.5">
                  <DollarSign className="w-4 h-4 text-amber-500" />
                  <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Tuition Fee</span>
                </div>
                <div className={`text-lg font-black ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                  {(student.tuitionFee || 0).toLocaleString()} UZS
                </div>
              </div>

              {student.lastPaymentDate && (
                <div className={`p-4 rounded-2xl ${theme === 'dark' ? 'bg-slate-800/50' : 'bg-slate-50'}`}>
                  <div className="flex items-center gap-2 mb-1.5">
                    <Calendar className="w-4 h-4 text-sky-500" />
                    <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Last Payment</span>
                  </div>
                  <div className={`text-sm font-bold ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                    {student.lastPaymentDate}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'attendance' && (
            <div className="space-y-3">
              <div className={`p-4 rounded-2xl ${theme === 'dark' ? 'bg-slate-800/50' : 'bg-slate-50'}`}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-slate-500">Overall Attendance Rate</span>
                  <span className={`text-sm font-black ${attendanceRate >= 80 ? 'text-emerald-500' : attendanceRate >= 50 ? 'text-amber-500' : 'text-rose-500'}`}>
                    {attendanceRate}%
                  </span>
                </div>
                <div className="h-3 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${
                      attendanceRate >= 80 ? 'bg-emerald-500' : attendanceRate >= 50 ? 'bg-amber-500' : 'bg-rose-500'
                    }`}
                    style={{ width: `${attendanceRate}%` }}
                  />
                </div>
              </div>

              {studentAttendance.length === 0 ? (
                <div className="py-8 text-center text-slate-400 text-xs font-semibold">
                  No attendance records found.
                </div>
              ) : (
                studentAttendance.map((record) => {
                  const statusStr = typeof record.status === 'object' ? (record.status as { status: string }).status : record.status;
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
                      <span
                        className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                          statusStr === 'present'
                            ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                            : statusStr === 'late'
                            ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                            : statusStr === 'absent'
                            ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400'
                            : 'bg-slate-500/10 text-slate-500'
                        }`}
                      >
                        {statusStr}
                      </span>
                    </div>
                  );
                })
              )}
            </div>
          )}

          {activeTab === 'payments' && (
            <div className="space-y-3">
              {studentPayments.length === 0 ? (
                <div className="py-8 text-center text-slate-400 text-xs font-semibold">
                  No payment records found.
                </div>
              ) : (
                studentPayments.map((payment) => (
                  <div
                    key={payment.date + payment.amount}
                    className={`flex items-center justify-between p-3 rounded-2xl ${
                      theme === 'dark' ? 'bg-slate-800/50' : 'bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <DollarSign className="w-4 h-4 text-amber-500" />
                      <div>
                        <span className={`text-xs font-bold ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                          {payment.amount?.toLocaleString()} UZS
                        </span>
                        <p className="text-[10px] text-slate-500 font-semibold">{payment.date}</p>
                      </div>
                    </div>
                    <span
                      className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                        payment.status === 'paid'
                          ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                          : 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                      }`}
                    >
                      {payment.status || 'paid'}
                    </span>
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === 'notes' && (
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={`Add notes about ${student.fullName}...`}
              rows={8}
              className={`w-full rounded-2xl p-4 text-xs font-semibold outline-none resize-none transition ${
                theme === 'dark'
                  ? 'bg-slate-800/50 border border-slate-700 text-white placeholder-slate-500 focus:border-blue-500'
                  : 'bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400 focus:border-blue-500'
              }`}
            />
          )}
        </div>

        <div className={`p-4 border-t ${theme === 'dark' ? 'border-slate-800' : 'border-slate-100'} flex justify-end`}>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-900 text-white font-bold text-xs cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export const MyStudentsView: React.FC = () => {
  const { myStudents, myGroups, attendance, payments } = useTeacherPortal();
  const { theme } = useTheme();
  const [searchQuery, setSearchQuery] = useState('');
  const [groupFilter, setGroupFilter] = useState<string>('all');
  const [paymentFilter, setPaymentFilter] = useState<string>('all');
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);

  const filteredStudents = useMemo(() => {
    let result = myStudents;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (s) =>
          s.fullName.toLowerCase().includes(q) ||
          s.phone.includes(q) ||
          s.groupName.toLowerCase().includes(q)
      );
    }
    if (groupFilter !== 'all') {
      result = result.filter((s) => s.groupId === groupFilter);
    }
    if (paymentFilter !== 'all') {
      result = result.filter((s) => s.paymentStatus === paymentFilter);
    }
    return result;
  }, [myStudents, searchQuery, groupFilter, paymentFilter]);

  const paymentBadge = (status: string) => {
    if (status === 'paid')
      return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20';
    if (status === 'overdue')
      return 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20';
    return 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20';
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="p-6 rounded-3xl bg-slate-900 text-white border border-slate-800 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 text-blue-400 text-xs font-bold border border-blue-500/30 mb-2">
            <UserCog className="w-3.5 h-3.5" />
            <span>My Students</span>
          </div>
          <h1 className="text-2xl font-black tracking-tight">Student Roster</h1>
          <p className="text-xs text-slate-400 mt-1">
            View, filter, and manage your assigned students across all groups.
          </p>
        </div>
        <div className="px-4 py-2 rounded-2xl bg-slate-800 border border-slate-700 text-xs font-bold flex items-center gap-2 text-amber-400">
          <Users className="w-4 h-4" />
          <span>{filteredStudents.length} of {myStudents.length} Students</span>
        </div>
      </div>

      <div className="space-y-3">
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
            placeholder="Search students by name, phone, or group..."
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

        <div className="flex flex-wrap gap-2">
          <div className="relative">
            <Filter className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <select
              value={groupFilter}
              onChange={(e) => setGroupFilter(e.target.value)}
              className={`appearance-none pl-8 pr-8 py-2 rounded-xl text-xs font-bold border outline-none cursor-pointer transition ${
                theme === 'dark'
                  ? 'bg-slate-900 border-slate-800 text-white'
                  : 'bg-slate-50 border-slate-200 text-slate-900'
              }`}
            >
              <option value="all">All Groups</option>
              {myGroups.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.name}
                </option>
              ))}
            </select>
          </div>

          <select
            value={paymentFilter}
            onChange={(e) => setPaymentFilter(e.target.value)}
            className={`appearance-none px-4 py-2 rounded-xl text-xs font-bold border outline-none cursor-pointer transition ${
              theme === 'dark'
                ? 'bg-slate-900 border-slate-800 text-white'
                : 'bg-slate-50 border-slate-200 text-slate-900'
            }`}
          >
            <option value="all">All Payments</option>
            <option value="paid">Paid</option>
            <option value="pending">Pending</option>
            <option value="overdue">Overdue</option>
          </select>
        </div>
      </div>

      {filteredStudents.length === 0 ? (
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
            No students found
          </h3>
          <p className="text-xs text-slate-500">
            {searchQuery || groupFilter !== 'all' || paymentFilter !== 'all'
              ? 'Try adjusting your filters.'
              : 'No students assigned to your groups yet.'}
          </p>
        </div>
      ) : (
        <>
          {/* Desktop Table */}
          <div className={`hidden md:block rounded-3xl border overflow-hidden ${
            theme === 'dark' ? 'bg-slate-900/50 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
          }`}>
            <div className={`grid grid-cols-12 gap-4 px-6 py-3 text-[10px] font-bold uppercase tracking-widest border-b ${
              theme === 'dark'
                ? 'text-slate-500 bg-slate-800/50 border-slate-800'
                : 'text-slate-400 bg-slate-50 border-slate-200'
            }`}>
              <div className="col-span-3">Student</div>
              <div className="col-span-2">Phone</div>
              <div className="col-span-2">Group</div>
              <div className="col-span-2">Payment</div>
              <div className="col-span-2">Attendance</div>
              <div className="col-span-1"></div>
            </div>
            {filteredStudents.map((student) => {
              const rate = computeAttendanceRate(student.id, student.groupId, attendance);
              return (
                <div
                  key={student.id}
                  onClick={() => setSelectedStudent(student)}
                  className={`grid grid-cols-12 gap-4 px-6 py-3.5 items-center text-xs border-b transition cursor-pointer ${
                    theme === 'dark'
                      ? 'border-slate-800/50 hover:bg-slate-800/30'
                      : 'border-slate-100 hover:bg-slate-50'
                  }`}
                >
                  <div className="col-span-3 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 font-black flex items-center justify-center text-xs flex-shrink-0">
                      {student.fullName.charAt(0)}
                    </div>
                    <span className={`font-extrabold truncate ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                      {student.fullName}
                    </span>
                  </div>
                  <div className="col-span-2 font-mono text-slate-500">{student.phone}</div>
                  <div className="col-span-2">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/10 text-blue-600 dark:text-blue-400">
                      {student.groupName}
                    </span>
                  </div>
                  <div className="col-span-2">
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${paymentBadge(student.paymentStatus)}`}>
                      {student.paymentStatus === 'paid' ? 'Paid' : student.paymentStatus === 'overdue' ? 'Overdue' : 'Pending'}
                    </span>
                  </div>
                  <div className="col-span-2 flex items-center gap-2">
                    <div className="flex-1 h-2 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                      <div
                        className={`h-full rounded-full ${
                          rate >= 80 ? 'bg-emerald-500' : rate >= 50 ? 'bg-amber-500' : 'bg-rose-500'
                        }`}
                        style={{ width: `${rate}%` }}
                      />
                    </div>
                    <span className="text-[10px] font-bold text-slate-500 w-8 text-right">{rate}%</span>
                  </div>
                  <div className="col-span-1 flex justify-end">
                    <ChevronRight className="w-4 h-4 text-slate-400" />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Mobile Cards */}
          <div className="md:hidden space-y-3">
            {filteredStudents.map((student) => {
              const rate = computeAttendanceRate(student.id, student.groupId, attendance);
              return (
                <div
                  key={student.id}
                  onClick={() => setSelectedStudent(student)}
                  className={`rounded-3xl border p-5 transition cursor-pointer ${
                    theme === 'dark'
                      ? 'bg-slate-900/50 border-slate-800 hover:border-slate-700'
                      : 'bg-white border-slate-200/80 hover:shadow-md'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 font-black flex items-center justify-center text-sm">
                        {student.fullName.charAt(0)}
                      </div>
                      <div>
                        <h4 className={`text-sm font-extrabold ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                          {student.fullName}
                        </h4>
                        <p className="text-[10px] text-slate-500 font-mono">{student.phone}</p>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-400 flex-shrink-0 mt-1" />
                  </div>

                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/10 text-blue-600 dark:text-blue-400">
                      {student.groupName}
                    </span>
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${paymentBadge(student.paymentStatus)}`}>
                      {student.paymentStatus === 'paid' ? 'Paid' : student.paymentStatus === 'overdue' ? 'Overdue' : 'Pending'}
                    </span>
                    <span className="text-[10px] font-bold text-slate-500 ml-auto">
                      {rate}% attendance
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {selectedStudent && (
        <StudentDetailPanel
          student={selectedStudent}
          attendance={attendance}
          payments={payments}
          onClose={() => setSelectedStudent(null)}
        />
      )}
    </div>
  );
};
