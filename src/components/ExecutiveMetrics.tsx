import React from 'react';
import { DollarSign, Package, TrendingDown, TrendingUp, Layers, Compass } from 'lucide-react';
import { RegionSummary, VarianceAnalysis } from '../types';
import { formatCurrency, formatCompactCurrency, formatPercent } from '../utils/salesAnalytics';

interface ExecutiveMetricsProps {
  totalRevenue: number;
  totalUnits: number;
  ordersCount: number;
  varianceAnalysis: VarianceAnalysis | null;
  regions: RegionSummary[];
}

export const ExecutiveMetrics: React.FC<ExecutiveMetricsProps> = ({
  totalRevenue,
  totalUnits,
  ordersCount,
  varianceAnalysis,
  regions,
}) => {
  const avgOrderValue = ordersCount > 0 ? totalRevenue / ordersCount : 0;

  const totalQ2 = regions.reduce((s, r) => s + r.q2Revenue, 0);
  const totalQ3 = regions.reduce((s, r) => s + r.q3Revenue, 0);
  const totalQ2toQ3Diff = totalQ3 - totalQ2;
  const totalQ2toQ3Pct = totalQ2 > 0 ? (totalQ2toQ3Diff / totalQ2) * 100 : 0;
  const isCompanyDrop = totalQ2toQ3Diff < 0;

  const topRegion = regions.slice().sort((a, b) => b.totalRevenue - a.totalRevenue)[0];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3.5 sm:gap-4">
      {/* Total Revenue */}
      <div className="group relative overflow-hidden bg-[#161426]/90 backdrop-blur-md rounded-2xl border border-white/[0.08] p-4 sm:p-5 shadow-[0_8px_24px_rgba(0,0,0,0.3)] hover:border-white/[0.16] hover:shadow-[0_8px_32px_rgba(139,92,246,0.1)] transition-all">
        <div className="flex items-center justify-between text-zinc-400 mb-2.5">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400">Total Sales</span>
          <span className="p-1.5 bg-violet-500/10 text-violet-400 border border-violet-500/20 rounded-xl">
            <DollarSign className="w-4 h-4" />
          </span>
        </div>
        <div className="text-xl sm:text-2xl lg:text-3xl font-bold font-mono text-white tracking-tight">
          {formatCurrency(totalRevenue)}
        </div>
        <div className="mt-1.5 flex items-center gap-1.5 text-xs text-zinc-400">
          <span>{ordersCount.toLocaleString()} orders</span>
          <span className="text-zinc-600">·</span>
          <span>Avg {formatCurrency(avgOrderValue)}</span>
        </div>
      </div>

      {/* Units Volume */}
      <div className="group relative overflow-hidden bg-[#161426]/90 backdrop-blur-md rounded-2xl border border-white/[0.08] p-4 sm:p-5 shadow-[0_8px_24px_rgba(0,0,0,0.3)] hover:border-white/[0.16] hover:shadow-[0_8px_32px_rgba(139,92,246,0.1)] transition-all">
        <div className="flex items-center justify-between text-zinc-400 mb-2.5">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400">Total Units</span>
          <span className="p-1.5 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded-xl">
            <Package className="w-4 h-4" />
          </span>
        </div>
        <div className="text-xl sm:text-2xl lg:text-3xl font-bold font-mono text-white tracking-tight">
          {totalUnits.toLocaleString()}
        </div>
        <div className="mt-1.5 flex items-center gap-1.5 text-xs text-zinc-400">
          <span>Across all channels</span>
        </div>
      </div>

      {/* Top Territory */}
      <div className="group relative overflow-hidden bg-[#161426]/90 backdrop-blur-md rounded-2xl border border-white/[0.08] p-4 sm:p-5 shadow-[0_8px_24px_rgba(0,0,0,0.3)] hover:border-white/[0.16] hover:shadow-[0_8px_32px_rgba(139,92,246,0.1)] transition-all">
        <div className="flex items-center justify-between text-zinc-400 mb-2.5">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400">Top Territory</span>
          <span className="p-1.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-xl">
            <Compass className="w-4 h-4" />
          </span>
        </div>
        <div className="text-xl sm:text-2xl lg:text-3xl font-bold text-white tracking-tight truncate">
          {topRegion ? topRegion.region : 'N/A'}
        </div>
        <div className="mt-1.5 text-xs text-zinc-400 font-mono">
          {topRegion ? `${formatCurrency(topRegion.totalRevenue)} (${((topRegion.totalRevenue / (totalRevenue || 1)) * 100).toFixed(1)}%)` : ''}
        </div>
      </div>

      {/* Company Q2 -> Q3 Net Delta */}
      <div className="group relative overflow-hidden bg-[#161426]/90 backdrop-blur-md rounded-2xl border border-white/[0.08] p-4 sm:p-5 shadow-[0_8px_24px_rgba(0,0,0,0.3)] hover:border-white/[0.16] hover:shadow-[0_8px_32px_rgba(139,92,246,0.1)] transition-all">
        <div className="flex items-center justify-between text-zinc-400 mb-2.5">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400">Q2 → Q3 Company Δ</span>
          <span className={`p-1.5 rounded-xl border ${isCompanyDrop ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'}`}>
            {isCompanyDrop ? <TrendingDown className="w-4 h-4" /> : <TrendingUp className="w-4 h-4" />}
          </span>
        </div>
        <div className={`text-xl sm:text-2xl lg:text-3xl font-bold font-mono tracking-tight ${isCompanyDrop ? 'text-rose-400' : 'text-emerald-400'}`}>
          {totalQ2toQ3Diff > 0 ? `+${formatCompactCurrency(totalQ2toQ3Diff)}` : formatCompactCurrency(totalQ2toQ3Diff)}
        </div>
        <div className="mt-1.5 text-xs font-medium text-zinc-400">
          {formatPercent(totalQ2toQ3Pct)} net change
        </div>
      </div>

      {/* Largest Regional Variance */}
      <div className="col-span-2 md:col-span-4 lg:col-span-1 relative overflow-hidden bg-gradient-to-br from-[#231526]/90 via-[#1e1327]/90 to-[#191124]/90 backdrop-blur-md rounded-2xl border border-rose-500/30 p-4 sm:p-5 shadow-[0_8px_24px_rgba(244,63,94,0.15)] hover:border-rose-500/50 transition-all">
        <div className="flex items-center justify-between text-rose-300 mb-2.5">
          <span className="text-[11px] font-bold uppercase tracking-wider">Max Variance</span>
          <span className="px-2 py-0.5 text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30 rounded-full">
            {varianceAnalysis?.mostChangedRegion || 'N/A'}
          </span>
        </div>
        <div className="text-xl sm:text-2xl lg:text-3xl font-bold font-mono text-rose-300 tracking-tight">
          {varianceAnalysis ? formatCurrency(varianceAnalysis.diff) : '$0.00'}
        </div>
        <div className="mt-1.5 text-xs text-rose-400 font-medium">
          {varianceAnalysis ? `${formatPercent(varianceAnalysis.pctChange)} variance` : ''}
        </div>
      </div>
    </div>
  );
};
