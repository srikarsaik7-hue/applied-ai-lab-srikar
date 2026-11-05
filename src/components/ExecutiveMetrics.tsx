import React from 'react';
import { DollarSign, Package, TrendingDown, TrendingUp, Layers, Compass, BarChart } from 'lucide-react';
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
    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
      {/* Total Revenue */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-sm hover:shadow-md transition-all">
        <div className="flex items-center justify-between text-slate-500 mb-2">
          <span className="text-xs font-semibold uppercase tracking-wider">Total Sales</span>
          <span className="p-1.5 bg-blue-50 text-blue-600 rounded-lg">
            <DollarSign className="w-4 h-4" />
          </span>
        </div>
        <div className="text-xl sm:text-2xl font-bold font-mono text-slate-900 tracking-tight">
          {formatCurrency(totalRevenue)}
        </div>
        <div className="mt-1 flex items-center gap-1.5 text-xs text-slate-500">
          <span>{ordersCount.toLocaleString()} orders</span>
          <span>•</span>
          <span>Avg {formatCurrency(avgOrderValue)}</span>
        </div>
      </div>

      {/* Units Volume */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-sm hover:shadow-md transition-all">
        <div className="flex items-center justify-between text-slate-500 mb-2">
          <span className="text-xs font-semibold uppercase tracking-wider">Total Units</span>
          <span className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg">
            <Package className="w-4 h-4" />
          </span>
        </div>
        <div className="text-xl sm:text-2xl font-bold font-mono text-slate-900 tracking-tight">
          {totalUnits.toLocaleString()}
        </div>
        <div className="mt-1 flex items-center gap-1.5 text-xs text-slate-500">
          <span>Across all channels</span>
        </div>
      </div>

      {/* Top Territory */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-sm hover:shadow-md transition-all">
        <div className="flex items-center justify-between text-slate-500 mb-2">
          <span className="text-xs font-semibold uppercase tracking-wider">Top Territory</span>
          <span className="p-1.5 bg-emerald-50 text-emerald-600 rounded-lg">
            <Compass className="w-4 h-4" />
          </span>
        </div>
        <div className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight truncate">
          {topRegion ? topRegion.region : 'N/A'}
        </div>
        <div className="mt-1 text-xs text-slate-500 font-mono">
          {topRegion ? `${formatCurrency(topRegion.totalRevenue)} (${((topRegion.totalRevenue / (totalRevenue || 1)) * 100).toFixed(1)}%)` : ''}
        </div>
      </div>

      {/* Company Q2 -> Q3 Net Delta */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-sm hover:shadow-md transition-all">
        <div className="flex items-center justify-between text-slate-500 mb-2">
          <span className="text-xs font-semibold uppercase tracking-wider">Q2 → Q3 Company Δ</span>
          <span className={`p-1.5 rounded-lg ${isCompanyDrop ? 'bg-rose-50 text-rose-600' : 'bg-emerald-50 text-emerald-600'}`}>
            {isCompanyDrop ? <TrendingDown className="w-4 h-4" /> : <TrendingUp className="w-4 h-4" />}
          </span>
        </div>
        <div className={`text-xl sm:text-2xl font-bold font-mono tracking-tight ${isCompanyDrop ? 'text-rose-600' : 'text-emerald-600'}`}>
          {totalQ2toQ3Diff > 0 ? `+${formatCompactCurrency(totalQ2toQ3Diff)}` : formatCompactCurrency(totalQ2toQ3Diff)}
        </div>
        <div className="mt-1 text-xs font-medium text-slate-500">
          {formatPercent(totalQ2toQ3Pct)} net change
        </div>
      </div>

      {/* Largest Regional Variance */}
      <div className="col-span-2 md:col-span-4 lg:col-span-1 bg-gradient-to-br from-rose-50 to-orange-50/50 rounded-2xl border border-rose-200/80 p-4 shadow-sm hover:shadow-md transition-all">
        <div className="flex items-center justify-between text-rose-800 mb-2">
          <span className="text-xs font-bold uppercase tracking-wider">Max Variance</span>
          <span className="px-1.5 py-0.5 text-[10px] font-bold bg-rose-200/80 text-rose-800 rounded">
            {varianceAnalysis?.mostChangedRegion || 'N/A'}
          </span>
        </div>
        <div className="text-xl sm:text-2xl font-bold font-mono text-rose-700 tracking-tight">
          {varianceAnalysis ? formatCurrency(varianceAnalysis.diff) : '$0.00'}
        </div>
        <div className="mt-1 text-xs text-rose-600 font-medium">
          {varianceAnalysis ? `${formatPercent(varianceAnalysis.pctChange)} variance` : ''}
        </div>
      </div>
    </div>
  );
};
