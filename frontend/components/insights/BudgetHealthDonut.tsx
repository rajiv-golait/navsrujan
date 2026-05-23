"use client";

import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";
import { Check, AlertCircle, XCircle } from "lucide-react";

interface BudgetHealthDonutProps {
  budgetHealth: {
    needs_percent: number;
    wants_percent: number;
    savings_percent: number;
    needs_amount: number;
    wants_amount: number;
    savings_amount: number;
    total_spent: number;
    monthly_income: number;
    is_overspent?: boolean;
    overspend_amount?: number;
    recommended_reallocation?: {
      cut_from: string;
      cut_amount: number;
      redirect_to: string;
      reason: string;
    } | null;
    status: string;
  };
}

function formatPercent(value: number) {
  if (!Number.isFinite(value)) return "0.0";
  return `${Math.min(999, Math.max(0, value)).toFixed(1)}`;
}

export function BudgetHealthDonut({ budgetHealth }: BudgetHealthDonutProps) {
  const {
    needs_percent,
    wants_percent,
    savings_percent,
    recommended_reallocation,
    is_overspent,
    overspend_amount,
    monthly_income,
  } = budgetHealth;

  const savingsLabel = is_overspent ? "Overspent" : "Savings";
  const savingsDisplayPercent = is_overspent ? 0 : savings_percent;
  const savingsDisplayAmount = is_overspent
    ? (overspend_amount ?? Math.max(0, budgetHealth.total_spent - monthly_income))
    : budgetHealth.savings_amount;

  const data = [
    { name: "Needs", value: Math.max(0, Math.min(needs_percent, 100)), target: 50, amount: budgetHealth.needs_amount, actualPercent: needs_percent },
    { name: "Wants", value: Math.max(0, Math.min(wants_percent, 100)), target: 30, amount: budgetHealth.wants_amount, actualPercent: wants_percent },
    {
      name: savingsLabel,
      value: Math.max(0, savingsDisplayPercent),
      target: 20,
      amount: savingsDisplayAmount,
      actualPercent: savingsDisplayPercent,
      isOverspend: Boolean(is_overspent),
    },
  ];

  const COLORS = ["#3B82F6", "#8B5CF6", is_overspent ? "#EF4444" : "#10B981"];

  const getStatusIcon = (value: number, target: number, name: string, isOverspend?: boolean) => {
    if (isOverspend || name === "Overspent") {
      return <XCircle className="w-4 h-4 text-red-500" />;
    }
    const diff = Math.abs(value - target);
    if (name === "Savings") {
      if (value >= target) return <Check className="w-4 h-4 text-emerald-500" />;
      if (value >= target * 0.7) return <AlertCircle className="w-4 h-4 text-amber-500" />;
      return <XCircle className="w-4 h-4 text-red-500" />;
    }
    if (diff <= 10) return <Check className="w-4 h-4 text-emerald-500" />;
    if (diff <= 20) return <AlertCircle className="w-4 h-4 text-amber-500" />;
    return <XCircle className="w-4 h-4 text-red-500" />;
  };

  return (
    <div className="vault-card p-4 sm:p-6">
      <h2 className="text-base sm:text-lg font-bold mb-4">Budget Health (50/30/20)</h2>
      <div className="grid grid-cols-1 gap-4 sm:gap-6 xl:grid-cols-[minmax(12rem,1fr)_minmax(16rem,1.2fr)]">
        <div className="flex min-w-0 items-center justify-center overflow-hidden">
          <ResponsiveContainer width="100%" height={240} minWidth={0}>
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={90}
                paddingAngle={2}
                dataKey="value"
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index]} />
                ))}
              </Pie>
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload[0]) {
                    const data = payload[0].payload;
                    return (
                      <div className="vault-card p-3 border border-[var(--stitch-outline)]">
                        <p className="font-semibold text-sm">{data.name}</p>
                        <p className="text-xs text-[var(--stitch-on-surface-variant)]">
                          Current: {data.actualPercent.toFixed(1)}%
                        </p>
                        <p className="text-xs text-[var(--stitch-on-surface-variant)]">
                          Target: {data.target}%
                        </p>
                        <p className="text-xs font-semibold mt-1">
                          ₹{data.amount.toLocaleString("en-IN")}
                        </p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="space-y-3">
          {data.map((item, index) => (
            <div
              key={item.name}
              className="p-3 rounded-xl bg-[var(--stitch-surface)] border border-[var(--stitch-outline)]"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: COLORS[index] }}
                  />
                  <span className="font-semibold text-sm">{item.name}</span>
                  {getStatusIcon(item.value, item.target, item.name, "isOverspend" in item && item.isOverspend)}
                </div>
                <span className="text-sm font-bold">
                  {"isOverspend" in item && item.isOverspend
                    ? `₹${item.amount.toLocaleString("en-IN")} over`
                    : `${formatPercent(item.actualPercent)}%`}
                </span>
              </div>
              <div className="flex justify-between text-xs text-[var(--stitch-on-surface-variant)]">
                <span>
                  {"isOverspend" in item && item.isOverspend
                    ? `Budget: ₹${monthly_income.toLocaleString("en-IN")}`
                    : `Target: ${item.target}%`}
                </span>
                <span>₹{item.amount.toLocaleString("en-IN")}</span>
              </div>
            </div>
          ))}

          {recommended_reallocation && (
            <div className="mt-4 p-4 rounded-xl bg-amber-500/10 border border-amber-500/30">
              <h4 className="font-semibold text-sm mb-2 text-amber-600 dark:text-amber-400">
                💡 Optimization Tip
              </h4>
              <p className="text-sm text-[var(--stitch-on-surface)] mb-2">
                {recommended_reallocation.reason}
              </p>
              <p className="text-xs text-[var(--stitch-on-surface-variant)]">
                Cut ₹{recommended_reallocation.cut_amount.toLocaleString("en-IN")} from{" "}
                {recommended_reallocation.cut_from} → redirect to {recommended_reallocation.redirect_to}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
