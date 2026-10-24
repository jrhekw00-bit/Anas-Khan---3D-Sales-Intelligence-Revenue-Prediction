import React, { useState, useEffect } from 'react';
import {
  Cpu, CheckCircle2, AlertTriangle, Download, RefreshCw,
  BarChart3, Layers, ShieldCheck, HelpCircle
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  CartesianGrid
} from 'recharts';
import { ModelMetricsData } from '../types';
import { api } from '../services/api';

export const ModelPerformancePage: React.FC = () => {
  const [metrics, setMetrics] = useState<ModelMetricsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMetrics = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await api.getModelMetrics();
      setMetrics(res);
    } catch (err: any) {
      setError(err.message || 'Failed to load model evaluation metrics.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMetrics();
  }, []);

  const downloadMetricsJSON = () => {
    if (!metrics) return;
    const blob = new Blob([JSON.stringify(metrics, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `model_metrics_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (isLoading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[400px]">
        <RefreshCw className="w-8 h-8 text-cyan-400 animate-spin" />
      </div>
    );
  }

  if (error || !metrics) {
    return (
      <div className="p-6">
        <div className="p-4 bg-rose-500/10 border border-rose-500/30 rounded-xl text-xs text-rose-300">
          {error || 'Unable to load model metrics.'}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 bg-[#0e1628]/80 border border-white/10 rounded-xl">
        <div>
          <div className="flex items-center gap-2 text-cyan-400 text-xs font-semibold uppercase tracking-wider">
            <Cpu className="w-4 h-4" />
            <span>Empirical Validation & Evaluation</span>
          </div>
          <h2 className="text-lg font-bold text-white tracking-tight mt-1">{metrics.model_name}</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Supervised regression pipeline evaluated against a held-out chronological test dataset
          </p>
        </div>

        <button
          onClick={downloadMetricsJSON}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-white/10 rounded-lg text-xs font-medium transition-colors"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Download Audit Metrics</span>
        </button>
      </div>

      {/* Metric Cards (R², MAE, RMSE, MAPE) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-[#0e1628]/90 border border-cyan-500/30">
          <span className="text-xs text-slate-400 font-medium">Coefficient of Determination (R²)</span>
          <p className="text-2xl font-bold font-mono text-cyan-300 mt-1">
            {metrics.r2_score.toFixed(4)}
          </p>
          <p className="text-[11px] text-slate-400 mt-1">Evaluated on 20% chronological test split</p>
        </div>

        <div className="p-4 rounded-xl bg-[#0e1628]/90 border border-white/10">
          <span className="text-xs text-slate-400 font-medium">Mean Absolute Error (MAE)</span>
          <p className="text-2xl font-bold font-mono text-white mt-1">
            ${metrics.mae.toFixed(2)}
          </p>
          <p className="text-[11px] text-slate-400 mt-1">Average absolute dollar deviation</p>
        </div>

        <div className="p-4 rounded-xl bg-[#0e1628]/90 border border-white/10">
          <span className="text-xs text-slate-400 font-medium">Root Mean Squared Error (RMSE)</span>
          <p className="text-2xl font-bold font-mono text-indigo-300 mt-1">
            ${metrics.rmse.toFixed(2)}
          </p>
          <p className="text-[11px] text-slate-400 mt-1">Standard error of regression residuals</p>
        </div>

        <div className="p-4 rounded-xl bg-[#0e1628]/90 border border-white/10">
          <span className="text-xs text-slate-400 font-medium">Mean Absolute % Error (MAPE)</span>
          <p className="text-2xl font-bold font-mono text-emerald-400 mt-1">
            {metrics.mape.toFixed(1)}%
          </p>
          <p className="text-[11px] text-slate-400 mt-1">Relative percentage test error</p>
        </div>
      </div>

      {/* Row 2: Feature Importance Chart & Model Benchmark Table */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Feature Importances (7 cols) */}
        <div className="lg:col-span-7 p-5 bg-[#0e1628]/90 border border-white/10 rounded-xl space-y-4">
          <div className="pb-3 border-b border-white/10">
            <h3 className="text-sm font-semibold text-white">Feature Importance Attribution</h3>
            <p className="text-xs text-slate-400">Relative Gini-importance weights extracted from Random Forest trees</p>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={metrics.feature_importances}
                layout="vertical"
                margin={{ top: 5, right: 30, left: 40, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" horizontal={false} opacity={0.5} />
                <XAxis type="number" stroke="#64748b" tick={{ fontSize: 11 }} unit="%" />
                <YAxis dataKey="feature" type="category" stroke="#64748b" tick={{ fontSize: 10 }} width={110} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '12px' }}
                  formatter={(val: any) => [`${val}%`, 'Gini Importance']}
                />
                <Bar dataKey="importance" fill="#06b6d4" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Model Selection Benchmark (5 cols) */}
        <div className="lg:col-span-5 p-5 bg-[#0e1628]/90 border border-white/10 rounded-xl space-y-4 flex flex-col justify-between">
          <div className="pb-3 border-b border-white/10">
            <h3 className="text-sm font-semibold text-white">Model Selection Comparison</h3>
            <p className="text-xs text-slate-400">Validation benchmarks against baseline algorithms</p>
          </div>

          <div className="space-y-3">
            {metrics.model_comparison.map((m, idx) => (
              <div key={idx} className="p-3 bg-slate-900/60 border border-white/5 rounded-lg text-xs space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-200">{m.model}</span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                    m.status.includes('Production') ? 'bg-cyan-500/20 text-cyan-300' : 'bg-slate-800 text-slate-400'
                  }`}>
                    {m.status}
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-2 font-mono text-[11px] text-slate-400 pt-1">
                  <div>R²: <span className="text-slate-200 font-bold">{m.r2}</span></div>
                  <div>MAE: <span className="text-slate-200 font-bold">${m.mae}</span></div>
                  <div>MAPE: <span className="text-slate-200 font-bold">{m.mape}</span></div>
                </div>
              </div>
            ))}
          </div>

          <div className="pt-2 text-[11px] text-slate-500">
            Split Strategy: 80% Train ({metrics.train_samples} rows) / 20% Test ({metrics.test_samples} rows)
          </div>
        </div>
      </div>

      {/* Methodological Disclosure & Limitations Box */}
      <div className="p-5 bg-[#0e1628]/80 border border-white/10 rounded-xl space-y-3">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-cyan-400" />
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-300">
            Methodological Disclosures & Scientific Invariants
          </h3>
        </div>
        <ul className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs text-slate-400">
          {metrics.limitations.map((lim, idx) => (
            <li key={idx} className="flex items-start gap-2 bg-slate-900/40 p-2.5 rounded-lg border border-white/5">
              <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400 shrink-0 mt-0.5" />
              <span>{lim}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};
