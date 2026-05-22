"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp, Lightbulb } from "lucide-react";

interface SavingsOpportunity {
  category: string;
  current_monthly: number;
  peer_average: number;
  potential_savings: number;
  savings_percent: number;
  frequency: number;
  actionable_tip: string;
  priority: string;
}

interface SavingsOpportunitiesProps {
  opportunities: SavingsOpportunity[];
}

export function SavingsOpportunities({ opportunities }: SavingsOpportunitiesProps) {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  if (!opportunities || opportunities.length === 0) {
    return (
      <div className="vault-card p-4 sm:p-6">
        <h2 className="text-base sm:text-lg font-bold mb-4">💡 Savings Opportunities</h2>
        <p className="text-sm text-[var(--stitch-on-surface-variant)]">
          Great job! Your spending is optimized. Keep it up!
        </p>
      </div>
    );
  }

  const toggleExpand = (index: number) => {
    setExpandedIndex(expandedIndex === index ? null : index);
  };

  return (
    <div className="vault-card p-4 sm:p-6">
      <h2 className="text-base sm:text-lg font-bold mb-4">💡 Top Savings Opportunities</h2>
      <div className="space-y-3">
        {opportunities.map((opp, index) => (
          <div
            key={index}
            className="p-4 rounded-xl bg-[var(--stitch-surface)] border border-[var(--stitch-outline)] hover:border-[var(--stitch-primary)] transition-colors cursor-pointer"
            onClick={() => toggleExpand(index)}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3 flex-1 min-w-0">
                <div className="p-2 rounded-lg bg-emerald-500/20 flex-shrink-0">
                  <Lightbulb className="w-4 h-4 text-emerald-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <h3 className="font-semibold text-sm">{opp.category}</h3>
                    <span className="text-emerald-500 font-bold text-sm whitespace-nowrap">
                      Save ₹{opp.potential_savings.toLocaleString("en-IN")}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-[var(--stitch-on-surface-variant)] mb-2">
                    <span>You: ₹{opp.current_monthly.toLocaleString("en-IN")}</span>
                    <span>Peer: ₹{opp.peer_average.toLocaleString("en-IN")}</span>
                    <span className="text-amber-500">{opp.savings_percent}% over</span>
                  </div>
                  
                  {expandedIndex === index && (
                    <div className="mt-3 pt-3 border-t border-[var(--stitch-outline)]">
                      <p className="text-sm text-[var(--stitch-on-surface)] mb-2">
                        {opp.actionable_tip}
                      </p>
                      <div className="flex gap-2">
                        <button className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white transition-colors">
                          Start Saving
                        </button>
                        <button className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-[var(--stitch-outline)] hover:bg-[var(--stitch-surface)] transition-colors">
                          Learn More
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              <div className="flex-shrink-0">
                {expandedIndex === index ? (
                  <ChevronUp className="w-4 h-4 text-[var(--stitch-on-surface-variant)]" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-[var(--stitch-on-surface-variant)]" />
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
      {opportunities.length > 3 && (
        <button className="mt-4 w-full py-2 text-sm font-semibold text-[var(--stitch-primary)] hover:underline">
          See All Recommendations
        </button>
      )}
    </div>
  );
}
