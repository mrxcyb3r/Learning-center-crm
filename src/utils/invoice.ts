/**
 * Invoice helpers — the professional partner-facing document generated from an
 * accepted financial record. Mirrors the receipt subsystem's structure so the
 * on-screen preview, the print window and the PDF all show identical data.
 */

import { jsPDF } from 'jspdf';
import type { Invoice } from '../types';
import { toPdfPlain, htmlEscape, formatUzsAmount, formatReceiptDate, extractReceiptTime, methodLabel } from './receipt';

const A4_W = 210;
const A4_H = 297;
const MARGIN = 16;
const COL_W = A4_W - MARGIN * 2;

export function invoiceStatusLabel(status: unknown): string {
  switch (String(status).toUpperCase()) {
    case 'PAID': return "TO'LANDI";
    case 'PENDING': return "KUTILMOQDA";
    case 'VOID': return "BEKOR QILINGAN";
    default: {
      const s = String(status ?? '').trim();
      return s || "TO'LANDI";
    }
  }
}

/** Stable, printable filename for an invoice. */
export function invoiceFileName(invoice: Invoice, centerName?: string): string {
  const safeCenter = (centerName || 'Renessans').replace(/[^A-Za-z0-9]+/g, '-');
  const safeNo = String(invoice.invoiceNumber || invoice.id || 'INV').replace(/[^A-Za-z0-9-]/g, '');
  return `${safeCenter}-Invoice-${safeNo}.pdf`;
}

function drawHr(doc: jsPDF, y: number, weight = 0.3, color: [number, number, number] = [203, 213, 225]): void {
  doc.setDrawColor(...color);
  doc.setLineWidth(weight);
  doc.line(MARGIN, y, A4_W - MARGIN, y);
}

