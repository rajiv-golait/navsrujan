import { Sparkles } from "lucide-react";
import Link from "next/link";

import { cn } from "@/lib/utils";

export function BrandLogo({
  className,
  href = "/",
  showTagline = false,
}: {
  className?: string;
  href?: string;
  showTagline?: boolean;
}) {
  const content = (
    <div className={cn("flex items-center gap-3", className)}>
      <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[var(--vault-accent)]/20 text-[var(--vault-accent)] ring-1 ring-[var(--vault-accent)]/30">
        <Sparkles className="h-5 w-5" />
      </span>
      <div>
        <span className="block text-lg font-bold tracking-tight text-[var(--stitch-on-surface)]">
          Vault
        </span>
        {showTagline && (
          <span className="block text-xs text-[var(--stitch-on-surface-variant)]">
            Finance AI for students
          </span>
        )}
      </div>
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="inline-flex focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--vault-accent)] rounded-xl">
        {content}
      </Link>
    );
  }

  return content;
}
