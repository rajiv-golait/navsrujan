"""Numeric cross-check for LLM responses."""

import re
from typing import Any


def validate_response_numbers(response_text: str, snapshot: dict[str, Any]) -> str:
    """
    Extracts currency amounts and key integers from response_text and cross-checks
    against snapshot (balance, runway_days, analytics figures).
    """
    currency_matches = re.findall(
        r"(?:₹|Rs\.?)\s*([\d,]+(?:\.\d+)?)", response_text, re.IGNORECASE
    )
    day_matches = re.findall(r"(\d+)\s*days?", response_text, re.IGNORECASE)

    if not currency_matches and not day_matches:
        return response_text

    snapshot_numbers: set[float] = set()

    def extract_numbers(obj: Any) -> None:
        if isinstance(obj, (int, float)):
            snapshot_numbers.add(float(obj))
        elif isinstance(obj, dict):
            for v in obj.values():
                extract_numbers(v)
        elif isinstance(obj, list):
            for item in obj:
                extract_numbers(item)

    extract_numbers(snapshot)

    for match in currency_matches:
        try:
            num = float(match.replace(",", ""))
            if not _number_in_snapshot(num, snapshot_numbers):
                return _safe_fallback()
        except ValueError:
            pass

    runway = snapshot.get("balance", {}).get("runway_days")
    if runway is not None:
        snapshot_numbers.add(float(runway))

    for match in day_matches:
        try:
            num = float(match)
            if num > 3 and not _number_in_snapshot(num, snapshot_numbers):
                return _safe_fallback()
        except ValueError:
            pass

    return response_text


def _number_in_snapshot(num: float, snapshot_numbers: set[float]) -> bool:
    for snap_num in snapshot_numbers:
        if abs(snap_num - num) < 1.0:
            return True
        if snap_num > 100 and abs(snap_num - num) / snap_num < 0.02:
            return True
    return False


def _safe_fallback() -> str:
    return (
        "I want to give you accurate numbers only. Please check your balance strip "
        "and dashboard for the latest figures, or ask again with a specific question."
    )
