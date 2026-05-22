"use client";

import Link from "next/link";
import { format, parseISO } from "date-fns";

import { BurnRateGauge } from "@/components/dashboard/BurnRateGauge";
import { MLInsightCard } from "@/components/dashboard/MLInsightCard";
import { CategoryBreakdown } from "@/components/dashboard/CategoryBreakdown";
import { EducationContextCard } from "@/components/dashboard/EducationContextCard";
import { ForecastCard } from "@/components/dashboard/ForecastCard";
import { KPIStrip } from "@/components/dashboard/KPIStrip";
import { RecommendationsCard } from "@/components/dashboard/RecommendationsCard";
import { TransactionList } from "@/components/transactions/TransactionList";
import { useAnalyticsInsights } from "@/lib/hooks/useAnalytics";
import {
  useMonthSummary,
  useTransactions,
} from "@/lib/hooks/useTransactions";

export default function DashboardPage() {
  const { data: summary, isLoading: summaryLoading } = useMonthSummary();
  const { data: transactions, isLoading: txLoading } = useTransactions(5);
  const { data: analytics, isLoading: analyticsLoading } = useAnalyticsInsights();

  const snapshot = analytics?.snapshot;
  const dailyLimit =
    snapshot?.monthly_budget != null
      ? Math.round(snapshot.monthly_budget / 30)
      : undefined;
  const todayKey = format(new Date(), "yyyy-MM-dd");
  const weekStart = new Date();
  weekStart.setDate(weekStart.getDate() - 6);
  weekStart.setHours(0, 0, 0, 0);
  const spentToday = (transactions ?? []).reduce((sum, txn) => {
    if ((txn.transaction_type ?? "debit") !== "debit") return sum;
    return txn.transaction_date.startsWith(todayKey) ? sum + Number(txn.amount) : sum;
  }, 0);
  const spentWeek = (transactions ?? []).reduce((sum, txn) => {
    if ((txn.transaction_type ?? "debit") !== "debit") return sum;
    const parsed = parseISO(txn.transaction_date);
    return parsed >= weekStart ? sum + Number(txn.amount) : sum;
  }, 0);

  return (
    <div className="space-y-6">
      <header>
        <p className="text-label-caps text-[var(--stitch-on-surface-variant)]">Overview</p>
        <h1 className="text-headline-mobile text-[var(--stitch-on-surface)]">Financial snapshot</h1>
      </header>
      <section className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="vault-card p-4">
          <p className="text-label-caps text-[var(--stitch-on-surface-variant)]">Spent Today</p>
          <p className="text-3xl font-bold tracking-tight text-[var(--stitch-on-surface)] mt-1">
            ₹{spentToday.toLocaleString("en-IN")}
          </p>
        </div>
        <div className="vault-card p-4">
          <p className="text-label-caps text-[var(--stitch-on-surface-variant)]">Spent This Week</p>
          <p className="text-3xl font-bold tracking-tight text-[var(--stitch-on-surface)] mt-1">
            ₹{spentWeek.toLocaleString("en-IN")}
          </p>
        </div>
      </section>
      {/* KPI Strip */}
      <KPIStrip summary={summary} isLoading={summaryLoading} />

      {/* Main Grid */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* ── Left Column ── */}
        <div className="md:col-span-8 space-y-6">
          {/* Education Context Card */}
          <EducationContextCard />

          <ForecastCard
            forecast={snapshot?.forecast}
            monthlyBudget={snapshot?.monthly_budget}
          />

          {/* Category Breakdown */}
          <CategoryBreakdown summary={summary} isLoading={summaryLoading} />

          {/* Recent Transactions */}
          <div className="vault-card p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-label-caps text-[var(--stitch-on-surface-variant)]">
                Recent Transactions
              </h3>
              <Link
                href="/transactions"
                className="text-label-caps text-xs text-[var(--stitch-primary)] hover:underline"
              >
                View All
              </Link>
            </div>
            <TransactionList
              transactions={transactions ?? []}
              isLoading={txLoading}
              showActions={false}
            />
          </div>
        </div>

        {/* ── Right Column ── */}
        <div className="md:col-span-4 space-y-6">
          {/* Burn Rate Gauge */}
          <BurnRateGauge
            dailyBurn={
              analytics?.ml?.burn_rate_daily ??
              snapshot?.daily_burn_rate
            }
            dailyLimit={dailyLimit}
            overspendingRisk={analytics?.ml?.overspending_risk}
          />

          <MLInsightCard
            ml={analytics?.ml}
            modelsAvailable={analytics?.ml_models_available}
            isLoading={analyticsLoading}
          />

          <RecommendationsCard
            healthScore={snapshot?.budget_health_score}
            recommendations={snapshot?.recommendations}
            patterns={snapshot?.overspending_patterns}
          />

          {/* Quick Actions */}
          <div className="grid grid-cols-2 gap-3">
            <Link
              href="/transactions"
              className="bg-[var(--stitch-secondary-container)] text-white p-4 rounded-2xl flex flex-col items-center justify-center gap-2 active:scale-95 transition-all hover:shadow-md"
            >
              <svg className="h-6 w-6" viewBox="0 0 24 24" fill="currentColor">
                <path d="M13 7h-2v4H7v2h4v4h2v-4h4v-2h-4V7zm-1-5C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z" />
              </svg>
              <span className="text-[10px] font-bold uppercase">Expense</span>
            </Link>
            <button className="bg-[var(--stitch-surface-container-high)] text-[var(--stitch-on-surface)] p-4 rounded-2xl flex flex-col items-center justify-center gap-2 active:scale-95 transition-all hover:shadow-md">
              <svg className="h-6 w-6" viewBox="0 0 24 24" fill="currentColor">
                <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6zm-1 18H7v-1h6v1zm3-3H7v-1h9v1zm0-3H7v-1h9v1zm-4-4V3.5L18.5 9H12z" />
              </svg>
              <span className="text-[10px] font-bold uppercase">Scan Bill</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
