from typing import Any

from fastapi import APIRouter, Depends

from app.core.security import get_current_user
from app.core.supabase_client import get_user_client
from app.middleware.rate_limit import enforce_rate_limit
from app.schemas.analytics import AnalyticsInsightsResponse, MLInsightResponse
from app.services.analytics_service import build_full_snapshot, get_ml_insights

router = APIRouter()


@router.get("/insights", response_model=AnalyticsInsightsResponse)
async def get_insights(
    current_user: dict[str, Any] = Depends(get_current_user),
    _user: dict[str, Any] = Depends(enforce_rate_limit),
) -> AnalyticsInsightsResponse:
    client = get_user_client(current_user["jwt"])
    user_id = current_user["id"]
    snapshot = build_full_snapshot(client, user_id)
    ml_raw = snapshot.get("ml")
    ml = MLInsightResponse.model_validate(ml_raw) if ml_raw else None
    return AnalyticsInsightsResponse(
        snapshot=snapshot,
        ml=ml,
        ml_models_available=bool(snapshot.get("ml_models_available")),
    )


@router.get("/ml", response_model=MLInsightResponse)
async def get_ml_only(
    current_user: dict[str, Any] = Depends(get_current_user),
    _user: dict[str, Any] = Depends(enforce_rate_limit),
) -> MLInsightResponse:
    client = get_user_client(current_user["jwt"])
    insights = get_ml_insights(client, current_user["id"])
    if insights is None:
        return MLInsightResponse(models_loaded=False)
    return MLInsightResponse.model_validate(insights)
