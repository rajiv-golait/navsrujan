from datetime import date, datetime
from decimal import Decimal
from enum import Enum
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


class TransactionCategory(str, Enum):
    FOOD = "Food"
    TRANSPORT = "Transport"
    ENTERTAINMENT = "Entertainment"
    SHOPPING = "Shopping"
    BILLS = "Bills"
    EDUCATION = "Education"
    HEALTH = "Health"
    OTHER = "Other"
    ACADEMIC = "Academic"


class TransactionType(str, Enum):
    DEBIT = "debit"
    CREDIT = "credit"


class TransactionCreate(BaseModel):
    amount: Decimal = Field(..., gt=0)
    category: TransactionCategory
    merchant: Optional[str] = None
    description: Optional[str] = None
    transaction_date: date
    entry_method: str = "manual"
    source_text: Optional[str] = None
    confidence_score: Optional[Decimal] = None
    semester_number: Optional[int] = None
    is_academic: bool = False
    transaction_type: TransactionType = TransactionType.DEBIT


class TransactionUpdate(BaseModel):
    amount: Optional[Decimal] = Field(None, gt=0)
    category: Optional[TransactionCategory] = None
    merchant: Optional[str] = None
    description: Optional[str] = None
    transaction_date: Optional[date] = None
    semester_number: Optional[int] = None
    is_academic: Optional[bool] = None
    transaction_type: Optional[TransactionType] = None


class TransactionResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    user_id: UUID
    amount: Decimal
    category: str
    merchant: Optional[str] = None
    description: Optional[str] = None
    transaction_date: date
    created_at: datetime
    entry_method: str = "manual"
    source_text: Optional[str] = None
    confidence_score: Optional[Decimal] = None
    semester_number: Optional[int] = None
    is_academic: bool = False
    transaction_type: str = TransactionType.DEBIT.value


class CategorySummary(BaseModel):
    category: str
    total: Decimal
    count: int


class MonthSummaryResponse(BaseModel):
    month: str
    total_spent: Decimal
    transaction_count: int
    categories: list[CategorySummary]
