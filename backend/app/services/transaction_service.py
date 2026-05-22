from datetime import date
from decimal import Decimal
from typing import Any, Optional
from uuid import UUID

from fastapi import HTTPException, status
from supabase import Client

from app.schemas.transaction import (
    CategorySummary,
    MonthSummaryResponse,
    TransactionCreate,
    TransactionResponse,
    TransactionUpdate,
)


class TransactionService:
    def __init__(self, client: Client, user_id: str):
        self.client = client
        self.user_id = user_id
        self.table = "transactions"
        self._supports_transaction_type: Optional[bool] = None

    def _to_response(self, row: dict[str, Any]) -> TransactionResponse:
        return TransactionResponse.model_validate(row)

    def list(
        self,
        limit: int = 50,
        offset: int = 0,
        category: Optional[str] = None,
        start_date: Optional[date] = None,
        end_date: Optional[date] = None,
    ) -> list[TransactionResponse]:
        query = (
            self.client.table(self.table)
            .select("*")
            .eq("user_id", self.user_id)
            .order("transaction_date", desc=True)
            .order("created_at", desc=True)
        )

        if category:
            query = query.eq("category", category)
        if start_date:
            query = query.gte("transaction_date", start_date.isoformat())
        if end_date:
            query = query.lte("transaction_date", end_date.isoformat())

        response = query.range(offset, offset + limit - 1).execute()
        return [self._to_response(row) for row in response.data or []]

    def get(self, transaction_id: UUID) -> TransactionResponse:
        response = (
            self.client.table(self.table)
            .select("*")
            .eq("id", str(transaction_id))
            .eq("user_id", self.user_id)
            .maybe_single()
            .execute()
        )

        if not response.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Transaction not found",
            )

        return self._to_response(response.data)

    def create(self, data: TransactionCreate) -> TransactionResponse:
        payload = {"user_id": self.user_id, **data.model_dump(mode="json")}
        supports_txn_type = self.supports_transaction_type()
        txn_type = str(payload.get("transaction_type") or "debit").lower()
        if not supports_txn_type:
            if txn_type == "credit":
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Credit transactions require transaction_type column in database. Apply latest schema and retry.",
                )
            payload.pop("transaction_type", None)

        response = self.client.table(self.table).insert(payload).execute()

        if not response.data:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to create transaction",
            )

        return self._to_response(response.data[0])

    def supports_transaction_type(self) -> bool:
        if self._supports_transaction_type is not None:
            return self._supports_transaction_type
        try:
            self.client.table(self.table).select("transaction_type").limit(1).execute()
            self._supports_transaction_type = True
        except Exception:  # noqa: BLE001
            self._supports_transaction_type = False
        return self._supports_transaction_type

    def exists_import_duplicate(
        self,
        *,
        transaction_date: date,
        amount: float,
        merchant: Optional[str],
        source_text: Optional[str],
        transaction_type: str = "debit",
    ) -> bool:
        """
        Best-effort duplicate detection for imports.
        Matches same user + date + amount, then:
        1) Prefer exact source_text match when source text exists.
        2) Fallback to merchant-only match only when both sides have no source_text.

        This reduces false positives for legitimate repeated spends
        (same merchant + same amount + same day but different transaction IDs).
        """
        amount_str = f"{amount:.2f}"
        base_query = (
            self.client.table(self.table)
            .select("id, merchant, source_text")
            .eq("user_id", self.user_id)
            .eq("transaction_date", transaction_date.isoformat())
            .eq("amount", amount_str)
            .limit(30)
        )
        if self.supports_transaction_type():
            base_query = base_query.eq("transaction_type", transaction_type)
        response = base_query.execute()
        rows = response.data or []
        if not rows:
            return False

        merchant_norm = (merchant or "").strip().lower()
        source_norm = (source_text or "").strip().lower()
        for row in rows:
            row_merchant = str(row.get("merchant") or "").strip().lower()
            row_source = str(row.get("source_text") or "").strip().lower()
            if source_norm and row_source and source_norm == row_source:
                return True
            if (
                not source_norm
                and not row_source
                and merchant_norm
                and row_merchant
                and merchant_norm == row_merchant
            ):
                return True
        return False

    def update(
        self, transaction_id: UUID, data: TransactionUpdate
    ) -> TransactionResponse:
        self.get(transaction_id)

        update_data = data.model_dump(mode="json", exclude_unset=True)
        if not update_data:
            return self.get(transaction_id)

        response = (
            self.client.table(self.table)
            .update(update_data)
            .eq("id", str(transaction_id))
            .eq("user_id", self.user_id)
            .execute()
        )

        if not response.data:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to update transaction",
            )

        return self._to_response(response.data[0])

    def delete(self, transaction_id: UUID) -> None:
        self.get(transaction_id)

        self.client.table(self.table).delete().eq(
            "id", str(transaction_id)
        ).eq("user_id", self.user_id).execute()

    def summary_this_month(self) -> MonthSummaryResponse:
        today = date.today()
        start = today.replace(day=1)
        transactions = self.list(
            limit=1000,
            start_date=start,
            end_date=today,
        )

        category_totals: dict[str, dict[str, Any]] = {}
        total_spent = Decimal("0")

        for txn in transactions:
            if getattr(txn, "transaction_type", "debit") != "debit":
                continue
            total_spent += txn.amount
            if txn.category not in category_totals:
                category_totals[txn.category] = {
                    "total": Decimal("0"),
                    "count": 0,
                }
            category_totals[txn.category]["total"] += txn.amount
            category_totals[txn.category]["count"] += 1

        categories = [
            CategorySummary(
                category=cat,
                total=info["total"],
                count=info["count"],
            )
            for cat, info in sorted(
                category_totals.items(),
                key=lambda item: item[1]["total"],
                reverse=True,
            )
        ]

        return MonthSummaryResponse(
            month=start.strftime("%Y-%m"),
            total_spent=total_spent,
            transaction_count=len(transactions),
            categories=categories,
        )
