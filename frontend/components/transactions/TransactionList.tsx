"use client";

import { memo, useState } from "react";
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
  Food: "🍽️",
  Transport: "🚌",
  Entertainment: "🎬",
  Shopping: "🛍️",
  Bills: "📱",
  Education: "📚",
  Health: "❤️",
  Academic: "🎓",
  Other: "📦",
};

function formatTransactionDate(dateValue: string) {
  // Date-only strings (YYYY-MM-DD) should not be converted as UTC midnight,
  // otherwise users in IST see a fake 5:30 AM time for every transaction.
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateValue)) {
    const parsed = parseISO(dateValue);
    return isValid(parsed) ? format(parsed, "MMM d") : dateValue;
  }
  const parsed = parseISO(dateValue);
  return isValid(parsed) ? format(parsed, "MMM d, h:mm a") : dateValue;
}

export const TransactionList = memo(function TransactionList({
  transactions,
  isLoading,
  showActions = true,
  onAddTrigger,
}: TransactionListProps) {
  const deleteMutation = useDeleteTransaction();
  const [deletingId, setDeletingId] = useState<string | null>(null);

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

  // Transaction cards (Stitch style)
  return (
    <div className="space-y-2">
      {transactions.map((txn, i) => {
        const isRowDeleting = deletingId === txn.id;
        const icon = CATEGORY_ICONS[txn.category] ?? CATEGORY_ICONS.Other;
        const amount = Number(txn.amount);
        const isCredit = txn.transaction_type === "credit";

        return (
          <div
            key={txn.id}
            className={`flex items-center justify-between p-3 hover:bg-[var(--stitch-surface-container)] transition-all duration-200 rounded-xl cursor-pointer group ${
              isRowDeleting ? "opacity-50" : ""
            }`}
            style={{ animationDelay: `${i * 50}ms` }}
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-[var(--stitch-surface-container-high)] flex items-center justify-center text-lg flex-shrink-0">
                {icon}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-[var(--stitch-on-surface)] truncate">
                  {txn.merchant || txn.category}
                </p>
                <p className="text-xs text-[var(--stitch-on-surface-variant)]">
                  {formatTransactionDate(txn.transaction_date)}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className={`text-stat-sm font-semibold ${
                isCredit ? "text-[var(--stitch-primary)]" : "text-[var(--stitch-error)]"
              }`}>
                {isCredit ? "+ " : "- "}
                {formatCurrency(amount)}
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
                  aria-label={`Delete transaction at ${txn.merchant || txn.category} for ${formatCurrency(amount)}`}
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
  );
});

TransactionList.displayName = "TransactionList";
