"use client";

import { memo } from "react";
import { TrendingUp } from "lucide-react";

import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency } from "@/lib/utils";
import type { MonthSummary } from "@/types/transaction";

interface CurrentMonthSummaryProps {
  summary: MonthSummary | undefined;
  isLoading: boolean;
}

export const CurrentMonthSummary = memo(function CurrentMonthSummary({
  summary,
  isLoading,
}: CurrentMonthSummaryProps) {
  if (isLoading) {
    return (
      <div className="stitch-card p-6 animate-pulse">
        <Skeleton className="h-3 w-24 mb-3 bg-[var(--stitch-surface-container-high)]" />
        <Skeleton className="h-10 w-36 mb-4 bg-[var(--stitch-surface-container-high)]" />
        <Skeleton className="h-4 w-32 bg-[var(--stitch-surface-container-high)]" />
      </div>
    );
  }

  const transactionCount = summary?.transaction_count ?? 0;
  const totalSpent = summary?.total_spent ?? 0;

  return (
    <div
      className="stitch-card p-6 hover:shadow-md transition-all duration-200 bg-gradient-to-br from-[var(--stitch-primary)]/5 to-[var(--stitch-secondary-container)]/5"
      role="region"
      aria-label="Monthly financial summary statistics"
    >
      <p className="text-label-caps text-[var(--stitch-on-surface-variant)] mb-1">
        Spent This Month
      </p>
      <h2
        className="text-headline-xl text-[var(--stitch-on-surface)] mb-2"
        aria-label={`Total spent: ${formatCurrency(totalSpent)}`}
      >
        {formatCurrency(totalSpent)}
      </h2>
      <div className="flex items-center gap-2 text-sm text-[var(--stitch-on-surface-variant)]">
        <TrendingUp className="h-4 w-4 text-[var(--stitch-secondary-container)]" aria-hidden="true" />
        <span>
          {transactionCount} {transactionCount === 1 ? "transaction" : "transactions"} logged
        </span>
      </div>
    </div>
  );
});

CurrentMonthSummary.displayName = "CurrentMonthSummary";
