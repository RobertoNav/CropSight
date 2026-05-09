import pytest
from httpx import AsyncClient
from sqlalchemy import select
from uuid import UUID

from app.models.user import User
from tests.conftest import TestSessionLocal

BASE = "/api/v1"


async def register(
    client: AsyncClient,
    email: str,
    password: str = "SecurePass123!",
    name: str = "Test User",
):
    return await client.post(
        f"{BASE}/auth/register",
        json={"name": name, "email": email, "password": password},
    )


async def login(
    client: AsyncClient,
    email: str,
    password: str = "SecurePass123!",
) -> str:
    response = await client.post(
        f"{BASE}/auth/login",
        json={"email": email, "password": password},
    )
    return response.json()["access_token"]


def auth(token: str) -> dict:
    return {"Authorization": f"Bearer {token}"}


async def create_company_as_user(
    client: AsyncClient,
    email: str,
    company_name: str,
    sector: str = "Agriculture",
) -> tuple[str, dict]:
    await register(client, email)
    token = await login(client, email)
    response = await client.post(
        f"{BASE}/companies",
        json={"name": company_name, "sector": sector},
        headers=auth(token),
    )
    assert response.status_code == 201
    return token, response.json()


@pytest.mark.asyncio
async def test_user_creates_company(client: AsyncClient):
    await register(client, "company_create@example.com")
    token = await login(client, "company_create@example.com")

    response = await client.post(
        f"{BASE}/companies",
        json={"name": "Agro Create SA", "sector": "Agriculture"},
        headers=auth(token),
    )

    assert response.status_code == 201
    data = response.json()
    assert data["name"] == "Agro Create SA"
    assert data["sector"] == "Agriculture"
    assert data["status"] == "active"


@pytest.mark.asyncio
async def test_create_company_promotes_user_to_company_admin(client: AsyncClient):
    await register(client, "company_promote@example.com")
    token = await login(client, "company_promote@example.com")

    response = await client.post(
        f"{BASE}/companies",
        json={"name": "Agro Promote SA", "sector": "Agriculture"},
        headers=auth(token),
    )

    assert response.status_code == 201
    company_id = response.json()["id"]

    me = await client.get(f"{BASE}/users/me", headers=auth(token))
    assert me.status_code == 200
    assert me.json()["company_id"] == company_id
    assert me.json()["role"] == "company_admin"


@pytest.mark.asyncio
async def test_user_with_company_cannot_create_another(client: AsyncClient):
    token, _ = await create_company_as_user(
        client,
        "company_duplicate_owner@example.com",
        "Agro First SA",
    )

    response = await client.post(
        f"{BASE}/companies",
        json={"name": "Agro Second SA", "sector": "Agriculture"},
        headers=auth(token),
    )

    assert response.status_code == 409


@pytest.mark.asyncio
async def test_company_admin_gets_own_company(client: AsyncClient):
    token, company = await create_company_as_user(
        client,
        "company_get_own@example.com",
        "Agro Own SA",
    )

    response = await client.get(
        f"{BASE}/companies/{company['id']}",
        headers=auth(token),
    )

    assert response.status_code == 200
    assert response.json()["id"] == company["id"]


@pytest.mark.asyncio
async def test_company_admin_cannot_get_other_company(client: AsyncClient):
    token, _ = await create_company_as_user(
        client,
        "company_get_admin@example.com",
        "Agro Admin SA",
    )
    _, other_company = await create_company_as_user(
        client,
        "company_get_other@example.com",
        "Agro Other SA",
    )

    response = await client.get(
        f"{BASE}/companies/{other_company['id']}",
        headers=auth(token),
    )

    assert response.status_code == 403


@pytest.mark.asyncio
async def test_company_admin_updates_own_company(client: AsyncClient):
    token, company = await create_company_as_user(
        client,
        "company_update@example.com",
        "Agro Update SA",
    )

    response = await client.put(
        f"{BASE}/companies/{company['id']}",
        json={"name": "Agro Updated SA", "logo_url": "https://example.com/logo.png"},
        headers=auth(token),
    )

    assert response.status_code == 200
    assert response.json()["name"] == "Agro Updated SA"
    assert response.json()["logo_url"] == "https://example.com/logo.png"


@pytest.mark.asyncio
async def test_super_admin_lists_companies(client: AsyncClient, super_admin_token: str):
    await create_company_as_user(
        client,
        "company_list_seed@example.com",
        "Agro List SA",
    )

    response = await client.get(
        f"{BASE}/companies?page=1&limit=20",
        headers=auth(super_admin_token),
    )

    assert response.status_code == 200
    data = response.json()
    assert "data" in data
    assert "meta" in data
    assert data["meta"]["page"] == 1
    assert data["meta"]["limit"] == 20


