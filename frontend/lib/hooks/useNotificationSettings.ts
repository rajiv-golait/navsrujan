import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../supabase";
import { useAuth } from "./useAuth";

export interface NotificationPreferences {
  user_id: string;
  survival_alerts: boolean;
  overspending_warnings: boolean;
  anomaly_detection: boolean;
  budget_milestones: boolean;
  savings_opportunities: boolean;
  monthly_insights: boolean;
  weekly_reports: boolean;
  academic_reminders: boolean;
  created_at: string;
  updated_at: string;
}

export function useNotificationSettings() {
  const { user } = useAuth();

  const { data: settings, isLoading: loading, error } = useQuery({
    queryKey: ["notificationSettings", user?.id],
    queryFn: async () => {
      if (!user?.id) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("notification_preferences")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (error) {
        // If no settings exist, create default ones
        if (error.code === "PGRST116") {
          const { data: newSettings, error: insertError } = await supabase
            .from("notification_preferences")
            .insert({ user_id: user.id })
            .select()
            .single();

          if (insertError) throw insertError;
          return newSettings as NotificationPreferences;
        }
        throw error;
      }
      return data as NotificationPreferences;
    },
    enabled: !!user?.id,
  });

  return { settings, loading, error };
}

export function useUpdateNotificationSettings() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (updates: Partial<NotificationPreferences>) => {
      if (!user?.id) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("notification_preferences")
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", user.id)
        .select()
        .single();

      if (error) throw error;
      return data as NotificationPreferences;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(["notificationSettings", user?.id], data);
      queryClient.invalidateQueries({ queryKey: ["notificationSettings", user?.id] });
    },
  });
}
