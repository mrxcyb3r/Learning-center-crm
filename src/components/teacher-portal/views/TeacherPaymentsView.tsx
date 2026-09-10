import React, { useState, useMemo } from 'react';
import { toast } from 'react-toastify';
import dayjs from 'dayjs';
import { addDoc, collection } from 'firebase/firestore';
import { db } from '../../../services/firebase';
import { useTeacherPortal } from '../../../context/TeacherPortalContext';
import { useTheme } from '../../../context/ThemeContext';
import { ReceiptView } from '../shared/ReceiptView';
import { ReceiptData, PaymentMethod } from '../../../types/teacher';
import { Student } from '../../../types';
import {
  Plus,
  Search,
  Filter,
  Calendar,
  DollarSign,
  CreditCard,
  Banknote,
  ArrowRightLeft,
  MoreHorizontal,
  FileText,
  X,
  Lock,
} from 'lucide-react';

const PAYMENT_METHODS: { value: PaymentMethod; label: string; icon: React.ReactNode }[] = [
  { value: 'cash', label: 'Cash', icon: <Banknote className="w-4 h-4" /> },
  { value: 'card', label: 'Card', icon: <CreditCard className="w-4 h-4" /> },
  { value: 'bank_transfer', label: 'Bank Transfer', icon: <ArrowRightLeft className="w-4 h-4" /> },
  { value: 'other', label: 'Other', icon: <MoreHorizontal className="w-4 h-4" /> },
];

interface TeacherPaymentRecord {
  id: string;
  studentId: string;
  studentName: string;
  groupId: string;
  groupName: string;
  amount: number;
  paymentMethod: PaymentMethod;
  date: string;
  recordedBy: string;
  recordedByName: string;
  notes?: string;
  receiptNumber: string;
}

