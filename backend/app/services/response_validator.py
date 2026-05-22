"""Numeric cross-check for LLM responses."""

import re
from typing import Any


def validate_response_numbers(response_text: str, snapshot: dict[str, Any]) -> str:
    """
    Extracts all ₹ amounts from response_text and cross-checks them against snapshot.
    If a number is found in the response that doesn't exist in the snapshot,
    it falls back to a safe template.
    """
    # Extract all numbers preceded by ₹ or Rs
    matches = re.findall(r"(?:₹|Rs\.?)\s*([\d,]+(?:\.\d+)?)", response_text, re.IGNORECASE)
    
    if not matches:
        return response_text
        
    # Flatten all numeric values in snapshot for comparison
    snapshot_numbers = set()
    
    def extract_numbers(obj: Any):
        if isinstance(obj, (int, float)):
            snapshot_numbers.add(float(obj))
        elif isinstance(obj, dict):
            for v in obj.values():
                extract_numbers(v)
        elif isinstance(obj, list):
            for item in obj:
                extract_numbers(item)
                
    extract_numbers(snapshot)
    
    for match in matches:
        try:
            num = float(match.replace(",", ""))
            # Allow small floating point differences
            found = False
            for snap_num in snapshot_numbers:
                if abs(snap_num - num) < 0.1:
                    found = True
                    break
            
            if not found:
                # Number hallucinated!
                return "I'm sorry, I couldn't verify the exact numbers for your request. Please check your dashboard for the most accurate and up-to-date figures."
        except ValueError:
            pass
            
    return response_text
