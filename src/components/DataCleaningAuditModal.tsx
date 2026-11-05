import React, { useState } from 'react';
import { X, ShieldCheck, CheckCircle2, Search, ArrowRight } from 'lucide-react';
import { DataCleaningAudit } from '../types';

interface DataCleaningAuditModalProps {
  isOpen: boolean;
  onClose: () => void;
  audit: DataCleaningAudit | null;
  fileName: string | null;
}

export const DataCleaningAuditModal: React.FC<DataCleaningAuditModalProps> = ({
  isOpen,
  onClose,
  audit,
  fileName,
}) => {
  const [filterColumn, setFilterColumn] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  if (!isOpen || !audit) return null;

  const records = audit.records || [];
  const filteredRecords = records.filter(r => {
    const matchesCol = filterColumn === 'ALL' || r.column === filterColumn;
    const matchesSearch =
      searchQuery === '' ||
      r.originalValue.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.cleanedValue.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.orderId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.reason.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesCol && matchesSearch;
  });

  const uniqueCols = Array.from(new Set(records.map(r => r.column))).sort();

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/75 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200">
      <div className="w-full max-w-4xl bg-[#131122] text-white rounded-2xl shadow-[0_20px_60px_rgba(0,0,0,0.6)] flex flex-col max-h-[90vh] border border-white/[0.1] overflow-hidden">
        {/* Header */}
        <div className="px-6 py-5 border-b border-white/[0.08] flex items-center justify-between bg-[#171427]">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center justify-center shadow-xs">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h3 className="text-lg font-bold text-white tracking-tight">
                  Data Cleaning &amp; Quality Audit
                </h3>
                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  {audit.totalCorrectionsCount} {audit.totalCorrectionsCount === 1 ? 'Fix' : 'Fixes'} Applied
                </span>
              </div>
              <p className="text-xs text-zinc-400 mt-0.5">
                Automatically detected and reconciled human text entry inconsistencies for <span className="font-semibold text-zinc-200">{fileName || 'Dataset'}</span>
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 text-zinc-400 hover:text-white rounded-xl hover:bg-white/[0.06] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Top Summary Metric Cards */}
        <div className="p-6 bg-[#0f0e1a] border-b border-white/[0.08] grid grid-cols-2 sm:grid-cols-4 gap-3.5">
          <div className="p-4 bg-[#18152b] rounded-xl border border-white/[0.08] shadow-sm">
            <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider block">
              Total Repaired
            </span>
            <span className="text-2xl font-bold font-mono text-white mt-1 block">
              {audit.totalCorrectionsCount}
            </span>
            <span className="text-[11px] text-zinc-500">Values standardized</span>
          </div>

          <div className="p-4 bg-[#18152b] rounded-xl border border-white/[0.08] shadow-sm">
            <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider block">
              Region Normalizations
            </span>
            <span className="text-2xl font-bold font-mono text-violet-400 mt-1 block">
              {audit.correctionsByColumn['region'] || 0}
            </span>
            <span className="text-[11px] text-zinc-500">e.g. &quot;west&quot; → &quot;West&quot;</span>
          </div>

          <div className="p-4 bg-[#18152b] rounded-xl border border-white/[0.08] shadow-sm">
            <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider block">
              Product / Acronyms
            </span>
            <span className="text-2xl font-bold font-mono text-fuchsia-400 mt-1 block">
              {audit.correctionsByColumn['product'] || 0}
            </span>
            <span className="text-[11px] text-zinc-500">XL/case preserved</span>
          </div>

          <div className="p-4 bg-[#18152b] rounded-xl border border-white/[0.08] shadow-sm">
            <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider block">
              Channel Consistency
            </span>
            <span className="text-2xl font-bold font-mono text-emerald-400 mt-1 block">
              {audit.correctionsByColumn['channel'] || 0}
            </span>
            <span className="text-[11px] text-zinc-500">Retail &amp; Direct</span>
          </div>
        </div>

        {/* Filter Controls */}
        <div className="px-6 py-3.5 bg-[#141223] border-b border-white/[0.08] flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
            <input
              type="text"
              placeholder="Search by value or order ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs sm:text-sm rounded-xl bg-white/[0.05] border border-white/[0.1] text-white placeholder:text-zinc-500 focus:outline-hidden focus:border-violet-500"
            />
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-zinc-400 font-medium">Filter Column:</span>
            <select
              value={filterColumn}
              onChange={(e) => setFilterColumn(e.target.value)}
              className="py-1.5 px-3 text-xs sm:text-sm rounded-xl bg-[#1c1830] border border-white/[0.1] text-zinc-200 focus:outline-hidden focus:border-violet-500"
            >
              <option value="ALL">All Columns</option>
              {uniqueCols.map((col) => (
                <option key={col} value={col}>
                  {col} ({audit.correctionsByColumn[col] || 0})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Audit Log Table */}
        <div className="flex-1 overflow-y-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="bg-[#171427] text-zinc-400 uppercase tracking-wider text-[11px] sticky top-0 z-10 border-b border-white/[0.08]">
              <tr>
                <th className="py-3 px-5">Order ID</th>
                <th className="py-3 px-4">Column</th>
                <th className="py-3 px-4">Original Entry (Dirty)</th>
                <th className="py-3 px-4">Reconciled Value (Clean)</th>
                <th className="py-3 px-5">Transformation Rule</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04]">
              {filteredRecords.length > 0 ? (
                filteredRecords.map((r, i) => (
                  <tr key={i} className="hover:bg-white/[0.03] transition-colors">
                    <td className="py-2.5 px-5 font-mono text-zinc-400 text-xs">
                      {r.orderId}
                    </td>
                    <td className="py-2.5 px-4 font-semibold text-violet-300">
                      {r.column}
                    </td>
                    <td className="py-2.5 px-4">
                      <span className="bg-rose-500/15 text-rose-300 px-2 py-0.5 rounded-md font-mono border border-rose-500/25">
                        &quot;{r.originalValue}&quot;
                      </span>
                    </td>
                    <td className="py-2.5 px-4">
                      <div className="flex items-center gap-1.5">
                        <ArrowRight className="w-3.5 h-3.5 text-zinc-500" />
                        <span className="bg-emerald-500/15 text-emerald-300 px-2 py-0.5 rounded-md font-mono font-semibold border border-emerald-500/25">
                          &quot;{r.cleanedValue}&quot;
                        </span>
                      </div>
                    </td>
                    <td className="py-2.5 px-5 text-zinc-400 text-xs">
                      {r.reason}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-zinc-500">
                    No corrections match this filter query.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 bg-[#141223] border-t border-white/[0.08] flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-zinc-400">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>All numbers presented in reports reflect reconciled values</span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-semibold text-xs sm:text-sm rounded-xl shadow-md transition-all cursor-pointer"
          >
            Close Audit View
          </button>
        </div>
      </div>
    </div>
  );
};
