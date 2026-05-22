"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";

export function useAcademicExpenses(semesterNumber?: number) {
  return useQuery({
    queryKey: ["academic-expenses", "semester", semesterNumber],
    queryFn: async () => {
      if (semesterNumber === undefined) return [];
      const { data } = await api.get(`/academic-expenses/semester/${semesterNumber}`);
      return data;
    },
    enabled: semesterNumber !== undefined,
  });
}

export function useUpcomingAcademicExpenses() {
  return useQuery({
    queryKey: ["academic-expenses", "upcoming"],
    queryFn: async () => {
      const { data } = await api.get("/academic-expenses/upcoming");
      return data;
    },
  });
}

export function useMissingAcademicSuggestions() {
  return useQuery({
    queryKey: ["academic-expenses", "missing-suggestions"],
    queryFn: async () => {
      const { data } = await api.get("/academic-expenses/missing-suggestions");
      return data;
    },
  });
}

export function useCreateAcademicExpense() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: any) => {
      const { data } = await api.post("/academic-expenses/", payload);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["academic-expenses"] });
    },
  });
}
