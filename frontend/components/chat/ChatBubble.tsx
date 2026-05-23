"use client";

import { cn } from "@/lib/utils";
import type { ChatMessage } from "@/types/chat";

import { AnalyticsSnapshot } from "./AnalyticsSnapshot";

interface ChatBubbleProps {
  message: ChatMessage;
}

export function ChatBubble({ message }: ChatBubbleProps) {
  const isUser = message.role === "user";
  const timeLabel = new Date(message.created_at).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div
      className={cn(
        "flex w-full animate-float-in",
        isUser ? "justify-end" : "justify-start"
      )}
    >
      <div
        className={cn(
          "flex flex-col",
          isUser ? "max-w-[min(100%,18rem)]" : "max-w-[min(100%,32rem)]",
        )}
      >
        {!isUser && (
          <div className="mb-1 flex items-center gap-1 px-0.5">
            <span className="text-[10px] font-semibold uppercase tracking-wide text-[var(--vault-accent)]">
              Vault
            </span>
          </div>
        )}

        <div
          className={cn(
            "text-sm leading-snug",
            isUser
              ? "rounded-2xl rounded-br-sm bg-[var(--vault-accent)] px-3 py-2 text-white shadow-md shadow-[var(--vault-accent)]/20"
              : "rounded-2xl rounded-bl-sm border border-[var(--stitch-outline-variant)]/60 bg-[var(--surface-1)] px-3 py-2.5 text-[var(--stitch-on-surface)]",
          )}
        >
          {!isUser && message.intent && (
            <span className="mb-1.5 inline-flex items-center rounded-md bg-[var(--vault-accent)]/15 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[var(--vault-accent)]">
              {message.intent}
            </span>
          )}
          <p className="whitespace-pre-wrap">{message.content}</p>
          {!isUser && (
            <AnalyticsSnapshot snapshot={message.analytics_snapshot ?? null} />
          )}
        </div>

        {/* Timestamp */}
        <p
          className={cn(
            "mt-0.5 px-0.5 text-[10px] text-[var(--stitch-on-surface-variant)]",
            isUser ? "text-right" : "text-left",
          )}
        >
          {timeLabel}
        </p>
      </div>
    </div>
  );
}
