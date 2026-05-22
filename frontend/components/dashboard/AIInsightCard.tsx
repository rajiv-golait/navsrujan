"use client";

import { memo } from "react";
import Link from "next/link";

interface AIInsightCardProps {
  insightText?: string;
}

export const AIInsightCard = memo(function AIInsightCard({
  insightText,
}: AIInsightCardProps) {
  const message =
    insightText ??
    "Connect your transaction history to unlock personalized AI recommendations.";

  return (
    <div className="bg-[var(--stitch-primary)]/5 p-6 rounded-[1.5rem] border border-[var(--stitch-primary)]/10 relative overflow-hidden">
      <div className="flex items-center gap-2 mb-3">
        <svg className="h-5 w-5 text-[var(--stitch-primary)]" viewBox="0 0 24 24" fill="currentColor">
          <path d="M19.07 4.93l-1.41 1.41A8.014 8.014 0 0120 12c0 4.42-3.58 8-8 8s-8-3.58-8-8c0-3.35 2.07-6.22 5-7.41V2.05C4.06 3.29 1 7.26 1 12c0 6.08 4.93 11 11 11s11-4.92 11-11c0-2.69-.97-5.15-2.58-7.07zM12 2v8l5 3-1 1.73L10 11V2h2z"/>
        </svg>
        <span className="text-label-caps text-[var(--stitch-primary)]">STRIVE AI</span>
      </div>
      <p className="text-base text-[var(--stitch-on-surface-variant)] italic leading-relaxed">
        &ldquo;{message}&rdquo;
      </p>
      <Link
        href="/chat"
        className="mt-4 w-full py-3 bg-[var(--stitch-primary)] text-white rounded-xl font-semibold shadow-md active:scale-[0.97] transition-all flex items-center justify-center hover:shadow-lg"
      >
        Chat with Assistant
      </Link>
    </div>
  );
});

AIInsightCard.displayName = "AIInsightCard";
