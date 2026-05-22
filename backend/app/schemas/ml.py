from typing import Any, Optional
from pydantic import BaseModel

class MLBurnRateResponse(BaseModel):
    burn_rate_daily: float
    projected_monthly: float
    available: bool = True
    reason: Optional[str] = None

class MLAnomalyResponse(BaseModel):
    anomaly_count: int
    recent_anomalies: list[dict[str, Any]]
    available: bool = True
    reason: Optional[str] = None

class MLStressScoreResponse(BaseModel):
    financial_stress_score: float
    stress_level: str
    available: bool = True
    reason: Optional[str] = None

class MLForecastResponse(BaseModel):
    category: str
    forecast_30d: float
    available: bool = True
    reason: Optional[str] = None
    fallback: Optional[str] = None

class MLPersonalityResponse(BaseModel):
    behavioral_profile: str
    available: bool = True
    reason: Optional[str] = None
