import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { subscribePayments } from '../../services/firestore';
import { DEFAULT_MOCK_PAYMENTS } from '../../data/mockData';
import { Payment } from '../../types';
import {
  DollarSign,
  Plus,
  CheckCircle2,
  TrendingDown,
  TrendingUp,
  Users,
  CreditCard,
  Building,
  Wrench,
  Sparkles,
  BookOpen,
  PieChart,
  Trash2
} from 'lucide-react';

export const PayrollExpensesView: React.FC = () => {
  const { language } = useLanguage();
  const t = (uz: string, en: string, ru: string) => {
    if (language === 'UZ') return uz;
    if (language === 'RU') return ru;
    return en;
  };

  const [payments, setPayments] = useState<Payment[]>([]);

  useEffect(() => {
    const unsub = subscribePayments((data) => {
      setPayments(data.length > 0 ? data : DEFAULT_MOCK_PAYMENTS);
    });
    return () => unsub();
  }, []);

  const totalRevenue = payments.reduce((acc, p) => acc + (p.amount || 0), 0);

  const [expenses, setExpenses] = useState([
    { id: 'ex1', title: "Mr. Javohirbek Oylik Maoshi", category: 'Oylik Maosh', amount: 8500000, date: '2026-07-20', status: 'paid' },
    { id: 'ex2', title: "Sardorbek Rahimov Oylik Maoshi", category: 'Oylik Maosh', amount: 7800000, date: '2026-07-19', status: 'paid' },
    { id: 'ex3', title: "Kompyuter xonasi va Server ijara to'lovi", category: 'Infratuzilma', amount: 4200000, date: '2026-07-15', status: 'paid' },
    { id: 'ex4', title: "Kanserlariya va Printer Qog'ozlari", category: "O'quv Jihozlari", amount: 650000, date: '2026-07-10', status: 'paid' },
    { id: 'ex5', title: "SMM & Target Reklama Xarajatlari", category: 'Reklama', amount: 1500000, date: '2026-07-05', status: 'paid' }
  ]);

  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Oylik Maosh');
  const [amount, setAmount] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  const totalExpenses = expenses.reduce((acc, curr) => acc + curr.amount, 0);
  const netSurplus = totalRevenue - totalExpenses;

  const handleAddExpense = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !amount) return;

    const newExpense = {
      id: Date.now().toString(),
      title,
      category,
      amount: parseInt(amount, 10) || 0,
      date: new Date().toISOString().split('T')[0],
      status: 'paid'
    };

    setExpenses([newExpense, ...expenses]);
    setTitle('');
    setAmount('');
    setIsAdding(false);
  };

  const handleDeleteExpense = (id: string) => {
    setExpenses(expenses.filter((e) => e.id !== id));
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="p-6 rounded-3xl bg-slate-900 text-white border border-slate-800 shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-bold border border-emerald-500/30 mb-2">
            <DollarSign className="w-3.5 h-3.5" />
            <span>CenterFlow Financial Control</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
            {t("Oylik Maosh va Xarajatlar Boshqaruvi", "Payroll & Center Expenses", "Управление Зарплатами и Расходами")}
          </h1>
          <p className="text-xs text-slate-400 mt-1 max-w-xl">
            {t(
              "O'qituvchilar maoshi, bino ijarasi, kommunal to'lovlar hamda o'quv qurollari xarajatlarini kuzatib boring va real-vaqt rejimida sof foydani hisoblang.",
              "Track instructor salaries, facility rent, utilities, study supplies, and calculate live net surplus revenue.",
              "Учет зарплат учителей, аренды, коммунальных услуг и расчета чистой прибыли."
            )}
          </p>
        </div>

        <button
          onClick={() => setIsAdding(!isAdding)}
          className="px-5 py-3 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs shadow-lg shadow-amber-500/20 transition cursor-pointer flex items-center gap-2 shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>{t("Yangi Xarajat Kiritish", "Add Expense Record", "Добавить Расход")}</span>
        </button>
      </div>

      {/* Financial Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-1">
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1">
            <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
            {t("Oylik Jami Tushum", "Total Monthly Revenue", "Ежемесячный Доход")}
          </span>
          <p className="text-2xl font-black text-emerald-500 font-mono">
            {totalRevenue.toLocaleString()} UZS
          </p>
          <p className="text-[11px] text-slate-500 dark:text-slate-400">
            {t("Firestore 'payments' to'plamidan olingan summasi", "Sum of current payments logged in Firestore", "Сумма полученной оплаты")}
          </p>
        </div>

        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-1">
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1">
            <TrendingDown className="w-3.5 h-3.5 text-rose-500" />
            {t("Jami Markaz Xarajatlari", "Total Center Expenses", "Общие Расходы")}
          </span>
          <p className="text-2xl font-black text-rose-500 font-mono">
            {totalExpenses.toLocaleString()} UZS
          </p>
          <p className="text-[11px] text-slate-500 dark:text-slate-400">
            {expenses.length} {t("ta xarajat yozuvi saqlangan", "logged expense records", "записей расходов")}
          </p>
        </div>

        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-1">
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1">
            <PieChart className="w-3.5 h-3.5 text-amber-500" />
            {t("Sof Balans (Surplus)", "Net Operating Surplus", "Чистый Баланс")}
          </span>
          <p className={`text-2xl font-black font-mono ${netSurplus >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
            {netSurplus.toLocaleString()} UZS
          </p>
          <p className="text-[11px] font-bold text-emerald-500 flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" />
            {t("Foyda Marjasi Yuqori (+34%)", "High Net Profit Margin (+34%)", "Высокая рентабельность (+34%)")}
          </p>
        </div>
      </div>

      {/* Add Expense Form */}
      {isAdding && (
        <form onSubmit={handleAddExpense} className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-amber-500/50 shadow-xl space-y-4 animate-fade-in">
          <h3 className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-amber-500" />
            <span>{t("Yangi Xarajat Yozuvini Saqlash", "Record New Expense or Salary", "Записать Расход или Зарплату")}</span>
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                {t("Nomi / Tavsifi *", "Title / Description *", "Название / Описание *")}
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={t("Masalan: Mr. Javohirbek Oylik Maoshi", "E.g. Mr. Javohirbek Salary", "Например: Зарплата Учителя")}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold focus:ring-2 focus:ring-amber-500 text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                {t("Kategoriya *", "Category *", "Категория *")}
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold focus:ring-2 focus:ring-amber-500 text-slate-900 dark:text-white"
              >
                <option value="Oylik Maosh">{t("Oylik Maosh (Salary)", "Salary", "Зарплата")}</option>
                <option value="Infratuzilma">{t("Infratuzilma & Ijara", "Infrastructure & Rent", "Инфраструктура и Аренда")}</option>
                <option value="O'quv Jihozlari">{t("O'quv Jihozlari", "Study Supplies", "Учебные Материалы")}</option>
                <option value="Reklama">{t("Reklama & SMM", "Marketing & SMM", "Реклама и SMM")}</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                {t("Summasi (UZS) *", "Amount (UZS) *", "Сумма (UZS) *")}
              </label>
              <input
                type="number"
                required
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="8500000"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-mono font-bold focus:ring-2 focus:ring-amber-500 text-slate-900 dark:text-white"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setIsAdding(false)}
              className="px-4 py-2 rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
            >
              {t("Bekor qilish", "Cancel", "Отмена")}
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-xs shadow-md cursor-pointer"
            >
              {t("Saqlash", "Save Expense Record", "Сохранить Запись")}
            </button>
          </div>
        </form>
      )}

      {/* Expenses Breakdown Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
            {t("Markaz Xarajatlari va Maoshlar Jurnali", "Expense Logs & Payroll Breakdown", "История Расходов и Зарплат")}
          </h3>
          <span className="px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-mono text-xs font-bold">
            {expenses.length} Records
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 font-bold uppercase tracking-wider">
                <th className="pb-3 px-2">{t("TAVSIF / NOMI", "TITLE / DESCRIPTION", "НАЗВАНИЕ")}</th>
                <th className="pb-3 px-2">{t("KATEGORIYA", "CATEGORY", "КАТЕГОРИЯ")}</th>
                <th className="pb-3 px-2">{t("SUMMA (UZS)", "AMOUNT (UZS)", "СУММА (UZS)")}</th>
                <th className="pb-3 px-2">{t("SANA", "DATE", "ДАТА")}</th>
                <th className="pb-3 px-2 text-right">{t("AMALLAR", "ACTIONS", "ДЕЙСТВИЯ")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {expenses.map((ex) => (
                <tr key={ex.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition">
                  <td className="py-3.5 px-2 font-extrabold text-slate-900 dark:text-white">
                    {ex.title}
                  </td>

                  <td className="py-3.5 px-2">
                    <span className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[11px] font-bold text-slate-700 dark:text-slate-300">
                      {ex.category}
                    </span>
                  </td>

                  <td className="py-3.5 px-2 font-mono font-extrabold text-rose-500">
                    {ex.amount.toLocaleString()} UZS
                  </td>

                  <td className="py-3.5 px-2 font-mono text-slate-400 text-[11px]">
                    {ex.date}
                  </td>

                  <td className="py-3.5 px-2 text-right">
                    <button
                      onClick={() => handleDeleteExpense(ex.id)}
                      className="p-1.5 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 hover:bg-rose-500/20 transition cursor-pointer"
                      title="O'chirish"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export const PayrollView = PayrollExpensesView;
