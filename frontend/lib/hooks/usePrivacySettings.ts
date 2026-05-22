import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../supabase";
import { useAuth } from "./useAuth";

export interface PrivacySettings {
  user_id: string;
  data_sharing_for_insights: boolean;
  anonymous_peer_comparison: boolean;
  store_transaction_history: boolean;
  two_factor_enabled: boolean;
  login_notifications: boolean;
  created_at: string;
  updated_at: string;
}

export function usePrivacySettings() {
  const { user } = useAuth();

  const { data: settings, isLoading: loading, error } = useQuery({
    queryKey: ["privacySettings", user?.id],
    queryFn: async () => {
      if (!user?.id) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("privacy_settings")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (error) {
        // If no settings exist, create default ones
        if (error.code === "PGRST116") {
          const { data: newSettings, error: insertError } = await supabase
            .from("privacy_settings")
            .insert({ user_id: user.id })
            .select()
            .single();

          if (insertError) throw insertError;
          return newSettings as PrivacySettings;
        }
        throw error;
      }
      return data as PrivacySettings;
    },
    enabled: !!user?.id,
  });

  return { settings, loading, error };
}

export function useUpdatePrivacySettings() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (updates: Partial<PrivacySettings>) => {
      if (!user?.id) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("privacy_settings")
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", user.id)
        .select()
        .single();

      if (error) throw error;
      return data as PrivacySettings;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(["privacySettings", user?.id], data);
      queryClient.invalidateQueries({ queryKey: ["privacySettings", user?.id] });
    },
  });
}
