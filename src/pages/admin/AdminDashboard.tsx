import React, { useState, useEffect } from 'react';
import { useAuth, SUPER_ADMIN_UUID } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import {
  subscribeStudents,
  subscribeGroups,
  subscribePayments,
  updatePaymentStatus,
  seedFirestoreIfEmpty
} from '../../services/firestore';
import { DEFAULT_MOCK_STUDENTS, DEFAULT_MOCK_GROUPS, DEFAULT_MOCK_PAYMENTS } from '../../data/mockData';
import { Student, Group, Payment } from '../../types';
import {
  ShieldAlert,
  GraduationCap,
  Users,
  BookOpen,
  DollarSign,
  Clock,
  Sparkles,
  FileText,
  AlertCircle,
  Key,
  CreditCard,
  Newspaper,
  Check,
  XCircle,
  TrendingUp,
  RefreshCw,
  Send
} from 'lucide-react';

interface AdminDashboardProps {
  onNavigate?: (tab: string) => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ onNavigate }) => {
  const { currentUser, userProfile, activeRole } = useAuth();
  const { language } = useLanguage();
  const t = (uz: string, en: string, ru: string) => {
    if (language === 'UZ') return uz;
    if (language === 'RU') return ru;
    return en;
  };

  const displayName = userProfile?.displayName || currentUser?.displayName || 'Admin';

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Live Firestore State
  const [students, setStudents] = useState<Student[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);

  useEffect(() => {
    seedFirestoreIfEmpty();

    const unsubStudents = subscribeStudents((data) => {
      setStudents(data.length > 0 ? data : DEFAULT_MOCK_STUDENTS);
    });

    const unsubGroups = subscribeGroups((data) => {
      setGroups(data.length > 0 ? data : DEFAULT_MOCK_GROUPS);
    });

    const unsubPayments = subscribePayments((data) => {
      setPayments(data.length > 0 ? data : DEFAULT_MOCK_PAYMENTS);
    });

    return () => {
      unsubStudents();
      unsubGroups();
      unsubPayments();
    };
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Real-time KPI Calculations
  const totalRevenue = payments.reduce((acc, p) => acc + (p.amount || 0), 0);
  const debtorCount = students.filter((s) => s.paymentStatus === 'pending' || s.paymentStatus === 'overdue').length;

  const handleStatusChange = async (paymentId: string, newStatus: 'paid' | 'pending' | 'refunded') => {
    try {
      await updatePaymentStatus(paymentId, newStatus);
      showToast(t(`To'lov statusi '${newStatus}' ga yangilandi ✅`, `Payment status updated to '${newStatus}' ✅`, `Статус оплаты обновлен на '${newStatus}' ✅`));
    } catch (err) {
      console.error(err);
      showToast(t("Statusni yangilashda xatolik!", "Failed to update payment status.", "Ошибка при обновлении статуса."));
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

      {/* SuperAdmin Verified Banner */}
      {currentUser?.uid === SUPER_ADMIN_UUID && (
        <div className="p-4 rounded-3xl bg-gradient-to-r from-amber-500/20 via-rose-500/10 to-purple-500/20 border border-amber-500/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-md">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-amber-500 text-slate-950 font-black shrink-0">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">
                  {t('SuperAdmin Avtorizatsiyasi Tasdiqlandi', 'SuperAdmin Authorization Verified', 'СуперАдмин Авторизация Подтверждена')}
                </h3>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-amber-500 text-slate-950 font-black">
                  ROOT ROLE
                </span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5">
                {t(
                  `Foydalanuvchi UID: '${SUPER_ADMIN_UUID}' mos keldi. Barcha admin va moliya huquqlari faol.`,
                  `User UID matched '${SUPER_ADMIN_UUID}'. Full administrative and financial control active.`,
                  `UID совпал. Все административные права активны.`
                )}
              </p>
            </div>
          </div>
          <div className="px-3 py-1.5 rounded-xl bg-white/80 dark:bg-slate-900/80 border border-amber-500/30 text-xs font-mono font-bold text-amber-600 dark:text-amber-400">
            Role: superadmin
          </div>
        </div>
      )}

      {/* Real-time Top 4 Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Monthly Revenue */}
        <div
          onClick={() => onNavigate?.('payments')}
          className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm hover:border-emerald-500/50 transition cursor-pointer space-y-2 group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">
              {t("Oylik Jami Tushum", "Total Monthly Revenue", "Ежемесячный Доход")}
            </span>
            <div className="p-2 rounded-2xl bg-emerald-500/10 text-emerald-500 group-hover:scale-110 transition">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <div>
            <p className="text-2xl font-black text-slate-900 dark:text-white font-mono">
              {totalRevenue.toLocaleString()} UZS
            </p>
            <p className="text-[11px] text-emerald-500 font-bold flex items-center gap-1 mt-1">
              <TrendingUp className="w-3 h-3" />
              {t("Firestore 'payments' live sync", "Firestore 'payments' live sync", "Синхронизация Firestore")}
            </p>
          </div>
        </div>

        {/* Active Enrolled Students */}
        <div
          onClick={() => onNavigate?.('students')}
          className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm hover:border-amber-500/50 transition cursor-pointer space-y-2 group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">
              {t("Faol O'quvchilar", "Active Enrolled Students", "Активные Ученики")}
            </span>
            <div className="p-2 rounded-2xl bg-amber-500/10 text-amber-500 group-hover:scale-110 transition">
              <GraduationCap className="w-5 h-5" />
            </div>
          </div>
          <div>
            <p className="text-2xl font-black text-slate-900 dark:text-white font-mono">
              {students.length}
            </p>
            <p className="text-[11px] text-amber-500 font-bold mt-1">
              {t("Faol o'quvchilar ro'yxati", "Enrolled student directory", "Зачисленные ученики")}
            </p>
          </div>
        </div>

        {/* Debtor Accounts */}
        <div
          onClick={() => onNavigate?.('payments')}
          className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm hover:border-rose-500/50 transition cursor-pointer space-y-2 group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">
              {t("Qarzdor Accounts", "Debtor Accounts", "Задолженности")}
            </span>
            <div className="p-2 rounded-2xl bg-rose-500/10 text-rose-500 group-hover:scale-110 transition">
              <AlertCircle className="w-5 h-5" />
            </div>
          </div>
          <div>
            <p className="text-2xl font-black text-rose-500 font-mono">
              {debtorCount}
            </p>
            <p className="text-[11px] text-rose-500 font-bold mt-1">
              {t("Muddati o'tgan kontraktlar", "Overdue / pending tuition flags", "Просроченная оплата")}
            </p>
          </div>
        </div>

        {/* Active Study Groups */}
        <div
          onClick={() => onNavigate?.('classes')}
          className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm hover:border-purple-500/50 transition cursor-pointer space-y-2 group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">
              {t("Faol Guruhlar", "Active Study Groups", "Учебные Группы")}
            </span>
            <div className="p-2 rounded-2xl bg-purple-500/10 text-purple-500 group-hover:scale-110 transition">
              <BookOpen className="w-5 h-5" />
            </div>
          </div>
          <div>
            <p className="text-2xl font-black text-slate-900 dark:text-white font-mono">
              {groups.length}
            </p>
            <p className="text-[11px] text-purple-500 font-bold mt-1">
              IELTS & General English
            </p>
          </div>
        </div>
      </div>

      {/* Admin Quick Action Panel */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="text-sm font-extrabold text-slate-900 dark:text-white tracking-tight">
              {t("Tezkor Amallar Paneli", "Admin Quick Action Panel", "Панель Быстрых Действий")}
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              {t("Navigatsiya va amallarga tezkor o'tish", "Quick links for administrative operations", "Быстрые действия админа")}
            </p>
          </div>
          <Sparkles className="w-4 h-4 text-amber-500" />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <button
            onClick={() => {
              showToast(t("To'lovlar sahifasiga o'tilmoqda...", "Navigating to Payments...", "Переход к оплате..."));
              onNavigate?.('payments');
            }}
            className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 hover:border-emerald-500/50 transition text-left cursor-pointer flex items-center gap-3 group"
          >
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-500 group-hover:scale-110 transition shrink-0">
              <CreditCard className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-extrabold text-slate-900 dark:text-white">
                {t("To'lov Kiritish", "Log Tuition Payment", "Внести Оплату")}
              </p>
              <p className="text-[10px] text-slate-400">Click / Payme / Cash</p>
            </div>
          </button>

          <button
            onClick={() => {
              showToast(t("Vazifalar sahifasiga o'tilmoqda...", "Navigating to Homework...", "Переход к заданиям..."));
              onNavigate?.('homework');
            }}
            className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 hover:border-blue-500/50 transition text-left cursor-pointer flex items-center gap-3 group"
          >
            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-500 group-hover:scale-110 transition shrink-0">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-extrabold text-slate-900 dark:text-white">
                {t("Vazifa Biriktirish", "Assign Homework", "Назначить Задание")}
              </p>
              <p className="text-[10px] text-slate-400">Audio / PDF Uploads</p>
            </div>
          </button>

          <button
            onClick={() => {
              showToast(t("Sozlamalar sahifasiga o'tilmoqda...", "Navigating to Settings...", "Переход к настройкам..."));
              onNavigate?.('settings');
            }}
            className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 hover:border-purple-500/50 transition text-left cursor-pointer flex items-center gap-3 group"
          >
            <div className="p-2 rounded-xl bg-purple-500/10 text-purple-500 group-hover:scale-110 transition shrink-0">
              <Key className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-extrabold text-slate-900 dark:text-white">
                {t("Xavfsizlik PIN", "Security PIN Settings", "PIN Безопасности")}
              </p>
              <p className="text-[10px] text-slate-400">PIN & Auth Rules</p>
            </div>
          </button>
        </div>
      </div>

      {/* "Recent Tuition & Fee Payments" Live Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
          <div>
            <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
              {t("So'nggi To'lov Operatsiyalari (Kontrakt)", "Recent Tuition & Fee Payments", "Последние Оплаты")}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {t("Firestore 'payments' to'plamidan kelayotgan jonli oylik tranzaksiyalar", "Live transaction logs pulled directly from Firestore", "Живой журнал транзакций из Firestore")}
            </p>
          </div>

          <span className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold text-xs border border-emerald-500/20">
            {payments.length} {t("Tranzaksiyalar", "Transactions", "Транзакции")}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 font-bold uppercase tracking-wider">
                <th className="pb-3 px-2">{t("STUDENT NAME", "STUDENT NAME", "ИМЯ УЧЕНИКА")}</th>
                <th className="pb-3 px-2">{t("GROUP / COURSE", "GROUP / COURSE", "ГРУППА / КУРС")}</th>
                <th className="pb-3 px-2">{t("AMOUNT (UZS)", "AMOUNT (UZS)", "СУММА (UZS)")}</th>
                <th className="pb-3 px-2">{t("PAYMENT METHOD", "PAYMENT METHOD", "СПОСОБ ОПЛАТЫ")}</th>
                <th className="pb-3 px-2">{t("STATUS", "STATUS", "СТАТУС")}</th>
                <th className="pb-3 px-2 text-right">{t("DATE", "DATE", "ДАТА")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {payments.slice(0, 8).map((p) => (
                <tr key={p.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition">
                  <td className="py-3.5 px-2 font-bold text-slate-900 dark:text-white">
                    {p.studentName}
                  </td>
                  <td className="py-3.5 px-2 text-slate-600 dark:text-slate-400">
                    IELTS & General English
                  </td>
                  <td className="py-3.5 px-2 font-mono font-extrabold text-slate-900 dark:text-white">
                    {(p.amount || 650000).toLocaleString()} UZS
                  </td>
                  <td className="py-3.5 px-2">
                    <span className="px-2.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[10px] font-mono font-bold uppercase border border-slate-200 dark:border-slate-700">
                      {p.paymentMethod}
                    </span>
                  </td>
                  <td className="py-3.5 px-2">
                    <select
                      value={p.status || 'paid'}
                      onChange={(e: any) => handleStatusChange(p.id, e.target.value)}
                      className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold border cursor-pointer focus:outline-none ${
                        p.status === 'paid'
                          ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                          : p.status === 'pending'
                          ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20'
                          : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20'
                      }`}
                    >
                      <option value="paid">{t("Paid ✅", "Paid ✅", "Оплачено ✅")}</option>
                      <option value="pending">{t("Pending ⏳", "Pending ⏳", "В ожидании ⏳")}</option>
                      <option value="refunded">{t("Refunded 🔄", "Refunded 🔄", "Возврат 🔄")}</option>
                    </select>
                  </td>
                  <td className="py-3.5 px-2 text-right font-mono text-slate-400 text-[11px]">
                    {p.date}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
