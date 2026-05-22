import hashlib
import secrets
from datetime import date, datetime, timedelta
from typing import Any, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, File, Form, HTTPException, Query, UploadFile, status

from app.core.security import get_current_user
from app.core.supabase_client import get_user_client
from app.middleware.rate_limit import enforce_rate_limit
from app.schemas.chat import ParseResult, ParseTextRequest
from app.schemas.import_pdf import (
    PdfImportPreviewResponse,
    PdfImportResponse,
    PdfPreviewRow,
)
from app.schemas.nlp import AddNaturalResponse
from app.schemas.transaction import (
    MonthSummaryResponse,
    TransactionCreate,
    TransactionResponse,
    TransactionUpdate,
)
from app.services import nlp_service
from app.services.transaction_service import TransactionService

VALID_IMPORT_CATEGORIES = {
    "Food",
    "Transport",
    "Entertainment",
    "Shopping",
    "Bills",
    "Education",
    "Health",
    "Other",
    "Academic",
}
MAX_IMPORT_FILE_BYTES = 15 * 1024 * 1024  # 15 MB
PREVIEW_TOKEN_TTL_SECONDS = 10 * 60
_PREVIEW_TOKEN_STORE: dict[str, dict[str, Any]] = {}


def _file_sha256(file_bytes: bytes) -> str:
    return hashlib.sha256(file_bytes).hexdigest()


def _cleanup_preview_tokens() -> None:
    now = datetime.utcnow()
    expired = [
        token
        for token, payload in _PREVIEW_TOKEN_STORE.items()
        if payload.get("expires_at") is None or payload["expires_at"] <= now
    ]
    for token in expired:
        _PREVIEW_TOKEN_STORE.pop(token, None)


def _issue_preview_token(*, user_id: str, parser: str, file_hash: str) -> str:
    _cleanup_preview_tokens()
    token = secrets.token_urlsafe(24)
    _PREVIEW_TOKEN_STORE[token] = {
        "user_id": user_id,
        "parser": parser,
        "file_hash": file_hash,
        "expires_at": datetime.utcnow() + timedelta(seconds=PREVIEW_TOKEN_TTL_SECONDS),
    }
    return token


def _consume_preview_token(*, token: str, user_id: str, parser: str, file_hash: str) -> None:
    _cleanup_preview_tokens()
    payload = _PREVIEW_TOKEN_STORE.pop(token, None)
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired preview token. Generate preview again.",
        )
    if (
        payload.get("user_id") != user_id
        or payload.get("parser") != parser
        or payload.get("file_hash") != file_hash
    ):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Preview token does not match selected file/parser. Generate preview again.",
        )


def _infer_category(description: str | None) -> str:
    if not description:
        return "Other"
    text = description.lower()
    if any(
        word in text
        for word in [
            "food",
            "restaurant",
            "cafe",
            "swiggy",
            "zomato",
            "pan shop",
            "ice cream",
            "snacks",
        ]
    ):
        return "Food"
    if any(
        word in text
        for word in [
            "uber",
            "ola",
            "bus",
            "metro",
            "transport",
            "pmpml",
            "redbus",
            "travel",
        ]
    ):
        return "Transport"
    if any(word in text for word in ["netflix", "movie", "entertainment", "bookmyshow", "game"]):
        return "Entertainment"
    if any(
        word in text
        for word in [
            "shop",
            "traders",
            "store",
            "market",
            "mart",
            "amazon",
            "flipkart",
            "mall",
            "imitation",
            "barber",
        ]
    ):
        return "Shopping"
    if any(word in text for word in ["fee", "college", "book", "tuition", "academic"]):
        return "Academic"
    if any(word in text for word in ["medical", "pharmacy", "hospital", "health"]):
        return "Health"
    if any(word in text for word in ["electricity", "recharge", "bill", "utility"]):
        return "Bills"
    return "Other"


