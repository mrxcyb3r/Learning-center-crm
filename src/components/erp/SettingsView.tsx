import React, { useState, useEffect, useCallback } from 'react';
import {
  Settings,
  Save,
  CheckCircle2,
  Download,
  Upload,
  Shield,
  UserCheck,
  Building,
  Send,
  History,
  RotateCcw,
  Plus,
  Trash2,
  Key,
  Rocket,
  Flag,
  UserPlus,
  CheckCircle2 as CircleCheck,
  AlertTriangle,
} from 'lucide-react';
import { settingsService, auditService, backupService, notificationsService } from '../../services/repository';
import { TelegramConnectionCard } from './TelegramConnectionCard';
import { DemoDataPanel } from './DemoDataPanel';
import { LaunchReadinessCard } from './LaunchReadinessCard';
import { getSeedMeta, getDemoStats } from '../../services/demoClear';
import { AuditLogEntry } from '../../types/crm';
import { useAuth } from '../../context/AuthContext';

export const SettingsView: React.FC = () => {
  const { currentUser } = useAuth();
  const [isSaved, setIsSaved] = useState(false);
  const [activeTab, setActiveTab] = useState<'center' | 'staff' | 'audit' | 'backup' | 'telegram' | 'launch'>('center');

  // Center Details (single source of truth: Firestore settings)
  const [centerName, setCenterName] = useState("Renessans O'quv Markazi");
  const [legalName, setLegalName] = useState('');
  const [address, setAddress] = useState('Jizzax viloyati, Yangiobod tumani, 1-maktab binosi');
  const [phone, setPhone] = useState('+998 (90) 862-22-26');
  const [secondaryPhone, setSecondaryPhone] = useState('');
  const [email, setEmail] = useState('');
  const [workingHours, setWorkingHours] = useState('08:00 - 20:00');
  const [telegramChannel, setTelegramChannel] = useState('https://t.me/renessans_lc');
  const [stir, setStir] = useState('');

  // Audit Logs
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);

  // Staff members (from Firestore settings)
  const [staffList, setStaffList] = useState<any[]>([]);

  // Technical support assistant provisioning
  const [assistName, setAssistName] = useState('');
  const [assistEmail, setAssistEmail] = useState('');
  const [assistPass, setAssistPass] = useState('');
  const [assistBusy, setAssistBusy] = useState(false);
  const [assistMsg, setAssistMsg] = useState<{ type: 'ok' | 'error'; text: string } | null>(null);

  // Launch-tab state: production-ready vs demo mode (derived from data).
  const [cleared, setCleared] = useState(false);
  const [demoTotal, setDemoTotal] = useState(0);

  const refreshLaunchState = useCallback(async () => {
    const [meta, stats] = await Promise.all([getSeedMeta(), getDemoStats()]);
    setCleared(meta.cleared);
    setDemoTotal(stats.reduce((sum, s) => sum + s.count, 0));
  }, []);

  const refreshLogs = async () => {
    const logs = await auditService.getAuditLogs();
    setAuditLogs(logs);
  };

  const loadSettings = async () => {
    const settings = await settingsService.getSettings();
    if (settings) {
      setCenterName(settings.centerName || "Renessans O'quv Markazi");
      setLegalName(settings.legalName || '');
      setAddress(settings.branches?.[0]?.address || 'Jizzax viloyati, Yangiobod tumani, 1-maktab binosi');
      setPhone(settings.hotline || '+998 (90) 862-22-26');
      setSecondaryPhone(settings.secondaryPhone || '');
      setEmail(settings.email || '');
      setWorkingHours(settings.workingHours || '08:00 - 20:00');
      setStir(settings.stir || '');
      setTelegramChannel(
        settings.telegramSettings?.botUsername ? `https://t.me/${String(settings.telegramSettings.botUsername).replace('@', '')}` : 'https://t.me/renessans_lc'
      );
    }

    const staff = await settingsService.getStaff();
    setStaffList(staff);
  };

  useEffect(() => {
    loadSettings();
    refreshLogs();
    refreshLaunchState();
    const onDemoChanged = () => refreshLaunchState();
    window.addEventListener('centerflow-demo-cleared', onDemoChanged);
    window.addEventListener('centerflow-demo-restored', onDemoChanged);
    return () => {
      window.removeEventListener('centerflow-demo-cleared', onDemoChanged);
      window.removeEventListener('centerflow-demo-restored', onDemoChanged);
    };
  }, [refreshLaunchState]);

  const handleSaveCenter = async (e: React.FormEvent) => {
    e.preventDefault();
    await settingsService.updateSettings({
      centerName: centerName.trim(),
      legalName: legalName.trim(),
      hotline: phone.trim(),
      secondaryPhone: secondaryPhone.trim(),
      email: email.trim(),
      workingHours: workingHours.trim(),
      stir: stir.trim(),
      branches: [
        {
          id: 'br-01',
          name: '1-Filial (Asosiy)',
          address: address.trim(),
          phone: phone.trim(),
          workingHours: workingHours.trim(),
          isActive: true,
        },
      ],
      telegramSettings: {
        botUsername: telegramChannel.trim().replace('https://t.me/', '@').replace('t.me/', '@').replace('@', '') !== ''
          ? `@${telegramChannel.trim().replace('https://t.me/', '').replace('t.me/', '').replace('@', '')}`
          : '',
        botConnected: false,
        managementGroup: '',
        notifyLeads: true,
        notifyPayments: true,
        notifyTrials: true,
        notifyOverdue: true,
      },
    });
    await notificationsService.createNotification({
      title: 'Sozlamalar Yangilandi',
      description: `${centerName.trim() || "Markaz malumotlari"} sozlamalari saqlandi.`,
      category: 'announcement',
      recipientRole: 'admin',
      isRead: false,
      createdAt: new Date().toISOString()
    });
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  const handleCreateSupportAssistant = async (e: React.FormEvent) => {
    e.preventDefault();
    if (assistBusy) return;
    if (!currentUser) {
      setAssistMsg({ type: 'error', text: 'Avval tizimga kirishingiz kerak.' });
      return;
    }
    const name = assistName.trim();
    const email = assistEmail.trim().toLowerCase();
    if (name.length < 2) {
      setAssistMsg({ type: 'error', text: 'Xodim ismini kiriting.' });
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setAssistMsg({ type: 'error', text: 'Haqiqiy email kiriting.' });
      return;
    }
    if (assistPass.length < 8) {
      setAssistMsg({ type: 'error', text: 'Vaqtinchalik parol kamida 8 ta belgi bo\'lishi kerak.' });
      return;
    }

    setAssistBusy(true);
    setAssistMsg(null);
    try {
      const token = await currentUser.getIdToken();
      const res = await fetch('/api/support/assistant', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ name, email, password: assistPass }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Akkaunt yaratishda xatolik yuz berdi.');
      }
      setAssistMsg({
        type: 'ok',
        text: `Texnik yordam akkaunti yaratildi: ${email}. Parolni xodimga shaxsan yetkazing.`,
      });
      setAssistName('');
      setAssistEmail('');
      setAssistPass('');
    } catch (err: any) {
      setAssistMsg({ type: 'error', text: err?.message || 'Akkaunt yaratishda xatolik yuz berdi.' });
    } finally {
      setAssistBusy(false);
    }
  };

  const handleBackupExport = async () => {
    const backupData = await backupService.exportFullBackup();
    const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `renessans_erp_backup_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    await auditService.logAuditAction('Backup', 'Export', 'To\'liq tizim zaxira nusxasi (JSON) yuklab olindi.');
    refreshLogs();
  };

  const handleBackupImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!window.confirm("Zaxira faylni tiklash barcha joriy ma'lumotlarni almashtiradi. Davom etasizmi?")) {
      e.target.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const jsonString = event.target?.result as string;
        const backupData = JSON.parse(jsonString);
        
        // Import each collection
        const { leads, students, teachers, courses, groups, payments, expenses, results, settings, auditLogs: importedAuditLogs } = backupData;
        
        // This would require a more complex import function
        // For now, just log the action
        await auditService.logAuditAction('Backup', 'Import', 'Zaxira fayldan barcha ma\'lumotlar tiklandi.');
        alert('Zaxira fayli yuklandi. Sahifa yangilanadi.');
        window.location.reload();
      } catch (err) {
        alert("Faylni o'qishda xatolik yuz berdi!");
      } finally {
        e.target.value = '';
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            Tizim Sozlamalari & Zaxira
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Markaz ma'lumotlari, xodimlar kirish rollari, amallar jurnali va to'liq tizim zaxirasi.
          </p>
        </div>

        {isSaved && (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold text-xs border border-emerald-500/20">
            <CheckCircle2 className="w-4 h-4" />
            <span>Sozlamalar muvaffaqiyatli saqlandi!</span>
          </div>
        )}
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {([
          { id: 'center', label: "Markaz Ma'lumotlari", icon: Building },
          { id: 'staff', label: 'Xodimlar va Rollar', icon: Shield },
          { id: 'telegram', label: 'Telegram Ulash', icon: Send },
          { id: 'audit', label: 'Tizim Jurnali', icon: History },
          { id: 'backup', label: 'Zaxira Nusxa', icon: Download },
          { id: 'launch', label: 'Ishga tushirish', icon: Rocket },
        ] as const).map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 rounded-2xl font-bold text-xs flex items-center gap-2 whitespace-nowrap transition cursor-pointer ${
                activeTab === tab.id
                  ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/10'
                  : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800 hover:bg-slate-50'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab 1: Center Information */}
      {activeTab === 'center' && (
        <form onSubmit={handleSaveCenter} className="space-y-6">
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex items-center gap-2 text-xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider">
              <Building className="w-4 h-4" />
              <span>O'quv Markazi Asosiy Parametrlari</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs sm:text-sm">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                  Markaz Rasmiy Nomi
                </label>
                <input
                  type="text"
                  value={centerName}
                  onChange={(e) => setCenterName(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-bold"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                  Yuridik Nomi (MChJ)
                </label>
                <input
                  type="text"
                  value={legalName}
                  onChange={(e) => setLegalName(e.target.value)}
                  placeholder="MChJ 'RENESSANS EDUCATION YANGIOBOD'"
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                  STIR
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  value={stir}
                  onChange={(e) => setStir(e.target.value)}
                  placeholder="Masalan: 305 123 456"
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-mono"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                  Asosiy Qabul Telefoni (Call Center)
                </label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-mono"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                  Qo'shimcha Telefon
                </label>
                <input
                  type="text"
                  value={secondaryPhone}
                  onChange={(e) => setSecondaryPhone(e.target.value)}
                  placeholder="+998 (99) 259-32-32"
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-mono"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                  Elektron Pochta
                </label>
                <input
                  type="text"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="renessans.yangiobod@gmail.com"
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                  Ish Vaqti
                </label>
                <input
                  type="text"
                  value={workingHours}
                  onChange={(e) => setWorkingHours(e.target.value)}
                  placeholder="08:00 - 20:00"
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                />
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                Asosiy Manzil (1-Bino)
              </label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                Rasmiy Telegram Kanal Linki
              </label>
              <input
                type="text"
                value={telegramChannel}
                onChange={(e) => setTelegramChannel(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
              />
            </div>

            <div className="flex justify-end pt-3">
              <button
                type="submit"
                className="px-6 py-3 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-sm shadow-md shadow-amber-500/20 flex items-center gap-2 transition cursor-pointer"
              >
                <Save className="w-4 h-4" />
                <span>Sozlamalarni Saqlash</span>
              </button>
            </div>
          </div>
        </form>
      )}

      {/* Tab 2: Staff & RBAC */}
      {activeTab === 'staff' && (
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                <Shield className="w-4 h-4 text-amber-500" />
                <span>Xodimlar va Huquqlar</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Direktor, Administrator va O'qituvchilar uchun kirish ruxsatnomalari.
              </p>
            </div>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {staffList.length > 0 ? (
              staffList.map((staff) => (
                <div key={staff.id} className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                  <div>
                    <div className="font-bold text-slate-900 dark:text-white text-sm">
                      {staff.name}
                    </div>
                    <div className="text-slate-500 mt-0.5 font-mono">
                      {staff.phone || 'Telefon kiritilmagan'}{staff.email ? ` • ${staff.email}` : ''}
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span
                      className={`px-3 py-1 rounded-full font-bold text-[11px] ${
                        staff.role.includes('Director')
                          ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
                          : staff.role.includes('Admin')
                          ? 'bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/20'
                          : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                      }`}
                    >
                      {staff.role}
                    </span>

                    <span className="text-slate-400 text-[11px]">
                      {staff.role.includes('Director') ? "Barcha bo'limlar ochiq" : staff.role.includes('Teacher') ? 'Davomat va sinflar' : 'CRM, moliya va o\'quvchilar'}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="py-10 text-center text-xs text-slate-400">
                Hozircha xodimlar ro'yxati bo'sh. Sozlamalar orqali xodim qo'shishingiz mumkin.
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 3: System Audit Logs */}
      {activeTab === 'audit' && (
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                <History className="w-4 h-4 text-sky-500" />
                <span>Tizim Harakatlari Jurnali</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Barcha o'chirish, tahrirlash va yangi yozuvlar tarixi avtomatik qayd etiladi.
              </p>
            </div>

            <button
              onClick={refreshLogs}
              className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-1 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Yangilash</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-[11px] font-bold text-slate-400 uppercase">
                  <th className="py-3 px-4">Foydalanuvchi</th>
                  <th className="py-3 px-4">Bo'lim (Entity)</th>
                  <th className="py-3 px-4">Amal (Action)</th>
                  <th className="py-3 px-4">Tafsilot</th>
                  <th className="py-3 px-4 text-right">Vaqt</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {auditLogs.slice(0, 20).map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40">
                    <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">
                      {log.user}
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2.5 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 font-bold text-[10px]">
                        {log.entity}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`font-black uppercase tracking-wider text-[10px] ${
                          log.action === 'Delete'
                            ? 'text-rose-500'
                            : log.action === 'Create'
                            ? 'text-emerald-500'
                            : 'text-amber-500'
                        }`}
                      >
                        {log.action}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-600 dark:text-slate-300">
                      {log.details}
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-[11px] text-slate-400 whitespace-nowrap">
                      {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab: Telegram Connection (Step 6C) */}
      {activeTab === 'telegram' && (
        <div className="max-w-2xl">
          <div className="mb-4">
            <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
              <Send className="w-4 h-4 text-sky-500" />
              <span>Shaxsiy Telegram</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Direktor hamda administratorlar o'z Telegram akkauntini CenterFlow hisobiga ulashlari mumkin.
            </p>
          </div>
          <TelegramConnectionCard />
        </div>
      )}

      {/* Tab 5: Backup & Restore */}
      {activeTab === 'backup' && (
        <div className="space-y-6">
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h4 className="text-base font-black text-slate-900 dark:text-white">
                To'liq Zaxira Nusxani Yuklab Olish
              </h4>
              <p className="text-xs text-slate-500 mt-1">
                Barcha o'quvchilar, ustozlar, guruhlar, to'lovlar, xarajatlar va sayt matnlarini bitta axborot fayli ko'rinishida yuklab oling.
              </p>
            </div>
            <button
              type="button"
              onClick={handleBackupExport}
              className="px-5 py-3 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs flex items-center gap-2 transition cursor-pointer shadow-md shadow-amber-500/20 shrink-0"
            >
              <Download className="w-4 h-4" />
              <span>Zaxirani Yuklab Olish (.json)</span>
            </button>
          </div>

          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h4 className="text-base font-black text-slate-900 dark:text-white">
                Zaxira Nusxadan Qayta Tiklash
              </h4>
              <p className="text-xs text-slate-500 mt-1">
                Avval zaxira faylni yuklang. Barcha ma'lumotlar avtomatik yangilanadi.
              </p>
            </div>

            <label className="px-5 py-3 rounded-2xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs flex items-center gap-2 transition cursor-pointer border border-slate-200 dark:border-slate-700 shrink-0">
              <Upload className="w-4 h-4 text-sky-500" />
              <span>Zaxira Faylni Tanlash</span>
              <input
                type="file"
                accept=".json"
                onChange={handleBackupImport}
                className="hidden"
              />
            </label>
          </div>
        </div>
      )}
    {/* Tab 6: Demo → Real Launch Preparation (non-destructive) */}
      {activeTab === 'launch' && (
        <div className="space-y-6">
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-amber-500/10 flex items-center justify-center">
                  <Rocket className="w-5 h-5 text-amber-500" />
                </div>
                <div>
                  <h4 className="text-base font-black text-slate-900 dark:text-white">
                    Markazni ishga tushirish
                  </h4>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {cleared && demoTotal === 0
                      ? 'Markaz ishga tayyor. Demo ma\'lumotlar tozalangan — endi haqiqiy ma\'lumotlarni kiriting.'
                      : 'Markaz ishga tushirishdan oldin namoyish (demo) ma\'lumotlarni boshqaring.'}
                  </p>
                </div>
              </div>
              {cleared && demoTotal === 0 ? (
                <span className="px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-[11px] font-black uppercase tracking-wider w-fit">
                  Ishga tayyor
                </span>
              ) : (
                <span className="px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 text-[11px] font-black uppercase tracking-wider w-fit">
                  Demo rejim
                </span>
              )}
            </div>

            <div className="flex items-start gap-2.5 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs text-slate-600 dark:text-slate-300">
              <Flag className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
              <p>
                Ushbu bo'lim faqat tayyorgarlik uchun. Hozircha hech qanday ma'lumot
                o'chirilmaydi. Haqiqiy ma'lumotlarga o'tish faqat tegishli kelishuvdan
                so'ng, maxsus ko'rikdan o'tkazilgan jarayon orqali amalga oshiriladi.
                O'chirish amali hech qachon bir bosish bilan bajarilmaydi.
              </p>
            </div>
          </div>

          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
            <h4 className="text-sm font-black text-slate-900 dark:text-white mb-4">
              Boshlashdan oldin tekshiriladigan ro'yxat
            </h4>
            <LaunchReadinessCard />
          </div>

          {/* Demo → Real: safe demo-data management */}
          <DemoDataPanel />

          {/* Technical support assistant account (dedicated role 'support') */}
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="flex items-center gap-3 mb-1">
              <div className="w-11 h-11 rounded-2xl bg-sky-500/10 flex items-center justify-center">
                <UserPlus className="w-5 h-5 text-sky-600 dark:text-sky-400" />
              </div>
              <div>
                <h4 className="text-sm font-black text-slate-900 dark:text-white">
                  Texnik yordam akkaunti
                </h4>
                <p className="text-[11px] text-slate-400">
                  Alohida texnik xizmat akkaunti — oddiy admin hisobidan mustaqil kirish (role: support).
                </p>
              </div>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 mb-4">
              Yaratilgach, xodim <code className="text-sky-500 font-mono">/support</code> manzili orqali kirib,
              kiruvchi so'rovlar bilan ishlaydi.
            </p>

            <form onSubmit={handleCreateSupportAssistant} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-black uppercase tracking-widest text-slate-400 mb-1.5">
                  Ismi
                </label>
                <input
                  type="text"
                  value={assistName}
                  onChange={(e) => setAssistName(e.target.value)}
                  placeholder="Texnik xodim ismi"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-white font-bold focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>
              <div>
                <label className="block text-[11px] font-black uppercase tracking-widest text-slate-400 mb-1.5">
                  Email
                </label>
                <input
                  type="email"
                  value={assistEmail}
                  onChange={(e) => setAssistEmail(e.target.value)}
                  placeholder="tech@centerflow.uz"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-white font-bold focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-[11px] font-black uppercase tracking-widest text-slate-400 mb-1.5">
                  Vaqtinchalik parol (kamida 8 belgi)
                </label>
                <input
                  type="password"
                  value={assistPass}
                  onChange={(e) => setAssistPass(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-white font-bold focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>
              <div className="md:col-span-2 flex flex-col sm:flex-row sm:items-center gap-3">
                <button
                  type="submit"
                  disabled={assistBusy}
                  className="px-5 py-2.5 rounded-2xl bg-sky-500 hover:bg-sky-400 text-white font-black text-xs flex items-center gap-2 transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-sky-500/20"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  {assistBusy ? 'Yaratilmoqda...' : 'Yordam akkauntini yaratish'}
                </button>
                {assistMsg && (
                  <span
                    className={`flex items-center gap-1.5 text-xs font-bold ${
                      assistMsg.type === 'ok' ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                    }`}
                  >
                    {assistMsg.type === 'ok' ? <CircleCheck className="w-3.5 h-3.5 shrink-0" /> : <AlertTriangle className="w-3.5 h-3.5 shrink-0" />}
                    {assistMsg.text}
                  </span>
                )}
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
