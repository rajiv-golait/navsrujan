from typing import Any, Optional
from datetime import date
from pydantic import BaseModel

class EducationTemplateResponse(BaseModel):
    template_id: str
    template_name: str
    display_name: str
    education_type: str
    total_duration_years: int
    semester_system: str
    semesters_per_year: int
    total_semesters: int
    typical_categories: list[str]
    is_active: bool

class EducationProfileSetupRequest(BaseModel):
    education_type: str
    university: str
    current_semester: int
    degree_start_date: date
    expected_graduation: date
    location_type: str
    accommodation_type: str

class EducationContextResponse(BaseModel):
    education_type: Optional[str]
    university: Optional[str]
    degree_duration: Optional[int]
    current_semester: Optional[int]
    semester_system: Optional[str]
    degree_start_date: Optional[date]
    expected_graduation: Optional[date]
    location_type: Optional[str]
    accommodation_type: Optional[str]

class ExpenseTemplateResponse(BaseModel):
    id: str
    template_id: str
    semester_number: int
    expense_name: str
    category: str
    typical_amount_min: float
    typical_amount_max: float
    typical_amount_avg: float
    is_mandatory: bool
    is_recurring: bool
    frequency: str
    typical_occurrence_week: int
    location_dependent: bool
    notes: Optional[str]
