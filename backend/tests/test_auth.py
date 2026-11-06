"""Регистрация, вход, токены, обновление и выход."""

from datetime import UTC, datetime, timedelta

import jwt
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.config import settings
from app.models import RefreshToken, User
from tests.conftest import PASSWORD, bearer, register


def _refresh_cookie(client: TestClient) -> str:
    value = client.cookies.get("refresh_token")
    assert value, "refresh-токен должен прийти в cookie"
    return value


def test_register_stores_strong_password_hash(anon: TestClient, db: Session) -> None:
    response = anon.post(
        "/api/auth/register",
        json={"email": "  Anna@Example.COM ", "name": " Анна ", "password": PASSWORD},
    )
    assert response.status_code == 201
    body = response.json()
    assert body["token_type"] == "bearer"
    assert body["expires_in"] == settings.access_token_ttl_minutes * 60
    assert body["user"]["email"] == "anna@example.com"
    assert body["user"]["name"] == "Анна"
    assert body["user"]["role"] == "user"
    assert "password" not in str(body) and "password_hash" not in body["user"]
    assert response.headers["cache-control"] == "no-store"

    # refresh-токен — в httpOnly-cookie, ограниченной путём /api/auth
    set_cookie = response.headers["set-cookie"].lower()
    assert "refresh_token=" in set_cookie
    assert "httponly" in set_cookie and "samesite=lax" in set_cookie and "path=/api/auth" in set_cookie

    user = db.scalar(select(User).where(User.email == "anna@example.com"))
    assert user is not None
    assert user.password_hash.startswith("$argon2id$")
    assert PASSWORD not in user.password_hash

    # в БД лежит хеш refresh-токена, а не сам токен
    stored = db.scalars(select(RefreshToken)).one()
    assert stored.token_hash != _refresh_cookie(anon) and len(stored.token_hash) == 64


def test_register_validation_and_duplicate(anon: TestClient) -> None:
    register(anon, "ivan@example.com")

    response = anon.post(
        "/api/auth/register", json={"email": "IVAN@example.com", "name": "Иван", "password": PASSWORD}
    )
    assert response.status_code == 409
    assert response.json()["detail"] == "Пользователь с таким email уже зарегистрирован"

    response = anon.post("/api/auth/register", json={"email": "не-email", "name": "", "password": "short"})
    assert response.status_code == 422
    fields = {e["field"]: e["message"] for e in response.json()["errors"]}
    assert fields["email"] == "Некорректный email"
    assert "name" in fields
    assert fields["password"].startswith("Значение слишком короткое")

    response = anon.post(
        "/api/auth/register", json={"email": "petr@example.com", "name": "Пётр", "password": "onlyletters"}
    )
    assert response.status_code == 422
    assert response.json()["errors"][0]["message"] == "Пароль должен содержать хотя бы одну букву и одну цифру"


def test_login_and_me(anon: TestClient) -> None:
    register(anon, "olga@example.com", name="Ольга")
    anon.cookies.clear()

    response = anon.post("/api/auth/login", json={"email": "OLGA@example.com", "password": PASSWORD})
    assert response.status_code == 200
    token = response.json()["access_token"]
    _refresh_cookie(anon)

    me = anon.get("/api/auth/me", headers=bearer(token))
    assert me.status_code == 200
    assert me.json()["email"] == "olga@example.com" and me.json()["name"] == "Ольга"


@pytest.mark.parametrize(
    ("email", "password"),
    [("olga@example.com", "Wrong1234"), ("nobody@example.com", PASSWORD)],
)
def test_login_rejects_wrong_credentials_with_same_message(anon: TestClient, email: str, password: str) -> None:
    register(anon, "olga@example.com")
    response = anon.post("/api/auth/login", json={"email": email, "password": password})
    assert response.status_code == 401
    assert response.json()["detail"] == "Неверный email или пароль"
    assert response.headers["www-authenticate"] == "Bearer"


def test_access_token_checks(anon: TestClient) -> None:
    token = register(anon, "user@example.com")
    claims = jwt.decode(token, settings.jwt_secret, algorithms=[settings.jwt_algorithm])
    assert claims["type"] == "access"
    assert claims["exp"] - claims["iat"] == settings.access_token_ttl_minutes * 60

    cases = {
        "без токена": (None, "not_authenticated"),
        "мусор": ("not-a-jwt", "invalid_token"),
        "чужая подпись": (jwt.encode({**claims}, "x" * 40, algorithm="HS256"), "invalid_token"),
        "alg=none": (jwt.encode({**claims}, None, algorithm="none"), "invalid_token"),
        "истёк": (
            jwt.encode(
                {**claims, "exp": datetime.now(UTC) - timedelta(seconds=1)},
                settings.jwt_secret,
                algorithm=settings.jwt_algorithm,
            ),
            "token_expired",
        ),
        "не access": (
            jwt.encode({**claims, "type": "refresh"}, settings.jwt_secret, algorithm=settings.jwt_algorithm),
            "invalid_token",
        ),
    }
    for name, (bad_token, code) in cases.items():
        headers = bearer(bad_token) if bad_token else {}
        response = anon.get("/api/auth/me", headers=headers)
        assert response.status_code == 401, name
        assert response.json()["code"] == code, name


