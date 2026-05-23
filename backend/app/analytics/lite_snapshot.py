"""Lightweight analytics snapshot for LLM chat context — no ML libraries."""

from __future__ import annotations

import calendar
import math
from datetime import date
from datetime import timedelta
from decimal import Decimal
from typing import Any

from supabase import Client

from app.services.transaction_service import TransactionService


def _decimal(value: Decimal | float | int) -> float:
    return float(value)


def _month_bounds(year: int, month: int) -> tuple[date, date]:
    last_day = calendar.monthrange(year, month)[1]
    return date(year, month, 1), date(year, month, last_day)


def _previous_month_bounds(today: date) -> tuple[date, date]:
    if today.month == 1:
        return _month_bounds(today.year - 1, 12)
    return _month_bounds(today.year, today.month - 1)


def _group_by_category(transactions: list[Any]) -> list[dict[str, Any]]:
    totals: dict[str, dict[str, Any]] = {}
    grand = Decimal("0")

    for txn in transactions:
        grand += txn.amount
        if txn.category not in totals:
            totals[txn.category] = {"total": Decimal("0"), "count": 0}
        totals[txn.category]["total"] += txn.amount
        totals[txn.category]["count"] += 1

    result = []
    for category, info in sorted(
        totals.items(), key=lambda x: x[1]["total"], reverse=True
    ):
        pct = float(info["total"] / grand * 100) if grand > 0 else 0.0
        result.append(
            {
                "category": category,
                "total": _decimal(info["total"]),
                "count": info["count"],
                "pct": round(pct, 2),
            }
        )
    return result


def _top_merchants(transactions: list[Any], limit: int = 5) -> list[dict[str, Any]]:
    merchants: dict[str, dict[str, Any]] = {}
    for txn in transactions:
        if not txn.merchant:
            continue
        if txn.merchant not in merchants:
            merchants[txn.merchant] = {"total": Decimal("0"), "count": 0}
        merchants[txn.merchant]["total"] += txn.amount
        merchants[txn.merchant]["count"] += 1

    return [
        {
            "merchant": name,
            "total": _decimal(info["total"]),
            "count": info["count"],
        }
        for name, info in sorted(
            merchants.items(), key=lambda x: x[1]["total"], reverse=True
        )[:limit]
    ]


def _fetch_monthly_budget(client: Client, user_id: str) -> float | None:
    response = (
        client.table("user_profiles")
        .select("monthly_budget")
        .eq("id", user_id)
        .maybe_single()
        .execute()
    )
    if not response or not getattr(response, "data", None):
        return None
    if response.data.get("monthly_budget") is None:
        return None
    return float(response.data["monthly_budget"])


def _transaction_rows(transactions: list[Any]) -> list[dict[str, Any]]:
    return [
        {
            "amount": float(txn.amount),
            "category": txn.category,
            "merchant": txn.merchant,
            "transaction_date": txn.transaction_date,
            "day": txn.transaction_date.day,
            "weekday": txn.transaction_date.weekday(),
            "is_weekend": txn.transaction_date.weekday() in {5, 6},
            "is_academic": bool(getattr(txn, "is_academic", False)),
        }
        for txn in transactions
    ]


def _mean(values: list[float], fallback: float = 0.0) -> float:
    if not values:
        return fallback
    return sum(values) / len(values)


def _std(values: list[float]) -> float:
    if not values:
        return 0.0
    avg = _mean(values)
    return math.sqrt(sum((value - avg) ** 2 for value in values) / len(values))


