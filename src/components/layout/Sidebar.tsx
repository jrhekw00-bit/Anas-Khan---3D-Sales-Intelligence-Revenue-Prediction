import React from 'react';
import {
  LayoutDashboard,
  BarChart3,
  BrainCircuit,
  TrendingUp,
  Package,
  Users,
  Database,
  Cpu,
  Settings,
  ChevronLeft,
  ChevronRight,
  Sun,
  Moon,
  Sparkles,
  FileSpreadsheet
} from 'lucide-react';
import { PageId } from '../../types';

interface SidebarProps {
  currentPage: PageId;
  onSelectPage: (page: PageId) => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
  isDemoData: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentPage,
  onSelectPage,
  isCollapsed,
  onToggleCollapse,
  isDarkMode,
  onToggleDarkMode,
  isDemoData
}) => {
  const navItems = [
    { id: 'overview' as PageId, label: 'Overview', icon: LayoutDashboard },
    { id: 'sales-analytics' as PageId, label: 'Sales Analytics', icon: BarChart3 },
    { id: 'prediction' as PageId, label: 'AI Prediction', icon: BrainCircuit },
    { id: 'forecasting' as PageId, label: 'Forecasting', icon: TrendingUp },
    { id: 'products' as PageId, label: 'Products', icon: Package },
    { id: 'customer-insights' as PageId, label: 'Customer Insights', icon: Users },
    { id: 'data-management' as PageId, label: 'Data Management', icon: Database },
    { id: 'model-performance' as PageId, label: 'Model Performance', icon: Cpu },
    { id: 'settings' as PageId, label: 'Settings', icon: Settings }
  ];

  return (
    <aside
      className={`relative flex flex-col justify-between shrink-0 transition-all duration-300 ease-in-out border-r border-white/10 bg-[#070b14]/95 select-none ${
        isCollapsed ? 'w-16' : 'w-64'
      }`}
    >
      {/* Top Header / Brand */}
      <div>
        <div className="flex items-center justify-between h-16 px-4 border-b border-white/10">
          {!isCollapsed && (
            <div className="flex items-center gap-2.5 overflow-hidden">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-cyan-500 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-cyan-500/20 shrink-0">
                <BrainCircuit className="w-5 h-5 text-white" />
              </div>
              <div className="truncate">
                <h1 className="text-sm font-bold tracking-tight text-white whitespace-nowrap">
                  Anas Khan
                </h1>
                <p className="text-[10px] text-slate-400 truncate">3D Sales Intelligence</p>
              </div>
            </div>
          )}

          {isCollapsed && (
            <div className="w-8 h-8 mx-auto rounded-lg bg-gradient-to-tr from-cyan-500 to-indigo-600 flex items-center justify-center text-white shadow-lg shrink-0">
              <BrainCircuit className="w-5 h-5" />
            </div>
          )}

          <button
            onClick={onToggleCollapse}
            className={`p-1.5 rounded-md text-slate-400 hover:text-white hover:bg-slate-800/60 transition-colors ${
              isCollapsed ? 'hidden' : 'block'
            }`}
            aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
        </div>

        {/* Dataset Status Banner */}
        <div className="px-3 py-2 border-b border-white/5">
          <div
            className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs ${
              isDemoData
                ? 'bg-amber-500/10 text-amber-300 border border-amber-500/20'
                : 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/20'
            }`}
          >
            <FileSpreadsheet className="w-3.5 h-3.5 shrink-0" />
            {!isCollapsed && (
              <div className="truncate">
                <span className="font-semibold">{isDemoData ? 'Demo Dataset' : 'Custom Upload'}</span>
              </div>
            )}
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="p-2 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentPage === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onSelectPage(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                  isActive
                    ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                }`}
                title={isCollapsed ? item.label : undefined}
              >
                <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-cyan-400' : 'text-slate-400'}`} />
                {!isCollapsed && <span className="truncate">{item.label}</span>}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Bottom Area: User & Collapse Toggle */}
      <div className="p-3 border-t border-white/10 space-y-2">
        {/* Theme Toggle */}
        <button
          onClick={onToggleDarkMode}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs text-slate-400 hover:text-slate-200 hover:bg-slate-800/40 transition-colors"
          title={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
        >
          {isDarkMode ? (
            <Sun className="w-4 h-4 text-amber-400 shrink-0" />
          ) : (
            <Moon className="w-4 h-4 text-slate-400 shrink-0" />
          )}
          {!isCollapsed && <span>{isDarkMode ? 'Light Mode' : 'Dark Mode'}</span>}
        </button>

        {/* User Card */}
        <div className="flex items-center gap-3 px-2 py-2 rounded-lg bg-slate-900/50 border border-white/5">
          <div className="w-8 h-8 rounded-full bg-slate-800 border border-cyan-500/40 flex items-center justify-center text-xs font-bold text-cyan-300 shrink-0">
            AK
          </div>
          {!isCollapsed && (
            <div className="truncate text-left">
              <p className="text-xs font-semibold text-slate-200 truncate">Anas Khan</p>
              <p className="text-[10px] text-slate-400 truncate">Executive Lead</p>
            </div>
          )}
        </div>

        {/* Mobile / Small screen expand button */}
        {isCollapsed && (
          <button
            onClick={onToggleCollapse}
            className="w-full flex justify-center py-1 text-slate-400 hover:text-white"
            aria-label="Expand sidebar"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        )}
      </div>
    </aside>
  );
};
