"use client";

import { useAnalyticsInsights } from "@/lib/hooks/useAnalytics";

function getSurvivalView(projectedSpend: number, monthlyBudget: number) {
  const projectedBalance = monthlyBudget - projectedSpend;
  const usageRatio = monthlyBudget > 0 ? projectedSpend / monthlyBudget : 0;

  if (monthlyBudget <= 0) {
    return { riskLevel: "medium", status: "set-budget" };
  }
  if (usageRatio <= 0.8) {
    return { riskLevel: "low", status: "safe" };
  }
  if (usageRatio <= 1) {
    return { riskLevel: "medium", status: "tight" };
  }
  return {
    riskLevel: projectedBalance < 0 ? "high" : "medium",
    status: projectedBalance < 0 ? "deficit" : "tight",
  };
}

export default function InsightsPage() {
  const { data: analytics, isLoading: analyticsLoading, isError: analyticsError } = useAnalyticsInsights();

  const ml = analytics?.ml;
  const modelsAvailable = analytics?.ml_models_available;
  const snapshot = analytics?.snapshot;
  const projectedSpend = Number(snapshot?.projected_monthly_spend ?? 0);
  const monthlyBudget = Number(snapshot?.monthly_budget ?? 0);
  const { riskLevel, status } = getSurvivalView(projectedSpend, monthlyBudget);
  const overspendingAlerts = (snapshot?.overspending_patterns ?? []).filter(
    (pattern) => pattern.status === "over",
  );

  const riskStyles =
    riskLevel === "high"
      ? "bg-red-100 text-red-800"
      : riskLevel === "medium"
        ? "bg-yellow-100 text-yellow-800"
        : "bg-green-100 text-green-800";

  if (analyticsError) {
    return (
      <div className="space-y-4">
        <h1 className="text-xl sm:text-2xl font-bold text-[var(--stitch-on-surface)]">Insights Center</h1>
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 sm:p-6 text-red-800 text-sm sm:text-base">
          Unable to load insights right now. Please refresh and try again.
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <h1 className="text-xl sm:text-2xl font-bold text-[var(--stitch-on-surface)]">Insights Center</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
        {/* Survival Check */}
        <div className="bg-[var(--stitch-surface-container-low)] p-4 sm:p-6 rounded-2xl">
          <h2 className="text-base sm:text-lg font-bold mb-3 sm:mb-4">Survival Check</h2>
          {analyticsLoading ? <p>Loading...</p> : (
            <div className="space-y-3 sm:space-y-4 text-center py-2 sm:py-4">
              <div
                className={`inline-flex px-3 sm:px-4 py-1 rounded-full text-xs sm:text-sm font-bold uppercase tracking-wider mb-1 sm:mb-2 ${riskStyles}`}
              >
                {riskLevel} Risk
              </div>
              <p className="text-2xl sm:text-3xl font-bold">Status: {status}</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm mt-4 sm:mt-6 p-3 sm:p-4 bg-[var(--stitch-surface)] rounded-xl border border-[var(--stitch-outline)]">
                <div className="text-left">
                  <p className="text-[var(--stitch-on-surface-variant)] text-xs sm:text-sm">Projected Spend</p>
                  <p className="font-bold text-sm sm:text-base">₹{projectedSpend.toLocaleString("en-IN")}</p>
                </div>
                <div className="text-left sm:text-right">
                  <p className="text-[var(--stitch-on-surface-variant)] text-xs sm:text-sm">Projected Balance</p>
                  <p className={`font-bold text-sm sm:text-base ${monthlyBudget - projectedSpend < 0 ? "text-red-500" : "text-green-500"}`}>
                    ₹{(monthlyBudget - projectedSpend).toLocaleString("en-IN")}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Overspending Alerts */}
        <div className="bg-[var(--stitch-surface-container-low)] p-4 sm:p-6 rounded-2xl">
          <h2 className="text-base sm:text-lg font-bold mb-3 sm:mb-4">Overspending Alerts</h2>
          {analyticsLoading ? <p>Loading...</p> : overspendingAlerts.length === 0 ? (
            <p className="text-[var(--stitch-on-surface-variant)] text-sm">No overspending detected in any category!</p>
          ) : (
            <div className="space-y-3 sm:space-y-4">
              {overspendingAlerts.map((alert, idx: number) => (
                <div key={idx} className="p-3 sm:p-4 bg-[var(--stitch-surface)] rounded-xl border border-red-200 bg-red-50">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-bold text-red-900 text-sm sm:text-base">{alert.category}</span>
                    <span className="text-[10px] sm:text-xs font-bold bg-red-200 text-red-900 px-2 py-1 rounded-full">
                      {alert.target ? `+${Math.round(((alert.projected - alert.target) / alert.target) * 100)}%` : "Over"}
                    </span>
                  </div>
                  <div className="flex flex-col sm:flex-row sm:justify-between gap-1 text-xs sm:text-sm text-red-800">
                    <span>Current: ₹{alert.current.toLocaleString("en-IN")}</span>
                    <span>Target: ₹{Number(alert.target ?? 0).toLocaleString("en-IN")}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ML Insights */}
        <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
          <div className="bg-[var(--stitch-surface-container-low)] p-4 sm:p-6 rounded-2xl">
            <h2 className="text-base sm:text-lg font-bold mb-3 sm:mb-4">Spending Personality</h2>
            {analyticsLoading ? <p>Loading...</p> : !modelsAvailable ? (
              <p className="text-[var(--stitch-on-surface-variant)] text-sm">ML models not loaded.</p>
            ) : (
              <div className="text-center py-4 sm:py-6">
                <p className="text-lg sm:text-xl font-bold text-[var(--stitch-primary)] break-words">
                  {ml?.behavioral_profile?.replace(/_/g, " ").toUpperCase()}
                </p>
              </div>
            )}
          </div>

          <div className="bg-[var(--stitch-surface-container-low)] p-4 sm:p-6 rounded-2xl">
            <h2 className="text-base sm:text-lg font-bold mb-3 sm:mb-4">Stress Score</h2>
            {analyticsLoading ? <p>Loading...</p> : !modelsAvailable ? (
              <p className="text-[var(--stitch-on-surface-variant)] text-sm">ML models not loaded.</p>
            ) : (
              <div className="text-center py-4 sm:py-6">
                <div className="relative w-24 h-24 sm:w-32 sm:h-32 mx-auto mb-3 sm:mb-4">
                  <svg className="w-full h-full -rotate-90">
                    <circle className="text-[var(--stitch-surface)]" cx="64" cy="64" r="56" fill="transparent" stroke="currentColor" strokeWidth="12" />
                    <circle 
                      className={ml?.stress_level === "High" ? "text-red-500" : ml?.stress_level === "Medium" ? "text-yellow-500" : "text-green-500"} 
                      cx="64" cy="64" r="56" fill="transparent" stroke="currentColor" strokeWidth="12" 
                      strokeDasharray={2 * Math.PI * 56} 
                      strokeDashoffset={(2 * Math.PI * 56) * (1 - (ml?.financial_stress_score || 0) / 100)} 
                      strokeLinecap="round" 
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-xl sm:text-2xl font-bold">{ml?.financial_stress_score}</span>
                  </div>
                </div>
                <p className="font-bold uppercase tracking-wider text-xs sm:text-sm">{ml?.stress_level} Stress</p>
              </div>
            )}
          </div>

          <div className="bg-[var(--stitch-surface-container-low)] p-4 sm:p-6 rounded-2xl">
            <h2 className="text-base sm:text-lg font-bold mb-3 sm:mb-4">Anomalies</h2>
            {analyticsLoading ? <p>Loading...</p> : !modelsAvailable ? (
              <p className="text-[var(--stitch-on-surface-variant)] text-sm">ML models not loaded.</p>
            ) : ml?.anomaly_count === 0 ? (
              <p className="text-[var(--stitch-on-surface-variant)] text-center py-4 sm:py-6 text-sm">No anomalies detected.</p>
            ) : (
              <div className="space-y-3">
                <p className="text-xs sm:text-sm font-medium text-red-500 mb-2">
                  {ml?.anomaly_count} unusual transactions flagged
                </p>
                {(ml as any)?.recent_anomalies?.slice(0, 3)?.map((anomaly: any, idx: number) => (
                  <div key={`${anomaly?.transaction_date ?? "unknown"}-${idx}`} className="p-3 bg-[var(--stitch-surface)] rounded-xl border border-red-200">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-xs sm:text-sm font-medium break-words">{anomaly?.category ?? "Uncategorized"}</p>
                      <p className="text-xs sm:text-sm font-semibold whitespace-nowrap">
                        ₹{Number(anomaly?.amount ?? 0).toLocaleString("en-IN")}
                      </p>
                    </div>
                    <p className="text-[11px] sm:text-xs text-[var(--stitch-on-surface-variant)] mt-1 break-words">
                      {anomaly?.transaction_date ?? "Recent"} {anomaly?.merchant ? `• ${anomaly.merchant}` : ""}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
