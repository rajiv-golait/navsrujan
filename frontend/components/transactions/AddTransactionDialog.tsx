"use client";

import { createContext, useCallback, useContext, useState, type ReactNode } from "react";

import {
  NaturalLanguageInput,
  type TransactionFormInitialValues,
} from "@/components/transactions/NaturalLanguageInput";
import { AddTransactionForm } from "@/components/transactions/AddTransactionForm";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type AddTransactionDialogContextValue = {
  open: () => void;
  close: () => void;
  isOpen: boolean;
};

const AddTransactionDialogContext = createContext<AddTransactionDialogContextValue | null>(
  null,
);

export function useAddTransactionDialog() {
  const ctx = useContext(AddTransactionDialogContext);
  if (!ctx) {
    throw new Error("useAddTransactionDialog must be used within AddTransactionDialogProvider");
  }
  return ctx;
}

export function AddTransactionDialogProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [formInitialValues, setFormInitialValues] =
    useState<TransactionFormInitialValues | null>(null);

  const handleOpen = useCallback(() => setOpen(true), []);
  const handleClose = useCallback(() => {
    setOpen(false);
    setFormInitialValues(null);
  }, []);

  const handleOpenChange = (next: boolean) => {
    if (next) setOpen(true);
    else handleClose();
  };

  const handleParsed = (values: TransactionFormInitialValues) => {
    setFormInitialValues(values);
  };

  return (
    <AddTransactionDialogContext.Provider
      value={{ open: handleOpen, close: handleClose, isOpen: open }}
    >
      {children}
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="w-[95vw] max-w-[95vw] sm:max-w-lg max-h-[90vh] overflow-y-auto bg-[var(--stitch-surface-container-lowest)] border-[var(--stitch-outline)] text-[var(--stitch-on-surface)]">
          <DialogHeader>
            <DialogTitle className="text-[var(--stitch-on-surface)]">Add transaction</DialogTitle>
            <DialogDescription className="text-[var(--stitch-on-surface-variant)]">
              Type naturally or fill the form manually
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-5">
            {open && <NaturalLanguageInput inDialog onParsed={handleParsed} />}
            <div className="relative flex items-center gap-3">
              <div className="h-px flex-1 bg-[var(--stitch-outline)]" />
              <span className="text-xs text-[var(--stitch-on-surface-variant)] shrink-0">
                or manual entry
              </span>
              <div className="h-px flex-1 bg-[var(--stitch-outline)]" />
            </div>
            <AddTransactionForm
              key={formInitialValues ? "parsed" : "empty"}
              initialValues={formInitialValues}
              onSuccess={handleClose}
            />
          </div>
        </DialogContent>
      </Dialog>
    </AddTransactionDialogContext.Provider>
  );
}
