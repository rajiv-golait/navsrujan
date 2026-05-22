"use client";

import { useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import { AlertCircle, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCreateTransaction } from "@/lib/hooks/useTransactions";
import {
  TRANSACTION_CATEGORIES,
  type TransactionCategory,
} from "@/types/transaction";
import type { TransactionFormInitialValues } from "./NaturalLanguageInput";

interface AddTransactionFormProps {
  initialValues?: TransactionFormInitialValues | null;
  onSuccess?: () => void;
}

const transactionSchema = z.object({
  amount: z.number({ message: "Amount must be a positive number greater than 0" })
    .positive({ message: "Amount must be a positive number greater than 0" })
    .max(1000000, { message: "Amount cannot exceed ₹1,000,000" }),
  category: z.custom<TransactionCategory>((val) => 
    TRANSACTION_CATEGORIES.includes(val as TransactionCategory), {
      message: "Invalid transaction category",
    }
  ),
  merchant: z
    .string()
    .max(100, { message: "Merchant name cannot exceed 100 characters" })
    .optional()
    .or(z.literal("")),
  description: z
    .string()
    .max(500, { message: "Description cannot exceed 500 characters" })
    .optional()
    .or(z.literal("")),
  transactionDate: z
    .string()
    .min(1, { message: "Date is required" })
    .refine((val) => !isNaN(Date.parse(val)), {
      message: "Please enter a valid date",
    })
    .refine((val) => {
      const selected = new Date(val);
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(0, 0, 0, 0);
      return selected < tomorrow;
    }, {
      message: "Transaction date cannot be in the future",
    }),
});

type TransactionFormData = z.infer<typeof transactionSchema>;

export function AddTransactionForm({ initialValues, onSuccess }: AddTransactionFormProps) {
  const createMutation = useCreateTransaction();
  const today = new Date().toISOString().split("T")[0];

  const form = useForm<TransactionFormData>({
    resolver: zodResolver(transactionSchema),
    defaultValues: {
      amount: "" as unknown as number, // default as empty for placeholder
      category: "Food",
      merchant: "",
      description: "",
      transactionDate: today,
    },
    mode: "onTouched",
  });

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors, isSubmitting },
  } = form;

  // Sync incoming AI-parsed initial values to the form fields dynamically
  useEffect(() => {
    if (initialValues) {
      reset({
        amount: initialValues.amount ? parseFloat(initialValues.amount) : ("" as unknown as number),
        category: initialValues.category || "Food",
        merchant: initialValues.merchant || "",
        description: initialValues.description || "",
        transactionDate: initialValues.transactionDate || today,
      });
    } else {
      reset({
        amount: "" as unknown as number,
        category: "Food",
        merchant: "",
        description: "",
        transactionDate: today,
      });
    }
  }, [initialValues, reset, today]);

  const onSubmit = async (data: TransactionFormData) => {
    try {
      // Determine if it is academic category
      const isAcademic = data.category === "Academic" || data.category === "Education";

      await createMutation.mutateAsync({
        amount: data.amount,
        category: data.category,
        merchant: data.merchant || undefined,
        description: data.description || undefined,
        transaction_date: data.transactionDate,
        entry_method: initialValues ? "voice" : "manual", // mark as voice/nlp if populated via NLP parser
        is_academic: isAcademic,
      });

      toast.success("Transaction added successfully");
      reset({
        amount: "" as unknown as number,
        category: "Food",
        merchant: "",
        description: "",
        transactionDate: today,
      });
      onSuccess?.();
    } catch (error) {
      toast.error("Failed to add transaction. Please check your network connection.");
      console.error("Add transaction error:", error);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
      <div className="grid gap-4 sm:grid-cols-2">
        {/* Amount Field */}
        <div className="space-y-2">
          <Label htmlFor="amount" className="text-sm font-semibold text-foreground">
            Amount (₹) *
          </Label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm font-medium" aria-hidden="true">
              ₹
            </span>
            <Input
              id="amount"
              type="number"
              step="0.01"
              placeholder="0.00"
              className={`pl-8 pr-3 text-base ${errors.amount ? "border-destructive ring-destructive/20 focus-visible:ring-destructive" : ""}`}
              aria-required="true"
              aria-invalid={!!errors.amount}
              aria-describedby={errors.amount ? "amount-error" : undefined}
              {...register("amount", { valueAsNumber: true })}
            />
          </div>
          {errors.amount && (
            <p id="amount-error" className="text-xs text-destructive flex items-center gap-1.5 font-medium animate-in fade-in-50 duration-200">
              <AlertCircle className="h-3.5 w-3.5" aria-hidden="true" />
              {errors.amount.message}
            </p>
          )}
        </div>

        {/* Category Field */}
        <div className="space-y-2">
          <Label htmlFor="category" className="text-sm font-semibold text-foreground">
            Category *
          </Label>
          <Controller
            control={control}
            name="category"
            render={({ field }) => (
              <Select
                value={field.value}
                onValueChange={field.onChange}
              >
                <SelectTrigger
                  id="category"
                  className={errors.category ? "border-destructive focus:ring-destructive" : ""}
                  aria-required="true"
                  aria-invalid={!!errors.category}
                  aria-describedby={errors.category ? "category-error" : undefined}
                >
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {TRANSACTION_CATEGORIES.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
          {errors.category && (
            <p id="category-error" className="text-xs text-destructive flex items-center gap-1.5 font-medium animate-in fade-in-50 duration-200">
              <AlertCircle className="h-3.5 w-3.5" aria-hidden="true" />
              {errors.category.message}
            </p>
          )}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {/* Merchant Field */}
        <div className="space-y-2">
          <Label htmlFor="merchant" className="text-sm font-semibold text-foreground">
            Merchant
          </Label>
          <Input
            id="merchant"
            placeholder="e.g. Domino's"
            className={errors.merchant ? "border-destructive focus-visible:ring-destructive" : ""}
            aria-invalid={!!errors.merchant}
            aria-describedby={errors.merchant ? "merchant-error" : undefined}
            {...register("merchant")}
          />
          {errors.merchant && (
            <p id="merchant-error" className="text-xs text-destructive flex items-center gap-1.5 font-medium animate-in fade-in-50 duration-200">
              <AlertCircle className="h-3.5 w-3.5" aria-hidden="true" />
              {errors.merchant.message}
            </p>
          )}
        </div>

        {/* Date Field */}
        <div className="space-y-2">
          <Label htmlFor="date" className="text-sm font-semibold text-foreground">
            Date *
          </Label>
          <Input
            id="date"
            type="date"
            max={today}
            className={errors.transactionDate ? "border-destructive focus-visible:ring-destructive" : ""}
            aria-required="true"
            aria-invalid={!!errors.transactionDate}
            aria-describedby={errors.transactionDate ? "date-error" : undefined}
            {...register("transactionDate")}
          />
          {errors.transactionDate && (
            <p id="date-error" className="text-xs text-destructive flex items-center gap-1.5 font-medium animate-in fade-in-50 duration-200">
              <AlertCircle className="h-3.5 w-3.5" aria-hidden="true" />
              {errors.transactionDate.message}
            </p>
          )}
        </div>
      </div>

      {/* Description Field */}
      <div className="space-y-2">
        <Label htmlFor="description" className="text-sm font-semibold text-foreground">
          Description
        </Label>
        <Input
          id="description"
          placeholder="Optional notes or details"
          className={errors.description ? "border-destructive focus-visible:ring-destructive" : ""}
          aria-invalid={!!errors.description}
          aria-describedby={errors.description ? "description-error" : undefined}
          {...register("description")}
        />
        {errors.description && (
          <p id="description-error" className="text-xs text-destructive flex items-center gap-1.5 font-medium animate-in fade-in-50 duration-200">
            <AlertCircle className="h-3.5 w-3.5" aria-hidden="true" />
            {errors.description.message}
          </p>
        )}
      </div>

      {/* Submit Button */}
      <Button
        type="submit"
        className="w-full bg-[var(--stitch-primary)] hover:bg-[var(--stitch-primary)]/90 text-white font-semibold shadow-md transition-all rounded-xl h-12 active:scale-[0.97]"
        disabled={isSubmitting || createMutation.isPending}
      >
        {isSubmitting || createMutation.isPending ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
            <span>Adding transaction...</span>
          </>
        ) : (
          <span>Add transaction</span>
        )}
      </Button>
    </form>
  );
}
