export interface MLInsight {
  burn_rate_daily: number;
  estimated_days_remaining: number;
  overspending_risk: string;
  top_risk_category: string | null;
  financial_stress_score: number;
  stress_level: string;
  behavioral_profile: string | null;
  budget_utilization_pct?: number;
  anomaly_count: number;
  models_loaded: boolean;
}

export interface ForecastDay {
  date: string;
  label: string;
  predicted: number;
}

export interface ExpenseForecast {
  method: string;
  confidence: "low" | "medium" | "high";
  daily_prediction: number;
  next_7_days_total: number;
  projected_monthly_spend: number;
  daily_budget: number | null;
  days: ForecastDay[];
}

export interface SavingRecommendation {
  priority: "low" | "medium" | "high";
  title: string;
  action: string;
  impact: string;
  category: string;
  potential_savings: number;
}

export interface OverspendingPattern {
  category: string;
  current: number;
  projected: number;
  target: number | null;
  status: "over" | "on_track";
}

export interface AnalyticsSnapshot {
  daily_burn_rate?: number;
  monthly_budget?: number | null;
  projected_monthly_spend?: number;
  budget_health_score?: number;
  forecast?: ExpenseForecast;
  recommendations?: SavingRecommendation[];
  overspending_patterns?: OverspendingPattern[];
}

export interface AnalyticsInsights {
  snapshot: AnalyticsSnapshot;
  ml: MLInsight | null;
  ml_models_available: boolean;
}
