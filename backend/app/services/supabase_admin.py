# import httpx
# from app.core.config import settings

# class SupabaseAdminError(Exception):
#     pass

# async def insert_ai_message(group_id: str, content: str) -> None:
#     """
#     Inserts an AI message using Supabase service role (bypasses RLS).
#     """
#     if not settings.supabase_url or not settings.supabase_service_role_key:
#         raise SupabaseAdminError("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY")

#     url = f"{settings.supabase_url}/rest/v1/messages"
#     headers = {
#         "apikey": settings.supabase_service_role_key,
#         "Authorization": f"Bearer {settings.supabase_service_role_key}",
#         "Content-Type": "application/json",
#         "Prefer": "return=minimal",
#     }

#     payload = {
#         "group_id": group_id,
#         # "sender_id": settings.ai_user_id,
#         "sender_id": None,
#         "role": "ai",
#         "content": content,
#     }

#     async with httpx.AsyncClient(timeout=20) as client:
#         r = await client.post(url, json=payload, headers=headers)
#         if r.status_code >= 400:
#             raise SupabaseAdminError(f"Insert AI message failed {r.status_code}: {r.text}")

import httpx
from app.core.config import settings


class SupabaseAdminError(Exception):
    pass


async def insert_ai_message(group_id: str, content: str) -> None:
    """
    Inserts an AI message using Supabase service role (bypasses RLS).
    AI is not a real auth.users row, so sender_id MUST be null.
    """
    if not settings.supabase_url or not settings.supabase_service_role_key:
        raise SupabaseAdminError("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY")

    url = f"{settings.supabase_url.rstrip('/')}/rest/v1/messages"
    headers = {
        "apikey": settings.supabase_service_role_key,
        "Authorization": f"Bearer {settings.supabase_service_role_key}",
        "Content-Type": "application/json",
        "Prefer": "return=minimal",
    }

    payload = {
        "group_id": group_id,
        "sender_id": None,  # ✅ important
        "role": "ai",
        "content": content,
    }

    async with httpx.AsyncClient(timeout=20) as client:
        r = await client.post(url, json=payload, headers=headers)
        if r.status_code >= 400:
            raise SupabaseAdminError(f"Insert AI message failed {r.status_code}: {r.text}")
