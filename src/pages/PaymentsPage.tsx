import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import {
  subscribeStudents,
  subscribePayments,
  recordPaymentAndSetPaid,
  seedFirestoreIfEmpty
} from '../services/firestore';
import { Student, Payment } from '../types';
import {
  CreditCard,
  PlusCircle,
  AlertCircle,
  CheckCircle2,
  DollarSign,
  Search,
  Filter,
  Phone,
  Clock,
  Sparkles,
  Loader2,
  X,
  Send,
  UserCheck
} from 'lucide-react';

export const PaymentsPage: React.FC = () => {
  const { currentUser, userProfile, activeRole } = useAuth();
  const { language } = useLanguage();
  const isUz = language === 'UZ';

  const [activeTab, setActiveTab] = useState<'all_payments' | 'debtors'>('all_payments');
  const [students, setStudents] = useState<Student[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');

  // Log Payment Modal
  const [isLogModalOpen, setIsLogModalOpen] = useState(false);
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [amount, setAmount] = useState('650000');
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card' | 'click'>('click');

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  useEffect(() => {
    seedFirestoreIfEmpty();

    const unsubStudents = subscribeStudents((data) => {
      setStudents(data);
      if (data.length > 0 && !selectedStudentId) {
        setSelectedStudentId(data[0].id);
      }
    });

    const unsubPayments = subscribePayments((data) => {
      setPayments(data);
      setIsLoading(false);
    });

    return () => {
      unsubStudents();
      unsubPayments();
    };
  }, []);

  const handleOpenLogModal = (studentId?: string) => {
    if (studentId) {
      setSelectedStudentId(studentId);
      const matched = students.find((s) => s.id === studentId);
      if (matched) {
        setAmount(matched.tuitionFee.toString());
      }
    } else if (students.length > 0) {
      setSelectedStudentId(students[0].id);
      setAmount(students[0].tuitionFee.toString());
    }
    setIsLogModalOpen(true);
  };

  const handleStudentSelectChange = (sId: string) => {
    setSelectedStudentId(sId);
    const matched = students.find((s) => s.id === sId);
    if (matched) {
      setAmount(matched.tuitionFee.toString());
    }
  };

  const handleSubmitPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudentId) {
      showToast(isUz ? "O'quvchini tanlang!" : "Select a student!");
      return;
    }

    const matchedStudent = students.find((s) => s.id === selectedStudentId);
    const studentName = matchedStudent ? matchedStudent.fullName : 'Student';
    const recorderName = userProfile?.displayName || currentUser?.displayName || 'Admin';

    try {
      await recordPaymentAndSetPaid(
        selectedStudentId,
        studentName,
        Number(amount) || 650000,
        paymentMethod,
        recorderName
      );
      showToast(isUz ? `${studentName} uchun to'lov qabul qilindi va holat 'To'langan'ga o'zgardi! ✅` : `Payment recorded for ${studentName}! Status set to 'Paid'. ✅`);
      setIsLogModalOpen(false);
    } catch (err) {
      console.error(err);
      showToast(isUz ? "To'lovni saqlashda xatolik!" : "Failed to record payment.");
    }
  };

  // Debtors list (students with pending or overdue)
  const debtors = students.filter((s) => s.paymentStatus === 'pending' || s.paymentStatus === 'overdue');

  const totalRevenue = payments.reduce((acc, p) => acc + (p.amount || 0), 0);

  // Filtered Payments
  const filteredPayments = payments.filter((p) =>
    p.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.paymentMethod.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 px-4 py-3 rounded-2xl bg-slate-900 text-white shadow-2xl border border-amber-500/40 text-xs font-bold flex items-center gap-2 animate-bounce">
          <Sparkles className="w-4 h-4 text-amber-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2.5 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold">
              <CreditCard className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                {isUz ? "To'lovlar & Qarzdorlar Boshqaruvi" : "Tuition & Debtor Management"}
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {isUz
                  ? "Kontrakt to'lovlarini qabul qilish va avtomatik qarzdorlik holatini yangilash"
                  : "Record student tuition payments & track overdue accounts in real-time"}
              </p>
            </div>
          </div>
        </div>

        {(activeRole === 'superadmin' || activeRole === 'admin') && (
          <button
            onClick={() => handleOpenLogModal()}
            className="w-full sm:w-auto px-4 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold text-xs rounded-2xl shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 transition cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            <span>{isUz ? "To'lov Kiritish (Log Payment)" : "Log Payment"}</span>
          </button>
        )}
      </div>

      {/* Overview Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
              {isUz ? "Yig'ilgan Jami Tushum" : "Total Recorded Revenue"}
            </span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-500">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <h3 className="text-2xl font-black text-slate-900 dark:text-white font-mono">
            {totalRevenue.toLocaleString()} UZS
          </h3>
          <p className="text-[11px] text-slate-500 mt-1">
            {isUz ? `${payments.length} ta tasdiqlangan to'lov` : `${payments.length} logged transactions`}
          </p>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
              {isUz ? "Qarzdor / Kutilayotganlar" : "Pending / Debtor Accounts"}
            </span>
            <div className="p-2 rounded-xl bg-rose-500/10 text-rose-500">
              <AlertCircle className="w-4 h-4" />
            </div>
          </div>
          <h3 className="text-2xl font-black text-rose-600 dark:text-rose-400 font-mono">
            {debtors.length} {isUz ? "O'quvchi" : "Students"}
          </h3>
          <p className="text-[11px] text-slate-500 mt-1">
            {isUz ? "Kutilayotgan kontrakt to'lovlari" : "Awaiting monthly tuition"}
          </p>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
              {isUz ? "To'lov Intizomi" : "Payment Compliance Rate"}
            </span>
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-500">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <h3 className="text-2xl font-black text-slate-900 dark:text-white font-mono">
            {students.length > 0 ? Math.round(((students.length - debtors.length) / students.length) * 100) : 100}%
          </h3>
          <p className="text-[11px] text-slate-500 mt-1">
            {isUz ? "O'z vaqtida to'langan kontraktlar" : "On-time paid subscriptions"}
          </p>
        </div>
      </div>

      {/* Navigation Tabs (All Payments vs Debtors List) */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-3">
        <button
          onClick={() => setActiveTab('all_payments')}
          className={`px-4 py-2 rounded-2xl text-xs font-bold transition cursor-pointer flex items-center gap-2 ${
            activeTab === 'all_payments'
              ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/10'
              : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800'
          }`}
        >
          <CreditCard className="w-4 h-4" />
          <span>{isUz ? "Barcha To'lovlar Tarixi" : "All Payment Logs"}</span>
          <span className="px-2 py-0.5 rounded-full bg-slate-950/20 text-[10px] font-mono">
            {payments.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('debtors')}
          className={`px-4 py-2 rounded-2xl text-xs font-bold transition cursor-pointer flex items-center gap-2 ${
            activeTab === 'debtors'
              ? 'bg-rose-500 text-white shadow-md shadow-rose-500/10'
              : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800'
          }`}
        >
          <AlertCircle className="w-4 h-4" />
          <span>{isUz ? "Qarzdorlar Ro'yxati" : "Debtor List Tab"}</span>
          <span className="px-2 py-0.5 rounded-full bg-white/20 text-[10px] font-mono">
            {debtors.length}
          </span>
        </button>
      </div>

      {/* TAB 1: ALL PAYMENTS LOG */}
      {activeTab === 'all_payments' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm">
          <div className="flex flex-col md:flex-row items-center justify-between gap-3 mb-4">
            <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
              {isUz ? "Barcha Qabul Qilingan To'lovlar (Firestore Logs)" : "Recorded Payments History"}
            </h3>

            <div className="relative w-full md:w-64">
              <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={isUz ? "Ism bo'yicha..." : "Filter by name..."}
                className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold focus:outline-none"
              />
            </div>
          </div>

          {isLoading ? (
            <div className="py-12 flex flex-col items-center justify-center text-slate-400 gap-2">
              <Loader2 className="w-6 h-6 animate-spin text-amber-500" />
              <span className="text-xs font-bold">{isUz ? "To'lovlar yuklanmoqda..." : "Loading payments..."}</span>
            </div>
          ) : filteredPayments.length === 0 ? (
            <div className="py-12 text-center text-slate-400">
              <p className="text-sm font-bold">{isUz ? "Hozircha birorta ham to'lov qayd etilmagan" : "No payment logs recorded yet"}</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 font-bold uppercase tracking-wider">
                    <th className="pb-3 px-2">{isUz ? "O'quvchi" : "Student Name"}</th>
                    <th className="pb-3 px-2">{isUz ? "Summa (UZS)" : "Amount"}</th>
                    <th className="pb-3 px-2">{isUz ? "To'lov Usuli" : "Payment Method"}</th>
                    <th className="pb-3 px-2">{isUz ? "Qabul Qilgan" : "Recorded By"}</th>
                    <th className="pb-3 px-2">{isUz ? "Sana" : "Date"}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {filteredPayments.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition">
                      <td className="py-3.5 px-2 font-bold text-slate-900 dark:text-white">{p.studentName}</td>
                      <td className="py-3.5 px-2 font-mono font-bold text-emerald-600 dark:text-emerald-400">
                        +{p.amount?.toLocaleString()} UZS
                      </td>
                      <td className="py-3.5 px-2">
                        <span className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-[10px] border border-slate-200 dark:border-slate-700 uppercase">
                          {p.paymentMethod}
                        </span>
                      </td>
                      <td className="py-3.5 px-2 text-slate-500 font-medium">{p.recordedBy}</td>
                      <td className="py-3.5 px-2 font-mono text-[11px] text-slate-400">{p.date}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: DEBTORS LIST */}
      {activeTab === 'debtors' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-extrabold text-base text-slate-900 dark:text-white flex items-center gap-2">
                <span>{isUz ? "Qarzdor va Kutilayotgan O'quvchilar Ro'yxati" : "Debtor & Overdue Accounts List"}</span>
                <span className="px-2.5 py-0.5 rounded-full bg-rose-500/10 text-rose-600 dark:text-rose-400 text-xs font-bold border border-rose-500/20">
                  {debtors.length} {isUz ? "Qarzdor" : "Overdue"}
                </span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {isUz ? "Tugmachani bosib darhol to'lov kiritishingiz va holatni 'To'langan'ga o'tkazishingiz mumkin" : "Click 'Log Payment' to clear debtor status automatically"}
              </p>
            </div>
          </div>

          {debtors.length === 0 ? (
            <div className="py-12 text-center text-emerald-500 font-bold">
              <CheckCircle2 className="w-8 h-8 mx-auto mb-2" />
              <p>{isUz ? "Barcha o'quvchilar to'lovlarini to'lagan! Qarzdorlar yo'q 🎉" : "All students are fully paid up! Zero debtors 🎉"}</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 font-bold uppercase tracking-wider">
                    <th className="pb-3 px-2">{isUz ? "O'quvchi Ismi" : "Student Name"}</th>
                    <th className="pb-3 px-2">{isUz ? "Telefon" : "Phone Number"}</th>
                    <th className="pb-3 px-2">{isUz ? "Guruh" : "Group"}</th>
                    <th className="pb-3 px-2">{isUz ? "Oylik Kontrakt" : "Tuition Fee"}</th>
                    <th className="pb-3 px-2">{isUz ? "Holat" : "Status"}</th>
                    <th className="pb-3 px-2 text-right">{isUz ? "Tezkor Amal" : "Action"}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {debtors.map((st) => (
                    <tr key={st.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition">
                      <td className="py-3.5 px-2 font-bold text-slate-900 dark:text-white">{st.fullName}</td>
                      <td className="py-3.5 px-2 text-slate-600 dark:text-slate-400 font-mono">
                        <div className="flex items-center gap-1">
                          <Phone className="w-3 h-3 text-slate-400" />
                          <span>{st.phone}</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-2 text-slate-600 dark:text-slate-400">{st.groupName}</td>
                      <td className="py-3.5 px-2 font-mono font-bold text-rose-600 dark:text-rose-400">
                        {st.tuitionFee?.toLocaleString()} UZS
                      </td>
                      <td className="py-3.5 px-2">
                        {st.paymentStatus === 'overdue' ? (
                          <span className="px-2.5 py-0.5 rounded-full bg-rose-500/10 text-rose-600 font-bold text-[10px] border border-rose-500/20">
                            Qarzdor ❌
                          </span>
                        ) : (
                          <span className="px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-600 font-bold text-[10px] border border-amber-500/20">
                            Kutilmoqda ⏳
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-2 text-right">
                        <button
                          onClick={() => handleOpenLogModal(st.id)}
                          className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold text-[11px] rounded-xl shadow transition cursor-pointer"
                        >
                          {isUz ? "To'lov Qabul Qilish" : "Log Payment"}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* LOG PAYMENT MODAL */}
      {isLogModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-md rounded-3xl p-6 shadow-2xl relative">
            <button
              onClick={() => setIsLogModalOpen(false)}
              className="absolute top-4 right-4 p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-5">
              <div className="p-2.5 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold">
                <CreditCard className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
                  {isUz ? "Kontrakt To'lovini Kiritish" : "Record Tuition Payment"}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {isUz ? "To'lov avtomatik Firestore da 'To'langan' ga o'tkazadi" : "Saves payment record and updates student status to 'Paid'"}
                </p>
              </div>
            </div>

            <form onSubmit={handleSubmitPayment} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  {isUz ? "O'quvchini Tanlang *" : "Select Student *"}
                </label>
                <select
                  value={selectedStudentId}
                  onChange={(e) => handleStudentSelectChange(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  {students.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.fullName} ({s.groupName}) - {s.paymentStatus.toUpperCase()}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  {isUz ? "To'lov Summasi (UZS) *" : "Payment Amount (UZS) *"}
                </label>
                <input
                  type="number"
                  required
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  {isUz ? "To'lov Usuli *" : "Payment Method *"}
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('click')}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold transition cursor-pointer ${
                      paymentMethod === 'click'
                        ? 'bg-emerald-500 text-slate-950 border-emerald-500 shadow-sm'
                        : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    📱 Click / Payme
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMethod('card')}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold transition cursor-pointer ${
                      paymentMethod === 'card'
                        ? 'bg-emerald-500 text-slate-950 border-emerald-500 shadow-sm'
                        : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    💳 Uzcard / Visa
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMethod('cash')}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold transition cursor-pointer ${
                      paymentMethod === 'cash'
                        ? 'bg-emerald-500 text-slate-950 border-emerald-500 shadow-sm'
                        : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    💵 {isUz ? "Naqd Pul" : "Cash"}
                  </button>
                </div>
              </div>

              <div className="pt-3 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsLogModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                >
                  {isUz ? "Bekor Qilish" : "Cancel"}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold text-xs shadow-md cursor-pointer"
                >
                  {isUz ? "To'lovni Qabul Qilish" : "Record Payment"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
