"""Регистрация, вход, обновление токенов и выход.

Сессия — это цепочка refresh-токенов с общим session_id. При каждом обновлении старый токен
отзывается и заменяется новым (ротация). Если отозванный в результате ротации токен предъявлен
повторно, значит, им воспользовался кто-то ещё: сессия завершается целиком.
"""

import uuid
from dataclasses import dataclass
from datetime import UTC, datetime, timedelta

from sqlalchemy import func, select, update
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.errors import ConflictError, UnauthorizedError
from app.core.security import (
    create_access_token,
    generate_refresh_token,
    hash_password,
    hash_refresh_token,
    password_needs_rehash,
    refresh_token_expiry,
    verify_password,
)
from app.models import RefreshToken, User
from app.schemas.auth import LoginRequest, RegisterRequest

INVALID_CREDENTIALS = "Неверный email или пароль"
SESSION_NOT_FOUND = "Сессия не найдена. Войдите снова"
SESSION_EXPIRED = "Сессия истекла. Войдите снова"
SESSION_ENDED = "Сессия завершена. Войдите снова"
SESSION_COMPROMISED = "Сессия завершена: токен обновления был использован повторно. Войдите снова"
TOKEN_ALREADY_ROTATED = "Токен обновления уже использован. Повторите запрос"


@dataclass(frozen=True)
class IssuedTokens:
    user: User
    access_token: str
    expires_in: int
    refresh_token: str
    refresh_expires_at: datetime


def _now() -> datetime:
    return datetime.now(UTC)


def _new_refresh_token(db: Session, user: User, session_id: uuid.UUID) -> tuple[RefreshToken, str]:
    plain = generate_refresh_token()
    record = RefreshToken(
        user_id=user.id,
        session_id=session_id,
        token_hash=hash_refresh_token(plain),
        expires_at=refresh_token_expiry(),
    )
    db.add(record)
    db.flush()
    return record, plain


def _issue(user: User, record: RefreshToken, plain_refresh: str) -> IssuedTokens:
    access_token, expires_in = create_access_token(user.id, record.session_id)
    return IssuedTokens(
        user=user,
        access_token=access_token,
        expires_in=expires_in,
        refresh_token=plain_refresh,
        refresh_expires_at=record.expires_at,
    )


def _revoke_session(db: Session, session_id: uuid.UUID) -> None:
    db.execute(
        update(RefreshToken)
        .where(RefreshToken.session_id == session_id, RefreshToken.revoked_at.is_(None))
        .values(revoked_at=_now())
    )


def get_user_by_email(db: Session, email: str) -> User | None:
    return db.scalar(select(User).where(User.email == email.lower()))


def register(db: Session, data: RegisterRequest) -> IssuedTokens:
    """Создаёт пользователя и сразу открывает для него сессию."""
    if get_user_by_email(db, data.email) is not None:
        raise ConflictError("Пользователь с таким email уже зарегистрирован")
    user = User(email=data.email, name=data.name, password_hash=hash_password(data.password))
    db.add(user)
    db.flush()
    record, plain = _new_refresh_token(db, user, uuid.uuid4())
    db.commit()
    return _issue(user, record, plain)


def login(db: Session, data: LoginRequest) -> IssuedTokens:
    user = get_user_by_email(db, data.email)
    # Пароль проверяется и для несуществующего пользователя (с фиктивным хешем), а ответ один и тот же,
    # чтобы по ответу или времени нельзя было узнать, зарегистрирован ли email
    if not verify_password(data.password, user.password_hash if user else None) or user is None:
        raise UnauthorizedError(INVALID_CREDENTIALS)
    if password_needs_rehash(user.password_hash):
        user.password_hash = hash_password(data.password)
    record, plain = _new_refresh_token(db, user, uuid.uuid4())
    db.commit()
    return _issue(user, record, plain)


def refresh(db: Session, refresh_token: str | None) -> IssuedTokens:
    """Выдаёт новый access-токен и заменяет refresh-токен новым (ротация)."""
    if not refresh_token:
        raise UnauthorizedError(SESSION_NOT_FOUND)

    # Блокировка строки: два одновременных запроса с одним токеном не смогут оба его обменять
    record = db.scalar(
        select(RefreshToken)
        .where(RefreshToken.token_hash == hash_refresh_token(refresh_token))
        .with_for_update()
    )
    if record is None:
        raise UnauthorizedError(SESSION_NOT_FOUND)

    now = _now()
    if record.revoked_at is not None:
        if record.replaced_by_id is None:
            # Отозван при выходе
            raise UnauthorizedError(SESSION_ENDED)
        grace = timedelta(seconds=settings.refresh_reuse_grace_seconds)
        if now - record.revoked_at <= grace:
            # Скорее всего, две вкладки обновили токен одновременно: новый токен уже в cookie
            raise UnauthorizedError(TOKEN_ALREADY_ROTATED, code="refresh_token_rotated")
        # Старый токен предъявлен повторно — возможна кража: завершаем всю сессию
        _revoke_session(db, record.session_id)
        db.commit()
        raise UnauthorizedError(SESSION_COMPROMISED)

    if record.expires_at <= now:
        raise UnauthorizedError(SESSION_EXPIRED)

    user = db.get(User, record.user_id)
    if user is None:
        raise UnauthorizedError(SESSION_NOT_FOUND)

    new_record, plain = _new_refresh_token(db, user, record.session_id)
    record.revoked_at = now
    record.replaced_by_id = new_record.id
    db.commit()
    return _issue(user, new_record, plain)


def logout(db: Session, refresh_token: str | None) -> None:
    """Отзывает все refresh-токены текущей сессии. Повторный выход не считается ошибкой."""
    if not refresh_token:
        return
    record = db.scalar(
        select(RefreshToken).where(RefreshToken.token_hash == hash_refresh_token(refresh_token))
    )
    if record is not None:
        _revoke_session(db, record.session_id)
        db.commit()


def is_session_active(db: Session, session_id: uuid.UUID) -> bool:
    """Есть ли у сессии действующий refresh-токен. После выхода access-токены сессии перестают работать."""
    count = db.scalar(
        select(func.count())
        .select_from(RefreshToken)
        .where(
            RefreshToken.session_id == session_id,
            RefreshToken.revoked_at.is_(None),
            RefreshToken.expires_at > _now(),
        )
    )
    return bool(count)
