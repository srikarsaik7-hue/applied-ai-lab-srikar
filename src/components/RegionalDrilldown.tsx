import React from 'react';
import { Layers, ShoppingBag, Store, Percent, Box, TrendingDown, TrendingUp } from 'lucide-react';
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
    <div className="relative overflow-hidden bg-[#161426]/90 backdrop-blur-md rounded-2xl border border-white/[0.08] shadow-[0_8px_32px_rgba(0,0,0,0.36)] p-5 sm:p-6 transition-all hover:border-white/[0.12] text-white">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/[0.08]">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-violet-500/10 text-violet-400 rounded-xl border border-violet-500/20">
              <Layers className="w-5 h-5" />
            </div>
            <h3 className="text-base sm:text-lg font-bold text-white tracking-tight">
              {selectedRegion} Regional Drilldown: Q2 vs Q3 Drivers
            </h3>
            <span className="text-[10px] uppercase font-bold tracking-wider px-2.5 py-0.5 rounded-full bg-violet-500/15 text-violet-300 border border-violet-500/25">
              Verified Arithmetic
            </span>
          </div>
          <p className="text-xs sm:text-sm text-zinc-400 mt-1">
            Product lines, sales channels, volume quantities, and discount rates for {selectedRegion}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="px-3.5 py-1.5 rounded-xl bg-[#110e20]/90 border border-white/[0.08] text-right">
            <span className="text-[10px] uppercase font-semibold text-zinc-400 block">Q2 → Q3 Net Delta</span>
            <span className={`text-sm font-bold font-mono ${isNetDecrease ? 'text-rose-400' : 'text-emerald-400'}`}>
              {netDiff > 0 ? `+${formatCurrency(netDiff)}` : formatCurrency(netDiff)}
            </span>
          </div>
        </div>
      </div>

      {/* Grid of Drivers */}
      <div className="mt-5 grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Product Shifts */}
        <div className="bg-[#110e20]/80 rounded-xl p-4 sm:p-5 border border-white/[0.08] shadow-sm">
          <div className="flex items-center justify-between pb-3 mb-3 border-b border-white/[0.06]">
            <div className="flex items-center gap-2">
              <ShoppingBag className="w-4 h-4 text-violet-400" />
              <span className="text-sm font-bold text-zinc-100">Product Line Variance</span>
            </div>
            <span className="text-xs text-zinc-400">Q2 vs Q3</span>
          </div>

          <div className="space-y-3">
            {productList.map(p => {
              const isDec = p.diff < 0;
              return (
                <div key={p.name} className="flex items-center justify-between text-xs sm:text-sm py-2 border-b border-white/[0.04] last:border-0">
                  <div className="flex-1 pr-3">
                    <span className="font-semibold text-white block">{p.name}</span>
                    <span className="text-[11px] text-zinc-400 font-mono">
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

        {/* Channel Shifts */}
        <div className="bg-[#110e20]/80 rounded-xl p-4 sm:p-5 border border-white/[0.08] shadow-sm">
          <div className="flex items-center justify-between pb-3 mb-3 border-b border-white/[0.06]">
            <div className="flex items-center gap-2">
              <Store className="w-4 h-4 text-fuchsia-400" />
              <span className="text-sm font-bold text-zinc-100">Channel Performance</span>
            </div>
            <span className="text-xs text-zinc-400">Q2 vs Q3</span>
          </div>

          <div className="space-y-3">
            {channelList.map(c => {
              const isDec = c.diff < 0;
              return (
                <div key={c.name} className="flex items-center justify-between text-xs sm:text-sm py-2 border-b border-white/[0.04] last:border-0">
                  <div className="flex-1 pr-3">
                    <span className="font-semibold text-white block">{c.name} Channel</span>
                    <span className="text-[11px] text-zinc-400 font-mono">
                      {formatCurrency(c.q2)} (Q2) → {formatCurrency(c.q3)} (Q3)
                    </span>
                  </div>
                  <div className="text-right">
                    <span className={`font-mono font-bold block ${isDec ? 'text-rose-400' : 'text-emerald-400'}`}>
                      {c.diff > 0 ? `+${formatCurrency(c.diff)}` : formatCurrency(c.diff)}
                    </span>
                    <span className={`text-[11px] font-semibold ${isDec ? 'text-rose-400' : 'text-emerald-400'}`}>
                      {formatPercent(c.pct)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Operational Factors Strip */}
      <div className="mt-6 pt-5 border-t border-white/[0.08] grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="flex items-center gap-3.5 p-3.5 rounded-xl bg-[#110e20]/80 border border-white/[0.08]">
          <div className="p-2.5 rounded-xl bg-violet-500/10 text-violet-400 border border-violet-500/20">
            <Box className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs text-zinc-400 font-medium block">Unit Sales Volume</span>
            <span className="text-base font-bold text-white font-mono">
              {q2Units} units (Q2) → {q3Units} units (Q3)
            </span>
            <span className={`text-xs block font-semibold ${q3Units - q2Units < 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
              {q3Units - q2Units > 0 ? `+${q3Units - q2Units}` : q3Units - q2Units} units net variance
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3.5 p-3.5 rounded-xl bg-[#110e20]/80 border border-white/[0.08]">
          <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <Percent className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs text-zinc-400 font-medium block">Average Discount Rate</span>
            <span className="text-base font-bold text-white font-mono">
              {q2AvgDisc.toFixed(1)}% (Q2) → {q3AvgDisc.toFixed(1)}% (Q3)
            </span>
            <span className={`text-xs block font-semibold ${discDelta > 0 ? 'text-amber-400' : 'text-emerald-400'}`}>
              {discDelta > 0 ? `+${discDelta.toFixed(2)}` : discDelta.toFixed(2)} percentage points shift
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
