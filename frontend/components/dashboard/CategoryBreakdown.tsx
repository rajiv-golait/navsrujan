"use client";

import { memo, useMemo } from "react";

import { Skeleton } from "@/components/ui/skeleton";
import type { MonthSummary } from "@/types/transaction";

interface CategoryBreakdownProps {
  summary: MonthSummary | undefined;
  isLoading: boolean;
}

const CATEGORY_CONFIG: Record<string, { icon: string; color: string; bg: string }> = {
  Food: { icon: "🍔", color: "category-color-food", bg: "category-bg-food" },
  Transport: { icon: "🚆", color: "category-color-transport", bg: "category-bg-transport" },
  Entertainment: { icon: "🎬", color: "category-color-entertainment", bg: "category-bg-entertainment" },
  Shopping: { icon: "🛍️", color: "category-color-shopping", bg: "category-bg-shopping" },
  Bills: { icon: "🔁", color: "category-color-bills", bg: "category-bg-bills" },
  Education: { icon: "📚", color: "category-color-education", bg: "category-bg-education" },
  Health: { icon: "💗", color: "category-color-health", bg: "category-bg-health" },
  Academic: { icon: "🎓", color: "category-color-education", bg: "category-bg-education" },
  Other: { icon: "📦", color: "category-color-other", bg: "category-bg-other" },
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
    <div className="vault-card p-6">
      <h3 className="text-label-caps text-[var(--stitch-on-surface-variant)] mb-4">
        Category Breakdown
      </h3>
      <div className="flex flex-col gap-3">
        {chartData.map((item) => {
          const config = CATEGORY_CONFIG[item.category] ?? CATEGORY_CONFIG.Other;
          const pct = totalSpent > 0 ? Math.round((item.total / totalSpent) * 100) : 0;
          return (
            <div key={item.category} className="ios-row flex items-center justify-between animate-float-in">
              <div className="flex items-center gap-3 min-w-0">
                <div className={`w-9 h-9 rounded-xl ${config.bg} flex items-center justify-center text-lg flex-shrink-0`}>
                  {config.icon}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-[var(--stitch-on-surface)] truncate">{item.category}</p>
                  <p className="text-xs text-[var(--stitch-on-surface-variant)]">₹{item.total.toLocaleString("en-IN")}</p>
                </div>
              </div>
              <span className={`category-chip ${config.color}`}>
                <span className={`category-dot ${config.bg.replace("category-bg", "category-solid")}`} />
                {pct}%
              </span>
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
