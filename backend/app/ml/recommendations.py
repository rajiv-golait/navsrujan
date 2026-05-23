"""Savings recommendations engine based on spending patterns and peer comparison."""

from __future__ import annotations

from typing import Any

import pandas as pd


def _calculate_frequency(transactions: list[dict[str, Any]], category: str) -> int:
    """Calculate number of transactions in a category."""
    df = pd.DataFrame(transactions)
    if df.empty or "category" not in df.columns:
        return 0
    return len(df[df["category"] == category])


def _get_actionable_tip(category: str, user_monthly: float, peer_avg: float, frequency: int) -> str:
    """Generate specific, actionable savings tip based on category and spending pattern."""
    savings = user_monthly - peer_avg
    
    tips = {
        "Food": f"You order food {frequency}x/month vs peer avg {max(1, int(frequency * peer_avg / max(1, user_monthly)))}x. Cooking 5 more meals saves ₹{int(savings * 0.6)}",
        "Transport": f"Consider metro pass vs Uber. You spent ₹{int(user_monthly)} on transport. Monthly pass costs ₹{int(peer_avg)} and saves ₹{int(savings)}",
        "Entertainment": f"You spent ₹{int(user_monthly)} on entertainment vs peer ₹{int(peer_avg)}. Reduce OTT subscriptions or movie outings by 30% to save ₹{int(savings * 0.3)}",
        "Shopping": f"Impulse purchases detected. Wait 24hrs before buying non-essentials. This can save you ₹{int(savings * 0.5)}/month",
        "Bills": f"Review subscriptions - you're paying ₹{int(user_monthly)}/month. Cancel unused services to save ₹{int(savings * 0.4)}",
    }
    
    return tips.get(category, f"Reduce {category} spending by 20% to save ₹{int(savings * 0.2)}/month")


def generate_savings_recommendations(
    transactions: list[dict[str, Any]],
    profile: dict[str, Any],
    peer_data: dict[str, float] | None = None,
) -> list[dict[str, Any]]:
    """
    Analyze spending patterns and generate actionable savings recommendations.
    
    Returns list of recommendations sorted by potential savings (highest first).
    """
    if not transactions:
        return []
    
    df = pd.DataFrame(transactions)
    if "category" not in df.columns or "amount" not in df.columns or "transaction_date" not in df.columns:
        return []
        
    # Filter out credit transactions
    if "transaction_type" in df.columns:
        df = df[df["transaction_type"] != "credit"]
        
    if df.empty:
        return []
        
    # Filter to last 30 days for accurate monthly comparison
    from datetime import datetime, timedelta
    df["transaction_date"] = pd.to_datetime(df["transaction_date"])
    cutoff_date = pd.Timestamp(datetime.now() - timedelta(days=30))
    recent_df = df[df["transaction_date"] >= cutoff_date]
    
    if recent_df.empty:
        return []
    
    # Calculate monthly spending by category
    monthly_spend = recent_df.groupby("category")["amount"].sum().to_dict()
    
    # Default peer averages (realistic for Indian students in metros)
    default_peer_avg = {
        "Food": 4200,
        "Transport": 1500,
        "Entertainment": 1200,
        "Shopping": 2000,
        "Bills": 1000,
        "Education": 3000,
        "Health": 800,
    }
    
    peer_averages = peer_data if peer_data else default_peer_avg
    
    recommendations = []
    
    for category, user_monthly in monthly_spend.items():
        if category in ["Academic", "Education", "Health", "Other", "Unknown"]:
            # Skip essential and vague categories
            continue
        
        peer_avg = peer_averages.get(category, user_monthly * 0.7)
        
        # Only recommend if user spends significantly more than peers
        if user_monthly > peer_avg * 1.15:  # 15% threshold
            potential_savings = user_monthly - peer_avg
            frequency = _calculate_frequency(transactions, category)
            
            recommendations.append({
                "category": category,
                "current_monthly": round(user_monthly, 2),
                "peer_average": round(peer_avg, 2),
                "potential_savings": round(potential_savings, 2),
                "savings_percent": round((potential_savings / user_monthly) * 100, 1),
                "frequency": frequency,
                "actionable_tip": _get_actionable_tip(category, user_monthly, peer_avg, frequency),
                "priority": "high" if potential_savings > 1000 else "medium",
            })
    
    # Sort by potential savings (descending)
    recommendations.sort(key=lambda x: x["potential_savings"], reverse=True)
    
    return recommendations[:5]  # Top 5 recommendations


