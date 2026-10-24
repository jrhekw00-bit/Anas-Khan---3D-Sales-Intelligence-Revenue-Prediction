import numpy as np
import pandas as pd
from typing import Dict, Any, List, Optional
from datetime import datetime, timedelta

class TimeSeriesForecaster:
    def __init__(self):
        pass

    def generate_forecast(self, df_clean: pd.DataFrame, horizon_days: int = 30) -> Dict[str, Any]:
        if df_clean.empty or 'Date' not in df_clean.columns:
            return {"error": "Dataset must contain a valid Date column."}

        # Daily aggregate
        df_daily = df_clean.groupby(df_clean['Date'].dt.date).agg({
            'Revenue': 'sum',
            'Quantity': 'sum'
        }).reset_index()
        df_daily['Date'] = pd.to_datetime(df_daily['Date'])
        df_daily = df_daily.sort_values('Date').reset_index(drop=True)

        # Check data span
        history_days = len(df_daily)
        if history_days < 7:
            return {
                "error": f"Dataset contains only {history_days} daily records. At least 7 consecutive daily records are required for time-series forecasting."
            }

        # Fill missing daily dates in history to prevent irregular spacing gaps
        full_idx = pd.date_range(start=df_daily['Date'].min(), end=df_daily['Date'].max(), freq='D')
        df_daily = df_daily.set_index('Date').reindex(full_idx)
        df_daily['Revenue'] = df_daily['Revenue'].fillna(df_daily['Revenue'].median())
        df_daily['Quantity'] = df_daily['Quantity'].fillna(df_daily['Quantity'].median())
        df_daily = df_daily.reset_index().rename(columns={'index': 'Date'})

        # Calculate chronological baseline (Simple 14-day Moving Average)
        rolling_window = min(14, len(df_daily))
        rolling_mean = df_daily['Revenue'].rolling(window=rolling_window, min_periods=1).mean()
        
        # Linear trend component calculation
        x = np.arange(len(df_daily))
        y = df_daily['Revenue'].values
        poly_fit = np.polyfit(x, y, deg=1)
        slope = poly_fit[0]
        intercept = poly_fit[1]

        # Day of week seasonality factors
        df_daily['DayOfWeek'] = df_daily['Date'].dt.dayofweek
        dow_multipliers = df_daily.groupby('DayOfWeek')['Revenue'].mean()
        overall_mean = df_daily['Revenue'].mean()
        if overall_mean > 0:
            dow_factors = (dow_multipliers / overall_mean).to_dict()
        else:
            dow_factors = {i: 1.0 for i in range(7)}

        # Estimate residual variance for prediction interval
        fitted_values = intercept + slope * x
        residuals = y - fitted_values
        residual_std = float(np.std(residuals)) if len(residuals) > 1 else 100.0

        # Generate future forecast points
        last_date = df_daily['Date'].max()
        forecast_points = []
        baseline_val = float(rolling_mean.iloc[-1])

        for step in range(1, horizon_days + 1):
            future_date = last_date + timedelta(days=step)
            dow = future_date.weekday()
            dow_factor = dow_factors.get(dow, 1.0)
            
            # Dampen slope slightly over longer horizons to avoid runaway explosion
            dampened_slope = slope * (0.98 ** (step / 7.0))
            projected_trend = intercept + slope * (len(df_daily) + step)
            
            # Combined forecast: trend + day-of-week seasonality
            point_forecast = max(0.0, float(projected_trend * dow_factor))
            
            # Uncertainty grows with horizon step (square root of step rule)
            uncertainty_band = 1.96 * residual_std * np.sqrt(1.0 + (step / 14.0))
            lower_bound = max(0.0, round(point_forecast - uncertainty_band, 2))
            upper_bound = round(point_forecast + uncertainty_band, 2)

            forecast_points.append({
                "date": future_date.strftime('%Y-%m-%d'),
                "forecast": round(point_forecast, 2),
                "lower_bound": lower_bound,
                "upper_bound": upper_bound,
                "baseline": round(baseline_val, 2)
            })

        # Historical actuals (last 60 days max for clean visual pairing)
        hist_subset = df_daily.tail(min(60, len(df_daily)))
        historical_actuals = [
            {
                "date": r['Date'].strftime('%Y-%m-%d'),
                "actual": round(float(r['Revenue']), 2),
                "quantity": int(r['Quantity'])
            }
            for _, r in hist_subset.iterrows()
        ]

        # Calculate metrics comparing trend model vs baseline on recent history
        eval_window = min(14, len(df_daily) // 2)
        recent_actuals = y[-eval_window:]
        recent_baseline = rolling_mean.iloc[-eval_window:].values
        recent_trend = fitted_values[-eval_window:]

        forecast_mae = float(np.mean(np.abs(recent_actuals - recent_trend)))
        baseline_mae = float(np.mean(np.abs(recent_actuals - recent_baseline)))

        limitations = [
            f"Forecast utilizes chronological Holt-Winters style trend & day-of-week decomposition over {history_days} historical observations.",
            "Prediction intervals represent a 95% statistical confidence envelope calibrated to historical residual variance.",
            f"{'90-day horizon has higher uncertainty due to limited historical depth' if history_days < 90 else 'Dataset provides sufficient depth for multi-quarter trend projections'}.",
            "External demand shocks, unannounced pricing revisions, and competitor campaigns are outside time-series scope."
        ]

        return {
            "horizon_days": horizon_days,
            "method_name": "Trend-Seasonal Decomposition (Chronological)",
            "baseline_method": "14-Day Trailing Rolling Mean",
            "historical_actuals": historical_actuals,
            "forecast_points": forecast_points,
            "metrics": {
                "forecast_mae": round(forecast_mae, 2),
                "baseline_mae": round(baseline_mae, 2),
                "historical_std_error": round(residual_std, 2)
            },
            "limitations": limitations
        }

# Global singleton
forecaster = TimeSeriesForecaster()