/** Build the A4 invoice PDF. Returns the jsPDF instance (caller saves). */
export function generateInvoicePdf(invoice: Invoice, center: { name?: string; address?: string; phone?: string }): jsPDF {
  const doc = new jsPDF({ unit: 'mm', format: 'a4', compress: true });
  const invoiceNo = toPdfPlain(invoice.invoiceNumber || invoice.id || 'INV');
  const dateStr = toPdfPlain(formatReceiptDate(invoice.paymentDate || invoice.createdAt));
  const time = extractReceiptTime(invoice.createdAt || invoice.paymentDate);
  const student = toPdfPlain(invoice.studentName);
  const teacher = toPdfPlain(invoice.teacherName);
  const method = toPdfPlain(methodLabel(invoice.paymentMethod));
  const notes = invoice.notes != null && String(invoice.notes).trim() ? toPdfPlain(invoice.notes) : '';
  const amountTotal = toPdfPlain(formatUzsAmount(invoice.amount));
  const status = toPdfPlain(invoiceStatusLabel(invoice.status));
  const centerName = toPdfPlain(center.name);
  const address = toPdfPlain(center.address);
  const phone = toPdfPlain(center.phone);
  const isPaid = String(invoice.status).toUpperCase() === 'PAID';

  doc.setFont('helvetica');

  let y = MARGIN;

  doc.setFontSize(17);
  doc.setFont('helvetica', 'bold');
  doc.setCharSpace(0.25);
  doc.text(centerName, MARGIN, y);
  doc.setFont('helvetica', 'normal');
  doc.setCharSpace(0);

  y += 6;
  doc.setFontSize(10);
  doc.setTextColor(120, 120, 120);
  doc.setFont('helvetica', 'bold');
  doc.setCharSpace(1.8);
  doc.text('S C H O T   (' + 'I N V O I C E' + ')', MARGIN, y);
  doc.setCharSpace(0);
  doc.setTextColor(20, 20, 20);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(100, 100, 100);
  doc.text('Invoice №', A4_W - MARGIN, 16, { align: 'right' });
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(20, 20, 20);
  doc.setFontSize(11);
  doc.text(invoiceNo, A4_W - MARGIN, 21.5, { align: 'right' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(100, 100, 100);
  doc.text(time ? `${dateStr}  /  ${time}` : dateStr, A4_W - MARGIN, 27, { align: 'right' });

  y = MARGIN + 18;
  drawHr(doc, y);
  y += 10;

  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(140, 140, 140);
  doc.setCharSpace(1);
  doc.text('MA`LUMOTLAR', MARGIN, y);
  doc.setCharSpace(0);

  y += 6;
  const labelColor: [number, number, number] = [100, 100, 100];
  const valueColor: [number, number, number] = [20, 20, 20];
  const details: [string, string][] = [
    ['O`quvchi', student],
    ['Kurs o`qituvchisi', teacher],
    ['To`lov usuli', method],
    ['Holat', status],
  ];

  for (const [label, value] of details) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(...labelColor);
    doc.text(label, MARGIN, y);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...valueColor);
    doc.text(value, MARGIN + COL_W, y, { align: 'right' });
    y += 6.2;
  }

  if (notes) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(...labelColor);
    doc.text('Izoh: ' + notes, MARGIN, y);
    y += 6.2;
  }

  y += 4;
  drawHr(doc, y);
  y += 10;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(140, 140, 140);
  doc.setCharSpace(1);
  doc.text('TO`LOV', MARGIN, y);
  doc.setCharSpace(0);

  y += 6;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(...labelColor);
  doc.text('Summa', MARGIN, y);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...valueColor);
  doc.text(amountTotal, MARGIN + COL_W, y, { align: 'right' });
  y += 6.2;

  y += 1.5;
  drawHr(doc, y, 0.7, [15, 23, 42]);
  y += 6;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.text('JAMI', MARGIN, y);
  doc.setTextColor(isPaid ? 22 : 180, isPaid ? 163 : 30, isPaid ? 74 : 30);
  doc.text(amountTotal, MARGIN + COL_W, y, { align: 'right' });

  const footerY = A4_H - MARGIN - 14;
  drawHr(doc, footerY);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(20, 20, 20);
  doc.text(centerName, MARGIN, footerY + 6);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(110, 110, 110);
  let fy = footerY + 11;
  if (address) {
    doc.text(address, MARGIN, fy);
    fy += 4.5;
  }
  if (phone) {
    doc.text(`Tel: ${phone}`, MARGIN, fy);
  }
  doc.text(`Invoice №: ${invoiceNo}`, MARGIN, footerY + (phone || address ? fy + 6 : fy + 10));

  return doc;
}

