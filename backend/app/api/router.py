from fastapi import APIRouter
from sqlalchemy import text

from app.api.deps import DbSession
from app.api.routes import categories, donations, medicines, shelters

api_router = APIRouter(prefix="/api")
api_router.include_router(medicines.router)
api_router.include_router(categories.router)
api_router.include_router(shelters.router)
api_router.include_router(donations.router)


@api_router.get("/health", tags=["Служебное"], summary="Проверка работы API и БД")
def health(db: DbSession) -> dict[str, str]:
    db.execute(text("SELECT 1"))
    return {"status": "ok", "database": "ok"}
