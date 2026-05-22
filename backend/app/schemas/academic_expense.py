from typing import Optional
from datetime import date, datetime
from uuid import UUID
from pydantic import BaseModel, ConfigDict, Field

class AcademicExpenseCreate(BaseModel):
    expense_name: str
    semester_number: int
    amount: float = Field(..., gt=0)
    due_date: Optional[date] = None
    payment_status: str = "pending"
    is_planned: bool = True

class AcademicExpenseUpdate(BaseModel):
    expense_name: Optional[str] = None
    semester_number: Optional[int] = None
    amount: Optional[float] = Field(None, gt=0)
    due_date: Optional[date] = None
    payment_status: Optional[str] = None
    is_planned: Optional[bool] = None

class AcademicExpenseResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    
    id: UUID
    user_id: UUID
    expense_name: str
    semester_number: int
    amount: float
    due_date: Optional[date] = None
    payment_status: str
    is_planned: bool
    created_at: datetime
    updated_at: datetime

class MissingSuggestionResponse(BaseModel):
    expense_name: str
    category: str
    typical_amount_avg: float
    is_mandatory: bool
    notes: Optional[str]
