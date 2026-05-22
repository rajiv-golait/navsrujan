"""Google Pay statement PDF parser."""

from __future__ import annotations

import re
from datetime import datetime
from io import BytesIO
from typing import Any


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
    return datetime.strptime(date_str.strip(), "%d%b,%Y").date().isoformat()


def _clean_amount(amount_str: str) -> float:
    return float(amount_str.replace(",", "").strip())


def _humanize_name(value: str) -> str:
    value = re.sub(r"([a-z])([A-Z])", r"\1 \2", value)
    value = re.sub(r"\s+", " ", value).strip()
    return value


def parse_gpay_pdf(file_bytes: bytes) -> list[dict[str, Any]]:
    """
    Parse GPay statement PDF bytes into normalized transaction rows.

    Expected (extracted) pattern:
    03Apr,2026
    07:44PMPaidtoMrXYZ
    UPITransaction ID:121027755355
    Paidby<bank>...₹44
    """
    text = _extract_text(file_bytes)
    lines = [line.strip() for line in text.splitlines() if line.strip()]

    date_re = re.compile(r"^\d{2}[A-Za-z]{3},\d{4}$")
    time_detail_re = re.compile(r"^(?P<time>\d{2}:\d{2}[AP]M)(?P<detail>.+)$")
    upi_re = re.compile(r"^UPITransaction\s*ID:(?P<upi>[A-Za-z0-9]+)$")
    amount_re = re.compile(r"₹\s*(?P<amount>[\d,]+(?:\.\d+)?)$")

    rows: list[dict[str, Any]] = []
    i = 0
    while i < len(lines):
        if not date_re.match(lines[i]):
            i += 1
            continue
        if i + 3 >= len(lines):
            break

        td_match = time_detail_re.match(lines[i + 1])
        if not td_match:
            i += 1
            continue

        raw_detail = td_match.group("detail").strip()
        raw_detail = re.sub(r"^Paidto", "Paid to ", raw_detail)
        raw_detail = re.sub(r"^Receivedfrom", "Received from ", raw_detail)
        raw_detail = re.sub(r"^Received from([A-Za-z])", r"Received from \1", raw_detail)
        raw_detail = _humanize_name(raw_detail)

        upi_match = upi_re.match(lines[i + 2])
        amount_match = amount_re.search(lines[i + 3])
        if not upi_match or not amount_match:
            i += 1
            continue

        detail = raw_detail
        if detail.lower().startswith("paid to"):
            txn_type = "debit"
            merchant = _humanize_name(detail[7:].strip())
        else:
            txn_type = "credit"
            merchant = _humanize_name(detail[13:].strip())

        upi_id = upi_match.group("upi")
        rows.append(
            {
                "amount": _clean_amount(amount_match.group("amount")),
                "transaction_date": _to_iso_date(lines[i]),
                "merchant": merchant or None,
                "description": detail,
                "source_text": f"{detail} | UPI Transaction ID: {upi_id}",
                "transaction_type": txn_type,
                "category": None,
                "is_academic": False,
                "semester_number": None,
            }
        )
        i += 4

    return rows

