import React, { useState } from 'react';
import { X, Search, Database } from 'lucide-react';
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
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/70 backdrop-blur-sm flex justify-end animate-in fade-in duration-200">
      <div className="w-full max-w-5xl bg-[#12101f] text-white h-full shadow-2xl flex flex-col border-l border-white/[0.1]">
        {/* Header */}
        <div className="p-5 border-b border-white/[0.08] flex items-center justify-between bg-[#161426]">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-violet-500/10 text-violet-400 rounded-xl border border-violet-500/20">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white">
                  Raw Sales Order Records
                </h3>
                {cleanedCount > 0 && (
                  <span className="text-[11px] font-semibold bg-emerald-500/15 text-emerald-300 px-2.5 py-0.5 rounded-full border border-emerald-500/30">
                    {cleanedCount} rows cleaned
                  </span>
                )}
              </div>
              <p className="text-xs text-zinc-400">
                Displaying {filteredOrders.length} of {orders.length.toLocaleString()} total verified records
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

        {/* Filters */}
        <div className="p-4 border-b border-white/[0.08] bg-[#141223] grid grid-cols-1 sm:grid-cols-4 gap-3">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
            <input
              type="text"
              placeholder="Search product, order, rep..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm rounded-xl bg-white/[0.05] border border-white/[0.1] text-white placeholder:text-zinc-500 focus:outline-hidden focus:border-violet-500 focus:ring-1 focus:ring-violet-500"
            />
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-zinc-400 font-medium">Quarter:</span>
            <select
              value={selectedQuarter}
              onChange={(e) => setSelectedQuarter(e.target.value)}
              className="flex-1 py-2 px-2.5 text-xs sm:text-sm rounded-xl bg-[#1a172c] border border-white/[0.1] text-zinc-200 focus:outline-hidden focus:border-violet-500"
            >
              <option value="ALL">All Quarters</option>
              {uniqueQuarters.map((q) => (
                <option key={q} value={q}>{q}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-zinc-400 font-medium">Region:</span>
            <select
              value={selectedRegion}
              onChange={(e) => setSelectedRegion(e.target.value)}
              className="flex-1 py-2 px-2.5 text-xs sm:text-sm rounded-xl bg-[#1a172c] border border-white/[0.1] text-zinc-200 focus:outline-hidden focus:border-violet-500"
            >
              <option value="ALL">All Territories</option>
              {uniqueRegions.map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center">
            <label className="flex items-center gap-2 cursor-pointer select-none text-xs text-zinc-300">
              <input
                type="checkbox"
                checked={onlyCleaned}
                onChange={(e) => setOnlyCleaned(e.target.checked)}
                className="w-4 h-4 rounded border-white/[0.2] bg-white/[0.05] text-violet-600 focus:ring-violet-500"
              />
              <span>Only Auto-Cleaned Rows</span>
            </label>
          </div>
        </div>

        {/* Table View */}
        <div className="flex-1 overflow-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="bg-[#161426] text-zinc-400 uppercase tracking-wider text-[11px] sticky top-0 z-10 border-b border-white/[0.08]">
              <tr>
                <th className="py-3 px-4">Order ID</th>
                <th className="py-3 px-4">Quarter</th>
                <th className="py-3 px-4">Region</th>
                <th className="py-3 px-4">Channel</th>
                <th className="py-3 px-4">Product</th>
                <th className="py-3 px-4 text-right">Units</th>
                <th className="py-3 px-4 text-right">Discount</th>
                <th className="py-3 px-4 text-right">Revenue</th>
                <th className="py-3 px-4 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04]">
              {filteredOrders.length > 0 ? (
                filteredOrders.map((o) => (
                  <tr key={o.order_id || `${o.quarter}-${o.region}-${Math.random()}`} className="hover:bg-white/[0.03] transition-colors">
                    <td className="py-2.5 px-4 font-mono text-zinc-300 text-xs">
                      {o.order_id || 'N/A'}
                    </td>
                    <td className="py-2.5 px-4 font-medium text-white">{o.quarter}</td>
                    <td className="py-2.5 px-4 font-medium text-white">{o.region}</td>
                    <td className="py-2.5 px-4 text-zinc-300">{o.channel}</td>
                    <td className="py-2.5 px-4 text-zinc-200">{o.product}</td>
                    <td className="py-2.5 px-4 text-right font-mono text-zinc-300">{o.units}</td>
                    <td className="py-2.5 px-4 text-right font-mono text-zinc-300">{o.discount_pct.toFixed(1)}%</td>
                    <td className="py-2.5 px-4 text-right font-mono font-semibold text-white">
                      {formatCurrency(o.revenue)}
                    </td>
                    <td className="py-2.5 px-4 text-center">
                      {o.wasCleaned ? (
                        <span className="text-[10px] font-semibold bg-emerald-500/15 text-emerald-300 px-2 py-0.5 rounded-full border border-emerald-500/30">
                          Cleaned
                        </span>
                      ) : (
                        <span className="text-[10px] text-zinc-500">Normal</span>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-zinc-500">
                    No matching records found for this filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
