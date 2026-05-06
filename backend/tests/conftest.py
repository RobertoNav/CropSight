import pytest
import pytest_asyncio
from httpx import AsyncClient, ASGITransport
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from app.main import app
from app.database import Base, get_db
from uuid import uuid4
from app.models.user import User
from app.core.security import hash_password


TEST_DATABASE_URL = "sqlite+aiosqlite:///./test.db"

engine_test = create_async_engine(TEST_DATABASE_URL, echo=False)
TestSessionLocal = async_sessionmaker(bind=engine_test, expire_on_commit=False)


async def override_get_db():
    async with TestSessionLocal() as session:
        yield session


app.dependency_overrides[get_db] = override_get_db


@pytest_asyncio.fixture(scope="session", autouse=True)
async def setup_db():
    async with engine_test.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield
    async with engine_test.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)


@pytest_asyncio.fixture
async def client():
    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as ac:
        yield ac

@pytest_asyncio.fixture
async def super_admin_token(client):
    async with TestSessionLocal() as db:
        # Evitar duplicado si el fixture corre varias veces
        from sqlalchemy import select
        result = await db.execute(select(User).where(User.email == "superadmin@test.com"))
        if not result.scalar_one_or_none():
            admin = User(
                id=uuid4(),
                name="Super Admin",
                email="superadmin@test.com",
                role="super_admin",
                is_active=True,
                password_hash=hash_password("SecurePass123!"),
            )
            db.add(admin)
            await db.commit()

    resp = await client.post("/api/v1/auth/login", json={
        "email": "superadmin@test.com",
        "password": "SecurePass123!"
    })
    return resp.json()["access_token"]


@pytest_asyncio.fixture
async def super_admin_id(client, super_admin_token):
    resp = await client.get(
        "/api/v1/users/me",
        headers={"Authorization": f"Bearer {super_admin_token}"}
    )
    return resp.json()["id"]
