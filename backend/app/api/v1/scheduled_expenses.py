from typing import Any, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, Query, status

from app.core.security import get_current_user
from app.core.supabase_client import get_user_client
from app.schemas.scheduled_expense import (
    ScheduledExpenseCreate,
    ScheduledExpenseResponse,
    ScheduledExpenseUpdate,
)
from app.services.scheduled_expense_service import ScheduledExpenseService

router = APIRouter()


def get_service(current_user: dict[str, Any] = Depends(get_current_user)) -> ScheduledExpenseService:
    client = get_user_client(current_user["jwt"])
    return ScheduledExpenseService(client, current_user["id"])


@router.get("", response_model=list[ScheduledExpenseResponse])
async def list_scheduled(
    status_filter: Optional[str] = Query("planned"),
    service: ScheduledExpenseService = Depends(get_service),
) -> list[ScheduledExpenseResponse]:
    return service.list(status_filter=status_filter)


@router.post("", response_model=ScheduledExpenseResponse, status_code=status.HTTP_201_CREATED)
async def create_scheduled(
    body: ScheduledExpenseCreate,
    service: ScheduledExpenseService = Depends(get_service),
) -> ScheduledExpenseResponse:
    return service.create(body)


@router.patch("/{expense_id}", response_model=ScheduledExpenseResponse)
async def update_scheduled(
    expense_id: UUID,
    body: ScheduledExpenseUpdate,
    service: ScheduledExpenseService = Depends(get_service),
) -> ScheduledExpenseResponse:
    return service.update(expense_id, body)


@router.delete("/{expense_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_scheduled(
    expense_id: UUID,
    service: ScheduledExpenseService = Depends(get_service),
) -> None:
    service.delete(expense_id)
