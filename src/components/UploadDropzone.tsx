import React, { useState, useRef } from 'react';
import { UploadCloud, FileSpreadsheet, CheckCircle2, AlertCircle, RefreshCw, Sparkles, ShieldCheck } from 'lucide-react';
import { parseSalesCSV } from '../utils/salesAnalytics';
import { SalesOrder, DataCleaningAudit } from '../types';

interface UploadDropzoneProps {
  onDataLoaded: (orders: SalesOrder[], fileName: string, audit?: DataCleaningAudit) => void;
  isLoading: boolean;
  currentFileName: string | null;
  totalOrdersCount: number;
  audit: DataCleaningAudit | null;
  onOpenAudit: () => void;
}

export const UploadDropzone: React.FC<UploadDropzoneProps> = ({
  onDataLoaded,
  isLoading,
  currentFileName,
  totalOrdersCount,
  audit,
  onOpenAudit,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isFetchingSample, setIsFetchingSample] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileProcess = (file: File) => {
    if (!file.name.endsWith('.csv') && file.type !== 'text/csv' && file.type !== 'application/vnd.ms-excel') {
      setUploadError('Please upload a valid .csv file.');
      return;
    }

    setUploadError(null);
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      if (!text) {
        setUploadError('File is empty.');
        return;
      }
      const { orders, errors, audit: newAudit } = parseSalesCSV(text);
      if (errors.length > 0 && orders.length === 0) {
        setUploadError(errors.join(' '));
        return;
      }
      onDataLoaded(orders, file.name, newAudit);
    };
    reader.onerror = () => {
      setUploadError('Failed to read the file.');
    };
    reader.readAsText(file);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileProcess(e.dataTransfer.files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleSampleLoad = async () => {
    setIsFetchingSample(true);
    setUploadError(null);
    try {
      const res = await fetch('/api/sample-csv');
      if (!res.ok) throw new Error('Failed to fetch sample data');
      const csvText = await res.text();
      const { orders, errors, audit: newAudit } = parseSalesCSV(csvText);
      if (orders.length > 0) {
        onDataLoaded(orders, 'Lab_1_-_Regional_Sales__1__de1de499.csv', newAudit);
      } else {
        setUploadError(errors.join(' ') || 'Could not parse sample CSV.');
      }
    } catch (err: unknown) {
      setUploadError((err as Error).message || 'Failed to load sample dataset.');
    } finally {
      setIsFetchingSample(false);
    }
  };

  const regionFixCount = audit?.correctionsByColumn['region'] || 0;

  return (
    <div className="relative overflow-hidden bg-[#161426]/90 backdrop-blur-md rounded-2xl border border-white/[0.08] shadow-[0_8px_32px_rgba(0,0,0,0.36)] p-5 sm:p-6 transition-all hover:border-white/[0.12]">
      {/* Subtle top card glow */}
      <div className="absolute top-0 right-10 w-48 h-20 bg-violet-500/10 rounded-full blur-2xl pointer-events-none" />

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-white/[0.08]">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-violet-500/10 text-violet-400 rounded-xl border border-violet-500/20">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">Dataset Ingestion &amp; Hygiene</h2>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/25">
                  Clean Engine
                </span>
              </div>
              <p className="text-xs text-zinc-400 mt-0.5">
                Required schema: <code className="text-violet-300 bg-white/[0.06] px-1 py-0.5 rounded font-mono text-[11px]">quarter</code>,{' '}
                <code className="text-violet-300 bg-white/[0.06] px-1 py-0.5 rounded font-mono text-[11px]">region</code>,{' '}
                <code className="text-violet-300 bg-white/[0.06] px-1 py-0.5 rounded font-mono text-[11px]">channel</code>,{' '}
                <code className="text-violet-300 bg-white/[0.06] px-1 py-0.5 rounded font-mono text-[11px]">product</code>,{' '}
                <code className="text-violet-300 bg-white/[0.06] px-1 py-0.5 rounded font-mono text-[11px]">units</code>,{' '}
                <code className="text-violet-300 bg-white/[0.06] px-1 py-0.5 rounded font-mono text-[11px]">discount_pct</code>,{' '}
                <code className="text-violet-300 bg-white/[0.06] px-1 py-0.5 rounded font-mono text-[11px]">revenue</code>
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={handleSampleLoad}
            disabled={isFetchingSample || isLoading}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs sm:text-sm font-semibold text-violet-200 bg-violet-500/15 hover:bg-violet-500/25 rounded-xl border border-violet-500/30 transition-all cursor-pointer disabled:opacity-50"
          >
            {isFetchingSample ? (
              <RefreshCw className="w-4 h-4 animate-spin text-violet-300" />
            ) : (
              <Sparkles className="w-4 h-4 text-violet-400" />
            )}
            <span>Load Sample Data</span>
          </button>

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs sm:text-sm font-semibold text-white bg-gradient-to-r from-violet-600 via-indigo-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 rounded-xl shadow-lg shadow-violet-600/25 transition-all cursor-pointer hover:shadow-violet-600/40"
          >
            <UploadCloud className="w-4 h-4" />
            <span>Upload CSV</span>
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,text/csv"
            className="hidden"
            onChange={(e) => {
              if (e.target.files && e.target.files[0]) {
                handleFileProcess(e.target.files[0]);
              }
            }}
          />
        </div>
      </div>

      {/* Drag & Drop Area */}
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => fileInputRef.current?.click()}
        className={`mt-4 border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${
          isDragging
            ? 'border-violet-400 bg-violet-500/10 scale-[0.99]'
            : 'border-white/[0.12] hover:border-violet-500/40 hover:bg-white/[0.02]'
        }`}
      >
        <div className="flex flex-col items-center justify-center gap-2">
          <div className="w-12 h-12 rounded-2xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center text-violet-400 group-hover:scale-105 transition-transform shadow-inner">
            <UploadCloud className="w-6 h-6" />
          </div>
          <div>
            <span className="text-sm font-semibold text-zinc-100">
              Drop sales orders CSV here, or <span className="text-violet-400 underline decoration-violet-400/60">browse files</span>
            </span>
            <p className="text-xs text-zinc-400 mt-1">
              Automated data cleaning automatically standardizes variations (e.g., &quot;West&quot; &amp; &quot;west&quot;), trims rogue spaces, and parses values
            </p>
          </div>
        </div>
      </div>

      {/* Active dataset status indicator with Data Cleansing Callout */}
      {currentFileName && (
        <div className="mt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-4 py-3 bg-[#110f1e]/80 border border-white/[0.08] rounded-xl text-xs sm:text-sm">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="text-zinc-400">Active File:</span>
            <span className="font-semibold text-white truncate max-w-[240px] sm:max-w-xs md:max-w-md">
              {currentFileName}
            </span>
            <span className="text-zinc-500 font-mono">({totalOrdersCount.toLocaleString()} rows)</span>
          </div>

          <div className="flex items-center gap-2">
            {audit && audit.totalCorrectionsCount > 0 ? (
              <button
                type="button"
                onClick={onOpenAudit}
                className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 rounded-lg font-semibold text-xs transition-colors border border-emerald-500/30 cursor-pointer shadow-sm"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>
                  {audit.totalCorrectionsCount} Text {audit.totalCorrectionsCount === 1 ? 'Error' : 'Errors'} Cleaned
                  {regionFixCount > 0 ? ` (${regionFixCount} 'west' → 'West')` : ''}
                </span>
                <span className="underline ml-0.5 text-emerald-200">View Audit</span>
              </button>
            ) : (
              <span className="inline-flex items-center gap-1 text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 rounded-full font-medium text-xs">
                Zero Syntax Issues
              </span>
            )}
          </div>
        </div>
      )}

      {/* Upload Error notification */}
      {uploadError && (
        <div className="mt-3 flex items-start gap-2 p-3 bg-rose-500/15 border border-rose-500/30 rounded-xl text-xs sm:text-sm text-rose-300">
          <AlertCircle className="w-4 h-4 mt-0.5 shrink-0 text-rose-400" />
          <span>{uploadError}</span>
        </div>
      )}
    </div>
  );
};
