"""Исключения бизнес-логики.

Сервисы не знают про HTTP: они выбрасывают эти исключения,
а в коды ответов их переводит слой API (app/api/errors.py).
"""


class AppError(Exception):
    status_code = 400

    def __init__(self, message: str, code: str | None = None) -> None:
        super().__init__(message)
        self.message = message
        # Необязательный машиночитаемый код, по которому клиент может выбрать реакцию
        self.code = code


class UnauthorizedError(AppError):
    """Пользователь не аутентифицирован: нет токена, он неверный, истёк или отозван."""

    status_code = 401


class ForbiddenError(AppError):
    """Пользователь аутентифицирован, но у него нет права на операцию."""

    status_code = 403


class NotFoundError(AppError):
    """Запрошенная запись не существует."""

    status_code = 404


class ConflictError(AppError):
    """Операция противоречит текущему состоянию данных или правилам предметной области."""

    status_code = 409


class InvalidReferenceError(AppError):
    """В теле запроса указан id связанной записи, которой нет в базе."""

    status_code = 422
