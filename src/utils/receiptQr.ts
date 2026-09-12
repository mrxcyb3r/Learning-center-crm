/**
 * Receipt verification QR — qrcode.react is installed, but it only ships React
 * components. This module renders the canvas variant off-screen once and
 * extracts a PNG data URL so the print window and jsPDF can embed an identical
 * QR without adding a new dependency. Callers treat it as best-effort: on any
 * DOM/render failure they fall back to the plain text verification link.
 */

import React from 'react';
import { createRoot } from 'react-dom/client';
import { QRCodeCanvas } from 'qrcode.react';

export const QR_SIZE = 96;

/**
 * Render `text` as a PNG data URL (96×96, quiet-zone included). Returns null
 * when the DOM is unavailable or rendering fails — never throws.
 */
export async function qrPngDataUrl(
  text: string,
  size: number = QR_SIZE
): Promise<string | null> {
  if (!text) return null;
  if (typeof document === 'undefined' || typeof window === 'undefined') return null;

  let host: HTMLDivElement | null = null;
  let root: ReturnType<typeof createRoot> | null = null;
  try {
    host = document.createElement('div');
    host.style.position = 'fixed';
    host.style.left = '-99999px';
    host.style.top = '-99999px';
    host.style.pointerEvents = 'none';
    document.body.appendChild(host);

    let canvas: HTMLCanvasElement | null = null;
    root = createRoot(host);
    await new Promise<void>((resolve, reject) => {
      let settled = false;
      const done = (err?: unknown) => {
        if (settled) return;
        settled = true;
        if (err) reject(err);
        else resolve();
      };
      root!.render(
        React.createElement(QRCodeCanvas, {
          value: text,
          size,
          level: 'M',
          bgColor: '#ffffff',
          fgColor: '#0f172a',
          includeMargin: true,
          ref: (c) => {
            if (c && typeof c.toDataURL === 'function') canvas = c;
          },
        })
      );
      // QRCodeCanvas draws synchronously after mount; one frame is enough.
      window.requestAnimationFrame(() => {
        // Second frame guarantees the canvas draw commit.
        window.requestAnimationFrame(() => done(canvas ? undefined : new Error('QR canvas unavailable')));
      });
      window.setTimeout(() => done(new Error('QR render timeout')), 1500);
    });

    if (!canvas) return null;
    const padding = Math.round(size * 0.08);
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    // Wrap in a white quiet zone so the PNG is printable on any paper.
    const whiteCanvas = document.createElement('canvas');
    whiteCanvas.width = canvas.width + padding * 2;
    whiteCanvas.height = canvas.height + padding * 2;
    const wctx = whiteCanvas.getContext('2d');
    if (!wctx) return null;
    wctx.fillStyle = '#ffffff';
    wctx.fillRect(0, 0, whiteCanvas.width, whiteCanvas.height);
    wctx.drawImage(canvas, padding, padding);

    return whiteCanvas.toDataURL('image/png');
  } catch (err) {
    // Best-effort only — the print/PDF fall back to a text verification link.
    console.warn('[receiptQr] QR render failed, falling back to text link:', err);
    return null;
  } finally {
    try {
      if (root) root.unmount();
      if (host && host.parentNode) host.parentNode.removeChild(host);
    } catch {
      // Ignore cleanup failures.
    }
  }
}