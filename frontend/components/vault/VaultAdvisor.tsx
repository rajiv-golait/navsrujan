"use client";

import { Loader2, Send, Sparkles, Wallet } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import { ChatBubble } from "@/components/chat/ChatBubble";
import { ConversationList } from "@/components/chat/ConversationList";
import { useBalance, useSetupBalance } from "@/lib/hooks/useBalance";
import {
  PurchaseCheckCard,
  type PurchaseCheckData,
} from "@/components/vault/PurchaseCheckCard";
import { formatCurrency } from "@/lib/utils";
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
    <div className="flex min-h-0 flex-1 flex-col">
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

      <div className="flex min-h-0 flex-1 flex-col gap-2 lg:flex-row lg:gap-3">
        <aside className="hidden min-h-0 w-56 shrink-0 flex-col gap-2 lg:flex xl:w-60">
          {balance?.configured ? (
            <div className="shrink-0 rounded-xl border border-[var(--stitch-outline-variant)]/60 bg-[var(--surface-1)] p-3">
              <div className="mb-2 flex items-center justify-between">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-[var(--stitch-on-surface-variant)]">
                  Balance
                </p>
                <Wallet className="h-3.5 w-3.5 text-[var(--stitch-on-surface-variant)]" />
              </div>
              <p className="text-data-mono text-xl font-bold text-[var(--stitch-on-surface)]">
                {formatCurrency(balance.current_balance ?? 0)}
              </p>
              <div className="mt-2 grid grid-cols-2 gap-2 border-t border-[var(--stitch-outline-variant)]/50 pt-2">
                <div>
                  <p className="text-[9px] uppercase text-[var(--stitch-on-surface-variant)]">30d</p>
                  <p className="text-data-mono text-xs font-semibold text-[var(--stitch-secondary)]">
                    {formatCurrency(balance.projected_balance_30d ?? 0)}
                  </p>
                </div>
                <div>
                  <p className="text-[9px] uppercase text-[var(--stitch-on-surface-variant)]">Runway</p>
                  <p className="text-data-mono text-xs font-semibold">
                    {balance.runway_days ?? 0}d
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setShowBalanceSetup(true)}
              className="shrink-0 rounded-xl border border-dashed border-[var(--stitch-outline-variant)] bg-[var(--surface-1)] p-3 text-left hover:border-[var(--vault-accent)]"
            >
              <p className="text-sm font-semibold text-[var(--stitch-on-surface)]">Set balance</p>
              <p className="text-xs text-[var(--stitch-on-surface-variant)]">For runway advice</p>
            </button>
          )}
          <ConversationList
            className="min-h-0 flex-1"
            conversations={conversations}
            activeId={activeConversationId}
            isLoading={convLoading}
            onSelect={setActiveConversationId}
            onNew={handleNewChat}
            onDelete={handleDelete}
          />
        </aside>

        <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden rounded-xl border border-[var(--stitch-outline-variant)]/60 bg-[var(--surface-0)]">
          <div className="flex shrink-0 items-center justify-between gap-2 border-b border-[var(--stitch-outline-variant)]/60 px-3 py-2">
            <div className="min-w-0">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-[var(--vault-accent)]">
                Vault Advisor
              </p>
              <p className="truncate text-xs text-[var(--stitch-on-surface-variant)]">
                Balance-aware finance coach
              </p>
            </div>
            {balance?.configured && (
              <div className="hidden text-right sm:block">
                <p className="text-data-mono text-sm font-bold">
                  {formatCurrency(balance.current_balance ?? 0)}
                </p>
                <p className="text-[10px] text-[var(--stitch-on-surface-variant)]">
                  {balance.runway_days ?? 0}d runway
                </p>
              </div>
            )}
          </div>

          {balance?.configured && (
            <div className="grid shrink-0 grid-cols-3 gap-2 border-b border-[var(--stitch-outline-variant)]/40 px-2 py-1.5 text-center lg:hidden">
              <div>
                <p className="text-[9px] uppercase text-[var(--stitch-on-surface-variant)]">Bal</p>
                <p className="text-xs font-bold">{formatCurrency(balance.current_balance ?? 0)}</p>
              </div>
              <div>
                <p className="text-[9px] uppercase text-[var(--stitch-on-surface-variant)]">30d</p>
                <p className="text-xs font-bold text-[var(--stitch-secondary)]">
                  {formatCurrency(balance.projected_balance_30d ?? 0)}
                </p>
              </div>
              <div>
                <p className="text-[9px] uppercase text-[var(--stitch-on-surface-variant)]">Run</p>
                <p className="text-xs font-bold">{balance.runway_days ?? 0}d</p>
              </div>
            </div>
          )}

          <ScrollArea className="min-h-0 flex-1 px-3 py-3">
            {!activeConversationId && displayMessages.length === 0 ? (
              <div className="mx-auto max-w-xl space-y-4 py-2">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--vault-accent)]/15">
                    <Sparkles className="h-5 w-5 text-[var(--vault-accent)]" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-[var(--stitch-on-surface)]">Ask anything</h2>
                    <p className="text-xs text-[var(--stitch-on-surface-variant)]">
                      Answers use your real balance and transactions.
                    </p>
                  </div>
                </div>
                {lastPurchaseCheck && <PurchaseCheckCard data={lastPurchaseCheck} />}
                <div className="flex flex-wrap gap-1.5">
                  {VAULT_PROMPTS.map((query) => (
                    <button
                      key={query}
                      type="button"
                      disabled={sendMutation.isPending}
                      className="rounded-lg border border-[var(--stitch-outline-variant)]/60 bg-[var(--surface-1)] px-2.5 py-1.5 text-left text-xs text-[var(--stitch-on-surface-variant)] transition-colors hover:border-[var(--vault-accent)] hover:text-[var(--stitch-on-surface)]"
                      onClick={() => handleSend(query)}
                    >
                      {query}
                    </button>
                  ))}
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {["/balance", "/check 1500", "/forecast"].map((cmd) => (
                    <code
                      key={cmd}
                      className="rounded-md bg-[var(--surface-1)] px-1.5 py-0.5 text-[10px] font-mono text-[var(--vault-accent)]"
                    >
                      {cmd}
                    </code>
                  ))}
                </div>
              </div>
            ) : msgLoading && displayMessages.length === 0 ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-[var(--vault-accent,#4f46e5)]" />
              </div>
            ) : (
              <div className="mx-auto w-full max-w-2xl space-y-2.5">
                {lastPurchaseCheck && <PurchaseCheckCard data={lastPurchaseCheck} />}
                {displayMessages.map((msg) => (
                  <ChatBubble key={msg.id} message={msg} />
                ))}
                <div ref={bottomRef} />
              </div>
            )}
          </ScrollArea>

          <div className="shrink-0 border-t border-[var(--stitch-outline-variant)]/60 px-2 py-2 safe-bottom">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSend(input);
              }}
              className="mx-auto flex w-full max-w-2xl gap-2"
            >
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask Vault… or /check 2000"
                className="h-10 flex-1 rounded-xl border border-[var(--stitch-outline-variant)]/60 bg-[var(--surface-1)] px-3 text-sm text-[var(--stitch-on-surface)] placeholder:text-[var(--stitch-on-surface-variant)]/60 focus:border-[var(--vault-accent)] focus:outline-none focus:ring-2 focus:ring-[var(--vault-accent)]/20"
              />
              <Button
                type="submit"
                className="h-10 w-10 shrink-0 rounded-xl bg-[var(--vault-accent)] p-0 text-white hover:bg-[var(--vault-accent)]/90"
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
    </div>
  );
}
