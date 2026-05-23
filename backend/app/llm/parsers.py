"""Validation helpers for LLM-parsed expense data."""

from __future__ import annotations

from datetime import date
from decimal import Decimal
from typing import Any, Optional

from pydantic import BaseModel, Field, field_validator

from app.schemas.transaction import TransactionCategory, TransactionCreate, TransactionType


class ParsedExpense(BaseModel):
    amount: Decimal = Field(..., gt=0)
    category: TransactionCategory
    merchant: Optional[str] = None
    description: Optional[str] = None
    transaction_date: date
    confidence: float = Field(..., ge=0, le=1)
    is_academic: bool = False
    transaction_type: TransactionType = TransactionType.DEBIT

    @field_validator("confidence")
    @classmethod
    def check_confidence(cls, v: float) -> float:
        return v


class ParseValidationError(Exception):
    def __init__(self, message: str, confidence: float = 0.0):
        super().__init__(message)
        self.message = message
        self.confidence = confidence


def validate_parsed_expense(raw: dict[str, Any]) -> TransactionCreate:
    """Validate LLM or heuristic output and return a TransactionCreate-ready object."""
    confidence = float(raw.get("confidence", 0) or 0)

    try:
        parsed = ParsedExpense.model_validate(raw)
    except Exception as exc:
        raise ParseValidationError(
            f"Could not parse expense fields: {exc}",
            confidence=confidence,
        ) from exc

    if confidence < 0.35:
        raise ParseValidationError(
            "Could not confidently parse the amount or category. "
            "Please specify the amount clearly (e.g. 'pizza 250').",
            confidence=confidence,
        )

    return TransactionCreate(
        amount=parsed.amount,
        category=parsed.category,
        merchant=parsed.merchant,
        description=parsed.description,
        transaction_date=parsed.transaction_date,
        entry_method="nlp",
        is_academic=parsed.is_academic,
        transaction_type=parsed.transaction_type,
        confidence_score=Decimal(str(round(parsed.confidence, 2))),
    )
