from typing import Any
from supabase import Client
from fastapi import HTTPException

class EducationService:
    def __init__(self, client: Client, user_id: str):
        self.client = client
        self.user_id = user_id

    def list_templates(self) -> list[dict[str, Any]]:
        response = (
            self.client.table("education_templates")
            .select("*")
            .eq("is_active", True)
            .execute()
        )
        if not response or not getattr(response, "data", None):
            return []
        return response.data or []

    def get_template(self, template_id: str) -> dict[str, Any]:
        response = (
            self.client.table("education_templates")
            .select("*")
            .eq("template_id", template_id)
            .maybe_single()
            .execute()
        )
        if not response or not getattr(response, "data", None):
            raise HTTPException(status_code=404, detail="Template not found")
        return response.data

    def setup_profile(self, data: dict[str, Any]) -> dict[str, Any]:
        payload = {**data, "id": self.user_id}
        response = (
            self.client.table("user_profiles")
            .upsert(payload, on_conflict="id")
            .execute()
        )
        if not response or not getattr(response, "data", None):
            # Fallback read so UI still proceeds if upsert result is empty.
            return self.get_context()
        # Return normalized education-context shape expected by API schema
        return self.get_context()

    def get_context(self) -> dict[str, Any]:
        response = (
            self.client.table("user_profiles")
            .select(
                "education_type, university, degree_duration, current_semester, "
                "semester_system, degree_start_date, expected_graduation, "
                "location_type, accommodation_type"
            )
            .eq("id", self.user_id)
            .maybe_single()
            .execute()
        )
        if not response or not getattr(response, "data", None):
            raise HTTPException(status_code=404, detail="Profile not found")
        return response.data

    def get_semester_expenses(self, semester_num: int) -> list[dict[str, Any]]:
        context = self.get_context()
        edu_type = context.get("education_type")
        if not edu_type:
            raise HTTPException(status_code=400, detail="Education profile not set up")
            
        # Find template by education_type
        template_resp = (
            self.client.table("education_templates")
            .select("template_id")
            .eq("education_type", edu_type)
            .maybe_single()
            .execute()
        )
        if not template_resp or not getattr(template_resp, "data", None):
            return []
            
        template_id = template_resp.data["template_id"]
        
        # Get expenses for this template and semester (also include semester 0 which applies to all semesters)
        expenses_resp = (
            self.client.table("expense_templates")
            .select("*")
            .eq("template_id", template_id)
            .in_("semester_number", [0, semester_num])
            .execute()
        )
        if not expenses_resp or not getattr(expenses_resp, "data", None):
            return []
        return expenses_resp.data or []
