# Импорт всех моделей регистрирует их в Base.metadata (нужно для Alembic и тестов)
from app.models.category import Category
from app.models.donation import Donation
from app.models.enums import DonationStatus, MedicineForm, ShelterKind
from app.models.medicine import Medicine
from app.models.shelter import Shelter, shelter_categories

__all__ = [
    "Category",
    "Donation",
    "DonationStatus",
    "Medicine",
    "MedicineForm",
    "Shelter",
    "ShelterKind",
    "shelter_categories",
]
