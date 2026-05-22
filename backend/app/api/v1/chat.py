from typing import Any
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException

from app.core.security import get_current_user
from app.core.supabase_client import get_user_client
from app.middleware.rate_limit import enforce_rate_limit
from app.schemas.chat import (
    ChatMessageResponse,
    ChatReplyResponse,
    ConversationSummary,
    SendMessageRequest,
)
from app.services.chat_service import ChatService

router = APIRouter()


def get_chat_service(
    current_user: dict[str, Any] = Depends(get_current_user),
) -> ChatService:
    client = get_user_client(current_user["jwt"])
    return ChatService(client, current_user["id"])


@router.get("/conversations", response_model=list[ConversationSummary])
async def list_conversations(
    service: ChatService = Depends(get_chat_service),
) -> list[ConversationSummary]:
    return service.list_conversations()


@router.get(
    "/conversations/{conversation_id}/messages",
    response_model=list[ChatMessageResponse],
)
async def get_conversation_messages(
    conversation_id: UUID,
    service: ChatService = Depends(get_chat_service),
) -> list[ChatMessageResponse]:
    return service.get_messages(conversation_id)


@router.delete("/conversations/{conversation_id}", status_code=204)
async def delete_conversation(
    conversation_id: UUID,
    service: ChatService = Depends(get_chat_service),
) -> None:
    service.delete_conversation(conversation_id)


@router.post("/query", response_model=ChatReplyResponse)
@router.post("/message", response_model=ChatReplyResponse)
async def send_message(
    body: SendMessageRequest,
    current_user: dict[str, Any] = Depends(enforce_rate_limit),
    service: ChatService = Depends(get_chat_service),
) -> ChatReplyResponse:
    if not current_user.get("id"):
        raise HTTPException(status_code=401, detail="Unauthorized")
    return await service.handle_message(body.content, body.conversation_id)
