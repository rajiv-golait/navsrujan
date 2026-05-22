from typing import Any
from supabase import Client
from fastapi import HTTPException
from datetime import date, timedelta

from app.services.education_service import EducationService

class AcademicExpenseService:
    def __init__(self, client: Client, user_id: str):
        self.client = client
        self.user_id = user_id
        self.table = "academic_expenses"

    def create(self, data: dict[str, Any]) -> dict[str, Any]:
        data["user_id"] = self.user_id
        response = self.client.table(self.table).insert(data).execute()
        if not response.data:
            raise HTTPException(status_code=500, detail="Failed to create academic expense")
        return response.data[0]

    def get_by_semester(self, semester_num: int) -> list[dict[str, Any]]:
        response = self.client.table(self.table).select("*").eq("user_id", self.user_id).eq("semester_number", semester_num).order("due_date").execute()
        return response.data or []

    def get_upcoming(self) -> list[dict[str, Any]]:
        today = date.today()
        thirty_days = today + timedelta(days=30)
        response = self.client.table(self.table).select("*").eq("user_id", self.user_id).neq("payment_status", "paid").gte("due_date", today.isoformat()).lte("due_date", thirty_days.isoformat()).order("due_date").execute()
        return response.data or []

    def get_missing_suggestions(self) -> list[dict[str, Any]]:
        edu_service = EducationService(self.client, self.user_id)
        try:
            context = edu_service.get_context()
            current_sem = context.get("current_semester")
            if not current_sem:
                return []
        except HTTPException:
            return []

        # Get expected expenses for current semester
        expected = edu_service.get_semester_expenses(current_sem)
        if not expected:
            return []

        # Get actual academic expenses for current semester
        actual = self.get_by_semester(current_sem)
        actual_names = {e["expense_name"].lower() for e in actual}

        missing = []
        for exp in expected:
            if exp["expense_name"].lower() not in actual_names:
                missing.append({
                    "expense_name": exp["expense_name"],
                    "category": exp["category"],
                    "typical_amount_avg": exp["typical_amount_avg"],
                    "is_mandatory": exp["is_mandatory"],
                    "notes": exp["notes"]
                })
        
        return missing