def calculate_budget_allocation(
    transactions: list[dict[str, Any]],
    monthly_income: float,
) -> dict[str, Any]:
    """
    Calculate 50/30/20 budget health analysis.
    
    50% = Needs (food, transport, bills, rent)
    30% = Wants (entertainment, shopping)
    20% = Savings/Investments (unspent income; 0% when overspent)
    """
    if not transactions or monthly_income <= 0:
        return {
            "needs_percent": 0,
            "wants_percent": 0,
            "savings_percent": 0,
            "total_spent": 0,
            "monthly_income": monthly_income,
            "is_overspent": False,
            "overspend_amount": 0,
            "recommended_reallocation": None,
            "status": "needs_data",
        }
    
    df = pd.DataFrame(transactions)
    if "category" not in df.columns or "amount" not in df.columns or "transaction_date" not in df.columns:
        return {
            "needs_percent": 0,
            "wants_percent": 0,
            "savings_percent": 0,
            "total_spent": 0,
            "recommended_reallocation": None,
        }
        
    # Filter out credit transactions
    if "transaction_type" in df.columns:
        df = df[df["transaction_type"] != "credit"]
        
    if df.empty:
        return {
            "needs_percent": 0,
            "wants_percent": 0,
            "savings_percent": 0,
            "total_spent": 0,
            "recommended_reallocation": None,
        }
        
    # Filter to last 30 days for accurate monthly budget allocation
    from datetime import datetime, timedelta
    df["transaction_date"] = pd.to_datetime(df["transaction_date"])
    cutoff_date = pd.Timestamp(datetime.now() - timedelta(days=30))
    recent_df = df[df["transaction_date"] >= cutoff_date]
    
    if recent_df.empty:
        return {
            "needs_percent": 0,
            "wants_percent": 0,
            "savings_percent": 0,
            "total_spent": 0,
            "recommended_reallocation": None,
        }
    
    # Categorize into needs vs wants; remaining spend rolls into wants for 50/30/20 view
    needs_categories = ["Food", "Transport", "Bills", "Health", "Education", "Academic"]
    wants_categories = ["Entertainment", "Shopping", "Other"]
    
    total_spent = float(recent_df["amount"].sum())
    needs_spent = float(recent_df[recent_df["category"].isin(needs_categories)]["amount"].sum())
    wants_spent = float(recent_df[recent_df["category"].isin(wants_categories)]["amount"].sum())
    uncategorized = max(0.0, total_spent - needs_spent - wants_spent)
    wants_spent += uncategorized

    savings = monthly_income - total_spent
    is_overspent = total_spent > monthly_income
    overspend_amount = max(0.0, total_spent - monthly_income)

    needs_percent = (needs_spent / monthly_income) * 100 if monthly_income > 0 else 0
    wants_percent = (wants_spent / monthly_income) * 100 if monthly_income > 0 else 0
    # Never show absurd negative savings % when user overspent
    if is_overspent:
        savings_percent = 0.0
        savings_amount = 0.0
    else:
        savings_percent = (savings / monthly_income) * 100
        savings_amount = round(savings, 2)
    
    # Recommend reallocation if significantly off from 50/30/20
    reallocation = None
    if is_overspent:
        reallocation = {
            "cut_from": "spending",
            "cut_amount": round(overspend_amount, 2),
            "redirect_to": "savings",
            "reason": (
                f"You overspent by ₹{int(overspend_amount):,} vs your monthly budget. "
                "Pause non-essential spending for a few days."
            ),
        }
    elif needs_percent > 60:
        # Overspending on needs
        cut_amount = monthly_income * 0.10  # Cut 10% from needs
        reallocation = {
            "cut_from": "needs",
            "cut_amount": round(cut_amount, 2),
            "redirect_to": "savings",
            "reason": "Needs spending is too high. Look for cheaper alternatives.",
        }
    elif wants_percent > 40:
        # Overspending on wants
        cut_amount = monthly_income * 0.10  # Cut 10% from wants
        reallocation = {
            "cut_from": "wants",
            "cut_amount": round(cut_amount, 2),
            "redirect_to": "savings",
            "reason": "Wants spending is too high. Reduce discretionary expenses.",
        }
    elif savings_percent < 10:
        category_totals = recent_df.groupby("category")["amount"].sum().to_dict()
        top_category = max(category_totals, key=category_totals.get) if category_totals else "Food"
        cut_amount = monthly_income * 0.10

        reallocation = {
            "cut_from": top_category.lower(),
            "cut_amount": round(cut_amount, 2),
            "redirect_to": "savings",
            "reason": f"Increase savings by reducing {top_category} spending.",
        }

    status = "overspent" if is_overspent else (
        "healthy"
        if (40 <= needs_percent <= 60 and 20 <= wants_percent <= 40 and savings_percent >= 15)
        else "needs_adjustment"
    )

    return {
        "needs_percent": round(min(needs_percent, 100), 1),
        "wants_percent": round(min(wants_percent, 100), 1),
        "savings_percent": round(savings_percent, 1),
        "needs_amount": round(needs_spent, 2),
        "wants_amount": round(wants_spent, 2),
        "savings_amount": savings_amount,
        "total_spent": round(total_spent, 2),
        "monthly_income": monthly_income,
        "is_overspent": is_overspent,
        "overspend_amount": round(overspend_amount, 2),
        "recommended_reallocation": reallocation,
        "status": status,
    }
