# Anas Khan — 3D AI Sales Intelligence & Prediction Platform

Anas Khan is a full-stack, enterprise-grade AI Sales Intelligence & Prediction Dashboard featuring a modern 3D WebGL user interface, real supervised Machine Learning models in Python, multi-horizon time-series forecasting, and interactive CSV dataset management.

---

## Key Features

- **Holographic 3D Revenue Visualizer**: Real Three.js WebGL scene with procedural studio lighting, rotating neural core, orbital data pillars, mouse parallax, and WebGL safety fallbacks.
- **Supervised ML Sales Prediction**: Production Random Forest Regressor & Ridge Baseline trained with chronological train/test splits, feature engineering, and statistical 95% confidence intervals based on test RMSE.
- **Chronological Multi-Horizon Forecasting**: Dedicated 7-day, 30-day, and 90-day time-series projections with Holt-Winters seasonal trend decomposition and comparison against trailing baselines.
- **Sales & Product Performance Analytics**: Price vs volume elasticity scatter plots, promotional discount sensitivity analysis, and interactive catalog drilldowns.
- **Real CSV Upload & Field Mapping**: Drag-and-drop CSV ingestion with automatic data type detection, missing value and duplicate audits, and downloadable sanitized datasets.
- **Data-Grounded Business Insights**: Actionable, mathematically calculated recommendations covering revenue momentum, product concentration, discount margin dilution, and demand anomalies.
- **Executive Reporting & Exports**: Downloadable CSV forecasts and predictions, alongside a printable executive briefing modal.

---

## Architecture Overview

```
anas-khan/
├── backend/                   # Python FastAPI & Scikit-learn
│   ├── app/
│   │   ├── main.py            # REST API endpoints & CORS
│   │   ├── ml/
│   │   │   ├── pipeline.py    # Random Forest regression & Ridge baseline
│   │   │   └── forecaster.py  # Chronological multi-horizon time-series engine
│   │   ├── schemas/           # Pydantic validation models
│   │   └── services/          # Data cleaning, KPI calculation, insights
│   ├── tests/                 # Pytest test suite
│   └── requirements.txt
├── src/                       # React 19 + TypeScript + Vite + Tailwind CSS
│   ├── components/
│   │   ├── 3d/                # Three.js 3D Hologram & studio lighting
│   │   └── layout/            # Sidebar, TopBar, Printable Report Modal
│   ├── pages/                 # 9 fully functional interactive pages
│   ├── services/              # Typed API client
│   └── types/                 # TypeScript interfaces
├── sample_data/               # Realistic 90-day multi-product sales dataset
├── server.ts                  # Node.js Express server + FastAPI proxy + Vite
└── Dockerfile                 # Multi-stage production container
```

---

## Demo-Data Disclaimer

Anas Khan 3D Sales Intelligence is pre-loaded with realistic synthetic demo data spanning 90 days across 7 enterprise software and cloud offerings. When working with demo data, it is clearly labeled across the UI. Users can upload their own live company CSV files via **Data Management** at any time.

---

## API Endpoints

- `GET /api/health` - Health check and model training status
- `GET /api/analytics/overview` - KPI cards, timeline, category and monthly seasonality
- `GET /api/analytics/products` - Product performance matrix with search and sorting
- `POST /api/predict` - Real-time supervised ML prediction with confidence intervals
- `POST /api/forecast` - Multi-horizon (7d, 30d, 90d) time-series forecasting
- `GET /api/model/metrics` - Model evaluation benchmarks (R², MAE, RMSE, MAPE)
- `POST /api/data/upload` - CSV dataset upload, schema detection, and validation
- `POST /api/data/reset` - Reset to clean demo dataset
- `GET /api/export` - Export analytics, predictions, or forecasts to CSV

---

## Running Automated Tests

Run backend tests:
```bash
PYTHONPATH=backend pytest backend/tests/test_api.py -v
```
All 11 tests validate endpoint contracts, prediction bounds, schema parsing, and time-series date alignment.
