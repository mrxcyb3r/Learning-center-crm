import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { useAuth, SUPER_ADMIN_UUID } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { TypewriterText } from '../common/TypewriterText';
import { StudentProgressCharts } from '../student/StudentProgressCharts';
import { TelegramSettingsCard } from '../TelegramSettingsCard';
import { AdminDashboard } from '../../pages/admin/Dashboard';
import { TeacherDashboard } from '../../pages/teacher/Dashboard';
import {
  subscribeStudents,
  subscribeGroups,
  subscribePayments,
  seedFirestoreIfEmpty
} from '../../services/firestore';
import { Student, Group, Payment } from '../../types';
import {
  ShieldAlert,
  ShieldCheck,
  GraduationCap,
  Users,
  Award,
  BookOpen,
  Calendar,
  TrendingUp,
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
  Bot,
  CheckCircle2,
  Send,
  MessageSquare,
  BarChart3,
  ChevronRight,
  Download,
  X,
  ExternalLink,
  Headphones,
  FileCheck
} from 'lucide-react';
import { UserRole } from '../../types';

interface DashboardProps {
  onNavigate?: (tab: string) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ onNavigate }) => {
  const { currentUser, userProfile, activeRole } = useAuth();
  const { language } = useLanguage();
  const t = (uz: string, en: string, ru: string) => {
    if (language === 'UZ') return uz;
    if (language === 'RU') return ru;
    return en;
  };

  const displayName = userProfile?.displayName || currentUser?.displayName || 'User';

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Live Firestore State
  const [students, setStudents] = useState<Student[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);

  useEffect(() => {
    seedFirestoreIfEmpty();

    const unsubStudents = subscribeStudents(setStudents);
    const unsubGroups = subscribeGroups(setGroups);
    const unsubPayments = subscribePayments(setPayments);

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

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 px-4 py-3 rounded-2xl bg-slate-900 text-white shadow-2xl border border-amber-500/40 text-xs font-bold flex items-center gap-2 animate-bounce">
          <Sparkles className="w-4 h-4 text-amber-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* SuperAdmin Authorization Verified Banner */}
      {currentUser?.uid === SUPER_ADMIN_UUID && (
        <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-500/20 via-rose-500/10 to-purple-500/20 border border-amber-500/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-md">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-500 text-slate-950 font-bold shrink-0">
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
                  `Foydalanuvchi UID: '${SUPER_ADMIN_UUID}' mos keldi. SuperAdmin huquqlari faollashtirildi.`,
                  `User UID matched '${SUPER_ADMIN_UUID}'. Full SuperAdmin privileges granted.`,
                  `UID пользователя совпал с '${SUPER_ADMIN_UUID}'. Предоставлены права СуперАдмина.`
                )}
              </p>
            </div>
          </div>
          <div className="px-3 py-1.5 rounded-xl bg-white/80 dark:bg-slate-900/80 border border-amber-500/30 text-xs font-mono font-bold text-amber-600 dark:text-amber-400">
            Role: superadmin
          </div>
        </div>
      )}

      {/* RENDER ROLE-SPECIFIC DASHBOARD VIEW */}
      {activeRole === 'superadmin' || activeRole === 'admin' ? (
        <AdminDashboard />
      ) : activeRole === 'teacher' ? (
        <TeacherDashboard />
      ) : (
        <StudentDashboardView displayName={displayName} showToast={showToast} onNavigate={onNavigate} />
      )}
    </div>
  );
};


/* =========================================================================
   1. SUPERADMIN / ADMIN DASHBOARD VIEW
   ========================================================================= */
