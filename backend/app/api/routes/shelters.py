from fastapi import APIRouter, status

from app.api.deps import CONFLICT, NOT_FOUND, DbSession
from app.schemas.shelter import ShelterCreate, ShelterRead, ShelterUpdate
from app.services import shelters as service

router = APIRouter(prefix="/shelters", tags=["Приюты"])


@router.get("", response_model=list[ShelterRead], summary="Список приютов")
def list_shelters(db: DbSession):
    return service.list_shelters(db)


@router.post(
    "",
    response_model=ShelterRead,
    status_code=status.HTTP_201_CREATED,
    responses=CONFLICT,
    summary="Добавить приют",
)
def create_shelter(data: ShelterCreate, db: DbSession):
    return service.create_shelter(db, data)


@router.get("/{shelter_id}", response_model=ShelterRead, responses=NOT_FOUND, summary="Приют")
def get_shelter(shelter_id: int, db: DbSession):
    return service.get_shelter(db, shelter_id)


@router.patch(
    "/{shelter_id}",
    response_model=ShelterRead,
    responses={**NOT_FOUND, **CONFLICT},
    summary="Изменить приют",
    description="category_ids, если передан, полностью заменяет список принимаемых категорий.",
)
def update_shelter(shelter_id: int, data: ShelterUpdate, db: DbSession):
    return service.update_shelter(db, shelter_id, data)


@router.delete(
    "/{shelter_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    responses={**NOT_FOUND, **CONFLICT},
    summary="Удалить приют",
    description="Нельзя удалить приют, к которому привязаны передачи лекарств.",
)
def delete_shelter(shelter_id: int, db: DbSession) -> None:
    service.delete_shelter(db, shelter_id)
