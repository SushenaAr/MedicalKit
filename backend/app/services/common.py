from typing import TypeVar

from sqlalchemy.orm import Session

from app.core.errors import InvalidReferenceError, NotFoundError
from app.db.base import Base

ModelT = TypeVar("ModelT", bound=Base)


def get_or_404(db: Session, model: type[ModelT], obj_id: int, label: str) -> ModelT:
    """Запись из адреса запроса (/medicines/5): если её нет — 404."""
    obj = db.get(model, obj_id)
    if obj is None:
        raise NotFoundError(f"Не найдено: {label.lower()} с id={obj_id}")
    return obj


def resolve_reference(db: Session, model: type[ModelT], obj_id: int, label: str) -> ModelT:
    """Связанная запись из тела запроса ("category_id": 5): если её нет — 422."""
    obj = db.get(model, obj_id)
    if obj is None:
        raise InvalidReferenceError(f"Указана несуществующая запись: {label.lower()} с id={obj_id}")
    return obj
