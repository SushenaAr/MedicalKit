from typing import Annotated

from fastapi import APIRouter, Query, status

from app.api.deps import CONFLICT, NOT_FOUND, DbSession
from app.models import DonationStatus
from app.schemas.donation import DonationCreate, DonationRead, DonationUpdate
from app.schemas.medicine import MedicineRead
from app.services import donations as service

router = APIRouter(prefix="/donations", tags=["Отдать до срока"])


@router.get("", response_model=list[DonationRead], summary="Список на передачу и история")
def list_donations(
    db: DbSession,
    status: Annotated[DonationStatus | None, Query(description="planned или handed")] = None,
    shelter_id: Annotated[int | None, Query(gt=0)] = None,
):
    return service.list_donations(db, status=status, shelter_id=shelter_id)


@router.get(
    "/suggestions",
    response_model=list[MedicineRead],
    summary="Рекомендуем отдать",
    description="Нераспечатанные лекарства не из списка с остатком срока от 30 до 180 дней.",
)
def list_suggestions(db: DbSession):
    return service.list_suggestions(db)


@router.post(
    "",
    response_model=DonationRead,
    status_code=status.HTTP_201_CREATED,
    responses=CONFLICT,
    summary="Добавить лекарство в список «отдать до срока»",
)
def create_donation(data: DonationCreate, db: DbSession):
    return service.create_donation(db, data)


@router.get("/{donation_id}", response_model=DonationRead, responses=NOT_FOUND, summary="Запись о передаче")
def get_donation(donation_id: int, db: DbSession):
    return service.get_donation(db, donation_id)


@router.patch(
    "/{donation_id}",
    response_model=DonationRead,
    responses={**NOT_FOUND, **CONFLICT},
    summary="Выбрать приют или отметить передачу",
)
def update_donation(donation_id: int, data: DonationUpdate, db: DbSession):
    return service.update_donation(db, donation_id, data)


@router.delete(
    "/{donation_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    responses={**NOT_FOUND, **CONFLICT},
    summary="Убрать лекарство из списка",
    description="Уже переданные лекарства остаются в истории, их удалить нельзя.",
)
def delete_donation(donation_id: int, db: DbSession) -> None:
    service.delete_donation(db, donation_id)
