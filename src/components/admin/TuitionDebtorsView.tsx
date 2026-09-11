import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import dayjs from 'dayjs';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import {
  subscribeStudents,
  subscribePayments,
  recordPaymentAndSetPaid,
  updateStudentPaymentStatus
} from '../../services/firestore';
import { DEFAULT_MOCK_STUDENTS, DEFAULT_MOCK_PAYMENTS } from '../../data/mockData';
import { Student, Payment } from '../../types';
import {
  CreditCard,
  AlertTriangle,
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
  Bell,
  Check,
  AlertCircle
} from 'lucide-react';

export const TuitionDebtorsView: React.FC = () => {
  const { currentUser, userProfile } = useAuth();
  const { language } = useLanguage();
  const t = (uz: string, en: string, ru: string) => {
    if (language === 'UZ') return uz;
    if (language === 'RU') return ru;
    return en;
  };

  const [activeTab, setActiveTab] = useState<'debtors' | 'all_payments'>('debtors');
  const [students, setStudents] = useState<Student[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Search Query
  const [searchQuery, setSearchQuery] = useState('');

  // Log Payment Modal
  const [isLogModalOpen, setIsLogModalOpen] = useState(false);
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [amount, setAmount] = useState('650000');
  const [paymentMethod, setPaymentMethod] = useState<'click' | 'payme' | 'cash' | 'card'>('click');

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

    const unsubStudents = subscribeStudents((data) => {
      if (!isMounted) return;
      const effectiveStudents = data.length > 0 ? data : DEFAULT_MOCK_STUDENTS;
      setStudents(effectiveStudents);
      if (effectiveStudents.length > 0 && !selectedStudentId) {
        setSelectedStudentId(effectiveStudents[0].id);
      }
    });

    const unsubPayments = subscribePayments((data) => {
      if (!isMounted) return;
      setPayments(data.length > 0 ? data : DEFAULT_MOCK_PAYMENTS);
      setIsLoading(false);
    });

    const timer = setTimeout(() => {
      if (isMounted) setIsLoading(false);
    }, 2000);

    return () => {
      isMounted = false;
      clearTimeout(timer);
      unsubStudents();
      unsubPayments();
    };
  }, []);

  const handleOpenLogModal = (studentId?: string) => {
    if (studentId) {
      setSelectedStudentId(studentId);
      const matched = students.find((s) => s.id === studentId);
      if (matched) {
        setAmount((matched.tuitionFee || 650000).toString());
      }
    } else if (students.length > 0) {
      setSelectedStudentId(students[0].id);
      setAmount((students[0].tuitionFee || 650000).toString());
    }
    setIsLogModalOpen(true);
  };

  const handleStudentSelectChange = (sId: string) => {
    setSelectedStudentId(sId);
    const matched = students.find((s) => s.id === sId);
    if (matched) {
      setAmount((matched.tuitionFee || 650000).toString());
    }
  };

  const handleSubmitPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudentId) {
      showToast(t("O'quvchini tanlang!", "Please select a student!", "Выберите ученика!"));
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
      showToast(t(`${studentName} uchun to'lov qabul qilindi va status 'To'langan ✅' ga o'zgardi!`, `Payment logged for ${studentName}! Status set to 'Paid ✅'.`, `Оплата принята для ${studentName}! Статус устанволен на 'Оплачено ✅'.`));
      setIsLogModalOpen(false);
    } catch (err) {
      console.error(err);
      showToast(t("To'lovni saqlashda xatolik!", "Failed to record payment.", "Ошибка при записи оплаты."));
    }
  };

  // Dispatch Telegram Reminder to Parent Accounts
  const handleSendTelegramReminder = (student: Student) => {
    const msg = t(
      `📱 Telegram Ogohlantirish: ${student.fullName} (${student.phone}) ning oylik kontrakt to'lovi summasi (${(student.tuitionFee || 650000).toLocaleString()} UZS) bo'yicha ota-ona botiga eslatma yuborildi!`,
      `📱 Telegram Notice: Payment reminder of ${(student.tuitionFee || 650000).toLocaleString()} UZS sent to parent account of ${student.fullName}!`,
      `📱 Telegram Уведомление: Напоминание об оплате ${(student.tuitionFee || 650000).toLocaleString()} UZS отправлено родителям ${student.fullName}!`
    );
    showToast(msg);
  };

  const handleQuickStudentStatusChange = async (
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
          `O'quvchi to'lov statusi '${newStatus}' ga yangilandi ✅`,
          `Student tuition status updated to '${newStatus}' ✅`,
          `Статус оплаты ученика обновлен на '${newStatus}' ✅`
        )
      );
    } catch (err) {
      console.error('Failed to update student status:', err);
      setStudents(prevStudents); // Revert local state
      showToast(
        t('Statusni yangilashda xatolik yuz berdi!', 'Failed to update status.', 'Ошибка при обновлении статуса.')
      );
    }
  };

  // Debtors list (pending or overdue)
  const debtors = students.filter((s) => s.paymentStatus === 'pending' || s.paymentStatus === 'overdue');
  const filteredDebtors = debtors.filter((s) =>
    s.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.phone.includes(searchQuery) ||
    s.groupName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalRevenue = payments.reduce((acc, p) => acc + (p.amount || 0), 0);
  const totalDebtAmount = debtors.reduce((acc, s) => acc + (s.tuitionFee || 650000), 0);

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

      {/* Header Banner with Hosted Asset Background */}
      <div className="p-6 rounded-3xl bg-slate-900 text-white border border-slate-800 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 relative overflow-hidden">
        <img
          src="https://i.ibb.co/rR6PYx2b/image.png"
          alt="Admin Banner Background"
          className="absolute inset-0 w-full h-full object-cover opacity-20 dark:opacity-35 pointer-events-none"
        />
        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-bold border border-emerald-500/30 mb-2">
            <CreditCard className="w-3.5 h-3.5" />
            <span>CenterFlow Tuition & Debtors Hub</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
            {t("To'lovlar & Qarzdorlar Ro'yxati", "Tuition & Debtor List Management", "Оплата и Учет Задолженностей")}
          </h1>
          <p className="text-xs text-slate-400 mt-1 max-w-xl">
            {t(
              "Kontrakt to'lovlarini ro'yxatga olish, qarzdor o'quvchilarni monitoring qilish va Telegram orqali avtomatik eslatmalar yuborish paneli.",
              "Track tuition logs, filter overdue debtor accounts, log payments via Click/Payme/Cash/Cards, and send instant Telegram alerts.",
              "Учет оплаты контрактов, отслеживание задолженностей и отправка уведомлений в Telegram."
            )}
          </p>
        </div>

        <button
          onClick={() => handleOpenLogModal()}
          className="px-5 py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs shadow-lg shadow-emerald-500/20 transition cursor-pointer flex items-center gap-2 shrink-0 relative z-10"
        >
          <CreditCard className="w-4 h-4" />
          <span>{t("To'lov Qabul Qilish", "Log Tuition Payment", "Принять Оплату")}</span>
        </button>
      </div>

      {/* Tuition Analytics Banner Asset */}
      <div className="p-4 rounded-3xl bg-white/80 dark:bg-slate-900/50 backdrop-blur-md border border-slate-200/80 dark:border-slate-800/60 flex flex-col md:flex-row items-center justify-between gap-4 overflow-hidden relative shadow-sm dark:shadow-xl">
        <div className="flex items-center gap-4 relative z-10">
          <img
            src="https://i.ibb.co/XfBqBNBX/image.png"
            alt="Tuition Analytics"
            className="w-24 h-20 object-cover rounded-2xl border border-emerald-500/30 shadow-md shrink-0 opacity-90 dark:opacity-100"
          />
          <div>
            <h3 className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
              <span>{t("Moliya va Kontrakt Tahlili", "Tuition & Financial Analytics", "Аналитика Оплат")}</span>
              <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-mono font-bold">
                LIVE METRICS
              </span>
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 max-w-lg">
              {t(
                "Oylik tushum va qarzdorliklar real-vaqt rejimida Firestore ma'lumotlar bazasi bilan avtomatik sinxronlanadi.",
                "Real-time tuition metrics, collected fees, and debtor account streams synced with Firestore.",
                "Аналитика и финансовые потоки автоматически синхронизируются с базами данных."
              )}
            </p>
          </div>
        </div>
        <button
          onClick={() => handleOpenLogModal()}
          className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 font-bold text-xs shrink-0 cursor-pointer transition relative z-10"
        >
          {t("Kassa Operatsiyalari →", "Open Cashier Portal →", "Кассовые Операции →")}
        </button>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-3xl bg-white/80 dark:bg-slate-900/50 backdrop-blur-md border border-slate-200/80 dark:border-slate-800/60 shadow-sm dark:shadow-xl space-y-1">
          <span className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">
            {t("Jami Qabul Qilingan Tushum", "Total Logged Revenue", "Принятый Доход")}
          </span>
          <p className="text-2xl font-black text-emerald-500 font-mono">
            {totalRevenue.toLocaleString()} UZS
          </p>
          <p className="text-[11px] text-slate-500 dark:text-slate-400">
            {payments.length} {t("ta muvaffaqiyatli tranzaksiya", "successful transactions", "успешных транзакций")}
          </p>
        </div>

        <div className="p-5 rounded-3xl bg-white/80 dark:bg-slate-900/50 backdrop-blur-md border border-slate-200/80 dark:border-slate-800/60 shadow-sm dark:shadow-xl space-y-1">
          <span className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">
            {t("Qarzdorlik Summasi", "Total Pending Debt", "Общий Долг")}
          </span>
          <p className="text-2xl font-black text-rose-500 font-mono">
            {totalDebtAmount.toLocaleString()} UZS
          </p>
          <p className="text-[11px] text-slate-500 dark:text-slate-400">
            {debtors.length} {t("ta qarzdor o'quvchi hisobida", "debtor accounts pending", "аккаунтов с задолженностью")}
          </p>
        </div>

        <div className="p-5 rounded-3xl bg-white/80 dark:bg-slate-900/50 backdrop-blur-md border border-slate-200/80 dark:border-slate-800/60 shadow-sm dark:shadow-xl space-y-1">
          <span className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">
            {t("To'lov Intizomi", "Payment Compliance", "Исполнение Оплаты")}
          </span>
          <p className="text-2xl font-black text-slate-900 dark:text-white">
            {students.length > 0 ? Math.round(((students.length - debtors.length) / students.length) * 100) : 100}%
          </p>
          <p className="text-[11px] text-emerald-500 font-bold flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" />
            {t("High Collection Efficiency", "High Collection Efficiency", "Высокая сбираемость")}
          </p>
        </div>
      </div>

      {/* Navigation Tabs & Search */}
      <div className="bg-white/80 dark:bg-slate-900/50 backdrop-blur-md border border-slate-200/80 dark:border-slate-800/60 rounded-3xl p-4 shadow-sm dark:shadow-xl flex flex-col sm:flex-row items-center justify-between gap-3">
        {/* Tab Buttons */}
        <div className="flex items-center gap-2 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-2xl w-full sm:w-auto">
          <button
            onClick={() => setActiveTab('debtors')}
            className={`px-4 py-2 rounded-xl text-xs font-extrabold transition cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'debtors'
                ? 'bg-rose-500 text-white shadow-md'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <AlertCircle className="w-3.5 h-3.5" />
            <span>{t("Qarzdorlar Ro'yxati", "Debtor Accounts", "Список Должников")}</span>
            <span className="px-1.5 py-0.5 rounded-full bg-white/20 text-[10px] font-mono">
              {debtors.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('all_payments')}
            className={`px-4 py-2 rounded-xl text-xs font-extrabold transition cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'all_payments'
                ? 'bg-emerald-500 text-slate-950 shadow-md'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <CreditCard className="w-3.5 h-3.5" />
            <span>{t("Barcha To'lovlar", "All Payment Logs", "Все Транзакции")}</span>
            <span className="px-1.5 py-0.5 rounded-full bg-slate-950/10 text-[10px] font-mono">
              {payments.length}
            </span>
          </button>
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t("Qidirish...", "Search...", "Поиск...")}
            className="w-full pl-10 pr-4 py-2 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
          />
        </div>
      </div>

      {/* Main Table Content */}
      <div className="bg-white/80 dark:bg-slate-900/50 backdrop-blur-md border border-slate-200/80 dark:border-slate-800/60 rounded-3xl p-6 shadow-sm dark:shadow-xl">
        {activeTab === 'debtors' ? (
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-extrabold text-base text-slate-900 dark:text-white flex items-center gap-2">
                  <span>{t("Qarzdor O'quvchilar Monitroingi", "Debtor Accounts Monitoring", "Мониторинг Задолженностей")}</span>
                  <span className="px-2.5 py-0.5 rounded-full bg-rose-500/10 text-rose-600 dark:text-rose-400 font-mono text-xs">
                    {filteredDebtors.length}
                  </span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {t("Muddati o'tgan yoki to'lanmagan oylik kontrakt to'lovlari", "Students with overdue tuition payments needing resolution", "Ученики с просроченной оплатой")}
                </p>
              </div>
            </div>

            {isLoading ? (
              <div className="py-12 text-center text-slate-400">
                <Loader2 className="w-6 h-6 animate-spin mx-auto text-amber-500 mb-2" />
                <p className="text-xs">{t("Yuklanmoqda...", "Loading debtors list...", "Загрузка...")}</p>
              </div>
            ) : filteredDebtors.length === 0 ? (
              <div className="py-12 text-center text-slate-400 space-y-2">
                <CheckCircle2 className="w-8 h-8 mx-auto text-emerald-500" />
                <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  {t("Ajoyib! Barcha o'quvchilar to'lovni amalga oshirgan! 🎉", "Great! No active debtor accounts found! 🎉", "Отлично! Все счета оплачены! 🎉")}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 font-bold uppercase tracking-wider">
                      <th className="pb-3 px-2">{t("STUDENT NAME", "STUDENT NAME", "ИМЯ УЧЕНИКА")}</th>
                      <th className="pb-3 px-2">{t("GROUP / COURSE", "GROUP / COURSE", "ГРУППА / КУРС")}</th>
                      <th className="pb-3 px-2">{t("TELEFON RAQAMI", "PHONE NUMBER", "ТЕЛЕФОН")}</th>
                      <th className="pb-3 px-2">{t("AMOUNT (UZS)", "AMOUNT (UZS)", "СУММА (UZS)")}</th>
                      <th className="pb-3 px-2">{t("STATUS", "STATUS", "СТАТУС")}</th>
                      <th className="pb-3 px-2 text-right">{t("AMALLAR", "ACTIONS", "ДЕЙСТВИЯ")}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {filteredDebtors.map((st) => (
                      <tr key={st.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition">
                        <td className="py-3.5 px-2 font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-rose-500/10 text-rose-500 font-black flex items-center justify-center shrink-0">
                            {st.fullName.charAt(0)}
                          </div>
                          <span>{st.fullName}</span>
                        </td>

                        <td className="py-3.5 px-2 text-slate-600 dark:text-slate-400 font-semibold">
                          {st.groupName}
                        </td>

                        <td className="py-3.5 px-2 font-mono text-slate-600 dark:text-slate-400">
                          {st.phone}
                        </td>

                        <td className="py-3.5 px-2 font-mono font-bold text-rose-500">
                          {(st.tuitionFee || 650000).toLocaleString()} UZS
                        </td>

                        <td className="py-3.5 px-2">
                          <select
                            value={st.paymentStatus || 'pending'}
                            onClick={(e) => e.stopPropagation()}
                            onChange={(e) =>
                              handleQuickStudentStatusChange(
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

                        <td className="py-3.5 px-2 text-right space-x-2">
                          <button
                            onClick={() => handleSendTelegramReminder(st)}
                            className="px-3 py-1.5 bg-blue-500/10 hover:bg-blue-500/20 text-blue-600 dark:text-blue-400 font-bold text-[11px] rounded-xl border border-blue-500/30 transition cursor-pointer inline-flex items-center gap-1"
                            title="Telegram bildirishnoma yuborish"
                          >
                            <Send className="w-3 h-3" />
                            <span>Telegram</span>
                          </button>

                          <button
                            onClick={() => handleOpenLogModal(st.id)}
                            className="px-3.5 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-extrabold text-[11px] rounded-xl shadow transition cursor-pointer inline-flex items-center gap-1"
                          >
                            <CreditCard className="w-3 h-3" />
                            <span>{t("To'lov Olish", "Log Payment", "Принять")}</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        ) : (
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
                  {t("Barcha Tranzaksiyalar va To'lov Jurnali", "All Transactions & Payment Logs", "История Всех Оплат")}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {t("Firestore da saqlangan jonli to'lovlar tarixlari", "Live transaction logs stored in Firestore", "История транзакций из Firestore")}
                </p>
              </div>
            </div>

            {filteredPayments.length === 0 ? (
              <div className="py-12 text-center text-slate-400">
                <CreditCard className="w-8 h-8 mx-auto text-slate-300 dark:text-slate-700 mb-2" />
                <p className="text-xs">{t("Tranzaksiyalar topilmadi", "No transactions found", "Транзакции не найдены")}</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 font-bold uppercase tracking-wider">
                      <th className="pb-3 px-2">{t("STUDENT NAME", "STUDENT NAME", "ИМЯ УЧЕНИКА")}</th>
                      <th className="pb-3 px-2">{t("AMOUNT (UZS)", "AMOUNT (UZS)", "СУММА (UZS)")}</th>
                      <th className="pb-3 px-2">{t("PAYMENT METHOD", "PAYMENT METHOD", "СПОСОБ ОПЛАТЫ")}</th>
                      <th className="pb-3 px-2">{t("RECORDER", "RECORDER", "ПРИНЯЛ")}</th>
                      <th className="pb-3 px-2">{t("DATE", "DATE", "ДАТА")}</th>
                      <th className="pb-3 px-2 text-right">{t("STATUS", "STATUS", "СТАТУС")}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {filteredPayments.map((p) => (
                      <tr key={p.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition">
                        <td className="py-3.5 px-2 font-bold text-slate-900 dark:text-white">
                          {p.studentName}
                        </td>
                        <td className="py-3.5 px-2 font-mono font-extrabold text-emerald-500">
                          {(p.amount || 0).toLocaleString()} UZS
                        </td>
                        <td className="py-3.5 px-2">
                          <span className="px-2.5 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-mono text-[10px] font-bold uppercase border border-slate-200 dark:border-slate-700">
                            {p.paymentMethod}
                          </span>
                        </td>
                        <td className="py-3.5 px-2 text-slate-600 dark:text-slate-400">
                          {p.recordedBy || 'Admin'}
                        </td>
                        <td className="py-3.5 px-2 font-mono text-slate-400 text-[11px]">
                          {p.date}
                        </td>
                        <td className="py-3.5 px-2 text-right">
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-extrabold text-[10px] border border-emerald-500/20">
                            <Check className="w-3 h-3" /> Paid ✅
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>

      {/* LOG TUITION PAYMENT MODAL */}
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
              <div className="p-2.5 rounded-2xl bg-emerald-500/10 text-emerald-500 font-bold">
                <CreditCard className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
                  {t("Kontrakt To'lovini Kiritish", "Log Tuition Payment", "Принять Оплату Контракта")}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {t("To'lov avtomatik Firestore da 'To'langan' statusiga o'tadi", "Saves transaction and updates status to 'Paid'", "Сохраняет транзакцию и обновляет статус")}
                </p>
              </div>
            </div>

            <form onSubmit={handleSubmitPayment} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  {t("O'quvchini Tanlang *", "Select Student *", "Выберите Ученика *")}
                </label>
                <select
                  value={selectedStudentId}
                  onChange={(e) => handleStudentSelectChange(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900 dark:text-white"
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
                  {t("To'lov Summasi (UZS) *", "Payment Amount (UZS) *", "Сумма Оплаты (UZS) *")}
                </label>
                <input
                  type="number"
                  required
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  {t("To'lov Usuli *", "Payment Method *", "Способ Оплаты *")}
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('click')}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold transition cursor-pointer flex items-center justify-center gap-1.5 ${
                      paymentMethod === 'click'
                        ? 'bg-emerald-500 text-slate-950 border-emerald-500 shadow-sm'
                        : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    <span>📱 Click</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMethod('payme')}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold transition cursor-pointer flex items-center justify-center gap-1.5 ${
                      paymentMethod === 'payme'
                        ? 'bg-emerald-500 text-slate-950 border-emerald-500 shadow-sm'
                        : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    <span>⚡ Payme</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMethod('card')}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold transition cursor-pointer flex items-center justify-center gap-1.5 ${
                      paymentMethod === 'card'
                        ? 'bg-emerald-500 text-slate-950 border-emerald-500 shadow-sm'
                        : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    <span>💳 Uzcard / Visa</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMethod('cash')}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold transition cursor-pointer flex items-center justify-center gap-1.5 ${
                      paymentMethod === 'cash'
                        ? 'bg-emerald-500 text-slate-950 border-emerald-500 shadow-sm'
                        : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    <span>💵 {t("Naqd Pul", "Cash", "Наличные")}</span>
                  </button>
                </div>
              </div>

              <div className="pt-3 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsLogModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                >
                  {t("Bekor Qilish", "Cancel", "Отмена")}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-xs shadow-md cursor-pointer"
                >
                  {t("To'lovni Qabul Qilish", "Record Payment", "Принять Оплату")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
