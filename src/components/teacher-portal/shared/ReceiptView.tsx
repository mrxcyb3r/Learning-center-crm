import React, { useRef } from 'react';
import { Printer, Download, X } from 'lucide-react';
import { ReceiptData } from '../../../types/teacher';
import { DEMO_CENTER_NAME } from '../../../config/demo';

interface ReceiptViewProps {
  data: ReceiptData;
  onClose: () => void;
}

export const ReceiptView: React.FC<ReceiptViewProps> = ({ data, onClose }) => {
  const receiptRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Receipt - ${data.receiptNumber}</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: 'Segoe UI', system-ui, sans-serif; padding: 32px; color: #1e293b; }
          .receipt { max-width: 400px; margin: 0 auto; border: 2px dashed #e2e8f0; border-radius: 16px; padding: 32px; }
          .header { text-align: center; margin-bottom: 24px; padding-bottom: 16px; border-bottom: 2px solid #f1f5f9; }
          .center-name { font-size: 18px; font-weight: 900; color: #f59e0b; }
          .subtitle { font-size: 11px; font-weight: 600; color: #94a3b8; text-transform: uppercase; letter-spacing: 2px; margin-top: 4px; }
          .row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #f8fafc; }
          .row-label { font-size: 12px; color: #94a3b8; font-weight: 600; }
          .row-value { font-size: 13px; font-weight: 700; color: #1e293b; }
          .total { text-align: center; margin: 24px 0; padding: 16px; background: #f0fdf4; border-radius: 12px; }
          .total-amount { font-size: 28px; font-weight: 900; color: #16a34a; }
          .total-label { font-size: 10px; color: #16a34a; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; }
          .footer { text-align: center; margin-top: 20px; font-size: 10px; color: #94a3b8; }
          @media print { body { padding: 0; } .receipt { border: none; } }
        </style>
      </head>
      <body>
        <div class="receipt">
          <div class="header">
            <div class="center-name">${data.centerName || DEMO_CENTER_NAME}</div>
            <div class="subtitle">Payment Receipt</div>
          </div>
          <div class="row"><span class="row-label">Receipt #</span><span class="row-value">${data.receiptNumber}</span></div>
          <div class="row"><span class="row-label">Date</span><span class="row-value">${data.date}</span></div>
          <div class="row"><span class="row-label">Teacher</span><span class="row-value">${data.teacherName}</span></div>
          <div class="row"><span class="row-label">Student</span><span class="row-value">${data.studentName}</span></div>
          <div class="row"><span class="row-label">Course</span><span class="row-value">${data.course}</span></div>
          <div class="row"><span class="row-label">Payment Method</span><span class="row-value">${data.paymentMethod}</span></div>
          <div class="total">
            <div class="total-label">Amount Paid</div>
            <div class="total-amount">${data.amount.toLocaleString()} UZS</div>
          </div>
          <div class="footer">Thank you for your payment!</div>
        </div>
        <script>window.onload = function() { window.print(); }</script>
      </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between p-5 border-b border-slate-200">
          <h3 className="text-lg font-black text-slate-900">Receipt</h3>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition cursor-pointer"
            >
              <Printer className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
        <div ref={receiptRef} className="p-6">
          <div className="text-center mb-6 pb-4 border-b-2 border-dashed border-slate-200">
            <div className="text-lg font-black text-amber-500">{data.centerName || DEMO_CENTER_NAME}</div>
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-[3px] mt-1">Payment Receipt</div>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between py-2 border-b border-slate-100">
              <span className="text-xs font-semibold text-slate-400">Receipt #</span>
              <span className="text-sm font-bold text-slate-900">{data.receiptNumber}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-slate-100">
              <span className="text-xs font-semibold text-slate-400">Date</span>
              <span className="text-sm font-bold text-slate-900">{data.date}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-slate-100">
              <span className="text-xs font-semibold text-slate-400">Teacher</span>
              <span className="text-sm font-bold text-slate-900">{data.teacherName}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-slate-100">
              <span className="text-xs font-semibold text-slate-400">Student</span>
              <span className="text-sm font-bold text-slate-900">{data.studentName}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-slate-100">
              <span className="text-xs font-semibold text-slate-400">Course</span>
              <span className="text-sm font-bold text-slate-900">{data.course}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-slate-100">
              <span className="text-xs font-semibold text-slate-400">Method</span>
              <span className="text-sm font-bold text-slate-900 capitalize">{data.paymentMethod}</span>
            </div>
          </div>
          <div className="mt-6 p-4 bg-emerald-50 rounded-2xl text-center">
            <div className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest">Amount Paid</div>
            <div className="text-3xl font-black text-emerald-600 mt-1">{data.amount.toLocaleString()} UZS</div>
          </div>
          <div className="text-center mt-4 text-[10px] font-semibold text-slate-400">
            Thank you for your payment!
          </div>
        </div>
      </div>
    </div>
  );
};
