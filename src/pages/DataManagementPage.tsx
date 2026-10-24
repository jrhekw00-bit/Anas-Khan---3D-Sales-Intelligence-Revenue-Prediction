import React, { useState, useRef } from 'react';
import {
  Upload, FileText, CheckCircle2, AlertTriangle, Download,
  RotateCcw, RefreshCw, Table, Info, AlertCircle
} from 'lucide-react';
import { DataUploadSummaryData } from '../types';
import { api } from '../services/api';

interface DataManagementPageProps {
  onDatasetUpdated: () => void;
  isDemoData: boolean;
}

export const DataManagementPage: React.FC<DataManagementPageProps> = ({
  onDatasetUpdated,
  isDemoData
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [summary, setSummary] = useState<DataUploadSummaryData | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleFile = async (file: File) => {
    if (!file.name.toLowerCase().endsWith('.csv')) {
      setErrorMessage('Only standard CSV (.csv) files are supported.');
      return;
    }

    setIsUploading(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const res = await api.uploadCSV(file);
      setSummary(res);
      setSuccessMessage(`Dataset "${file.name}" uploaded and validated successfully with ${res.row_count} records.`);
      onDatasetUpdated();
    } catch (err: any) {
      setErrorMessage(err.message || 'Error uploading and parsing CSV file.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleResetDemo = async () => {
    setIsUploading(true);
    setErrorMessage(null);
    try {
      await api.resetToDemo();
      setSummary(null);
      setSuccessMessage('Reset to realistic demo dataset.');
      onDatasetUpdated();
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to reset demo dataset.');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 bg-[#0e1628]/80 border border-white/10 rounded-xl">
        <div>
          <h2 className="text-lg font-bold text-white tracking-tight">Dataset Upload & Management</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Ingest real sales CSV datasets with automatic schema detection, validation audits, and column mapping
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Reset Demo Button */}
          <button
            onClick={handleResetDemo}
            disabled={isUploading || isDemoData}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-white/10 rounded-lg text-xs font-medium transition-colors disabled:opacity-40"
          >
            <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
            <span>Reset Demo Data</span>
          </button>

          {/* Download Cleaned CSV */}
          <a
            href={api.getCleanCSVDownloadUrl()}
            download="cleaned_sales_dataset.csv"
            className="flex items-center gap-1.5 px-3 py-1.5 bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40 rounded-lg text-xs font-semibold transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download Clean CSV</span>
          </a>
        </div>
      </div>

      {/* Messages */}
      {errorMessage && (
        <div className="p-4 bg-rose-500/10 border border-rose-500/30 rounded-xl flex items-center gap-2 text-xs text-rose-300">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {successMessage && (
        <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl flex items-center gap-2 text-xs text-emerald-300">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Drag & Drop Upload Zone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`relative p-8 border-2 border-dashed rounded-2xl text-center cursor-pointer transition-all flex flex-col items-center justify-center ${
          isDragging
            ? 'border-cyan-400 bg-cyan-950/20'
            : 'border-white/15 bg-[#0e1628]/60 hover:border-cyan-500/40 hover:bg-[#0e1628]/80'
        }`}
      >
        <input
          type="file"
          ref={fileInputRef}
          onChange={(e) => e.target.files && handleFile(e.target.files[0])}
          accept=".csv"
          className="hidden"
        />

        <div className="w-12 h-12 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 mb-3">
          {isUploading ? (
            <RefreshCw className="w-6 h-6 animate-spin" />
          ) : (
            <Upload className="w-6 h-6" />
          )}
        </div>

        <h3 className="text-sm font-semibold text-white">
          {isUploading ? 'Validating and Parsing CSV...' : 'Click to Upload or Drag and Drop CSV'}
        </h3>
        <p className="text-xs text-slate-400 mt-1 max-w-sm">
          Supports standard files up to 20MB with column mapping for Date, Product, Revenue, Price, Quantity, Discount, and Ad Spend.
        </p>

        <div className="mt-4 flex items-center gap-2 text-[11px] text-slate-500">
          <span>Private session</span>
          <span aria-hidden="true">·</span>
          <span>Never shared externally</span>
          <span aria-hidden="true">·</span>
          <span>Automatic type coercion</span>
        </div>
      </div>

      {/* Upload Validation Audit Card */}
      {summary && (
        <div className="p-5 bg-[#0e1628]/90 border border-cyan-500/30 rounded-xl space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-white/10">
            <div>
              <span className="text-xs font-semibold text-cyan-400">Dataset Validation Audit</span>
              <h3 className="text-base font-bold text-white mt-0.5">{summary.filename}</h3>
            </div>
            <div className="flex items-center gap-4 text-xs font-mono">
              <span className="text-slate-300">Total Rows: {summary.row_count.toLocaleString()}</span>
              <span className="text-slate-300">Columns: {summary.column_count}</span>
            </div>
          </div>

          {/* Validation Metrics Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="p-3 rounded-lg bg-slate-900 border border-white/10">
              <span className="text-slate-400">Date Range</span>
              <p className="text-sm font-bold font-mono text-white mt-1">
                {summary.date_range.start || 'N/A'} to {summary.date_range.end || 'N/A'}
              </p>
            </div>
            <div className="p-3 rounded-lg bg-slate-900 border border-white/10">
              <span className="text-slate-400">Duplicate Rows</span>
              <p className={`text-sm font-bold font-mono mt-1 ${summary.duplicate_rows > 0 ? 'text-amber-400' : 'text-emerald-400'}`}>
                {summary.duplicate_rows}
              </p>
            </div>
            <div className="p-3 rounded-lg bg-slate-900 border border-white/10">
              <span className="text-slate-400">Invalid Dates</span>
              <p className={`text-sm font-bold font-mono mt-1 ${summary.invalid_dates_count > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                {summary.invalid_dates_count}
              </p>
            </div>
            <div className="p-3 rounded-lg bg-slate-900 border border-white/10">
              <span className="text-slate-400">Model Readiness</span>
              <p className="text-sm font-bold font-mono text-emerald-400 mt-1">
                Retrained & Active
              </p>
            </div>
          </div>

          {/* Column Data Types & Missing Values Table */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
              Schema & Missing Value Audit
            </h4>
            <div className="border border-white/10 rounded-lg overflow-hidden">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-900/80 text-slate-400 border-b border-white/10 font-medium">
                  <tr>
                    <th className="px-4 py-2">Column Name</th>
                    <th className="px-4 py-2">Detected Type</th>
                    <th className="px-4 py-2 text-right">Missing Count</th>
                    <th className="px-4 py-2 text-right">Completeness</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {summary.columns.map((col) => {
                    const missing = summary.missing_summary[col] || 0;
                    const completeness = Math.round(((summary.row_count - missing) / summary.row_count) * 100);
                    return (
                      <tr key={col} className="hover:bg-slate-800/30">
                        <td className="px-4 py-2 font-medium text-slate-200">{col}</td>
                        <td className="px-4 py-2 text-slate-400 font-mono">{summary.detected_types[col]}</td>
                        <td className="px-4 py-2 text-right font-mono text-slate-300">{missing}</td>
                        <td className="px-4 py-2 text-right font-mono text-emerald-400">{completeness}%</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* First 5 Preview Rows */}
          {summary.preview_rows.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                Parsed Data Preview (First 5 Rows)
              </h4>
              <div className="border border-white/10 rounded-lg overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-900/80 text-slate-400 border-b border-white/10 font-medium">
                    <tr>
                      {summary.columns.map((c) => (
                        <th key={c} className="px-3 py-2 whitespace-nowrap">{c}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {summary.preview_rows.slice(0, 5).map((row, idx) => (
                      <tr key={idx} className="hover:bg-slate-800/30">
                        {summary.columns.map((c) => (
                          <td key={c} className="px-3 py-2 whitespace-nowrap font-mono text-slate-300">
                            {row[c] !== null && row[c] !== undefined ? String(row[c]) : '—'}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
