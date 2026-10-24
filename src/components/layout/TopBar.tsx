import React, { useState } from 'react';
import {
  Search,
  Bell,
  Calendar,
  Download,
  Printer,
  X,
  CheckCircle2,
  AlertTriangle,
  Info,
  Sparkles
} from 'lucide-react';
import { PageId } from '../../types';

interface TopBarProps {
  currentPage: PageId;
  dateRange: string;
  onDateRangeChange: (range: string) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  isDemoData: boolean;
  onOpenReport: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({
  currentPage,
  dateRange,
  onDateRangeChange,
  searchQuery,
  onSearchChange,
  isDemoData,
  onOpenReport
}) => {
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);

  const notifications = [
    {
      id: 'notif-1',
      type: 'warning',
      title: 'Discount Erosion Alert',
      time: '2h ago',
      desc: 'Discounts over 15% on Cloud Infrastructure show negative revenue correlation.'
    },
    {
      id: 'notif-2',
      type: 'info',
      title: 'Q4 Forecast Re-calculated',
      time: '5h ago',
      desc: '30-day chronological forecast updated with 95% confidence interval.'
    },
    {
      id: 'notif-3',
      type: 'success',
      title: 'Supervised ML Model Active',
      time: '1d ago',
      desc: 'Random Forest Regressor evaluated with R² = 0.94 on chronological test split.'
    }
  ];

  const pageTitles: Record<PageId, string> = {
    overview: 'Overview & Executive KPIs',
    'sales-analytics': 'Sales & Revenue Analytics',
    prediction: 'AI Supervised Sales Prediction',
    forecasting: 'Chronological Multi-Horizon Forecasting',
    products: 'Product Performance Matrix',
    'customer-insights': 'Customer & Segment Insights',
    'data-management': 'Dataset Upload & Field Mapping',
    'model-performance': 'ML Evaluation & Validation',
    settings: 'System Preferences & Settings'
  };

  return (
    <header className="relative z-30 flex items-center justify-between gap-4 h-16 px-6 border-b border-white/10 bg-[#070b14]/90 backdrop-blur-md">
      {/* Zone 1: Breadcrumb Title */}
      <div className="flex items-center gap-3 shrink-0">
        <h2 className="text-base font-semibold tracking-tight text-white whitespace-nowrap">
          {pageTitles[currentPage]}
        </h2>
      </div>

      {/* Zone 2: Search & Filter Controls */}
      <div className="flex items-center gap-3 max-w-xl w-full justify-end md:justify-center">
        {/* Search Input */}
        <div className="relative w-48 sm:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search products, metrics..."
            className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-900/60 border border-white/10 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/50 transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => onSearchChange('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>

        {/* Date Range Selector */}
        <div className="hidden sm:flex items-center gap-1 p-1 bg-slate-900/60 border border-white/10 rounded-lg text-xs">
          <Calendar className="w-3.5 h-3.5 text-slate-400 ml-1.5 mr-0.5" />
          {['7D', '30D', '90D', 'All'].map((range) => (
            <button
              key={range}
              onClick={() => onDateRangeChange(range)}
              className={`px-2.5 py-1 rounded text-xs font-medium whitespace-nowrap transition-colors ${
                dateRange === range
                  ? 'bg-cyan-500/20 text-cyan-300 font-semibold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {range}
            </button>
          ))}
        </div>
      </div>

      {/* Zone 3: Primary Actions & Notifications */}
      <div className="flex items-center gap-3 shrink-0">
        {/* Notifications Button */}
        <div className="relative">
          <button
            onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
            className="relative p-2 text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 rounded-lg border border-white/5 transition-colors"
            title="Notifications"
            aria-label="View notifications"
          >
            <Bell className="w-4 h-4" />
            <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-cyan-400 rounded-full" />
          </button>

          {/* Notifications Dropdown */}
          {isNotificationsOpen && (
            <div className="absolute right-0 mt-2 w-80 bg-[#0e1628] border border-cyan-500/30 rounded-xl shadow-2xl p-3 z-50">
              <div className="flex items-center justify-between pb-2 border-b border-white/10">
                <span className="text-xs font-semibold text-slate-200">System Notifications</span>
                <button
                  onClick={() => setIsNotificationsOpen(false)}
                  className="text-slate-400 hover:text-white"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="mt-2 space-y-2 max-h-64 overflow-y-auto">
                {notifications.map((n) => (
                  <div
                    key={n.id}
                    className="p-2.5 rounded-lg bg-slate-900/60 border border-white/5 text-xs space-y-1"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 font-medium text-slate-200">
                        {n.type === 'warning' ? (
                          <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                        ) : n.type === 'success' ? (
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        ) : (
                          <Info className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                        )}
                        <span>{n.title}</span>
                      </div>
                      <span className="text-[10px] text-slate-400">{n.time}</span>
                    </div>
                    <p className="text-[11px] text-slate-400">{n.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Export Report CTA */}
        <button
          onClick={onOpenReport}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white rounded-lg text-xs font-semibold shadow-md shadow-cyan-500/15 whitespace-nowrap transition-all"
        >
          <Printer className="w-3.5 h-3.5" />
          <span>Export Report</span>
        </button>
      </div>
    </header>
  );
};
