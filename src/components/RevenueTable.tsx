import React, { useState } from 'react';
import { Table, ArrowUpDown, ArrowUp, ArrowDown, Download, ChevronRight, ChevronDown, Check, TrendingDown, TrendingUp } from 'lucide-react';
import { RegionSummary, VarianceAnalysis } from '../types';
import { formatCurrency, formatPercent } from '../utils/salesAnalytics';

interface RevenueTableProps {
  regions: RegionSummary[];
  varianceAnalysis: VarianceAnalysis | null;
  onSelectRegion?: (region: string) => void;
  selectedRegion?: string | null;
}

type SortField = 'region' | 'q1' | 'q2' | 'q3' | 'total' | 'diff' | 'pct';

export const RevenueTable: React.FC<RevenueTableProps> = ({
  regions,
  varianceAnalysis,
  onSelectRegion,
  selectedRegion,
}) => {
  const [sortField, setSortField] = useState<SortField>('total');
  const [sortAsc, setSortAsc] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);

  if (!regions || regions.length === 0) return null;

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(false);
    }
  };

  const sortedRegions = [...regions].sort((a, b) => {
    let diff = 0;
    switch (sortField) {
      case 'region':
        diff = a.region.localeCompare(b.region);
        break;
      case 'q1':
        diff = a.q1Revenue - b.q1Revenue;
        break;
      case 'q2':
        diff = a.q2Revenue - b.q2Revenue;
        break;
      case 'q3':
        diff = a.q3Revenue - b.q3Revenue;
        break;
      case 'total':
        diff = a.totalRevenue - b.totalRevenue;
        break;
      case 'diff':
        diff = a.q2ToQ3Diff - b.q2ToQ3Diff;
        break;
      case 'pct':
        diff = a.q2ToQ3PctChange - b.q2ToQ3PctChange;
        break;
    }
    return sortAsc ? diff : -diff;
  });

  // Calculate Totals Row
  const totalQ1 = regions.reduce((sum, r) => sum + r.q1Revenue, 0);
  const totalQ2 = regions.reduce((sum, r) => sum + r.q2Revenue, 0);
  const totalQ3 = regions.reduce((sum, r) => sum + r.q3Revenue, 0);
  const grandTotal = regions.reduce((sum, r) => sum + r.totalRevenue, 0);
  const totalDiff = totalQ3 - totalQ2;
  const totalPctChange = totalQ2 > 0 ? (totalDiff / totalQ2) * 100 : 0;

  // Export Table as CSV
  const handleExportCSV = () => {
    const headers = ['Region', 'Q1 Revenue', 'Q2 Revenue', 'Q3 Revenue', 'Total Revenue', 'Q2 to Q3 Diff ($)', 'Q2 to Q3 Change (%)'];
    const rows = regions.map(r => [
      r.region,
      r.q1Revenue.toFixed(2),
      r.q2Revenue.toFixed(2),
      r.q3Revenue.toFixed(2),
      r.totalRevenue.toFixed(2),
      r.q2ToQ3Diff.toFixed(2),
      r.q2ToQ3PctChange.toFixed(2) + '%',
    ]);
    rows.push([
      'Grand Total',
      totalQ1.toFixed(2),
      totalQ2.toFixed(2),
      totalQ3.toFixed(2),
      grandTotal.toFixed(2),
      totalDiff.toFixed(2),
      totalPctChange.toFixed(2) + '%',
    ]);

    const csvContent = [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'regional_sales_summary.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const renderSortIcon = (field: SortField) => {
    if (sortField !== field) {
      return <ArrowUpDown className="w-3.5 h-3.5 opacity-40 group-hover:opacity-100 transition-opacity" />;
    }
    return sortAsc ? (
      <ArrowUp className="w-3.5 h-3.5 text-blue-600 font-bold" />
    ) : (
      <ArrowDown className="w-3.5 h-3.5 text-blue-600 font-bold" />
    );
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-5 sm:p-6 transition-all hover:shadow-md">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 bg-blue-50 text-blue-600 rounded-lg">
              <Table className="w-5 h-5" />
            </span>
            <h3 className="text-base sm:text-lg font-bold text-slate-900">
              Regional Revenue Matrix
            </h3>
            <span className="text-xs bg-slate-100 text-slate-700 font-mono px-2 py-0.5 rounded-full">
              {regions.length} Regions Analyzed
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Full arithmetic reconciliation across Q1, Q2, and Q3 with Q2-to-Q3 variance metrics
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleExportCSV}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            Export Pivot CSV
          </button>
        </div>
      </div>

      {/* Responsive Table */}
      <div className="mt-4 overflow-x-auto rounded-xl border border-slate-200/70">
        <table className="w-full text-left text-xs sm:text-sm">
          <thead className="bg-slate-50/90 text-slate-600 font-semibold border-b border-slate-200 uppercase tracking-wider text-[11px]">
            <tr>
              <th
                onClick={() => handleSort('region')}
                className="py-3 px-4 cursor-pointer hover:bg-slate-100 transition-colors group select-none"
              >
                <div className="flex items-center gap-1.5">
                  <span>Region</span>
                  {renderSortIcon('region')}
                </div>
              </th>

              <th
                onClick={() => handleSort('q1')}
                className="py-3 px-4 text-right cursor-pointer hover:bg-slate-100 transition-colors group select-none"
              >
                <div className="flex items-center justify-end gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-indigo-500 inline-block" />
                  <span>Q1 Revenue</span>
                  {renderSortIcon('q1')}
                </div>
              </th>

              <th
                onClick={() => handleSort('q2')}
                className="py-3 px-4 text-right cursor-pointer hover:bg-slate-100 transition-colors group select-none"
              >
                <div className="flex items-center justify-end gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
                  <span>Q2 Revenue</span>
                  {renderSortIcon('q2')}
                </div>
              </th>

              <th
                onClick={() => handleSort('q3')}
                className="py-3 px-4 text-right cursor-pointer hover:bg-slate-100 transition-colors group select-none"
              >
                <div className="flex items-center justify-end gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-amber-500 inline-block" />
                  <span>Q3 Revenue</span>
                  {renderSortIcon('q3')}
                </div>
              </th>

              <th
                onClick={() => handleSort('total')}
                className="py-3 px-4 text-right cursor-pointer hover:bg-slate-100 transition-colors group select-none"
              >
                <div className="flex items-center justify-end gap-1.5">
                  <span>Total Revenue</span>
                  {renderSortIcon('total')}
                </div>
              </th>

              <th
                onClick={() => handleSort('diff')}
                className="py-3 px-4 text-right cursor-pointer hover:bg-slate-100 transition-colors group select-none"
              >
                <div className="flex items-center justify-end gap-1.5">
                  <span>Q2 → Q3 Δ ($)</span>
                  {renderSortIcon('diff')}
                </div>
              </th>

              <th
                onClick={() => handleSort('pct')}
                className="py-3 px-4 text-right cursor-pointer hover:bg-slate-100 transition-colors group select-none"
              >
                <div className="flex items-center justify-end gap-1.5">
                  <span>Q2 → Q3 Δ (%)</span>
                  {renderSortIcon('pct')}
                </div>
              </th>

              <th className="py-3 px-4 text-center select-none">
                Variance Status
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100 font-normal">
            {sortedRegions.map((row) => {
              const isMostChanged = row.region === varianceAnalysis?.mostChangedRegion;
              const isSelected = row.region === selectedRegion;
              const isDec = row.q2ToQ3Diff < 0;

              return (
                <tr
                  key={row.region}
                  onClick={() => onSelectRegion?.(row.region)}
                  className={`hover:bg-slate-50/80 transition-colors cursor-pointer ${
                    isSelected ? 'bg-blue-50/50 font-medium' : ''
                  } ${isMostChanged ? 'bg-rose-50/30' : ''}`}
                >
                  <td className="py-3.5 px-4 font-semibold text-slate-900 flex items-center gap-2">
                    <span>{row.region}</span>
                    {isMostChanged && (
                      <span className="text-[10px] font-bold tracking-tight text-rose-700 bg-rose-100 px-1.5 py-0.5 rounded border border-rose-200">
                        Max Change
                      </span>
                    )}
                  </td>

                  <td className="py-3.5 px-4 text-right font-mono text-slate-700">
                    {formatCurrency(row.q1Revenue)}
                  </td>

                  <td className="py-3.5 px-4 text-right font-mono text-slate-700">
                    {formatCurrency(row.q2Revenue)}
                  </td>

                  <td className="py-3.5 px-4 text-right font-mono text-slate-700">
                    {formatCurrency(row.q3Revenue)}
                  </td>

                  <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-900">
                    {formatCurrency(row.totalRevenue)}
                  </td>

                  <td
                    className={`py-3.5 px-4 text-right font-mono font-semibold ${
                      isDec ? 'text-rose-600' : 'text-emerald-600'
                    }`}
                  >
                    {row.q2ToQ3Diff > 0 ? `+${formatCurrency(row.q2ToQ3Diff)}` : formatCurrency(row.q2ToQ3Diff)}
                  </td>

                  <td
                    className={`py-3.5 px-4 text-right font-mono font-semibold ${
                      isDec ? 'text-rose-600' : 'text-emerald-600'
                    }`}
                  >
                    {formatPercent(row.q2ToQ3PctChange)}
                  </td>

                  <td className="py-3.5 px-4 text-center">
                    {isMostChanged ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-700 bg-rose-100/80 px-2 py-0.5 rounded-full">
                        <TrendingDown className="w-3 h-3" />
                        Largest Shift
                      </span>
                    ) : isDec ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-medium text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200/50">
                        <TrendingDown className="w-3 h-3" />
                        Contracted
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200/50">
                        <TrendingUp className="w-3 h-3" />
                        Grew
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>

          {/* Table Footer Totals */}
          <tfoot className="bg-slate-100/90 font-bold text-slate-900 border-t-2 border-slate-300">
            <tr>
              <td className="py-3.5 px-4 uppercase tracking-wider text-xs">Grand Total</td>
              <td className="py-3.5 px-4 text-right font-mono text-slate-800">{formatCurrency(totalQ1)}</td>
              <td className="py-3.5 px-4 text-right font-mono text-slate-800">{formatCurrency(totalQ2)}</td>
              <td className="py-3.5 px-4 text-right font-mono text-slate-800">{formatCurrency(totalQ3)}</td>
              <td className="py-3.5 px-4 text-right font-mono text-blue-900 font-extrabold">{formatCurrency(grandTotal)}</td>
              <td
                className={`py-3.5 px-4 text-right font-mono ${
                  totalDiff < 0 ? 'text-rose-700' : 'text-emerald-700'
                }`}
              >
                {totalDiff > 0 ? `+${formatCurrency(totalDiff)}` : formatCurrency(totalDiff)}
              </td>
              <td
                className={`py-3.5 px-4 text-right font-mono ${
                  totalDiff < 0 ? 'text-rose-700' : 'text-emerald-700'
                }`}
              >
                {formatPercent(totalPctChange)}
              </td>
              <td className="py-3.5 px-4 text-center text-xs font-semibold text-slate-500">
                All Territories
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
};
