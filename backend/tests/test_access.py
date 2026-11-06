"""Разграничение доступа: публичные и приватные ресурсы, права на чужие данные и роли."""

import pytest
from fastapi.testclient import TestClient

from tests.conftest import bearer, in_days, make_category, make_medicine, make_shelter, register


@pytest.mark.parametrize(
    ("method", "path"),
    [
        ("get", "/api/medicines"),
        ("post", "/api/medicines"),
        ("get", "/api/medicines/1"),
        ("patch", "/api/medicines/1"),
        ("delete", "/api/medicines/1"),
        ("get", "/api/donations"),
        ("get", "/api/donations/suggestions"),
        ("post", "/api/donations"),
        ("patch", "/api/donations/1"),
        ("delete", "/api/donations/1"),
        ("get", "/api/auth/me"),
        ("post", "/api/shelters"),
        ("patch", "/api/shelters/1"),
        ("delete", "/api/shelters/1"),
        ("post", "/api/categories"),
    ],
)
def test_private_routes_require_login(anon: TestClient, method: str, path: str) -> None:
    response = getattr(anon, method)(path)
    assert response.status_code == 401
    assert response.json()["detail"] == "Требуется вход в систему"


def test_public_routes_work_without_login(client: TestClient, anon: TestClient) -> None:
    shelter = make_shelter(client)
    make_category(client)
    assert anon.get("/api/health").status_code == 200
    assert anon.get("/api/shelters").status_code == 200
    assert anon.get(f"/api/shelters/{shelter['id']}").status_code == 200
    assert anon.get("/api/categories").status_code == 200


def test_user_sees_and_changes_only_own_medicines(client: TestClient, anon: TestClient) -> None:
    owner_medicine = make_medicine(client, name="Лекарство администратора")
    other = bearer(register(anon, "other@example.com"))

    # Свой список пуст: чужие лекарства в нём не появляются
    assert anon.get("/api/medicines", headers=other).json() == []

    own = anon.post(
        "/api/medicines",
        headers=other,
        json={"name": "Моё", "form": "tablets", "expires_at": in_days(100), "location": "Кухня"},
    )
    assert own.status_code == 201
    assert [m["name"] for m in anon.get("/api/medicines", headers=other).json()] == ["Моё"]
    assert [m["name"] for m in client.get("/api/medicines").json()] == ["Лекарство администратора"]

    # Чужое лекарство неотличимо от несуществующего
    url = f"/api/medicines/{owner_medicine['id']}"
    for response in (
        anon.get(url, headers=other),
        anon.patch(url, headers=other, json={"name": "Взлом"}),
        anon.delete(url, headers=other),
    ):
        assert response.status_code == 404
        assert response.json()["detail"] == f"Не найдено: лекарство с id={owner_medicine['id']}"

    # У владельца ничего не изменилось
    assert client.get(url).json()["name"] == "Лекарство администратора"


def test_user_cannot_touch_foreign_donations(client: TestClient, anon: TestClient) -> None:
    medicine = make_medicine(client)
    donation = client.post("/api/donations", json={"medicine_id": medicine["id"]}).json()
    other = bearer(register(anon, "other@example.com"))

    # Нельзя поставить в свой список чужое лекарство
    response = anon.post("/api/donations", headers=other, json={"medicine_id": medicine["id"]})
    assert response.status_code == 422

    assert anon.get("/api/donations", headers=other).json() == []
    assert anon.get("/api/donations/suggestions", headers=other).json() == []
    url = f"/api/donations/{donation['id']}"
    assert anon.get(url, headers=other).status_code == 404
    assert anon.patch(url, headers=other, json={"shelter_id": None}).status_code == 404
    assert anon.delete(url, headers=other).status_code == 404
    assert client.get(url).status_code == 200


def test_reference_data_changes_require_admin(client: TestClient, anon: TestClient) -> None:
    shelter = make_shelter(client)
    category = make_category(client)
    user = bearer(register(anon, "user@example.com"))

    forbidden = [
        anon.post("/api/shelters", headers=user, json={"name": "X", "kind": "people", "address": "Y"}),
        anon.patch(f"/api/shelters/{shelter['id']}", headers=user, json={"name": "X"}),
        anon.delete(f"/api/shelters/{shelter['id']}", headers=user),
        anon.post("/api/categories", headers=user, json={"name": "X"}),
        anon.patch(f"/api/categories/{category['id']}", headers=user, json={"name": "X"}),
        anon.delete(f"/api/categories/{category['id']}", headers=user),
    ]
    for response in forbidden:
        assert response.status_code == 403
        assert response.json()["detail"] == "Недостаточно прав: операция доступна только администратору"

    # Чтение справочников обычному пользователю доступно
    assert anon.get("/api/shelters", headers=user).status_code == 200
