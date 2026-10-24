export interface KPICardData {
  value: number;
  formatted: string;
  change_pct: number | null;
  change_direction: 'positive' | 'negative' | 'neutral';
  baseline_value: number | null;
  sparkline: number[];
  tooltip: string;
}

export interface RevenueTimelinePoint {
  date: string;
  revenue: number;
  units: number;
  ad_spend: number;
}

export interface CategoryShare {
  category: string;
  revenue: number;
  units: number;
  share_pct: number;
}

export interface ProductShare {
  product: string;
  category: string;
  revenue: number;
  units: number;
  avg_price: number;
  avg_discount?: number;
  ad_spend?: number;
  share_pct?: number;
  margin_pct?: number;
}

export interface MonthlySeasonality {
  month: string;
  month_name: string;
  revenue: number;
  growth_pct: number | null;
}

export interface DiscountTier {
  tier: string;
  revenue: number;
}

export interface AnalyticsOverviewData {
  is_demo_data: boolean;
  date_range: {
    start: string;
    end: string;
  };
  kpis: {
    total_revenue: KPICardData;
    total_orders: KPICardData;
    units_sold: KPICardData;
    average_order_value: KPICardData;
    revenue_growth: KPICardData;
    forecasted_revenue: KPICardData;
  };
  revenue_timeline: RevenueTimelinePoint[];
  sales_by_category: CategoryShare[];
  sales_by_product: ProductShare[];
  monthly_seasonality: MonthlySeasonality[];
  top_products: ProductShare[];
  discount_distribution: DiscountTier[];
}

export interface PredictRequestPayload {
  product: string;
  category: string;
  price: number;
  discount: number;
  ad_spend: number;
  date: string;
  quantity?: number;
}

export interface FeatureContribution {
  feature: string;
  label: string;
  impact: number;
  direction: 'positive' | 'negative' | 'neutral';
}

export interface PredictResponseData {
  predicted_revenue: number;
  confidence_interval_lower: number | null;
  confidence_interval_upper: number | null;
  historical_baseline: number;
  price: number;
  discount: number;
  ad_spend: number;
  product: string;
  category: string;
  target_date: string;
  feature_contributions: FeatureContribution[];
  execution_time_ms: number;
  model_name: string;
}

export interface ForecastPointData {
  date: string;
  forecast: number;
  lower_bound: number;
  upper_bound: number;
  baseline: number;
}

export interface ForecastResponseData {
  horizon_days: number;
  method_name: string;
  baseline_method: string;
  historical_actuals: {
    date: string;
    actual: number;
    quantity: number;
  }[];
  forecast_points: ForecastPointData[];
  metrics: {
    forecast_mae: number;
    baseline_mae: number;
    historical_std_error: number;
  };
  limitations: string[];
}

export interface ModelMetricsData {
  model_name: string;
  r2_score: number;
  mae: number;
  rmse: number;
  mape: number;
  train_samples: number;
  test_samples: number;
  train_test_split_date: string;
  feature_importances: {
    feature: string;
    raw_feature?: string;
    importance: number;
  }[];
  model_comparison: {
    model: string;
    r2: number;
    mae: number;
    rmse: number;
    mape: string;
    status: string;
  }[];
  limitations: string[];
}

export interface DataUploadSummaryData {
  success: boolean;
  filename: string;
  row_count: number;
  column_count: number;
  columns: string[];
  detected_types: Record<string, string>;
  missing_summary: Record<string, number>;
  duplicate_rows: number;
  invalid_dates_count: number;
  is_demo: boolean;
  preview_rows: Record<string, any>[];
  date_range: {
    start: string | null;
    end: string | null;
  };
}

export interface BusinessInsightItem {
  id: string;
  title: string;
  summary: string;
  category: 'Revenue' | 'Pricing' | 'Trend' | 'Anomaly' | 'Risk';
  impact_type: 'positive' | 'warning' | 'critical' | 'neutral';
  metric_delta?: string;
  recommendation: string;
}

export type PageId =
  | 'overview'
  | 'sales-analytics'
  | 'prediction'
  | 'forecasting'
  | 'products'
  | 'customer-insights'
  | 'data-management'
  | 'model-performance'
  | 'settings';
