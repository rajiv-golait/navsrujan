"use client";

import { Wallet } from "lucide-react";
import { useBalance } from "@/lib/hooks/useBalance";
import { formatCurrency } from "@/lib/utils";

interface BalanceStripProps {
  compact?: boolean;
}

export function BalanceStrip({ compact = false }: BalanceStripProps) {
  const { data: balance, isLoading } = useBalance();

  if (isLoading) {
    return (
      <div className="vault-card p-4 animate-pulse h-28" />
    );
  }

  if (!balance?.configured) {
    return null;
  }

  const runwayDays = balance.runway_days ?? 0;
  const runwayLevel =
    runwayDays <= 7 ? "critical" : runwayDays <= 21 ? "warning" : "healthy";
  const runwayBarClass =
    runwayLevel === "critical"
      ? "from-red-500 to-orange-500"
      : runwayLevel === "warning"
        ? "from-amber-400 to-yellow-500"
        : "from-emerald-400 to-cyan-400";
  const projectedClass =
    (balance.projected_balance_30d ?? 0) < 0
      ? "text-red-400"
      : "text-[var(--stitch-on-surface)]";

  if (compact) {
    return (
      <div className="vault-card p-3 md:p-4">
        <div className="grid grid-cols-3 gap-3">
          <div>
            <p className="text-label-caps text-[10px] text-[var(--stitch-on-surface-variant)] flex items-center gap-1">
              <Wallet className="h-3 w-3" /> Balance
            </p>
            <p className="text-data-mono text-base md:text-lg font-semibold text-[var(--stitch-on-surface)] mt-0.5">
              {formatCurrency(balance.current_balance ?? 0)}
            </p>
          </div>
          <div>
            <p className="text-label-caps text-[10px] text-[var(--stitch-on-surface-variant)]">30d projected</p>
            <p className={`text-data-mono text-base md:text-lg font-semibold mt-0.5 ${projectedClass}`}>
              {formatCurrency(balance.projected_balance_30d ?? 0)}
            </p>
          </div>
          <div>
            <p className="text-label-caps text-[10px] text-[var(--stitch-on-surface-variant)]">Runway</p>
            <p className="text-data-mono text-base md:text-lg font-semibold text-[var(--stitch-on-surface)] mt-0.5">
              {runwayDays} days
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="vault-card-elevated p-4 md:p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-label-caps text-[var(--stitch-on-surface-variant)] flex items-center gap-1.5">
            <Wallet className="h-3.5 w-3.5" /> Current balance
          </p>
          <p className="vault-stat text-[var(--stitch-on-surface)] mt-1">
            {formatCurrency(balance.current_balance ?? 0)}
          </p>
        </div>
        <p className="text-xs rounded-full border border-[var(--stitch-outline-variant)]/80 px-2.5 py-1 text-[var(--stitch-on-surface-variant)]">
          Updated now
        </p>
      </div>

      <div className="mt-3 h-1.5 rounded-full bg-[var(--surface-0)] overflow-hidden">
        <div
          className={`h-full rounded-full bg-gradient-to-r ${runwayBarClass}`}
          style={{ width: `${Math.min(100, Math.max(8, (runwayDays / 60) * 100))}%` }}
        />
      </div>

      <div className="mt-3 grid grid-cols-2 gap-3">
        <div className="rounded-xl bg-[var(--surface-1)]/80 border border-[var(--stitch-outline-variant)]/70 p-3">
          <p className="text-label-caps text-[var(--stitch-on-surface-variant)]">30d projected</p>
          <p className={`text-data-mono text-base font-semibold mt-1 ${projectedClass}`}>
            {formatCurrency(balance.projected_balance_30d ?? 0)}
          </p>
        </div>
        <div className="rounded-xl bg-[var(--surface-1)]/80 border border-[var(--stitch-outline-variant)]/70 p-3">
          <p className="text-label-caps text-[var(--stitch-on-surface-variant)]">Runway</p>
          <p className="text-data-mono text-base font-semibold text-[var(--stitch-on-surface)] mt-1">
            {runwayDays} days
          </p>
        </div>
      </div>
    </div>
  );
}
