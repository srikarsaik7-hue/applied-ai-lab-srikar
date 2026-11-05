import React, { useState } from 'react';
import { X, Search, Database, ShieldCheck, Sparkles } from 'lucide-react';
import { SalesOrder } from '../types';
import { formatCurrency } from '../utils/salesAnalytics';

interface RawOrdersDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  orders: SalesOrder[];
}

export const RawOrdersDrawer: React.FC<RawOrdersDrawerProps> = ({
  isOpen,
  onClose,
  orders,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedQuarter, setSelectedQuarter] = useState<string>('ALL');
  const [selectedRegion, setSelectedRegion] = useState<string>('ALL');
  const [onlyCleaned, setOnlyCleaned] = useState<boolean>(false);

  if (!isOpen) return null;

  const filteredOrders = orders.filter((o) => {
    const matchesQuarter = selectedQuarter === 'ALL' || o.quarter === selectedQuarter;
    const matchesRegion = selectedRegion === 'ALL' || o.region === selectedRegion;
    const matchesCleaned = !onlyCleaned || o.wasCleaned === true;
    const matchesSearch =
      searchTerm === '' ||
      (o.order_id && o.order_id.toLowerCase().includes(searchTerm.toLowerCase())) ||
      o.product.toLowerCase().includes(searchTerm.toLowerCase()) ||
      o.channel.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (o.sales_rep && o.sales_rep.toLowerCase().includes(searchTerm.toLowerCase()));

    return matchesQuarter && matchesRegion && matchesCleaned && matchesSearch;
  });

  const uniqueQuarters = Array.from(new Set(orders.map((o) => o.quarter))).sort();
  const uniqueRegions = Array.from(new Set(orders.map((o) => o.region))).sort();
  const cleanedCount = orders.filter((o) => o.wasCleaned).length;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/60 backdrop-blur-xs flex justify-end animate-in fade-in duration-200">
      <div className="w-full max-w-5xl bg-white h-full shadow-2xl flex flex-col border-l border-slate-200">
        {/* Header */}
        <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2.5">
            <span className="p-2 bg-blue-100 text-blue-700 rounded-xl">
              <Database className="w-5 h-5" />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-900">
                  Raw Sales Order Records
                </h3>
                {cleanedCount > 0 && (
                  <span className="text-[11px] font-semibold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full border border-emerald-200">
                    {cleanedCount} rows cleaned
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500">
                Showing {filteredOrders.length} of {orders.length} total rows
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200/60 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filters */}
        <div className="p-4 border-b border-slate-200 bg-white grid grid-cols-1 sm:grid-cols-4 gap-3">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search product, order, rep..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs sm:text-sm rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 font-medium">Quarter:</span>
            <select
              value={selectedQuarter}
              onChange={(e) => setSelectedQuarter(e.target.value)}
              className="flex-1 py-1.5 px-2 text-xs sm:text-sm rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
            >
              <option value="ALL">All Quarters</option>
              {uniqueQuarters.map((q) => (
                <option key={q} value={q}>{q}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 font-medium">Region:</span>
            <select
              value={selectedRegion}
              onChange={(e) => setSelectedRegion(e.target.value)}
              className="flex-1 py-1.5 px-2 text-xs sm:text-sm rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
            >
              <option value="ALL">All Regions</option>
              {uniqueRegions.map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center">
            <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={onlyCleaned}
                onChange={(e) => setOnlyCleaned(e.target.checked)}
                className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500"
              />
              <span className="font-semibold text-emerald-800">Only Cleaned Rows ({cleanedCount})</span>
            </label>
          </div>
        </div>

        {/* Records Table */}
        <div className="flex-1 overflow-auto p-4">
          <table className="w-full text-left text-xs border border-slate-200 rounded-lg overflow-hidden">
            <thead className="bg-slate-50 text-slate-600 font-semibold uppercase text-[10px] tracking-wider border-b border-slate-200 sticky top-0">
              <tr>
                <th className="py-2.5 px-3">Order ID</th>
                <th className="py-2.5 px-3">Quarter</th>
                <th className="py-2.5 px-3">Region</th>
                <th className="py-2.5 px-3">Channel</th>
                <th className="py-2.5 px-3">Product</th>
                <th className="py-2.5 px-3 text-right">Units</th>
                <th className="py-2.5 px-3 text-right">Disc %</th>
                <th className="py-2.5 px-3 text-right">Revenue</th>
                <th className="py-2.5 px-3 text-center">Data Hygiene</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono">
              {filteredOrders.slice(0, 300).map((ord, idx) => (
                <tr key={idx} className={`hover:bg-slate-50/80 ${ord.wasCleaned ? 'bg-emerald-50/20' : ''}`}>
                  <td className="py-2 px-3 text-slate-700 font-semibold">{ord.order_id}</td>
                  <td className="py-2 px-3">
                    <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-800 text-[10px] font-bold">
                      {ord.quarter}
                    </span>
                  </td>
                  <td className="py-2 px-3 text-slate-900 font-sans font-semibold">
                    {ord.region}
                  </td>
                  <td className="py-2 px-3 text-slate-600 font-sans">{ord.channel}</td>
                  <td className="py-2 px-3 text-slate-900 font-sans">{ord.product}</td>
                  <td className="py-2 px-3 text-right text-slate-700">{ord.units}</td>
                  <td className="py-2 px-3 text-right text-slate-600">{ord.discount_pct}%</td>
                  <td className="py-2 px-3 text-right font-bold text-slate-900">
                    {formatCurrency(ord.revenue)}
                  </td>
                  <td className="py-2 px-3 text-center">
                    {ord.wasCleaned ? (
                      <span
                        className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full"
                        title={ord.cleaningNotes?.join('; ')}
                      >
                        <ShieldCheck className="w-3 h-3 text-emerald-600" />
                        Cleaned
                      </span>
                    ) : (
                      <span className="text-[10px] text-slate-400 font-sans">Standard</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredOrders.length > 300 && (
            <p className="text-center text-xs text-slate-400 py-3 font-sans">
              Showing first 300 of {filteredOrders.length} records.
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
