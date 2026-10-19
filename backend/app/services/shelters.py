from collections.abc import Sequence

from sqlalchemy import func, select
from sqlalchemy.orm import Session, selectinload

from app.core.errors import ConflictError, InvalidReferenceError
from app.models import Category, Donation, Shelter
from app.schemas.shelter import ShelterCreate, ShelterUpdate
from app.services.common import get_or_404


def _ensure_name_free(db: Session, name: str, exclude_id: int | None = None) -> None:
    stmt = select(Shelter.id).where(func.lower(Shelter.name) == name.lower())
    if exclude_id is not None:
        stmt = stmt.where(Shelter.id != exclude_id)
    if db.scalar(stmt) is not None:
        raise ConflictError(f"Приют «{name}» уже существует")


def _load_categories(db: Session, category_ids: list[int]) -> list[Category]:
    unique_ids = list(dict.fromkeys(category_ids))
    if not unique_ids:
        return []
    categories = db.scalars(select(Category).where(Category.id.in_(unique_ids))).all()
    missing = sorted(set(unique_ids) - {c.id for c in categories})
    if missing:
        ids = ", ".join(str(i) for i in missing)
        raise InvalidReferenceError(f"Категории с id={ids} не существуют")
    return list(categories)


def list_shelters(db: Session) -> Sequence[Shelter]:
    stmt = select(Shelter).options(selectinload(Shelter.categories)).order_by(Shelter.name)
    return db.scalars(stmt).all()


def get_shelter(db: Session, shelter_id: int) -> Shelter:
    return get_or_404(db, Shelter, shelter_id, "Приют")


def create_shelter(db: Session, data: ShelterCreate) -> Shelter:
    _ensure_name_free(db, data.name)
    shelter = Shelter(**data.model_dump(exclude={"category_ids"}))
    shelter.categories = _load_categories(db, data.category_ids)
    db.add(shelter)
    db.commit()
    db.refresh(shelter)
    return shelter


def update_shelter(db: Session, shelter_id: int, data: ShelterUpdate) -> Shelter:
    shelter = get_shelter(db, shelter_id)
    changes = data.model_dump(exclude_unset=True)

    if "name" in changes:
        _ensure_name_free(db, changes["name"], exclude_id=shelter.id)
    if "category_ids" in changes:
        shelter.categories = _load_categories(db, changes.pop("category_ids"))
    for field, value in changes.items():
        setattr(shelter, field, value)

    db.commit()
    db.refresh(shelter)
    return shelter


def delete_shelter(db: Session, shelter_id: int) -> None:
    shelter = get_shelter(db, shelter_id)
    linked = db.scalar(select(func.count()).where(Donation.shelter_id == shelter.id))
    if linked:
        raise ConflictError(
            f"К приюту привязаны передачи лекарств ({linked}). "
            "Удалить приют можно только без связанных передач."
        )
    db.delete(shelter)
    db.commit()
