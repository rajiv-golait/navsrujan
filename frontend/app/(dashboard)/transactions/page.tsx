"use client";

import { useMemo, useState } from "react";
import { Plus, Download, Upload } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

import {
  NaturalLanguageInput,
  type TransactionFormInitialValues,
} from "@/components/transactions/NaturalLanguageInput";
import { AddTransactionForm } from "@/components/transactions/AddTransactionForm";
import { TransactionList } from "@/components/transactions/TransactionList";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  type PdfImportPreviewResult,
  useImportTransactionsPdf,
  usePreviewTransactionsPdf,
  useTransactions,
} from "@/lib/hooks/useTransactions";

const FILTER_CATEGORIES = ["All Categories", "Food & Drink", "Transport", "Entertainment", "Academic"];
const TIME_PERIODS = ["Today", "Last 7 Days", "Last 30 Days", "Custom Range"];

function humanizeSkipReason(reason?: string | null) {
  if (!reason) return "Will import";
  const map: Record<string, string> = {
    credit_transaction: "Credit txn",
    invalid_amount: "Invalid amount",
    missing_transaction_date: "Missing date",
    invalid_transaction_date: "Invalid date",
    duplicate_in_file: "Duplicate in file",
    duplicate_in_database: "Already exists",
  };
  return map[reason] ?? reason.replaceAll("_", " ");
}

function matchesCategoryFilter(txCategory: string | null | undefined, activeCategory: string) {
  if (activeCategory === "All Categories") return true;
  const value = (txCategory ?? "").trim().toLowerCase();
  if (activeCategory === "Food & Drink") return value === "food" || value === "food & drink";
  return value === activeCategory.toLowerCase();
}

function getPeriodStartDate(activeTimePeriod: string): Date | null {
  const now = new Date();
  const start = new Date(now);
  if (activeTimePeriod === "Today") {
    start.setHours(0, 0, 0, 0);
    return start;
  }
  if (activeTimePeriod === "Last 7 Days") {
    start.setDate(now.getDate() - 6);
    start.setHours(0, 0, 0, 0);
    return start;
  }
  if (activeTimePeriod === "Last 30 Days" || activeTimePeriod === "Custom Range") {
    start.setDate(now.getDate() - 29);
    start.setHours(0, 0, 0, 0);
    return start;
  }
  return null;
}

