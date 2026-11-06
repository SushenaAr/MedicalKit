from typing import TYPE_CHECKING

from sqlalchemy import String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, TimestampMixin, pg_enum
from app.models.enums import UserRole

if TYPE_CHECKING:
    from app.models.medicine import Medicine
    from app.models.refresh_token import RefreshToken


class User(TimestampMixin, Base):
    """Пользователь приложения. Пароль хранится только в виде хеша Argon2id."""

    __tablename__ = "users"

    id: Mapped[int] = mapped_column(primary_key=True)
    # Email хранится в нижнем регистре, поэтому уникальность не зависит от регистра
    email: Mapped[str] = mapped_column(String(254), unique=True)
    name: Mapped[str] = mapped_column(String(100))
    password_hash: Mapped[str] = mapped_column(String(255))
    role: Mapped[UserRole] = mapped_column(
        pg_enum(UserRole, "user_role"), default=UserRole.USER, server_default=UserRole.USER.value
    )

    medicines: Mapped[list["Medicine"]] = relationship(back_populates="owner", passive_deletes=True)
    refresh_tokens: Mapped[list["RefreshToken"]] = relationship(
        back_populates="user", passive_deletes=True
    )
