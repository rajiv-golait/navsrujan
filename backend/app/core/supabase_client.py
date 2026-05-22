from functools import lru_cache

from supabase import Client, create_client

from app.core.config import settings


@lru_cache
def get_admin_client() -> Client:
    """Service-role client for JWT validation and admin operations."""
    return create_client(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_KEY)


def get_user_client(jwt: str) -> Client:
    """User-scoped client so RLS policies apply to all data operations."""
    client = create_client(settings.SUPABASE_URL, settings.SUPABASE_ANON_KEY)
    client.postgrest.auth(jwt)
    return client
