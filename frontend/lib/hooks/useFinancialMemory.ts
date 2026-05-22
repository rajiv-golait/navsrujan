"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import api from "@/lib/api";

export interface ScheduledExpense {
  id: string;
  title: string;
  amount: number;
  expected_date: string;
  category: string;
  status: string;
}

export interface RecurringObligation {
  id: string;
  name: string;
  amount: number;
  frequency: string;
  category: string;
  is_active: boolean;
}

export interface MemoryFact {
  id: string;
  fact_key: string;
  fact_value: string;
  importance: number;
}

export function useScheduledExpenses() {
  return useQuery({
    queryKey: ["scheduled-expenses"],
    queryFn: async () => {
      const { data } = await api.get<ScheduledExpense[]>("/scheduled-expenses");
      return data;
    },
  });
}

export function useRecurringObligations() {
  return useQuery({
    queryKey: ["recurring-obligations"],
    queryFn: async () => {
      const { data } = await api.get<RecurringObligation[]>("/recurring-obligations");
      return data;
    },
  });
}

export function useMemoryFacts() {
  return useQuery({
    queryKey: ["memory"],
    queryFn: async () => {
      const { data } = await api.get<MemoryFact[]>("/memory");
      return data;
    },
  });
}

export function useDeleteMemoryFact() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/memory/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["memory"] });
    },
  });
}
