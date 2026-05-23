"""Runtime ML inference for a single Supabase user."""

from __future__ import annotations

from typing import Any

import numpy as np
import pandas as pd

from app.ml.features import aggregate_user_features, engineer_features
from app.ml.loader import get_model_bundle


def _stress_from_features(df: pd.DataFrame) -> pd.DataFrame:
    df = df.copy()
    if "is_anomaly" not in df.columns:
        df["is_anomaly"] = False

    stress_components = {
        "spending_velocity": df["rolling_7d_spend"]
        / df["monthly_budget"].clip(lower=1)
        * 100,
        "academic_load": df["semester_pressure"] * 25,
        "anomaly_density": df["is_anomaly"].astype(int) * 15,
        "recurring_burden": (
            df["subscription_burden"] / df["monthly_budget"].clip(lower=1)
        )
        * 30,
    }
    df["financial_stress_score"] = (
        pd.DataFrame(stress_components).sum(axis=1).clip(0, 100)
    )
    bins = [0, 40, 70, 100]
    df["stress_level"] = pd.cut(
        df["financial_stress_score"],
        bins=bins,
        labels=["Low", "Medium", "High"],
        include_lowest=True,
    )
    return df


def generate_intelligence(
    transactions: list[dict[str, Any]],
    profile: dict[str, Any],
) -> dict[str, Any] | None:
    """
    Returns Section 11 insight dict for LLM / dashboard:
    burn_rate, days_remaining, overspending_risk, top_risk_category,
    financial_stress_score, stress_level, behavioral_profile
    """
    bundle = get_model_bundle()
    if bundle is None:
        return None

    feature_df = engineer_features(transactions, profile)
    if feature_df.empty:
        return {
            "burn_rate_daily": 0.0,
            "days_remaining": 0,
            "estimated_days_remaining": 0,
            "overspending_risk": "Low",
            "top_risk_category": None,
            "financial_stress_score": 0.0,
            "stress_level": "Low",
            "behavioral_profile": profile.get("financial_personality") or "unknown",
            "anomaly_count": 0,
            "cluster_label": None,
            "models_loaded": False,
        }

    anomaly_features = bundle["anomaly_features"]
    X = feature_df[anomaly_features].fillna(0)
    X_scaled = bundle["anomaly_scaler"].transform(X)
    feature_df["anomaly_score"] = bundle["anomaly_model"].predict(X_scaled)
    feature_df["is_anomaly"] = feature_df["anomaly_score"] == -1

    feature_df = _stress_from_features(feature_df)
    latest = feature_df.iloc[-1]

    # Calculate daily burn rate correctly using time-based window
    # The previous logic was just taking the rolling 30d sum and dividing by 30
    # But if the user only has 5 days of data, dividing by 30 gives an artificially low burn rate
    
    # Calculate actual days span of the data
    min_date = feature_df["transaction_date"].min()
    max_date = feature_df["transaction_date"].max()
    days_span = max(1, (max_date - min_date).days + 1)
    
    # Use the smaller of 30 days or actual days span
    effective_days = min(30, days_span)
    
    # Get the latest rolling 30d spend (which is actually just the sum of the last 30 days)
    rolling_30d = float(latest.get("rolling_30d_spend", 0) or 0)
    
    # Calculate true daily burn rate
    avg_daily = rolling_30d / effective_days if effective_days > 0 else 0.0
    monthly_budget = float(profile.get("monthly_budget") or 0)
    days_remaining = (
        max(0, int(monthly_budget / avg_daily)) if avg_daily > 0 else 30
    )

    top_category = (
        feature_df.groupby("category")["amount"].sum().idxmax()
        if "category" in feature_df.columns
        else None
    )

    cluster_label = profile.get("financial_personality")
    try:
        user_row = pd.DataFrame(
            [
                {
                    "amount": feature_df["amount"].mean(),
                    "is_weekend": feature_df["is_weekend"].mean(),
                    "budget_utilization": feature_df["budget_utilization"].mean(),
                    "impulsive_score": feature_df["impulsive_score"].mean(),
                    "subscription_burden": feature_df["subscription_burden"].sum(),
                }
            ]
        )
        Xc = bundle["cluster_scaler"].transform(
            user_row[bundle["cluster_features"]].fillna(0)
        )
        cluster_id = int(bundle["kmeans_model"].predict(Xc)[0])
        labels = bundle.get("cluster_labels", [])
        if cluster_id < len(labels):
            cluster_label = labels[cluster_id]
    except Exception:
        pass

    recent_anomalies = feature_df[feature_df["is_anomaly"]].tail(5)
    
    # Calculate category averages for context
    category_avgs = feature_df.groupby("category")["amount"].mean().to_dict()
    
    anomaly_list = []
    for _, row in recent_anomalies.iterrows():
        amount = float(row["amount"])
        category = row.get("category", "Other")
        merchant = row.get("merchant", "Unknown")
        
        # Determine why it's anomalous
        cat_avg = category_avgs.get(category, amount)
        multiplier = amount / cat_avg if cat_avg > 0 else 1
        
        # Generate context reason
        if multiplier >= 3:
            reason = f"{int(multiplier)}x your usual {category} spending"
        elif multiplier >= 2:
            reason = f"2x your typical {category} amount"
        else:
            reason = f"Unusual {category} transaction"
        
        # Generate actionable suggestion
        if category == "Food":
            suggestion = "Exam stress? Try meal prep on Sunday to save ₹800/week"
        elif category == "Shopping":
            suggestion = "Apply 24-hour rule before next purchase to avoid impulse buying"
        elif category == "Entertainment":
            suggestion = "Consider shared subscriptions or group movie plans"
        elif category == "Transport":
            suggestion = "Long distance trip? Book earlier next time for better rates"
        else:
            suggestion = f"Review if this {category} expense was necessary"
        
        anomaly_list.append({
            "amount": amount,
            "category": category,
            "merchant": merchant,
            "transaction_date": str(row["transaction_date"].date())
            if hasattr(row["transaction_date"], "date")
            else str(row["transaction_date"]),
            "severity": "high" if multiplier >= 3 else "medium",
            "reason": reason,
            "suggestion": suggestion,
            "multiplier": round(multiplier, 1),
        })

    overspending = "High" if bool(latest.get("is_anomaly")) else "Low"
    if float(latest.get("budget_utilization", 0)) > 1.0:
        overspending = "High"
    elif float(latest.get("budget_utilization", 0)) > 0.8:
        overspending = "Medium"

    return {
        "burn_rate_daily": round(avg_daily, 2),
        "days_remaining": days_remaining,
        "estimated_days_remaining": days_remaining,
        "overspending_risk": overspending,
        "top_risk_category": str(top_category) if top_category else None,
        "financial_stress_score": round(float(latest["financial_stress_score"]), 1),
        "stress_level": str(latest.get("stress_level", "Medium")),
        "behavioral_profile": cluster_label or profile.get("financial_personality"),
        "budget_utilization_pct": round(
            float(latest.get("budget_utilization", 0)) * 100, 1
        ),
        "anomaly_count": int(feature_df["is_anomaly"].sum()),
        "recent_anomalies": anomaly_list,
        "models_loaded": True,
    }
