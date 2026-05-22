"""Standalone tests for recurring projection math (no app imports)."""

import unittest


def recurring_total_next_days(rows: list[dict], days: int) -> float:
    """Mirror of balance_service._recurring_total_next_days core logic."""
    total = 0.0
    for row in rows:
        amount = float(row.get("amount") or 0)
        freq = str(row.get("frequency") or "monthly").lower()
        if freq == "daily":
            total += amount * days
        elif freq == "weekly":
            total += amount * (days / 7.0)
        elif freq == "monthly":
            total += amount * (days / 30.0)
        elif freq == "quarterly":
            total += amount * (days / 90.0)
        elif freq == "yearly":
            total += amount * (days / 365.0)
    return round(total, 2)


class TestRecurringProjection(unittest.TestCase):
    def test_daily_multiplies_by_days(self):
        total = recurring_total_next_days(
            [{"amount": 120, "frequency": "daily"}],
            30,
        )
        self.assertEqual(total, 3600.0)

    def test_weekly_prorated(self):
        total = recurring_total_next_days(
            [{"amount": 700, "frequency": "weekly"}],
            30,
        )
        self.assertAlmostEqual(total, 3000.0, places=0)

    def test_monthly_prorated(self):
        total = recurring_total_next_days(
            [{"amount": 3000, "frequency": "monthly"}],
            30,
        )
        self.assertEqual(total, 3000.0)


if __name__ == "__main__":
    unittest.main()
