from typing import TypeVar

from sqlalchemy.orm import Session

from app.core.errors import InvalidReferenceError, NotFoundError
from app.db.base import Base
from app.models import Medicine, User

ModelT = TypeVar("ModelT", bound=Base)


def get_or_404(db: Session, model: type[ModelT], obj_id: int, label: str) -> ModelT:
    """Запись из адреса запроса (/medicines/5): если её нет — 404."""
    obj = db.get(model, obj_id)
    if obj is None:
        raise NotFoundError(f"Не найдено: {label.lower()} с id={obj_id}")
    return obj


def get_own_medicine(db: Session, owner: User, medicine_id: int) -> Medicine:
    """Лекарство текущего пользователя. Чужое лекарство неотличимо от несуществующего (404),
    чтобы по ответу нельзя было узнать, какие id заняты другими пользователями."""
    medicine = db.get(Medicine, medicine_id)
    if medicine is None or medicine.owner_id != owner.id:
        raise NotFoundError(f"Не найдено: лекарство с id={medicine_id}")
    return medicine


def resolve_own_medicine(db: Session, owner: User, medicine_id: int) -> Medicine:
    """Лекарство пользователя, указанное в теле запроса: чужое или несуществующее — 422."""
    medicine = db.get(Medicine, medicine_id)
    if medicine is None or medicine.owner_id != owner.id:
        raise InvalidReferenceError(f"Указана несуществующая запись: лекарство с id={medicine_id}")
    return medicine


def resolve_reference(db: Session, model: type[ModelT], obj_id: int, label: str) -> ModelT:
    """Связанная запись из тела запроса ("category_id": 5): если её нет — 422."""
    obj = db.get(model, obj_id)
    if obj is None:
        raise InvalidReferenceError(f"Указана несуществующая запись: {label.lower()} с id={obj_id}")
    return obj
