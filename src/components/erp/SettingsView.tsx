import React, { useState, useEffect } from 'react';
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
} from 'lucide-react';
import { crmService } from '../../services/crmService';
import { AuditLogEntry } from '../../types/crm';

export const SettingsView: React.FC = () => {
  const [isSaved, setIsSaved] = useState(false);
  const [activeTab, setActiveTab] = useState<'center' | 'staff' | 'audit' | 'backup'>('center');

  // Center Details (single source of truth: crmService settings)
  const initialSettings = crmService.getSettings();
  const [centerName, setCenterName] = useState(initialSettings.centerName || "Renessans O'quv Markazi");
  const [legalName, setLegalName] = useState(initialSettings.legalName || '');
  const [address, setAddress] = useState(
    initialSettings.branches?.[0]?.address || 'Jizzax viloyati, Yangiobod tumani, 1-maktab binosi'
  );
  const [phone, setPhone] = useState(initialSettings.hotline || '+998 (90) 862-22-26');
  const [secondaryPhone, setSecondaryPhone] = useState(initialSettings.secondaryPhone || '');
  const [email, setEmail] = useState(initialSettings.email || '');
  const [workingHours, setWorkingHours] = useState(initialSettings.workingHours || '08:00 - 20:00');
  const [telegramChannel, setTelegramChannel] = useState(
    initialSettings.telegramSettings?.botUsername ? `https://t.me/${String(initialSettings.telegramSettings.botUsername).replace('@', '')}` : 'https://t.me/renessans_lc'
  );

  // Audit Logs
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);

  // Staff members (from crmService settings)
  const staffList = initialSettings.staff || [];

  const refreshLogs = () => {
    setAuditLogs(crmService.getAuditLogs());
  };

  useEffect(() => {
    refreshLogs();
  }, []);

  const handleSaveCenter = (e: React.FormEvent) => {
    e.preventDefault();
    const current = crmService.getSettings();
    crmService.updateSettings({
      centerName: centerName.trim(),
      legalName: legalName.trim(),
      hotline: phone.trim(),
      secondaryPhone: secondaryPhone.trim(),
      email: email.trim(),
      workingHours: workingHours.trim(),
      branches: current.branches?.length
        ? current.branches.map((b, i) =>
            i === 0 ? { ...b, address: address.trim(), phone: phone.trim(), workingHours: workingHours.trim() } : b
          )
        : [
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
        ...current.telegramSettings,
        botUsername: telegramChannel.trim().replace('https://t.me/', '@').replace('t.me/', '@').replace('@', '') !== ''
          ? `@${telegramChannel.trim().replace('https://t.me/', '').replace('t.me/', '').replace('@', '')}`
          : current.telegramSettings?.botUsername,
      },
    });
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  const handleBackupExport = () => {
    const blob = new Blob([crmService.exportFullBackupJSON()], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `renessans_erp_backup_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    crmService.logAuditAction('Backup', 'Export', 'To\'liq tizim zaxira nusxasi (JSON) yuklab olindi.');
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
    reader.onload = (event) => {
      try {
        const jsonString = event.target?.result as string;
        const result = crmService.importFullBackupJSON(jsonString);
        if (result.success) {
          crmService.logAuditAction('Backup', 'Import', 'Zaxira fayldan barcha ma\'lumotlar tiklandi.');
          alert(result.message + ' Sahifa yangilanadi.');
          window.location.reload();
        } else {
          alert(result.message);
        }
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
            Markaz ma'lumotlari, xodimlar kirish rollari, audit jurnali va to'liq ma'lumotlar bazasi zaxirasi.
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
        {[
          { id: 'center', label: "Markaz Ma'lumotlari", icon: Building },
          { id: 'staff', label: 'Xodimlar va Rollar', icon: Shield },
          { id: 'audit', label: 'Tizim Jurnali (Audit Log)', icon: History },
          { id: 'backup', label: 'Zaxira Nusxa (Backup)', icon: Download },
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
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
                <span>Xodimlar va Huquqlar (Role-Based Access Control)</span>
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
                <span>Tizim Harakatlari Jurnali (Audit Log)</span>
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

      {/* Tab 4: Backup & Restore */}
      {activeTab === 'backup' && (
        <div className="space-y-6">
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h4 className="text-base font-black text-slate-900 dark:text-white">
                To'liq Zaxira Nusxani Yuklab Olish (Export)
              </h4>
              <p className="text-xs text-slate-500 mt-1">
                Barcha o'quvchilar, ustozlar, guruhlar, to'lovlar, xarajatlar va CMS matnlarini JSON formatida yuklab oling.
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
                Zaxira Nusxadan Qayta Tiklash (Restore)
              </h4>
              <p className="text-xs text-slate-500 mt-1">
                Avval eksport qilingan JSON faylni yuklang. Barcha ma'lumotlar avtomatik yangilanadi.
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
    </div>
  );
};
