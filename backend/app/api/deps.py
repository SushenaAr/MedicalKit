from typing import Annotated, Any

import jwt
from fastapi import Depends
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session

from app.core.errors import ForbiddenError, UnauthorizedError
from app.core.security import decode_access_token
from app.db.session import get_db
from app.models import User, UserRole
from app.schemas.common import ErrorResponse
from app.services import auth as auth_service

DbSession = Annotated[Session, Depends(get_db)]

# auto_error=False: без заголовка вернём свой ответ 401 с сообщением на русском
_bearer = HTTPBearer(auto_error=False, description="Access-токен из ответа /api/auth/login")


def get_current_user(
    db: DbSession,
    credentials: Annotated[HTTPAuthorizationCredentials | None, Depends(_bearer)],
) -> User:
    """Пользователь из access-токена. Проверяются подпись, срок, активность сессии и сам пользователь."""
    if credentials is None:
        raise UnauthorizedError("Требуется вход в систему", code="not_authenticated")
    try:
        claims = decode_access_token(credentials.credentials)
    except jwt.ExpiredSignatureError:
        raise UnauthorizedError("Срок действия токена истёк", code="token_expired") from None
    except jwt.InvalidTokenError:
        raise UnauthorizedError("Недействительный токен", code="invalid_token") from None

    if not auth_service.is_session_active(db, claims.session_id):
        raise UnauthorizedError("Сессия завершена. Войдите снова", code="session_ended")
    user = db.get(User, claims.user_id)
    if user is None:
        raise UnauthorizedError("Пользователь не найден", code="invalid_token")
    return user


CurrentUser = Annotated[User, Depends(get_current_user)]


def require_admin(user: CurrentUser) -> User:
    if user.role is not UserRole.ADMIN:
        raise ForbiddenError("Недостаточно прав: операция доступна только администратору")
    return user


AdminUser = Annotated[User, Depends(require_admin)]

# Описание ошибок для документации Swagger
NOT_FOUND: dict[int | str, dict[str, Any]] = {404: {"model": ErrorResponse, "description": "Запись не найдена"}}
CONFLICT: dict[int | str, dict[str, Any]] = {409: {"model": ErrorResponse, "description": "Конфликт с текущими данными"}}
UNAUTHORIZED: dict[int | str, dict[str, Any]] = {
    401: {"model": ErrorResponse, "description": "Нет access-токена, он неверный, истёк или сессия завершена"}
}
FORBIDDEN: dict[int | str, dict[str, Any]] = {
    403: {"model": ErrorResponse, "description": "Недостаточно прав"}
}
