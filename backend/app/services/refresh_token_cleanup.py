import asyncio
from datetime import datetime, timezone

from sqlalchemy import delete
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import AsyncSessionLocal
from app.models.refresh_token import RefreshToken

# Limpiar tokens cada dia (24 horas * 60 minutos * 60 segundos)
REFRESH_TOKEN_CLEANUP_INTERVAL_SECONDS = 86400


async def delete_expired_refresh_tokens(db: AsyncSession) -> int:
    result = await db.execute(
        delete(RefreshToken).where(RefreshToken.expires_at < datetime.now(timezone.utc))
    )
    await db.commit()
    return result.rowcount or 0


async def run_refresh_token_cleanup(interval_seconds: int = REFRESH_TOKEN_CLEANUP_INTERVAL_SECONDS) -> None:
    while True:
        async with AsyncSessionLocal() as db:
            try:
                await delete_expired_refresh_tokens(db)
            except SQLAlchemyError:
                await db.rollback()
        await asyncio.sleep(interval_seconds)
