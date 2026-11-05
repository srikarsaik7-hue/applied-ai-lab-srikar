import React, { useState } from 'react';
import { BarChart3, TrendingUp, TrendingDown, Layers, HelpCircle } from 'lucide-react';
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
    pctOfQuarter?: number;
    x: number;
    y: number;
  } | null>(null);

  if (!regions || regions.length === 0) return null;

  // Quarter color palette
  const quarterColors: Record<string, { bg: string; fill: string; border: string; text: string }> = {
    Q1: { bg: 'bg-indigo-500', fill: '#6366f1', border: '#4f46e5', text: 'text-indigo-600' },
    Q2: { bg: 'bg-emerald-500', fill: '#10b981', border: '#059669', text: 'text-emerald-600' },
    Q3: { bg: 'bg-amber-500', fill: '#f59e0b', border: '#d97706', text: 'text-amber-600' },
    Q4: { bg: 'bg-sky-500', fill: '#0ea5e9', border: '#0284c7', text: 'text-sky-600' },
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

  // Chart layout dimensions for SVG
  const svgHeight = 320;
  const paddingBottom = 45;
  const paddingTop = 25;
  const plotHeight = svgHeight - paddingTop - paddingBottom;

  // Generate gridlines
  const gridTicks = [0, chartMax * 0.25, chartMax * 0.5, chartMax * 0.75, chartMax];

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-5 sm:p-6 transition-all hover:shadow-md">
      {/* Header controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg">
              <BarChart3 className="w-5 h-5" />
            </span>
            <h3 className="text-base sm:text-lg font-bold text-slate-900">
              Total Revenue by Region & Quarter
            </h3>
            {mostChangedRegion && (
              <span className="hidden md:inline-flex items-center gap-1 text-[11px] font-semibold bg-rose-50 text-rose-700 px-2 py-0.5 rounded-full border border-rose-200">
                Largest Q2→Q3 Shift: {mostChangedRegion}
              </span>
            )}
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Compare regional quarter performance and visualize Q2 to Q3 trajectory
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Mode Switcher */}
          <div className="flex p-0.5 bg-slate-100 rounded-xl text-xs font-semibold text-slate-600 border border-slate-200/80">
            <button
              type="button"
              onClick={() => setViewMode('byRegion')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                viewMode === 'byRegion' ? 'bg-white text-slate-900 shadow-2xs' : 'hover:text-slate-900'
              }`}
            >
              Group by Region
            </button>
            <button
              type="button"
              onClick={() => setViewMode('byQuarter')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                viewMode === 'byQuarter' ? 'bg-white text-slate-900 shadow-2xs' : 'hover:text-slate-900'
              }`}
            >
              Group by Quarter
            </button>
            <button
              type="button"
              onClick={() => setViewMode('variance')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                viewMode === 'variance' ? 'bg-white text-slate-900 shadow-2xs' : 'hover:text-slate-900'
              }`}
            >
              Q2→Q3 Trajectory
            </button>
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-3 pb-2 text-xs text-slate-600">
        <div className="flex items-center gap-4">
          {quarters.map(q => {
            const conf = quarterColors[q] || { bg: 'bg-slate-500', fill: '#64748b' };
            return (
              <div key={q} className="flex items-center gap-1.5">
                <span className={`w-3 h-3 rounded-sm ${conf.bg}`} />
                <span className="font-semibold text-slate-700">{q} Revenue</span>
              </div>
            );
          })}
        </div>

        {mostChangedRegion && (
          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping opacity-75" />
            <span className="font-medium text-slate-700">Pulsing outline:</span>
            <span>Max Q2→Q3 Delta ({mostChangedRegion})</span>
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
                    <span className="text-[11px] font-mono text-slate-400 w-14 text-right pr-2 shrink-0">
                      {formatCompactCurrency(tick)}
                    </span>
                    <div className="h-px bg-slate-100 flex-1" />
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
                        isTarget ? 'bg-rose-50/40 ring-1 ring-rose-200' : ''
                      }`}
                    >
                      {/* Bars Group */}
                      <div className="w-full flex items-end justify-center gap-1.5 h-[230px]">
                        {quarters.map(q => {
                          const val = qRevs[q] || 0;
                          const heightPct = Math.min(100, Math.max(3, (val / chartMax) * 100));
                          const color = quarterColors[q] || { fill: '#64748b', bg: 'bg-slate-500' };

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
                              {/* Animated Bar */}
                              <div
                                style={{ height: `${heightPct}%` }}
                                className={`w-full rounded-t-md transition-all duration-300 relative group-hover:opacity-90 group-hover:brightness-105 shadow-xs ${color.bg}`}
                              >
                                {val > 0 && (
                                  <span className="opacity-0 group-hover:opacity-100 absolute -top-6 left-1/2 -translate-x-1/2 whitespace-nowrap bg-slate-900 text-white text-[10px] font-mono px-1.5 py-0.5 rounded shadow pointer-events-none z-20">
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
                        <span className="text-xs font-bold text-slate-800 flex items-center justify-center gap-1">
                          {r.region}
                          {isTarget && (
                            <span className="w-2 h-2 rounded-full bg-rose-500" title="Greatest Q2-to-Q3 Mover" />
                          )}
                        </span>
                        <span className="text-[10px] font-mono text-slate-500">
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
                    <span className="text-[11px] font-mono text-slate-400 w-14 text-right pr-2 shrink-0">
                      {formatCompactCurrency(tick)}
                    </span>
                    <div className="h-px bg-slate-100 flex-1" />
                  </div>
                ))}
              </div>

              <div className="absolute inset-y-0 left-16 right-4 pb-[38px] pt-4 flex justify-around items-end">
                {quarters.map(q => {
                  return (
                    <div
                      key={q}
                      className="relative flex flex-col items-center flex-1 max-w-[160px] mx-3 px-2 py-1 rounded-xl bg-slate-50/50 border border-slate-100"
                    >
                      <div className="w-full flex items-end justify-center gap-2 h-[230px]">
                        {regions.map((r, rIdx) => {
                          const val = q === 'Q1' ? r.q1Revenue : q === 'Q2' ? r.q2Revenue : r.q3Revenue;
                          const heightPct = Math.min(100, Math.max(3, (val / chartMax) * 100));
                          const regionHues = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6'];
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
                                className="w-full rounded-t-md transition-all duration-300 relative group-hover:brightness-110 shadow-xs"
                              >
                                <span className="opacity-0 group-hover:opacity-100 absolute -top-6 left-1/2 -translate-x-1/2 whitespace-nowrap bg-slate-900 text-white text-[10px] font-mono px-1.5 py-0.5 rounded shadow pointer-events-none z-20">
                                  {r.region}: {formatCompactCurrency(val)}
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      <div className="mt-2 text-center">
                        <span className="text-xs font-bold text-slate-800">{q} Aggregates</span>
                        <div className="flex gap-1 justify-center mt-0.5">
                          {regions.map((r, rIdx) => (
                            <span
                              key={r.region}
                              style={{ color: ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6'][rIdx % 4] }}
                              className="text-[9px] font-semibold"
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
                    className={`rounded-xl p-4 border transition-all ${
                      isTarget
                        ? 'bg-rose-50/60 border-rose-300 ring-2 ring-rose-400/40 shadow-sm'
                        : 'bg-slate-50/60 border-slate-200'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900 text-sm">{r.region} Region</span>
                      {isTarget && (
                        <span className="text-[10px] font-bold uppercase tracking-wider text-rose-700 bg-rose-100 px-1.5 py-0.5 rounded">
                          Max Mover
                        </span>
                      )}
                    </div>

                    <div className="mt-3 flex items-baseline justify-between">
                      <span className="text-xs text-slate-500">Q2 vs Q3 Delta</span>
                      <span
                        className={`text-sm font-bold flex items-center font-mono ${
                          isDec ? 'text-rose-600' : 'text-emerald-600'
                        }`}
                      >
                        {isDec ? <TrendingDown className="w-3.5 h-3.5 mr-0.5" /> : <TrendingUp className="w-3.5 h-3.5 mr-0.5" />}
                        {formatCurrency(r.q2ToQ3Diff)} ({formatPercent(r.q2ToQ3PctChange)})
                      </span>
                    </div>

                    {/* Side-by-side progression */}
                    <div className="mt-3 space-y-2">
                      <div>
                        <div className="flex justify-between text-[11px] mb-1">
                          <span className="font-medium text-slate-600">Q2</span>
                          <span className="font-mono text-slate-700">{formatCurrency(r.q2Revenue)}</span>
                        </div>
                        <div className="h-2 w-full bg-slate-200 rounded-full overflow-hidden">
                          <div
                            style={{ width: `${q2Pct}%` }}
                            className="h-full bg-emerald-500 rounded-full"
                          />
                        </div>
                      </div>

                      <div>
                        <div className="flex justify-between text-[11px] mb-1">
                          <span className="font-medium text-slate-600">Q3</span>
                          <span className="font-mono text-slate-700">{formatCurrency(r.q3Revenue)}</span>
                        </div>
                        <div className="h-2 w-full bg-slate-200 rounded-full overflow-hidden">
                          <div
                            style={{ width: `${q3Pct}%` }}
                            className={`h-full rounded-full ${isDec ? 'bg-amber-500' : 'bg-emerald-600'}`}
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
