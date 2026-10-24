import io
import time
from typing import Optional
from fastapi import FastAPI, UploadFile, File, Form, HTTPException, Query, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, StreamingResponse
import pandas as pd

from app.schemas.models import (
    AnalyticsOverview, PredictRequest, PredictResponse,
    ForecastRequest, ForecastResponse, ModelMetricsResponse,
    DataUploadSummary, BusinessInsight
)
from app.services.data_service import data_service
from app.ml.pipeline import sales_ml_pipeline
from app.ml.forecaster import forecaster
from app.services.insights_service import insights_service

app = FastAPI(
    title="Anas Khan Sales Intelligence & Prediction API",
    description="Production-grade AI sales revenue prediction, chronological multi-horizon forecasting, and product analytics engine by Anas Khan.",
    version="1.0.0"
)

# CORS setup
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
def startup_event():
    # Ensure baseline model is trained on startup
    df = data_service.get_clean_dataframe()
    sales_ml_pipeline.train(df)

@app.get("/api/health", summary="API Health Check")
def get_health():
    return {
        "status": "healthy",
        "service": "Anas Khan Sales Intelligence Backend",
        "version": "1.0.0",
        "is_demo_data": data_service.is_demo_data,
        "dataset_rows": len(data_service.current_df) if data_service.current_df is not None else 0,
        "model_trained": sales_ml_pipeline.is_trained,
        "model_name": sales_ml_pipeline.metrics.get("model_name", "Random Forest Regressor")
    }

@app.post("/api/data/upload", summary="Upload and Validate CSV Dataset")
async def upload_csv(file: UploadFile = File(...)):
    if not file.filename.lower().endswith('.csv'):
        raise HTTPException(status_code=400, detail="Only CSV files (.csv) are supported.")
    
    contents = await file.read()
    if len(contents) > 20 * 1024 * 1024:  # 20MB limit
        raise HTTPException(status_code=400, detail="File size exceeds maximum 20MB limit.")

    try:
        content_str = contents.decode('utf-8', errors='replace')
        df, summary = data_service.parse_csv_content(content_str, file.filename)
        data_service.set_dataset(df, file.filename)
        
        # Retrain ML pipeline on new uploaded data
        clean_df = data_service.get_clean_dataframe()
        sales_ml_pipeline.train(clean_df)
        
        return summary
    except Exception as e:
        raise HTTPException(status_code=422, detail=f"CSV Validation Error: {str(e)}")

@app.post("/api/data/reset", summary="Reset Dataset to Demo Data")
def reset_demo():
    data_service.reset_to_demo()
    clean_df = data_service.get_clean_dataframe()
    sales_ml_pipeline.train(clean_df)
    return {
        "success": True,
        "message": "Reset to realistic demo dataset.",
        "row_count": len(clean_df)
    }

@app.get("/api/data/clean-csv", summary="Download Cleaned Standardized CSV")
def download_clean_csv():
    df = data_service.get_clean_dataframe()
    output = io.StringIO()
    df.to_csv(output, index=False)
    output.seek(0)
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename=cleaned_{data_service.filename}"}
    )

@app.get("/api/analytics/overview", response_model=AnalyticsOverview, summary="Dashboard Overview Analytics")
def get_overview(
    date_from: Optional[str] = Query(None, description="Start date YYYY-MM-DD"),
    date_to: Optional[str] = Query(None, description="End date YYYY-MM-DD"),
    category: Optional[str] = Query(None, description="Category filter or 'all'")
):
    try:
        return data_service.get_overview_analytics(date_from=date_from, date_to=date_to, category_filter=category)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Analytics calculation error: {str(e)}")

@app.get("/api/analytics/products", summary="Product Performance Analytics")
def get_product_analytics(
    sort_by: str = Query("revenue", description="revenue, units, price, margin"),
    search: Optional[str] = Query(None, description="Search query")
):
    df = data_service.get_clean_dataframe()
    if df.empty:
        return {"products": [], "categories": []}

    grouped = df.groupby(['Product', 'Category']).agg({
        'Revenue': 'sum',
        'Quantity': 'sum',
        'Price': 'mean',
        'Discount': 'mean',
        'Ad_Spend': 'sum'
    }).reset_index()

    total_rev = df['Revenue'].sum()
    grouped['share_pct'] = (grouped['Revenue'] / max(1, total_rev)) * 100.0
    # Estimated gross margin = (Revenue - (Price*0.35 * Quantity) - Ad_Spend) / Revenue
    grouped['est_cost'] = grouped['Price'] * 0.35 * grouped['Quantity'] + grouped['Ad_Spend']
    grouped['margin_pct'] = ((grouped['Revenue'] - grouped['est_cost']) / grouped['Revenue'].replace(0, 1)) * 100.0
    grouped['margin_pct'] = grouped['margin_pct'].clip(lower=-20.0, upper=85.0)

    if search:
        s = search.lower()
        grouped = grouped[grouped['Product'].str.lower().str.contains(s) | grouped['Category'].str.lower().str.contains(s)]

    # Sorting
    if sort_by == 'units':
        grouped = grouped.sort_values('Quantity', ascending=False)
    elif sort_by == 'price':
        grouped = grouped.sort_values('Price', ascending=False)
    elif sort_by == 'margin':
        grouped = grouped.sort_values('margin_pct', ascending=False)
    else:
        grouped = grouped.sort_values('Revenue', ascending=False)

    products = []
    for _, r in grouped.iterrows():
        products.append({
            "product": r['Product'],
            "category": r['Category'],
            "revenue": round(float(r['Revenue']), 2),
            "units": int(r['Quantity']),
            "avg_price": round(float(r['Price']), 2),
            "avg_discount": round(float(r['Discount']) * 100, 1),
            "ad_spend": round(float(r['Ad_Spend']), 2),
            "share_pct": round(float(r['share_pct']), 1),
            "margin_pct": round(float(r['margin_pct']), 1)
        })

    categories = sorted(list(df['Category'].dropna().unique()))
    return {"products": products, "categories": categories, "total_revenue": round(float(total_rev), 2)}

