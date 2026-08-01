import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import {
  subscribeStudents,
  subscribeGroups,
  addStudent,
  updateStudent,
  updateStudentPaymentStatus,
  deleteStudent,
  seedFirestoreIfEmpty
} from '../../services/firestore';
import { DEFAULT_MOCK_STUDENTS, DEFAULT_MOCK_GROUPS } from '../../data/mockData';
import { Student, Group } from '../../types';
import {
  Users,
  UserPlus,
  Search,
  Filter,
  Edit2,
  Trash2,
  CheckCircle2,
  Clock,
  XCircle,
  Phone,
  BookOpen,
  DollarSign,
  X,
  Sparkles,
  Loader2,
  AlertTriangle,
  Eye,
  Award
} from 'lucide-react';
import { StudentCRMProfile } from '../student/StudentCRMProfile';

export const StudentsManagement: React.FC = () => {
  const { currentUser, activeRole } = useAuth();
  const { language } = useLanguage();
  const t = (uz: string, en: string, ru: string) => {
    if (language === 'UZ') return uz;
    if (language === 'RU') return ru;
    return en;
  };

  const [students, setStudents] = useState<Student[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGroupFilter, setSelectedGroupFilter] = useState('ALL');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState('ALL');

  // Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [crmStudent, setCrmStudent] = useState<Student | null>(null);

  // Form Fields
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [groupId, setGroupId] = useState('');
  const [tuitionFee, setTuitionFee] = useState('650000');
  const [paymentStatus, setPaymentStatus] = useState<'paid' | 'pending' | 'overdue'>('pending');

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string, type: 'success' | 'info' | 'error' = 'success') => {
    setToastMessage(msg);
    if (type === 'success') toast.success(msg);
    else if (type === 'error') toast.error(msg);
    else toast.info(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  useEffect(() => {
    let isMounted = true;
    seedFirestoreIfEmpty();

    const unsubStudents = subscribeStudents((data) => {
      if (!isMounted) return;
      setStudents(data.length > 0 ? data : DEFAULT_MOCK_STUDENTS);
      setIsLoading(false);
    });

    const unsubGroups = subscribeGroups((data) => {
      if (!isMounted) return;
      const effectiveGroups = data.length > 0 ? data : DEFAULT_MOCK_GROUPS;
      setGroups(effectiveGroups);
      if (effectiveGroups.length > 0 && !groupId) {
        setGroupId(effectiveGroups[0].id);
      }
    });

    const timer = setTimeout(() => {
      if (isMounted) setIsLoading(false);
    }, 2000);

    return () => {
      isMounted = false;
      clearTimeout(timer);
      unsubStudents();
      unsubGroups();
    };
  }, []);

  // Filtered Students Roster
  const filteredStudents = students.filter((s) => {
    const matchesSearch =
      s.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.phone.includes(searchQuery);
    const matchesGroup =
      selectedGroupFilter === 'ALL' || s.groupId === selectedGroupFilter || s.groupName === selectedGroupFilter;
    const matchesStatus =
      selectedStatusFilter === 'ALL' || s.paymentStatus === selectedStatusFilter;
    return matchesSearch && matchesGroup && matchesStatus;
  });

  const handleOpenAddModal = () => {
    setEditingStudent(null);
    setFullName('');
    setPhone('+998 ');
    if (groups.length > 0) {
      setGroupId(groups[0].id);
    }
    setTuitionFee('650000');
    setPaymentStatus('pending');
    setIsAddModalOpen(true);
  };

  const handleOpenEditModal = (student: Student) => {
    setEditingStudent(student);
    setFullName(student.fullName);
    setPhone(student.phone);
    setGroupId(student.groupId || '');
    setTuitionFee(student.tuitionFee ? student.tuitionFee.toString() : '650000');
    setPaymentStatus(student.paymentStatus || 'pending');
    setIsAddModalOpen(true);
  };

  const handleSubmitStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || !phone.trim()) {
      showToast(t("Iltimos, ism va telefon raqamini kiriting!", "Please fill in student name and phone!", "Пожалуйста, укажите имя и телефон!"));
      return;
    }

    const selectedGroupObj = groups.find((g) => g.id === groupId);
    const groupNameStr = selectedGroupObj ? selectedGroupObj.name : 'General English';

    try {
      if (editingStudent) {
        await updateStudent(editingStudent.id, {
          fullName,
          phone,
          groupId,
          groupName: groupNameStr,
          tuitionFee: Number(tuitionFee) || 650000,
          paymentStatus
        });
        showToast(t("O'quvchi ma'lumotlari muvaffaqiyatli yangilandi! ✅", "Student updated successfully! ✅", "Данные ученика обновлены! ✅"));
      } else {
        await addStudent({
          fullName,
          phone,
          groupId,
          groupName: groupNameStr,
          tuitionFee: Number(tuitionFee) || 650000,
          paymentStatus,
          lastPaymentDate: new Date().toISOString().split('T')[0]
        });
        showToast(t("Yangi o'quvchi ro'yxatga olindi! 🎉", "New student registered successfully! 🎉", "Новый ученик зарегистрирован! 🎉"));
      }
      setIsAddModalOpen(false);
    } catch (err) {
      console.error(err);
      showToast(t("Xatolik yuz berdi!", "Failed to save student.", "Произошла ошибка при сохранении."));
    }
  };

  const handleQuickStatusChange = async (
    studentId: string,
    newStatus: 'paid' | 'pending' | 'overdue',
    e: React.ChangeEvent<HTMLSelectElement>
  ) => {
    e.stopPropagation();
    const prevStudents = [...students];
    // Optimistic local state update
    setStudents((prev) =>
      prev.map((s) => (s.id === studentId ? { ...s, paymentStatus: newStatus } : s))
    );
    try {
      await updateStudentPaymentStatus(studentId, newStatus);
      showToast(
        t(
          `To'lov statusi '${newStatus}' ga o'zgartirildi ✅`,
          `Status updated to '${newStatus}' ✅`,
          `Статус изменен на '${newStatus}' ✅`
        )
      );
    } catch (err) {
      console.error('Failed to update student status:', err);
      setStudents(prevStudents); // Revert local state
      showToast(
        t('Statusni yangilashda xatolik yuz berdi!', 'Failed to update status.', 'Ошибка обновления статуса.')
      );
    }
  };

  const handleDeleteStudent = async (id: string, name: string) => {
    if (window.confirm(t(`${name} ni ro'yxatdan o'chirishni tasdiqlaysizmi?`, `Are you sure you want to delete ${name}?`, `Удалить ученика ${name}?`))) {
      try {
        await deleteStudent(id);
        showToast(t(`${name} o'chirildi.`, `${name} has been deleted.`, `${name} был удален.`));
      } catch (err) {
        console.error(err);
        showToast(t("O'chirishda xatolik!", "Failed to delete student.", "Ошибка при удалении."));
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 px-4 py-3 rounded-2xl bg-slate-900 text-white shadow-2xl border border-amber-500/40 text-xs font-bold flex items-center gap-2 animate-bounce">
          <Sparkles className="w-4 h-4 text-amber-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header Banner with Hosted Asset Background */}
      <div className="p-6 rounded-3xl bg-slate-900 text-white border border-slate-800 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 relative overflow-hidden">
        <img
          src="https://i.ibb.co/rR6PYx2b/image.png"
          alt="Admin Banner Background"
          className="absolute inset-0 w-full h-full object-cover opacity-20 dark:opacity-35 pointer-events-none"
        />
        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 text-blue-400 text-xs font-bold border border-blue-500/30 mb-2">
            <Users className="w-3.5 h-3.5" />
            <span>CenterFlow Student Directory</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
            {t("O'quvchilar Boshqaruvi va Roster", "Students Management & Roster", "Управление Учениками и Списки")}
          </h1>
          <p className="text-xs text-slate-400 mt-1 max-w-xl">
            {t(
              "Guruhlarga biriktirilgan barcha o'quvchilar, kontakt ma'lumotlari hamda oylik to'lov statuslarini real-vaqt rejimida kuzatib boring.",
              "Track all enrolled students, group assignments, contact numbers, and tuition fee statuses with live Firestore sync.",
              "Управление зачисленными учениками, группами, контактами и статусами оплаты в реальном времени."
            )}
          </p>
        </div>

        <button
          onClick={handleOpenAddModal}
          className="px-5 py-3 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-xs shadow-lg shadow-amber-500/20 transition cursor-pointer flex items-center gap-2 shrink-0"
        >
          <UserPlus className="w-4 h-4" />
          <span>{t("Yangi O'quvchi Qo'shish", "Add New Student", "Добавить Ученика")}</span>
        </button>
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-white/80 dark:bg-slate-900/50 backdrop-blur-md border border-slate-200/80 dark:border-slate-800/60 rounded-3xl p-4 shadow-sm dark:shadow-xl flex flex-col sm:flex-row items-center justify-between gap-3">
        {/* Search Input */}
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t("Ism yoki telefon bo'yicha qidirish...", "Search by name or phone...", "Поиск по имени или телефону...")}
            className="w-full pl-10 pr-4 py-2 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
          />
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
          <div className="flex items-center gap-1.5 px-3 py-2 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-600 dark:text-slate-300 shrink-0">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={selectedGroupFilter}
              onChange={(e) => setSelectedGroupFilter(e.target.value)}
              className="bg-transparent focus:outline-none text-xs font-bold text-slate-800 dark:text-slate-200 cursor-pointer"
            >
              <option value="ALL">{t("Barcha Guruhlar", "All Groups", "Все Группы")}</option>
              {groups.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-1.5 px-3 py-2 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-600 dark:text-slate-300 shrink-0">
            <select
              value={selectedStatusFilter}
              onChange={(e) => setSelectedStatusFilter(e.target.value)}
              className="bg-transparent focus:outline-none text-xs font-bold text-slate-800 dark:text-slate-200 cursor-pointer"
            >
              <option value="ALL">{t("Barcha To'lov Statusi", "All Statuses", "Все Статусы")}</option>
              <option value="paid">{t("To'langan ✅", "Paid ✅", "Оплачено ✅")}</option>
              <option value="pending">{t("Kutilmoqda ⏳", "Pending ⏳", "В ожидании ⏳")}</option>
              <option value="overdue">{t("Qarzdor ❌", "Overdue ❌", "Задолженность ❌")}</option>
            </select>
          </div>
        </div>
      </div>

      {/* Students Directory Table */}
      <div className="bg-white/80 dark:bg-slate-900/50 backdrop-blur-md border border-slate-200/80 dark:border-slate-800/60 rounded-3xl p-6 shadow-sm dark:shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-extrabold text-base text-slate-900 dark:text-white flex items-center gap-2">
            <span>{t("O'quvchilar Ro'yxati", "Student Roster", "Список Учеников")}</span>
            <span className="px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 font-mono text-xs">
              {filteredStudents.length}
            </span>
          </h3>
        </div>

        {isLoading ? (
          <div className="py-12 text-center text-slate-400 space-y-2">
            <Loader2 className="w-6 h-6 animate-spin mx-auto text-amber-500" />
            <p className="text-xs">{t("O'quvchilar ro'yxati yuklanmoqda...", "Loading student directory...", "Загрузка списка...")}</p>
          </div>
        ) : filteredStudents.length === 0 ? (
          <div className="py-12 text-center text-slate-400 space-y-2">
            <Users className="w-8 h-8 mx-auto text-slate-300 dark:text-slate-700" />
            <p className="text-xs font-medium">{t("Hech qanday o'quvchi topilmadi", "No students match your criteria", "Ученики не найдены")}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 font-bold uppercase tracking-wider">
                  <th className="pb-3 px-2">{t("STUDENT NAME", "STUDENT NAME", "ИМЯ УЧЕНИКА")}</th>
                  <th className="pb-3 px-2">{t("TELEFON RAQAMI", "PHONE NUMBER", "ТЕЛЕФОН")}</th>
                  <th className="pb-3 px-2">{t("GROUP / COURSE", "GROUP / COURSE", "ГРУППА / КУРС")}</th>
                  <th className="pb-3 px-2">{t("KONTRAKT (UZS)", "TUITION (UZS)", "КОНТРАКТ (UZS)")}</th>
                  <th className="pb-3 px-2">{t("STATUS", "STATUS", "СТАТУС")}</th>
                  <th className="pb-3 px-2 text-right">{t("AMALLAR", "ACTIONS", "ДЕЙСТВИЯ")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredStudents.map((st) => (
                  <tr key={st.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition">
                    <td className="py-3.5 px-2 font-extrabold text-slate-900 dark:text-white flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center font-black text-amber-500 shrink-0">
                        {st.fullName.charAt(0)}
                      </div>
                      <span>{st.fullName}</span>
                    </td>

                    <td className="py-3.5 px-2 text-slate-600 dark:text-slate-400 font-mono">
                      <span className="inline-flex items-center gap-1">
                        <Phone className="w-3 h-3 text-slate-400" />
                        {st.phone}
                      </span>
                    </td>

                    <td className="py-3.5 px-2 text-slate-700 dark:text-slate-300 font-semibold">
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[11px]">
                        <BookOpen className="w-3 h-3 text-amber-500" />
                        {st.groupName || 'General English'}
                      </span>
                    </td>

                    <td className="py-3.5 px-2 font-mono font-bold text-slate-900 dark:text-white">
                      {(st.tuitionFee || 650000).toLocaleString()} UZS
                    </td>

                    <td className="py-3.5 px-2">
                      <select
                        value={st.paymentStatus || 'pending'}
                        onClick={(e) => e.stopPropagation()}
                        onChange={(e) =>
                          handleQuickStatusChange(
                            st.id,
                            e.target.value as 'paid' | 'pending' | 'overdue',
                            e
                          )
                        }
                        className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold border cursor-pointer focus:outline-none transition ${
                          st.paymentStatus === 'paid'
                            ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
                            : st.paymentStatus === 'overdue'
                            ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30'
                            : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30'
                        }`}
                      >
                        <option value="paid" className="bg-slate-900 text-emerald-400 font-bold">
                          {t("Paid ✅", "Paid ✅", "Оплачено ✅")}
                        </option>
                        <option value="pending" className="bg-slate-900 text-amber-400 font-bold">
                          {t("Pending ⏳", "Pending ⏳", "В ожидании ⏳")}
                        </option>
                        <option value="overdue" className="bg-slate-900 text-rose-400 font-bold">
                          {t("Overdue ⚠️", "Overdue ⚠️", "Задолженность ⚠️")}
                        </option>
                      </select>
                    </td>

                    <td className="py-3.5 px-2 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setCrmStudent(st)}
                          className="px-2.5 py-1.5 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 hover:bg-amber-500/20 font-bold text-[11px] flex items-center gap-1 transition cursor-pointer border border-amber-500/20"
                          title="CRM Profile & Hybrid Portfolio"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>CRM Record</span>
                        </button>
                        <button
                          onClick={() => handleOpenEditModal(st)}
                          className="p-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-amber-500 transition cursor-pointer"
                          title="Tahrirlash"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteStudent(st.id, st.fullName)}
                          className="p-1.5 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 hover:bg-rose-500/20 transition cursor-pointer"
                          title="O'chirish"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ADD / EDIT STUDENT MODAL */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-md rounded-3xl p-6 shadow-2xl relative">
            <button
              onClick={() => setIsAddModalOpen(false)}
              className="absolute top-4 right-4 p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-5">
              <div className="p-2.5 rounded-2xl bg-amber-500/10 text-amber-500 font-bold">
                <UserPlus className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
                  {editingStudent
                    ? t("O'quvchi Ma'lumotlarini Tahrirlash", "Edit Student Information", "Редактировать Ученика")
                    : t("Yangi O'quvchi Qo'shish", "Add New Student", "Добавить Нового Ученика")}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {t("Guruh va kontrakt ma'lumotlarini kiriting", "Assign group and tuition details", "Назначьте группу и контракт")}
                </p>
              </div>
            </div>

            <form onSubmit={handleSubmitStudent} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  {t("O'quvchi F.I.SH *", "Student Full Name *", "Ф.И.О. Ученика *")}
                </label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Jasur Rahimov"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-amber-500 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  {t("Telefon Raqami *", "Phone Number *", "Телефон *")}
                </label>
                <input
                  type="text"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+998 90 123 45 67"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-mono font-bold focus:outline-none focus:ring-2 focus:ring-amber-500 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  {t("Guruhni Tanlang *", "Select Group *", "Выберите Группу *")}
                </label>
                <select
                  value={groupId}
                  onChange={(e) => setGroupId(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-amber-500 text-slate-900 dark:text-white"
                >
                  {groups.map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.name} ({g.courseType})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    {t("Oylik Kontrakt (UZS)", "Tuition Fee (UZS)", "Контракт (UZS)")}
                  </label>
                  <input
                    type="number"
                    value={tuitionFee}
                    onChange={(e) => setTuitionFee(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-mono font-bold focus:outline-none focus:ring-2 focus:ring-amber-500 text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    {t("To'lov Statusi", "Payment Status", "Статус Оплаты")}
                  </label>
                  <select
                    value={paymentStatus}
                    onChange={(e: any) => setPaymentStatus(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-amber-500 text-slate-900 dark:text-white"
                  >
                    <option value="paid">{t("To'langan ✅", "Paid ✅", "Оплачено ✅")}</option>
                    <option value="pending">{t("Kutilmoqda ⏳", "Pending ⏳", "В ожидании ⏳")}</option>
                    <option value="overdue">{t("Qarzdor ⚠️", "Overdue ⚠️", "Задолженность ⚠️")}</option>
                  </select>
                </div>
              </div>

              <div className="pt-3 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                >
                  {t("Bekor Qilish", "Cancel", "Отмена")}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-xs shadow-md cursor-pointer"
                >
                  {editingStudent ? t("Saqlash", "Save Changes", "Сохранить") : t("Qo'shish", "Register Student", "Зарегистрировать")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Student CRM Profile & Hybrid Portfolio View Modal */}
      <StudentCRMProfile
        isOpen={Boolean(crmStudent)}
        onClose={() => setCrmStudent(null)}
        student={crmStudent}
        onUpdateStudent={(updated) => {
          setStudents((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));
        }}
      />
    </div>
  );
};
