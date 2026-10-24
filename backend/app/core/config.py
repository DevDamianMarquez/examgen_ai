"""
Configuración central de la aplicación.
Carga variables de entorno y expone settings tipados.
"""
from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    # Base
    APP_ENV: str = "development"
    CORS_ORIGINS: str = "http://localhost:5173"

    # Database
    DATABASE_URL: str

    # JWT
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440

    # LLM provider (any OpenAI-compatible API; defaults target Groq)
    GROQ_API_KEY: str
    LLM_MODEL: str
    LLM_BASE_URL: str = "https://api.groq.com/openai/v1"
    # Embeddings are optional: the provider must expose an embeddings endpoint.
    OPENAI_EMBEDDING_MODEL: str = "text-embedding-3-small"

    @property
    def cors_origins_list(self) -> list[str]:
        return [o.strip() for o in self.CORS_ORIGINS.split(",")]

    class Config:
        env_file = ".env"
        case_sensitive = True


@lru_cache()
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
