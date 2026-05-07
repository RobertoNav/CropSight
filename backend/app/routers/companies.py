from typing import List, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, Query, Response, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import (
    BadRequestException,
    ConflictException,
    ForbiddenException,
    NotFoundException,
)
from app.database import get_db
from app.dependencies import get_current_user, require_company_admin, require_super_admin
from app.models.company import Company
from app.models.user import User
from app.schemas.company import (
    CompanyResponse,
    CompanySearchResult,
    CreateCompanyRequest,
    PaginatedCompanyResponse,
    UpdateCompanyRequest,
    UpdateCompanyStatusRequest,
)
from app.schemas.user import UserResponse
from app.utils.pagination import paginate

router = APIRouter(prefix="/companies", tags=["Companies"])


@router.get("/search", response_model=List[CompanySearchResult])
async def search_companies(
    name: str = Query(..., min_length=2, max_length=255),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Busca compañías activas por nombre para que un usuario pueda solicitar unirse.

    Nota: current_user se inyecta aunque no se use directamente para forzar que el
    endpoint requiera Authorization: Bearer <token>, como indica el contrato.
    """
    search_term = name.strip()
    if len(search_term) < 2:
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


@router.post("", response_model=CompanyResponse, status_code=status.HTTP_201_CREATED)
async def create_company(
    payload: CreateCompanyRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Crea una compañía y convierte al usuario autenticado en company_admin."""
    if current_user.company_id is not None:
        raise ConflictException("El usuario ya pertenece a una compañía.")

    if current_user.role != "user":
        raise ForbiddenException("Solo usuarios estándar pueden crear una compañía.")

    existing_result = await db.execute(
        select(Company).where(func.lower(Company.name) == payload.name.lower())
    )
    if existing_result.scalar_one_or_none() is not None:
        raise ConflictException("Ya existe una compañía con ese nombre.")

    company = Company(name=payload.name, sector=payload.sector, status="active")
    db.add(company)
    await db.flush()

    current_user.company_id = company.id
    current_user.role = "company_admin"

    await db.commit()
    await db.refresh(company)
    await db.refresh(current_user)

    return company


@router.get("", response_model=PaginatedCompanyResponse)
async def list_companies(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    search: Optional[str] = Query(None),
    status_filter: Optional[str] = Query(
        None,
        alias="status",
        pattern="^(active|suspended)$",
    ),
    current_user: User = Depends(require_super_admin),
    db: AsyncSession = Depends(get_db),
):
    """Lista compañías con paginación. Solo super_admin."""
    query = select(Company)

    if search:
        query = query.where(Company.name.ilike(f"%{search.strip()}%"))

    if status_filter:
        query = query.where(Company.status == status_filter)

    count_query = select(func.count()).select_from(query.subquery())
    return await paginate(
        db,
        query.order_by(Company.created_at.desc()),
        count_query,
        page,
        limit,
    )


@router.put("/{id}/status", response_model=CompanyResponse)
async def update_company_status(
    id: UUID,
    payload: UpdateCompanyStatusRequest,
    current_user: User = Depends(require_super_admin),
    db: AsyncSession = Depends(get_db),
):
    """Activa o suspende una compañía. Solo super_admin."""
    company = await _get_company_or_404(db, id)
    company.status = payload.status

    await db.commit()
    await db.refresh(company)

    return company


@router.get("/{id}/users", response_model=List[UserResponse])
async def list_company_users(
    id: UUID,
    current_user: User = Depends(require_company_admin),
    db: AsyncSession = Depends(get_db),
):
    """Lista usuarios de una compañía."""
    company = await _get_company_or_404(db, id)
    _ensure_can_manage_company(current_user, company.id)

    result = await db.execute(
        select(User)
        .where(User.company_id == company.id, User.deleted_at.is_(None))
        .order_by(User.created_at.desc())
    )
    return list(result.scalars().all())


@router.delete("/{id}/users/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
async def remove_company_user(
    id: UUID,
    user_id: UUID,
    current_user: User = Depends(require_company_admin),
    db: AsyncSession = Depends(get_db),
):
    """Remueve a un usuario de una compañía y revierte su rol a user."""
    if user_id == current_user.id:
        raise BadRequestException("No puedes removerte a ti mismo de la compañía.")

    company = await _get_company_or_404(db, id)
    _ensure_can_manage_company(current_user, company.id)

    result = await db.execute(
        select(User).where(User.id == user_id, User.deleted_at.is_(None))
    )
    user = result.scalar_one_or_none()
    if user is None or user.company_id != company.id:
        raise NotFoundException("Usuario no encontrado en esta compañía.")

    user.company_id = None
    user.role = "user"

    await db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.get("/{id}", response_model=CompanyResponse)
async def get_company(
    id: UUID,
    current_user: User = Depends(require_company_admin),
    db: AsyncSession = Depends(get_db),
):
    """Obtiene el detalle de una compañía."""
    company = await _get_company_or_404(db, id)
    _ensure_can_manage_company(current_user, company.id)
    return company


@router.put("/{id}", response_model=CompanyResponse)
async def update_company(
    id: UUID,
    payload: UpdateCompanyRequest,
    current_user: User = Depends(require_company_admin),
    db: AsyncSession = Depends(get_db),
):
    """Actualiza name y/o logo_url de una compañía."""
    company = await _get_company_or_404(db, id)
    _ensure_can_manage_company(current_user, company.id)

    if payload.name is not None and payload.name != company.name:
        existing_result = await db.execute(
            select(Company).where(
                func.lower(Company.name) == payload.name.lower(),
                Company.id != company.id,
            )
        )
        if existing_result.scalar_one_or_none() is not None:
            raise ConflictException("Ya existe una compañía con ese nombre.")
        company.name = payload.name

    if payload.logo_url is not None:
        company.logo_url = payload.logo_url

    await db.commit()
    await db.refresh(company)

    return company


async def _get_company_or_404(db: AsyncSession, company_id: UUID) -> Company:
    result = await db.execute(select(Company).where(Company.id == company_id))
    company = result.scalar_one_or_none()
    if company is None:
        raise NotFoundException("Compañía no encontrada.")
    return company


def _ensure_can_manage_company(current_user: User, company_id: UUID) -> None:
    """
    Multi-tenancy:
    - super_admin puede operar cualquier compañía.
    - company_admin solo puede operar su propia compañía.
    """
    if current_user.role == "super_admin":
        return

    if current_user.company_id != company_id:
        raise ForbiddenException("No tienes permisos para administrar esta compañía.")