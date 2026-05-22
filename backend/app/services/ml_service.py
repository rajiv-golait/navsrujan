from typing import Any
from supabase import Client
from fastapi import HTTPException

from app.ml.bootstrap import ml_stack_available
from app.services.analytics_service import get_ml_insights

class MLService:
    def __init__(self, client: Client, user_id: str):
        self.client = client
        self.user_id = user_id

    def get_burn_rate(self) -> dict[str, Any]:
        insights = get_ml_insights(self.client, self.user_id)
        if not insights:
            return {"burn_rate_daily": 0.0, "projected_monthly": 0.0, "available": False, "reason": "ML models not loaded"}
        return {
            "burn_rate_daily": insights.get("burn_rate_daily", 0.0),
            "projected_monthly": insights.get("burn_rate_daily", 0.0) * 30,
            "available": True
        }

    def get_anomalies(self) -> dict[str, Any]:
        insights = get_ml_insights(self.client, self.user_id)
        if not insights:
            return {"anomaly_count": 0, "recent_anomalies": [], "available": False, "reason": "ML models not loaded"}
        return {
            "anomaly_count": insights.get("anomaly_count", 0),
            "recent_anomalies": insights.get("recent_anomalies", []),
            "available": True
        }

    def get_stress_score(self) -> dict[str, Any]:
        insights = get_ml_insights(self.client, self.user_id)
        if not insights:
            return {"financial_stress_score": 0.0, "stress_level": "Unknown", "available": False, "reason": "ML models not loaded"}
        return {
            "financial_stress_score": insights.get("financial_stress_score", 0.0),
            "stress_level": insights.get("stress_level", "Unknown"),
            "available": True
        }

    def get_forecast(self, category: str) -> dict[str, Any]:
        if not ml_stack_available():
            return {"category": category, "forecast_30d": 0.0, "available": False, "reason": "Prophet not installed", "fallback": "statistical_trend"}
            
        # Mocking prophet forecast for now as we don't have a trained prophet model in the bundle
        # In a real app, this would use Prophet to forecast the category
        return {"category": category, "forecast_30d": 0.0, "available": False, "reason": "Prophet model not trained", "fallback": "statistical_trend"}

    def get_personality(self) -> dict[str, Any]:
        insights = get_ml_insights(self.client, self.user_id)
        if not insights:
            return {"behavioral_profile": "Unknown", "available": False, "reason": "ML models not loaded"}
        return {
            "behavioral_profile": insights.get("behavioral_profile", "Unknown"),
            "available": True
        }
