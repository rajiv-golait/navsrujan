"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import {
  LayoutDashboard,
  LogOut,
  MessageSquare,
  Receipt,
  Bell,
  Plus,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/hooks/useAuth";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/transactions", label: "Transactions", icon: Receipt },
  { href: "/chat", label: "AI Assistant", icon: MessageSquare },
];

const mobileNavItems = [
  { href: "/dashboard", label: "Home", icon: LayoutDashboard },
  { href: "/transactions", label: "Transact", icon: Receipt },
  { href: "/chat", label: "Chat", icon: MessageSquare },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading, signOut } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/login");
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--background)]">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 rounded-full bg-[var(--stitch-primary-container)] animate-pulse-soft" />
          <p className="text-[var(--stitch-on-surface-variant)] text-sm">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const handleSignOut = async () => {
    await signOut();
    router.replace("/login");
  };

  return (
    <div className="flex min-h-screen bg-[var(--background)]">
      {/* ── Desktop Sidebar ── */}
      <aside className="hidden md:flex h-screen w-64 fixed left-0 top-0 flex-col bg-[var(--stitch-surface-container-low)] border-r border-[var(--stitch-outline-variant)] z-40">
        {/* Brand */}
        <div className="px-6 py-6 mb-2">
          <h1 className="text-headline-lg text-[var(--stitch-primary)] tracking-tight">
            StriveBudget
          </h1>
          <p className="text-[var(--stitch-on-surface-variant)] text-sm mt-0.5">
            Student Account • v1.0.2
          </p>
        </div>

        {/* Nav Links */}
        <nav className="flex-1 space-y-1 px-2">
          {navItems.map(({ href, label, icon: Icon }) => {
            const isActive = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all duration-200",
                  isActive
                    ? "bg-[var(--stitch-primary-container)] text-[var(--stitch-on-primary-container)] shadow-sm"
                    : "text-[var(--stitch-on-surface-variant)] hover:bg-[var(--stitch-surface-container-high)] hover:translate-x-0.5"
                )}
              >
                <Icon className="h-5 w-5" />
                {label}
              </Link>
            );
          })}
        </nav>

        {/* User Section */}
        <div className="border-t border-[var(--stitch-outline-variant)] p-4">
          <p className="truncate px-3 text-xs text-[var(--stitch-on-surface-variant)]">
            {user.email}
          </p>
          <Button
            variant="ghost"
            className="mt-2 w-full justify-start gap-2 text-[var(--stitch-on-surface-variant)] hover:text-[var(--stitch-error)] hover:bg-[var(--stitch-error-container)]/30 rounded-xl"
            onClick={handleSignOut}
          >
            <LogOut className="h-4 w-4" />
            Sign out
          </Button>
        </div>
      </aside>

      {/* ── Main Content ── */}
      <div className="flex flex-1 flex-col md:pl-64">
        {/* Mobile Header */}
        <header className="md:hidden fixed top-0 w-full z-50 bg-[var(--background)] flex justify-between items-center px-5 h-16">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-full bg-[var(--stitch-primary-container)] flex items-center justify-center">
              <span className="text-white text-sm font-bold">
                {user.email?.charAt(0).toUpperCase() || "S"}
              </span>
            </div>
            <span className="text-headline-mobile text-[var(--stitch-primary)] text-xl font-bold">
              StriveBudget
            </span>
          </div>
          <button className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-[var(--stitch-surface-container-low)] transition-colors">
            <Bell className="h-5 w-5 text-[var(--stitch-primary)]" />
          </button>
        </header>

        {/* Page Content */}
        <main className="flex-1 pt-20 pb-24 md:pt-8 md:pb-8 px-5 md:px-8 max-w-[1200px] mx-auto w-full">
          {children}
        </main>
      </div>

      {/* ── Mobile FAB ── */}
      <Link
        href="/transactions"
        className="md:hidden fixed right-6 bottom-24 w-14 h-14 bg-[var(--stitch-primary)] text-white rounded-full shadow-xl flex items-center justify-center z-40 active:scale-90 transition-transform hover:shadow-2xl"
      >
        <Plus className="h-6 w-6" />
      </Link>

      {/* ── Mobile Bottom Nav ── */}
      <nav className="md:hidden fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[480px] flex justify-around items-center px-2 py-3 bg-white shadow-[0_-4px_16px_rgba(0,0,0,0.04)] rounded-t-2xl z-50">
        {mobileNavItems.map(({ href, label, icon: Icon }) => {
          const isActive = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex flex-col items-center justify-center p-2 min-w-[64px] transition-all duration-200",
                isActive
                  ? "bg-[var(--stitch-primary-container)] text-[var(--stitch-on-primary-container)] rounded-full"
                  : "text-[var(--stitch-on-surface-variant)] hover:bg-[var(--stitch-primary)]/5 active:scale-90"
              )}
            >
              <Icon className="h-5 w-5" />
              <span className="text-label-caps text-[10px] mt-0.5">{label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
