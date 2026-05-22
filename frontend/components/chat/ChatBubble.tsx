"use client";

import { cn } from "@/lib/utils";
import type { ChatMessage } from "@/types/chat";

import { AnalyticsSnapshot } from "./AnalyticsSnapshot";

interface ChatBubbleProps {
  message: ChatMessage;
}

export function ChatBubble({ message }: ChatBubbleProps) {
  const isUser = message.role === "user";

  return (
    <div
      className={cn(
        "flex w-full animate-float-in",
        isUser ? "justify-end" : "justify-start"
      )}
    >
      <div className="flex flex-col max-w-[85%]">
        {/* Sender label */}
        {!isUser && (
          <div className="flex items-center gap-1.5 mb-1.5 px-1">
            <svg className="h-4 w-4 text-[var(--stitch-primary)]" viewBox="0 0 24 24" fill="currentColor">
              <path d="M19.07 4.93l-1.41 1.41A8.014 8.014 0 0120 12c0 4.42-3.58 8-8 8s-8-3.58-8-8c0-3.35 2.07-6.22 5-7.41V2.05C4.06 3.29 1 7.26 1 12c0 6.08 4.93 11 11 11s11-4.92 11-11c0-2.69-.97-5.15-2.58-7.07zM12 2v8l5 3-1 1.73L10 11V2h2z"/>
            </svg>
            <span className="text-label-caps text-[var(--stitch-primary)]">STRIVE AI</span>
          </div>
        )}

        {/* Bubble */}
        <div
          className={cn(
            "px-4 py-3 text-sm leading-relaxed",
            isUser
              ? "bg-[var(--stitch-primary)] text-white rounded-2xl rounded-br-md shadow-md"
              : "bg-[var(--stitch-primary)]/5 text-[var(--stitch-on-surface)] rounded-2xl rounded-bl-md border border-[var(--stitch-primary)]/10"
          )}
        >
          {!isUser && message.intent && (
            <span className="inline-flex items-center rounded-full bg-[var(--stitch-primary)]/10 text-[var(--stitch-primary)] px-2.5 py-0.5 text-xs font-semibold mb-2">
              {message.intent}
            </span>
          )}
          <p className="whitespace-pre-wrap">{message.content}</p>
          {!isUser && (
            <AnalyticsSnapshot snapshot={message.analytics_snapshot ?? null} />
          )}
        </div>

        {/* Timestamp */}
        {isUser && (
          <p className="text-[10px] text-[var(--stitch-on-surface-variant)] mt-1 text-right px-1">
            {new Date(message.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </p>
        )}
      </div>
    </div>
  );
}
