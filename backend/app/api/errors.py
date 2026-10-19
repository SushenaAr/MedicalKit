"""Перевод исключений в HTTP-ответы с понятными сообщениями на русском."""

from typing import Any

from fastapi import FastAPI, Request, status
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from sqlalchemy.exc import IntegrityError, OperationalError

from app.core.errors import AppError

# Сообщения для частых ошибок валидации Pydantic
_MESSAGES: dict[str, str] = {
    "missing": "Обязательное поле",
    "extra_forbidden": "Неизвестное поле",
    "string_type": "Ожидается строка",
    "string_too_short": "Значение слишком короткое (минимум {min_length} симв.)",
    "string_too_long": "Значение слишком длинное (максимум {max_length} симв.)",
    "int_type": "Ожидается целое число",
    "int_parsing": "Ожидается целое число",
    "bool_type": "Ожидается true или false",
    "bool_parsing": "Ожидается true или false",
    "greater_than": "Значение должно быть больше {gt}",
    "greater_than_equal": "Значение должно быть не меньше {ge}",
    "less_than_equal": "Значение должно быть не больше {le}",
    "date_type": "Ожидается дата в формате ГГГГ-ММ-ДД",
    "date_parsing": "Ожидается дата в формате ГГГГ-ММ-ДД",
    "date_from_datetime_parsing": "Ожидается дата в формате ГГГГ-ММ-ДД",
    "enum": "Допустимые значения: {expected}",
    "list_type": "Ожидается список",
    "json_invalid": "Некорректный JSON",
    "model_attributes_type": "Ожидается JSON-объект",
}


def _field_name(loc: tuple[Any, ...]) -> str:
    # ("body", "name") -> "name"; ("query", "status") -> "status"
    parts = [str(part) for part in loc[1:]] if len(loc) > 1 else [str(part) for part in loc]
    return ".".join(parts) or "body"


def _message(error: dict[str, Any]) -> str:
    if error["type"] == "value_error":
        return str(error["msg"]).removeprefix("Value error, ")
    template = _MESSAGES.get(error["type"])
    if template is None:
        return str(error["msg"])
    ctx = dict(error.get("ctx", {}))
    if "expected" in ctx:
        # Pydantic перечисляет варианты как "'a', 'b' or 'c'"
        ctx["expected"] = str(ctx["expected"]).replace(" or ", ", ")
    try:
        return template.format(**ctx)
    except (KeyError, IndexError):
        return str(error["msg"])


async def app_error_handler(_: Request, exc: Exception) -> JSONResponse:
    assert isinstance(exc, AppError)
    return JSONResponse(status_code=exc.status_code, content={"detail": exc.message})


async def validation_error_handler(_: Request, exc: Exception) -> JSONResponse:
    assert isinstance(exc, RequestValidationError)
    errors = [{"field": _field_name(tuple(e["loc"])), "message": _message(e)} for e in exc.errors()]
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
        content={"detail": "Некорректные данные запроса", "errors": errors},
    )


async def integrity_error_handler(_: Request, __: Exception) -> JSONResponse:
    # Страховка на случай гонки: правила проверяются в сервисах, но последнее слово за БД
    return JSONResponse(
        status_code=status.HTTP_409_CONFLICT,
        content={"detail": "Операция нарушает ограничения базы данных"},
    )


async def database_unavailable_handler(_: Request, __: Exception) -> JSONResponse:
    return JSONResponse(
        status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
        content={"detail": "База данных недоступна"},
    )


def register_exception_handlers(app: FastAPI) -> None:
    app.add_exception_handler(AppError, app_error_handler)
    app.add_exception_handler(RequestValidationError, validation_error_handler)
    app.add_exception_handler(IntegrityError, integrity_error_handler)
    app.add_exception_handler(OperationalError, database_unavailable_handler)
