# import httpx
# from app.core.config import settings

# class LLMError(Exception):
#     pass

# async def generate_reply(user_question: str, context_text: str) -> str:
#     """
#     Provider switch:
#     - Current: Groq
#     - Future: OpenAI
#     Only change env vars:
#       LLM_PROVIDER, API_KEY, MODEL
#     """

#     provider = settings.llm_provider.lower().strip()

#     if provider == "grok":
#         return await _grok_chat(user_question, context_text)

#     if provider == "openai":
#         # ✅ Future switch: set LLM_PROVIDER=openai + OPENAI_API_KEY + OPENAI_MODEL
#         return await _openai_chat(user_question, context_text)

#     raise LLMError(f"Unknown LLM_PROVIDER: {settings.llm_provider}")

# async def _grok_chat(user_question: str, context_text: str) -> str:
#     if not settings.grok_api_key:
#         raise LLMError("Missing GROK_API_KEY")

#     # xAI Grok API is OpenAI-compatible in many setups, but we keep it explicit.
#     url = "https://api.x.ai/v1/chat/completions"
#     headers = {"Authorization": f"Bearer {settings.grok_api_key}"}

#     system = (
#         "You are a helpful assistant inside a friends group chat. "
#         "Be concise, friendly, and use simple language."
#     )

#     payload = {
#         "model": settings.grok_model,
#         "messages": [
#             {"role": "system", "content": system},
#             {"role": "user", "content": f"Chat context:\n{context_text}\n\nUser question:\n{user_question}"},
#         ],
#         "temperature": 0.4,
#     }

#     async with httpx.AsyncClient(timeout=40) as client:
#         r = await client.post(url, json=payload, headers=headers)
#         if r.status_code >= 400:
#             raise LLMError(f"Grok API error {r.status_code}: {r.text}")

#         data = r.json()
#         try:
#             return data["choices"][0]["message"]["content"].strip()
#         except Exception:
#             raise LLMError("Unexpected Grok response format")

# async def _openai_chat(user_question: str, context_text: str) -> str:
#     if not settings.openai_api_key:
#         raise LLMError("Missing OPENAI_API_KEY")

#     # ✅ Future switch: only env vars change, logic remains same
#     url = "https://api.openai.com/v1/chat/completions"
#     headers = {"Authorization": f"Bearer {settings.openai_api_key}"}

#     system = (
#         "You are a helpful assistant inside a friends group chat. "
#         "Be concise, friendly, and use simple language."
#     )

#     payload = {
#         "model": settings.openai_model,
#         "messages": [
#             {"role": "system", "content": system},
#             {"role": "user", "content": f"Chat context:\n{context_text}\n\nUser question:\n{user_question}"},
#         ],
#         "temperature": 0.4,
#     }

#     async with httpx.AsyncClient(timeout=40) as client:
#         r = await client.post(url, json=payload, headers=headers)
#         if r.status_code >= 400:
#             raise LLMError(f"OpenAI API error {r.status_code}: {r.text}")

#         data = r.json()
#         try:
#             return data["choices"][0]["message"]["content"].strip()
#         except Exception:
#             raise LLMError("Unexpected OpenAI response format")
import httpx
from app.core.config import settings


class LLMError(Exception):
    pass


async def generate_reply(user_question: str, context_text: str) -> str:
    """
    OpenAI-compatible LLM client.

    Current:
      - Groq (console.groq.com)

    Future:
      - OpenAI (just change env vars)

    Only env vars change:
      LLM_PROVIDER
      LLM_BASE_URL
      LLM_API_KEY
      LLM_MODEL
    """

    provider = settings.llm_provider.lower().strip()

    if provider not in {"groq", "openai"}:
        raise LLMError(f"Unsupported LLM_PROVIDER: {settings.llm_provider}")

    if not settings.llm_api_key:
        raise LLMError("Missing LLM_API_KEY")

    url = f"{settings.llm_base_url.rstrip('/')}/chat/completions"

    system_prompt = (
        "You are a helpful AI inside a friends group chat. "
        "Be friendly, concise, and conversational. "
        "You can chat normally, summarize discussions, or explain messages when asked."
    )

    payload = {
        "model": settings.llm_model,
        "messages": [
            {"role": "system", "content": system_prompt},
            {
                "role": "user",
                "content": (
                    f"Chat context (latest messages):\n"
                    f"{context_text}\n\n"
                    f"User message:\n{user_question}"
                ),
            },
        ],
        "temperature": 0.4,
    }

    headers = {
        "Authorization": f"Bearer {settings.llm_api_key}",
        "Content-Type": "application/json",
    }

    async with httpx.AsyncClient(timeout=45) as client:
        r = await client.post(url, json=payload, headers=headers)

        if r.status_code >= 400:
            raise LLMError(
                f"{provider.upper()} API error {r.status_code}: {r.text}"
            )

        data = r.json()

        try:
            return data["choices"][0]["message"]["content"].strip()
        except Exception:
            raise LLMError("Unexpected LLM response format")
