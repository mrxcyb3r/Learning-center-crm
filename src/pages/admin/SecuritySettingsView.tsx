import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { Settings, Lock, MapPin, Phone, MessageCircle, Save, CheckCircle2, ShieldCheck, Key, GraduationCap, UserCheck, Loader2, Send } from 'lucide-react';
import { subscribeSecurityPins, saveSecurityPins, SecurityPinsData } from '../../services/firestore';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { SUPER_ADMIN_UID } from '../../context/AuthContext';
import { toast } from 'react-toastify';
import { TelegramAdminPanel } from '../../components/admin/TelegramAdminPanel';
import { SecurityMonitorPanel } from '../../components/admin/SecurityMonitorPanel';

export const SecuritySettingsView: React.FC = () => {
  const { language } = useLanguage();
  const t = (uz: string, en: string, ru: string) => {
    if (language === 'UZ') return uz;
    if (language === 'RU') return ru;
    return en;
  };

  const [centerName, setCenterName] = useState('Renessans Learning Center');
  const [address, setAddress] = useState('Toshkent / Markaziy Filial');
  const [phone, setPhone] = useState('+998 90 123 45 67');
  const [telegram, setTelegram] = useState('@renessans_lc_official');

  const [adminPin, setAdminPin] = useState('secureadmin');
  const [teacherPin, setTeacherPin] = useState('secureteacher');
  const [studentPin, setStudentPin] = useState('securestudent');

  const [isSaving, setIsSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Load real-time PIN codes from Firestore doc settings/security_pins
  useEffect(() => {
    const unsub = subscribeSecurityPins((pins: SecurityPinsData) => {
      setAdminPin(pins.adminPin || 'secureadmin');
      setTeacherPin(pins.teacherPin || 'secureteacher');
      setStudentPin(pins.studentPin || 'securestudent');
    });
    return () => unsub();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await saveSecurityPins({
        adminPin: adminPin.trim() || 'secureadmin',
        teacherPin: teacherPin.trim() || 'secureteacher',
        studentPin: studentPin.trim() || 'securestudent'
      });

      // Update Super Admin user metadata document alongside PIN settings
      try {
        await setDoc(
          doc(db, 'users', SUPER_ADMIN_UID),
          {
            uid: SUPER_ADMIN_UID,
            role: 'superadmin',
            displayName: 'Super Admin',
            email: 'admin@admin.com',
            centerName,
            updatedAt: new Date().toISOString()
          },
          { merge: true }
        );
      } catch (adminErr) {
        console.warn('Super Admin user doc update warning:', adminErr);
      }

      setSavedSuccess(true);
      toast.success(t("Sozlamalar va PIN kodlar saqlandi!", "Settings & PIN codes saved!", "Настройки и PIN коды сохранены!"));
      setTimeout(() => setSavedSuccess(false), 3000);
    } catch (err) {
      console.error('Save security pins error:', err);
      toast.error(t("Saqlashda xatolik yuz berdi", "Error saving settings", "Ошибка сохранения"));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="p-6 rounded-3xl bg-slate-900 text-white border border-slate-800 shadow-xl flex items-center justify-between">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 text-amber-400 text-xs font-bold border border-amber-500/30 mb-2">
            <Settings className="w-3.5 h-3.5" />
            <span>{t("Platform Sozlamalari", "Platform Settings", "Настройки Платформы")}</span>
          </div>
          <h2 className="text-2xl font-black">
            {t("Markaz Profil va Xavfsizlik Sozlamalari", "Center Profile & Security Settings", "Профиль Центра и Настройки Безопасности")}
          </h2>
          <p className="text-xs text-slate-400 mt-1 max-w-lg">
            {t(
              "Markaz rekvizitlari, kontakt ma'lumotlari hamda xodimlarning kirish PIN kodlarini sozlang.",
              "Manage organization contact info and system security PIN codes for Admins, Teachers, and Students.",
              "Управление контактными данными и PIN кодами доступа для Администраторов, Преподавателей и Студентов."
            )}
          </p>
        </div>
      </div>

      {savedSuccess && (
        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs font-bold flex items-center gap-2 animate-fadeIn">
          <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
          <span>{t("Sozlamalar va PIN kodlar muvaffaqiyatli yangilandi va Firestore ga saqlandi!", "Settings & PIN codes updated successfully in Firestore!", "Настройки и PIN коды успешно обновлены в Firestore!")}</span>
        </div>
      )}

      {/* Settings Form */}
      <form onSubmit={handleSave} className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-md space-y-6">
        <h3 className="text-sm font-extrabold text-slate-900 dark:text-white uppercase tracking-wider">
          {t("Markaz Ma'lumotlari", "Center Information", "Информация о Центре")}
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              {t("Markaz Nomi", "Center Name", "Название Центра")}
            </label>
            <input
              type="text"
              required
              value={centerName}
              onChange={(e) => setCenterName(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              {t("Manzil", "Address", "Адрес")}
            </label>
            <input
              type="text"
              required
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              {t("Telefon Raqam", "Phone Number", "Номер Телефона")}
            </label>
            <input
              type="text"
              required
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              {t("Telegram Kanal / Admin", "Telegram Channel / Admin", "Telegram Канал / Админ")}
            </label>
            <input
              type="text"
              required
              value={telegram}
              onChange={(e) => setTelegram(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500"
            />
          </div>
        </div>

        {/* SECURITY PIN CODES 3-COLUMN GRID */}
        <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
          <h3 className="text-sm font-extrabold text-slate-900 dark:text-white uppercase tracking-wider mb-2 flex items-center gap-2">
            <Lock className="w-4 h-4 text-amber-500" />
            <span>{t("Xavfsizlik PIN Kodlari", "Security PIN Codes", "PIN Коды Безопасности")}</span>
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
            {t(
              "Rol va avtorizatsiya darajalariga ko'ra tizimga kirish uchun maxfiy kalitlar.",
              "Role-based security passcodes stored persistently in doc(db, 'settings', 'security_pins').",
              "Секретные PIN-коды авторизации для каждой роли."
            )}
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Admin PIN */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80">
              <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-purple-500" />
                <span>{t("Admin kirish PIN kodi", "Admin Access PIN", "PIN-код для Администраторов")}</span>
              </label>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mb-2">
                {t("Admin va SuperAdmin kirish PIN kodi", "Passcode for Admin role", "PIN для Администраторов")}
              </p>
              <div className="relative">
                <Key className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  value={adminPin}
                  onChange={(e) => setAdminPin(e.target.value)}
                  placeholder="secureadmin"
                  className="w-full pl-9 pr-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-mono font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500"
                />
              </div>
            </div>

            {/* Teacher PIN */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80">
              <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1 flex items-center gap-1.5">
                <UserCheck className="w-4 h-4 text-blue-500" />
                <span>{t("O'qituvchi kirish PIN kodi", "Teacher Access PIN", "PIN-код для Преподавателей")}</span>
              </label>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mb-2">
                {t("O'qituvchi kirish PIN kodi", "Passcode for Teacher role", "PIN для Преподавателей")}
              </p>
              <div className="relative">
                <Key className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  value={teacherPin}
                  onChange={(e) => setTeacherPin(e.target.value)}
                  placeholder="secureteacher"
                  className="w-full pl-9 pr-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-mono font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500"
                />
              </div>
            </div>

            {/* Student PIN */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80">
              <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1 flex items-center gap-1.5">
                <GraduationCap className="w-4 h-4 text-emerald-500" />
                <span>{t("O'quvchi kirish PIN kodi", "Student Access PIN", "PIN-код доступа для студентов")}</span>
              </label>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mb-2">
                {t("O'quvchi kirish PIN kodi (Boshlang'ich: securestudent)", "Passcode for Student role (Default: securestudent)", "PIN для Студентов (По умолчанию: securestudent)")}
              </p>
              <div className="relative">
                <Key className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  value={studentPin}
                  onChange={(e) => setStudentPin(e.target.value)}
                  placeholder="securestudent"
                  className="w-full pl-9 pr-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-mono font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500"
                />
              </div>
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={isSaving}
          className="w-full py-3.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-lg shadow-amber-500/20 transition cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {isSaving ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>{t("Saqlanmoqda...", "Saving Settings...", "Сохранение...")}</span>
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              <span>{t("Sozlamalarni Saqlash", "Save All Settings", "Сохранить Все Настройки")}</span>
            </>
          )}
        </button>
      </form>

      {/* TELEGRAM BOT ADMINISTRATOR MANAGEMENT SUITE */}
      <div className="pt-8 border-t border-slate-200 dark:border-slate-800 space-y-8">
        <TelegramAdminPanel />
        <SecurityMonitorPanel />
      </div>
    </div>
  );
};
