from typing import Annotated, Any

from fastapi import Depends
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.schemas.common import ErrorResponse

DbSession = Annotated[Session, Depends(get_db)]

# Описание ошибок для документации Swagger
NOT_FOUND: dict[int | str, dict[str, Any]] = {404: {"model": ErrorResponse, "description": "Запись не найдена"}}
CONFLICT: dict[int | str, dict[str, Any]] = {409: {"model": ErrorResponse, "description": "Конфликт с текущими данными"}}
