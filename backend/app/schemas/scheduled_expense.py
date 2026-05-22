from datetime import date, datetime
from typing import Literal, Optional
from uuid import UUID

from pydantic import BaseModel, Field

ScheduledStatus = Literal["planned", "done", "cancelled"]
ScheduledSource = Literal["chat", "manual"]


class ScheduledExpenseCreate(BaseModel):
    title: str = Field(..., min_length=1, max_length=200)
    amount: float = Field(..., gt=0)
    expected_date: date
    category: str = "Other"
    status: ScheduledStatus = "planned"
    source: ScheduledSource = "manual"


class ScheduledExpenseUpdate(BaseModel):
    title: Optional[str] = None
    amount: Optional[float] = Field(None, gt=0)
    expected_date: Optional[date] = None
    category: Optional[str] = None
    status: Optional[ScheduledStatus] = None


class ScheduledExpenseResponse(BaseModel):
    id: UUID
    user_id: UUID
    title: str
    amount: float
    expected_date: date
    category: str
    status: str
    confidence: Optional[float] = None
    source: str
    created_at: datetime
