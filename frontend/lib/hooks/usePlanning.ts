"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import api from "@/lib/api";

export function useDegreeProjection() {
  return useMutation({
    mutationFn: async (payload: { plan_name: string; assumptions?: string }) => {
      const { data } = await api.post("/planning/degree-projection", payload);
      return data;
    },
  });
}

export function useSemesterForecast(semesterNumber?: number) {
  return useQuery({
    queryKey: ["planning", "forecast", semesterNumber],
    queryFn: async () => {
      if (semesterNumber === undefined) return null;
      const { data } = await api.get(`/planning/semester/${semesterNumber}/forecast`);
      return data;
    },
    enabled: semesterNumber !== undefined,
  });
}

export function useFundingGapAnalysis() {
  return useMutation({
    mutationFn: async (payload: { available_funds: number; monthly_income: number }) => {
      const { data } = await api.post("/planning/funding-gap-analysis", payload);
      return data;
    },
  });
}

export function usePeerComparison() {
  return useQuery({
    queryKey: ["planning", "peer-comparison"],
    queryFn: async () => {
      const { data } = await api.get("/planning/peer-comparison");
      return data;
    },
  });
}
