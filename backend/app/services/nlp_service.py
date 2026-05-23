"""NLP expense parsing service."""

from __future__ import annotations

from datetime import date

from app.llm.expense_heuristics import heuristic_parse_expense, normalize_llm_expense
from app.llm.groq_client import get_groq_client
from app.llm.parsers import ParseValidationError, validate_parsed_expense
from app.schemas.chat import ParseResult, ParsedTransactionData


def _to_parse_result(text: str, transaction, confidence: float) -> ParseResult:
    return ParseResult(
        status="parsed",
        confidence=confidence,
        source_text=text,
        transaction=ParsedTransactionData(
            amount=float(transaction.amount),
            category=transaction.category.value
            if hasattr(transaction.category, "value")
            else str(transaction.category),
            merchant=transaction.merchant,
            description=transaction.description,
            transaction_date=transaction.transaction_date.isoformat(),
            entry_method="nlp",
            is_academic=transaction.is_academic,
            transaction_type=(
                transaction.transaction_type.value
                if hasattr(transaction.transaction_type, "value")
                else str(transaction.transaction_type or "debit")
            ),
            confidence_score=float(transaction.confidence_score)
            if transaction.confidence_score
            else confidence,
        ),
    )


def _try_validate(raw: dict) -> tuple[Any, float] | None:
    try:
        txn = validate_parsed_expense(raw)
        confidence = float(raw.get("confidence", 0) or 0)
        return txn, confidence
    except ParseValidationError:
        return None


async def parse_expense_text(text: str) -> ParseResult:
    trimmed = text.strip()
    if not trimmed:
        return ParseResult(
            status="needs_clarification",
            confidence=0.0,
            question="Please describe the expense (e.g. 'pizza 250').",
            source_text=text,
        )

    groq = get_groq_client()

    try:
        raw = await groq.parse_expense(
            trimmed,
            context={"current_date": date.today().isoformat()},
        )
        raw = normalize_llm_expense(raw, trimmed)
        validated = _try_validate(raw)
        if validated:
            txn, confidence = validated
            return _to_parse_result(trimmed, txn, confidence)

        fallback = heuristic_parse_expense(trimmed)
        if fallback:
            txn, confidence = _try_validate(fallback) or (None, 0.0)
            if txn:
                return _to_parse_result(trimmed, txn, confidence)

        return ParseResult(
            status="needs_clarification",
            confidence=float(raw.get("confidence", 0) or 0),
            question=(
                "Could not confidently parse the amount or category. "
                "Try format: 'pizza 250' or 'spent 250 on food'."
            ),
            source_text=trimmed,
        )
    except ParseValidationError as exc:
        fallback = heuristic_parse_expense(trimmed)
        if fallback:
            validated = _try_validate(fallback)
            if validated:
                txn, confidence = validated
                return _to_parse_result(trimmed, txn, confidence)
        return ParseResult(
            status="needs_clarification",
            confidence=exc.confidence,
            question=exc.message,
            source_text=trimmed,
        )
    except Exception as exc:
        fallback = heuristic_parse_expense(trimmed)
        if fallback:
            validated = _try_validate(fallback)
            if validated:
                txn, confidence = validated
                return _to_parse_result(trimmed, txn, confidence)

        err = str(exc)
        if "GROQ_API_KEY" in err or "groq package" in err:
            question = err
        else:
            question = f"AI parse failed: {err}"
        return ParseResult(
            status="needs_clarification",
            confidence=0.0,
            question=question,
            source_text=trimmed,
        )
