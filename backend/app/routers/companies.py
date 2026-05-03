from typing import List

from fastapi import APIRouter, Depends, Query
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.dependencies import get_current_user
from app.models.company import Company
from app.models.user import User
from app.schemas.company import CompanySearchResult

router = APIRouter(prefix="/companies", tags=["Companies"])


@router.get("/search", response_model=List[CompanySearchResult])
async def search_companies(
    name: str = Query(..., min_length=1, max_length=255),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Busca compañías activas por nombre para que un usuario pueda solicitar unirse.

    Nota: current_user se inyecta aunque no se use directamente para forzar que el
    endpoint requiera Authorization: Bearer <token>, como indica el contrato.
    """
    search_term = name.strip()
    if not search_term:
        return []

    result = await db.execute(
        select(Company)
        .where(
            Company.status == "active",
            Company.name.ilike(f"%{search_term}%"),
        )
        .order_by(Company.name.asc())
        .limit(20)
    )
    return list(result.scalars().all())
