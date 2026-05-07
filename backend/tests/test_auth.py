import pytest
from httpx import AsyncClient


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
    for _ in range(5):
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
async def test_health(client: AsyncClient):
    response = await client.get("/api/v1/health")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"
