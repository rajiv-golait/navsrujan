"""Keyword-first intent classification with LLM fallback."""

import re

from app.llm.groq_client import get_groq_client

KEYWORD_INTENT_MAP = {
    "SPENDING_ANALYSIS": [r"overspending", r"where.*spending", r"biggest expense"],
    "SURVIVAL_CHECK": [r"survive", r"month end", r"run out", r"last until"],
    "CATEGORY_QUERY": [r"how much.*on", r"spent on", r"transport cost"],
    "FORECAST": [r"predict", r"forecast", r"next month"],
    "RECOMMENDATION": [r"how to save", r"reduce spending", r"cut down"],
    "SEMESTER_PLANNING": [r"semester cost", r"academic expenses"],
    "DEGREE_PROJECTION": [r"total degree cost", r"complete college"],
    "PEER_COMPARISON": [r"compare with others", r"average spending"],
    "TRANSACTION_ADD": [r"spent", r"paid", r"bought"],
}

VALID_INTENTS = frozenset(KEYWORD_INTENT_MAP.keys()) | {"GENERAL"}


async def classify_intent(text: str) -> str:
    text_lower = text.lower()
    
    # 1. Keyword matching
    for intent, patterns in KEYWORD_INTENT_MAP.items():
        for pattern in patterns:
            if re.search(pattern, text_lower):
                return intent
                
    # 2. LLM Fallback
    groq = get_groq_client()
    llm_intent = await groq.classify_intent(text)
    
    # Map old lowercase intents to new uppercase ones if needed
    intent_mapping = {
        "add_expense": "TRANSACTION_ADD",
        "burn_rate": "SPENDING_ANALYSIS",
        "survival": "SURVIVAL_CHECK",
        "breakdown": "SPENDING_ANALYSIS",
        "comparison": "SPENDING_ANALYSIS",
        "forecast": "FORECAST",
        "anomaly": "SPENDING_ANALYSIS",
        "personality": "SPENDING_ANALYSIS",
        "general": "GENERAL",
    }
    
    mapped_intent = intent_mapping.get(llm_intent.lower(), llm_intent.upper())
    
    if mapped_intent in VALID_INTENTS:
        return mapped_intent
        
    return "GENERAL"
