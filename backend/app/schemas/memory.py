from datetime import datetime
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, Field


class MemoryFactResponse(BaseModel):
    id: UUID
    user_id: UUID
    fact_key: str
    fact_value: str
    importance: int
    expires_at: Optional[datetime] = None
    created_at: datetime


class MemoryFactCreate(BaseModel):
    fact_key: str = Field(..., min_length=1, max_length=120)
    fact_value: str = Field(..., min_length=1, max_length=500)
    importance: int = Field(5, ge=1, le=10)
