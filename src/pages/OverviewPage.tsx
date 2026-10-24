import React, { useState } from 'react';
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
  BarChart, Bar, PieChart, Pie, Cell, Legend, CartesianGrid
} from 'recharts';
import {
  DollarSign, ShoppingCart, Box, TrendingUp, Sparkles,
  ArrowUpRight, ArrowDownRight, Minus, HelpCircle, Download,
  Layers, Filter
} from 'lucide-react';
import { AnalyticsOverviewData, KPICardData } from '../types';
import { SalesHologram3D } from '../components/3d/SalesHologram3D';

interface OverviewPageProps {
  data: AnalyticsOverviewData | null;
  isLoading: boolean;
  onRefresh: () => void;
  selectedCategory: string;
  onSelectCategory: (cat: string) => void;
  onNavigateToPrediction: () => void;
}

const CATEGORY_COLORS = ['#06b6d4', '#6366f1', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6'];

export const OverviewPage: React.FC<OverviewPageProps> = ({
  data,
  isLoading,
  selectedCategory,
  onSelectCategory,
  onNavigateToPrediction
}) => {
  const [activeTab, setActiveTab] = useState<'timeline' | 'actual_vs_predicted'>('timeline');

  if (isLoading || !data) {
    return (
      <div className="p-8 space-y-6 animate-pulse">
        <div className="h-64 bg-slate-900/60 rounded-xl border border-white/10" />
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-28 bg-slate-900/60 rounded-xl border border-white/10" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="h-80 bg-slate-900/60 rounded-xl border border-white/10" />
          <div className="h-80 bg-slate-900/60 rounded-xl border border-white/10" />
        </div>
      </div>
    );
  }

  const kpis = data.kpis;

  const renderKPICard = (
    title: string,
    kpi: KPICardData,
    icon: React.ReactNode,
    prefix: string = ''
  ) => {
    const isPositive = kpi.change_direction === 'positive';
    const isNegative = kpi.change_direction === 'negative';

    return (
      <div className="relative p-4 rounded-xl bg-[#0e1628]/80 border border-white/10 hover:border-cyan-500/30 transition-all flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium truncate">{title}</span>
            <div className="p-1 rounded-md bg-slate-800/60 text-slate-300">
              {icon}
            </div>
          </div>

          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-xl font-bold font-mono tracking-tight text-white">
              {kpi.formatted}
            </span>
          </div>

          {/* Change compared to baseline */}
          <div className="mt-2 flex items-center gap-1.5 text-xs">
            {kpi.change_pct !== null ? (
              <span
                className={`inline-flex items-center gap-0.5 font-mono font-medium ${
                  isPositive ? 'text-emerald-400' : isNegative ? 'text-rose-400' : 'text-slate-400'
                }`}
              >
                {isPositive ? <ArrowUpRight className="w-3.5 h-3.5" /> : isNegative ? <ArrowDownRight className="w-3.5 h-3.5" /> : <Minus className="w-3.5 h-3.5" />}
                {isPositive ? '+' : ''}{kpi.change_pct}%
              </span>
            ) : (
              <span className="text-slate-500 font-mono">N/A baseline</span>
            )}
            <span className="text-slate-500 text-[11px] truncate">vs prior period</span>
          </div>
        </div>

        {/* Mini SVG Sparkline */}
        {kpi.sparkline && kpi.sparkline.length > 2 && (
          <div className="mt-3 h-6 w-full flex items-end gap-1">
            {(() => {
              const min = Math.min(...kpi.sparkline);
              const max = Math.max(...kpi.sparkline);
              const range = max - min || 1;
              return kpi.sparkline.map((val, idx) => {
                const heightPct = Math.max(15, Math.round(((val - min) / range) * 100));
                return (
                  <div
                    key={idx}
                    className="flex-1 rounded-t bg-cyan-500/25 hover:bg-cyan-400 transition-colors"
                    style={{ height: `${heightPct}%` }}
                    title={`${val}`}
                  />
                );
              });
            })()}
          </div>
        )}

        {/* Tooltip trigger */}
        <div className="mt-2 pt-2 border-t border-white/5 flex items-center justify-between text-[10px] text-slate-500">
          <span className="truncate">{kpi.tooltip}</span>
        </div>
      </div>
    );
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* 3D Holographic Header Visualizer */}
      <SalesHologram3D
        currentRevenue={kpis.total_revenue.value}
        growthPct={kpis.revenue_growth.change_pct}
      />

      {/* Category Segmented Quick Filter Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-2 bg-[#0e1628]/60 border border-white/10 rounded-xl">
        <div className="flex items-center gap-1.5 overflow-x-auto py-1">
          <span className="text-xs text-slate-400 px-2 flex items-center gap-1 shrink-0">
            <Filter className="w-3 h-3 text-cyan-400" /> Category:
          </span>
          <button
            onClick={() => onSelectCategory('all')}
            className={`px-3 py-1 text-xs font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 ${
              selectedCategory === 'all'
                ? 'bg-cyan-500/20 text-cyan-300 font-semibold border border-cyan-500/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            All Categories
          </button>
          {data.sales_by_category.map((cat) => (
            <button
              key={cat.category}
              onClick={() => onSelectCategory(cat.category)}
              className={`px-3 py-1 text-xs font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 ${
                selectedCategory.toLowerCase() === cat.category.toLowerCase()
                  ? 'bg-cyan-500/20 text-cyan-300 font-semibold border border-cyan-500/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {cat.category}
            </button>
          ))}
        </div>

        {/* AI Predict Action Shortcut */}
        <button
          onClick={onNavigateToPrediction}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-300 border border-indigo-500/30 rounded-lg text-xs font-semibold whitespace-nowrap transition-all"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Simulate Revenue AI</span>
        </button>
      </div>

      {/* KPI Cards Strip (6 animated cards) */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3.5">
        {renderKPICard('Total Revenue', kpis.total_revenue, <DollarSign className="w-4 h-4 text-cyan-400" />)}
        {renderKPICard('Total Orders', kpis.total_orders, <ShoppingCart className="w-4 h-4 text-indigo-400" />)}
        {renderKPICard('Units Sold', kpis.units_sold, <Box className="w-4 h-4 text-emerald-400" />)}
        {renderKPICard('Avg Order Value', kpis.average_order_value, <TrendingUp className="w-4 h-4 text-amber-400" />)}
        {renderKPICard('Revenue Growth', kpis.revenue_growth, <Sparkles className="w-4 h-4 text-pink-400" />)}
        {renderKPICard('Forecast (30D)', kpis.forecasted_revenue, <Layers className="w-4 h-4 text-teal-400" />)}
      </div>

      {/* Main Charts Row 1: Revenue Timeline & Category Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Timeline Chart (2 cols) */}
        <div className="lg:col-span-2 p-5 rounded-xl bg-[#0e1628]/80 border border-white/10 flex flex-col justify-between">
          <div className="flex items-center justify-between pb-3 border-b border-white/5">
            <div>
              <h3 className="text-sm font-semibold text-white">Revenue & Advertising Over Time</h3>
              <p className="text-xs text-slate-400">Daily gross revenue trajectory vs advertising spend</p>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-400 font-mono">
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-cyan-400 inline-block" /> Revenue</span>
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-indigo-400 inline-block" /> Ad Spend</span>
            </div>
          </div>

          <div className="h-72 w-full mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data.revenue_timeline} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="colorAd" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" opacity={0.5} />
                <XAxis dataKey="date" stroke="#64748b" tick={{ fontSize: 11 }} tickLine={false} />
                <YAxis stroke="#64748b" tick={{ fontSize: 11 }} tickLine={false} tickFormatter={(v) => `$${v >= 1000 ? `${(v/1000).toFixed(0)}k` : v}`} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '12px' }}
                  formatter={(val: any) => [`$${Number(val).toLocaleString()}`, '']}
                />
                <Area type="monotone" dataKey="revenue" stroke="#06b6d4" strokeWidth={2} fillOpacity={1} fill="url(#colorRev)" name="Revenue" />
                <Area type="monotone" dataKey="ad_spend" stroke="#6366f1" strokeWidth={1.5} fillOpacity={1} fill="url(#colorAd)" name="Ad Spend" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Category Share Donut Chart (1 col) */}
        <div className="p-5 rounded-xl bg-[#0e1628]/80 border border-white/10 flex flex-col justify-between">
          <div className="pb-3 border-b border-white/5">
            <h3 className="text-sm font-semibold text-white">Sales by Category</h3>
            <p className="text-xs text-slate-400">Proportional revenue distribution</p>
          </div>

          <div className="h-56 w-full mt-2">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data.sales_by_category}
                  dataKey="revenue"
                  nameKey="category"
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={80}
                  paddingAngle={3}
                >
                  {data.sales_by_category.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={CATEGORY_COLORS[index % CATEGORY_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '12px' }}
                  formatter={(val: any) => [`$${Number(val).toLocaleString()}`, 'Revenue']}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Clean Legend List */}
          <div className="space-y-1.5 mt-2 max-h-32 overflow-y-auto pr-1">
            {data.sales_by_category.map((cat, idx) => (
              <div key={cat.category} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 truncate">
                  <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: CATEGORY_COLORS[idx % CATEGORY_COLORS.length] }} />
                  <span className="text-slate-300 truncate">{cat.category}</span>
                </div>
                <span className="font-mono tabular-nums text-slate-400 shrink-0">{cat.share_pct}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Main Charts Row 2: Monthly Seasonality & Top Products */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Seasonality Bar Chart */}
        <div className="p-5 rounded-xl bg-[#0e1628]/80 border border-white/10">
          <div className="pb-3 border-b border-white/5">
            <h3 className="text-sm font-semibold text-white">Monthly Seasonality & Momentum</h3>
            <p className="text-xs text-slate-400">Aggregate sales volume grouped by fiscal month</p>
          </div>

          <div className="h-64 w-full mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.monthly_seasonality} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" opacity={0.5} />
                <XAxis dataKey="month_name" stroke="#64748b" tick={{ fontSize: 11 }} tickLine={false} />
                <YAxis stroke="#64748b" tick={{ fontSize: 11 }} tickLine={false} tickFormatter={(v) => `$${(v/1000).toFixed(0)}k`} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '12px' }}
                  formatter={(val: any) => [`$${Number(val).toLocaleString()}`, 'Monthly Gross']}
                />
                <Bar dataKey="revenue" fill="#38bdf8" radius={[4, 4, 0, 0]} name="Gross Revenue" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top Performing Products List */}
        <div className="p-5 rounded-xl bg-[#0e1628]/80 border border-white/10 flex flex-col justify-between">
          <div className="pb-3 border-b border-white/5 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-white">Top Performing Products</h3>
              <p className="text-xs text-slate-400">Ranked by realized net sales volume</p>
            </div>
            <span className="text-xs font-mono text-cyan-400 font-medium">Top 5 Portfolio</span>
          </div>

          <div className="mt-4 space-y-3.5">
            {data.top_products.map((p, idx) => {
              const maxRev = data.top_products[0]?.revenue || 1;
              const barWidth = Math.round((p.revenue / maxRev) * 100);
              return (
                <div key={p.product} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-slate-500 font-medium w-4">{idx + 1}.</span>
                      <span className="font-medium text-slate-200">{p.product}</span>
                      <span className="text-slate-500 text-[11px]">· {p.category}</span>
                    </div>
                    <span className="font-mono tabular-nums text-cyan-300 font-semibold">${p.revenue.toLocaleString()}</span>
                  </div>
                  <div className="w-full bg-slate-800/80 rounded-full h-1.5 overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-cyan-500 to-indigo-500 h-1.5 rounded-full"
                      style={{ width: `${barWidth}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between text-xs text-slate-400">
            <span>Historical demo records active</span>
            <span className="font-mono text-[11px] text-slate-500">Coverage: 90 days</span>
          </div>
        </div>
      </div>
    </div>
  );
};
