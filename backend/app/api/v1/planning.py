from typing import Any
from fastapi import APIRouter, Depends

from app.core.security import get_current_user
from app.core.supabase_client import get_user_client
from app.schemas.planning import (
    DegreeProjectionRequest,
    DegreeProjectionResponse,
    SemesterForecastResponse,
    FundingGapRequest,
    FundingGapResponse,
    PeerComparisonResponse
)
from app.services.planning_service import PlanningService

router = APIRouter()

def get_planning_service(
    current_user: dict[str, Any] = Depends(get_current_user),
) -> PlanningService:
    client = get_user_client(current_user["jwt"])
    return PlanningService(client, current_user["id"])

@router.post("/degree-projection", response_model=DegreeProjectionResponse)
async def create_degree_projection(
    body: DegreeProjectionRequest,
    service: PlanningService = Depends(get_planning_service)
) -> DegreeProjectionResponse:
    plan = service.create_degree_projection(body.plan_name, body.assumptions)
    return DegreeProjectionResponse(
        plan_id=plan["id"],
        plan_name=plan["plan_name"],
        start_date=plan.get("start_date"),
        end_date=plan.get("end_date"),
        total_duration_months=plan["total_duration_months"],
        total_academic_cost=plan["total_academic_cost"],
        total_personal_cost=plan["total_personal_cost"],
        total_estimated_cost=plan["total_estimated_cost"],
        assumptions=plan.get("assumptions")
    )

@router.get("/semester/{num}/forecast", response_model=SemesterForecastResponse)
async def get_semester_forecast(
    num: int,
    service: PlanningService = Depends(get_planning_service)
) -> SemesterForecastResponse:
    return service.get_semester_forecast(num)

@router.post("/funding-gap-analysis", response_model=FundingGapResponse)
async def analyze_funding_gap(
    body: FundingGapRequest,
    service: PlanningService = Depends(get_planning_service)
) -> FundingGapResponse:
    return service.analyze_funding_gap(body.available_funds, body.monthly_income)

@router.get("/peer-comparison", response_model=PeerComparisonResponse)
async def get_peer_comparison(
    service: PlanningService = Depends(get_planning_service)
) -> PeerComparisonResponse:
    return service.get_peer_comparison()
