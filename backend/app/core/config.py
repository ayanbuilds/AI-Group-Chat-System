# from pydantic import BaseModel
# from dotenv import load_dotenv
# import os

# load_dotenv()

# class Settings(BaseModel):
#     app_env: str = os.getenv("APP_ENV", "dev")

#     llm_provider: str = os.getenv("LLM_PROVIDER", "grok")  # grok | openai

#     grok_api_key: str = os.getenv("GROK_API_KEY", "")
#     grok_model: str = os.getenv("GROK_MODEL", "grok-2-latest")

#     openai_api_key: str = os.getenv("OPENAI_API_KEY", "")
#     openai_model: str = os.getenv("OPENAI_MODEL", "gpt-4o-mini")

#     supabase_url: str = os.getenv("SUPABASE_URL", "")
#     supabase_service_role_key: str = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "")

#     ai_user_id: str = os.getenv("AI_USER_ID", "00000000-0000-0000-0000-000000000001")

# settings = Settings()

from pydantic import BaseModel
from dotenv import load_dotenv
import os

load_dotenv()


class Settings(BaseModel):
    # -------------------- App --------------------
    app_env: str = os.getenv("APP_ENV", "dev")

    # -------------------- LLM Provider --------------------
    # allowed values: "groq" | "openai"
    llm_provider: str = os.getenv("LLM_PROVIDER", "groq").lower()

    # Common (OpenAI-compatible) settings
    llm_api_key: str = os.getenv("LLM_API_KEY", "")
    llm_model: str = os.getenv("LLM_MODEL", "llama-3.3-70b-versatile")

    # Base URL (provider specific but OpenAI-compatible)
    # Groq:    https://api.groq.com/openai/v1
    # OpenAI:  https://api.openai.com/v1
    llm_base_url: str = os.getenv(
        "LLM_BASE_URL",
        "https://api.groq.com/openai/v1",
    )

    # -------------------- Supabase --------------------
    supabase_url: str = os.getenv("SUPABASE_URL", "")
    supabase_service_role_key: str = os.getenv(
        "SUPABASE_SERVICE_ROLE_KEY", ""
    )

    # -------------------- AI User --------------------
    # Fixed UUID used when AI sends messages to group
    ai_user_id: str = os.getenv(
        "AI_USER_ID",
        "00000000-0000-0000-0000-000000000001",
    )

    # JSON dataset for school fee feature
    school_data_path: str = os.getenv("SCHOOL_DATA_PATH", "app/data/school_data.json")



settings = Settings()
