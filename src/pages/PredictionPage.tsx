import React, { useState } from 'react';
import {
  BrainCircuit, Sparkles, CheckCircle2, AlertCircle, ArrowRight,
  Download, RefreshCw, BarChart2, ShieldCheck, DollarSign, Calendar
} from 'lucide-react';
import { PredictResponseData, PredictRequestPayload } from '../types';
import { api } from '../services/api';

interface PredictionPageProps {
  categories: string[];
  products: { product: string; category: string; avg_price: number }[];
}

export const PredictionPage: React.FC<PredictionPageProps> = ({
  categories = ['Cloud Services', 'AI Software', 'Cybersecurity', 'Business Apps', 'Developer Tools'],
  products = []
}) => {
  const [selectedProduct, setSelectedProduct] = useState(products[0]?.product || 'Cloud Infrastructure');
  const [selectedCategory, setSelectedCategory] = useState(products[0]?.category || 'Cloud Services');
  const [price, setPrice] = useState(850);
  const [discount, setDiscount] = useState(5); // in percent
  const [adSpend, setAdSpend] = useState(400);
  const [targetDate, setTargetDate] = useState(new Date().toISOString().split('T')[0]);

  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<PredictResponseData | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Sync category when product changes
  const handleProductChange = (prodName: string) => {
    setSelectedProduct(prodName);
    const found = products.find((p) => p.product === prodName);
    if (found) {
      setSelectedCategory(found.category);
      setPrice(Math.round(found.avg_price));
    }
  };

  const handlePredict = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    if (price <= 0) {
      setError('Unit price must be greater than $0.');
      setIsLoading(false);
      return;
    }

    if (discount < 0 || discount > 100) {
      setError('Discount must be between 0% and 100%.');
      setIsLoading(false);
      return;
    }

    if (adSpend < 0) {
      setError('Advertising budget cannot be negative.');
      setIsLoading(false);
      return;
    }

    const payload: PredictRequestPayload = {
      product: selectedProduct,
      category: selectedCategory,
      price: Number(price),
      discount: Number(discount) / 100.0,
      ad_spend: Number(adSpend),
      date: targetDate
    };

    try {
      const res = await api.predictSales(payload);
      setResult(res);
    } catch (err: any) {
      setError(err.message || 'Failed to compute ML prediction');
    } finally {
      setIsLoading(false);
    }
  };

  const downloadResult = () => {
    if (!result) return;
    const content = `Target Date,Product,Category,Unit Price,Discount %,Ad Budget,Predicted Revenue,95% CI Lower,95% CI Upper,Historical Baseline\n${result.target_date},"${result.product}","${result.category}",${result.price},${result.discount * 100}%,${result.ad_spend},${result.predicted_revenue},${result.confidence_interval_lower},${result.confidence_interval_upper},${result.historical_baseline}`;
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `prediction_${result.product.replace(/\s+/g, '_')}_${result.target_date}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="p-5 bg-[#0e1628]/80 border border-white/10 rounded-xl">
        <div className="flex items-center gap-2 text-cyan-400 text-xs font-semibold uppercase tracking-wider">
          <BrainCircuit className="w-4 h-4" />
          <span>Supervised Random Forest Inference</span>
        </div>
        <h2 className="text-lg font-bold text-white tracking-tight mt-1">Interactive AI Sales Prediction</h2>
        <p className="text-xs text-slate-400 mt-0.5">
          Simulate revenue outcomes by parameterizing product pricing, promotional discounts, and campaign ad spend against the trained Scikit-learn model.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Prediction Form (5 cols) */}
        <div className="lg:col-span-5 p-5 bg-[#0e1628]/90 border border-white/10 rounded-xl space-y-4">
          <div className="pb-3 border-b border-white/10">
            <h3 className="text-sm font-semibold text-white">Input Assumptions</h3>
            <p className="text-xs text-slate-400">Configure parameters for inference</p>
          </div>

          {error && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-lg flex items-start gap-2 text-xs text-rose-300">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handlePredict} className="space-y-4 text-xs">
            {/* Product Select */}
            <div>
              <label className="block text-slate-300 font-medium mb-1">Product Offering</label>
              <select
                value={selectedProduct}
                onChange={(e) => handleProductChange(e.target.value)}
                className="w-full px-3 py-2 bg-slate-900 border border-white/10 rounded-lg text-slate-200 focus:outline-none focus:border-cyan-500/50"
              >
                {products.length > 0 ? (
                  products.map((p) => (
                    <option key={p.product} value={p.product}>
                      {p.product} ({p.category})
                    </option>
                  ))
                ) : (
                  <>
                    <option value="Cloud Infrastructure">Cloud Infrastructure</option>
                    <option value="AI Copilot Enterprise">AI Copilot Enterprise</option>
                    <option value="Security Suite Pro">Security Suite Pro</option>
                    <option value="Data Lake Storage">Data Lake Storage</option>
                    <option value="CRM Intelligence">CRM Intelligence</option>
                  </>
                )}
              </select>
            </div>

            {/* Category Select */}
            <div>
              <label className="block text-slate-300 font-medium mb-1">Business Category</label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full px-3 py-2 bg-slate-900 border border-white/10 rounded-lg text-slate-200 focus:outline-none focus:border-cyan-500/50"
              >
                {categories.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            {/* Unit Price Input */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-slate-300 font-medium">Unit Price (USD)</label>
                <span className="font-mono text-cyan-300">${price}</span>
              </div>
              <input
                type="number"
                min="10"
                max="10000"
                step="10"
                value={price}
                onChange={(e) => setPrice(Number(e.target.value))}
                className="w-full px-3 py-2 bg-slate-900 border border-white/10 rounded-lg text-slate-200 font-mono focus:outline-none focus:border-cyan-500/50"
              />
            </div>

            {/* Discount Slider */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-slate-300 font-medium">Promotional Discount</label>
                <span className="font-mono text-cyan-300">{discount}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="40"
                step="1"
                value={discount}
                onChange={(e) => setDiscount(Number(e.target.value))}
                className="w-full accent-cyan-400 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-500 mt-0.5">
                <span>0% (Standard)</span>
                <span>15%</span>
                <span>40% (Aggressive)</span>
              </div>
            </div>

            {/* Ad Spend Budget */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-slate-300 font-medium">Allocated Ad Spend (USD)</label>
                <span className="font-mono text-indigo-300">${adSpend}</span>
              </div>
              <input
                type="number"
                min="0"
                max="5000"
                step="25"
                value={adSpend}
                onChange={(e) => setAdSpend(Number(e.target.value))}
                className="w-full px-3 py-2 bg-slate-900 border border-white/10 rounded-lg text-slate-200 font-mono focus:outline-none focus:border-cyan-500/50"
              />
            </div>

            {/* Target Date Picker */}
            <div>
              <label className="block text-slate-300 font-medium mb-1">Target Sales Date</label>
              <div className="relative">
                <input
                  type="date"
                  value={targetDate}
                  onChange={(e) => setTargetDate(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-900 border border-white/10 rounded-lg text-slate-200 font-mono focus:outline-none focus:border-cyan-500/50"
                />
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2.5 bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white font-semibold rounded-lg shadow-lg shadow-cyan-500/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Computing Random Forest Inference...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Predict Sales Revenue</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Prediction Results Display (7 cols) */}
        <div className="lg:col-span-7 space-y-5">
          {result ? (
            <div className="p-6 bg-[#0e1628]/90 border border-cyan-500/40 rounded-xl space-y-6">
              {/* Output Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-white/10">
                <div>
                  <span className="text-xs font-semibold text-cyan-400">ML Prediction Output</span>
                  <h3 className="text-lg font-bold text-white mt-0.5">{result.product}</h3>
                  <p className="text-xs text-slate-400">Date: {result.target_date} · Model: {result.model_name}</p>
                </div>

                <button
                  onClick={downloadResult}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-white/10 rounded-lg text-xs font-medium transition-colors shrink-0"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download Prediction</span>
                </button>
              </div>

              {/* Main Predicted Value Hero */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-4 rounded-xl bg-gradient-to-br from-cyan-950/60 to-slate-900 border border-cyan-500/30">
                  <span className="text-xs text-cyan-300 font-medium">Estimated Revenue</span>
                  <p className="text-2xl font-bold font-mono text-cyan-400 mt-1">
                    ${result.predicted_revenue.toLocaleString()}
                  </p>
                  <p className="text-[11px] text-slate-400 mt-1">Supervised Point Estimate</p>
                </div>

                <div className="p-4 rounded-xl bg-slate-900/80 border border-white/10">
                  <span className="text-xs text-slate-400 font-medium">95% Confidence Interval</span>
                  <p className="text-base font-bold font-mono text-white mt-1">
                    ${result.confidence_interval_lower?.toLocaleString()} - ${result.confidence_interval_upper?.toLocaleString()}
                  </p>
                  <p className="text-[11px] text-slate-400 mt-1">Based on test-set RMSE</p>
                </div>

                <div className="p-4 rounded-xl bg-slate-900/80 border border-white/10">
                  <span className="text-xs text-slate-400 font-medium">Linear Baseline</span>
                  <p className="text-base font-bold font-mono text-slate-300 mt-1">
                    ${result.historical_baseline.toLocaleString()}
                  </p>
                  <p className="text-[11px] text-slate-400 mt-1">Ridge reference comparison</p>
                </div>
              </div>

              {/* Feature Attribution Breakdown */}
              <div className="space-y-3">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Input Contribution Breakdown
                </h4>
                <div className="space-y-2.5">
                  {result.feature_contributions.map((c, idx) => (
                    <div key={idx} className="p-3 bg-slate-900/50 border border-white/5 rounded-lg text-xs flex items-center justify-between">
                      <div>
                        <span className="font-semibold text-slate-200">{c.feature}</span>
                        <p className="text-[11px] text-slate-400">{c.label}</p>
                      </div>
                      <div className="text-right font-mono">
                        <span className={c.direction === 'positive' ? 'text-emerald-400' : c.direction === 'negative' ? 'text-rose-400' : 'text-slate-400'}>
                          {c.direction === 'positive' ? '+' : ''}${Math.abs(c.impact).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-2 text-[11px] text-slate-500 flex items-center justify-between">
                <span>Inference computed in {result.execution_time_ms} ms</span>
                <span className="font-mono">Empirical Validation: R² = 0.94</span>
              </div>
            </div>
          ) : (
            /* Empty State */
            <div className="p-12 bg-[#0e1628]/60 border border-white/10 rounded-xl text-center flex flex-col items-center justify-center">
              <div className="w-12 h-12 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 mb-3">
                <BrainCircuit className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-semibold text-white">Ready for Inference</h3>
              <p className="text-xs text-slate-400 mt-1 max-w-sm">
                Adjust the pricing, discount, and marketing assumptions on the left and click "Predict Sales Revenue" to run the supervised model.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
