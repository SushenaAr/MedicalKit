from collections.abc import Sequence
from datetime import date, timedelta

from sqlalchemy import or_, select
from sqlalchemy.orm import Session, selectinload

from app.core.errors import ConflictError
from app.models import Category, DonationStatus, Medicine
from app.schemas.medicine import MedicineCreate, MedicineUpdate
from app.services.common import get_or_404, resolve_reference
from app.services.expiry import (
    SOON_DAYS,
    ExpiryStatus,
    donation_block_reason,
    shelter_block_reason,
)


def _escape_like(text: str) -> str:
    return text.replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_")


def list_medicines(
    db: Session,
    status: ExpiryStatus | None = None,
    search: str | None = None,
    category_id: int | None = None,
) -> Sequence[Medicine]:
    today = date.today()
    soon_border = today + timedelta(days=SOON_DAYS)

    stmt = (
        select(Medicine)
        .options(selectinload(Medicine.category), selectinload(Medicine.donation))
        .order_by(Medicine.expires_at, Medicine.id)
    )
    if status is ExpiryStatus.EXPIRED:
        stmt = stmt.where(Medicine.expires_at < today)
    elif status is ExpiryStatus.SOON:
        stmt = stmt.where(Medicine.expires_at.between(today, soon_border))
    elif status is ExpiryStatus.OK:
        stmt = stmt.where(Medicine.expires_at > soon_border)

    if search and search.strip():
        pattern = f"%{_escape_like(search.strip())}%"
        stmt = stmt.where(
            or_(
                Medicine.name.ilike(pattern, escape="\\"),
                Medicine.substance.ilike(pattern, escape="\\"),
                Medicine.location.ilike(pattern, escape="\\"),
            )
        )
    if category_id is not None:
        stmt = stmt.where(Medicine.category_id == category_id)

    return db.scalars(stmt).all()


def get_medicine(db: Session, medicine_id: int) -> Medicine:
    return get_or_404(db, Medicine, medicine_id, "Лекарство")


def create_medicine(db: Session, data: MedicineCreate) -> Medicine:
    if data.category_id is not None:
        resolve_reference(db, Category, data.category_id, "Категория")
    medicine = Medicine(**data.model_dump())
    db.add(medicine)
    db.commit()
    db.refresh(medicine)
    return medicine


def update_medicine(db: Session, medicine_id: int, data: MedicineUpdate) -> Medicine:
    medicine = get_medicine(db, medicine_id)
    changes = data.model_dump(exclude_unset=True)

    if changes.get("category_id") is not None:
        resolve_reference(db, Category, changes["category_id"], "Категория")
    for field, value in changes.items():
        setattr(medicine, field, value)

    # Изменение не должно сделать некорректной уже запланированную передачу
    donation = medicine.donation
    if donation is not None and donation.status is DonationStatus.PLANNED:
        db.flush()
        db.refresh(medicine, ["category"])
        reason = donation_block_reason(medicine)
        if reason is None and donation.shelter is not None:
            reason = shelter_block_reason(donation.shelter, medicine)
        if reason is not None:
            db.rollback()
            raise ConflictError(f"{reason}. Сначала уберите лекарство из списка на передачу.")

    db.commit()
    db.refresh(medicine)
    return medicine


def delete_medicine(db: Session, medicine_id: int) -> None:
    """Вместе с лекарством удаляется его запись в списке на передачу."""
    medicine = get_medicine(db, medicine_id)
    db.delete(medicine)
    db.commit()
