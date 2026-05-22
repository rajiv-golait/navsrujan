"use client";

import { useScheduledExpenses } from "@/lib/hooks/useFinancialMemory";
import { formatCurrency } from "@/lib/utils";

export function ScheduledExpensesPanel() {
  const { data: items = [] } = useScheduledExpenses();

  if (items.length === 0) return null;

  return (
    <div className="vault-card p-3 space-y-2">
      <p className="text-label-caps text-[var(--stitch-on-surface-variant)]">Upcoming plans</p>
      <ul className="space-y-1 max-h-32 overflow-auto">
        {items.slice(0, 5).map((item) => (
          <li key={item.id} className="flex justify-between text-xs gap-2">
            <span className="truncate text-[var(--stitch-on-surface)]">{item.title}</span>
            <span className="text-data-mono whitespace-nowrap">
              {formatCurrency(item.amount)} · {item.expected_date}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
