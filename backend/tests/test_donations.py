from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.models import Donation, DonationStatus
from tests.conftest import in_days, make_category, make_medicine, make_shelter


def _donate(client: TestClient, medicine_id: int, shelter_id: int | None = None):
    return client.post("/api/donations", json={"medicine_id": medicine_id, "shelter_id": shelter_id})


def test_full_donation_flow(client: TestClient, db: Session) -> None:
    medicine = make_medicine(client)
    shelter = make_shelter(client)

    response = _donate(client, medicine["id"])
    assert response.status_code == 201
    donation = response.json()
    assert donation["status"] == "planned"
    assert donation["shelter"] is None
    assert donation["medicine"]["name"] == "Лоратадин"

    # связь видна и со стороны лекарства
    assert client.get(f"/api/medicines/{medicine['id']}").json()["donation"]["id"] == donation["id"]

    response = client.patch(f"/api/donations/{donation['id']}", json={"status": "handed"})
    assert response.status_code == 409
    assert response.json()["detail"] == "Чтобы отметить передачу, сначала выберите приют"

    response = client.patch(f"/api/donations/{donation['id']}", json={"shelter_id": shelter["id"]})
    assert response.status_code == 200
    assert response.json()["shelter"] == {"id": shelter["id"], "name": shelter["name"]}

    response = client.patch(f"/api/donations/{donation['id']}", json={"status": "handed"})
    assert response.status_code == 200
    assert response.json()["handed_at"] is not None

    stored = db.get(Donation, donation["id"])
    assert stored.status is DonationStatus.HANDED and stored.shelter_id == shelter["id"]

    # переданное изменить и удалить нельзя
    assert client.patch(f"/api/donations/{donation['id']}", json={"shelter_id": None}).status_code == 409
    assert client.delete(f"/api/donations/{donation['id']}").status_code == 409

    handed = client.get("/api/donations", params={"status": "handed"}).json()
    assert [d["id"] for d in handed] == [donation["id"]]


def test_donation_business_rules(client: TestClient) -> None:
    opened = make_medicine(client, name="Вскрытое", opened=True)
    expired = make_medicine(client, name="Просроченное", expires_at=in_days(-1))
    short = make_medicine(client, name="Почти истекло", expires_at=in_days(10))
    fine = make_medicine(client, name="Годное")

    cases = [
        (opened, "Передать можно только лекарство в невскрытой упаковке"),
        (expired, "Срок годности истёк: лекарство нужно сдать на утилизацию, передавать его нельзя"),
        (short, "До окончания срока годности меньше 30 дней — такие лекарства не передают"),
    ]
    for medicine, message in cases:
        response = _donate(client, medicine["id"])
        assert response.status_code == 409
        assert response.json()["detail"] == message

    assert _donate(client, fine["id"]).status_code == 201
    response = _donate(client, fine["id"])
    assert response.status_code == 409
    assert response.json()["detail"] == "«Годное» уже есть в списке на передачу"

    response = _donate(client, 999)
    assert response.status_code == 422


def test_shelter_requirements(client: TestClient) -> None:
    allergy = make_category(client, "Антигистаминные")
    antiseptic = make_category(client, "Антисептики")
    strict = make_shelter(client, name="Строгий приют", min_months_left=6)
    picky = make_shelter(client, name="Приют для животных", category_ids=[antiseptic["id"]])

    medicine = make_medicine(client, expires_at=in_days(100), category_id=allergy["id"])

    response = _donate(client, medicine["id"], strict["id"])
    assert response.status_code == 409
    assert response.json()["detail"] == (
        "Строгий приют: принимают лекарства с остатком срока годности от 6 мес."
    )

    response = _donate(client, medicine["id"], picky["id"])
    assert response.status_code == 409
    assert response.json()["detail"] == (
        "Приют для животных: не принимают лекарства категории «Антигистаминные»"
    )


def test_medicine_changes_cannot_break_planned_donation(client: TestClient) -> None:
    medicine = make_medicine(client)
    _donate(client, medicine["id"])

    response = client.patch(f"/api/medicines/{medicine['id']}", json={"opened": True})
    assert response.status_code == 409
    assert "Сначала уберите лекарство из списка на передачу" in response.json()["detail"]
    assert client.get(f"/api/medicines/{medicine['id']}").json()["opened"] is False


def test_deleting_medicine_removes_its_donation(client: TestClient, db: Session) -> None:
    medicine = make_medicine(client)
    donation = _donate(client, medicine["id"]).json()

    assert client.delete(f"/api/medicines/{medicine['id']}").status_code == 204
    db.expire_all()
    assert db.get(Donation, donation["id"]) is None
    assert client.get(f"/api/donations/{donation['id']}").status_code == 404


def test_remove_planned_donation_and_suggestions(client: TestClient) -> None:
    suggested = make_medicine(client, name="Подходит", expires_at=in_days(90))
    make_medicine(client, name="Долгий срок", expires_at=in_days(400))
    make_medicine(client, name="Вскрыто", opened=True, expires_at=in_days(90))

    names = [m["name"] for m in client.get("/api/donations/suggestions").json()]
    assert names == ["Подходит"]

    donation = _donate(client, suggested["id"]).json()
    assert client.get("/api/donations/suggestions").json() == []

    assert client.delete(f"/api/donations/{donation['id']}").status_code == 204
    assert [m["name"] for m in client.get("/api/donations/suggestions").json()] == ["Подходит"]
