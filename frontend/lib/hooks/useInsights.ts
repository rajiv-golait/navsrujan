"use client";

import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";

export function useSurvivalCheck() {
  return useQuery({
    queryKey: ["analytics", "survival-check"],
    queryFn: async () => {
      const { data } = await api.get("/analytics/survival-check");
      return data;
    },
  });
}

export function useOverspending() {
  return useQuery({
    queryKey: ["analytics", "overspending"],
    queryFn: async () => {
      const { data } = await api.get("/analytics/overspending");
      return data;
    },
  });
}

export function useSemesterAnalysis(semesterNumber?: number) {
  return useQuery({
    queryKey: ["analytics", "semester-analysis", semesterNumber],
    queryFn: async () => {
      if (semesterNumber === undefined) return null;
      const { data } = await api.get(`/analytics/semester/${semesterNumber}/analysis`);
      return data;
    },
    enabled: semesterNumber !== undefined,
  });
}
