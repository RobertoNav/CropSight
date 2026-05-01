import secrets
import hashlib
from datetime import datetime, timedelta, timezone
from typing import Optional

from jose import JWTError, jwt
from passlib.context import CryptContext

from app.config import settings

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def hash_password(password: str) -> str:
    """Genera bcrypt hash del password."""
    return pwd_context.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verifica password contra su hash bcrypt."""
    return pwd_context.verify(plain_password, hashed_password)


def create_access_token(data: dict) -> str:
    """
    Crea JWT de acceso con expiración de ACCESS_TOKEN_EXPIRE_MINUTES.
    data debe incluir: sub (user_id), email, role, company_id.
    """
    payload = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(
        minutes=settings.access_token_expire_minutes
    )
    payload.update({"exp": expire, "type": "access"})
    return jwt.encode(payload, settings.secret_key, algorithm=settings.algorithm)


def create_password_reset_token(user_id: str) -> str:
    """Crea JWT especial para reset de password. Expira en 1 hora."""
    payload = {
        "sub": user_id,
        "scope": "password_reset",
        "exp": datetime.now(timezone.utc) + timedelta(hours=1),
        "type": "reset",
    }
    return jwt.encode(payload, settings.secret_key, algorithm=settings.algorithm)


def decode_token(token: str) -> dict:
    """
    Decodifica y valida el JWT.
    Lanza JWTError si es inválido, expirado o malformado.
    """
    return jwt.decode(token, settings.secret_key, algorithms=[settings.algorithm])


def create_refresh_token() -> str:
    """Genera refresh token aleatorio seguro de 64 bytes."""
    return secrets.token_urlsafe(64)


def hash_refresh_token(token: str) -> str:
    """SHA-256 del refresh token para almacenamiento seguro en DB."""
    return hashlib.sha256(token.encode()).hexdigest()