const AdminDashboardView: React.FC<{
  displayName: string;
  showToast: (msg: string) => void;
  activeRole: UserRole;
  students: Student[];
  groups: Group[];
  payments: Payment[];
  onNavigate?: (tab: string) => void;
}> = ({ showToast, activeRole, students, groups, payments, onNavigate }) => {
  const { language } = useLanguage();
  const t = (uz: string, en: string, ru: string) => {
    if (language === 'UZ') return uz;
    if (language === 'RU') return ru;
    return en;
  };

  const totalRev = payments.reduce((acc, p) => acc + (p.amount || 0), 0);
  const debtorCount = students.filter((s) => s.paymentStatus === 'pending' || s.paymentStatus === 'overdue').length;

  return (
    <div className="space-y-6">
      {/* Metric Cards for Revenue, Students, Debtors, Groups */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div onClick={() => onNavigate?.('payments')} className="cursor-pointer transition-transform hover:scale-[1.01]">
          <StatCard
            title={t("Oylik Jami Tushum", "Total Monthly Revenue", "Ежемесячный Доход")}
            value={`${totalRev.toLocaleString()} UZS`}
            change={t("Real-time Firestore", "Live Firestore Sync", "Синхронизация Firestore")}
            icon={<DollarSign className="w-5 h-5 text-emerald-500" />}
          />
        </div>
        <div onClick={() => onNavigate?.('students')} className="cursor-pointer transition-transform hover:scale-[1.01]">
          <StatCard
            title={t("Faol O'quvchilar", "Active Enrolled Students", "Активные Ученики")}
            value={t(`${students.length} O'quvchi`, `${students.length} Students`, `${students.length} Учеников`)}
            change={t("Jonli ro'yxat", "Live Roster", "Текущий список")}
            icon={<GraduationCap className="w-5 h-5 text-amber-500" />}
          />
        </div>
        <div onClick={() => onNavigate?.('payments')} className="cursor-pointer transition-transform hover:scale-[1.01]">
          <StatCard
            title={t("Qarzdor O'quvchilar", "Debtor Accounts", "Задолженности")}
            value={t(`${debtorCount} Qarzdor`, `${debtorCount} Debtors`, `${debtorCount} Должников`)}
            change={t("Aktiv monitoring", "Active monitoring", "Активный мониторинг")}
            icon={<AlertCircle className="w-5 h-5 text-rose-500" />}
          />
        </div>
        <div onClick={() => onNavigate?.('classes')} className="cursor-pointer transition-transform hover:scale-[1.01]">
          <StatCard
            title={t("Faol O'quv Guruhlari", "Active Study Groups", "Учебные Группы")}
            value={t(`${groups.length} Guruh`, `${groups.length} Groups`, `${groups.length} Групп`)}
            change="IELTS & General English"
            icon={<BookOpen className="w-5 h-5 text-purple-500" />}
          />
        </div>
      </div>


      {/* Quick Action Panel */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="text-sm font-extrabold text-slate-900 dark:text-white tracking-tight">
              {t("Tezkor Amallar Paneli", "Admin Quick Action Panel", "Панель Быстрых Действий")}
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              {t("Markaz operatsiyalarini va moliyani tezkor boshqaring", "Manage center operations & tuition logs", "Управление операциями центра")}
            </p>
          </div>
          <Sparkles className="w-4 h-4 text-amber-500" />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <ActionButton
            icon={<CreditCard className="w-4 h-4 text-emerald-500" />}
            label={t("To'lov Kiritish", "Log Tuition Payment", "Внести Оплату")}
            onClick={() => {
              showToast(t("To'lovlar sahifasiga o'tilmoqda...", "Navigating to Payments...", "Переход к оплате..."));
              onNavigate?.('payments');
            }}
          />
          <ActionButton
            icon={<FileText className="w-4 h-4 text-blue-500" />}
            label={t("Vazifa Biriktirish", "Assign Homework", "Назначить Задание")}
            onClick={() => {
              showToast(t("Vazifalar sahifasiga o'tilmoqda...", "Navigating to Homework...", "Переход к заданиям..."));
              onNavigate?.('homework');
            }}
          />
          {(activeRole === 'superadmin' || activeRole === 'admin') && (
            <ActionButton
              icon={<Key className="w-4 h-4 text-purple-500" />}
              label={t("Xavfsizlik PIN", "Security PIN Settings", "PIN Безопасности")}
              onClick={() => {
                showToast(t("Sozlamalar sahifasiga o'tilmoqda...", "Navigating to Settings...", "Переход к настройкам..."));
                onNavigate?.('settings');
              }}
            />
          )}
        </div>
      </div>

      {/* Recent Payment Transactions Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
          <div>
            <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
              {t("So'nggi To'lov Operatsiyalari (Kontrakt)", "Recent Tuition & Fee Payments", "Последние Оплаты")}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {t("Oylik kontrakt to'lovlari va qarzdorliklar", "Tuition collection & debtor logs", "Ежемесячные контракты и задолженности")}
            </p>
          </div>

          <span className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold text-xs border border-emerald-500/20">
            {t("Jami 142 To'lov", "142 Total Transactions", "Всего 142 Транзакции")}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 font-bold uppercase tracking-wider">
                <th className="pb-3 px-2">{t("O'quvchi", "Student Name", "Ученик")}</th>
                <th className="pb-3 px-2">{t("Guruh / Kurs", "Group / Course", "Группа / Курс")}</th>
                <th className="pb-3 px-2">{t("Summa (UZS)", "Amount (UZS)", "Сумма (UZS)")}</th>
                <th className="pb-3 px-2">{t("To'lov Usuli", "Payment Method", "Способ Оплаты")}</th>
                <th className="pb-3 px-2">{t("Holat", "Status", "Статус")}</th>
                <th className="pb-3 px-2">{t("Sana", "Date", "Дата")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {[
                { name: "Jasur Rahimov", course: "IELTS 7.5+ Intensive", amount: "650,000 UZS", method: "Click", status: "paid", date: t("Bugun 10:45", "Today 10:45", "Сегодня 10:45") },
                { name: "Malika Sharipova", course: "General English B2", amount: "550,000 UZS", method: "Payme", status: "paid", date: t("Bugun 09:20", "Today 09:20", "Сегодня 09:20") },
                { name: "Sardor Bekmuratov", course: "IELTS Rocket 8.0", amount: "650,000 UZS", method: t("Naqd", "Cash", "Наличные"), status: "pending", date: t("Kechagacha", "Yesterday", "Вчера") },
                { name: "Aziza Umarova", course: "CEFR B2 FastTrack", amount: "500,000 UZS", method: "Uzcard/Visa", status: "paid", date: "20 Jul" },
                { name: "Boburmirzo Alimov", course: "Kids Starter English", amount: "450,000 UZS", method: "Click", status: "overdue", date: "18 Jul" }
              ].map((row, i) => (
                <tr key={i} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition">
                  <td className="py-3 px-2 font-bold text-slate-800 dark:text-slate-200">{row.name}</td>
                  <td className="py-3 px-2 text-slate-600 dark:text-slate-400">{row.course}</td>
                  <td className="py-3 px-2 font-mono font-bold text-slate-900 dark:text-white">{row.amount}</td>
                  <td className="py-3 px-2 text-slate-600 dark:text-slate-400">
                    <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-[10px] font-semibold border border-slate-200 dark:border-slate-700">
                      {row.method}
                    </span>
                  </td>
                  <td className="py-3 px-2">
                    {row.status === 'paid' && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold text-[10px] border border-emerald-500/20">
                        <Check className="w-3 h-3" /> {t("To'langan ✅", "Paid ✅", "Оплачено ✅")}
                      </span>
                    )}
                    {row.status === 'pending' && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 font-bold text-[10px] border border-amber-500/20">
                        <Clock className="w-3 h-3" /> {t("Kutilmoqda ⏳", "Pending ⏳", "В ожидании ⏳")}
                      </span>
                    )}
                    {row.status === 'overdue' && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-rose-500/10 text-rose-600 dark:text-rose-400 font-bold text-[10px] border border-rose-500/20">
                        <XCircle className="w-3 h-3" /> {t("Qarzdor ❌", "Overdue ❌", "Задолженность ❌")}
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-2 text-slate-400 font-mono text-[11px]">{row.date}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* System Health Banner */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white border border-slate-800 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1">
          <span className="px-3 py-1 rounded-full bg-amber-500/20 text-amber-400 font-bold text-xs uppercase tracking-wider border border-amber-500/30">
            {t("Markaz Monitoringi", "Center Overview", "Обзор Центра")}
          </span>
          <h3 className="text-lg font-extrabold mt-2">
            {t("Markaz Tushumi va Tizim Salomatligi", "Center Revenue & System Health Overview", "Доходы и Мониторинг Системы")}
          </h3>
          <p className="text-xs text-slate-300 max-w-xl">
            {t(
              "Markaz bo'yicha oylik to'lovlar 94% ko'rsatkichda yig'ildi. Firebase Firestore va Auth xizmatlari barqaror ishlamoqda.",
              "94% tuition fee collection rate achieved for current billing period. Firestore & Auth operating normally.",
              "Собрано 94% оплаты за текущий период. Firestore и Auth работают стабильно."
            )}
          </p>
        </div>
        <div className="px-4 py-2 bg-slate-800 text-amber-400 font-mono text-xs font-bold rounded-2xl border border-slate-700">
          Status: Operational 🟢
        </div>
      </div>
    </div>
  );
};

/* =========================================================================
   2. TEACHER DASHBOARD VIEW
   ========================================================================= */
const TeacherDashboardView: React.FC<{
  displayName: string;
  showToast: (msg: string) => void;
  groups: Group[];
  students: Student[];
  onNavigate?: (tab: string) => void;
}> = ({ showToast, groups, students, onNavigate }) => {
  const { language } = useLanguage();
  const t = (uz: string, en: string, ru: string) => {
    if (language === 'UZ') return uz;
    if (language === 'RU') return ru;
    return en;
  };

  return (
    <div className="space-y-6">
      {/* Metric Cards for Today's Schedule, Unmarked Attendance, Pending Homework, Avg Attendance */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div onClick={() => onNavigate?.('classes')} className="cursor-pointer transition-transform hover:scale-[1.01]">
          <StatCard
            title={t("Mening Guruhlarim", "My Assigned Groups", "Мои Группы")}
            value={t(`${groups.length} ta Guruh`, `${groups.length} Groups`, `${groups.length} Групп`)}
            change="IELTS & General English"
            icon={<Calendar className="w-5 h-5 text-blue-500" />}
          />
        </div>
        <div onClick={() => onNavigate?.('classes')} className="cursor-pointer transition-transform hover:scale-[1.01]">
          <StatCard
            title={t("Jami O'quvchilar", "Enrolled Students", "Всего Учеников")}
            value={t(`${students.length} ta O'quvchi`, `${students.length} Students`, `${students.length} Учеников`)}
            change={t("Barcha guruhlar", "All rosters", "Все списки")}
            icon={<Clock className="w-5 h-5 text-amber-500" />}
          />
        </div>
        <div onClick={() => onNavigate?.('homework')} className="cursor-pointer transition-transform hover:scale-[1.01]">
          <StatCard
            title={t("Tekshiriladigan Vazifa", "Homework Pending Review", "Задания на Проверку")}
            value={t("12 ta Insho", "12 Writing Essays", "12 Эссе")}
            change="IELTS Writing Task 2"
            icon={<FileText className="w-5 h-5 text-rose-500" />}
          />
        </div>
        <div onClick={() => onNavigate?.('attendance')} className="cursor-pointer transition-transform hover:scale-[1.01]">
          <StatCard
            title={t("O'rtacha Davomat Ko'rsatkichi", "Avg Attendance Rate", "Ср. Посещаемость")}
            value="96.4%"
            change={t("A'lo ko'rsatkich", "High engagement", "Высокая активность")}
            icon={<Award className="w-5 h-5 text-emerald-500" />}
          />
        </div>
      </div>


      {/* Teacher Quick Actions */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="text-sm font-extrabold text-slate-900 dark:text-white tracking-tight">
              {t("O'qituvchi Tezkor Amallar", "Teacher Quick Actions", "Быстрые Действия Учителя")}
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              {t("Davomat, vazifalar va audio fayllarni yuklash", "1-Tap attendance, audio uploads & essay grading", "Посещаемость, задания и аудио")}
            </p>
          </div>
          <Sparkles className="w-4 h-4 text-blue-500" />
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <ActionButton
            icon={<Calendar className="w-4 h-4 text-blue-500" />}
            label={t("1-Tap Davomat", "1-Tap Attendance Grid", "Посещаемость в 1 клик")}
            onClick={() => {
              showToast(t("Davomat sahifasiga o'tilmoqda...", "Navigating to Attendance...", "Переход к посещаемости..."));
              onNavigate?.('attendance');
            }}
          />
          <ActionButton
            icon={<FileText className="w-4 h-4 text-purple-500" />}
            label={t("Audio/Vazifa Yuklash", "Upload Audio & Homework", "Загрузка Аудио/Заданий")}
            onClick={() => {
              showToast(t("Vazifalar sahifasiga o'tilmoqda...", "Navigating to Homework...", "Переход к заданиям..."));
              onNavigate?.('homework');
            }}
          />
          <ActionButton
            icon={<Award className="w-4 h-4 text-emerald-500" />}
            label={t("Insho Bahlash", "Grade IELTS Writing", "Проверка Эссе")}
            onClick={() => {
              showToast(t("Bahlash daftarchasiga o'tilmoqda...", "Navigating to Gradebook...", "Переход к журналу..."));
              onNavigate?.('gradebook');
            }}
          />
          <ActionButton
            icon={<Send className="w-4 h-4 text-amber-500" />}
            label={t("Guruhlarim", "My Classes", "Мои Группы")}
            onClick={() => {
              showToast(t("Guruhlar ro'yxatiga o'tilmoqda...", "Navigating to My Classes...", "Переход к группам..."));
              onNavigate?.('classes');
            }}
          />
        </div>
      </div>

      {/* Today's Schedule Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
              {t("Bugungi Dars Jadvali & Davomat Holati", "Today's Schedule & Attendance Status", "Расписание на Сегодня & Посещаемость")}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {t("Guruhlar bo'yicha vaqt va xonalar", "Classes, timing & attendance tracker", "Группы, время и кабинеты")}
            </p>
          </div>
          <span className="px-3 py-1 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 font-bold text-xs border border-blue-500/20">
            {t("3 ta Dars", "3 Classes Today", "3 Урока Сегодня")}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 font-bold uppercase tracking-wider">
                <th className="pb-3 px-2">{t("Guruh", "Group Name", "Группа")}</th>
                <th className="pb-3 px-2">{t("Vaqt & Xona", "Time & Room", "Время & Кабинет")}</th>
                <th className="pb-3 px-2">{t("Mavzu", "Lesson Topic", "Тема Урока")}</th>
                <th className="pb-3 px-2">{t("Davomat Holati", "Attendance Status", "Статус Посещаемости")}</th>
                <th className="pb-3 px-2">{t("Amal", "Action", "Действие")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {[
                { name: "IELTS Intensive #12", time: "14:00 - 16:00 (Xona 3)", topic: "Writing Task 2: Cause & Effect", status: "completed" },
                { name: "General English B2", time: "16:30 - 18:00 (Xona 1)", topic: "Advanced Conditionals & Speaking", status: "pending" },
                { name: "CEFR FastTrack", time: "18:30 - 20:00 (Xona 5)", topic: "Mock Listening Section 3 & 4", status: "upcoming" }
              ].map((row, i) => (
                <tr key={i} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition">
                  <td className="py-3.5 px-2 font-bold text-slate-800 dark:text-slate-200">{row.name}</td>
                  <td className="py-3.5 px-2 text-slate-600 dark:text-slate-400 font-mono text-[11px]">{row.time}</td>
                  <td className="py-3.5 px-2 text-slate-600 dark:text-slate-400">{row.topic}</td>
                  <td className="py-3.5 px-2">
                    {row.status === 'completed' && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold text-[10px] border border-emerald-500/20">
                        <CheckCircle2 className="w-3 h-3" /> {t("Olingan ✅", "Taken ✅", "Отмечено ✅")}
                      </span>
                    )}
                    {row.status === 'pending' && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 font-bold text-[10px] border border-amber-500/20 animate-pulse">
                        <Clock className="w-3 h-3" /> {t("Kutilmoqda ⏳", "Pending ⏳", "В ожидании ⏳")}
                      </span>
                    )}
                    {row.status === 'upcoming' && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 font-bold text-[10px] border border-slate-200 dark:border-slate-700">
                        <Calendar className="w-3 h-3" /> {t("Rejada", "Scheduled", "В планах")}
                      </span>
                    )}
                  </td>
                  <td className="py-3.5 px-2">
                    <button
                      onClick={() => {
                        showToast(t(`${row.name} uchun davomat rejimi...`, `Opening attendance for ${row.name}`, `Открытие посещаемости для ${row.name}`));
                        onNavigate?.('attendance');
                      }}
                      className="px-3 py-1 bg-blue-500 text-white rounded-xl text-[11px] font-bold hover:bg-blue-600 transition cursor-pointer"
                    >
                      {t("Belgilash", "Mark Attendance", "Отметить")}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Teacher Class Banner */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-blue-900 via-slate-900 to-slate-900 text-white border border-blue-800/40 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <span className="px-3 py-1 rounded-full bg-blue-500/20 text-blue-400 font-bold text-xs uppercase tracking-wider border border-blue-500/30">
            {t("O'qituvchi Boshqaruvi", "Teacher Class Monitor", "Монитор Учителя")}
          </span>
          <h3 className="text-lg font-extrabold mt-2">
            {t("Bugungi Darslar va Tekshirilmagan Insholar", "Today's Schedule & Pending Writing Essays", "Сегодняшние Уроки и Эссе")}
          </h3>
          <p className="text-xs text-slate-300 mt-1">
            {t(
              "Sizda bugun 3 ta guruh darsi va tekshirilishi kutilayotgan 12 ta IELTS Writing insholari bor.",
              "You have 3 active classes today and 12 pending IELTS Writing Task submissions to grade.",
              "У вас сегодня 3 занятия и 12 непроверенных эссе IELTS Writing."
            )}
          </p>
        </div>

        <button
          onClick={() => {
            showToast(t("Insholarni bahlash rejimi...", "Opening Essay Grading...", "Проверка эссе..."));
            onNavigate?.('gradebook');
          }}
          className="px-4 py-2 bg-blue-500 text-white font-bold text-xs rounded-2xl shadow-lg hover:bg-blue-600 transition cursor-pointer shrink-0"
        >
          {t("Bahlashni Boshlash", "Grade Essays", "Начать Проверку")}
        </button>
      </div>
    </div>
  );
};

/* =========================================================================
   3. STUDENT DASHBOARD VIEW
   ========================================================================= */
export const StudentDashboardView: React.FC<{
  displayName?: string;
  showToast: (msg: string) => void;
  onNavigate?: (tab: string) => void;
}> = ({ displayName, showToast, onNavigate }) => {
  const [isMockModalOpen, setIsMockModalOpen] = useState(false);
  const { language } = useLanguage();
  const t = (uz: string, en: string, ru: string) => {
    if (language === 'UZ') return uz;
    if (language === 'RU') return ru;
    return en;
  };

  return (
    <div className="space-y-6">
      {/* Metric Cards for Course Status, Homework Deadlines, Latest Mock Score, Attendance */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div
          onClick={() => {
            showToast(t("Guruh darslariga o'tilmoqda...", "Opening Enrolled Course Details...", "Переход к деталям курса..."));
            onNavigate?.('feed');
          }}
          className="cursor-pointer transition-transform hover:scale-[1.01]"
        >
          <StatCard
            title={t("Biriktirilgan Kurs", "Enrolled Course", "Выбранный Курс")}
            value="IELTS 7.5+ Intensive"
            change={t("Xona 3 • Mr. Javohir", "Room 3 • Mr. Javohir", "Кабинет 3 • Mr. Javohir")}
            icon={<BookOpen className="w-5 h-5 text-amber-500" />}
          />
        </div>

        <div
          onClick={() => {
            showToast(t("Guruh vazifalariga o'tilmoqda...", "Opening Homework List...", "Переход к домашним заданиям..."));
            onNavigate?.('feed');
          }}
          className="cursor-pointer transition-transform hover:scale-[1.01]"
        >
          <StatCard
            title={t("Kutilayotgan Vazifa", "Upcoming Assignments", "Предстоящие Задания")}
            value={t("2 ta Topshiriq", "2 Assignments Due", "2 Задания")}
            change={t("Muddati: Ertaga 18:00", "Due: Tomorrow 18:00", "Срок: Завтра 18:00")}
            icon={<Clock className="w-5 h-5 text-rose-500" />}
          />
        </div>

        <div
          onClick={() => {
            showToast(t("Mock test grafiklariga o'tilmoqda...", "Opening IELTS Mock Analytics...", "Переход к аналитике тестов..."));
            onNavigate?.('progress');
          }}
          className="cursor-pointer transition-transform hover:scale-[1.01]"
        >
          <StatCard
            title={t("So'nggi IELTS Mock Ball", "Latest IELTS Mock Score", "Последний Балл Mock")}
            value="Band 7.5 Overall"
            change="L: 8.0 | R: 7.5 | W: 7.0 | S: 7.5"
            icon={<Award className="w-5 h-5 text-emerald-500" />}
          />
        </div>

        <div
          onClick={() => {
            showToast(t("Davomat ko'rsatkichi a'lo darajada", "Attendance record verified (98%)", "Посещаемость подтверждена (98%)"));
          }}
          className="cursor-pointer transition-transform hover:scale-[1.01]"
        >
          <StatCard
            title={t("Darsga Qatnashish", "Attendance Record", "Посещаемость")}
            value="98% Attendance"
            change={t("A'lo intizom", "Excellent track record", "Отличная дисциплина")}
            icon={<CheckCircle2 className="w-5 h-5 text-blue-500" />}
          />
        </div>
      </div>

      {/* Student Quick Actions */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 sm:p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
              <span>{t("O'quvchi Tezkor Yordamchilar", "Student Portal Tools", "Инструменты Ученика")}</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                Interactive
              </span>
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
              {t("24/7 AI tutor, guruh topshiriqlari va mock imtihonlar portaliga kiring", "24/7 AI tutor, homework feed, class standings & practice test hub", "24/7 AI репетитор, домашние задания и пробные тесты")}
            </p>
          </div>
          <Sparkles className="w-4 h-4 text-amber-500" />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <ActionButton
            icon={<Bot className="w-5 h-5 text-amber-500" />}
            label={t("24/7 AI Tutor Yordamchi", "Ask 24/7 AI Tutor", "24/7 AI Репетитор")}
            subtitle={t("Instant AI response & speaking feedback", "Instant AI feedback, essay grading & speaking", "Мгновенная обратная связь и проверка")}
            badge="AI 24/7"
            onClick={() => {
              showToast(t("Opening 24/7 AI Tutor Chat ✨", "Opening 24/7 AI Tutor Chat ✨", "Открытие чата с 24/7 AI Репетитором ✨"));
              onNavigate?.('ai_tutor');
            }}
          />
          <ActionButton
            icon={<FileText className="w-5 h-5 text-blue-500" />}
            label={t("Guruh Vazifalari", "View Class Homework", "Домашние Задания")}
            subtitle={t("Topshiriqlar lentalari va yuklamalar", "Check class feed, audio drills & assignments", "Лента группы и аудио упражнения")}
            badge="Assignments"
            onClick={() => {
              showToast(t("Guruh topshiriqlariga o'tilmoqda...", "Opening Homework Portal...", "Переход к домашним заданиям..."));
              onNavigate?.('feed');
            }}
          />
          <ActionButton
            icon={<Award className="w-5 h-5 text-emerald-500" />}
            label={t("Guruh Reytingi", "Check Leaderboard", "Рейтинг Группы")}
            subtitle={t("Guruhdagi o'rin va XP ballar", "Rankings, attendance streak & top scores", "Рейтинг, посещаемость и XP баллы")}
            badge="Top 3"
            onClick={() => {
              showToast(t("Guruh reytingiga o'tilmoqda...", "Opening Class Leaderboard...", "Переход к рейтингу..."));
              onNavigate?.('leaderboard');
            }}
          />
          <ActionButton
            icon={<Newspaper className="w-5 h-5 text-purple-500" />}
            label={t("Mock Test Yuklash", "Mock Practice Tests", "Пробные Тесты")}
            subtitle={t("Real IELTS variantlar & mp3 mashqlar", "Full IELTS & CEFR mock papers + audio drills", "Варианты IELTS/CEFR + аудио")}
            badge="Exams"
            onClick={() => {
              showToast(t("Mock Test materiallari ochilmoqda...", "Opening Practice Test Files...", "Открытие материалов пробных тестов..."));
              setIsMockModalOpen(true);
            }}
          />
        </div>
      </div>

      {/* Mock Practice Tests Modal */}
      {isMockModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-2xl w-full p-6 shadow-2xl relative overflow-hidden">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-2xl bg-purple-500/10 text-purple-500 border border-purple-500/20">
                  <Newspaper className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                    {t("IELTS & CEFR Mock Practice Hub", "IELTS & CEFR Mock Practice Hub", "Центр Пробных Тестов IELTS & CEFR")}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {t("Haqiqiy imtihon formatidagi materiallar va audio mashqlar", "Real exam format materials, audio drills & analytical keys", "Материалы формата экзамена и аудио тесты")}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsMockModalOpen(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="my-5 space-y-3 max-h-[60vh] overflow-y-auto pr-1">
              {[
                {
                  title: t("Full Mock IELTS #6 Academic Paper (PDF)", "Full Mock IELTS #6 Academic Paper (PDF)", "Полный Пробный Тест IELTS #6 Academic (PDF)"),
                  desc: t("Listening, Reading Passage 1-3 va Writing Task 1/2", "Full Listening 40 Qs, Reading 3 Passages & Writing 1/2", "Listening 40 вопр, Reading 3 текста и Writing 1/2"),
                  tag: "Academic",
                  color: "amber"
                },
                {
                  title: t("IELTS Listening Audio Section 1-4 Drill", "IELTS Listening Audio Section 1-4 Drill", "Аудио Запись IELTS Listening Section 1-4"),
                  desc: t("Original audio yozuvlar va kalitlar (32 min MP3)", "Full exam listening audio with timing & answer sheet", "Оригинальные аудиозаписи и ключи (32 мин MP3)"),
                  tag: "Audio MP3",
                  color: "blue"
                },
                {
                  title: t("Band 8.0 Writing Essay Prompt Collection", "Band 8.0 Writing Essay Prompt Collection", "Сборник Эссе Band 8.0"),
                  desc: t("Automation & AI mavzusidagi 15 ta namuna insho", "15 Model essays with examiner comments and vocabulary", "15 образцов эссе с комментариями экзаменатора"),
                  tag: "Writing",
                  color: "emerald"
                }
              ].map((item, idx) => (
                <div
                  key={idx}
                  className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 flex items-center justify-between gap-4 hover:border-amber-500/40 transition"
                >
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                        {item.tag}
                      </span>
                      <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                        {item.title}
                      </h4>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      {item.desc}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => {
                        showToast(t("Fayl yuklab olindi ✅", "Mock Material Downloaded ✅", "Файл скачан ✅"));
                      }}
                      className="px-3 py-1.5 rounded-xl bg-slate-200 dark:bg-slate-700 hover:bg-amber-500 hover:text-slate-950 text-slate-800 dark:text-slate-200 font-bold text-xs transition cursor-pointer flex items-center gap-1.5"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download</span>
                    </button>
                    <button
                      onClick={() => {
                        setIsMockModalOpen(false);
                        onNavigate?.('ai_tutor');
                        showToast(t("AI Tutor bilan test yechilmoqda...", "Starting Mock in AI Tutor...", "Запуск теста в AI Репетиторе..."));
                      }}
                      className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition cursor-pointer flex items-center gap-1.5 shadow-sm"
                    >
                      <Bot className="w-3.5 h-3.5" />
                      <span>AI Mode</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <button
                onClick={() => {
                  setIsMockModalOpen(false);
                  onNavigate?.('progress');
                }}
                className="text-xs font-bold text-amber-600 dark:text-amber-400 hover:underline flex items-center gap-1 cursor-pointer"
              >
                <TrendingUp className="w-4 h-4" />
                <span>{t("Barcha o'tgan Mock natijalarini ko'rish →", "View all past mock score analytics →", "Просмотреть все результаты пробных тестов →")}</span>
              </button>
              <button
                onClick={() => setIsMockModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-bold text-xs hover:bg-slate-300 dark:hover:bg-slate-700 transition cursor-pointer"
              >
                {t("Yopish", "Close", "Закрыть")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Recent Homework & Mock Results Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
              {t("Vazifalar & Mock Test Natijalari", "Assignments & Mock Test Results", "Задания и Результаты Тестов")}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {t("Shaxsiy o'zlashtirish va baholar tarixi", "Personal submission history & band scores", "История сдачи и баллы")}
            </p>
          </div>
          <button
            onClick={() => onNavigate?.('progress')}
            className="px-3 py-1.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 hover:bg-amber-500/20 font-bold text-xs border border-amber-500/20 transition cursor-pointer flex items-center gap-1"
          >
            <span>Target: IELTS 8.0</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 font-bold uppercase tracking-wider">
                <th className="pb-3 px-2">{t("Topshiriq / Imtihon", "Assignment / Exam", "Задание / Экзамен")}</th>
                <th className="pb-3 px-2">{t("Bo'lim", "Skill / Subject", "Раздел / Предмет")}</th>
                <th className="pb-3 px-2">{t("Muddati / Topshirilgan", "Due / Taken On", "Срок / Сдано")}</th>
                <th className="pb-3 px-2">{t("Natija / Ball", "Score / Band", "Результат / Балл")}</th>
                <th className="pb-3 px-2">{t("Holat", "Status", "Статус")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {[
                { name: "Writing Essay #14: Automation", skill: "Writing Task 2", date: "Ertaga 18:00", score: "Pending", status: "pending", targetTab: "feed" },
                { name: "Full Mock IELTS #5", skill: "Listening / Reading / Writing / Speaking", date: "15 Iyul 2025", score: "7.5 Overall", status: "graded", targetTab: "progress" },
                { name: "Listening Vocabulary Drill", skill: "Audio Section 4", date: "12 Iyul 2025", score: "19/20 (95%)", status: "graded", targetTab: "feed" }
              ].map((row, i) => (
                <tr
                  key={i}
                  onClick={() => onNavigate?.(row.targetTab)}
                  className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition cursor-pointer"
                >
                  <td className="py-3.5 px-2 font-bold text-slate-800 dark:text-slate-200">{row.name}</td>
                  <td className="py-3.5 px-2 text-slate-600 dark:text-slate-400">{row.skill}</td>
                  <td className="py-3.5 px-2 text-slate-500 font-mono text-[11px]">{row.date}</td>
                  <td className="py-3.5 px-2 font-mono font-bold text-slate-900 dark:text-white">{row.score}</td>
                  <td className="py-3.5 px-2">
                    {row.status === 'graded' && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold text-[10px] border border-emerald-500/20">
                        <Check className="w-3 h-3" /> {t("Bahlangan ✅", "Graded ✅", "Оценено ✅")}
                      </span>
                    )}
                    {row.status === 'pending' && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 font-bold text-[10px] border border-amber-500/20 animate-pulse">
                        <Clock className="w-3 h-3" /> {t("Kutilmoqda ⏳", "Pending ⏳", "В ожидании ⏳")}
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Telegram Bot Connection & Notification Preferences */}
      <TelegramSettingsCard />

      {/* Recharts Student Progress Radar & Line Charts */}
      <StudentProgressCharts />

      {/* Student Goal Banner with Hosted Student Avatar Asset */}
      <div className="p-6 rounded-3xl bg-gradient-to-br from-amber-500 via-amber-600 to-amber-700 text-slate-950 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <img
            src="https://i.ibb.co/3ypn7jPN/image.png"
            alt="Top Student IELTS 8.0"
            className="w-14 h-14 rounded-2xl border-2 border-slate-950 object-cover shadow-lg shrink-0"
          />
          <div>
            <span className="px-3 py-1 rounded-full bg-slate-950/20 text-slate-950 font-bold text-xs uppercase tracking-wider">
              Renessans Student Portal • IELTS 8.0 Target
            </span>
            <h2 className="text-lg md:text-xl font-black mt-1 flex items-center gap-1.5">
              <TypewriterText
                texts={[`Welcome back, ${displayName || 'Jasur Rahimov'} • Target: IELTS 8.0 🎯`]}
                speed={30}
                loop={false}
                cursorColorClass="text-slate-950 font-black"
              />
            </h2>
            <p className="text-xs text-slate-900/80 mt-0.5 max-w-xl font-medium">
              {t(
                "Keyingi darsingiz bugun soat 14:00 da (IELTS Intensive #12). Keyingi Mock IELTS imtihoni: Shanba 09:00.",
                "Your next class is today at 14:00 (IELTS Intensive #12). Next Full Mock IELTS Exam: Saturday 09:00.",
                "Следующее занятие сегодня в 14:00 (IELTS Intensive #12). Следующий пробный экзамен IELTS: Суббота 09:00."
              )}
            </p>
          </div>
        </div>
        <button
          onClick={() => {
            showToast(t("Opening 24/7 AI Tutor Chat ✨", "Opening 24/7 AI Tutor Chat ✨", "Открытие чата с 24/7 AI Репетитором ✨"));
            onNavigate?.('ai_tutor');
          }}
          className="px-4 py-2.5 bg-slate-950 hover:bg-slate-900 text-amber-400 rounded-2xl font-black text-xs shadow-md shrink-0 border border-amber-400/30 flex items-center gap-2 cursor-pointer transition"
        >
          <Sparkles className="w-4 h-4 text-amber-400" />
          <span>{t("AI Yordamchi bilan mashq", "Launch AI Coach", "Запустить AI Тренера")}</span>
        </button>
      </div>
    </div>
  );
};

/* =========================================================================
   HELPER STAT & ACTION BUTTON COMPONENTS
   ========================================================================= */
const StatCard: React.FC<{
  title: string;
  value: string;
  change: string;
  icon: React.ReactNode;
}> = ({ title, value, change, icon }) => {
  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-sm transition-all hover:border-amber-500/50 dark:hover:border-amber-500/50">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-bold text-slate-500 dark:text-slate-400">{title}</span>
        <div className="p-2 rounded-2xl bg-slate-100 dark:bg-slate-800">{icon}</div>
      </div>
      <h3 className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight">{value}</h3>
      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 font-medium">{change}</p>
    </div>
  );
};

const ActionButton: React.FC<{
  icon: React.ReactNode;
  label: string;
  subtitle?: string;
  badge?: string;
  onClick: () => void;
}> = ({ icon, label, subtitle, badge, onClick }) => {
  return (
    <button
      onClick={onClick}
      className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800 hover:border-amber-500/50 hover:bg-slate-100 dark:hover:bg-slate-800/80 hover:scale-[1.02] transition-all duration-200 flex flex-col justify-between text-left cursor-pointer group shadow-sm hover:shadow-md relative overflow-hidden"
    >
      <div className="flex items-start justify-between w-full mb-3">
        <div className="p-2.5 rounded-xl bg-white dark:bg-slate-800 shadow-sm border border-slate-200/60 dark:border-slate-700/60 group-hover:scale-110 group-hover:border-amber-500/40 transition-transform duration-200">
          {icon}
        </div>
        <div className="flex items-center gap-1.5">
          {badge && (
            <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
              {badge}
            </span>
          )}
          <ChevronRight className="w-4 h-4 text-slate-400 dark:text-slate-500 group-hover:text-amber-500 group-hover:translate-x-1 transition-all duration-200" />
        </div>
      </div>
      <div>
        <h4 className="text-xs font-extrabold text-slate-900 dark:text-white group-hover:text-amber-500 transition-colors">
          {label}
        </h4>
        {subtitle && (
          <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-1 font-medium">
            {subtitle}
          </p>
        )}
      </div>
    </button>
  );
};
