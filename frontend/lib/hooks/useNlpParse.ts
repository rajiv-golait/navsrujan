"use client";

import { useMutation } from "@tanstack/react-query";

import api from "@/lib/api";
import type { ParseResult } from "@/types/chat";

export function useParseExpense() {
  return useMutation({
    mutationFn: async (text: string) => {
      const { data } = await api.post<ParseResult>("/transactions/parse", {
        text,
      });
      return data;
    },
  });
}
