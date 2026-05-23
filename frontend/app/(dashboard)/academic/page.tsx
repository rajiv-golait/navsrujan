"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import { GraduationCap } from "lucide-react";
import axios from "axios";

import {
  useAcademicExpenses,
  useUpcomingAcademicExpenses,
  useMissingAcademicSuggestions,
  useCreateAcademicExpense,
} from "@/lib/hooks/useAcademicExpenses";
import { useEducationContext } from "@/lib/hooks/useEducation";

const academicExpenseSchema = z.object({
  expense_name: z.string().min(1, "Expense name is required"),
  semester_number: z.coerce.number().min(1),
  amount: z.coerce.number().min(1, "Amount must be greater than 0"),
  due_date: z.string().optional(),
  payment_status: z.enum(["paid", "pending", "partial", "overdue"]),
  is_planned: z.boolean().default(true),
});

type AcademicExpenseFormValues = z.input<typeof academicExpenseSchema>;

function apiErrorMessage(error: unknown, fallback: string) {
  if (axios.isAxiosError(error)) {
    const detail = error.response?.data?.detail;
    if (typeof detail === "string") return detail;
    if (Array.isArray(detail)) return detail.map((d) => d.msg).join(", ");
  }
  return fallback;
}

export default function AcademicExpensesPage() {
  const { data: context, isLoading: contextLoading, isError: contextError } = useEducationContext();
  const currentSemester = context?.current_semester ?? 1;

  const {
    data: expenses,
    isLoading: expensesLoading,
    isError: expensesError,
    error: expensesErr,
  } = useAcademicExpenses(currentSemester);
  const { data: upcoming, isLoading: upcomingLoading, isError: upcomingError } =
    useUpcomingAcademicExpenses();
  const { data: missing, isLoading: missingLoading, isError: missingError } =
    useMissingAcademicSuggestions();
  const createExpense = useCreateAcademicExpense();

  const [activeTab, setActiveTab] = useState<"current" | "upcoming" | "missing">("current");

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<AcademicExpenseFormValues>({
    resolver: zodResolver(academicExpenseSchema),
    defaultValues: {
      semester_number: 1,
      payment_status: "pending",
      is_planned: true,
    },
  });

  useEffect(() => {
    if (context?.current_semester) {
      setValue("semester_number", context.current_semester);
    }
  }, [context?.current_semester, setValue]);

  const onSubmit = async (data: AcademicExpenseFormValues) => {
    try {
      const parsed = academicExpenseSchema.parse(data);
      const payload: Record<string, unknown> = { ...parsed };
      if (!payload.due_date) delete payload.due_date;
      await createExpense.mutateAsync(payload);
      toast.success("Academic expense added!");
      reset({
        expense_name: "",
        amount: undefined,
        due_date: "",
        semester_number: currentSemester,
        payment_status: "pending",
        is_planned: true,
      });
    } catch (error) {
      toast.error(apiErrorMessage(error, "Failed to add expense."));
    }
  };

  const errorDetail = axios.isAxiosError(expensesErr)
    ? String(expensesErr.response?.data?.detail ?? expensesErr.message).toLowerCase()
    : "";
  const tableMissing =
    expensesError &&
    (errorDetail.includes("academic_expenses") ||
      errorDetail.includes("does not exist") ||
      errorDetail.includes("could not find"));

  return (
    <div className="space-y-6">
      <header>
        <p className="text-label-caps text-[var(--stitch-on-surface-variant)]">Academic</p>
        <h1 className="text-headline-mobile text-[var(--stitch-on-surface)]">Academic expenses</h1>
        {context?.education_type && (
          <p className="text-sm text-[var(--stitch-on-surface-variant)] mt-1">
            {context.education_type} · Semester {currentSemester}
          </p>
        )}
      </header>

      {tableMissing && (
        <div className="rounded-xl border border-amber-500/40 bg-amber-500/10 p-4 text-sm text-amber-200">
          Database table missing: run{" "}
          <code className="text-xs">supabase/migrations/add_academic_expenses.sql</code> in the
          Supabase SQL editor, then refresh.
        </div>
      )}

      {contextError && (
        <div className="rounded-xl border border-[var(--stitch-outline)] bg-[var(--surface-1)] p-4 text-sm">
          Complete your education profile in{" "}
          <a href="/onboarding/education" className="text-[var(--vault-accent)] underline">
            onboarding
          </a>{" "}
          to unlock semester templates and suggestions.
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1.4fr)_minmax(18rem,1fr)]">
        <div className="space-y-4 min-w-0">
          <div className="flex gap-4 border-b border-[var(--stitch-outline)]">
            <button
              type="button"
              onClick={() => setActiveTab("current")}
              className={`pb-2 px-1 font-medium ${activeTab === "current" ? "border-b-2 border-[var(--stitch-primary)] text-[var(--stitch-primary)]" : "text-[var(--stitch-on-surface-variant)]"}`}
            >
              Semester {currentSemester}
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("upcoming")}
              className={`pb-2 px-1 font-medium ${activeTab === "upcoming" ? "border-b-2 border-[var(--stitch-primary)] text-[var(--stitch-primary)]" : "text-[var(--stitch-on-surface-variant)]"}`}
            >
              Upcoming Dues
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("missing")}
              className={`pb-2 px-1 font-medium ${activeTab === "missing" ? "border-b-2 border-[var(--stitch-primary)] text-[var(--stitch-primary)]" : "text-[var(--stitch-on-surface-variant)]"}`}
            >
              Missing Suggestions
            </button>
          </div>

          <div className="vault-card p-4 sm:p-6 min-h-[12rem]">
            {activeTab === "current" && (
              <ExpenseList
                loading={expensesLoading || contextLoading}
                error={expensesError}
                items={expenses}
                emptyMessage={`No expenses logged for semester ${currentSemester} yet.`}
              />
            )}

            {activeTab === "upcoming" && (
              <ExpenseList
                loading={upcomingLoading}
                error={upcomingError}
                items={upcoming}
                emptyMessage="No upcoming dues in the next 30 days. Add a due date when creating an expense."
                showDueHighlight
              />
            )}

            {activeTab === "missing" && (
              <div className="space-y-3">
                {missingLoading ? (
                  <p className="text-sm text-[var(--stitch-on-surface-variant)]">Loading suggestions…</p>
                ) : missingError ? (
                  <p className="text-sm text-red-400">Could not load suggestions.</p>
                ) : !missing?.length ? (
                  <p className="text-sm text-[var(--stitch-on-surface-variant)]">
                    You&apos;re all caught up with expected expenses for this semester.
                  </p>
                ) : (
                  missing.map((sug: { expense_name: string; typical_amount_avg: number; notes?: string; is_mandatory?: boolean }, idx: number) => (
                    <div
                      key={`${sug.expense_name}-${idx}`}
                      className="p-4 bg-[var(--stitch-surface)] rounded-xl border border-[var(--stitch-outline)]"
                    >
                      <div className="flex justify-between items-start mb-2 gap-2">
                        <p className="font-semibold">{sug.expense_name}</p>
                        <span className="text-xs font-medium text-[var(--stitch-primary)] shrink-0">
                          ~₹{sug.typical_amount_avg.toLocaleString("en-IN")}
                        </span>
                      </div>
                      {sug.notes && (
                        <p className="text-sm text-[var(--stitch-on-surface-variant)]">{sug.notes}</p>
                      )}
                      {sug.is_mandatory && (
                        <span className="text-[10px] bg-red-500/15 text-red-300 px-2 py-0.5 rounded-full mt-2 inline-block">
                          Mandatory
                        </span>
                      )}
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>

        <div className="min-w-0">
          <div className="vault-card p-4 sm:p-6 xl:sticky xl:top-6">
            <h3 className="font-bold mb-1">Add Academic Expense</h3>
            <p className="text-xs text-[var(--stitch-on-surface-variant)] mb-4">
              Defaults to semester {currentSemester}
            </p>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <label className="text-xs font-medium">Expense Name</label>
                <input
                  {...register("expense_name")}
                  className="w-full p-2 rounded-lg border border-[var(--stitch-outline)] bg-[var(--stitch-surface)] text-sm mt-1"
                  placeholder="e.g. Tuition Fee"
                />
                {errors.expense_name && (
                  <p className="text-xs text-red-500 mt-1">{errors.expense_name.message}</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium">Amount (₹)</label>
                  <input
                    {...register("amount")}
                    type="number"
                    min={1}
                    className="w-full p-2 rounded-lg border border-[var(--stitch-outline)] bg-[var(--stitch-surface)] text-sm mt-1"
                  />
                  {errors.amount && (
                    <p className="text-xs text-red-500 mt-1">{errors.amount.message}</p>
                  )}
                </div>
                <div>
                  <label className="text-xs font-medium">Semester</label>
                  <input
                    {...register("semester_number")}
                    type="number"
                    min={1}
                    className="w-full p-2 rounded-lg border border-[var(--stitch-outline)] bg-[var(--stitch-surface)] text-sm mt-1"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-medium">Due Date</label>
                <input
                  {...register("due_date")}
                  type="date"
                  className="w-full p-2 rounded-lg border border-[var(--stitch-outline)] bg-[var(--stitch-surface)] text-sm mt-1"
                />
              </div>

              <div>
                <label className="text-xs font-medium">Status</label>
                <select
                  {...register("payment_status")}
                  className="w-full p-2 rounded-lg border border-[var(--stitch-outline)] bg-[var(--stitch-surface)] text-sm mt-1"
                >
                  <option value="pending">Pending</option>
                  <option value="paid">Paid</option>
                  <option value="partial">Partial</option>
                  <option value="overdue">Overdue</option>
                </select>
              </div>

              <button
                type="submit"
                disabled={isSubmitting || createExpense.isPending}
                className="w-full py-2.5 bg-[var(--stitch-primary)] text-white rounded-lg font-semibold text-sm hover:opacity-90 disabled:opacity-50"
              >
                {isSubmitting || createExpense.isPending ? "Adding…" : "Add Expense"}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

function ExpenseList({
  loading,
  error,
  items,
  emptyMessage,
  showDueHighlight,
}: {
  loading: boolean;
  error: boolean;
  items?: Array<{
    id: string;
    expense_name: string;
    amount: number;
    due_date?: string | null;
    payment_status: string;
  }>;
  emptyMessage: string;
  showDueHighlight?: boolean;
}) {
  if (loading) {
    return <p className="text-sm text-[var(--stitch-on-surface-variant)]">Loading…</p>;
  }
  if (error) {
    return (
      <p className="text-sm text-red-400">
        Could not load expenses. Check that the database migration has been applied.
      </p>
    );
  }
  if (!items?.length) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center">
        <GraduationCap className="h-10 w-10 text-[var(--stitch-on-surface-variant)]/50 mb-3" />
        <p className="text-sm text-[var(--stitch-on-surface-variant)] max-w-sm">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {items.map((exp) => (
        <div
          key={exp.id}
          className="flex justify-between items-center gap-4 p-4 bg-[var(--stitch-surface)] rounded-xl border border-[var(--stitch-outline)]"
        >
          <div className="min-w-0">
            <p className="font-semibold truncate">{exp.expense_name}</p>
            <p
              className={`text-sm ${showDueHighlight ? "text-red-400 font-medium" : "text-[var(--stitch-on-surface-variant)]"}`}
            >
              Due: {exp.due_date || "Not set"}
            </p>
          </div>
          <div className="text-right shrink-0">
            <p className="font-bold">₹{Number(exp.amount).toLocaleString("en-IN")}</p>
            <span
              className={`text-[10px] uppercase px-2 py-1 rounded-full ${
                exp.payment_status === "paid"
                  ? "bg-emerald-500/15 text-emerald-300"
                  : "bg-amber-500/15 text-amber-200"
              }`}
            >
              {exp.payment_status}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}
