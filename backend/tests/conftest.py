"""Тесты работают с отдельной базой <POSTGRES_DB>_test на том же сервере PostgreSQL."""

from collections.abc import Iterator
from datetime import date, timedelta
from typing import Any

import psycopg
import pytest
from fastapi.testclient import TestClient
from psycopg import sql
from sqlalchemy import Engine, create_engine, text
from sqlalchemy.orm import Session, sessionmaker

import app.models  # noqa: F401
from app.core.config import settings
from app.db.base import Base
from app.db.session import get_db
from app.main import app

TEST_DB = f"{settings.postgres_db}_test"


def _create_test_database() -> None:
    with psycopg.connect(
        host=settings.postgres_host,
        port=settings.postgres_port,
        user=settings.postgres_user,
        password=settings.postgres_password,
        dbname="postgres",
        autocommit=True,
    ) as conn:
        exists = conn.execute("SELECT 1 FROM pg_database WHERE datname = %s", (TEST_DB,)).fetchone()
        if not exists:
            conn.execute(sql.SQL("CREATE DATABASE {}").format(sql.Identifier(TEST_DB)))


@pytest.fixture(scope="session")
def engine() -> Iterator[Engine]:
    _create_test_database()
    engine = create_engine(settings.database_url(TEST_DB))
    Base.metadata.drop_all(engine)
    Base.metadata.create_all(engine)
    yield engine
    engine.dispose()


@pytest.fixture
def session_factory(engine: Engine) -> sessionmaker[Session]:
    with engine.begin() as conn:
        conn.execute(text(
            "TRUNCATE donations, medicines, shelter_categories, shelters, categories "
            "RESTART IDENTITY CASCADE"
        ))
    return sessionmaker(bind=engine, autoflush=False, expire_on_commit=False)


@pytest.fixture
def client(session_factory: sessionmaker[Session]) -> Iterator[TestClient]:
    def override_get_db() -> Iterator[Session]:
        with session_factory() as session:
            yield session

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()


@pytest.fixture
def db(session_factory: sessionmaker[Session]) -> Iterator[Session]:
    """Отдельная сессия, чтобы проверять, что данные действительно сохранились в БД."""
    with session_factory() as session:
        yield session


def in_days(days: int) -> str:
    return (date.today() + timedelta(days=days)).isoformat()


def make_medicine(client: TestClient, **overrides: Any) -> dict[str, Any]:
    payload = {
        "name": "Лоратадин",
        "substance": "Лоратадин 10 мг",
        "form": "tablets",
        "quantity": "10 таб.",
        "expires_at": in_days(120),
        "location": "Спальня, комод",
    }
    payload.update(overrides)
    response = client.post("/api/medicines", json=payload)
    assert response.status_code == 201, response.json()
    return response.json()


def make_shelter(client: TestClient, **overrides: Any) -> dict[str, Any]:
    payload = {
        "name": "Тестовый приют",
        "kind": "people",
        "address": "ул. Тестовая, 1",
        "min_months_left": 1,
    }
    payload.update(overrides)
    response = client.post("/api/shelters", json=payload)
    assert response.status_code == 201, response.json()
    return response.json()


def make_category(client: TestClient, name: str = "Антигистаминные") -> dict[str, Any]:
    response = client.post("/api/categories", json={"name": name})
    assert response.status_code == 201, response.json()
    return response.json()
