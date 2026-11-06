"""Криптография аутентификации: хеши паролей, access-токены (JWT) и refresh-токены."""

import hashlib
import secrets
import uuid
from dataclasses import dataclass
from datetime import UTC, datetime, timedelta

import jwt
from argon2 import PasswordHasher
from argon2.exceptions import InvalidHashError, VerificationError

from app.core.config import settings

# Argon2id — алгоритм, предназначенный для хранения паролей: медленный и требовательный к памяти,
# поэтому перебор по утёкшей базе дорог. Параметры по умолчанию соответствуют рекомендациям RFC 9106.
_password_hasher = PasswordHasher()

# Хеш случайного пароля: проверяется, когда пользователь не найден, чтобы время ответа
# не выдавало, зарегистрирован ли email
_DUMMY_HASH = _password_hasher.hash(secrets.token_urlsafe(16))


def hash_password(password: str) -> str:
    return _password_hasher.hash(password)


def verify_password(password: str, password_hash: str | None) -> bool:
    """Проверка пароля. `None` — пользователь не найден: проверка всё равно выполняется (см. выше)."""
    try:
        _password_hasher.verify(password_hash or _DUMMY_HASH, password)
    except (VerificationError, InvalidHashError):
        return False
    return password_hash is not None


def password_needs_rehash(password_hash: str) -> bool:
    """True, если хеш создан с устаревшими параметрами и его стоит пересчитать при входе."""
    return _password_hasher.check_needs_rehash(password_hash)


# --- Access-токен (JWT) ---

ACCESS_TOKEN_TYPE = "access"


@dataclass(frozen=True)
class AccessTokenClaims:
    user_id: int
    session_id: uuid.UUID


def create_access_token(user_id: int, session_id: uuid.UUID) -> tuple[str, int]:
    """Возвращает JWT и срок его действия в секундах."""
    now = datetime.now(UTC)
    ttl = timedelta(minutes=settings.access_token_ttl_minutes)
    payload = {
        "sub": str(user_id),
        "sid": str(session_id),
        "type": ACCESS_TOKEN_TYPE,
        "iat": now,
        "exp": now + ttl,
    }
    token = jwt.encode(payload, settings.jwt_secret, algorithm=settings.jwt_algorithm)
    return token, int(ttl.total_seconds())


def decode_access_token(token: str) -> AccessTokenClaims:
    """Проверяет подпись, срок действия и тип токена.

    Исключения: jwt.ExpiredSignatureError — срок истёк; jwt.InvalidTokenError — токен неверный.
    """
    payload = jwt.decode(
        token,
        settings.jwt_secret,
        # Явный список алгоритмов защищает от подмены алгоритма в заголовке токена (в т. ч. "none")
        algorithms=[settings.jwt_algorithm],
        options={"require": ["sub", "sid", "exp", "iat", "type"]},
    )
    if payload["type"] != ACCESS_TOKEN_TYPE:
        raise jwt.InvalidTokenError("Неверный тип токена")
    try:
        return AccessTokenClaims(user_id=int(payload["sub"]), session_id=uuid.UUID(payload["sid"]))
    except (TypeError, ValueError) as exc:
        raise jwt.InvalidTokenError("Некорректные данные в токене") from exc


# --- Refresh-токен ---


def generate_refresh_token() -> str:
    """Случайная непрозрачная строка (256 бит). Не JWT: её единственная проверка — поиск в БД."""
    return secrets.token_urlsafe(32)


def hash_refresh_token(token: str) -> str:
    # У токена высокая энтропия, поэтому быстрого SHA-256 достаточно (в отличие от паролей)
    return hashlib.sha256(token.encode()).hexdigest()


def refresh_token_expiry() -> datetime:
    return datetime.now(UTC) + timedelta(days=settings.refresh_token_ttl_days)
