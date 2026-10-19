from typing import ClassVar, Self

from pydantic import BaseModel, ConfigDict, model_validator


class InputSchema(BaseModel):
    """Тело запроса: лишние поля запрещены, пробелы по краям строк обрезаются."""

    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)


class PatchSchema(InputSchema):
    """Тело PATCH-запроса: все поля необязательны, меняются только переданные.

    Явный null допускается только для полей из NULLABLE_FIELDS — остальные поля
    в базе обязательные, и null для них — ошибка клиента.
    """

    NULLABLE_FIELDS: ClassVar[frozenset[str]] = frozenset()

    @model_validator(mode="after")
    def _reject_nulls(self) -> Self:
        for field in self.model_fields_set:
            if getattr(self, field) is None and field not in self.NULLABLE_FIELDS:
                raise ValueError(f"Поле «{field}» не может быть null")
        return self


class OutputSchema(BaseModel):
    """Тело ответа: строится из объектов SQLAlchemy."""

    model_config = ConfigDict(from_attributes=True)


class ErrorResponse(BaseModel):
    detail: str


class FieldError(BaseModel):
    field: str
    message: str


class ValidationErrorResponse(BaseModel):
    detail: str
    errors: list[FieldError]
