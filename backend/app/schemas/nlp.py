from typing import Any, Literal, Optional

from pydantic import BaseModel

from app.schemas.transaction import TransactionResponse


class AddNaturalResponse(BaseModel):
    status: Literal["saved", "needs_confirmation"]
    confidence: float
    transaction: Optional[TransactionResponse] = None
    parsed_data: Optional[dict[str, Any]] = None
    message: str
