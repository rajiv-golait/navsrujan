"use client";

import { Users, TrendingUp, TrendingDown } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";

interface PeerComparisonCardProps {
  comparison: {
    your_monthly_spend: number;
    peer_average_spend: number;
    difference: number;
    percent_difference: number;
    percentile: number;
    categories_above_peer: string[];
    categories_below_peer: string[];
    by_category: Record<string, any>;
    comparison_message: string;
  };
}

export function PeerComparisonCard({ comparison }: PeerComparisonCardProps) {
  if (!comparison) {
    return null;
  }

  const {
    your_monthly_spend,
    peer_average_spend,
    difference,
    percentile,
    categories_above_peer,
    categories_below_peer,
    comparison_message,
    by_category,
  } = comparison;

  // Transform data for chart (top 5 categories)
  const chartData = Object.entries(by_category)
    .filter(([_, data]: [string, any]) => data.your_spend > 0 || data.peer_average > 0)
    .map(([category, data]: [string, any]) => ({
      category,
      you: data.your_spend,
      peer: data.peer_average,
    }))
    .sort((a, b) => b.you - a.you)
    .slice(0, 5);

  return (
    <div className="vault-card p-4 sm:p-6">
      <div className="flex items-center gap-2 mb-4">
        <Users className="w-5 h-5 text-[var(--stitch-primary)]" />
        <h2 className="text-base sm:text-lg font-bold">Peer Comparison</h2>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        <div className="p-4 rounded-xl bg-[var(--stitch-surface)] border border-[var(--stitch-outline)]">
          <p className="text-xs text-[var(--stitch-on-surface-variant)] mb-2">Your Monthly Spend</p>
          <p className="text-2xl font-bold text-[var(--stitch-primary)]">
            ₹{your_monthly_spend.toLocaleString("en-IN")}
          </p>
          <p className="text-xs text-[var(--stitch-on-surface-variant)] mt-1">
            {percentile}th percentile
          </p>
        </div>

        <div className="p-4 rounded-xl bg-[var(--stitch-surface)] border border-[var(--stitch-outline)]">
          <p className="text-xs text-[var(--stitch-on-surface-variant)] mb-2">Peer Average</p>
          <p className="text-2xl font-bold text-[var(--stitch-on-surface)]">
            ₹{peer_average_spend.toLocaleString("en-IN")}
          </p>
          <div className="flex items-center gap-1 mt-1">
            {difference > 0 ? (
              <>
                <TrendingUp className="w-3 h-3 text-red-500" />
                <p className="text-xs text-red-500">₹{Math.abs(difference).toLocaleString("en-IN")} more</p>
              </>
            ) : (
              <>
                <TrendingDown className="w-3 h-3 text-emerald-500" />
                <p className="text-xs text-emerald-500">₹{Math.abs(difference).toLocaleString("en-IN")} less</p>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="mb-4 p-3 rounded-xl bg-[var(--stitch-surface)] border border-[var(--stitch-outline)]">
        <p className="text-sm">{comparison_message}</p>
      </div>

      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--stitch-outline)" />
          <XAxis
            dataKey="category"
            tick={{ fill: "var(--stitch-on-surface-variant)", fontSize: 11 }}
          />
          <YAxis
            tick={{ fill: "var(--stitch-on-surface-variant)", fontSize: 11 }}
            tickFormatter={(value) => `₹${(value / 1000).toFixed(1)}k`}
          />
          <Tooltip
            content={({ active, payload }) => {
              if (active && payload && payload[0]) {
                return (
                  <div className="vault-card p-3 border border-[var(--stitch-outline)]">
                    <p className="font-semibold text-sm mb-2">{payload[0].payload.category}</p>
                    <p className="text-xs text-[var(--stitch-primary)]">
                      You: ₹{payload[0].value?.toLocaleString("en-IN")}
                    </p>
                    <p className="text-xs text-[var(--stitch-on-surface-variant)]">
                      Peer: ₹{payload[1]?.value?.toLocaleString("en-IN")}
                    </p>
                  </div>
                );
              }
              return null;
            }}
          />
          <Bar dataKey="you" fill="#4F46E5" name="You" radius={[4, 4, 0, 0]} />
          <Bar dataKey="peer" fill="#6B7280" name="Peer Avg" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>

      {(categories_above_peer.length > 0 || categories_below_peer.length > 0) && (
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
          {categories_above_peer.length > 0 && (
            <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30">
              <p className="text-xs font-semibold text-red-600 dark:text-red-400 mb-2">
                Above Peer Average
              </p>
              <div className="flex flex-wrap gap-1">
                {categories_above_peer.map((cat) => (
                  <span
                    key={cat}
                    className="px-2 py-0.5 text-xs rounded-full bg-red-500/20 text-red-600 dark:text-red-400"
                  >
                    {cat}
                  </span>
                ))}
              </div>
            </div>
          )}

          {categories_below_peer.length > 0 && (
            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30">
              <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 mb-2">
                Below Peer Average
              </p>
              <div className="flex flex-wrap gap-1">
                {categories_below_peer.map((cat) => (
                  <span
                    key={cat}
                    className="px-2 py-0.5 text-xs rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400"
                  >
                    {cat}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
