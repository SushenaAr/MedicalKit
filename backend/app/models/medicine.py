from datetime import date
from typing import TYPE_CHECKING

from sqlalchemy import Date, ForeignKey, String, Text, false
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, TimestampMixin, pg_enum
from app.models.enums import MedicineForm

if TYPE_CHECKING:
    from app.models.category import Category
    from app.models.donation import Donation


class Medicine(TimestampMixin, Base):
    """Лекарство в домашней аптечке."""

    __tablename__ = "medicines"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(200))
    substance: Mapped[str] = mapped_column(String(200), default="", server_default="")
    form: Mapped[MedicineForm] = mapped_column(pg_enum(MedicineForm, "medicine_form"))
    quantity: Mapped[str] = mapped_column(String(50), default="", server_default="")
    expires_at: Mapped[date] = mapped_column(Date, index=True)
    opened: Mapped[bool] = mapped_column(default=False, server_default=false())
    location: Mapped[str] = mapped_column(String(200))
    notes: Mapped[str | None] = mapped_column(Text)
    category_id: Mapped[int | None] = mapped_column(
        ForeignKey("categories.id", ondelete="SET NULL"), index=True
    )

    category: Mapped["Category | None"] = relationship(back_populates="medicines")
    # Связь «один к одному»: лекарство может стоять в списке на передачу только один раз
    donation: Mapped["Donation | None"] = relationship(
        back_populates="medicine", cascade="all, delete-orphan", passive_deletes=True
    )
