"""NLP expense parsing service."""

from __future__ import annotations

from datetime import date

from app.llm.groq_client import get_groq_client
from app.llm.parsers import ParseValidationError, validate_parsed_expense
from app.schemas.chat import ParseResult, ParsedTransactionData


async def parse_expense_text(text: str) -> ParseResult:
    groq = get_groq_client()

    try:
        raw = await groq.parse_expense(
            text,
            context={"current_date": date.today().isoformat()},
        )
        confidence = float(raw.get("confidence", 0))

        transaction = validate_parsed_expense(raw)
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
                confidence_score=float(transaction.confidence_score)
                if transaction.confidence_score
                else confidence,
            ),
        )
    except ParseValidationError as exc:
        return ParseResult(
            status="needs_clarification",
            confidence=exc.confidence,
            question=exc.message,
            source_text=text,
        )
    except Exception as exc:
        err = str(exc)
        if "GROQ_API_KEY" in err or "groq package" in err:
            question = err
        else:
            question = f"AI parse failed: {err}"
        return ParseResult(
            status="needs_clarification",
            confidence=0.0,
            question=question,
            source_text=text,
        )
