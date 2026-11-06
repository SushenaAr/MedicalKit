from functools import lru_cache
from pathlib import Path

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict
from sqlalchemy import URL

BACKEND_DIR = Path(__file__).resolve().parents[2]


class Settings(BaseSettings):
    """Настройки приложения. Значения читаются из переменных окружения и файла backend/.env."""

    model_config = SettingsConfigDict(
        env_file=BACKEND_DIR / ".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    app_name: str = "Домашняя аптечка API"
    debug: bool = False

    postgres_host: str = "localhost"
    postgres_port: int = 5432
    postgres_user: str
    postgres_password: str
    postgres_db: str

    cors_origins: list[str] = ["http://localhost:5173"]

    # Аутентификация
    jwt_secret: str = Field(min_length=32, description="Секрет для подписи access-токенов (HS256)")
    jwt_algorithm: str = "HS256"
    access_token_ttl_minutes: int = Field(15, gt=0)
    refresh_token_ttl_days: int = Field(30, gt=0)
    # Повторное предъявление уже обновлённого refresh-токена в течение этого времени считается
    # гонкой двух вкладок, а не кражей токена, и не завершает сессию
    refresh_reuse_grace_seconds: int = Field(10, ge=0)
    # В production cookie с refresh-токеном должна передаваться только по HTTPS
    refresh_cookie_secure: bool = False

    def database_url(self, database: str | None = None) -> URL:
        return URL.create(
            drivername="postgresql+psycopg",
            username=self.postgres_user,
            password=self.postgres_password,
            host=self.postgres_host,
            port=self.postgres_port,
            database=database or self.postgres_db,
        )


@lru_cache
def get_settings() -> Settings:
    return Settings()  # type: ignore[call-arg]


settings = get_settings()
