import React, { useState } from 'react';
import { Sparkles, Brain, CheckCircle2, RefreshCw, Copy, Check, TrendingDown, TrendingUp, Layers } from 'lucide-react';
import { VarianceAnalysis, AISummaryResponse } from '../types';
import { formatCurrency, formatPercent } from '../utils/salesAnalytics';

interface AISummaryCardProps {
  analysis: VarianceAnalysis | null;
  aiResponse: AISummaryResponse | null;
  isLoadingAI: boolean;
  onRegenerate: () => void;
}

export const AISummaryCard: React.FC<AISummaryCardProps> = ({
  analysis,
  aiResponse,
  isLoadingAI,
  onRegenerate,
}) => {
  const [copied, setCopied] = useState(false);
  const [highlightMode, setHighlightMode] = useState<'all' | 's1' | 's2' | 's3'>('all');

  if (!analysis) return null;

  const summaryText = aiResponse?.summary || 'Generating variance synthesis...';

  // Split into sentences for the sentence breakdown feature
  const sentences = summaryText.split(/(?<=[.!?])\s+/).filter(s => s.trim().length > 0);

  const handleCopy = () => {
    navigator.clipboard.writeText(summaryText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const isDecrease = analysis.diff < 0;

  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#1b1730] via-[#151228] to-[#100e20] text-white shadow-[0_16px_48px_rgba(0,0,0,0.5)] border border-violet-500/25 ring-1 ring-violet-500/20 p-6 sm:p-7">
      {/* Decorative Gamma ambient glow */}
      <div className="absolute -top-16 -right-16 w-80 h-80 bg-violet-600/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-16 left-1/4 w-72 h-72 bg-fuchsia-600/15 rounded-full blur-3xl pointer-events-none" />

      {/* Header bar */}
      <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-white/[0.08]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-violet-500 via-fuchsia-500 to-indigo-500 p-0.5 flex items-center justify-center shadow-lg shadow-violet-500/30">
            <div className="w-full h-full bg-[#151224] rounded-[10px] flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-violet-300 animate-pulse" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-bold tracking-tight text-white">
                Executive AI Variance Summary (Q2 → Q3)
              </h2>
              <span className="text-[10px] font-semibold tracking-wide uppercase px-2.5 py-0.5 rounded-full bg-violet-500/20 text-violet-300 border border-violet-400/30">
                Exact 3-Sentence Synthesis
              </span>
            </div>
            <p className="text-xs text-zinc-400 mt-0.5">
              Strictly grounded: AI synthesized using only calculations verified from your uploaded dataset
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={handleCopy}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-zinc-300 bg-white/[0.06] hover:bg-white/[0.1] hover:text-white rounded-xl border border-white/[0.1] transition-all cursor-pointer shadow-sm"
            title="Copy summary text"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copied' : 'Copy'}</span>
          </button>

          <button
            type="button"
            onClick={onRegenerate}
            disabled={isLoadingAI}
            className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold text-white bg-gradient-to-r from-violet-600 via-indigo-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 rounded-xl shadow-lg shadow-violet-600/30 transition-all cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoadingAI ? 'animate-spin' : ''}`} />
            <span>{isLoadingAI ? 'Analyzing...' : 'Regenerate'}</span>
          </button>
        </div>
      </div>

      {/* The 3-Sentence Narrative Hero Block */}
      <div className="relative z-10 my-6 bg-[#110e20]/80 backdrop-blur-md rounded-2xl p-5 sm:p-6 border border-white/[0.08] shadow-inner">
        {isLoadingAI ? (
          <div className="py-10 flex flex-col items-center justify-center gap-3">
            <div className="w-9 h-9 border-2 border-violet-400 border-t-transparent rounded-full animate-spin" />
            <p className="text-sm text-zinc-200 font-medium">
              Gemini 3.8 Flash is synthesizing the Q2 vs Q3 variance...
            </p>
            <p className="text-xs text-zinc-400">Verifying that only calculated app metrics are cited</p>
          </div>
        ) : (
          <div>
            <div className="flex items-center justify-between pb-3.5 mb-3.5 border-b border-white/[0.06] text-xs text-zinc-400">
              <span className="flex items-center gap-1.5 text-emerald-400 font-medium">
                <CheckCircle2 className="w-4 h-4" />
                Verified Grounded Engine ({aiResponse?.source === 'gemini-3.8-flash' ? 'Gemini 3.8 Flash' : 'Deterministic Calculator Engine'})
              </span>
              
              {/* Sentence Inspector Tabs in Gamma Style */}
              <div className="hidden sm:flex items-center gap-1 bg-white/[0.04] p-1 rounded-xl border border-white/[0.08]">
                <button
                  type="button"
                  onClick={() => setHighlightMode('all')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    highlightMode === 'all' ? 'bg-violet-600 text-white shadow-sm' : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  Full 3 Sentences
                </button>
                <button
                  type="button"
                  onClick={() => setHighlightMode('s1')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    highlightMode === 's1' ? 'bg-violet-600 text-white shadow-sm' : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  1: Most Changed
                </button>
                <button
                  type="button"
                  onClick={() => setHighlightMode('s2')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    highlightMode === 's2' ? 'bg-violet-600 text-white shadow-sm' : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  2: Product Why
                </button>
                <button
                  type="button"
                  onClick={() => setHighlightMode('s3')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    highlightMode === 's3' ? 'bg-violet-600 text-white shadow-sm' : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  3: Channel/Unit Why
                </button>
              </div>
            </div>

            <div className="text-base sm:text-lg leading-relaxed text-zinc-100 font-normal">
              {sentences.map((sentence, idx) => {
                const sNum = idx + 1;
                const isSelected =
                  highlightMode === 'all' ||
                  (highlightMode === 's1' && sNum === 1) ||
                  (highlightMode === 's2' && sNum === 2) ||
                  (highlightMode === 's3' && sNum === 3);

                return (
                  <span
                    key={idx}
                    className={`inline transition-all duration-200 mr-2 ${
                      isSelected
                        ? highlightMode !== 'all'
                          ? 'bg-violet-500/25 text-white px-2 py-0.5 rounded-lg border border-violet-400/40 font-medium shadow-sm'
                          : 'text-zinc-100'
                        : 'text-zinc-500 opacity-40'
                    }`}
                  >
                    {sentence}
                  </span>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Grounded Arithmetic Inspector Ribbon */}
      <div className="relative z-10 grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3.5 rounded-xl bg-[#131024]/80 border border-white/[0.08] shadow-sm">
          <div className="flex items-center justify-between text-xs text-zinc-400">
            <span>Primary Mover</span>
            <span className="font-semibold text-white">{analysis.mostChangedRegion}</span>
          </div>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-lg font-bold font-mono text-white">
              {formatCurrency(analysis.absDiff)}
            </span>
            <span className={`text-xs font-semibold flex items-center ${isDecrease ? 'text-rose-400' : 'text-emerald-400'}`}>
              {isDecrease ? <TrendingDown className="w-3 h-3 mr-0.5" /> : <TrendingUp className="w-3 h-3 mr-0.5" />}
              {formatPercent(analysis.pctChange)}
            </span>
          </div>
          <div className="text-[11px] text-zinc-400 font-mono mt-1">
            Q2: {formatCurrency(analysis.q2Revenue)} → Q3: {formatCurrency(analysis.q3Revenue)}
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-[#131024]/80 border border-white/[0.08] shadow-sm">
          <div className="flex items-center justify-between text-xs text-zinc-400">
            <span>Key Product Drag</span>
            <span className="truncate max-w-[90px] font-medium text-zinc-300">
              {analysis.productDrivers[0]?.name || 'N/A'}
            </span>
          </div>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-lg font-bold font-mono text-rose-300">
              {formatCurrency(analysis.productDrivers[0]?.diff || 0)}
            </span>
            <span className="text-xs text-rose-400 font-semibold">
              {analysis.productDrivers[0]?.pctChange.toFixed(1)}%
            </span>
          </div>
          <div className="text-[11px] text-zinc-400 font-mono mt-1">
            Q2: {formatCurrency(analysis.productDrivers[0]?.q2Revenue || 0)} → Q3: {formatCurrency(analysis.productDrivers[0]?.q3Revenue || 0)}
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-[#131024]/80 border border-white/[0.08] shadow-sm">
          <div className="flex items-center justify-between text-xs text-zinc-400">
            <span>Order Volume Shift</span>
            <span className="text-zinc-300 font-medium">Units</span>
          </div>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-lg font-bold font-mono text-white">
              {analysis.unitsDiff > 0 ? `+${analysis.unitsDiff}` : analysis.unitsDiff} units
            </span>
            <span className={`text-xs font-semibold ${analysis.unitsDiff < 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
              {formatPercent(analysis.unitsPctChange)}
            </span>
          </div>
          <div className="text-[11px] text-zinc-400 font-mono mt-1">
            {analysis.q2Units} (Q2) vs {analysis.q3Units} (Q3)
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-[#131024]/80 border border-white/[0.08] shadow-sm">
          <div className="flex items-center justify-between text-xs text-zinc-400">
            <span>Discount Rate Shift</span>
            <span className="text-zinc-300 font-medium">Avg %</span>
          </div>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-lg font-bold font-mono text-amber-300">
              {analysis.discountDiffPctPoints > 0 ? `+${analysis.discountDiffPctPoints.toFixed(2)}` : analysis.discountDiffPctPoints.toFixed(2)} pts
            </span>
          </div>
          <div className="text-[11px] text-zinc-400 font-mono mt-1">
            {analysis.q2AvgDiscountPct.toFixed(1)}% (Q2) to {analysis.q3AvgDiscountPct.toFixed(1)}% (Q3)
          </div>
        </div>
      </div>
    </div>
  );
};
