"""Analytics + ML orchestration for live Supabase users."""

from __future__ import annotations

from typing import Any

from supabase import Client

from app.analytics.lite_snapshot import build_snapshot
from app.ml.bootstrap import ml_stack_available
from app.services.transaction_service import TransactionService


def fetch_user_profile(client: Client, user_id: str) -> dict[str, Any]:
    response = (
        client.table("user_profiles")
        .select("*")
        .eq("id", user_id)
        .maybe_single()
        .execute()
    )
    row = response.data or {}
    return {
        "monthly_budget": float(row.get("monthly_budget") or 10000),
        "monthly_income": float(row.get("monthly_income") or row.get("monthly_budget") or 10000),
        "current_semester": int(row.get("current_semester") or row.get("year") or 1),
        "education_type": row.get("education_type") or "BTech",
        "financial_personality": row.get("financial_personality"),
        "college": row.get("college"),
        "course": row.get("course"),
    }


def transactions_as_dicts(client: Client, user_id: str, limit: int = 2000) -> list[dict[str, Any]]:
    service = TransactionService(client, user_id)
    rows = service.list(limit=limit)
    result: list[dict[str, Any]] = []
    for t in rows:
        result.append(
            {
                "amount": float(t.amount),
                "category": t.category,
                "merchant": t.merchant,
                "description": t.description,
                "transaction_date": t.transaction_date.isoformat(),
                "transaction_time": t.created_at.strftime("%H:%M:%S"),
                "is_recurring": False,
                "semester_number": t.semester_number,
                "is_academic": t.is_academic,
            }
        )
    return result


def get_ml_insights(client: Client, user_id: str) -> dict[str, Any] | None:
    if not ml_stack_available():
        return None
    from app.ml.inference import generate_intelligence
    from app.ml.loader import models_available

    if not models_available():
        return None
    profile = fetch_user_profile(client, user_id)
    txns = transactions_as_dicts(client, user_id)
    return generate_intelligence(txns, profile)


def fetch_balance_info(client: Client, user_id: str) -> dict[str, Any]:
    """Fetch current balance and recurring expenses."""
    try:
        balance_response = (
            client.table("starting_balance")
            .select("*")
            .eq("user_id", user_id)
            .maybe_single()
            .execute()
        )
        balance_data = balance_response.data or {}
        current_balance = float(balance_data.get("current_balance") or 0)
        
        # Fetch recurring obligations
        recurring_response = (
            client.table("recurring_obligations")
            .select("*")
            .eq("user_id", user_id)
            .execute()
        )
        recurring = recurring_response.data or []
        
        return {
            "current_balance": current_balance,
            "recurring_expenses": recurring,
        }
    except Exception:
        return {
            "current_balance": 0,
            "recurring_expenses": [],
        }


def build_full_snapshot(client: Client, user_id: str) -> dict[str, Any]:
    snapshot = build_snapshot(client, user_id)
    snapshot["ml"] = get_ml_insights(client, user_id)
    from app.ml.loader import models_available

    snapshot["ml_models_available"] = ml_stack_available() and models_available()
    
    # Add enhanced predictive analytics if ML stack is available
    if ml_stack_available():
        try:
            from app.ml.forecast import get_spending_forecast
            from app.ml.recommendations import (
                calculate_budget_allocation,
                generate_savings_recommendations,
            )
            from app.ml.peer_comparison import compare_with_peers, get_peer_averages
            from app.ml.survival import predict_month_end_survival
            
            profile = fetch_user_profile(client, user_id)
            txns = transactions_as_dicts(client, user_id, limit=1000)
            balance_info = fetch_balance_info(client, user_id)
            
            # Get spending forecast (7 and 30 days)
            spending_forecast = get_spending_forecast(txns)
            
            # Get peer averages for comparison
            peer_avgs = get_peer_averages(
                client,
                user_id,
                profile.get("education_type", "BTech"),
                profile.get("current_semester", 1),
                profile.get("location_type", "metro"),
            )
            
            # Generate savings recommendations
            savings_opportunities = generate_savings_recommendations(txns, profile, peer_avgs)
            
            # Calculate budget health (50/30/20)
            budget_health = calculate_budget_allocation(txns, profile.get("monthly_income", 10000))
            
            # Predict survival
            survival_forecast = predict_month_end_survival(
                txns,
                balance_info["current_balance"],
                profile.get("monthly_income", 0),
            )
            
            # Peer comparison
            peer_comparison = compare_with_peers(txns, peer_avgs)
            
            # Enhance snapshot with predictive analytics
            snapshot["spending_forecast"] = spending_forecast
            snapshot["savings_opportunities"] = savings_opportunities
            snapshot["budget_health"] = budget_health
            snapshot["survival_forecast"] = survival_forecast
            snapshot["peer_comparison"] = peer_comparison
            
            # Generate smart alerts
            smart_alerts = []
            
            # Survival alert
            if survival_forecast.get("risk_level") in ["high", "critical"]:
                smart_alerts.append({
                    "type": "survival_risk",
                    "severity": survival_forecast.get("risk_level"),
                    "message": survival_forecast.get("message"),
                    "days_until_broke": survival_forecast.get("days_until_broke"),
                })
            
            # Overspending prediction alerts
            forecast_30d = spending_forecast.get("next_30_days", {})
            monthly_budget = profile.get("monthly_budget", 10000)
            if forecast_30d.get("total_predicted", 0) > monthly_budget * 1.1:
                smart_alerts.append({
                    "type": "overspend_prediction",
                    "severity": "high",
                    "message": f"Projected to overspend by ₹{int(forecast_30d['total_predicted'] - monthly_budget)} this month",
                    "projected_amount": forecast_30d.get("total_predicted"),
                    "budget": monthly_budget,
                })
            
            # Budget health alert
            if budget_health.get("savings_percent", 0) < 10:
                smart_alerts.append({
                    "type": "low_savings",
                    "severity": "medium",
                    "message": f"You're only saving {budget_health.get('savings_percent')}% of income. Aim for 20%.",
                    "current_savings_percent": budget_health.get("savings_percent"),
                })
            
            snapshot["smart_alerts"] = smart_alerts
            
        except Exception as e:
            # If enhanced analytics fail, continue with basic snapshot
            print(f"Enhanced analytics failed: {e}")
            pass
    
    return snapshot
