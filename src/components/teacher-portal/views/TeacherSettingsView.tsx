import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import {
  Settings,
  Bell,
  Globe,
  Info,
  Save,
  CheckCircle2,
  Building,
  User,
  Monitor,
  ChevronDown,
} from 'lucide-react';
import { useTeacherPortal } from '../../../context/TeacherPortalContext';
import { useTheme } from '../../../context/ThemeContext';
import { useAuth } from '../../../context/AuthContext';
import { BusinessModel } from '../../../types/teacher';

const CARD_STYLE = 'rounded-2xl border bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 p-6 shadow-sm';

const BUSINESS_MODELS: { value: BusinessModel; label: string; description: string }[] = [
  {
    value: 'learning_center',
    label: "O'quv Markazi",
    description: "Barcha to'lovlarni markaz o'zlashtiradi. O'qituvchiga faqat maosh to'lanadi.",
  },
  {
    value: 'teacher_collected',
    label: "O'qituvchi Yig'adi",
    description: "O'qituvchi o'quvchilardan to'lovlarni mustaqil yig'adi va hisobga oladi.",
  },
  {
    value: 'hybrid',
    label: 'Aralash',
    description: "Markaz va o'qituvchi birgalikda to'lovlarni boshqaradi.",
  },
];

export const TeacherSettingsView: React.FC = () => {
  const { theme } = useTheme();
  const { currentUser, activeRole } = useAuth();
  const { businessModel, setBusinessModel, teacherName, teacherUid } = useTeacherPortal();

  const SETTINGS_KEY = `renessans_teacher_settings_${teacherUid}`;

  const [selectedModel, setSelectedModel] = useState<BusinessModel>(businessModel);
  const [saved, setSaved] = useState(false);

  const [emailNotifications, setEmailNotifications] = useState(true);
  const [lessonReminders, setLessonReminders] = useState(true);
  const [paymentAlerts, setPaymentAlerts] = useState(true);

  const [language, setLanguage] = useState<'UZ' | 'EN' | 'RU'>('EN');
  const [compactMode, setCompactMode] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(SETTINGS_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        setEmailNotifications(parsed.emailNotifications ?? true);
        setLessonReminders(parsed.lessonReminders ?? true);
        setPaymentAlerts(parsed.paymentAlerts ?? true);
      }
    } catch {}
  }, [teacherUid]);

  const saveSettings = () => {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify({
      emailNotifications,
      lessonReminders,
      paymentAlerts,
    }));
    toast.success('Sozlamalar saqlandi');
  };

  const handleSaveBusinessModel = () => {
    setBusinessModel(selectedModel);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const currentModel = BUSINESS_MODELS.find((m) => m.value === selectedModel);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            Sozlamalar
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Tizim sozlamalari, bildirishnomalar va shaxsiy afzalliklar.
          </p>
        </div>

        {saved && (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold text-xs border border-emerald-500/20">
            <CheckCircle2 className="w-4 h-4" />
            <span>Sozlamalar saqlandi!</span>
          </div>
        )}
      </div>

      {/* Business Model */}
      <div className={CARD_STYLE}>
        <div className="flex items-center gap-2 mb-4">
          <Building className="w-4 h-4 text-amber-500" />
          <h3 className="text-sm font-black text-slate-900 dark:text-white">
            Biznes Modeli
          </h3>
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
          To'lovlarni boshqarish tartibini belgilang. Joriy model:{' '}
          <span className="font-bold text-amber-600 dark:text-amber-400">
            {BUSINESS_MODELS.find((m) => m.value === businessModel)?.label}
          </span>
        </p>

        <div className="space-y-2">
          {BUSINESS_MODELS.map((model) => (
            <label
              key={model.value}
              className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition ${
                selectedModel === model.value
                  ? 'border-amber-500/50 bg-amber-500/5'
                  : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
              }`}
            >
              <input
                type="radio"
                name="businessModel"
                value={model.value}
                checked={selectedModel === model.value}
                onChange={() => setSelectedModel(model.value)}
                className="mt-0.5 accent-amber-500"
              />
              <div>
                <span className="text-sm font-bold text-slate-900 dark:text-white block">
                  {model.label}
                </span>
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  {model.description}
                </span>
              </div>
            </label>
          ))}
        </div>

        {selectedModel !== businessModel && (
          <button
            onClick={handleSaveBusinessModel}
            className="mt-4 px-4 py-2 rounded-xl bg-amber-500 text-white font-bold text-xs flex items-center gap-2 hover:bg-amber-600 transition cursor-pointer"
          >
            <Save className="w-3.5 h-3.5" />
            Modelni Saqlash
          </button>
        )}
      </div>

      {/* Notification Preferences */}
      <div className={CARD_STYLE}>
        <div className="flex items-center gap-2 mb-4">
          <Bell className="w-4 h-4 text-blue-500" />
          <h3 className="text-sm font-black text-slate-900 dark:text-white">
            Bildirishnomalar
          </h3>
        </div>

        <div className="space-y-3">
          <label className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 cursor-pointer">
            <div>
              <span className="text-sm font-bold text-slate-900 dark:text-white block">
                Email bildirishnomalar
              </span>
              <span className="text-[11px] text-slate-500 dark:text-slate-400">
                Yangi o'quvchilar va to'lovlar haqida email xabarlar
              </span>
            </div>
            <div
              className={`relative w-10 h-5 rounded-full transition cursor-pointer ${
                emailNotifications ? 'bg-blue-500' : 'bg-slate-300 dark:bg-slate-600'
              }`}
              onClick={() => setEmailNotifications(!emailNotifications)}
            >
              <div
                className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${
                  emailNotifications ? 'translate-x-5' : 'translate-x-0.5'
                }`}
              />
            </div>
          </label>

          <label className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 cursor-pointer">
            <div>
              <span className="text-sm font-bold text-slate-900 dark:text-white block">
                Dars eslatmalari
              </span>
              <span className="text-[11px] text-slate-500 dark:text-slate-400">
                Dars boshlanishidan oldin eslatma olish
              </span>
            </div>
            <div
              className={`relative w-10 h-5 rounded-full transition cursor-pointer ${
                lessonReminders ? 'bg-blue-500' : 'bg-slate-300 dark:bg-slate-600'
              }`}
              onClick={() => setLessonReminders(!lessonReminders)}
            >
              <div
                className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${
                  lessonReminders ? 'translate-x-5' : 'translate-x-0.5'
                }`}
              />
            </div>
          </label>

          <label className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 cursor-pointer">
            <div>
              <span className="text-sm font-bold text-slate-900 dark:text-white block">
                To'lov ogohlantirishlari
              </span>
              <span className="text-[11px] text-slate-500 dark:text-slate-400">
                To'lov muddati o'tganda ogohlantirish olish
              </span>
            </div>
            <div
              className={`relative w-10 h-5 rounded-full transition cursor-pointer ${
                paymentAlerts ? 'bg-blue-500' : 'bg-slate-300 dark:bg-slate-600'
              }`}
              onClick={() => setPaymentAlerts(!paymentAlerts)}
            >
              <div
                className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${
                  paymentAlerts ? 'translate-x-5' : 'translate-x-0.5'
                }`}
              />
            </div>
          </label>
        </div>

        <button
          onClick={saveSettings}
          className="mt-2 px-4 py-2 rounded-xl bg-blue-500 text-white font-bold text-xs flex items-center gap-2 hover:bg-blue-600 transition cursor-pointer"
        >
          <Save className="w-3.5 h-3.5" />
          Saqlash
        </button>
      </div>

      {/* Display Preferences */}
      <div className={CARD_STYLE}>
        <div className="flex items-center gap-2 mb-4">
          <Monitor className="w-4 h-4 text-purple-500" />
          <h3 className="text-sm font-black text-slate-900 dark:text-white">
            Ko'rinish Sozlamalari
          </h3>
        </div>

        <div className="space-y-4">
          {/* Language */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
              Til
            </label>
            <div className="relative">
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value as 'UZ' | 'EN' | 'RU')}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-bold text-sm appearance-none cursor-pointer"
              >
                <option value="UZ">O'zbek tili</option>
                <option value="EN">English</option>
                <option value="RU">Русский</option>
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            </div>
            <p className="text-[10px] text-slate-400 mt-1 italic">
              Tez orada qo'shiladi
            </p>
          </div>

          {/* Compact Mode */}
          <label className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 cursor-pointer">
            <div>
              <span className="text-sm font-bold text-slate-900 dark:text-white block">
                Kompekt Rejim
              </span>
              <span className="text-[11px] text-slate-500 dark:text-slate-400">
                Kichikroq elementlar va kamroq bo'sh joy
              </span>
            </div>
            <div
              className={`relative w-10 h-5 rounded-full transition cursor-pointer ${
                compactMode ? 'bg-purple-500' : 'bg-slate-300 dark:bg-slate-600'
              }`}
              onClick={() => setCompactMode(!compactMode)}
            >
              <div
                className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${
                  compactMode ? 'translate-x-5' : 'translate-x-0.5'
                }`}
              />
            </div>
          </label>
        </div>
      </div>

      {/* About */}
      <div className={CARD_STYLE}>
        <div className="flex items-center gap-2 mb-4">
          <Info className="w-4 h-4 text-emerald-500" />
          <h3 className="text-sm font-black text-slate-900 dark:text-white">
            Dastur Haqida
          </h3>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Dastur Versiyasi
            </span>
            <span className="text-sm font-black text-slate-900 dark:text-white font-mono">
              CenterFlow v1.0
            </span>
          </div>

          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Joriy Roli
            </span>
            <span className="px-2.5 py-1 rounded-full text-xs font-black bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
              {activeRole || 'O\'qituvchi'}
            </span>
          </div>

          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Foydalanuvchi
            </span>
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-[9px] font-bold">
                {teacherName.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()}
              </div>
              <span className="text-sm font-bold text-slate-900 dark:text-white">
                {currentUser?.displayName || teacherName}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
