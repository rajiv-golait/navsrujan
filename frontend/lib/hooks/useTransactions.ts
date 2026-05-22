"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import api from "@/lib/api";
import type {
  MonthSummary,
  Transaction,
  TransactionCreate,
} from "@/types/transaction";

export function useTransactions(limit = 50) {
  return useQuery({
    queryKey: ["transactions", limit],
    queryFn: async () => {
      const { data } = await api.get<Transaction[]>("/transactions/", {
        params: { limit },
      });
      return data;
    },
  });
}

export function useMonthSummary() {
  return useQuery({
    queryKey: ["transactions", "summary", "current-month"],
    queryFn: async () => {
      const { data } = await api.get<MonthSummary>(
        "/transactions/summary/current-month",
      );
      return data;
    },
  });
}

export function useCreateTransaction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: TransactionCreate) => {
      const { data } = await api.post<Transaction>(
        "/transactions/",
        payload,
      );
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
    },
  });
}

export function useDeleteTransaction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/transactions/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
    },
  });
}

export interface PdfImportResult {
  parser: "phonepe" | "gpay";
  imported_count: number;
  skipped_count: number;
  skipped_rows: Array<{ row: number; reason: string }>;
  message: string;
}

export interface PdfImportPreviewResult {
  parser: "phonepe" | "gpay";
  total_rows: number;
  eligible_rows: number;
  would_import_count: number;
  would_skip_count: number;
  preview_token: string;
  preview_rows: Array<{
    transaction_date: string;
    amount: number;
    transaction_type?: "debit" | "credit";
    category: string;
    merchant?: string | null;
    description?: string | null;
    skip_reason?: string | null;
  }>;
  skipped_rows: Array<{ row: number; reason: string }>;
  message: string;
}

export function useImportTransactionsPdf() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: {
      parserType: "phonepe" | "gpay";
      file: File;
      previewToken: string;
    }) => {
      const form = new FormData();
      form.append("parser_type", payload.parserType);
      form.append("preview_token", payload.previewToken);
      form.append("file", payload.file);

      const { data } = await api.post<PdfImportResult>("/transactions/import-pdf", form, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      queryClient.invalidateQueries({ queryKey: ["transactions", "summary", "current-month"] });
    },
  });
}

export function usePreviewTransactionsPdf() {
  return useMutation({
    mutationFn: async (payload: { parserType: "phonepe" | "gpay"; file: File }) => {
      const form = new FormData();
      form.append("parser_type", payload.parserType);
      form.append("file", payload.file);

      const { data } = await api.post<PdfImportPreviewResult>(
        "/transactions/import-pdf/preview",
        form,
        {
          headers: { "Content-Type": "multipart/form-data" },
        },
      );
      return data;
    },
  });
}
