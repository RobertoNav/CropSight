from uuid import UUID
from typing import Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.dependencies import get_current_user, require_super_admin
from app.models.user import User
from app.core.security import verify_password, hash_password
from app.core.exceptions import NotFoundException, ForbiddenException
from app.schemas.user import UserResponse, UpdateProfileRequest, UpdateUserStatusRequest, PaginatedUserResponse
from app.utils.pagination import paginate

router = APIRouter(prefix="/users", tags=["Users"])


@router.get("/me", response_model=UserResponse)
async def get_my_profile(current_user: User = Depends(get_current_user)):
    return current_user


@router.put("/me", response_model=UserResponse)
async def update_my_profile(
    payload: UpdateProfileRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if payload.name:
        current_user.name = payload.name
    if payload.new_password:
        if not verify_password(payload.current_password, current_user.password_hash):
            raise ForbiddenException("El password actual es incorrecto.")
        current_user.password_hash = hash_password(payload.new_password)
    await db.commit()
    await db.refresh(current_user)
    return current_user


@router.get("/", response_model=PaginatedUserResponse)
async def list_all_users(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    search: Optional[str] = Query(None),
    role: Optional[str] = Query(None),
    company_id: Optional[UUID] = Query(None),
    current_user: User = Depends(require_super_admin),
    db: AsyncSession = Depends(get_db),
):
    query = select(User).where(User.deleted_at.is_(None))
    if search:
        query = query.where(
            User.name.ilike(f"%{search}%") | User.email.ilike(f"%{search}%")
        )
    if role:
        query = query.where(User.role == role)
    if company_id:
        query = query.where(User.company_id == company_id)

    count_query = select(func.count()).select_from(query.subquery())
    return await paginate(db, query.order_by(User.created_at.desc()), count_query, page, limit)


@router.get("/{user_id}", response_model=UserResponse)
async def get_user_by_id(
    user_id: UUID,
    current_user: User = Depends(require_super_admin),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(User).where(User.id == user_id, User.deleted_at.is_(None)))
    user = result.scalar_one_or_none()
    if not user:
        raise NotFoundException("Usuario no encontrado.")
    return user


@router.put("/{user_id}/status", response_model=UserResponse)
async def update_user_status(
    user_id: UUID,
    payload: UpdateUserStatusRequest,
    current_user: User = Depends(require_super_admin),
    db: AsyncSession = Depends(get_db),
):
    if user_id == current_user.id:
        raise ForbiddenException("No puedes desactivarte a ti mismo.")

    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise NotFoundException("Usuario no encontrado.")
    if user.role == "super_admin":
        raise ForbiddenException("No puedes modificar a otro super admin.")

    user.is_active = payload.is_active
    await db.commit()
    await db.refresh(user)
    return user
