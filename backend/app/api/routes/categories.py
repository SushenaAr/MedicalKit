from fastapi import APIRouter, status

from app.api.deps import CONFLICT, FORBIDDEN, NOT_FOUND, UNAUTHORIZED, AdminUser, DbSession

# Справочник публичный: читать могут все, изменять — только администратор
ADMIN_ONLY = {**UNAUTHORIZED, **FORBIDDEN}
from app.schemas.category import CategoryCreate, CategoryRead, CategoryUpdate
from app.services import categories as service

router = APIRouter(prefix="/categories", tags=["Категории"])


@router.get("", response_model=list[CategoryRead], summary="Список категорий")
def list_categories(db: DbSession):
    return service.list_categories(db)


@router.post(
    "",
    response_model=CategoryRead,
    status_code=status.HTTP_201_CREATED,
    responses={**CONFLICT, **ADMIN_ONLY},
    summary="Создать категорию",
)
def create_category(data: CategoryCreate, db: DbSession, _: AdminUser):
    return service.create_category(db, data)


@router.get("/{category_id}", response_model=CategoryRead, responses=NOT_FOUND, summary="Категория")
def get_category(category_id: int, db: DbSession):
    return service.get_category(db, category_id)


@router.patch(
    "/{category_id}",
    response_model=CategoryRead,
    responses={**NOT_FOUND, **CONFLICT, **ADMIN_ONLY},
    summary="Переименовать категорию",
)
def update_category(category_id: int, data: CategoryUpdate, db: DbSession, _: AdminUser):
    return service.update_category(db, category_id, data)


@router.delete(
    "/{category_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    responses={**NOT_FOUND, **ADMIN_ONLY},
    summary="Удалить категорию",
    description="У лекарств этой категории поле category становится пустым.",
)
def delete_category(category_id: int, db: DbSession, _: AdminUser) -> None:
    service.delete_category(db, category_id)
