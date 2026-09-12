import React from 'react';
import type { IncomePaymentRecord } from '../../types/crm';
import {
  ReceiptCenter,
  getReceiptNumber,
  formatUzsAmount,
  formatReceiptDate,
  extractReceiptTime,
  methodLabel,
  statusLabel,
} from '../../utils/receipt';

interface ReceiptDocumentProps {
  payment: IncomePaymentRecord;
  center: ReceiptCenter;
}

/** Clean document-style receipt preview (no dashboards, no buttons). */
export const ReceiptDocument: React.FC<ReceiptDocumentProps> = ({ payment, center }) => {
  const receiptNum = getReceiptNumber(payment);
  const dateStr = formatReceiptDate(payment.date);
  const time = extractReceiptTime((payment as any).createdAt);
  const status = statusLabel(payment.status || (payment as any).paymentStatus);
  const isPaid = String(payment.status || (payment as any).paymentStatus).toLowerCase() !== 'voided';

  const rows: [string, string][] = [
    ["O'quvchi", payment.studentName],
    ['Kurs', payment.course || '—'],
    ["To'lov davri", (payment.month || (payment as any).paymentPeriod || '').trim() || '—'],
    ["To'lov usuli", methodLabel(payment.method || (payment as any).paymentMethod)],
    ["To'lov sanasi", time ? `${dateStr} ${time}` : dateStr],
    ['Holat', status],
  ];

  return (
    <div className="bg-white text-slate-900 rounded-t-2xl overflow-hidden">
      {/* Document body */}
      <div className="px-6 sm:px-10 py-7 sm:py-9 border-x border-slate-200">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 border-b border-slate-200 pb-5">
          <div>
            <div className="text-base sm:text-lg font-black tracking-tight text-slate-900">
              {center.name || "Renessans O'quv Markazi"}
            </div>
            <div className="mt-1 text-[9px] font-bold uppercase tracking-[0.25em] text-slate-400">
              Elektron to'lov kvitansiyasi
            </div>
          </div>
          <div className="text-right shrink-0">
            <div className="text-[9px] uppercase tracking-wider text-slate-400">Kvitansiya ID</div>
            <div className="text-sm font-black text-slate-900 mt-0.5 font-mono">
              {receiptNum}
            </div>
            <div className="text-[10px] text-slate-500 mt-0.5">
              {time ? `${dateStr} / ${time}` : dateStr}
            </div>
          </div>
        </div>

        {/* Payment details */}
        <div className="mt-5 text-[10px] font-black uppercase tracking-widest text-slate-400">
          To'lov ma'lumotlari
        </div>
        <div className="mt-1 divide-y divide-slate-100">
          {rows.map(([label, value]) => (
            <div key={label} className="flex items-center justify-between gap-4 py-2">
              <span className="text-xs text-slate-500">{label}</span>
              {label === 'Holat' ? (
                <span
                  className={`text-xs font-black ${
                    isPaid ? 'text-emerald-600' : 'text-rose-600'
                  }`}
                >
                  {value}
                </span>
              ) : (
                <span className="text-xs font-bold text-slate-800 text-right">
                  {value}
                </span>
              )}
            </div>
          ))}
        </div>

        {/* Amount */}
        <div className="mt-5 text-[10px] font-black uppercase tracking-widest text-slate-400">
          To'lov
        </div>
        <div className="mt-1 py-2">
          <div className="flex items-center justify-between gap-4">
            <span className="text-xs text-slate-500">Summa</span>
            <span className="text-xs font-bold text-slate-800 font-mono">
              {formatUzsAmount(payment.amount)}
            </span>
          </div>
        </div>
        <div className="border-t-2 border-slate-900 pt-3 flex items-center justify-between gap-4">
          <span className="text-sm font-black text-slate-900">Jami to'landi</span>
          <span className="text-sm font-black text-emerald-600 font-mono">
            {formatUzsAmount(payment.amount)}
          </span>
        </div>

        {/* Footer */}
        <div className="mt-8 pt-4 border-t border-slate-200 text-[10px] text-slate-500 space-y-0.5">
          <div className="text-[11px] font-bold text-slate-800">
            {center.name || "Renessans O'quv Markazi"}
          </div>
          {center.address && <div>{center.address}</div>}
          {center.phone && <div>Tel: {center.phone}</div>}
          <div className="pt-1.5 text-slate-400">Kvitansiya ID: {receiptNum}</div>
        </div>
      </div>
    </div>
  );
};