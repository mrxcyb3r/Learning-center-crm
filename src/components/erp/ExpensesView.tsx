import React, { useState, useEffect } from 'react';
import {
  DollarSign,
  Plus,
  TrendingDown,
  Building,
  Users,
  Megaphone,
  Zap,
  Trash2,
  CheckCircle2,
  X,
  CreditCard,
  Briefcase,
} from 'lucide-react';
import { crmService } from '../../services/crmService';
import { ExpenseCategory, ExpenseRecord, TeacherRecord } from '../../types/crm';
import { formatCurrency, formatCurrencyShort } from '../../utils/format';

export const ExpensesView: React.FC = () => {
  const [expenses, setExpenses] = useState<ExpenseRecord[]>([]);
  const [teachers, setTeachers] = useState<TeacherRecord[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [notice, setNotice] = useState<string | null>(null);

  // Form
  const [formCategory, setFormCategory] = useState<ExpenseCategory>('Salaries');
  const [formTitle, setFormTitle] = useState('');
  const [formAmount, setFormAmount] = useState('1000000');
  const [formRecipient, setFormRecipient] = useState('');
  const [formMonth, setFormMonth] = useState('Sentyabr 2026');

  const refresh = () => {
    setExpenses(crmService.getExpenses());
    setTeachers(crmService.getTeachers().filter((t) => t.status === 'Active'));
  };

  useEffect(() => {
    refresh();
  }, []);

  const showNotification = (msg: string) => {
    setNotice(msg);
    setTimeout(() => setNotice(null), 3000);
  };

  const handleOpenAdd = () => {
    setFormCategory('Salaries');
    setFormTitle('');
    setFormAmount('1000000');
    setFormRecipient('');
    setFormMonth('Sentyabr 2026');
    setIsModalOpen(true);
  };

  const handleTeacherSelectForSalary = (teacherId: string) => {
    const t = teachers.find((tch) => tch.id === teacherId);
    if (t) {
      setFormCategory('Salaries');
      setFormTitle(`${t.name} — Oylik Maoshi`);
      setFormRecipient(t.name);
      setFormAmount(String(t.monthlySalary || t.salary || 8000000));
    }
  };

  const handleCreateExpense = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim()) return;

    crmService.createExpense({
      category: formCategory,
      title: formTitle.trim(),
      amount: Number(formAmount),
      recipient: formRecipient.trim(),
      month: formMonth,
    });

    showNotification(`Xarajat ("${formTitle}") muvaffaqiyatli saqlandi!`);
    refresh();
    setIsModalOpen(false);
  };

  const handleDeleteExpense = (id: string, title: string) => {
    if (window.confirm(`Rostdan ham "${title}" xarajatini o'chirmoqchimisiz?`)) {
      crmService.deleteExpense(id);
      refresh();
      showNotification(`"${title}" xarajati o'chirildi.`);
    }
  };

  const isSalaryExpense = (e: ExpenseRecord) => e.category === 'Salaries' || e.category === 'Teacher Salary' || e.category === 'Payroll';