@app.post("/api/predict", response_model=PredictResponse, summary="Predict Sales Revenue via Supervised ML")
def predict_sales(req: PredictRequest):
    start_time = time.time()
    try:
        res = sales_ml_pipeline.predict(req.dict())
        res['execution_time_ms'] = round((time.time() - start_time) * 1000, 2)
        return PredictResponse(**res)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Prediction error: {str(e)}")

@app.post("/api/forecast", response_model=ForecastResponse, summary="Multi-Horizon Time-Series Forecast")
def forecast_sales(req: ForecastRequest):
    df = data_service.get_clean_dataframe()
    if req.horizon_days not in [7, 30, 90]:
        raise HTTPException(status_code=400, detail="Horizon must be 7, 30, or 90 days.")

    res = forecaster.generate_forecast(df, horizon_days=req.horizon_days)
    if "error" in res:
        raise HTTPException(status_code=400, detail=res["error"])

    return ForecastResponse(**res)

@app.get("/api/model/metrics", response_model=ModelMetricsResponse, summary="Supervised Model Evaluation & Validation")
def get_model_metrics():
    if not sales_ml_pipeline.is_trained:
        df = data_service.get_clean_dataframe()
        sales_ml_pipeline.train(df)

    m = sales_ml_pipeline.metrics
    return ModelMetricsResponse(
        model_name=m.get("model_name", "Random Forest Regressor"),
        r2_score=m.get("r2_score", 0.0),
        mae=m.get("mae", 0.0),
        rmse=m.get("rmse", 0.0),
        mape=m.get("mape", 0.0),
        train_samples=m.get("train_samples", 0),
        test_samples=m.get("test_samples", 0),
        train_test_split_date=m.get("train_test_split_date", ""),
        feature_importances=m.get("feature_importances", []),
        model_comparison=m.get("model_comparison", []),
        limitations=m.get("limitations", [])
    )

@app.get("/api/insights", summary="Statistical Business Insights")
def get_insights():
    df = data_service.get_clean_dataframe()
    return {"insights": insights_service.generate_insights(df)}

@app.get("/api/export", summary="Export Data and Predictions to CSV")
def export_data(export_type: str = Query("analytics", description="analytics, predictions, forecast")):
    output = io.StringIO()
    timestamp = time.strftime('%Y%m%d_%H%M%S')
    
    if export_type == "forecast":
        df = data_service.get_clean_dataframe()
        fc = forecaster.generate_forecast(df, horizon_days=30)
        if "forecast_points" in fc:
            fc_df = pd.DataFrame(fc["forecast_points"])
            fc_df.to_csv(output, index=False)
            filename = f"sales_forecast_30d_{timestamp}.csv"
        else:
            raise HTTPException(status_code=400, detail="Forecast data unavailable.")
    elif export_type == "predictions":
        # Export sample prediction grid
        df = data_service.get_clean_dataframe()
        products = df['Product'].unique()[:5]
        grid = []
        for p in products:
            pred = sales_ml_pipeline.predict({
                'product': p,
                'category': 'Cloud Services',
                'price': 600.0,
                'discount': 0.05,
                'ad_spend': 300.0,
                'date': time.strftime('%Y-%m-%d')
            })
            grid.append({
                "Product": p,
                "Predicted_Revenue": pred['predicted_revenue'],
                "CI_Lower_95": pred['confidence_interval_lower'],
                "CI_Upper_95": pred['confidence_interval_upper'],
                "Baseline": pred['historical_baseline']
            })
        pd.DataFrame(grid).to_csv(output, index=False)
        filename = f"sales_predictions_grid_{timestamp}.csv"
    else:
        df = data_service.get_clean_dataframe()
        df.to_csv(output, index=False)
        filename = f"sales_analytics_dataset_{timestamp}.csv"

    output.seek(0)
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )
