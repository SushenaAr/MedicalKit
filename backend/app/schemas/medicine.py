from datetime import date, datetime

from pydantic import Field, computed_field

from app.models.enums import DonationStatus, MedicineForm
from app.schemas.category import CategoryRead
from app.schemas.common import InputSchema, OutputSchema, PatchSchema
from app.services.expiry import ExpiryStatus, days_left, expiry_status


class MedicineCreate(InputSchema):
    name: str = Field(min_length=1, max_length=200, examples=["Парацетамол"])
    substance: str = Field("", max_length=200, examples=["Парацетамол 500 мг"])
    form: MedicineForm
    quantity: str = Field("", max_length=50, examples=["20 таб."])
    expires_at: date = Field(description="Дата окончания срока годности, ГГГГ-ММ-ДД")
    opened: bool = False
    location: str = Field(min_length=1, max_length=200, examples=["Кухня, верхний ящик"])
    notes: str | None = Field(None, max_length=1000)
    category_id: int | None = Field(None, gt=0)


class MedicineUpdate(PatchSchema):
    NULLABLE_FIELDS = frozenset({"notes", "category_id"})

    name: str | None = Field(None, min_length=1, max_length=200)
    substance: str | None = Field(None, max_length=200)
    form: MedicineForm | None = None
    quantity: str | None = Field(None, max_length=50)
    expires_at: date | None = None
    opened: bool | None = None
    location: str | None = Field(None, min_length=1, max_length=200)
    notes: str | None = Field(None, max_length=1000)
    category_id: int | None = Field(None, gt=0)


class ExpiryInfo(OutputSchema):
    """Срок годности и вычисляемые на его основе поля."""

    expires_at: date

    @computed_field  # type: ignore[prop-decorator]
    @property
    def days_left(self) -> int:
        return days_left(self.expires_at)

    @computed_field  # type: ignore[prop-decorator]
    @property
    def expiry_status(self) -> ExpiryStatus:
        return expiry_status(self.days_left)


class DonationBrief(OutputSchema):
    id: int
    status: DonationStatus
    shelter_id: int | None
    handed_at: datetime | None


class MedicineRead(ExpiryInfo):
    id: int
    name: str
    substance: str
    form: MedicineForm
    quantity: str
    opened: bool
    location: str
    notes: str | None
    category: CategoryRead | None
    donation: DonationBrief | None
    created_at: datetime
    updated_at: datetime


class MedicineBrief(ExpiryInfo):
    id: int
    name: str
    opened: bool