export const TeacherPaymentsView: React.FC = () => {
  const {
    payments,
    myStudents,
    myGroups,
    businessModel,
    teacherUid,
    teacherName,
  } = useTeacherPortal();
  const { theme } = useTheme();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [amount, setAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
  const [payDate, setPayDate] = useState(dayjs().format('YYYY-MM-DD'));
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [searchQuery, setSearchQuery] = useState('');
  const [filterMethod, setFilterMethod] = useState<PaymentMethod | 'all'>('all');
  const [filterDateFrom, setFilterDateFrom] = useState('');
  const [filterDateTo, setFilterDateTo] = useState('');

  const [receiptData, setReceiptData] = useState<ReceiptData | null>(null);

  const selectedStudent = useMemo(
    () => myStudents.find((s) => s.id === selectedStudentId),
    [myStudents, selectedStudentId]
  );

  const studentPayments = useMemo(() => {
    const studentIds = new Set(myStudents.map((s) => s.id));
    return payments
      .filter((p) => studentIds.has(p.studentId))
      .map((p) => {
        const student = myStudents.find((s) => s.id === p.studentId);
        const group = myGroups.find((g) => g.id === student?.groupId);
        return {
          ...p,
          groupId: student?.groupId || '',
          groupName: group?.name || student?.groupName || '',
          receiptNumber: p.receiptRef || `REC-${p.id.slice(0, 8).toUpperCase()}`,
        };
      });
  }, [payments, myStudents, myGroups]);

  const filteredPayments = useMemo(() => {
    let result = [...studentPayments];

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (p) =>
          p.studentName.toLowerCase().includes(q) ||
          p.groupName.toLowerCase().includes(q) ||
          p.receiptNumber.toLowerCase().includes(q)
      );
    }

    if (filterMethod !== 'all') {
      result = result.filter((p) => p.paymentMethod === filterMethod);
    }

    if (filterDateFrom) {
      result = result.filter((p) => p.date >= filterDateFrom);
    }

    if (filterDateTo) {
      result = result.filter((p) => p.date <= filterDateTo);
    }

    result.sort((a, b) => b.date.localeCompare(a.date));

    return result;
  }, [studentPayments, searchQuery, filterMethod, filterDateFrom, filterDateTo]);

  const handleStudentChange = (studentId: string) => {
    setSelectedStudentId(studentId);
    const student = myStudents.find((s) => s.id === studentId);
    if (student) {
      setAmount(String(student.tuitionFee || ''));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudent || !amount) {
      toast.error('Please select a student and enter an amount');
      return;
    }

    setIsSubmitting(true);
    try {
      const receiptNumber = `REC-${Date.now().toString(36).toUpperCase()}`;
      const group = myGroups.find((g) => g.id === selectedStudent.groupId);

      const paymentData = {
        studentId: selectedStudent.id,
        studentName: selectedStudent.fullName,
        amount: Number(amount),
        paymentMethod,
        date: payDate,
        recordedBy: teacherUid,
        recordedByName: teacherName,
        status: 'paid',
        notes: notes || undefined,
        receiptRef: receiptNumber,
        cohortGroup: group?.name || selectedStudent.groupName,
      };

      await addDoc(collection(db, 'teacher_payments'), paymentData);

      toast.success(`Payment recorded! Receipt: ${receiptNumber}`);

      setIsModalOpen(false);
      setSelectedStudentId('');
      setAmount('');
      setPaymentMethod('cash');
      setPayDate(dayjs().format('YYYY-MM-DD'));
      setNotes('');
    } catch (error) {
      console.error('Failed to record payment:', error);
      toast.error('Failed to record payment');
    } finally {
      setIsSubmitting(false);
    }
  };

  const openReceipt = (payment: typeof studentPayments[0]) => {
    const group = myGroups.find((g) => g.id === payment.groupId);
    setReceiptData({
      centerName: group?.name || 'Learning Center',
      teacherName,
      studentName: payment.studentName,
      course: payment.groupName,
      amount: payment.amount,
      date: dayjs(payment.date).format('DD MMM YYYY'),
      paymentMethod: payment.paymentMethod,
      receiptNumber: payment.receiptNumber,
    });
  };

  if (businessModel === 'learning_center') {
    return (
      <div className={`rounded-2xl p-8 border ${theme === 'dark' ? 'bg-slate-900/50 border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}>
        <div className="flex flex-col items-center justify-center text-center py-12">
          <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-4 ${theme === 'dark' ? 'bg-slate-800' : 'bg-slate-100'}`}>
            <Lock className={`w-8 h-8 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`} />
          </div>
          <h3 className={`text-lg font-bold mb-2 ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
            Payments are managed by the learning center
          </h3>
          <p className={`text-sm max-w-md ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
            In this business model, payment collection and tracking is handled by the learning center administration. You can view payment statuses in your student list.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className={`text-xl font-black ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
            Payments
          </h2>
          <p className={`text-sm mt-0.5 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
            Record and track student payments
          </p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-500 hover:bg-blue-600 text-white text-sm font-bold transition cursor-pointer shadow-lg shadow-blue-500/20"
        >
          <Plus className="w-4 h-4" />
          Record Payment
        </button>
      </div>

      {/* Filters */}
      <div className={`rounded-2xl p-4 border ${theme === 'dark' ? 'bg-slate-900/50 border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}>
        <div className="flex flex-col sm:flex-row gap-3">
          <div className={`flex-1 flex items-center gap-2 px-3 py-2 rounded-xl border ${theme === 'dark' ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
            <Search className="w-4 h-4 text-slate-400 flex-shrink-0" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by student, group, receipt..."
              className={`flex-1 bg-transparent text-sm outline-none ${theme === 'dark' ? 'text-white placeholder-slate-500' : 'text-slate-900 placeholder-slate-400'}`}
            />
          </div>

          <div className="flex gap-2">
            <select
              value={filterMethod}
              onChange={(e) => setFilterMethod(e.target.value as PaymentMethod | 'all')}
              className={`px-3 py-2 rounded-xl border text-sm font-semibold cursor-pointer ${theme === 'dark' ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'}`}
            >
              <option value="all">All Methods</option>
              {PAYMENT_METHODS.map((m) => (
                <option key={m.value} value={m.value}>{m.label}</option>
              ))}
            </select>

            <div className={`flex items-center gap-1 px-3 py-2 rounded-xl border text-sm ${theme === 'dark' ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
              <Calendar className="w-4 h-4 text-slate-400 flex-shrink-0" />
              <input
                type="date"
                value={filterDateFrom}
                onChange={(e) => setFilterDateFrom(e.target.value)}
                className={`bg-transparent text-sm outline-none w-28 ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}
              />
            </div>

            <div className={`flex items-center gap-1 px-3 py-2 rounded-xl border text-sm ${theme === 'dark' ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
              <span className={`text-xs ${theme === 'dark' ? 'text-slate-500' : 'text-slate-400'}`}>to</span>
              <input
                type="date"
                value={filterDateTo}
                onChange={(e) => setFilterDateTo(e.target.value)}
                className={`bg-transparent text-sm outline-none w-28 ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Payment Table */}
      <div className={`rounded-2xl border overflow-hidden ${theme === 'dark' ? 'bg-slate-900/50 border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}>
        {filteredPayments.length === 0 ? (
          <div className="py-16 text-center">
            <DollarSign className={`w-12 h-12 mx-auto mb-3 ${theme === 'dark' ? 'text-slate-700' : 'text-slate-300'}`} />
            <p className={`text-sm font-semibold ${theme === 'dark' ? 'text-slate-500' : 'text-slate-400'}`}>
              No payments found
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className={`border-b ${theme === 'dark' ? 'border-slate-800' : 'border-slate-100'}`}>
                  {['Date', 'Student', 'Group', 'Amount', 'Method', 'Receipt #', 'Actions'].map((header) => (
                    <th
                      key={header}
                      className={`px-4 py-3 text-left text-[10px] font-bold uppercase tracking-widest ${theme === 'dark' ? 'text-slate-500' : 'text-slate-400'}`}
                    >
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredPayments.map((payment) => {
                  const method = PAYMENT_METHODS.find((m) => m.value === payment.paymentMethod);
                  return (
                    <tr
                      key={payment.id}
                      className={`border-b transition ${theme === 'dark' ? 'border-slate-800/50 hover:bg-slate-800/30' : 'border-slate-50 hover:bg-slate-50'}`}
                    >
                      <td className={`px-4 py-3 text-sm font-semibold ${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'}`}>
                        {dayjs(payment.date).format('DD MMM YYYY')}
                      </td>
                      <td className={`px-4 py-3 text-sm font-bold ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                        {payment.studentName}
                      </td>
                      <td className={`px-4 py-3 text-sm ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
                        {payment.groupName}
                      </td>
                      <td className="px-4 py-3 text-sm font-black text-emerald-500">
                        {payment.amount.toLocaleString()} UZS
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold capitalize ${theme === 'dark' ? 'bg-slate-800 text-slate-300' : 'bg-slate-100 text-slate-600'}`}>
                          {method?.icon}
                          {method?.label || payment.paymentMethod}
                        </span>
                      </td>
                      <td className={`px-4 py-3 text-xs font-mono font-bold ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
                        {payment.receiptNumber}
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => openReceipt(payment)}
                          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${theme === 'dark' ? 'bg-blue-500/10 text-blue-400 hover:bg-blue-500/20' : 'bg-blue-50 text-blue-600 hover:bg-blue-100'}`}
                        >
                          <FileText className="w-3.5 h-3.5" />
                          Receipt
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Record Payment Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className={`w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden ${theme === 'dark' ? 'bg-slate-900' : 'bg-white'}`}>
            <div className={`flex items-center justify-between p-5 border-b ${theme === 'dark' ? 'border-slate-800' : 'border-slate-200'}`}>
              <h3 className={`text-lg font-black ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                Record Payment
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className={`p-2 rounded-xl transition cursor-pointer ${theme === 'dark' ? 'hover:bg-slate-800 text-slate-400' : 'hover:bg-slate-100 text-slate-500'}`}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              {/* Student Selector */}
              <div>
                <label className={`text-xs font-bold uppercase tracking-widest mb-1.5 block ${theme === 'dark' ? 'text-slate-500' : 'text-slate-400'}`}>
                  Student
                </label>
                <select
                  value={selectedStudentId}
                  onChange={(e) => handleStudentChange(e.target.value)}
                  required
                  className={`w-full px-4 py-3 rounded-xl border text-sm font-semibold outline-none transition ${theme === 'dark' ? 'bg-slate-800 border-slate-700 text-white focus:border-blue-500' : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-blue-500'}`}
                >
                  <option value="">Select a student...</option>
                  {myStudents.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.fullName} — {s.groupName} ({s.tuitionFee?.toLocaleString()} UZS)
                    </option>
                  ))}
                </select>
              </div>

              {/* Amount */}
              <div>
                <label className={`text-xs font-bold uppercase tracking-widest mb-1.5 block ${theme === 'dark' ? 'text-slate-500' : 'text-slate-400'}`}>
                  Amount (UZS)
                </label>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="Enter amount"
                  required
                  min="0"
                  className={`w-full px-4 py-3 rounded-xl border text-sm font-bold outline-none transition ${theme === 'dark' ? 'bg-slate-800 border-slate-700 text-white focus:border-blue-500 placeholder-slate-600' : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-blue-500 placeholder-slate-400'}`}
                />
              </div>

              {/* Payment Method */}
              <div>
                <label className={`text-xs font-bold uppercase tracking-widest mb-1.5 block ${theme === 'dark' ? 'text-slate-500' : 'text-slate-400'}`}>
                  Payment Method
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {PAYMENT_METHODS.map((m) => (
                    <button
                      key={m.value}
                      type="button"
                      onClick={() => setPaymentMethod(m.value)}
                      className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 text-xs font-bold transition cursor-pointer ${
                        paymentMethod === m.value
                          ? 'border-blue-500 bg-blue-500/10 text-blue-500'
                          : theme === 'dark'
                          ? 'border-slate-700 bg-slate-800 text-slate-400 hover:border-slate-600'
                          : 'border-slate-200 bg-slate-50 text-slate-500 hover:border-slate-300'
                      }`}
                    >
                      {m.icon}
                      {m.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Date */}
              <div>
                <label className={`text-xs font-bold uppercase tracking-widest mb-1.5 block ${theme === 'dark' ? 'text-slate-500' : 'text-slate-400'}`}>
                  Date
                </label>
                <input
                  type="date"
                  value={payDate}
                  onChange={(e) => setPayDate(e.target.value)}
                  required
                  className={`w-full px-4 py-3 rounded-xl border text-sm font-semibold outline-none transition ${theme === 'dark' ? 'bg-slate-800 border-slate-700 text-white focus:border-blue-500' : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-blue-500'}`}
                />
              </div>

              {/* Notes */}
              <div>
                <label className={`text-xs font-bold uppercase tracking-widest mb-1.5 block ${theme === 'dark' ? 'text-slate-500' : 'text-slate-400'}`}>
                  Notes (optional)
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  placeholder="Optional notes..."
                  className={`w-full px-4 py-3 rounded-xl border text-sm outline-none resize-none transition ${theme === 'dark' ? 'bg-slate-800 border-slate-700 text-white focus:border-blue-500 placeholder-slate-600' : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-blue-500 placeholder-slate-400'}`}
                />
              </div>

              {/* Submit */}
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className={`flex-1 px-4 py-3 rounded-xl text-sm font-bold transition cursor-pointer ${theme === 'dark' ? 'bg-slate-800 text-slate-400 hover:bg-slate-700' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 px-4 py-3 rounded-xl bg-blue-500 hover:bg-blue-600 text-white text-sm font-bold transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-blue-500/20"
                >
                  {isSubmitting ? 'Saving...' : 'Record Payment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Receipt Modal */}
      {receiptData && <ReceiptView data={receiptData} onClose={() => setReceiptData(null)} />}
    </div>
  );
};
