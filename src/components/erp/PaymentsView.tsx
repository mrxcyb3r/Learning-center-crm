import React, { useState, useEffect } from 'react';
import {
  CreditCard,
  Plus,
  CheckCircle2,
  AlertTriangle,
  Search,
  DollarSign,
  Printer,
  Trash2,
  X,
  FileText,
} from 'lucide-react';
import { paymentsService, invoicesService, studentsService, coursesService, settingsService } from '../../services/repository';
import { CourseData, IncomePaymentRecord, StudentRecord, Invoice } from '../../types/crm';
import { formatCurrency, formatCurrencyShort } from '../../utils/format';
import { ReceiptModal } from './ReceiptModal';
import { InvoiceModal } from './InvoiceModal';
import { getReceiptNumber, ReceiptCenter } from '../../utils/receipt';
import { useLanguage } from '../../context/LanguageContext';

const UZ_MONTHS = [
  'Yanvar', 'Fevral', 'Mart', 'Aprel', 'May', 'Iyun',
  'Iyul', 'Avgust', 'Sentyabr', 'Oktyabr', 'Noyabr', 'Dekabr',
];

function currentMonthLabel(): string {
  const now = new Date();
  return `${UZ_MONTHS[now.getMonth()]} ${now.getFullYear()}`;
}

