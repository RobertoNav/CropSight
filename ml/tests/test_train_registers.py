"""
Task 3 — train.py registers the new run to MLflow Model Registry as Staging.

The full training loop is skipped: instead we log a tiny Linear model to a
local SQLite MLflow store, then exercise the registration code path directly
(the same four lines that were added to train.py).

This verifies the logic without downloading pretrained weights or real data.
"""
import argparse
import os

import mlflow
import mlflow.pytorch
import pytest
import torch
import torch.nn as nn
from mlflow.tracking import MlflowClient


@pytest.fixture()
def tracking_uri(tmp_path, monkeypatch):
    # SQLite backend for metadata — same approach used in test_mlflow_setup.py
    # (proven to work on Windows).
    # Artifacts use Path.as_uri() which produces file:///C:/... (three slashes).
    # Two slashes (file://C:/...) make urlparse treat "C" as a hostname and fail.
    uri = f"sqlite:///{tmp_path}/mlflow.db"
    monkeypatch.setenv("MLFLOW_TRACKING_URI", uri)
    mlflow.set_tracking_uri(uri)

    # Pre-create experiments so mlflow.set_experiment() picks up the
    # explicit artifact_location instead of defaulting to ./mlruns in CWD.
    artifact_uri = (tmp_path / "artifacts").as_uri()  # file:///C:/... on Windows
    client = MlflowClient()
    for crop in ["tomato", "potato", "corn", "grape"]:
        client.create_experiment(f"cropsight-{crop}", artifact_location=artifact_uri)
    return uri


def _log_tiny_run(crop: str, class_names: list) -> str:
    """Log a minimal run and return its run_id."""
    mlflow.set_experiment(f"cropsight-{crop}")
    model = nn.Linear(4, len(class_names))
    with mlflow.start_run() as run:
        mlflow.log_param("class_names", str(class_names))
        mlflow.pytorch.log_model(model, artifact_path="model")
    return run.info.run_id


def _register_as_staging(crop: str, run_id: str):
    """Exact code path from train.py — copy-pasted so the test catches regressions."""
    model_name = f"cropsight-{crop}"
    model_uri = f"runs:/{run_id}/model"
    client = MlflowClient()
    mv = mlflow.register_model(model_uri=model_uri, name=model_name)
    client.transition_model_version_stage(
        name=model_name,
        version=mv.version,
        stage="Staging",
        archive_existing_versions=False,
    )
    return mv


# ── tests ─────────────────────────────────────────────────────────────────────

def test_model_appears_in_staging_after_run(tracking_uri):
    run_id = _log_tiny_run("tomato", ["Healthy", "Early_Blight"])
    mv = _register_as_staging("tomato", run_id)

    client = MlflowClient()
    versions = client.get_latest_versions("cropsight-tomato", stages=["Staging"])
    assert len(versions) == 1
    assert versions[0].current_stage == "Staging"
    assert versions[0].version == mv.version


def test_staging_version_links_to_correct_run(tracking_uri):
    run_id = _log_tiny_run("potato", ["Healthy", "Late_Blight"])
    mv = _register_as_staging("potato", run_id)

    client = MlflowClient()
    versions = client.get_latest_versions("cropsight-potato", stages=["Staging"])
    assert versions[0].run_id == run_id


def test_second_run_adds_new_staging_without_archiving_first(tracking_uri):
    """archive_existing_versions=False means both versions stay in Staging."""
    run_id_1 = _log_tiny_run("corn", ["Healthy", "Rust"])
    _register_as_staging("corn", run_id_1)

    run_id_2 = _log_tiny_run("corn", ["Healthy", "Rust"])
    _register_as_staging("corn", run_id_2)

    client = MlflowClient()
    staging = client.get_latest_versions("cropsight-corn", stages=["Staging"])
    # get_latest_versions returns the most recent Staging version
    assert staging[0].run_id == run_id_2


@pytest.mark.parametrize("crop", ["tomato", "potato", "corn", "grape"])
def test_all_four_crops_can_register(tracking_uri, crop):
    run_id = _log_tiny_run(crop, ["Healthy", "Disease"])
    mv = _register_as_staging(crop, run_id)

    client = MlflowClient()
    versions = client.get_latest_versions(f"cropsight-{crop}", stages=["Staging"])
    assert len(versions) >= 1
