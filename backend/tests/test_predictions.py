import pytest
from uuid import UUID, uuid4
from httpx import AsyncClient
from sqlalchemy import select

from tests.conftest import TestSessionLocal
from app.models.prediction import Prediction, PredictionFeedback

BASE = "/api/v1"


async def register(client: AsyncClient, email: str, password: str = "SecurePass123!", name: str = "Test User"):
    return await client.post(
        f"{BASE}/auth/register",
        json={"name": name, "email": email, "password": password},
    )


async def login(client: AsyncClient, email: str, password: str = "SecurePass123!") -> str:
    resp = await client.post(
        f"{BASE}/auth/login",
        json={"email": email, "password": password},
    )
    return resp.json()["access_token"]


def auth(token: str) -> dict:
    return {"Authorization": f"Bearer {token}"}


async def create_prediction_for_user(user_id: str, company_id=None) -> Prediction:
    async with TestSessionLocal() as db:
        prediction = Prediction(
            user_id=UUID(user_id),
            company_id=UUID(company_id) if company_id else None,
            image_url="https://example.com/test-image.jpg",
            label="Tomato_Early_Blight",
            confidence=0.94,
            class_probabilities={
                "Tomato_Early_Blight": 0.94,
                "Tomato_Healthy": 0.06,
            },
            model_version="3",
        )
        db.add(prediction)
        await db.commit()
        await db.refresh(prediction)
        return prediction


@pytest.mark.asyncio
async def test_create_feedback_success(client: AsyncClient):
    reg = await register(client, "feedback_success@example.com")
    user_id = reg.json()["user"]["id"]
    token = await login(client, "feedback_success@example.com")

    prediction = await create_prediction_for_user(user_id)

    response = await client.post(
        f"{BASE}/predictions/{prediction.id}/feedback",
        json={"is_correct": True},
        headers=auth(token),
    )

    assert response.status_code == 201
    data = response.json()
    assert data["prediction_id"] == str(prediction.id)
    assert data["is_correct"] is True
    assert data["correct_label"] is None


@pytest.mark.asyncio
async def test_create_feedback_requires_correct_label_when_incorrect(client: AsyncClient):
    reg = await register(client, "feedback_label_required@example.com")
    user_id = reg.json()["user"]["id"]
    token = await login(client, "feedback_label_required@example.com")

    prediction = await create_prediction_for_user(user_id)

    response = await client.post(
        f"{BASE}/predictions/{prediction.id}/feedback",
        json={"is_correct": False},
        headers=auth(token),
    )

    assert response.status_code == 400


@pytest.mark.asyncio
async def test_create_feedback_with_correct_label_when_incorrect(client: AsyncClient):
    reg = await register(client, "feedback_incorrect@example.com")
    user_id = reg.json()["user"]["id"]
    token = await login(client, "feedback_incorrect@example.com")

    prediction = await create_prediction_for_user(user_id)

    response = await client.post(
        f"{BASE}/predictions/{prediction.id}/feedback",
        json={"is_correct": False, "correct_label": "Tomato_Healthy"},
        headers=auth(token),
    )

    assert response.status_code == 201
    data = response.json()
    assert data["is_correct"] is False
    assert data["correct_label"] == "Tomato_Healthy"


@pytest.mark.asyncio
async def test_create_feedback_duplicate_returns_409(client: AsyncClient):
    reg = await register(client, "feedback_duplicate@example.com")
    user_id = reg.json()["user"]["id"]
    token = await login(client, "feedback_duplicate@example.com")

    prediction = await create_prediction_for_user(user_id)

    first = await client.post(
        f"{BASE}/predictions/{prediction.id}/feedback",
        json={"is_correct": True},
        headers=auth(token),
    )
    second = await client.post(
        f"{BASE}/predictions/{prediction.id}/feedback",
        json={"is_correct": True},
        headers=auth(token),
    )

    assert first.status_code == 201
    assert second.status_code == 409


@pytest.mark.asyncio
async def test_create_feedback_for_other_user_returns_403(client: AsyncClient):
    owner = await register(client, "feedback_owner@example.com")
    owner_id = owner.json()["user"]["id"]

    await register(client, "feedback_intruder@example.com")
    intruder_token = await login(client, "feedback_intruder@example.com")

    prediction = await create_prediction_for_user(owner_id)

    response = await client.post(
        f"{BASE}/predictions/{prediction.id}/feedback",
        json={"is_correct": True},
        headers=auth(intruder_token),
    )

    assert response.status_code == 403


@pytest.mark.asyncio
async def test_create_feedback_prediction_not_found_returns_404(client: AsyncClient):
    await register(client, "feedback_not_found@example.com")
    token = await login(client, "feedback_not_found@example.com")

    response = await client.post(
        f"{BASE}/predictions/{uuid4()}/feedback",
        json={"is_correct": True},
        headers=auth(token),
    )

    assert response.status_code == 404


@pytest.mark.asyncio
async def test_create_feedback_unauthenticated_returns_401(client: AsyncClient):
    response = await client.post(
        f"{BASE}/predictions/{uuid4()}/feedback",
        json={"is_correct": True},
    )

    assert response.status_code == 401