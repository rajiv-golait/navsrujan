"""Peer comparison engine for benchmarking spending against similar students."""

from __future__ import annotations

from typing import Any

import pandas as pd
from supabase import Client


def get_peer_averages(
    client: Client,
    user_id: str,
    education_type: str,
    current_semester: int,
    location_type: str,
) -> dict[str, float]:
    """
    Get peer average spending by category for similar students.
    
    Filters peers by:
    - Same education type (BTech, MBA, etc.)
    - Same semester
    - Same location type (metro, tier2, tier3)
    - Excludes the current user
    """
    try:
        # Query user profiles with same context
        profiles_response = (
            client.table("user_profiles")
            .select("id")
            .eq("education_type", education_type)
            .eq("current_semester", current_semester)
            .eq("location_type", location_type)
            .neq("id", user_id)
            .limit(50)  # Get up to 50 peers
            .execute()
        )
        
        peer_ids = [p["id"] for p in profiles_response.data] if profiles_response.data else []
        
        if not peer_ids:
            # No peers found, return default averages
            return _get_default_peer_averages()
        
        # Get transactions for these peers (last 30 days)
        from datetime import datetime, timedelta
        thirty_days_ago = (datetime.now() - timedelta(days=30)).isoformat()
        
        transactions_response = (
            client.table("transactions")
            .select("user_id, category, amount")
            .in_("user_id", peer_ids)
            .gte("transaction_date", thirty_days_ago)
            .execute()
        )
        
        if not transactions_response.data:
            return _get_default_peer_averages()
        
        # Calculate average spending per category
        df = pd.DataFrame(transactions_response.data)
        category_totals = df.groupby("category")["amount"].sum()
        num_peers = len(peer_ids)
        
        averages = {
            category: float(total / num_peers)
            for category, total in category_totals.items()
        }
        
        return averages
        
    except Exception:
        # Fallback to default averages on any error
        return _get_default_peer_averages()


def _get_default_peer_averages() -> dict[str, float]:
    """Default peer averages for Indian students in metros (realistic 2026 values)."""
    return {
        "Food": 4200,
        "Transport": 1500,
        "Entertainment": 1200,
        "Shopping": 2000,
        "Bills": 1000,
        "Education": 3000,
        "Academic": 2500,
        "Health": 800,
        "Other": 1500,
    }


def compare_with_peers(
    user_transactions: list[dict[str, Any]],
    peer_averages: dict[str, float],
) -> dict[str, Any]:
    """
    Compare user's spending with peer averages.
    
    Returns analysis showing:
    - Total spending comparison
    - Category-wise comparison
    - Percentile rank
    - Categories where user is above/below average
    """
    if not user_transactions:
        return {
            "your_monthly_spend": 0,
            "peer_average_spend": 0,
            "difference": 0,
            "percentile": 50,
            "categories_above_peer": [],
            "categories_below_peer": [],
            "by_category": {},
        }
    
    # Calculate user's monthly spending
    df = pd.DataFrame(user_transactions)
    if "category" not in df.columns or "amount" not in df.columns:
        return {
            "your_monthly_spend": 0,
            "peer_average_spend": 0,
            "difference": 0,
            "percentile": 50,
            "categories_above_peer": [],
            "categories_below_peer": [],
            "by_category": {},
        }
    
    user_by_category = df.groupby("category")["amount"].sum().to_dict()
    user_total = df["amount"].sum()
    
    # Calculate peer total
    peer_total = sum(peer_averages.values())
    
    # Compare each category
    above_peer = []
    below_peer = []
    by_category = {}
    
    all_categories = set(list(user_by_category.keys()) + list(peer_averages.keys()))
    
    for category in all_categories:
        user_amount = user_by_category.get(category, 0)
        peer_avg = peer_averages.get(category, user_amount)
        
        if user_amount > 0 or peer_avg > 0:
            difference = user_amount - peer_avg
            percent_diff = (difference / peer_avg * 100) if peer_avg > 0 else 0
            
            by_category[category] = {
                "your_spend": round(user_amount, 2),
                "peer_average": round(peer_avg, 2),
                "difference": round(difference, 2),
                "percent_difference": round(percent_diff, 1),
                "status": "above" if user_amount > peer_avg * 1.1 else ("below" if user_amount < peer_avg * 0.9 else "similar"),
            }
            
            if user_amount > peer_avg * 1.15:  # 15% threshold
                above_peer.append(category)
            elif user_amount < peer_avg * 0.85:  # 15% threshold
                below_peer.append(category)
    
    # Estimate percentile (simplified)
    if user_total > peer_total * 1.3:
        percentile = 85
    elif user_total > peer_total * 1.1:
        percentile = 70
    elif user_total < peer_total * 0.7:
        percentile = 15
    elif user_total < peer_total * 0.9:
        percentile = 30
    else:
        percentile = 50
    
    return {
        "your_monthly_spend": round(user_total, 2),
        "peer_average_spend": round(peer_total, 2),
        "difference": round(user_total - peer_total, 2),
        "percent_difference": round(((user_total - peer_total) / peer_total * 100) if peer_total > 0 else 0, 1),
        "percentile": percentile,
        "categories_above_peer": above_peer,
        "categories_below_peer": below_peer,
        "by_category": by_category,
        "comparison_message": _generate_comparison_message(user_total, peer_total, percentile),
    }


def _generate_comparison_message(user_total: float, peer_avg: float, percentile: int) -> str:
    """Generate human-readable comparison message."""
    diff = user_total - peer_avg
    
    if percentile >= 75:
        return f"You spend ₹{int(abs(diff))} more than average student. Consider optimizing."
    elif percentile >= 55:
        return f"Your spending is slightly above average (₹{int(abs(diff))} more)."
    elif percentile <= 25:
        return f"Great! You spend ₹{int(abs(diff))} less than average student."
    elif percentile <= 45:
        return f"Your spending is slightly below average (₹{int(abs(diff))} less)."
    else:
        return "Your spending is similar to peers."
