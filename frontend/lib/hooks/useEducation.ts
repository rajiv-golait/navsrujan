"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";

export function useEducationTemplates() {
  return useQuery({
    queryKey: ["education", "templates"],
    queryFn: async () => {
      const { data } = await api.get("/education/templates");
      return data;
    },
  });
}

export function useEducationContext() {
  return useQuery({
    queryKey: ["education", "context"],
    queryFn: async () => {
      const { data } = await api.get("/education/profile/context");
      return data;
    },
  });
}

export function useSetupEducationProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: any) => {
      const { data } = await api.post("/education/profile/setup", payload);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["education", "context"] });
    },
  });
}

export function useSemesterExpenses(semesterNumber: number | undefined) {
  return useQuery({
    queryKey: ["education", "semester-expenses", semesterNumber],
    queryFn: async () => {
      if (semesterNumber === undefined) return [];
      const { data } = await api.get(`/education/semester/${semesterNumber}/expenses`);
      return data;
    },
    enabled: semesterNumber !== undefined,
  });
}
