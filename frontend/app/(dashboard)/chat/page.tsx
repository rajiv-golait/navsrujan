"use client";

import { ChatInterface } from "@/components/chat/ChatInterface";

export default function ChatPage() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-headline-mobile md:text-headline-lg text-[var(--stitch-on-surface)]">
          AI Assistant
        </h1>
        <p className="text-sm text-[var(--stitch-on-surface-variant)]">
          Ask questions about your spending — answers use your real data
        </p>
      </div>
      <ChatInterface />
    </div>
  );
}
