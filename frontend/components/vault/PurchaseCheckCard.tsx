"use client";

import { formatCurrency } from "@/lib/utils";

export interface PurchaseCheckData {
  purchase_amount: number;
  current_balance?: number;
  balance_after_purchase?: number;
  runway_days_before?: number;
  runway_days_after?: number;
  verdict?: string;
}

interface PurchaseCheckCardProps {
  data: PurchaseCheckData;
}

export function PurchaseCheckCard({ data }: PurchaseCheckCardProps) {
  const verdict = data.verdict ?? "review";
  const tone =
    verdict === "safe"
      ? "text-emerald-400"
      : verdict === "tight"
        ? "text-amber-400"
        : "text-[var(--stitch-error)]";

  return (
    <div className="vault-card p-4 space-y-3 border-l-2 border-[var(--vault-accent,#4f46e5)]">
      <p className="text-label-caps text-[var(--stitch-on-surface-variant)]">Purchase check</p>
      <p className={`text-sm font-semibold capitalize ${tone}`}>{verdict}</p>
      <div className="grid grid-cols-2 gap-3 text-xs">
        <div>
          <p className="text-[var(--stitch-on-surface-variant)]">Amount</p>
          <p className="text-data-mono">{formatCurrency(data.purchase_amount)}</p>
        </div>
        <div>
          <p className="text-[var(--stitch-on-surface-variant)]">After purchase</p>
          <p className="text-data-mono">
            {formatCurrency(data.balance_after_purchase ?? 0)}
          </p>
        </div>
        <div>
          <p className="text-[var(--stitch-on-surface-variant)]">Runway before</p>
          <p className="text-data-mono">{data.runway_days_before ?? "—"} days</p>
        </div>
        <div>
          <p className="text-[var(--stitch-on-surface-variant)]">Runway after</p>
          <p className="text-data-mono">{data.runway_days_after ?? "—"} days</p>
        </div>
      </div>
    </div>
  );
}
