"""Исключения бизнес-логики.

Сервисы не знают про HTTP: они выбрасывают эти исключения,
а в коды ответов их переводит слой API (app/api/errors.py).
"""


class AppError(Exception):
    status_code = 400

    def __init__(self, message: str) -> None:
        super().__init__(message)
        self.message = message


class NotFoundError(AppError):
    """Запрошенная запись не существует."""

    status_code = 404


class ConflictError(AppError):
    """Операция противоречит текущему состоянию данных или правилам предметной области."""

    status_code = 409


class InvalidReferenceError(AppError):
    """В теле запроса указан id связанной записи, которой нет в базе."""

    status_code = 422
