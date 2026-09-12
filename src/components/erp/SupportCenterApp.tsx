import React, { useEffect, useState } from 'react';
import { LifeBuoy, LogOut, ShieldCheck } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { SupportAdminList } from './SupportAdminList';
import { subscribeSupportRequests, SupportRequestDoc } from '../../services/supportService';

/** Dedicated internal support/technical workspace (role 'support'). */
export const SupportCenterApp: React.FC = () => {
  const { currentUser, userProfile, logout } = useAuth();
  const [fresh, setFresh] = useState(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const sub = subscribeSupportRequests(
      (items: SupportRequestDoc[]) => {
        setFresh(items.filter((i) => i.status === 'new').length);
        setError(null);
      },
      (msg) => setError(msg)
    );
    return sub.unsubscribe;
  }, []);

  const displayName =
    userProfile?.fullName || userProfile?.displayName || currentUser?.displayName || 'Yordam xizmati';

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      {/* Top bar */}
      <header className="sticky top-0 z-30 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center shrink-0">
              <LifeBuoy className="w-5 h-5 text-sky-600 dark:text-sky-400" />
            </div>
            <div className="min-w-0">
              <div className="text-sm font-black text-slate-900 dark:text-white leading-tight truncate">
                CenterFlow — Yordam xizmati
              </div>
              <div className="text-[10px] font-bold text-slate-400 leading-tight truncate">
                Texnik qo'llab-quvvatlash
              </div>
            </div>
            {fresh > 0 && (
              <span className="px-2.5 py-1 rounded-full bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-[11px] font-black shrink-0">
                {fresh} yangi
              </span>
            )}
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden sm:block text-right">
              <div className="text-xs font-black text-slate-900 dark:text-white leading-tight max-w-[180px] truncate">
                {displayName}
              </div>
              <div className="text-[10px] font-bold text-slate-400 leading-tight uppercase tracking-wider">
                Support
              </div>
            </div>
            <button
              onClick={() => logout()}
              className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              Chiqish
            </button>
          </div>
        </div>
      </header>

      {error && (
        <div className="max-w-5xl mx-auto px-4 sm:px-6 pt-4">
          <div className="flex items-start gap-2.5 p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-xs font-bold text-rose-600 dark:text-rose-400">
            <ShieldCheck className="w-4 h-4 shrink-0 mt-0.5" />
            {error}
          </div>
        </div>
      )}

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <SupportAdminList />
      </main>
    </div>
  );
};