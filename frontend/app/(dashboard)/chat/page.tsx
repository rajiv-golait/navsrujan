"use client";

import { VaultAdvisor } from "@/components/vault/VaultAdvisor";

export default function ChatPage() {
  return (
    <div className="space-y-4">
      <div>
        <p className="text-label-caps text-[var(--stitch-on-surface-variant)]">Vault Advisor</p>
        <h1 className="text-headline-mobile text-[var(--stitch-on-surface)] tracking-tight">
          Your balance-aware finance coach
        </h1>
      </div>
      <VaultAdvisor />
    </div>
  );
}