const filtered = categoryFilter === 'All'
    ? expenses
    : categoryFilter === 'Salaries'
    ? expenses.filter((e) => isSalaryExpense(e))
    : expenses.filter((e) => e.category === categoryFilter);

  const totalExpenses = expenses.reduce((acc, e) => acc + e.amount, 0);
  const salarySum = expenses.filter((e) => isSalaryExpense(e)).reduce((acc, e) => acc + e.amount, 0);
  const rentSum = expenses.filter((e) => e.category === 'Rent').reduce((acc, e) => acc + e.amount, 0);
  const marketingSum = expenses.filter((e) => e.category === 'Marketing').reduce((acc, e) => acc + e.amount, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            Chiqimlar va O'qituvchilar Oylik Maoshi
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Markazning oylik operatsion xarajatlari, o'qituvchilar oyligi, bino ijarasi va marketing chiqimlari.
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-md shadow-amber-500/20 flex items-center gap-1.5 transition cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Yangi Chiqim Qayd Qilish</span>
        </button>
      </div>

      {/* Notice */}
      {notice && (
        <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-bold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" />
          <span>{notice}</span>
        </div>
      )}

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <span className="text-xs font-semibold text-slate-400 block">Jami Chiqim</span>
          <div className="text-2xl font-black text-rose-600 dark:text-rose-400 mt-1 font-mono">
            {formatCurrency(totalExpenses)}
          </div>
          <span className="text-[11px] text-slate-500 mt-1 block">
            {expenses.length} ta operatsiya
          </span>
        </div>

        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <span className="text-xs font-semibold text-amber-600 dark:text-amber-400 block flex items-center gap-1">
            <Users className="w-3.5 h-3.5" /> Ustozlar Maoshi (Payroll)
          </span>
          <div className="text-xl font-black text-slate-900 dark:text-white mt-1 font-mono">
            {formatCurrency(salarySum)}
          </div>
          <span className="text-[11px] text-slate-500 mt-1 block">To'langan maoshlar</span>
        </div>

        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <span className="text-xs font-semibold text-sky-500 block flex items-center gap-1">
            <Building className="w-3.5 h-3.5" /> Bino Ijarasi (Rent)
          </span>
          <div className="text-xl font-black text-slate-900 dark:text-white mt-1 font-mono">
            {formatCurrency(rentSum)}
          </div>
          <span className="text-[11px] text-slate-500 mt-1 block">Filiallar ijarasi</span>
        </div>

        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <span className="text-xs font-semibold text-purple-500 block flex items-center gap-1">
            <Megaphone className="w-3.5 h-3.5" /> Reklama & Target
          </span>
          <div className="text-xl font-black text-slate-900 dark:text-white mt-1 font-mono">
            {formatCurrency(marketingSum)}
          </div>
          <span className="text-[11px] text-slate-500 mt-1 block">Instagram, Telegram, Banner</span>
        </div>
      </div>

      {/* Category Filter Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {['All', 'Salaries', 'Rent', 'Utilities', 'Marketing', 'Other'].map((cat) => (
          <button
            key={cat}
            onClick={() => setCategoryFilter(cat)}
            className={`px-3.5 py-1.5 rounded-xl font-bold text-xs whitespace-nowrap transition cursor-pointer ${
              categoryFilter === cat
                ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-950 shadow-sm'
                : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800 hover:bg-slate-50'
            }`}
          >
            {cat === 'All'
              ? 'Barcha Xarajatlar'
              : cat === 'Salaries'
              ? "O'qituvchilar Maoshi"
              : cat === 'Rent'
              ? 'Bino Ijarasi'
              : cat === 'Utilities'
              ? 'Kommunal'
              : cat === 'Marketing'
              ? 'Reklama'
              : 'Boshqa'}
          </button>
        ))}
      </div>

      {/* Expenses Table */}
      <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                <th className="py-3.5 px-4">Xarajat Nomi & Sababi</th>
                <th className="py-3.5 px-4">Kategoriya</th>
                <th className="py-3.5 px-4">Qabul Qiluvchi (Oluvchi)</th>
                <th className="py-3.5 px-4">Summa</th>
                <th className="py-3.5 px-4">Sana & Vaqt</th>
                <th className="py-3.5 px-4 text-right">Amallar</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400 text-xs">
                    Bu kategoriya bo'yicha chiqimlar qayd etilmagan.
                  </td>
                </tr>
              )}
              {filtered.map((e) => (
                <tr key={e.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition">
                  <td className="py-3.5 px-4">
                    <div className="font-bold text-slate-900 dark:text-white">
                      {e.title}
                    </div>
                    <div className="text-[11px] text-slate-400 font-mono">
                      #{e.id.slice(-6).toUpperCase()}
                    </div>
                  </td>

                  <td className="py-3.5 px-4">
                    <span
                      className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                        isSalaryExpense(e)
                          ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
                          : e.category === 'Rent'
                          ? 'bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/20'
                          : e.category === 'Marketing'
                          ? 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                      }`}
                    >
                      {isSalaryExpense(e)
                        ? 'Maosh'
                        : e.category === 'Rent'
                        ? 'Ijara'
                        : e.category === 'Marketing'
                        ? 'Marketing'
                        : e.category === 'Utilities'
                        ? 'Kommunal'
                        : 'Boshqa'}
                    </span>
                  </td>

                  <td className="py-3.5 px-4 font-semibold text-slate-800 dark:text-slate-200">
                    {e.recipient || '-'}
                  </td>

                  <td className="py-3.5 px-4 font-mono font-black text-rose-600 dark:text-rose-400">
                    -{formatCurrencyShort(e.amount)} UZS
                  </td>

                  <td className="py-3.5 px-4 text-xs text-slate-500 dark:text-slate-400 font-mono">
                    {e.date}
                  </td>

                  <td className="py-3.5 px-4 text-right">
                    <button
                      onClick={() => handleDeleteExpense(e.id, e.title)}
                      className="p-1.5 rounded-xl hover:bg-rose-50 dark:hover:bg-rose-900/20 text-slate-400 hover:text-rose-600 transition cursor-pointer"
                      title="O'chirish"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Expense Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm overflow-y-auto">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-2xl my-8">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800 mb-5">
              <h3 className="text-xl font-black text-slate-900 dark:text-white">
                Yangi Chiqim Qayd Qilish
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateExpense} className="space-y-4 text-xs sm:text-sm">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                  Chiqim Kategoriyasi *
                </label>
                <select
                  value={formCategory}
                  onChange={(e) => setFormCategory(e.target.value as ExpenseCategory)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500 cursor-pointer"
                >
                  <option value="Salaries">O'qituvchilar va Xodimlar Maoshi</option>
                  <option value="Rent">Bino Ijarasi (Ijara to'lovi)</option>
                  <option value="Utilities">Kommunal (Svet, Issiqlik, Internet)</option>
                  <option value="Marketing">Reklama, Target va Bannerlar</option>
                  <option value="Other">Boshqa Operatsion Chiqimlar</option>
                </select>
              </div>

              {/* Fast Salary Fill Assistant */}
              {formCategory === 'Salaries' && (
                <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 space-y-2">
                  <label className="block text-[11px] font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wider">
                    Tezkor maosh to'ldirish (Ustozni tanlang):
                  </label>
                  <select
                    onChange={(e) => handleTeacherSelectForSalary(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-amber-500/30 text-xs font-bold text-slate-900 dark:text-white focus:outline-none cursor-pointer"
                  >
                    <option value="">(Ro'yxatdan tanlang)</option>
                    {teachers.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name} (Oylik: {formatCurrency(t.monthlySalary || t.salary)})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                  Chiqim Nomi / Tavsifi *
                </label>
                <input
                  type="text"
                  required
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder="Masalan: 1-maktab binosi ijarasi yoki Diyorbek F. oyligi"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                  Chiqim Summasi (UZS) *
                </label>
                <input
                  type="number"
                  step="50000"
                  required
                  value={formAmount}
                  onChange={(e) => setFormAmount(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500 font-mono font-bold text-base"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                  Qabul Qiluvchi Shaxs yoki Tashkilot
                </label>
                <input
                  type="text"
                  value={formRecipient}
                  onChange={(e) => setFormRecipient(e.target.value)}
                  placeholder="Masalan: O'qituvchi ismi yoki Maktab ma'muriyati"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                  Qaysi oy uchun
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
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                >
                  Bekor qilish
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-md shadow-amber-500/20 transition cursor-pointer"
                >
                  Chiqimni Saqlash
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
