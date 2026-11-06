# Импорт всех моделей регистрирует их в Base.metadata (нужно для Alembic и тестов)
from app.models.category import Category
from app.models.donation import Donation
from app.models.enums import DonationStatus, MedicineForm, ShelterKind, UserRole
from app.models.medicine import Medicine
from app.models.refresh_token import RefreshToken
from app.models.shelter import Shelter, shelter_categories
from app.models.user import User

__all__ = [
    "Category",
    "Donation",
    "DonationStatus",
    "Medicine",
    "MedicineForm",
    "RefreshToken",
    "Shelter",
    "ShelterKind",
    "User",
    "UserRole",
    "shelter_categories",
]
