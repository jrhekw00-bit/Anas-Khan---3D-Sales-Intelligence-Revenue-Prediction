import React, { useState } from 'react';
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer,
  CartesianGrid, ScatterChart, Scatter, ZAxis
} from 'recharts';
import { Download, SlidersHorizontal, TrendingDown, TrendingUp, Percent, ArrowUpDown } from 'lucide-react';
import { AnalyticsOverviewData } from '../types';
import { api } from '../services/api';

interface SalesAnalyticsPageProps {
  data: AnalyticsOverviewData | null;
  isLoading: boolean;
}

export const SalesAnalyticsPage: React.FC<SalesAnalyticsPageProps> = ({ data, isLoading }) => {
  const [selectedMetric, setSelectedMetric] = useState<'revenue' | 'units' | 'ad_spend'>('revenue');
  const [sortAsc, setSortAsc] = useState(false);

  if (isLoading || !data) {
    return (
      <div className="p-8 space-y-6 animate-pulse">
        <div className="h-40 bg-slate-900/60 rounded-xl" />
        <div className="h-80 bg-slate-900/60 rounded-xl" />
      </div>
    );
  }

  // Price vs Volume Scatter data
  const scatterData = data.sales_by_product.map((p) => ({
    name: p.product,
    price: p.avg_price,
    units: p.units,
    revenue: p.revenue
  }));

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Page Header & Metric Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 bg-[#0e1628]/80 border border-white/10 rounded-xl">
        <div>
          <h2 className="text-lg font-bold text-white tracking-tight">Sales & Revenue Analytics</h2>
          <p className="text-xs text-slate-400 mt-0.5">Comprehensive price elasticity, discount distribution, and volume drivers</p>
        </div>

        <div className="flex items-center gap-3">
          {/* Metric Selector Tabs */}
          <div className="flex items-center gap-1 p-1 bg-slate-900/80 rounded-lg border border-white/10 text-xs">
            <button
              onClick={() => setSelectedMetric('revenue')}
              className={`px-3 py-1 rounded-md font-medium transition-colors ${
                selectedMetric === 'revenue' ? 'bg-cyan-500/20 text-cyan-300 font-semibold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Revenue
            </button>
            <button
              onClick={() => setSelectedMetric('units')}
              className={`px-3 py-1 rounded-md font-medium transition-colors ${
                selectedMetric === 'units' ? 'bg-cyan-500/20 text-cyan-300 font-semibold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Units
            </button>
            <button
              onClick={() => setSelectedMetric('ad_spend')}
              className={`px-3 py-1 rounded-md font-medium transition-colors ${
                selectedMetric === 'ad_spend' ? 'bg-cyan-500/20 text-cyan-300 font-semibold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Ad Spend
            </button>
          </div>

          {/* Export CSV button */}
          <a
            href={api.getExportUrl('analytics')}
            download="sales_analytics.csv"
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-white/10 rounded-lg text-xs font-medium transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </a>
        </div>
      </div>

      {/* Row 1: Price vs Volume Elasticity & Discount Tiers */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Price vs Volume Scatter Plot */}
        <div className="p-5 rounded-xl bg-[#0e1628]/80 border border-white/10">
          <div className="pb-3 border-b border-white/5">
            <h3 className="text-sm font-semibold text-white">Price vs Order Volume Elasticity</h3>
            <p className="text-xs text-slate-400">Unit sales volume plotted against average selling price</p>
          </div>

          <div className="h-64 w-full mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart margin={{ top: 10, right: 10, bottom: 10, left: -10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" opacity={0.5} />
                <XAxis
                  type="number"
                  dataKey="price"
                  name="Price"
                  stroke="#64748b"
                  tick={{ fontSize: 11 }}
                  tickFormatter={(v) => `$${v}`}
                  unit="$"
                />
                <YAxis
                  type="number"
                  dataKey="units"
                  name="Units Sold"
                  stroke="#64748b"
                  tick={{ fontSize: 11 }}
                  unit=" units"
                />
                <ZAxis type="number" dataKey="revenue" range={[60, 400]} name="Revenue" />
                <Tooltip
                  cursor={{ strokeDasharray: '3 3' }}
                  content={({ payload }) => {
                    if (!payload || !payload.length) return null;
                    const d = payload[0].payload;
                    return (
                      <div className="p-2.5 bg-slate-900 border border-slate-700 rounded-lg shadow-xl text-xs space-y-1">
                        <p className="font-semibold text-white">{d.name}</p>
                        <p className="text-cyan-300 font-mono">Price: ${d.price.toFixed(2)}</p>
                        <p className="text-slate-300 font-mono">Volume: {d.units} units</p>
                        <p className="text-emerald-400 font-mono">Revenue: ${d.revenue.toLocaleString()}</p>
                      </div>
                    );
                  }}
                />
                <Scatter name="Products" data={scatterData} fill="#06b6d4" />
              </ScatterChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Discount Tier Revenue Impact */}
        <div className="p-5 rounded-xl bg-[#0e1628]/80 border border-white/10">
          <div className="pb-3 border-b border-white/5">
            <h3 className="text-sm font-semibold text-white">Revenue by Promotional Discount Tier</h3>
            <p className="text-xs text-slate-400">Total gross revenue realized across discount brackets</p>
          </div>

          <div className="h-64 w-full mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.discount_distribution} margin={{ top: 10, right: 10, bottom: 0, left: -10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" opacity={0.5} />
                <XAxis dataKey="tier" stroke="#64748b" tick={{ fontSize: 11 }} tickLine={false} />
                <YAxis stroke="#64748b" tick={{ fontSize: 11 }} tickLine={false} tickFormatter={(v) => `$${(v/1000).toFixed(0)}k`} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '12px' }}
                  formatter={(val: any) => [`$${Number(val).toLocaleString()}`, 'Realized Revenue']}
                />
                <Bar dataKey="revenue" fill="#6366f1" radius={[4, 4, 0, 0]} name="Realized Revenue" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Product Analytics Detailed Table */}
      <div className="p-5 rounded-xl bg-[#0e1628]/80 border border-white/10">
        <div className="pb-3 border-b border-white/5 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-white">Product Level Sales Breakdown</h3>
            <p className="text-xs text-slate-400">Detailed metric comparison across entire catalog</p>
          </div>
          <button
            onClick={() => setSortAsc(!sortAsc)}
            className="flex items-center gap-1.5 px-2.5 py-1 text-xs text-slate-400 hover:text-slate-200 bg-slate-900 border border-white/10 rounded-lg"
          >
            <ArrowUpDown className="w-3.5 h-3.5" />
            <span>Sort {sortAsc ? 'Asc' : 'Desc'}</span>
          </button>
        </div>

        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-900/80 text-slate-400 border-b border-white/10 font-medium">
              <tr>
                <th className="px-4 py-3">Product Name</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3 text-right">Unit Price</th>
                <th className="px-4 py-3 text-right">Avg Discount</th>
                <th className="px-4 py-3 text-right">Units Sold</th>
                <th className="px-4 py-3 text-right">Gross Revenue</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {[...data.sales_by_product]
                .sort((a, b) => sortAsc ? a.revenue - b.revenue : b.revenue - a.revenue)
                .map((p) => (
                  <tr key={p.product} className="hover:bg-slate-800/30 transition-colors">
                    <td className="px-4 py-3 font-medium text-slate-200">{p.product}</td>
                    <td className="px-4 py-3 text-slate-400">{p.category}</td>
                    <td className="px-4 py-3 text-right font-mono text-slate-300">${p.avg_price.toFixed(2)}</td>
                    <td className="px-4 py-3 text-right font-mono text-slate-400">{p.avg_discount ?? 5}%</td>
                    <td className="px-4 py-3 text-right font-mono text-slate-300">{p.units.toLocaleString()}</td>
                    <td className="px-4 py-3 text-right font-mono text-cyan-300 font-semibold">${p.revenue.toLocaleString()}</td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
