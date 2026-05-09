import pytest
from httpx import AsyncClient
from sqlalchemy import select
from uuid import UUID

from app.models.join_request import JoinRequest
from app.models.user import User
from tests.conftest import TestSessionLocal

BASE = "/api/v1"


async def register(client: AsyncClient, email: str, name: str = "Test User"):
    return await client.post(
        f"{BASE}/auth/register",
        json={"name": name, "email": email, "password": "SecurePass123!"},
    )


async def login(client: AsyncClient, email: str) -> str:
    response = await client.post(
        f"{BASE}/auth/login",
        json={"email": email, "password": "SecurePass123!"},
    )
    return response.json()["access_token"]


def auth(token: str) -> dict:
    return {"Authorization": f"Bearer {token}"}


async def create_company_as_user(
    client: AsyncClient,
    email: str,
    company_name: str,
) -> tuple[str, dict]:
    await register(client, email)
    token = await login(client, email)
    response = await client.post(
        f"{BASE}/companies",
        json={"name": company_name, "sector": "Agriculture"},
        headers=auth(token),
    )
    assert response.status_code == 201
    return token, response.json()


async def register_and_login(client: AsyncClient, email: str) -> str:
    await register(client, email)
    return await login(client, email)


async def create_join_request(
    client: AsyncClient,
    user_email: str,
    company_id: str,
) -> tuple[str, dict]:
    token = await register_and_login(client, user_email)
    response = await client.post(
        f"{BASE}/companies/join",
        json={"company_id": company_id},
        headers=auth(token),
    )
    assert response.status_code == 201
    return token, response.json()


@pytest.mark.asyncio
async def test_user_creates_valid_join_request(client: AsyncClient):
    _, company = await create_company_as_user(
        client, "jr_company_admin@example.com", "JR Company SA"
    )
    user_token = await register_and_login(client, "jr_user@example.com")

    response = await client.post(
        f"{BASE}/companies/join",
        json={"company_id": company["id"]},
        headers=auth(user_token),
    )

    assert response.status_code == 201
    data = response.json()
    assert data["company_id"] == company["id"]
    assert data["status"] == "pending"
    assert data["user_email"] == "jr_user@example.com"


@pytest.mark.asyncio
async def test_user_cannot_create_duplicate_pending_request(client: AsyncClient):
    _, company = await create_company_as_user(
        client, "jr_duplicate_admin@example.com", "JR Duplicate SA"
    )
    user_token = await register_and_login(client, "jr_duplicate_user@example.com")

    first = await client.post(
        f"{BASE}/companies/join",
        json={"company_id": company["id"]},
        headers=auth(user_token),
    )
    assert first.status_code == 201

    second = await client.post(
        f"{BASE}/companies/join",
        json={"company_id": company["id"]},
        headers=auth(user_token),
    )

    assert second.status_code == 409


@pytest.mark.asyncio
async def test_user_with_company_cannot_request_join(client: AsyncClient):
    admin_token, company = await create_company_as_user(
        client, "jr_with_company@example.com", "JR With Company SA"
    )

    response = await client.post(
        f"{BASE}/companies/join",
        json={"company_id": company["id"]},
        headers=auth(admin_token),
    )

    assert response.status_code == 403


@pytest.mark.asyncio
async def test_normal_user_cannot_list_join_requests(client: AsyncClient):
    _, company = await create_company_as_user(
        client, "jr_list_forbidden_admin@example.com", "JR List Forbidden SA"
    )
    user_token = await register_and_login(client, "jr_list_forbidden_user@example.com")

    response = await client.get(
        f"{BASE}/companies/{company['id']}/requests",
        headers=auth(user_token),
    )

    assert response.status_code == 403


@pytest.mark.asyncio
async def test_company_admin_lists_requests_for_own_company(client: AsyncClient):
    admin_token, company = await create_company_as_user(
        client, "jr_list_admin@example.com", "JR List SA"
    )
    await create_join_request(client, "jr_list_user@example.com", company["id"])

    response = await client.get(
        f"{BASE}/companies/{company['id']}/requests",
        headers=auth(admin_token),
    )

    assert response.status_code == 200
    assert any(item["user_email"] == "jr_list_user@example.com" for item in response.json())


@pytest.mark.asyncio
async def test_company_admin_cannot_list_requests_for_other_company(client: AsyncClient):
    admin_token, _ = await create_company_as_user(
        client, "jr_other_admin@example.com", "JR Other Admin SA"
    )
    _, other_company = await create_company_as_user(
        client, "jr_other_company_admin@example.com", "JR Other Company SA"
    )

    response = await client.get(
        f"{BASE}/companies/{other_company['id']}/requests",
        headers=auth(admin_token),
    )

    assert response.status_code == 403


