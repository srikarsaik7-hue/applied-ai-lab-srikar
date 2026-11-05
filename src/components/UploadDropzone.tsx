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
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-5 sm:p-6 transition-all hover:shadow-md">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 bg-blue-50 text-blue-600 rounded-lg">
              <FileSpreadsheet className="w-5 h-5" />
            </span>
            <h2 className="text-lg font-semibold text-slate-900">Dataset Ingestion &amp; Hygiene</h2>
            <span className="text-xs bg-emerald-50 text-emerald-700 font-medium px-2 py-0.5 rounded-full border border-emerald-200">
              Clean Text Engine Active
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Accepts CSV columns <code className="text-slate-700 bg-slate-100 px-1 py-0.5 rounded text-xs font-mono">quarter</code>,{' '}
            <code className="text-slate-700 bg-slate-100 px-1 py-0.5 rounded text-xs font-mono">region</code>,{' '}
            <code className="text-slate-700 bg-slate-100 px-1 py-0.5 rounded text-xs font-mono">channel</code>,{' '}
            <code className="text-slate-700 bg-slate-100 px-1 py-0.5 rounded text-xs font-mono">product</code>,{' '}
            <code className="text-slate-700 bg-slate-100 px-1 py-0.5 rounded text-xs font-mono">units</code>,{' '}
            <code className="text-slate-700 bg-slate-100 px-1 py-0.5 rounded text-xs font-mono">discount_pct</code>,{' '}
            <code className="text-slate-700 bg-slate-100 px-1 py-0.5 rounded text-xs font-mono">revenue</code>
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleSampleLoad}
            disabled={isFetchingSample || isLoading}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs sm:text-sm font-medium text-blue-700 bg-blue-50/80 hover:bg-blue-100 rounded-xl border border-blue-200/60 transition-colors shadow-2xs cursor-pointer disabled:opacity-50"
          >
            {isFetchingSample ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Sparkles className="w-4 h-4 text-blue-600" />
            )}
            Load Sample Dataset
          </button>

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs sm:text-sm font-medium text-white bg-slate-900 hover:bg-slate-800 rounded-xl shadow-xs transition-colors cursor-pointer"
          >
            <UploadCloud className="w-4 h-4" />
            Upload New CSV
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
        className={`mt-4 border-2 border-dashed rounded-xl p-5 sm:p-6 text-center cursor-pointer transition-all ${
          isDragging
            ? 'border-blue-500 bg-blue-50/50 scale-[0.99]'
            : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50/50'
        }`}
      >
        <div className="flex flex-col items-center justify-center gap-2">
          <div className="w-11 h-11 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 group-hover:scale-105 transition-transform">
            <UploadCloud className="w-5 h-5 text-slate-600" />
          </div>
          <div>
            <span className="text-sm font-semibold text-slate-800">
              Drop sales orders CSV here, or <span className="text-blue-600 underline">browse</span>
            </span>
            <p className="text-xs text-slate-400 mt-0.5">
              Automated data cleaning handles human errors: merges &quot;West&quot; &amp; &quot;west&quot;, trims rogue spaces, and standardizes formats
            </p>
          </div>
        </div>
      </div>

      {/* Active dataset status indicator with Data Cleansing Callout */}
      {currentFileName && (
        <div className="mt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-4 py-3 bg-slate-50 border border-slate-200/80 rounded-xl text-xs sm:text-sm">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="text-slate-600">Active File:</span>
            <span className="font-semibold text-slate-900 truncate max-w-[240px] sm:max-w-xs md:max-w-md">
              {currentFileName}
            </span>
            <span className="text-slate-400 font-mono">({totalOrdersCount.toLocaleString()} rows)</span>
          </div>

          <div className="flex items-center gap-2">
            {audit && audit.totalCorrectionsCount > 0 ? (
              <button
                type="button"
                onClick={onOpenAudit}
                className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-100/80 hover:bg-emerald-200 text-emerald-800 rounded-lg font-semibold text-xs transition-colors border border-emerald-300/80 cursor-pointer shadow-2xs"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-700" />
                <span>
                  {audit.totalCorrectionsCount} Human {audit.totalCorrectionsCount === 1 ? 'Error' : 'Errors'} Cleaned
                  {regionFixCount > 0 ? ` (${regionFixCount} 'west' → 'West')` : ''}
                </span>
                <span className="underline ml-0.5 text-emerald-900">View Audit</span>
              </button>
            ) : (
              <span className="inline-flex items-center gap-1 text-emerald-700 bg-emerald-100/60 px-2 py-0.5 rounded font-medium text-xs">
                Zero Syntax Issues
              </span>
            )}
          </div>
        </div>
      )}

      {/* Upload Error notification */}
      {uploadError && (
        <div className="mt-3 flex items-start gap-2 p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs sm:text-sm text-rose-700">
          <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
          <span>{uploadError}</span>
        </div>
      )}
    </div>
  );
};
