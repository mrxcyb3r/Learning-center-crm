import React, { useMemo, useState } from 'react';
import dayjs from 'dayjs';
import { useTeacherPortal } from '../../../context/TeacherPortalContext';
import { useTheme } from '../../../context/ThemeContext';
import { ReceiptView } from '../shared/ReceiptView';
import { ReceiptData } from '../../../types/teacher';
import { FileText, Eye } from 'lucide-react';

export const TeacherReceiptsView: React.FC = () => {
  const { payments, myStudents, myGroups, teacherName } = useTeacherPortal();
  const { theme } = useTheme();

  const [selectedReceipt, setSelectedReceipt] = useState<ReceiptData | null>(null);

  const receiptPayments = useMemo(() => {
    return payments
      .filter((p) => p.receiptRef)
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [payments]);

  const openReceipt = (payment: typeof receiptPayments[0]) => {
    const student = myStudents.find((s) => s.id === payment.studentId);
    const group = myGroups.find((g) => g.id === student?.groupId);

    setSelectedReceipt({
      centerName: group?.name || 'O\'quv markazi',
      teacherName,
      studentName: payment.studentName,
      course: group?.name || payment.cohortGroup || '',
      amount: payment.amount,
      date: dayjs(payment.date).format('DD MMM YYYY'),
      paymentMethod: payment.paymentMethod,
      receiptNumber: payment.receiptRef || '',
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className={`text-xl font-black ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
          Kvitansiyalar
        </h2>
        <p className={`text-sm mt-0.5 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
          To'lov kvitansiyalarini ko'ring va chop eting
        </p>
      </div>

      <div className={`rounded-2xl border overflow-hidden ${theme === 'dark' ? 'bg-slate-900/50 border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}>
        {receiptPayments.length === 0 ? (
          <div className="py-16 text-center">
            <FileText className={`w-12 h-12 mx-auto mb-3 ${theme === 'dark' ? 'text-slate-700' : 'text-slate-300'}`} />
            <p className={`text-sm font-semibold ${theme === 'dark' ? 'text-slate-500' : 'text-slate-400'}`}>
              Kvitansiyalar topilmadi
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className={`border-b ${theme === 'dark' ? 'border-slate-800' : 'border-slate-100'}`}>
                  {['Kvitansiya №', 'O\'quvchi', 'Summa', 'Sana', 'Amal'].map((h) => (
                    <th
                      key={h}
                      className={`px-5 py-3 text-left text-[10px] font-bold uppercase tracking-widest ${theme === 'dark' ? 'text-slate-500' : 'text-slate-400'}`}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {receiptPayments.map((p) => (
                  <tr
                    key={p.id}
                    className={`border-b transition ${theme === 'dark' ? 'border-slate-800/50 hover:bg-slate-800/30' : 'border-slate-50 hover:bg-slate-50'}`}
                  >
                    <td className={`px-5 py-3 text-xs font-mono font-bold ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
                      {p.receiptRef}
                    </td>
                    <td className={`px-5 py-3 text-sm font-bold ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                      {p.studentName}
                    </td>
                    <td className="px-5 py-3 text-sm font-black text-emerald-500">
                      {p.amount.toLocaleString()} UZS
                    </td>
                    <td className={`px-5 py-3 text-sm font-semibold ${theme === 'dark' ? 'text-slate-300' : 'text-slate-600'}`}>
                      {dayjs(p.date).format('DD MMM YYYY')}
                    </td>
                    <td className="px-5 py-3">
                      <button
                        onClick={() => openReceipt(p)}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${theme === 'dark' ? 'bg-blue-500/10 text-blue-400 hover:bg-blue-500/20' : 'bg-blue-50 text-blue-600 hover:bg-blue-100'}`}
                      >
                        <Eye className="w-3.5 h-3.5" />
                        Ko'rish
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {selectedReceipt && <ReceiptView data={selectedReceipt} onClose={() => setSelectedReceipt(null)} />}
    </div>
  );
};
