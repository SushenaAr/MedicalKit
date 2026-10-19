from typing import TYPE_CHECKING

from sqlalchemy import String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base

if TYPE_CHECKING:
    from app.models.medicine import Medicine
    from app.models.shelter import Shelter


class Category(Base):
    """Группа лекарств: «Антисептики», «Жаропонижающие» и т. п."""

    __tablename__ = "categories"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(100), unique=True)

    medicines: Mapped[list["Medicine"]] = relationship(
        back_populates="category", passive_deletes=True
    )
    shelters: Mapped[list["Shelter"]] = relationship(
        secondary="shelter_categories", back_populates="categories"
    )
