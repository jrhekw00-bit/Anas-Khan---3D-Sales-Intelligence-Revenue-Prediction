from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field

class ColumnMapping(BaseModel):
    date_col: str = "Date"
    revenue_col: str = "Revenue"
    product_col: str = "Product"
    category_col: str = "Category"
    price_col: str = "Price"
    quantity_col: str = "Quantity"
    discount_col: str = "Discount"
    ad_spend_col: str = "Ad_Spend"

class DataUploadSummary(BaseModel):
    success: bool
    filename: str
    row_count: int
    column_count: int
    columns: List[str]
    detected_types: Dict[str, str]
    missing_summary: Dict[str, int]
    duplicate_rows: int
    invalid_dates_count: int
    is_demo: bool = False
    preview_rows: List[Dict[str, Any]]
    date_range: Dict[str, Optional[str]]

class KPICard(BaseModel):
    value: float
    formatted: str
    change_pct: Optional[float] = None
    change_direction: str = "neutral"  # positive, negative, neutral
    baseline_value: Optional[float] = None
    sparkline: List[float] = Field(default_factory=list)
    tooltip: str

class AnalyticsOverview(BaseModel):
    is_demo_data: bool
    date_range: Dict[str, str]
    kpis: Dict[str, KPICard]
    revenue_timeline: List[Dict[str, Any]]
    sales_by_category: List[Dict[str, Any]]
    sales_by_product: List[Dict[str, Any]]
    monthly_seasonality: List[Dict[str, Any]]
    top_products: List[Dict[str, Any]]
    discount_distribution: List[Dict[str, Any]]

class PredictRequest(BaseModel):
    product: str
    category: str
    price: float = Field(gt=0, description="Unit price in USD")
    discount: float = Field(ge=0.0, le=1.0, description="Discount decimal e.g. 0.10 for 10%")
    ad_spend: float = Field(ge=0.0, description="Advertising budget in USD")
    date: str = Field(description="Target date YYYY-MM-DD")
    quantity: Optional[float] = None

class FeatureContribution(BaseModel):
    feature: str
    label: str
    impact: float
    direction: str  # positive, negative

class PredictResponse(BaseModel):
    predicted_revenue: float
    confidence_interval_lower: Optional[float] = None
    confidence_interval_upper: Optional[float] = None
    historical_baseline: float
    price: float
    discount: float
    ad_spend: float
    product: str
    category: str
    target_date: str
    feature_contributions: List[FeatureContribution]
    execution_time_ms: float
    model_name: str

class ForecastRequest(BaseModel):
    horizon_days: int = Field(default=30, description="7, 30, or 90 days")
    interval: str = "daily"

class ForecastPoint(BaseModel):
    date: str
    forecast: float
    lower_bound: float
    upper_bound: float
    baseline: float

class ForecastResponse(BaseModel):
    horizon_days: int
    method_name: str
    baseline_method: str
    historical_actuals: List[Dict[str, Any]]
    forecast_points: List[ForecastPoint]
    metrics: Dict[str, float]
    limitations: List[str]

class ModelMetricsResponse(BaseModel):
    model_name: str
    r2_score: float
    mae: float
    rmse: float
    mape: float
    train_samples: int
    test_samples: int
    train_test_split_date: str
    feature_importances: List[Dict[str, Any]]
    model_comparison: List[Dict[str, Any]]
    limitations: List[str]

class BusinessInsight(BaseModel):
    id: str
    title: str
    summary: str
    category: str  # Revenue, Pricing, Trend, Anomaly, Risk
    impact_type: str  # positive, warning, critical, neutral
    metric_delta: Optional[str] = None
    recommendation: str