@pytest.mark.asyncio
async def test_normal_user_cannot_list_companies(client: AsyncClient):
    await register(client, "company_list_forbidden@example.com")
    token = await login(client, "company_list_forbidden@example.com")

    response = await client.get(f"{BASE}/companies", headers=auth(token))

    assert response.status_code == 403


@pytest.mark.asyncio
async def test_super_admin_updates_company_status(client: AsyncClient, super_admin_token: str):
    _, company = await create_company_as_user(
        client,
        "company_status@example.com",
        "Agro Status SA",
    )

    response = await client.put(
        f"{BASE}/companies/{company['id']}/status",
        json={"status": "suspended"},
        headers=auth(super_admin_token),
    )

    assert response.status_code == 200
    assert response.json()["status"] == "suspended"


@pytest.mark.asyncio
async def test_company_admin_lists_users_of_own_company(client: AsyncClient):
    admin_token, company = await create_company_as_user(
        client,
        "company_users_admin@example.com",
        "Agro Users SA",
    )

    response = await client.get(
        f"{BASE}/companies/{company['id']}/users",
        headers=auth(admin_token),
    )

    assert response.status_code == 200
    assert any(user["email"] == "company_users_admin@example.com" for user in response.json())


@pytest.mark.asyncio
async def test_company_admin_cannot_list_users_of_other_company(client: AsyncClient):
    admin_token, _ = await create_company_as_user(
        client,
        "company_users_admin_forbidden@example.com",
        "Agro Users Admin SA",
    )
    _, other_company = await create_company_as_user(
        client,
        "company_users_other@example.com",
        "Agro Users Other SA",
    )

    response = await client.get(
        f"{BASE}/companies/{other_company['id']}/users",
        headers=auth(admin_token),
    )

    assert response.status_code == 403


@pytest.mark.asyncio
async def test_company_admin_removes_user(client: AsyncClient):
    admin_token, company = await create_company_as_user(
        client,
        "company_remove_admin@example.com",
        "Agro Remove SA",
    )
    await register(client, "company_remove_user@example.com")

    async with TestSessionLocal() as db:
        result = await db.execute(
            select(User).where(User.email == "company_remove_user@example.com")
        )
        user = result.scalar_one()
        user.company_id = UUID(company["id"])
        user.role = "company_admin"
        await db.commit()
        user_id = str(user.id)

    response = await client.delete(
        f"{BASE}/companies/{company['id']}/users/{user_id}",
        headers=auth(admin_token),
    )

    assert response.status_code == 204

    async with TestSessionLocal() as db:
        result = await db.execute(select(User).where(User.id == UUID(user_id)))
        removed_user = result.scalar_one()
        assert removed_user.company_id is None
        assert removed_user.role == "user"


@pytest.mark.asyncio
async def test_company_admin_cannot_remove_self_returns_400(client: AsyncClient):
    admin_token, company = await create_company_as_user(
        client,
        "company_remove_self@example.com",
        "Agro Remove Self SA",
    )
    me = await client.get(f"{BASE}/users/me", headers=auth(admin_token))
    user_id = me.json()["id"]

    response = await client.delete(
        f"{BASE}/companies/{company['id']}/users/{user_id}",
        headers=auth(admin_token),
    )

    assert response.status_code == 400


@pytest.mark.asyncio
async def test_search_companies_requires_minimum_two_characters(client: AsyncClient):
    await register(client, "company_search_min@example.com")
    token = await login(client, "company_search_min@example.com")

    response = await client.get(f"{BASE}/companies/search?name=A", headers=auth(token))

    assert response.status_code == 422


@pytest.mark.asyncio
async def test_search_companies_returns_logo_url(client: AsyncClient):
    admin_token, company = await create_company_as_user(
        client,
        "company_search_logo_admin@example.com",
        "Agro Search Logo SA",
    )
    await client.put(
        f"{BASE}/companies/{company['id']}",
        json={"logo_url": "https://example.com/search-logo.png"},
        headers=auth(admin_token),
    )
    await register(client, "company_search_logo_user@example.com")
    user_token = await login(client, "company_search_logo_user@example.com")

    response = await client.get(
        f"{BASE}/companies/search?name=Search",
        headers=auth(user_token),
    )

    assert response.status_code == 200
    assert any(item["logo_url"] == "https://example.com/search-logo.png" for item in response.json())