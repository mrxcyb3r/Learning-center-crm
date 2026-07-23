import React, { useState } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { DollarSign, Plus, CheckCircle2, TrendingDown, Users, CreditCard } from 'lucide-react';

export const PayrollView: React.FC = () => {
  const { language } = useLanguage();
  const t = (uz: string, en: string, ru: string) => {
    if (language === 'UZ') return uz;
    if (language === 'RU') return ru;
    return en;
  };

  const [expenses, setExpenses] = useState([
    { id: 'ex1', title: 'Mr. Javohirbek Oylik Maoshi', category: 'Oylik Maosh', amount: 8500000, date: '2026-07-20', status: 'paid' },
    { id: 'ex2', title: 'Sardorbek Rahimov Oylik Maoshi', category: 'Oylik Maosh', amount: 7800000, date: '2026-07-19', status: 'paid' },
    { id: 'ex3', title: 'Kompyuter xonasi va Server ijara to\'lovi', category: 'Infratuzilma', amount: 4200000, date: '2026-07-15', status: 'paid' },
    { id: 'ex4', title: 'Kanserlariya va Printer Qog\'ozlari', category: "O'quv Jihozlari", amount: 650000, date: '2026-07-10', status: 'paid' }
  ]);

  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Oylik Maosh');
  const [amount, setAmount] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  const totalExpenseSum = expenses.reduce((acc, curr) => acc + curr.amount, 0);

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

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="p-6 rounded-3xl bg-slate-900 text-white border border-slate-800 shadow-xl flex items-center justify-between">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-bold border border-emerald-500/30 mb-2">
            <DollarSign className="w-3.5 h-3.5" />
            <span>Moliya & Payroll Control</span>
          </div>
          <h2 className="text-2xl font-black">
            {t("Oylik Maoshlar va Markaz Harajatlari", "Payroll & Expenses Logger", "Зарплаты и Расходы Центра")}
          </h2>
          <p className="text-xs text-slate-400 mt-1 max-w-lg">
            {t(
              "O'qituvchilar maoshi, xona ijarasi hamda o'quv markazi xarajatlarini hisobga olish paneli.",
              "Track instructor salaries, facility rent, and operational center expenses.",
              "Учет зарплат преподавателей, аренды помещений и расходов учебного центра."
            )}
          </p>
        </div>

        <button
          onClick={() => setIsAdding(!isAdding)}
          className="px-5 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-md shadow-amber-500/20 transition cursor-pointer flex items-center gap-2 shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>{t("Yangi Harajat Kiritish", "Add Expense Record", "Добавить Расход")}</span>
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-1">
          <span className="text-[10px] text-slate-400 uppercase font-bold">{t("Jami Harajatlar", "Total Expense", "Общие Расходы")}</span>
          <p className="text-xl font-black text-rose-500">
            {totalExpenseSum.toLocaleString()} UZS
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-1">
          <span className="text-[10px] text-slate-400 uppercase font-bold">{t("Ustozlar Maosh Fondi", "Instructor Payroll", "Фонд Зарплаты Преподавателей")}</span>
          <p className="text-xl font-black text-slate-900 dark:text-white">
            16,300,000 UZS
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-1">
          <span className="text-[10px] text-slate-400 uppercase font-bold">{t("Oylik Status", "Monthly Balance Status", "Ежемесячный Баланс")}</span>
          <p className="text-sm font-bold text-emerald-500 flex items-center gap-1">
            <CheckCircle2 className="w-4 h-4" /> In Surplus (+32%)
          </p>
        </div>
      </div>

      {/* Add Form */}
      {isAdding && (
        <form onSubmit={handleAddExpense} className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-amber-500/50 shadow-xl space-y-4">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">
            {t("Yangi Harajat yoki Oylik To'lovni Saqlash", "Record Expense or Salary", "Записать Расход или Зарплату")}
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                {t("Tavsif / Nomi", "Title / Description", "Название / Описание")}
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={t("Masalan: Mr. Jasur Oylik Maoshi", "E.g.: Mr. Jasur Salary", "Например: Зарплата Преподавателя")}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs focus:ring-2 focus:ring-amber-500 text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                {t("Kategoriya", "Category", "Категория")}
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs focus:ring-2 focus:ring-amber-500 text-slate-900 dark:text-white"
              >
                <option value="Oylik Maosh">{t("Oylik Maosh (Salaries)", "Salary", "Зарплата")}</option>
                <option value="Infratuzilma">{t("Infratuzilma & Ijara", "Infrastructure & Rent", "Инфраструктура и Аренда")}</option>
                <option value="O'quv Jihozlari">{t("O'quv Jihozlari", "Study Supplies", "Учебные Материалы")}</option>
                <option value="Reklama">{t("Reklama & Marketing", "Marketing & Ads", "Реклама и Маркетинг")}</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                {t("Summasi (UZS)", "Amount (UZS)", "Сумма (UZS)")}
              </label>
              <input
                type="number"
                required
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="8500000"
                className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs focus:ring-2 focus:ring-amber-500 text-slate-900 dark:text-white"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setIsAdding(false)}
              className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-bold text-slate-600 dark:text-slate-300"
            >
              {t("Bekor qilish", "Cancel", "Отмена")}
            </button>
            <button
              type="submit"
              className="px-6 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold shadow-md shadow-amber-500/20"
            >
              {t("Saqlash", "Save Record", "Сохранить")}
            </button>
          </div>
        </form>
      )}

      {/* Expense Records Table */}
      <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-md">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 font-bold uppercase text-[10px]">
                <th className="py-3 px-4">{t("Harajat Nomi", "Expense Title", "Название Расхода")}</th>
                <th className="py-3 px-4">{t("Kategoriya", "Category", "Категория")}</th>
                <th className="py-3 px-4">{t("Sana", "Date", "Дата")}</th>
                <th className="py-3 px-4 text-right">{t("Summasi (UZS)", "Amount (UZS)", "Сумма (UZS)")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-semibold">
              {expenses.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition">
                  <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-white">
                    {item.title}
                  </td>
                  <td className="py-3.5 px-4 text-slate-500">
                    <span className="px-2.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-[10px] font-bold">
                      {item.category}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-slate-500">{item.date}</td>
                  <td className="py-3.5 px-4 text-right font-black text-rose-500">
                    -{item.amount.toLocaleString()} UZS
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
