"use client";

import { Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { useParseExpense } from "@/lib/hooks/useNlpParse";
import { getApiErrorMessage } from "@/lib/api-errors";
import type { ParsedTransactionData } from "@/types/chat";
import type { TransactionCategory } from "@/types/transaction";

export interface TransactionFormInitialValues {
  amount: string;
  category: TransactionCategory;
  merchant: string;
  description: string;
  transactionDate: string;
  sourceText?: string;
  confidenceScore?: number;
}

interface NaturalLanguageInputProps {
  onParsed: (values: TransactionFormInitialValues) => void;
}

export function NaturalLanguageInput({ onParsed }: NaturalLanguageInputProps) {
  const [text, setText] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const parseMutation = useParseExpense();

  const handleParse = async () => {
    const trimmed = text.trim();
    if (!trimmed) return;

    try {
      const result = await parseMutation.mutateAsync(trimmed);

      if (result.status === "needs_clarification") {
        toast.error(result.question || "Could not parse expense");
        return;
      }

      if (!result.transaction) {
        toast.error("No transaction data returned");
        return;
      }

      const txn: ParsedTransactionData = result.transaction;
      onParsed({
        amount: String(txn.amount),
        category: txn.category as TransactionCategory,
        merchant: txn.merchant || "",
        description: txn.description || "",
        transactionDate: txn.transaction_date,
        sourceText: result.source_text || trimmed,
        confidenceScore: result.confidence,
      });
      toast.success("Parsed — review and confirm below");
      setText("");
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Failed to parse expense"));
    }
  };

  return (
    <div className="gradient-glow">
      <div className="relative bg-[var(--stitch-surface-container-lowest)] rounded-[1.5rem] stitch-card overflow-hidden">
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              handleParse();
            }
          }}
          placeholder={isFocused ? "Try 'Bought textbook for 85'" : "Spent 250 on pizza..."}
          className="w-full bg-transparent border-none focus:ring-0 focus:outline-none text-base py-4 px-5 pr-14 placeholder:text-[var(--stitch-on-surface-variant)]/50 font-medium text-[var(--stitch-on-surface)]"
        />
        <Button
          type="button"
          onClick={handleParse}
          disabled={parseMutation.isPending || !text.trim()}
          className="absolute right-3 top-1/2 -translate-y-1/2 bg-[var(--stitch-primary)] text-white w-10 h-10 rounded-full flex items-center justify-center active:scale-95 transition-transform hover:shadow-md p-0 min-w-0"
        >
          {parseMutation.isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M13 7h-2v4H7v2h4v4h2v-4h4v-2h-4V7zm-1-5C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z" />
            </svg>
          )}
        </Button>
      </div>
    </div>
  );
}
