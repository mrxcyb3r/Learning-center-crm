/**
 * Real PDF receipt generation (jsPDF, client-side) plus the standalone A4
 * print document used by the "Chop etish" action.
 *
 * The PDF is generated from the payment already authorized on the client —
 * no extra endpoint, no secrets, no network round-trip. All displayed values
 * come from buildReceiptLayoutData so the three representations (on-screen,
 * PDF, print) can never drift apart.
 */

import { jsPDF } from 'jspdf';
import type { IncomePaymentRecord } from '../types/crm';
import {
  ReceiptCenter,
  buildReceiptLayoutData,
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
  return `${safeCenter}-Kvitansiya-${toPdfPlain(getReceiptNumFromLayout(payment)).replace(/[^A-Za-z0-9-]/g, '')}.pdf`;
}

function getReceiptNumFromLayout(payment: IncomePaymentRecord): string {
  return buildReceiptLayoutData(payment, {}).receiptNum;
}

function drawHr(doc: jsPDF, x: number, y: number, w: number, weight = 0.3, color: [number, number, number] = [203, 213, 225]): void {
  doc.setDrawColor(...color);
  doc.setLineWidth(weight);
  doc.line(x, y, x + w, y);
}

/** Build the A4 PDF document. Returns the jsPDF instance (caller saves). */
export function generateReceiptPdf(
  payment: IncomePaymentRecord,
  center: ReceiptCenter,
  qrDataUrl?: string | null
): jsPDF {
  const d = buildReceiptLayoutData(payment, center);
  const doc = new jsPDF({ unit: 'mm', format: 'a4', compress: true });

  doc.setFont('helvetica');
  const labelColor: [number, number, number] = [122, 130, 142];
  const dark: [number, number, number] = [15, 23, 42];
  const gray: [number, number, number] = [100, 116, 139];

  let y = 0;

  // ---- Header (2-column grid equivalent) ----
  // Left column is width-capped and wrapped so a long center name can never
  // collide with the right reference block.
  const RIGHT_COL_W = 62;
  const LEFT_COL_W = COL_W - RIGHT_COL_W - 8;
  y = MARGIN;
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...dark);
  const nameLines = doc.splitTextToSize(toPdfPlain(d.center.name) || "Renessans O'quv Markazi", LEFT_COL_W);
  doc.text(nameLines.slice(0, 3), MARGIN, y);
  y += nameLines.slice(0, 3).length * 6;

  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(148, 163, 184);
  const docNameLines = doc.splitTextToSize('ELEKTRON TO`LOV KVITANSIYASI', LEFT_COL_W);
  doc.text(docNameLines, MARGIN, y);
  y += docNameLines.length * 3.6 + 1.2;

  // Credentials under the center name (only configured ones — never faked).
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(...gray);
  for (const line of d.credentialLines.slice(1)) {
    const wrapped = doc.splitTextToSize(toPdfPlain(line), LEFT_COL_W);
    doc.text(wrapped.slice(0, 2), MARGIN, y);
    y += wrapped.slice(0, 2).length * 3.6;
  }

  // Right block: receipt id + datetime (wrapped, right-aligned).
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(...labelColor);
  doc.text('Kvitansiya ID', A4_W - MARGIN, MARGIN, { align: 'right' });
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(...dark);
  const refLines = doc.splitTextToSize(toPdfPlain(d.receiptNum), RIGHT_COL_W);
  doc.text(refLines.slice(0, 2), A4_W - MARGIN, MARGIN + 5.5, { align: 'right' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(...gray);
  doc.text(toPdfPlain(d.datetime), A4_W - MARGIN, MARGIN + 5.5 + refLines.slice(0, 2).length * 4.4, { align: 'right' });

  y = Math.max(y + 2, MARGIN + 20);
  drawHr(doc, MARGIN, y, COL_W);

  // ---- HISOB-KITOB heading + status pill ----
  y += 9;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(148, 163, 184);
  doc.setCharSpace(1);
  doc.text('H I S O B - K I T O B', MARGIN, y);
  doc.setCharSpace(0);

  // Status pill (rounded rect, exact palette).
  const pillW = toPdfPlain(d.status.label).length * 1.7 + 10;
  const pillX = A4_W - MARGIN - pillW;
  doc.setFillColor(...d.status.bgRgb);
  doc.roundedRect(pillX, y - 3.2, pillW, 6, 3, 3, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(...d.status.textRgb);
  doc.text(toPdfPlain(d.status.label), pillX + pillW / 2, y, { align: 'center' });

  // ---- Itemized table ----
  const items = [
    { num: '', name: 'O`quvchi', detail: toPdfPlain(d.student), amount: '' },
    { num: '1', name: 'Kurs', detail: toPdfPlain(d.course), amount: `${d.amountPlain} UZS` },
    { num: '2', name: 'To`lov davri', detail: toPdfPlain(d.period), amount: '' },
    { num: '3', name: 'To`lov usuli', detail: toPdfPlain(d.method), amount: '' },
  ];
  if (d.hasTrx) {
    items.push({ num: '4', name: 'Tranzaksiya ID', detail: toPdfPlain(d.trxId), amount: '' });
  }

  y += 7;
  const headers = ['№', 'Ko`rsatkich', 'Ma`lumot', 'Summa'];
  const colNameX = MARGIN + 12;
  const colDetailX = MARGIN + 62;
  const amountRight = A4_W - MARGIN;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.5);
  doc.setTextColor(148, 163, 184);
  doc.text(headers[2], colDetailX, y);
  doc.text(headers[3], amountRight, y, { align: 'right' });
  doc.text(headers[1], MARGIN + 12, y);
  y += 2;
  drawHr(doc, MARGIN, y, COL_W, 0.4, [226, 232, 240]);

  doc.setFontSize(9);
  for (const item of items) {
    y += 6;
    // Page-break inside long tables so rows are never clipped.
    if (y > A4_H - MARGIN - 30) {
      doc.addPage();
      y = MARGIN + 6;
    }
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(148, 163, 184);
    if (item.num) doc.text(item.num, MARGIN, y);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...dark);
    doc.text(item.name, colNameX, y);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(71, 85, 105);
    let rowLines = 1;
    if (item.detail) {
      const detailLines = doc.splitTextToSize(item.detail, amountRight - colDetailX - 6);
      doc.text(detailLines, colDetailX, y);
      rowLines = Math.max(rowLines, detailLines.length);
    }
    if (item.amount) {
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...dark);
      doc.text(item.amount, amountRight, y, { align: 'right' });
    }
    // Long course/student names wrap onto more lines — the row grows.
    if (rowLines > 1) y += (rowLines - 1) * 4.2;
  }

  y += 3;
  drawHr(doc, MARGIN, y, COL_W, 0.7, [15, 23, 42]);
  y += 6.5;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(...dark);
  doc.text('JAMI TO`LANDI', MARGIN, y);
  doc.setTextColor(22, 163, 74);
  doc.text(toPdfPlain(d.amountTotal), A4_W - MARGIN, y, { align: 'right' });

  // ---- Verification QR + link ----
  // Flow-positioned (never fixed): long item tables push this block down,
  // and a new page is added when it would overflow — nothing is clipped.
  const qrSize = 26;
  const qrBlockH = (qrDataUrl ? qrSize + 6 : 12) + 10;
  const footerH = 8 + d.credentialLines.length * 4 + 8;
  if (y + qrBlockH + footerH > A4_H - MARGIN) {
    doc.addPage();
    y = MARGIN;
  }
  const qrTop = y + 8;
  drawHr(doc, MARGIN, qrTop - 6, COL_W);
  if (qrDataUrl) {
    try {
      doc.addImage(qrDataUrl, 'PNG', A4_W - MARGIN - qrSize, qrTop, qrSize, qrSize);
    } catch {
      // Fall back to the text link below.
    }
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.5);
    doc.setTextColor(148, 163, 184);
    const qrLabel = 'KVITANSIYANI TEKSHIRISH';
    doc.text(qrLabel, A4_W - MARGIN - qrSize / 2, qrTop - 1, { align: 'center' });
  }
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(100, 116, 139);
  if (d.verificationUrl) {
    const linkLines = doc.splitTextToSize(
      toPdfPlain(d.verificationUrl),
      COL_W - (qrDataUrl ? qrSize + 6 : 0)
    );
    doc.text(linkLines.slice(0, 3), MARGIN, qrTop + 3);
  }
  y = qrTop + Math.max(qrDataUrl ? qrSize : 0, 8) + 6;

  // ---- Footer (flows after content, same page when it fits) ----
  if (y + footerH > A4_H - MARGIN) {
    doc.addPage();
    y = MARGIN;
  }
  drawHr(doc, MARGIN, y, COL_W);
  y += 6;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(...dark);
  if (d.credentialLines.length > 0) {
    const nameLines = doc.splitTextToSize(toPdfPlain(d.credentialLines[0]), COL_W);
    doc.text(nameLines.slice(0, 2), MARGIN, y);
    y += nameLines.slice(0, 2).length * 4;
  }
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  for (const line of d.credentialLines.slice(1)) {
    const wrapped = doc.splitTextToSize(toPdfPlain(line), COL_W);
    doc.text(wrapped.slice(0, 2), MARGIN, y);
    y += wrapped.slice(0, 2).length * 3.8;
  }
  y += 2;
  doc.setFontSize(7.5);
  const idLine = 'Kvitansiya ID: ' + toPdfPlain(d.receiptNum);
  doc.text(doc.splitTextToSize(idLine, COL_W).slice(0, 2), MARGIN, y);

  return doc;
}

