from typing import Any, Optional

from pydantic import BaseModel


class MLInsightResponse(BaseModel):
    burn_rate_daily: float = 0.0
    estimated_days_remaining: int = 0
    overspending_risk: str = "Low"
    top_risk_category: Optional[str] = None
    financial_stress_score: float = 0.0
    stress_level: str = "Low"
    behavioral_profile: Optional[str] = None
    budget_utilization_pct: Optional[float] = None
    anomaly_count: int = 0
    models_loaded: bool = False


class AnalyticsInsightsResponse(BaseModel):
    snapshot: dict[str, Any]
    ml: Optional[MLInsightResponse] = None
    ml_models_available: bool = False
