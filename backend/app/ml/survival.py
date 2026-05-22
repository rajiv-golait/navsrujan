"""Month-end survival predictor based on burn rate and balance."""

from __future__ import annotations

from datetime import date, datetime, timedelta
from typing import Any

import pandas as pd


def calculate_burn_rate(transactions: list[dict[str, Any]], days: int = 7) -> float:
    """Calculate daily burn rate from recent EXPENSE transactions only."""
    if not transactions:
        return 0.0
    
    df = pd.DataFrame(transactions)
    if "transaction_date" not in df.columns or "amount" not in df.columns:
        return 0.0
    
    # Filter ONLY debit (expense) transactions - exclude credit (income)
    if "transaction_type" in df.columns:
        df = df[df["transaction_type"] == "debit"]
    
    if df.empty:
        return 0.0
    
    # Ensure date is datetime
    df["transaction_date"] = pd.to_datetime(df["transaction_date"])
    
    # Get recent transactions
    cutoff_date = datetime.now() - timedelta(days=days)
    recent = df[df["transaction_date"] >= cutoff_date]
    
    if recent.empty:
        return 0.0
    
    total_spend = recent["amount"].sum()
    
    # Calculate actual days based on the entire transaction history, bounded by 'days'
    app_usage_days = (datetime.now() - df["transaction_date"].min()).days + 1
    actual_days = max(1, min(days, app_usage_days))
    
    return float(total_spend / actual_days)


def predict_month_end_survival(
    transactions: list[dict[str, Any]],
    current_balance: float,
    monthly_income: float = 0,
) -> dict[str, Any]:
    """
    Predict if user will survive till month-end based on current burn rate.
    
    Returns:
        - days_until_broke: Estimated days until balance reaches zero
        - will_survive: Boolean indicating if user will make it to month-end
        - shortage_amount: How much short they'll be (if any)
        - risk_level: low/medium/high
        - confidence: Prediction confidence level
        - message: Human-readable message
    """
    # Calculate daily burn rate (last 7 days)
    daily_burn = calculate_burn_rate(transactions, days=7)
    
    # Days remaining in current month
    today = date.today()
    # Calculate last day of current month
    if today.month == 12:
        last_day_of_month = date(today.year, 12, 31)
    else:
        # First day of next month minus one day
        next_month = date(today.year, today.month + 1, 1)
        last_day_of_month = next_month - timedelta(days=1)
    
    days_remaining = (last_day_of_month - today).days + 1
    
    # Calculate days until broke
    days_until_broke = int(current_balance / daily_burn) if daily_burn > 0 else 999
    
    # Projected spending
    projected_spend = daily_burn * days_remaining
    projected_balance = current_balance - projected_spend
    
    # Will they survive?
    will_survive = projected_balance >= 0
    shortage = abs(projected_balance) if projected_balance < 0 else 0
    
    # Risk level assessment
    if days_until_broke < 5:
        risk_level = "critical"
        confidence = "high"
    elif days_until_broke < days_remaining:
        risk_level = "high"
        confidence = "high"
    elif projected_balance < (monthly_income * 0.1):  # Less than 10% buffer
        risk_level = "medium"
        confidence = "medium"
    else:
        risk_level = "low"
        confidence = "high"
    
    # Generate message
    if risk_level == "critical":
        message = f"Critical! You'll run out in {days_until_broke} days. Reduce spending immediately."
    elif risk_level == "high":
        message = f"At current pace, you'll run out ₹{int(shortage)} short by month-end"
    elif risk_level == "medium":
        message = f"Tight budget. You'll have only ₹{int(projected_balance)} left by month-end"
    else:
        message = f"Safe. You'll have ₹{int(projected_balance)} remaining by month-end"
    
    return {
        "days_until_broke": days_until_broke,
        "days_remaining_in_month": days_remaining,
        "will_survive_month": will_survive,
        "projected_balance_month_end": round(projected_balance, 2),
        "shortage_amount": round(shortage, 2),
        "daily_burn_rate": round(daily_burn, 2),
        "projected_spend_till_month_end": round(projected_spend, 2),
        "current_balance": current_balance,
        "risk_level": risk_level,
        "confidence": confidence,
        "message": message,
    }


def calculate_runway(
    current_balance: float,
    recurring_expenses: list[dict[str, Any]],
    daily_burn_rate: float,
) -> dict[str, Any]:
    """
    Calculate financial runway considering recurring expenses.
    
    NOTE: This is a conservative estimate assuming:
    - Daily burn rate continues at current pace (excludes one-time large purchases)
    - Recurring expenses happen as scheduled
    - No additional income
    
    Args:
        current_balance: Available balance
        recurring_expenses: List of upcoming recurring expenses
        daily_burn_rate: Daily spending rate (should be average daily expenses, not including recurring)
    
    Returns:
        Runway analysis with critical dates
    """
    if current_balance <= 0:
        return {
            "runway_days": 0,
            "runway_weeks": 0,
            "critical_date": datetime.now().date().isoformat(),
            "upcoming_obligations": [],
            "requires_action": True,
        }
    
    if daily_burn_rate <= 0:
        return {
            "runway_days": 999,
            "runway_weeks": 142,
            "critical_date": None,
            "upcoming_obligations": [],
            "requires_action": False,
        }
    
    # Sort recurring expenses by date (future only)
    obligations = []
    today = datetime.now().date()
    if recurring_expenses:
        df = pd.DataFrame(recurring_expenses)
        if "due_date" in df.columns and "amount" in df.columns:
            df["due_date"] = pd.to_datetime(df["due_date"])
            # Only future obligations
            df = df[df["due_date"].dt.date >= today]
            df = df.sort_values("due_date")
            obligations = df[["due_date", "amount", "expense_name"]].to_dict("records")
    
    # Calculate runway
    balance = current_balance
    days = 0
    critical_date = None
    
    # Simulate day by day
    for day in range(365):  # Max 1 year simulation
        current_date = today + timedelta(days=day)
        
        # Check for recurring expenses due today (before daily burn)
        for obligation in obligations:
            due_date = obligation["due_date"].date() if hasattr(obligation["due_date"], "date") else obligation["due_date"]
            if due_date == current_date:
                balance -= float(obligation["amount"])
                # Check if this obligation breaks the bank
                if balance <= 0:
                    days = day
                    critical_date = current_date.isoformat()
                    return {
                        "runway_days": days,
                        "runway_weeks": round(days / 7, 1),
                        "critical_date": critical_date,
                        "upcoming_obligations": obligations[:5],
                        "requires_action": days < 30,
                        "breaks_on": f"Recurring payment: {obligation.get('expense_name', 'expense')}",
                    }
        
        # Deduct daily burn (average daily expenses)
        balance -= daily_burn_rate
        
        # Check if broke
        if balance <= 0:
            days = day
            critical_date = current_date.isoformat()
            break
    else:
        days = 365
    
    return {
        "runway_days": days,
        "runway_weeks": round(days / 7, 1),
        "critical_date": critical_date,
        "upcoming_obligations": obligations[:5],  # Next 5 obligations
        "requires_action": days < 30,
    }
