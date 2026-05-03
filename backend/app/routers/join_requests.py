from datetime import datetime, timezone
from typing import List, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.exceptions import ConflictException, ForbiddenException, NotFoundException
from app.database import get_db
from app.dependencies import get_current_user, require_company_admin
from app.models.company import Company
from app.models.join_request import JoinRequest
from app.models.user import User
from app.schemas.join_request import (
    JoinRequestCreate,
    JoinRequestResponse,
    ResolveJoinRequest,
)

# Importante: aunque este archivo se llame join_requests.py, el contrato API pide
# rutas bajo /companies, no bajo /join_requests.
router = APIRouter(prefix="/companies", tags=["JoinRequests"])


@router.post(
    "/join",
    response_model=JoinRequestResponse,
    status_code=status.HTTP_201_CREATED,
)
async def request_to_join_company(
    payload: JoinRequestCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Crea una solicitud pendiente para que un usuario se una a una compañía."""
    if current_user.role != "user":
        raise ForbiddenException(
            "Solo usuarios estándar pueden solicitar unirse a una compañía."
        )

    if current_user.company_id is not None:
        raise ConflictException("El usuario ya pertenece a una compañía.")

    company = await _get_company_or_404(db, payload.company_id)
    if company.status != "active":
        raise ConflictException(
            "La compañía no está activa y no acepta solicitudes."
        )

    existing_result = await db.execute(
        select(JoinRequest).where(
            JoinRequest.user_id == current_user.id,
            JoinRequest.company_id == payload.company_id,
            JoinRequest.status == "pending",
        )
    )
    if existing_result.scalar_one_or_none() is not None:
        raise ConflictException(
            "Ya existe una solicitud pendiente para esta compañía."
        )

    join_request = JoinRequest(
        user_id=current_user.id,
        company_id=payload.company_id,
        status="pending",
    )
    db.add(join_request)
    await db.commit()
    await db.refresh(join_request)

    return _to_response(join_request, current_user)


@router.get("/{id}/requests", response_model=List[JoinRequestResponse])
async def list_company_join_requests(
    id: UUID,
    status_filter: Optional[str] = Query(
        None,
        alias="status",
        pattern="^(pending|approved|rejected)$",
    ),
    current_user: User = Depends(require_company_admin),
    db: AsyncSession = Depends(get_db),
):
    """Lista solicitudes de ingreso de una compañía."""
    company_id = id
    _ensure_can_manage_company(current_user, company_id)
    await _get_company_or_404(db, company_id)

    query = (
        select(JoinRequest)
        .options(selectinload(JoinRequest.user))
        .where(JoinRequest.company_id == company_id)
        .order_by(JoinRequest.created_at.desc())
    )
    if status_filter is not None:
        query = query.where(JoinRequest.status == status_filter)

    result = await db.execute(query)
    join_requests = result.scalars().all()
    return [
        _to_response(join_request, join_request.user)
        for join_request in join_requests
    ]


@router.put("/{id}/requests/{req_id}", response_model=JoinRequestResponse)
async def resolve_company_join_request(
    id: UUID,
    req_id: UUID,
    payload: ResolveJoinRequest,
    current_user: User = Depends(require_company_admin),
    db: AsyncSession = Depends(get_db),
):
    """Aprueba o rechaza una solicitud de ingreso a una compañía."""
    company_id = id
    _ensure_can_manage_company(current_user, company_id)
    await _get_company_or_404(db, company_id)

    result = await db.execute(
        select(JoinRequest)
        .options(selectinload(JoinRequest.user))
        .where(
            JoinRequest.id == req_id,
            JoinRequest.company_id == company_id,
        )
    )
    join_request = result.scalar_one_or_none()
    if join_request is None:
        raise NotFoundException("Solicitud de ingreso no encontrada.")

    if join_request.status != "pending":
        raise ConflictException("La solicitud ya fue procesada.")

    request_user = join_request.user
    now = datetime.now(timezone.utc)

    if payload.action == "approve":
        if (
            request_user.company_id is not None
            and request_user.company_id != company_id
        ):
            raise ConflictException("El usuario ya pertenece a otra compañía.")

        join_request.status = "approved"
        join_request.resolved_at = now

        # El modelo actual no tiene tabla user_companies; usa users.company_id.
        # Si el equipo agrega user_companies, esta línea se cambia.
        request_user.company_id = company_id

    elif payload.action == "reject":
        join_request.status = "rejected"
        join_request.resolved_at = now

    await db.commit()
    await db.refresh(join_request)

    return _to_response(join_request, request_user)


async def _get_company_or_404(db: AsyncSession, company_id: UUID) -> Company:
    result = await db.execute(select(Company).where(Company.id == company_id))
    company = result.scalar_one_or_none()
    if company is None:
        raise NotFoundException("Compañía no encontrada.")
    return company


def _ensure_can_manage_company(current_user: User, company_id: UUID) -> None:
    """
    Multi-tenancy:
    - super_admin puede administrar cualquier compañía.
    - company_admin solo puede administrar su propia compañía.
    """
    if current_user.role == "super_admin":
        return

    if current_user.company_id != company_id:
        raise ForbiddenException("No tienes permisos para administrar esta compañía.")


def _to_response(join_request: JoinRequest, user: User) -> JoinRequestResponse:
    """
    JoinRequestResponse necesita user_name y user_email, pero esos campos viven
    en User, no en JoinRequest. Por eso armamos el response manualmente.
    """
    return JoinRequestResponse(
        id=join_request.id,
        user_id=join_request.user_id,
        user_name=user.name,
        user_email=user.email,
        company_id=join_request.company_id,
        status=join_request.status,
        created_at=join_request.created_at,
        resolved_at=join_request.resolved_at,
    )
