import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import {
  subscribeStudents,
  subscribeGroups,
  addStudent,
  updateStudent,
  deleteStudent,
  seedFirestoreIfEmpty
} from '../services/firestore';
import { Student, Group } from '../types';
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
  Loader2
} from 'lucide-react';

export const StudentsPage: React.FC = () => {
  const { currentUser, activeRole } = useAuth();
  const { language } = useLanguage();
  const isUz = language === 'UZ';

  const [students, setStudents] = useState<Student[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGroupFilter, setSelectedGroupFilter] = useState('ALL');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState('ALL');

  // Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);

  // Form Fields
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [groupId, setGroupId] = useState('');
  const [tuitionFee, setTuitionFee] = useState('650000');
  const [paymentStatus, setPaymentStatus] = useState<'paid' | 'pending' | 'overdue'>('pending');

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  useEffect(() => {
    // Seed default records if empty
    seedFirestoreIfEmpty();

    // Subscribe to students and groups live updates
    const unsubStudents = subscribeStudents((data) => {
      setStudents(data);
      setIsLoading(false);
    });

    const unsubGroups = subscribeGroups((data) => {
      setGroups(data);
      if (data.length > 0 && !groupId) {
        setGroupId(data[0].id);
      }
    });

    return () => {
      unsubStudents();
      unsubGroups();
    };
  }, []);

  // Filtered Students
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
    setGroupId(student.groupId);
    setTuitionFee(student.tuitionFee.toString());
    setPaymentStatus(student.paymentStatus);
    setIsAddModalOpen(true);
  };

  const handleSubmitStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || !phone.trim()) {
      showToast(isUz ? "Iltimos, ism va telefon raqamini kiriting!" : "Please fill in student name and phone!");
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
        showToast(isUz ? "O'quvchi ma'lumotlari yangilandi! ✅" : "Student profile updated! ✅");
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
        showToast(isUz ? "Yangi o'quvchi Firestore ga qo'shildi! 🎉" : "New student registered in Firestore! 🎉");
      }
      setIsAddModalOpen(false);
    } catch (err) {
      console.error(err);
      showToast(isUz ? "Xatolik yuz berdi!" : "Failed to save student record.");
    }
  };

  const handleDeleteStudent = async (id: string, name: string) => {
    if (confirm(isUz ? `${name} ni o'chirishni tasdiqlaysizmi?` : `Are you sure you want to remove ${name}?`)) {
      try {
        await deleteStudent(id);
        showToast(isUz ? `${name} o'chirildi.` : `${name} removed.`);
      } catch (err) {
        console.error(err);
        showToast(isUz ? "O'chirishda xatolik!" : "Failed to delete student.");
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

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2.5 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 font-bold">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                {isUz ? "O'quvchilar Boshqaruvi (Live Firestore)" : "Student Roster Management (Firestore)"}
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {isUz
                  ? "Markaz o'quvchilarini ro'yxatga olish, guruhlarga biriktirish va to'lov holatini kuzatish"
                  : "Register students, assign groups, and manage live enrollment statuses"}
              </p>
            </div>
          </div>
        </div>

        {(activeRole === 'superadmin' || activeRole === 'admin') && (
          <button
            onClick={handleOpenAddModal}
            className="w-full sm:w-auto px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs rounded-2xl shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2 transition cursor-pointer"
          >
            <UserPlus className="w-4 h-4" />
            <span>{isUz ? "Yangi O'quvchi Qo'shish" : "Add New Student"}</span>
          </button>
        )}
      </div>

      {/* Search & Filter Controls */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-4 shadow-sm flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Search Bar */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={isUz ? "Ism yoki telefon raqami bo'yicha qidirish..." : "Search by name or phone number..."}
            className="w-full pl-10 pr-4 py-2 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500/40"
          />
        </div>

        {/* Group Filter */}
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          <div className="flex items-center gap-1 text-xs font-bold text-slate-500 dark:text-slate-400">
            <Filter className="w-3.5 h-3.5 text-amber-500" />
            <span>{isUz ? "Guruh:" : "Group:"}</span>
          </div>
          <select
            value={selectedGroupFilter}
            onChange={(e) => setSelectedGroupFilter(e.target.value)}
            className="py-1.5 px-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold focus:outline-none"
          >
            <option value="ALL">{isUz ? "Barcha Guruhlar" : "All Groups"}</option>
            {groups.map((g) => (
              <option key={g.id} value={g.id}>
                {g.name}
              </option>
            ))}
          </select>

          {/* Payment Status Filter */}
          <select
            value={selectedStatusFilter}
            onChange={(e) => setSelectedStatusFilter(e.target.value)}
            className="py-1.5 px-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold focus:outline-none"
          >
            <option value="ALL">{isUz ? "Barcha Holatlar" : "All Payment Statuses"}</option>
            <option value="paid">{isUz ? "To'langan ✅" : "Paid ✅"}</option>
            <option value="pending">{isUz ? "Kutilmoqda ⏳" : "Pending ⏳"}</option>
            <option value="overdue">{isUz ? "Qarzdor ❌" : "Overdue ❌"}</option>
          </select>
        </div>
      </div>

      {/* Student Roster Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm">
        {isLoading ? (
          <div className="py-12 flex flex-col items-center justify-center text-slate-400 gap-2">
            <Loader2 className="w-6 h-6 animate-spin text-amber-500" />
            <span className="text-xs font-bold">{isUz ? "Firestore o'quvchilar yuklanmoqda..." : "Fetching live students from Firestore..."}</span>
          </div>
        ) : filteredStudents.length === 0 ? (
          <div className="py-12 text-center text-slate-400">
            <p className="text-sm font-bold">{isUz ? "Birorta ham o'quvchi topilmadi" : "No students found matching filters"}</p>
            <p className="text-xs mt-1">{isUz ? "Qidiruv parametrlarini o'zgartiring yoki yangi o'quvchi qo'shing." : "Adjust search parameters or add a new student."}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 font-bold uppercase tracking-wider">
                  <th className="pb-3 px-2">{isUz ? "O'quvchi Ismi" : "Student Name"}</th>
                  <th className="pb-3 px-2">{isUz ? "Telefon" : "Phone Number"}</th>
                  <th className="pb-3 px-2">{isUz ? "Guruh" : "Assigned Group"}</th>
                  <th className="pb-3 px-2">{isUz ? "Oylik Kontrakt" : "Monthly Tuition"}</th>
                  <th className="pb-3 px-2">{isUz ? "To'lov Holati" : "Payment Status"}</th>
                  <th className="pb-3 px-2">{isUz ? "So'nggi To'lov" : "Last Payment Date"}</th>
                  {(activeRole === 'superadmin' || activeRole === 'admin') && (
                    <th className="pb-3 px-2 text-right">{isUz ? "Amallar" : "Actions"}</th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredStudents.map((st) => (
                  <tr key={st.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition">
                    <td className="py-3.5 px-2 font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 font-black flex items-center justify-center text-xs">
                        {st.fullName.charAt(0)}
                      </div>
                      <span>{st.fullName}</span>
                    </td>
                    <td className="py-3.5 px-2 text-slate-600 dark:text-slate-400 font-mono">
                      <div className="flex items-center gap-1">
                        <Phone className="w-3 h-3 text-slate-400" />
                        <span>{st.phone}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-2 font-semibold text-slate-700 dark:text-slate-300">
                      <div className="flex items-center gap-1.5">
                        <BookOpen className="w-3.5 h-3.5 text-amber-500" />
                        <span>{st.groupName || 'Unassigned'}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-2 font-mono font-bold text-slate-900 dark:text-white">
                      {st.tuitionFee?.toLocaleString()} UZS
                    </td>
                    <td className="py-3.5 px-2">
                      {st.paymentStatus === 'paid' && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold text-[10px] border border-emerald-500/20">
                          <CheckCircle2 className="w-3 h-3" /> {isUz ? "To'langan ✅" : "Paid ✅"}
                        </span>
                      )}
                      {st.paymentStatus === 'pending' && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 font-bold text-[10px] border border-amber-500/20">
                          <Clock className="w-3 h-3" /> {isUz ? "Kutilmoqda ⏳" : "Pending ⏳"}
                        </span>
                      )}
                      {st.paymentStatus === 'overdue' && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-rose-500/10 text-rose-600 dark:text-rose-400 font-bold text-[10px] border border-rose-500/20">
                          <XCircle className="w-3 h-3" /> {isUz ? "Qarzdor ❌" : "Overdue ❌"}
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-2 font-mono text-[11px] text-slate-400">
                      {st.lastPaymentDate || 'N/A'}
                    </td>
                    {(activeRole === 'superadmin' || activeRole === 'admin') && (
                      <td className="py-3.5 px-2 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => handleOpenEditModal(st)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-amber-500 hover:bg-amber-500/10 transition cursor-pointer"
                            title="Edit Student"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteStudent(st.id, st.fullName)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-rose-500 hover:bg-rose-500/10 transition cursor-pointer"
                            title="Delete Student"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add / Edit Student Modal */}
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
              <div className="p-2.5 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 font-bold">
                <UserPlus className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
                  {editingStudent
                    ? isUz ? "O'quvchi Ma'lumotlarini Tahrirlash" : "Edit Student Profile"
                    : isUz ? "Yangi O'quvchi Ro'yxatga Olish" : "Register New Student"}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {isUz ? "Ma'lumotlar Firestore ma'lumotlar bazasiga saqlanadi" : "Saved live to Firebase Firestore collection"}
                </p>
              </div>
            </div>

            <form onSubmit={handleSubmitStudent} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  {isUz ? "O'quvchi To'liq Ismi *" : "Full Student Name *"}
                </label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="E.g. Anvar Alimov"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  {isUz ? "Telefon Raqami *" : "Phone Number *"}
                </label>
                <input
                  type="text"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+998 90 123 45 67"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    {isUz ? "Guruh *" : "Assigned Group *"}
                  </label>
                  <select
                    value={groupId}
                    onChange={(e) => setGroupId(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold focus:outline-none"
                  >
                    {groups.map((g) => (
                      <option key={g.id} value={g.id}>
                        {g.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    {isUz ? "Oylik Kontrakt (UZS)" : "Tuition Fee (UZS)"}
                  </label>
                  <input
                    type="number"
                    value={tuitionFee}
                    onChange={(e) => setTuitionFee(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  {isUz ? "Boshlang'ich To'lov Holati" : "Initial Payment Status"}
                </label>
                <select
                  value={paymentStatus}
                  onChange={(e) => setPaymentStatus(e.target.value as any)}
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold focus:outline-none"
                >
                  <option value="pending">{isUz ? "Kutilmoqda ⏳" : "Pending ⏳"}</option>
                  <option value="paid">{isUz ? "To'langan ✅" : "Paid ✅"}</option>
                  <option value="overdue">{isUz ? "Qarzdor ❌" : "Overdue ❌"}</option>
                </select>
              </div>

              <div className="pt-3 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                >
                  {isUz ? "Bekor Qilish" : "Cancel"}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs shadow-md cursor-pointer"
                >
                  {editingStudent
                    ? isUz ? "Saqlash" : "Save Changes"
                    : isUz ? "O'quvchini Qo'shish" : "Register Student"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
