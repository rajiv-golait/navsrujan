"""Extract scheduled expenses, recurring obligations, and memory facts from chat."""

from __future__ import annotations

import json
import re
from datetime import date, timedelta
from typing import Any, Optional
from uuid import UUID

from supabase import Client

from app.schemas.scheduled_expense import ScheduledExpenseCreate
from app.schemas.recurring import RecurringObligationCreate
from app.services.memory_service import MemoryService
from app.services.recurring_service import RecurringObligationService
from app.services.scheduled_expense_service import ScheduledExpenseService


def _keyword_extract(text: str) -> dict[str, Any]:
    """Rule-based fallback when LLM unavailable."""
    low = text.lower()
    result: dict[str, Any] = {
        "scheduled_expense": None,
        "recurring_obligation": None,
        "memory_fact": None,
    }

    amount_match = re.search(
        r"(?:₹|rs\.?|inr)?\s*([\d,]+(?:\.\d+)?)\s*(?:k|thousand)?",
        low,
        re.I,
    )
    amount = None
    if amount_match:
        raw = amount_match.group(1).replace(",", "")
        amount = float(raw)
        if "k" in low[amount_match.start() : amount_match.end() + 2]:
            amount *= 1000

    days_match = re.search(r"(\d+)\s*days?", low)
    days = int(days_match.group(1)) if days_match else None

    if any(w in low for w in ["will buy", "going to buy", "plan to buy", "buying", "purchase"]):
        if amount:
            expected = date.today() + timedelta(days=days or 5)
            title = "Planned purchase"
            if "laptop" in low:
                title = "Laptop purchase"
            elif "phone" in low:
                title = "Phone purchase"
            result["scheduled_expense"] = {
                "title": title,
                "amount": amount,
                "expected_date": expected.isoformat(),
                "category": "Shopping",
            }

    if any(
        w in low
        for w in ["petrol", "fuel", "daily commute", "every day", "every week", "monthly rent"]
    ):
        freq = "monthly"
        if "daily" in low or "every day" in low:
            freq = "daily"
        elif "week" in low:
            freq = "weekly"
        name = "Petrol" if "petrol" in low or "fuel" in low else "Recurring expense"
        if amount:
            result["recurring_obligation"] = {
                "name": name,
                "amount": amount,
                "frequency": freq,
                "category": "Transport" if "petrol" in low else "Other",
            }

    if any(w in low for w in ["i work", "my job", "salary", "stipend", "earn"]):
        result["memory_fact"] = {"fact_key": "income_context", "fact_value": text[:200]}

    if any(w in low for w in ["scooter", "bike", "car", "travel by", "commute"]):
        result["memory_fact"] = {"fact_key": "commute_mode", "fact_value": text[:200]}

    return result


async def extract_and_persist(
    client: Client,
    user_id: str,
    text: str,
    *,
    source_message_id: Optional[UUID] = None,
    auto_save: bool = True,
) -> dict[str, Any]:
    """
    Extract structured financial memory from user text.
    Returns extracted items and what was saved.
    """
    extracted = _keyword_extract(text)

    try:
        from app.llm.groq_client import get_groq_client

        groq = get_groq_client()
        llm_result = await groq.extract_financial_memory(text)
        if llm_result:
            extracted = {**extracted, **{k: v or extracted.get(k) for k, v in llm_result.items()}}
    except Exception:  # noqa: BLE001
        pass

    saved: dict[str, Any] = {"scheduled": None, "recurring": None, "fact": None}

    if not auto_save:
        return {"extracted": extracted, "saved": saved}

    sched = extracted.get("scheduled_expense")
    if sched and sched.get("amount") and sched.get("expected_date"):
        svc = ScheduledExpenseService(client, user_id)
        row = svc.create(
            ScheduledExpenseCreate(
                title=str(sched.get("title") or "Planned expense"),
                amount=float(sched["amount"]),
                expected_date=date.fromisoformat(str(sched["expected_date"])),
                category=str(sched.get("category") or "Other"),
                source="chat",
            )
        )
        saved["scheduled"] = row.model_dump(mode="json")

    recur = extracted.get("recurring_obligation")
    if recur and recur.get("amount"):
        svc = RecurringObligationService(client, user_id)
        row = svc.create(
            RecurringObligationCreate(
                name=str(recur.get("name") or "Recurring cost"),
                amount=float(recur["amount"]),
                frequency=recur.get("frequency") or "monthly",
                category=str(recur.get("category") or "Other"),
                source="chat",
            )
        )
        saved["recurring"] = row.model_dump(mode="json")

    fact = extracted.get("memory_fact")
    if fact and fact.get("fact_key") and fact.get("fact_value"):
        mem = MemoryService(client, user_id)
        row = mem.upsert_fact(
            fact_key=str(fact["fact_key"]),
            fact_value=str(fact["fact_value"]),
            importance=int(fact.get("importance") or 5),
            source_message_id=source_message_id,
        )
        saved["fact"] = row.model_dump(mode="json")

    return {"extracted": extracted, "saved": saved}


def build_memory_context(client: Client, user_id: str) -> dict[str, Any]:
    sched_svc = ScheduledExpenseService(client, user_id)
    recur_svc = RecurringObligationService(client, user_id)
    mem_svc = MemoryService(client, user_id)
    return {
        "scheduled_expenses": [
            s.model_dump(mode="json") for s in sched_svc.list(status_filter="planned")
        ],
        "recurring_obligations": [
            r.model_dump(mode="json") for r in recur_svc.list(active_only=True)
        ],
        "memory_facts": [m.model_dump(mode="json") for m in mem_svc.list_facts()],
    }
