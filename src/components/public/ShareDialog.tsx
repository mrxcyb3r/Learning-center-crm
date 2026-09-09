import React, { useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { QRCodeCanvas } from 'qrcode.react';
import { X, Share2, Send, Mail, Link2, Check, QrCode, Download, MonitorSmartphone } from 'lucide-react';

// ---------------------------------------------------------------------------
// Share system for the public site.
// - Telegram / Email / Copy-link / QR-code (with PNG download)
// - Native share via the Web Share API when the browser supports it
// - Reusable: <ShareButton title url /> → <ShareDialog …/>
// ---------------------------------------------------------------------------

interface BaseShareProps {
  open: boolean;
  onClose: () => void;
  title: string;
  url: string;
  description?: string;
}

function copyToClipboard(text: string): Promise<boolean> {
  if (navigator.clipboard?.writeText) {
    return navigator.clipboard.writeText(text).then(() => true).catch(() => false);
  }
  try {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    document.execCommand('copy');
    document.body.removeChild(ta);
    return Promise.resolve(true);
  } catch {
    return Promise.resolve(false);
  }
}

const ShareDialog: React.FC<BaseShareProps> = ({ open, onClose, title, url, description }) => {
  const [copied, setCopied] = useState(false);
  const [showQr, setShowQr] = useState(false);
  const qrWrapRef = useRef<HTMLDivElement>(null);
  const [canNativeShare] = useState(() => typeof navigator !== 'undefined' && !!navigator.share);

  if (!open) return null;

  const handleCopy = async () => {
    const ok = await copyToClipboard(url);
    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    }
  };

  const telegramUrl = `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`;
  const emailUrl = `mailto:?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(`${title}\n\n${url}`)}`;

  const handleNativeShare = async () => {
    try {
      await navigator.share({
        title,
        text: description || title,
        url,
      });
    } catch {
      // user cancelled — ignore
    }
  };

  const downloadQr = () => {
    const canvas = qrWrapRef.current?.querySelector('canvas');
    if (!canvas) return;
    const link = document.createElement('a');
    link.download = 'qr.png';
    link.href = (canvas as HTMLCanvasElement).toDataURL('image/png');
    link.click();
  };

  const buttons: { icon: React.ReactNode; label: string; onClick: () => void; accent: string }[] = [
    {
      icon: <Send className="w-5 h-5" />,
      label: 'Telegram',
      accent: 'bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/20 hover:bg-sky-500/20',
      onClick: () => window.open(telegramUrl, '_blank', 'noopener,noreferrer'),
    },
    {
      icon: <Mail className="w-5 h-5" />,
      label: 'Email',
      accent: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20 hover:bg-amber-500/20',
      onClick: () => window.location.href = emailUrl,
    },
    {
      icon: copied ? <Check className="w-5 h-5 text-emerald-500" /> : <Link2 className="w-5 h-5" />,
      label: copied ? 'Nusxalandi!' : 'Havolani nusxalash',
      accent: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20',
      onClick: handleCopy,
    },
    {
      icon: <QrCode className="w-5 h-5" />,
      label: 'QR-kod',
      accent: 'bg-violet-500/10 text-violet-600 dark:text-violet-400 border-violet-500/20 hover:bg-violet-500/20',
      onClick: () => setShowQr(true),
    },
  ];

  if (canNativeShare) {
    buttons.push({
      icon: <MonitorSmartphone className="w-5 h-5" />,
      label: 'Boshqa ilova',
      accent: 'bg-slate-500/10 text-slate-700 dark:text-slate-300 border-slate-500/20 hover:bg-slate-500/20',
      onClick: handleNativeShare,
    });
  }

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm cursor-pointer"
        />
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ duration: 0.2 }}
          className="relative w-full max-w-sm rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl p-6 z-10"
        >
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-white transition cursor-pointer"
            aria-label="Yopish"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center">
              <Share2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-black text-slate-900 dark:text-white tracking-tight">Ulashish</h3>
              <p className="text-[11px] text-slate-400 font-medium line-clamp-1">{title}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {buttons.map((b) => (
              <button
                key={b.label}
                onClick={b.onClick}
                className={`flex items-center gap-2.5 px-3 py-3 rounded-2xl border text-xs font-bold transition cursor-pointer ${b.accent}`}
              >
                {b.icon}
                <span className="leading-tight">{b.label}</span>
              </button>
            ))}
          </div>

          <div className="mt-4 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 flex items-center gap-2">
            <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400 truncate flex-1">{url}</span>
            <button
              onClick={handleCopy}
              className="shrink-0 px-2.5 py-1.5 rounded-lg bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 text-[10px] font-bold cursor-pointer transition hover:bg-slate-300 dark:hover:bg-slate-600"
            >
              {copied ? 'OK' : 'Nusxa'}
            </button>
          </div>
        </motion.div>

        {/* QR sub-modal */}
        {showQr && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="relative w-full max-w-xs rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl p-6 z-20"
          >
            <button
              onClick={() => setShowQr(false)}
              className="absolute top-4 right-4 p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-white transition cursor-pointer"
              aria-label="Orqaga"
            >
              <X className="w-4 h-4" />
            </button>
            <h4 className="text-base font-black text-slate-900 dark:text-white mb-4">QR-kod</h4>
            <div
              ref={qrWrapRef}
              className="w-full flex items-center justify-center p-6 bg-white rounded-2xl border border-slate-200"
            >
              <QRCodeCanvas value={url} size={196} level="M" marginSize={1} />
            </div>
            <p className="text-[11px] text-center text-slate-400 mt-3">
              Kurs havolasini telefon orqali skanerlang.
            </p>
            <button
              onClick={downloadQr}
              className="mt-4 w-full py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs flex items-center justify-center gap-2 cursor-pointer transition"
            >
              <Download className="w-4 h-4" />
              PNG ko'rinishida yuklab olish
            </button>
          </motion.div>
        )}
      </div>
    </AnimatePresence>
  );
};

// ---------------------------------------------------------------------------
// Public trigger button (reusable in course cards, detail page, teacher page).
// ---------------------------------------------------------------------------

interface ShareButtonProps {
  title: string;
  url: string;
  className?: string;
  label?: string;
}

export const ShareButton: React.FC<ShareButtonProps> = ({ title, url, className = '', label = 'Ulashish' }) => {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setOpen(true);
        }}
        className={`inline-flex items-center gap-1.5 rounded-xl border border-slate-200 dark:border-slate-700 px-3 py-2 text-[11px] font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-amber-500 transition cursor-pointer ${className}`}
        aria-label={`${title} — ulashish`}
      >
        <Share2 className="w-3.5 h-3.5" />
        {label && <span>{label}</span>}
      </button>
      <ShareDialog
        open={open}
        onClose={() => setOpen(false)}
        title={title}
        url={url}
        description={title}
      />
    </>
  );
};

export default ShareDialog;