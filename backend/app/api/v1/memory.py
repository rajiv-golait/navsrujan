from typing import Any
from uuid import UUID

from fastapi import APIRouter, Depends, status

from app.core.security import get_current_user
from app.core.supabase_client import get_user_client
from app.schemas.memory import MemoryFactCreate, MemoryFactResponse
from app.services.memory_service import MemoryService

router = APIRouter()


def get_service(current_user: dict[str, Any] = Depends(get_current_user)) -> MemoryService:
    client = get_user_client(current_user["jwt"])
    return MemoryService(client, current_user["id"])


@router.get("", response_model=list[MemoryFactResponse])
async def list_memory(
    service: MemoryService = Depends(get_service),
) -> list[MemoryFactResponse]:
    return service.list_facts()


@router.post("", response_model=MemoryFactResponse, status_code=status.HTTP_201_CREATED)
async def create_memory(
    body: MemoryFactCreate,
    service: MemoryService = Depends(get_service),
) -> MemoryFactResponse:
    return service.upsert_fact(
        fact_key=body.fact_key,
        fact_value=body.fact_value,
        importance=body.importance,
    )


@router.delete("/{fact_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_memory(
    fact_id: UUID,
    service: MemoryService = Depends(get_service),
) -> None:
    service.delete_fact(fact_id)
