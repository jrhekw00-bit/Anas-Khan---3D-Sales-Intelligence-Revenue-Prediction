import React, { useState, useEffect, useCallback } from 'react';
import { PageId, AnalyticsOverviewData, ProductShare } from './types';
import { api } from './services/api';
import { Sidebar } from './components/layout/Sidebar';
import { TopBar } from './components/layout/TopBar';
import { ReportModal } from './components/layout/ReportModal';
import { OverviewPage } from './pages/OverviewPage';
import { SalesAnalyticsPage } from './pages/SalesAnalyticsPage';
import { PredictionPage } from './pages/PredictionPage';
import { ForecastingPage } from './pages/ForecastingPage';
import { ProductsPage } from './pages/ProductsPage';
import { CustomerInsightsPage } from './pages/CustomerInsightsPage';
import { DataManagementPage } from './pages/DataManagementPage';
import { ModelPerformancePage } from './pages/ModelPerformancePage';
import { SettingsPage } from './pages/SettingsPage';

export default function App() {
  const [currentPage, setCurrentPage] = useState<PageId>('overview');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [dateRange, setDateRange] = useState('30D');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  const [overviewData, setOverviewData] = useState<AnalyticsOverviewData | null>(null);
  const [products, setProducts] = useState<ProductShare[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isReportOpen, setIsReportOpen] = useState(false);

  // Fetch overview data
  const loadOverviewData = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await api.getOverviewAnalytics({
        category: selectedCategory !== 'all' ? selectedCategory : undefined
      });
      setOverviewData(data);

      const prodData = await api.getProductAnalytics({ search: searchQuery });
      setProducts(prodData.products);
      setCategories(prodData.categories);
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
    } finally {
      setIsLoading(false);
    }
  }, [selectedCategory, searchQuery]);

  useEffect(() => {
    loadOverviewData();
  }, [loadOverviewData]);

  const handleResetDemo = async () => {
    try {
      await api.resetToDemo();
      loadOverviewData();
    } catch (err) {
      console.error('Reset error:', err);
    }
  };

  return (
    <div className={`min-h-screen flex ${isDarkMode ? 'dark bg-[#070b14] text-slate-100' : 'bg-slate-50 text-slate-900'} font-sans`}>
      {/* Persistent Left Sidebar */}
      <Sidebar
        currentPage={currentPage}
        onSelectPage={(p) => setCurrentPage(p)}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        isDarkMode={isDarkMode}
        onToggleDarkMode={() => setIsDarkMode(!isDarkMode)}
        isDemoData={overviewData?.is_demo_data ?? true}
      />

      {/* Main Content Viewport */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Navigation Bar */}
        <TopBar
          currentPage={currentPage}
          dateRange={dateRange}
          onDateRangeChange={setDateRange}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          isDemoData={overviewData?.is_demo_data ?? true}
          onOpenReport={() => setIsReportOpen(true)}
        />

        {/* Dynamic Page Views */}
        <main className="flex-1 overflow-y-auto">
          {currentPage === 'overview' && (
            <OverviewPage
              data={overviewData}
              isLoading={isLoading}
              onRefresh={loadOverviewData}
              selectedCategory={selectedCategory}
              onSelectCategory={setSelectedCategory}
              onNavigateToPrediction={() => setCurrentPage('prediction')}
            />
          )}

          {currentPage === 'sales-analytics' && (
            <SalesAnalyticsPage
              data={overviewData}
              isLoading={isLoading}
            />
          )}

          {currentPage === 'prediction' && (
            <PredictionPage
              categories={categories.length > 0 ? categories : ['Cloud Services', 'AI Software', 'Cybersecurity', 'Business Apps', 'Developer Tools']}
              products={products.map((p) => ({
                product: p.product,
                category: p.category,
                avg_price: p.avg_price
              }))}
            />
          )}

          {currentPage === 'forecasting' && (
            <ForecastingPage />
          )}

          {currentPage === 'products' && (
            <ProductsPage
              products={products}
              categories={categories}
              isLoading={isLoading}
            />
          )}

          {currentPage === 'customer-insights' && (
            <CustomerInsightsPage
              overviewData={overviewData}
            />
          )}

          {currentPage === 'data-management' && (
            <DataManagementPage
              onDatasetUpdated={loadOverviewData}
              isDemoData={overviewData?.is_demo_data ?? true}
            />
          )}

          {currentPage === 'model-performance' && (
            <ModelPerformancePage />
          )}

          {currentPage === 'settings' && (
            <SettingsPage
              isDarkMode={isDarkMode}
              onToggleDarkMode={() => setIsDarkMode(!isDarkMode)}
              isDemoData={overviewData?.is_demo_data ?? true}
              onResetDemo={handleResetDemo}
            />
          )}
        </main>
      </div>

      {/* Printable Executive Report Modal */}
      <ReportModal
        isOpen={isReportOpen}
        onClose={() => setIsReportOpen(false)}
        data={overviewData}
      />
    </div>
  );
}
