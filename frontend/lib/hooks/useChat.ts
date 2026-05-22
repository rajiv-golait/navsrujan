"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import api from "@/lib/api";
import type {
  ChatMessage,
  ChatReply,
  Conversation,
  SendMessagePayload,
} from "@/types/chat";

export function useConversations() {
  return useQuery({
    queryKey: ["chat", "conversations"],
    queryFn: async () => {
      const { data } = await api.get<Conversation[]>("/chat/conversations");
      return data;
    },
  });
}

export function useMessages(conversationId: string | null) {
  return useQuery({
    queryKey: ["chat", "messages", conversationId],
    enabled: !!conversationId,
    queryFn: async () => {
      const { data } = await api.get<ChatMessage[]>(
        `/chat/conversations/${conversationId}/messages`,
      );
      return data;
    },
  });
}

export function useSendMessage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: SendMessagePayload) => {
      const { data } = await api.post<ChatReply>("/chat/message", payload);
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["chat", "conversations"] });
      queryClient.invalidateQueries({
        queryKey: ["chat", "messages", data.conversation_id],
      });
    },
  });
}

export function useDeleteConversation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (conversationId: string) => {
      await api.delete(`/chat/conversations/${conversationId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["chat", "conversations"] });
    },
  });
}
