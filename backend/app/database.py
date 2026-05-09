import ssl
from pathlib import Path
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
from sqlalchemy.orm import DeclarativeBase
from app.config import settings

is_sqlite = "sqlite" in settings.database_url

def _connect_args():
    if is_sqlite:
        return {"check_same_thread": False}
    cert = Path(__file__).resolve().parent.parent / "global-bundle.pem"
    if cert.exists():
        ctx = ssl.create_default_context(cafile=str(cert))
        return {"ssl": ctx}
    return {"ssl": True}

engine = create_async_engine(
    settings.database_url,
    echo=settings.environment == "development",
    connect_args=_connect_args(),
    **({} if is_sqlite else {"pool_pre_ping": True, "pool_size": 10, "max_overflow": 20}),
)

AsyncSessionLocal = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autoflush=False,
    autocommit=False,
)


class Base(DeclarativeBase):
    pass


async def get_db() -> AsyncSession:
    async with AsyncSessionLocal() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()
