import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import {
  Search,
  Download,
  Plus,
  Phone,
  Send,
  Eye,
  Trash2,
  Calendar,
  CheckCircle2,
  X,
  UserPlus,
  Clock,
  FileText,
  AlertTriangle,
  ChevronRight,
  FilterX,
} from 'lucide-react';
import { leadsService, coursesService, groupsService, teachersService, leadTimelineService } from '../../services/repository';
import { auth } from '../../services/firebase';
import { notificationService } from '../../services/notificationService';
import { CourseData, GroupScheduleItem, Lead, LeadStatus, PaymentStatus, TeacherRecord } from '../../types/crm';
import { formatDate, formatDateTime } from '../../utils/format';

const ALL_STATUSES: LeadStatus[] = ['Yangi', "Bog'lanildi", 'Sinov darsi belgilandi', 'Sinov darsi yakunlandi', "O'quvchiga aylandi", "Yo'qotildi"];

const FOLLOWUP_FILTER = '__followup__';

const SOURCE_OPTIONS = [
  'Sayt orqali ariza',
  'Bosh sahifa (Hero forma)',
  'Telegram bot orqali',
  'Instagram',
  'Tavsiya asosida',
  'Markazga tashrif',
  'Telefon orqali',
  'Boshqa',
];

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
  { value: 'Passed', label: "Daraja aniqlandi — o'tdi" },
  { value: 'Fail', label: 'Daraja aniqlandi — past natija' },
  { value: 'Converted', label: "O'quvchi bo'ldi" },
];

