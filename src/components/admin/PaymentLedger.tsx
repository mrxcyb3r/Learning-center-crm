import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import dayjs from 'dayjs';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import {
  subscribeStudents,
  subscribePayments,
  recordPaymentAndSetPaid,
  updateStudentPaymentStatus,
  seedFirestoreIfEmpty
} from '../../services/firestore';
import { DEFAULT_MOCK_STUDENTS, DEFAULT_MOCK_PAYMENTS } from '../../data/mockData';
import { Student, Payment } from '../../types';
import { notificationService } from '../../services/notificationService';
import { FinanceOverviewCard } from '../FinanceOverviewCard';
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
  AlertCircle,
  Download,
  Printer,
  TrendingUp,
  Receipt,
  FileSpreadsheet,
  PieChart,
  RefreshCw,
  Plus,
  ArrowUpRight,
  ShieldCheck,
  Calendar,
  Layers,
  HelpCircle,
  QrCode
} from 'lucide-react';

export const PaymentLedger: React.FC = () => {
  const { currentUser, userProfile } = useAuth();
  const { language } = useLanguage();

  const t = (uz: string, en: string, ru: string) => {
    if (language === 'UZ') return uz;
    if (language === 'RU') return ru;
    return en;
  };

  const [activeTab, setActiveTab] = useState<'debtors' | 'all_payments' | 'subject_analytics'>('debtors');
  const [students, setStudents] = useState<Student[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGateway, setSelectedGateway] = useState<string>('all');
  const [selectedSubject, setSelectedSubject] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedPeriod, setSelectedPeriod] = useState<string>('all');

  // Revenue Target Goal (UZS)
  const [monthlyTargetGoal, setMonthlyTargetGoal] = useState<number>(50000000);
  const [isEditingGoal, setIsEditingGoal] = useState<boolean>(false);

  // Log Payment Modal State
  const [isLogModalOpen, setIsLogModalOpen] = useState(false);
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [amount, setAmount] = useState('650000');
  const [paymentMethod, setPaymentMethod] = useState<'click' | 'payme' | 'cash' | 'card'>('click');
  const [paymentPeriod, setPaymentPeriod] = useState('August 2026');
  const [receiptRef, setReceiptRef] = useState(`PAY-${Date.now().toString().slice(-6)}`);
  const [paymentNotes, setPaymentNotes] = useState('');
  const [sendTelegramNotice, setSendTelegramNotice] = useState(true);

  // Receipt Modal State
  const [activeReceipt, setActiveReceipt] = useState<Payment | null>(null);

  // Toast Notice State
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    toast.info(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  useEffect(() => {
    let isMounted = true;
    seedFirestoreIfEmpty();

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
    setReceiptRef(`PAY-${Date.now().toString().slice(-6)}`);
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
      showToast(t("Iltimos, o'quvchini tanlang!", "Please select a student!", "Выберите ученика!"));
      return;
    }

    const matchedStudent = students.find((s) => s.id === selectedStudentId);
    const studentName = matchedStudent ? matchedStudent.fullName : 'Student';
    const cohortGroup = matchedStudent ? matchedStudent.groupName : 'Main Cohort';
    const subjectCategory = matchedStudent?.subjectCategory || (matchedStudent?.groupName?.toLowerCase().includes('ielts') ? 'IELTS' : 'General');
    const recorderName = userProfile?.displayName || currentUser?.displayName || 'Branch Admin';

    try {
      await recordPaymentAndSetPaid(
        selectedStudentId,
        studentName,
        Number(amount) || 650000,
        paymentMethod,
        recorderName,
        {
          cohortGroup,
          subjectCategory,
          paymentPeriod,
          receiptRef,
          notes: paymentNotes
        }
      );

      if (sendTelegramNotice) {
        showToast(
          t(
            `📱 ${studentName} uchun ${Number(amount).toLocaleString()} UZS to'lovi qabul qilindi va Telegram kvitansiya yuborildi! ✅`,
            `📱 Payment logged for ${studentName}! Telegram receipt dispatched to parent account. ✅`,
            `📱 Оплата принята для ${studentName}! Квитанция отправлена в Telegram. ✅`
          )
        );
      } else {
        showToast(
          t(
            `To'lov qabul qilindi: ${studentName} (${Number(amount).toLocaleString()} UZS) ✅`,
            `Payment recorded for ${studentName} (${Number(amount).toLocaleString()} UZS) ✅`,
            `Оплата принята для ${studentName} (${Number(amount).toLocaleString()} UZS) ✅`
          )
        );
      }

      notificationService.onPaymentRecorded(studentName, Number(amount) || 650000, recorderName);
      setIsLogModalOpen(false);
      setPaymentNotes('');
    } catch (err) {
      console.error(err);
      showToast(t("To'lovni saqlashda xatolik yuz berdi!", "Failed to log payment.", "Ошибка при сохранении оплаты."));
    }
  };

  const handleSendTelegramReminder = (student: Student) => {
    const feeFormatted = (student.tuitionFee || 650000).toLocaleString();
    const msg = t(
      `📱 Telegram Ogohlantirish: ${student.fullName} (${student.phone}) ning kontrakt to'lovi (${feeFormatted} UZS) bo'yicha Telegram bot orqali bildirishnoma yuborildi!`,
      `📱 Telegram Alert: Payment notice of ${feeFormatted} UZS dispatched to ${student.fullName}'s parent Telegram account!`,
      `📱 Telegram Уведомление: Напоминание об оплате ${feeFormatted} UZS отправлено родителям ${student.fullName}!`
    );
    showToast(msg);
  };

  const handleSendAllOverdueReminders = () => {
    const debtorsCount = debtors.length;
    if (debtorsCount === 0) {
      showToast(t("Qarzdor o'quvchilar yo'q! 🎉", "No overdue debtors to remind! 🎉", "Нет задолженностей! 🎉"));
      return;
    }
    showToast(
      t(
        `📱 ${debtorsCount} ta qarzdor o'quvchining ota-onasiga Telegram orqali avtomatik to'lov eslatmalari yuborildi! ✅`,
        `📱 Automated Telegram payment reminders sent to ${debtorsCount} debtor accounts! ✅`,
        `📱 Автоматические напоминания отправлены ${debtorsCount} должникам! ✅`
      )
    );
  };

  const handleQuickStudentStatusChange = async (
    studentId: string,
    newStatus: 'paid' | 'pending' | 'overdue',
    e: React.ChangeEvent<HTMLSelectElement>
  ) => {
    e.stopPropagation();
    const prevStudents = [...students];
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
      setStudents(prevStudents);
      showToast(t('Statusni yangilashda xatolik!', 'Failed to update status.', 'Ошибка при обновлении статуса.'));
    }
  };

  // Metrics Calculations
  const totalRevenue = payments.reduce((acc, p) => acc + (p.amount || 0), 0);
  const debtors = students.filter((s) => s.paymentStatus === 'pending' || s.paymentStatus === 'overdue');
  const overdueCount = students.filter((s) => s.paymentStatus === 'overdue').length;
  const totalDebtAmount = debtors.reduce((acc, s) => acc + (s.tuitionFee || 650000), 0);
  const goalProgress = Math.min(100, Math.round((totalRevenue / monthlyTargetGoal) * 100));

  // Gateways Revenue Breakdown
  const clickRevenue = payments.filter((p) => p.paymentMethod?.toLowerCase() === 'click').reduce((acc, p) => acc + (p.amount || 0), 0);
  const paymeRevenue = payments.filter((p) => p.paymentMethod?.toLowerCase() === 'payme').reduce((acc, p) => acc + (p.amount || 0), 0);
  const cardRevenue = payments.filter((p) => p.paymentMethod?.toLowerCase() === 'card' || p.paymentMethod?.toLowerCase() === 'bank card').reduce((acc, p) => acc + (p.amount || 0), 0);
  const cashRevenue = payments.filter((p) => p.paymentMethod?.toLowerCase() === 'cash').reduce((acc, p) => acc + (p.amount || 0), 0);

  // Filtered Debtors
  const filteredDebtors = debtors.filter((s) => {
    const matchesSearch =
      s.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.phone.includes(searchQuery) ||
      s.groupName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (s.telegramHandle && s.telegramHandle.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesStatus = selectedStatus === 'all' || s.paymentStatus === selectedStatus;
    const matchesSubject =
      selectedSubject === 'all' ||
      (s.groupName && s.groupName.toLowerCase().includes(selectedSubject.toLowerCase())) ||
      (s.subjectCategory && s.subjectCategory.toLowerCase().includes(selectedSubject.toLowerCase()));

    return matchesSearch && matchesStatus && matchesSubject;
  });

  // Filtered Payments
  const filteredPayments = payments.filter((p) => {
    const matchesSearch =
      p.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.paymentMethod.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.receiptRef && p.receiptRef.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (p.cohortGroup && p.cohortGroup.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesGateway = selectedGateway === 'all' || p.paymentMethod?.toLowerCase().includes(selectedGateway.toLowerCase());
    const matchesSubject =
      selectedSubject === 'all' ||
      (p.cohortGroup && p.cohortGroup.toLowerCase().includes(selectedSubject.toLowerCase())) ||
      (p.subjectCategory && p.subjectCategory.toLowerCase().includes(selectedSubject.toLowerCase()));
    const matchesPeriod = selectedPeriod === 'all' || p.paymentPeriod === selectedPeriod || p.date.includes(selectedPeriod);

    return matchesSearch && matchesGateway && matchesSubject && matchesPeriod;
  });

  return (
    <div className="space-y-6">
      {/* Toast Alert Banner */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 px-4 py-3 rounded-2xl bg-slate-900 text-white shadow-2xl border border-amber-500/40 text-xs font-bold flex items-center gap-2 animate-bounce">
          <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="p-6 rounded-3xl bg-slate-900 text-white border border-slate-800 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 relative overflow-hidden">
        <img
          src="https://i.ibb.co/rR6PYx2b/image.png"
          alt="Ledger Banner"
          className="absolute inset-0 w-full h-full object-cover opacity-20 pointer-events-none"
        />
        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-bold border border-emerald-500/30 mb-2">
            <CreditCard className="w-3.5 h-3.5" />
            <span>CenterFlow Tuition & Financial Ledger</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
            {t("Kontrakt & Moliya Jurnali", "Tuition & Financial Ledger", "Финансовый Учет и Контракты")}
          </h1>
          <p className="text-xs text-slate-400 mt-1 max-w-xl">
            {t(
              "Filialning oylik kontrakt to'lovlarini ro'yxatga olish, Click/Payme/Kassa tushumlarini kuzatish va qarzdor o'quvchilarga Telegram eslatmalar yuborish paneli.",
              "Track learning center tuition contracts, payment gateways (Click, Payme, Cash, Cards), and automated Telegram notifications for all subjects.",
              "Учет оплаты контрактов, филиальных платежей и автоматических уведомлений в Telegram."
            )}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 relative z-10 shrink-0">
          <button
            type="button"
            onClick={handleSendAllOverdueReminders}
            className="px-4 py-2.5 rounded-2xl bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 border border-blue-500/40 font-bold text-xs transition cursor-pointer flex items-center gap-1.5"
          >
            <Send className="w-4 h-4 text-blue-400" />
            <span>{t("Barcha Qarzdorlarga Telegram 📱", "Telegram Reminders All 📱", "Напомнить Всем 📱")}</span>
          </button>

          <button
            type="button"
            onClick={() => handleOpenLogModal()}
            className="px-5 py-2.5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs shadow-lg shadow-emerald-500/20 transition cursor-pointer flex items-center gap-2"
          >
            <CreditCard className="w-4 h-4" />
            <span>{t("To'lov Qabul Qilish", "Log Tuition Payment", "Принять Оплату")}</span>
          </button>
        </div>
      </div>

      {/* Financial Overview Hero Panel with Asset */}
      <FinanceOverviewCard
        monthlyRevenue={`${(totalRevenue + totalDebtAmount).toLocaleString()} UZS`}
        totalCollected={`${totalRevenue.toLocaleString()} UZS`}
        pendingTuitions={`${totalDebtAmount.toLocaleString()} UZS`}
        overdueCount={overdueCount}
        onExportReport={() => {
          toast.info(t("Moliyaviy hisobot eksport qilindi!", "Financial report exported!", "Финансовый отчет экспортирован!"));
        }}
      />

      {/* Financial Overview Metrics Dashboard */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Total Revenue Collected */}
        <div className="p-5 rounded-3xl bg-white/80 dark:bg-slate-900/50 backdrop-blur-md border border-slate-200/80 dark:border-slate-800/60 shadow-sm dark:shadow-xl space-y-2 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-slate-500 dark:text-slate-400 font-extrabold uppercase tracking-wider">
              {t("Jami Qabul Qilingan Tushum", "Total Monthly Revenue", "Принятый Доход")}
            </span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-emerald-500 font-mono">
            {totalRevenue.toLocaleString()} UZS
          </p>
          <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 pt-1 border-t border-slate-100 dark:border-slate-800">
            <span>{payments.length} {t("ta tranzaksiya", "transactions", "транзакций")}</span>
            <span className="text-emerald-500 font-bold flex items-center gap-0.5">
              <ArrowUpRight className="w-3 h-3" /> +12% MoM
            </span>
          </div>
        </div>

        {/* Metric 2: Total Pending Balances */}
        <div className="p-5 rounded-3xl bg-white/80 dark:bg-slate-900/50 backdrop-blur-md border border-slate-200/80 dark:border-slate-800/60 shadow-sm dark:shadow-xl space-y-2 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-slate-500 dark:text-slate-400 font-extrabold uppercase tracking-wider">
              {t("Qarzdorlik Summasi", "Pending Unpaid Balances", "Общая Задолженность")}
            </span>
            <div className="p-2 rounded-xl bg-rose-500/10 text-rose-500 border border-rose-500/20">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-rose-500 font-mono">
            {totalDebtAmount.toLocaleString()} UZS
          </p>
          <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 pt-1 border-t border-slate-100 dark:border-slate-800">
            <span>{debtors.length} {t("ta o'quvchi hisobida", "debtor accounts", "должников")}</span>
            <span className="text-rose-500 font-bold">{overdueCount} {t("muddati o'tgan", "overdue", "просрочено")}</span>
          </div>
        </div>

        {/* Metric 3: Overdue Accounts Count */}
        <div className="p-5 rounded-3xl bg-white/80 dark:bg-slate-900/50 backdrop-blur-md border border-slate-200/80 dark:border-slate-800/60 shadow-sm dark:shadow-xl space-y-2 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-slate-500 dark:text-slate-400 font-extrabold uppercase tracking-wider">
              {t("Muddati O'tgan Hisoblar", "Overdue Accounts Count", "Просроченные Счета")}
            </span>
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-500 border border-amber-500/20">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-amber-500 font-mono">
            {overdueCount} <span className="text-xs font-normal text-slate-400">/ {students.length} students</span>
          </p>
          <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 pt-1 border-t border-slate-100 dark:border-slate-800">
            <span>{students.length > 0 ? Math.round(((students.length - debtors.length) / students.length) * 100) : 100}% {t("to'lov intizomi", "paid compliance", "оплачено")}</span>
            <span className="text-emerald-500 font-bold flex items-center gap-0.5">
              <CheckCircle2 className="w-3 h-3" /> Healthy
            </span>
          </div>
        </div>

        {/* Metric 4: Monthly Revenue Target Progress */}
        <div className="p-5 rounded-3xl bg-white/80 dark:bg-slate-900/50 backdrop-blur-md border border-slate-200/80 dark:border-slate-800/60 shadow-sm dark:shadow-xl space-y-2 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-slate-500 dark:text-slate-400 font-extrabold uppercase tracking-wider">
              {t("Oylik Reja Bajarilishi", "Monthly Goal Progress", "Выполнение Плана")}
            </span>
            <button
              type="button"
              onClick={() => setIsEditingGoal(!isEditingGoal)}
              className="p-1 rounded bg-slate-100 dark:bg-slate-800 text-[10px] font-bold text-slate-500 hover:text-amber-500 cursor-pointer"
            >
              {isEditingGoal ? "Save" : "Edit Goal"}
            </button>
          </div>

          <div className="flex items-baseline justify-between">
            <p className="text-2xl font-black text-slate-900 dark:text-white font-mono">
              {goalProgress}%
            </p>
            <span className="text-xs font-bold text-slate-400">
              Goal: {(monthlyTargetGoal / 1000000).toFixed(0)}M UZS
            </span>
          </div>

          {isEditingGoal ? (
            <input
              type="number"
              value={monthlyTargetGoal}
              onChange={(e) => setMonthlyTargetGoal(Number(e.target.value) || 50000000)}
              className="w-full p-1 text-xs rounded bg-slate-100 dark:bg-slate-800 border border-amber-500 text-slate-900 dark:text-white font-mono"
            />
          ) : (
            <div className="w-full bg-slate-200 dark:bg-slate-800 rounded-full h-2 overflow-hidden">
              <div
                className="bg-amber-500 h-full rounded-full transition-all duration-500"
                style={{ width: `${goalProgress}%` }}
              />
            </div>
          )}
        </div>
      </div>

      {/* Payment Gateway Breakdown Bar */}
      <div className="p-4 rounded-3xl bg-white/80 dark:bg-slate-900/50 backdrop-blur-md border border-slate-200/80 dark:border-slate-800/60 shadow-sm dark:shadow-xl flex flex-wrap items-center justify-between gap-3">
        <span className="text-xs font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
          <PieChart className="w-4 h-4 text-emerald-500" />
          <span>{t("To'lov Tizimlari Tushumi", "Gateway Revenue Breakdown", "Поступления по Способам Оплаты")}:</span>
        </span>

        <div className="flex flex-wrap items-center gap-2 text-xs">
          <div className="px-3 py-1.5 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-600 dark:text-blue-400 font-bold flex items-center gap-1.5">
            <span>📱 Click:</span>
            <span className="font-mono text-slate-900 dark:text-white">{clickRevenue.toLocaleString()} UZS</span>
          </div>

          <div className="px-3 py-1.5 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-600 dark:text-cyan-400 font-bold flex items-center gap-1.5">
            <span>⚡ Payme:</span>
            <span className="font-mono text-slate-900 dark:text-white">{paymeRevenue.toLocaleString()} UZS</span>
          </div>

          <div className="px-3 py-1.5 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-600 dark:text-purple-400 font-bold flex items-center gap-1.5">
            <span>💳 Bank Card:</span>
            <span className="font-mono text-slate-900 dark:text-white">{cardRevenue.toLocaleString()} UZS</span>
          </div>

          <div className="px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1.5">
            <span>💵 Cash / Kassa:</span>
            <span className="font-mono text-slate-900 dark:text-white">{cashRevenue.toLocaleString()} UZS</span>
          </div>
        </div>
      </div>

      {/* Navigation Tabs & Advanced Filter Toolbar */}
      <div className="bg-white/80 dark:bg-slate-900/50 backdrop-blur-md border border-slate-200/80 dark:border-slate-800/60 rounded-3xl p-4 shadow-sm dark:shadow-xl space-y-3">
        <div className="flex flex-col md:flex-row items-center justify-between gap-3">
          {/* Main Navigation Tabs */}
          <div className="flex items-center gap-2 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-2xl w-full md:w-auto overflow-x-auto">
            <button
              onClick={() => setActiveTab('debtors')}
              className={`px-4 py-2 rounded-xl text-xs font-extrabold transition cursor-pointer flex items-center gap-1.5 shrink-0 ${
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
              className={`px-4 py-2 rounded-xl text-xs font-extrabold transition cursor-pointer flex items-center gap-1.5 shrink-0 ${
                activeTab === 'all_payments'
                  ? 'bg-emerald-500 text-slate-950 shadow-md'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <CreditCard className="w-3.5 h-3.5" />
              <span>{t("Barcha To'lov Jurnali", "All Financial Logs", "Все Транзакции")}</span>
              <span className="px-1.5 py-0.5 rounded-full bg-slate-950/10 text-[10px] font-mono">
                {payments.length}
              </span>
            </button>
          </div>

          {/* Search Input */}
          <div className="relative w-full md:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t("O'quvchi ismi, tel, Telegram...", "Search name, phone, Telegram...", "Поиск...")}
              className="w-full pl-10 pr-4 py-2 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>
        </div>

        {/* Filter Dropdowns */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
          {/* Gateway Filter */}
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
              {t("To'lov Usuli", "Payment Gateway", "Способ Оплаты")}
            </label>
            <select
              value={selectedGateway}
              onChange={(e) => setSelectedGateway(e.target.value)}
              className="w-full px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold text-slate-900 dark:text-white text-xs focus:outline-none focus:ring-1 focus:ring-amber-500"
            >
              <option value="all">All Gateways</option>
              <option value="click">Click</option>
              <option value="payme">Payme</option>
              <option value="card">Bank Card</option>
              <option value="cash">Cash / Kassa</option>
            </select>
          </div>

          {/* Subject Filter */}
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
              {t("Fan Yo'nalishi", "Subject Track", "Предмет")}
            </label>
            <select
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
              className="w-full px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold text-slate-900 dark:text-white text-xs focus:outline-none focus:ring-1 focus:ring-amber-500"
            >
              <option value="all">Barcha kurslar</option>
              <option value="dtm">DTM & Milliy Sertifikat</option>
              <option value="math">Matematika & Fizika</option>
              <option value="cefr">CEFR Ingliz Tili (B2 / C1)</option>
              <option value="kids">English Kids (3–10 yosh)</option>
              <option value="mental">Mental Arifmetika</option>
              <option value="onatili">Ona Tili va Adabiyot</option>
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
              {t("To'lov Statusi", "Tuition Status", "Статус")}
            </label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold text-slate-900 dark:text-white text-xs focus:outline-none focus:ring-1 focus:ring-amber-500"
            >
              <option value="all">All Statuses</option>
              <option value="paid">Paid ✅</option>
              <option value="pending">Pending ⏳</option>
              <option value="overdue">Overdue ⚠️</option>
            </select>
          </div>

          {/* Period Filter */}
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
              {t("Oylik Davr", "Payment Period", "Период")}
            </label>
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              className="w-full px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold text-slate-900 dark:text-white text-xs focus:outline-none focus:ring-1 focus:ring-amber-500"
            >
              <option value="all">All Months</option>
              <option value="August 2026">August 2026</option>
              <option value="July 2026">July 2026</option>
              <option value="June 2026">June 2026</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Table Content Panel */}
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
                  {t("Oylik kontrakt to'lovi to'lanmagan o'quvchilar ro'yxati va Telegram eslatmalar paneli", "Active student accounts with pending tuition fees needing resolution", "Ученики с неоплченным контрактом")}
                </p>
              </div>
            </div>

            {isLoading ? (
              <div className="py-12 text-center text-slate-400">
                <Loader2 className="w-6 h-6 animate-spin mx-auto text-amber-500 mb-2" />
                <p className="text-xs">{t("Qarzdorlar yuklanmoqda...", "Loading debtors...", "Загрузка...")}</p>
              </div>
            ) : filteredDebtors.length === 0 ? (
              <div className="py-12 text-center text-slate-400 space-y-2">
                <CheckCircle2 className="w-8 h-8 mx-auto text-emerald-500" />
                <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  {t("Ajoyib! Barcha o'quvchilar kontrakt to'lovini to'liq to'lagan! 🎉", "Great! No active debtor accounts found for current filter! 🎉", "Все контракты успешно оплачены! 🎉")}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 font-bold uppercase tracking-wider">
                      <th className="pb-3 px-2">{t("STUDENT NAME", "STUDENT NAME", "ИМЯ УЧЕНИКА")}</th>
                      <th className="pb-3 px-2">{t("COHORT / SUBJECT", "COHORT / SUBJECT", "ГРУППА / ПРЕДМЕТ")}</th>
                      <th className="pb-3 px-2">{t("PHONE / TELEGRAM", "PHONE / TELEGRAM", "ТЕЛЕФОН")}</th>
                      <th className="pb-3 px-2">{t("MONTHLY FEE", "MONTHLY FEE", "КОНТРАКТ")}</th>
                      <th className="pb-3 px-2">{t("STATUS", "STATUS", "СТАТУС")}</th>
                      <th className="pb-3 px-2 text-right">{t("ACTIONS", "ACTIONS", "ДЕЙСТВИЯ")}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {filteredDebtors.map((st) => (
                      <tr key={st.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition">
                        <td className="py-3.5 px-2 font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-rose-500/10 text-rose-500 font-black flex items-center justify-center shrink-0">
                            {st.fullName.charAt(0)}
                          </div>
                          <div>
                            <span className="block">{st.fullName}</span>
                            <span className="text-[10px] text-slate-400 font-mono">ID: {st.id.slice(0, 6)}</span>
                          </div>
                        </td>

                        <td className="py-3.5 px-2 text-slate-600 dark:text-slate-400 font-semibold">
                          <span className="block text-slate-900 dark:text-white font-bold">{st.groupName}</span>
                          <span className="text-[10px] text-amber-500 font-bold uppercase">{st.subjectCategory || 'General'}</span>
                        </td>

                        <td className="py-3.5 px-2 font-mono text-slate-600 dark:text-slate-400">
                          <span className="block">{st.phone}</span>
                          <span className="text-[10px] text-blue-500">{st.telegramHandle || `@student_${st.id.slice(0, 4)}`}</span>
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
                            type="button"
                            onClick={() => handleSendTelegramReminder(st)}
                            className="px-3 py-1.5 bg-blue-500/10 hover:bg-blue-500/20 text-blue-600 dark:text-blue-400 font-bold text-[11px] rounded-xl border border-blue-500/30 transition cursor-pointer inline-flex items-center gap-1"
                            title="Send Telegram Payment Alert"
                          >
                            <Send className="w-3 h-3" />
                            <span>Telegram</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleOpenLogModal(st.id)}
                            className="px-3.5 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-[11px] rounded-xl shadow transition cursor-pointer inline-flex items-center gap-1"
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
                  {t("Barcha Tranzaksiyalar va Moliya Jurnali", "All Financial Transactions & Payment Logs", "История Всех Оплат")}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {t("Firestore bazasida saqlangan jonli to'lovlar tarixlari va kvitansiyalar", "Live transaction logs stored securely in Firestore database", "История транзакций из Firestore")}
                </p>
              </div>
            </div>

            {filteredPayments.length === 0 ? (
              <div className="py-12 text-center text-slate-400">
                <CreditCard className="w-8 h-8 mx-auto text-slate-300 dark:text-slate-700 mb-2" />
                <p className="text-xs">{t("Tranzaksiyalar topilmadi", "No transactions found matching filter", "Транзакции не найдены")}</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 font-bold uppercase tracking-wider">
                      <th className="pb-3 px-2">{t("RECEIPT REF / STUDENT", "RECEIPT REF / STUDENT", "КВИТАНЦИЯ / УЧЕНИК")}</th>
                      <th className="pb-3 px-2">{t("COHORT / SUBJECT", "COHORT / SUBJECT", "ГРУППА / ПРЕДМЕТ")}</th>
                      <th className="pb-3 px-2">{t("AMOUNT (UZS)", "AMOUNT (UZS)", "СУММА (UZS)")}</th>
                      <th className="pb-3 px-2">{t("GATEWAY", "GATEWAY", "СПОСОБ")}</th>
                      <th className="pb-3 px-2">{t("PERIOD / DATE", "PERIOD / DATE", "ПЕРИОД / ДАТА")}</th>
                      <th className="pb-3 px-2">{t("ADMIN", "ADMIN", "ПРИНЯЛ")}</th>
                      <th className="pb-3 px-2 text-right">{t("RECEIPT", "RECEIPT", "КВИТАНЦИЯ")}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {filteredPayments.map((p) => (
                      <tr key={p.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition">
                        <td className="py-3.5 px-2 font-bold text-slate-900 dark:text-white">
                          <span className="block font-mono text-[11px] text-amber-500 font-extrabold">{p.receiptRef || `PAY-${p.id.slice(0, 6)}`}</span>
                          <span className="text-xs font-bold">{p.studentName}</span>
                        </td>

                        <td className="py-3.5 px-2 text-slate-600 dark:text-slate-400">
                          <span className="block font-semibold text-slate-900 dark:text-white">{p.cohortGroup || 'Main Cohort'}</span>
                          <span className="text-[10px] text-slate-400 font-bold uppercase">{p.subjectCategory || 'General'}</span>
                        </td>

                        <td className="py-3.5 px-2 font-mono font-extrabold text-emerald-500 text-sm">
                          {(p.amount || 0).toLocaleString()} UZS
                        </td>

                        <td className="py-3.5 px-2">
                          <span className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-mono text-[10px] font-bold uppercase border border-slate-200 dark:border-slate-700">
                            {p.paymentMethod}
                          </span>
                        </td>

                        <td className="py-3.5 px-2">
                          <span className="block font-bold text-slate-700 dark:text-slate-300 text-[11px]">{p.paymentPeriod || 'August 2026'}</span>
                          <span className="text-[10px] font-mono text-slate-400">{p.date}</span>
                        </td>

                        <td className="py-3.5 px-2 text-slate-600 dark:text-slate-400 text-xs">
                          {p.recordedBy || 'Admin'}
                        </td>

                        <td className="py-3.5 px-2 text-right">
                          <button
                            type="button"
                            onClick={() => setActiveReceipt(p)}
                            className="px-3 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 font-bold text-[11px] border border-amber-500/30 transition cursor-pointer inline-flex items-center gap-1"
                          >
                            <Receipt className="w-3.5 h-3.5" />
                            <span>Receipt</span>
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
      </div>

      {/* RECORD NEW PAYMENT MODAL */}
      {isLogModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md animate-fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-lg rounded-3xl p-6 shadow-2xl relative">
            <button
              onClick={() => setIsLogModalOpen(false)}
              className="absolute top-4 right-4 p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-5">
              <div className="p-3 rounded-2xl bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                <CreditCard className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-extrabold text-lg text-slate-900 dark:text-white">
                  {t("Kontrakt To'lovini Kiritish", "Log Tuition Payment", "Принять Оплату Контракта")}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {t("To'lov avtomatik Firestore da saqlanadi va o'quvchi statusi 'Paid ✅' ga o'tadi", "Saves transaction, updates student tuition status to 'Paid', and notifies parent", "Сохраняет транзакцию и обновляет статус")}
                </p>
              </div>
            </div>

            <form onSubmit={handleSubmitPayment} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  {t("O'quvchi va Guruhni Tanlang *", "Select Student & Cohort *", "Выберите Ученика *")}
                </label>
                <select
                  value={selectedStudentId}
                  onChange={(e) => handleStudentSelectChange(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900 dark:text-white"
                >
                  {students.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.fullName} ({s.groupName}) - Contract: {(s.tuitionFee || 650000).toLocaleString()} UZS
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    {t("To'lov Summasi (UZS) *", "Payment Amount (UZS) *", "Сумма (UZS) *")}
                  </label>
                  <input
                    type="number"
                    required
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    {t("Oylik Davr / Month *", "Payment Period *", "Период *")}
                  </label>
                  <select
                    value={paymentPeriod}
                    onChange={(e) => setPaymentPeriod(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="August 2026">August 2026</option>
                    <option value="September 2026">September 2026</option>
                    <option value="October 2026">October 2026</option>
                    <option value="July 2026">July 2026</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  {t("To'lov Gateway / Usuli *", "Payment Gateway *", "Способ Оплаты *")}
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
                    <span>📱 Click App</span>
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
                    <span>⚡ Payme Gateway</span>
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
                    <span>💵 Naqd Pul / Kassa</span>
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  {t("Kvitansiya Ref kodi", "Receipt Ref ID", "ID Квитанции")}
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={receiptRef}
                    onChange={(e) => setReceiptRef(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-mono font-bold text-slate-900 dark:text-white"
                  />
                  <button
                    type="button"
                    onClick={() => setReceiptRef(`PAY-${Date.now().toString().slice(-6)}`)}
                    className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 cursor-pointer"
                  >
                    <RefreshCw className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  {t("Qo'shimcha Izoh / Notes", "Receipt Notes & Remarks", "Заметки")}
                </label>
                <input
                  type="text"
                  value={paymentNotes}
                  onChange={(e) => setPaymentNotes(e.target.value)}
                  placeholder="e.g. Paid via Click mobile application"
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white"
                />
              </div>

              <div className="flex items-center gap-2 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-slate-900 dark:text-white">
                <input
                  type="checkbox"
                  id="telegramCheck"
                  checked={sendTelegramNotice}
                  onChange={(e) => setSendTelegramNotice(e.target.checked)}
                  className="w-4 h-4 rounded text-amber-500 focus:ring-amber-500 cursor-pointer"
                />
                <label htmlFor="telegramCheck" className="font-bold cursor-pointer">
                  {t("Ota-onaning Telegram hisobiga kvitansiya xabari yuborilsin", "Send Telegram digital receipt to student/parent", "Отправить квитанцию в Telegram")}
                </label>
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsLogModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                >
                  {t("Bekor Qilish", "Cancel", "Отмена")}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-xs shadow-md cursor-pointer"
                >
                  {t("To'lovni Tasdiqlash", "Record Payment", "Подтвердить Оплату")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DIGITAL RECEIPT VIEW MODAL */}
      {activeReceipt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
          <div className="bg-white text-slate-950 border border-slate-300 w-full max-w-md rounded-3xl p-6 shadow-2xl relative space-y-5">
            <button
              onClick={() => setActiveReceipt(null)}
              className="absolute top-4 right-4 p-1.5 rounded-xl text-slate-400 hover:text-slate-800 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Receipt Header */}
            <div className="text-center border-b border-dashed border-slate-300 pb-4">
              <div className="w-12 h-12 rounded-2xl bg-amber-500 text-slate-950 font-black flex items-center justify-center mx-auto mb-2 shadow-md">
                <ShieldCheck className="w-7 h-7" />
              </div>
              <h3 className="font-black text-lg tracking-tight uppercase">CenterFlow Learning Center</h3>
              <p className="text-[11px] text-slate-500 font-medium">Renessans LC Branch Official Payment Receipt</p>
              <span className="inline-block mt-2 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 font-mono text-xs font-bold">
                REF: {activeReceipt.receiptRef || `PAY-${activeReceipt.id.slice(0, 6)}`}
              </span>
            </div>

            {/* Receipt Details */}
            <div className="space-y-2.5 text-xs font-semibold">
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Student Name:</span>
                <span className="font-bold text-slate-900">{activeReceipt.studentName}</span>
              </div>

              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Cohort / Subject:</span>
                <span className="font-bold text-slate-900">{activeReceipt.cohortGroup || 'Main Group'} ({activeReceipt.subjectCategory || 'General'})</span>
              </div>

              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Payment Period:</span>
                <span className="font-bold text-slate-900">{activeReceipt.paymentPeriod || 'August 2026'}</span>
              </div>

              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Gateway Method:</span>
                <span className="font-mono font-bold uppercase text-blue-600">{activeReceipt.paymentMethod}</span>
              </div>

              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Recorded Date:</span>
                <span className="font-mono text-slate-700">{activeReceipt.date}</span>
              </div>

              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Issued By Admin:</span>
                <span className="text-slate-900">{activeReceipt.recordedBy || 'Branch Cashier'}</span>
              </div>

              <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-between mt-3">
                <span className="font-black text-emerald-900 text-xs">TOTAL PAID (UZS):</span>
                <span className="font-mono font-black text-emerald-700 text-lg">
                  {(activeReceipt.amount || 0).toLocaleString()} UZS
                </span>
              </div>
            </div>

            {/* Receipt Stamp & QR Code */}
            <div className="flex items-center justify-between pt-2 border-t border-dashed border-slate-300 text-[10px] text-slate-500">
              <div className="flex items-center gap-2">
                <QrCode className="w-10 h-10 text-slate-800 shrink-0" />
                <div>
                  <p className="font-bold text-slate-800">Verified Digital Receipt</p>
                  <p>CenterFlow Firestore Auth Verified</p>
                </div>
              </div>
              <div className="text-right">
                <span className="px-2 py-0.5 rounded bg-emerald-600 text-white font-bold uppercase">PAID ✅</span>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => window.print()}
                className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center justify-center gap-2 cursor-pointer shadow"
              >
                <Printer className="w-4 h-4" />
                <span>Print Official Receipt</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