def _sanitize_text(value: Any, max_len: int = 300) -> str | None:
    if value is None:
        return None
    text = str(value).strip()
    if not text:
        return None
    text = " ".join(text.split())
    return text[:max_len]


def _parse_transaction_date(value: Any) -> date | None:
    if value is None:
        return None
    text = str(value).strip()
    if not text:
        return None
    for fmt in (
        "%Y-%m-%d",
        "%d-%m-%Y",
        "%d/%m/%Y",
        "%b %d, %Y",
        "%d %b %Y",
        "%d%b,%Y",
    ):
        try:
            return datetime.strptime(text, fmt).date()
        except ValueError:
            continue
    try:
        return datetime.fromisoformat(text).date()
    except ValueError:
        return None


def _load_parser_rows(parser: str, file_bytes: bytes) -> list[dict[str, Any]]:
    if parser == "phonepe":
        from app.parsers.phonepe_parser import parse_phonepe_pdf

        return parse_phonepe_pdf(file_bytes)
    from app.parsers.gpay_parser import parse_gpay_pdf

    return parse_gpay_pdf(file_bytes)

router = APIRouter()


def get_transaction_service(
    current_user: dict[str, Any] = Depends(get_current_user),
) -> TransactionService:
    client = get_user_client(current_user["jwt"])
    return TransactionService(client, current_user["id"])


@router.get("/", response_model=list[TransactionResponse])
async def list_transactions(
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
    category: Optional[str] = None,
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    service: TransactionService = Depends(get_transaction_service),
) -> list[TransactionResponse]:
    return service.list(
        limit=limit,
        offset=offset,
        category=category,
        start_date=start_date,
        end_date=end_date,
    )


@router.post("/", response_model=TransactionResponse, status_code=status.HTTP_201_CREATED)
async def create_transaction(
    transaction: TransactionCreate,
    service: TransactionService = Depends(get_transaction_service),
) -> TransactionResponse:
    return service.create(transaction)


@router.get("/summary/current-month", response_model=MonthSummaryResponse)
async def get_current_month_summary(
    service: TransactionService = Depends(get_transaction_service),
) -> MonthSummaryResponse:
    return service.summary_this_month()


@router.post("/add-natural", response_model=AddNaturalResponse)
async def add_natural_transaction(
    body: ParseTextRequest,
    current_user: dict[str, Any] = Depends(enforce_rate_limit),
    service: TransactionService = Depends(get_transaction_service),
) -> AddNaturalResponse:
    parsed = await nlp_service.parse_expense_text(body.text)
    
    if parsed.confidence >= 0.7 and parsed.transaction:
        txn_create = TransactionCreate(
            amount=parsed.transaction.amount,
            category=parsed.transaction.category,
            merchant=parsed.transaction.merchant,
            description=parsed.transaction.description,
            transaction_date=parsed.transaction.transaction_date,
            entry_method="nlp",
            source_text=body.text,
            confidence_score=parsed.confidence,
            is_academic=parsed.transaction.is_academic,
            transaction_type="debit",
        )
        saved_txn = service.create(txn_create)
        return AddNaturalResponse(
            status="saved",
            confidence=parsed.confidence,
            transaction=saved_txn,
            message="Transaction saved automatically."
        )
    
    return AddNaturalResponse(
        status="needs_confirmation",
        confidence=parsed.confidence,
        parsed_data=parsed.transaction.model_dump(mode="json") if parsed.transaction else None,
        message="Confidence too low. Please confirm the details."
    )

@router.post("/parse", response_model=ParseResult)
async def parse_transaction_text(
    body: ParseTextRequest,
    current_user: dict[str, Any] = Depends(enforce_rate_limit),
) -> ParseResult:
    return await nlp_service.parse_expense_text(body.text)


