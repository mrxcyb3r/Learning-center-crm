import React, { useState, useEffect, useCallback, useRef } from 'react';
import { toast } from 'react-toastify';
import { useLanguage } from '../../context/LanguageContext';
import {
  subscribeInquiries,
  updateInquiryStatus,
  subscribeGroups,
  convertInquiryToStudentBatch
} from '../../services/firestore';
import { Inquiry, Group } from '../../types';
import {
  PhoneCall,
  Search,
  CheckCircle2,
  Clock,
  XCircle,
  UserPlus,
  Phone,
  BookOpen,
  MessageSquare,
  Calendar,
  Sparkles,
  DollarSign,
  X,
  Copy,
  Check,
  Loader2,
  Lock
} from 'lucide-react';

const MOCK_INQUIRIES: Inquiry[] = [
  {
    id: 'inq-1',
    fullName: 'Shohruh Olimov',
    phoneNumber: '+998 90 456 78 90',
    selectedCourse: 'ielts-rocket',
    message: 'IELTS 7.5+ guruhiga yozilmoqchiman. Darslar soat 14:00 da bo\'ladimi?',
    status: 'new',
    createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString()
  },
  {
    id: 'inq-2',
    fullName: 'Dilnoza Axmedova',
    phoneNumber: '+998 93 111 22 33',
    selectedCourse: 'cefr-fasttrack',
    message: 'CEFR B2 imtihoniga tayyorlanish uchun 2 oylik kurs kerak.',
    status: 'new',
    createdAt: new Date(Date.now() - 1000 * 60 * 180).toISOString()
  },
  {
    id: 'inq-3',
    fullName: 'Sardor Qodirov',
    phoneNumber: '+998 97 999 88 77',
    selectedCourse: 'general-english',
    message: 'Noldan o\'rganmoqchiman. Boshlang\'ich guruh bormi?',
    status: 'contacted',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString()
  },
  {
    id: 'inq-4',
    fullName: 'Aziza Yusupova',
    phoneNumber: '+998 91 333 44 55',
    selectedCourse: 'kids-english',
    message: 'Farzandim uchun ingliz tili darsi bo\'yicha ma\'lumot olmoqchiman.',
    status: 'enrolled',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString()
  }
];

