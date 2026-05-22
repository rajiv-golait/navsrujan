"""Chat orchestration: intent routing, snapshot building, persistence."""

from __future__ import annotations

import re
from datetime import datetime, timezone
from typing import Any, Optional
from uuid import UUID, uuid4

from fastapi import HTTPException, status
from supabase import Client

from app.llm.groq_client import get_groq_client
from app.middleware.prompt_injection import sanitize_prompt
from app.services.response_validator import validate_response_numbers
from app.services.analytics_service import build_full_snapshot
from app.services.balance_service import compute_balance, compute_purchase_impact
from app.services.memory_extractor import build_memory_context, extract_and_persist
from app.schemas.chat import ChatMessageResponse, ChatReplyResponse, ConversationSummary
from app.services import nlp_service


class ChatService:
    def __init__(self, client: Client, user_id: str):
        self.client = client
        self.user_id = user_id
        self.conversations_table = "chat_conversations"
        self.messages_table = "chat_messages"

    def list_conversations(self) -> list[ConversationSummary]:
        response = (
            self.client.table(self.conversations_table)
            .select("*")
            .eq("user_id", self.user_id)
            .order("updated_at", desc=True)
            .execute()
        )

        summaries: list[ConversationSummary] = []
        for row in response.data or []:
            preview = self._last_message_preview(row["id"])
            summaries.append(
                ConversationSummary(
                    id=row["id"],
                    title=row.get("title"),
                    created_at=row["created_at"],
                    updated_at=row["updated_at"],
                    last_message_preview=preview,
                )
            )
        return summaries

    def get_messages(self, conversation_id: UUID) -> list[ChatMessageResponse]:
        self._ensure_conversation(conversation_id)

        response = (
            self.client.table(self.messages_table)
            .select("*")
            .eq("conversation_id", str(conversation_id))
            .eq("user_id", self.user_id)
            .order("created_at", desc=False)
            .execute()
        )

        return [ChatMessageResponse.model_validate(row) for row in response.data or []]

    def delete_conversation(self, conversation_id: UUID) -> None:
        self._ensure_conversation(conversation_id)
        self.client.table(self.conversations_table).delete().eq(
            "id", str(conversation_id)
        ).eq("user_id", self.user_id).execute()

    async def handle_message(
        self,
        content: str,
        conversation_id: Optional[UUID] = None,
    ) -> ChatReplyResponse:
        content = sanitize_prompt(content)

        from app.services.intent_service import classify_intent

        intent = await classify_intent(content)

        if conversation_id is None:
            conversation_id = self._create_conversation(content)
        else:
            self._ensure_conversation(conversation_id)

        memory_result = await extract_and_persist(
            self.client,
            self.user_id,
            content,
            auto_save=intent in {"SCHEDULE_EXPENSE", "RECURRING_ADD", "GENERAL"},
        )

        snapshot = await self._build_snapshot_for_intent(intent, content)
        snapshot["memory_extraction"] = memory_result

        groq = get_groq_client()
        reply = await groq.format_analytics_response(content, snapshot, intent)
        reply = validate_response_numbers(reply, snapshot)

        user_msg = self._insert_message(
            conversation_id=conversation_id,
            role="user",
            content=content,
            intent=intent,
            snapshot=None,
        )
        assistant_msg = self._insert_message(
            conversation_id=conversation_id,
            role="assistant",
            content=reply,
            intent=intent,
            snapshot=snapshot,
        )

        self._touch_conversation(conversation_id)

        return ChatReplyResponse(
            conversation_id=conversation_id,
            reply=reply,
            intent=intent,
            snapshot=snapshot,
            user_message=user_msg,
            assistant_message=assistant_msg,
        )

    async def _build_snapshot_for_intent(
        self, intent: str, content: str
    ) -> dict[str, Any]:
        if intent == "TRANSACTION_ADD":
            parsed = await nlp_service.parse_expense_text(content)
            balance = compute_balance(self.client, self.user_id)
            return {
                "intent": intent,
                "parsed": parsed.model_dump(mode="json"),
                "balance": balance,
            }

        snapshot = build_full_snapshot(self.client, self.user_id)
        snapshot["intent"] = intent
        snapshot["balance"] = compute_balance(self.client, self.user_id)
        snapshot.update(build_memory_context(self.client, self.user_id))

        if intent == "PURCHASE_DECISION":
            amount = _extract_amount_from_text(content)
            if amount:
                snapshot["purchase_check"] = compute_purchase_impact(
                    self.client, self.user_id, amount
                )

        return snapshot

    def _create_conversation(self, first_message: str) -> UUID:
        title = first_message[:60] + ("..." if len(first_message) > 60 else "")
        conversation_id = uuid4()
        self.client.table(self.conversations_table).insert(
            {
                "id": str(conversation_id),
                "user_id": self.user_id,
                "title": title,
            }
        ).execute()
        return conversation_id

    def _ensure_conversation(self, conversation_id: UUID) -> None:
        response = (
            self.client.table(self.conversations_table)
            .select("id")
            .eq("id", str(conversation_id))
            .eq("user_id", self.user_id)
            .maybe_single()
            .execute()
        )
        if not response or not response.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Conversation not found",
            )

    def _insert_message(
        self,
        conversation_id: UUID,
        role: str,
        content: str,
        intent: Optional[str],
        snapshot: Optional[dict[str, Any]],
    ) -> ChatMessageResponse:
        message_id = uuid4()
        payload: dict[str, Any] = {
            "id": str(message_id),
            "conversation_id": str(conversation_id),
            "user_id": self.user_id,
            "role": role,
            "content": content,
        }
        if intent:
            payload["intent"] = intent
        if snapshot is not None:
            payload["analytics_snapshot"] = snapshot

        response = self.client.table(self.messages_table).insert(payload).execute()
        if not response.data:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to save message",
            )
        return ChatMessageResponse.model_validate(response.data[0])

    def _touch_conversation(self, conversation_id: UUID) -> None:
        self.client.table(self.conversations_table).update(
            {"updated_at": datetime.now(timezone.utc).isoformat()}
        ).eq("id", str(conversation_id)).eq("user_id", self.user_id).execute()

    def _last_message_preview(self, conversation_id: str) -> Optional[str]:
        response = (
            self.client.table(self.messages_table)
            .select("content")
            .eq("conversation_id", conversation_id)
            .eq("user_id", self.user_id)
            .order("created_at", desc=True)
            .limit(1)
            .execute()
        )
        if not response.data:
            return None
        content = response.data[0]["content"]
        return content[:80] + ("..." if len(content) > 80 else "")


def _extract_amount_from_text(text: str) -> Optional[float]:
    match = re.search(r"(?:₹|rs\.?|inr)?\s*([\d,]+(?:\.\d+)?)\s*(?:k|thousand)?", text, re.I)
    if not match:
        return None
    raw = match.group(1).replace(",", "")
    amount = float(raw)
    if "k" in text.lower()[match.start() : match.end() + 2]:
        amount *= 1000
    return amount
