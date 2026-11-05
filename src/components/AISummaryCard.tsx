import React, { useState } from 'react';
import { Sparkles, Brain, CheckCircle2, RefreshCw, Copy, Check, Info, TrendingDown, TrendingUp, BarChart3, Layers } from 'lucide-react';
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
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-slate-850 to-indigo-950 text-white shadow-xl border border-slate-800 p-6 sm:p-7">
      {/* Decorative background glow */}
      <div className="absolute top-0 right-0 -mt-12 -mr-12 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-1/4 -mb-12 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header bar */}
      <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-700/60">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-500 to-blue-400 p-0.5 flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <div className="w-full h-full bg-slate-900 rounded-[10px] flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-indigo-400 animate-pulse" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold tracking-tight text-white">
                Executive AI Variance Summary (Q2 → Q3)
              </h2>
              <span className="text-[11px] font-semibold tracking-wide uppercase px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-400/30">
                Exact 3-Sentence Synthesis
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Strictly grounded: AI synthesized using only calculations verified from your uploaded dataset
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleCopy}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-300 bg-slate-800/80 hover:bg-slate-700/80 rounded-lg border border-slate-700 transition-colors cursor-pointer"
            title="Copy summary text"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copied' : 'Copy'}</span>
          </button>

          <button
            type="button"
            onClick={onRegenerate}
            disabled={isLoadingAI}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg shadow-md transition-all cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoadingAI ? 'animate-spin' : ''}`} />
            <span>{isLoadingAI ? 'Analyzing...' : 'Regenerate'}</span>
          </button>
        </div>
      </div>

      {/* The 3-Sentence Narrative Hero Block */}
      <div className="relative z-10 my-6 bg-slate-800/60 backdrop-blur-md rounded-xl p-5 border border-slate-700/70 shadow-inner">
        {isLoadingAI ? (
          <div className="py-8 flex flex-col items-center justify-center gap-3">
            <div className="w-8 h-8 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
            <p className="text-sm text-slate-300 font-medium">
              Gemini 3.8 Flash is synthesizing the Q2 vs Q3 variance...
            </p>
            <p className="text-xs text-slate-400">Verifying that only calculated app metrics are cited</p>
          </div>
        ) : (
          <div>
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-700/50 text-xs text-slate-400">
              <span className="flex items-center gap-1.5 text-emerald-400 font-medium">
                <CheckCircle2 className="w-4 h-4" />
                Verified Grounded Engine ({aiResponse?.source === 'gemini-3.8-flash' ? 'Gemini 3.8 Flash' : 'Deterministic Calculator Engine'})
              </span>
              
              {/* Sentence Inspector Tabs */}
              <div className="hidden sm:flex items-center gap-1 bg-slate-900/60 p-1 rounded-lg border border-slate-700/60">
                <button
                  type="button"
                  onClick={() => setHighlightMode('all')}
                  className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors cursor-pointer ${
                    highlightMode === 'all' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Full 3 Sentences
                </button>
                <button
                  type="button"
                  onClick={() => setHighlightMode('s1')}
                  className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors cursor-pointer ${
                    highlightMode === 's1' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  1: Most Changed
                </button>
                <button
                  type="button"
                  onClick={() => setHighlightMode('s2')}
                  className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors cursor-pointer ${
                    highlightMode === 's2' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  2: Product Why
                </button>
                <button
                  type="button"
                  onClick={() => setHighlightMode('s3')}
                  className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors cursor-pointer ${
                    highlightMode === 's3' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  3: Channel/Unit Why
                </button>
              </div>
            </div>

            <div className="text-base sm:text-lg leading-relaxed text-slate-100 font-normal">
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
                    className={`inline transition-all duration-200 mr-1.5 ${
                      isSelected
                        ? highlightMode !== 'all'
                          ? 'bg-indigo-500/30 text-white px-1.5 py-0.5 rounded border border-indigo-400/40 font-medium'
                          : 'text-slate-100'
                        : 'text-slate-400 opacity-40'
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
        <div className="p-3 rounded-xl bg-slate-800/40 border border-slate-700/50">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Primary Mover</span>
            <span className="font-semibold text-white">{analysis.mostChangedRegion}</span>
          </div>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-lg font-bold text-white">
              {formatCurrency(analysis.absDiff)}
            </span>
            <span className={`text-xs font-semibold flex items-center ${isDecrease ? 'text-rose-400' : 'text-emerald-400'}`}>
              {isDecrease ? <TrendingDown className="w-3 h-3 mr-0.5" /> : <TrendingUp className="w-3 h-3 mr-0.5" />}
              {formatPercent(analysis.pctChange)}
            </span>
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            Q2: {formatCurrency(analysis.q2Revenue)} → Q3: {formatCurrency(analysis.q3Revenue)}
          </div>
        </div>

        <div className="p-3 rounded-xl bg-slate-800/40 border border-slate-700/50">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Key Product Drag</span>
            <span className="truncate max-w-[90px] font-medium text-slate-300">
              {analysis.productDrivers[0]?.name || 'N/A'}
            </span>
          </div>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-lg font-bold text-rose-300">
              {formatCurrency(analysis.productDrivers[0]?.diff || 0)}
            </span>
            <span className="text-xs text-rose-400 font-semibold">
              {analysis.productDrivers[0]?.pctChange.toFixed(1)}%
            </span>
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            Q2: {formatCurrency(analysis.productDrivers[0]?.q2Revenue || 0)} → Q3: {formatCurrency(analysis.productDrivers[0]?.q3Revenue || 0)}
          </div>
        </div>

        <div className="p-3 rounded-xl bg-slate-800/40 border border-slate-700/50">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Order Volume Shift</span>
            <span className="text-slate-300 font-medium">Units</span>
          </div>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-lg font-bold text-white">
              {analysis.unitsDiff > 0 ? `+${analysis.unitsDiff}` : analysis.unitsDiff} units
            </span>
            <span className={`text-xs font-semibold ${analysis.unitsDiff < 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
              {formatPercent(analysis.unitsPctChange)}
            </span>
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            {analysis.q2Units} units (Q2) vs {analysis.q3Units} units (Q3)
          </div>
        </div>

        <div className="p-3 rounded-xl bg-slate-800/40 border border-slate-700/50">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Discount Rate Shift</span>
            <span className="text-slate-300 font-medium">Avg %</span>
          </div>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-lg font-bold text-amber-300">
              {analysis.discountDiffPctPoints > 0 ? `+${analysis.discountDiffPctPoints.toFixed(2)}` : analysis.discountDiffPctPoints.toFixed(2)} pts
            </span>
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            {analysis.q2AvgDiscountPct.toFixed(1)}% (Q2) to {analysis.q3AvgDiscountPct.toFixed(1)}% (Q3)
          </div>
        </div>
      </div>
    </div>
  );
};
