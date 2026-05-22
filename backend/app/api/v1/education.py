from typing import Any
from fastapi import APIRouter, Depends

from app.core.security import get_current_user
from app.core.supabase_client import get_user_client
from app.schemas.education import (
    EducationTemplateResponse,
    EducationProfileSetupRequest,
    EducationContextResponse,
    ExpenseTemplateResponse
)
from app.services.education_service import EducationService

router = APIRouter()

def get_education_service(
    current_user: dict[str, Any] = Depends(get_current_user),
) -> EducationService:
    client = get_user_client(current_user["jwt"])
    return EducationService(client, current_user["id"])

@router.get("/templates", response_model=list[EducationTemplateResponse])
async def list_templates(
    service: EducationService = Depends(get_education_service)
) -> list[EducationTemplateResponse]:
    return service.list_templates()

@router.get("/templates/{template_id}", response_model=EducationTemplateResponse)
async def get_template(
    template_id: str,
    service: EducationService = Depends(get_education_service)
) -> EducationTemplateResponse:
    return service.get_template(template_id)

@router.post("/profile/setup", response_model=EducationContextResponse)
async def setup_profile(
    body: EducationProfileSetupRequest,
    service: EducationService = Depends(get_education_service)
) -> EducationContextResponse:
    return service.setup_profile(body.model_dump(mode="json"))

@router.get("/profile/context", response_model=EducationContextResponse)
async def get_context(
    service: EducationService = Depends(get_education_service)
) -> EducationContextResponse:
    return service.get_context()

@router.get("/semester/{num}/expenses", response_model=list[ExpenseTemplateResponse])
async def get_semester_expenses(
    num: int,
    service: EducationService = Depends(get_education_service)
) -> list[ExpenseTemplateResponse]:
    return service.get_semester_expenses(num)
