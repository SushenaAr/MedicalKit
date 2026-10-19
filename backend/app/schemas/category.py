from pydantic import Field

from app.schemas.common import InputSchema, OutputSchema, PatchSchema


class CategoryCreate(InputSchema):
    name: str = Field(min_length=1, max_length=100, examples=["Антисептики"])


class CategoryUpdate(PatchSchema):
    name: str | None = Field(None, min_length=1, max_length=100)


class CategoryRead(OutputSchema):
    id: int
    name: str
