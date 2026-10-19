from collections.abc import Sequence

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.core.errors import ConflictError
from app.models import Category
from app.schemas.category import CategoryCreate, CategoryUpdate
from app.services.common import get_or_404


def _ensure_name_free(db: Session, name: str, exclude_id: int | None = None) -> None:
    stmt = select(Category.id).where(func.lower(Category.name) == name.lower())
    if exclude_id is not None:
        stmt = stmt.where(Category.id != exclude_id)
    if db.scalar(stmt) is not None:
        raise ConflictError(f"Категория «{name}» уже существует")


def list_categories(db: Session) -> Sequence[Category]:
    return db.scalars(select(Category).order_by(Category.name)).all()


def get_category(db: Session, category_id: int) -> Category:
    return get_or_404(db, Category, category_id, "Категория")


def create_category(db: Session, data: CategoryCreate) -> Category:
    _ensure_name_free(db, data.name)
    category = Category(name=data.name)
    db.add(category)
    db.commit()
    db.refresh(category)
    return category


def update_category(db: Session, category_id: int, data: CategoryUpdate) -> Category:
    category = get_category(db, category_id)
    if data.name is not None:
        _ensure_name_free(db, data.name, exclude_id=category.id)
        category.name = data.name
    db.commit()
    db.refresh(category)
    return category


def delete_category(db: Session, category_id: int) -> None:
    """У лекарств категория обнуляется (ON DELETE SET NULL), у приютов связь удаляется."""
    category = get_category(db, category_id)
    db.delete(category)
    db.commit()
