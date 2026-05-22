"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import {
  GraduationCap,
  LayoutDashboard,
  LineChart,
  LogOut,
  MessageSquare,
  Sparkles,
  Receipt,
  Settings,
  Wallet,
} from "lucide-react";

import { BalanceStrip } from "@/components/vault/BalanceStrip";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/hooks/useAuth";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/chat", label: "Vault Chat", icon: MessageSquare },
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
  { href: "/transactions", label: "Transactions", icon: Receipt },
  { href: "/insights", label: "Insights", icon: LineChart },
  { href: "/academic", label: "Academic", icon: GraduationCap },
  { href: "/planning", label: "Planning", icon: Wallet },
  { href: "/profile", label: "Settings", icon: Settings },
];

const mobileNavItems = [
  { href: "/chat", label: "Chat", icon: MessageSquare },
  { href: "/transactions", label: "Txns", icon: Receipt },
  { href: "/insights", label: "Insights", icon: LineChart },
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
  { href: "/profile", label: "Profile", icon: Settings },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading, signOut } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const isChatHome = pathname === "/chat" || pathname.startsWith("/chat/");

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/login");
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="vault-theme dark flex min-h-screen items-center justify-center bg-[var(--background)]">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 rounded-full bg-[var(--vault-accent,#4f46e5)]/30 animate-pulse-soft" />
          <p className="text-[var(--stitch-on-surface-variant)] text-sm">Loading Vault…</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  const handleSignOut = async () => {
    await signOut();
    router.replace("/login");
  };

  return (
    <div className="vault-theme dark flex min-h-screen bg-[var(--background)] text-[var(--stitch-on-surface)]">
      <aside className="hidden md:flex h-screen w-48 lg:w-56 fixed left-0 top-0 flex-col border-r border-[var(--stitch-outline-variant)]/70 bg-[var(--surface-0)] z-40">
        <div className="px-5 py-6 border-b border-[var(--stitch-outline-variant)]/60">
          <h1 className="text-xl font-bold tracking-tight text-[var(--stitch-on-surface)] flex items-center gap-2">
            <span className="h-8 w-8 rounded-xl bg-[var(--vault-accent)]/20 text-[var(--vault-accent)] flex items-center justify-center">
              <Sparkles className="h-4 w-4" />
            </span>
            Vault
          </h1>
          <p className="text-label-caps text-[11px] text-[var(--stitch-on-surface-variant)] mt-1">
            Finance AI Assistant
          </p>
        </div>

        <nav className="flex-1 space-y-1.5 px-3 py-4">
          {navItems.map(({ href, label, icon: Icon }) => {
            const isActive = pathname === href || pathname.startsWith(`${href}/`);
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "flex items-center gap-3 rounded-2xl px-3.5 py-2.5 text-sm font-medium transition-all duration-200",
                  isActive
                    ? "bg-[var(--vault-accent,#4f46e5)]/90 text-white"
                    : "text-[var(--stitch-on-surface-variant)] hover:bg-[var(--surface-1)] hover:text-[var(--stitch-on-surface)]",
                )}
              >
                <span className={cn(
                  "h-8 w-8 rounded-xl flex items-center justify-center",
                  isActive ? "bg-white/20" : "bg-[var(--surface-2)]"
                )}>
                  <Icon className="h-4 w-4" />
                </span>
                {label}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-[var(--stitch-outline-variant)]/60 p-4">
          <div className="flex items-center gap-3 mb-3 rounded-2xl border border-[var(--stitch-outline-variant)]/60 bg-[var(--surface-1)] p-2.5">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[var(--vault-accent)]/70 to-[var(--stitch-secondary)]/70 flex items-center justify-center">
              <span className="text-sm font-semibold text-white">
                {user.email?.charAt(0).toUpperCase()}
              </span>
            </div>
            <p className="truncate text-xs text-[var(--stitch-on-surface)] flex-1">
              {user.email}
            </p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start gap-2 rounded-xl text-[var(--stitch-on-surface-variant)] hover:text-[var(--stitch-error)] hover:bg-[var(--stitch-error)]/10"
            onClick={handleSignOut}
          >
            <LogOut className="h-4 w-4" />
            Sign out
          </Button>
        </div>
      </aside>

      <div className="flex flex-1 flex-col md:pl-48 lg:pl-56">
        <header className="z-30 border-b border-[var(--stitch-outline-variant)] bg-[var(--stitch-surface-container-lowest)]/95 backdrop-blur-xl px-3 py-3 md:px-8 md:py-4">
          {!isChatHome && (
            <div className="hidden md:block max-w-3xl">
              <BalanceStrip compact />
            </div>
          )}
          <div className="flex items-center justify-between md:hidden">
            <span className="font-semibold text-[var(--stitch-on-surface)]">Vault</span>
            <button
              type="button"
              onClick={handleSignOut}
              className="text-xs text-[var(--stitch-on-surface-variant)]"
            >
              Sign out
            </button>
          </div>
        </header>

        <main className="flex-1 px-3 py-4 pb-24 md:px-8 md:py-8 md:pb-8 max-w-[1400px] w-full mx-auto">
          {children}
        </main>
      </div>

      <nav className="md:hidden fixed bottom-0 inset-x-0 z-50 border-t border-[var(--stitch-outline-variant)] bg-[var(--surface-0)]/95 backdrop-blur-xl safe-bottom">
        <div className="flex items-center px-1 py-2">
          {mobileNavItems.map(({ href, label, icon: Icon }) => {
            const isActive = pathname === href || pathname.startsWith(`${href}/`);
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "flex flex-1 flex-col items-center gap-1 px-2 py-2 rounded-2xl min-w-0 transition-all touch-target",
                  isActive
                    ? "text-[var(--vault-accent,#4f46e5)] bg-[var(--vault-accent,#4f46e5)]/15"
                    : "text-[var(--stitch-on-surface-variant)] active:bg-[var(--stitch-surface-container)]",
                )}
              >
                <Icon className="h-6 w-6" />
                <span className="text-[10px] font-medium leading-none">{label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