/** Standalone A4 HTML document for the dedicated print window. */
export function buildReceiptPrintHtml(
  payment: IncomePaymentRecord,
  center: ReceiptCenter,
  qrDataUrl?: string | null
): string {
  const d = buildReceiptLayoutData(payment, center);

  const items = [
    { num: '', name: 'To&rsquo;lovchi', detail: htmlEscape(d.student), amount: '—' },
    { num: '1', name: 'Kurs', detail: htmlEscape(d.course), amount: `${d.amountPlain} UZS` },
    { num: '2', name: 'To&rsquo;lov davri', detail: htmlEscape(d.period), amount: '—' },
    { num: '3', name: 'To&rsquo;lov usuli', detail: htmlEscape(d.method), amount: '—' },
  ];
  if (d.hasTrx) {
    items.push({ num: '4', name: 'Tranzaksiya ID', detail: htmlEscape(d.trxId), amount: '—' });
  }
  const itemRowsHtml = items
    .map(
      (item) =>
        `<tr>
          <td class="c num ${item.num ? '' : 'dim'}">${item.num || '&nbsp;'}</td>
          <td class="c name">${item.name}</td>
          <td class="c detail">${item.detail}</td>
          <td class="c amt ${item.amount === '—' ? 'dim' : ''}">${item.amount}</td>
        </tr>`
    )
    .join('');

  const headerCreds = d.credentialLines.slice(1).map((l) => `<div class="cred">${htmlEscape(l)}</div>`).join('');
  const footerCreds =
    d.credentialLines.length > 0
      ? d.credentialLines
          .map(
            (l, i) => `<div class="${i === 0 ? 'n' : ''}">${htmlEscape(l)}</div>`
          )
          .join('')
      : `<div class="n">${htmlEscape(center.name) || "Renessans O'quv Markazi"}</div>`;

  const qrBlock = qrDataUrl
    ? `<div class="qr-wrap"><img src="${qrDataUrl}" alt="QR" width="74" height="74" /><div class="qr-cap">QR orqali tekshirish</div></div>`
    : '';

  return `<!DOCTYPE html>
<html lang="uz">
<head>
<meta charset="utf-8" />
<title>To'lov kvitansiyasi — ${htmlEscape(d.receiptNum)}</title>
<style>
  @page { size: A4; margin: 16mm; }
  * { box-sizing: border-box; }
  body { margin: 0; font-family: 'Segoe UI', 'Helvetica Neue', Arial, sans-serif; color: #0f172a; print-color-adjust: exact; -webkit-print-color-adjust: exact; }
  .pill, .total-line .amt, .verify, .qr-wrap { print-color-adjust: exact; -webkit-print-color-adjust: exact; }
  .doc { max-width: 178mm; margin: 0 auto; }
  .muted { color: #7a828e; }
  .hdr { border-bottom: 1px solid #e5e7eb; padding-bottom: 12px; margin-bottom: 18px; display: flex; justify-content: space-between; align-items: flex-start; gap: 20px; }
  .hdr .left { min-width: 0; }
  .hdr h1 { margin: 0; font-size: 17px; letter-spacing: .3px; }
  .hdr .doc-name { margin: 5px 0 0; font-size: 8px; font-weight: 700; letter-spacing: 2px; color: #94a3b8; }
  .hdr .cred { font-size: 9px; color: #64748b; margin-top: 3px; }
  .hdr .ref { text-align: right; flex-shrink: 0; max-width: 45%; }
  .hdr .ref .id { font-weight: 800; font-size: 13px; color: #0f172a; margin-top: 2px; word-break: break-all; }
  .hdr .ref .d { color: #64748b; font-size: 10px; margin-top: 2px; white-space: nowrap; }
  .sec-head { display: flex; justify-content: space-between; align-items: center; margin: 16px 0 8px; }
  .sec-title { font-size: 8px; font-weight: 800; letter-spacing: 1.5px; color: #94a3b8; }
  .pill { font-size: 9px; font-weight: 800; padding: 3px 10px; border-radius: 999px; letter-spacing: .4px; border: 1px solid; }
  .pill.paid { background: #DEF7EC; color: #03543F; border-color: #b9e5d3; }
  .pill.voided { background: #FDE8E8; color: #9B1C1C; border-color: #f3c2c2; }
  table.items { width: 100%; border-collapse: collapse; }
  table.items th { font-size: 7px; font-weight: 800; letter-spacing: 1px; color: #94a3b8; text-align: left; padding: 6px 4px; border-bottom: 1px solid #e2e8f0; }
  table.items th.amt { text-align: right; }
  table.items td { padding: 6px 4px; font-size: 10px; border-bottom: 1px solid #f1f5f9; vertical-align: top; }
  table.items td.num { width: 6%; color: #94a3b8; font-size: 9px; }
  table.items td.name { width: 22%; font-weight: 800; color: #0f172a; }
  table.items td.detail { width: auto; color: #475569; word-break: break-word; }
  table.items td.amt { text-align: right; font-weight: 800; color: #0f172a; }
  table.items td.dim { color: #cbd5e1; font-weight: 400; }
  .total-line { display: flex; justify-content: flex-end; align-items: baseline; gap: 16px; margin-top: 12px; border-top: 2px solid #0f172a; padding-top: 8px; }
  .total-line .lbl { font-size: 12px; font-weight: 800; }
  .total-line .amt { font-size: 13px; font-weight: 800; color: #16a34a; }
  .verify { margin-top: 22px; border-top: 1px solid #e5e7eb; padding-top: 10px; display: flex; justify-content: space-between; align-items: center; gap: 16px; }
  .verify .link { font-size: 9px; color: #64748b; word-break: break-all; }
  .verify .cap { font-size: 7px; font-weight: 800; color: #94a3b8; letter-spacing: 1px; }
  .qr-wrap { text-align: center; flex-shrink: 0; }
  .qr-cap { font-size: 7px; font-weight: 700; color: #94a3b8; margin-top: 3px; }
  .ftr { margin-top: 30mm; border-top: 1px solid #e5e7eb; padding-top: 10px; font-size: 9px; color: #6b7280; }
  .ftr .n { font-weight: 700; font-size: 10px; color: #0f172a; }
  .id-line { margin-top: 10px; font-size: 9px; color: #94a3b8; }
</style>
</head>
<body>
  <div class="doc">
    <div class="hdr">
      <div class="left">
        <h1>${htmlEscape(d.center.name)}</h1>
        <div class="doc-name">ELEKTRON TO&rsquo;LOV KVITANSIYASI</div>
        ${headerCreds}
      </div>
      <div class="ref">
        <div class="muted" style="font-size:9px;">Kvitansiya ID</div>
        <div class="id">${htmlEscape(d.receiptNum)}</div>
        <div class="d">${htmlEscape(d.datetime)}</div>
      </div>
    </div>

    <div class="sec-head">
      <div class="sec-title">HISOB-KITOB</div>
      <div class="pill ${d.status.variant === 'paid' ? 'paid' : 'voided'}">${htmlEscape(d.status.label)}</div>
    </div>
    <table class="items">
      <thead>
        <tr><th>№</th><th>Ko&rsquo;rsatkich</th><th>Ma&rsquo;lumot</th><th class="amt">Summa</th></tr>
      </thead>
      <tbody>
        ${itemRowsHtml}
      </tbody>
    </table>
    <div class="total-line">
      <span class="lbl">JAMI TO&rsquo;LANDI</span>
      <span class="amt">${htmlEscape(d.amountTotal)}</span>
    </div>

    ${d.verificationUrl ? `
    <div class="verify">
      <div>
        <div class="cap">KVITANSIYANI TEKSHIRISH</div>
        <div class="link">${htmlEscape(d.verificationUrl)}</div>
      </div>
      ${qrBlock}
    </div>` : ''}

    <div class="ftr">
      ${footerCreds}
      <div class="id-line">Kvitansiya ID: ${htmlEscape(d.receiptNum)}</div>
    </div>
  </div>
</body>
</html>`;
}