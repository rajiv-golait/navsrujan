"use client";

import { memo, useMemo } from "react";

import { Skeleton } from "@/components/ui/skeleton";
import type { MonthSummary } from "@/types/transaction";

interface CategoryBreakdownProps {
  summary: MonthSummary | undefined;
  isLoading: boolean;
}

const CATEGORY_CONFIG: Record<string, { icon: string; color: string; bg: string }> = {
  Food: { icon: "🍽️", color: "bg-[var(--stitch-secondary-container)]", bg: "bg-[var(--stitch-secondary-container)]/20" },
  Transport: { icon: "🚌", color: "bg-[var(--stitch-primary)]", bg: "bg-[var(--stitch-primary)]/10" },
  Entertainment: { icon: "🎬", color: "bg-[var(--stitch-tertiary)]", bg: "bg-[var(--stitch-tertiary)]/10" },
  Shopping: { icon: "🛍️", color: "bg-[var(--stitch-secondary-container)]", bg: "bg-[var(--stitch-secondary-container)]/10" },
  Bills: { icon: "📱", color: "bg-[var(--stitch-primary)]", bg: "bg-[var(--stitch-primary)]/10" },
  Education: { icon: "📚", color: "bg-[var(--stitch-primary-container)]", bg: "bg-[var(--stitch-primary-container)]/10" },
  Health: { icon: "❤️", color: "bg-[var(--stitch-error)]", bg: "bg-[var(--stitch-error)]/10" },
  Academic: { icon: "🎓", color: "bg-[var(--stitch-primary-container)]", bg: "bg-[var(--stitch-primary-container)]/10" },
  Other: { icon: "📦", color: "bg-[var(--stitch-outline)]", bg: "bg-[var(--stitch-outline)]/10" },
};

export const CategoryBreakdown = memo(function CategoryBreakdown({
  summary,
  isLoading,
}: CategoryBreakdownProps) {
  const chartData = useMemo(() => {
    return (
      summary?.categories.map((cat) => ({
        category: cat.category,
        total: Number(cat.total),
      })) ?? []
    );
  }, [summary?.categories]);

  const totalSpent = useMemo(
    () => chartData.reduce((sum, c) => sum + c.total, 0),
    [chartData]
  );

  if (isLoading) {
    return (
      <div className="stitch-card p-6">
        <Skeleton className="h-3 w-32 mb-6 bg-[var(--stitch-surface-container-high)]" />
        <div className="space-y-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center gap-4">
              <Skeleton className="h-10 w-10 rounded-full bg-[var(--stitch-surface-container-high)]" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-24 bg-[var(--stitch-surface-container-high)]" />
                <Skeleton className="h-2 w-full bg-[var(--stitch-surface-container-high)]" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (chartData.length === 0) {
    return (
      <div className="stitch-card p-6">
        <h3 className="text-label-caps text-[var(--stitch-on-surface-variant)] mb-4">
          Category Breakdown
        </h3>
        <div className="flex flex-col items-center justify-center py-8 gap-3">
          <div className="text-4xl" aria-hidden="true">📊</div>
          <p className="text-sm font-medium text-[var(--stitch-on-surface-variant)]">
            No transactions yet this month
          </p>
          <p className="text-xs text-[var(--stitch-on-surface-variant)]/80 max-w-xs text-center">
            Start adding transactions to see your monthly categories broken down here.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="stitch-card p-6">
      <h3 className="text-label-caps text-[var(--stitch-on-surface-variant)] mb-4">
        Category Breakdown
      </h3>
      {/* Icon + Progress Bar Layout (Stitch style) */}
      <div className="flex flex-col gap-5">
        {chartData.map((item) => {
          const config = CATEGORY_CONFIG[item.category] ?? CATEGORY_CONFIG.Other;
          const pct = totalSpent > 0 ? Math.round((item.total / totalSpent) * 100) : 0;
          return (
            <div key={item.category} className="flex items-center gap-4 animate-float-in">
              <div
                className={`w-10 h-10 rounded-full ${config.bg} flex items-center justify-center text-xl flex-shrink-0`}
              >
                {config.icon}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between mb-1">
                  <span className="text-sm font-semibold text-[var(--stitch-on-surface)] truncate">
                    {item.category}
                  </span>
                  <span className="text-stat-sm text-[var(--stitch-on-surface)]">{pct}%</span>
                </div>
                <div className="h-2 w-full bg-[var(--stitch-surface-container-high)] rounded-full overflow-hidden">
                  <div
                    className={`h-full ${config.color} rounded-full transition-all duration-700 ease-out`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Screen Reader fallback */}
      <div className="sr-only">
        <h4>Table of Spending by Category</h4>
        <table>
          <thead>
            <tr>
              <th scope="col">Category</th>
              <th scope="col">Amount Spent</th>
            </tr>
          </thead>
          <tbody>
            {chartData.map((data) => (
              <tr key={data.category}>
                <td>{data.category}</td>
                <td>₹{data.total.toLocaleString("en-IN")}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
});

CategoryBreakdown.displayName = "CategoryBreakdown";
