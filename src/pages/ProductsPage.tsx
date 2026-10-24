import React, { useState } from 'react';
import {
  Search, ArrowUpDown, Filter, ChevronRight, X, DollarSign,
  Box, Percent, Sparkles, TrendingUp, Layers
} from 'lucide-react';
import { ProductShare } from '../types';

interface ProductsPageProps {
  products: ProductShare[];
  categories: string[];
  isLoading: boolean;
}

export const ProductsPage: React.FC<ProductsPageProps> = ({
  products = [],
  categories = [],
  isLoading
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'revenue' | 'units' | 'avg_price' | 'margin_pct'>('revenue');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [selectedProduct, setSelectedProduct] = useState<ProductShare | null>(null);

  // Filter & sort
  const filteredProducts = React.useMemo(() => {
    return products
      .filter((p) => {
        const matchesCategory = selectedCategory === 'all' || p.category.toLowerCase() === selectedCategory.toLowerCase();
        const matchesSearch = p.product.toLowerCase().includes(searchTerm.toLowerCase()) || p.category.toLowerCase().includes(searchTerm.toLowerCase());
        return matchesCategory && matchesSearch;
      })
      .sort((a, b) => {
        const aVal = a[sortBy] ?? 0;
        const bVal = b[sortBy] ?? 0;
        return sortOrder === 'desc' ? (bVal as number) - (aVal as number) : (aVal as number) - (bVal as number);
      });
  }, [products, selectedCategory, searchTerm, sortBy, sortOrder]);

  const toggleSort = (field: 'revenue' | 'units' | 'avg_price' | 'margin_pct') => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 bg-[#0e1628]/80 border border-white/10 rounded-xl">
        <div>
          <h2 className="text-lg font-bold text-white tracking-tight">Product Performance Matrix</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Unit sales, pricing elasticity, gross margin estimations, and catalog drilldowns
          </p>
        </div>

        {/* Search & Category Filter */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative w-48 sm:w-60">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search products..."
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-900 border border-white/10 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500/50"
            />
          </div>

          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3 py-1.5 text-xs bg-slate-900 border border-white/10 rounded-lg text-slate-200 focus:outline-none focus:border-cyan-500/50"
          >
            <option value="all">All Categories</option>
            {categories.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Product Catalog Table */}
      <div className="p-5 bg-[#0e1628]/90 border border-white/10 rounded-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-900/80 text-slate-400 border-b border-white/10 font-medium">
              <tr>
                <th className="px-4 py-3">Product Name</th>
                <th className="px-4 py-3">Category</th>
                <th
                  onClick={() => toggleSort('avg_price')}
                  className="px-4 py-3 text-right cursor-pointer hover:text-white"
                >
                  <div className="flex items-center justify-end gap-1">
                    <span>Average Selling Price</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-500" />
                  </div>
                </th>
                <th
                  onClick={() => toggleSort('units')}
                  className="px-4 py-3 text-right cursor-pointer hover:text-white"
                >
                  <div className="flex items-center justify-end gap-1">
                    <span>Units Sold</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-500" />
                  </div>
                </th>
                <th
                  onClick={() => toggleSort('margin_pct')}
                  className="px-4 py-3 text-right cursor-pointer hover:text-white"
                >
                  <div className="flex items-center justify-end gap-1">
                    <span>Est. Gross Margin</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-500" />
                  </div>
                </th>
                <th
                  onClick={() => toggleSort('revenue')}
                  className="px-4 py-3 text-right cursor-pointer hover:text-white"
                >
                  <div className="flex items-center justify-end gap-1">
                    <span>Gross Revenue</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-500" />
                  </div>
                </th>
                <th className="px-4 py-3 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredProducts.map((p) => (
                <tr
                  key={p.product}
                  onClick={() => setSelectedProduct(p)}
                  className="hover:bg-slate-800/40 cursor-pointer transition-colors"
                >
                  <td className="px-4 py-3.5 font-medium text-slate-200">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-cyan-400/80 shrink-0" />
                      <span>{p.product}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3.5 text-slate-400">{p.category}</td>
                  <td className="px-4 py-3.5 text-right font-mono text-slate-300">${p.avg_price.toFixed(2)}</td>
                  <td className="px-4 py-3.5 text-right font-mono text-slate-300">{p.units.toLocaleString()}</td>
                  <td className="px-4 py-3.5 text-right font-mono">
                    <span
                      className={`px-2 py-0.5 rounded text-[11px] font-semibold ${
                        (p.margin_pct ?? 45) >= 50
                          ? 'bg-emerald-500/15 text-emerald-400'
                          : (p.margin_pct ?? 45) >= 20
                          ? 'bg-cyan-500/15 text-cyan-400'
                          : 'bg-rose-500/15 text-rose-400'
                      }`}
                    >
                      {(p.margin_pct ?? 45).toFixed(1)}%
                    </span>
                  </td>
                  <td className="px-4 py-3.5 text-right font-mono text-cyan-300 font-bold">
                    ${p.revenue.toLocaleString()}
                  </td>
                  <td className="px-4 py-3.5 text-center text-slate-400 hover:text-cyan-400">
                    <ChevronRight className="w-4 h-4 mx-auto" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Product Detail Modal */}
      {selectedProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="relative w-full max-w-xl bg-[#0c1322] border border-cyan-500/40 rounded-2xl shadow-2xl p-6 text-slate-100 space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-white/10">
              <div>
                <span className="text-xs uppercase font-semibold text-cyan-400">Product Deep Dive</span>
                <h3 className="text-xl font-bold text-white mt-0.5">{selectedProduct.product}</h3>
                <p className="text-xs text-slate-400">{selectedProduct.category}</p>
              </div>
              <button
                onClick={() => setSelectedProduct(null)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3 rounded-lg bg-slate-900 border border-white/10">
                <span className="text-[11px] text-slate-400">Gross Revenue</span>
                <p className="text-base font-bold font-mono text-cyan-300 mt-0.5">
                  ${selectedProduct.revenue.toLocaleString()}
                </p>
              </div>
              <div className="p-3 rounded-lg bg-slate-900 border border-white/10">
                <span className="text-[11px] text-slate-400">Total Units</span>
                <p className="text-base font-bold font-mono text-white mt-0.5">
                  {selectedProduct.units.toLocaleString()}
                </p>
              </div>
              <div className="p-3 rounded-lg bg-slate-900 border border-white/10">
                <span className="text-[11px] text-slate-400">Average Price</span>
                <p className="text-base font-bold font-mono text-slate-200 mt-0.5">
                  ${selectedProduct.avg_price.toFixed(2)}
                </p>
              </div>
              <div className="p-3 rounded-lg bg-slate-900 border border-white/10">
                <span className="text-[11px] text-slate-400">Est. Margin</span>
                <p className="text-base font-bold font-mono text-emerald-400 mt-0.5">
                  {(selectedProduct.margin_pct ?? 48).toFixed(1)}%
                </p>
              </div>
            </div>

            <div className="p-4 bg-slate-900/60 rounded-xl border border-white/5 space-y-2 text-xs">
              <h4 className="font-semibold text-slate-200">Executive Performance Summary</h4>
              <p className="text-slate-400 leading-relaxed">
                {selectedProduct.product} contributes substantially to the {selectedProduct.category} category.
                Average realization price of ${selectedProduct.avg_price.toFixed(2)} indicates resilient pricing power.
                Demand volume correlates strongly with strategic mid-week promotion allocations.
              </p>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setSelectedProduct(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg transition-colors"
              >
                Close Drilldown
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
