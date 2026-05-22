"""Keyword-first intent classification with LLM fallback."""

import re

from app.llm.groq_client import get_groq_client

KEYWORD_INTENT_MAP = {
    "BALANCE_QUERY": [
        r"balance",
        r"kitna paisa",
        r"bank balance",
        r"how much (?:money|cash) (?:left|remaining)",
        r"paisa bacha",
    ],
    "SCHEDULE_EXPENSE": [
        r"will buy",
        r"going to buy",
        r"plan(?:ning)? to buy",
        r"in \d+ days",
        r"next week.*buy",
    ],
    "RECURRING_ADD": [
        r"every day",
        r"every week",
        r"monthly rent",
        r"petrol",
        r"subscription",
        r"recurring",
    ],
    "PURCHASE_DECISION": [
        r"should i buy",
        r"can i afford",
        r"is it okay to spend",
        r"worth buying",
        r"kharidu",
    ],
    "RECALL_PLAN": [
        r"what did i plan",
        r"upcoming expense",
        r"future purchase",
        r"scheduled",
        r"planned spend",
    ],
    "SPENDING_ANALYSIS": [r"overspending", r"where.*spending", r"biggest expense", r"faltu"],
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

    for intent, patterns in KEYWORD_INTENT_MAP.items():
        for pattern in patterns:
            if re.search(pattern, text_lower):
                return intent

    groq = get_groq_client()
    llm_intent = await groq.classify_intent(text)

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
        "balance_query": "BALANCE_QUERY",
        "schedule_expense": "SCHEDULE_EXPENSE",
        "recurring_add": "RECURRING_ADD",
        "purchase_decision": "PURCHASE_DECISION",
        "recall_plan": "RECALL_PLAN",
    }

    mapped_intent = intent_mapping.get(llm_intent.lower(), llm_intent.upper())

    if mapped_intent in VALID_INTENTS:
        return mapped_intent

    return "GENERAL"
