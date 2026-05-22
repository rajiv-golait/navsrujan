"use client";

import { memo } from "react";
import Link from "next/link";

import type { MLInsight } from "@/types/analytics";

interface MLInsightCardProps {
  ml?: MLInsight | null;
  modelsAvailable?: boolean;
  isLoading?: boolean;
}

function stressColor(level: string) {
  if (level === "High") return "var(--stitch-error)";
  if (level === "Medium") return "var(--stitch-tertiary, #b45309)";
  return "var(--stitch-primary)";
}

export const MLInsightCard = memo(function MLInsightCard({
  ml,
  modelsAvailable = false,
  isLoading = false,
}: MLInsightCardProps) {
  if (isLoading) {
    return (
      <div className="bg-[var(--stitch-primary)]/5 p-6 rounded-[1.5rem] border border-[var(--stitch-primary)]/10 animate-pulse h-40" />
    );
  }

  if (!modelsAvailable || !ml?.models_loaded) {
    return (
      <div className="bg-[var(--stitch-primary)]/5 p-6 rounded-[1.5rem] border border-[var(--stitch-primary)]/10">
        <p className="text-label-caps text-[var(--stitch-primary)] mb-2">STRIVE AI</p>
        <p className="text-sm text-[var(--stitch-on-surface-variant)]">
          Add more transactions to unlock ML insights (stress score, anomalies,
          spending profile).
        </p>
        <Link
          href="/chat"
          className="mt-4 w-full py-3 bg-[var(--stitch-primary)] text-white rounded-xl font-semibold text-center block"
        >
          Chat with Assistant
        </Link>
      </div>
    );
  }

  const quote =
    ml.overspending_risk === "High"
      ? `Stress is ${ml.stress_level.toLowerCase()} (${ml.financial_stress_score}/100). Top risk: ${ml.top_risk_category ?? "spending pace"}. ~${ml.estimated_days_remaining} days of budget left at current burn.`
      : `Profile: ${ml.behavioral_profile ?? "balanced"}. Burn ₹${ml.burn_rate_daily}/day — ${ml.estimated_days_remaining} days runway. Stress: ${ml.stress_level}.`;

  return (
    <div className="bg-[var(--stitch-primary)]/5 p-6 rounded-[1.5rem] border border-[var(--stitch-primary)]/10">
      <div className="flex items-center justify-between gap-2 mb-3">
        <span className="text-label-caps text-[var(--stitch-primary)]">STRIVE AI</span>
        <span
          className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full"
          style={{
            color: stressColor(ml.stress_level),
            background: `color-mix(in srgb, ${stressColor(ml.stress_level)} 15%, transparent)`,
          }}
        >
          {ml.stress_level} stress
        </span>
      </div>
      <p className="text-base text-[var(--stitch-on-surface-variant)] italic leading-relaxed">
        &ldquo;{quote}&rdquo;
      </p>
      {ml.anomaly_count > 0 && (
        <p className="mt-2 text-xs text-[var(--stitch-error)] font-medium">
          {ml.anomaly_count} unusual transaction{ml.anomaly_count > 1 ? "s" : ""} detected
        </p>
      )}
      <Link
        href="/chat"
        className="mt-4 w-full py-3 bg-[var(--stitch-primary)] text-white rounded-xl font-semibold text-center block hover:shadow-lg transition-all"
      >
        Chat with Assistant
      </Link>
    </div>
  );
});

MLInsightCard.displayName = "MLInsightCard";
