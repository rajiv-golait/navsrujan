"use client";

import { AlertTriangle, TrendingDown } from "lucide-react";

interface SurvivalForecastCardProps {
  forecast: {
    days_until_broke: number;
    days_remaining_in_month: number;
    will_survive_month: boolean;
    projected_balance_month_end: number;
    shortage_amount: number;
    daily_burn_rate: number;
    risk_level: "low" | "medium" | "high" | "critical";
    message: string;
  };
}

export function SurvivalForecastCard({ forecast }: SurvivalForecastCardProps) {
  const { risk_level, days_until_broke, message, projected_balance_month_end } = forecast;

  // Only show if risk is high/critical and value is actionable
  if (risk_level === "low" || risk_level === "medium" || days_until_broke <= 0) {
    return null;
  }

  const isUrgent = risk_level === "critical";

  return (
    <div
      className={`vault-card p-4 sm:p-6 border-2 ${
        isUrgent
          ? "border-red-500/50 bg-gradient-to-br from-red-500/10 to-red-600/5"
          : "border-amber-500/50 bg-gradient-to-br from-amber-500/10 to-amber-600/5"
      }`}
    >
      <div className="flex items-start gap-3 sm:gap-4">
        <div
          className={`p-2 sm:p-3 rounded-xl ${
            isUrgent ? "bg-red-500/20" : "bg-amber-500/20"
          }`}
        >
          {isUrgent ? (
            <AlertTriangle className="w-5 h-5 sm:w-6 sm:h-6 text-red-500" />
          ) : (
            <TrendingDown className="w-5 h-5 sm:w-6 sm:h-6 text-amber-500" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <h3
              className={`text-base sm:text-lg font-bold ${
                isUrgent ? "text-red-500" : "text-amber-500"
              }`}
            >
              {isUrgent ? "🚨 Critical Alert" : "⚠️ Budget Warning"}
            </h3>
          </div>
          <p className="text-[var(--stitch-on-surface)] text-sm sm:text-base mb-3 sm:mb-4">
            {message}
          </p>
          <div className="grid grid-cols-2 gap-3 sm:gap-4">
            <div className="p-3 rounded-xl bg-[var(--stitch-surface)] border border-[var(--stitch-outline)]">
              <p className="text-xs text-[var(--stitch-on-surface-variant)] mb-1">
                Days Until Broke
              </p>
              <p
                className={`text-2xl sm:text-3xl font-bold ${
                  isUrgent ? "text-red-500" : "text-amber-500"
                }`}
              >
                {days_until_broke}
              </p>
            </div>
            <div className="p-3 rounded-xl bg-[var(--stitch-surface)] border border-[var(--stitch-outline)]">
              <p className="text-xs text-[var(--stitch-on-surface-variant)] mb-1">
                Month-End Balance
              </p>
              <p
                className={`text-xl sm:text-2xl font-bold ${
                  projected_balance_month_end < 0 ? "text-red-500" : "text-emerald-500"
                }`}
              >
                ₹{Math.abs(projected_balance_month_end).toLocaleString("en-IN")}
              </p>
            </div>
          </div>
          <div className="mt-4 flex flex-col sm:flex-row gap-2">
            <button
              className={`px-4 py-2 rounded-lg font-semibold text-sm ${
                isUrgent
                  ? "bg-red-500 hover:bg-red-600 text-white"
                  : "bg-amber-500 hover:bg-amber-600 text-white"
              } transition-colors`}
            >
              Get Help Now
            </button>
            <button className="px-4 py-2 rounded-lg font-semibold text-sm border border-[var(--stitch-outline)] hover:bg-[var(--stitch-surface)] transition-colors">
              View Breakdown
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
