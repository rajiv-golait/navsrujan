"use client";

import { useState } from "react";
import { Brain } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useDeleteMemoryFact, useMemoryFacts } from "@/lib/hooks/useFinancialMemory";

export function MemoryFactsDrawer() {
  const [open, setOpen] = useState(false);
  const { data: facts = [] } = useMemoryFacts();
  const deleteMutation = useDeleteMemoryFact();

  if (facts.length === 0) return null;

  return (
    <div className="vault-card p-3">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between text-sm font-medium text-[var(--stitch-on-surface)]"
      >
        <span className="flex items-center gap-2">
          <Brain className="h-4 w-4 text-[var(--vault-accent,#4f46e5)]" />
          What I remember ({facts.length})
        </span>
        <span className="text-xs text-[var(--stitch-on-surface-variant)]">{open ? "Hide" : "Show"}</span>
      </button>
      {open && (
        <ul className="mt-3 space-y-2 max-h-40 overflow-auto">
          {facts.map((fact) => (
            <li
              key={fact.id}
              className="flex items-start justify-between gap-2 text-xs border-b border-[var(--stitch-outline-variant)] pb-2"
            >
              <div>
                <p className="font-medium text-[var(--stitch-on-surface)]">{fact.fact_key}</p>
                <p className="text-[var(--stitch-on-surface-variant)]">{fact.fact_value}</p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 px-2 text-[var(--stitch-error)]"
                onClick={() => deleteMutation.mutate(fact.id)}
              >
                ×
              </Button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
