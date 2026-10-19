from datetime import datetime

from pydantic import Field

from app.models.enums import ShelterKind
from app.schemas.category import CategoryRead
from app.schemas.common import InputSchema, OutputSchema, PatchSchema


class ShelterCreate(InputSchema):
    name: str = Field(min_length=1, max_length=200, examples=["Приют для животных «Верный друг»"])
    kind: ShelterKind
    address: str = Field(min_length=1, max_length=300, examples=["ул. Примерная, д. 12"])
    min_months_left: int = Field(0, ge=0, le=36, description="Минимальный остаток срока, мес.")
    category_ids: list[int] = Field(
        default_factory=list, description="Категории лекарств, которые принимает приют"
    )


class ShelterUpdate(PatchSchema):
    name: str | None = Field(None, min_length=1, max_length=200)
    kind: ShelterKind | None = None
    address: str | None = Field(None, min_length=1, max_length=300)
    min_months_left: int | None = Field(None, ge=0, le=36)
    category_ids: list[int] | None = None


class ShelterRead(OutputSchema):
    id: int
    name: str
    kind: ShelterKind
    address: str
    min_months_left: int
    categories: list[CategoryRead]
    created_at: datetime
    updated_at: datetime


class ShelterBrief(OutputSchema):
    id: int
    name: str
