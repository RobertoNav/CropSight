"""
Task 2 — POST /predict loads model from MLflow Registry and returns a diagnosis.

MLflow is fully mocked so no server or trained models are needed.
A tiny 2-class linear model is injected for each crop.
"""
import io
from unittest.mock import MagicMock, patch

import pytest
import torch
import torch.nn as nn
from fastapi.testclient import TestClient
from PIL import Image


class _TinyModel(nn.Module):
    """2-output linear model — fast, CPU-only, no pretrained weights needed."""
    def __init__(self):
        super().__init__()
        self.fc = nn.Linear(3 * 224 * 224, 2)

    def forward(self, x):
        # Skip the linear to avoid huge alloc; just return fixed logits
        return torch.tensor([[2.0, 1.0]]).expand(x.shape[0], -1)


def _jpeg(color=(100, 150, 100)) -> bytes:
    img = Image.new("RGB", (224, 224), color=color)
    buf = io.BytesIO()
    img.save(buf, format="JPEG")
    return buf.getvalue()


@pytest.fixture()
def client():
    """
    TestClient whose startup event is intercepted: MLflow calls are mocked
    so every crop loads the TinyModel with 2 known class names.
    """
    fake_class_names = str(["Healthy", "Disease"])
    mock_version = MagicMock()
    mock_version.run_id = "fake-run"
    mock_run = MagicMock()
    mock_run.data.params = {"class_names": fake_class_names}

    with patch("mlflow.set_tracking_uri"), \
         patch("mlflow.pytorch.load_model", return_value=_TinyModel()), \
         patch("src.inference.main.MlflowClient") as MockClient:

        inst = MockClient.return_value
        inst.get_latest_versions.return_value = [mock_version]
        inst.get_run.return_value = mock_run

        from src.inference.main import app, MODELS, CLASS_NAMES
        with TestClient(app) as c:
            yield c

        MODELS.clear()
        CLASS_NAMES.clear()


# ── /health ───────────────────────────────────────────────────────────────────

def test_health_lists_all_loaded_crops(client):
    r = client.get("/health")
    assert r.status_code == 200
    loaded = r.json()["models_loaded"]
    assert set(loaded) == {"tomato", "potato", "corn", "grape"}


# ── /predict — happy path ─────────────────────────────────────────────────────

@pytest.mark.parametrize("crop", ["tomato", "potato", "corn", "grape"])
def test_predict_returns_valid_response(client, crop):
    r = client.post(
        "/predict",
        params={"crop": crop},
        files={"file": (f"{crop}.jpg", _jpeg(), "image/jpeg")},
    )
    assert r.status_code == 200
    body = r.json()
    assert body["crop"] == crop
    assert body["predicted_class"] in ["Healthy", "Disease"]
    assert 0.0 <= body["confidence"] <= 1.0
    assert body["model_version"] == "Production"


# ── /predict — error paths ────────────────────────────────────────────────────

def test_predict_unknown_crop_returns_400(client):
    r = client.post(
        "/predict",
        params={"crop": "banana"},
        files={"file": ("x.jpg", _jpeg(), "image/jpeg")},
    )
    assert r.status_code == 400


def test_predict_model_not_loaded_returns_503(client):
    from src.inference.main import MODELS
    tomato_model = MODELS.pop("tomato")          # simulate failed load
    try:
        r = client.post(
            "/predict",
            params={"crop": "tomato"},
            files={"file": ("x.jpg", _jpeg(), "image/jpeg")},
        )
        assert r.status_code == 503
    finally:
        MODELS["tomato"] = tomato_model          # restore so other tests pass


# ── class names loaded from MLflow params ─────────────────────────────────────

def test_class_names_populated_from_mlflow_params(client):
    from src.inference.main import CLASS_NAMES
    for crop in ["tomato", "potato", "corn", "grape"]:
        assert CLASS_NAMES.get(crop) == ["Healthy", "Disease"], \
            f"CLASS_NAMES not populated for {crop}"
