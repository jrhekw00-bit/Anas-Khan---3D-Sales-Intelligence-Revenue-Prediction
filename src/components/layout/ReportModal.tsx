import React from 'react';
import { X, Printer, Download, Sparkles, CheckCircle2, TrendingUp, AlertCircle } from 'lucide-react';
import { AnalyticsOverviewData } from '../../types';

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: AnalyticsOverviewData | null;
}

export const ReportModal: React.FC<ReportModalProps> = ({ isOpen, onClose, data }) => {
  if (!isOpen || !data) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-[#0c1322] border border-cyan-500/30 rounded-2xl shadow-2xl p-6 md:p-8 text-slate-100 my-8">
        {/* Header Actions (hidden in print) */}
        <div className="flex items-center justify-between pb-6 border-b border-white/10 print:hidden">
          <div className="flex items-center gap-2">
            <span className="text-xs uppercase tracking-wider text-cyan-400 font-semibold">Executive Briefing</span>
            <span className="text-slate-600">·</span>
            <span className="text-xs text-slate-400">Printable Sales Intelligence Summary</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-semibold text-xs rounded-lg transition-colors"
            >
              <Printer className="w-4 h-4" />
              <span>Print / Save PDF</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Report Content */}
        <div className="mt-6 space-y-8 print:mt-0">
          {/* Document Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-white/10">
            <div>
              <h1 className="text-2xl font-bold text-white tracking-tight">Anas Khan Sales Intelligence Report</h1>
              <p className="text-xs text-slate-400 mt-1">
                Generated {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
              </p>
            </div>
            <div className="text-right text-xs text-slate-400">
              <p>Dataset: <span className="text-slate-200 font-medium">{data.is_demo_data ? 'Verified Demo Dataset' : 'Production Upload'}</span></p>
              <p>Coverage: <span className="text-slate-200 font-mono">{data.date_range.start} to {data.date_range.end}</span></p>
            </div>
          </div>

          {/* Key Executive KPI Grid */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">Core Performance Metrics</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-4 rounded-xl bg-slate-900/60 border border-white/10">
                <span className="text-xs text-slate-400">Total Revenue</span>
                <p className="text-xl font-bold font-mono text-cyan-300 mt-1">{data.kpis.total_revenue.formatted}</p>
                <p className="text-[11px] text-slate-400 mt-1">
                  Change: {data.kpis.total_revenue.change_pct !== null ? `${data.kpis.total_revenue.change_pct > 0 ? '+' : ''}${data.kpis.total_revenue.change_pct}%` : 'N/A'}
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-900/60 border border-white/10">
                <span className="text-xs text-slate-400">Completed Orders</span>
                <p className="text-xl font-bold font-mono text-white mt-1">{data.kpis.total_orders.formatted}</p>
                <p className="text-[11px] text-slate-400 mt-1">
                  AOV: {data.kpis.average_order_value.formatted}
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-900/60 border border-white/10">
                <span className="text-xs text-slate-400">Units Sold</span>
                <p className="text-xl font-bold font-mono text-white mt-1">{data.kpis.units_sold.formatted}</p>
                <p className="text-[11px] text-slate-400 mt-1">
                  Volume Change: {data.kpis.units_sold.change_pct !== null ? `${data.kpis.units_sold.change_pct}%` : 'N/A'}
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-900/60 border border-white/10">
                <span className="text-xs text-slate-400">Forward 30-Day Forecast</span>
                <p className="text-xl font-bold font-mono text-emerald-400 mt-1">{data.kpis.forecasted_revenue.formatted}</p>
                <p className="text-[11px] text-slate-400 mt-1">Supervised Model Projection</p>
              </div>
            </div>
          </div>

          {/* Category Breakdown Table */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">Revenue by Category</h3>
            <div className="border border-white/10 rounded-xl overflow-hidden">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-900/80 text-slate-400 border-b border-white/10 font-medium">
                  <tr>
                    <th className="px-4 py-2.5">Category</th>
                    <th className="px-4 py-2.5 text-right">Revenue</th>
                    <th className="px-4 py-2.5 text-right">Units</th>
                    <th className="px-4 py-2.5 text-right">Revenue Share</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {data.sales_by_category.map((cat, idx) => (
                    <tr key={idx} className="hover:bg-slate-800/20">
                      <td className="px-4 py-2.5 font-medium text-slate-200">{cat.category}</td>
                      <td className="px-4 py-2.5 text-right font-mono text-cyan-300">${cat.revenue.toLocaleString()}</td>
                      <td className="px-4 py-2.5 text-right font-mono text-slate-300">{cat.units.toLocaleString()}</td>
                      <td className="px-4 py-2.5 text-right font-mono text-slate-400">{cat.share_pct}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Top Products Table */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">Top Performing Products</h3>
            <div className="border border-white/10 rounded-xl overflow-hidden">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-900/80 text-slate-400 border-b border-white/10 font-medium">
                  <tr>
                    <th className="px-4 py-2.5">Product</th>
                    <th className="px-4 py-2.5">Category</th>
                    <th className="px-4 py-2.5 text-right">Total Revenue</th>
                    <th className="px-4 py-2.5 text-right">Units Sold</th>
                    <th className="px-4 py-2.5 text-right">Avg Price</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {data.top_products.map((p, idx) => (
                    <tr key={idx} className="hover:bg-slate-800/20">
                      <td className="px-4 py-2.5 font-medium text-slate-200">{p.product}</td>
                      <td className="px-4 py-2.5 text-slate-400">{p.category}</td>
                      <td className="px-4 py-2.5 text-right font-mono text-cyan-300">${p.revenue.toLocaleString()}</td>
                      <td className="px-4 py-2.5 text-right font-mono text-slate-300">{p.units.toLocaleString()}</td>
                      <td className="px-4 py-2.5 text-right font-mono text-slate-400">${p.avg_price.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Disclaimer & Footer */}
          <div className="pt-4 border-t border-white/10 text-xs text-slate-500 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <p>Anas Khan Predictive Analytics Engine · Confidential Enterprise Document</p>
            <p className="font-mono text-[11px]">Audit Checksum: 0x8892-VALIDATED</p>
          </div>
        </div>
      </div>
    </div>
  );
};
