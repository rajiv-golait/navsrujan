from datetime import date, datetime
from typing import Literal, Optional
from uuid import UUID

from pydantic import BaseModel, Field

RecurringFrequency = Literal["daily", "weekly", "monthly", "quarterly", "yearly"]
RecurringSource = Literal["chat", "manual"]


class RecurringObligationCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=200)
    amount: float = Field(..., gt=0)
    category: str = "Other"
    frequency: RecurringFrequency = "monthly"
    next_due_date: Optional[date] = None
    source: RecurringSource = "manual"


class RecurringObligationUpdate(BaseModel):
    name: Optional[str] = None
    amount: Optional[float] = Field(None, gt=0)
    category: Optional[str] = None
    frequency: Optional[RecurringFrequency] = None
    next_due_date: Optional[date] = None
    is_active: Optional[bool] = None


class RecurringObligationResponse(BaseModel):
    id: UUID
    user_id: UUID
    name: str
    amount: float
    category: str
    frequency: str
    next_due_date: Optional[date] = None
    is_active: bool
    source: str
    created_at: datetime
