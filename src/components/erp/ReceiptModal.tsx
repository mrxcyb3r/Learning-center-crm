import React from 'react';
import { Download, Printer, X, CheckCircle2 } from 'lucide-react';
import type { IncomePaymentRecord } from '../../types/crm';
import { ReceiptDocument } from './ReceiptDocument';
import { ReceiptCenter, receiptVerificationUrl } from '../../utils/receipt';
import { generateReceiptPdf, buildReceiptPrintHtml, receiptFileName } from '../../utils/receiptPdf';
import { qrPngDataUrl } from '../../utils/receiptQr';

interface ReceiptModalProps {
  payment: IncomePaymentRecord;
  center: ReceiptCenter;
  success?: boolean;
  onClose: () => void;
}

/** Receipt preview modal with PDF / Print / Close actions (buttons outside the document). */
export const ReceiptModal: React.FC<ReceiptModalProps> = ({ payment, center, success, onClose }) => {
  const [pdfError, setPdfError] = React.useState<string | null>(null);
  const [actionBusy, setActionBusy] = React.useState(false);

  const handleDownloadPdf = async () => {
    if (actionBusy) return;
    setActionBusy(true);
    setPdfError(null);
    try {
      // Best-effort QR (rendered off-screen); PDF still valid without it.
      const qr = await qrPngDataUrl(receiptVerificationUrl(payment));
      const doc = generateReceiptPdf(payment, center, qr);
      doc.save(receiptFileName(payment, center.name));
    } catch (err: any) {
      console.error('[ReceiptModal] PDF yaratishda xatolik:', err?.message || String(err));
      setPdfError("PDF tayyorlashda xatolik yuz berdi. Iltimos, qayta urinib ko'ring.");
    } finally {
      setActionBusy(false);
    }
  };

  const handlePrint = async () => {
    if (actionBusy) return;
    setActionBusy(true);
    setPdfError(null);
    try {
      const qr = await qrPngDataUrl(receiptVerificationUrl(payment));
      const printWindow = window.open('', '_blank', 'width=900,height=760');
      if (!printWindow) {
        setPdfError('Chop etish oynasi ochilmadi. Brauzer sozlamalarini tekshiring.');
        return;
      }
      const html = buildReceiptPrintHtml(payment, center, qr);
      printWindow.document.write(html);
      printWindow.document.close();
      printWindow.focus();
      printWindow.onafterprint = () => printWindow.close();
      setTimeout(() => {
        if (!printWindow.closed) {
          printWindow.print();
        }
      }, 120);
    } catch (err: any) {
      console.error('[ReceiptModal] Chop etishda xatolik:', err?.message || String(err));
      setPdfError("Chop etishda xatolik yuz berdi. Iltimos, qayta urinib ko'ring.");
    } finally {
      setActionBusy(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label="Kvitansiya"
    >
      <div className="w-full max-w-xl bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden">
        {/* Modal header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800">
          <span className="text-xs font-black uppercase tracking-widest text-slate-400">
            Elektron Kvitansiya
          </span>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
            aria-label="Yopish"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Success notice (shown right after a payment is created) */}
        {success && (
          <div className="mx-6 mt-4 flex items-center gap-2 px-4 py-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-sm font-bold text-emerald-600 dark:text-emerald-400">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            To'lov muvaffaqiyatli saqlandi. Kvitansiya tayyor — PDF yuklab olishingiz mumkin.
          </div>
        )}

        {/* PDF error */}
        {pdfError && (
          <div className="mx-6 mt-4 px-4 py-3 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-xs font-bold text-rose-600 dark:text-rose-400">
            {pdfError}
          </div>
        )}

        {/* Document */}
        <div className="mx-6 my-5 overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800 bg-white">
          <ReceiptDocument payment={payment} center={center} />
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
            disabled={actionBusy}
            className="px-4 py-2.5 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
            aria-label="Kvitansiyani chop etish"
          >
            <Printer className="w-3.5 h-3.5" />
            Chop etish
          </button>
          <button
            onClick={handleDownloadPdf}
            disabled={actionBusy}
            className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black flex items-center gap-1.5 transition cursor-pointer shadow-md shadow-amber-500/20 disabled:opacity-60 disabled:cursor-not-allowed"
            aria-label="PDF yuklab olish"
          >
            <Download className="w-3.5 h-3.5" />
            {actionBusy ? 'Tayyorlanmoqda...' : 'PDF yuklab olish'}
          </button>
        </div>
      </div>
    </div>
  );
};