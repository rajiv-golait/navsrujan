"use client";

const SUGGESTIONS = [
  "Where am I overspending?",
  "Set a savings goal",
  "Budget forecast",
  "How much have I spent on food?",
  "Can I survive till month end?",
];

interface SuggestedQueriesProps {
  onSelect: (query: string) => void;
  disabled?: boolean;
}

export function SuggestedQueries({ onSelect, disabled }: SuggestedQueriesProps) {
  return (
    <div className="flex flex-wrap gap-2 justify-center">
      {SUGGESTIONS.map((query) => (
        <button
          key={query}
          type="button"
          disabled={disabled}
          className="whitespace-nowrap px-4 py-2 rounded-full border border-[var(--stitch-outline-variant)] text-label-caps text-xs text-[var(--stitch-on-surface-variant)] hover:bg-[var(--stitch-primary)]/5 hover:text-[var(--stitch-primary)] hover:border-[var(--stitch-primary)]/30 transition-all duration-200 disabled:opacity-50"
          onClick={() => onSelect(query)}
        >
          {query}
        </button>
      ))}
    </div>
  );
}
