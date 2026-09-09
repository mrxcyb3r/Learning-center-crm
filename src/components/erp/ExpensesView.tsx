import React, { useState, useEffect } from 'react';
import { DollarSign, Plus, Download, TrendingDown, Building, Users, Megaphone, Zap } from 'lucide-react';
import { crmService } from '../../services/crmService';
import { ExpenseRecord } from '../../types/crm';

export const ExpensesView: React.FC = () => {
  const [expenses, setExpenses] = useState<ExpenseRecord[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // New expense form
  const [category, setCategory] = useState<'Salaries' | 'Rent' | 'Utilities' | 'Marketing' | 'Other'>('Salaries');
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('1000000');
  const [recipient, setRecipient] = useState('');

  useEffect(() => {
    setExpenses(crmService.getExpenses());
  }, []);

  const totalExpenses = expenses.reduce((acc, e) => acc + e.amount, 0);

  const handleCreateExpense = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    crmService.createExpense({
      category,
      title: title.trim(),
      amount: Number(amount),
      recipient: recipient.trim(),
      month: 'September 2026',
    });

    setExpenses(crmService.getExpenses());
    setIsModalOpen(false);
    setTitle('');
    setRecipient('');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            Expenses & Staff Salaries
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Operational cash outflow, teacher payroll, campus rent, and marketing campaigns.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-md shadow-amber-500/20 flex items-center gap-1.5 transition cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Record Expense</span>
        </button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
          <span className="text-xs font-semibold text-slate-400 block">Total Outflow</span>
          <div className="text-2xl font-black text-slate-900 dark:text-white mt-1">
            {totalExpenses.toLocaleString()} <span className="text-xs font-normal text-slate-400">UZS</span>
          </div>
        </div>
        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
          <span className="text-xs font-semibold text-slate-400 block">Staff Payroll</span>
          <div className="text-2xl font-black text-slate-900 dark:text-white mt-1">
            35.2M <span className="text-xs font-normal text-slate-400">UZS</span>
          </div>
        </div>
        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
          <span className="text-xs font-semibold text-slate-400 block">Campus Rent & Utilities</span>
          <div className="text-2xl font-black text-slate-900 dark:text-white mt-1">
            16.0M <span className="text-xs font-normal text-slate-400">UZS</span>
          </div>
        </div>
        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
          <span className="text-xs font-semibold text-slate-400 block">Instagram & Telegram Ads</span>
          <div className="text-2xl font-black text-slate-900 dark:text-white mt-1">
            6.5M <span className="text-xs font-normal text-slate-400">UZS</span>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                <th className="py-3.5 px-4">Expense Title</th>
                <th className="py-3.5 px-4">Category</th>
                <th className="py-3.5 px-4">Amount (UZS)</th>
                <th className="py-3.5 px-4">Recipient</th>
                <th className="py-3.5 px-4">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {expenses.map((e) => (
                <tr key={e.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition">
                  <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-white">
                    {e.title}
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                      {e.category}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 font-mono font-bold text-red-600 dark:text-red-400">
                    -{e.amount.toLocaleString()} UZS
                  </td>
                  <td className="py-3.5 px-4 text-slate-600 dark:text-slate-300">
                    {e.recipient}
                  </td>
                  <td className="py-3.5 px-4 text-slate-400 text-xs">
                    {e.date}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-2xl">
            <h3 className="text-xl font-black text-slate-900 dark:text-white mb-4">
              Record Operational Expense
            </h3>

            <form onSubmit={handleCreateExpense} className="space-y-4 text-xs sm:text-sm">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                  Category
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                >
                  <option value="Salaries">Teacher / Staff Salary</option>
                  <option value="Rent">Campus Building Rent</option>
                  <option value="Utilities">Electricity & Internet</option>
                  <option value="Marketing">Instagram / Telegram Ads</option>
                  <option value="Other">Supplies & Maintenance</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                  Title / Purpose
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Jasur mentor - September Salary"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                  Amount (UZS)
                </label>
                <input
                  type="number"
                  required
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                  Recipient
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Jasur Aliyev or Landlord"
                  value={recipient}
                  onChange={(e) => setRecipient(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                />
              </div>

              <div className="mt-6 flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-500 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-amber-500 text-slate-950 font-bold text-xs shadow-md shadow-amber-500/20 cursor-pointer"
                >
                  Record Expense
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
