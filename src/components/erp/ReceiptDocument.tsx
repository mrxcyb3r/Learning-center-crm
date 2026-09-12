import React from 'react';
import { QRCodeSVG } from 'qrcode.react';
import type { IncomePaymentRecord } from '../../types/crm';
import {
  ReceiptCenter,
  buildReceiptLayoutData,
} from '../../utils/receipt';

interface ReceiptDocumentProps {
  payment: IncomePaymentRecord;
  center: ReceiptCenter;
}

/**
 * Clean document-style receipt preview (no dashboards, no buttons).
 * All values come from buildReceiptLayoutData so the on-screen document,
 * the print window and the PDF always show identical, data-conditional output.
 */
export const ReceiptDocument: React.FC<ReceiptDocumentProps> = ({ payment, center }) => {
  const d = buildReceiptLayoutData(payment, center);

  const itemRows: { num: string; name: string; detail: string; amount: string }[] = [
    { num: '1', name: 'Kurs', detail: d.course, amount: d.amountPlain },
    { num: '2', name: "To'lov davri", detail: d.period, amount: '—' },
    { num: '3', name: "To'lov usuli", detail: d.method, amount: '—' },
  ];
  if (d.hasTrx) {
    itemRows.push({ num: '4', name: 'Tranzaksiya ID', detail: d.trxId, amount: '—' });
  }

  return (
    <div className="bg-white text-slate-900 rounded-t-2xl overflow-hidden">
      <div className="px-6 sm:px-10 py-7 sm:py-9 border-x border-slate-200">
        {/* Header — 2-column grid so the reference block can never clip */}
        <div className="grid grid-cols-1 sm:grid-cols-[minmax(0,1fr)_auto] gap-x-6 gap-y-4 border-b border-slate-200 pb-5">
          <div className="min-w-0">
            <div className="text-base sm:text-lg font-black tracking-tight text-slate-900">
              {center.name || "Renessans O'quv Markazi"}
            </div>
            <div className="mt-1 text-[9px] font-bold uppercase tracking-[0.25em] text-slate-400">
              Elektron to'lov kvitansiyasi
            </div>
            {d.credentialLines.length > 1 && (
              <div className="mt-2.5 space-y-0.5 text-[10px] leading-relaxed text-slate-400">
                {d.credentialLines.slice(1).map((line, i) => (
                  <div key={i} className="truncate">{line}</div>
                ))}
              </div>
            )}
          </div>
          <div className="text-right shrink-0 sm:max-w-[45%]">
            <div className="text-[9px] uppercase tracking-wider text-slate-400">Kvitansiya ID</div>
            <div className="text-sm font-black text-slate-900 mt-0.5 font-mono break-all">
              {d.receiptNum}
            </div>
            <div className="text-[10px] text-slate-500 mt-0.5 whitespace-nowrap">
              {d.datetime}
            </div>
          </div>
        </div>

        {/* Itemized HISOB-KITOB */}
        <div className="mt-5 flex items-center justify-between gap-4">
          <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">
            Hisob-kitob
          </div>
          <span
            className={`px-2.5 py-1 rounded-full text-[10px] font-black tracking-wide ${d.status.badge}`}
          >
            {d.status.label}
          </span>
        </div>

        <table className="mt-2 w-full border-collapse">
          <thead>
            <tr className="border-b border-slate-200 text-left">
              <th className="py-2 pr-2 text-[9px] font-black uppercase tracking-wider text-slate-400 w-8">№</th>
              <th className="py-2 pr-2 text-[9px] font-black uppercase tracking-wider text-slate-400">Ko'rsatkich</th>
              <th className="py-2 px-2 text-[9px] font-black uppercase tracking-wider text-slate-400">Ma'lumot</th>
              <th className="py-2 pl-2 text-right text-[9px] font-black uppercase tracking-wider text-slate-400">Summa</th>
            </tr>
          </thead>
          <tbody>
            {[
              { num: '', name: "To'lovchi", detail: d.student, amount: '—' },
              ...itemRows,
            ].map((row, idx) => (
              <tr key={`${idx}-${row.name}`} className="border-b border-slate-100">
                <td className="py-2 pr-2 text-xs text-slate-400 align-top">{row.num}</td>
                <td className="py-2 pr-2 text-xs font-bold text-slate-800 align-top">{row.name}</td>
                <td className="py-2 px-2 text-xs text-slate-600 align-top break-words">{row.detail}</td>
                <td
                  className={`py-2 pl-2 text-right align-top text-xs ${
                    row.amount === '—' ? 'text-slate-300' : 'font-black text-slate-800 font-mono'
                  }`}
                >
                  {row.amount === '—' ? row.amount : `${row.amount} UZS`}
                </td>
              </tr>
            ))}
            <tr>
              <td colSpan={3} className="pt-3 pb-1 text-right text-sm font-black text-slate-900">
                Jami to'landi
              </td>
              <td className="pt-3 pb-1 pl-2 text-right text-sm font-black text-emerald-600 font-mono">
                {d.amountTotal}
              </td>
            </tr>
          </tbody>
        </table>

        {/* Verification QR + link */}
        <div className="mt-6 flex items-center gap-4 p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
          <div className="flex-1 min-w-0">
            <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">
              Kvitansiyani tekshirish
            </div>
            <div className="mt-1 text-[11px] text-slate-500 leading-relaxed break-all">
              {d.verificationUrl || "Tekshiruv havolasi mavjud emas."}
            </div>
            <div className="mt-1 text-[10px] text-slate-400">
              QR kodni skanerlang yoki havolani oching.
            </div>
          </div>
          {d.verificationUrl && (
            <div className="shrink-0 bg-white p-1.5 rounded-xl border border-slate-200 shadow-sm">
              <QRCodeSVG value={d.verificationUrl} size={72} level="M" fgColor="#0f172a" bgColor="#ffffff" />
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="mt-6 pt-4 border-t border-slate-200 text-[10px] text-slate-500 space-y-0.5">
          {d.credentialLines.length > 0 ? (
            d.credentialLines.map((line, i) => (
              <div key={i} className={i === 0 ? 'text-[11px] font-bold text-slate-800' : ''}>
                {line}
              </div>
            ))
          ) : (
            <div className="text-[11px] font-bold text-slate-800">
              {center.name || "Renessans O'quv Markazi"}
            </div>
          )}
          <div className="pt-1.5 text-slate-400">Kvitansiya ID: {d.receiptNum}</div>
        </div>
      </div>
    </div>
  );
};