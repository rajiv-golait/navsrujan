"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import api from "@/lib/api";

export interface BalanceSnapshot {
  configured: boolean;
  message?: string;
  starting_balance?: number;
  balance_as_of_date?: string;
  current_balance?: number;
  projected_balance_30d?: number;
  runway_days?: number;
  daily_burn_rate?: number;
  breakdown?: Record<string, number>;
}

export function useBalance() {
  return useQuery({
    queryKey: ["balance"],
    queryFn: async () => {
      const { data } = await api.get<BalanceSnapshot>("/balance");
      return data;
    },
    staleTime: 30_000,
  });
}

export function useSetupBalance() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { starting_balance: number; balance_as_of_date?: string }) => {
      const { data } = await api.post<BalanceSnapshot>("/balance/setup", payload);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["balance"] });
    },
  });
}

export function usePurchaseCheck() {
  return useMutation({
    mutationFn: async (payload: { amount: number; days_until?: number }) => {
      const { data } = await api.post("/balance/purchase-check", payload);
      return data;
    },
  });
}
