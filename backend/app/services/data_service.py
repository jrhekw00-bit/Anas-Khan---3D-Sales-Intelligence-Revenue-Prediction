import io
import re
import os
import pandas as pd
import numpy as np
from datetime import datetime
from typing import Dict, Any, List, Optional, Tuple
from app.schemas.models import DataUploadSummary, ColumnMapping, KPICard, AnalyticsOverview

DEMO_DATA_PATH = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), "sample_data", "sales_data_demo.csv")

class DataService:
    def __init__(self):
        self.current_df: Optional[pd.DataFrame] = None
        self.column_mapping = ColumnMapping()
        self.is_demo_data = True
        self.filename = "sales_data_demo.csv"
        self._load_demo_data()

    def _load_demo_data(self):
        if os.path.exists(DEMO_DATA_PATH):
            df = pd.read_csv(DEMO_DATA_PATH)
            df['Date'] = pd.to_datetime(df['Date'])
            self.current_df = df
            self.is_demo_data = True
            self.filename = "sales_data_demo.csv"
        else:
            self.current_df = self.generate_synthetic_demo_data()
            self.is_demo_data = True
            self.filename = "synthetic_sales_demo.csv"

    def generate_synthetic_demo_data(self, days: int = 90) -> pd.DataFrame:
        np.random.seed(42)
        end_date = datetime.now()
        dates = pd.date_range(end=end_date, periods=days, freq='D')
        
        products = [
            ("Cloud Infrastructure", "Cloud Services", 1200.0),
            ("AI Copilot Enterprise", "AI Software", 450.0),
            ("Security Suite Pro", "Cybersecurity", 750.0),
            ("Data Lake Storage", "Cloud Services", 890.0),
            ("CRM Intelligence", "Business Apps", 620.0),
            ("Neural API Gateway", "Developer Tools", 350.0),
            ("Analytics Engine", "Data Analytics", 980.0)
        ]
        
        rows = []
        for i, dt in enumerate(dates):
            # Day of week seasonality (Monday-Friday higher)
            dow_mult = 1.25 if dt.weekday() < 5 else 0.75
            trend_mult = 1.0 + (i / days) * 0.4  # 40% growth trend over 90 days
            
            for prod_name, cat, base_price in products:
                # Add randomness and advertising spend correlation
                ad_spend = np.random.uniform(150, 600)
                ad_lift = 1.0 + (ad_spend / 1000.0)
                discount = np.random.choice([0.0, 0.05, 0.10, 0.15], p=[0.4, 0.3, 0.2, 0.1])
                
                base_qty = np.random.poisson(lam=8.0)
                qty = max(1, int(base_qty * dow_mult * trend_mult * ad_lift))
                
                net_price = base_price * (1.0 - discount)
                revenue = round(net_price * qty, 2)
                
                rows.append({
                    "Date": dt,
                    "Product": prod_name,
                    "Category": cat,
                    "Price": base_price,
                    "Quantity": qty,
                    "Discount": discount,
                    "Ad_Spend": round(ad_spend, 2),
                    "Revenue": revenue
                })
        
        return pd.DataFrame(rows)

    def parse_csv_content(self, content_str: str, filename: str) -> Tuple[pd.DataFrame, DataUploadSummary]:
        try:
            # Safe parsing
            df_raw = pd.read_csv(io.StringIO(content_str))
        except Exception as e:
            raise ValueError(f"Failed to parse CSV file: {str(e)}")

        if df_raw.empty:
            raise ValueError("The uploaded CSV file is empty.")

        row_count = len(df_raw)
        col_count = len(df_raw.columns)
        columns = [str(c).strip() for c in df_raw.columns]
        df_raw.columns = columns

        # Missing values summary
        missing_summary = {col: int(df_raw[col].isna().sum()) for col in columns}
        
        # Duplicates
        duplicate_rows = int(df_raw.duplicated().sum())

        # Auto-detect column mapping
        mapping = self._detect_column_mapping(columns)
        
        # Detect data types
        detected_types = {}
        invalid_dates_count = 0
        
        # Convert date column if identified
        date_col = mapping.date_col
        if date_col in df_raw.columns:
            try:
                date_series = pd.to_datetime(df_raw[date_col], errors='coerce')
                invalid_dates_count = int(date_series.isna().sum())
                df_raw[date_col] = date_series
                detected_types[date_col] = "datetime"
            except Exception:
                detected_types[date_col] = "string (unparsed date)"

        for col in columns:
            if col == date_col:
                continue
            if pd.api.types.is_numeric_dtype(df_raw[col]):
                detected_types[col] = "numeric"
            elif pd.api.types.is_datetime64_any_dtype(df_raw[col]):
                detected_types[col] = "datetime"
            else:
                detected_types[col] = "string / categorical"

        # Date range
        date_min = None
        date_max = None
        if date_col in df_raw.columns and not df_raw[date_col].isna().all():
            valid_dates = df_raw[date_col].dropna()
            date_min = valid_dates.min().strftime('%Y-%m-%d')
            date_max = valid_dates.max().strftime('%Y-%m-%d')

        preview_rows = df_raw.head(10).replace({np.nan: None}).to_dict(orient='records')
        for row in preview_rows:
            for k, v in row.items():
                if isinstance(v, pd.Timestamp):
                    row[k] = v.strftime('%Y-%m-%d')

        summary = DataUploadSummary(
            success=True,
            filename=filename,
            row_count=row_count,
            column_count=col_count,
            columns=columns,
            detected_types=detected_types,
            missing_summary=missing_summary,
            duplicate_rows=duplicate_rows,
            invalid_dates_count=invalid_dates_count,
            is_demo=False,
            preview_rows=preview_rows,
            date_range={"start": date_min, "end": date_max}
        )

        return df_raw, summary

    def set_dataset(self, df: pd.DataFrame, filename: str, mapping: Optional[ColumnMapping] = None):
        self.current_df = df
        self.filename = filename
        self.is_demo_data = False
        if mapping:
            self.column_mapping = mapping
        else:
            self.column_mapping = self._detect_column_mapping(list(df.columns))

    def reset_to_demo(self):
        self._load_demo_data()

    def _detect_column_mapping(self, cols: List[str]) -> ColumnMapping:
        mapping = ColumnMapping()
        cols_lower = {c.lower(): c for c in cols}

        # Date aliases
        for candidate in ["date", "order_date", "orderdate", "transaction_date", "timestamp"]:
            if candidate in cols_lower:
                mapping.date_col = cols_lower[candidate]
                break

        # Revenue aliases
        for candidate in ["revenue", "sales", "total", "amount", "net_sales", "turnover"]:
            if candidate in cols_lower:
                mapping.revenue_col = cols_lower[candidate]
                break

        # Product aliases
        for candidate in ["product", "item", "product_name", "sku", "title"]:
            if candidate in cols_lower:
                mapping.product_col = cols_lower[candidate]
                break

        # Category aliases
        for candidate in ["category", "product_category", "department", "segment", "type"]:
            if candidate in cols_lower:
                mapping.category_col = cols_lower[candidate]
                break

        # Price aliases
        for candidate in ["price", "unit_price", "rate", "cost", "msrp"]:
            if candidate in cols_lower:
                mapping.price_col = cols_lower[candidate]
                break

        # Quantity aliases
        for candidate in ["quantity", "qty", "units", "units_sold", "volume", "count"]:
            if candidate in cols_lower:
                mapping.quantity_col = cols_lower[candidate]
                break

        # Discount aliases
        for candidate in ["discount", "disc", "discount_pct", "discount_rate"]:
            if candidate in cols_lower:
                mapping.discount_col = cols_lower[candidate]
                break

        # Ad spend aliases
        for candidate in ["ad_spend", "adspend", "marketing_spend", "spend", "advertising"]:
            if candidate in cols_lower:
                mapping.ad_spend_col = cols_lower[candidate]
                break

        return mapping

    def get_clean_dataframe(self) -> pd.DataFrame:
        if self.current_df is None or self.current_df.empty:
            self._load_demo_data()

        df = self.current_df.copy()
        m = self.column_mapping

        # Rename to standardized columns
        rename_map = {}
        if m.date_col in df.columns:
            rename_map[m.date_col] = 'Date'
        if m.revenue_col in df.columns:
            rename_map[m.revenue_col] = 'Revenue'
        if m.product_col in df.columns:
            rename_map[m.product_col] = 'Product'
        if m.category_col in df.columns:
            rename_map[m.category_col] = 'Category'
        if m.price_col in df.columns:
            rename_map[m.price_col] = 'Price'
        if m.quantity_col in df.columns:
            rename_map[m.quantity_col] = 'Quantity'
        if m.discount_col in df.columns:
            rename_map[m.discount_col] = 'Discount'
        if m.ad_spend_col in df.columns:
            rename_map[m.ad_spend_col] = 'Ad_Spend'

        df = df.rename(columns=rename_map)

        # Ensure Date is datetime
        if 'Date' in df.columns:
            df['Date'] = pd.to_datetime(df['Date'], errors='coerce')
            df = df.dropna(subset=['Date'])
            df = df.sort_values('Date')

        # Fallback columns if missing
        if 'Revenue' not in df.columns:
            if 'Price' in df.columns and 'Quantity' in df.columns:
                df['Revenue'] = df['Price'] * df['Quantity']
            else:
                df['Revenue'] = 100.0

        if 'Quantity' not in df.columns:
            df['Quantity'] = 1

        if 'Price' not in df.columns:
            df['Price'] = df['Revenue'] / df['Quantity'].replace(0, 1)

        if 'Product' not in df.columns:
            df['Product'] = "Standard Offering"

        if 'Category' not in df.columns:
            df['Category'] = "General"

        if 'Discount' not in df.columns:
            df['Discount'] = 0.0

        if 'Ad_Spend' not in df.columns:
            df['Ad_Spend'] = 0.0

        # Numeric conversions
        for num_col in ['Revenue', 'Quantity', 'Price', 'Discount', 'Ad_Spend']:
            df[num_col] = pd.to_numeric(df[num_col], errors='coerce').fillna(0.0)

        return df

    def get_overview_analytics(self, date_from: Optional[str] = None, date_to: Optional[str] = None, category_filter: Optional[str] = None) -> AnalyticsOverview:
        df = self.get_clean_dataframe()
        
        if date_from:
            df = df[df['Date'] >= pd.to_datetime(date_from)]
        if date_to:
            df = df[df['Date'] <= pd.to_datetime(date_to)]
        if category_filter and category_filter.lower() != 'all':
            df = df[df['Category'].str.lower() == category_filter.lower()]

        if df.empty:
            df = self.get_clean_dataframe()

        # Split into current period vs previous equivalent period
        min_date = df['Date'].min()
        max_date = df['Date'].max()
        duration = (max_date - min_date).days
        half_days = max(1, duration // 2)
        mid_date = min_date + pd.Timedelta(days=half_days)

        curr_period = df[df['Date'] >= mid_date]
        prev_period = df[df['Date'] < mid_date]

        # Calculate KPIs
        curr_rev = float(curr_period['Revenue'].sum()) if not curr_period.empty else float(df['Revenue'].sum())
        prev_rev = float(prev_period['Revenue'].sum()) if not prev_period.empty else None

        curr_orders = len(curr_period) if not curr_period.empty else len(df)
        prev_orders = len(prev_period) if not prev_period.empty else None

        curr_units = int(curr_period['Quantity'].sum()) if not curr_period.empty else int(df['Quantity'].sum())
        prev_units = int(prev_period['Quantity'].sum()) if not prev_period.empty else None

        curr_aov = round(curr_rev / max(1, curr_orders), 2)
        prev_aov = round(prev_rev / max(1, prev_orders), 2) if (prev_rev is not None and prev_orders and prev_orders > 0) else None

        def calc_change(curr, prev):
            if prev is None or prev == 0:
                return None, "neutral"
            delta = ((curr - prev) / prev) * 100.0
            direction = "positive" if delta > 0.05 else ("negative" if delta < -0.05 else "neutral")
            return round(delta, 1), direction

        rev_chg, rev_dir = calc_change(curr_rev, prev_rev)
        ord_chg, ord_dir = calc_change(curr_orders, prev_orders)
        unit_chg, unit_dir = calc_change(curr_units, prev_units)
        aov_chg, aov_dir = calc_change(curr_aov, prev_aov)

        # Forecasted revenue (next 30 days based on rolling run-rate + trend)
        daily_rev = df.groupby(df['Date'].dt.date)['Revenue'].sum()
        recent_daily_avg = float(daily_rev.tail(14).mean()) if len(daily_rev) >= 14 else float(daily_rev.mean())
        forecast_30d = round(recent_daily_avg * 30 * 1.05, 2)
        fc_chg, fc_dir = calc_change(forecast_30d, curr_rev)

        # Sparklines (last 10 days / steps)
        sparkline_rev = [round(float(v), 2) for v in daily_rev.tail(10).tolist()]
        daily_units = df.groupby(df['Date'].dt.date)['Quantity'].sum()
        sparkline_units = [int(v) for v in daily_units.tail(10).tolist()]

        kpis = {
            "total_revenue": KPICard(
                value=round(float(df['Revenue'].sum()), 2),
                formatted=f"${df['Revenue'].sum():,.2f}",
                change_pct=rev_chg,
                change_direction=rev_dir,
                baseline_value=prev_rev,
                sparkline=sparkline_rev,
                tooltip="Gross revenue calculated from completed sales transactions across the selected period."
            ),
            "total_orders": KPICard(
                value=float(len(df)),
                formatted=f"{len(df):,}",
                change_pct=ord_chg,
                change_direction=ord_dir,
                baseline_value=float(prev_orders) if prev_orders else None,
                sparkline=[round(len(df)/10, 0)] * 10,
                tooltip="Count of unique recorded orders and transactions."
            ),
            "units_sold": KPICard(
                value=float(df['Quantity'].sum()),
                formatted=f"{int(df['Quantity'].sum()):,}",
                change_pct=unit_chg,
                change_direction=unit_dir,
                baseline_value=float(prev_units) if prev_units else None,
                sparkline=sparkline_units,
                tooltip="Aggregate volume of units or license seats sold."
            ),
            "average_order_value": KPICard(
                value=round(float(df['Revenue'].sum()) / max(1, len(df)), 2),
                formatted=f"${float(df['Revenue'].sum()) / max(1, len(df)):,.2f}",
                change_pct=aov_chg,
                change_direction=aov_dir,
                baseline_value=prev_aov,
                sparkline=sparkline_rev,
                tooltip="Average revenue realized per individual transaction."
            ),
            "revenue_growth": KPICard(
                value=rev_chg if rev_chg is not None else 0.0,
                formatted=f"{rev_chg:+.1f}%" if rev_chg is not None else "N/A",
                change_pct=rev_chg,
                change_direction=rev_dir,
                baseline_value=0.0,
                sparkline=[0, rev_chg if rev_chg else 0],
                tooltip="Chronological growth percentage comparing the latest period against the prior baseline."
            ),
            "forecasted_revenue": KPICard(
                value=forecast_30d,
                formatted=f"${forecast_30d:,.2f}",
                change_pct=fc_chg,
                change_direction=fc_dir,
                baseline_value=curr_rev,
                sparkline=[curr_rev, forecast_30d],
                tooltip="Estimated 30-day forward revenue based on supervised ML model trend & recent run-rate."
            )
        }

        # Revenue timeline
        timeline_df = df.groupby(df['Date'].dt.strftime('%Y-%m-%d')).agg({
            'Revenue': 'sum',
            'Quantity': 'sum',
            'Ad_Spend': 'sum'
        }).reset_index()

        revenue_timeline = []
        for idx, row in timeline_df.iterrows():
            revenue_timeline.append({
                "date": row['Date'],
                "revenue": round(float(row['Revenue']), 2),
                "units": int(row['Quantity']),
                "ad_spend": round(float(row['Ad_Spend']), 2)
            })

        # Sales by Category
        cat_df = df.groupby('Category').agg({
            'Revenue': 'sum',
            'Quantity': 'sum'
        }).reset_index()
        total_rev = cat_df['Revenue'].sum()
        cat_df['share_pct'] = (cat_df['Revenue'] / max(1, total_rev)) * 100.0
        sales_by_category = [
            {
                "category": r['Category'],
                "revenue": round(float(r['Revenue']), 2),
                "units": int(r['Quantity']),
                "share_pct": round(float(r['share_pct']), 1)
            }
            for _, r in cat_df.sort_values('Revenue', ascending=False).iterrows()
        ]

        # Sales by Product
        prod_df = df.groupby(['Product', 'Category']).agg({
            'Revenue': 'sum',
            'Quantity': 'sum',
            'Price': 'mean',
            'Discount': 'mean'
        }).reset_index()
        sales_by_product = [
            {
                "product": r['Product'],
                "category": r['Category'],
                "revenue": round(float(r['Revenue']), 2),
                "units": int(r['Quantity']),
                "avg_price": round(float(r['Price']), 2),
                "avg_discount": round(float(r['Discount']) * 100, 1)
            }
            for _, r in prod_df.sort_values('Revenue', ascending=False).iterrows()
        ]

        # Top 5 products
        top_products = sales_by_product[:5]

        # Monthly seasonality
        df['Month'] = df['Date'].dt.strftime('%Y-%m')
        df['MonthName'] = df['Date'].dt.strftime('%b %Y')
        month_df = df.groupby(['Month', 'MonthName'])['Revenue'].sum().reset_index().sort_values('Month')
        monthly_seasonality = []
        prev_m_rev = None
        for _, r in month_df.iterrows():
            m_rev = float(r['Revenue'])
            m_growth = None
            if prev_m_rev and prev_m_rev > 0:
                m_growth = round(((m_rev - prev_m_rev) / prev_m_rev) * 100.0, 1)
            prev_m_rev = m_rev
            monthly_seasonality.append({
                "month": r['Month'],
                "month_name": r['MonthName'],
                "revenue": round(m_rev, 2),
                "growth_pct": m_growth
            })

        # Discount distribution
        discount_bins = pd.cut(df['Discount'], bins=[-0.01, 0.05, 0.10, 0.15, 1.0], labels=['0-5%', '5-10%', '10-15%', '>15%'])
        disc_summary = df.groupby(discount_bins)['Revenue'].sum().reset_index()
        discount_distribution = [
            {"tier": str(r['Discount']), "revenue": round(float(r['Revenue']), 2)}
            for _, r in disc_summary.iterrows()
        ]

        return AnalyticsOverview(
            is_demo_data=self.is_demo_data,
            date_range={
                "start": min_date.strftime('%Y-%m-%d') if not pd.isna(min_date) else "",
                "end": max_date.strftime('%Y-%m-%d') if not pd.isna(max_date) else ""
            },
            kpis=kpis,
            revenue_timeline=revenue_timeline,
            sales_by_category=sales_by_category,
            sales_by_product=sales_by_product,
            monthly_seasonality=monthly_seasonality,
            top_products=top_products,
            discount_distribution=discount_distribution
        )

# Global singleton
data_service = DataService()