@pytest.mark.asyncio
async def test_company_admin_approves_request(client: AsyncClient):
    admin_token, company = await create_company_as_user(
        client, "jr_approve_admin@example.com", "JR Approve SA"
    )
    _, join_request = await create_join_request(
        client, "jr_approve_user@example.com", company["id"]
    )

    response = await client.put(
        f"{BASE}/companies/{company['id']}/requests/{join_request['id']}",
        json={"action": "approve"},
        headers=auth(admin_token),
    )

    assert response.status_code == 200
    assert response.json()["status"] == "approved"
    assert response.json()["resolved_at"] is not None


@pytest.mark.asyncio
async def test_approve_request_updates_user_company_id(client: AsyncClient):
    admin_token, company = await create_company_as_user(
        client, "jr_approve_company_admin@example.com", "JR Approve Company SA"
    )
    _, join_request = await create_join_request(
        client, "jr_approve_company_user@example.com", company["id"]
    )

    response = await client.put(
        f"{BASE}/companies/{company['id']}/requests/{join_request['id']}",
        json={"action": "approve"},
        headers=auth(admin_token),
    )
    assert response.status_code == 200

    async with TestSessionLocal() as db:
        result = await db.execute(
            select(User).where(User.email == "jr_approve_company_user@example.com")
        )
        user = result.scalar_one()
        assert str(user.company_id) == company["id"]


@pytest.mark.asyncio
async def test_company_admin_rejects_request(client: AsyncClient):
    admin_token, company = await create_company_as_user(
        client, "jr_reject_admin@example.com", "JR Reject SA"
    )
    _, join_request = await create_join_request(
        client, "jr_reject_user@example.com", company["id"]
    )

    response = await client.put(
        f"{BASE}/companies/{company['id']}/requests/{join_request['id']}",
        json={"action": "reject"},
        headers=auth(admin_token),
    )

    assert response.status_code == 200
    assert response.json()["status"] == "rejected"
    assert response.json()["resolved_at"] is not None


@pytest.mark.asyncio
async def test_resolving_processed_request_returns_409(client: AsyncClient):
    admin_token, company = await create_company_as_user(
        client, "jr_processed_admin@example.com", "JR Processed SA"
    )
    _, join_request = await create_join_request(
        client, "jr_processed_user@example.com", company["id"]
    )

    first = await client.put(
        f"{BASE}/companies/{company['id']}/requests/{join_request['id']}",
        json={"action": "reject"},
        headers=auth(admin_token),
    )
    assert first.status_code == 200

    second = await client.put(
        f"{BASE}/companies/{company['id']}/requests/{join_request['id']}",
        json={"action": "approve"},
        headers=auth(admin_token),
    )

    assert second.status_code == 409


@pytest.mark.asyncio
async def test_super_admin_can_list_join_requests_for_any_company(
    client: AsyncClient,
    super_admin_token: str,
):
    _, company = await create_company_as_user(
        client, "jr_super_admin_company@example.com", "JR Super Admin SA"
    )
    await create_join_request(client, "jr_super_admin_user@example.com", company["id"])

    response = await client.get(
        f"{BASE}/companies/{company['id']}/requests",
        headers=auth(super_admin_token),
    )

    assert response.status_code == 200
    assert any(item["user_email"] == "jr_super_admin_user@example.com" for item in response.json())


@pytest.mark.asyncio
async def test_list_requests_can_filter_by_status(client: AsyncClient):
    admin_token, company = await create_company_as_user(
        client, "jr_filter_admin@example.com", "JR Filter SA"
    )
    _, rejected_request = await create_join_request(
        client, "jr_filter_rejected@example.com", company["id"]
    )
    await create_join_request(client, "jr_filter_pending@example.com", company["id"])

    rejected = await client.put(
        f"{BASE}/companies/{company['id']}/requests/{rejected_request['id']}",
        json={"action": "reject"},
        headers=auth(admin_token),
    )
    assert rejected.status_code == 200

    response = await client.get(
        f"{BASE}/companies/{company['id']}/requests?status=pending",
        headers=auth(admin_token),
    )

    assert response.status_code == 200
    assert response.json()
    assert all(item["status"] == "pending" for item in response.json())


@pytest.mark.asyncio
async def test_join_request_rows_are_created_in_database(client: AsyncClient):
    _, company = await create_company_as_user(client, "jr_db_admin@example.com", "JR DB SA")
    _, join_request = await create_join_request(client, "jr_db_user@example.com", company["id"])

    async with TestSessionLocal() as db:
        result = await db.execute(
            select(JoinRequest).where(JoinRequest.id == UUID(join_request["id"]))
        )
        assert result.scalar_one_or_none() is not None