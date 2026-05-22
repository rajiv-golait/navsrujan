import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[var(--background)] relative overflow-hidden">
      {/* Background blobs */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-[var(--stitch-primary)]/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4" />
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-[var(--stitch-secondary-container)]/8 rounded-full blur-3xl translate-y-1/3 -translate-x-1/4" />
      </div>

      {/* Header */}
      <header className="relative mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-[var(--stitch-primary-container)] flex items-center justify-center">
            <svg className="h-4 w-4 text-white" viewBox="0 0 24 24" fill="currentColor">
              <path d="M5 13.18v4L12 21l7-3.82v-4L12 17l-7-3.82zM12 3L1 9l11 6 9-4.91V17h2V9L12 3z" />
            </svg>
          </div>
          <span className="font-bold text-lg text-[var(--stitch-primary)]">StriveBudget</span>
        </div>
        <div className="flex gap-3">
          <Link
            href="/login"
            className={cn(
              buttonVariants({ variant: "ghost" }),
              "text-[var(--stitch-on-surface-variant)] hover:text-[var(--stitch-primary)] rounded-xl"
            )}
          >
            Log in
          </Link>
          <Link
            href="/signup"
            className={cn(
              buttonVariants(),
              "bg-[var(--stitch-primary)] hover:bg-[var(--stitch-primary)]/90 text-white rounded-xl shadow-md"
            )}
          >
            Sign up
          </Link>
        </div>
      </header>

      {/* Hero */}
      <main className="relative mx-auto max-w-6xl px-6 py-20">
        <div className="mx-auto max-w-3xl text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-[var(--stitch-primary)]/10 px-4 py-1.5 text-sm font-medium text-[var(--stitch-primary)]">
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
              <path d="M5 13.18v4L12 21l7-3.82v-4L12 17l-7-3.82zM12 3L1 9l11 6 9-4.91V17h2V9L12 3z" />
            </svg>
            Built for college students
          </div>
          <h1 className="text-headline-xl md:text-[56px] md:leading-[64px] font-bold tracking-tight text-[var(--stitch-on-surface)]">
            Budget smarter through every semester
          </h1>
          <p className="mt-6 text-lg text-[var(--stitch-on-surface-variant)] max-w-xl mx-auto">
            Track personal and academic expenses, understand your spending
            patterns, and get AI-powered guidance — all in one place.
          </p>
          <div className="mt-10 flex justify-center gap-4">
            <Link
              href="/signup"
              className={cn(
                buttonVariants({ size: "lg" }),
                "bg-[var(--stitch-primary)] hover:bg-[var(--stitch-primary)]/90 text-white rounded-xl shadow-lg h-12 px-8 text-base font-semibold active:scale-[0.97] transition-all"
              )}
            >
              Get started free
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
            <Link
              href="/login"
              className={cn(
                buttonVariants({ size: "lg", variant: "outline" }),
                "border-[var(--stitch-outline-variant)] text-[var(--stitch-on-surface)] hover:bg-[var(--stitch-surface-container-low)] rounded-xl h-12 px-8 text-base"
              )}
            >
              I have an account
            </Link>
          </div>
        </div>

        {/* Feature Cards */}
        <div className="mt-24 grid gap-6 md:grid-cols-3">
          {[
            {
              icon: "📊",
              title: "Track expenses",
              desc: "Log transactions manually or with AI and see where your money goes each month.",
            },
            {
              icon: "🎓",
              title: "Semester-aware",
              desc: "Separate personal and academic spending with education context built in.",
            },
            {
              icon: "🤖",
              title: "Smart insights",
              desc: "Analytics engine powers dashboards — AI explains, never guesses numbers.",
            },
          ].map((feature) => (
            <div
              key={feature.title}
              className="stitch-card p-6 hover:shadow-md transition-all duration-200 hover:-translate-y-1 group cursor-pointer"
            >
              <div className="text-3xl mb-4 group-hover:scale-110 transition-transform">{feature.icon}</div>
              <h3 className="font-semibold text-lg text-[var(--stitch-on-surface)] mb-2">{feature.title}</h3>
              <p className="text-sm text-[var(--stitch-on-surface-variant)] leading-relaxed">{feature.desc}</p>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
