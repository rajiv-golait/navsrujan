"use client";

import { memo } from "react";
import { ArrowDown, CalendarDays, Wallet } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import type { MonthSummary } from "@/types/transaction";

interface KPIStripProps {
  summary: MonthSummary | undefined;
  isLoading: boolean;
}

const kpiCards = [
  {
    label: "TOTAL SPENT",
    icon: ArrowDown,
    getValue: (s: MonthSummary) => formatCurrency(s.total_spent ?? 0),
    getTrend: (s: MonthSummary) => ({
      text: `${s.transaction_count} transactions`,
      color: "text-[var(--stitch-on-surface-variant)]",
    }),
    barColor: "from-rose-400 to-rose-500",
    barWidth: "w-[68%]",
  },
  {
    label: "THIS MONTH",
    icon: CalendarDays,
    getValue: (s: MonthSummary) => formatCurrency(s.total_spent ?? 0),
    getTrend: () => ({
      text: "Running total",
      color: "text-[var(--stitch-on-surface-variant)]",
    }),
    barColor: "from-indigo-400 to-violet-500",
    barWidth: "w-1/2",
  },
  {
    label: "BUDGET LEFT",
    icon: Wallet,
    getValue: (s: MonthSummary) => {
      const budget = 20000;
      const left = budget - (s.total_spent ?? 0);
      return formatCurrency(Math.max(0, left));
    },
    getTrend: () => ({
      text: "14 Days left",
      color: "text-[var(--stitch-on-surface-variant)]",
    }),
    barColor: "from-emerald-400 to-cyan-500",
    barWidth: "w-[40%]",
  },
];

export const KPIStrip = memo(function KPIStrip({ summary, isLoading }: KPIStripProps) {
  if (isLoading) {
    return (
      <section className="flex overflow-x-auto hide-scrollbar snap-x snap-mandatory gap-3 md:grid md:grid-cols-3 mb-5 md:mb-6">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="min-w-[240px] md:min-w-0 snap-center vault-card p-4 md:p-5 animate-pulse"
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
    <section className="flex overflow-x-auto hide-scrollbar snap-x snap-mandatory gap-3 md:grid md:grid-cols-3 mb-5 md:mb-6">
      {kpiCards.map((kpi, i) => {
        const trend = kpi.getTrend(data);
        return (
          <div
            key={i}
            className="min-w-[240px] md:min-w-0 snap-center vault-card p-4 md:p-5 transition-shadow duration-200"
            style={{ animationDelay: `${i * 80}ms` }}
          >
            <div className="flex items-center justify-between mb-2">
              <p className="text-label-caps text-[var(--stitch-on-surface-variant)]">
                {kpi.label}
              </p>
              <span className="h-8 w-8 rounded-xl bg-[var(--surface-2)] text-[var(--vault-accent)] flex items-center justify-center">
                <kpi.icon className="h-4 w-4" />
              </span>
            </div>
            <div className="flex items-end gap-2">
              <span className="text-2xl md:text-3xl font-bold tracking-tight text-[var(--stitch-on-surface)]">
                {kpi.getValue(data)}
              </span>
            </div>
            <p className={`text-xs mt-1 ${trend.color}`}>{trend.text}</p>
            <div className="mt-4 h-1.5 w-full bg-[var(--surface-0)] rounded-full overflow-hidden">
              <div className={`h-full bg-gradient-to-r ${kpi.barColor} ${kpi.barWidth} rounded-full transition-all duration-700`} />
            </div>
          </div>
        );
      })}
    </section>
  );
});

KPIStrip.displayName = "KPIStrip";