export const LeadsCrmView: React.FC = () => {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [courses, setCourses] = useState<CourseData[]>([]);
  const [schedule, setSchedule] = useState<GroupScheduleItem[]>([]);
  const [teachers, setTeachers] = useState<TeacherRecord[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('All');
  const [selectedCourse, setSelectedCourse] = useState<string>('All');
  const [selectedSource, setSelectedSource] = useState<string>('All');
  const [selectedAssigned, setSelectedAssigned] = useState<string>('All');
  const [selectedPeriod, setSelectedPeriod] = useState<string>('All');
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');
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
  const [newSource, setNewSource] = useState('Sayt orqali ariza');
  const [newAssigned, setNewAssigned] = useState('');
  const [newTrialDate, setNewTrialDate] = useState('');
  const [newNotes, setNewNotes] = useState('');
  const [newError, setNewError] = useState('');

  const refreshLeads = async () => {
    const [leadsData, coursesData, scheduleData, teachersData] = await Promise.all([
      leadsService.getAllLeads(),
      coursesService.getAllCourses(),
      groupsService.getAllGroups(),
      teachersService.getAllTeachers()
    ]);
    setLeads(leadsData);
    setCourses(coursesData as unknown as CourseData[]);
    setSchedule(scheduleData as unknown as GroupScheduleItem[]);
    setTeachers(teachersData as unknown as TeacherRecord[]);
  };

  useEffect(() => {
    refreshLeads();
  }, []);

  // Global search deep-link: open the matching lead detail.
  useEffect(() => {
    const onOpenRecord = (e: Event) => {
      const detail = (e as CustomEvent).detail as { kind?: string; id?: string } | undefined;
      if (!detail || detail.kind !== 'lead' || !detail.id) return;
      setLeads((current) => {
        const found = current.find((l) => l.id === detail.id);
        if (found) handleOpenDetail(found);
        return current;
      });
    };
    window.addEventListener('centerflow-open-record', onOpenRecord);
    return () => window.removeEventListener('centerflow-open-record', onOpenRecord);
  }, []);

  // Front-desk quick action: open the existing "new lead" modal directly.
  useEffect(() => {
    const onQuickAdd = (e: Event) => {
      const detail = (e as CustomEvent).detail as { form?: string } | undefined;
      if (!detail || detail.form !== 'lead') return;
      setIsAddModalOpen(true);
    };
    window.addEventListener('centerflow-quick-add', onQuickAdd);
    return () => window.removeEventListener('centerflow-quick-add', onQuickAdd);
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

  const timelineActor = () =>
    auth.currentUser?.displayName || auth.currentUser?.email?.split('@')[0] || 'Xodim';
  const timelineUid = () => auth.currentUser?.uid || '';

  const handleSaveDetail = async () => {
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
      setDetailError("Yo'qotilgan sababini tanlang.");
      return;
    }

    const isConverting = editStatus === "O'quvchiga aylandi" && detailLead.status !== "O'quvchiga aylandi";

    const updates: Partial<Lead> = {
      notes: editNotes,
      assignedTo: editAssignedTo,
      trialDateTime: editTrialDate || undefined,
      trialRoom: editTrialRoom || undefined,
      trialTeacher: editTrialTeacher || undefined,
      trialResult: editTrialResult || undefined,
      lostReason: editLostReason || undefined,
      nextAction: editNextAction || undefined,
      lastContactedAt: editLastContacted || undefined,
    };
    if (!isConverting) updates.status = editStatus;

    try {
      await leadsService.updateLead(detailLead.id, updates);
    } catch (err: any) {
      const denied = /permission-denied|PERMISSION_DENIED|insufficient/i.test(String(err?.code || '') + ' ' + (err?.message || ''));
      setDetailError(
        denied
          ? 'Ruxsat etilmagan: bu amalni bajarish huquqingiz yo‘q.'
          : 'Saqlashda xatolik yuz berdi. Qayta urinib ko‘ring.'
      );
      return;
    }

    if (editStatus !== detailLead.status) {
      notificationService.logActivity({
        type: 'lead_update',
        message: `Lead holati o'zgardi: ${detailLead.name} → ${editStatus}`,
        icon: 'RefreshCw',
        color: 'blue',
      });
      leadTimelineService.log(
        detailLead.id,
        editStatus === "Yo'qotildi" ? 'lost' : 'status_changed',
        `Holat o‘zgardi: ${detailLead.status} → ${editStatus}${editStatus === "Yo'qotildi" && editLostReason ? ` (sabap: ${editLostReason})` : ''}`,
        timelineActor(),
        timelineUid()
      );
    }
    if (editTrialDate && editTrialDate !== detailLead.trialDateTime) {
      leadTimelineService.log(
        detailLead.id,
        'trial_scheduled',
        `Sinov darsi belgilandi: ${editTrialDate}${editTrialRoom ? `, ${editTrialRoom}` : ''}${editTrialTeacher ? `, ${editTrialTeacher}` : ''}`,
        timelineActor(),
        timelineUid()
      );
    }

    if (isConverting) {
      setDetailLead(null);
      handleOpenConvert({
        ...detailLead,
        status: "O'quvchiga aylandi",
        notes: editNotes,
        assignedTo: editAssignedTo,
        trialDateTime: editTrialDate || undefined,
        nextAction: editNextAction || undefined,
      });
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

  const handleConfirmConvert = async () => {
    if (!convertLead) return;
    setConvertError('');

    const fee = Number(convertMonthlyFee) || 0;
    const discount = Math.min(Math.max(Number(convertDiscount) || 0, 0), fee);

    let result;
    try {
      result = await leadsService.convertLeadToStudent(convertLead.id, {
        course: convertCourse,
        groupName: convertGroup,
        teacher: convertTeacher,
        monthlyFee: fee,
        discount,
        paymentStatus: convertPaymentStatus,
        parentName: convertParentName.trim(),
        parentPhone: convertParentPhone.trim(),
      });
    } catch (err: any) {
      const denied = /permission-denied|PERMISSION_DENIED|insufficient/i.test(String(err?.code || '') + ' ' + (err?.message || ''));
      setConvertError(
        denied
          ? 'Ruxsat etilmagan: o‘quvchi yaratish huquqingiz yo‘q. Administrator bilan bog‘laning.'
          : 'O‘quvchi yaratishda xatolik yuz berdi. Qayta urinib ko‘ring.'
      );
      return;
    }

    if (result.created && result.student) {
      showNotice('success', `O'quvchi yaratildi: ${result.student.fullName} (${convertCourse})`);
      leadTimelineService.log(
        convertLead.id,
        'converted',
        `O‘quvchiga aylantirildi: ${result.student.fullName} (${convertCourse}${convertGroup ? `, ${convertGroup}` : ''})`,
        timelineActor(),
        timelineUid()
      );
    } else if (!result.created) {
      showNotice('error', result.message);
    }

    setConvertLead(null);
    refreshLeads();
  };

const handleDeleteLead = async (id: string, name: string) => {
      if (window.confirm(`"${name}" arizasini ro'yxatdan o'chirmoqchimisiz?`)) {
        await leadsService.deleteLead(id);
        refreshLeads();
        showNotice('success', 'Ariza o\'chirildi.');
      }
    };

  const handleCreateLead = async (e: React.FormEvent) => {
    e.preventDefault();
    setNewError('');

    if (!newName.trim()) {
      setNewError("Ism / F.I.Sh. kiritish shart.");
      return;
    }
    const phoneDigits = newPhone.replace(/\D/g, '');
    if (phoneDigits.length !== 9 && phoneDigits.length !== 12) {
      setNewError("Telefon raqamini +998 (XX) XXX-XX-XX formatida kiriting.");
      return;
    }
    if (!newCourse) {
      setNewError("Ariza uchun kursni tanlang.");
      return;
    }

    let newId = '';
    try {
      newId = await leadsService.createLead({
        name: newName.trim(),
        phone: newPhone.trim(),
        course: newCourse,
        notes: newNotes.trim(),
        source: newSource,
        assignedTo: newAssigned.trim() || 'Qabulxona',
        ...(newTrialDate ? { trialDateTime: newTrialDate } : {}),
      });
    } catch (err: any) {
      setNewError('Ariza saqlanmadi. Ma’lumotlarni tekshirib, qayta urinib ko‘ring.');
      return;
    }
    leadTimelineService.log(newId, 'created', `Murojaat yaratildi: ${newName.trim()} (${newCourse})`, timelineActor(), timelineUid());

    setIsAddModalOpen(false);
    setNewName('');
    setNewPhone('+998 ');
    setNewNotes('');
    setNewAssigned('');
    setNewTrialDate('');
    refreshLeads();
    showNotice('success', 'Yangi ariza qo\'shildi.');
  };

  const handleMarkContacted = async (lead: Lead) => {
    const updates: Partial<Lead> = { lastContactedAt: new Date().toISOString() };
    if (lead.status === 'Yangi') updates.status = "Bog'lanildi";
    try {
      await leadsService.updateLead(lead.id, updates);
    } catch {
      showNotice('error', 'Amalni bajarib bo‘lmadi. Qayta urinib ko‘ring.');
      return;
    }
    leadTimelineService.log(lead.id, 'called', 'Qo‘ng‘iroq qilindi', timelineActor(), timelineUid());
    refreshLeads();
    showNotice('success', `"${lead.name}" uchun murojaat vaqti yangilandi.`);
    setDetailLead(null);
  };

  const handleExportCSV = () => {
    const headers = ['ID', 'Name', 'Phone', 'Course', 'Status', 'Source', 'Assigned To', 'Created At', 'Trial Date', 'Notes'];
    const rows = filteredLeads.map(l => [
      l.id,
      l.name,
      l.phone,
      l.course || '',
      l.status,
      l.source || '',
      l.assignedTo || '',
      new Date(l.createdAt).toLocaleString('uz-UZ'),
      l.trialDateTime ? new Date(l.trialDateTime).toLocaleString('uz-UZ') : '',
      l.notes || ''
    ]);
    const csvContent = [headers, ...rows].map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `renessans_arizalar_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Follow-up levels (derived from real lead timestamps only)
  const followUpLevel = (lead: Lead): 'none' | 'today' | 'overdue' => {
    if (lead.status === "O'quvchiga aylandi" || lead.status === "Yo'qotildi") return 'none';
    const base = lead.lastContactedAt ? new Date(lead.lastContactedAt).getTime() : new Date(lead.createdAt).getTime();
    if (isNaN(base)) return 'none';
    const ageDays = (Date.now() - base) / (24 * 3600 * 1000);
    if (ageDays >= 2) return 'overdue';
    if (ageDays >= 1) return 'today';
    return 'none';
  };

  const needsFollowUp = (lead: Lead) => followUpLevel(lead) !== 'none';

  // Filtered & Sorted Leads
  const filterCutoff = (() => {
    if (selectedPeriod === 'today') return Date.now() - 24 * 3600 * 1000;
    if (selectedPeriod === '7d') return Date.now() - 7 * 24 * 3600 * 1000;
    if (selectedPeriod === '30d') return Date.now() - 30 * 24 * 3600 * 1000;
    return 0;
  })();

  const filteredLeads = leads
    .filter((lead) => {
      const matchesSearch =
        lead.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        lead.phone.includes(searchQuery);

      const matchesStatus =
        selectedStatus === 'All' ||
        (selectedStatus === FOLLOWUP_FILTER
          ? needsFollowUp(lead)
          : selectedStatus === 'trial'
          ? lead.status === 'Sinov darsi belgilandi' || lead.status === 'Sinov darsi yakunlandi'
          : lead.status === selectedStatus);
      const matchesCourse = selectedCourse === 'All' || lead.course === selectedCourse;
      const matchesSource = selectedSource === 'All' || (lead.source || 'Sayt orqali ariza') === selectedSource;
      const matchesAssigned = selectedAssigned === 'All' || (lead.assignedTo || '') === selectedAssigned;
      const matchesPeriod = filterCutoff === 0 || new Date(lead.createdAt).getTime() >= filterCutoff;

      return matchesSearch && matchesStatus && matchesCourse && matchesSource && matchesAssigned && matchesPeriod;
    })
    .sort((a, b) => {
      const diff = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      return sortOrder === 'desc' ? -diff : diff;
    });

  const assignedOptions = Array.from(new Set(leads.map((l) => l.assignedTo).filter((x): x is string => Boolean(x)))).sort();

  // Source filter options derived from real records (keeps historical sources filterable)
  const sourceOptions = Array.from(new Set(leads.map((l) => l.source).filter((x): x is string => Boolean(x))));

  const hasActiveFilters =
    searchQuery !== '' ||
    selectedStatus !== 'All' ||
    selectedCourse !== 'All' ||
    selectedSource !== 'All' ||
    selectedAssigned !== 'All' ||
    selectedPeriod !== 'All';

  const statusCount = (st: LeadStatus) => leads.filter((l) => l.status === st).length;
  const trialCount = leads.filter((l) => l.status === 'Sinov darsi belgilandi' || l.status === 'Sinov darsi yakunlandi').length;
  const followUpCount = leads.filter((l) => needsFollowUp(l)).length;

  const KPI_CARDS: { key: string; label: string; count: number; active: boolean; tone: string }[] = [
    { key: 'Yangi', label: 'Yangi', count: statusCount('Yangi'), active: selectedStatus === 'Yangi', tone: 'blue' },
    { key: FOLLOWUP_FILTER, label: 'Kuzatuv kerak', count: followUpCount, active: selectedStatus === FOLLOWUP_FILTER, tone: 'amber' },
    { key: 'trial', label: 'Sinov darsi', count: trialCount, active: selectedStatus === 'trial', tone: 'purple' },
    { key: "O'quvchiga aylandi", label: 'Yozilgan', count: statusCount("O'quvchiga aylandi"), active: selectedStatus === "O'quvchiga aylandi", tone: 'emerald' },
    { key: "Yo'qotildi", label: "Yo'qotilgan", count: statusCount("Yo'qotildi"), active: selectedStatus === "Yo'qotildi", tone: 'slate' },
  ];

  const trialScheduledLeads = leads.filter((l) => l.status === 'Sinov darsi belgilandi');

  return (
    <div className="space-y-6">
      {/* Top Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            Murojaatlar CRM
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Arizalarni qabul qiling, kuzating va o'quvchiga aylantiring.
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

      {/* KPI Row (all real CRM data) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {KPI_CARDS.map((kpi) => (
          <button
            key={kpi.key}
            onClick={() => setSelectedStatus(selectedStatus === kpi.key ? 'All' : kpi.key)}
            className={`p-4 rounded-2xl border text-left transition cursor-pointer ${
              kpi.active
                ? 'bg-amber-500/10 border-amber-500/40 ring-1 ring-amber-500/30'
                : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-amber-300 dark:hover:border-amber-500/40'
            }`}
          >
            <span
              className={`text-[11px] sm:text-xs font-bold block ${
                kpi.tone === 'amber'
                  ? 'text-amber-600 dark:text-amber-400'
                  : kpi.tone === 'purple'
                  ? 'text-purple-600 dark:text-purple-400'
                  : kpi.tone === 'emerald'
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : kpi.tone === 'blue'
                  ? 'text-blue-600 dark:text-blue-400'
                  : kpi.tone === 'slate'
                  ? 'text-slate-500 dark:text-slate-400'
                  : 'text-slate-500 dark:text-slate-400'
              }`}
            >
              {kpi.label}
            </span>
            <div className="text-2xl font-black text-slate-900 dark:text-white mt-1">
              {kpi.count}
            </div>
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
            className="w-full md:w-auto px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500 cursor-pointer"
          >
            <option value="All">Barcha holatlar</option>
            <option value={FOLLOWUP_FILTER}>Kuzatuv kerak ({followUpCount})</option>
            {ALL_STATUSES.map((st) => (
              <option key={st} value={st}>
                {st} ({statusCount(st)})
              </option>
            ))}
          </select>

          <select
            value={selectedCourse}
            onChange={(e) => setSelectedCourse(e.target.value)}
            className="w-full md:w-auto px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500 cursor-pointer"
          >
            <option value="All">Barcha kurslar</option>
            {courses.map((c) => (
              <option key={c.id} value={c.title}>{c.title}</option>
            ))}
          </select>

          <select
            value={selectedSource}
            onChange={(e) => setSelectedSource(e.target.value)}
            className="w-full md:w-auto px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500 cursor-pointer"
          >
            <option value="All">Manba: barchasi</option>
            {sourceOptions.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>

          <select
            value={selectedAssigned}
            onChange={(e) => setSelectedAssigned(e.target.value)}
            className="w-full md:w-auto px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-none cursor-pointer"
          >
            <option value="All">Mas'ul: barchasi</option>
            {assignedOptions.map((a) => (
              <option key={a} value={a as string}>{a}</option>
            ))}
          </select>

          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
            className="w-full md:w-auto px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-none cursor-pointer"
          >
            <option value="All">Davr: barchasi</option>
            <option value="today">Bugun</option>
            <option value="7d">Oxirgi 7 kun</option>
            <option value="30d">Oxirgi 30 kun</option>
          </select>

          <button
            onClick={() => setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc')}
            className="px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 focus:outline-none cursor-pointer hover:border-amber-400 transition"
            title="Murojaatlar tartibi"
          >
            {sortOrder === 'desc' ? 'Yangi birinchi' : 'Eski birinchi'}
          </button>

          {hasActiveFilters && (
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedStatus('All');
                setSelectedCourse('All');
                setSelectedSource('All');
                setSelectedAssigned('All');
                setSelectedPeriod('All');
                setSortOrder('desc');
              }}
              className="px-3 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
            >
              <FilterX className="w-3.5 h-3.5" />
              <span>Filtrlarni tozalash</span>
            </button>
          )}
        </div>
      </div>

      {/* CRM Leads Table */}
      <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                <th className="py-3.5 px-4">Ariza</th>
                <th className="py-3.5 px-4">Kurs</th>
                <th className="py-3.5 px-4">Manba</th>
                <th className="py-3.5 px-4">Holat</th>
                <th className="py-3.5 px-4">Mas'ul</th>
                <th className="py-3.5 px-4">Qo'shilgan</th>
                <th className="py-3.5 px-4">Kuzatuv</th>
                <th className="py-3.5 px-4 text-right">Amallar</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredLeads.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400 text-xs">
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
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 dark:text-white">
                          {lead.name}
                        </span>
                        {followUpLevel(lead) === 'overdue' && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/30 text-[9px] font-black uppercase">
                            <Clock className="w-2.5 h-2.5" />
                            Kechikkan
                          </span>
                        )}
                        {followUpLevel(lead) === 'today' && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/30 text-[9px] font-black uppercase">
                            <Clock className="w-2.5 h-2.5" />
                            Bugun
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-xs font-mono text-slate-400 mt-0.5">
                        <a
                          href={`tel:${lead.phone}`}
                          className="hover:text-emerald-500 flex items-center gap-1"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Phone className="w-3 h-3" />
                          {lead.phone}
                        </a>
                        {lead.telegramUsername && (
                          <a
                            href={`https://t.me/${lead.telegramUsername.replace(/^@/, '')}`}
                            target="_blank"
                            rel="noreferrer"
                            className="hover:text-sky-500"
                            title="Telegramda ochish"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <Send className="w-3 h-3" />
                          </a>
                        )}
                      </div>
                      {lead.trialDateTime && (
                        <div className="flex items-center gap-1 text-[10px] font-semibold text-purple-600 dark:text-purple-400 mt-0.5">
                          <Calendar className="w-3 h-3" />
                          {new Date(lead.trialDateTime).toLocaleString('uz-UZ', {
                            day: '2-digit',
                            month: 'short',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                          {lead.trialRoom ? ` • ${lead.trialRoom}` : ''}
                        </div>
                      )}
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="font-semibold text-amber-600 dark:text-amber-400">
                        {lead.course || '—'}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-xs text-slate-600 dark:text-slate-300">
                      {lead.source || '—'}
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

                    <td className="py-3.5 px-4 text-xs text-slate-600 dark:text-slate-300">
                      {lead.assignedTo || '—'}
                    </td>

                    <td className="py-3.5 px-4 text-xs text-slate-500 dark:text-slate-400">
                      {formatDate(lead.createdAt)}
                    </td>

                    <td className="py-3.5 px-4">
                      {followUpLevel(lead) === 'overdue' ? (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleMarkContacted(lead);
                          }}
                          className="px-2.5 py-1 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 text-[11px] font-bold transition cursor-pointer flex items-center gap-1"
                        >
                          <Phone className="w-3 h-3" />
                          Bog'lanish
                        </button>
                      ) : followUpLevel(lead) === 'today' ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/30 text-[10px] font-black uppercase">
                          <Clock className="w-2.5 h-2.5" />
                          Bugun
                        </span>
                      ) : (
                        <span className="text-xs text-slate-300 dark:text-slate-600">—</span>
                      )}
                    </td>

                    <td className="py-3.5 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleOpenDetail(lead)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-amber-500 hover:bg-amber-500/10 transition cursor-pointer"
                          title="Ko'rish / Tahrirlash"
                        >
                          <Eye className="w-4 h-4" />
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
            <div className="mt-5 grid grid-cols-1 sm:grid-cols-3 gap-3">
              <a
                href={`tel:${detailLead.phone}`}
                className="py-2.5 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition"
              >
                <Phone className="w-4 h-4" />
                <span>Qo'ng'iroq</span>
              </a>
              {detailLead.telegramUsername ? (
                <a
                  href={`https://t.me/${detailLead.telegramUsername.replace(/^@/, '')}`}
                  target="_blank"
                  rel="noreferrer"
                  className="py-2.5 px-4 rounded-xl bg-sky-500 hover:bg-sky-600 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition"
                >
                  <Send className="w-4 h-4" />
                  <span>Telegram</span>
                </a>
              ) : (
                <div
                  className="py-2.5 px-4 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-400 font-bold text-xs flex items-center justify-center gap-2"
                  title="Telegram username kiritilmagan"
                >
                  <Send className="w-4 h-4" />
                  <span>Telegram yo‘q</span>
                </div>
              )}
              <button
                onClick={() => handleMarkContacted(detailLead)}
                disabled={detailLead.status === "Yo'qotildi"}
                className={`py-2.5 px-4 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition ${
                  detailLead.status === "Yo'qotildi"
                    ? 'bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-not-allowed'
                    : 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-sm cursor-pointer'
                }`}
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Bog'lanildi deb belgilash</span>
              </button>
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
                      Keyingi harakat
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

              {/* FOLLOW-UP STATUS */}
              <section>
                <h4 className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5" /> 4. Faoliyat (kelib tushish tarixi)
                </h4>
                <div className="rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800 p-4 space-y-3">
                  {(function renderTimeline() {
                    const events: { label: string; when: string; tone: string }[] = [];
                    events.push({
                      label: 'Ariza qabul qilindi',
                      when: formatDateTime(detailLead.createdAt),
                      tone: 'bg-blue-500',
                    });
                    if (detailLead.lastContactedAt) {
                      events.push({
                        label: 'So\'nggi murojaat',
                        when: formatDateTime(detailLead.lastContactedAt),
                        tone: 'bg-emerald-500',
                      });
                    }
                    if (detailLead.nextAction) {
                      events.push({
                        label: 'Keyingi harakat: ' + detailLead.nextAction,
                        when: detailLead.lastContactedAt ? formatDateTime(detailLead.lastContactedAt) : 'Reja',
                        tone: 'bg-amber-500',
                      });
                    }
                    if (detailLead.trialDateTime) {
                      events.push({
                        label: 'Sinov darsi belgilandi',
                        when: formatDateTime(detailLead.trialDateTime),
                        tone: 'bg-purple-500',
                      });
                    }
                    if (detailLead.status === "O'quvchiga aylandi") {
                      events.push({ label: "O'quvchiga aylantirildi", when: 'O\'quvchilar bo\'limida', tone: 'bg-emerald-600' });
                    }
                    if (detailLead.status === "Yo'qotildi") {
                      events.push({ label: 'Ariza yo\'qotildi', when: detailLead.lostReason || 'Sabab ko\'rsatilmagan', tone: 'bg-slate-500' });
                    }
                    return events.map((ev, i) => (
                      <div key={i} className="flex items-start gap-3">
                        <div className={`w-2 h-2 rounded-full ${ev.tone} mt-1.5 shrink-0`} />
                        <div className="min-w-0">
                          <div className="text-xs font-bold text-slate-800 dark:text-slate-200">{ev.label}</div>
                          <div className="text-[10px] text-slate-400">{ev.when}</div>
                        </div>
                      </div>
                    ));
                  })()}
                  <LeadTimelineHistory leadId={detailLead.id} />
                </div>
              </section>

              {/* NOTES */}
              <section>
                <h4 className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5" /> 5. Konsultatsiya & Izohlar
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
                    <option value="Paid">To‘langan</option>
                    <option value="Due">Kutilmoqda</option>
                    <option value="Overdue">Muddati o‘tgan</option>
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
              {newError && (
                <div className="p-3 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs font-bold flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  {newError}
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                  Ism / F.I.Sh. *
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
                  Telefon raqami *
                </label>
                <input
                  type="tel"
                  required
                  placeholder="+998 90 123 45 67"
                  value={newPhone}
                  onChange={(e) => setNewPhone(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500 font-mono"
                />
                <p className="text-[10px] text-slate-400 mt-1">+998 (XX) XXX-XX-XX formatida kiritilishi shart.</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                    Kurs *
                  </label>
                  <select
                    value={newCourse}
                    onChange={(e) => setNewCourse(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500 cursor-pointer"
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
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500 cursor-pointer"
                  >
                    {SOURCE_OPTIONS.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                    Mas'ul xodim
                  </label>
                  <input
                    type="text"
                    value={newAssigned}
                    onChange={(e) => setNewAssigned(e.target.value)}
                    placeholder="Masalan: Qabulxona"
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                    Sinov darsi vaqti (ixtiyoriy)
                  </label>
                  <input
                    type="datetime-local"
                    value={newTrialDate}
                    onChange={(e) => setNewTrialDate(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">Kiritilsa, ariza "Sinov darsi belgilandi" holatida saqlanadi.</p>
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
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
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

/** Persisted per-lead event history (append-only, best-effort). */
const LeadTimelineHistory: React.FC<{ leadId: string }> = ({ leadId }) => {
  const [events, setEvents] = useState<Array<{ id: string; type: string; message: string; actor?: string; createdAt: string }>>([]);
  useEffect(() => {
    const unsub = leadTimelineService.subscribeToLead(leadId, setEvents);
    return () => unsub();
  }, [leadId]);
  if (events.length === 0) return null;
  return (
    <div className="pt-3 mt-1 border-t border-slate-200/70 dark:border-slate-700/60 space-y-3">
      <div className="text-[10px] font-black uppercase tracking-wider text-slate-400">Qayd etilgan harakatlar</div>
      {events.map((ev) => (
        <div key={ev.id} className="flex items-start gap-3">
          <div className="w-2 h-2 rounded-full bg-sky-500 mt-1.5 shrink-0" />
          <div className="min-w-0">
            <div className="text-xs font-bold text-slate-800 dark:text-slate-200 break-words">{ev.message}</div>
            <div className="text-[10px] text-slate-400">
              {formatDateTime(ev.createdAt)}{ev.actor ? ` • ${ev.actor}` : ''}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};