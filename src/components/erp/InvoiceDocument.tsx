import React from 'react';
import type { Invoice } from '../../types';
import type { ReceiptCenter } from '../../utils/receipt';
import {
  formatUzsAmount,
  formatReceiptDate,
  extractReceiptTime,
  methodLabel,
} from '../../utils/receipt';
import { invoiceStatusLabel } from '../../utils/invoice';

interface InvoiceDocumentProps {
  invoice: Invoice;
  center: ReceiptCenter;
}

/** Clean document-style invoice preview (no dashboards, no buttons). */
export const InvoiceDocument: React.FC<InvoiceDocumentProps> = ({ invoice, center }) => {
  const invoiceNo = invoice.invoiceNumber || invoice.id || 'INV';
  const dateStr = formatReceiptDate(invoice.paymentDate || invoice.createdAt);
  const time = extractReceiptTime(invoice.createdAt || invoice.paymentDate);
  const status = invoiceStatusLabel(invoice.status);
  const isPaid = String(invoice.status).toUpperCase() === 'PAID';
  const notes = invoice.notes != null && String(invoice.notes).trim() ? String(invoice.notes).trim() : '';

  const rows: [string, string][] = [
    ["O'quvchi", invoice.studentName || '—'],
    ['Kurs o‘qituvchisi', invoice.teacherName || '—'],
    ["To'lov usuli", methodLabel(invoice.paymentMethod)],
    ['Holat', status],
  ];

  return (
    <div className="bg-white text-slate-900 rounded-t-2xl overflow-hidden">
      <div className="px-6 sm:px-10 py-7 sm:py-9 border-x border-slate-200">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 border-b border-slate-200 pb-5">
          <div>
            <div className="text-base sm:text-lg font-black tracking-tight text-slate-900">
              {center.name || "Renessans O'quv Markazi"}
            </div>
            <div className="mt-1 text-[9px] font-bold uppercase tracking-[0.25em] text-slate-400">
              Schot (Invoice)
            </div>
          </div>
          <div className="text-right shrink-0">
            <div className="text-[9px] uppercase tracking-wider text-slate-400">Invoice №</div>
            <div className="text-sm font-black text-slate-900 mt-0.5 font-mono">{invoiceNo}</div>
            <div className="text-[10px] text-slate-500 mt-0.5">
              {time ? `${dateStr} / ${time}` : dateStr}
            </div>
          </div>
        </div>

        {/* Details */}
        <div className="mt-5 text-[10px] font-black uppercase tracking-widest text-slate-400">
          Ma'lumotlar
        </div>
        <div className="mt-1 divide-y divide-slate-100">
          {rows.map(([label, value]) => (
            <div key={label} className="flex items-center justify-between gap-4 py-2">
              <span className="text-xs text-slate-500">{label}</span>
              {label === 'Holat' ? (
                <span className={`text-xs font-black ${isPaid ? 'text-emerald-600' : 'text-amber-600'}`}>
                  {value}
                </span>
              ) : (
                <span className="text-xs font-bold text-slate-800 text-right">{value}</span>
              )}
            </div>
          ))}
        </div>

        {notes && (
          <div className="mt-3 text-[11px] text-slate-500">
            Izoh: {notes}
          </div>
        )}

        {/* Amount */}
        <div className="mt-5 text-[10px] font-black uppercase tracking-widest text-slate-400">
          To'lov
        </div>
        <div className="mt-1 py-2">
          <div className="flex items-center justify-between gap-4">
            <span className="text-xs text-slate-500">Summa</span>
            <span className="text-xs font-bold text-slate-800 font-mono">
              {formatUzsAmount(invoice.amount)}
            </span>
          </div>
        </div>
        <div className="border-t-2 border-slate-900 pt-3 flex items-center justify-between gap-4">
          <span className="text-sm font-black text-slate-900">Jami</span>
          <span className={`text-sm font-black font-mono ${isPaid ? 'text-emerald-600' : 'text-amber-600'}`}>
            {formatUzsAmount(invoice.amount)}
          </span>
        </div>

        {/* Footer */}
        <div className="mt-8 pt-4 border-t border-slate-200 text-[10px] text-slate-500 space-y-0.5">
          <div className="text-[11px] font-bold text-slate-800">
            {center.name || "Renessans O'quv Markazi"}
          </div>
          {center.address && <div>{center.address}</div>}
          {center.phone && <div>Tel: {center.phone}</div>}
          <div className="pt-1.5 text-slate-400">Invoice №: {invoiceNo}</div>
        </div>
      </div>
    </div>
  );
};