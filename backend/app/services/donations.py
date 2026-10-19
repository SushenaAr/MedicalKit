from collections.abc import Sequence
from datetime import UTC, date, datetime, timedelta

from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from app.core.errors import ConflictError
from app.models import Donation, DonationStatus, Medicine, Shelter
from app.schemas.donation import DonationCreate, DonationUpdate
from app.services.common import get_or_404, resolve_reference
from app.services.expiry import (
    DONATE_MIN_DAYS,
    DONATE_SUGGEST_MAX_DAYS,
    donation_block_reason,
    shelter_block_reason,
)


def _ensure_shelter_accepts(shelter: Shelter, medicine: Medicine) -> None:
    reason = shelter_block_reason(shelter, medicine)
    if reason is not None:
        raise ConflictError(reason)


def list_donations(
    db: Session,
    status: DonationStatus | None = None,
    shelter_id: int | None = None,
) -> Sequence[Donation]:
    stmt = (
        select(Donation)
        .join(Donation.medicine)
        .options(selectinload(Donation.medicine), selectinload(Donation.shelter))
        .order_by(Medicine.expires_at, Donation.id)
    )
    if status is not None:
        stmt = stmt.where(Donation.status == status)
    if shelter_id is not None:
        stmt = stmt.where(Donation.shelter_id == shelter_id)
    return db.scalars(stmt).all()


def list_suggestions(db: Session) -> Sequence[Medicine]:
    """Нераспечатанные лекарства не из списка, которые истекают в ближайшие полгода."""
    today = date.today()
    stmt = (
        select(Medicine)
        .options(selectinload(Medicine.category), selectinload(Medicine.donation))
        .where(
            Medicine.opened.is_(False),
            ~Medicine.donation.has(),
            Medicine.expires_at.between(
                today + timedelta(days=DONATE_MIN_DAYS),
                today + timedelta(days=DONATE_SUGGEST_MAX_DAYS),
            ),
        )
        .order_by(Medicine.expires_at, Medicine.id)
    )
    return db.scalars(stmt).all()


def get_donation(db: Session, donation_id: int) -> Donation:
    return get_or_404(db, Donation, donation_id, "Запись о передаче")


def create_donation(db: Session, data: DonationCreate) -> Donation:
    medicine = resolve_reference(db, Medicine, data.medicine_id, "Лекарство")
    if medicine.donation is not None:
        raise ConflictError(f"«{medicine.name}» уже есть в списке на передачу")
    reason = donation_block_reason(medicine)
    if reason is not None:
        raise ConflictError(reason)

    shelter = None
    if data.shelter_id is not None:
        shelter = resolve_reference(db, Shelter, data.shelter_id, "Приют")
        _ensure_shelter_accepts(shelter, medicine)

    donation = Donation(medicine=medicine, shelter=shelter)
    db.add(donation)
    db.commit()
    db.refresh(donation)
    return donation


def update_donation(db: Session, donation_id: int, data: DonationUpdate) -> Donation:
    donation = get_donation(db, donation_id)
    if donation.status is DonationStatus.HANDED:
        raise ConflictError("Лекарство уже передано — эту запись изменить нельзя")

    changes = data.model_dump(exclude_unset=True)
    if "shelter_id" in changes:
        shelter_id = changes["shelter_id"]
        if shelter_id is None:
            donation.shelter = None
        else:
            shelter = resolve_reference(db, Shelter, shelter_id, "Приют")
            _ensure_shelter_accepts(shelter, donation.medicine)
            donation.shelter = shelter

    if changes.get("status") is DonationStatus.HANDED:
        if donation.shelter is None:
            raise ConflictError("Чтобы отметить передачу, сначала выберите приют")
        donation.status = DonationStatus.HANDED
        donation.handed_at = datetime.now(UTC)

    db.commit()
    db.refresh(donation)
    return donation


def delete_donation(db: Session, donation_id: int) -> None:
    donation = get_donation(db, donation_id)
    if donation.status is DonationStatus.HANDED:
        raise ConflictError("Переданное лекарство нельзя убрать из истории передач")
    db.delete(donation)
    db.commit()
