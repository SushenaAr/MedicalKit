from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import CheckConstraint, DateTime, ForeignKey, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, pg_enum
from app.models.enums import DonationStatus

if TYPE_CHECKING:
    from app.models.medicine import Medicine
    from app.models.shelter import Shelter


class Donation(Base):
    """Запись списка «Отдать до срока»: какое лекарство, в какой приют и передано ли."""

    __tablename__ = "donations"
    __table_args__ = (
        CheckConstraint(
            "status <> 'handed' OR (shelter_id IS NOT NULL AND handed_at IS NOT NULL)",
            name="handed_requires_shelter",
        ),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    medicine_id: Mapped[int] = mapped_column(
        ForeignKey("medicines.id", ondelete="CASCADE"), unique=True
    )
    shelter_id: Mapped[int | None] = mapped_column(
        ForeignKey("shelters.id", ondelete="RESTRICT"), index=True
    )
    status: Mapped[DonationStatus] = mapped_column(
        pg_enum(DonationStatus, "donation_status"),
        default=DonationStatus.PLANNED,
        server_default=DonationStatus.PLANNED.value,
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    handed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))

    medicine: Mapped["Medicine"] = relationship(back_populates="donation")
    shelter: Mapped["Shelter | None"] = relationship(back_populates="donations")
