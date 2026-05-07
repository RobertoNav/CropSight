"""
Task 4 — Full flow: photo → inference → prediction saved → feedback.

HTTP calls are mocked with unittest.mock so no running inference server
is needed. File I/O uses real paths anchored to _ML_ROOT (via e2e_flow.py).
"""
import json
import io
from pathlib import Path
from unittest.mock import MagicMock

import pytest
from PIL import Image


@pytest.fixture(autouse=True)
def redirect_output(tmp_path, monkeypatch):
    """Redirect prediction/feedback output to tmp_path so tests don't write to ml/data/."""
    import cropsight.CropSight.merged_ml.scripts.e2e_flow as flow
    monkeypatch.setattr(flow, "OUT_PREDICTIONS", tmp_path / "predictions")
    monkeypatch.setattr(flow, "OUT_FEEDBACK", tmp_path / "feedback")
    (tmp_path / "predictions").mkdir()
    (tmp_path / "feedback").mkdir()


# ── helpers ───────────────────────────────────────────────────────────────────

def _mock_client(predicted_class: str = "Tomato_Healthy", confidence: float = 0.92):
    """httpx.Client mock that returns a successful /predict response."""
    mock_resp = MagicMock()
    mock_resp.status_code = 200
    mock_resp.json.return_value = {
        "crop": "tomato",          # will be overridden per-crop in run_crop
        "predicted_class": predicted_class,
        "confidence": confidence,
        "model_version": "Production",
    }

    mock_client = MagicMock()
    mock_client.post.return_value = mock_resp
    return mock_client


# ── make_test_image ───────────────────────────────────────────────────────────

def test_make_test_image_is_224x224_jpeg():
    from cropsight.CropSight.merged_ml.scripts.e2e_flow import make_test_image
    data = make_test_image("tomato")
    img = Image.open(io.BytesIO(data))
    assert img.size == (224, 224)
    assert img.mode == "RGB"


@pytest.mark.parametrize("crop", ["tomato", "potato", "corn", "grape"])
def test_make_test_image_works_for_all_crops(crop):
    from cropsight.CropSight.merged_ml.scripts.e2e_flow import make_test_image
    data = make_test_image(crop)
    assert len(data) > 0
    img = Image.open(io.BytesIO(data))
    assert img.size == (224, 224)


# ── run_crop ──────────────────────────────────────────────────────────────────

def test_run_crop_creates_prediction_file():
    from cropsight.CropSight.merged_ml.scripts.e2e_flow import run_crop, OUT_PREDICTIONS
    client = _mock_client()

    run_crop(client, "tomato")

    pred_file = OUT_PREDICTIONS / "tomato.json"
    assert pred_file.exists(), f"Expected {pred_file} to exist"
    data = json.loads(pred_file.read_text())
    assert data["crop"] == "tomato"
    assert data["predicted_class"] == "Tomato_Healthy"
    assert 0.0 <= data["confidence"] <= 1.0


def test_run_crop_creates_feedback_file():
    from cropsight.CropSight.merged_ml.scripts.e2e_flow import run_crop, OUT_FEEDBACK
    client = _mock_client()

    run_crop(client, "tomato")

    fb_file = OUT_FEEDBACK / "tomato.json"
    assert fb_file.exists(), f"Expected {fb_file} to exist"
    data = json.loads(fb_file.read_text())
    assert data["prediction_id"].startswith("tomato-")
    assert "submitted_at" in data
    assert isinstance(data["is_correct"], bool)


def test_run_crop_embeds_feedback_in_prediction():
    from cropsight.CropSight.merged_ml.scripts.e2e_flow import run_crop, OUT_PREDICTIONS
    client = _mock_client()

    record = run_crop(client, "tomato")

    assert record["feedback"] is not None
    pred_file = OUT_PREDICTIONS / "tomato.json"
    saved = json.loads(pred_file.read_text())
    assert saved["feedback"] is not None


def test_run_crop_posts_to_correct_url(monkeypatch):
    from cropsight.CropSight.merged_ml.scripts.e2e_flow import run_crop, INFERENCE_URL
    client = _mock_client()

    run_crop(client, "potato")

    call_args = client.post.call_args
    assert call_args.args[0] == f"{INFERENCE_URL}/predict"
    assert call_args.kwargs["params"] == {"crop": "potato"}
    assert "file" in call_args.kwargs["files"]


def test_run_crop_raises_on_non_200():
    from cropsight.CropSight.merged_ml.scripts.e2e_flow import run_crop
    mock_resp = MagicMock()
    mock_resp.status_code = 503
    mock_resp.text = "Service Unavailable"
    client = MagicMock()
    client.post.return_value = mock_resp

    with pytest.raises(RuntimeError, match="Inference failed"):
        run_crop(client, "corn")


# ── all four crops ─────────────────────────────────────────────────────────────

@pytest.mark.parametrize("crop", ["tomato", "potato", "corn", "grape"])
def test_full_flow_for_every_crop(crop):
    from cropsight.CropSight.merged_ml.scripts.e2e_flow import run_crop, OUT_PREDICTIONS, OUT_FEEDBACK

    mock_resp = MagicMock()
    mock_resp.status_code = 200
    mock_resp.json.return_value = {
        "crop": crop,
        "predicted_class": f"{crop.capitalize()}_Healthy",
        "confidence": 0.88,
        "model_version": "Production",
    }
    client = MagicMock()
    client.post.return_value = mock_resp

    record = run_crop(client, crop)

    assert (OUT_PREDICTIONS / f"{crop}.json").exists()
    assert (OUT_FEEDBACK / f"{crop}.json").exists()
    assert record["feedback"] is not None
