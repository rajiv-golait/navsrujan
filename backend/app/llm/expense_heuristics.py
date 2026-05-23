"""Rule-based fallback when LLM parse confidence is low or fields are missing."""

from __future__ import annotations

import re
from datetime import date
from typing import Any

_CATEGORY_ALIASES: dict[str, str] = {
    "food": "Food",
    "food & drink": "Food",
    "food and drink": "Food",
    "dining": "Food",
    "transport": "Transport",
    "travel": "Transport",
    "entertainment": "Entertainment",
    "shopping": "Shopping",
    "bills": "Bills",
    "utilities": "Bills",
    "education": "Education",
    "academic": "Academic",
    "health": "Health",
    "medical": "Health",
    "other": "Other",
}

_AMOUNT_PATTERNS = (
    re.compile(r"(?:₹|rs\.?|inr)\s*(\d+(?:\.\d{1,2})?)", re.I),
    re.compile(r"(\d+(?:\.\d{1,2})?)\s*(?:₹|rs\.?|rupees?)", re.I),
    re.compile(r"(?:spent|paid|cost|for|@)\s*(\d+(?:\.\d{1,2})?)", re.I),
    re.compile(r"\b(\d{1,7}(?:\.\d{1,2})?)\b"),
)


def normalize_category(value: Any) -> str | None:
    if value is None:
        return None
    key = str(value).strip().lower()
    if key in _CATEGORY_ALIASES:
        return _CATEGORY_ALIASES[key]
    title = str(value).strip().title()
    if title in {
        "Food",
        "Transport",
        "Entertainment",
        "Shopping",
        "Bills",
        "Education",
        "Health",
        "Other",
        "Academic",
    }:
        return title
    return None


def extract_amount(text: str) -> float | None:
    candidates: list[float] = []
    for pattern in _AMOUNT_PATTERNS:
        for match in pattern.finditer(text):
            try:
                value = float(match.group(1))
            except ValueError:
                continue
            if 0 < value <= 10_000_000:
                candidates.append(value)
    if not candidates:
        return None
    # Prefer explicit currency-tagged amounts, else the last number in the phrase.
    for pattern in _AMOUNT_PATTERNS[:2]:
        for match in pattern.finditer(text):
            try:
                return float(match.group(1))
            except ValueError:
                continue
    return candidates[-1]


_CREDIT_HINTS = (
    "received",
    "got",
    "credited",
    "credit",
    "refund",
    "salary",
    "stipend",
    "allowance",
    "income",
    "earned",
    "sent me",
    "transfer from",
    "payment from",
    "money in",
    "came in",
    "mom sent",
    "dad sent",
    "friend sent",
    "reimbursement",
)

_DEBIT_HINTS = (
    "spent",
    "paid",
    "bought",
    "purchase",
    "debit",
    "sent to",
    "paid to",
    "ordered",
    "withdraw",
)


def detect_transaction_type(text: str) -> str:
    lowered = text.lower()
    credit_score = sum(1 for hint in _CREDIT_HINTS if hint in lowered)
    debit_score = sum(1 for hint in _DEBIT_HINTS if hint in lowered)
    if credit_score > debit_score:
        return "credit"
    if credit_score > 0 and debit_score == 0:
        return "credit"
    return "debit"


def guess_category(text: str, transaction_type: str = "debit") -> str:
    lowered = text.lower()
    if transaction_type == "credit":
        if any(word in lowered for word in ["salary", "stipend", "allowance", "payroll"]):
            return "Other"
        if any(word in lowered for word in ["refund", "cashback"]):
            return "Shopping"
        return "Other"
    if any(
        word in lowered
        for word in [
            "food",
            "restaurant",
            "cafe",
            "pizza",
            "biryani",
            "lunch",
            "dinner",
            "breakfast",
            "swiggy",
            "zomato",
            "snacks",
            "chai",
            "coffee",
        ]
    ):
        return "Food"
    if any(
        word in lowered
        for word in [
            "uber",
            "ola",
            "bus",
            "metro",
            "transport",
            "petrol",
            "diesel",
            "auto",
            "cab",
            "fuel",
        ]
    ):
        return "Transport"
    if any(
        word in lowered
        for word in ["netflix", "movie", "entertainment", "game", "spotify", "party"]
    ):
        return "Entertainment"
    if any(
        word in lowered
        for word in ["amazon", "flipkart", "shop", "mall", "store", "clothes", "shopping"]
    ):
        return "Shopping"
    if any(word in lowered for word in ["fee", "tuition", "textbook", "college", "exam", "academic"]):
        return "Academic"
    if any(word in lowered for word in ["medical", "pharmacy", "hospital", "health", "doctor"]):
        return "Health"
    if any(word in lowered for word in ["bill", "recharge", "electricity", "wifi", "rent"]):
        return "Bills"
    return "Other"


def heuristic_parse_expense(text: str) -> dict[str, Any] | None:
    trimmed = text.strip()
    if not trimmed:
        return None

    amount = extract_amount(trimmed)
    if amount is None:
        return None

    txn_type = detect_transaction_type(trimmed)
    category = guess_category(trimmed, txn_type)
    return {
        "amount": amount,
        "category": category,
        "merchant": None,
        "description": trimmed[:200],
        "transaction_date": date.today().isoformat(),
        "confidence": 0.75,
        "is_academic": category in {"Education", "Academic"},
        "transaction_type": txn_type,
    }


def normalize_transaction_type(value: Any, source_text: str) -> str:
    if value is not None:
        normalized = str(value).strip().lower()
        if normalized in {"credit", "income", "received", "in"}:
            return "credit"
        if normalized in {"debit", "expense", "spent", "out"}:
            return "debit"
    return detect_transaction_type(source_text)


def normalize_llm_expense(raw: dict[str, Any], source_text: str) -> dict[str, Any]:
    """Merge LLM JSON with deterministic hints from the original text."""
    out = dict(raw)
    txn_type = normalize_transaction_type(out.get("transaction_type"), source_text)
    out["transaction_type"] = txn_type
    category = normalize_category(out.get("category")) or guess_category(source_text, txn_type)
    out["category"] = category

    amount = out.get("amount")
    try:
        parsed_amount = float(amount) if amount is not None else 0.0
    except (TypeError, ValueError):
        parsed_amount = 0.0

    if parsed_amount <= 0:
        extracted = extract_amount(source_text)
        if extracted:
            out["amount"] = extracted
            parsed_amount = extracted

    if not out.get("transaction_date"):
        out["transaction_date"] = date.today().isoformat()

    confidence = float(out.get("confidence", 0) or 0)
    if parsed_amount > 0 and category and confidence < 0.65:
        out["confidence"] = 0.7

    if not out.get("description"):
        out["description"] = source_text.strip()[:200]

    return out
