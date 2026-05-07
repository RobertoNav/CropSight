import pytest
from httpx import AsyncClient
from datetime import datetime, timedelta, timezone
from uuid import uuid4
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.user import User
from app.models.refresh_token import RefreshToken
from app.core.security import hash_password
from app.services.refresh_token_cleanup import delete_expired_refresh_tokens


@pytest.mark.asyncio
async def test_register_success(client: AsyncClient):
    response = await client.post("/api/v1/auth/register", json={
        "name": "Test User",
        "email": "test@example.com",
        "password": "SecurePass123!",
    })
    assert response.status_code == 201
    data = response.json()
    assert "access_token" in data
    assert "refresh_token" in data
    assert data["user"]["email"] == "test@example.com"


@pytest.mark.asyncio
async def test_register_duplicate_email(client: AsyncClient):
    await client.post("/api/v1/auth/register", json={
        "name": "User One", "email": "dup@example.com", "password": "SecurePass123!",
    })
    response = await client.post("/api/v1/auth/register", json={
        "name": "User Two", "email": "dup@example.com", "password": "SecurePass123!",
    })
    assert response.status_code == 409


@pytest.mark.asyncio
async def test_login_success(client: AsyncClient):
    await client.post("/api/v1/auth/register", json={
        "name": "Login User", "email": "login@example.com", "password": "SecurePass123!",
    })
    response = await client.post("/api/v1/auth/login", json={
        "email": "login@example.com", "password": "SecurePass123!",
    })
    assert response.status_code == 200
    assert "access_token" in response.json()


@pytest.mark.asyncio
async def test_login_wrong_password(client: AsyncClient):
    await client.post("/api/v1/auth/register", json={
        "name": "Wrong Pass", "email": "wrong@example.com", "password": "SecurePass123!",
    })
    response = await client.post("/api/v1/auth/login", json={
        "email": "wrong@example.com", "password": "WrongPassword!",
    })
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_forgot_password_rate_limit(client: AsyncClient):
    for _ in range(3):
        response = await client.post("/api/v1/auth/forgot-password", json={
            "email": "ratelimit@example.com",
        })
        assert response.status_code == 204

    blocked = await client.post("/api/v1/auth/forgot-password", json={
        "email": "ratelimit@example.com",
    })
    assert blocked.status_code == 429
    assert blocked.json()["error"]["code"] == "TOO_MANY_REQUESTS"


@pytest.mark.asyncio
async def test_delete_expired_refresh_tokens_removes_only_expired(db_session: AsyncSession):
    user = User(
        id=uuid4(),
        name="Cleanup User",
        email=f"cleanup-{uuid4()}@example.com",
        password_hash=hash_password("SecurePass123!"),
    )
    db_session.add(user)
    await db_session.flush()

    expired_token = RefreshToken(
        user_id=user.id,
        token_hash=f"expired-{uuid4()}",
        expires_at=datetime.now(timezone.utc) - timedelta(days=1),
        is_revoked=False,
    )
    valid_token = RefreshToken(
        user_id=user.id,
        token_hash=f"valid-{uuid4()}",
        expires_at=datetime.now(timezone.utc) + timedelta(days=1),
        is_revoked=False,
    )
    db_session.add_all([expired_token, valid_token])
    await db_session.commit()

    deleted_count = await delete_expired_refresh_tokens(db_session)

    result = await db_session.execute(
        select(RefreshToken.token_hash).where(RefreshToken.user_id == user.id)
    )
    remaining_hashes = {token_hash for (token_hash,) in result.all()}

    assert deleted_count >= 1
    assert expired_token.token_hash not in remaining_hashes
    assert valid_token.token_hash in remaining_hashes


@pytest.mark.asyncio
async def test_health(client: AsyncClient):
    response = await client.get("/api/v1/health")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"