export const PaymentsView: React.FC<{ readOnly?: boolean; allowCreate?: boolean }> = ({ readOnly = false, allowCreate = false }) => {
  const { language, counter } = useLanguage();
  const t = (uz: string, en: string, ru: string) => (language === 'EN' ? en : language === 'RU' ? ru : uz);

  const [payments, setPayments] = useState<IncomePaymentRecord[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [students, setStudents] = useState<StudentRecord[]>([]);
  const [courses, setCourses] = useState<CourseData[]>([]);
  const [search, setSearch] = useState('');
  const [methodFilter, setMethodFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [viewReceipt, setViewReceipt] = useState<IncomePaymentRecord | null>(null);
  const [receiptSuccess, setReceiptSuccess] = useState(false);
  const [viewInvoice, setViewInvoice] = useState<Invoice | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [noticeTone, setNoticeTone] = useState<'ok' | 'err'>('ok');
  const [center, setCenter] = useState<ReceiptCenter>({
    name: "Renessans O'quv Markazi",
    address: '',
    phone: '',
    stir: '',
    telegram: '',
    workingHours: '',
  });

  // Add Form
  const [formStudentId, setFormStudentId] = useState('');
  const [formStudentName, setFormStudentName] = useState('');
  const [formCourse, setFormCourse] = useState('');
  const [formAmount, setFormAmount] = useState('380000');
  const [formMethod, setFormMethod] = useState<'Click' | 'Payme' | 'Cash' | 'Card'>('Click');
  const [formMonth, setFormMonth] = useState(currentMonthLabel());
  const [formTrx, setFormTrx] = useState('');

  const refresh = async () => {
    const [paymentsData, studentsData, coursesData, invoicesData] = await Promise.all([
      paymentsService.getAllPayments(),
      studentsService.getAllStudents(),
      coursesService.getAllCourses(),
      invoicesService.getAllInvoices()
    ]);
    setPayments(paymentsData as unknown as IncomePaymentRecord[]);
    setStudents(studentsData as unknown as StudentRecord[]);
    setCourses(coursesData as unknown as CourseData[]);
    setInvoices(invoicesData);
  };

  useEffect(() => {
    refresh();
    settingsService
      .getSettings()
      .then((s) => {
        if (s) {
          setCenter({
            name: s.centerName || "Renessans O'quv Markazi",
            address: s.branches?.[0]?.address || '',
            phone: s.hotline || '',
            stir: s.stir || '',
            telegram: s.telegramSettings?.botUsername
              ? `@${String(s.telegramSettings.botUsername).replace(/^@/, '')}`
              : '',
            workingHours: s.workingHours || '',
          });
        }
      })
      .catch(() => {
        // Center info falls back to the defaults above.
      });
  }, []);

  const showNotification = (msg: string, tone: 'ok' | 'err' = 'ok') => {
    setNotice(msg);
    setNoticeTone(tone);
    setTimeout(() => setNotice(null), 5000);
  };

  const handleOpenAdd = () => {
    const firstStudent = students[0];
    if (firstStudent) {
      setFormStudentId(firstStudent.id);
      setFormStudentName(firstStudent.fullName || firstStudent.name);
      setFormCourse(firstStudent.course);
      setFormAmount(String(Number(firstStudent.monthlyFee) || Number(firstStudent.tuitionFee) || 380000));
    } else {
      setFormStudentId('');
      setFormStudentName('');
      setFormCourse(courses[0]?.title || 'DTM & Milliy Sertifikat');
      setFormAmount('380000');
    }
    setFormMethod('Click');
    setFormMonth(currentMonthLabel());
    setFormTrx('');
    setIsAddModalOpen(true);
  };

  const handleStudentSelect = (stId: string) => {
    setFormStudentId(stId);
    const st = students.find((s) => s.id === stId);
    if (st) {
      setFormStudentName(st.fullName || st.name);
      setFormCourse(st.course);
      const debt = Number(st.debtAmount) || 0;
      setFormAmount(String(debt > 0 ? debt : (Number(st.monthlyFee) || Number(st.tuitionFee) || 380000)));
    }
  };

  const handleCreatePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formStudentName.trim()) return;
    if (isSubmitting) return;

    const amount = Number(formAmount);
    if (!Number.isFinite(amount) || amount <= 0) {
      showNotification('To\'lov miqdori noto\'g\'ri — to\'g\'ri raqam kiriting.', 'err');
      return;
    }

    setIsSubmitting(true);
    try {
      const createdId = await paymentsService.recordPayment({
        studentId: formStudentId,
        studentName: formStudentName.trim(),
        course: formCourse,
        courseName: formCourse,
        amount,
        paymentMethod: formMethod.toLowerCase() as 'cash' | 'card' | 'click' | 'payme',
        date: new Date().toISOString().split('T')[0],
        recordedBy: 'Admin',
        status: 'paid',
        cohortGroup: '',
        subjectCategory: formCourse,
        paymentPeriod: formMonth,
        trxId: formTrx.trim() || undefined,
      });

      showNotification(`To'lov (${formatCurrency(amount)}) muvaffaqiyatli qabul qilindi!`, 'ok');
      await refresh();
      setIsAddModalOpen(false);

      // Show the professional receipt for the just-created payment.
      setReceiptSuccess(true);
      setViewReceipt({
        id: createdId,
        studentId: formStudentId,
        studentName: formStudentName.trim(),
        course: formCourse,
        amount,
        method: formMethod as IncomePaymentRecord['method'],
        date: new Date().toISOString().split('T')[0],
        createdAt: new Date().toISOString(),
        receiptNumber: '',
        status: 'Completed',
        recordedBy: 'Admin',
        month: formMonth,
        trxId: formTrx.trim() || undefined,
      } as IncomePaymentRecord);
    } catch (err: any) {
      // Log the actionable technical error; never expose tokens/credentials.
      const code = err?.code || err?.name || 'unknown';
      console.error('[PaymentsView] To\'lovni saqlashda xatolik:', { code, message: err?.message || String(err) });
      const denied = /permission-denied|PERMISSION_DENIED|Missing or insufficient/i.test(String(code) + ' ' + (err?.message || ''));
      showNotification(
        denied
          ? 'Ruxsat etilmagan: to‘lov yozish huquqingiz yo‘q. Administrator bilan bog‘laning.'
          : `To'lov saqlanmadi (${code}). Ma'lumotlarni tekshirib, qayta urinib ko'ring.`,
        'err'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVoidPayment = async (id: string, name: string) => {
    const reason = window.prompt(`"${name}" uchun to'lovni bekor qilish sababini kiriting:`, 'Xato kirish');
    if (reason === null) return; // user cancelled
    if (!window.confirm(`To'lov bekor qilinadimi? Barcha hisob-kitoblardan chiqariladi (bekor qilingan kvitansiya arxivda saqlanadi).`)) {
      return;
    }
    await paymentsService.voidPayment(id, reason.trim() || 'Sabab ko\'rsatilmagan');
    refresh();
    showNotification('To\'lov bekor qilindi va moliya hisob-kitoblaridan olib tashlandi.');
  };

  const activePayments = payments.filter((p) => p.status !== 'Voided');

  const filtered = payments.filter((p) => {
    const matchesSearch =
      p.studentName.toLowerCase().includes(search.toLowerCase()) ||
      p.course.toLowerCase().includes(search.toLowerCase()) ||
      p.id.toLowerCase().includes(search.toLowerCase());

    const matchesMethod = methodFilter === 'All' || p.method === methodFilter;
    const matchesStatus = statusFilter === 'All' || p.status === statusFilter;
    return matchesSearch && matchesMethod && matchesStatus;
  });

  const totalCollected = activePayments.reduce((acc, p) => acc + (p.amount || 0), 0);
  const clickSum = activePayments.filter((p) => p.method === 'Click').reduce((s, p) => s + (p.amount || 0), 0);
  const paymeSum = activePayments.filter((p) => p.method === 'Payme').reduce((s, p) => s + (p.amount || 0), 0);
  const cashSum = activePayments.filter((p) => p.method === 'Cash').reduce((s, p) => s + (p.amount || 0), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            {t("Kassa va O'quvchilar To'lovlari", "Cashier & Student Payments", "Касса и Платежи Учеников")}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            {t(
              "Click, Payme, Naqd pul va Karta orqali qabul qilingan barcha kvitansiyalar.",
              "All receipts accepted via Click, Payme, Cash, and Card.",
              "Все квитанции, принятые через Click, Payme, Наличные и Карты."
            )}
          </p>
        </div>

        {(!readOnly || allowCreate) && (
        <button
          onClick={handleOpenAdd}
          className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-md shadow-amber-500/20 flex items-center gap-1.5 transition cursor-pointer"
        >
          <Plus className="w-4 h-4" aria-hidden="true" />
          <span>{t("Yangi To'lov Qabul Qilish", "Accept New Payment", "Принять Новый Платеж")}</span>
        </button>
        )}
      </div>

      {/* Notice */}
      {notice && (
        <div className={`p-3 rounded-2xl border text-xs font-bold flex items-center gap-2 ${
          noticeTone === 'ok'
            ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400'
            : 'bg-rose-500/10 border-rose-500/30 text-rose-600 dark:text-rose-400'
        }`}>
          {noticeTone === 'ok' ? <CheckCircle2 className="w-4 h-4" aria-hidden="true" /> : <AlertTriangle className="w-4 h-4" aria-hidden="true" />}
          <span>{notice}</span>
        </div>
      )}

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <span className="text-xs font-semibold text-slate-400 block">
            {t("Jami Qabul Qilingan Tushum", "Total Revenue Collected", "Всего Принято Доходов")}
          </span>
          <div className="text-2xl font-black text-slate-900 dark:text-white mt-1 font-mono">
            {formatCurrency(totalCollected)}
          </div>
          <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-bold mt-1 block">
            {counter(activePayments.length, 'activeReceipt')}
          </span>
        </div>

        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <span className="text-xs font-semibold text-sky-500 block">
            {t("Click orqali", "Via Click", "Через Click")}
          </span>
          <div className="text-xl font-black text-slate-900 dark:text-white mt-1 font-mono">
            {formatCurrency(clickSum)}
          </div>
          <span className="text-[11px] text-slate-500 mt-1 block">
            {t("Mobil ilova orqali", "Via mobile app", "Через приложение")}
          </span>
        </div>

        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <span className="text-xs font-semibold text-teal-500 block">
            {t("Payme orqali", "Via Payme", "Через Payme")}
          </span>
          <div className="text-xl font-black text-slate-900 dark:text-white mt-1 font-mono">
            {formatCurrency(paymeSum)}
          </div>
          <span className="text-[11px] text-slate-500 mt-1 block">
            {t("Onlayn to'lov", "Online payment", "Онлайн оплата")}
          </span>
        </div>

        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <span className="text-xs font-semibold text-emerald-500 block">
            {t("Naqd Pul (Kassa)", "Cash (Cashier)", "Наличные (Касса)")}
          </span>
          <div className="text-xl font-black text-slate-900 dark:text-white mt-1 font-mono">
            {formatCurrency(cashSum)}
          </div>
          <span className="text-[11px] text-slate-500 mt-1 block">
            {t("Markaz binosida", "At center premises", "В здании центра")}
          </span>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" aria-hidden="true" />
          <input
            type="text"
            placeholder={t(
              "O'quvchi ismi, kurs yoki kvitansiya raqami bo'yicha qidirish...",
              "Search by student name, course or receipt number...",
              "Поиск по имени учеnika, курсу или номеру квитанции..."
            )}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <select
            value={methodFilter}
            onChange={(e) => setMethodFilter(e.target.value)}
            className="px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-none cursor-pointer"
          >
            <option value="All">{t("Barcha to'lov usullari", "All payment methods", "Все способы оплаты")}</option>
            <option value="Click">Click</option>
            <option value="Payme">Payme</option>
            <option value="Cash">{t("Naqd pul", "Cash", "Наличные")}</option>
            <option value="Card">{t("Bank kartasi", "Bank card", "Банковская карта")}</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-none cursor-pointer"
          >
            <option value="All">{t("Barcha holatlar", "All statuses", "Все статусы")}</option>
            <option value="Completed">{t("Faol", "Active", "Активные")}</option>
            <option value="Voided">{t("Bekor qilingan", "Voided", "Аннулированные")}</option>
          </select>
        </div>
      </div>

      {/* Payments Table */}
      <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                <th scope="col" className="py-3.5 px-4">{t("Kvitansiya #", "Receipt #", "Квитанция #")}</th>
                <th scope="col" className="py-3.5 px-4">{t("Invoice #", "Invoice #", "Инвойс #")}</th>
                <th scope="col" className="py-3.5 px-4">{t("O'quvchi", "Student", "Ученик")}</th>
                <th scope="col" className="py-3.5 px-4">{t("Kurs & Oy", "Course & Month", "Курс и Месяц")}</th>
                <th scope="col" className="py-3.5 px-4">{t("To'lov Usuli", "Payment Method", "Способ Оплаты")}</th>
                <th scope="col" className="py-3.5 px-4">{t("Summa", "Amount", "Сумма")}</th>
                <th scope="col" className="py-3.5 px-4">{t("Sana & Vaqt", "Date & Time", "Дата и Время")}</th>
                <th scope="col" className="py-3.5 px-4 text-right">{t("Amallar", "Actions", "Действия")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-xs text-slate-400">
                    {t("Bu davrda to'lovlar qayd etilmagan.", "No payments recorded for this period.", "За этот период платежей не зарегистрировано.")}
                  </td>
                </tr>
              )}
              {filtered.map((p) => {
                const isVoided = p.status === 'Voided';
                const invoice = invoices.find(inv => inv.paymentId === p.id);
                return (
                <tr key={p.id} className={`hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition ${isVoided ? 'opacity-50' : ''}`}>
                  <td className="py-3.5 px-4 font-mono font-bold text-slate-600 dark:text-slate-400">
                    {getReceiptNumber(p)}
                    {isVoided && (
                      <span className="ml-2 px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-600 dark:text-rose-400 text-[10px] font-black border border-rose-500/20">
                        {t("BEKOR QILINGAN", "VOIDED", "АННУЛИРОВАН")}
                      </span>
                    )}
                  </td>
                  <td className="py-3.5 px-4 font-mono font-bold text-amber-600 dark:text-amber-400">
                    {invoice?.invoiceNumber || '—'}
                  </td>
                  <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-white">
                    {p.studentName}
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="font-semibold text-slate-800 dark:text-slate-200 block">
                      {p.course}
                    </span>
                    <span className="text-[11px] text-slate-400">
                      {p.month}
                    </span>
                  </td>
                  <td className="py-3.5 px-4">
                    <span
                      className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                        p.method === 'Click'
                          ? 'bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/20'
                          : p.method === 'Payme'
                          ? 'bg-teal-500/10 text-teal-600 dark:text-teal-400 border border-teal-500/20'
                          : p.method === 'Cash'
                          ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                          : 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20'
                      }`}
                    >
                      {p.method === 'Cash' ? t('Naqd', 'Cash', 'Наличные') : p.method}
                    </span>
                  </td>
                  <td className={`py-3.5 px-4 font-mono font-black ${isVoided ? 'text-slate-400 line-through' : 'text-emerald-600 dark:text-emerald-400'}`}>
                    {p.amount ? `+${formatCurrencyShort(p.amount)} UZS` : ''}
                  </td>
                  <td className="py-3.5 px-4 text-xs text-slate-500 dark:text-slate-400 font-mono">
                    {p.date}
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => setViewReceipt(p)}
                        className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-white transition cursor-pointer"
                        title={t("Kvitansiyani ko'rish / Chiqarish", "View / Print receipt", "Просмотр / Печать квитанции")}
                      >
                        <Printer className="w-4 h-4" aria-hidden="true" />
                      </button>
                      {invoice && (
                        <button
                          onClick={() => setViewInvoice(invoice)}
                          className="p-1.5 rounded-xl hover:bg-amber-50 dark:hover:bg-amber-900/20 text-amber-600 dark:text-amber-400 hover:text-amber-600 dark:hover:text-amber-400 transition cursor-pointer"
                          title={t("Invoice ko'rish", "View invoice", "Просмотр инвойса")}
                        >
                          <FileText className="w-4 h-4" aria-hidden="true" />
                        </button>
                      )}
                      {!isVoided && !readOnly && (
                        <button
                          onClick={() => handleVoidPayment(p.id, p.studentName)}
                          className="p-1.5 rounded-xl hover:bg-rose-50 dark:hover:bg-rose-900/20 text-slate-400 hover:text-rose-600 transition cursor-pointer"
                          title={t("Bekor qilish", "Void", "Аннулировать")}
                        >
                          <Trash2 className="w-4 h-4" aria-hidden="true" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Payment Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800 mb-5">
              <h3 className="text-xl font-black text-slate-900 dark:text-white">
                {t("To'lov Qabul Qilish", "Accept Payment", "Принять Платеж")}
              </h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" aria-hidden="true" />
              </button>
            </div>

            <form onSubmit={handleCreatePayment} className="space-y-4 text-xs sm:text-sm">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                  {t("O'quvchini Tanlang *", "Select Student *", "Выберите Ученика *")}
                </label>
                <select
                  value={formStudentId}
                  onChange={(e) => handleStudentSelect(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500 cursor-pointer"
                >
                  <option value="">{t("(Ro'yxatdan tanlang)", "(Select from list)", "(Выберите из списка)")}</option>
                  {students.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.fullName || s.name} ({s.course} - {s.groupName})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                  {t("O'quvchi Ismi *", "Student Name *", "Имя Ученика *")}
                </label>
                <input
                  type="text"
                  required
                  value={formStudentName}
                  onChange={(e) => setFormStudentName(e.target.value)}
                  placeholder={t("Ism Familiya", "Full Name", "Имя Фамилия")}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                  {t("Kurs Nomi *", "Course Name *", "Название Курса *")}
                </label>
                <select
                  value={formCourse}
                  onChange={(e) => setFormCourse(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500 cursor-pointer"
                >
                  {courses.map((c) => (
                    <option key={c.id} value={c.title}>
                      {c.title}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                  {t("To'lov Miqdori (UZS) *", "Payment Amount (UZS) *", "Сумма Платежа (UZS) *")}
                </label>
                <input
                  type="number"
                  step="10000"
                  required
                  value={formAmount}
                  onChange={(e) => setFormAmount(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500 font-mono font-bold text-base"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                  {t("To'lov Usuli *", "Payment Method *", "Способ Оплаты *")}
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {(['Click', 'Payme', 'Cash', 'Card'] as const).map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setFormMethod(m)}
                      className={`py-2 px-1 rounded-xl text-xs font-bold transition cursor-pointer ${
                        formMethod === m
                          ? 'bg-amber-500 text-slate-950 shadow-sm'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
                      }`}
                    >
                      {m === 'Cash' ? t('Naqd', 'Cash', 'Наличные') : m}
                    </button>
                  ))}
                </div>
              </div>

              {(formMethod === 'Click' || formMethod === 'Payme') && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                    {t(`Tranzaksiya ID (${formMethod})`, `Transaction ID (${formMethod})`, `ID Транзакции (${formMethod})`)}
                  </label>
                  <input
                    type="text"
                    value={formTrx}
                    onChange={(e) => setFormTrx(e.target.value)}
                    placeholder={t("Kvitansiya/tr. raqami (ixtiyoriy)", "Receipt/Trx ID (optional)", "Номер квитанции/транзакции (необязательно)")}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500 font-mono"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                  {t("Qaysi oy uchun", "For which month", "За какой месяц")}
                </label>
                <input
                  type="text"
                  value={formMonth}
                  onChange={(e) => setFormMonth(e.target.value)}
                  placeholder="Sentyabr 2026"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                >
                  {t("Bekor qilish", "Cancel", "Отмена")}
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-60 disabled:cursor-not-allowed text-slate-950 font-bold text-xs shadow-md shadow-amber-500/20 transition cursor-pointer"
                >
                  {isSubmitting ? t('Saqlanmoqda...', 'Saving...', 'Сохранение...') : t("To'lovni Saqlash", "Save Payment", "Сохранить Платеж")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Professional Receipt Modal */}
      {viewReceipt && (
        <ReceiptModal
          payment={viewReceipt}
          center={center}
          success={receiptSuccess}
          onClose={() => {
            setViewReceipt(null);
            setReceiptSuccess(false);
          }}
        />
      )}

      {/* Invoice Modal */}
      {viewInvoice && (
        <InvoiceModal
          invoice={viewInvoice}
          center={center}
          onClose={() => setViewInvoice(null)}
        />
      )}
    </div>
  );
};
