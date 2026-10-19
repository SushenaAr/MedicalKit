from datetime import datetime

from pydantic import Field

from app.models.enums import DonationStatus
from app.schemas.common import InputSchema, OutputSchema, PatchSchema
from app.schemas.medicine import MedicineBrief
from app.schemas.shelter import ShelterBrief


class DonationCreate(InputSchema):
    medicine_id: int = Field(gt=0)
    shelter_id: int | None = Field(None, gt=0)


class DonationUpdate(PatchSchema):
    NULLABLE_FIELDS = frozenset({"shelter_id"})

    shelter_id: int | None = Field(None, gt=0, description="null — снять назначенный приют")
    status: DonationStatus | None = Field(None, description="handed — отметить передачу")


class DonationRead(OutputSchema):
    id: int
    status: DonationStatus
    created_at: datetime
    handed_at: datetime | None
    medicine: MedicineBrief
    shelter: ShelterBrief | None
