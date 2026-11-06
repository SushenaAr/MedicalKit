from typing import Annotated

from fastapi import APIRouter, Query, status

from app.api.deps import CONFLICT, NOT_FOUND, UNAUTHORIZED, CurrentUser, DbSession
from app.models import DonationStatus
from app.schemas.donation import DonationCreate, DonationRead, DonationUpdate
from app.schemas.medicine import MedicineRead
from app.services import donations as service

router = APIRouter(prefix="/donations", tags=["Отдать до срока"], responses=UNAUTHORIZED)


@router.get("", response_model=list[DonationRead], summary="Список на передачу и история")
def list_donations(
    db: DbSession,
    user: CurrentUser,
    status: Annotated[DonationStatus | None, Query(description="planned или handed")] = None,
    shelter_id: Annotated[int | None, Query(gt=0)] = None,
):
    return service.list_donations(db, user, status=status, shelter_id=shelter_id)


@router.get(
    "/suggestions",
    response_model=list[MedicineRead],
    summary="Рекомендуем отдать",
    description="Нераспечатанные лекарства не из списка с остатком срока от 30 до 180 дней.",
)
def list_suggestions(db: DbSession, user: CurrentUser):
    return service.list_suggestions(db, user)


@router.post(
    "",
    response_model=DonationRead,
    status_code=status.HTTP_201_CREATED,
    responses=CONFLICT,
    summary="Добавить лекарство в список «отдать до срока»",
)
def create_donation(data: DonationCreate, db: DbSession, user: CurrentUser):
    return service.create_donation(db, user, data)


@router.get("/{donation_id}", response_model=DonationRead, responses=NOT_FOUND, summary="Запись о передаче")
def get_donation(donation_id: int, db: DbSession, user: CurrentUser):
    return service.get_donation(db, user, donation_id)


@router.patch(
    "/{donation_id}",
    response_model=DonationRead,
    responses={**NOT_FOUND, **CONFLICT},
    summary="Выбрать приют или отметить передачу",
)
def update_donation(donation_id: int, data: DonationUpdate, db: DbSession, user: CurrentUser):
    return service.update_donation(db, user, donation_id, data)


@router.delete(
    "/{donation_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    responses={**NOT_FOUND, **CONFLICT},
    summary="Убрать лекарство из списка",
    description="Уже переданные лекарства остаются в истории, их удалить нельзя.",
)
def delete_donation(donation_id: int, db: DbSession, user: CurrentUser) -> None:
    service.delete_donation(db, user, donation_id)