/** Standalone A4 HTML document for the dedicated print window. */
export function buildInvoicePrintHtml(invoice: Invoice, center: { name?: string; address?: string; phone?: string }): string {
  const invoiceNo = htmlEscape(invoice.invoiceNumber || invoice.id || 'INV');
  const dateStr = formatReceiptDate(invoice.paymentDate || invoice.createdAt);
  const time = extractReceiptTime(invoice.createdAt || invoice.paymentDate);
  const student = htmlEscape(invoice.studentName);
  const teacher = htmlEscape(invoice.teacherName);
  const method = htmlEscape(methodLabel(invoice.paymentMethod));
  const amountTotal = formatUzsAmount(invoice.amount);
  const status = invoiceStatusLabel(invoice.status);
  const notes = invoice.notes != null && String(invoice.notes).trim() ? htmlEscape(invoice.notes) : '';
  const centerName = htmlEscape(center.name);
  const address = htmlEscape(center.address);
  const phone = htmlEscape(center.phone);
  const paidClass = String(invoice.status).toUpperCase() === 'PAID' ? 'paid' : 'pending';

  const rows = [
    ['O&rsquo;quvchi', student],
    ['Kurs o&rsquo;qituvchisi', teacher],
    ['To&rsquo;lov usuli', method],
    ['Holat', status],
  ]
    .map(([label, value]) => `<tr><td class="k">${label}</td><td class="v">${value}</td></tr>`)
    .join('');

  return `<!DOCTYPE html>
<html lang="uz">
<head>
<meta charset="utf-8" />
<title>Schot (Invoice) — ${invoiceNo}</title>
<style>
  @page { size: A4; margin: 16mm; }
  * { box-sizing: border-box; }
  body { margin: 0; font-family: 'Segoe UI', 'Helvetica Neue', Arial, sans-serif; color: #141a24; }
  .doc { max-width: 178mm; margin: 0 auto; }
  .muted { color: #7a828e; }
  .hdr { border-bottom: 1px solid #e5e7eb; padding-bottom: 12px; margin-bottom: 20px; }
  .hdr h1 { margin: 0; font-size: 17px; letter-spacing: .3px; }
  .hdr .doc-name { margin: 5px 0 0; font-size: 9px; font-weight: 700; letter-spacing: 2px; color: #7a828e; }
  .meta { display: flex; justify-content: space-between; align-items: flex-start; }
  .meta .ref { text-align: right; }
  .meta .ref .id { font-weight: 700; font-size: 13px; color: #141a24; margin-top: 2px; }
  .meta .ref .d { color: #7a828e; font-size: 10px; margin-top: 2px; }
  .sec-title { font-size: 8px; font-weight: 700; letter-spacing: 1.5px; color: #9aa1ab; margin: 14px 0 8px; }
  table.det { width: 100%; border-collapse: collapse; }
  table.det td { padding: 4px 0; font-size: 10px; }
  table.det td.k { color: #7a828e; }
  table.det td.v { text-align: right; font-weight: 700; color: #141a24; }
  .paid { color: #16a34a; }
  .pending { color: #b45309; }
  .amt-divider { border: 0; border-top: 1px solid #cbd5e1; margin: 10px 0; }
  .amt-divider.thick { border-top: 2px solid #0f172a; }
  .total-row { display: flex; justify-content: space-between; font-size: 12px; font-weight: 800; }
  .total-row .amt { color: #16a34a; }
  .sum-row { display: flex; justify-content: space-between; font-size: 10px; color: #141a24; }
  .sum-row .amt { font-weight: 700; }
  .notes { font-size: 9px; color: #6b7280; margin-top: 10px; }
  .ftr { margin-top: 34mm; border-top: 1px solid #e5e7eb; padding-top: 10px; font-size: 9px; color: #6b7280; }
  .ftr .n { font-weight: 700; font-size: 10px; color: #141a24; }
  .id-line { margin-top: 10px; font-size: 9px; color: #9aa1ab; }
</style>
</head>
<body>
  <div class="doc">
    <div class="hdr">
      <div class="meta">
        <div>
          <h1>${centerName}</h1>
          <div class="doc-name">SCHOT (INVOICE)</div>
        </div>
        <div class="ref">
          <div class="muted" style="font-size:9px;">Invoice №</div>
          <div class="id">${invoiceNo}</div>
          <div class="d">${time ? `${dateStr} / ${time}` : dateStr}</div>
        </div>
      </div>
    </div>

    <div class="sec-title">MA&rsquo;LUMOTLAR</div>
    <table class="det">
      ${rows}
    </table>
    ${notes ? `<div class="notes">Izoh: ${notes}</div>` : ''}

    <div class="sec-title">TO&rsquo;LOV</div>
    <div class="sum-row"><span>Summa</span><span class="amt">${amountTotal}</span></div>
    <hr class="amt-divider thick" />
    <div class="total-row"><span>JAMI</span><span class="amt ${paidClass}">${amountTotal}</span></div>

    <div class="ftr">
      <div class="n">${centerName}</div>
      ${address ? `<div>${address}</div>` : ''}
      ${phone ? `<div>Tel: ${phone}</div>` : ''}
      <div class="id-line">Invoice №: ${invoiceNo}</div>
    </div>
  </div>
</body>
</html>`;
}