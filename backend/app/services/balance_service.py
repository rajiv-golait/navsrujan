"""Balance computation: starting balance + credits/debits + scheduled/recurring."""

from __future__ import annotations

from datetime import date, timedelta
from decimal import Decimal
from typing import Any, Optional

from supabase import Client

from app.services.transaction_service import TransactionService


def _decimal(value: Any) -> float:
    if value is None:
        return 0.0
    return float(value)


def _fetch_profile_balance_fields(client: Client, user_id: str) -> dict[str, Any]:
    response = (
        client.table("user_profiles")
        .select("starting_balance, balance_as_of_date, monthly_budget")
        .eq("id", user_id)
        .maybe_single()
        .execute()
    )
    return response.data or {}


def _sum_transactions_since(
    client: Client,
    user_id: str,
    since: Optional[date],
) -> tuple[float, float]:
    service = TransactionService(client, user_id)
    txns = service.list(limit=5000)
    credits = 0.0
    debits = 0.0
    for txn in txns:
        if since and txn.transaction_date < since:
            continue
        amt = _decimal(txn.amount)
        if getattr(txn, "transaction_type", "debit") == "credit":
            credits += amt
        else:
            debits += amt
    return credits, debits


def _scheduled_total_next_days(client: Client, user_id: str, days: int) -> float:
    end = date.today() + timedelta(days=days)
    response = (
        client.table("scheduled_expenses")
        .select("amount")
        .eq("user_id", user_id)
        .eq("status", "planned")
        .gte("expected_date", date.today().isoformat())
        .lte("expected_date", end.isoformat())
        .execute()
    )
    return sum(_decimal(r.get("amount")) for r in (response.data or []))


def _recurring_total_next_days(client: Client, user_id: str, days: int) -> float:
    """Approximate recurring cost over next N days from active obligations."""
    response = (
        client.table("recurring_obligations")
        .select("*")
        .eq("user_id", user_id)
        .eq("is_active", True)
        .execute()
    )
    rows = response.data or []
    total = 0.0
    for row in rows:
        amount = _decimal(row.get("amount"))
        freq = str(row.get("frequency") or "monthly").lower()
        if freq == "daily":
            total += amount * days
        elif freq == "weekly":
            total += amount * (days / 7.0)
        elif freq == "monthly":
            total += amount * (days / 30.0)
        elif freq == "quarterly":
            total += amount * (days / 90.0)
        elif freq == "yearly":
            total += amount * (days / 365.0)
    return round(total, 2)


def compute_balance(client: Client, user_id: str) -> dict[str, Any]:
    profile = _fetch_profile_balance_fields(client, user_id)
    starting = profile.get("starting_balance")
    as_of_raw = profile.get("balance_as_of_date")

    if starting is None:
        return {
            "configured": False,
            "message": "Set your starting bank balance in profile to enable balance-aware advice.",
            "current_balance": None,
            "projected_balance_30d": None,
            "runway_days": None,
            "breakdown": {},
        }

    as_of = date.fromisoformat(str(as_of_raw)) if as_of_raw else date.today()
    credits, debits = _sum_transactions_since(client, user_id, as_of)
    current = _decimal(starting) + credits - debits

    scheduled_30 = _scheduled_total_next_days(client, user_id, 30)
    recurring_30 = _recurring_total_next_days(client, user_id, 30)
    projected_30 = round(current - scheduled_30 - recurring_30, 2)

    # Calculate daily burn rate from CURRENT MONTH transactions only
    service = TransactionService(client, user_id)
    all_txns = service.list(limit=500)
    
    # Filter for current month debits only
    today = date.today()
    first_day_of_month = date(today.year, today.month, 1)
    month_debits = sum(
        _decimal(t.amount)
        for t in all_txns
        if getattr(t, "transaction_type", "debit") == "debit"
        and t.transaction_date >= first_day_of_month
    )
    
    days_elapsed = (today - first_day_of_month).days + 1  # +1 to include today
    daily_burn = month_debits / days_elapsed if month_debits > 0 and days_elapsed > 0 else 0.0
    
    # Calculate runway (use float division for accuracy)
    if daily_burn > 0:
        runway_days = int(current / daily_burn)
    else:
        runway_days = 999  # No spending = infinite runway

    return {
        "configured": True,
        "starting_balance": round(_decimal(starting), 2),
        "balance_as_of_date": as_of.isoformat(),
        "current_balance": round(current, 2),
        "projected_balance_30d": projected_30,
        "runway_days": runway_days,
        "daily_burn_rate": round(daily_burn, 2),
        "breakdown": {
            "credits_since_anchor": round(credits, 2),
            "debits_since_anchor": round(debits, 2),
            "scheduled_next_30d": round(scheduled_30, 2),
            "recurring_next_30d": round(recurring_30, 2),
        },
    }


def compute_purchase_impact(
    client: Client,
    user_id: str,
    amount: float,
    *,
    days_until: int = 0,
) -> dict[str, Any]:
    balance = compute_balance(client, user_id)
    if not balance.get("configured"):
        return {
            "allowed": False,
            "reason": "balance_not_configured",
            **balance,
        }
    current = float(balance["current_balance"])
    after = round(current - amount, 2)
    daily_burn = float(balance.get("daily_burn_rate") or 0)
    
    # Calculate new runway after purchase
    if daily_burn > 0 and after > 0:
        runway_after = int(after / daily_burn)
    elif after <= 0:
        runway_after = 0
    else:
        runway_after = 999
    return {
        "allowed": True,
        "purchase_amount": round(amount, 2),
        "days_until": days_until,
        "current_balance": current,
        "balance_after_purchase": after,
        "runway_days_before": balance["runway_days"],
        "runway_days_after": runway_after,
        "projected_balance_30d": balance["projected_balance_30d"],
        "recommendation": (
            "safe"
            if after > daily_burn * 7
            else "tight"
            if after > 0
            else "deficit"
        ),
    }
