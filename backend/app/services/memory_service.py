from typing import Any, Optional
from uuid import UUID

from fastapi import HTTPException, status
from supabase import Client

from app.schemas.memory import MemoryFactCreate, MemoryFactResponse


class MemoryService:
    def __init__(self, client: Client, user_id: str):
        self.client = client
        self.user_id = user_id
        self.table = "assistant_memory_facts"

    def list_facts(self, limit: int = 50) -> list[MemoryFactResponse]:
        response = (
            self.client.table(self.table)
            .select("*")
            .eq("user_id", self.user_id)
            .order("importance", desc=True)
            .limit(limit)
            .execute()
        )
        return [MemoryFactResponse.model_validate(r) for r in response.data or []]

    def upsert_fact(
        self,
        *,
        fact_key: str,
        fact_value: str,
        importance: int = 5,
        source_message_id: Optional[UUID] = None,
    ) -> MemoryFactResponse:
        payload: dict[str, Any] = {
            "user_id": self.user_id,
            "fact_key": fact_key[:120],
            "fact_value": fact_value[:500],
            "importance": importance,
        }
        if source_message_id:
            payload["source_message_id"] = str(source_message_id)
        response = (
            self.client.table(self.table)
            .upsert(payload, on_conflict="user_id,fact_key")
            .execute()
        )
        if not response.data:
            raise HTTPException(status_code=500, detail="Failed to save memory fact")
        return MemoryFactResponse.model_validate(response.data[0])

    def delete_fact(self, fact_id: UUID) -> None:
        self.client.table(self.table).delete().eq("id", str(fact_id)).eq(
            "user_id", self.user_id
        ).execute()