@router.post("/import-pdf", response_model=PdfImportResponse)
async def import_transactions_pdf(
    parser_type: str = Form(...),
    preview_token: str = Form(...),
    file: UploadFile = File(...),
    service: TransactionService = Depends(get_transaction_service),
) -> PdfImportResponse:
    parser = parser_type.lower().strip()
    if parser not in {"phonepe", "gpay"}:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="parser_type must be one of: phonepe, gpay",
        )
    if not file.filename.lower().endswith(".pdf"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only PDF files are supported.",
        )

    file_bytes = await file.read()
    if not file_bytes:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Uploaded file is empty.",
        )
    if len(file_bytes) > MAX_IMPORT_FILE_BYTES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="PDF too large. Maximum allowed size is 15 MB.",
        )
    _consume_preview_token(
        token=preview_token.strip(),
        user_id=service.user_id,
        parser=parser,
        file_hash=_file_sha256(file_bytes),
    )

    rows = _load_parser_rows(parser, file_bytes)

    imported_count = 0
    skipped_rows: list[dict[str, Any]] = []
    seen_signatures: set[tuple[str, float, str, str]] = set()

    for idx, row in enumerate(rows):
        try:
            txn_type = str(row.get("transaction_type", "debit")).lower()
            normalized_type = (
                "credit" if txn_type in {"credit", "received", "in"} else "debit"
            )

            amount = float(row.get("amount", 0))
            if amount <= 0:
                skipped_rows.append({"row": idx, "reason": "invalid_amount"})
                continue

            merchant = _sanitize_text(row.get("merchant"), max_len=120)
            description = _sanitize_text(row.get("description"), max_len=250)
            source_text = _sanitize_text(
                row.get("source_text") or description or merchant,
                max_len=1000,
            )

            raw_category = row.get("category")
            category = (
                raw_category
                if isinstance(raw_category, str) and raw_category in VALID_IMPORT_CATEGORIES
                else _infer_category(description or merchant)
            )
            transaction_date = row.get("transaction_date")
            if not transaction_date:
                skipped_rows.append({"row": idx, "reason": "missing_transaction_date"})
                continue
            normalized_date = _parse_transaction_date(transaction_date)
            if not normalized_date:
                skipped_rows.append({"row": idx, "reason": "invalid_transaction_date"})
                continue

            signature = (
                normalized_date.isoformat(),
                round(amount, 2),
                (merchant or "").lower(),
                (source_text or "").lower(),
            )
            if signature in seen_signatures:
                skipped_rows.append({"row": idx, "reason": "duplicate_in_file"})
                continue
            seen_signatures.add(signature)

            if service.exists_import_duplicate(
                transaction_date=normalized_date,
                amount=amount,
                merchant=merchant,
                source_text=source_text,
                transaction_type=normalized_type,
            ):
                skipped_rows.append({"row": idx, "reason": "duplicate_in_database"})
                continue

            payload = TransactionCreate(
                amount=amount,
                category=category,
                merchant=merchant,
                description=description,
                transaction_date=normalized_date,
                entry_method="import",
                source_text=source_text,
                is_academic=bool(row.get("is_academic", False)),
                semester_number=row.get("semester_number"),
                transaction_type=normalized_type,
            )
            service.create(payload)
            imported_count += 1
        except Exception as exc:  # noqa: BLE001
            skipped_rows.append({"row": idx, "reason": str(exc)})

    return PdfImportResponse(
        parser=parser,  # type: ignore[arg-type]
        imported_count=imported_count,
        skipped_count=len(skipped_rows),
        skipped_rows=skipped_rows[:50],
        message=f"Imported {imported_count} transactions.",
    )


