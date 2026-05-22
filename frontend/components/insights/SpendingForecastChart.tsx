"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

interface SpendingForecastChartProps {
  forecast: {
    next_7_days: {
      by_category: Record<string, any>;
      total_predicted: number;
    };
    next_30_days: {
      by_category: Record<string, any>;
      total_predicted: number;
    };
  };
}

export function SpendingForecastChart({ forecast }: SpendingForecastChartProps) {
  if (!forecast || !forecast.next_30_days) {
    return null;
  }

  const { by_category } = forecast.next_30_days;
  
  // Transform data for chart
  const categories = Object.keys(by_category).filter(cat => by_category[cat].predicted_total > 0);
  const chartData = categories.map(category => ({
    category,
    predicted: by_category[category].predicted_total || 0,
    daily_avg: by_category[category].daily_average || 0,
  })).sort((a, b) => b.predicted - a.predicted);

  return (
    <div className="vault-card p-4 sm:p-6">
      <h2 className="text-base sm:text-lg font-bold mb-4">📊 30-Day Spending Forecast</h2>
      
      <div className="mb-4 p-3 rounded-xl bg-[var(--stitch-surface)] border border-[var(--stitch-outline)]">
        <div className="flex items-center justify-between">
          <span className="text-sm text-[var(--stitch-on-surface-variant)]">
            Total Predicted (Next 30 Days)
          </span>
          <span className="text-xl font-bold text-[var(--stitch-primary)]">
            ₹{forecast.next_30_days.total_predicted.toLocaleString("en-IN")}
          </span>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={300}>
        <AreaChart data={chartData}>
          <defs>
            <linearGradient id="colorPredicted" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.35} />
              <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="2 6" stroke="var(--stitch-outline-variant)" vertical={false} />
          <XAxis
            dataKey="category"
            tick={{ fill: "var(--stitch-on-surface-variant)", fontSize: 12 }}
            axisLine={{ stroke: "var(--stitch-outline-variant)" }}
            tickLine={false}
          />
          <YAxis
            tick={{ fill: "var(--stitch-on-surface-variant)", fontSize: 12 }}
            tickFormatter={(value) => `₹${(value / 1000).toFixed(1)}k`}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            content={({ active, payload }) => {
              if (active && payload && payload[0]) {
                const data = payload[0].payload;
                return (
                  <div className="vault-card p-3 border border-[var(--stitch-outline)]">
                    <p className="font-semibold text-sm mb-2">{data.category}</p>
                    <p className="text-xs text-[var(--stitch-on-surface-variant)]">
                      Predicted: ₹{data.predicted.toLocaleString("en-IN")}
                    </p>
                    <p className="text-xs text-[var(--stitch-on-surface-variant)]">
                      Daily Avg: ₹{data.daily_avg.toLocaleString("en-IN")}
                    </p>
                  </div>
                );
              }
              return null;
            }}
          />
          <Area
            type="monotoneX"
            dataKey="predicted"
            stroke="#8B5CF6"
            strokeWidth={2.5}
            fill="url(#colorPredicted)"
          />
        </AreaChart>
      </ResponsiveContainer>

      <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-2">
        {chartData.slice(0, 6).map((item) => (
          <div
            key={item.category}
            className="p-2 rounded-lg bg-[var(--stitch-surface)] border border-[var(--stitch-outline)]"
          >
            <p className="text-xs text-[var(--stitch-on-surface-variant)] mb-1">
              {item.category}
            </p>
            <p className="text-sm font-bold">₹{item.predicted.toLocaleString("en-IN")}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
