from typing import Any
from uuid import UUID

from fastapi import APIRouter, Depends, Query, status

from app.core.security import get_current_user
from app.core.supabase_client import get_user_client
from app.schemas.recurring import (
    RecurringObligationCreate,
    RecurringObligationResponse,
    RecurringObligationUpdate,
)
from app.services.recurring_service import RecurringObligationService

router = APIRouter()


def get_service(current_user: dict[str, Any] = Depends(get_current_user)) -> RecurringObligationService:
    client = get_user_client(current_user["jwt"])
    return RecurringObligationService(client, current_user["id"])


@router.get("", response_model=list[RecurringObligationResponse])
async def list_recurring(
    active_only: bool = Query(True),
    service: RecurringObligationService = Depends(get_service),
) -> list[RecurringObligationResponse]:
    return service.list(active_only=active_only)


@router.post("", response_model=RecurringObligationResponse, status_code=status.HTTP_201_CREATED)
async def create_recurring(
    body: RecurringObligationCreate,
    service: RecurringObligationService = Depends(get_service),
) -> RecurringObligationResponse:
    return service.create(body)


@router.patch("/{obligation_id}", response_model=RecurringObligationResponse)
async def update_recurring(
    obligation_id: UUID,
    body: RecurringObligationUpdate,
    service: RecurringObligationService = Depends(get_service),
) -> RecurringObligationResponse:
    return service.update(obligation_id, body)


@router.delete("/{obligation_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_recurring(
    obligation_id: UUID,
    service: RecurringObligationService = Depends(get_service),
) -> None:
    service.delete(obligation_id)