export default function TransactionsPage() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [parserType, setParserType] = useState<"phonepe" | "gpay">("phonepe");
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [previewData, setPreviewData] = useState<PdfImportPreviewResult | null>(null);
  const [previewKey, setPreviewKey] = useState<string | null>(null);
  const [previewToken, setPreviewToken] = useState<string | null>(null);
  const [formInitialValues, setFormInitialValues] =
    useState<TransactionFormInitialValues | null>(null);
  const [activeCategory, setActiveCategory] = useState("All Categories");
  const [activeTimePeriod, setActiveTimePeriod] = useState("Last 7 Days");
  const { data: transactions, isLoading } = useTransactions(100);
  const importPdfMutation = useImportTransactionsPdf();
  const previewPdfMutation = usePreviewTransactionsPdf();
  const currentFileKey = pdfFile
    ? `${parserType}:${pdfFile.name}:${pdfFile.size}:${pdfFile.lastModified}`
    : null;
  const canImportWithPreview = Boolean(
    currentFileKey && previewKey === currentFileKey && previewToken,
  );
  const filteredTransactions = useMemo(() => {
    const source = transactions ?? [];
    const startDate = getPeriodStartDate(activeTimePeriod);
    return source.filter((tx) => {
      if (!matchesCategoryFilter(tx.category, activeCategory)) {
        return false;
      }
      if (!startDate) return true;
      const txDate = new Date(tx.transaction_date);
      if (Number.isNaN(txDate.getTime())) return false;
      return txDate >= startDate;
    });
  }, [transactions, activeCategory, activeTimePeriod]);
  const filteredTotal = useMemo(
    () =>
      filteredTransactions.reduce((sum, tx) => {
        if ((tx.transaction_type ?? "debit") !== "debit") return sum;
        return sum + Number(tx.amount);
      }, 0),
    [filteredTransactions],
  );

  const handleParsed = (values: TransactionFormInitialValues) => {
    setFormInitialValues(values);
    setDialogOpen(true);
  };

  const handleDialogClose = (open: boolean) => {
    setDialogOpen(open);
    if (!open) {
      setFormInitialValues(null);
    }
  };

  const handleImportPdf = async () => {
    if (!pdfFile) {
      toast.error("Please select a PDF file.");
      return;
    }
    if (!canImportWithPreview) {
      toast.error("Generate preview for this file before importing.");
      return;
    }
    if (!previewToken) {
      toast.error("Missing preview token. Generate preview again.");
      return;
    }
    try {
      const result = await importPdfMutation.mutateAsync({
        parserType,
        file: pdfFile,
        previewToken,
      });
      toast.success(
        `${result.imported_count} imported, ${result.skipped_count} skipped.`,
      );
      if (result.skipped_count > 0) {
        const counts = result.skipped_rows.reduce<Record<string, number>>((acc, item) => {
          const key = item.reason || "unknown";
          acc[key] = (acc[key] ?? 0) + 1;
          return acc;
        }, {});
        const topReasons = Object.entries(counts)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 3)
          .map(([reason, count]) => `${humanizeSkipReason(reason)} (${count})`)
          .join(", ");
        if (topReasons) {
          toast.message(`Skipped reasons: ${topReasons}`);
        }
      }
      setImportDialogOpen(false);
      setPdfFile(null);
      setPreviewData(null);
      setPreviewKey(null);
      setPreviewToken(null);
    } catch (error: any) {
      const detail = error?.response?.data?.detail;
      toast.error(detail ?? "Failed to import PDF.");
    }
  };

  const handlePreviewPdf = async () => {
    if (!pdfFile) {
      toast.error("Please select a PDF file.");
      return;
    }
    try {
      const result = await previewPdfMutation.mutateAsync({
        parserType,
        file: pdfFile,
      });
      setPreviewData(result);
      setPreviewKey(currentFileKey);
      setPreviewToken(result.preview_token);
      toast.success("Preview generated.");
    } catch (error: any) {
      const detail = error?.response?.data?.detail;
      toast.error(detail ?? "Failed to preview PDF.");
    }
  };

  return (
    <div className="space-y-6">
      {/* Natural Language Input */}
      <NaturalLanguageInput onParsed={handleParsed} />

      {/* Desktop Grid Layout */}
      <div className="md:grid md:grid-cols-12 md:gap-4">
        {/* Desktop Sidebar Filters */}
        <div className="hidden md:block md:col-span-3 space-y-6">
          {/* Category Filters */}
          <div className="stitch-card p-4">
            <h3 className="text-label-caps text-[var(--stitch-on-surface-variant)] mb-4 px-2">
              FILTERS
            </h3>
            <div className="space-y-1">
              {FILTER_CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`w-full text-left px-4 py-2 rounded-xl text-sm transition-colors ${
                    activeCategory === cat
                      ? "bg-[var(--stitch-primary)]/10 text-[var(--stitch-primary)] font-bold"
                      : "hover:bg-[var(--stitch-surface-container-low)] text-[var(--stitch-on-surface-variant)]"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Time Period Filters */}
          <div className="stitch-card p-4">
            <h3 className="text-label-caps text-[var(--stitch-on-surface-variant)] mb-4 px-2">
              TIME PERIOD
            </h3>
            <div className="space-y-1">
              {TIME_PERIODS.map((period) => (
                <button
                  key={period}
                  onClick={() => setActiveTimePeriod(period)}
                  className={`w-full text-left px-4 py-2 rounded-xl text-sm transition-colors ${
                    activeTimePeriod === period
                      ? "bg-[var(--stitch-primary)]/10 text-[var(--stitch-primary)] font-bold"
                      : "hover:bg-[var(--stitch-surface-container-low)] text-[var(--stitch-on-surface-variant)]"
                  }`}
                >
                  {period}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Transaction List */}
        <div className="md:col-span-9">
          {/* Mobile Filter Chips */}
          <div className="md:hidden flex gap-2 overflow-x-auto pb-4 hide-scrollbar">
            {FILTER_CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`whitespace-nowrap px-4 py-2 rounded-full text-label-caps text-xs transition-colors ${
                  activeCategory === cat
                    ? "bg-[var(--stitch-primary)] text-white"
                    : "bg-[var(--stitch-surface-container-high)] text-[var(--stitch-on-surface-variant)]"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-headline-mobile md:text-headline-lg font-bold text-[var(--stitch-on-surface)]">
              Recent History
            </h2>
            <div className="flex items-center gap-3">
              <Dialog
                open={importDialogOpen}
                onOpenChange={(open) => {
                  setImportDialogOpen(open);
                  if (!open) {
                    setPdfFile(null);
                    setPreviewData(null);
                    setPreviewKey(null);
                    setPreviewToken(null);
                  }
                }}
              >
                <DialogTrigger
                  render={
                    <Button variant="outline" className="rounded-xl" />
                  }
                >
                  <Upload className="mr-2 h-4 w-4" />
                  Import PDF
                </DialogTrigger>
                <DialogContent className="w-[95vw] max-w-[95vw] sm:max-w-xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Import transactions from PDF</DialogTitle>
                    <DialogDescription>
                      Upload a PhonePe or GPay statement. Debit transactions will be added to your account.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 pb-1">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Statement type</label>
                      <select
                        value={parserType}
                        onChange={(e) => {
                          setParserType(e.target.value as "phonepe" | "gpay");
                          setPreviewData(null);
                          setPreviewKey(null);
                          setPreviewToken(null);
                        }}
                        className="w-full rounded-lg border border-[var(--stitch-outline)] bg-[var(--stitch-surface)] px-3 py-2 text-sm"
                      >
                        <option value="phonepe">PhonePe</option>
                        <option value="gpay">Google Pay (GPay)</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">PDF file</label>
                      <input
                        type="file"
                        accept="application/pdf"
                        onChange={(e) => {
                          setPdfFile(e.target.files?.[0] ?? null);
                          setPreviewData(null);
                          setPreviewKey(null);
                          setPreviewToken(null);
                        }}
                        className="w-full rounded-lg border border-[var(--stitch-outline)] bg-[var(--stitch-surface)] px-3 py-2 text-sm"
                      />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <Button
                        variant="outline"
                        onClick={handlePreviewPdf}
                        disabled={previewPdfMutation.isPending || !pdfFile}
                      >
                        {previewPdfMutation.isPending ? "Previewing..." : "Preview"}
                      </Button>
                      <Button
                        onClick={handleImportPdf}
                        disabled={importPdfMutation.isPending || !pdfFile || !canImportWithPreview}
                      >
                        {importPdfMutation.isPending ? "Importing..." : "Import"}
                      </Button>
                    </div>
                    {!canImportWithPreview && pdfFile && (
                      <p className="text-xs text-[var(--stitch-on-surface-variant)]">
                        Preview is required before import for the currently selected file.
                      </p>
                    )}

                    {previewData && (
                      <div className="space-y-3 rounded-xl border border-[var(--stitch-outline)] p-3">
                        <div className="grid grid-cols-2 gap-2 text-xs sm:text-sm">
                          <div>Total rows: <strong>{previewData.total_rows}</strong></div>
                          <div>Eligible: <strong>{previewData.eligible_rows}</strong></div>
                          <div>Would import: <strong>{previewData.would_import_count}</strong></div>
                          <div>Would skip: <strong>{previewData.would_skip_count}</strong></div>
                        </div>
                        <div className="max-h-64 overflow-auto rounded-lg border border-[var(--stitch-outline)]">
                          <table className="w-full min-w-[520px] text-xs sm:text-sm">
                            <thead className="bg-[var(--stitch-surface-container-low)]">
                              <tr>
                                <th className="px-2 py-1 text-left whitespace-nowrap">Date</th>
                                <th className="px-2 py-1 text-left">Merchant</th>
                                <th className="px-2 py-1 text-left whitespace-nowrap">Amt</th>
                                <th className="px-2 py-1 text-left whitespace-nowrap">Status</th>
                              </tr>
                            </thead>
                            <tbody>
                              {previewData.preview_rows?.map((row, idx: number) => (
                                <tr key={`${row.transaction_date}-${idx}`} className="border-t border-[var(--stitch-outline)]">
                                  <td className="px-2 py-1 whitespace-nowrap">{row.transaction_date}</td>
                                  <td className="px-2 py-1 max-w-[180px] truncate">{row.merchant ?? "-"}</td>
                                  <td className="px-2 py-1 whitespace-nowrap">
                                    ₹{Number(row.amount ?? 0).toLocaleString("en-IN")}
                                  </td>
                                  <td className="px-2 py-1 whitespace-nowrap">
                                    {row.skip_reason ? (
                                      <span className="text-red-500">{humanizeSkipReason(row.skip_reason)}</span>
                                    ) : (
                                      <span className="text-green-600">import</span>
                                    )}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                        <p className="text-[11px] text-[var(--stitch-on-surface-variant)]">
                          Tip: swipe horizontally in the preview table on smaller screens.
                        </p>
                      </div>
                    )}
                  </div>
                </DialogContent>
              </Dialog>
              <button className="text-label-caps text-xs text-[var(--stitch-primary)] hover:underline flex items-center gap-1">
                <Download className="h-3 w-3" />
                Download CSV
              </button>
              <Dialog open={dialogOpen} onOpenChange={handleDialogClose}>
                <DialogTrigger
                  render={
                    <Button className="bg-[var(--stitch-primary)] hover:bg-[var(--stitch-primary)]/90 text-white rounded-xl" />
                  }
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add transaction</DialogTitle>
                    <DialogDescription>
                      Record a new expense manually or confirm AI-parsed values
                    </DialogDescription>
                  </DialogHeader>
                  <AddTransactionForm
                    initialValues={formInitialValues}
                    onSuccess={() => handleDialogClose(false)}
                  />
                </DialogContent>
              </Dialog>
            </div>
          </div>

          {/* Transaction Rows */}
          <div className="stitch-card p-4">
            <TransactionList
              transactions={filteredTransactions}
              isLoading={isLoading}
              onAddTrigger={() => setDialogOpen(true)}
            />
          </div>

          {/* Summary Bento */}
          <div className="mt-6 grid grid-cols-2 gap-4">
            <div className="bg-[var(--stitch-primary)] p-6 rounded-[1.5rem] text-white shadow-md col-span-2 md:col-span-1">
              <p className="text-label-caps opacity-80 mb-2">SPENT THIS WEEK</p>
              <h4 className="text-headline-xl text-white font-bold">
                {filteredTransactions.length
                  ? `₹${filteredTotal.toLocaleString("en-IN")}`
                  : "₹0"}
              </h4>
              <div className="mt-4 flex items-center gap-2">
                <div className="flex-1 h-2 bg-white/20 rounded-full overflow-hidden">
                  <div className="h-full bg-[var(--stitch-secondary-container)] w-2/3 rounded-full" />
                </div>
                <span className="text-stat-sm">66%</span>
              </div>
            </div>
            <Link
              href="/insights"
              className="stitch-card p-6 flex flex-col justify-center items-center text-center col-span-2 md:col-span-1 border-2 border-dashed border-[var(--stitch-outline-variant)] hover:bg-[var(--stitch-surface-container-low)] transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--stitch-primary)]"
              aria-label="View spending insights"
            >
              <svg className="h-10 w-10 text-[var(--stitch-primary)] mb-2" viewBox="0 0 24 24" fill="currentColor">
                <path d="M16 6l2.29 2.29-4.88 4.88-4-4L2 16.59 3.41 18l6-6 4 4 6.3-6.29L22 12V6h-6z" />
              </svg>
              <p className="font-bold text-[var(--stitch-on-surface)]">View Spending Insights</p>
              <p className="text-xs text-[var(--stitch-on-surface-variant)]">AI-powered budget analysis</p>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
