from typing import Any, Literal

from pydantic import BaseModel


class PdfImportResponse(BaseModel):
    parser: Literal["phonepe", "gpay"]
    imported_count: int
    skipped_count: int
    skipped_rows: list[dict[str, Any]] = []
    message: str


class PdfPreviewRow(BaseModel):
    transaction_date: str
    amount: float
    transaction_type: Literal["debit", "credit"] = "debit"
    category: str
    merchant: str | None = None
    description: str | None = None
    skip_reason: str | None = None


class PdfImportPreviewResponse(BaseModel):
    parser: Literal["phonepe", "gpay"]
    total_rows: int
    eligible_rows: int
    would_import_count: int
    would_skip_count: int
    preview_token: str
    preview_rows: list[PdfPreviewRow]
    skipped_rows: list[dict[str, Any]] = []
    message: str

