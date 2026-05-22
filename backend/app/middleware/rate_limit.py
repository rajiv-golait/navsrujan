"""In-memory per-user rate limiting (30 requests/minute)."""

from __future__ import annotations

from collections import defaultdict
from datetime import datetime, timedelta, timezone
from typing import Any

from fastapi import Depends, HTTPException, status

from app.core.security import get_current_user

WINDOW = timedelta(minutes=1)
LIMIT = 30
_buckets: dict[str, list[datetime]] = defaultdict(list)


def enforce_rate_limit(
    current_user: dict[str, Any] = Depends(get_current_user),
) -> dict[str, Any]:
    user_id = current_user.get("id", "anonymous")
    now = datetime.now(timezone.utc)

    recent = [ts for ts in _buckets[user_id] if now - ts < WINDOW]
    if len(recent) >= LIMIT:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Rate limit exceeded. Max 30 LLM requests per minute.",
        )

    recent.append(now)
    _buckets[user_id] = recent
    return current_user
