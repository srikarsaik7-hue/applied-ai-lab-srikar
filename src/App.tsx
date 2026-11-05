/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  BarChart3,
  FileSpreadsheet,
  TrendingDown,
  Sparkles,
  Database,
  Layers,
  HelpCircle,
  ShieldCheck,
  RefreshCw,
  ExternalLink,
} from 'lucide-react';
import { UploadDropzone } from './components/UploadDropzone';
import { ExecutiveMetrics } from './components/ExecutiveMetrics';
import { AISummaryCard } from './components/AISummaryCard';
import { RevenueChart } from './components/RevenueChart';
import { RevenueTable } from './components/RevenueTable';
import { RegionalDrilldown } from './components/RegionalDrilldown';
import { RawOrdersDrawer } from './components/RawOrdersDrawer';
import { DataCleaningAuditModal } from './components/DataCleaningAuditModal';
import { SalesOrder, RegionSummary, VarianceAnalysis, AISummaryResponse, DataCleaningAudit } from './types';
import {
  parseSalesCSV,
  calculateRegionalAggregates,
  computeVarianceAnalysis,
} from './utils/salesAnalytics';

export default function App() {
  const [orders, setOrders] = useState<SalesOrder[]>([]);
  const [fileName, setFileName] = useState<string | null>(null);
  const [isLoadingFile, setIsLoadingFile] = useState<boolean>(true);
  const [selectedRegion, setSelectedRegion] = useState<string | null>(null);

  // Data Cleaning Audit
  const [audit, setAudit] = useState<DataCleaningAudit | null>(null);
  const [isAuditModalOpen, setIsAuditModalOpen] = useState<boolean>(false);

  // Aggregates & Variance
  const [regions, setRegions] = useState<RegionSummary[]>([]);
  const [quarters, setQuarters] = useState<string[]>([]);
  const [totalRevenue, setTotalRevenue] = useState<number>(0);
  const [totalUnits, setTotalUnits] = useState<number>(0);
  const [varianceAnalysis, setVarianceAnalysis] = useState<VarianceAnalysis | null>(null);

  // AI Summary State
  const [aiResponse, setAiResponse] = useState<AISummaryResponse | null>(null);
  const [isLoadingAI, setIsLoadingAI] = useState<boolean>(false);

  // Raw orders inspection drawer
  const [isDrawerOpen, setIsDrawerOpen] = useState<boolean>(false);

  // Function to call backend AI summary endpoint
  const fetchAISummary = useCallback(async (analysis: VarianceAnalysis) => {
    setIsLoadingAI(true);
    try {
      const res = await fetch('/api/generate-summary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(analysis),
      });

      if (!res.ok) {
        throw new Error(`Server returned ${res.status}`);
      }

      const data: AISummaryResponse = await res.json();
      setAiResponse(data);
    } catch (err: unknown) {
      console.warn('AI summary call failed, falling back to local calculation engine:', err);
      // Construct fallback summary immediately
      const fmt = (n: number) => `$${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
      const pDrop = analysis.productDrivers.find((p) => p.diff < 0);
      const cDrop = analysis.channelDrivers.find((c) => c.diff < 0);

      const s1 = `Between Q2 and Q3, the ${analysis.mostChangedRegion} region experienced the greatest variance, as revenue dropped by ${fmt(Math.abs(analysis.diff))} (${Math.abs(analysis.pctChange).toFixed(2)}%), shifting from ${fmt(analysis.q2Revenue)} in Q2 to ${fmt(analysis.q3Revenue)} in Q3.`;
      const s2 = pDrop
        ? `This downturn was primarily driven by product sales, where ${pDrop.name} revenue fell by ${fmt(Math.abs(pDrop.diff))} (from ${fmt(pDrop.q2Revenue)} to ${fmt(pDrop.q3Revenue)}).`
        : `This change was observed across regional product categories led by ${analysis.productDrivers[0]?.name || 'core items'}.`;
      const cVerb = cDrop && cDrop.diff < 0 ? 'contracted by' : 'grew by';
      const cText = cDrop
        ? `, while ${cDrop.name} channel revenue ${cVerb} ${fmt(Math.abs(cDrop.diff))} (from ${fmt(cDrop.q2Revenue)} to ${fmt(cDrop.q3Revenue)})`
        : '';
      const s3 = `From an operational perspective, sales volume contracted by ${Math.abs(analysis.unitsDiff)} units (from ${analysis.q2Units} to ${analysis.q3Units}) and the average discount rate rose by ${Math.abs(analysis.discountDiffPctPoints).toFixed(2)} percentage points (from ${analysis.q2AvgDiscountPct.toFixed(2)}% to ${analysis.q3AvgDiscountPct.toFixed(2)}%)${cText}.`;

      setAiResponse({
        summary: `${s1} ${s2} ${s3}`,
        source: 'calculated_engine',
      });
    } finally {
      setIsLoadingAI(false);
    }
  }, []);

  // Process loaded sales orders
  const handleDataLoaded = useCallback((newOrders: SalesOrder[], name: string, newAudit?: DataCleaningAudit) => {
    setOrders(newOrders);
    setFileName(name);
    if (newAudit) {
      setAudit(newAudit);
    }

    const { regions: newRegions, quarters: newQuarters, grandTotalRevenue, grandTotalUnits } =
      calculateRegionalAggregates(newOrders);

    setRegions(newRegions);
    setQuarters(newQuarters);
    setTotalRevenue(grandTotalRevenue);
    setTotalUnits(grandTotalUnits);

    const analysis = computeVarianceAnalysis(newOrders, newRegions);
    setVarianceAnalysis(analysis);

    if (analysis) {
      setSelectedRegion(analysis.mostChangedRegion);
      fetchAISummary(analysis);
    }
  }, [fetchAISummary]);

  // Initial load: Fetch the provided sample CSV automatically
  useEffect(() => {
    let isMounted = true;
    async function loadInitialData() {
      setIsLoadingFile(true);
      try {
        const res = await fetch('/api/sample-csv');
        if (res.ok) {
          const text = await res.text();
          if (isMounted) {
            const { orders: parsedOrders, audit: initialAudit } = parseSalesCSV(text);
            if (parsedOrders.length > 0) {
              handleDataLoaded(parsedOrders, 'Lab_1_-_Regional_Sales__1__de1de499.csv', initialAudit);
            }
          }
        }
      } catch (e) {
        console.error('Initial sample load failed:', e);
      } finally {
        if (isMounted) setIsLoadingFile(false);
      }
    }
    loadInitialData();

    return () => {
      isMounted = false;
    };
  }, [handleDataLoaded]);

  return (
    <div className="min-h-screen bg-slate-100/70 text-slate-900 font-sans antialiased flex flex-col selection:bg-indigo-500 selection:text-white">
      {/* Top Enterprise Header */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-2xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-violet-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
              <BarChart3 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
                  Regional Sales Intelligence
                </h1>
                <span className="hidden sm:inline-block text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                  Q1–Q3 Analytics
                </span>
              </div>
              <p className="text-xs text-slate-500 hidden sm:block">
                Automated text error reconciliation, regional quarterly pivots &amp; verified AI summaries
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            {audit && audit.totalCorrectionsCount > 0 && (
              <button
                type="button"
                onClick={() => setIsAuditModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200/80 rounded-xl transition-colors cursor-pointer shadow-2xs"
              >
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>
                  <strong className="font-bold">{audit.totalCorrectionsCount}</strong> Text Errors Cleaned
                </span>
              </button>
            )}

            {orders.length > 0 && (
              <button
                type="button"
                onClick={() => setIsDrawerOpen(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
              >
                <Database className="w-3.5 h-3.5 text-slate-500" />
                <span className="hidden xs:inline">Inspect</span> Records ({orders.length})
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6 sm:space-y-8">
        {/* 1. CSV Upload Dropzone & File Status */}
        <UploadDropzone
          onDataLoaded={handleDataLoaded}
          isLoading={isLoadingFile}
          currentFileName={fileName}
          totalOrdersCount={orders.length}
          audit={audit}
          onOpenAudit={() => setIsAuditModalOpen(true)}
        />

        {orders.length > 0 ? (
          <>
            {/* 2. Executive KPI Ribbon */}
            <ExecutiveMetrics
              totalRevenue={totalRevenue}
              totalUnits={totalUnits}
              ordersCount={orders.length}
              varianceAnalysis={varianceAnalysis}
              regions={regions}
            />

            {/* 3. The Requested AI 3-Sentence Summary Card */}
            <AISummaryCard
              analysis={varianceAnalysis}
              aiResponse={aiResponse}
              isLoadingAI={isLoadingAI}
              onRegenerate={() => {
                if (varianceAnalysis) {
                  fetchAISummary(varianceAnalysis);
                }
              }}
            />

            {/* 4. Chart & Table Grid */}
            <div className="space-y-6">
              {/* Total Revenue by Region and Quarter - Chart */}
              <RevenueChart
                regions={regions}
                quarters={quarters}
                mostChangedRegion={varianceAnalysis?.mostChangedRegion}
              />

              {/* Total Revenue by Region and Quarter - Table */}
              <RevenueTable
                regions={regions}
                varianceAnalysis={varianceAnalysis}
                onSelectRegion={(reg) => setSelectedRegion(reg)}
                selectedRegion={selectedRegion}
              />
            </div>

            {/* 5. Regional Drilldown Breakdown */}
            {selectedRegion && (
              <RegionalDrilldown
                selectedRegion={selectedRegion}
                orders={orders}
                summary={regions.find((r) => r.region === selectedRegion)}
              />
            )}
          </>
        ) : (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-sm">
            <FileSpreadsheet className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-base font-semibold text-slate-800">No Sales Data Loaded Yet</h3>
            <p className="text-sm text-slate-500 max-w-md mx-auto mt-1 mb-4">
              Upload your sales CSV with quarter, region, channel, product, units, discount_pct, and revenue
              columns, or click below to load the sample dataset.
            </p>
          </div>
        )}
      </main>

      {/* Raw Orders Inspection Drawer Modal */}
      <RawOrdersDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        orders={orders}
      />

      {/* Data Cleaning Audit Modal */}
      <DataCleaningAuditModal
        isOpen={isAuditModalOpen}
        onClose={() => setIsAuditModalOpen(false)}
        audit={audit}
        fileName={fileName}
      />

      {/* Footer */}
      <footer className="mt-auto border-t border-slate-200/80 bg-white py-5 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
            <span className="font-medium text-slate-700">Regional Sales Intelligence Engine</span>
            <span>—</span>
            <span>Ground-truth metrics, automatic human error cleaning &amp; Gemini 3.8 Flash</span>
          </div>
          <div className="flex items-center gap-4 text-slate-400">
            <span>Automated Cleaning: Region casing, extra spaces, channel variations &amp; product names</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
