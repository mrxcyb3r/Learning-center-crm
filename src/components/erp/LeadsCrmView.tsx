import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import {
  Search,
  Download,
  Plus,
  Phone,
  Send,
  Edit2,
  Trash2,
  Calendar,
  User,
  CheckCircle2,
  X,
  UserPlus,
  Clock,
  MapPin,
  AlertTriangle,
  ChevronRight,
} from 'lucide-react';
import { crmService } from '../../services/crmService';
import { CourseData, GroupScheduleItem, Lead, LeadStatus, PaymentStatus, TeacherRecord } from '../../types/crm';
import { formatDateTime } from '../../utils/format';

const ALL_STATUSES: LeadStatus[] = ['Yangi', "Bog'lanildi", 'Sinov darsi belgilandi', 'Sinov darsi yakunlandi', "O'quvchiga aylandi", "Yo'qotildi"];

const LEAD_SOURCES = ['Website', 'Telegram', 'Instagram', 'Referral', 'Walk-in', 'Phone', 'Other'];

const STATUS_BADGE_CLASSES: Record<string, string> = {
  New: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20',
  Contacted: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20',
  'Trial Scheduled': 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20',
  Enrolled: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20',
  Lost: 'bg-slate-100 dark:bg-slate-800 text-slate-500 border border-slate-200 dark:border-slate-700',
  Yangi: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20',
  "Bog'lanildi": 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20',
  'Sinov darsi belgilandi': 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20',
  'Sinov darsi yakunlandi': 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20',
  "O'quvchiga aylandi": 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20',
  "Yo'qotildi": 'bg-slate-100 dark:bg-slate-800 text-slate-500 border border-slate-200 dark:border-slate-700',
};

const LOST_REASONS = [
  "Narxga to'g'ri kelmadi",
  "Vaqtiga to'g'ri kelmadi",
  "Kurs mos emas",
  "Boshqa markazni tanladi",
  'Kontakt chiqmadi',
  'Boshqa sabab',
];

const TRIAL_RESULTS = [
  { value: '', label: '— Natija belgilanmagan —' },
  { value: 'Passed', label: 'IQ darajasi aniqlandi (Passed)' },
  { value: 'Fail', label: 'IQ aniqlandi, past natija (Fail)' },
  { value: 'Converted', label: "O'quvchi bo'ldi (Converted)" },
];

