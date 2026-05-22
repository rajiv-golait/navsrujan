"""Feature engineering — ported from MITHACKATHON.ipynb Section 5."""

from __future__ import annotations

from datetime import datetime
from typing import Any

import pandas as pd


def transactions_to_dataframe(transactions: list[dict[str, Any]]) -> pd.DataFrame:
    if not transactions:
        return pd.DataFrame()

    df = pd.DataFrame(transactions)
    df["transaction_date"] = pd.to_datetime(df["transaction_date"])
    if "transaction_time" not in df.columns:
        df["transaction_time"] = "12:00:00"
    df["full_date"] = pd.to_datetime(
        df["transaction_date"].dt.strftime("%Y-%m-%d")
        + " "
        + df["transaction_time"].astype(str)
    )
    df["hour"] = df["full_date"].dt.hour
    if "day_of_week" not in df.columns:
        df["day_of_week"] = df["full_date"].dt.day_name()
    if "is_recurring" in df.columns:
        df["is_recurring"] = df["is_recurring"].fillna(False).astype(bool)
    else:
        df["is_recurring"] = False
    df["is_academic"] = df.get("is_academic", False).fillna(False).astype(bool)
    df["semester_number"] = pd.to_numeric(
        df.get("semester_number", 1), errors="coerce"
    ).fillna(1)
    df["amount"] = pd.to_numeric(df["amount"], errors="coerce")
    df = df[df["amount"] > 0]
    return df


def engineer_features(
    transactions: list[dict[str, Any]],
    profile: dict[str, Any],
) -> pd.DataFrame:
    """Build per-transaction feature rows for one user."""
    df = transactions_to_dataframe(transactions)
    if df.empty:
        return df

    monthly_budget = float(profile.get("monthly_budget") or 10000)
    monthly_income = float(profile.get("monthly_income") or monthly_budget)
    current_semester = int(profile.get("current_semester") or 1)

    df["monthly_budget"] = monthly_budget
    df["monthly_income"] = monthly_income
    df["current_semester"] = current_semester
    df["financial_personality"] = profile.get("financial_personality") or "balanced_spender"
    df["education_type"] = profile.get("education_type") or "BTech"

    df["day_of_month"] = df["transaction_date"].dt.day
    df["is_weekend"] = df["day_of_week"].isin(["Saturday", "Sunday"]).astype(int)
    df["is_month_end"] = (df["day_of_month"] >= 25).astype(int)

    df = df.sort_values("transaction_date")

    df["rolling_7d_spend"] = df["amount"].rolling(7, min_periods=1).sum()
    df["rolling_30d_spend"] = df["amount"].rolling(30, min_periods=1).sum()
    df["avg_daily_spend"] = df["rolling_30d_spend"] / 30

    df["impulsive_score"] = (
        df["is_weekend"] * 0.4
        + df["hour"].between(20, 23).astype(int) * 0.6
    )
    df["subscription_burden"] = df["is_recurring"].astype(int) * df["amount"]
    df["budget_utilization"] = df["rolling_30d_spend"] / max(monthly_budget, 1)
    df["semester_pressure"] = (
        df["semester_number"].fillna(current_semester) * 0.15
        + df["is_academic"].astype(int) * 0.4
    )

    return df


def aggregate_user_features(feature_df: pd.DataFrame) -> dict[str, float]:
    if feature_df.empty:
        return {}

    latest = feature_df.iloc[-1]
    return {
        "amount_mean": float(feature_df["amount"].mean()),
        "is_weekend_mean": float(feature_df["is_weekend"].mean()),
        "budget_utilization_mean": float(feature_df["budget_utilization"].mean()),
        "impulsive_score_mean": float(feature_df["impulsive_score"].mean()),
        "subscription_burden_sum": float(feature_df["subscription_burden"].sum()),
        "avg_daily_spend": float(latest.get("avg_daily_spend", 0)),
        "rolling_7d_spend": float(latest.get("rolling_7d_spend", 0)),
        "monthly_budget": float(latest.get("monthly_budget", 10000)),
        "financial_stress_score": float(latest.get("financial_stress_score", 0)),
        "stress_level": str(latest.get("stress_level", "Medium")),
        "is_anomaly": bool(latest.get("is_anomaly", False)),
    }
