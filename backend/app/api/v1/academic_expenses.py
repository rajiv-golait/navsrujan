from typing import Any
from fastapi import APIRouter, Depends

from app.core.security import get_current_user
from app.core.supabase_client import get_user_client
from app.schemas.academic_expense import (
    AcademicExpenseCreate,
    AcademicExpenseResponse,
    MissingSuggestionResponse
)
from app.services.academic_expense_service import AcademicExpenseService

router = APIRouter()

def get_academic_expense_service(
    current_user: dict[str, Any] = Depends(get_current_user),
) -> AcademicExpenseService:
    client = get_user_client(current_user["jwt"])
    return AcademicExpenseService(client, current_user["id"])

@router.post("/", response_model=AcademicExpenseResponse)
async def create_academic_expense(
    body: AcademicExpenseCreate,
    service: AcademicExpenseService = Depends(get_academic_expense_service)
) -> AcademicExpenseResponse:
    return service.create(body.model_dump(mode="json", exclude_none=True))

@router.get("/semester/{num}", response_model=list[AcademicExpenseResponse])
async def get_by_semester(
    num: int,
    service: AcademicExpenseService = Depends(get_academic_expense_service)
) -> list[AcademicExpenseResponse]:
    return service.get_by_semester(num)

@router.get("/upcoming", response_model=list[AcademicExpenseResponse])
async def get_upcoming(
    service: AcademicExpenseService = Depends(get_academic_expense_service)
) -> list[AcademicExpenseResponse]:
    return service.get_upcoming()

@router.get("/missing-suggestions", response_model=list[MissingSuggestionResponse])
async def get_missing_suggestions(
    service: AcademicExpenseService = Depends(get_academic_expense_service)
) -> list[MissingSuggestionResponse]:
    return service.get_missing_suggestions()