export const LeadsCrmView: React.FC = () => {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [courses, setCourses] = useState<CourseData[]>([]);
  const [schedule, setSchedule] = useState<GroupScheduleItem[]>([]);
  const [teachers, setTeachers] = useState<TeacherRecord[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('All');
  const [selectedCourse, setSelectedCourse] = useState<string>('All');
  const [notice, setNotice] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Lead detail modal
  const [detailLead, setDetailLead] = useState<Lead | null>(null);
  const [editStatus, setEditStatus] = useState<LeadStatus>('Yangi');
  const [editNotes, setEditNotes] = useState('');
  const [editAssignedTo, setEditAssignedTo] = useState('');
  const [editTrialDate, setEditTrialDate] = useState('');
  const [editTrialRoom, setEditTrialRoom] = useState('');
  const [editTrialTeacher, setEditTrialTeacher] = useState('');
  const [editTrialResult, setEditTrialResult] = useState('');
  const [editLostReason, setEditLostReason] = useState('');
  const [editNextAction, setEditNextAction] = useState('');
  const [editLastContacted, setEditLastContacted] = useState('');
  const [detailError, setDetailError] = useState('');

  // Convert to student modal
  const [convertLead, setConvertLead] = useState<Lead | null>(null);
  const [convertCourse, setConvertCourse] = useState('');
  const [convertGroup, setConvertGroup] = useState('');
  const [convertTeacher, setConvertTeacher] = useState('');
  const [convertMonthlyFee, setConvertMonthlyFee] = useState('');
  const [convertDiscount, setConvertDiscount] = useState('0');
  const [convertPaymentStatus, setConvertPaymentStatus] = useState<PaymentStatus>('Paid');
  const [convertParentName, setConvertParentName] = useState('');
  const [convertParentPhone, setConvertParentPhone] = useState('');
  const [convertError, setConvertError] = useState('');

  // Add lead modal
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [newPhone, setNewPhone] = useState('+998 ');
  const [newCourse, setNewCourse] = useState('');
  const [newSource, setNewSource] = useState('Website');
  const [newNotes, setNewNotes] = useState('');

  const refreshLeads = () => {
    setLeads(crmService.getLeads());
    setCourses(crmService.getCourses());
    setSchedule(crmService.getSchedule());
    setTeachers(crmService.getTeachers());
  };

  useEffect(() => {
    refreshLeads();
  }, []);

  const showNotice = (type: 'success' | 'error', text: string) => {
    setNotice({ type, text });
    setTimeout(() => setNotice(null), 4000);
  };

  const handleOpenDetail = (lead: Lead) => {
    setDetailLead(lead);
    setEditStatus(lead.status);
    setEditNotes(lead.notes || '');
    setEditAssignedTo(lead.assignedTo || '');
    setEditTrialDate(lead.trialDateTime || '');
    setEditTrialRoom(lead.trialRoom || '');
    setEditTrialTeacher(lead.trialTeacher || '');
    setEditTrialResult(lead.trialResult || '');
    setEditLostReason(lead.lostReason || '');
    setEditNextAction(lead.nextAction || '');
    setEditLastContacted(lead.lastContactedAt || '');
    setDetailError('');
  };

  const trialConflict =
    detailLead !== null &&
    editStatus === 'Sinov darsi belgilandi' &&
    editTrialDate !== '' &&
    leads.some(
      (l) =>
        l.id !== detailLead.id &&
        l.status === 'Sinov darsi belgilandi' &&
        l.trialDateTime === editTrialDate &&
        (editTrialRoom === '' || l.trialRoom === editTrialRoom)
    );

  const handleSaveDetail = () => {
    if (!detailLead) return;
    setDetailError('');

    if (editStatus === 'Sinov darsi belgilandi' && editTrialDate === '') {
      setDetailError("Sinov darsi belgilangan holatda vaqt ('Trial Date') kiritilishi shart.");
      return;
    }
    if (editStatus === 'Sinov darsi belgilandi' && trialConflict) {
      setDetailError('Bu vaqt / xona boshqa ariza uchun band. Shuning uchun ikki martalik sinov qayd etilmadi.');
      return;
    }
    if (editStatus === "Yo'qotildi" && editLostReason === '') {
      setDetailError("Yo'qotilgan sababini tanlang ('Lost Reason').");
      return;
    }

    crmService.updateLead(detailLead.id, {
      status: editStatus,
      notes: editNotes,
      assignedTo: editAssignedTo,
      trialDateTime: editTrialDate || undefined,
      trialRoom: editTrialRoom || undefined,
      trialTeacher: editTrialTeacher || undefined,
      trialResult: editTrialResult || undefined,
      lostReason: editLostReason || undefined,
      nextAction: editNextAction || undefined,
      lastContactedAt: editLastContacted || undefined,
    });

    if (editStatus === "O'quvchiga aylandi" && detailLead.status !== "O'quvchiga aylandi") {
      setDetailLead(null);
      handleOpenConvert({ ...detailLead, status: "O'quvchiga aylandi" });
      showNotice('success', "Arizani o'quvchiga aylantirish uchun quyidagi ma'lumotlarni to'ldiring.");
      return;
    }

    setDetailLead(null);
    refreshLeads();
    showNotice('success', 'Ariza ma\'lumotlari saqlandi.');
  };

  const handleOpenConvert = (lead: Lead) => {
    const initialCourse = lead.course || courses[0]?.title || '';
    const courseDef = courses.find((c) => c.title === initialCourse);
    const firstGroup = schedule.find((g) => g.course === initialCourse);

    setConvertLead(lead);
    setConvertCourse(initialCourse);
    setConvertGroup(firstGroup ? firstGroup.groupName : '');
    setConvertTeacher(firstGroup ? firstGroup.teacher : '');
    setConvertMonthlyFee(String(courseDef?.monthlyFee || 0));
    setConvertDiscount('0');
    setConvertPaymentStatus('Paid');
    setConvertParentName('');
    setConvertParentPhone(lead.phone);
    setConvertError('');
  };

  const handleConvertCourseChange = (title: string) => {
    setConvertCourse(title);
    const grp = schedule.find((g) => g.course === title);
    setConvertGroup(grp ? grp.groupName : '');
    setConvertTeacher(grp ? grp.teacher : '');
    const courseDef = courses.find((c) => c.title === title);
    setConvertMonthlyFee(String(courseDef?.monthlyFee || 0));
  };

  const handleConvertGroupChange = (groupName: string) => {
    setConvertGroup(groupName);
    const grp = schedule.find((g) => g.groupName === groupName);
    if (grp) {
      setConvertTeacher(grp.teacher);
      if (grp.course) setConvertCourse(grp.course);
    }
  };

  const handleConfirmConvert = () => {
    if (!convertLead) return;
    setConvertError('');

    const fee = Number(convertMonthlyFee) || 0;
    const discount = Math.min(Math.max(Number(convertDiscount) || 0, 0), fee);

    const result = crmService.convertLeadToStudent(convertLead.id, {
      course: convertCourse,
      groupName: convertGroup,
      teacher: convertTeacher,
      monthlyFee: fee,
      discount,
      paymentStatus: convertPaymentStatus,
      parentName: convertParentName.trim(),
      parentPhone: convertParentPhone.trim(),
    });

    if (result.created && result.student) {
      showNotice('success', `O'quvchi yaratildi: ${result.student.fullName} (${convertCourse})`);
    } else if (!result.created) {
      showNotice('error', result.message);
    }

    setConvertLead(null);
    refreshLeads();
  };

  const handleDeleteLead = (id: string, name: string) => {
    if (window.confirm(`"${name}" arizasini ro'yxatdan o'chirmoqchimisiz?`)) {
      crmService.deleteLead(id);
      refreshLeads();
      showNotice('success', 'Ariza o\'chirildi.');
    }
  };

  const handleCreateLead = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;

    crmService.createLead({
      name: newName.trim(),
      phone: newPhone.trim(),
      course: newCourse,
      notes: newNotes.trim(),
      source: newSource,
    });

    setIsAddModalOpen(false);
    setNewName('');
    setNewPhone('+998 ');
    setNewNotes('');
    refreshLeads();
    showNotice('success', 'Yangi ariza qo\'shildi.');
  };

  const handleExportCSV = () => {
    const csvContent = crmService.exportLeadsCSV();
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `renessans_arizalar_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Filtered Leads
  const filteredLeads = leads.filter((lead) => {
    const matchesSearch =
      lead.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lead.phone.includes(searchQuery);

    const matchesStatus = selectedStatus === 'All' || lead.status === selectedStatus;
    const matchesCourse = selectedCourse === 'All' || lead.course === selectedCourse;

    return matchesSearch && matchesStatus && matchesCourse;
  });

  const statusCount = (st: LeadStatus) => leads.filter((l) => l.status === st).length;
  const trialScheduledLeads = leads.filter((l) => l.status === 'Sinov darsi belgilandi');

  return (
    <div className="space-y-6">
      {/* Top Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            Arizalar Boshqaruvi (Leads CRM)
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Yangi murojaatlar, qo'ng'iroqlar, sinov darslari va o'quvchiga aylantirish — yagona joyda.
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <button
            onClick={handleExportCSV}
            className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs flex items-center gap-1.5 transition cursor-pointer border border-slate-200 dark:border-slate-700"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Excel (CSV)</span>
          </button>

          <button
            onClick={() => setIsAddModalOpen(true)}
            className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-md shadow-amber-500/20 flex items-center gap-1.5 transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Yangi Ariza</span>
          </button>
        </div>
      </div>

      {/* Notice */}
      {notice && (
        <div
          className={`p-3 rounded-2xl border text-xs font-bold flex items-center gap-2 ${
            notice.type === 'success'
              ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400'
              : 'bg-rose-500/10 border-rose-500/20 text-rose-600 dark:text-rose-400'
          }`}
        >
          {notice.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
          <span>{notice.text}</span>
        </div>
      )}

      {/* Pipeline Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {ALL_STATUSES.map((st) => (
          <button
            key={st}
            onClick={() => setSelectedStatus(selectedStatus === st ? 'All' : st)}
            className={`p-3.5 rounded-2xl border text-left transition cursor-pointer ${
              selectedStatus === st
                ? 'bg-amber-500/10 border-amber-500/40 ring-1 ring-amber-500/30'
                : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-amber-300 dark:hover:border-amber-500/40'
            }`}
          >
            <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-black ${STATUS_BADGE_CLASSES[st]}`}>
              {st}
            </span>
            <div className="text-xl font-black text-slate-900 dark:text-white mt-2">{statusCount(st)}</div>
          </button>
        ))}
      </div>

      {trialScheduledLeads.length > 0 && (
        <div className="p-3.5 rounded-2xl bg-purple-500/10 border border-purple-500/20 text-xs text-purple-700 dark:text-purple-300 flex items-center gap-2">
          <Calendar className="w-4 h-4 shrink-0" />
          <span>
            Bugun rejalashtirilgan sinov darslari:
            <strong>
              {trialScheduledLeads.filter((l) => l.trialDateTime && new Date(l.trialDateTime).toDateString() === new Date().toDateString()).map((l) => l.name).join(', ') || 'yo\'q'}
            </strong>
          </span>
        </div>
      )}

      {/* Filter Bar */}
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Ism yoki telefon bo'yicha qidirish (+998...)"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="w-full md:w-auto px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-none cursor-pointer"
          >
            <option value="All">Barcha holatlar ({leads.length})</option>
            {ALL_STATUSES.map((st) => (
              <option key={st} value={st}>
                {st} ({statusCount(st)})
              </option>
            ))}
          </select>

          <select
            value={selectedCourse}
            onChange={(e) => setSelectedCourse(e.target.value)}
            className="w-full md:w-auto px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-none cursor-pointer"
          >
            <option value="All">Barcha kurslar</option>
            {courses.map((c) => (
              <option key={c.id} value={c.title}>{c.title}</option>
            ))}
          </select>
        </div>
      </div>

      {/* CRM Leads Table */}
      <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                <th className="py-3.5 px-4">Ariza</th>
                <th className="py-3.5 px-4">Telefon</th>
                <th className="py-3.5 px-4">Kurs</th>
                <th className="py-3.5 px-4">Holat</th>
                <th className="py-3.5 px-4">Sinov Darsi</th>
                <th className="py-3.5 px-4">Mas'ul</th>
                <th className="py-3.5 px-4 text-right">Amallar</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredLeads.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400 text-xs">
                    Qidiruv bo'yicha ariza topilmadi.
                  </td>
                </tr>
              ) : (
                filteredLeads.map((lead) => (
                  <tr
                    key={lead.id}
                    className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition cursor-pointer"
                    onClick={() => handleOpenDetail(lead)}
                  >
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900 dark:text-white">
                        {lead.name}
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5">
                        {formatDateTime(lead.createdAt)} • {lead.source || 'Website'}
                      </div>
                    </td>

                    <td className="py-3.5 px-4 font-mono font-medium text-slate-700 dark:text-slate-300">
                      {lead.phone}
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="font-semibold text-amber-600 dark:text-amber-400">
                        {lead.course || '—'}
                      </span>
                    </td>

                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-black ${
                          STATUS_BADGE_CLASSES[lead.status]
                        }`}
                      >
                        {lead.status}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-[11px] text-slate-500 dark:text-slate-400">
                      {lead.trialDateTime ? (
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {new Date(lead.trialDateTime).toLocaleString('uz-UZ', {
                            day: '2-digit',
                            month: 'short',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                          {lead.trialRoom ? ` • ${lead.trialRoom}` : ''}
                        </span>
                      ) : (
                        '—'
                      )}
                    </td>

                    <td className="py-3.5 px-4 text-slate-600 dark:text-slate-300">
                      {lead.assignedTo || '—'}
                    </td>

                    <td className="py-3.5 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1.5">
                        <a
                          href={`tel:${lead.phone}`}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-500 hover:bg-emerald-500/10 transition"
                          title="Qo'ng'iroq qilish"
                        >
                          <Phone className="w-4 h-4" />
                        </a>
                        <a
                          href={`https://t.me/+${lead.phone.replace(/\D/g, '')}`}
                          target="_blank"
                          rel="noreferrer"
                          className="p-1.5 rounded-lg text-slate-400 hover:text-sky-500 hover:bg-sky-500/10 transition"
                          title="Telegramda ochish"
                        >
                          <Send className="w-4 h-4" />
                        </a>
                        <button
                          onClick={() => handleOpenDetail(lead)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-amber-500 hover:bg-amber-500/10 transition cursor-pointer"
                          title="Ma'lumotlarni tahrirlash"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() =>
                            lead.status === "O'quvchiga aylandi" ? handleOpenDetail(lead) : handleOpenConvert(lead)
                          }
                          className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-500 hover:bg-emerald-500/10 transition cursor-pointer"
                          title={lead.status === "O'quvchiga aylandi" ? "O'quvchiga aylantirilgan" : "O'quvchiga aylantirish"}
                        >
                          <UserPlus className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteLead(lead.id, lead.name)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-500/10 transition cursor-pointer"
                          title="Arizani o'chirish"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL: Lead Detail */}
      {detailLead && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm overflow-y-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-2xl bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl p-6 sm:p-7 relative my-6"
          >
            <button
              onClick={() => setDetailLead(null)}
              className="absolute top-5 right-5 w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 hover:text-slate-900 dark:hover:text-white cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider">
                Ariza Tafsilotlari
              </span>
            </div>

            <h3 className="text-2xl font-black text-slate-900 dark:text-white">
              {detailLead.name}
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              {detailLead.course || 'Kurs tanlanmagan'} • Qabul qilingan: {formatDateTime(detailLead.createdAt)} • Manba: {detailLead.source || 'Website'}
            </p>

            {/* Quick Contact buttons */}
            <div className="mt-5 grid grid-cols-2 gap-3">
              <a
                href={`tel:${detailLead.phone}`}
                className="py-2.5 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition"
              >
                <Phone className="w-4 h-4" />
                <span>Qo'ng'iroq ({detailLead.phone})</span>
              </a>
              <a
                href={`https://t.me/+${detailLead.phone.replace(/\D/g, '')}`}
                target="_blank"
                rel="noreferrer"
                className="py-2.5 px-4 rounded-xl bg-sky-500 hover:bg-sky-600 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition"
              >
                <Send className="w-4 h-4" />
                <span>Telegramda ochish</span>
              </a>
            </div>

            {detailError && (
              <div className="mt-4 p-3 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs font-bold flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                {detailError}
              </div>
            )}

            {trialConflict && (
              <div className="mt-4 p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-400 text-xs font-bold flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                Diqqat: bu vaqt/xona uchun boshqa ariza allaqachon sinov darsini belgilagan.
              </div>
            )}

            {detailLead.status === "O'quvchiga aylandi" && (
              <div className="mt-4 p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-bold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                Bu ariza allaqachon o'quvchiga aylantirilgan.
              </div>
            )}

            {/* Fields */}
            <div className="mt-6 space-y-4">
              {/* STATUS */}
              <section>
                <h4 className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1.5">
                  <ChevronRight className="w-3.5 h-3.5" /> 1. Holat (Pipeline)
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                      Joriy holat
                    </label>
                    <select
                      value={editStatus}
                      onChange={(e) => setEditStatus(e.target.value as LeadStatus)}
                      className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                    >
                      {ALL_STATUSES.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                      Mas'ul xodim
                    </label>
                    <input
                      type="text"
                      value={editAssignedTo}
                      onChange={(e) => setEditAssignedTo(e.target.value)}
                      placeholder="Masalan: Sardor (Reception)"
                      className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                </div>
              </section>

              {/* TRIAL */}
              <section>
                <h4 className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5" /> 2. Sinov Darsi
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                      Sana va vaqt
                    </label>
                    <input
                      type="datetime-local"
                      value={editTrialDate}
                      onChange={(e) => setEditTrialDate(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                      Xona
                    </label>
                    <input
                      type="text"
                      value={editTrialRoom}
                      onChange={(e) => setEditTrialRoom(e.target.value)}
                      placeholder="Masalan: 101-xona"
                      className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                      O'qituvchi
                    </label>
                    <select
                      value={editTrialTeacher}
                      onChange={(e) => setEditTrialTeacher(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                    >
                      <option value="">(Tanlanmagan)</option>
                      {teachers.map((t) => (
                        <option key={t.id} value={t.name}>{t.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                      Sinov natijasi
                    </label>
                    <select
                      value={editTrialResult}
                      onChange={(e) => setEditTrialResult(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                    >
                      {TRIAL_RESULTS.map((r) => (
                        <option key={r.value} value={r.value}>{r.label}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </section>

              {/* FOLLOW-UP */}
              <section>
                <h4 className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5" /> 3. Follow-Up
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                      So'nggi murojaat vaqti
                    </label>
                    <input
                      type="datetime-local"
                      value={editLastContacted}
                      onChange={(e) => setEditLastContacted(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                      Keyingi harakat (Next Action)
                    </label>
                    <input
                      type="text"
                      value={editNextAction}
                      onChange={(e) => setEditNextAction(e.target.value)}
                      placeholder="Masalan: Ertaga 14:00 da qayta qo'ng'iroq"
                      className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                  {editStatus === "Yo'qotildi" && (
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                        Yo'qotish sababi
                      </label>
                      <select
                        value={editLostReason}
                        onChange={(e) => setEditLostReason(e.target.value)}
                        className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                      >
                        <option value="">(Sababni tanlang)</option>
                        {LOST_REASONS.map((r) => (
                          <option key={r} value={r}>{r}</option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>
              </section>

              {/* NOTES */}
              <section>
                <h4 className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5" /> 4. Konsultatsiya & Izohlar
                </h4>
                <textarea
                  rows={3}
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  placeholder="Qo'ng'iroq natijalari, maqsad, sinov darsida mediana... "
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </section>
            </div>

            {/* Footer actions */}
            <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
              <button
                onClick={() => detailLead.status !== "O'quvchiga aylandi" && handleOpenConvert(detailLead)}
                disabled={detailLead.status === "O'quvchiga aylandi"}
                className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition cursor-pointer ${
                  detailLead.status === "O'quvchiga aylandi"
                    ? 'bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-not-allowed'
                    : 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-md shadow-emerald-500/20'
                }`}
              >
                <UserPlus className="w-4 h-4" />
                O'quvchiga Aylantirish
              </button>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => setDetailLead(null)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-500 hover:text-slate-900 dark:hover:text-white cursor-pointer"
                >
                  Bekor qilish
                </button>
                <button
                  onClick={handleSaveDetail}
                  className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-md shadow-amber-500/20 cursor-pointer"
                >
                  Saqlash
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* MODAL: Convert to Student */}
      {convertLead && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm overflow-y-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-xl bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl p-6 sm:p-7 relative my-6"
          >
            <button
              onClick={() => setConvertLead(null)}
              className="absolute top-5 right-5 w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 hover:text-slate-900 dark:hover:text-white cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
                O'quvchiga Aylantirish
              </span>
            </div>
            <h3 className="text-2xl font-black text-slate-900 dark:text-white">
              {convertLead.name}
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Ariza o'quvchilar ro'yxatiga qo'shiladi va sinov guruhiga biriktiriladi.
            </p>

            {convertError && (
              <div className="mt-4 p-3 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs font-bold flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                {convertError}
              </div>
            )}

            <div className="mt-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    Kurs
                  </label>
                  <select
                    value={convertCourse}
                    onChange={(e) => handleConvertCourseChange(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm font-semibold text-slate-900 dark:text-white focus:outline-none"
                  >
                    {courses.map((c) => (
                      <option key={c.id} value={c.title}>{c.title}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    Guruh
                  </label>
                  <select
                    value={convertGroup}
                    onChange={(e) => handleConvertGroupChange(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm font-semibold text-slate-900 dark:text-white focus:outline-none"
                  >
                    {schedule
                      .filter((g) => !convertCourse || g.course === convertCourse)
                      .map((g) => (
                        <option key={g.id} value={g.groupName}>
                          {g.groupName} ({g.teacher || '—'}, {g.studentsCount || 0} o'quvchi/g)
                        </option>
                      ))}
                    {schedule.filter((g) => !convertCourse || g.course === convertCourse).length === 0 && (
                      <option value="">Yangi guruh (1-guruh)</option>
                    )}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    O'qituvchi
                  </label>
                  <select
                    value={convertTeacher}
                    onChange={(e) => setConvertTeacher(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm font-semibold text-slate-900 dark:text-white focus:outline-none"
                  >
                    <option value="">(Tanlanmagan)</option>
                    {teachers.map((t) => (
                      <option key={t.id} value={t.name}>{t.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    Oylik to'lov (UZS)
                  </label>
                  <input
                    type="number"
                    value={convertMonthlyFee}
                    onChange={(e) => setConvertMonthlyFee(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    Chegirma (UZS)
                  </label>
                  <input
                    type="number"
                    value={convertDiscount}
                    onChange={(e) => setConvertDiscount(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    To'lov holati
                  </label>
                  <select
                    value={convertPaymentStatus}
                    onChange={(e) => setConvertPaymentStatus(e.target.value as PaymentStatus)}
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm font-semibold text-slate-900 dark:text-white focus:outline-none"
                  >
                    <option value="Paid">To'langan</option>
                    <option value="Due">Qarzdor</option>
                    <option value="Overdue">Muddati o'tgan</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    Ota-ona ismi
                  </label>
                  <input
                    type="text"
                    value={convertParentName}
                    onChange={(e) => setConvertParentName(e.target.value)}
                    placeholder="Masalan: Aziz Rahimov"
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    Ota-ona telefoni
                  </label>
                  <input
                    type="tel"
                    value={convertParentPhone}
                    onChange={(e) => setConvertParentPhone(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-none"
                  />
                </div>
              </div>

              <p className="text-[11px] text-slate-400">
                O'quvchi guruhga biriktiriladi, guruhdagi o'quvchilar soni avtomatik yangilanadi va ariza holati{" "}
                <strong>"O'quvchiga aylandi"</strong> deb belgilanadi.
              </p>
            </div>

            <div className="mt-6 flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
              <button
                onClick={() => setConvertLead(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-500 hover:text-slate-900 dark:hover:text-white cursor-pointer"
              >
                Bekor qilish
              </button>
              <button
                onClick={handleConfirmConvert}
                className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs shadow-md shadow-emerald-500/20 cursor-pointer flex items-center gap-1.5"
              >
                <UserPlus className="w-4 h-4" />
                O'quvchini Yaratish
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* MODAL: Manual Add New Lead */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl p-6 sm:p-7 relative"
          >
            <button
              onClick={() => setIsAddModalOpen(false)}
              className="absolute top-5 right-5 w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 hover:text-slate-900 dark:hover:text-white cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <h3 className="text-xl font-black text-slate-900 dark:text-white mb-1">
              Yangi Ariza Qo'shish
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Telefon yoki markazga kelgan mijozni ro'yxatga oling.
            </p>

            <form onSubmit={handleCreateLead} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                  To'liq ism
                </label>
                <input
                  type="text"
                  required
                  placeholder="Masalan: Jasur Rahimov"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                  Telefon raqami
                </label>
                <input
                  type="tel"
                  required
                  placeholder="+998 90 123 45 67"
                  value={newPhone}
                  onChange={(e) => setNewPhone(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                    Kurs
                  </label>
                  <select
                    value={newCourse}
                    onChange={(e) => setNewCourse(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm font-semibold text-slate-900 dark:text-white focus:outline-none"
                  >
                    <option value="">(Tanlang)</option>
                    {courses.map((c) => (
                      <option key={c.id} value={c.title}>{c.title}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                    Manba
                  </label>
                  <select
                    value={newSource}
                    onChange={(e) => setNewSource(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm font-semibold text-slate-900 dark:text-white focus:outline-none"
                  >
                    {LEAD_SOURCES.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                  Izoh
                </label>
                <textarea
                  rows={2}
                  placeholder="Maqsad, qaysi kurs qiziqtiradi, murojaat sababi..."
                  value={newNotes}
                  onChange={(e) => setNewNotes(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none"
                />
              </div>

              <div className="pt-2 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-500 cursor-pointer"
                >
                  Bekor qilish
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-md shadow-amber-500/20 cursor-pointer"
                >
                  Qo'shish
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
};