"use client";

import type { ReactNode } from "react";

interface VaultPageShellProps {
  label: string;
  title: string;
  description?: string;
  children: ReactNode;
}

export function VaultPageShell({
  label,
  title,
  description,
  children,
}: VaultPageShellProps) {
  return (
    <div className="space-y-6">
      <header>
        <p className="text-label-caps text-[var(--stitch-on-surface-variant)]">{label}</p>
        <h1 className="text-headline-mobile text-[var(--stitch-on-surface)]">{title}</h1>
        {description && (
          <p className="text-sm text-[var(--stitch-on-surface-variant)] mt-1">{description}</p>
        )}
      </header>
      {children}
    </div>
  );
}
