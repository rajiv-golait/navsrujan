from datetime import datetime
from typing import Any, Literal, Optional
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field

from app.schemas.transaction import TransactionCreate


class ParseTextRequest(BaseModel):
    text: str = Field(..., min_length=1, max_length=500)


class ParsedTransactionData(BaseModel):
    amount: float
    category: str
    merchant: Optional[str] = None
    description: Optional[str] = None
    transaction_date: str
    entry_method: str = "nlp"
    is_academic: bool = False
    transaction_type: str = "debit"
    confidence_score: Optional[float] = None


class ParseResult(BaseModel):
    status: Literal["parsed", "needs_clarification"]
    confidence: float
    transaction: Optional[ParsedTransactionData] = None
    question: Optional[str] = None
    source_text: Optional[str] = None


class SendMessageRequest(BaseModel):
    conversation_id: Optional[UUID] = None
    content: str = Field(..., min_length=1, max_length=2000)


class ChatMessageResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    conversation_id: UUID
    role: str
    content: str
    intent: Optional[str] = None
    analytics_snapshot: Optional[dict[str, Any]] = None
    created_at: datetime


class ChatReplyResponse(BaseModel):
    conversation_id: UUID
    reply: str
    intent: str
    snapshot: dict[str, Any]
    user_message: ChatMessageResponse
    assistant_message: ChatMessageResponse


class ConversationSummary(BaseModel):
    id: UUID
    title: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    last_message_preview: Optional[str] = None