@router.post("/import-pdf/preview", response_model=PdfImportPreviewResponse)
async def preview_transactions_pdf_import(
    parser_type: str = Form(...),
    file: UploadFile = File(...),
    service: TransactionService = Depends(get_transaction_service),
) -> PdfImportPreviewResponse:
    parser = parser_type.lower().strip()
    if parser not in {"phonepe", "gpay"}:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="parser_type must be one of: phonepe, gpay",
        )
    if not file.filename.lower().endswith(".pdf"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only PDF files are supported.",
        )

    file_bytes = await file.read()
    if not file_bytes:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Uploaded file is empty.",
        )
    if len(file_bytes) > MAX_IMPORT_FILE_BYTES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="PDF too large. Maximum allowed size is 15 MB.",
        )

    rows = _load_parser_rows(parser, file_bytes)
    preview_token = _issue_preview_token(
        user_id=service.user_id,
        parser=parser,
        file_hash=_file_sha256(file_bytes),
    )
    skipped_rows: list[dict[str, Any]] = []
    preview_rows: list[PdfPreviewRow] = []
    seen_signatures: set[tuple[str, float, str, str]] = set()
    eligible_rows = 0
    would_import = 0

    for idx, row in enumerate(rows):
        skip_reason: str | None = None
        merchant = _sanitize_text(row.get("merchant"), max_len=120)
        description = _sanitize_text(row.get("description"), max_len=250)
        source_text = _sanitize_text(
            row.get("source_text") or description or merchant,
            max_len=1000,
        )
        amount = float(row.get("amount", 0) or 0)
        category = _infer_category(description or merchant)
        tx_date = str(row.get("transaction_date") or "")
        normalized_date = _parse_transaction_date(tx_date)

        txn_type = str(row.get("transaction_type", "debit")).lower()
        normalized_type = "credit" if txn_type in {"credit", "received", "in"} else "debit"
        if amount <= 0:
            skip_reason = "invalid_amount"
        elif not tx_date:
            skip_reason = "missing_transaction_date"
        elif not normalized_date:
            skip_reason = "invalid_transaction_date"
        else:
            signature = (
                normalized_date.isoformat(),
                round(amount, 2),
                (merchant or "").lower(),
                (source_text or "").lower(),
            )
            if signature in seen_signatures:
                skip_reason = "duplicate_in_file"
            else:
                seen_signatures.add(signature)
                eligible_rows += 1
                if service.exists_import_duplicate(
                    transaction_date=normalized_date,
                    amount=amount,
                    merchant=merchant,
                    source_text=source_text,
                    transaction_type=normalized_type,
                ):
                    skip_reason = "duplicate_in_database"
                else:
                    would_import += 1

        if skip_reason:
            skipped_rows.append({"row": idx, "reason": skip_reason})

        if len(preview_rows) < 25:
            preview_rows.append(
                PdfPreviewRow(
                    transaction_date=normalized_date.isoformat() if normalized_date else (tx_date or ""),
                    amount=round(amount, 2),
                    transaction_type=normalized_type,  # type: ignore[arg-type]
                    category=category,
                    merchant=merchant,
                    description=description,
                    skip_reason=skip_reason,
                )
            )

    return PdfImportPreviewResponse(
        parser=parser,  # type: ignore[arg-type]
        total_rows=len(rows),
        eligible_rows=eligible_rows,
        would_import_count=would_import,
        would_skip_count=len(rows) - would_import,
        preview_token=preview_token,
        preview_rows=preview_rows,
        skipped_rows=skipped_rows[:100],
        message=f"Preview ready: {would_import} would import, {len(rows) - would_import} would skip.",
    )


@router.get("/{transaction_id}", response_model=TransactionResponse)
async def get_transaction(
    transaction_id: UUID,
    service: TransactionService = Depends(get_transaction_service),
) -> TransactionResponse:
    return service.get(transaction_id)


@router.patch("/{transaction_id}", response_model=TransactionResponse)
async def update_transaction(
    transaction_id: UUID,
    transaction: TransactionUpdate,
    service: TransactionService = Depends(get_transaction_service),
) -> TransactionResponse:
    return service.update(transaction_id, transaction)


@router.delete("/{transaction_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_transaction(
    transaction_id: UUID,
    service: TransactionService = Depends(get_transaction_service),
) -> None:
    service.delete(transaction_id)
