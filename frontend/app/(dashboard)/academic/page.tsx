"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";

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

export default function AcademicExpensesPage() {
  const { data: context } = useEducationContext();
  const currentSemester = context?.current_semester ?? 1;

  const { data: expenses, isLoading: expensesLoading } = useAcademicExpenses(currentSemester);
  const { data: upcoming } = useUpcomingAcademicExpenses();
  const { data: missing } = useMissingAcademicSuggestions();
  const createExpense = useCreateAcademicExpense();

  const [activeTab, setActiveTab] = useState<"current" | "upcoming" | "missing">("current");

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<AcademicExpenseFormValues>({
    resolver: zodResolver(academicExpenseSchema),
    defaultValues: {
      semester_number: currentSemester,
      payment_status: "pending",
      is_planned: true,
    },
  });

  const onSubmit = async (data: AcademicExpenseFormValues) => {
    try {
      const parsed = academicExpenseSchema.parse(data);
      await createExpense.mutateAsync(parsed);
      toast.success("Academic expense added!");
      reset();
    } catch (error) {
      toast.error("Failed to add expense.");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-[var(--stitch-on-surface)]">Academic Expenses</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="flex gap-4 border-b border-[var(--stitch-outline)]">
            <button
              onClick={() => setActiveTab("current")}
              className={`pb-2 px-1 font-medium ${activeTab === "current" ? "border-b-2 border-[var(--stitch-primary)] text-[var(--stitch-primary)]" : "text-[var(--stitch-on-surface-variant)]"}`}
            >
              Semester {currentSemester}
            </button>
            <button
              onClick={() => setActiveTab("upcoming")}
              className={`pb-2 px-1 font-medium ${activeTab === "upcoming" ? "border-b-2 border-[var(--stitch-primary)] text-[var(--stitch-primary)]" : "text-[var(--stitch-on-surface-variant)]"}`}
            >
              Upcoming Dues
            </button>
            <button
              onClick={() => setActiveTab("missing")}
              className={`pb-2 px-1 font-medium ${activeTab === "missing" ? "border-b-2 border-[var(--stitch-primary)] text-[var(--stitch-primary)]" : "text-[var(--stitch-on-surface-variant)]"}`}
            >
              Missing Suggestions
            </button>
          </div>

          <div className="bg-[var(--stitch-surface-container-low)] p-6 rounded-2xl">
            {activeTab === "current" && (
              <div className="space-y-4">
                {expensesLoading ? (
                  <p>Loading...</p>
                ) : expenses?.length === 0 ? (
                  <p className="text-[var(--stitch-on-surface-variant)]">No academic expenses logged for this semester.</p>
                ) : (
                  expenses?.map((exp: any) => (
                    <div key={exp.id} className="flex justify-between items-center p-4 bg-[var(--stitch-surface)] rounded-xl border border-[var(--stitch-outline)]">
                      <div>
                        <p className="font-semibold">{exp.expense_name}</p>
                        <p className="text-sm text-[var(--stitch-on-surface-variant)]">Due: {exp.due_date || "N/A"}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold">₹{exp.amount.toLocaleString("en-IN")}</p>
                        <span className={`text-[10px] uppercase px-2 py-1 rounded-full ${exp.payment_status === "paid" ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"}`}>
                          {exp.payment_status}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {activeTab === "upcoming" && (
              <div className="space-y-4">
                {upcoming?.length === 0 ? (
                  <p className="text-[var(--stitch-on-surface-variant)]">No upcoming dues in the next 30 days.</p>
                ) : (
                  upcoming?.map((exp: any) => (
                    <div key={exp.id} className="flex justify-between items-center p-4 bg-[var(--stitch-surface)] rounded-xl border border-[var(--stitch-outline)]">
                      <div>
                        <p className="font-semibold">{exp.expense_name}</p>
                        <p className="text-sm text-red-500 font-medium">Due: {exp.due_date}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold">₹{exp.amount.toLocaleString("en-IN")}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {activeTab === "missing" && (
              <div className="space-y-4">
                {missing?.length === 0 ? (
                  <p className="text-[var(--stitch-on-surface-variant)]">You're all caught up with expected expenses!</p>
                ) : (
                  missing?.map((sug: any, idx: number) => (
                    <div key={idx} className="p-4 bg-[var(--stitch-surface)] rounded-xl border border-[var(--stitch-outline)]">
                      <div className="flex justify-between items-start mb-2">
                        <p className="font-semibold">{sug.expense_name}</p>
                        <span className="text-xs font-medium text-[var(--stitch-primary)]">~₹{sug.typical_amount_avg.toLocaleString("en-IN")}</span>
                      </div>
                      <p className="text-sm text-[var(--stitch-on-surface-variant)]">{sug.notes}</p>
                      {sug.is_mandatory && <span className="text-[10px] bg-red-100 text-red-800 px-2 py-0.5 rounded-full mt-2 inline-block">Mandatory</span>}
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>

        <div className="lg:col-span-1">
          <div className="bg-[var(--stitch-surface-container-low)] p-6 rounded-2xl sticky top-6">
            <h3 className="font-bold mb-4">Add Academic Expense</h3>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <label className="text-xs font-medium">Expense Name</label>
                <input {...register("expense_name")} className="w-full p-2 rounded-lg border border-[var(--stitch-outline)] bg-[var(--stitch-surface)] text-sm" placeholder="e.g. Tuition Fee" />
                {errors.expense_name && <p className="text-xs text-red-500 mt-1">{errors.expense_name.message}</p>}
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium">Amount (₹)</label>
                  <input {...register("amount")} type="number" className="w-full p-2 rounded-lg border border-[var(--stitch-outline)] bg-[var(--stitch-surface)] text-sm" />
                  {errors.amount && <p className="text-xs text-red-500 mt-1">{errors.amount.message}</p>}
                </div>
                <div>
                  <label className="text-xs font-medium">Semester</label>
                  <input {...register("semester_number")} type="number" className="w-full p-2 rounded-lg border border-[var(--stitch-outline)] bg-[var(--stitch-surface)] text-sm" />
                </div>
              </div>

              <div>
                <label className="text-xs font-medium">Due Date</label>
                <input {...register("due_date")} type="date" className="w-full p-2 rounded-lg border border-[var(--stitch-outline)] bg-[var(--stitch-surface)] text-sm" />
              </div>

              <div>
                <label className="text-xs font-medium">Status</label>
                <select {...register("payment_status")} className="w-full p-2 rounded-lg border border-[var(--stitch-outline)] bg-[var(--stitch-surface)] text-sm">
                  <option value="pending">Pending</option>
                  <option value="paid">Paid</option>
                  <option value="partial">Partial</option>
                  <option value="overdue">Overdue</option>
                </select>
              </div>

              <button type="submit" disabled={isSubmitting} className="w-full py-2 bg-[var(--stitch-primary)] text-white rounded-lg font-semibold text-sm hover:shadow-md disabled:opacity-50">
                {isSubmitting ? "Adding..." : "Add Expense"}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
