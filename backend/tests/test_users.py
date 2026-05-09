import pytest
from uuid import uuid4
from httpx import AsyncClient

BASE = "/api/v1"


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

async def register(client: AsyncClient, email: str, password: str = "SecurePass123!", name: str = "Test User"):
    resp = await client.post(f"{BASE}/auth/register", json={"name": name, "email": email, "password": password})
    return resp


async def login(client: AsyncClient, email: str, password: str = "SecurePass123!") -> str:
    resp = await client.post(f"{BASE}/auth/login", json={"email": email, "password": password})
    return resp.json()["access_token"]


def auth(token: str) -> dict:
    return {"Authorization": f"Bearer {token}"}


# ---------------------------------------------------------------------------
# GET /users/me
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_get_me_returns_own_profile(client: AsyncClient):
    await register(client, "me_profile@example.com")
    token = await login(client, "me_profile@example.com")

    response = await client.get(f"{BASE}/users/me", headers=auth(token))

    assert response.status_code == 200
    assert response.json()["email"] == "me_profile@example.com"


@pytest.mark.asyncio
async def test_get_me_unauthenticated_returns_401(client: AsyncClient):
    response = await client.get(f"{BASE}/users/me")

    assert response.status_code == 401


@pytest.mark.asyncio
async def test_get_me_response_has_required_fields(client: AsyncClient):
    await register(client, "me_fields@example.com")
    token = await login(client, "me_fields@example.com")

    response = await client.get(f"{BASE}/users/me", headers=auth(token))

    data = response.json()
    for field in ("id", "email", "name", "role", "is_active"):
        assert field in data


# ---------------------------------------------------------------------------
# PUT /users/me
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_update_me_name(client: AsyncClient):
    await register(client, "update_name@example.com")
    token = await login(client, "update_name@example.com")

    response = await client.put(f"{BASE}/users/me", json={"name": "Nuevo Nombre"}, headers=auth(token))

    assert response.status_code == 200
    assert response.json()["name"] == "Nuevo Nombre"


@pytest.mark.asyncio
async def test_update_me_wrong_current_password_returns_403(client: AsyncClient):
    await register(client, "update_pw_wrong@example.com")
    token = await login(client, "update_pw_wrong@example.com")

    response = await client.put(
        f"{BASE}/users/me",
        json={"current_password": "WrongPassword!", "new_password": "NewPass456!"},
        headers=auth(token),
    )

    assert response.status_code == 403


@pytest.mark.asyncio
async def test_update_me_password_success(client: AsyncClient):
    await register(client, "update_pw_ok@example.com", password="SecurePass123!")
    token = await login(client, "update_pw_ok@example.com", password="SecurePass123!")

    response = await client.put(
        f"{BASE}/users/me",
        json={"current_password": "SecurePass123!", "new_password": "NewPass456!"},
        headers=auth(token),
    )

    assert response.status_code == 200
    # El nuevo password debe funcionar para login
    login_resp = await client.post(f"{BASE}/auth/login", json={"email": "update_pw_ok@example.com", "password": "NewPass456!"})
    assert login_resp.status_code == 200


# ---------------------------------------------------------------------------
# GET /users/  (requiere super_admin)
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_list_users_forbidden_for_normal_user(client: AsyncClient):
    await register(client, "list_forbidden@example.com")
    token = await login(client, "list_forbidden@example.com")

    response = await client.get(f"{BASE}/users/", headers=auth(token))

    assert response.status_code == 403


@pytest.mark.asyncio
async def test_list_users_returns_paginated_response(client: AsyncClient, super_admin_token: str):
    response = await client.get(f"{BASE}/users/", headers=auth(super_admin_token))

    assert response.status_code == 200
    data = response.json()
    assert "items" in data and "total" in data


@pytest.mark.asyncio
async def test_list_users_search_filter(client: AsyncClient, super_admin_token: str):
    await register(client, "searchable@example.com", name="Searchable User")

    response = await client.get(f"{BASE}/users/?search=searchable@example.com", headers=auth(super_admin_token))

    assert response.status_code == 200
    items = response.json()["items"]
    assert any(u["email"] == "searchable@example.com" for u in items)


# ---------------------------------------------------------------------------
# GET /users/{user_id}
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_get_user_by_id_success(client: AsyncClient, super_admin_token: str):
    reg = await register(client, "getbyid@example.com")
    user_id = reg.json()["user"]["id"]

    response = await client.get(f"{BASE}/users/{user_id}", headers=auth(super_admin_token))

    assert response.status_code == 200
    assert response.json()["id"] == user_id


@pytest.mark.asyncio
async def test_get_user_by_id_not_found(client: AsyncClient, super_admin_token: str):
    response = await client.get(f"{BASE}/users/{uuid4()}", headers=auth(super_admin_token))

    assert response.status_code == 404


@pytest.mark.asyncio
async def test_get_user_by_id_forbidden_for_normal_user(client: AsyncClient):
    reg = await register(client, "getbyid_forbidden@example.com")
    user_id = reg.json()["user"]["id"]
    token = await login(client, "getbyid_forbidden@example.com")

    response = await client.get(f"{BASE}/users/{user_id}", headers=auth(token))

    assert response.status_code == 403


# ---------------------------------------------------------------------------
# PUT /users/{user_id}/status
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_update_status_deactivates_user(client: AsyncClient, super_admin_token: str):
    reg = await register(client, "deactivate@example.com")
    user_id = reg.json()["user"]["id"]

    response = await client.put(
        f"{BASE}/users/{user_id}/status",
        json={"is_active": False},
        headers=auth(super_admin_token),
    )

    assert response.status_code == 200
    assert response.json()["is_active"] is False


@pytest.mark.asyncio
async def test_update_status_cannot_modify_self(client: AsyncClient, super_admin_token: str, super_admin_id: str):
    response = await client.put(
        f"{BASE}/users/{super_admin_id}/status",
        json={"is_active": False},
        headers=auth(super_admin_token),
    )

    assert response.status_code == 403


@pytest.mark.asyncio
async def test_update_status_not_found(client: AsyncClient, super_admin_token: str):
    response = await client.put(
        f"{BASE}/users/{uuid4()}/status",
        json={"is_active": False},
        headers=auth(super_admin_token),
    )

    assert response.status_code == 404