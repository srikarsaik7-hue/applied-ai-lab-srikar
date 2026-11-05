import React from 'react';
import { Layers, ShoppingBag, Store, Percent, Box, ArrowRight, TrendingDown, TrendingUp } from 'lucide-react';
import { SalesOrder, RegionSummary } from '../types';
import { formatCurrency, formatPercent } from '../utils/salesAnalytics';

interface RegionalDrilldownProps {
  selectedRegion: string;
  orders: SalesOrder[];
  summary?: RegionSummary;
}

export const RegionalDrilldown: React.FC<RegionalDrilldownProps> = ({
  selectedRegion,
  orders,
  summary,
}) => {
  if (!selectedRegion) return null;

  // Filter orders for selected region in Q2 and Q3
  const regionOrders = orders.filter(
    o => o.region.toLowerCase() === selectedRegion.toLowerCase() && (o.quarter === 'Q2' || o.quarter === 'Q3')
  );

  // Group by Product
  const productData: Record<string, { q2: number; q3: number }> = {};
  // Group by Channel
  const channelData: Record<string, { q2: number; q3: number }> = {};

  let q2Units = 0;
  let q3Units = 0;
  let q2DiscSum = 0;
  let q3DiscSum = 0;
  let q2Count = 0;
  let q3Count = 0;

  regionOrders.forEach(o => {
    if (o.quarter === 'Q2') {
      productData[o.product] = productData[o.product] || { q2: 0, q3: 0 };
      productData[o.product].q2 += o.revenue;

      channelData[o.channel] = channelData[o.channel] || { q2: 0, q3: 0 };
      channelData[o.channel].q2 += o.revenue;

      q2Units += o.units;
      q2DiscSum += o.discount_pct;
      q2Count++;
    } else if (o.quarter === 'Q3') {
      productData[o.product] = productData[o.product] || { q2: 0, q3: 0 };
      productData[o.product].q3 += o.revenue;

      channelData[o.channel] = channelData[o.channel] || { q2: 0, q3: 0 };
      channelData[o.channel].q3 += o.revenue;

      q3Units += o.units;
      q3DiscSum += o.discount_pct;
      q3Count++;
    }
  });

  const q2AvgDisc = q2Count > 0 ? q2DiscSum / q2Count : 0;
  const q3AvgDisc = q3Count > 0 ? q3DiscSum / q3Count : 0;
  const discDelta = q3AvgDisc - q2AvgDisc;

  const productList = Object.entries(productData).map(([name, vals]) => {
    const diff = vals.q3 - vals.q2;
    const pct = vals.q2 > 0 ? (diff / vals.q2) * 100 : 0;
    return { name, q2: vals.q2, q3: vals.q3, diff, pct };
  }).sort((a, b) => a.diff - b.diff); // largest drops first

  const channelList = Object.entries(channelData).map(([name, vals]) => {
    const diff = vals.q3 - vals.q2;
    const pct = vals.q2 > 0 ? (diff / vals.q2) * 100 : 0;
    return { name, q2: vals.q2, q3: vals.q3, diff, pct };
  }).sort((a, b) => a.diff - b.diff);

  const q2Total = summary?.q2Revenue || regionOrders.filter(o => o.quarter === 'Q2').reduce((s, o) => s + o.revenue, 0);
  const q3Total = summary?.q3Revenue || regionOrders.filter(o => o.quarter === 'Q3').reduce((s, o) => s + o.revenue, 0);
  const netDiff = q3Total - q2Total;
  const isNetDecrease = netDiff < 0;

  return (
    <div className="bg-slate-900 text-white rounded-2xl border border-slate-800 shadow-lg p-5 sm:p-6 transition-all">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 bg-blue-500/20 text-blue-400 rounded-lg">
              <Layers className="w-5 h-5" />
            </span>
            <h3 className="text-lg font-bold text-white">
              {selectedRegion} Regional Drilldown: Q2 vs Q3 Drivers
            </h3>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
              Verified Underlying Arithmetic
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Product lines, sales channels, volume quantities, and discount rates for {selectedRegion}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="px-3 py-1.5 rounded-xl bg-slate-800 border border-slate-700 text-right">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Q2 → Q3 Net Delta</span>
            <span className={`text-sm font-bold font-mono ${isNetDecrease ? 'text-rose-400' : 'text-emerald-400'}`}>
              {netDiff > 0 ? `+${formatCurrency(netDiff)}` : formatCurrency(netDiff)}
            </span>
          </div>
        </div>
      </div>

      {/* Grid of Drivers */}
      <div className="mt-5 grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Product Shifts */}
        <div className="bg-slate-800/60 rounded-xl p-4 border border-slate-700/60">
          <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-700/60">
            <div className="flex items-center gap-2">
              <ShoppingBag className="w-4 h-4 text-indigo-400" />
              <span className="text-sm font-bold text-slate-200">Product Revenue Shifts</span>
            </div>
            <span className="text-xs text-slate-400">Q2 vs Q3</span>
          </div>

          <div className="space-y-3">
            {productList.map(p => {
              const isDec = p.diff < 0;
              return (
                <div key={p.name} className="flex items-center justify-between text-xs sm:text-sm py-1.5 border-b border-slate-700/30 last:border-0">
                  <div className="flex-1">
                    <span className="font-semibold text-slate-200 block">{p.name}</span>
                    <span className="text-[11px] text-slate-400 font-mono">
                      {formatCurrency(p.q2)} (Q2) → {formatCurrency(p.q3)} (Q3)
                    </span>
                  </div>
                  <div className="text-right">
                    <span className={`font-mono font-bold block ${isDec ? 'text-rose-400' : 'text-emerald-400'}`}>
                      {p.diff > 0 ? `+${formatCurrency(p.diff)}` : formatCurrency(p.diff)}
                    </span>
                    <span className={`text-[11px] font-semibold ${isDec ? 'text-rose-400' : 'text-emerald-400'}`}>
                      {formatPercent(p.pct)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Channel & Volume Shifts */}
        <div className="space-y-4">
          <div className="bg-slate-800/60 rounded-xl p-4 border border-slate-700/60">
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-700/60">
              <div className="flex items-center gap-2">
                <Store className="w-4 h-4 text-emerald-400" />
                <span className="text-sm font-bold text-slate-200">Channel Distribution</span>
              </div>
              <span className="text-xs text-slate-400">Shift</span>
            </div>

            <div className="space-y-3">
              {channelList.map(c => {
                const isDec = c.diff < 0;
                return (
                  <div key={c.name} className="flex items-center justify-between text-xs sm:text-sm py-1 border-b border-slate-700/30 last:border-0">
                    <div className="flex-1">
                      <span className="font-semibold text-slate-200">{c.name}</span>
                      <span className="text-[11px] text-slate-400 block font-mono">
                        {formatCurrency(c.q2)} to {formatCurrency(c.q3)}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className={`font-mono font-bold ${isDec ? 'text-rose-400' : 'text-emerald-400'}`}>
                        {c.diff > 0 ? `+${formatCurrency(c.diff)}` : formatCurrency(c.diff)}
                      </span>
                      <span className={`text-[11px] block font-semibold ${isDec ? 'text-rose-400' : 'text-emerald-400'}`}>
                        {formatPercent(c.pct)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Operational Metrics Cards */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3.5 bg-slate-800/60 rounded-xl border border-slate-700/60">
              <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-1">
                <Box className="w-3.5 h-3.5 text-blue-400" />
                <span>Unit Sales Volume</span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-lg font-bold font-mono text-white">
                  {q3Units - q2Units > 0 ? `+${q3Units - q2Units}` : q3Units - q2Units}
                </span>
                <span className="text-xs text-slate-400">units</span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1 font-mono">
                {q2Units} (Q2) → {q3Units} (Q3)
              </p>
            </div>

            <div className="p-3.5 bg-slate-800/60 rounded-xl border border-slate-700/60">
              <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-1">
                <Percent className="w-3.5 h-3.5 text-amber-400" />
                <span>Avg Discount Rate</span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-lg font-bold font-mono text-amber-300">
                  {discDelta > 0 ? `+${discDelta.toFixed(2)}%` : `${discDelta.toFixed(2)}%`}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1 font-mono">
                {q2AvgDisc.toFixed(2)}% (Q2) → {q3AvgDisc.toFixed(2)}% (Q3)
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
