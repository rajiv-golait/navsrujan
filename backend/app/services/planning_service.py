from typing import Any
from supabase import Client
from fastapi import HTTPException
from datetime import date, timedelta

from app.services.education_service import EducationService
from app.analytics.engine import calculate_burn_rate
from app.services.transaction_service import TransactionService

class PlanningService:
    def __init__(self, client: Client, user_id: str):
        self.client = client
        self.user_id = user_id

    def create_degree_projection(self, plan_name: str, assumptions: str | None = None) -> dict[str, Any]:
        edu_service = EducationService(self.client, self.user_id)
        context = edu_service.get_context()
        
        edu_type = context.get("education_type")
        if not edu_type:
            raise HTTPException(status_code=400, detail="Education profile not set up")
            
        template_resp = self.client.table("education_templates").select("*").eq("education_type", edu_type).maybe_single().execute()
        if not template_resp.data:
            raise HTTPException(status_code=400, detail="Template not found")
            
        template = template_resp.data
        total_semesters = template.get("total_semesters", 8)
        
        # Calculate academic cost by summing all expense templates for this education type
        expenses_resp = self.client.table("expense_templates").select("typical_amount_avg").eq("template_id", template["template_id"]).execute()
        total_academic = sum(e["typical_amount_avg"] for e in (expenses_resp.data or []))
        
        # Calculate personal cost based on current burn rate
        txn_service = TransactionService(self.client, self.user_id)
        txns = txn_service.list(limit=1000)
        txn_dicts = [{"amount": float(t.amount), "transaction_date": t.transaction_date.isoformat()} for t in txns]
        
        burn_data = calculate_burn_rate(txn_dicts, date.today())
        monthly_personal = burn_data.get("projected_monthly", 10000)
        
        duration_months = template.get("total_duration_years", 4) * 12
        total_personal = monthly_personal * duration_months
        
        plan_data = {
            "user_id": self.user_id,
            "plan_name": plan_name,
            "education_template_id": template["template_id"],
            "start_date": context.get("degree_start_date"),
            "end_date": context.get("expected_graduation"),
            "total_duration_months": duration_months,
            "total_academic_cost": total_academic,
            "total_personal_cost": total_personal,
            "total_estimated_cost": total_academic + total_personal,
            "assumptions": assumptions,
            "is_active": True
        }
        
        response = self.client.table("long_term_plans").insert(plan_data).execute()
        if not response.data:
            raise HTTPException(status_code=500, detail="Failed to create plan")
            
        return response.data[0]

    def get_semester_forecast(self, semester_num: int) -> dict[str, Any]:
        edu_service = EducationService(self.client, self.user_id)
        expenses = edu_service.get_semester_expenses(semester_num)
        
        categories = {}
        for exp in expenses:
            cat = exp["category"]
            categories[cat] = categories.get(cat, 0.0) + exp["typical_amount_avg"]
            
        return {
            "semester_number": semester_num,
            "categories": categories,
            "total_forecast": sum(categories.values())
        }

    def analyze_funding_gap(self, available_funds: float, monthly_income: float) -> dict[str, Any]:
        # Get active plan
        response = self.client.table("long_term_plans").select("*").eq("user_id", self.user_id).eq("is_active", True).order("created_at", desc=True).limit(1).execute()
        if not response.data:
            raise HTTPException(status_code=400, detail="No active degree projection found")
            
        plan = response.data[0]
        total_cost = plan["total_estimated_cost"]
        duration = plan["total_duration_months"]
        
        total_available = available_funds + (monthly_income * duration)
        gap = total_cost - total_available
        
        return {
            "total_estimated_cost": total_cost,
            "total_available": total_available,
            "funding_gap": max(gap, 0),
            "gap_status": "deficit" if gap > 0 else "surplus"
        }

    def get_peer_comparison(self) -> dict[str, Any]:
        edu_service = EducationService(self.client, self.user_id)
        context = edu_service.get_context()
        
        edu_type = context.get("education_type", "BTech")
        current_sem = context.get("current_semester", 1)
        location = context.get("location_type", "metro")
        
        # Calculate user's total for this semester
        txn_service = TransactionService(self.client, self.user_id)
        txns = txn_service.list(limit=1000)
        user_total = sum(float(t.amount) for t in txns if t.semester_number == current_sem)
        
        # Mock peer average for MVP (in a real app, this would aggregate other users' data)
        peer_avg = user_total * 0.9 if user_total > 0 else 50000
        
        return {
            "education_type": edu_type,
            "semester_number": current_sem,
            "location_type": location,
            "user_total": user_total,
            "peer_average": peer_avg,
            "percentile": 65.0 if user_total > peer_avg else 35.0
        }
