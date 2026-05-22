from typing import Any
from fastapi import APIRouter, Depends

from app.core.security import get_current_user
from app.core.supabase_client import get_user_client
from app.schemas.ml import (
    MLBurnRateResponse,
    MLAnomalyResponse,
    MLStressScoreResponse,
    MLForecastResponse,
    MLPersonalityResponse
)
from app.services.ml_service import MLService

router = APIRouter()

def get_ml_service(
    current_user: dict[str, Any] = Depends(get_current_user),
) -> MLService:
    client = get_user_client(current_user["jwt"])
    return MLService(client, current_user["id"])

@router.get("/burn-rate", response_model=MLBurnRateResponse)
async def get_burn_rate(
    service: MLService = Depends(get_ml_service)
) -> MLBurnRateResponse:
    return service.get_burn_rate()

@router.get("/anomalies", response_model=MLAnomalyResponse)
async def get_anomalies(
    service: MLService = Depends(get_ml_service)
) -> MLAnomalyResponse:
    return service.get_anomalies()

@router.get("/stress-score", response_model=MLStressScoreResponse)
async def get_stress_score(
    service: MLService = Depends(get_ml_service)
) -> MLStressScoreResponse:
    return service.get_stress_score()

@router.get("/forecast/{category}", response_model=MLForecastResponse)
async def get_forecast(
    category: str,
    service: MLService = Depends(get_ml_service)
) -> MLForecastResponse:
    return service.get_forecast(category)

@router.get("/spending-personality", response_model=MLPersonalityResponse)
async def get_spending_personality(
    service: MLService = Depends(get_ml_service)
) -> MLPersonalityResponse:
    return service.get_personality()
