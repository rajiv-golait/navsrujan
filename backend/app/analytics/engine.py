"""PRD-compliant pure-Python analytics engine."""

import calendar
from datetime import date, timedelta
from typing import Any

def calculate_burn_rate(transactions: list[dict[str, Any]], today: date) -> dict[str, float]:
    """Calculate daily burn rate (7-day rolling) and 30-day projection."""
    seven_days_ago = today - timedelta(days=7)
    recent_txns = [t for t in transactions if date.fromisoformat(t["transaction_date"]) >= seven_days_ago]
    
    total_7d = sum(t["amount"] for t in recent_txns)
    daily_burn_rate = total_7d / 7.0
    projected_monthly = daily_burn_rate * 30.0
    
    return {
        "daily_burn_rate": round(daily_burn_rate, 2),
        "projected_monthly": round(projected_monthly, 2)
    }

def calculate_survival_prediction(current_balance: float, daily_burn_rate: float, days_remaining: int) -> dict[str, Any]:
    """Predict if user will survive the month based on burn rate."""
    projected_spending = daily_burn_rate * days_remaining
    projected_balance = current_balance - projected_spending
    
    if current_balance <= 0:
        buffer_pct = 0
    else:
        buffer_pct = (projected_balance / current_balance) * 100
        
    if buffer_pct > 20:
        risk_level = "low"
        status = "safe"
    elif projected_balance > 0:
        risk_level = "medium"
        status = "tight"
    else:
        risk_level = "high"
        status = "deficit"
        
    return {
        "projected_spending": round(projected_spending, 2),
        "projected_balance": round(projected_balance, 2),
        "risk_level": risk_level,
        "status": status
    }

def calculate_overspending(current_month_txns: list[dict[str, Any]], past_3_months_txns: list[dict[str, Any]]) -> list[dict[str, Any]]:
    """Flag categories >20% above 3-month average."""
    current_totals = {}
    for t in current_month_txns:
        cat = t["category"]
        current_totals[cat] = current_totals.get(cat, 0) + t["amount"]
        
    past_totals = {}
    for t in past_3_months_txns:
        cat = t["category"]
        past_totals[cat] = past_totals.get(cat, 0) + t["amount"]
        
    alerts = []
    for cat, current_amt in current_totals.items():
        avg_3_months = past_totals.get(cat, 0) / 3.0
        if avg_3_months == 0:
            continue
            
        deviation = ((current_amt - avg_3_months) / avg_3_months) * 100
        if deviation > 20:
            alerts.append({
                "category": cat,
                "current_amount": round(current_amt, 2),
                "average_amount": round(avg_3_months, 2),
                "deviation_percent": round(deviation, 2)
            })
            
    return sorted(alerts, key=lambda x: x["deviation_percent"], reverse=True)

def calculate_category_breakdown(transactions: list[dict[str, Any]]) -> dict[str, Any]:
    """Separate academic vs personal expenses."""
    academic_total = 0.0
    personal_total = 0.0
    categories = {}
    
    for t in transactions:
        amt = t["amount"]
        cat = t["category"]
        
        categories[cat] = categories.get(cat, 0.0) + amt
        
        if t.get("is_academic", False) or cat in ["Education", "Academic"]:
            academic_total += amt
        else:
            personal_total += amt
            
    return {
        "academic_total": round(academic_total, 2),
        "personal_total": round(personal_total, 2),
        "total": round(academic_total + personal_total, 2),
        "categories": {k: round(v, 2) for k, v in categories.items()}
    }

def calculate_semester_phase(semester_start: date, semester_end: date, today: date) -> str:
    """Detect semester phase (start/mid/end)."""
    if today < semester_start or today > semester_end:
        return "out_of_session"
        
    total_days = (semester_end - semester_start).days
    days_elapsed = (today - semester_start).days
    
    progress = days_elapsed / total_days
    
    if progress < 0.2:
        return "start"
    elif progress > 0.8:
        return "end"
    else:
        return "mid"
