import React, { useState, useEffect } from 'react';
import { useAuth, SUPER_ADMIN_UUID } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
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

  const isUz = language === 'UZ';
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
                  {isUz ? 'SuperAdmin Avtorizatsiyasi Tasdiqlandi' : 'SuperAdmin Authorization Verified'}
                </h3>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-amber-500 text-slate-950 font-black">
                  ROOT ROLE
                </span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5">
                {isUz
                  ? `Foydalanuvchi UID: '${SUPER_ADMIN_UUID}' mos keldi. SuperAdmin huquqlari faollashtirildi.`
                  : `User UID matched '${SUPER_ADMIN_UUID}'. Full SuperAdmin privileges granted.`}
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
        <AdminDashboardView
          isUz={isUz}
          displayName={displayName}
          showToast={showToast}
          activeRole={activeRole}
          students={students}
          groups={groups}
          payments={payments}
        />
      ) : activeRole === 'teacher' ? (
        <TeacherDashboardView isUz={isUz} displayName={displayName} showToast={showToast} groups={groups} students={students} />
      ) : (
        <StudentDashboardView isUz={isUz} displayName={displayName} showToast={showToast} onNavigate={onNavigate} />
      )}
    </div>
  );
};


/* =========================================================================
   1. SUPERADMIN / ADMIN DASHBOARD VIEW
   ========================================================================= */
