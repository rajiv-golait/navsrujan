from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        case_sensitive=False,
        extra="ignore",
    )

    ENVIRONMENT: str = "development"
    SECRET_KEY: str = "change-me-in-production"

    SUPABASE_URL: str
    SUPABASE_ANON_KEY: str
    SUPABASE_SERVICE_KEY: str

    GROQ_API_KEY: str = ""

    ALLOWED_ORIGINS: list[str] = ["http://localhost:3000"]


settings = Settings()
