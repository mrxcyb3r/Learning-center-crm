import React from 'react';
import { APP_ASSETS } from '../constants/assets';
import { DollarSign, TrendingUp, CreditCard, AlertCircle, ArrowUpRight, ShieldCheck, Download } from 'lucide-react';

interface FinanceOverviewCardProps {
  monthlyRevenue?: string;
  totalCollected?: string;
  pendingTuitions?: string;
  overdueCount?: number;
  onExportReport?: () => void;
}

export const FinanceOverviewCard: React.FC<FinanceOverviewCardProps> = ({
  monthlyRevenue = "$18,450",
  totalCollected = "$16,970",
  pendingTuitions = "$1,480",
  overdueCount = 3,
  onExportReport
}) => {
  return (
    <div className="relative rounded-3xl overflow-hidden border border-slate-800 bg-slate-900 shadow-2xl">
      {/* Feature Panel Hero Background Image with Gradient Overlay */}
      <div className="relative h-44 sm:h-52 w-full overflow-hidden">
        <img
          src={APP_ASSETS.financePanel}
          alt="Finance Ledger Banner"
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover object-center opacity-40 hover:scale-105 transition-transform duration-700"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/60 to-slate-950/40" />

        <div className="absolute top-4 left-4 right-4 flex items-center justify-between z-10">
          <span className="px-3 py-1 rounded-xl bg-slate-950/80 border border-slate-800 text-amber-400 font-extrabold text-xs flex items-center gap-1.5 backdrop-blur-md">
            <DollarSign className="w-3.5 h-3.5" />
            <span>CenterFlow Financial Ledger</span>
          </span>

          {onExportReport && (
            <button
              onClick={onExportReport}
              className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs transition-colors flex items-center gap-1 cursor-pointer shadow-md"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export PDF</span>
            </button>
          )}
        </div>

        <div className="absolute bottom-4 left-6 z-10">
          <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-2">
            <span>Revenue & Tuition Operations</span>
            <TrendingUp className="w-5 h-5 text-emerald-400" />
          </h2>
          <p className="text-xs text-slate-300 mt-1">Real-time payment collections, student contracts, and tuition balance tracking.</p>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="p-6 grid grid-cols-1 sm:grid-cols-3 gap-4 bg-slate-900/90 backdrop-blur-md">
        {/* Monthly Revenue */}
        <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 hover:border-amber-500/40 transition">
          <div className="flex items-center justify-between text-slate-400 text-xs font-bold mb-1">
            <span>Monthly Target</span>
            <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-amber-400">{monthlyRevenue}</div>
          <div className="text-[11px] text-emerald-400 font-semibold mt-1 flex items-center gap-1">
            <ArrowUpRight className="w-3 h-3" />
            <span>+12.4% vs last month</span>
          </div>
        </div>

        {/* Collected Tuitions */}
        <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 hover:border-emerald-500/40 transition">
          <div className="flex items-center justify-between text-slate-400 text-xs font-bold mb-1">
            <span>Collected Today</span>
            <CreditCard className="w-3.5 h-3.5 text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-emerald-400">{totalCollected}</div>
          <div className="text-[11px] text-slate-400 font-medium mt-1 flex items-center gap-1">
            <ShieldCheck className="w-3 h-3 text-emerald-400" />
            <span>92% Collection Rate</span>
          </div>
        </div>

        {/* Overdue / Pending Balances */}
        <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 hover:border-red-500/40 transition">
          <div className="flex items-center justify-between text-slate-400 text-xs font-bold mb-1">
            <span>Pending Balances</span>
            <AlertCircle className="w-3.5 h-3.5 text-red-400" />
          </div>
          <div className="text-2xl font-black text-red-400">{pendingTuitions}</div>
          <div className="text-[11px] text-red-400 font-semibold mt-1">
            {overdueCount} students overdue
          </div>
        </div>
      </div>
    </div>
  );
};
