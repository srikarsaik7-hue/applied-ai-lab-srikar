import React, { useState } from 'react';
import { BarChart3, TrendingUp, TrendingDown } from 'lucide-react';
import { RegionSummary } from '../types';
import { formatCurrency, formatCompactCurrency, formatPercent } from '../utils/salesAnalytics';

interface RevenueChartProps {
  regions: RegionSummary[];
  quarters: string[];
  mostChangedRegion?: string;
}

export const RevenueChart: React.FC<RevenueChartProps> = ({
  regions,
  quarters,
  mostChangedRegion,
}) => {
  const [viewMode, setViewMode] = useState<'byRegion' | 'byQuarter' | 'variance'>('byRegion');
  const [hoveredItem, setHoveredItem] = useState<{
    region: string;
    quarter: string;
    revenue: number;
    pctOfRegion?: number;
    x: number;
    y: number;
  } | null>(null);

  if (!regions || regions.length === 0) return null;

  // Gamma-inspired radiant palette for quarters
  const quarterColors: Record<string, { bg: string; fill: string; glow: string; text: string }> = {
    Q1: { bg: 'bg-violet-500', fill: '#8b5cf6', glow: 'shadow-[0_0_12px_rgba(139,92,246,0.35)]', text: 'text-violet-400' },
    Q2: { bg: 'bg-emerald-400', fill: '#34d399', glow: 'shadow-[0_0_12px_rgba(52,211,153,0.35)]', text: 'text-emerald-400' },
    Q3: { bg: 'bg-amber-400', fill: '#fbbf24', glow: 'shadow-[0_0_12px_rgba(251,191,36,0.35)]', text: 'text-amber-400' },
    Q4: { bg: 'bg-cyan-400', fill: '#22d3ee', glow: 'shadow-[0_0_12px_rgba(34,211,238,0.35)]', text: 'text-cyan-400' },
  };

  // Find max revenue across all cells for proportional scaling
  let maxRevenue = 0;
  regions.forEach(r => {
    if (r.q1Revenue > maxRevenue) maxRevenue = r.q1Revenue;
    if (r.q2Revenue > maxRevenue) maxRevenue = r.q2Revenue;
    if (r.q3Revenue > maxRevenue) maxRevenue = r.q3Revenue;
  });
  // Add 15% headroom for top labels
  const chartMax = Math.ceil((maxRevenue * 1.15) / 5000) * 5000 || 25000;

  // Generate gridlines
  const gridTicks = [0, chartMax * 0.25, chartMax * 0.5, chartMax * 0.75, chartMax];

  return (
    <div className="relative overflow-hidden bg-[#161426]/90 backdrop-blur-md rounded-2xl border border-white/[0.08] shadow-[0_8px_32px_rgba(0,0,0,0.36)] p-5 sm:p-6 transition-all hover:border-white/[0.12]">
      {/* Header controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/[0.08]">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-violet-500/10 text-violet-400 rounded-xl border border-violet-500/20">
              <BarChart3 className="w-5 h-5" />
            </div>
            <h3 className="text-base sm:text-lg font-bold text-white tracking-tight">
              Total Revenue by Region &amp; Quarter
            </h3>
            {mostChangedRegion && (
              <span className="hidden md:inline-flex items-center gap-1 text-[10px] font-semibold bg-rose-500/15 text-rose-300 px-2.5 py-0.5 rounded-full border border-rose-500/25">
                Max Variance: {mostChangedRegion}
              </span>
            )}
          </div>
          <p className="text-xs sm:text-sm text-zinc-400 mt-1">
            Compare regional quarter performance and visualize Q2 to Q3 trajectory
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Mode Switcher in Gamma segmented style */}
          <div className="flex p-1 bg-white/[0.04] rounded-xl text-xs font-semibold text-zinc-300 border border-white/[0.08]">
            <button
              type="button"
              onClick={() => setViewMode('byRegion')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                viewMode === 'byRegion' ? 'bg-violet-600 text-white shadow-sm' : 'text-zinc-400 hover:text-white'
              }`}
            >
              By Region
            </button>
            <button
              type="button"
              onClick={() => setViewMode('byQuarter')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                viewMode === 'byQuarter' ? 'bg-violet-600 text-white shadow-sm' : 'text-zinc-400 hover:text-white'
              }`}
            >
              By Quarter
            </button>
            <button
              type="button"
              onClick={() => setViewMode('variance')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                viewMode === 'variance' ? 'bg-violet-600 text-white shadow-sm' : 'text-zinc-400 hover:text-white'
              }`}
            >
              Q2→Q3 Shift
            </button>
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-3.5 pb-2 text-xs text-zinc-400">
        <div className="flex items-center gap-4">
          {quarters.map(q => {
            const conf = quarterColors[q] || { bg: 'bg-zinc-500', fill: '#71717a' };
            return (
              <div key={q} className="flex items-center gap-2">
                <span className={`w-2.5 h-2.5 rounded-sm ${conf.bg}`} />
                <span className="font-semibold text-zinc-300">{q} Revenue</span>
              </div>
            );
          })}
        </div>

        {mostChangedRegion && (
          <div className="flex items-center gap-2 text-xs text-zinc-400">
            <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping opacity-75" />
            <span className="font-medium text-rose-300">Target Territory:</span>
            <span>{mostChangedRegion} (Greatest Delta)</span>
          </div>
        )}
      </div>

      {/* Main Chart Graphic */}
      <div className="relative mt-2 w-full select-none overflow-x-auto">
        <div className="min-w-[620px]">
          {viewMode === 'byRegion' && (
            <div className="relative h-[320px]">
              {/* Y-axis ticks and horizontal grid lines */}
              <div className="absolute inset-0 flex flex-col justify-between pointer-events-none pr-4">
                {gridTicks.slice().reverse().map((tick, i) => (
                  <div key={i} className="flex items-center w-full">
                    <span className="text-[11px] font-mono text-zinc-500 w-14 text-right pr-2 shrink-0">
                      {formatCompactCurrency(tick)}
                    </span>
                    <div className="h-px bg-white/[0.04] flex-1" />
                  </div>
                ))}
              </div>

              {/* Bar Columns Container */}
              <div className="absolute inset-y-0 left-16 right-4 pb-[38px] pt-4 flex justify-around items-end">
                {regions.map(r => {
                  const isTarget = r.region === mostChangedRegion;
                  const qRevs: Record<string, number> = {
                    Q1: r.q1Revenue,
                    Q2: r.q2Revenue,
                    Q3: r.q3Revenue,
                  };

                  return (
                    <div
                      key={r.region}
                      className={`relative flex flex-col items-center flex-1 max-w-[130px] mx-2 px-1 py-1 rounded-xl transition-all ${
                        isTarget ? 'bg-rose-500/10 ring-1 ring-rose-500/30' : ''
                      }`}
                    >
                      {/* Bars Group */}
                      <div className="w-full flex items-end justify-center gap-2 h-[230px]">
                        {quarters.map(q => {
                          const val = qRevs[q] || 0;
                          const heightPct = Math.min(100, Math.max(3, (val / chartMax) * 100));
                          const color = quarterColors[q] || { fill: '#71717a', bg: 'bg-zinc-500', glow: '' };

                          return (
                            <div
                              key={q}
                              className="relative flex-1 group flex flex-col items-center justify-end h-full"
                              onMouseEnter={(e) => {
                                const rect = e.currentTarget.getBoundingClientRect();
                                setHoveredItem({
                                  region: r.region,
                                  quarter: q,
                                  revenue: val,
                                  pctOfRegion: r.totalRevenue ? (val / r.totalRevenue) * 100 : 0,
                                  x: rect.left + rect.width / 2,
                                  y: rect.top,
                                });
                              }}
                              onMouseLeave={() => setHoveredItem(null)}
                            >
                              {/* Animated Bar with Gamma Glow */}
                              <div
                                style={{ height: `${heightPct}%` }}
                                className={`w-full rounded-t-lg transition-all duration-300 relative group-hover:brightness-125 ${color.bg} ${color.glow}`}
                              >
                                {val > 0 && (
                                  <span className="opacity-0 group-hover:opacity-100 absolute -top-7 left-1/2 -translate-x-1/2 whitespace-nowrap bg-[#0b0a13] border border-white/[0.1] text-white text-[10px] font-mono px-2 py-0.5 rounded-md shadow-xl pointer-events-none z-20">
                                    {formatCompactCurrency(val)}
                                  </span>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {/* X-axis Region Label */}
                      <div className="mt-2 text-center">
                        <span className="text-xs font-bold text-white flex items-center justify-center gap-1.5">
                          {r.region}
                          {isTarget && (
                            <span className="w-1.5 h-1.5 rounded-full bg-rose-400" title="Greatest Q2-to-Q3 Mover" />
                          )}
                        </span>
                        <span className="text-[10px] font-mono text-zinc-400">
                          {formatCompactCurrency(r.totalRevenue)}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {viewMode === 'byQuarter' && (
            <div className="relative h-[320px]">
              <div className="absolute inset-0 flex flex-col justify-between pointer-events-none pr-4">
                {gridTicks.slice().reverse().map((tick, i) => (
                  <div key={i} className="flex items-center w-full">
                    <span className="text-[11px] font-mono text-zinc-500 w-14 text-right pr-2 shrink-0">
                      {formatCompactCurrency(tick)}
                    </span>
                    <div className="h-px bg-white/[0.04] flex-1" />
                  </div>
                ))}
              </div>

              <div className="absolute inset-y-0 left-16 right-4 pb-[38px] pt-4 flex justify-around items-end">
                {quarters.map(q => {
                  return (
                    <div
                      key={q}
                      className="relative flex flex-col items-center flex-1 max-w-[160px] mx-3 px-2 py-1 rounded-xl bg-white/[0.02] border border-white/[0.06]"
                    >
                      <div className="w-full flex items-end justify-center gap-2 h-[230px]">
                        {regions.map((r, rIdx) => {
                          const val = q === 'Q1' ? r.q1Revenue : q === 'Q2' ? r.q2Revenue : r.q3Revenue;
                          const heightPct = Math.min(100, Math.max(3, (val / chartMax) * 100));
                          const regionHues = ['#8b5cf6', '#34d399', '#fbbf24', '#38bdf8'];
                          const hue = regionHues[rIdx % regionHues.length];

                          return (
                            <div
                              key={r.region}
                              className="relative flex-1 group flex flex-col items-center justify-end h-full"
                              onMouseEnter={(e) => {
                                const rect = e.currentTarget.getBoundingClientRect();
                                setHoveredItem({
                                  region: r.region,
                                  quarter: q,
                                  revenue: val,
                                  x: rect.left + rect.width / 2,
                                  y: rect.top,
                                });
                              }}
                              onMouseLeave={() => setHoveredItem(null)}
                            >
                              <div
                                style={{ height: `${heightPct}%`, backgroundColor: hue }}
                                className="w-full rounded-t-lg transition-all duration-300 relative group-hover:brightness-125 shadow-sm"
                              >
                                <span className="opacity-0 group-hover:opacity-100 absolute -top-7 left-1/2 -translate-x-1/2 whitespace-nowrap bg-[#0b0a13] border border-white/[0.1] text-white text-[10px] font-mono px-2 py-0.5 rounded-md shadow-xl pointer-events-none z-20">
                                  {r.region}: {formatCompactCurrency(val)}
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      <div className="mt-2 text-center">
                        <span className="text-xs font-bold text-white">{q} Totals</span>
                        <div className="flex gap-1.5 justify-center mt-1">
                          {regions.map((r, rIdx) => (
                            <span
                              key={r.region}
                              style={{ color: ['#8b5cf6', '#34d399', '#fbbf24', '#38bdf8'][rIdx % 4] }}
                              className="text-[10px] font-semibold"
                            >
                              {r.region[0]}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {viewMode === 'variance' && (
            <div className="p-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              {regions.map(r => {
                const isTarget = r.region === mostChangedRegion;
                const isDec = r.q2ToQ3Diff < 0;
                const maxVal = Math.max(r.q2Revenue, r.q3Revenue);
                const q2Pct = (r.q2Revenue / maxVal) * 100;
                const q3Pct = (r.q3Revenue / maxVal) * 100;

                return (
                  <div
                    key={r.region}
                    className={`rounded-2xl p-4 border transition-all ${
                      isTarget
                        ? 'bg-gradient-to-b from-rose-500/15 to-transparent border-rose-500/40 ring-1 ring-rose-500/30 shadow-lg'
                        : 'bg-white/[0.02] border-white/[0.08]'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-white text-sm">{r.region} Territory</span>
                      {isTarget && (
                        <span className="text-[10px] font-bold uppercase tracking-wider text-rose-300 bg-rose-500/20 px-2 py-0.5 rounded-full border border-rose-500/30">
                          Max Mover
                        </span>
                      )}
                    </div>

                    <div className="mt-3 flex items-baseline justify-between">
                      <span className="text-xs text-zinc-400">Q2 vs Q3 Delta</span>
                      <span
                        className={`text-sm font-bold flex items-center font-mono ${
                          isDec ? 'text-rose-400' : 'text-emerald-400'
                        }`}
                      >
                        {isDec ? <TrendingDown className="w-3.5 h-3.5 mr-0.5" /> : <TrendingUp className="w-3.5 h-3.5 mr-0.5" />}
                        {formatCurrency(r.q2ToQ3Diff)} ({formatPercent(r.q2ToQ3PctChange)})
                      </span>
                    </div>

                    {/* Progression Bars */}
                    <div className="mt-3 space-y-2">
                      <div>
                        <div className="flex justify-between text-[11px] mb-1">
                          <span className="font-medium text-zinc-400">Q2</span>
                          <span className="font-mono text-zinc-200">{formatCurrency(r.q2Revenue)}</span>
                        </div>
                        <div className="h-2 w-full bg-white/[0.06] rounded-full overflow-hidden">
                          <div
                            style={{ width: `${q2Pct}%` }}
                            className="h-full bg-emerald-400 rounded-full"
                          />
                        </div>
                      </div>

                      <div>
                        <div className="flex justify-between text-[11px] mb-1">
                          <span className="font-medium text-zinc-400">Q3</span>
                          <span className="font-mono text-zinc-200">{formatCurrency(r.q3Revenue)}</span>
                        </div>
                        <div className="h-2 w-full bg-white/[0.06] rounded-full overflow-hidden">
                          <div
                            style={{ width: `${q3Pct}%` }}
                            className={`h-full rounded-full ${isDec ? 'bg-amber-400' : 'bg-emerald-400'}`}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
