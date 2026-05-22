from datetime import date
from typing import Any, Optional
from uuid import UUID

from fastapi import HTTPException, status
from supabase import Client

from app.schemas.scheduled_expense import (
    ScheduledExpenseCreate,
    ScheduledExpenseResponse,
    ScheduledExpenseUpdate,
)


class ScheduledExpenseService:
    def __init__(self, client: Client, user_id: str):
        self.client = client
        self.user_id = user_id
        self.table = "scheduled_expenses"

    def list(self, status_filter: Optional[str] = "planned") -> list[ScheduledExpenseResponse]:
        query = (
            self.client.table(self.table)
            .select("*")
            .eq("user_id", self.user_id)
            .order("expected_date")
        )
        if status_filter:
            query = query.eq("status", status_filter)
        response = query.execute()
        return [ScheduledExpenseResponse.model_validate(r) for r in response.data or []]

    def create(self, data: ScheduledExpenseCreate) -> ScheduledExpenseResponse:
        payload = {"user_id": self.user_id, **data.model_dump(mode="json")}
        response = self.client.table(self.table).insert(payload).execute()
        if not response.data:
            raise HTTPException(status_code=500, detail="Failed to create scheduled expense")
        return ScheduledExpenseResponse.model_validate(response.data[0])

    def update(self, expense_id: UUID, data: ScheduledExpenseUpdate) -> ScheduledExpenseResponse:
        update_data = data.model_dump(mode="json", exclude_unset=True)
        if not update_data:
            return self.get(expense_id)
        response = (
            self.client.table(self.table)
            .update(update_data)
            .eq("id", str(expense_id))
            .eq("user_id", self.user_id)
            .execute()
        )
        if not response.data:
            raise HTTPException(status_code=404, detail="Scheduled expense not found")
        return ScheduledExpenseResponse.model_validate(response.data[0])

    def get(self, expense_id: UUID) -> ScheduledExpenseResponse:
        response = (
            self.client.table(self.table)
            .select("*")
            .eq("id", str(expense_id))
            .eq("user_id", self.user_id)
            .maybe_single()
            .execute()
        )
        if not response or not response.data:
            raise HTTPException(status_code=404, detail="Scheduled expense not found")
        return ScheduledExpenseResponse.model_validate(response.data[0])

    def delete(self, expense_id: UUID) -> None:
        self.get(expense_id)
        self.client.table(self.table).delete().eq("id", str(expense_id)).eq(
            "user_id", self.user_id
        ).execute()
