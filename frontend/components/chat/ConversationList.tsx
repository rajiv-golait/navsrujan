"use client";

import { MessageSquarePlus, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import type { Conversation } from "@/types/chat";

interface ConversationListProps {
  conversations: Conversation[];
  activeId: string | null;
  isLoading: boolean;
  onSelect: (id: string) => void;
  onNew: () => void;
  onDelete: (id: string) => void;
}

export function ConversationList({
  conversations,
  activeId,
  isLoading,
  onSelect,
  onNew,
  onDelete,
}: ConversationListProps) {
  return (
    <div className="flex h-full flex-col border-r border-[var(--stitch-outline-variant)] bg-[var(--stitch-surface-container-low)]">
      <div className="border-b border-[var(--stitch-outline-variant)] p-4">
        <Button
          className="w-full bg-[var(--stitch-primary)] hover:bg-[var(--stitch-primary)]/90 text-white rounded-xl"
          onClick={onNew}
        >
          <MessageSquarePlus className="mr-2 h-4 w-4" />
          New chat
        </Button>
      </div>
      <ScrollArea className="flex-1 p-2">
        {isLoading ? (
          <div className="space-y-2 p-2">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-14 w-full rounded-xl bg-[var(--stitch-surface-container-high)]" />
            ))}
          </div>
        ) : conversations.length === 0 ? (
          <p className="p-4 text-sm text-[var(--stitch-on-surface-variant)]">No conversations yet</p>
        ) : (
          <div className="space-y-1">
            {conversations.map((conv) => (
              <div
                key={conv.id}
                className={cn(
                  "group flex items-start gap-2 rounded-xl p-3 transition-all duration-200",
                  activeId === conv.id
                    ? "bg-[var(--stitch-primary-container)] text-[var(--stitch-on-primary-container)]"
                    : "hover:bg-[var(--stitch-surface-container-high)]"
                )}
              >
                <button
                  type="button"
                  className="min-w-0 flex-1 text-left"
                  onClick={() => onSelect(conv.id)}
                >
                  <p className={cn(
                    "truncate text-sm font-medium",
                    activeId === conv.id
                      ? "text-[var(--stitch-on-primary-container)]"
                      : "text-[var(--stitch-on-surface)]"
                  )}>
                    {conv.title || "New conversation"}
                  </p>
                  {conv.last_message_preview && (
                    <p className="mt-1 truncate text-xs opacity-70">
                      {conv.last_message_preview}
                    </p>
                  )}
                </button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 shrink-0 opacity-0 group-hover:opacity-100 rounded-lg"
                  onClick={() => onDelete(conv.id)}
                >
                  <Trash2 className="h-3.5 w-3.5 text-[var(--stitch-on-surface-variant)]" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  );
}
