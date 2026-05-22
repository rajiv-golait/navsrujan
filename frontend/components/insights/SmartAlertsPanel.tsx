"use client";

import { AlertCircle, TrendingUp, Lightbulb, X } from "lucide-react";
import { useState } from "react";

interface SmartAlert {
  type: string;
  severity: "low" | "medium" | "high" | "critical";
  message: string;
  reason?: string;
  suggestion?: string;
  amount?: number;
  category?: string;
  merchant?: string;
  transaction_date?: string;
  multiplier?: number;
}

interface SmartAlertsPanelProps {
  alerts: SmartAlert[];
  anomalies?: Array<{
    amount: number;
    category: string;
    merchant: string;
    transaction_date: string;
    severity: string;
    reason: string;
    suggestion: string;
    multiplier: number;
  }>;
}

export function SmartAlertsPanel({ alerts, anomalies }: SmartAlertsPanelProps) {
  const [dismissedIndices, setDismissedIndices] = useState<Set<number>>(new Set());

  const allAlerts = [
    ...(alerts || []),
    ...(anomalies || []).map((a) => ({
      type: "unusual_pattern",
      severity: a.severity as any,
      message: `₹${a.amount.toLocaleString("en-IN")} ${a.merchant || a.category}`,
      reason: a.reason,
      suggestion: a.suggestion,
      amount: a.amount,
      category: a.category,
      merchant: a.merchant,
      transaction_date: a.transaction_date,
      multiplier: a.multiplier,
    })),
  ];

  const visibleAlerts = allAlerts.filter((_, index) => !dismissedIndices.has(index));

  const dismiss = (index: number) => {
    setDismissedIndices((prev) => new Set(prev).add(index));
  };

  if (visibleAlerts.length === 0) {
    return (
      <div className="vault-card p-4 sm:p-6">
        <h2 className="text-base sm:text-lg font-bold mb-4">🔍 Smart Alerts</h2>
        <p className="text-sm text-[var(--stitch-on-surface-variant)]">
          No unusual patterns detected. Looking good!
        </p>
      </div>
    );
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "critical":
      case "high":
        return "red";
      case "medium":
        return "amber";
      default:
        return "blue";
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case "survival_risk":
        return AlertCircle;
      case "overspend_prediction":
        return TrendingUp;
      case "unusual_pattern":
        return AlertCircle;
      default:
        return Lightbulb;
    }
  };

  return (
    <div className="vault-card p-4 sm:p-6">
      <h2 className="text-base sm:text-lg font-bold mb-4">🔍 Smart Alerts</h2>
      <div className="space-y-3">
        {visibleAlerts.map((alert, index) => {
          const Icon = getIcon(alert.type);
          const color = getSeverityColor(alert.severity);

          return (
            <div
              key={index}
              className={`p-4 rounded-xl border-2 ${
                color === "red"
                  ? "border-red-500/30 bg-red-500/5"
                  : color === "amber"
                    ? "border-amber-500/30 bg-amber-500/5"
                    : "border-blue-500/30 bg-blue-500/5"
              }`}
            >
              <div className="flex items-start gap-3">
                <div
                  className={`p-2 rounded-lg flex-shrink-0 ${
                    color === "red"
                      ? "bg-red-500/20"
                      : color === "amber"
                        ? "bg-amber-500/20"
                        : "bg-blue-500/20"
                  }`}
                >
                  <Icon
                    className={`w-4 h-4 ${
                      color === "red"
                        ? "text-red-500"
                        : color === "amber"
                          ? "text-amber-500"
                          : "text-blue-500"
                    }`}
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <p className="text-sm font-semibold">{alert.message}</p>
                    <button
                      onClick={() => dismiss(index)}
                      className="flex-shrink-0 p-1 hover:bg-[var(--stitch-surface)] rounded transition-colors"
                      aria-label="Dismiss alert"
                    >
                      <X className="w-4 h-4 text-[var(--stitch-on-surface-variant)]" />
                    </button>
                  </div>

                  {alert.reason && (
                    <p className="text-xs text-[var(--stitch-on-surface-variant)] mb-2">
                      {alert.reason}
                    </p>
                  )}

                  {alert.transaction_date && (
                    <p className="text-xs text-[var(--stitch-on-surface-variant)] mb-2">
                      {new Date(alert.transaction_date).toLocaleDateString("en-IN", {
                        month: "short",
                        day: "numeric",
                      })}
                      {alert.merchant && ` • ${alert.merchant}`}
                    </p>
                  )}

                  {alert.suggestion && (
                    <div
                      className={`mt-3 p-3 rounded-lg ${
                        color === "red"
                          ? "bg-red-500/10"
                          : color === "amber"
                            ? "bg-amber-500/10"
                            : "bg-blue-500/10"
                      }`}
                    >
                      <p className="text-xs font-medium mb-1 flex items-center gap-1">
                        <Lightbulb className="w-3 h-3" />
                        Tip:
                      </p>
                      <p className="text-xs">{alert.suggestion}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