def _build_forecast(
    transactions: list[Any],
    today: date,
    monthly_budget: float | None,
) -> dict[str, Any]:
    rows = _transaction_rows(transactions)
    days_in_month = calendar.monthrange(today.year, today.month)[1]
    days_elapsed = max(today.day, 1)
    daily_budget = (monthly_budget or 0) / days_in_month if monthly_budget else None

    if not rows:
        daily_prediction = round(daily_budget or 0, 2)
        confidence = "low"
        weekday_average = daily_prediction
        weekend_average = daily_prediction
    else:
        totals_by_day: dict[int, float] = {}
        for row in rows:
            totals_by_day[row["day"]] = totals_by_day.get(row["day"], 0.0) + row["amount"]

        daily_actuals = []
        weekday_daily_totals = []
        weekend_daily_totals = []
        
        for day_number in range(1, days_elapsed + 1):
            day_total = totals_by_day.get(day_number, 0.0)
            daily_actuals.append(day_total)
            
            # Determine if this day was a weekend
            # We need to construct a date object to check weekday
            try:
                day_date = date(today.year, today.month, day_number)
                if day_date.weekday() in [5, 6]:
                    weekend_daily_totals.append(day_total)
                else:
                    weekday_daily_totals.append(day_total)
            except ValueError:
                pass

        month_average = _mean(daily_actuals)
        recent_average = _mean(daily_actuals[-min(7, len(daily_actuals)):], month_average)
        weekday_average = _mean(weekday_daily_totals, month_average)
        weekend_average = _mean(weekend_daily_totals, month_average)
        variability = _std(daily_actuals)
        daily_prediction = round((recent_average * 0.6) + (month_average * 0.4), 2)
        confidence = "high" if len(rows) >= 20 and variability < max(month_average, 1) else "medium"

    remaining_days = max(days_in_month - today.day, 0)
    next_days = []
    for index in range(1, min(7, remaining_days) + 1):
        target_date = today + timedelta(days=index)
        if target_date.weekday() in [5, 6]:
            predicted = max(daily_prediction, weekend_average)
        else:
            predicted = (daily_prediction * 0.75) + (weekday_average * 0.25)
        next_days.append(
            {
                "date": target_date.isoformat(),
                "label": target_date.strftime("%a"),
                "predicted": round(float(predicted), 2),
            }
        )

    current_total = sum(row["amount"] for row in rows)
    next_7_total = round(float(sum(day["predicted"] for day in next_days)), 2)
    projected_monthly = round(current_total + (daily_prediction * remaining_days), 2)

    return {
        "method": "weighted_rolling_average",
        "confidence": confidence,
        "daily_prediction": daily_prediction,
        "next_7_days_total": next_7_total,
        "projected_monthly_spend": projected_monthly,
        "daily_budget": round(daily_budget, 2) if daily_budget is not None else None,
        "days": next_days,
    }


def _build_optimization_insights(
    transactions: list[Any],
    monthly_budget: float | None,
    forecast: dict[str, Any],
    month_over_month_pct: float | None,
    today: date,
) -> dict[str, Any]:
    rows = _transaction_rows(transactions)
    budget = float(monthly_budget or 0)
    projected = float(forecast.get("projected_monthly_spend") or 0)
    recommendations: list[dict[str, Any]] = []

    if not rows:
        return {
            "budget_health_score": 100,
            "recommendations": [
                {
                    "priority": "medium",
                    "title": "Set a weekly spending rhythm",
                    "action": "Add daily expenses for a week so the forecast can learn your real routine.",
                    "impact": "Improves prediction quality",
                    "category": "Habit",
                    "potential_savings": 0,
                }
            ],
            "overspending_patterns": [],
        }

    category_totals: dict[str, float] = {}
    for row in rows:
        category = str(row["category"])
        category_totals[category] = category_totals.get(category, 0.0) + row["amount"]

    sorted_categories = sorted(
        category_totals.items(),
        key=lambda item: item[1],
        reverse=True,
    )
    total_spent = sum(category_totals.values())
    top_category, top_total = sorted_categories[0]

    if budget and projected > budget:
        savings_needed = projected - budget
        recommendations.append(
            {
                "priority": "high",
                "title": f"Cap {top_category} spending this week",
                "action": f"Limit {top_category} by Rs {round(savings_needed / 2):,} over the next 7 days.",
                "impact": "Brings projected monthly spend closer to budget",
                "category": top_category,
                "potential_savings": round(savings_needed, 2),
            }
        )

    if total_spent and top_total / total_spent > 0.35:
        recommendations.append(
            {
                "priority": "medium",
                "title": f"Diversify away from {top_category}",
                "action": "Move one repeat purchase to a cheaper option or campus alternative.",
                "impact": f"{top_category} is taking {round(top_total / total_spent * 100)}% of spend",
                "category": top_category,
                "potential_savings": round(top_total * 0.15, 2),
            }
        )

    if month_over_month_pct and month_over_month_pct > 20:
        recommendations.append(
            {
                "priority": "medium",
                "title": "Slow the month-over-month jump",
                "action": "Review the three newest non-academic purchases before adding another.",
                "impact": f"Spending is up {month_over_month_pct}% versus last month",
                "category": "Trend",
                "potential_savings": round(total_spent * 0.1, 2),
            }
        )

    if not recommendations:
        recommendations.append(
            {
                "priority": "low",
                "title": "Maintain the current pace",
                "action": "Keep logging transactions and preserve your current daily limit.",
                "impact": "Projected spending is within the safe zone",
                "category": "Discipline",
                "potential_savings": 0,
            }
        )

    target_shares = {
        "Food": 0.30,
        "Transport": 0.15,
        "Entertainment": 0.12,
        "Shopping": 0.12,
        "Bills": 0.20,
        "Education": 0.20,
        "Academic": 0.20,
        "Health": 0.08,
        "Other": 0.10,
    }
    days_elapsed = max(today.day, 1)
    days_in_month = calendar.monthrange(today.year, today.month)[1]
    patterns = []
    for category, amount in sorted_categories[:5]:
        share = target_shares.get(str(category), 0.10)
        category_budget = budget * share if budget else 0
        category_projection = float(amount) / days_elapsed * days_in_month
        over_budget = bool(category_budget and category_projection > category_budget)
        patterns.append(
            {
                "category": str(category),
                "current": round(float(amount), 2),
                "projected": round(category_projection, 2),
                "target": round(category_budget, 2) if category_budget else None,
                "status": "over" if over_budget else "on_track",
            }
        )

    utilization = (projected / budget) if budget else 0
    health_score = int(min(100, max(0, 100 - max(0, utilization - 0.75) * 160)))

    return {
        "budget_health_score": health_score,
        "recommendations": recommendations[:4],
        "overspending_patterns": patterns,
    }


