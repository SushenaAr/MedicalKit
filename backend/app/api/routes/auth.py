from typing import Annotated

from fastapi import APIRouter, Cookie, Response, status
from fastapi.responses import JSONResponse

from app.api.deps import CONFLICT, UNAUTHORIZED, CurrentUser, DbSession
from app.core.config import settings
from app.core.errors import UnauthorizedError
from app.schemas.auth import LoginRequest, RegisterRequest, TokenResponse, UserRead
from app.services import auth as service
from app.services.auth import IssuedTokens

router = APIRouter(prefix="/auth", tags=["Аутентификация"])

REFRESH_COOKIE = "refresh_token"
# Cookie отправляется браузером только на эндпоинты аутентификации, а не с каждым запросом к API
REFRESH_COOKIE_PATH = "/api/auth"


def _set_refresh_cookie(response: Response, tokens: IssuedTokens) -> None:
    response.set_cookie(
        key=REFRESH_COOKIE,
        value=tokens.refresh_token,
        max_age=settings.refresh_token_ttl_days * 24 * 60 * 60,
        path=REFRESH_COOKIE_PATH,
        # httponly — токен недоступен из JavaScript (защита от кражи через XSS);
        # samesite=lax — браузер не отправит cookie с POST-запросом с чужого сайта (защита от CSRF)
        httponly=True,
        samesite="lax",
        secure=settings.refresh_cookie_secure,
    )


def _clear_refresh_cookie(response: Response) -> None:
    response.delete_cookie(
        key=REFRESH_COOKIE,
        path=REFRESH_COOKIE_PATH,
        httponly=True,
        samesite="lax",
        secure=settings.refresh_cookie_secure,
    )


def _token_response(response: Response, tokens: IssuedTokens) -> TokenResponse:
    _set_refresh_cookie(response, tokens)
    # Токены нельзя кешировать ни браузеру, ни прокси
    response.headers["Cache-Control"] = "no-store"
    return TokenResponse(
        access_token=tokens.access_token,
        expires_in=tokens.expires_in,
        user=UserRead.model_validate(tokens.user),
    )


RefreshCookie = Annotated[str | None, Cookie(alias=REFRESH_COOKIE, include_in_schema=False)]


@router.post(
    "/register",
    response_model=TokenResponse,
    status_code=status.HTTP_201_CREATED,
    responses=CONFLICT,
    summary="Регистрация",
    description="Создаёт пользователя и сразу выполняет вход. Refresh-токен ставится в httpOnly-cookie.",
)
def register(data: RegisterRequest, response: Response, db: DbSession):
    return _token_response(response, service.register(db, data))


@router.post(
    "/login",
    response_model=TokenResponse,
    responses=UNAUTHORIZED,
    summary="Вход",
    description="Возвращает access-токен (JWT) и ставит refresh-токен в httpOnly-cookie.",
)
def login(data: LoginRequest, response: Response, db: DbSession):
    return _token_response(response, service.login(db, data))


@router.post(
    "/refresh",
    response_model=TokenResponse,
    responses=UNAUTHORIZED,
    summary="Обновить access-токен",
    description=(
        "Обменивает refresh-токен из cookie на новый access-токен. Refresh-токен при этом заменяется "
        "новым. Отказ (401) — если токена нет, он неверный, истёк, отозван выходом или уже был использован."
    ),
)
def refresh(response: Response, db: DbSession, refresh_token: RefreshCookie = None):
    try:
        tokens = service.refresh(db, refresh_token)
    except UnauthorizedError as exc:
        # Недействительную cookie удаляем, чтобы браузер не отправлял её снова
        content = {"detail": exc.message} | ({"code": exc.code} if exc.code else {})
        failed = JSONResponse(
            status_code=status.HTTP_401_UNAUTHORIZED,
            content=content,
            headers={"WWW-Authenticate": "Bearer"},
        )
        if exc.code != "refresh_token_rotated":
            _clear_refresh_cookie(failed)
        return failed
    return _token_response(response, tokens)


@router.post(
    "/logout",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Выход",
    description="Отзывает все refresh-токены текущей сессии и удаляет cookie. Обновить access-токен больше нельзя.",
)
def logout(response: Response, db: DbSession, refresh_token: RefreshCookie = None) -> None:
    service.logout(db, refresh_token)
    _clear_refresh_cookie(response)


@router.get("/me", response_model=UserRead, responses=UNAUTHORIZED, summary="Текущий пользователь")
def me(user: CurrentUser):
    return user
