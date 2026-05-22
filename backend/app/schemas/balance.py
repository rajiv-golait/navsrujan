from datetime import date
from typing import Any, Optional
from uuid import UUID

from pydantic import BaseModel, Field


class BalanceBreakdown(BaseModel):
    credits_since_anchor: float = 0
    debits_since_anchor: float = 0
    scheduled_next_30d: float = 0
    recurring_next_30d: float = 0


class BalanceResponse(BaseModel):
    configured: bool
    message: Optional[str] = None
    starting_balance: Optional[float] = None
    balance_as_of_date: Optional[str] = None
    current_balance: Optional[float] = None
    projected_balance_30d: Optional[float] = None
    runway_days: Optional[int] = None
    daily_burn_rate: Optional[float] = None
    breakdown: dict[str, Any] = Field(default_factory=dict)


class SetBalanceRequest(BaseModel):
    starting_balance: float = Field(..., gt=0)
    balance_as_of_date: Optional[date] = None


class PurchaseCheckRequest(BaseModel):
    amount: float = Field(..., gt=0)
    days_until: int = Field(0, ge=0, le=365)


class PurchaseCheckResponse(BaseModel):
    allowed: bool
    purchase_amount: float
    days_until: int = 0
    current_balance: Optional[float] = None
    balance_after_purchase: Optional[float] = None
    runway_days_before: Optional[int] = None
    runway_days_after: Optional[int] = None
    projected_balance_30d: Optional[float] = None
    recommendation: Optional[str] = None
    reason: Optional[str] = None
