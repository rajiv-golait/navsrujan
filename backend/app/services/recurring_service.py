from typing import Optional
from uuid import UUID

from fastapi import HTTPException, status
from supabase import Client

from app.schemas.recurring import (
    RecurringObligationCreate,
    RecurringObligationResponse,
    RecurringObligationUpdate,
)


class RecurringObligationService:
    def __init__(self, client: Client, user_id: str):
        self.client = client
        self.user_id = user_id
        self.table = "recurring_obligations"

    def list(self, active_only: bool = True) -> list[RecurringObligationResponse]:
        query = (
            self.client.table(self.table)
            .select("*")
            .eq("user_id", self.user_id)
            .order("name")
        )
        if active_only:
            query = query.eq("is_active", True)
        response = query.execute()
        return [RecurringObligationResponse.model_validate(r) for r in response.data or []]

    def create(self, data: RecurringObligationCreate) -> RecurringObligationResponse:
        payload = {"user_id": self.user_id, **data.model_dump(mode="json")}
        response = self.client.table(self.table).insert(payload).execute()
        if not response.data:
            raise HTTPException(status_code=500, detail="Failed to create recurring obligation")
        return RecurringObligationResponse.model_validate(response.data[0])

    def update(
        self, obligation_id: UUID, data: RecurringObligationUpdate
    ) -> RecurringObligationResponse:
        update_data = data.model_dump(mode="json", exclude_unset=True)
        if not update_data:
            return self.get(obligation_id)
        response = (
            self.client.table(self.table)
            .update(update_data)
            .eq("id", str(obligation_id))
            .eq("user_id", self.user_id)
            .execute()
        )
        if not response.data:
            raise HTTPException(status_code=404, detail="Recurring obligation not found")
        return RecurringObligationResponse.model_validate(response.data[0])

    def get(self, obligation_id: UUID) -> RecurringObligationResponse:
        response = (
            self.client.table(self.table)
            .select("*")
            .eq("id", str(obligation_id))
            .eq("user_id", self.user_id)
            .maybe_single()
            .execute()
        )
        if not response or not response.data:
            raise HTTPException(status_code=404, detail="Recurring obligation not found")
        return RecurringObligationResponse.model_validate(response.data[0])

    def delete(self, obligation_id: UUID) -> None:
        self.get(obligation_id)
        self.client.table(self.table).delete().eq("id", str(obligation_id)).eq(
            "user_id", self.user_id
        ).execute()
