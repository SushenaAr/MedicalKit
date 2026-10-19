from typing import TYPE_CHECKING

from sqlalchemy import CheckConstraint, Column, ForeignKey, SmallInteger, String, Table
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, TimestampMixin, pg_enum
from app.models.enums import ShelterKind

if TYPE_CHECKING:
    from app.models.category import Category
    from app.models.donation import Donation


# Связь «многие ко многим»: какие категории лекарств принимает приют
shelter_categories = Table(
    "shelter_categories",
    Base.metadata,
    Column("shelter_id", ForeignKey("shelters.id", ondelete="CASCADE"), primary_key=True),
    Column("category_id", ForeignKey("categories.id", ondelete="CASCADE"), primary_key=True),
)


class Shelter(TimestampMixin, Base):
    """Приют или центр, который принимает лекарства."""

    __tablename__ = "shelters"
    __table_args__ = (
        CheckConstraint("min_months_left >= 0", name="min_months_left_non_negative"),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(200), unique=True)
    kind: Mapped[ShelterKind] = mapped_column(pg_enum(ShelterKind, "shelter_kind"))
    address: Mapped[str] = mapped_column(String(300))
    # Минимальный остаток срока годности (в месяцах), с которым приют принимает лекарства
    min_months_left: Mapped[int] = mapped_column(SmallInteger, default=0, server_default="0")

    categories: Mapped[list["Category"]] = relationship(
        secondary=shelter_categories, back_populates="shelters", order_by="Category.name"
    )
    # passive_deletes="all": удаление приюта с передачами блокирует сама БД (ON DELETE RESTRICT)
    donations: Mapped[list["Donation"]] = relationship(
        back_populates="shelter", passive_deletes="all"
    )
