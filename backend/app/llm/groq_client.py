"""Groq API wrapper for NLP and chat formatting."""

from __future__ import annotations

import asyncio
import json
from datetime import date
from typing import Any

from app.core.config import settings
from app.llm.prompts import (
    FORMAT_RESPONSE_SYSTEM,
    INTENT_CLASSIFY_SYSTEM,
    MEMORY_EXTRACT_SYSTEM,
    PARSE_EXPENSE_EXAMPLES,
    PARSE_EXPENSE_SYSTEM,
    VALID_INTENTS,
)

PARSE_MODEL = "llama-3.3-70b-versatile"
PARSE_MODEL_FALLBACK = "llama-3.1-8b-instant"
INTENT_MODEL = "llama-3.1-8b-instant"
FORMAT_MODEL = "llama-3.3-70b-versatile"
FORMAT_MODEL_FALLBACK = "llama-3.1-8b-instant"


def _get_groq_module():
    try:
        from groq import Groq
    except ImportError as exc:
        raise RuntimeError(
            "groq package not installed. Run: pip install groq==0.11.0"
        ) from exc
    return Groq


class GroqClient:
    def __init__(self) -> None:
        if not settings.GROQ_API_KEY or settings.GROQ_API_KEY.startswith("your-"):
            raise RuntimeError("GROQ_API_KEY is missing or not configured in .env")
        Groq = _get_groq_module()
        self.client = Groq(api_key=settings.GROQ_API_KEY)

    def _chat_completion(self, **kwargs: Any) -> Any:
        return self.client.chat.completions.create(**kwargs)

    async def _create_completion(self, model: str, fallback: str, **kwargs: Any) -> Any:
        try:
            return await asyncio.to_thread(
                self._chat_completion, model=model, **kwargs
            )
        except Exception:
            return await asyncio.to_thread(
                self._chat_completion, model=fallback, **kwargs
            )

    async def parse_expense(
        self, text: str, context: dict[str, Any] | None = None
    ) -> dict[str, Any]:
        ctx = context or {}
        current_date = ctx.get("current_date", date.today().isoformat())

        user_prompt = (
            f"Current date: {current_date}\n\n"
            f"{PARSE_EXPENSE_EXAMPLES}\n\n"
            f"Parse this expense: {text}"
        )

        response = await self._create_completion(
            PARSE_MODEL,
            PARSE_MODEL_FALLBACK,
            messages=[
                {"role": "system", "content": PARSE_EXPENSE_SYSTEM},
                {"role": "user", "content": user_prompt},
            ],
            response_format={"type": "json_object"},
            temperature=0.1,
        )

        content = response.choices[0].message.content or "{}"
        return json.loads(content)

    async def classify_intent(self, query: str) -> str:
        response = await self._create_completion(
            INTENT_MODEL,
            INTENT_MODEL,
            messages=[
                {"role": "system", "content": INTENT_CLASSIFY_SYSTEM},
                {"role": "user", "content": query},
            ],
            response_format={"type": "json_object"},
            temperature=0.0,
        )

        content = response.choices[0].message.content or "{}"
        data = json.loads(content)
        intent = str(data.get("intent", "general")).lower().strip()
        return intent if intent in VALID_INTENTS else "general"

    async def format_analytics_response(
        self,
        query: str,
        analytics_result: dict[str, Any],
        intent: str = "general",
    ) -> str:
        user_prompt = (
            f'User query: "{query}"\n'
            f"Detected intent: {intent}\n\n"
            f"Analytics snapshot:\n"
            f"{json.dumps(analytics_result, indent=2, default=str)}\n\n"
            "Explain this conversationally to the student."
        )

        response = await self._create_completion(
            FORMAT_MODEL,
            FORMAT_MODEL_FALLBACK,
            messages=[
                {"role": "system", "content": FORMAT_RESPONSE_SYSTEM},
                {"role": "user", "content": user_prompt},
            ],
            temperature=0.7,
            max_tokens=400,
        )

        return (response.choices[0].message.content or "").strip()

    async def extract_financial_memory(self, text: str) -> dict[str, Any]:
        user_prompt = (
            f"Current date: {date.today().isoformat()}\n\n"
            f"Message: {text}"
        )
        try:
            response = await self._create_completion(
                INTENT_MODEL,
                INTENT_MODEL,
                messages=[
                    {"role": "system", "content": MEMORY_EXTRACT_SYSTEM},
                    {"role": "user", "content": user_prompt},
                ],
                response_format={"type": "json_object"},
                temperature=0.0,
            )
            content = response.choices[0].message.content or "{}"
            return json.loads(content)
        except Exception:  # noqa: BLE001
            return {}


_groq_client: GroqClient | None = None


def get_groq_client() -> GroqClient:
    global _groq_client
    if _groq_client is None:
        _groq_client = GroqClient()
    return _groq_client
