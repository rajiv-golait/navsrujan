from datetime import datetime
from decimal import Decimal
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, ConfigDict


class UserProfileResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    full_name: Optional[str] = None
    college: Optional[str] = None
    course: Optional[str] = None
    year: Optional[int] = None
    monthly_budget: Optional[Decimal] = None
    education_type: Optional[str] = None
    university: Optional[str] = None
    degree_duration: Optional[int] = None
    current_semester: Optional[int] = None
    semester_system: Optional[str] = None
    degree_start_date: Optional[str] = None
    expected_graduation: Optional[str] = None
    location_type: Optional[str] = None
    accommodation_type: Optional[str] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None


class UserProfileUpdate(BaseModel):
    full_name: Optional[str] = None
    monthly_budget: Optional[Decimal] = None
    college: Optional[str] = None
    course: Optional[str] = None
    year: Optional[int] = None
