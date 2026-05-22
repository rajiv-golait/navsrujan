"""Middleware to block prompt injection attempts."""

import re

from fastapi import HTTPException, status

BLOCKED_PATTERNS = [
    r"ignore previous instructions",
    r"disregard",
    r"you are now",
    r"system prompt",
    r"<\|im_start\|>",
    r"<\|im_end\|>",
]


def sanitize_prompt(text: str) -> str:
    """Check for prompt injection and length limits."""
    if len(text) > 500:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Message exceeds maximum length of 500 characters.",
        )
        
    text_lower = text.lower()
    for pattern in BLOCKED_PATTERNS:
        if re.search(pattern, text_lower):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid message content detected.",
            )
            
    return text
