"use client";

import { Loader2, Send, Sparkles, Wallet } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import { ChatBubble } from "@/components/chat/ChatBubble";
import { ConversationList } from "@/components/chat/ConversationList";
import { useBalance, useSetupBalance } from "@/lib/hooks/useBalance";
import { MemoryFactsDrawer } from "@/components/vault/MemoryFactsDrawer";
import {
  PurchaseCheckCard,
  type PurchaseCheckData,
} from "@/components/vault/PurchaseCheckCard";
import { RecurringPanel } from "@/components/vault/RecurringPanel";
import { ScheduledExpensesPanel } from "@/components/vault/ScheduledExpensesPanel";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { getApiErrorMessage } from "@/lib/api-errors";
import {
  useConversations,
  useDeleteConversation,
  useMessages,
  useSendMessage,
} from "@/lib/hooks/useChat";
import { useQueryClient } from "@tanstack/react-query";
import type { ChatMessage } from "@/types/chat";

const VAULT_PROMPTS = [
  "Will I survive till month-end?",
  "How can I save ₹2000 this month?",
  "Show me spending forecast for next 30 days",
  "Can I spend ₹1500 on shoes today?",
  "Compare my spending with other students",
  "Why is my food spending high?",
];

const EMPTY_MESSAGES: ChatMessage[] = [];

function parseSlashCommand(input: string): string | null {
  const trimmed = input.trim();
  if (!trimmed.startsWith("/")) return null;
  const parts = trimmed.slice(1).split(/\s+/);
  const cmd = parts[0]?.toLowerCase();
  if (cmd === "balance") return "What is my current balance and projected balance for the next 30 days?";
  if (cmd === "survive") return "Will I survive till month-end at my current spending rate?";
  if (cmd === "forecast") return "Show me spending forecast for next 30 days by category";
  if (cmd === "save") return "How can I save money? Show me top savings opportunities";
  if (cmd === "peer") return "Compare my spending with other students like me";
  if (cmd === "plan") return "What upcoming expenses and plans do you remember?";
  if (cmd === "recurring") return "List my recurring obligations and daily costs.";
  if (cmd === "check" && parts[1]) {
    const amt = parts[1].replace(/[^\d.]/g, "");
    return `Can I afford to spend ₹${amt} today? What happens to my runway?`;
  }
  return null;
}

