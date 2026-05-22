"use client";

import { memo } from "react";

interface BurnRateGaugeProps {
  dailyBurn?: number;
  dailyLimit?: number;
  overspendingRisk?: string;
}

export const BurnRateGauge = memo(function BurnRateGauge({
  dailyBurn,
  dailyLimit,
  overspendingRisk,
}: BurnRateGaugeProps) {
  const burn = dailyBurn ?? 0;
  const limit = dailyLimit ?? (burn > 0 ? Math.round(burn * 0.9) : 1);
  const isHighRisk =
    overspendingRisk === "High" || (burn > 0 && limit > 0 && burn > limit);
  const overPercent = Math.min(((burn / (limit * 1.5)) * 100), 100);
  const circumference = 2 * Math.PI * 56;
  const offset = circumference - (overPercent / 100) * circumference;

  return (
    <div className="stitch-card p-6 text-center" style={{ borderColor: isHighRisk ? 'rgba(186, 26, 26, 0.1)' : undefined }}>
      <p className="text-label-caps text-[var(--stitch-on-surface-variant)] mb-4">
        Daily Burn Rate
      </p>

      {/* SVG Gauge */}
      <div className="relative w-32 h-32 mx-auto mb-4">
        <svg className="w-full h-full -rotate-90">
          <circle
            className="text-[var(--stitch-surface-container-high)]"
            cx="64"
            cy="64"
            r="56"
            fill="transparent"
            stroke="currentColor"
            strokeWidth="8"
          />
          <circle
            className={isHighRisk ? "text-[var(--stitch-error)]" : "text-[var(--stitch-primary)]"}
            cx="64"
            cy="64"
            r="56"
            fill="transparent"
            stroke="currentColor"
            strokeWidth="12"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            style={{ transition: "stroke-dashoffset 1s ease-out" }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-stat-lg">
            {burn > 0 ? `₹${burn.toLocaleString("en-IN")}` : "—"}
          </span>
          <span className="text-[10px] text-label-caps opacity-60">/DAY</span>
        </div>
      </div>

      {/* Risk Badge */}
      {isHighRisk && (
        <div className="inline-flex items-center gap-1 bg-[var(--stitch-error)]/10 text-[var(--stitch-error)] px-3 py-1 rounded-full text-xs font-bold animate-float-in">
          <svg className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          HIGH RISK
        </div>
      )}

      <p className="mt-4 text-xs text-[var(--stitch-on-surface-variant)] leading-relaxed">
        {burn > 0 && limit > 0 ? (
          isHighRisk ? (
            <>
              Spending {Math.round(((burn - limit) / limit) * 100)}% above your
              suggested daily limit of ₹{limit.toLocaleString("en-IN")}.
            </>
          ) : (
            <>
              On track — suggested daily limit ₹{limit.toLocaleString("en-IN")}.
            </>
          )
        ) : (
          <>Add transactions to see your burn rate.</>
        )}
      </p>
    </div>
  );
});

BurnRateGauge.displayName = "BurnRateGauge";
