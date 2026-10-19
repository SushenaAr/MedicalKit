"""Заполнение БД демонстрационными данными (те же, что во frontend).

Запуск из папки backend:
    python -m app.seed           — заполнить, если база пустая
    python -m app.seed --reset   — очистить таблицы и заполнить заново
"""

import argparse
from datetime import UTC, date, datetime, timedelta

from sqlalchemy import select, text

from app.db.session import SessionLocal
from app.models import Category, Donation, DonationStatus, Medicine, MedicineForm, Shelter, ShelterKind

CATEGORIES = [
    "Жаропонижающие и обезболивающие",
    "Антигистаминные",
    "Антисептики",
    "Ранозаживляющие мази",
    "Сорбенты и препараты для ЖКТ",
    "Средства от простуды",
    "Антибиотики",
]

SHELTERS = [
    ("Приют для животных «Верный друг»", ShelterKind.ANIMALS, "ул. Примерная, д. 12", 3,
     ["Антисептики", "Ранозаживляющие мази", "Сорбенты и препараты для ЖКТ"]),
    ("Социальный центр «Тёплый дом»", ShelterKind.PEOPLE, "пр. Демонстрационный, д. 5", 1,
     ["Жаропонижающие и обезболивающие", "Антигистаминные", "Средства от простуды"]),
    ("Кризисный центр «Опора»", ShelterKind.PEOPLE, "ул. Тестовая, д. 8, корп. 2", 2,
     ["Средства от простуды", "Сорбенты и препараты для ЖКТ", "Антисептики", "Антибиотики"]),
]

# название, вещество, форма, количество, дней до конца срока, вскрыто, место, категория, заметки
MEDICINES = [
    ("Парацетамол", "Парацетамол 500 мг", MedicineForm.TABLETS, "20 таб.", 240, True,
     "Кухня, верхний ящик", "Жаропонижающие и обезболивающие", None),
    ("Ибупрофен", "Ибупрофен 200 мг", MedicineForm.TABLETS, "8 таб.", 18, True,
     "Кухня, верхний ящик", "Жаропонижающие и обезболивающие", None),
    ("Амоксициллин", "Амоксициллин 500 мг", MedicineForm.CAPSULES, "16 капс.", 95, False,
     "Спальня, комод", "Антибиотики", "Остался после курса лечения, упаковка не вскрыта"),
    ("Сироп от кашля", "Амброксол 15 мг/5 мл", MedicineForm.SYRUP, "100 мл", -12, True,
     "Холодильник", "Средства от простуды", None),
    ("Хлоргексидин", "Хлоргексидина биглюконат 0,05%", MedicineForm.SOLUTION, "100 мл", 400, False,
     "Ванная, шкафчик", "Антисептики", None),
    ("Лоратадин", "Лоратадин 10 мг", MedicineForm.TABLETS, "10 таб.", 60, False,
     "Спальня, комод", "Антигистаминные", None),
    ("Левомеколь", "Хлорамфеникол + метилурацил", MedicineForm.OINTMENT, "40 г", 25, True,
     "Ванная, шкафчик", "Ранозаживляющие мази", None),
    ("Капли в нос", "Нафазолин 0,1%", MedicineForm.DROPS, "10 мл", -40, True,
     "Прихожая, полка", "Средства от простуды", None),
    ("Смекта", "Диосмектит 3 г", MedicineForm.POWDER, "10 пак.", 150, False,
     "Кухня, верхний ящик", "Сорбенты и препараты для ЖКТ", None),
    ("Мирамистин", "Бензилдиметиламмоний 0,01%", MedicineForm.SPRAY, "150 мл", 320, False,
     "Ванная, шкафчик", "Антисептики", None),
    ("Активированный уголь", "Уголь активированный 250 мг", MedicineForm.TABLETS, "30 таб.", 700, True,
     "Кухня, верхний ящик", "Сорбенты и препараты для ЖКТ", None),
]


def seed(reset: bool = False) -> None:
    with SessionLocal() as db:
        if reset:
            db.execute(text(
                "TRUNCATE donations, medicines, shelter_categories, shelters, categories "
                "RESTART IDENTITY CASCADE"
            ))
        elif db.scalar(select(Medicine.id).limit(1)) is not None:
            print("В базе уже есть данные. Чтобы заполнить заново: python -m app.seed --reset")
            return

        categories = {name: Category(name=name) for name in CATEGORIES}
        db.add_all(categories.values())

        shelters = {}
        for name, kind, address, months, accepts in SHELTERS:
            shelters[name] = Shelter(
                name=name, kind=kind, address=address, min_months_left=months,
                categories=[categories[c] for c in accepts],
            )
        db.add_all(shelters.values())

        medicines = {}
        today = date.today()
        for name, substance, form, quantity, days, opened, location, category, notes in MEDICINES:
            medicines[name] = Medicine(
                name=name, substance=substance, form=form, quantity=quantity,
                expires_at=today + timedelta(days=days), opened=opened, location=location,
                category=categories[category], notes=notes,
            )
        db.add_all(medicines.values())

        db.add_all([
            Donation(medicine=medicines["Лоратадин"], shelter=shelters["Социальный центр «Тёплый дом»"]),
            Donation(
                medicine=medicines["Мирамистин"],
                shelter=shelters["Приют для животных «Верный друг»"],
                status=DonationStatus.HANDED,
                handed_at=datetime.now(UTC),
            ),
        ])
        db.commit()
        print(
            f"Добавлено: категорий — {len(categories)}, приютов — {len(shelters)}, "
            f"лекарств — {len(medicines)}, передач — 2"
        )


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Демонстрационные данные домашней аптечки")
    parser.add_argument("--reset", action="store_true", help="очистить таблицы перед заполнением")
    seed(reset=parser.parse_args().reset)