export function VaultAdvisor() {
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const [optimisticMessages, setOptimisticMessages] = useState<ChatMessage[]>([]);
  const [lastPurchaseCheck, setLastPurchaseCheck] = useState<PurchaseCheckData | null>(null);
  const [showBalanceSetup, setShowBalanceSetup] = useState(false);
  const [balanceAmount, setBalanceAmount] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();

  const { data: balance } = useBalance();
  const setupBalanceMutation = useSetupBalance();
  const { data: conversations = [], isLoading: convLoading } = useConversations();
  const { data: messagesData, isLoading: msgLoading } = useMessages(activeConversationId);
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
    const mapped = parseSlashCommand(text);
    const trimmed = (mapped ?? text).trim();
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
      const raw = result.snapshot?.purchase_check as Record<string, unknown> | undefined;
      if (raw && typeof raw.purchase_amount === "number") {
        setLastPurchaseCheck({
          purchase_amount: raw.purchase_amount as number,
          current_balance: raw.current_balance as number | undefined,
          balance_after_purchase: raw.balance_after_purchase as number | undefined,
          runway_days_before: raw.runway_days_before as number | undefined,
          runway_days_after: raw.runway_days_after as number | undefined,
          verdict: (raw.recommendation as string) ?? (raw.verdict as string),
        });
      }
      queryClient.invalidateQueries({ queryKey: ["balance"] });
      queryClient.invalidateQueries({ queryKey: ["scheduled-expenses"] });
      queryClient.invalidateQueries({ queryKey: ["recurring-obligations"] });
      queryClient.invalidateQueries({ queryKey: ["memory"] });
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Failed to send message"));
      setOptimisticMessages([]);
    }
  };

  const handleNewChat = () => {
    setActiveConversationId(null);
    setOptimisticMessages([]);
    setInput("");
    setLastPurchaseCheck(null);
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteMutation.mutateAsync(id);
      if (activeConversationId === id) handleNewChat();
    } catch {
      toast.error("Failed to delete conversation");
    }
  };

  const handleSetupBalance = async () => {
    const val = parseFloat(balanceAmount);
    if (val > 0) {
      await setupBalanceMutation.mutateAsync({ starting_balance: val });
      setShowBalanceSetup(false);
      queryClient.invalidateQueries({ queryKey: ["balance"] });
    }
  };

  return (
    <>
      {!balance?.configured && showBalanceSetup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="vault-card p-6 max-w-md w-full mx-4 space-y-4">
            <div>
              <h3 className="text-lg font-semibold text-[var(--stitch-on-surface)] mb-1">
                Set your starting balance
              </h3>
              <p className="text-sm text-[var(--stitch-on-surface-variant)]">
                Enter your current bank balance to enable balance-aware advice
              </p>
            </div>
            <input
              type="number"
              placeholder="e.g. 15000"
              value={balanceAmount}
              onChange={(e) => setBalanceAmount(e.target.value)}
              className="w-full rounded-lg border border-[var(--stitch-outline)] bg-[var(--stitch-surface-container-lowest)] px-4 py-3 text-[var(--stitch-on-surface)] placeholder:text-[var(--stitch-on-surface-variant)]/50"
              autoFocus
            />
            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setShowBalanceSetup(false)}
              >
                Skip for now
              </Button>
              <Button
                className="flex-1 bg-[var(--vault-accent,#4f46e5)]"
                onClick={handleSetupBalance}
                disabled={setupBalanceMutation.isPending}
              >
                Save Balance
              </Button>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-col lg:flex-row gap-4 md:gap-6 h-[calc(100dvh-9.5rem)] md:h-auto md:min-h-[calc(100vh-12rem)]">
        <aside className="lg:w-80 shrink-0 space-y-4 hidden lg:block">
          {balance?.configured ? (
            <>
              <div className="vault-card p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <p className="text-label-caps text-[var(--stitch-on-surface-variant)] text-[10px]">Your Balance</p>
                  <Wallet className="h-4 w-4 text-[var(--stitch-on-surface-variant)]" />
                </div>
                <div className="space-y-3">
                  <div>
                    <p className="text-xs text-[var(--stitch-on-surface-variant)] mb-1">Current</p>
                    <p className="text-data-mono text-2xl font-bold text-[var(--stitch-on-surface)]">
                      ₹{balance.current_balance?.toLocaleString()}
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-3 pt-3 border-t border-[var(--stitch-outline-variant)]">
                    <div>
                      <p className="text-[10px] text-label-caps text-[var(--stitch-on-surface-variant)] mb-1">30d Projected</p>
                      <p className="text-data-mono text-sm font-semibold text-[var(--stitch-secondary)]">
                        ₹{balance.projected_balance_30d?.toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] text-label-caps text-[var(--stitch-on-surface-variant)] mb-1">Runway</p>
                      <p className="text-data-mono text-sm font-semibold text-[var(--stitch-on-surface)]">
                        {balance.runway_days ?? 0} days
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              <ScheduledExpensesPanel />
              <RecurringPanel />
              <MemoryFactsDrawer />
            </>
          ) : (
            <button
              onClick={() => setShowBalanceSetup(true)}
              className="vault-card p-5 w-full text-left hover:border-[var(--vault-accent,#4f46e5)] hover:shadow-lg hover:shadow-[var(--vault-accent,#4f46e5)]/10 transition-all group"
            >
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-full bg-[var(--vault-accent,#4f46e5)]/15 flex items-center justify-center group-hover:bg-[var(--vault-accent,#4f46e5)]/25 transition-colors">
                  <Wallet className="h-5 w-5 text-[var(--vault-accent,#4f46e5)]" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-[var(--stitch-on-surface)]">Set your balance</p>
                  <p className="text-xs text-[var(--stitch-on-surface-variant)]">Enable smart advice</p>
                </div>
              </div>
            </button>
          )}
          <ConversationList
            conversations={conversations}
            activeId={activeConversationId}
            isLoading={convLoading}
            onSelect={setActiveConversationId}
            onNew={handleNewChat}
            onDelete={handleDelete}
          />
        </aside>

        <div className="flex min-w-0 flex-1 flex-col min-h-0 vault-card-elevated overflow-hidden">
          {balance?.configured && (
            <div className="md:hidden p-3 border-b border-[var(--stitch-outline-variant)] bg-[var(--stitch-surface-container-high)]">
              <div className="grid grid-cols-3 gap-3 text-center">
                <div>
                  <p className="text-[10px] text-label-caps text-[var(--stitch-on-surface-variant)] mb-1">Balance</p>
                  <p className="text-base font-bold text-[var(--stitch-on-surface)]">
                    ₹{((balance.current_balance ?? 0) / 1000).toFixed(0)}k
                  </p>
                </div>
                <div>
                  <p className="text-[10px] text-label-caps text-[var(--stitch-on-surface-variant)] mb-1">30d</p>
                  <p className="text-base font-bold text-[var(--stitch-secondary)]">
                    ₹{((balance.projected_balance_30d ?? 0) / 1000).toFixed(0)}k
                  </p>
                </div>
                <div>
                  <p className="text-[10px] text-label-caps text-[var(--stitch-on-surface-variant)] mb-1">Runway</p>
                  <p className="text-base font-bold text-[var(--stitch-on-surface)]">
                    {balance.runway_days ?? 0}d
                  </p>
                </div>
              </div>
            </div>
          )}

          <ScrollArea className="flex-1 min-h-0 p-4 md:p-7">
            {!activeConversationId && displayMessages.length === 0 ? (
              <div className="mx-auto max-w-2xl pt-8 md:pt-12 space-y-8">
                <div className="text-center">
                  <div className="w-16 h-16 md:w-20 md:h-20 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-[var(--vault-accent,#4f46e5)] to-[var(--stitch-secondary)] p-0.5">
                    <div className="w-full h-full rounded-2xl bg-[var(--stitch-surface-container)] flex items-center justify-center">
                      <Sparkles className="h-8 w-8 md:h-10 md:w-10 text-[var(--vault-accent,#4f46e5)]" />
                    </div>
                  </div>
                  <h2 className="text-2xl md:text-3xl font-bold text-[var(--stitch-on-surface)] mb-2">Vault Advisor</h2>
                  <p className="text-sm md:text-base text-[var(--stitch-on-surface-variant)]">
                    Balance-aware guidance — numbers from your data, not guesses.
                  </p>
                </div>
                {lastPurchaseCheck && <PurchaseCheckCard data={lastPurchaseCheck} />}
                <div className="flex flex-wrap gap-2.5 justify-center">
                  {VAULT_PROMPTS.map((query) => (
                    <button
                      key={query}
                      type="button"
                      disabled={sendMutation.isPending}
                      className="text-left px-4 py-2.5 rounded-2xl border border-[var(--stitch-outline-variant)] bg-[var(--surface-1)] text-sm text-[var(--stitch-on-surface-variant)] hover:border-[var(--vault-accent,#4f46e5)] hover:text-[var(--stitch-on-surface)] hover:bg-[var(--surface-2)] active:scale-95 transition-all max-w-[340px]"
                      onClick={() => handleSend(query)}
                    >
                      {query}
                    </button>
                  ))}
                </div>
                <div className="text-center space-y-2 px-2">
                  <p className="text-xs text-[var(--stitch-on-surface-variant)]">Try slash commands:</p>
                  <div className="flex flex-wrap gap-2 justify-center">
                    {["/balance", "/plan", "/recurring", "/check 1500"].map((cmd) => (
                      <code key={cmd} className="text-[11px] px-2 py-1 rounded bg-[var(--stitch-surface-container-high)] text-[var(--vault-accent,#4f46e5)] font-mono">
                        {cmd}
                      </code>
                    ))}
                  </div>
                </div>
              </div>
            ) : msgLoading && displayMessages.length === 0 ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-[var(--vault-accent,#4f46e5)]" />
              </div>
            ) : (
              <div className="mx-auto w-full max-w-3xl space-y-4">
                {lastPurchaseCheck && <PurchaseCheckCard data={lastPurchaseCheck} />}
                {displayMessages.map((msg) => (
                  <div
                    key={msg.id}
                    className={msg.role === "assistant" ? "ai-accent-line" : undefined}
                  >
                    <ChatBubble message={msg} />
                  </div>
                ))}
                <div ref={bottomRef} />
              </div>
            )}
          </ScrollArea>

          <div className="border-t border-[var(--stitch-outline-variant)]/70 p-3 md:p-5 glass-panel safe-bottom">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSend(input);
              }}
              className="mx-auto flex w-full max-w-3xl gap-2 md:gap-3"
            >
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask Vault… or /check 2000"
                className="flex-1 rounded-2xl border border-[var(--stitch-outline-variant)] bg-[var(--surface-1)] px-4 py-3.5 text-base md:text-sm text-[var(--stitch-on-surface)] placeholder:text-[var(--stitch-on-surface-variant)]/60 focus:outline-none focus:border-[var(--vault-accent,#4f46e5)] focus:ring-2 focus:ring-[var(--vault-accent,#4f46e5)]/20 transition-all"
              />
              <Button
                type="submit"
                className="shrink-0 bg-[var(--vault-accent,#4f46e5)] hover:bg-[var(--vault-accent,#4f46e5)]/90 text-white rounded-2xl h-12 w-12 p-0 shadow-lg shadow-[var(--vault-accent,#4f46e5)]/20"
                disabled={sendMutation.isPending || !input.trim()}
              >
                {sendMutation.isPending ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <Send className="h-5 w-5" />
                )}
              </Button>
            </form>
          </div>
        </div>
      </div>
    </>
  );
}
