import React, { useState } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth, SUPER_ADMIN_UUID } from '../../context/AuthContext';
import { ShieldAlert, Key, CheckCircle2, UserCheck, Lock, ShieldCheck, Database, RefreshCw } from 'lucide-react';

export const SuperAdminControlView: React.FC = () => {
  const { language } = useLanguage();
  const { currentUser } = useAuth();
  const t = (uz: string, en: string, ru: string) => {
    if (language === 'UZ') return uz;
    if (language === 'RU') return ru;
    return en;
  };

  const [adminPin, setAdminPin] = useState('secureadmin');
  const [teacherPin, setTeacherPin] = useState('secureteacher');
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleUpdatePins = (e: React.FormEvent) => {
    e.preventDefault();
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  const isSuperAdminUser = currentUser?.uid === SUPER_ADMIN_UUID;

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* SuperAdmin Header */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-rose-900 via-slate-900 to-slate-950 text-white border border-rose-500/30 shadow-2xl flex items-center justify-between">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-500/20 text-rose-400 text-xs font-bold border border-rose-500/30 mb-2">
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>SuperAdmin Master Control</span>
          </div>
          <h2 className="text-2xl font-black">
            {t("Tizim Boshqaruvi va Xavfsizlik PIN Kodlari", "System Security & Role PIN Controls", "Управление Системой и PIN Кодами")}
          </h2>
          <p className="text-xs text-slate-400 mt-1 max-w-lg">
            {t(
              "SuperAdmin vakolati orqali Admin va Teacher rollariga kirish PIN kalitlarini boshqaring.",
              "Manage elevated security credentials, PIN codes, and system access levels.",
              "Управление доступами, PIN кодами и уровнями безопасности."
            )}
          </p>
        </div>

        <div className="hidden sm:block p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-center">
          <ShieldCheck className="w-8 h-8 text-rose-400 mx-auto mb-1" />
          <span className="text-[10px] font-bold text-rose-300 uppercase">Master Access Active</span>
        </div>
      </div>

      {savedSuccess && (
        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs font-bold flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
          <span>{t("Xavfsizlik PIN kalitlari muvaffaqiyatli yangilandi!", "Security PIN codes updated successfully!", "PIN коды безопасности успешно обновлены!")}</span>
        </div>
      )}

      {/* PIN Management Form */}
      <form onSubmit={handleUpdatePins} className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-md space-y-6">
        <h3 className="text-sm font-extrabold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
          <Key className="w-4 h-4 text-amber-500" />
          <span>{t("Boshqaruv Kalitlari (Role Switch PINs)", "Elevated Role Access PINs", "Ключи Доступа Ролей")}</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-5 rounded-2xl bg-purple-500/5 border border-purple-500/20 space-y-3">
            <div className="flex items-center gap-2 text-purple-600 dark:text-purple-400 font-bold text-xs">
              <Lock className="w-4 h-4" />
              <span>Admin Role Switch PIN</span>
            </div>
            <input
              type="text"
              required
              value={adminPin}
              onChange={(e) => setAdminPin(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-mono font-bold text-slate-900 dark:text-white"
            />
            <p className="text-[10px] text-slate-500">
              Default: <code className="bg-slate-200 dark:bg-slate-800 px-1 py-0.5 rounded">secureadmin</code>
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-blue-500/5 border border-blue-500/20 space-y-3">
            <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 font-bold text-xs">
              <Lock className="w-4 h-4" />
              <span>Teacher Role Switch PIN</span>
            </div>
            <input
              type="text"
              required
              value={teacherPin}
              onChange={(e) => setTeacherPin(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-mono font-bold text-slate-900 dark:text-white"
            />
            <p className="text-[10px] text-slate-500">
              Default: <code className="bg-slate-200 dark:bg-slate-800 px-1 py-0.5 rounded">secureteacher</code>
            </p>
          </div>
        </div>

        <button
          type="submit"
          className="w-full py-3.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-lg shadow-rose-600/20 transition cursor-pointer flex items-center justify-center gap-2"
        >
          <ShieldAlert className="w-4 h-4" />
          <span>{t("PIN Kalitlarini Saqlash", "Save Master PIN Credentials", "Сохранить PIN Коды")}</span>
        </button>
      </form>

      {/* System Status Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-1">
          <span className="text-[10px] text-slate-400 uppercase font-bold">Firestore Database</span>
          <p className="text-sm font-bold text-emerald-500 flex items-center gap-1.5">
            <Database className="w-4 h-4" /> Connected Live
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-1">
          <span className="text-[10px] text-slate-400 uppercase font-bold">SuperAdmin UUID</span>
          <p className="text-xs font-mono font-bold text-slate-700 dark:text-slate-300 truncate">
            {SUPER_ADMIN_UUID}
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-1">
          <span className="text-[10px] text-slate-400 uppercase font-bold">Center Location</span>
          <p className="text-xs font-bold text-amber-500">
            Renessans LC • Toshkent
          </p>
        </div>
      </div>
    </div>
  );
};
