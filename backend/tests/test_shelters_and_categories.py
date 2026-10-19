from fastapi.testclient import TestClient
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models import Shelter, shelter_categories
from tests.conftest import make_category, make_medicine, make_shelter


def test_category_crud_and_unique_name(client: TestClient) -> None:
    category = make_category(client, "Антисептики")

    response = client.post("/api/categories", json={"name": "антисептики"})
    assert response.status_code == 409
    assert response.json()["detail"] == "Категория «антисептики» уже существует"

    response = client.patch(f"/api/categories/{category['id']}", json={"name": "Антисептики и дезинфекция"})
    assert response.status_code == 200
    assert [c["name"] for c in client.get("/api/categories").json()] == ["Антисептики и дезинфекция"]

    assert client.delete(f"/api/categories/{category['id']}").status_code == 204
    assert client.get(f"/api/categories/{category['id']}").status_code == 404


def test_shelter_with_categories_many_to_many(client: TestClient, db: Session) -> None:
    first = make_category(client, "Антисептики")
    second = make_category(client, "Сорбенты")

    shelter = make_shelter(client, category_ids=[second["id"], first["id"], first["id"]])
    assert [c["name"] for c in shelter["categories"]] == ["Антисептики", "Сорбенты"]

    response = client.patch(f"/api/shelters/{shelter['id']}", json={"category_ids": [second["id"]]})
    assert response.status_code == 200
    assert [c["id"] for c in response.json()["categories"]] == [second["id"]]

    rows = db.execute(select(shelter_categories.c.category_id)).scalars().all()
    assert rows == [second["id"]]

    # удаление категории убирает её из приюта (ON DELETE CASCADE в таблице связи)
    client.delete(f"/api/categories/{second['id']}")
    assert client.get(f"/api/shelters/{shelter['id']}").json()["categories"] == []


def test_shelter_validation_and_references(client: TestClient) -> None:
    response = client.post(
        "/api/shelters",
        json={"name": "Приют", "kind": "cats", "address": "ул. 1", "min_months_left": -1},
    )
    assert response.status_code == 422
    fields = {e["field"] for e in response.json()["errors"]}
    assert fields == {"kind", "min_months_left"}

    response = client.post(
        "/api/shelters",
        json={"name": "Приют", "kind": "people", "address": "ул. 1", "category_ids": [7, 8]},
    )
    assert response.status_code == 422
    assert response.json()["detail"] == "Категории с id=7, 8 не существуют"

    make_shelter(client, name="Приют")
    response = client.post("/api/shelters", json={"name": "приют", "kind": "people", "address": "ул. 2"})
    assert response.status_code == 409


def test_shelter_with_donations_cannot_be_deleted(client: TestClient, db: Session) -> None:
    shelter = make_shelter(client)
    medicine = make_medicine(client)
    client.post("/api/donations", json={"medicine_id": medicine["id"], "shelter_id": shelter["id"]})

    response = client.delete(f"/api/shelters/{shelter['id']}")
    assert response.status_code == 409
    assert "привязаны передачи лекарств (1)" in response.json()["detail"]
    assert db.get(Shelter, shelter["id"]) is not None

    empty = make_shelter(client, name="Пустой приют")
    assert client.delete(f"/api/shelters/{empty['id']}").status_code == 204
