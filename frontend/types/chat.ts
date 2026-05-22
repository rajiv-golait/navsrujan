export interface ParsedTransactionData {
  amount: number;
  category: string;
  merchant?: string | null;
  description?: string | null;
  transaction_date: string;
  entry_method?: string;
  is_academic?: boolean;
  confidence_score?: number | null;
}

export interface ParseResult {
  status: "parsed" | "needs_clarification";
  confidence: number;
  transaction?: ParsedTransactionData | null;
  question?: string | null;
  source_text?: string | null;
}

export interface ChatMessage {
  id: string;
  conversation_id: string;
  role: "user" | "assistant";
  content: string;
  intent?: string | null;
  analytics_snapshot?: Record<string, unknown> | null;
  created_at: string;
}

export interface Conversation {
  id: string;
  title?: string | null;
  created_at: string;
  updated_at: string;
  last_message_preview?: string | null;
}

export interface ChatReply {
  conversation_id: string;
  reply: string;
  intent: string;
  snapshot: Record<string, unknown>;
  user_message: ChatMessage;
  assistant_message: ChatMessage;
}

export interface SendMessagePayload {
  conversation_id?: string;
  content: string;
}
