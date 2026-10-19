from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.models import Medicine
from tests.conftest import in_days, make_category, make_medicine


def test_crud_cycle_persists_to_database(client: TestClient, db: Session) -> None:
    created = make_medicine(client, name="  Парацетамол  ", opened=True)
    assert created["name"] == "Парацетамол"  # пробелы обрезаны
    assert created["days_left"] == 120
    assert created["expiry_status"] == "ok"
    assert created["donation"] is None

    stored = db.get(Medicine, created["id"])
    assert stored is not None and stored.name == "Парацетамол" and stored.opened is True

    response = client.get(f"/api/medicines/{created['id']}")
    assert response.status_code == 200
    assert response.json()["location"] == "Спальня, комод"

    response = client.patch(
        f"/api/medicines/{created['id']}",
        json={"quantity": "5 таб.", "expires_at": in_days(10)},
    )
    assert response.status_code == 200
    assert response.json()["quantity"] == "5 таб."
    assert response.json()["expiry_status"] == "soon"
    db.expire_all()
    assert db.get(Medicine, created["id"]).quantity == "5 таб."

    response = client.delete(f"/api/medicines/{created['id']}")
    assert response.status_code == 204
    db.expire_all()
    assert db.get(Medicine, created["id"]) is None


def test_list_filters_and_sorting(client: TestClient) -> None:
    make_medicine(client, name="Свежий", expires_at=in_days(300))
    make_medicine(client, name="Просроченный", expires_at=in_days(-5))
    make_medicine(client, name="Истекающий", expires_at=in_days(7), location="Ванная")

    names = [m["name"] for m in client.get("/api/medicines").json()]
    assert names == ["Просроченный", "Истекающий", "Свежий"]

    for status, expected in [("expired", "Просроченный"), ("soon", "Истекающий"), ("ok", "Свежий")]:
        result = client.get("/api/medicines", params={"status": status}).json()
        assert [m["name"] for m in result] == [expected]

    result = client.get("/api/medicines", params={"search": "ванн"}).json()
    assert [m["name"] for m in result] == ["Истекающий"]


def test_category_relation_and_set_null_on_delete(client: TestClient, db: Session) -> None:
    category = make_category(client)
    medicine = make_medicine(client, category_id=category["id"])
    assert medicine["category"] == {"id": category["id"], "name": "Антигистаминные"}

    filtered = client.get("/api/medicines", params={"category_id": category["id"]}).json()
    assert [m["id"] for m in filtered] == [medicine["id"]]

    assert client.delete(f"/api/categories/{category['id']}").status_code == 204
    assert client.get(f"/api/medicines/{medicine['id']}").json()["category"] is None
    db.expire_all()
    assert db.get(Medicine, medicine["id"]).category_id is None


def test_not_found(client: TestClient) -> None:
    for method in ("get", "patch", "delete"):
        kwargs = {"json": {"name": "x"}} if method == "patch" else {}
        response = getattr(client, method)("/api/medicines/999", **kwargs)
        assert response.status_code == 404
        assert response.json() == {"detail": "Не найдено: лекарство с id=999"}


def test_validation_errors_are_readable(client: TestClient) -> None:
    response = client.post(
        "/api/medicines",
        json={"name": "", "form": "pills", "expires_at": "31.12.2026", "color": "red"},
    )
    assert response.status_code == 422
    body = response.json()
    assert body["detail"] == "Некорректные данные запроса"
    errors = {e["field"]: e["message"] for e in body["errors"]}
    assert errors["name"] == "Значение слишком короткое (минимум 1 симв.)"
    assert errors["form"] == (
        "Допустимые значения: 'tablets', 'capsules', 'syrup', 'drops', "
        "'ointment', 'spray', 'solution', 'powder'"
    )
    assert errors["expires_at"] == "Ожидается дата в формате ГГГГ-ММ-ДД"
    assert errors["location"] == "Обязательное поле"
    assert errors["color"] == "Неизвестное поле"


def test_unknown_category_reference(client: TestClient) -> None:
    response = client.post(
        "/api/medicines",
        json={"name": "А", "form": "tablets", "expires_at": in_days(10), "location": "Кухня", "category_id": 42},
    )
    assert response.status_code == 422
    assert response.json()["detail"] == "Указана несуществующая запись: категория с id=42"


def test_patch_rejects_null_for_required_field(client: TestClient) -> None:
    medicine = make_medicine(client)
    response = client.patch(f"/api/medicines/{medicine['id']}", json={"name": None})
    assert response.status_code == 422
    assert response.json()["errors"][0]["message"] == "Поле «name» не может быть null"

    # notes можно очистить явным null
    response = client.patch(f"/api/medicines/{medicine['id']}", json={"notes": None})
    assert response.status_code == 200