def build_snapshot(client: Client, user_id: str) -> dict[str, Any]:
    """
    Build a basic-facts dict for LLM chat context.
    The 'ml' field is reserved for future Colab model outputs.
    """
    today = date.today()
    month_start, month_end = _month_bounds(today.year, today.month)
    prev_start, prev_end = _previous_month_bounds(today)

    service = TransactionService(client, user_id)
    this_month = service.list(limit=1000, start_date=month_start, end_date=today)
    last_month = service.list(
        limit=1000, start_date=prev_start, end_date=prev_end
    )
    this_month = [t for t in this_month if getattr(t, "transaction_type", "debit") == "debit"]
    last_month = [t for t in last_month if getattr(t, "transaction_type", "debit") == "debit"]

    total_spent = sum((t.amount for t in this_month), Decimal("0"))
    last_month_total = sum((t.amount for t in last_month), Decimal("0"))

    days_elapsed = max((today - month_start).days + 1, 1)
    days_in_month = calendar.monthrange(today.year, today.month)[1]
    days_remaining = max(days_in_month - today.day, 0)

    daily_burn = total_spent / days_elapsed
    projected_monthly = daily_burn * days_in_month

    mom_pct: float | None = None
    if last_month_total > 0:
        mom_pct = round(
            float((total_spent - last_month_total) / last_month_total * 100), 2
        )

    monthly_budget = _fetch_monthly_budget(client, user_id)
    forecast = _build_forecast(this_month, today, monthly_budget)
    optimization = _build_optimization_insights(
        this_month,
        monthly_budget,
        forecast,
        mom_pct,
        today,
    )

    recent = [
        {
            "amount": _decimal(t.amount),
            "category": t.category,
            "merchant": t.merchant,
            "description": t.description,
            "transaction_date": t.transaction_date.isoformat(),
        }
        for t in this_month[:10]
    ]

    return {
        "month": month_start.strftime("%Y-%m"),
        "total_spent_this_month": _decimal(total_spent),
        "transaction_count_this_month": len(this_month),
        "days_elapsed_this_month": days_elapsed,
        "days_remaining_this_month": days_remaining,
        "daily_burn_rate": round(_decimal(daily_burn), 2),
        "projected_monthly_spend": round(_decimal(projected_monthly), 2),
        "monthly_budget": monthly_budget,
        "forecast": forecast,
        **optimization,
        "top_categories": _group_by_category(this_month),
        "top_merchants": _top_merchants(this_month),
        "recent_transactions": recent,
        "last_month_total": _decimal(last_month_total),
        "month_over_month_pct": mom_pct,
        "ml": None,
    }
