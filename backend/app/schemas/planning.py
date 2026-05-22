from typing import Optional
from datetime import date
from pydantic import BaseModel

class DegreeProjectionRequest(BaseModel):
    plan_name: str
    assumptions: Optional[str] = None

class DegreeProjectionResponse(BaseModel):
    plan_id: str
    plan_name: str
    start_date: Optional[date]
    end_date: Optional[date]
    total_duration_months: int
    total_academic_cost: float
    total_personal_cost: float
    total_estimated_cost: float
    assumptions: Optional[str]

class SemesterForecastResponse(BaseModel):
    semester_number: int
    categories: dict[str, float]
    total_forecast: float

class FundingGapRequest(BaseModel):
    available_funds: float
    monthly_income: float

class FundingGapResponse(BaseModel):
    total_estimated_cost: float
    total_available: float
    funding_gap: float
    gap_status: str

class PeerComparisonResponse(BaseModel):
    education_type: str
    semester_number: int
    location_type: str
    user_total: float
    peer_average: float
    percentile: float
