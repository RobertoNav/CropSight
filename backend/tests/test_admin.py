from datetime import date, datetime, timezone
from types import SimpleNamespace
from uuid import uuid4

import httpx
import pytest

from app.models.retraining_job import RetrainingJob
from app.models.user import User
from app.routers.admin import metrics, retraining
from app.schemas.admin import TriggerRetrainingRequest
from app.services.github_service import GitHubService
from app.services.metrics_service import MetricsService


class FakeScalarResult:
    def __init__(self, value):
        self.value = value

    def scalar_one(self):
        return self.value


class FakeRowsResult:
    def __init__(self, rows):
        self.rows = rows

    def all(self):
        return self.rows


class FakeDb:
    def __init__(self, execute_results=None):
        self.execute_results = list(execute_results or [])
        self.added = []
        self.commits = 0
        self.flushes = 0
        self.refreshed = []

    def add(self, value):
        self.added.append(value)

    async def flush(self):
        self.flushes += 1
        for value in self.added:
            if getattr(value, "id", None) is None:
                value.id = uuid4()

    async def commit(self):
        self.commits += 1

    async def refresh(self, value):
        self.refreshed.append(value)

    async def execute(self, query):
        return self.execute_results.pop(0)


class FakeGitHubService:
    def __init__(self):
        pass

    async def trigger_workflow(self, notes=None):
        return "123456"

    async def get_run_status(self, run_id):
        return "success"


def test_extract_per_class_metrics_from_mlflow_metric_names():
    result = metrics._extract_per_class_metrics({
        "Tomato_Healthy_precision": 0.91,
        "Tomato_Healthy_recall": 0.92,
        "Tomato_Healthy_f1": 0.93,
        "Tomato_Healthy_support": 12,
        "Tomato_Blight_precision": 0.81,
        "Tomato_Blight_recall": 0.82,
        "Tomato_Blight_f1": 0.83,
        "Tomato_Blight_support": 8,
    })

    assert [item.label for item in result] == ["Tomato_Blight", "Tomato_Healthy"]
    assert result[0].precision == 0.81
    assert result[1].support == 12


def test_extract_reference_distribution_accepts_json_object():
    result = metrics._extract_reference_distribution({
        "reference_distribution": '{"Healthy": 0.75, "Blight": 0.25}'
    })

    assert result[0].label == "Healthy"
    assert result[0].proportion == 0.75
    assert result[1].label == "Blight"
    assert result[1].proportion == 0.25


def test_psi_is_zero_for_equal_distributions():
    distribution = [
        metrics.ClassDistribution(label="Healthy", proportion=0.7),
        metrics.ClassDistribution(label="Blight", proportion=0.3),
    ]

    assert metrics._psi(distribution, distribution) == 0.0


def test_metrics_cache_returns_value_until_expired(monkeypatch):
    monkeypatch.setattr(metrics, "METRICS_CACHE_TTL_SECONDS", 10)
    monkeypatch.setattr(metrics, "monotonic", lambda: 100.0)
    metrics._metrics_cache.clear()

    metrics._set_cached(("usage", None, None), {"total_predictions": 2})

    assert metrics._get_cached(("usage", None, None)) == {"total_predictions": 2}

    monkeypatch.setattr(metrics, "monotonic", lambda: 111.0)

    assert metrics._get_cached(("usage", None, None)) is None


def test_usage_metrics_to_csv():
    usage = metrics.UsageMetricsResponse(
        total_predictions=4,
        active_users=2,
        active_companies=1,
        feedback_rate=0.5,
        predictions_by_day=[
            metrics.PredictionsByDay(date=date(2026, 5, 1), count=4),
        ],
    )

    csv_content = metrics._usage_metrics_to_csv(usage)

    assert "metric,value" in csv_content
    assert "total_predictions,4" in csv_content
    assert "feedback_rate,0.5" in csv_content
    assert "date,predictions" in csv_content
    assert "2026-05-01,4" in csv_content


def test_github_service_maps_statuses():
    service = GitHubService()

    assert service._map_run_status("queued", None) == "pending"
    assert service._map_run_status("in_progress", None) == "running"
    assert service._map_run_status("completed", "success") == "success"
    assert service._map_run_status("completed", "failure") == "failed"


@pytest.mark.asyncio
async def test_trigger_retraining_creates_job(monkeypatch):
    monkeypatch.setattr(retraining, "GitHubService", FakeGitHubService)
    current_user = User(
        id=uuid4(),
        name="Admin User",
        email="admin@cropsight.io",
        password_hash="hash",
        role="super_admin",
        is_active=True,
    )
    db = FakeDb()

    response = await retraining.trigger_retraining(
        payload=TriggerRetrainingRequest(notes="nightly retrain"),
        current_user=current_user,
        db=db,
    )

    assert response.triggered_by == current_user.id
    assert response.triggered_by_name == "Admin User"
    assert response.status == "running"
    assert response.github_run_id == "123456"
    assert db.flushes == 1
    assert db.commits == 1


@pytest.mark.asyncio
async def test_trigger_retraining_marks_job_failed_on_github_error(monkeypatch):
    class FailingGitHubService:
        async def trigger_workflow(self, notes=None):
            raise httpx.RequestError("network error")

    monkeypatch.setattr(retraining, "GitHubService", FailingGitHubService)
    current_user = User(
        id=uuid4(),
        name="Admin User",
        email="admin@cropsight.io",
        password_hash="hash",
        role="super_admin",
        is_active=True,
    )
    db = FakeDb()

    with pytest.raises(retraining.CropSightException) as exc_info:
        await retraining.trigger_retraining(
            payload=TriggerRetrainingRequest(notes="nightly retrain"),
            current_user=current_user,
            db=db,
        )

    assert exc_info.value.code == "RETRAINING_TRIGGER_FAILED"
    assert db.added[0].status == "failed"
    assert db.added[0].finished_at is not None
    assert db.commits == 1


@pytest.mark.asyncio
async def test_refresh_active_jobs_updates_completed_job(monkeypatch):
    monkeypatch.setattr(retraining, "GitHubService", FakeGitHubService)
    job = RetrainingJob(
        id=uuid4(),
        triggered_by=uuid4(),
        status="running",
        github_run_id="123456",
        started_at=datetime.now(timezone.utc),
    )
    db = FakeDb()

    await retraining._refresh_active_jobs([job], db)

    assert job.status == "success"
    assert job.finished_at is not None
    assert db.commits == 1


@pytest.mark.asyncio
async def test_company_metrics_service_builds_response():
    db = FakeDb([
        FakeScalarResult(4),
        FakeScalarResult(3),
        FakeRowsResult([
            SimpleNamespace(prediction_date=date(2026, 5, 1), count=2),
            SimpleNamespace(prediction_date=date(2026, 5, 2), count=2),
        ]),
        FakeRowsResult([
            SimpleNamespace(label="Healthy", count=3),
            SimpleNamespace(label="Blight", count=1),
        ]),
    ])

    response = await MetricsService().get_company_metrics(
        db=db,
        company_id=uuid4(),
        from_date=date(2026, 5, 1),
        to_date=date(2026, 5, 2),
    )

    assert response.total_predictions == 4
    assert response.feedback_rate == 0.75
    assert len(response.predictions_by_day) == 2
    assert response.top_labels[0].label == "Healthy"
