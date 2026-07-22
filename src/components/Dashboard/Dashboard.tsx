import React, { useState } from 'react';
import { useAuth, SUPER_ADMIN_UUID } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import {
  ShieldAlert,
  ShieldCheck,
  UserCheck,
  GraduationCap,
  Users,
  Award,
  BookOpen,
  Calendar,
  TrendingUp,
  DollarSign,
  CheckCircle2,
  Clock,
  Sparkles,
  Plus,
  ArrowUpRight,
  BarChart,
  FileText,
  AlertCircle,
  Key,
  CreditCard,
  Send,
  Newspaper,
  Lock,
  Search,
  Filter,
  Check,
  XCircle,
  AlertTriangle
} from 'lucide-react';
import { UserRole } from '../../types';

export const Dashboard: React.FC = () => {
  const { currentUser, userProfile, activeRole } = useAuth();
  const { language } = useLanguage();

  const isUz = language === 'UZ';
  const displayName = userProfile?.displayName || currentUser?.displayName || 'User';

  const [toastMessage, setToastMessage] = useState<string | null>(null);

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
                  HARDCODED RULE
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

      {/* SECTION 1: KPI SUMMARY METRIC CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title={isUz ? "Oylik Jami Tushum" : "Total Monthly Revenue"}
          value="48,500,000 UZS"
          change="+12% ushbu oy"
          icon={<DollarSign className="w-5 h-5 text-emerald-500" />}
          badgeColor="emerald"
        />
        <StatCard
          title={isUz ? "Faol O'quvchilar" : "Active Enrolled Students"}
          value="342 O'quvchi"
          change="+18 yangi birikma"
          icon={<GraduationCap className="w-5 h-5 text-amber-500" />}
          badgeColor="amber"
        />
        <StatCard
          title={isUz ? "Qarzdor O'quvchilar" : "Pending / Overdue Payments"}
          value="18 Qarzdor"
          change="Aktiv monitoring"
          icon={<AlertCircle className="w-5 h-5 text-rose-500" />}
          badgeColor="rose"
        />
        <StatCard
          title={isUz ? "Faol O'quv Guruhlari" : "Active Study Groups"}
          value="24 Guruh"
          change="IELTS & General English"
          icon={<BookOpen className="w-5 h-5 text-purple-500" />}
          badgeColor="purple"
        />
      </div>

      {/* SECTION 2: QUICK ACTION PANEL */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="text-sm font-extrabold text-slate-900 dark:text-white tracking-tight">
              {isUz ? "Tezkor Amallar Paneli" : "Quick Action Panel"}
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              {isUz ? "Kunlik operatsion topshiriqlarni tezkor bajaring" : "Execute common daily operational tasks instantly"}
            </p>
          </div>
          <Sparkles className="w-4 h-4 text-amber-500" />
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <ActionButton
            icon={<CreditCard className="w-4 h-4 text-emerald-500" />}
            label={isUz ? "To'lov Kiritish" : "Log Payment"}
            onClick={() => showToast(isUz ? "To'lov modali ochilmoqda..." : "Opening Log Payment Modal...")}
          />
          <ActionButton
            icon={<FileText className="w-4 h-4 text-blue-500" />}
            label={isUz ? "Vazifa Yaratish" : "Create Homework"}
            onClick={() => showToast(isUz ? "Vazifa biriktirish rejimi..." : "Opening Create Homework...")}
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
              onClick={() => showToast(isUz ? "PIN generator: 'secureadmin' / 'secureteacher'" : "Security PIN generated!")}
            />
          )}
        </div>
      </div>

      {/* SECTION 3: RECENT PAYMENT TRANSACTIONS TABLE */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
          <div>
            <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
              {isUz ? "So'nggi To'lov Operatsiyalari" : "Recent Payment Transactions"}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {isUz ? "Oylik kontrakt to'lovlari monitoringi" : "Live tuition & fee payment logs"}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold text-xs border border-emerald-500/20">
              {isUz ? "Jami 142 To'lov" : "142 Total Transactions"}
            </span>
          </div>
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
                { name: "Jasur Rahimov", course: "IELTS 7.5+ Intensive", amount: "650,000 UZS", method: "Click", status: "paid", date: "Bugun 10:45" },
                { name: "Malika Sharipova", course: "General English B2", amount: "550,000 UZS", method: "Payme", status: "paid", date: "Bugun 09:20" },
                { name: "Sardor Bekmuratov", course: "IELTS Rocket 8.0", amount: "650,000 UZS", method: "Naqd (Cash)", status: "pending", date: "Kechagacha" },
                { name: "Aziza Umarova", course: "CEFR B2 FastTrack", amount: "500,000 UZS", method: "Karta (Visa/Uzcard)", status: "paid", date: "20 Iyul" },
                { name: "Boburmirzo Alimov", course: "Kids Starter English", amount: "450,000 UZS", method: "Click", status: "overdue", date: "18 Iyul" }
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
                        <Check className="w-3 h-3" /> Paid ✅
                      </span>
                    )}
                    {row.status === 'pending' && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 font-bold text-[10px] border border-amber-500/20">
                        <Clock className="w-3 h-3" /> Pending ⏳
                      </span>
                    )}
                    {row.status === 'overdue' && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-rose-500/10 text-rose-600 dark:text-rose-400 font-bold text-[10px] border border-rose-500/20">
                        <XCircle className="w-3 h-3" /> Overdue ❌
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

      {/* SECTION 4: ROLE-SPECIFIC BANNER & PANELS */}
      {activeRole === 'superadmin' || activeRole === 'admin' ? (
        <AdminSystemBanner displayName={displayName} isUz={isUz} />
      ) : activeRole === 'teacher' ? (
        <TeacherClassesBanner displayName={displayName} isUz={isUz} />
      ) : (
        <StudentCourseBanner displayName={displayName} isUz={isUz} />
      )}
    </div>
  );
};

