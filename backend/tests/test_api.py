import pytest
from fastapi.testclient import TestClient
import sys
import os

# Add backend directory to sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.main import app

client = TestClient(app)

def test_health_endpoint():
    response = client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert data["service"] == "Anas Khan Sales Intelligence Backend"
    assert "dataset_rows" in data
    assert "model_trained" in data

def test_overview_analytics():
    response = client.get("/api/analytics/overview")
    assert response.status_code == 200
    data = response.json()
    assert "kpis" in data
    assert "total_revenue" in data["kpis"]
    assert "total_orders" in data["kpis"]
    assert "revenue_timeline" in data
    assert len(data["revenue_timeline"]) > 0
    assert "sales_by_category" in data
    assert "top_products" in data

def test_overview_analytics_with_filters():
    response = client.get("/api/analytics/overview?category=Cloud%20Services")
    assert response.status_code == 200
    data = response.json()
    assert "kpis" in data
    assert len(data["sales_by_category"]) > 0

def test_product_analytics():
    response = client.get("/api/analytics/products")
    assert response.status_code == 200
    data = response.json()
    assert "products" in data
    assert "categories" in data
    assert len(data["products"]) > 0
    prod = data["products"][0]
    assert "product" in prod
    assert "revenue" in prod
    assert "avg_price" in prod
    assert "margin_pct" in prod

def test_ml_prediction_valid():
    payload = {
        "product": "Cloud Infrastructure",
        "category": "Cloud Services",
        "price": 1200.0,
        "discount": 0.05,
        "ad_spend": 350.0,
        "date": "2025-06-15"
    }
    response = client.post("/api/predict", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["predicted_revenue"] > 0
    assert data["confidence_interval_lower"] is not None
    assert data["confidence_interval_upper"] is not None
    assert data["confidence_interval_upper"] >= data["predicted_revenue"]
    assert "feature_contributions" in data
    assert len(data["feature_contributions"]) > 0

def test_ml_prediction_invalid():
    # Negative price should fail validation
    payload = {
        "product": "Cloud Infrastructure",
        "category": "Cloud Services",
        "price": -10.0,
        "discount": 0.05,
        "ad_spend": 350.0,
        "date": "2025-06-15"
    }
    response = client.post("/api/predict", json=payload)
    assert response.status_code == 422  # Unprocessable Entity (Pydantic validation)

def test_time_series_forecasting():
    payload = {
        "horizon_days": 30,
        "interval": "daily"
    }
    response = client.post("/api/forecast", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["horizon_days"] == 30
    assert len(data["forecast_points"]) == 30
    assert len(data["historical_actuals"]) > 0
    assert "metrics" in data
    assert "forecast_mae" in data["metrics"]
    
    # Check bounds
    first_pt = data["forecast_points"][0]
    assert first_pt["upper_bound"] >= first_pt["forecast"]
    assert first_pt["lower_bound"] <= first_pt["forecast"]

def test_forecasting_invalid_horizon():
    payload = {"horizon_days": 45}  # Only 7, 30, 90 allowed
    response = client.post("/api/forecast", json=payload)
    assert response.status_code == 400

def test_model_metrics():
    response = client.get("/api/model/metrics")
    assert response.status_code == 200
    data = response.json()
    assert "r2_score" in data
    assert "mae" in data
    assert "rmse" in data
    assert "feature_importances" in data
    assert "model_comparison" in data
    assert len(data["model_comparison"]) >= 2

def test_business_insights():
    response = client.get("/api/insights")
    assert response.status_code == 200
    data = response.json()
    assert "insights" in data
    assert len(data["insights"]) > 0
    insight = data["insights"][0]
    assert "title" in insight
    assert "summary" in insight
    assert "impact_type" in insight

def test_csv_upload_and_validation():
    csv_content = """Date,Product,Category,Price,Quantity,Discount,Ad_Spend,Revenue
2025-01-01,Test App,SaaS,100,5,0.0,50,500
2025-01-02,Test App,SaaS,100,8,0.1,60,720
2025-01-03,Test App,SaaS,100,12,0.05,80,1140
2025-01-04,Test App,SaaS,100,10,0.0,70,1000
2025-01-05,Test App,SaaS,100,15,0.1,90,1350
2025-01-06,Test App,SaaS,100,11,0.05,80,1045
2025-01-07,Test App,SaaS,100,14,0.0,85,1400
2025-01-08,Test App,SaaS,100,16,0.1,95,1440
2025-01-09,Test App,SaaS,100,13,0.0,80,1300
2025-01-10,Test App,SaaS,100,18,0.05,100,1710
2025-01-11,Test App,SaaS,100,19,0.1,110,1710
2025-01-12,Test App,SaaS,100,20,0.05,120,1900
2025-01-13,Test App,SaaS,100,22,0.0,130,2200
"""
    files = {"file": ("test_sales.csv", csv_content, "text/csv")}
    response = client.post("/api/data/upload", files=files)
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert data["row_count"] == 13
    assert "missing_summary" in data

    # Reset back to demo dataset
    reset_res = client.post("/api/data/reset")
    assert reset_res.status_code == 200
