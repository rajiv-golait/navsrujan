"use client";

import { Loader2, Send } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import { ChatBubble } from "@/components/chat/ChatBubble";
import { SuggestedQueries } from "@/components/chat/SuggestedQueries";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  useConversations,
  useDeleteConversation,
  useMessages,
  useSendMessage,
} from "@/lib/hooks/useChat";
import { getApiErrorMessage } from "@/lib/api-errors";
import type { ChatMessage } from "@/types/chat";

import { ConversationList } from "./ConversationList";

const EMPTY_MESSAGES: ChatMessage[] = [];

export function ChatInterface() {
  const [activeConversationId, setActiveConversationId] = useState<
    string | null
  >(null);
  const [input, setInput] = useState("");
  const [optimisticMessages, setOptimisticMessages] = useState<ChatMessage[]>(
    [],
  );
  const bottomRef = useRef<HTMLDivElement>(null);

  const { data: conversations = [], isLoading: convLoading } =
    useConversations();
  const { data: messagesData, isLoading: msgLoading } =
    useMessages(activeConversationId);
  const messages = messagesData ?? EMPTY_MESSAGES;
  const sendMutation = useSendMessage();
  const deleteMutation = useDeleteConversation();

  const currentConversationKey = activeConversationId || "temp";
  const optimisticConversationId = optimisticMessages[0]?.conversation_id;
  const displayMessages =
    optimisticMessages.length > 0 &&
    optimisticConversationId === currentConversationKey
      ? optimisticMessages
      : messages;

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [displayMessages.length, sendMutation.isPending]);

  const handleSend = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || sendMutation.isPending) return;

    const tempUser: ChatMessage = {
      id: `temp-user-${Date.now()}`,
      conversation_id: activeConversationId || "temp",
      role: "user",
      content: trimmed,
      created_at: new Date().toISOString(),
    };
    const tempAssistant: ChatMessage = {
      id: `temp-assistant-${Date.now()}`,
      conversation_id: activeConversationId || "temp",
      role: "assistant",
      content: "Thinking...",
      created_at: new Date().toISOString(),
    };

    setOptimisticMessages([...messages, tempUser, tempAssistant]);
    setInput("");

    try {
      const result = await sendMutation.mutateAsync({
        conversation_id: activeConversationId || undefined,
        content: trimmed,
      });
      setActiveConversationId(result.conversation_id);
      setOptimisticMessages([]);
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Failed to send message"));
      setOptimisticMessages([]);
    }
  };

  const handleNewChat = () => {
    setActiveConversationId(null);
    setOptimisticMessages([]);
    setInput("");
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteMutation.mutateAsync(id);
      if (activeConversationId === id) {
        handleNewChat();
      }
    } catch {
      toast.error("Failed to delete conversation");
    }
  };

  return (
    <div className="flex h-[calc(100vh-8rem)] overflow-hidden rounded-[1.5rem] stitch-card">
      {/* Conversation Sidebar */}
      <div className="hidden w-72 shrink-0 md:block">
        <ConversationList
          conversations={conversations}
          activeId={activeConversationId}
          isLoading={convLoading}
          onSelect={setActiveConversationId}
          onNew={handleNewChat}
          onDelete={handleDelete}
        />
      </div>

      {/* Chat Area */}
      <div className="flex min-w-0 flex-1 flex-col bg-[var(--background)]">
        {/* Mobile Conversation Picker */}
        <div className="border-b border-[var(--stitch-outline-variant)] bg-[var(--card)] px-4 py-3 md:hidden">
          <select
            className="w-full rounded-xl border border-[var(--stitch-outline-variant)] px-3 py-2 text-sm bg-[var(--stitch-surface-container-low)] text-[var(--stitch-on-surface)]"
            value={activeConversationId || ""}
            onChange={(e) =>
              setActiveConversationId(e.target.value || null)
            }
          >
            <option value="">New conversation</option>
            {conversations.map((c) => (
              <option key={c.id} value={c.id}>
                {c.title || "Conversation"}
              </option>
            ))}
          </select>
        </div>

        {/* Messages */}
        <ScrollArea className="flex-1 p-4">
          {!activeConversationId && displayMessages.length === 0 ? (
            <div className="mx-auto max-w-lg pt-12 text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[var(--stitch-primary)]/10 flex items-center justify-center">
                <svg className="h-8 w-8 text-[var(--stitch-primary)]" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19.07 4.93l-1.41 1.41A8.014 8.014 0 0120 12c0 4.42-3.58 8-8 8s-8-3.58-8-8c0-3.35 2.07-6.22 5-7.41V2.05C4.06 3.29 1 7.26 1 12c0 6.08 4.93 11 11 11s11-4.92 11-11c0-2.69-.97-5.15-2.58-7.07zM12 2v8l5 3-1 1.73L10 11V2h2z"/>
                </svg>
              </div>
              <h2 className="text-headline-mobile text-[var(--stitch-on-surface)] mb-2">
                Ask Strive AI anything
              </h2>
              <p className="text-sm text-[var(--stitch-on-surface-variant)] mb-6">
                Get answers backed by your real transaction data — not guesses.
              </p>
              <SuggestedQueries
                onSelect={handleSend}
                disabled={sendMutation.isPending}
              />
            </div>
          ) : msgLoading && displayMessages.length === 0 ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-[var(--stitch-primary)]" />
            </div>
          ) : (
            <div className="mx-auto max-w-2xl space-y-4">
              {displayMessages.map((msg) => (
                <ChatBubble key={msg.id} message={msg} />
              ))}
              <div ref={bottomRef} />
            </div>
          )}
        </ScrollArea>

        {/* Suggested Queries (visible when conversation active) */}
        {activeConversationId && displayMessages.length > 0 && (
          <div className="border-t border-[var(--stitch-outline-variant)]/50 bg-[var(--card)] px-4 py-2">
            <SuggestedQueries
              onSelect={handleSend}
              disabled={sendMutation.isPending}
            />
          </div>
        )}

        {/* Input Area */}
        <div className="border-t border-[var(--stitch-outline-variant)] bg-[var(--card)] p-4">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend(input);
            }}
            className="mx-auto flex max-w-2xl gap-2 items-end"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask Strive AI anything..."
              className="flex-1 bg-[var(--stitch-surface-container-low)] border border-[var(--stitch-outline-variant)]/30 rounded-xl px-4 py-3 text-sm text-[var(--stitch-on-surface)] placeholder:text-[var(--stitch-on-surface-variant)]/50 focus:outline-none focus:border-[var(--stitch-primary)] focus:ring-1 focus:ring-[var(--stitch-primary)]/30 transition-all"
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSend(input);
                }
              }}
            />
            <Button
              type="submit"
              className="shrink-0 bg-[var(--stitch-primary)] hover:bg-[var(--stitch-primary)]/90 text-white rounded-xl h-[46px] w-[46px] p-0 min-w-0"
              disabled={sendMutation.isPending || !input.trim()}
            >
              {sendMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
