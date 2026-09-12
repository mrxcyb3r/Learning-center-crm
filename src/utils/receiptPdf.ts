/**
 * Real PDF receipt generation (jsPDF, client-side) plus the standalone A4
 * print document used by the "Chop etish" action.
 *
 * The PDF is generated from the payment already authorized on the client —
 * no extra endpoint, no secrets, no network round-trip.
 */

import { jsPDF } from 'jspdf';
import type { IncomePaymentRecord } from '../types/crm';
import {
  ReceiptCenter,
  getReceiptNumber,
  formatUzsAmount,
  formatReceiptDate,
  extractReceiptTime,
  methodLabel,
  statusLabel,
  toPdfPlain,
  htmlEscape,
} from './receipt';

const A4_W = 210;
const A4_H = 297;
const MARGIN = 16;
const COL_W = A4_W - MARGIN * 2;

/** Stable, printable filename for a receipt. */
export function receiptFileName(payment: IncomePaymentRecord, centerName?: string): string {
  const safeCenter = (centerName || 'Renessans').replace(/[^A-Za-z0-9]+/g, '-');
  return `${safeCenter}-Kvitansiya-${getReceiptNumber(payment).replace(/[^A-Za-z0-9-]/g, '')}.pdf`;
}

function drawHr(doc: jsPDF, y: number, weight = 0.3, color: [number, number, number] = [203, 213, 225]): void {
  doc.setDrawColor(...color);
  doc.setLineWidth(weight);
  doc.line(MARGIN, y, A4_W - MARGIN, y);
}

