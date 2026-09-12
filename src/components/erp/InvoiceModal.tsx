import React from 'react';
import { Download, Printer, X } from 'lucide-react';
import type { Invoice } from '../../types';
import type { ReceiptCenter } from '../../utils/receipt';
import { InvoiceDocument } from './InvoiceDocument';
import { generateInvoicePdf, buildInvoicePrintHtml, invoiceFileName } from '../../utils/invoice';

interface InvoiceModalProps {
  invoice: Invoice;
  center: ReceiptCenter;
  onClose: () => void;
}

/** Invoice preview modal with PDF / Print / Close actions (buttons outside the document). */
export const InvoiceModal: React.FC<InvoiceModalProps> = ({ invoice, center, onClose }) => {
  const [pdfError, setPdfError] = React.useState<string | null>(null);

  const handleDownloadPdf = () => {
    setPdfError(null);
    try {
      const doc = generateInvoicePdf(invoice, center);
      doc.save(invoiceFileName(invoice, center.name));
    } catch (err: any) {
      console.error('[InvoiceModal] PDF yaratishda xatolik:', err?.message || String(err));
      setPdfError("PDF tayyorlashda xatolik yuz berdi. Iltimos, qayta urinib ko'ring.");
    }
  };

  const handlePrint = () => {
    const html = buildInvoicePrintHtml(invoice, center);
    const printWindow = window.open('', '_blank', 'width=900,height=760');
    if (!printWindow) {
      setPdfError('Chop etish oynasi ochilmadi. Brauzer sozlamalarini tekshiring.');
      return;
    }
    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.focus();
    printWindow.onafterprint = () => printWindow.close();
    setTimeout(() => {
      if (!printWindow.closed) {
        printWindow.print();
      }
    }, 120);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label="Invoice"
    >
      <div className="w-full max-w-xl bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden">
        {/* Modal header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800">
          <span className="text-xs font-black uppercase tracking-widest text-slate-400">
            Schot (Invoice)
          </span>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
            aria-label="Yopish"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* PDF error */}
        {pdfError && (
          <div className="mx-6 mt-4 px-4 py-3 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-xs font-bold text-rose-600 dark:text-rose-400">
            {pdfError}
          </div>
        )}

        {/* Document */}
        <div className="mx-6 my-5 overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800 bg-white">
          <InvoiceDocument invoice={invoice} center={center} />
        </div>

        {/* Action bar */}
        <div className="flex items-center justify-end gap-2.5 px-6 py-4 bg-slate-50 dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800">
          <button
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
          >
            Yopish
          </button>
          <button
            onClick={handlePrint}
            className="px-4 py-2.5 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
            aria-label="Invoiceni chop etish"
          >
            <Printer className="w-3.5 h-3.5" />
            Chop etish
          </button>
          <button
            onClick={handleDownloadPdf}
            className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black flex items-center gap-1.5 transition cursor-pointer shadow-md shadow-amber-500/20"
            aria-label="PDF yuklab olish"
          >
            <Download className="w-3.5 h-3.5" />
            PDF yuklab olish
          </button>
        </div>
      </div>
    </div>
  );
};