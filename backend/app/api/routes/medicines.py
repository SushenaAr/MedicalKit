from typing import Annotated

from fastapi import APIRouter, Query, status

from app.api.deps import CONFLICT, NOT_FOUND, DbSession
from app.schemas.medicine import MedicineCreate, MedicineRead, MedicineUpdate
from app.services import medicines as service
from app.services.expiry import ExpiryStatus

router = APIRouter(prefix="/medicines", tags=["Лекарства"])


@router.get(
    "",
    response_model=list[MedicineRead],
    summary="Список лекарств",
    description="Отсортирован по сроку годности: сначала то, что истекает раньше.",
)
def list_medicines(
    db: DbSession,
    status: Annotated[
        ExpiryStatus | None,
        Query(description="expired — просрочено, soon — истекает в течение 30 дней, ok — в порядке"),
    ] = None,
    search: Annotated[
        str | None, Query(max_length=100, description="Поиск по названию, веществу, месту хранения")
    ] = None,
    category_id: Annotated[int | None, Query(gt=0)] = None,
):
    return service.list_medicines(db, status=status, search=search, category_id=category_id)


@router.post(
    "",
    response_model=MedicineRead,
    status_code=status.HTTP_201_CREATED,
    summary="Добавить лекарство",
)
def create_medicine(data: MedicineCreate, db: DbSession):
    return service.create_medicine(db, data)


@router.get("/{medicine_id}", response_model=MedicineRead, responses=NOT_FOUND, summary="Лекарство")
def get_medicine(medicine_id: int, db: DbSession):
    return service.get_medicine(db, medicine_id)


@router.patch(
    "/{medicine_id}",
    response_model=MedicineRead,
    responses={**NOT_FOUND, **CONFLICT},
    summary="Изменить лекарство",
    description="Меняются только переданные поля.",
)
def update_medicine(medicine_id: int, data: MedicineUpdate, db: DbSession):
    return service.update_medicine(db, medicine_id, data)


@router.delete(
    "/{medicine_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    responses=NOT_FOUND,
    summary="Удалить лекарство",
    description="Вместе с лекарством удаляется его запись в списке на передачу.",
)
def delete_medicine(medicine_id: int, db: DbSession) -> None:
    service.delete_medicine(db, medicine_id)
