"""
Task 1 — MLflow server + 4 experiments.

Uses a local SQLite artifact store so no Docker or AWS credentials are needed.
The wait_for_server() helper succeeds immediately against SQLite.
"""
import importlib
import mlflow
import pytest
from mlflow.tracking import MlflowClient


@pytest.fixture()
def local_tracking_uri(tmp_path, monkeypatch):
    uri = f"sqlite:///{tmp_path}/mlflow.db"
    monkeypatch.setenv("MLFLOW_TRACKING_URI", uri)
    monkeypatch.setenv("S3_BUCKET", "")  # No S3 for local test
    mlflow.set_tracking_uri(uri)
    return uri


def _load_setup(local_tracking_uri):
    """Reload the module so it picks up the patched env vars."""
    import scripts.setup_mlflow as setup
    importlib.reload(setup)
    return setup


def test_creates_all_four_experiments(local_tracking_uri):
    setup = _load_setup(local_tracking_uri)
    setup.main()

    client = MlflowClient()
    names = {e.name for e in client.search_experiments()}
    for crop in ["tomato", "potato", "corn", "grape"]:
        assert f"cropsight-{crop}" in names, f"Missing experiment cropsight-{crop}"


def test_setup_is_idempotent(local_tracking_uri):
    """Running setup twice must not raise or create duplicate experiments."""
    setup = _load_setup(local_tracking_uri)
    setup.main()
    setup.main()  # second call — must skip, not crash

    client = MlflowClient()
    all_names = [e.name for e in client.search_experiments() if e.name.startswith("cropsight-")]
    assert len(all_names) == 4, f"Expected 4, got {len(all_names)}: {all_names}"


def test_experiments_have_crop_tag(local_tracking_uri):
    setup = _load_setup(local_tracking_uri)
    setup.main()

    client = MlflowClient()
    for crop in ["tomato", "potato", "corn", "grape"]:
        exp = client.get_experiment_by_name(f"cropsight-{crop}")
        assert exp is not None
        assert exp.tags.get("crop") == crop
