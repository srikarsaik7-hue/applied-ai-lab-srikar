import React, { useState } from 'react';
import { X, ShieldCheck, CheckCircle2, AlertTriangle, Filter, Search, ArrowRight, Sparkles, RefreshCw } from 'lucide-react';
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
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200">
      <div className="w-full max-w-4xl bg-white rounded-2xl shadow-2xl flex flex-col max-h-[90vh] border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shadow-xs">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-slate-900">
                  Data Cleaning &amp; Quality Audit
                </h3>
                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                  {audit.totalCorrectionsCount} {audit.totalCorrectionsCount === 1 ? 'Fix' : 'Fixes'} Applied
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Automatically detected and reconciled human text entry inconsistencies for <span className="font-semibold text-slate-700">{fileName || 'Dataset'}</span>
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-200/60 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Top Summary Metric Cards */}
        <div className="p-6 bg-slate-50/50 border-b border-slate-200 grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-3.5 bg-white rounded-xl border border-slate-200 shadow-2xs">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
              Total Repaired
            </span>
            <span className="text-2xl font-bold font-mono text-slate-900 mt-1 block">
              {audit.totalCorrectionsCount}
            </span>
            <span className="text-[11px] text-slate-400">Values standardized</span>
          </div>

          <div className="p-3.5 bg-white rounded-xl border border-slate-200 shadow-2xs">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
              Region Normalizations
            </span>
            <span className="text-2xl font-bold font-mono text-blue-600 mt-1 block">
              {audit.correctionsByColumn['region'] || 0}
            </span>
            <span className="text-[11px] text-slate-400">e.g. &quot;west&quot; → &quot;West&quot;</span>
          </div>

          <div className="p-3.5 bg-white rounded-xl border border-slate-200 shadow-2xs">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
              Product / Acronyms
            </span>
            <span className="text-2xl font-bold font-mono text-indigo-600 mt-1 block">
              {audit.correctionsByColumn['product'] || 0}
            </span>
            <span className="text-[11px] text-slate-400">XL/case preserved</span>
          </div>

          <div className="p-3.5 bg-white rounded-xl border border-slate-200 shadow-2xs">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
              Other Attributes
            </span>
            <span className="text-2xl font-bold font-mono text-emerald-600 mt-1 block">
              {(audit.correctionsByColumn['quarter'] || 0) + (audit.correctionsByColumn['channel'] || 0) + (audit.correctionsByColumn['unit_price'] || 0)}
            </span>
            <span className="text-[11px] text-slate-400">Channels, Qtr &amp; Prices</span>
          </div>
        </div>

        {/* Cleaning Rules Explanation */}
        <div className="px-6 py-3 bg-blue-50/60 border-b border-blue-100 text-xs text-blue-900 flex flex-wrap items-center gap-x-6 gap-y-1">
          <span className="font-bold flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5 text-blue-600" />
            Active Cleansing Safeguards:
          </span>
          <span>• Case Invariance (merges &quot;West&quot; and &quot;west&quot;)</span>
          <span>• Whitespace Stripping</span>
          <span>• Channel Canonicalization</span>
          <span>• Trademark Acronym Protection (XL)</span>
        </div>

        {/* Filter Controls */}
        <div className="p-4 border-b border-slate-200 bg-white flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search original text or order..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs sm:text-sm rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <span className="text-xs text-slate-500 font-medium">Filter Column:</span>
            <select
              value={filterColumn}
              onChange={(e) => setFilterColumn(e.target.value)}
              className="py-1.5 px-3 text-xs sm:text-sm rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-blue-500 bg-white cursor-pointer"
            >
              <option value="ALL">All Columns ({records.length})</option>
              {uniqueCols.map(c => (
                <option key={c} value={c}>
                  {c.toUpperCase()} ({records.filter(r => r.column === c).length})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Records Table */}
        <div className="flex-1 overflow-auto p-4 sm:p-6">
          {filteredRecords.length > 0 ? (
            <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 font-semibold uppercase text-[10px] tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-3">Row #</th>
                    <th className="py-2.5 px-3">Order ID</th>
                    <th className="py-2.5 px-3">Column</th>
                    <th className="py-2.5 px-3">Original Raw Value</th>
                    <th className="py-2.5 px-3">Cleaned Value</th>
                    <th className="py-2.5 px-3">Correction Rule</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono">
                  {filteredRecords.map((rec, i) => (
                    <tr key={i} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-2.5 px-3 text-slate-500 font-sans">Row {rec.rowNumber}</td>
                      <td className="py-2.5 px-3 text-slate-700 font-semibold">{rec.orderId}</td>
                      <td className="py-2.5 px-3 font-sans">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-700 border border-slate-200">
                          {rec.column}
                        </span>
                      </td>
                      <td className="py-2.5 px-3">
                        <span className="inline-flex items-center gap-1 font-mono text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200 line-through">
                          &quot;{rec.originalValue}&quot;
                        </span>
                      </td>
                      <td className="py-2.5 px-3">
                        <span className="inline-flex items-center gap-1 font-mono font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                          &quot;{rec.cleanedValue}&quot;
                        </span>
                      </td>
                      <td className="py-2.5 px-3 font-sans text-slate-600">
                        {rec.reason}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="py-12 text-center text-slate-400">
              <CheckCircle2 className="w-10 h-10 mx-auto mb-2 text-emerald-500" />
              <p className="font-semibold text-slate-700">No matching issues found</p>
              <p className="text-xs text-slate-500 mt-1">All data values adhere to canonical formatting rules.</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between text-xs text-slate-500">
          <span>
            Showing {filteredRecords.length} of {records.length} total corrections
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 font-medium text-white bg-slate-900 hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
          >
            Close Audit
          </button>
        </div>
      </div>
    </div>
  );
};