def test_refresh_rotates_token(anon: TestClient, db: Session) -> None:
    register(anon, "user@example.com")
    first = _refresh_cookie(anon)

    response = anon.post("/api/auth/refresh")
    assert response.status_code == 200
    new_access = response.json()["access_token"]
    second = _refresh_cookie(anon)
    assert second != first
    assert anon.get("/api/auth/me", headers=bearer(new_access)).status_code == 200

    # старый токен отозван и связан с новым, сессия та же
    tokens = db.scalars(select(RefreshToken).order_by(RefreshToken.id)).all()
    assert len(tokens) == 2
    assert tokens[0].revoked_at is not None and tokens[0].replaced_by_id == tokens[1].id
    assert tokens[0].session_id == tokens[1].session_id


def test_refresh_rejects_missing_invalid_and_expired(anon: TestClient, db: Session) -> None:
    assert anon.post("/api/auth/refresh").status_code == 401

    anon.cookies.set("refresh_token", "forged-token", path="/api/auth")
    response = anon.post("/api/auth/refresh")
    assert response.status_code == 401
    assert response.json()["detail"] == "Сессия не найдена. Войдите снова"

    anon.cookies.clear()
    register(anon, "user@example.com")
    record = db.scalars(select(RefreshToken)).one()
    record.expires_at = datetime.now(UTC) - timedelta(minutes=1)
    db.commit()
    response = anon.post("/api/auth/refresh")
    assert response.status_code == 401
    assert response.json()["detail"] == "Сессия истекла. Войдите снова"
    # недействительная cookie удаляется
    assert 'refresh_token=""' in response.headers["set-cookie"] or "max-age=0" in response.headers["set-cookie"].lower()


def test_reused_refresh_token_revokes_session(anon: TestClient, db: Session, monkeypatch: pytest.MonkeyPatch) -> None:
    register(anon, "user@example.com")
    stolen = _refresh_cookie(anon)
    response = anon.post("/api/auth/refresh")
    current_access = response.json()["access_token"]

    # Сразу после обновления повтор старого токена считается гонкой вкладок: отказ без завершения сессии
    anon.cookies.set("refresh_token", stolen, path="/api/auth")
    response = anon.post("/api/auth/refresh")
    assert response.status_code == 401 and response.json()["code"] == "refresh_token_rotated"
    assert anon.get("/api/auth/me", headers=bearer(current_access)).status_code == 200

    # После окна ожидания повтор старого токена — признак кражи: вся сессия завершается
    monkeypatch.setattr(settings, "refresh_reuse_grace_seconds", 0)
    anon.cookies.set("refresh_token", stolen, path="/api/auth")
    response = anon.post("/api/auth/refresh")
    assert response.status_code == 401
    assert "использован повторно" in response.json()["detail"]
    assert all(t.revoked_at is not None for t in db.scalars(select(RefreshToken)))
    # и access-токен этой сессии больше не принимается
    response = anon.get("/api/auth/me", headers=bearer(current_access))
    assert response.status_code == 401 and response.json()["code"] == "session_ended"


def test_logout_revokes_current_session_only(anon: TestClient, session_factory) -> None:
    # Вход с двух «устройств»
    with TestClient(anon.app) as phone:
        laptop_token = register(anon, "user@example.com")
        phone_token = phone.post(
            "/api/auth/login", json={"email": "user@example.com", "password": PASSWORD}
        ).json()["access_token"]

        response = anon.post("/api/auth/logout")
        assert response.status_code == 204
        assert "refresh_token" not in anon.cookies

        # Обновить токен ноутбука больше нельзя, его access-токен не работает
        old_cookie_client_response = anon.post("/api/auth/refresh")
        assert old_cookie_client_response.status_code == 401
        assert anon.get("/api/auth/me", headers=bearer(laptop_token)).status_code == 401

        # Сессия телефона продолжает работать
        assert phone.get("/api/auth/me", headers=bearer(phone_token)).status_code == 200
        assert phone.post("/api/auth/refresh").status_code == 200


def test_refresh_after_logout_with_saved_token_is_rejected(anon: TestClient) -> None:
    register(anon, "user@example.com")
    saved = _refresh_cookie(anon)
    assert anon.post("/api/auth/logout").status_code == 204
    # повторный выход не ошибка
    assert anon.post("/api/auth/logout").status_code == 204

    anon.cookies.set("refresh_token", saved, path="/api/auth")
    response = anon.post("/api/auth/refresh")
    assert response.status_code == 401
    assert response.json()["detail"] == "Сессия завершена. Войдите снова"
