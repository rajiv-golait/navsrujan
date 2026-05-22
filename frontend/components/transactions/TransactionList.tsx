"use client";

import { memo, useMemo, useState } from "react";
import { format, isValid, parseISO } from "date-fns";
import { Trash2, Loader2, Plus } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useDeleteTransaction } from "@/lib/hooks/useTransactions";
import { formatCurrency } from "@/lib/utils";
import type { Transaction } from "@/types/transaction";

interface TransactionListProps {
  transactions: Transaction[];
  isLoading: boolean;
  showActions?: boolean;
  onAddTrigger?: () => void;
}

const CATEGORY_ICONS: Record<string, string> = {
  Food: "🍔",
  Transport: "🚆",
  Entertainment: "🎬",
  Shopping: "🛍️",
  Bills: "🔁",
  Education: "📚",
  Health: "💗",
  Academic: "🎓",
  Other: "📦",
};

const CATEGORY_STYLE_MAP: Record<string, string> = {
  Food: "food",
  Transport: "transport",
  Entertainment: "entertainment",
  Shopping: "shopping",
  Bills: "bills",
  Education: "education",
  Academic: "education",
  Health: "health",
  Other: "other",
};

function parseTransactionDate(dateValue: string) {
  // Date-only strings (YYYY-MM-DD) should not be converted as UTC midnight,
  // otherwise users in IST see a fake 5:30 AM time for every transaction.
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateValue)) {
    const parsed = parseISO(dateValue);
    return isValid(parsed) ? parsed : null;
  }
  const parsed = parseISO(dateValue);
  return isValid(parsed) ? parsed : null;
}

export const TransactionList = memo(function TransactionList({
  transactions,
  isLoading,
  showActions = true,
  onAddTrigger,
}: TransactionListProps) {
  const deleteMutation = useDeleteTransaction();
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const groupedTransactions = useMemo(() => {
    const sorted = [...transactions].sort((a, b) => {
      const da = parseTransactionDate(a.transaction_date)?.getTime() ?? 0;
      const db = parseTransactionDate(b.transaction_date)?.getTime() ?? 0;
      return db - da;
    });
    const groups: Array<{
      dayKey: string;
      dayLabel: string;
      total: number;
      items: Transaction[];
    }> = [];
    for (const txn of sorted) {
      const parsed = parseTransactionDate(txn.transaction_date);
      const dayKey = parsed ? format(parsed, "yyyy-MM-dd") : txn.transaction_date;
      const dayLabel = parsed ? format(parsed, "EEE, d MMM") : txn.transaction_date;
      const existing = groups.find((group) => group.dayKey === dayKey);
      if (!existing) {
        groups.push({
          dayKey,
          dayLabel,
          total: 0,
          items: [txn],
        });
      } else {
        existing.items.push(txn);
      }
    }
    for (const group of groups) {
      group.total = group.items.reduce((sum, txn) => {
        const amount = Number(txn.amount);
        const sign = txn.transaction_type === "credit" ? 1 : -1;
        return sum + sign * amount;
      }, 0);
    }
    return groups;
  }, [transactions]);

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      await deleteMutation.mutateAsync(id);
      toast.success("Transaction deleted successfully");
    } catch (error) {
      toast.error("Failed to delete transaction. Please try again.");
      console.error("Delete transaction error:", error);
    } finally {
      setDeletingId(null);
    }
  };

  // Loading skeleton
  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 p-4 rounded-[1.5rem] animate-pulse">
            <Skeleton className="h-12 w-12 rounded-2xl bg-[var(--stitch-surface-container-high)]" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-32 bg-[var(--stitch-surface-container-high)]" />
              <Skeleton className="h-3 w-20 bg-[var(--stitch-surface-container-high)]" />
            </div>
            <Skeleton className="h-6 w-16 bg-[var(--stitch-surface-container-high)]" />
          </div>
        ))}
      </div>
    );
  }

  // Empty state
  if (transactions.length === 0) {
    return (
      <div
        className="flex flex-col items-center justify-center text-center py-12 gap-3"
        role="status"
      >
        <div className="text-5xl" aria-hidden="true">💸</div>
        <h3 className="text-lg font-semibold text-[var(--stitch-on-surface)]">No transactions found</h3>
        <p className="text-sm text-[var(--stitch-on-surface-variant)] max-w-sm">
          Keep track of your personal and academic expenses. Get started by adding your first transaction.
        </p>
        {onAddTrigger && (
          <Button
            onClick={onAddTrigger}
            size="sm"
            className="mt-2 bg-[var(--stitch-primary)] hover:bg-[var(--stitch-primary)]/90 text-white rounded-xl"
          >
            <Plus className="mr-1.5 h-4 w-4" />
            Add Transaction
          </Button>
        )}
      </div>
    );
  }

  const formatAmount = (txn: Transaction) => {
    const amount = Number(txn.amount);
    return `${txn.transaction_type === "credit" ? "+" : "-"}${formatCurrency(amount)}`;
  };

  return (
    <div className="space-y-5">
      {groupedTransactions.map((group, groupIndex) => (
        <section key={group.dayKey} className="space-y-2">
          <div className="flex items-center justify-between px-1">
            <p className="text-label-caps text-[var(--stitch-on-surface-variant)]">{group.dayLabel}</p>
            <p className={`text-data-mono text-sm font-semibold ${group.total < 0 ? "text-[var(--stitch-on-surface)]" : "text-emerald-400"}`}>
              {group.total >= 0 ? "+" : ""}{formatCurrency(group.total)}
            </p>
          </div>
          <div className="space-y-2">
            {group.items.map((txn, index) => {
              const isRowDeleting = deletingId === txn.id;
              const icon = CATEGORY_ICONS[txn.category] ?? CATEGORY_ICONS.Other;
              const isCredit = txn.transaction_type === "credit";
              const parsed = parseTransactionDate(txn.transaction_date);
              const timeLabel = parsed ? format(parsed, "h:mm a") : "--";
              const categoryKey = CATEGORY_STYLE_MAP[txn.category] ?? "other";

              return (
                <div
                  key={txn.id}
                  className={`ios-row flex items-center justify-between transition-all duration-200 group ${
                    isRowDeleting ? "opacity-50" : ""
                  }`}
                  style={{ animationDelay: `${groupIndex * 60 + index * 40}ms` }}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`w-11 h-11 rounded-2xl category-bg-${categoryKey} flex items-center justify-center text-lg flex-shrink-0`}>
                      {icon}
                    </div>
                    <div className="min-w-0">
                      <p className="text-base font-semibold text-[var(--stitch-on-surface)] truncate">
                        {txn.merchant || txn.category}
                      </p>
                      <p className="text-xs text-[var(--stitch-on-surface-variant)]">
                        {timeLabel}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-xl font-semibold tracking-tight ${
                      isCredit ? "text-emerald-400" : "text-[var(--stitch-on-surface)]"
                    }`}>
                      {formatAmount(txn)}
                    </span>
                    {showActions && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity text-[var(--stitch-on-surface-variant)] hover:text-[var(--stitch-error)] hover:bg-[var(--stitch-error-container)]/30 rounded-lg"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(txn.id);
                        }}
                        disabled={isRowDeleting || deleteMutation.isPending}
                        aria-label={`Delete transaction at ${txn.merchant || txn.category} for ${formatCurrency(Number(txn.amount))}`}
                      >
                        {isRowDeleting ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
});

TransactionList.displayName = "TransactionList";