/* Helper Components */
const StatCard: React.FC<{
  title: string;
  value: string;
  change: string;
  icon: React.ReactNode;
  badgeColor: string;
}> = ({ title, value, change, icon }) => {
  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-sm transition-all hover:border-slate-300 dark:hover:border-slate-700">
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
  onClick: () => void;
}> = ({ icon, label, onClick }) => {
  return (
    <button
      onClick={onClick}
      className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 hover:bg-amber-500/10 border border-slate-200/80 dark:border-slate-700/60 hover:border-amber-500/30 flex items-center gap-3 text-xs font-bold text-slate-800 dark:text-slate-200 transition cursor-pointer group"
    >
      <div className="p-2 rounded-xl bg-white dark:bg-slate-900 shadow-sm group-hover:scale-110 transition">
        {icon}
      </div>
      <span className="truncate">{label}</span>
    </button>
  );
};

const AdminSystemBanner: React.FC<{ displayName: string; isUz: boolean }> = ({ isUz }) => {
  return (
    <div className="p-6 rounded-3xl bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white border border-slate-800 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
      <div className="space-y-1">
        <span className="px-3 py-1 rounded-full bg-amber-500/20 text-amber-400 font-bold text-xs uppercase tracking-wider border border-amber-500/30">
          Center Overview & Health
        </span>
        <h3 className="text-lg font-extrabold mt-2">
          {isUz ? "Markaz Tushumi va Tizim Salomatligi" : "Center Revenue & System Health Overview"}
        </h3>
        <p className="text-xs text-slate-300 max-w-xl">
          {isUz
            ? "Markaz bo'yicha oylik to'lovlar 94% ko'rsatkichda yig'ildi. Firestore hamda Auth xizmatlari barqaror ishlamoqda."
            : "94% tuition fee collection rate achieved for current billing period. Firestore & Auth status operating normally."}
        </p>
      </div>

      <div className="flex items-center gap-2">
        <span className="px-4 py-2 bg-slate-800 text-amber-400 font-mono text-xs font-bold rounded-2xl border border-slate-700">
          Status: Operational 🟢
        </span>
      </div>
    </div>
  );
};

const TeacherClassesBanner: React.FC<{ displayName: string; isUz: boolean }> = ({ isUz }) => {
  return (
    <div className="p-6 rounded-3xl bg-gradient-to-r from-blue-900 via-slate-900 to-slate-900 text-white border border-blue-800/40 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
      <div>
        <span className="px-3 py-1 rounded-full bg-blue-500/20 text-blue-400 font-bold text-xs uppercase tracking-wider border border-blue-500/30">
          Teacher Class Monitor
        </span>
        <h3 className="text-lg font-extrabold mt-2">
          {isUz ? "Bugungi Darslar va Tekshirilmagan Vazifalar" : "Today's Schedule & Pending Submissions"}
        </h3>
        <p className="text-xs text-slate-300 mt-1">
          {isUz
            ? "Sizda bugun 3 ta guruh darsi va tekshirilishi kutilayotgan 12 ta IELTS Writing insholari bor."
            : "You have 3 active classes today and 12 pending IELTS Writing Task submissions to grade."}
        </p>
      </div>

      <button className="px-4 py-2 bg-blue-500 text-white font-bold text-xs rounded-2xl shadow-lg hover:bg-blue-600 transition cursor-pointer">
        {isUz ? "Bahlashni Boshlash" : "Grade Homework"}
      </button>
    </div>
  );
};

const StudentCourseBanner: React.FC<{ displayName: string; isUz: boolean }> = ({ displayName, isUz }) => {
  return (
    <div className="p-6 rounded-3xl bg-gradient-to-br from-amber-500 via-amber-600 to-amber-700 text-slate-950 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
      <div>
        <span className="px-3 py-1 rounded-full bg-slate-950/20 text-slate-950 font-bold text-xs uppercase tracking-wider">
          Camelot Student Portal
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
      <div className="px-4 py-2 bg-slate-950 text-amber-400 rounded-2xl font-black text-xs shadow-md shrink-0 border border-amber-400/30">
        Target: IELTS 8.0
      </div>
    </div>
  );
};
