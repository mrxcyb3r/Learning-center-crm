import React, { useEffect, useRef, useState } from 'react';
import {
  Plus,
  Send,
  Mail,
  Link2,
  Check,
  QrCode,
  Download,
  X,
  Ban,
  Clock,
  UserPlus,
} from 'lucide-react';
import { QRCodeCanvas } from 'qrcode.react';
import { invitationsService } from '../../services/repository';
import { TeacherInvitation } from '../../types/crm';
import { useAuth } from '../../context/AuthContext';

function buildInvitationUrl(id: string, secret: string): string {
  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  return `${origin}/teacher/register?invitation=${encodeURIComponent(id)}&s=${encodeURIComponent(secret)}`;
}

function displayStatus(inv: TeacherInvitation): { label: string; classes: string } {
  if (inv.status === 'used') {
    return { label: "Ishlatilgan", classes: 'bg-slate-500/10 text-slate-500 border-slate-500/20' };
  }
  if (inv.status === 'revoked') {
    return { label: 'Bekor qilingan', classes: 'bg-rose-500/10 text-rose-500 border-rose-500/20' };
  }
  if (inv.status === 'expired' || new Date(inv.expiresAt).getTime() < Date.now()) {
    return { label: "Muddati o'tgan", classes: 'bg-orange-500/10 text-orange-500 border-orange-500/20' };
  }
  return { label: 'Kutilmoqda', classes: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20' };
}

const INVITE_MESSAGE_UZ = (url: string) =>
  `Renessans O'quv Markaziga o'qituvchi sifatida qo'shilish uchun shaxsiy ro'yxatdan o'tish havolangiz:\n\n${url}\n\nHavola bir marta ishlatiladi va amal qilish muddati cheklangan.`;

export const TeacherInvitations: React.FC = () => {
  const { currentUser } = useAuth();
  const [invitations, setInvitations] = useState<TeacherInvitation[]>([]);
  const [formName, setFormName] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formDays, setFormDays] = useState('7');
  const [creating, setCreating] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  // Freshly created invitation share state (secret lives only here, never persisted to UI state beyond this panel).
  const [fresh, setFresh] = useState<{ id: string; secret: string; name: string } | null>(null);
  const [copied, setCopied] = useState(false);
  const [showQr, setShowQr] = useState(false);
  const qrWrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const unsub = invitationsService.subscribeToInvitations((items) => setInvitations(items));
    return () => unsub();
  }, []);

  const flash = (msg: string) => {
    setNotice(msg);
    setTimeout(() => setNotice(null), 4000);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formEmail.trim()) return;
    setCreating(true);
    try {
      const days = Math.min(Math.max(Number(formDays) || 7, 1), 30);
      const expiresAtIso = new Date(Date.now() + days * 86400000).toISOString();
      const { id, secret } = await invitationsService.createInvitation({
        teacherName: formName.trim(),
        teacherEmail: formEmail.trim(),
        createdBy: currentUser?.uid || 'admin',
        expiresAtIso,
      });
      setFresh({ id, secret, name: formName.trim() });
      setShowQr(false);
      setCopied(false);
      setFormName('');
      setFormEmail('');
      flash("Taklifnoma yaratildi. Havolani ustozga yuboring.");
    } catch (err: any) {
      flash(err?.message || "Taklifnoma yaratishda xatolik.");
    } finally {
      setCreating(false);
    }
  };

  const handleRevoke = async (id: string) => {
    if (!window.confirm("Taklifnomani bekor qilmoqchimisiz? Havola darhol yaroqsiz bo'ladi.")) return;
    try {
      await invitationsService.revokeInvitation(id);
      if (fresh?.id === id) setFresh(null);
      flash('Taklifnoma bekor qilindi.');
    } catch (err: any) {
      flash(err?.message || 'Bekor qilishda xatolik.');
    }
  };

  const freshUrl = fresh ? buildInvitationUrl(fresh.id, fresh.secret) : '';

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(freshUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      flash('Nusxalashda xatolik.');
    }
  };

  const telegramUrl = `https://t.me/share/url?url=${encodeURIComponent(freshUrl)}&text=${encodeURIComponent(INVITE_MESSAGE_UZ(freshUrl))}`;
  const emailUrl = fresh
    ? `mailto:${''}?subject=${encodeURIComponent("Renessans LC — o'qituvchi taklifnomasi")}&body=${encodeURIComponent(INVITE_MESSAGE_UZ(freshUrl))}`
    : '';

  const downloadQr = () => {
    const canvas = qrWrapRef.current?.querySelector('canvas');
    if (!canvas) return;
    const link = document.createElement('a');
    link.download = 'taklifnoma-qr.png';
    link.href = (canvas as HTMLCanvasElement).toDataURL('image/png');
    link.click();
  };

  const fmtDate = (iso: string) => {
    try {
      return new Date(iso).toLocaleDateString('uz-UZ', { day: 'numeric', month: 'short', year: 'numeric' });
    } catch {
      return iso;
    }
  };

  return (
    <div className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-5">
      <div className="flex items-center gap-2">
        <UserPlus className="w-5 h-5 text-amber-500" />
        <h2 className="text-base font-black text-slate-900 dark:text-white">O'qituvchi taklifnomalari</h2>
      </div>
      <p className="text-xs text-slate-500 dark:text-slate-400">
        Bir martalik ro'yxatdan o'tish havolasi yarating. Havola birinchi muvaffaqiyatli ro'yxatdan o'tishda
        avtomatik yaroqsiz bo'ladi; parol hech qayerda saqlanmaydi.
      </p>

      {notice && (
        <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-300 text-xs font-bold">
          {notice}
        </div>
      )}

      {/* Create form */}
      <form onSubmit={handleCreate} className="grid grid-cols-1 sm:grid-cols-[1fr_1fr_120px_auto] gap-3">
        <input
          value={formName}
          onChange={(e) => setFormName(e.target.value)}
          placeholder="F.I.Sh. (masalan: Jasur Alimov)"
          className="px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
        />
        <input
          value={formEmail}
          onChange={(e) => setFormEmail(e.target.value)}
          placeholder="Email (masalan: ustoz@example.com)"
          type="email"
          className="px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
        />
        <div className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
          <Clock className="w-4 h-4 text-slate-400 shrink-0" />
          <input
            value={formDays}
            onChange={(e) => setFormDays(e.target.value)}
            type="number"
            min={1}
            max={30}
            title="Amal qilish muddati (kun)"
            className="w-full bg-transparent text-sm text-slate-900 dark:text-white focus:outline-none"
          />
          <span className="text-[11px] text-slate-400">kun</span>
        </div>
        <button
          type="submit"
          disabled={creating}
          className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition cursor-pointer disabled:opacity-50"
        >
          <Plus className="w-4 h-4" />
          <span>{creating ? 'Yaratilmoqda...' : 'Taklifnoma yaratish'}</span>
        </button>
      </form>

      {/* Fresh invitation share panel */}
      {fresh && (
        <div className="p-4 rounded-2xl bg-emerald-500/5 border border-emerald-500/20 space-y-3">
          <div className="text-xs font-black text-emerald-600 dark:text-emerald-400">
            Taklifnoma tayyor — {fresh.name}
          </div>
          <div className="px-3 py-2 rounded-xl bg-slate-950 text-[11px] font-mono text-emerald-300 break-all">
            {freshUrl}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <a
              href={telegramUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-2 rounded-xl bg-sky-500/10 hover:bg-sky-500/20 text-sky-600 dark:text-sky-400 border border-sky-500/20 text-[11px] font-bold flex items-center gap-1.5 transition"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Telegram orqali yuborish</span>
            </a>
            <a
              href={emailUrl}
              className="px-3 py-2 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/20 text-[11px] font-bold flex items-center gap-1.5 transition"
            >
              <Mail className="w-3.5 h-3.5" />
              <span>Email</span>
            </a>
            <button
              type="button"
              onClick={handleCopy}
              className="px-3 py-2 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 text-[11px] font-bold flex items-center gap-1.5 transition cursor-pointer"
            >
              {copied ? <Check className="w-3.5 h-3.5" /> : <Link2 className="w-3.5 h-3.5" />}
              <span>{copied ? 'Nusxalandi!' : 'Havolani nusxalash'}</span>
            </button>
            <button
              type="button"
              onClick={() => setShowQr((v) => !v)}
              className="px-3 py-2 rounded-xl bg-violet-500/10 hover:bg-violet-500/20 text-violet-600 dark:text-violet-400 border border-violet-500/20 text-[11px] font-bold flex items-center gap-1.5 transition cursor-pointer"
            >
              <QrCode className="w-3.5 h-3.5" />
              <span>QR kodni ko'rsatish</span>
            </button>
            <button
              type="button"
              onClick={() => setFresh(null)}
              className="px-3 py-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-white text-[11px] font-bold flex items-center gap-1.5 transition cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
              <span>Yopish</span>
            </button>
          </div>
          {showQr && (
            <div className="flex flex-col items-center gap-3 pt-1">
              <div ref={qrWrapRef} className="p-4 bg-white rounded-2xl border border-slate-200">
                <QRCodeCanvas value={freshUrl} size={180} level="M" marginSize={1} />
              </div>
              <button
                type="button"
                onClick={downloadQr}
                className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-[11px] flex items-center gap-1.5 transition cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>QR kodni yuklab olish</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* Invitation table */}
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="text-left text-slate-400 uppercase tracking-wider text-[10px]">
              <th className="py-2 pr-3">O'qituvchi</th>
              <th className="py-2 pr-3">Email</th>
              <th className="py-2 pr-3">Holat</th>
              <th className="py-2 pr-3">Yaratilgan</th>
              <th className="py-2 pr-3">Amal qilish muddati</th>
              <th className="py-2 text-right">Harakatlar</th>
            </tr>
          </thead>
          <tbody>
            {invitations.length === 0 && (
              <tr>
                <td colSpan={6} className="py-6 text-center text-slate-400">
                  Hozircha taklifnomalar yo'q.
                </td>
              </tr>
            )}
            {invitations.map((inv) => {
              const st = displayStatus(inv);
              return (
                <tr key={inv.id} className="border-t border-slate-100 dark:border-slate-800">
                  <td className="py-2.5 pr-3 font-bold text-slate-900 dark:text-white">{inv.teacherName}</td>
                  <td className="py-2.5 pr-3 text-slate-500">{inv.teacherEmail}</td>
                  <td className="py-2.5 pr-3">
                    <span className={`px-2 py-0.5 rounded-full border font-bold text-[10px] ${st.classes}`}>
                      {st.label}
                    </span>
                  </td>
                  <td className="py-2.5 pr-3 text-slate-500">{fmtDate(inv.createdAt)}</td>
                  <td className="py-2.5 pr-3 text-slate-500">{fmtDate(inv.expiresAt)}</td>
                  <td className="py-2.5 text-right">
                    {inv.status === 'pending' && (
                      <button
                        type="button"
                        onClick={() => void handleRevoke(inv.id)}
                        className="px-2.5 py-1.5 rounded-lg text-rose-500 hover:bg-rose-500/10 text-[11px] font-bold inline-flex items-center gap-1 transition cursor-pointer"
                      >
                        <Ban className="w-3.5 h-3.5" />
                        <span>Bekor qilish</span>
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
