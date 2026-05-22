"use client";

import { useRecurringObligations } from "@/lib/hooks/useFinancialMemory";
import { formatCurrency } from "@/lib/utils";

export function RecurringPanel() {
  const { data: items = [] } = useRecurringObligations();

  if (items.length === 0) return null;

  return (
    <div className="vault-card p-3 space-y-2">
      <p className="text-label-caps text-[var(--stitch-on-surface-variant)]">Recurring costs</p>
      <ul className="space-y-1 max-h-28 overflow-auto">
        {items.slice(0, 5).map((item) => (
          <li key={item.id} className="flex justify-between text-xs gap-2">
            <span className="truncate text-[var(--stitch-on-surface)]">{item.name}</span>
            <span className="text-data-mono whitespace-nowrap">
              {formatCurrency(item.amount)}/{item.frequency}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
