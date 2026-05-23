"use client";

import { Menu, Plus, Sparkles, Upload } from "lucide-react";
import { useState } from "react";

import { useAddTransactionDialog } from "@/components/transactions/AddTransactionDialog";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface TransactionsPageMenuProps {
  onImportPdf: () => void;
}

export function TransactionsPageMenu({ onImportPdf }: TransactionsPageMenuProps) {
  const [open, setOpen] = useState(false);
  const { open: openAddDialog } = useAddTransactionDialog();

  const handleAdd = () => {
    setOpen(false);
    openAddDialog();
  };

  const handleImport = () => {
    setOpen(false);
    onImportPdf();
  };

  return (
    <>
      <Button
        type="button"
        variant="outline"
        size="icon"
        className="rounded-xl h-9 w-9 sm:h-10 sm:w-10 border-[var(--stitch-outline)]"
        onClick={() => setOpen(true)}
        aria-label="Open transactions menu"
      >
        <Menu className="h-5 w-5" />
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="w-[min(20rem,92vw)] sm:max-w-sm bg-[var(--surface-0)] border-[var(--stitch-outline)] text-[var(--stitch-on-surface)]">
          <DialogHeader>
            <DialogTitle className="text-[var(--stitch-on-surface)]">Transactions menu</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <button
              type="button"
              onClick={handleAdd}
              className="flex w-full items-center gap-3 rounded-2xl bg-[var(--stitch-primary)] px-4 py-3 text-sm font-semibold text-white"
            >
              <Sparkles className="h-5 w-5" />
              Add expense (AI)
            </button>
            <button
              type="button"
              onClick={handleImport}
              className="flex w-full items-center gap-3 rounded-2xl border border-[var(--stitch-outline)] bg-[var(--surface-1)] px-4 py-3 text-sm font-medium"
            >
              <Upload className="h-5 w-5" />
              Import PDF
            </button>
            <button
              type="button"
              onClick={handleAdd}
              className="flex w-full items-center gap-3 rounded-2xl border border-[var(--stitch-outline)] bg-[var(--surface-1)] px-4 py-3 text-sm font-medium"
            >
              <Plus className="h-5 w-5" />
              Add manually
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
