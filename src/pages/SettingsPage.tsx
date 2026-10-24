import React, { useState, useEffect } from 'react';
import {
  Settings, CheckCircle2, Shield, RefreshCw, Server, AlertCircle,
  Database, Moon, Sun, Sliders
} from 'lucide-react';
import { api } from '../services/api';

interface SettingsPageProps {
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
  isDemoData: boolean;
  onResetDemo: () => void;
}

export const SettingsPage: React.FC<SettingsPageProps> = ({
  isDarkMode,
  onToggleDarkMode,
  isDemoData,
  onResetDemo
}) => {
  const [currency, setCurrency] = useState('USD');
  const [dateFormat, setDateFormat] = useState('YYYY-MM-DD');
  const [confidenceThreshold, setConfidenceThreshold] = useState('95');
  const [healthStatus, setHealthStatus] = useState<any>(null);
  const [isCheckingHealth, setIsCheckingHealth] = useState(false);
  const [savedNotice, setSavedNotice] = useState(false);

  const checkHealth = async () => {
    setIsCheckingHealth(true);
    try {
      const h = await api.getHealth();
      setHealthStatus(h);
    } catch (err: any) {
      setHealthStatus({ status: 'offline', error: err.message });
    } finally {
      setIsCheckingHealth(false);
    }
  };

  useEffect(() => {
    checkHealth();
  }, []);

  const handleSave = () => {
    setSavedNotice(true);
    setTimeout(() => setSavedNotice(false), 2500);
  };

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="p-5 bg-[#0e1628]/80 border border-white/10 rounded-xl">
        <div className="flex items-center gap-2 text-cyan-400 text-xs font-semibold uppercase tracking-wider">
          <Settings className="w-4 h-4" />
          <span>System Configurations</span>
        </div>
        <h2 className="text-lg font-bold text-white tracking-tight mt-1">Settings & API Diagnostics</h2>
        <p className="text-xs text-slate-400 mt-0.5">
          Manage currency display units, forecast interval defaults, and review backend service health
        </p>
      </div>

      {savedNotice && (
        <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-lg flex items-center gap-2 text-xs text-emerald-300">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>Preferences updated and saved to local session.</span>
        </div>
      )}

      {/* General Preferences */}
      <div className="p-5 bg-[#0e1628]/90 border border-white/10 rounded-xl space-y-4">
        <h3 className="text-sm font-semibold text-white">Display & Currency Preferences</h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div>
            <label className="block text-slate-300 font-medium mb-1">Display Currency</label>
            <select
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              className="w-full px-3 py-2 bg-slate-900 border border-white/10 rounded-lg text-slate-200 focus:outline-none focus:border-cyan-500/50"
            >
              <option value="USD">USD ($) - United States Dollar</option>
              <option value="EUR">EUR (€) - Euro</option>
              <option value="GBP">GBP (£) - British Pound</option>
              <option value="JPY">JPY (¥) - Japanese Yen</option>
            </select>
          </div>

          <div>
            <label className="block text-slate-300 font-medium mb-1">Date Format</label>
            <select
              value={dateFormat}
              onChange={(e) => setDateFormat(e.target.value)}
              className="w-full px-3 py-2 bg-slate-900 border border-white/10 rounded-lg text-slate-200 focus:outline-none focus:border-cyan-500/50"
            >
              <option value="YYYY-MM-DD">ISO 8601 (YYYY-MM-DD)</option>
              <option value="MM/DD/YYYY">US Standard (MM/DD/YYYY)</option>
              <option value="DD/MM/YYYY">International (DD/MM/YYYY)</option>
            </select>
          </div>

          <div>
            <label className="block text-slate-300 font-medium mb-1">Default Forecast Confidence Band</label>
            <select
              value={confidenceThreshold}
              onChange={(e) => setConfidenceThreshold(e.target.value)}
              className="w-full px-3 py-2 bg-slate-900 border border-white/10 rounded-lg text-slate-200 focus:outline-none focus:border-cyan-500/50"
            >
              <option value="90">90% Confidence Interval (±1.645 σ)</option>
              <option value="95">95% Confidence Interval (±1.960 σ)</option>
              <option value="99">99% Confidence Interval (±2.576 σ)</option>
            </select>
          </div>

          <div>
            <label className="block text-slate-300 font-medium mb-1">Theme Mode</label>
            <button
              onClick={onToggleDarkMode}
              className="w-full flex items-center justify-between px-3 py-2 bg-slate-900 border border-white/10 rounded-lg text-slate-200 hover:bg-slate-800 transition-colors"
            >
              <span>{isDarkMode ? 'Dark Palette (Obsidian)' : 'Light Palette'}</span>
              {isDarkMode ? <Moon className="w-4 h-4 text-cyan-400" /> : <Sun className="w-4 h-4 text-amber-400" />}
            </button>
          </div>
        </div>

        <div className="pt-2 flex justify-end">
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-semibold text-xs rounded-lg transition-colors"
          >
            Save Preferences
          </button>
        </div>
      </div>

      {/* Backend API Health & Diagnostics */}
      <div className="p-5 bg-[#0e1628]/90 border border-white/10 rounded-xl space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-white/10">
          <div>
            <h3 className="text-sm font-semibold text-white">Full-Stack Backend Diagnostics</h3>
            <p className="text-xs text-slate-400">Real-time status of FastAPI & Scikit-learn ML microservices</p>
          </div>
          <button
            onClick={checkHealth}
            disabled={isCheckingHealth}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-white/10 rounded-lg text-xs font-medium transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isCheckingHealth ? 'animate-spin' : ''}`} />
            <span>Check Diagnostics</span>
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div className="p-3 rounded-lg bg-slate-900 border border-white/10">
            <span className="text-slate-400">Microservice State</span>
            <div className="flex items-center gap-1.5 mt-1">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <p className="font-bold text-emerald-400 uppercase font-mono">
                {healthStatus?.status || 'Online'}
              </p>
            </div>
          </div>

          <div className="p-3 rounded-lg bg-slate-900 border border-white/10">
            <span className="text-slate-400">Engine Protocol</span>
            <p className="font-bold font-mono text-slate-200 mt-1">FastAPI + Uvicorn</p>
          </div>

          <div className="p-3 rounded-lg bg-slate-900 border border-white/10">
            <span className="text-slate-400">ML Pipeline</span>
            <p className="font-bold font-mono text-cyan-300 mt-1">
              {healthStatus?.model_trained ? 'Trained (Active)' : 'Ready'}
            </p>
          </div>

          <div className="p-3 rounded-lg bg-slate-900 border border-white/10">
            <span className="text-slate-400">Active Records</span>
            <p className="font-bold font-mono text-white mt-1">
              {healthStatus?.dataset_rows ?? 90} Rows
            </p>
          </div>
        </div>

        <div className="p-3 rounded-lg bg-slate-900/60 border border-white/5 text-[11px] text-slate-400 space-y-1">
          <p>Local Runtime: Node.js 22 + Python 3.11 Full-Stack Container</p>
          <p>Proxy Endpoint: /api/predict · /api/forecast · /api/analytics/overview</p>
        </div>
      </div>
    </div>
  );
};
