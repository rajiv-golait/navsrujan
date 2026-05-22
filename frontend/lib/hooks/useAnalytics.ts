"use client";

import { useQuery } from "@tanstack/react-query";

import api from "@/lib/api";
import type { AnalyticsInsights } from "@/types/analytics";

export function useAnalyticsInsights() {
  return useQuery({
    queryKey: ["analytics", "insights"],
    queryFn: async () => {
      const { data } = await api.get<AnalyticsInsights>("/analytics/insights");
      return data;
    },
    staleTime: 60_000,
  });
}