const AdminDashboardView: React.FC<{
  isUz: boolean;
  displayName: string;
  showToast: (msg: string) => void;
  activeRole: UserRole;
  students: Student[];
  groups: Group[];
  payments: Payment[];
}> = ({ isUz, showToast, activeRole, students, groups, payments }) => {
  const totalRev = payments.reduce((acc, p) => acc + (p.amount || 0), 0);
  const debtorCount = students.filter((s) => s.paymentStatus === 'pending' || s.paymentStatus === 'overdue').length;

  return (
    <div className="space-y-6">
      {/* Metric Cards for Revenue, Students, Debtors, Groups */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title={isUz ? "Oylik Jami Tushum" : "Total Monthly Revenue"}
          value={`${totalRev.toLocaleString()} UZS`}
          change={isUz ? "Real-time Firestore" : "Live Firestore Sync"}
          icon={<DollarSign className="w-5 h-5 text-emerald-500" />}
        />
        <StatCard
          title={isUz ? "Faol O'quvchilar" : "Active Enrolled Students"}
          value={isUz ? `${students.length} O'quvchi` : `${students.length} Students`}
          change={isUz ? "Jonli ro'yxat" : "Live Roster"}
          icon={<GraduationCap className="w-5 h-5 text-amber-500" />}
        />
        <StatCard
          title={isUz ? "Qarzdor O'quvchilar" : "Debtor Accounts"}
          value={isUz ? `${debtorCount} Qarzdor` : `${debtorCount} Debtors`}
          change={isUz ? "Aktiv monitoring" : "Active monitoring"}
          icon={<AlertCircle className="w-5 h-5 text-rose-500" />}
        />
        <StatCard
          title={isUz ? "Faol O'quv Guruhlari" : "Active Study Groups"}
          value={isUz ? `${groups.length} Guruh` : `${groups.length} Groups`}
          change="IELTS & General English"
          icon={<BookOpen className="w-5 h-5 text-purple-500" />}
        />
      </div>


      {/* Quick Action Panel */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="text-sm font-extrabold text-slate-900 dark:text-white tracking-tight">
              {isUz ? "Tezkor Amallar Paneli" : "Admin Quick Action Panel"}
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              {isUz ? "Markaz operatsiyalarini va moliyani tezkor boshqaring" : "Manage center operations & tuition logs"}
            </p>
          </div>
          <Sparkles className="w-4 h-4 text-amber-500" />
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <ActionButton
            icon={<CreditCard className="w-4 h-4 text-emerald-500" />}
            label={isUz ? "To'lov Kiritish" : "Log Tuition Payment"}
            onClick={() => showToast(isUz ? "To'lov kiritish modali..." : "Opening Log Payment Modal...")}
          />
          <ActionButton
            icon={<FileText className="w-4 h-4 text-blue-500" />}
            label={isUz ? "Vazifa Biriktirish" : "Assign Homework"}
            onClick={() => showToast(isUz ? "Vazifa yaratish rejimi..." : "Opening Homework Creator...")}
          />
          <ActionButton
            icon={<Newspaper className="w-4 h-4 text-amber-500" />}
            label={isUz ? "Blog Maqola" : "Publish Blog Post"}
            onClick={() => showToast(isUz ? "Blog CMS muharriri..." : "Opening Blog CMS Editor...")}
          />
          {(activeRole === 'superadmin' || activeRole === 'admin') && (
            <ActionButton
              icon={<Key className="w-4 h-4 text-purple-500" />}
              label={isUz ? "Xavfsizlik PIN" : "Generate Security PIN"}
              onClick={() => showToast(isUz ? "PIN yaratildi: 'secureadmin' / 'secureteacher'" : "Security PIN generated!")}
            />
          )}
        </div>
      </div>

      {/* Recent Payment Transactions Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
          <div>
            <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
              {isUz ? "So'nggi To'lov Operatsiyalari (Kontrakt)" : "Recent Tuition & Fee Payments"}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {isUz ? "Oylik kontrakt to'lovlari va qarzdorliklar" : "Tuition collection & debtor logs"}
            </p>
          </div>

          <span className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold text-xs border border-emerald-500/20">
            {isUz ? "Jami 142 To'lov" : "142 Total Transactions"}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 font-bold uppercase tracking-wider">
                <th className="pb-3 px-2">{isUz ? "O'quvchi" : "Student Name"}</th>
                <th className="pb-3 px-2">{isUz ? "Guruh / Kurs" : "Group / Course"}</th>
                <th className="pb-3 px-2">{isUz ? "Summa (UZS)" : "Amount (UZS)"}</th>
                <th className="pb-3 px-2">{isUz ? "To'lov Usuli" : "Payment Method"}</th>
                <th className="pb-3 px-2">{isUz ? "Holat" : "Status"}</th>
                <th className="pb-3 px-2">{isUz ? "Sana" : "Date"}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {[
                { name: "Jasur Rahimov", course: "IELTS 7.5+ Intensive", amount: "650,000 UZS", method: "Click", status: "paid", date: isUz ? "Bugun 10:45" : "Today 10:45" },
                { name: "Malika Sharipova", course: "General English B2", amount: "550,000 UZS", method: "Payme", status: "paid", date: isUz ? "Bugun 09:20" : "Today 09:20" },
                { name: "Sardor Bekmuratov", course: "IELTS Rocket 8.0", amount: "650,000 UZS", method: isUz ? "Naqd" : "Cash", status: "pending", date: isUz ? "Kechagacha" : "Yesterday" },
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
                        <Check className="w-3 h-3" /> {isUz ? "To'langan ✅" : "Paid ✅"}
                      </span>
                    )}
                    {row.status === 'pending' && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 font-bold text-[10px] border border-amber-500/20">
                        <Clock className="w-3 h-3" /> {isUz ? "Kutilmoqda ⏳" : "Pending ⏳"}
                      </span>
                    )}
                    {row.status === 'overdue' && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-rose-500/10 text-rose-600 dark:text-rose-400 font-bold text-[10px] border border-rose-500/20">
                        <XCircle className="w-3 h-3" /> {isUz ? "Qarzdor ❌" : "Overdue ❌"}
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
            {isUz ? "Markaz Monitoringi" : "Center Overview"}
          </span>
          <h3 className="text-lg font-extrabold mt-2">
            {isUz ? "Markaz Tushumi va Tizim Salomatligi" : "Center Revenue & System Health Overview"}
          </h3>
          <p className="text-xs text-slate-300 max-w-xl">
            {isUz
              ? "Markaz bo'yicha oylik to'lovlar 94% ko'rsatkichda yig'ildi. Firebase Firestore va Auth xizmatlari barqaror ishlamoqda."
              : "94% tuition fee collection rate achieved for current billing period. Firestore & Auth operating normally."}
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
  isUz: boolean;
  displayName: string;
  showToast: (msg: string) => void;
  groups: Group[];
  students: Student[];
}> = ({ isUz, showToast, groups, students }) => {
  return (
    <div className="space-y-6">
      {/* Metric Cards for Today's Schedule, Unmarked Attendance, Pending Homework, Avg Attendance */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title={isUz ? "Mening Guruhlarim" : "My Assigned Groups"}
          value={isUz ? `${groups.length} ta Guruh` : `${groups.length} Groups`}
          change="IELTS & General English"
          icon={<Calendar className="w-5 h-5 text-blue-500" />}
        />
        <StatCard
          title={isUz ? "Jami O'quvchilar" : "Enrolled Students"}
          value={isUz ? `${students.length} ta O'quvchi` : `${students.length} Students`}
          change={isUz ? "Barcha guruhlar" : "All rosters"}
          icon={<Clock className="w-5 h-5 text-amber-500" />}
        />
        <StatCard
          title={isUz ? "Tekshiriladigan Vazifa" : "Homework Pending Review"}
          value={isUz ? "12 ta Insho" : "12 Writing Essays"}
          change={isUz ? "IELTS Writing Task 2" : "IELTS Writing Task 2"}
          icon={<FileText className="w-5 h-5 text-rose-500" />}
        />
        <StatCard
          title={isUz ? "O'rtacha Davomat Ko'rsatkichi" : "Avg Attendance Rate"}
          value="96.4%"
          change={isUz ? "A'lo ko'rsatkich" : "High engagement"}
          icon={<Award className="w-5 h-5 text-emerald-500" />}
        />
      </div>


      {/* Teacher Quick Actions */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="text-sm font-extrabold text-slate-900 dark:text-white tracking-tight">
              {isUz ? "O'qituvchi Tezkor Amallar" : "Teacher Quick Actions"}
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              {isUz ? "Davomat, vazifalar va audio fayllarni yuklash" : "1-Tap attendance, audio uploads & essay grading"}
            </p>
          </div>
          <Sparkles className="w-4 h-4 text-blue-500" />
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <ActionButton
            icon={<Calendar className="w-4 h-4 text-blue-500" />}
            label={isUz ? "1-Tap Davomat" : "1-Tap Attendance Grid"}
            onClick={() => showToast(isUz ? "Davomat modali ochilmoqda..." : "Opening Attendance Grid...")}
          />
          <ActionButton
            icon={<FileText className="w-4 h-4 text-purple-500" />}
            label={isUz ? "Audio/Vazifa Yuklash" : "Upload Audio & Homework"}
            onClick={() => showToast(isUz ? "Media fayl biriktirish..." : "Opening Audio Upload Modal...")}
          />
          <ActionButton
            icon={<Award className="w-4 h-4 text-emerald-500" />}
            label={isUz ? "Insho Bahlash" : "Grade IELTS Writing"}
            onClick={() => showToast(isUz ? "Bahlash va ball qo'yish..." : "Opening Essay Gradebook...")}
          />
          <ActionButton
            icon={<Send className="w-4 h-4 text-amber-500" />}
            label={isUz ? "Guruhga Elon" : "Send Class Announcement"}
            onClick={() => showToast(isUz ? "Guruh xabari yuborilmoqda..." : "Sending announcement...")}
          />
        </div>
      </div>

      {/* Today's Schedule Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
              {isUz ? "Bugungi Dars Jadvali & Davomat Holati" : "Today's Schedule & Attendance Status"}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {isUz ? "Guruhlar bo'yicha vaqt va xonalar" : "Classes, timing & attendance tracker"}
            </p>
          </div>
          <span className="px-3 py-1 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 font-bold text-xs border border-blue-500/20">
            {isUz ? "3 ta Dars" : "3 Classes Today"}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 font-bold uppercase tracking-wider">
                <th className="pb-3 px-2">{isUz ? "Guruh" : "Group Name"}</th>
                <th className="pb-3 px-2">{isUz ? "Vaqt & Xona" : "Time & Room"}</th>
                <th className="pb-3 px-2">{isUz ? "Mavzu" : "Lesson Topic"}</th>
                <th className="pb-3 px-2">{isUz ? "Davomat Holati" : "Attendance Status"}</th>
                <th className="pb-3 px-2">{isUz ? "Amal" : "Action"}</th>
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
                        <CheckCircle2 className="w-3 h-3" /> {isUz ? "Olingan ✅" : "Taken ✅"}
                      </span>
                    )}
                    {row.status === 'pending' && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 font-bold text-[10px] border border-amber-500/20 animate-pulse">
                        <Clock className="w-3 h-3" /> {isUz ? "Kutilmoqda ⏳" : "Pending ⏳"}
                      </span>
                    )}
                    {row.status === 'upcoming' && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 font-bold text-[10px] border border-slate-200 dark:border-slate-700">
                        <Calendar className="w-3 h-3" /> {isUz ? "Rejada" : "Scheduled"}
                      </span>
                    )}
                  </td>
                  <td className="py-3.5 px-2">
                    <button
                      onClick={() => showToast(isUz ? `${row.name} uchun davomat rejimi...` : `Opening attendance for ${row.name}`)}
                      className="px-3 py-1 bg-blue-500 text-white rounded-xl text-[11px] font-bold hover:bg-blue-600 transition cursor-pointer"
                    >
                      {isUz ? "Belgilash" : "Mark Attendance"}
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
            {isUz ? "O'qituvchi Boshqaruvi" : "Teacher Class Monitor"}
          </span>
          <h3 className="text-lg font-extrabold mt-2">
            {isUz ? "Bugungi Darslar va Tekshirilmagan Insholar" : "Today's Schedule & Pending Writing Essays"}
          </h3>
          <p className="text-xs text-slate-300 mt-1">
            {isUz
              ? "Sizda bugun 3 ta guruh darsi va tekshirilishi kutilayotgan 12 ta IELTS Writing insholari bor."
              : "You have 3 active classes today and 12 pending IELTS Writing Task submissions to grade."}
          </p>
        </div>

        <button
          onClick={() => showToast(isUz ? "Insholarni bahlash rejimi..." : "Opening Essay Grading...")}
          className="px-4 py-2 bg-blue-500 text-white font-bold text-xs rounded-2xl shadow-lg hover:bg-blue-600 transition cursor-pointer shrink-0"
        >
          {isUz ? "Bahlashni Boshlash" : "Grade Essays"}
        </button>
      </div>
    </div>
  );
};

/* =========================================================================
   3. STUDENT DASHBOARD VIEW
   ========================================================================= */
export const StudentDashboardView: React.FC<{
  isUz: boolean;
  displayName: string;
  showToast: (msg: string) => void;
  onNavigate?: (tab: string) => void;
}> = ({ isUz, displayName, showToast, onNavigate }) => {
  const [isMockModalOpen, setIsMockModalOpen] = useState(false);

  return (
    <div className="space-y-6">
      {/* Metric Cards for Course Status, Homework Deadlines, Latest Mock Score, Attendance */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div
          onClick={() => {
            showToast(isUz ? "Guruh darslariga o'tilmoqda..." : "Opening Enrolled Course Details...");
            onNavigate?.('feed');
          }}
          className="cursor-pointer transition-transform hover:scale-[1.01]"
        >
          <StatCard
            title={isUz ? "Biriktirilgan Kurs" : "Enrolled Course"}
            value="IELTS 7.5+ Intensive"
            change={isUz ? "Xona 3 • Mr. Javohir" : "Room 3 • Mr. Javohir"}
            icon={<BookOpen className="w-5 h-5 text-amber-500" />}
          />
        </div>

        <div
          onClick={() => {
            showToast(isUz ? "Guruh vazifalariga o'tilmoqda..." : "Opening Homework List...");
            onNavigate?.('feed');
          }}
          className="cursor-pointer transition-transform hover:scale-[1.01]"
        >
          <StatCard
            title={isUz ? "Kutilayotgan Vazifa" : "Upcoming Assignments"}
            value={isUz ? "2 ta Topshiriq" : "2 Assignments Due"}
            change={isUz ? "Muddati: Ertaga 18:00" : "Due: Tomorrow 18:00"}
            icon={<Clock className="w-5 h-5 text-rose-500" />}
          />
        </div>

        <div
          onClick={() => {
            showToast(isUz ? "Mock test grafiklariga o'tilmoqda..." : "Opening IELTS Mock Analytics...");
            onNavigate?.('progress');
          }}
          className="cursor-pointer transition-transform hover:scale-[1.01]"
        >
          <StatCard
            title={isUz ? "So'nggi IELTS Mock Ball" : "Latest IELTS Mock Score"}
            value="Band 7.5 Overall"
            change="L: 8.0 | R: 7.5 | W: 7.0 | S: 7.5"
            icon={<Award className="w-5 h-5 text-emerald-500" />}
          />
        </div>

        <div
          onClick={() => {
            showToast(isUz ? "Davomat ko'rsatkichi a'lo darajada" : "Attendance record verified (98%)");
          }}
          className="cursor-pointer transition-transform hover:scale-[1.01]"
        >
          <StatCard
            title={isUz ? "Darsga Qatnashish" : "Attendance Record"}
            value="98% Attendance"
            change={isUz ? "A'lo intizom" : "Excellent track record"}
            icon={<CheckCircle2 className="w-5 h-5 text-blue-500" />}
          />
        </div>
      </div>

      {/* Student Quick Actions */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 sm:p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
              <span>{isUz ? "O'quvchi Tezkor Yordamchilar" : "Student Portal Tools"}</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                Interactive
              </span>
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
              {isUz ? "24/7 AI tutor, guruh topshiriqlari va mock imtihonlar portaliga kiring" : "24/7 AI tutor, homework feed, class standings & practice test hub"}
            </p>
          </div>
          <Sparkles className="w-4 h-4 text-amber-500" />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <ActionButton
            icon={<Bot className="w-5 h-5 text-amber-500" />}
            label={isUz ? "24/7 AI Tutor Yordamchi" : "Ask 24/7 AI Tutor"}
            subtitle={isUz ? "Instant AI response & speaking feedback" : "Instant AI feedback, essay grading & speaking"}
            badge="AI 24/7"
            onClick={() => {
              showToast(isUz ? "Opening 24/7 AI Tutor Chat ✨" : "Opening 24/7 AI Tutor Chat ✨");
              onNavigate?.('ai_tutor');
            }}
          />
          <ActionButton
            icon={<FileText className="w-5 h-5 text-blue-500" />}
            label={isUz ? "Guruh Vazifalari" : "View Class Homework"}
            subtitle={isUz ? "Topshiriqlar lentalari va yuklamalar" : "Check class feed, audio drills & assignments"}
            badge="Assignments"
            onClick={() => {
              showToast(isUz ? "Guruh topshiriqlariga o'tilmoqda..." : "Opening Homework Portal...");
              onNavigate?.('feed');
            }}
          />
          <ActionButton
            icon={<Award className="w-5 h-5 text-emerald-500" />}
            label={isUz ? "Guruh Reytingi" : "Check Leaderboard"}
            subtitle={isUz ? "Guruhdagi o'rin va XP ballar" : "Rankings, attendance streak & top scores"}
            badge="Top 3"
            onClick={() => {
              showToast(isUz ? "Guruh reytingiga o'tilmoqda..." : "Opening Class Leaderboard...");
              onNavigate?.('leaderboard');
            }}
          />
          <ActionButton
            icon={<Newspaper className="w-5 h-5 text-purple-500" />}
            label={isUz ? "Mock Test Yuklash" : "Mock Practice Tests"}
            subtitle={isUz ? "Real IELTS variantlar & mp3 mashqlar" : "Full IELTS & CEFR mock papers + audio drills"}
            badge="Exams"
            onClick={() => {
              showToast(isUz ? "Mock Test materiallari ochilmoqda..." : "Opening Practice Test Files...");
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
                    {isUz ? "IELTS & CEFR Mock Practice Hub" : "IELTS & CEFR Mock Practice Hub"}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {isUz ? "Haqiqiy imtihon formatidagi materiallar va audio mashqlar" : "Real exam format materials, audio drills & analytical keys"}
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
                  title: isUz ? "Full Mock IELTS #6 Academic Paper (PDF)" : "Full Mock IELTS #6 Academic Paper (PDF)",
                  desc: isUz ? "Listening, Reading Passage 1-3 va Writing Task 1/2" : "Full Listening 40 Qs, Reading 3 Passages & Writing 1/2",
                  tag: "Academic",
                  color: "amber"
                },
                {
                  title: isUz ? "IELTS Listening Audio Section 1-4 Drill" : "IELTS Listening Audio Section 1-4 Drill",
                  desc: isUz ? "Original audio yozuvlar va kalitlar (32 min MP3)" : "Full exam listening audio with timing & answer sheet",
                  tag: "Audio MP3",
                  color: "blue"
                },
                {
                  title: isUz ? "Band 8.0 Writing Essay Prompt Collection" : "Band 8.0 Writing Essay Prompt Collection",
                  desc: isUz ? "Automation & AI mavzusidagi 15 ta namuna insho" : "15 Model essays with examiner comments and vocabulary",
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
                        showToast(isUz ? "Fayl yuklab olindi ✅" : "Mock Material Downloaded ✅");
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
                        showToast(isUz ? "AI Tutor bilan test yechilmoqda..." : "Starting Mock in AI Tutor...");
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
                <span>{isUz ? "Barcha o'tgan Mock natijalarini ko'rish →" : "View all past mock score analytics →"}</span>
              </button>
              <button
                onClick={() => setIsMockModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-bold text-xs hover:bg-slate-300 dark:hover:bg-slate-700 transition cursor-pointer"
              >
                {isUz ? "Yopish" : "Close"}
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
              {isUz ? "Vazifalar & Mock Test Natijalari" : "Assignments & Mock Test Results"}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {isUz ? "Shaxsiy o'zlashtirish va baholar tarixi" : "Personal submission history & band scores"}
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
                <th className="pb-3 px-2">{isUz ? "Topshiriq / Imtihon" : "Assignment / Exam"}</th>
                <th className="pb-3 px-2">{isUz ? "Bo'lim" : "Skill / Subject"}</th>
                <th className="pb-3 px-2">{isUz ? "Muddati / Topshirilgan" : "Due / Taken On"}</th>
                <th className="pb-3 px-2">{isUz ? "Natija / Ball" : "Score / Band"}</th>
                <th className="pb-3 px-2">{isUz ? "Holat" : "Status"}</th>
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
                        <Check className="w-3 h-3" /> {isUz ? "Bahlangan ✅" : "Graded ✅"}
                      </span>
                    )}
                    {row.status === 'pending' && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 font-bold text-[10px] border border-amber-500/20 animate-pulse">
                        <Clock className="w-3 h-3" /> {isUz ? "Kutilmoqda ⏳" : "Pending ⏳"}
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Student Goal Banner */}
      <div className="p-6 rounded-3xl bg-gradient-to-br from-amber-500 via-amber-600 to-amber-700 text-slate-950 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <span className="px-3 py-1 rounded-full bg-slate-950/20 text-slate-950 font-bold text-xs uppercase tracking-wider">
            Renessans Student Portal
          </span>
          <h2 className="text-lg md:text-xl font-black mt-2">
            {isUz ? `Salom, ${displayName}!` : `Hello, ${displayName}!`}
          </h2>
          <p className="text-xs text-slate-900/80 mt-1 max-w-xl font-medium">
            {isUz
              ? "Keyingi darsingiz bugun soat 14:00 da (IELTS Intensive #12). Keyingi Mock IELTS imtihoni: Shanba 09:00."
              : "Your next class is today at 14:00 (IELTS Intensive #12). Next Full Mock IELTS Exam: Saturday 09:00."}
          </p>
        </div>
        <button
          onClick={() => {
            showToast(isUz ? "Opening 24/7 AI Tutor Chat ✨" : "Opening 24/7 AI Tutor Chat ✨");
            onNavigate?.('ai_tutor');
          }}
          className="px-4 py-2.5 bg-slate-950 hover:bg-slate-900 text-amber-400 rounded-2xl font-black text-xs shadow-md shrink-0 border border-amber-400/30 flex items-center gap-2 cursor-pointer transition"
        >
          <Sparkles className="w-4 h-4 text-amber-400" />
          <span>{isUz ? "AI Yordamchi bilan mashq" : "Launch AI Coach"}</span>
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
