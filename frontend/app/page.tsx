import Link from "next/link";
import {
  ArrowRight,
  GraduationCap,
  LineChart,
  MessageSquare,
  Receipt,
  Sparkles,
  Wallet,
} from "lucide-react";

import { BrandLogo } from "@/components/marketing/BrandLogo";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const features = [
  {
    icon: Receipt,
    title: "Track expenses & income",
    desc: "Debits, credits, PDF imports, and natural-language entry in one ledger.",
  },
  {
    icon: GraduationCap,
    title: "Semester-aware",
    desc: "Academic fees and personal spend separated with education context.",
  },
  {
    icon: LineChart,
    title: "Grounded insights",
    desc: "Runway, budget health, and forecasts from your data — not guesses.",
  },
];

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[var(--background)]">
      <div className="auth-ambient pointer-events-none fixed inset-0" />
      <div className="auth-grid pointer-events-none fixed inset-0 opacity-20" />

      <header className="relative z-10 border-b border-[var(--stitch-outline-variant)]/50 bg-[var(--surface-0)]/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4 sm:px-8">
          <BrandLogo />
          <div className="flex items-center gap-2 sm:gap-3">
            <Link
              href="/login"
              className={cn(
                buttonVariants({ variant: "ghost", size: "sm" }),
                "rounded-xl text-[var(--stitch-on-surface-variant)]",
              )}
            >
              Log in
            </Link>
            <Link
              href="/signup"
              className={cn(
                buttonVariants({ size: "sm" }),
                "rounded-xl bg-[var(--vault-accent)] text-white hover:bg-[var(--vault-accent)]/90",
              )}
            >
              Sign up
            </Link>
          </div>
        </div>
      </header>

      <main className="relative z-10 mx-auto max-w-6xl px-5 pb-20 pt-12 sm:px-8 sm:pt-16">
        <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
          <div>
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-[var(--vault-accent)]/30 bg-[var(--vault-accent)]/10 px-3 py-1 text-xs font-medium text-[var(--vault-accent)]">
              <GraduationCap className="h-3.5 w-3.5" />
              Built for college students in India
            </div>
            <h1 className="text-4xl font-bold leading-[1.1] tracking-tight text-[var(--stitch-on-surface)] sm:text-5xl">
              Budget smarter through every semester
            </h1>
            <p className="mt-5 max-w-lg text-base leading-relaxed text-[var(--stitch-on-surface-variant)]">
              Vault combines a spend ledger, academic planning, and an AI advisor that
              explains your numbers — so you always know what you can afford.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/signup"
                className={cn(
                  buttonVariants({ size: "lg" }),
                  "h-12 rounded-xl bg-[var(--vault-accent)] px-6 font-semibold text-white hover:bg-[var(--vault-accent)]/90",
                )}
              >
                Get started free
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
              <Link
                href="/login"
                className={cn(
                  buttonVariants({ size: "lg", variant: "outline" }),
                  "h-12 rounded-xl border-[var(--stitch-outline-variant)] bg-[var(--surface-1)]/50",
                )}
              >
                I have an account
              </Link>
            </div>
            <div className="mt-10 flex flex-wrap gap-6 border-t border-[var(--stitch-outline-variant)]/40 pt-8">
              {[
                { label: "Natural language", value: "Add txns in Hindi/English" },
                { label: "Credits & debits", value: "UPI in/out supported" },
                { label: "Runway", value: "Days until broke" },
              ].map((stat) => (
                <div key={stat.label}>
                  <p className="text-label-caps text-[10px] text-[var(--stitch-on-surface-variant)]">
                    {stat.label}
                  </p>
                  <p className="mt-0.5 text-sm font-medium text-[var(--stitch-on-surface)]">
                    {stat.value}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Product preview — grounded card stack */}
          <div className="marketing-panel relative overflow-hidden rounded-3xl p-5 shadow-[0_32px_80px_rgba(0,0,0,0.45)]">
            <div className="mb-4 flex items-center justify-between border-b border-[var(--stitch-outline-variant)]/40 pb-3">
              <span className="text-sm font-semibold text-[var(--stitch-on-surface)]">Vault</span>
              <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-medium text-emerald-400">
                Live
              </span>
            </div>
            <div className="grid grid-cols-3 gap-2 text-center">
              {[
                { label: "Balance", value: "₹4,823", icon: Wallet },
                { label: "Runway", value: "12 days", icon: LineChart },
                { label: "Chat", value: "Ask AI", icon: MessageSquare },
              ].map(({ label, value, icon: Icon }) => (
                <div
                  key={label}
                  className="rounded-xl border border-[var(--stitch-outline-variant)]/40 bg-[var(--surface-0)]/80 p-3"
                >
                  <Icon className="mx-auto h-4 w-4 text-[var(--vault-accent)]" />
                  <p className="mt-2 text-[10px] text-[var(--stitch-on-surface-variant)]">{label}</p>
                  <p className="text-data-mono text-sm font-semibold text-[var(--stitch-on-surface)]">
                    {value}
                  </p>
                </div>
              ))}
            </div>
            <div className="mt-3 space-y-2 rounded-xl border border-[var(--stitch-outline-variant)]/40 bg-[var(--surface-0)]/60 p-3">
              <p className="text-label-caps text-[10px] text-[var(--stitch-on-surface-variant)]">
                Recent
              </p>
              {[
                { name: "Food", amount: "-₹100", tone: "text-[var(--stitch-on-surface)]" },
                { name: "Yashh Pawar", amount: "+₹30", tone: "text-emerald-400" },
              ].map((row) => (
                <div key={row.name} className="flex justify-between text-sm">
                  <span className="text-[var(--stitch-on-surface-variant)]">{row.name}</span>
                  <span className={`font-semibold ${row.tone}`}>{row.amount}</span>
                </div>
              ))}
            </div>
            <div className="mt-3 flex items-center gap-2 rounded-xl bg-[var(--vault-accent)]/15 px-3 py-2 text-xs text-[var(--stitch-on-surface-variant)]">
              <Sparkles className="h-4 w-4 shrink-0 text-[var(--vault-accent)]" />
              &quot;Can I afford ₹2,000 this weekend?&quot; — Vault answers from your data.
            </div>
          </div>
        </div>

        <section className="mt-20 border-t border-[var(--stitch-outline-variant)]/40 pt-16">
          <h2 className="text-center text-2xl font-bold text-[var(--stitch-on-surface)]">
            Everything you need for student finance
          </h2>
          <p className="mx-auto mt-2 max-w-xl text-center text-sm text-[var(--stitch-on-surface-variant)]">
            Not another generic budgeting app — built around semesters, UPI habits, and campus life.
          </p>
          <div className="mt-10 grid gap-4 md:grid-cols-3">
            {features.map(({ icon: Icon, title, desc }) => (
              <div
                key={title}
                className="rounded-2xl border border-[var(--stitch-outline-variant)]/50 bg-[var(--surface-1)]/60 p-6 transition-colors hover:border-[var(--vault-accent)]/40"
              >
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--vault-accent)]/15 text-[var(--vault-accent)]">
                  <Icon className="h-5 w-5" />
                </span>
                <h3 className="mt-4 font-semibold text-[var(--stitch-on-surface)]">{title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-[var(--stitch-on-surface-variant)]">
                  {desc}
                </p>
              </div>
            ))}
          </div>
        </section>
      </main>

      <footer className="relative z-10 border-t border-[var(--stitch-outline-variant)]/40 py-6 text-center text-xs text-[var(--stitch-on-surface-variant)]">
        Vault — Finance AI Assistant for students
      </footer>
    </div>
  );
}
