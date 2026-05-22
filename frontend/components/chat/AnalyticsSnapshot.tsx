"use client";

import { ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";

interface AnalyticsSnapshotProps {
  snapshot: Record<string, unknown> | null | undefined;
}

export function AnalyticsSnapshot({ snapshot }: AnalyticsSnapshotProps) {
  const [open, setOpen] = useState(false);

  if (!snapshot || Object.keys(snapshot).length === 0) {
    return null;
  }

  return (
    <div className="mt-2">
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="h-7 px-2 text-xs text-muted-foreground"
        onClick={() => setOpen(!open)}
      >
        {open ? (
          <ChevronUp className="mr-1 h-3 w-3" />
        ) : (
          <ChevronDown className="mr-1 h-3 w-3" />
        )}
        View data used
      </Button>
      {open && (
        <pre className="mt-2 max-h-48 overflow-auto rounded-md bg-gray-100 p-2 text-xs text-gray-700">
          {JSON.stringify(snapshot, null, 2)}
        </pre>
      )}
    </div>
  );
}
