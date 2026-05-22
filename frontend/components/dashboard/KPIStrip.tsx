"use client";

import { memo } from "react";
import { formatCurrency } from "@/lib/utils";
import type { MonthSummary } from "@/types/transaction";

interface KPIStripProps {
  summary: MonthSummary | undefined;
  isLoading: boolean;
}

const kpiCards = [
  {
    label: "TOTAL SPENT",
    getValue: (s: MonthSummary) => formatCurrency(s.total_spent ?? 0),
    getTrend: (s: MonthSummary) => ({
      text: `${s.transaction_count} transactions`,
      color: "text-[var(--stitch-error)]",
      icon: "↑ 12%",
    }),
    barColor: "bg-[var(--stitch-primary)]",
    barWidth: "w-3/4",
  },
  {
    label: "THIS MONTH",
    getValue: (s: MonthSummary) => formatCurrency(s.total_spent ?? 0),
    getTrend: () => ({
      text: "Safe",
      color: "text-[var(--stitch-tertiary)]",
      icon: "",
    }),
    barColor: "bg-[var(--stitch-secondary-container)]",
    barWidth: "w-1/2",
  },
  {
    label: "BUDGET LEFT",
    getValue: (s: MonthSummary) => {
      const budget = 20000;
      const left = budget - (s.total_spent ?? 0);
      return formatCurrency(Math.max(0, left));
    },
    getTrend: () => ({
      text: "14 Days left",
      color: "text-[var(--stitch-on-surface-variant)]",
      icon: "",
    }),
    barColor: "bg-[var(--stitch-tertiary-container)]",
    barWidth: "w-[40%]",
  },
];

export const KPIStrip = memo(function KPIStrip({ summary, isLoading }: KPIStripProps) {
  if (isLoading) {
    return (
      <section className="flex overflow-x-auto hide-scrollbar snap-x snap-mandatory gap-4 md:grid md:grid-cols-3 mb-6">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="min-w-[280px] md:min-w-0 snap-center stitch-card p-4 animate-pulse"
          >
            <div className="h-3 w-20 bg-[var(--stitch-surface-container-high)] rounded mb-3" />
            <div className="h-7 w-28 bg-[var(--stitch-surface-container-high)] rounded mb-4" />
            <div className="h-1 w-full bg-[var(--stitch-surface-container-high)] rounded-full" />
          </div>
        ))}
      </section>
    );
  }

  const defaultSummary: MonthSummary = {
    month: new Date().toISOString().slice(0, 7),
    total_spent: 0,
    transaction_count: 0,
    categories: [],
  };

  const data = summary ?? defaultSummary;

  return (
    <section className="flex overflow-x-auto hide-scrollbar snap-x snap-mandatory gap-4 md:grid md:grid-cols-3 mb-6">
      {kpiCards.map((kpi, i) => {
        const trend = kpi.getTrend(data);
        return (
          <div
            key={i}
            className="min-w-[280px] md:min-w-0 snap-center stitch-card p-4 hover:shadow-md transition-shadow duration-200 cursor-pointer active:scale-[0.97]"
            style={{ animationDelay: `${i * 80}ms` }}
          >
            <p className="text-label-caps text-[var(--stitch-on-surface-variant)] mb-1">
              {kpi.label}
            </p>
            <div className="flex items-baseline gap-2">
              <span className="text-stat-lg text-[var(--stitch-on-surface)]">
                {kpi.getValue(data)}
              </span>
              {trend.icon && (
                <span className={`text-stat-sm ${trend.color}`}>{trend.icon}</span>
              )}
              {!trend.icon && trend.text && (
                <span className={`text-stat-sm ${trend.color}`}>{trend.text}</span>
              )}
            </div>
            <div className="mt-4 h-1 w-full bg-[var(--stitch-surface-container-high)] rounded-full overflow-hidden">
              <div className={`h-full ${kpi.barColor} ${kpi.barWidth} rounded-full transition-all duration-700`} />
            </div>
          </div>
        );
      })}
    </section>
  );
});

KPIStrip.displayName = "KPIStrip";