export const InquiriesView: React.FC = () => {
  const { language } = useLanguage();

  const t = useCallback(
    (uz: string, en: string, ru: string) => {
      if (language === 'UZ') return uz;
      if (language === 'RU') return ru;
      return en;
    },
    [language]
  );

  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Per-item debouncing & processing loading indicators
  const [processingIds, setProcessingIds] = useState<Set<string>>(new Set());
  const processingIdsRef = useRef<Set<string>>(new Set());
  useEffect(() => {
    processingIdsRef.current = processingIds;
  }, [processingIds]);

  // Filters
  const [activeTab, setActiveTab] = useState<'all' | 'new' | 'contacted' | 'enrolled' | 'dismissed'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Conversion Modal State
  const [conversionModalInquiry, setConversionModalInquiry] = useState<Inquiry | null>(null);
  const [studentFullName, setStudentFullName] = useState('');
  const [studentPhone, setStudentPhone] = useState('');
  const [selectedGroupId, setSelectedGroupId] = useState('');
  const [tuitionFee, setTuitionFee] = useState('650000');
  const [studentPassword, setStudentPassword] = useState('renessans123');
  const [isSubmittingEnroll, setIsSubmittingEnroll] = useState(false);

  // Real-time Firestore Subscribers with Optimistic Guard
  useEffect(() => {
    let isMounted = true;

    const unsubInq = subscribeInquiries((data) => {
      if (!isMounted) return;
      if (data && data.length > 0) {
        setInquiries((prevInqs) => {
          if (prevInqs.length === 0) return data;
          // Merge remote data preserving items currently undergoing local optimistic processing
          return data.map((remoteItem) => {
            if (processingIdsRef.current.has(remoteItem.id)) {
              const localItem = prevInqs.find((p) => p.id === remoteItem.id);
              return localItem || remoteItem;
            }
            return remoteItem;
          });
        });
      } else {
        setInquiries((prev) => (prev.length === 0 ? MOCK_INQUIRIES : prev));
      }
      setIsLoading(false);
    });

    const unsubGrps = subscribeGroups((data) => {
      if (!isMounted) return;
      setGroups(data);
      if (data.length > 0 && !selectedGroupId) {
        setSelectedGroupId(data[0].id);
      }
    });

    const timer = setTimeout(() => {
      if (isMounted && isLoading) setIsLoading(false);
    }, 1500);

    return () => {
      isMounted = false;
      clearTimeout(timer);
      unsubInq();
      unsubGrps();
    };
  }, []);

  // Fast Optimistic Status Update Handler
  const handleMarkStatus = useCallback(
    async (inquiryId: string, newStatus: 'new' | 'contacted' | 'enrolled' | 'dismissed') => {
      if (processingIdsRef.current.has(inquiryId)) return;

      // 1. Instant local optimistic update
      let previousInquiry: Inquiry | undefined;
      setInquiries((prev) => {
        previousInquiry = prev.find((item) => item.id === inquiryId);
        return prev.map((item) => (item.id === inquiryId ? { ...item, status: newStatus } : item));
      });

      // Mark item as processing for debouncing & spinner
      setProcessingIds((prev) => new Set(prev).add(inquiryId));

      // Instant feedback toast
      const statusLabels = {
        contacted: t("Arizachi bilan bog'lanildi deb belgilandi 🟡", "Marked as Contacted 🟡", "Отмечено как Связались 🟡"),
        enrolled: t("O'quvchi safiga qo'shildi 🟢", "Converted to Student 🟢", "Зачислен в студенты 🟢"),
        dismissed: t("Ariza rad etildi / arxivlandi ⚪", "Inquiry Dismissed ⚪", "Отклонено ⚪"),
        new: t("Yangi deb belgilandi 🔴", "Marked as New 🔴", "Отмечено как Новый 🔴")
      };
      toast.success(statusLabels[newStatus]);

      // 2. Fire-and-forget background write with revert fallback on failure
      try {
        await updateInquiryStatus(inquiryId, newStatus);
      } catch (err) {
        console.error('Failed to update inquiry status:', err);
        // Revert state on network error
        if (previousInquiry) {
          const revertStatus = previousInquiry.status;
          setInquiries((prev) =>
            prev.map((item) => (item.id === inquiryId ? { ...item, status: revertStatus } : item))
          );
        }
        toast.error(t("Statusni yangilashda xatolik yuz berdi", "Error updating status", "Ошибка обновления статуса"));
      } finally {
        setProcessingIds((prev) => {
          const next = new Set(prev);
          next.delete(inquiryId);
          return next;
        });
      }
    },
    [t]
  );

  const handleOpenConversionModal = useCallback(
    (inquiry: Inquiry) => {
      setConversionModalInquiry(inquiry);
      setStudentFullName(inquiry.fullName);
      setStudentPhone(inquiry.phoneNumber);
      setStudentPassword('renessans123');
      if (groups.length > 0) {
        setSelectedGroupId(groups[0].id);
      }
    },
    [groups]
  );

  // Fast Atomic Conversion with WriteBatch
  const handleConfirmConvertStudent = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!conversionModalInquiry) return;
      const inquiryId = conversionModalInquiry.id;

      if (processingIdsRef.current.has(inquiryId)) return;

      if (!studentFullName.trim() || !studentPhone.trim()) {
        toast.error(t("Ism va telefon raqamini to'ldiring", "Fill in name and phone", "Заполните имя и телефон"));
        return;
      }

      setIsSubmittingEnroll(true);
      setProcessingIds((prev) => new Set(prev).add(inquiryId));

      // 1. Instant local optimistic update & close modal
      let previousInquiry: Inquiry | undefined;
      setInquiries((prev) => {
        previousInquiry = prev.find((item) => item.id === inquiryId);
        return prev.map((item) => (item.id === inquiryId ? { ...item, status: 'enrolled' } : item));
      });

      const assignedGroup = groups.find((g) => g.id === selectedGroupId);
      const groupName = assignedGroup ? assignedGroup.name : 'Unassigned';

      setConversionModalInquiry(null);

      toast.success(
        t(
          `✨ ${studentFullName} muvaffaqiyatli o'quvchilar safiga qo'shildi!`,
          `✨ ${studentFullName} successfully registered as active student!`,
          `✨ ${studentFullName} успешно зарегистрирован как студент!`
        )
      );

      // 2. Fire atomic writeBatch in background
      try {
        await convertInquiryToStudentBatch(
          inquiryId,
          {
            fullName: studentFullName.trim(),
            phone: studentPhone.trim(),
            groupId: selectedGroupId || 'default-group',
            groupName,
            tuitionFee: Number(tuitionFee) || 650000,
            paymentStatus: 'pending',
            lastPaymentDate: new Date().toISOString().split('T')[0]
          },
          studentPassword
        );
      } catch (err) {
        console.error('Error converting student in batch:', err);
        // Revert local state on error
        if (previousInquiry) {
          const revertStatus = previousInquiry.status;
          setInquiries((prev) =>
            prev.map((item) => (item.id === inquiryId ? { ...item, status: revertStatus } : item))
          );
        }
        toast.error(t("O'quvchini qo'shishda xatolik yuz berdi", "Error registering student", "Ошибка при регистрации"));
      } finally {
        setIsSubmittingEnroll(false);
        setProcessingIds((prev) => {
          const next = new Set(prev);
          next.delete(inquiryId);
          return next;
        });
      }
    },
    [
      conversionModalInquiry,
      studentFullName,
      studentPhone,
      selectedGroupId,
      tuitionFee,
      studentPassword,
      groups,
      t
    ]
  );

  const copyToClipboard = useCallback(
    (text: string) => {
      navigator.clipboard.writeText(text);
      toast.info(t("Nusxalandi!", "Copied to clipboard!", "Скопировано!"));
    },
    [t]
  );

  // Helper course titles map
  const getCourseBadgeTitle = (courseId: string) => {
    switch (courseId) {
      case 'ielts-rocket':
        return 'IELTS 7.5+ Rocket';
      case 'cefr-fasttrack':
        return 'CEFR B2 FastTrack';
      case 'general-english':
        return 'General English';
      case 'kids-english':
        return 'Kids English';
      case 'it-foundations':
        return 'IT & Computer Science';
      default:
        return courseId || 'General English';
    }
  };

  // Filtered list
  const filteredInquiries = inquiries.filter((inq) => {
    if (activeTab !== 'all' && inq.status !== activeTab) {
      return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = inq.fullName.toLowerCase().includes(q);
      const matchPhone = inq.phoneNumber.toLowerCase().includes(q);
      const matchCourse = inq.selectedCourse.toLowerCase().includes(q);
      const matchMsg = (inq.message || '').toLowerCase().includes(q);
      return matchName || matchPhone || matchCourse || matchMsg;
    }
    return true;
  });

  // Badge counts
  const countNew = inquiries.filter((i) => i.status === 'new').length;
  const countContacted = inquiries.filter((i) => i.status === 'contacted').length;
  const countEnrolled = inquiries.filter((i) => i.status === 'enrolled').length;
  const countDismissed = inquiries.filter((i) => i.status === 'dismissed').length;

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              {t("Arizalar va Lids Menejeri", "Leads & Inquiry Manager", "Управление Заявками и Лидами")}
            </h1>
            {countNew > 0 && (
              <span className="px-2.5 py-0.5 rounded-full bg-rose-500 text-white text-xs font-black animate-pulse">
                {countNew} {t("Yangi", "New", "Новых")}
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-1">
            {t(
              "Lending saytdan tushgan barcha arizalar, darsga yozilish so'rovlari va muloqotlar",
              "Real-time pipeline of incoming trial lesson applications and course inquiries from the website",
              "Все входящие заявки с лендинга и онлайн-записи на курсы"
            )}
          </p>
        </div>

        {/* Action summary badge */}
        <div className="flex items-center gap-2">
          <div className="px-3.5 py-2 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 text-xs font-bold flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-500" />
            <span>{inquiries.length} {t("Jami Arizalar", "Total Inquiries", "Всего Заявок")}</span>
          </div>
        </div>
      </div>

      {/* Analytics KPI Counters */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <button
          onClick={() => setActiveTab('new')}
          className={`p-4 rounded-2xl border transition text-left cursor-pointer ${
            activeTab === 'new'
              ? 'bg-rose-500/10 border-rose-500 text-rose-600 dark:text-rose-400 ring-2 ring-rose-500/30'
              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-rose-300'
          }`}
        >
          <div className="flex items-center justify-between mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              {t("Yangi Arizalar", "New Leads", "Новые Заявки")}
            </span>
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping" />
          </div>
          <p className="text-2xl font-black text-rose-600 dark:text-rose-400">{countNew}</p>
        </button>

        <button
          onClick={() => setActiveTab('contacted')}
          className={`p-4 rounded-2xl border transition text-left cursor-pointer ${
            activeTab === 'contacted'
              ? 'bg-amber-500/10 border-amber-500 text-amber-600 dark:text-amber-400 ring-2 ring-amber-500/30'
              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-amber-300'
          }`}
        >
          <div className="flex items-center justify-between mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              {t("Bog'lanildi", "Contacted", "Связались")}
            </span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <p className="text-2xl font-black text-amber-600 dark:text-amber-400">{countContacted}</p>
        </button>

        <button
          onClick={() => setActiveTab('enrolled')}
          className={`p-4 rounded-2xl border transition text-left cursor-pointer ${
            activeTab === 'enrolled'
              ? 'bg-emerald-500/10 border-emerald-500 text-emerald-600 dark:text-emerald-400 ring-2 ring-emerald-500/30'
              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-emerald-300'
          }`}
        >
          <div className="flex items-center justify-between mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              {t("Qo'shildi / Enrolled", "Enrolled", "Зачислены")}
            </span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400">{countEnrolled}</p>
        </button>

        <button
          onClick={() => setActiveTab('dismissed')}
          className={`p-4 rounded-2xl border transition text-left cursor-pointer ${
            activeTab === 'dismissed'
              ? 'bg-slate-500/10 border-slate-500 text-slate-600 dark:text-slate-400 ring-2 ring-slate-500/30'
              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-400'
          }`}
        >
          <div className="flex items-center justify-between mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              {t("Rad etilgan", "Dismissed", "Отклонены")}
            </span>
            <XCircle className="w-4 h-4 text-slate-400" />
          </div>
          <p className="text-2xl font-black text-slate-600 dark:text-slate-400">{countDismissed}</p>
        </button>
      </div>

      {/* Search & Status Filter Tabs Bar */}
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Status Filter Tabs */}
        <div className="flex flex-wrap items-center gap-1.5 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
          <button
            onClick={() => setActiveTab('all')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer whitespace-nowrap ${
              activeTab === 'all'
                ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-sm'
                : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300 hover:bg-slate-200'
            }`}
          >
            {t("Barchasi", "All", "Все")} ({inquiries.length})
          </button>

          <button
            onClick={() => setActiveTab('new')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'new'
                ? 'bg-rose-500 text-white shadow-sm shadow-rose-500/20'
                : 'bg-slate-100 text-rose-600 dark:bg-slate-800 dark:text-rose-400 hover:bg-rose-500/10'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-rose-400 animate-pulse" />
            {t("Yangi", "New", "Новые")} ({countNew})
          </button>

          <button
            onClick={() => setActiveTab('contacted')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'contacted'
                ? 'bg-amber-500 text-slate-950 shadow-sm shadow-amber-500/20'
                : 'bg-slate-100 text-amber-600 dark:bg-slate-800 dark:text-amber-400 hover:bg-amber-500/10'
            }`}
          >
            <Clock className="w-3.5 h-3.5 text-amber-500" />
            {t("Bog'lanildi", "Contacted", "Связались")} ({countContacted})
          </button>

          <button
            onClick={() => setActiveTab('enrolled')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'enrolled'
                ? 'bg-emerald-500 text-white shadow-sm shadow-emerald-500/20'
                : 'bg-slate-100 text-emerald-600 dark:bg-slate-800 dark:text-emerald-400 hover:bg-emerald-500/10'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            {t("O'quvchi bo'ldi", "Enrolled", "Зачислены")} ({countEnrolled})
          </button>

          <button
            onClick={() => setActiveTab('dismissed')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'dismissed'
                ? 'bg-slate-600 text-white shadow-sm'
                : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400 hover:bg-slate-200'
            }`}
          >
            <XCircle className="w-3.5 h-3.5" />
            {t("Rad etilgan", "Dismissed", "Отклонены")} ({countDismissed})
          </button>
        </div>

        {/* Search Bar */}
        <div className="relative w-full md:w-72 shrink-0">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t("Ism yoki tel bo'yicha qidiruv...", "Search name or phone...", "Поиск по имени или телефону...")}
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500 focus:outline-none"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Main Inquiries List */}
      {isLoading ? (
        <div className="p-12 text-center text-slate-400 space-y-3">
          <div className="w-8 h-8 border-3 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs font-bold">{t("Arizalar yuklanmoqda...", "Loading inquiries...", "Загрузка заявок...")}</p>
        </div>
      ) : filteredInquiries.length === 0 ? (
        <div className="p-12 text-center rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3">
          <PhoneCall className="w-10 h-10 text-slate-300 mx-auto" />
          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">
            {t("Hech qanday ariza topilmadi", "No inquiries found", "Заявки не найдены")}
          </h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            {searchQuery
              ? t("Qidiruvingiz bo'yicha ariza topilmadi. Qidiruvni tozalab ko'ring.", "No results matching search query.", "Нет результатов по вашему запросу.")
              : t("Ushbu status toifasida ariza mavjud emas.", "No inquiries in this status category.", "Нет заявок в этой категории.")}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredInquiries.map((inquiry) => {
            const isNew = inquiry.status === 'new';
            const isContacted = inquiry.status === 'contacted';
            const isEnrolled = inquiry.status === 'enrolled';
            const isDismissed = inquiry.status === 'dismissed';
            const isProcessing = processingIds.has(inquiry.id);

            return (
              <div
                key={inquiry.id}
                className={`p-5 rounded-3xl border transition shadow-sm flex flex-col justify-between space-y-4 ${
                  isNew
                    ? 'bg-white dark:bg-slate-900 border-rose-500/30 dark:border-rose-500/20 shadow-rose-500/5 ring-1 ring-rose-500/20'
                    : isContacted
                    ? 'bg-white dark:bg-slate-900 border-amber-500/30 dark:border-amber-500/20'
                    : isEnrolled
                    ? 'bg-white dark:bg-slate-900 border-emerald-500/30 dark:border-emerald-500/20 opacity-90'
                    : 'bg-slate-50/70 dark:bg-slate-900/40 border-slate-200 dark:border-slate-800 opacity-75'
                }`}
              >
                <div className="space-y-3">
                  {/* Lead Header */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h3 className="text-base font-black text-slate-900 dark:text-white tracking-tight">
                          {inquiry.fullName}
                        </h3>
                        {isNew && (
                          <span className="px-2 py-0.5 rounded-md bg-rose-500 text-white text-[10px] font-black uppercase tracking-wider">
                            🔴 NEW
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-xs">
                        <Phone className="w-3.5 h-3.5 text-amber-500" />
                        <a
                          href={`tel:${inquiry.phoneNumber}`}
                          className="font-bold text-slate-800 dark:text-slate-200 hover:text-amber-500 hover:underline transition"
                        >
                          {inquiry.phoneNumber}
                        </a>
                        <button
                          type="button"
                          onClick={() => copyToClipboard(inquiry.phoneNumber)}
                          className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 cursor-pointer"
                          title="Copy phone"
                        >
                          <Copy className="w-3 h-3" />
                        </button>
                      </div>
                    </div>

                    {/* Status Pill */}
                    <div>
                      {isNew && (
                        <span className="px-3 py-1 rounded-full bg-rose-500/10 text-rose-600 dark:text-rose-400 text-xs font-bold border border-rose-500/20 flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                          {t("Yangi Ariza", "New Lead", "Новая")}
                        </span>
                      )}
                      {isContacted && (
                        <span className="px-3 py-1 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 text-xs font-bold border border-amber-500/20 flex items-center gap-1.5">
                          <Clock className="w-3 h-3 text-amber-500" />
                          {t("Bog'lanildi", "Contacted", "Связались")}
                        </span>
                      )}
                      {isEnrolled && (
                        <span className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-bold border border-emerald-500/20 flex items-center gap-1.5">
                          <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                          {t("O'quvchi bo'ldi", "Enrolled", "Зачислен")}
                        </span>
                      )}
                      {isDismissed && (
                        <span className="px-3 py-1 rounded-full bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400 text-xs font-medium flex items-center gap-1.5">
                          <XCircle className="w-3 h-3" />
                          {t("Rad etildi", "Dismissed", "Отклонено")}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Course & Date Info */}
                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    <span className="px-3 py-1 rounded-xl bg-amber-500/10 text-amber-700 dark:text-amber-300 text-xs font-bold flex items-center gap-1.5">
                      <BookOpen className="w-3.5 h-3.5 text-amber-500" />
                      {getCourseBadgeTitle(inquiry.selectedCourse)}
                    </span>
                    <span className="text-[11px] font-medium text-slate-400 flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      {new Date(inquiry.createdAt).toLocaleString()}
                    </span>
                  </div>

                  {/* Message / Inquiry detail */}
                  {inquiry.message && (
                    <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 text-xs text-slate-700 dark:text-slate-300 flex items-start gap-2">
                      <MessageSquare className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                      <p className="leading-relaxed whitespace-pre-line">{inquiry.message}</p>
                    </div>
                  )}
                </div>

                {/* Quick Action Controls */}
                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-2">
                    {/* Mark as Contacted */}
                    {!isContacted && !isEnrolled && (
                      <button
                        onClick={() => handleMarkStatus(inquiry.id, 'contacted')}
                        disabled={isProcessing}
                        className={`px-3 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30 text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                          isProcessing ? 'opacity-60 cursor-not-allowed' : ''
                        }`}
                      >
                        {isProcessing ? (
                          <Loader2 className="w-3.5 h-3.5 text-amber-500 animate-spin" />
                        ) : (
                          <Clock className="w-3.5 h-3.5 text-amber-500" />
                        )}
                        <span>{t("Bog'lanildi deb belgilash", "Mark Contacted", "Отметить звонок")}</span>
                      </button>
                    )}

                    {/* Convert to Student */}
                    {!isEnrolled && (
                      <button
                        onClick={() => handleOpenConversionModal(inquiry)}
                        disabled={isProcessing}
                        className={`px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-white text-xs font-bold transition cursor-pointer flex items-center gap-1.5 shadow-sm shadow-emerald-500/20 ${
                          isProcessing ? 'opacity-60 cursor-not-allowed' : ''
                        }`}
                      >
                        {isProcessing ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <UserPlus className="w-3.5 h-3.5" />
                        )}
                        <span>{t("O'quvchiga aylantirish", "Convert to Student", "Зачислить в группу")}</span>
                      </button>
                    )}
                  </div>

                  {/* Dismiss */}
                  {!isDismissed && (
                    <button
                      onClick={() => handleMarkStatus(inquiry.id, 'dismissed')}
                      disabled={isProcessing}
                      className={`px-2.5 py-1.5 rounded-xl text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 text-xs font-semibold transition cursor-pointer flex items-center gap-1 ${
                        isProcessing ? 'opacity-60 cursor-not-allowed' : ''
                      }`}
                      title="Dismiss inquiry"
                    >
                      {isProcessing ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <XCircle className="w-3.5 h-3.5" />
                      )}
                      <span>{t("Bekor qilish", "Dismiss", "Отклонить")}</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* CONVERSION MODAL: Register Lead as Active Student */}
      {conversionModalInquiry && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl p-6 space-y-5 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-500">
                  <UserPlus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900 dark:text-white">
                    {t("O'quvchini Ro'yxatdan O'tkazish", "Register as Active Student", "Зачислить Студента")}
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    {t("Arizani rasmiy o'quvchi profiliga va guruhiga biriktirish", "Convert prospective lead to official active student", "Привязать заявку к студенту и группе")}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setConversionModalInquiry(null)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleConfirmConvertStudent} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  {t("O'quvchi to'liq ism-sharifi", "Student Full Name", "ФИО Студента")}
                </label>
                <input
                  type="text"
                  required
                  value={studentFullName}
                  onChange={(e) => setStudentFullName(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  {t("Telefon Raqami", "Phone Number", "Номер Телефона")}
                </label>
                <input
                  type="text"
                  required
                  value={studentPhone}
                  onChange={(e) => setStudentPhone(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  {t("Biriktiriladigan O'quv Guruhi", "Assign Study Group", "Назначить Учебную Группу")}
                </label>
                <select
                  value={selectedGroupId}
                  onChange={(e) => setSelectedGroupId(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500"
                >
                  {groups.length === 0 ? (
                    <option value="default-group">IELTS Intensive #12</option>
                  ) : (
                    groups.map((g) => (
                      <option key={g.id} value={g.id}>
                        {g.name} — ({g.courseType})
                      </option>
                    ))
                  )}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  {t("Oylik Kontrakt Summasi (UZS)", "Monthly Tuition Fee (UZS)", "Стоимость Оплаты (сум)")}
                </label>
                <div className="relative">
                  <DollarSign className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="number"
                    required
                    value={tuitionFee}
                    onChange={(e) => setTuitionFee(e.target.value)}
                    className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  {t("Tizimga kirish paroli (Default)", "Portal Password (Default)", "Пароль для входа")}
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    value={studentPassword}
                    onChange={(e) => setStudentPassword(e.target.value)}
                    className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 font-mono"
                  />
                </div>
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setConversionModalInquiry(null)}
                  className="px-4 py-2 rounded-xl text-slate-600 dark:text-slate-300 text-xs font-bold hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                >
                  {t("Bekor qilish", "Cancel", "Отмена")}
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingEnroll}
                  className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-white text-xs font-black shadow-lg shadow-emerald-500/20 transition cursor-pointer flex items-center gap-2 disabled:opacity-50"
                >
                  {isSubmittingEnroll ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>{t("Saqlanmoqda...", "Saving...", "Сохранение...")}</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      <span>{t("O'quvchini Saqlash va Qabul Qilish", "Enroll & Confirm Student", "Зачислить Студента")}</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
