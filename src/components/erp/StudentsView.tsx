import React, { useState, useEffect } from 'react';
import {
  Search,
  Plus,
  Phone,
  Send,
  CheckCircle2,
  AlertCircle,
  Clock,
  DollarSign,
  Filter,
  Edit2,
  Trash2,
  X,
  CreditCard,
  UserCheck,
  Calendar,
  AlertTriangle,
} from 'lucide-react';
import { crmService } from '../../services/crmService';
import { CourseData, GroupScheduleItem, PaymentStatus, StudentRecord, StudentStatus } from '../../types/crm';
import { formatCurrency, formatCurrencyShort, toSafeNumber, getStudentName, formatPercent } from '../../utils/format';

const UZ_MONTHS = [
  'Yanvar', 'Fevral', 'Mart', 'Aprel', 'May', 'Iyun',
  'Iyul', 'Avgust', 'Sentyabr', 'Oktyabr', 'Noyabr', 'Dekabr',
];

function currentMonthLabel(): string {
  const now = new Date();
  return `${UZ_MONTHS[now.getMonth()]} ${now.getFullYear()}`;
}

export const StudentsView: React.FC = () => {
  const [students, setStudents] = useState<StudentRecord[]>([]);
  const [courses, setCourses] = useState<CourseData[]>([]);
  const [schedule, setSchedule] = useState<GroupScheduleItem[]>([]);
  const [search, setSearch] = useState('');
  const [courseFilter, setCourseFilter] = useState('All');
  const [paymentFilter, setPaymentFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');

  // Modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<StudentRecord | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  // Quick Payment Modal
  const [quickPayStudent, setQuickPayStudent] = useState<StudentRecord | null>(null);
  const [payAmount, setPayAmount] = useState('380000');
  const [payMethod, setPayMethod] = useState<'Click' | 'Payme' | 'Cash' | 'Card'>('Click');

  // Form
  const [formName, setFormName] = useState('');
  const [formPhone, setFormPhone] = useState('+998 ');
  const [formParentName, setFormParentName] = useState('');
  const [formParentPhone, setFormParentPhone] = useState('+998 ');
  const [formCourse, setFormCourse] = useState('');
  const [formGroupName, setFormGroupName] = useState('');
  const [formMentor, setFormMentor] = useState('');
  const [formMonthlyFee, setFormMonthlyFee] = useState('380000');
  const [formPaymentStatus, setFormPaymentStatus] = useState<PaymentStatus>('Paid');
  const [formDebtAmount, setFormDebtAmount] = useState('0');
  const [formAttendanceRate, setFormAttendanceRate] = useState('100');
  const [formStatus, setFormStatus] = useState<StudentStatus>('Active');
  const [formNotes, setFormNotes] = useState('');

  const refreshData = () => {
    setStudents(crmService.getStudents());
    setCourses(crmService.getCourses());
    setSchedule(crmService.getSchedule());
  };

  useEffect(() => {
    refreshData();
  }, []);

  const showNotification = (msg: string) => {
    setNotice(msg);
    setTimeout(() => setNotice(null), 3000);
  };

  const handleOpenAdd = () => {
    setEditingStudent(null);
    setFormName('');
    setFormPhone('+998 ');
    setFormParentName('');
    setFormParentPhone('+998 ');
    const defaultCourse = courses[0]?.title || 'Tarix, Huquq, Geografiya';
    setFormCourse(defaultCourse);
    const relatedGroup = schedule.find((s) => s.course === defaultCourse) || schedule[0];
    setFormGroupName(relatedGroup ? relatedGroup.groupName : 'Tarix-1');
    setFormMentor(relatedGroup ? relatedGroup.teacher : 'Diyorbek Furqatovich');
    setFormMonthlyFee(String(courses[0]?.monthlyFee || 380000));
    setFormPaymentStatus('Paid');
    setFormDebtAmount('0');
    setFormAttendanceRate('100');
    setFormStatus('Active');
    setFormNotes('');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (st: StudentRecord) => {
    setEditingStudent(st);
    setFormName(st.fullName || st.name);
    setFormPhone(st.phone);
    setFormParentName(st.parentName || '');
    setFormParentPhone(st.parentPhone || '');
    setFormCourse(st.course);
    setFormGroupName(st.groupName);
    setFormMentor(st.mentor || '');
    setFormMonthlyFee(String(st.monthlyFee));
    setFormPaymentStatus(st.paymentStatus);
    setFormDebtAmount(String(st.debtAmount || 0));
    setFormAttendanceRate(String(st.attendanceRate || 95));
    setFormStatus(st.status || 'Active');
    setFormNotes(st.notes || '');
    setIsModalOpen(true);
  };

  const handleCourseChange = (selectedCourseTitle: string) => {
    setFormCourse(selectedCourseTitle);
    const crs = courses.find((c) => c.title === selectedCourseTitle);
    if (crs) {
      setFormMonthlyFee(String(crs.monthlyFee));
    }
    const matchingGroup = schedule.find((s) => s.course === selectedCourseTitle);
    if (matchingGroup) {
      setFormGroupName(matchingGroup.groupName);
      setFormMentor(matchingGroup.teacher);
    }
  };

  const handleGroupChange = (selectedGroupName: string) => {
    setFormGroupName(selectedGroupName);
    const grp = schedule.find((s) => s.groupName === selectedGroupName);
    if (grp) {
      setFormMentor(grp.teacher);
      if (grp.course) {
        setFormCourse(grp.course);
      }
    }
  };

  const handleSaveStudent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) return;

    const mentorName = formMentor.trim();
    const matchedTeacher = crmService.getTeachers().find(
      (t) => t.name.toLowerCase() === mentorName.toLowerCase()
    );

    const payload = {
      fullName: formName.trim(),
      name: formName.trim(),
      phone: formPhone.trim(),
      parentName: formParentName.trim(),
      parentPhone: formParentPhone.trim(),
      course: formCourse,
      groupName: formGroupName,
      mentor: mentorName,
      teacher: mentorName,
      teacherId: matchedTeacher?.id,
      monthlyFee: Number(formMonthlyFee) || 0,
      paymentStatus: formPaymentStatus,
      debtAmount: Number(formDebtAmount) || 0,
      attendanceRate: Number(formAttendanceRate) || 100,
      status: formStatus,
      notes: formNotes.trim(),
    };

    if (editingStudent) {
      crmService.updateStudent(editingStudent.id, payload);
      showNotification(`${formName} ma'lumotlari yangilandi!`);
    } else {
      crmService.addStudent({
        ...payload,
        enrollmentDate: new Date().toISOString().split('T')[0],
      });
      showNotification(`Yangi o'quvchi ${formName} muvaffaqiyatli ro'yxatga olindi!`);
    }

    refreshData();
    setIsModalOpen(false);
  };

  const handleDeleteStudent = (id: string, name: string) => {
    if (window.confirm(`Rostdan ham ${name} o'quvchini ro'yxatdan o'chirmoqchimisiz?`)) {
      crmService.deleteStudent(id);
      refreshData();
      showNotification(`${name} o'chirildi.`);
    }
  };

  const handleOpenQuickPay = (st: StudentRecord) => {
    setQuickPayStudent(st);
    setPayAmount(String(toSafeNumber(st.debtAmount) > 0 ? st.debtAmount : st.monthlyFee || st.tuitionFee || 380000));
    setPayMethod('Click');
  };

  const handleProcessPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickPayStudent) return;

    crmService.createPayment({
      studentId: quickPayStudent.id,
      studentName: quickPayStudent.fullName || quickPayStudent.name,
      course: quickPayStudent.course,
      amount: Number(payAmount),
      method: payMethod,
      month: currentMonthLabel(),
    });

    showNotification(`${quickPayStudent.fullName || quickPayStudent.name} uchun to'lov qabul qilindi!`);
    setQuickPayStudent(null);
    refreshData();
  };

  const filtered = students.filter((st) => {
    const studentName = (st.fullName || st.name || '').toLowerCase();
    const phone = st.phone || '';
    const parentPhone = st.parentPhone || '';
    const group = (st.groupName || '').toLowerCase();
    const query = search.toLowerCase();

    const matchesSearch =
      studentName.includes(query) ||
      phone.includes(query) ||
      parentPhone.includes(query) ||
      group.includes(query);

    const matchesCourse = courseFilter === 'All' || st.course === courseFilter;
    const matchesPayment = paymentFilter === 'All' || st.paymentStatus === paymentFilter;
    const matchesStatus = statusFilter === 'All' || st.status === statusFilter;

    return matchesSearch && matchesCourse && matchesPayment && matchesStatus;
  });

  const totalMonthlyTuitionPotential = students.reduce((sum, s) => sum + toSafeNumber(s.monthlyFee || s.tuitionFee), 0);
  const totalDebtors = students.filter((s) => toSafeNumber(s.debtAmount) > 0 || s.paymentStatus === 'Overdue');
  const totalDebtSum = students.reduce((sum, s) => sum + toSafeNumber(s.debtAmount), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            Markaz O'quvchilari ({students.length})
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Faol o'quvchilar, biriktirilgan guruhlar, ota-onalar kontaktlari va oylik to'lov holati.
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-md shadow-amber-500/20 flex items-center gap-1.5 transition cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Yangi O'quvchi Qo'shish</span>
        </button>
      </div>

      {/* Notice */}
      {notice && (
        <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-bold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" />
          <span>{notice}</span>
        </div>
      )}

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <span className="text-xs font-semibold text-slate-400 block">Jami O'quvchilar Soni</span>
          <div className="text-2xl font-black text-slate-900 dark:text-white mt-1">
            {students.length} nafar
          </div>
          <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-bold mt-1 block">
            {students.filter((s) => s.status === 'Active').length} ta faol darslarda
          </span>
        </div>

        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <span className="text-xs font-semibold text-slate-400 block">Kutilayotgan Oylik Tushum</span>
          <div className="text-2xl font-black text-slate-900 dark:text-white mt-1 font-mono">
            {formatCurrency(totalMonthlyTuitionPotential)}
          </div>
          <span className="text-[11px] text-slate-500 mt-1 block">Barcha guruhlar rejasidan</span>
        </div>

        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <span className="text-xs font-semibold text-rose-500 block flex items-center gap-1">
            <AlertTriangle className="w-3.5 h-3.5" /> Qarz / Qarzdorlik (Overdue)
          </span>
          <div className="text-2xl font-black text-rose-600 dark:text-rose-400 mt-1 font-mono">
            {formatCurrency(totalDebtSum)}
          </div>
          <span className="text-[11px] text-rose-500 font-bold mt-1 block">
            {totalDebtors.length} ta o'quvchi to'lov qilmagan
          </span>
        </div>
      </div>

      {/* Filter bar */}
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="O'quvchi ismi, telefoni, ota-onasi yoki guruhi bo'yicha qidirish..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {/* Dynamic Courses Filter */}
          <select
            value={courseFilter}
            onChange={(e) => setCourseFilter(e.target.value)}
            className="px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-none cursor-pointer"
          >
            <option value="All">Barcha Kurslar</option>
            {courses.map((c) => (
              <option key={c.id} value={c.title}>
                {c.title}
              </option>
            ))}
          </select>

          {/* Payment Status Filter */}
          <select
            value={paymentFilter}
            onChange={(e) => setPaymentFilter(e.target.value)}
            className="px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-none cursor-pointer"
          >
            <option value="All">Barcha To'lov Holatlari</option>
            <option value="Paid">To'langan (Paid)</option>
            <option value="Due">Muddati Kelgan (Due)</option>
            <option value="Overdue">Qarzdor (Overdue)</option>
          </select>

          {/* Student Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-none cursor-pointer"
          >
            <option value="All">Barcha Statuslar</option>
            <option value="Active">Faol O'quvchilar</option>
            <option value="Trial">Sinov Darsida</option>
            <option value="Paused">Tanaffusda</option>
            <option value="Dropped">Tark Etganlar</option>
            <option value="Graduated">Bitirganlar</option>
            <option value="Archived">Arxivlangan</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                <th className="py-3.5 px-4">O'quvchi & Kontakt</th>
                <th className="py-3.5 px-4">Kurs va Guruhi</th>
                <th className="py-3.5 px-4">Mas'ul Ustoz</th>
                <th className="py-3.5 px-4">To'lov & Qarzdorlik</th>
                <th className="py-3.5 px-4">Davomat</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Amallar</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400 text-xs">
                    Hozircha ma'lumot yo'q. Yangi o'quvchi qo'shish yoki filtrni o'zgartiring.
                  </td>
                </tr>
              )}
              {filtered.map((st) => {
                const isOverdue = st.paymentStatus === 'Overdue' || (toSafeNumber(st.debtAmount) > 0);

                return (
                  <tr key={st.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition">
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900 dark:text-white">
                        {st.fullName || st.name}
                      </div>
                      <div className="flex items-center gap-2 text-xs font-mono text-slate-400 mt-0.5">
                        <a
                          href={`tel:${st.phone}`}
                          className="hover:text-amber-500 flex items-center gap-1"
                        >
                          <Phone className="w-3 h-3" />
                          {st.phone || '—'}
                        </a>
                      </div>
                      {st.parentName && (
                        <div className="text-[10px] text-slate-400 mt-0.5">
                          <span className="font-semibold">{st.parentName}</span>
                          {st.parentPhone && (
                            <a href={`tel:${st.parentPhone}`} className="font-mono hover:text-amber-500 ml-1.5">
                              {st.parentPhone}
                            </a>
                          )}
                        </div>
                      )}
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="font-semibold text-slate-900 dark:text-white block">
                        {st.course || '—'}
                      </span>
                      <span className="text-[11px] font-bold text-amber-600 dark:text-amber-400">
                        {st.groupName || '—'}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-xs font-medium text-slate-700 dark:text-slate-300">
                      {st.mentor || 'Belgilanmagan'}
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                            st.paymentStatus === 'Paid'
                              ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                              : st.paymentStatus === 'Due'
                              ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                              : 'bg-rose-500/10 text-rose-600 dark:text-rose-400'
                          }`}
                        >
                          {st.paymentStatus === 'Paid' ? "To'langan" : st.paymentStatus === 'Due' ? 'Kutilmoqda' : 'Qarzdor'}
                        </span>
                      </div>
                      <div className="text-xs font-mono font-bold mt-1 text-slate-900 dark:text-white">
                        {st.monthlyFee == null && st.tuitionFee == null
                          ? '—'
                          : formatCurrency(st.monthlyFee || st.tuitionFee)}
                      </div>
                      {isOverdue && toSafeNumber(st.debtAmount) > 0 && (
                        <div className="text-[10px] font-bold text-rose-500 font-mono">
                          Qarz: {formatCurrency(st.debtAmount)}
                        </div>
                      )}
                    </td>

                    <td className="py-3.5 px-4">
                      {st.attendanceRate == null ? (
                        <span className="text-slate-400 text-xs">—</span>
                      ) : (
                        <span
                          className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-black ${
                            toSafeNumber(st.attendanceRate) >= 75
                              ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                              : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
                          }`}
                        >
                          {formatPercent(st.attendanceRate)}
                        </span>
                      )}
                    </td>

                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                          st.status === 'Active'
                            ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                            : st.status === 'Trial'
                            ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20'
                            : st.status === 'Paused'
                            ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
                            : st.status === 'Graduated'
                            ? 'bg-teal-500/10 text-teal-600 dark:text-teal-400 border border-teal-500/20'
                            : st.status === 'Dropped'
                            ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-500 border border-slate-200 dark:border-slate-700'
                        }`}
                      >
                        {st.status === 'Active'
                          ? 'Faol'
                          : st.status === 'Trial'
                          ? 'Sinov'
                          : st.status === 'Paused'
                          ? 'Tanaffus'
                          : st.status === 'Graduated'
                          ? 'Bitirgan'
                          : st.status === 'Dropped'
                          ? 'Tark etgan'
                          : st.status === 'Archived'
                          ? 'Arxiv'
                          : st.status || '—'}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* Quick Pay Button */}
                        <button
                          onClick={() => handleOpenQuickPay(st)}
                          className="px-2.5 py-1.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-bold flex items-center gap-1 transition cursor-pointer"
                          title="To'lov qabul qilish"
                        >
                          <CreditCard className="w-3.5 h-3.5" />
                          <span>To'lov</span>
                        </button>

                        <button
                          onClick={() => handleOpenEdit(st)}
                          className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-white transition cursor-pointer"
                          title="Tahrirlash"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => handleDeleteStudent(st.id, st.fullName || st.name)}
                          className="p-1.5 rounded-xl hover:bg-rose-50 dark:hover:bg-rose-900/20 text-slate-400 hover:text-rose-600 transition cursor-pointer"
                          title="O'chirish"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Student Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm overflow-y-auto">
          <div className="w-full max-w-2xl bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-2xl my-8">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800 mb-5">
              <h3 className="text-xl font-black text-slate-900 dark:text-white">
                {editingStudent ? `O'quvchini tahrirlash: ${editingStudent.fullName || editingStudent.name}` : "Yangi O'quvchi Qo'shish"}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveStudent} className="space-y-4 text-xs sm:text-sm">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                    O'quvchi F.I.SH (To'liq ismi) *
                  </label>
                  <input
                    type="text"
                    required
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="Masalan: Sardor Alimov"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                    Telefon raqami *
                  </label>
                  <input
                    type="text"
                    required
                    value={formPhone}
                    onChange={(e) => setFormPhone(e.target.value)}
                    placeholder="+998 (90) 123-45-67"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500 font-mono"
                  />
                </div>
              </div>

              {/* Parents info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                    Ota yoki Onasining Ismi
                  </label>
                  <input
                    type="text"
                    value={formParentName}
                    onChange={(e) => setFormParentName(e.target.value)}
                    placeholder="Masalan: Nodir Alimov (Otasi)"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                    Ota-ona telefon raqami
                  </label>
                  <input
                    type="text"
                    value={formParentPhone}
                    onChange={(e) => setFormParentPhone(e.target.value)}
                    placeholder="+998 (99) 987-65-43"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500 font-mono"
                  />
                </div>
              </div>

              {/* Course and Group Dynamic Selects */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                    Kursni Tanlang *
                  </label>
                  <select
                    value={formCourse}
                    onChange={(e) => handleCourseChange(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500 cursor-pointer"
                  >
                    {courses.map((c) => (
                      <option key={c.id} value={c.title}>
                        {c.title} ({c.formattedFee || formatCurrency(c.monthlyFee)})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                    Guruhni Tanlang *
                  </label>
                  <select
                    value={formGroupName}
                    onChange={(e) => handleGroupChange(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500 cursor-pointer"
                  >
                    {schedule.map((s) => (
                      <option key={s.id} value={s.groupName}>
                        {s.groupName} — {s.time} ({s.teacher})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Mentor and Fee */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                    Mas'ul Ustoz
                  </label>
                  <input
                    type="text"
                    value={formMentor}
                    onChange={(e) => setFormMentor(e.target.value)}
                    placeholder="Masalan: Diyorbek Furqatovich"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                    Oylik To'lov Miqdori (UZS) *
                  </label>
                  <input
                    type="number"
                    step="10000"
                    required
                    value={formMonthlyFee}
                    onChange={(e) => setFormMonthlyFee(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500 font-mono font-bold"
                  />
                </div>
              </div>

              {/* Payment Status and Debt */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                    To'lov Holati
                  </label>
                  <select
                    value={formPaymentStatus}
                    onChange={(e) => setFormPaymentStatus(e.target.value as PaymentStatus)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500 cursor-pointer"
                  >
                    <option value="Paid">To'langan (Paid)</option>
                    <option value="Due">Muddati kelgan (Due)</option>
                    <option value="Overdue">Qarzdor (Overdue)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                    Qarzdorlik Summasi (UZS)
                  </label>
                  <input
                    type="number"
                    step="10000"
                    value={formDebtAmount}
                    onChange={(e) => setFormDebtAmount(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                    Status
                  </label>
                  <select
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value as StudentStatus)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500 cursor-pointer"
                  >
                    <option value="Active">Faol O'quvchi</option>
                    <option value="Trial">Sinov Darsida</option>
                    <option value="Graduated">Bitirgan</option>
                    <option value="Dropped">Tark Etgan</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                  Qo'shimcha Izoh
                </label>
                <textarea
                  rows={2}
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  placeholder="O'quvchi haqida maxsus eslatmalar..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              {/* Buttons */}
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
                  {editingStudent ? "O'zgarishlarni Saqlash" : "O'quvchini Saqlash"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Quick Pay Receipt Modal */}
      {quickPayStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800 mb-5">
              <h3 className="text-lg font-black text-slate-900 dark:text-white">
                To'lov Qabul Qilish
              </h3>
              <button
                onClick={() => setQuickPayStudent(null)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleProcessPayment} className="space-y-4 text-xs sm:text-sm">
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                <div className="font-bold text-slate-900 dark:text-white text-base">
                  {quickPayStudent.fullName || quickPayStudent.name}
                </div>
                <div className="text-xs text-amber-600 dark:text-amber-400 font-medium mt-0.5">
                  {quickPayStudent.course} • {quickPayStudent.groupName}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                  To'lov Miqdori (UZS) *
                </label>
                <input
                  type="number"
                  step="10000"
                  required
                  value={payAmount}
                  onChange={(e) => setPayAmount(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500 font-mono font-bold text-lg"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                  To'lov Usuli *
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {(['Click', 'Payme', 'Cash', 'Card'] as const).map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setPayMethod(m)}
                      className={`py-2 px-1 rounded-xl text-xs font-bold transition cursor-pointer ${
                        payMethod === m
                          ? 'bg-amber-500 text-slate-950 shadow-sm'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
                      }`}
                    >
                      {m === 'Cash' ? 'Naqd' : m}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setQuickPayStudent(null)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                >
                  Bekor qilish
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-md shadow-emerald-500/20 transition cursor-pointer"
                >
                  Chek Chiqarish va Saqlash
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
