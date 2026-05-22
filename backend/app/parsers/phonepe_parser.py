"""PhonePe statement PDF parser."""

from __future__ import annotations

import re
from datetime import datetime
from io import BytesIO
from typing import Any


DATE_RE = re.compile(r"^[A-Za-z]{3}\s+\d{1,2},\s+\d{4}$")
TIME_RE = re.compile(r"^\d{2}:\d{2}\s*[ap]m$", re.IGNORECASE)
TYPE_RE = re.compile(r"^(DEBIT|CREDIT)$", re.IGNORECASE)
AMOUNT_RE = re.compile(r"^₹\s*([\d,]+(?:\.\d+)?)$")
TXN_RE = re.compile(r"^Transaction ID\s+([A-Za-z0-9]+)$")
UTR_RE = re.compile(r"^UTR No\.\s+([A-Za-z0-9]+)$")


def _extract_text(file_bytes: bytes) -> str:
    try:
        from pypdf import PdfReader  # type: ignore[import-not-found]
    except Exception as exc:  # noqa: BLE001
        raise RuntimeError(
            "Missing PDF dependency. Install with: pip install pypdf"
        ) from exc

    reader = PdfReader(BytesIO(file_bytes))
    pages = []
    for page in reader.pages:
        pages.append(page.extract_text() or "")
    return "\n".join(pages)


def _to_iso_date(date_str: str) -> str:
    return datetime.strptime(date_str.strip(), "%b %d, %Y").date().isoformat()


def _clean_amount(amount_str: str) -> float:
    return float(amount_str.replace(",", "").strip())


def _clean_merchant(detail: str) -> str | None:
    low = detail.lower()
    if low.startswith("paid to"):
        return detail[7:].strip() or None
    if low.startswith("received from"):
        return detail[13:].strip() or None
    return detail.strip() or None


def parse_phonepe_pdf(file_bytes: bytes) -> list[dict[str, Any]]:
    """
    Parse PhonePe statement PDF bytes into normalized transaction rows.

    Handles multiline "Received from" names and debit/credit rows.
    """
    text = _extract_text(file_bytes)
    lines = [line.strip() for line in text.splitlines() if line.strip()]

    rows: list[dict[str, Any]] = []
    i = 0
    while i < len(lines):
        if not DATE_RE.match(lines[i]):
            i += 1
            continue
        if i + 4 >= len(lines) or not TIME_RE.match(lines[i + 1]):
            i += 1
            continue

        date_str = lines[i]
        time_str = lines[i + 1]  # kept for source text
        type_match = TYPE_RE.match(lines[i + 2])
        amount_match = AMOUNT_RE.match(lines[i + 3])
        if not type_match or not amount_match:
            i += 1
            continue

        txn_type = type_match.group(1).lower()
        amount = _clean_amount(amount_match.group(1))
        detail_parts = [lines[i + 4]]

        i += 5
        # Some rows wrap merchant/name to following lines before Transaction ID
        while i < len(lines) and not TXN_RE.match(lines[i]):
            if DATE_RE.match(lines[i]) and TIME_RE.match(lines[i + 1]) if i + 1 < len(lines) else False:
                break
            detail_parts.append(lines[i])
            i += 1

        upi_id = None
        utr_no = None
        if i < len(lines):
            tx_match = TXN_RE.match(lines[i])
            if tx_match:
                upi_id = tx_match.group(1)
                i += 1
        if i < len(lines):
            utr_match = UTR_RE.match(lines[i])
            if utr_match:
                utr_no = utr_match.group(1)
                i += 1

        # Consume account line if present ("Paid by..." / "Credited to...")
        if i < len(lines) and (lines[i].lower().startswith("paid by") or lines[i].lower().startswith("credited to")):
            i += 1

        detail = " ".join(part for part in detail_parts if part).strip()
        merchant = _clean_merchant(detail)
        source_bits = [date_str, time_str, detail]
        if upi_id:
            source_bits.append(f"Transaction ID {upi_id}")
        if utr_no:
            source_bits.append(f"UTR No. {utr_no}")

        rows.append(
            {
                "amount": amount,
                "transaction_date": _to_iso_date(date_str),
                "merchant": merchant,
                "description": detail,
                "source_text": " | ".join(source_bits),
                "transaction_type": txn_type,
                "category": None,
                "is_academic": False,
                "semester_number": None,
            }
        )

    return rows

