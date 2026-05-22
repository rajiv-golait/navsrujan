"use client";

import { memo } from "react";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { TrendingUp } from "lucide-react";

import { formatCurrency } from "@/lib/utils";
import type { ExpenseForecast } from "@/types/analytics";

interface ForecastCardProps {
  forecast?: ExpenseForecast;
  monthlyBudget?: number | null;
}

export const ForecastCard = memo(function ForecastCard({
  forecast,
  monthlyBudget,
}: ForecastCardProps) {
  const days = forecast?.days ?? [];
  const projected = forecast?.projected_monthly_spend ?? 0;
  const isOverBudget = Boolean(monthlyBudget && projected > monthlyBudget);

  return (
    <div className="stitch-card p-6">
      <div className="mb-5 flex items-start justify-between gap-3">
        <div>
          <p className="text-label-caps text-[var(--stitch-on-surface-variant)]">
            AI Expense Forecast
          </p>
          <h3 className="mt-1 text-2xl font-bold text-[var(--stitch-on-surface)]">
            {formatCurrency(forecast?.next_7_days_total ?? 0)}
          </h3>
          <p className="mt-1 text-sm text-[var(--stitch-on-surface-variant)]">
            predicted for the next 7 days
          </p>
        </div>
        <div
          className={`flex h-10 w-10 items-center justify-center rounded-xl ${
            isOverBudget
              ? "bg-[var(--stitch-error)]/10 text-[var(--stitch-error)]"
              : "bg-[var(--stitch-primary)]/10 text-[var(--stitch-primary)]"
          }`}
        >
          <TrendingUp className="h-5 w-5" />
        </div>
      </div>

      <div className="h-48">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={days} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
            <defs>
              <linearGradient id="forecastFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--stitch-primary)" stopOpacity={0.28} />
                <stop offset="95%" stopColor="var(--stitch-primary)" stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--stitch-outline-variant)" opacity={0.5} />
            <XAxis dataKey="label" tickLine={false} axisLine={false} fontSize={12} />
            <YAxis tickLine={false} axisLine={false} fontSize={12} tickFormatter={(value) => `${Number(value) / 1000}k`} />
            <Tooltip
              formatter={(value) => [formatCurrency(Number(value)), "Predicted"]}
              contentStyle={{
                borderRadius: 12,
                border: "1px solid var(--stitch-outline-variant)",
                boxShadow: "0 8px 24px rgba(0,0,0,0.08)",
              }}
            />
            <Area
              type="monotone"
              dataKey="predicted"
              stroke="var(--stitch-primary)"
              strokeWidth={3}
              fill="url(#forecastFill)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3">
        <div className="rounded-xl bg-[var(--stitch-surface-container-low)] p-3">
          <p className="text-label-caps text-[var(--stitch-on-surface-variant)]">
            Month End
          </p>
          <p className="mt-1 text-stat-sm text-[var(--stitch-on-surface)]">
            {formatCurrency(projected)}
          </p>
        </div>
        <div className="rounded-xl bg-[var(--stitch-surface-container-low)] p-3">
          <p className="text-label-caps text-[var(--stitch-on-surface-variant)]">
            Confidence
          </p>
          <p className="mt-1 text-stat-sm capitalize text-[var(--stitch-on-surface)]">
            {forecast?.confidence ?? "low"}
          </p>
        </div>
      </div>
    </div>
  );
});

ForecastCard.displayName = "ForecastCard";
