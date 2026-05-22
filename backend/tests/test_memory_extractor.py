"""Standalone tests for memory keyword extraction (no app imports)."""

import re
import unittest
from datetime import date, timedelta


def keyword_extract(text: str) -> dict:
    """Mirror of app.services.memory_extractor._keyword_extract."""
    low = text.lower()
    result = {
        "scheduled_expense": None,
        "recurring_obligation": None,
        "memory_fact": None,
    }

    amount_match = re.search(
        r"(?:₹|rs\.?|inr)?\s*([\d,]+(?:\.\d+)?)\s*(?:k|thousand)?",
        low,
        re.I,
    )
    amount = None
    if amount_match:
        raw = amount_match.group(1).replace(",", "")
        amount = float(raw)
        if "k" in low[amount_match.start() : amount_match.end() + 2]:
            amount *= 1000

    days_match = re.search(r"(\d+)\s*days?", low)
    days = int(days_match.group(1)) if days_match else None

    if any(w in low for w in ["will buy", "going to buy", "plan to buy", "buying", "purchase"]):
        if amount:
            expected = date.today() + timedelta(days=days or 5)
            title = "Planned purchase"
            if "laptop" in low:
                title = "Laptop purchase"
            elif "phone" in low:
                title = "Phone purchase"
            result["scheduled_expense"] = {
                "title": title,
                "amount": amount,
                "expected_date": expected.isoformat(),
                "category": "Shopping",
            }

    if any(
        w in low
        for w in ["petrol", "fuel", "daily commute", "every day", "every week", "monthly rent"]
    ):
        freq = "monthly"
        if "daily" in low or "every day" in low:
            freq = "daily"
        elif "week" in low:
            freq = "weekly"
        name = "Petrol" if "petrol" in low or "fuel" in low else "Recurring expense"
        if amount:
            result["recurring_obligation"] = {
                "name": name,
                "amount": amount,
                "frequency": freq,
                "category": "Transport" if "petrol" in low else "Other",
            }

    if any(w in low for w in ["scooter", "bike", "car", "travel by", "commute"]):
        result["memory_fact"] = {"fact_key": "commute_mode", "fact_value": text[:200]}

    return result


class TestMemoryExtractor(unittest.TestCase):
    def test_scheduled_laptop_purchase(self):
        result = keyword_extract("I will buy a laptop for ₹65000 in 5 days")
        sched = result.get("scheduled_expense")
        self.assertIsNotNone(sched)
        self.assertEqual(sched["title"], "Laptop purchase")
        self.assertEqual(sched["amount"], 65000.0)

    def test_recurring_petrol_daily(self):
        result = keyword_extract("Petrol ~120 daily on my scooter")
        recur = result.get("recurring_obligation")
        self.assertIsNotNone(recur)
        self.assertEqual(recur["frequency"], "daily")
        self.assertEqual(recur["amount"], 120.0)

    def test_commute_memory_fact(self):
        result = keyword_extract("I travel by scooter to campus every day")
        fact = result.get("memory_fact")
        self.assertIsNotNone(fact)
        self.assertEqual(fact["fact_key"], "commute_mode")


if __name__ == "__main__":
    unittest.main()
