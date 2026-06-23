from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import Field
from typing import Optional

class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )

    supabase_url: str = Field(..., validation_alias="SUPABASE_URL")
    supabase_anon_key: str = Field(..., validation_alias="SUPABASE_ANON_KEY")
    supabase_service_role_key: str = Field(..., validation_alias="SUPABASE_SERVICE_ROLE_KEY")
    github_actions_webhook_secret: str = Field("test-webhook-secret", validation_alias="GITHUB_ACTIONS_WEBHOOK_SECRET")
    
    # Optional API keys for other features
    groq_api_key: Optional[str] = Field(None, validation_alias="GROQ_API_KEY")
    google_ai_studio_api_key: Optional[str] = Field(None, validation_alias="GOOGLE_AI_STUDIO_API_KEY")

# Create a single global settings instance
settings = Settings()
