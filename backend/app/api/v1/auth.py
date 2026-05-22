from typing import Any

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, EmailStr

from app.core.security import get_current_user
from app.core.supabase_client import get_admin_client, get_user_client
from app.schemas.user import UserProfileResponse

router = APIRouter()


def _session_to_dict(session: Any) -> dict[str, Any]:
    return {
        "access_token": session.access_token,
        "refresh_token": session.refresh_token,
        "expires_in": session.expires_in,
        "token_type": getattr(session, "token_type", None) or "bearer",
    }


class SignupRequest(BaseModel):
    email: EmailStr
    password: str
    full_name: str


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class AuthResponse(BaseModel):
    user: dict[str, Any]
    session: dict[str, Any] | None = None


@router.post("/signup", response_model=AuthResponse)
async def signup(request: SignupRequest) -> AuthResponse:
    admin = get_admin_client()

    try:
        auth_response = admin.auth.sign_up(
            {
                "email": request.email,
                "password": request.password,
            }
        )

        if not auth_response.user:
            raise HTTPException(status_code=400, detail="Signup failed")

        user_id = str(auth_response.user.id)

        admin.table("user_profiles").insert(
            {
                "id": user_id,
                "full_name": request.full_name,
            }
        ).execute()

        return AuthResponse(
            user={
                "id": user_id,
                "email": auth_response.user.email,
                "full_name": request.full_name,
            },
            session=(
                _session_to_dict(auth_response.session)
                if auth_response.session
                else None
            ),
        )
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@router.post("/login", response_model=AuthResponse)
async def login(request: LoginRequest) -> AuthResponse:
    admin = get_admin_client()

    try:
        auth_response = admin.auth.sign_in_with_password(
            {
                "email": request.email,
                "password": request.password,
            }
        )

        if not auth_response.user or not auth_response.session:
            raise HTTPException(status_code=401, detail="Invalid credentials")

        return AuthResponse(
            user={
                "id": str(auth_response.user.id),
                "email": auth_response.user.email,
            },
            session=_session_to_dict(auth_response.session),
        )
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=401, detail="Invalid credentials") from exc


@router.get("/me", response_model=UserProfileResponse)
async def get_me(
    current_user: dict[str, Any] = Depends(get_current_user),
) -> UserProfileResponse:
    client = get_user_client(current_user["jwt"])
    response = (
        client.table("user_profiles")
        .select("*")
        .eq("id", current_user["id"])
        .maybe_single()
        .execute()
    )

    if not response.data:
        raise HTTPException(status_code=404, detail="Profile not found")

    return UserProfileResponse.model_validate(response.data)
