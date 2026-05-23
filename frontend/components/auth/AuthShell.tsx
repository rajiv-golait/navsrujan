import type { ReactNode } from "react";
import { LineChart, Shield, Sparkles, Wallet } from "lucide-react";

import { BrandLogo } from "@/components/marketing/BrandLogo";

interface AuthShellProps {
  children: ReactNode;
  title: string;
  subtitle: string;
  footer?: ReactNode;
  wide?: boolean;
}

const highlights = [
  { icon: Wallet, text: "Balance, runway, and month-end survival in one view" },
  { icon: LineChart, text: "Insights powered by your real transactions" },
  { icon: Shield, text: "Your data stays in your Supabase account" },
];

export function AuthShell({ children, title, subtitle, footer, wide }: AuthShellProps) {
  return (
    <div className="min-h-screen bg-[var(--background)]">
      <div className="mx-auto grid min-h-screen max-w-6xl lg:grid-cols-[1.05fr_1fr]">
        {/* Brand panel — grounded, not floating */}
        <aside className="relative hidden flex-col justify-between border-b border-[var(--stitch-outline-variant)]/50 bg-[var(--surface-1)] p-8 lg:flex lg:border-b-0 lg:border-r">
          <div className="auth-ambient pointer-events-none absolute inset-0" />
          <div className="auth-grid pointer-events-none absolute inset-0 opacity-[0.35]" />

          <div className="relative z-10 space-y-8">
            <BrandLogo showTagline />

            <div className="space-y-4 max-w-md">
              <h1 className="text-3xl font-bold leading-tight tracking-tight text-[var(--stitch-on-surface)]">
                Student money,
                <span className="block text-[var(--vault-accent)]">made clear.</span>
              </h1>
              <p className="text-sm leading-relaxed text-[var(--stitch-on-surface-variant)]">
                Track debits and credits, semester costs, and AI guidance — without spreadsheets.
              </p>
            </div>

            <ul className="space-y-3">
              {highlights.map(({ icon: Icon, text }) => (
                <li
                  key={text}
                  className="flex items-start gap-3 rounded-xl border border-[var(--stitch-outline-variant)]/40 bg-[var(--surface-0)]/60 px-3 py-2.5 text-sm text-[var(--stitch-on-surface-variant)]"
                >
                  <Icon className="mt-0.5 h-4 w-4 shrink-0 text-[var(--vault-accent)]" />
                  {text}
                </li>
              ))}
            </ul>
          </div>

          <div className="relative z-10 vault-card border border-[var(--stitch-outline-variant)]/60 p-4">
            <p className="text-label-caps text-[10px] text-[var(--stitch-on-surface-variant)]">
              This week
            </p>
            <div className="mt-2 flex items-end justify-between gap-4">
              <div>
                <p className="text-data-mono text-2xl font-bold text-[var(--stitch-on-surface)]">
                  ₹4,823
                </p>
                <p className="text-xs text-[var(--stitch-on-surface-variant)]">Balance</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-semibold text-emerald-400">+₹80</p>
                <p className="text-xs text-[var(--stitch-on-surface-variant)]">Credits in</p>
              </div>
            </div>
            <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-[var(--surface-0)]">
              <div className="h-full w-2/3 rounded-full bg-gradient-to-r from-[var(--vault-accent)] to-cyan-500" />
            </div>
          </div>
        </aside>

        {/* Form panel */}
        <main className="flex flex-col justify-center px-5 py-10 sm:px-10 lg:px-12">
          <div className="mb-8 lg:hidden">
            <BrandLogo showTagline />
          </div>

          <div
            className={`mx-auto w-full ${wide ? "max-w-2xl" : "max-w-md"} rounded-2xl border border-[var(--stitch-outline-variant)]/60 bg-[var(--surface-1)]/80 p-6 shadow-[0_24px_80px_rgba(0,0,0,0.35)] sm:p-8`}
          >
            <div className="mb-6 flex items-center gap-2 text-[var(--vault-accent)]">
              <Sparkles className="h-4 w-4" />
              <span className="text-label-caps text-[11px]">Secure sign-in</span>
            </div>
            <h2 className="text-2xl font-bold text-[var(--stitch-on-surface)]">{title}</h2>
            <p className="mt-1 text-sm text-[var(--stitch-on-surface-variant)]">{subtitle}</p>
            <div className="mt-8">{children}</div>
          </div>

          {footer && (
            <div className="mx-auto mt-6 w-full max-w-md text-center text-sm">{footer}</div>
          )}
        </main>
      </div>
    </div>
  );
}
