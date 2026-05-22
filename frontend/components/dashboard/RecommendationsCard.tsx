"use client";

import { memo } from "react";
import { CheckCircle2, CircleAlert, Lightbulb } from "lucide-react";

import { formatCurrency } from "@/lib/utils";
import type { OverspendingPattern, SavingRecommendation } from "@/types/analytics";

interface RecommendationsCardProps {
  recommendations?: SavingRecommendation[];
  patterns?: OverspendingPattern[];
  healthScore?: number;
}

function priorityStyles(priority: SavingRecommendation["priority"]) {
  if (priority === "high") {
    return {
      icon: CircleAlert,
      color: "text-[var(--stitch-error)]",
      bg: "bg-[var(--stitch-error)]/10",
    };
  }
  if (priority === "medium") {
    return {
      icon: Lightbulb,
      color: "text-[var(--stitch-tertiary)]",
      bg: "bg-[var(--stitch-tertiary)]/10",
    };
  }
  return {
    icon: CheckCircle2,
    color: "text-[var(--stitch-primary)]",
    bg: "bg-[var(--stitch-primary)]/10",
  };
}

export const RecommendationsCard = memo(function RecommendationsCard({
  recommendations = [],
  patterns = [],
  healthScore = 100,
}: RecommendationsCardProps) {
  return (
    <div className="stitch-card p-6">
      <div className="mb-5 flex items-center justify-between gap-3">
        <div>
          <p className="text-label-caps text-[var(--stitch-on-surface-variant)]">
            Optimization Coach
          </p>
          <h3 className="mt-1 text-2xl font-bold text-[var(--stitch-on-surface)]">
            {healthScore}/100
          </h3>
        </div>
        <div className="h-2 w-28 overflow-hidden rounded-full bg-[var(--stitch-surface-container-high)]">
          <div
            className="h-full rounded-full bg-[var(--stitch-secondary-container)] transition-all"
            style={{ width: `${Math.max(0, Math.min(healthScore, 100))}%` }}
          />
        </div>
      </div>

      <div className="space-y-3">
        {recommendations.map((item) => {
          const styles = priorityStyles(item.priority);
          const Icon = styles.icon;
          return (
            <div
              key={`${item.title}-${item.category}`}
              className="rounded-xl border border-[var(--stitch-outline-variant)]/30 p-4"
            >
              <div className="flex items-start gap-3">
                <div className={`mt-0.5 flex h-8 w-8 items-center justify-center rounded-lg ${styles.bg} ${styles.color}`}>
                  <Icon className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-3">
                    <p className="font-semibold text-[var(--stitch-on-surface)]">
                      {item.title}
                    </p>
                    {item.potential_savings > 0 && (
                      <span className="shrink-0 text-stat-sm text-[var(--stitch-primary)]">
                        {formatCurrency(item.potential_savings)}
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-sm text-[var(--stitch-on-surface-variant)]">
                    {item.action}
                  </p>
                  <p className="mt-2 text-xs font-medium text-[var(--stitch-on-surface-variant)]">
                    {item.impact}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {patterns.length > 0 && (
        <div className="mt-5 border-t border-[var(--stitch-outline-variant)]/30 pt-5">
          <p className="mb-3 text-label-caps text-[var(--stitch-on-surface-variant)]">
            Category Watch
          </p>
          <div className="space-y-2">
            {patterns.slice(0, 3).map((pattern) => (
              <div key={pattern.category} className="flex items-center justify-between gap-3 text-sm">
                <span className="font-medium text-[var(--stitch-on-surface)]">
                  {pattern.category}
                </span>
                <span
                  className={
                    pattern.status === "over"
                      ? "text-[var(--stitch-error)]"
                      : "text-[var(--stitch-primary)]"
                  }
                >
                  {pattern.status === "over" ? "Needs cap" : "On track"}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
});

RecommendationsCard.displayName = "RecommendationsCard";
