from datetime import date
from typing import Any

from fastapi import APIRouter, Depends

from app.core.security import get_current_user
from app.core.supabase_client import get_user_client
from app.schemas.balance import (
    BalanceResponse,
    PurchaseCheckRequest,
    PurchaseCheckResponse,
    SetBalanceRequest,
)
from app.services.balance_service import compute_balance, compute_purchase_impact

router = APIRouter()


@router.get("", response_model=BalanceResponse)
async def get_balance(
    current_user: dict[str, Any] = Depends(get_current_user),
) -> BalanceResponse:
    client = get_user_client(current_user["jwt"])
    data = compute_balance(client, current_user["id"])
    return BalanceResponse.model_validate(data)


@router.post("/setup", response_model=BalanceResponse)
async def setup_balance(
    body: SetBalanceRequest,
    current_user: dict[str, Any] = Depends(get_current_user),
) -> BalanceResponse:
    client = get_user_client(current_user["jwt"])
    as_of = body.balance_as_of_date or date.today()
    client.table("user_profiles").upsert(
        {
            "id": current_user["id"],
            "starting_balance": body.starting_balance,
            "balance_as_of_date": as_of.isoformat(),
        }
    ).execute()
    data = compute_balance(client, current_user["id"])
    return BalanceResponse.model_validate(data)


@router.post("/purchase-check", response_model=PurchaseCheckResponse)
async def purchase_check(
    body: PurchaseCheckRequest,
    current_user: dict[str, Any] = Depends(get_current_user),
) -> PurchaseCheckResponse:
    client = get_user_client(current_user["jwt"])
    data = compute_purchase_impact(
        client,
        current_user["id"],
        body.amount,
        days_until=body.days_until,
    )
    return PurchaseCheckResponse.model_validate(data)
