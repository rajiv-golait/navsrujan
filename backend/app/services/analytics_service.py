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


def build_full_snapshot(client: Client, user_id: str) -> dict[str, Any]:
    snapshot = build_snapshot(client, user_id)
    snapshot["ml"] = get_ml_insights(client, user_id)
    from app.ml.loader import models_available

    snapshot["ml_models_available"] = ml_stack_available() and models_available()
    return snapshot
