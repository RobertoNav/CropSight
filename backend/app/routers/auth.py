from datetime import datetime, timedelta, timezone
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.dependencies import get_current_user
from app.models.user import User
from app.models.refresh_token import RefreshToken
from app.core.security import (
    hash_password, verify_password, create_access_token,
    create_refresh_token, hash_refresh_token, decode_token,
    create_password_reset_token,
)
from app.core.exceptions import UnauthorizedException, ConflictException, InvalidTokenException
from app.schemas.auth import (
    RegisterRequest, LoginRequest, RefreshRequest, LogoutRequest,
    ForgotPasswordRequest, ResetPasswordRequest, AuthResponse, RefreshResponse, UserInToken,
)
from app.config import settings

router = APIRouter(prefix="/auth", tags=["Auth"])


@router.post("/register", response_model=AuthResponse, status_code=201)
async def register(payload: RegisterRequest, db: AsyncSession = Depends(get_db)):
    # Verificar email único
    existing = await db.execute(select(User).where(User.email == payload.email, User.deleted_at.is_(None)))
    if existing.scalar_one_or_none():
        raise ConflictException("El email ya está registrado.")

    user = User(
        name=payload.name,
        email=payload.email,
        password_hash=hash_password(payload.password),
    )
    db.add(user)
    await db.flush()  # obtener el ID antes del commit

    access_token, refresh_token_raw = await _create_tokens(user, db)
    await db.commit()
    await db.refresh(user)

    return AuthResponse(
        access_token=access_token,
        refresh_token=refresh_token_raw,
        user=UserInToken.model_validate(user),
    )


@router.post("/login", response_model=AuthResponse)
async def login(payload: LoginRequest, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.email == payload.email, User.deleted_at.is_(None)))
    user = result.scalar_one_or_none()

    # Mensaje genérico: no revelar si el email existe o no
    if not user or not verify_password(payload.password, user.password_hash) or not user.is_active:
        raise UnauthorizedException("Credenciales inválidas.")

    access_token, refresh_token_raw = await _create_tokens(user, db)
    await db.commit()

    return AuthResponse(
        access_token=access_token,
        refresh_token=refresh_token_raw,
        user=UserInToken.model_validate(user),
    )


@router.post("/refresh", response_model=RefreshResponse)
async def refresh_token(payload: RefreshRequest, db: AsyncSession = Depends(get_db)):
    token_hash = hash_refresh_token(payload.refresh_token)
    result = await db.execute(
        select(RefreshToken).where(RefreshToken.token_hash == token_hash)
    )
    stored = result.scalar_one_or_none()

    if not stored or stored.is_revoked or stored.expires_at < datetime.now(timezone.utc):
        raise UnauthorizedException("Refresh token inválido o expirado.")

    result_user = await db.execute(select(User).where(User.id == stored.user_id))
    user = result_user.scalar_one_or_none()
    if not user or not user.is_active:
        raise UnauthorizedException("Usuario no disponible.")

    new_access = create_access_token({
        "sub": str(user.id), "email": user.email,
        "role": user.role, "company_id": str(user.company_id) if user.company_id else None,
    })
    return RefreshResponse(access_token=new_access)


@router.post("/logout", status_code=204)
async def logout(payload: LogoutRequest, db: AsyncSession = Depends(get_db)):
    token_hash = hash_refresh_token(payload.refresh_token)
    result = await db.execute(
        select(RefreshToken).where(RefreshToken.token_hash == token_hash)
    )
    stored = result.scalar_one_or_none()
    if stored:
        stored.is_revoked = True
        await db.commit()


@router.post("/forgot-password", status_code=204)
async def forgot_password(payload: ForgotPasswordRequest, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.email == payload.email, User.deleted_at.is_(None)))
    user = result.scalar_one_or_none()
    if user:
        reset_token = create_password_reset_token(str(user.id))
        # TODO: Enviar por AWS SES. Por ahora se loggea en consola (desarrollo).
        print(f"[DEV] Reset token para {user.email}: {reset_token}")
    # Siempre 204 para no revelar si el email existe


@router.post("/reset-password", status_code=204)
async def reset_password(payload: ResetPasswordRequest, db: AsyncSession = Depends(get_db)):
    try:
        token_data = decode_token(payload.token)
    except Exception:
        raise InvalidTokenException()

    if token_data.get("scope") != "password_reset":
        raise InvalidTokenException()

    user_id = token_data.get("sub")
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise InvalidTokenException()

    user.password_hash = hash_password(payload.new_password)

    # Revocar todos los refresh tokens del usuario
    tokens_result = await db.execute(
        select(RefreshToken).where(RefreshToken.user_id == user.id, RefreshToken.is_revoked == False)
    )
    for token in tokens_result.scalars().all():
        token.is_revoked = True

    await db.commit()


@router.get("/me")
async def get_me(current_user: User = Depends(get_current_user)):
    return UserInToken.model_validate(current_user)


# ── Helper privado
async def _create_tokens(user: User, db: AsyncSession):
    access_token = create_access_token({
        "sub": str(user.id),
        "email": user.email,
        "role": user.role,
        "company_id": str(user.company_id) if user.company_id else None,
    })
    refresh_token_raw = create_refresh_token()
    stored = RefreshToken(
        user_id=user.id,
        token_hash=hash_refresh_token(refresh_token_raw),
        expires_at=datetime.now(timezone.utc) + timedelta(days=settings.refresh_token_expire_days),
    )
    db.add(stored)
    return access_token, refresh_token_raw
