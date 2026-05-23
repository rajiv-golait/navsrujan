"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  GraduationCap,
  LayoutDashboard,
  LineChart,
  LogOut,
  Menu,
  MessageSquare,
  Plus,
  Receipt,
  Settings,
  Sparkles,
  Wallet,
  X,
} from "lucide-react";
import { useState } from "react";

import { useAddTransactionDialog } from "@/components/transactions/AddTransactionDialog";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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

interface MobileNavMenuProps {
  onSignOut: () => void;
}

export function MobileNavMenu({ onSignOut }: MobileNavMenuProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const pathname = usePathname();
  const isTransactions = pathname === "/transactions" || pathname.startsWith("/transactions/");
  const { open: openAddTransaction } = useAddTransactionDialog();

  const handleAddExpense = () => {
    setMenuOpen(false);
    openAddTransaction();
  };

  return (
    <>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="h-10 w-10 rounded-xl text-[var(--stitch-on-surface)] shrink-0"
        onClick={() => setMenuOpen(true)}
        aria-label="Open menu"
      >
        <Menu className="h-5 w-5" />
      </Button>

      <Dialog open={menuOpen} onOpenChange={setMenuOpen}>
        <DialogContent
          showCloseButton={false}
          className="!fixed !left-0 !top-0 !h-full !w-[min(18rem,88vw)] !max-w-none !translate-x-0 !translate-y-0 flex flex-col rounded-none rounded-r-2xl border-r border-[var(--stitch-outline)] bg-[var(--surface-0)] p-0 gap-0 sm:max-w-none"
        >
          <DialogHeader className="border-b border-[var(--stitch-outline-variant)] px-4 py-4">
            <div className="flex items-center justify-between">
              <DialogTitle className="flex items-center gap-2 text-base">
                <span className="h-8 w-8 rounded-xl bg-[var(--vault-accent)]/20 text-[var(--vault-accent)] flex items-center justify-center">
                  <Sparkles className="h-4 w-4" />
                </span>
                Vault
              </DialogTitle>
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                onClick={() => setMenuOpen(false)}
                aria-label="Close menu"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
          </DialogHeader>

          <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-1">
            {isTransactions && (
              <button
                type="button"
                onClick={handleAddExpense}
                className="mb-2 flex w-full items-center gap-3 rounded-2xl bg-[var(--stitch-primary)] px-3.5 py-3 text-sm font-semibold text-white"
              >
                <Plus className="h-5 w-5" />
                Add expense (AI)
              </button>
            )}

            {navItems.map(({ href, label, icon: Icon }) => {
              const isActive = pathname === href || pathname.startsWith(`${href}/`);
              return (
                <Link
                  key={href}
                  href={href}
                  onClick={() => setMenuOpen(false)}
                  className={cn(
                    "flex items-center gap-3 rounded-2xl px-3.5 py-2.5 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-[var(--vault-accent)]/90 text-white"
                      : "text-[var(--stitch-on-surface-variant)] hover:bg-[var(--surface-1)] hover:text-[var(--stitch-on-surface)]",
                  )}
                >
                  <span
                    className={cn(
                      "flex h-8 w-8 items-center justify-center rounded-xl",
                      isActive ? "bg-white/20" : "bg-[var(--surface-2)]",
                    )}
                  >
                    <Icon className="h-4 w-4" />
                  </span>
                  {label}
                </Link>
              );
            })}
          </nav>

          <div className="border-t border-[var(--stitch-outline-variant)] p-4">
            <Button
              variant="ghost"
              className="w-full justify-start gap-2 rounded-xl text-[var(--stitch-on-surface-variant)] hover:text-[var(--stitch-error)] hover:bg-[var(--stitch-error)]/10"
              onClick={() => {
                setMenuOpen(false);
                onSignOut();
              }}
            >
              <LogOut className="h-4 w-4" />
              Sign out
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
