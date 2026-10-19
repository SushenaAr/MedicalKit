"""Правила сроков годности и передачи лекарств (те же, что во frontend)."""

from datetime import date
from enum import StrEnum
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from app.models import Medicine, Shelter

SOON_DAYS = 30
"""Сколько дней до конца срока считается «скоро истекает»."""
DONATE_MIN_DAYS = 30
"""Меньше этого остатка срока лекарство передавать нельзя."""
DONATE_SUGGEST_MAX_DAYS = 180
"""Лекарства с остатком срока до полугода предлагаем отдать."""
DAYS_IN_MONTH = 30


class ExpiryStatus(StrEnum):
    EXPIRED = "expired"
    SOON = "soon"
    OK = "ok"


def days_left(expires_at: date, today: date | None = None) -> int:
    return (expires_at - (today or date.today())).days


def expiry_status(days: int) -> ExpiryStatus:
    if days < 0:
        return ExpiryStatus.EXPIRED
    if days <= SOON_DAYS:
        return ExpiryStatus.SOON
    return ExpiryStatus.OK


def donation_block_reason(medicine: "Medicine") -> str | None:
    """Почему лекарство нельзя отдать в приют; None, если можно."""
    days = days_left(medicine.expires_at)
    if days < 0:
        return "Срок годности истёк: лекарство нужно сдать на утилизацию, передавать его нельзя"
    if medicine.opened:
        return "Передать можно только лекарство в невскрытой упаковке"
    if days < DONATE_MIN_DAYS:
        return f"До окончания срока годности меньше {DONATE_MIN_DAYS} дней — такие лекарства не передают"
    return None


def shelter_block_reason(shelter: "Shelter", medicine: "Medicine") -> str | None:
    """Почему конкретный приют не примет лекарство; None, если примет."""
    if days_left(medicine.expires_at) < shelter.min_months_left * DAYS_IN_MONTH:
        return (
            f"{shelter.name}: принимают лекарства с остатком срока годности "
            f"от {shelter.min_months_left} мес."
        )
    accepted_ids = {category.id for category in shelter.categories}
    if accepted_ids and medicine.category_id is not None and medicine.category_id not in accepted_ids:
        category_name = medicine.category.name if medicine.category else medicine.category_id
        return f"{shelter.name}: не принимают лекарства категории «{category_name}»"
    return None
