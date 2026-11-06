from datetime import datetime
from typing import Literal

from email_validator import EmailNotValidError, validate_email
from pydantic import ConfigDict, Field, field_validator

from app.models.enums import UserRole
from app.schemas.common import InputSchema, OutputSchema

PASSWORD_MIN_LENGTH = 8
PASSWORD_MAX_LENGTH = 128


def _normalize_email(value: object) -> object:
    return value.strip().lower() if isinstance(value, str) else value


class AuthInputSchema(InputSchema):
    # Пароль сохраняется как есть: пробелы по краям — часть пароля, обрезать их нельзя
    model_config = ConfigDict(extra="forbid", str_strip_whitespace=False)


class RegisterRequest(AuthInputSchema):
    email: str = Field(max_length=254, examples=["anna@example.com"])
    name: str = Field(min_length=1, max_length=100, examples=["Анна"])
    password: str = Field(
        min_length=PASSWORD_MIN_LENGTH,
        max_length=PASSWORD_MAX_LENGTH,
        description="Не короче 8 символов, хотя бы одна буква и одна цифра",
        examples=["Secret123"],
    )

    _email = field_validator("email", mode="before")(_normalize_email)

    @field_validator("email")
    @classmethod
    def _valid_email(cls, value: str) -> str:
        try:
            # Только проверка формата, без DNS-запросов к домену
            return validate_email(value, check_deliverability=False).normalized.lower()
        except EmailNotValidError as exc:
            raise ValueError("Некорректный email") from exc

    @field_validator("name")
    @classmethod
    def _strip_name(cls, value: str) -> str:
        value = value.strip()
        if not value:
            raise ValueError("Укажите имя")
        return value

    @field_validator("password")
    @classmethod
    def _password_strength(cls, value: str) -> str:
        if not any(ch.isalpha() for ch in value) or not any(ch.isdigit() for ch in value):
            raise ValueError("Пароль должен содержать хотя бы одну букву и одну цифру")
        return value


class LoginRequest(AuthInputSchema):
    # При входе формат не проверяется строго: на любой неверный ввод — один ответ «неверный email или пароль»
    email: str = Field(min_length=1, max_length=254, examples=["anna@example.com"])
    password: str = Field(min_length=1, max_length=PASSWORD_MAX_LENGTH, examples=["Secret123"])

    _email = field_validator("email", mode="before")(_normalize_email)


class UserRead(OutputSchema):
    id: int
    email: str
    name: str
    role: UserRole
    created_at: datetime


class TokenResponse(OutputSchema):
    """Access-токен в теле ответа; refresh-токен приходит в httpOnly-cookie и в JS недоступен."""

    access_token: str
    token_type: Literal["bearer"] = "bearer"
    expires_in: int = Field(description="Срок действия access-токена, секунд")
    user: UserRead
