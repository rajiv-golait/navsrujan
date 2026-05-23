"use client";

import { VaultPageShell } from "@/components/vault/VaultPageShell";
import { useAnalyticsInsights } from "@/lib/hooks/useAnalytics";
import { SurvivalForecastCard } from "@/components/insights/SurvivalForecastCard";
import { BudgetHealthDonut } from "@/components/insights/BudgetHealthDonut";
import { SavingsOpportunities } from "@/components/insights/SavingsOpportunities";
import { SpendingForecastChart } from "@/components/insights/SpendingForecastChart";
import { PeerComparisonCard } from "@/components/insights/PeerComparisonCard";
import { SmartAlertsPanel } from "@/components/insights/SmartAlertsPanel";

export default function InsightsPage() {
  const { data: analytics, isLoading: analyticsLoading, isError: analyticsError } = useAnalyticsInsights();

  const snapshot = analytics?.snapshot;
  const survivalForecast = snapshot?.survival_forecast;
  const budgetHealth = snapshot?.budget_health;
  const savingsOpportunities = snapshot?.savings_opportunities;
  const spendingForecast = snapshot?.spending_forecast;
  const peerComparison = snapshot?.peer_comparison;
  const smartAlerts = snapshot?.smart_alerts;
  const anomalies = analytics?.ml?.recent_anomalies;
  const shouldShowSurvivalCard =
    Boolean(survivalForecast) &&
    (survivalForecast?.risk_level === "critical" || survivalForecast?.risk_level === "high") &&
    (survivalForecast?.daily_burn_rate ?? 0) > 0 &&
    (survivalForecast?.days_until_broke ?? 999) > 0;

  if (analyticsError) {
    return (
      <VaultPageShell
        label="Insights"
        title="Insights Center"
        description="Unable to load insights"
      >
        <div className="vault-card p-6 border-red-500/50">
          <p className="text-red-500">Unable to load insights right now. Please refresh and try again.</p>
        </div>
      </VaultPageShell>
    );
  }

  if (analyticsLoading) {
    return (
      <VaultPageShell
        label="Insights"
        title="Insights Center"
        description="Loading your financial insights..."
      >
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="vault-card p-6 animate-pulse">
              <div className="h-4 bg-[var(--stitch-surface)] rounded w-1/3 mb-4"></div>
              <div className="h-24 bg-[var(--stitch-surface)] rounded"></div>
            </div>
          ))}
        </div>
      </VaultPageShell>
    );
  }

  return (
    <VaultPageShell
      label="Insights"
      title="Insights Center"
      description="Predictive analytics, savings tips, and peer comparisons from your spending data."
    >
      <div className="space-y-6">
        {/* Critical Survival Alert - only if data is valid and actionable */}
        {shouldShowSurvivalCard && survivalForecast && (
          <SurvivalForecastCard forecast={survivalForecast} />
        )}

        {/* auto-fit: one card spans full width; two cards sit side-by-side */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[repeat(auto-fit,minmax(min(100%,22rem),1fr))]">
          {budgetHealth && <BudgetHealthDonut budgetHealth={budgetHealth} />}

          {savingsOpportunities && savingsOpportunities.length > 0 && (
            <SavingsOpportunities opportunities={savingsOpportunities} />
          )}
        </div>

        {/* Spending Forecast */}
        {spendingForecast && (
          <SpendingForecastChart forecast={spendingForecast} />
        )}

        {/* Peer Comparison */}
        {peerComparison && (
          <PeerComparisonCard comparison={peerComparison} />
        )}

        {/* Smart Alerts & Anomalies */}
        {(smartAlerts || anomalies) && (
          <SmartAlertsPanel alerts={smartAlerts || []} anomalies={anomalies} />
        )}

        {/* Fallback if no enhanced analytics */}
        {!survivalForecast && !budgetHealth && !savingsOpportunities && (
          <div className="vault-card p-6 text-center">
            <p className="text-[var(--stitch-on-surface-variant)]">
              Add more transactions to unlock predictive insights and personalized recommendations.
            </p>
          </div>
        )}
      </div>
    </VaultPageShell>
  );
}