/** Build the A4 PDF document. Returns the jsPDF instance (caller saves). */
export function generateReceiptPdf(payment: IncomePaymentRecord, center: ReceiptCenter): jsPDF {
  const doc = new jsPDF({ unit: 'mm', format: 'a4', compress: true });
  const receiptNum = toPdfPlain(getReceiptNumber(payment));
  const dateStr = toPdfPlain(formatReceiptDate(payment.date));
  const time = extractReceiptTime((payment as any).createdAt);
  const student = toPdfPlain(payment.studentName);
  const course = toPdfPlain(payment.course || '-');
  const period = toPdfPlain((payment.month || (payment as any).paymentPeriod || '').trim() || '-');
  const method = toPdfPlain(methodLabel(payment.method || (payment as any).paymentMethod));
  const amountTotal = toPdfPlain(formatUzsAmount(payment.amount));
  const status = statusLabel(payment.status || (payment as any).paymentStatus);
  const centerName = toPdfPlain(center.name);
  const address = toPdfPlain(center.address);
  const phone = toPdfPlain(center.phone);

  doc.setFont('helvetica');

  let y = 0;

  // ---- Header ----
  y = MARGIN;
  doc.setFontSize(17);
  doc.setFont('helvetica', 'bold');
  doc.setCharSpace(0.25);
  doc.text(centerName, MARGIN, y, { align: 'left' });
  doc.setFont('helvetica', 'normal');
  doc.setCharSpace(0);

  y += 6;
  doc.setFontSize(10);
  doc.setTextColor(120, 120, 120);
  doc.setFont('helvetica', 'bold');
  doc.setCharSpace(1.5);
  doc.text('E L E K T R O N   T O` L O V   K V I T A N S I Y A S I', MARGIN, y);
  doc.setCharSpace(0);
  doc.setTextColor(20, 20, 20);

  // Receipt number + date (right aligned, top block)
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(100, 100, 100);
  doc.text('Kvitansiya ID', A4_W - MARGIN, 16, { align: 'right' });
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(20, 20, 20);
  doc.setFontSize(11);
  doc.text(receiptNum, A4_W - MARGIN, 21.5, { align: 'right' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(100, 100, 100);
  doc.text(time ? `${dateStr}  /  ${time}` : dateStr, A4_W - MARGIN, 27, { align: 'right' });

  y = MARGIN + 18;
  drawHr(doc, y);
  y += 10;

  // ---- Payment details ----
  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(140, 140, 140);
  doc.setCharSpace(1);
  doc.text('TO`LOV MA`LUMOTLARI', MARGIN, y);
  doc.setCharSpace(0);

  y += 6;
  const labelColor: [number, number, number] = [100, 100, 100];
  const valueColor: [number, number, number] = [20, 20, 20];
  const details: [string, string][] = [
    ['O`quvchi', student],
    ['Kurs', course],
    ['To`lov davri', period],
    ['To`lov usuli', method],
    ['To`lov sanasi', time ? `${dateStr} ${time}` : dateStr],
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

  if (String(status).toUpperCase().trim() === 'TO`LANDI') {
    y -= 1.5;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(22, 163, 74);
    doc.text('\u2713  ' + 'TO`LANDI', MARGIN + COL_W, y, { align: 'right' });
  }

  y += 4;
  drawHr(doc, y);
  y += 10;

  // ---- Amount ----
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

  // Total with a stronger divider
  y += 1.5;
  drawHr(doc, y, 0.7, [15, 23, 42]);
  y += 6;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.text('JAMI TO`LANDI', MARGIN, y);
  doc.setTextColor(22, 163, 74);
  doc.text(amountTotal, MARGIN + COL_W, y, { align: 'right' });

  // ---- Footer ----
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

  return doc;
}

/** Standalone A4 HTML document for the dedicated print window. */
export function buildReceiptPrintHtml(payment: IncomePaymentRecord, center: ReceiptCenter): string {
  const receiptNum = getReceiptNumber(payment);
  const dateStr = formatReceiptDate(payment.date);
  const time = extractReceiptTime((payment as any).createdAt);
  const student = htmlEscape(payment.studentName);
  const course = htmlEscape(payment.course || '—');
  const period = htmlEscape((payment.month || (payment as any).paymentPeriod || '').trim() || '—');
  const method = htmlEscape(methodLabel(payment.method || (payment as any).paymentMethod));
  const amountTotal = formatUzsAmount(payment.amount);
  const status = statusLabel(payment.status || (payment as any).paymentStatus);
  const centerName = htmlEscape(center.name);
  const address = htmlEscape(center.address);
  const phone = htmlEscape(center.phone);

  const rows = [
    ['O&rsquo;quvchi', student],
    ['Kurs', course],
    ['To&rsquo;lov davri', period],
    ['To&rsquo;lov usuli', method],
    ['To&rsquo;lov sanasi', time ? `${dateStr} ${time}` : dateStr],
    ['Holat', status],
  ]
    .map(
      ([label, value]) =>
        `<tr><td class="k">${label}</td><td class="v">${value}</td></tr>`
    )
    .join('');

  return `<!DOCTYPE html>
<html lang="uz">
<head>
<meta charset="utf-8" />
<title>To'lov kvitansiyasi — ${htmlEscape(receiptNum)}</title>
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
  .amt-divider { border: 0; border-top: 1px solid #cbd5e1; margin: 10px 0; }
  .amt-divider.thick { border-top: 2px solid #0f172a; }
  .total-row { display: flex; justify-content: space-between; font-size: 12px; font-weight: 800; }
  .total-row .amt { color: #16a34a; }
  .sum-row { display: flex; justify-content: space-between; font-size: 10px; color: #141a24; }
  .sum-row .amt { font-weight: 700; }
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
          <div class="doc-name">ELEKTRON TO&rsquo;LOV KVITANSIYASI</div>
        </div>
        <div class="ref">
          <div class="muted" style="font-size:9px;">Kvitansiya ID</div>
          <div class="id">${htmlEscape(receiptNum)}</div>
          <div class="d">${time ? `${dateStr} / ${time}` : dateStr}</div>
        </div>
      </div>
    </div>

    <div class="sec-title">TO&rsquo;LOV MA&rsquo;LUMOTLARI</div>
    <table class="det">
      ${rows}
    </table>

    <div class="sec-title">TO&rsquo;LOV</div>
    <div class="sum-row"><span>Summa</span><span class="amt">${amountTotal}</span></div>
    <hr class="amt-divider thick" />
    <div class="total-row"><span>JAMI TO&rsquo;LANDI</span><span class="amt">${amountTotal}</span></div>

    <div class="ftr">
      <div class="n">${centerName}</div>
      ${address ? `<div>${address}</div>` : ''}
      ${phone ? `<div>Tel: ${phone}</div>` : ''}
      <div class="id-line">Kvitansiya ID: ${htmlEscape(receiptNum)}</div>
    </div>
  </div>
</body>
</html>`;
}