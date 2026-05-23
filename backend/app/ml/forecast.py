"""Prophet-based expense forecasting for category-wise predictions."""

from __future__ import annotations

from datetime import date, timedelta
from typing import Any

import pandas as pd


def _prepare_prophet_data(
    transactions: list[dict[str, Any]], category: str | None = None
) -> pd.DataFrame:
    """Prepare transaction data in Prophet format (ds, y columns)."""
    df = pd.DataFrame(transactions)
    if df.empty:
        return pd.DataFrame(columns=["ds", "y"])
    
    # Filter out credit transactions
    if "transaction_type" in df.columns:
        df = df[df["transaction_type"] != "credit"]
        
    if df.empty:
        return pd.DataFrame(columns=["ds", "y"])
        
    # Filter by category if specified
    if category and "category" in df.columns:
        df = df[df["category"] == category].copy()
    
    # Ensure transaction_date is datetime
    if "transaction_date" in df.columns:
        df["transaction_date"] = pd.to_datetime(df["transaction_date"])
    
    # Group by date and sum amounts
    daily = df.groupby("transaction_date")["amount"].sum().reset_index()
    daily.columns = ["ds", "y"]
    
    # Fill missing dates with 0 to prevent Prophet from overestimating
    if not daily.empty:
        daily = daily.set_index("ds")
        idx = pd.date_range(daily.index.min(), daily.index.max())
        daily = daily.reindex(idx, fill_value=0).reset_index()
        daily.columns = ["ds", "y"]
    
    return daily


def _simple_forecast(
    df: pd.DataFrame, days_ahead: int, category: str
) -> dict[str, Any]:
    """Simple moving average forecast when Prophet is not available or data is insufficient."""
    if df.empty:
        return {
            "category": category,
            "forecast_days": days_ahead,
            "predicted_total": 0.0,
            "daily_average": 0.0,
            "confidence_lower": 0.0,
            "confidence_upper": 0.0,
            "method": "fallback",
        }
    
    # Calculate daily average over the actual time span, not just active days
    today = pd.Timestamp(date.today())
    start_date = today - pd.Timedelta(days=30)
    
    # Filter transactions in last 30 days
    recent_df = df[df["ds"] >= start_date]
    if not recent_df.empty:
        # Calculate daily average over 30 days
        daily_avg = float(recent_df["y"].sum() / 30.0)
    else:
        # Fallback to overall average based on time span
        min_date = df["ds"].min()
        max_date = df["ds"].max()
        days_span = max(1, (max_date - min_date).days + 1)
        daily_avg = float(df["y"].sum() / days_span)
    
    predicted_total = daily_avg * days_ahead
    
    # Simple confidence interval (±30%)
    confidence_lower = predicted_total * 0.7
    confidence_upper = predicted_total * 1.3
    
    return {
        "category": category,
        "forecast_days": days_ahead,
        "predicted_total": round(predicted_total, 2),
        "daily_average": round(daily_avg, 2),
        "confidence_lower": round(confidence_lower, 2),
        "confidence_upper": round(confidence_upper, 2),
        "method": "moving_average",
    }


def forecast_category_spending(
    transactions: list[dict[str, Any]],
    category: str,
    days_ahead: int = 30,
) -> dict[str, Any]:
    """Forecast spending for a specific category using Prophet or fallback method."""
    df = _prepare_prophet_data(transactions, category)
    
    # Check if we have enough data (at least 7 days)
    if len(df) < 7:
        return _simple_forecast(df, days_ahead, category)
    
    # Try Prophet if available
    try:
        from prophet import Prophet
        
        # Fit Prophet model
        model = Prophet(
            yearly_seasonality=False,
            weekly_seasonality=True,
            daily_seasonality=False,
            changepoint_prior_scale=0.05,
            interval_width=0.8,
        )
        model.fit(df)
        
        # Make future dataframe
        future = model.make_future_dataframe(periods=days_ahead)
        forecast = model.predict(future)
        
        # Extract predictions for forecast period
        forecast_period = forecast.tail(days_ahead)
        predicted_total = float(forecast_period["yhat"].sum())
        daily_avg = float(forecast_period["yhat"].mean())
        confidence_lower = float(forecast_period["yhat_lower"].sum())
        confidence_upper = float(forecast_period["yhat_upper"].sum())
        
        return {
            "category": category,
            "forecast_days": days_ahead,
            "predicted_total": round(max(0, predicted_total), 2),
            "daily_average": round(max(0, daily_avg), 2),
            "confidence_lower": round(max(0, confidence_lower), 2),
            "confidence_upper": round(max(0, confidence_upper), 2),
            "method": "prophet",
        }
    except ImportError:
        # Prophet not installed, use fallback
        return _simple_forecast(df, days_ahead, category)
    except Exception:
        # Prophet failed, use fallback
        return _simple_forecast(df, days_ahead, category)


def forecast_all_categories(
    transactions: list[dict[str, Any]],
    days_ahead: int = 30,
) -> dict[str, Any]:
    """Forecast spending for all categories."""
    if not transactions:
        return {
            "forecast_days": days_ahead,
            "by_category": {},
            "total_predicted": 0.0,
            "total_lower": 0.0,
            "total_upper": 0.0,
        }
    
    # Get unique categories
    df = pd.DataFrame(transactions)
    categories = df["category"].unique().tolist() if "category" in df.columns else []
    
    # Forecast each category
    forecasts = {}
    total_predicted = 0.0
    total_lower = 0.0
    total_upper = 0.0
    
    for category in categories:
        if not category or category == "Other":
            continue
        
        forecast = forecast_category_spending(transactions, category, days_ahead)
        forecasts[category] = forecast
        total_predicted += forecast["predicted_total"]
        total_lower += forecast["confidence_lower"]
        total_upper += forecast["confidence_upper"]
    
    return {
        "forecast_days": days_ahead,
        "by_category": forecasts,
        "total_predicted": round(total_predicted, 2),
        "total_lower": round(total_lower, 2),
        "total_upper": round(total_upper, 2),
    }


def get_spending_forecast(
    transactions: list[dict[str, Any]],
) -> dict[str, Any]:
    """Get 7-day and 30-day spending forecasts."""
    forecast_7d = forecast_all_categories(transactions, days_ahead=7)
    forecast_30d = forecast_all_categories(transactions, days_ahead=30)
    
    return {
        "next_7_days": forecast_7d,
        "next_30_days": forecast_30d,
    }
