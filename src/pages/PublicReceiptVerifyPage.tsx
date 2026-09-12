import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ShieldCheck, Loader2, FileQuestion, CheckCircle2 } from 'lucide-react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../services/firebase';
import {
  formatReceiptDate,
  formatUzsAmount,
  methodLabel,
  receiptStatusSettings,
} from '../utils/receipt';

interface PublicReceiptSummary {
  paymentId?: string;
  receiptNumber?: string;
  amount?: number;
  course?: string;
  date?: string;
  method?: string;
  status?: string;
  studentName?: string;
}

export const PublicReceiptVerifyPage: React.FC = () => {
  const { receiptId = '' } = useParams<{ receiptId: string }>();
  const [state, setState] = useState<'loading' | 'found' | 'missing' | 'error'>('loading');
  const [rec, setRec] = useState<PublicReceiptSummary | null>(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      if (!receiptId) {
        setState('missing');
        return;
      }
      try {
        const snap = await getDoc(doc(db, 'public_receipts', receiptId));
        if (!alive) return;
        if (!snap.exists()) {
          setState('missing');
          return;
        }
        setRec(snap.data() as PublicReceiptSummary);
        setState('found');
      } catch {
        if (alive) setState('error');
      }
    })();
    return () => {
      alive = false;
    };
  }, [receiptId]);

  const status = receiptStatusSettings(rec?.status);

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-2 text-slate-300 font-black text-sm tracking-widest uppercase">
            <ShieldCheck className="w-5 h-5 text-amber-500" />
            CenterFlow
          </div>
          <div className="mt-1 text-[10px] text-slate-500 font-bold tracking-[0.3em] uppercase">
            Kvitansiya tasdiqlash
          </div>
        </div>

        <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">
          {state === 'loading' && (
            <div className="p-10 flex flex-col items-center gap-3 text-slate-500">
              <Loader2 className="w-6 h-6 animate-spin text-amber-500" />
              <span className="text-xs font-bold">Tekshirilmoqda...</span>
            </div>
          )}

          {state === 'found' && rec && (
            <div className="p-6">
              <div className="flex items-center justify-between gap-3 pb-4 border-b border-slate-100">
                <div className="text-xs font-black text-slate-900">Kvitansiya {rec.receiptNumber}</div>
                <span className={`px-2.5 py-1 rounded-full text-[10px] font-black ${status.badge}`}>
                  {status.label}
                </span>
              </div>
              <div className="mt-4 space-y-3 text-xs">
                <div className="flex justify-between gap-4">
                  <span className="text-slate-400 font-semibold">To'lovchi</span>
                  <span className="text-slate-900 font-bold text-right">{rec.studentName || '—'}</span>
                </div>
                <div className="flex justify-between gap-4">
                  <span className="text-slate-400 font-semibold">Kurs</span>
                  <span className="text-slate-900 font-bold text-right">{rec.course || '—'}</span>
                </div>
                <div className="flex justify-between gap-4">
                  <span className="text-slate-400 font-semibold">Sana</span>
                  <span className="text-slate-900 font-bold">{rec.date ? formatReceiptDate(rec.date) : '—'}</span>
                </div>
                <div className="flex justify-between gap-4">
                  <span className="text-slate-400 font-semibold">Usul</span>
                  <span className="text-slate-900 font-bold text-right">{rec.method ? methodLabel(rec.method) : '—'}</span>
                </div>
              </div>
              <div className="mt-5 p-4 rounded-2xl bg-emerald-50 text-center">
                <div className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Summa</div>
                <div className="text-2xl font-black text-emerald-600 mt-1">{formatUzsAmount(rec.amount)}</div>
              </div>
              <div className="mt-4 flex items-center justify-center gap-1.5 text-[10px] font-bold text-emerald-600">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Ushbu to'lov haqiqiy va tasdiqlangan
              </div>
            </div>
          )}

          {state === 'missing' && (
            <div className="p-10 text-center">
              <FileQuestion className="w-10 h-10 text-slate-300 mx-auto" />
              <div className="mt-3 text-sm font-black text-slate-900">Kvitansiya topilmadi</div>
              <div className="mt-1 text-xs text-slate-500">
                Bu havola noto'g'ri bo'lishi, yoki kvitansiya tasdiqlanmagan bo'lishi mumkin.
              </div>
            </div>
          )}

          {state === 'error' && (
            <div className="p-10 text-center text-xs font-bold text-rose-500">
              Tekshirish vaqtincha mavjud emas. Keyinroq urinib ko'ring.
            </div>
          )}
        </div>

        <div className="mt-6 text-center">
          <Link to="/" className="text-[11px] font-bold text-slate-500 hover:text-amber-500 transition">
            ← Asosiy sahifaga qaytish
          </Link>
        </div>
      </div>
    </div>
  );
};